import { useAccount } from 'wagmi';
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI } from '../contracts';
import { useContractRead, useContractWrite } from './useContract';

export function useStakingData() {
  const { address } = useAccount();
  
  // Read user's staking details
  const { 
    data: userDetails, 
    refetch: refetchUserDetails, 
    isLoading: isUserDetailsLoading,
    error: userDetailsError 
  } = useContractRead({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getUserDetails',
    args: [address],
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    }
  });
  
  // Read pending rewards
  const { 
    data: pendingRewards, 
    refetch: refetchRewards, 
    isLoading: isRewardsLoading,
    error: rewardsError 
  } = useContractRead({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getPendingRewards',
    args: [address],
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    }
  });
  
  // Read protocol data
  const { data: totalStaked } = useContractRead({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'totalStaked',
  });
  
  const { data: currentRewardRate } = useContractRead({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'currentRewardRate',
  });
  
  // Debug info
  console.log('Staking Data:', {
    address,
    userDetails: userDetails ? {
      stakedAmount: userDetails.stakedAmount?.toString(),
      stakingTimestamp: userDetails.stakingTimestamp?.toString(),
      lockDuration: userDetails.lockDuration?.toString(),
      unlockTime: userDetails.unlockTime?.toString(),
    } : null,
    pendingRewards: pendingRewards?.toString(),
    userDetailsError: userDetailsError?.message,
    rewardsError: rewardsError?.message,
  });
  
  return {
    userDetails,
    pendingRewards,
    totalStaked,
    currentRewardRate,
    refetchUserDetails,
    refetchRewards,
    isLoading: isUserDetailsLoading || isRewardsLoading,
    errors: {
      userDetails: userDetailsError,
      rewards: rewardsError,
    }
  };
}

export function useStakingActions() {
  const stake = useContractWrite();
  const withdraw = useContractWrite();
  const claimRewards = useContractWrite();
  const emergencyWithdraw = useContractWrite();
  
  const handleStake = async (amount) => {
    await stake.writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI,
      functionName: 'stake',
      args: [amount],
    });
  };
  
  const handleWithdraw = async (amount) => {
    console.log('DEBUG: Attempting withdrawal:', {
      contract: STAKING_CONTRACT_ADDRESS,
      amount: amount.toString(),
      functionName: 'withdraw'
    });
    
    await withdraw.writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI,
      functionName: 'withdraw',
      args: [amount],
    });
  };
  
  const handleClaimRewards = async () => {
    await claimRewards.writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI,
      functionName: 'claimRewards',
    });
  };
  
  const handleEmergencyWithdraw = async () => {
    console.log('WARNING: Attempting emergency withdrawal');
    
    await emergencyWithdraw.writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI,
      functionName: 'emergencyWithdraw',
    });
  };
  
  return {
    stake: {
      ...stake,
      execute: handleStake,
    },
    withdraw: {
      ...withdraw,
      execute: handleWithdraw,
    },
    claimRewards: {
      ...claimRewards,
      execute: handleClaimRewards,
    },
    emergencyWithdraw: {
      ...emergencyWithdraw,
      execute: handleEmergencyWithdraw,
    }
  };
}
