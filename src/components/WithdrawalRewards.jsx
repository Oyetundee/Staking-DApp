import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI } from '../contracts';
import { formatTokenAmount, parseTokenAmount, handleTransactionError, canUnstake, calculateTimeUntilUnlock } from '../utils';

export default function WithdrawalRewards() {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [localPendingRewards, setLocalPendingRewards] = useState(null); // Local state to override pending rewards
  const [isClaimProcessing, setIsClaimProcessing] = useState(false); // Track if we're in claim process

  const { address } = useAccount();

  // Read user's stake info - using actual contract function
  const { data: userDetails, refetch: refetchStake, isLoading: isStakeLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getUserDetails', // Your actual contract function
    args: [address],
    query: {
      enabled: !!address,
      refetchInterval: false, // Disable automatic refresh completely
      cacheTime: 0, // Show fresh data immediately without animation
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  });

  // Read pending rewards - using actual contract function
  const { data: contractPendingRewards, refetch: refetchRewards, isLoading: isRewardsLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getPendingRewards', // Your actual contract function
    args: [address],
    query: {
      enabled: !!address,
      refetchInterval: false, // Disable automatic refresh completely
      cacheTime: 0, // Don't cache to show fresh data immediately
      staleTime: 0, // Consider data immediately stale
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  });
  
  // Use local override if available, or 0 if claiming, otherwise use contract data
  const pendingRewards = isClaimProcessing ? 0n : (localPendingRewards !== null ? localPendingRewards : contractPendingRewards);

  // Removed automatic refresh - now completely manual only

  // Contract write hooks
  const { data: withdrawHash, writeContract: withdrawTokens, isPending: isWithdrawPending } = useWriteContract();
  const { data: claimHash, writeContract: claimRewards, isPending: isClaimPending } = useWriteContract();
  const { data: emergencyHash, writeContract: emergencyWithdraw, isPending: isEmergencyPending } = useWriteContract();

  // Transaction receipt hooks
  const { isSuccess: isWithdrawSuccess, isError: isWithdrawError, error: withdrawError } = useWaitForTransactionReceipt({ hash: withdrawHash });
  const { isSuccess: isClaimSuccess, isError: isClaimError, error: claimError } = useWaitForTransactionReceipt({ hash: claimHash });
  const { isSuccess: isEmergencySuccess, isError: isEmergencyError, error: emergencyError } = useWaitForTransactionReceipt({ hash: emergencyHash });

  // Handle withdraw success
  React.useEffect(() => {
    if (isWithdrawSuccess && withdrawHash) {
      setSuccess(`Successfully withdrawn ${withdrawAmount} tokens!`);
      setWithdrawAmount('');
      setIsLoading(false);
      setError('');
      refetchStake();
      refetchRewards();
    }
  }, [isWithdrawSuccess, withdrawHash, withdrawAmount, refetchStake, refetchRewards]);

  // Handle claim success
  React.useEffect(() => {
    if (isClaimSuccess && claimHash) {
      setSuccess('Successfully claimed rewards!');
      setError('');
      
      // Keep showing 0 and refresh contract data
      refetchRewards();
      refetchStake(); // Also refetch stake to update any changes
      
      // Clear processing state after contract refresh to show final data
      setTimeout(() => {
        setIsClaimProcessing(false);
        setLocalPendingRewards(null);
      }, 1000);
    }
  }, [isClaimSuccess, claimHash, refetchRewards, refetchStake]);

  // Handle emergency success
  React.useEffect(() => {
    if (isEmergencySuccess && emergencyHash) {
      setSuccess('Emergency withdrawal completed!');
      setIsLoading(false);
      setError('');
      refetchStake();
      refetchRewards();
    }
  }, [isEmergencySuccess, emergencyHash, refetchStake, refetchRewards]);

  // Handle errors
  React.useEffect(() => {
    if (isWithdrawError && withdrawError) {
      setError(handleTransactionError(withdrawError));
      setIsLoading(false);
    }
  }, [isWithdrawError, withdrawError]);

  React.useEffect(() => {
    if (isClaimError && claimError) {
      setError(handleTransactionError(claimError));
      // Reset all claim states on error
      setIsClaimProcessing(false);
      setLocalPendingRewards(null);
    }
  }, [isClaimError, claimError]);

  React.useEffect(() => {
    if (isEmergencyError && emergencyError) {
      setError(handleTransactionError(emergencyError));
      setIsLoading(false);
    }
  }, [isEmergencyError, emergencyError]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!userDetails || userDetails.stakedAmount === 0n) {
      setError('No tokens staked');
      return;
    }

    const parsedAmount = parseTokenAmount(withdrawAmount);
    if (parsedAmount > userDetails.stakedAmount) {
      setError('Withdrawal amount exceeds staked amount');
      return;
    }

    // Check if tokens are still locked using actual contract data
    const currentTime = Math.floor(Date.now() / 1000);
    const unlockTime = Number(userDetails.unlockTime);
    
    console.log('Withdrawal Check:', {
      currentTime,
      unlockTime,
      isLocked: unlockTime > currentTime,
      stakedAmount: userDetails.stakedAmount.toString(),
      withdrawAmount: parsedAmount.toString()
    });
    
    if (unlockTime > currentTime) {
      const timeLeft = unlockTime - currentTime;
      const hours = Math.floor(timeLeft / 3600);
      const minutes = Math.floor((timeLeft % 3600) / 60);
      setError(`Tokens are still locked. Unlock in ${hours}h ${minutes}m. Use emergency withdrawal to bypass lock (50% penalty).`);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      console.log('Attempting withdrawal:', {
        contract: STAKING_CONTRACT_ADDRESS,
        amount: parsedAmount.toString(),
        userStaked: userDetails.stakedAmount.toString(),
        unlocked: unlockTime <= currentTime
      });

      withdrawTokens({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'withdraw',
        args: [parsedAmount],
      });
    } catch (error) {
      console.error('Withdrawal error:', error);
      setError(handleTransactionError(error));
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!pendingRewards || pendingRewards === 0n) {
      setError('No rewards to claim');
      return;
    }

    try {
      // Don't set general isLoading for claims to avoid button interference
      setError('');
      setSuccess('');
      
      // Immediately start claim processing state to show 0
      setIsClaimProcessing(true);
      setLocalPendingRewards(0n);

      claimRewards({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'claimRewards',
      });
    } catch (error) {
      setError(handleTransactionError(error));
      // Reset states on error
      setIsClaimProcessing(false);
      setLocalPendingRewards(null);
    }
  };

  const handleEmergencyWithdraw = async () => {
    if (!userDetails || userDetails.stakedAmount === 0n) {
      setError('No tokens staked');
      return;
    }

    const stakedAmountFormatted = formatTokenAmount(userDetails.stakedAmount);
    const penaltyAmount = formatTokenAmount(userDetails.stakedAmount / 2n); // 50% penalty
    const receivedAmount = formatTokenAmount(userDetails.stakedAmount / 2n); // 50% received
    
    const confirmMessage = `EMERGENCY WITHDRAWAL WARNING\n\n` +
      `Staked Amount: ${stakedAmountFormatted} tokens\n` +
      `Penalty (50%): ${penaltyAmount} tokens\n` +
      `You will receive: ${receivedAmount} tokens\n\n` +
      `This action cannot be undone. Continue?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      emergencyWithdraw({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'emergencyWithdraw',
      });
    } catch (error) {
      setError(handleTransactionError(error));
      setIsLoading(false);
    }
  };

  const setMaxWithdraw = () => {
    if (userDetails && userDetails.stakedAmount > 0n) {
      // Set max to 500 tokens or user's staked amount, whichever is smaller
      const maxAmount = parseTokenAmount('500');
      const userStaked = userDetails.stakedAmount;
      const withdrawAmount = userStaked < maxAmount ? userStaked : maxAmount;
      setWithdrawAmount(formatTokenAmount(withdrawAmount));
    }
  };

  const isWithdrawLoading = isWithdrawSuccess || (withdrawHash && !isWithdrawSuccess && !isWithdrawError);
  const isClaimLoading = isClaimSuccess || (claimHash && !isClaimSuccess && !isClaimError);
  const isEmergencyLoading = isEmergencySuccess || (emergencyHash && !isEmergencySuccess && !isEmergencyError);
  
  const isButtonLoading = isLoading || isWithdrawPending || isClaimPending || isEmergencyPending || isWithdrawLoading || isClaimLoading || isEmergencyLoading;
  
  // Extract data from userDetails struct
  const stakedAmount = userDetails?.stakedAmount || 0n;
  const currentTime = Math.floor(Date.now() / 1000);
  const isUnlocked = userDetails ? userDetails.unlockTime <= currentTime : false;
  
  const getUnlockTimeDisplay = () => {
    if (!userDetails || isUnlocked) return 'Available now';
    const timeLeft = Number(userDetails.unlockTime) - currentTime;
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    return `${hours}h ${minutes}m remaining`;
  };
  
  const unlockTime = getUnlockTimeDisplay();

  return (
    <div className="space-y-6">
      {/* Current Stake Info */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stake Position</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Staked Amount</p>
            <div className="flex items-center justify-center space-x-2">
              <p className="text-2xl font-bold text-blue-600">
                {isStakeLoading ? (
                  <span className="text-sm">Loading...</span>
                ) : (
                  formatTokenAmount(stakedAmount).substring(0, 10)
                )}
              </p>
              <button
                onClick={() => refetchStake()}
                className="text-blue-600 hover:text-blue-700 p-1"
                title="Refresh stake info"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg relative">
            <p className="text-sm text-gray-600">Pending Rewards</p>
            <div className="flex items-center justify-center space-x-2">
              <p className="text-2xl font-bold text-green-600">
                {isRewardsLoading ? (
                  <span className="text-sm">Loading...</span>
                ) : pendingRewards ? (
                  formatTokenAmount(pendingRewards).substring(0, 10)
                ) : (
                  '0.00'
                )}
              </p>
              <button
                onClick={() => refetchRewards()}
                className="text-green-600 hover:text-green-700 p-1"
                title="Refresh rewards"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isClaimProcessing ? (
                <span className="text-green-600 font-semibold">Claimed - Processing...</span>
              ) : (
                `Raw: ${pendingRewards ? pendingRewards.toString() : 'None'}`
              )}
            </p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600">Unlock Status</p>
            <p className={`text-lg font-semibold ${isUnlocked ? 'text-green-600' : 'text-yellow-600'}`}>
              {isUnlocked ? 'Unlocked' : `Locked - ${unlockTime}`}
            </p>
            {!isUnlocked && (
              <p className="text-xs text-yellow-700 mt-1">
                Use Emergency Withdrawal for immediate access (50% penalty)
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdraw Tokens */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Withdraw Tokens</h3>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="withdraw-amount" className="block text-sm font-medium text-gray-700">
                  Amount to Withdraw
                </label>
                {stakedAmount > 0n && (
                  <button
                    type="button"
                    onClick={setMaxWithdraw}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Max: 500
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  id="withdraw-amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="100"
                  step="0.000000000000000001"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  disabled={isButtonLoading || !isUnlocked}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">TOKENS</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isButtonLoading || !address || !isUnlocked || stakedAmount === 0n}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWithdrawLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Withdrawing...
                </div>
              ) : (
                'Withdraw Tokens'
              )}
            </button>

            {!isUnlocked && stakedAmount > 0n && (
              <p className="text-yellow-600 text-sm text-center">
                Tokens are locked until: {unlockTime}
              </p>
            )}
          </form>
        </div>

        {/* Rewards and Emergency */}
        <div className="space-y-6">
          {/* Claim Rewards */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Claim Rewards</h3>
            </div>

            <p className="text-gray-600 mb-2">
              Claim your accumulated staking rewards.
            </p>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
              <p><strong>Available to claim:</strong> {pendingRewards ? formatTokenAmount(pendingRewards) : '0.00'} tokens</p>
              <p className="text-gray-500">Click the refresh button above to update rewards manually</p>
              {(!pendingRewards || pendingRewards === 0n) && !isClaimProcessing && (
                <p className="text-yellow-600 mt-1">Stake tokens to start earning rewards!</p>
              )}
              {isClaimProcessing && (
                <p className="text-green-600 mt-1 font-semibold">Rewards have been claimed and are processing!</p>
              )}
            </div>

            <button
              onClick={handleClaimRewards}
              disabled={!address || !pendingRewards || pendingRewards === 0n || isClaimProcessing}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClaimProcessing ? (
                'Rewards Claimed ✓'
              ) : (
                'Claim Rewards'
              )}
            </button>
          </div>

          {/* Emergency Withdraw */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-red-200">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-900">Emergency Withdraw</h3>
            </div>

            <div className="mb-4">
              <p className="text-red-600 text-sm font-semibold mb-2">
                WARNING: EMERGENCY WITHDRAWAL - 50% PENALTY
              </p>
              <div className="text-sm text-red-700 space-y-1">
                <p>• Bypasses lock period restrictions</p>
                <p>• 50% of your staked tokens will be lost as penalty</p>
                <p>• You will only receive 50% of your staked amount</p>
                <p>• All pending rewards will be forfeited</p>
                <p className="font-semibold text-red-800 mt-2">This action cannot be undone!</p>
              </div>
            </div>

            <button
              onClick={handleEmergencyWithdraw}
              disabled={isButtonLoading || !address || stakedAmount === 0n}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEmergencyLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Emergency Withdraw'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {!address && (
        <p className="text-yellow-600 text-sm text-center">
          Please connect your wallet to access withdrawal and rewards
        </p>
      )}
    </div>
  );
}
