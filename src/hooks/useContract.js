import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';

// Custom hook for reading contract data with error handling
export function useContractRead(config) {
  const result = useReadContract(config);
  
  useEffect(() => {
    if (result.error) {
      console.error('Contract Read Error:', {
        functionName: config.functionName,
        address: config.address,
        error: result.error
      });
    }
  }, [result.error, config.functionName, config.address]);
  
  return result;
}

// Custom hook for writing to contracts with enhanced error handling
export function useContractWrite() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { 
    isSuccess: isConfirmed, 
    isError: isConfirmError,
    error: confirmError 
  } = useWaitForTransactionReceipt({ 
    hash,
    query: {
      enabled: !!hash,
    }
  });
  
  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      setSuccess(true);
      setIsLoading(false);
      setError(null);
      console.log('Transaction confirmed:', hash);
    }
  }, [isConfirmed, hash]);
  
  // Handle transaction errors
  useEffect(() => {
    if (isConfirmError && confirmError) {
      setError(confirmError.message || 'Transaction failed');
      setIsLoading(false);
      setSuccess(false);
      console.error('Transaction failed:', confirmError);
    }
  }, [isConfirmError, confirmError]);
  
  // Enhanced write function with better error handling
  const writeWithErrorHandling = async (config) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);
      
      console.log('Writing to contract:', {
        address: config.address,
        functionName: config.functionName,
        args: config.args
      });
      
      await writeContract(config);
    } catch (err) {
      console.error('Write contract error:', err);
      setError(err.message || 'Transaction failed to initiate');
      setIsLoading(false);
      setSuccess(false);
    }
  };
  
  return {
    writeContract: writeWithErrorHandling,
    isLoading: isLoading || isPending,
    error,
    success,
    hash,
    reset: () => {
      setIsLoading(false);
      setError(null);
      setSuccess(false);
    }
  };
}

// Hook for checking if user can withdraw (debugging helper)
export function useWithdrawalStatus(userDetails) {
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [reason, setReason] = useState('');
  
  useEffect(() => {
    if (!userDetails) {
      setCanWithdraw(false);
      setReason('No user details available');
      return;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const unlockTime = Number(userDetails.unlockTime);
    const stakedAmount = userDetails.stakedAmount;
    
    console.log('Withdrawal Status Check:', {
      currentTime,
      unlockTime,
      stakedAmount: stakedAmount.toString(),
      isLocked: unlockTime > currentTime,
      timeUntilUnlock: unlockTime - currentTime
    });
    
    if (stakedAmount === 0n) {
      setCanWithdraw(false);
      setReason('No tokens staked');
    } else if (unlockTime > currentTime) {
      const timeLeft = unlockTime - currentTime;
      const hours = Math.floor(timeLeft / 3600);
      const minutes = Math.floor((timeLeft % 3600) / 60);
      setCanWithdraw(false);
      setReason(`Tokens locked for ${hours}h ${minutes}m`);
    } else {
      setCanWithdraw(true);
      setReason('Ready to withdraw');
    }
  }, [userDetails]);
  
  return { canWithdraw, reason };
}
