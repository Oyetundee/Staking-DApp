import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, useReadContract } from 'wagmi';
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI, TOKEN_CONTRACT_ADDRESS, TOKEN_ABI } from '../contracts';
import { parseTokenAmount, formatTokenAmount, handleTransactionError } from '../utils';

export default function StakingInterface() {
  const [stakeAmount, setStakeAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);

  const { address } = useAccount();
  
  const { data: tokenBalance, refetch: refetchTokenBalance } = useBalance({
    address,
    token: TOKEN_CONTRACT_ADDRESS,
    watch: true,
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'allowance',
    args: [address, STAKING_CONTRACT_ADDRESS],
  });

  // Contract write hooks
  const { 
    data: approveHash, 
    writeContract: approveTokens, 
    isPending: isApprovePending,
    error: approveWriteError 
  } = useWriteContract();
  
  const { 
    data: stakeHash, 
    writeContract: stakeTokens, 
    isPending: isStakePending,
    error: stakeWriteError 
  } = useWriteContract();

  // Handle write contract errors
  useEffect(() => {
    if (approveWriteError) {
      setError(handleTransactionError(approveWriteError));
      setIsLoading(false);
    }
  }, [approveWriteError]);

  useEffect(() => {
    if (stakeWriteError) {
      setError(handleTransactionError(stakeWriteError));
      setIsLoading(false);
    }
  }, [stakeWriteError]);

  const { isLoading: isApproveLoading } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isStakeLoading } = useWaitForTransactionReceipt({ hash: stakeHash });

  // Handle transaction results
  const { isSuccess: isApproveSuccess, isError: isApproveError, error: approveError } = useWaitForTransactionReceipt({ 
    hash: approveHash 
  });
  
  const { isSuccess: isStakeSuccess, isError: isStakeError, error: stakeError } = useWaitForTransactionReceipt({ 
    hash: stakeHash 
  });

  // Handle approve success
  useEffect(() => {
    if (isApproveSuccess && approveHash) {
      setSuccess('Tokens approved successfully! You can now stake.');
      setIsLoading(false);
      refetchAllowance();
    }
  }, [isApproveSuccess, approveHash, refetchAllowance]);

  // Handle approve error
  useEffect(() => {
    if (isApproveError && approveError) {
      setError(handleTransactionError(approveError));
      setIsLoading(false);
    }
  }, [isApproveError, approveError]);

  // Handle stake success
  useEffect(() => {
    if (isStakeSuccess && stakeHash) {
      setSuccess(`Successfully staked ${stakeAmount} tokens!`);
      setStakeAmount('');
      setIsLoading(false);
      setError('');
      refetchTokenBalance();
      refetchAllowance();
    }
  }, [isStakeSuccess, stakeHash, stakeAmount, refetchTokenBalance, refetchAllowance]);

  // Handle stake error
  useEffect(() => {
    if (isStakeError && stakeError) {
      setError(handleTransactionError(stakeError));
      setIsLoading(false);
    }
  }, [isStakeError, stakeError]);

  // Check if approval is needed
  useEffect(() => {
    if (stakeAmount && allowance !== undefined) {
      try {
        const parsedAmount = parseTokenAmount(stakeAmount);
        const currentAllowance = BigInt(allowance.toString());
        setNeedsApproval(currentAllowance < parsedAmount);
      } catch (error) {
        setNeedsApproval(false);
      }
    } else {
      setNeedsApproval(false);
    }
  }, [stakeAmount, allowance]);

  const handleApprove = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const parsedAmount = parseTokenAmount(stakeAmount);
      approveTokens({
        address: TOKEN_CONTRACT_ADDRESS,
        abi: TOKEN_ABI,
        functionName: 'approve',
        args: [STAKING_CONTRACT_ADDRESS, parsedAmount],
      });
    } catch (error) {
      setError(handleTransactionError(error));
      setIsLoading(false);
    }
  };

  const handleStake = async (e) => {
    e.preventDefault();
    
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const parsedAmount = parseTokenAmount(stakeAmount);
    
    if (tokenBalance && parsedAmount > tokenBalance.value) {
      setError('Insufficient token balance');
      return;
    }

    if (needsApproval) {
      setError('Please approve tokens first');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      stakeTokens({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'stake',
        args: [parsedAmount],
      });
    } catch (error) {
      setError(handleTransactionError(error));
      setIsLoading(false);
    }
  };

  const setMaxAmount = () => {
    if (tokenBalance) {
      setStakeAmount(formatTokenAmount(tokenBalance.value));
    }
  };

  const isButtonLoading = isLoading || isApprovePending || isStakePending || isApproveLoading || isStakeLoading;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Stake Tokens</h2>
      </div>

      <p className="text-gray-600 mb-6">
        Stake your tokens to earn rewards. Staked tokens are locked for a specified period.
      </p>


      <form onSubmit={handleStake} className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="stake-amount" className="block text-sm font-medium text-gray-700">
              Amount to Stake
            </label>
            {tokenBalance && (
              <button
                type="button"
                onClick={setMaxAmount}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Max: {formatTokenAmount(tokenBalance.value).substring(0, 10)}
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              id="stake-amount"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="100"
              step="0.000000000000000001"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isButtonLoading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500 text-sm">TOKENS</span>
            </div>
          </div>
        </div>

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

        {needsApproval && stakeAmount && !error && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              You need to approve the staking contract to spend your tokens first.
            </p>
          </div>
        )}

        <div className="flex space-x-3">
          {needsApproval && stakeAmount && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isButtonLoading || !address}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApproveLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Approving...
                </div>
              ) : (
                'Approve Tokens'
              )}
            </button>
          )}

          <button
            type="submit"
            disabled={isButtonLoading || !address || needsApproval}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStakePending ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Confirming...
              </div>
            ) : isStakeLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              'Stake Tokens'
            )}
          </button>
        </div>

        {!address && (
          <p className="text-yellow-600 text-sm text-center">
            Please connect your wallet to stake tokens
          </p>
        )}
      </form>
    </div>
  );
}
