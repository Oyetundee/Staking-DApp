import { useReadContract } from 'wagmi';
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI } from '../contracts';
import { formatTokenAmount, formatNumber, formatTimestamp, truncateAddress } from '../utils';
import { useState, useEffect } from 'react';

export default function DataDisplay() {
  // State to track total number of stakers (we'll calculate this from events or manually)
  const [totalStakers, setTotalStakers] = useState(0);
  
  // Read total amount of tokens staked in the protocol
  const { data: totalStaked, refetch: refetchTotalStaked } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'totalStaked', // This function exists in your contract
  });

  // Read the current reward rate (tokens per second or similar)
  const { data: currentRewardRate, refetch: refetchRewardRate } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'currentRewardRate', // This function exists in your contract
  });

  // Read the initial APR set in the contract
  const { data: initialApr, refetch: refetchApr } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'initialApr', // This function exists in your contract
  });

  // Read the minimum lock duration for staking
  const { data: minLockDuration } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'minLockDuration', // This function exists in your contract
  });

  // Read the emergency withdrawal penalty percentage
  const { data: emergencyWithdrawPenalty } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'emergencyWithdrawPenalty', // This function exists in your contract
  });

  // Read total rewards distributed by the protocol
  const { data: totalRewards } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getTotalRewards', // This function exists in your contract
  });

  // Auto-refresh data every 10 seconds to keep analytics up to date
  useEffect(() => {
    const interval = setInterval(() => {
      refetchTotalStaked();
      refetchRewardRate();
      refetchApr();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [refetchTotalStaked, refetchRewardRate, refetchApr]);

  // Calculate estimated total stakers based on total staked amount
  // This is a simple estimation since we don't have a direct totalStakers function
  useEffect(() => {
    if (totalStaked && totalStaked > 0n) {
      // Estimate number of stakers (this is just an example calculation)
      // In a real app, you might track this via events or have a counter in the contract
      const averageStakeEstimate = 1000; // Assume average stake of 1000 tokens
      const estimatedStakers = Math.max(1, Math.floor(Number(formatTokenAmount(totalStaked)) / averageStakeEstimate));
      setTotalStakers(estimatedStakers);
    } else {
      setTotalStakers(0);
    }
  }, [totalStaked]);

  return (
    <div className="space-y-8">
      {/* Main Protocol Statistics Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Protocol Analytics</h2>
          <button
            onClick={() => {
              refetchTotalStaked();
              refetchRewardRate();
              refetchApr();
            }}
            className="ml-auto px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            Refresh Data
          </button>
        </div>

        {/* Grid of 4 main statistics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Total Staked Tokens Card */}
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-600 mb-2">Total Staked</h3>
            <p className="text-3xl font-bold text-blue-900">
              {totalStaked ? formatNumber(formatTokenAmount(totalStaked)) : '0'}
            </p>
            <p className="text-xs text-blue-600 mt-1">TOKENS</p>
            <p className="text-xs text-gray-500 mt-2">Total tokens locked in staking</p>
          </div>

          {/* Current APR Card */}
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <h3 className="text-sm font-medium text-green-600 mb-2">Initial APR</h3>
            <p className="text-3xl font-bold text-green-900">
              {initialApr ? `${(Number(formatTokenAmount(initialApr)) / 100).toFixed(2)}%` : '0%'}
            </p>
            <p className="text-xs text-green-600 mt-1">ANNUAL</p>
            <p className="text-xs text-gray-500 mt-2">Starting annual percentage rate</p>
          </div>

          {/* Current Reward Rate Card */}
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <h3 className="text-sm font-medium text-purple-600 mb-2">Reward Rate</h3>
            <p className="text-3xl font-bold text-purple-900">
              {currentRewardRate ? formatNumber(formatTokenAmount(currentRewardRate)) : '0'}
            </p>
            <p className="text-xs text-purple-600 mt-1">PER SECOND</p>
            <p className="text-xs text-gray-500 mt-2">Current rewards generation rate</p>
          </div>

          {/* Total Stakers Card */}
          <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <h3 className="text-sm font-medium text-orange-600 mb-2">Estimated Stakers</h3>
            <p className="text-3xl font-bold text-orange-900">
              {totalStakers}
            </p>
            <p className="text-xs text-orange-600 mt-1">USERS</p>
            <p className="text-xs text-gray-500 mt-2">Estimated number of active stakers</p>
          </div>
        </div>
      </div>

      {/* Additional Protocol Information */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Protocol Configuration</h2>
        </div>

        {/* Grid of additional protocol information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Minimum Lock Duration */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Minimum Lock Duration</h3>
            <p className="text-2xl font-bold text-blue-600">
              {minLockDuration 
                ? `${Math.floor(Number(minLockDuration) / (24 * 60 * 60))} days`
                : 'Loading...'
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">Minimum time tokens must be locked</p>
          </div>
          
          {/* Emergency Withdrawal Penalty */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Emergency Penalty</h3>
            <p className="text-2xl font-bold text-red-600">
              {emergencyWithdrawPenalty 
                ? `${Number(emergencyWithdrawPenalty)}%`
                : 'Loading...'
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">Penalty for emergency withdrawals</p>
          </div>
          
          {/* Total Rewards Distributed */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Total Rewards</h3>
            <p className="text-2xl font-bold text-green-600">
              {totalRewards 
                ? formatNumber(formatTokenAmount(totalRewards))
                : '0'
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">Total rewards distributed to date</p>
          </div>
        </div>
        
        {/* Protocol Status Indicators */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Protocol Health</h3>
          <div className="flex flex-wrap gap-4">
            
            {/* Total Staked Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                totalStaked && totalStaked > 0n 
                  ? 'bg-green-400' 
                  : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium">
                Staking Active: {totalStaked && totalStaked > 0n ? 'Yes' : 'No'}
              </span>
            </div>
            
            {/* Rewards Active Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                currentRewardRate && currentRewardRate > 0n 
                  ? 'bg-green-400' 
                  : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium">
                Rewards Active: {currentRewardRate && currentRewardRate > 0n ? 'Yes' : 'No'}
              </span>
            </div>
            
          </div>
        </div>
      </div>

      {/* Protocol Summary Dashboard */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Protocol Summary</h3>
          <span className="text-sm text-blue-100">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Average Stake per User */}
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Average Stake per User</p>
            <p className="text-2xl font-bold">
              {totalStaked && totalStakers && totalStakers > 0
                ? formatNumber((Number(formatTokenAmount(totalStaked)) / totalStakers).toFixed(0))
                : '0'
              }
            </p>
            <p className="text-blue-200 text-xs">tokens per staker</p>
          </div>
          
          {/* Estimated Market Value */}
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Total Value Locked</p>
            <p className="text-2xl font-bold">
              {totalStaked 
                ? `$${formatNumber((Number(formatTokenAmount(totalStaked)) * 1).toFixed(0))}`
                : '$0'
              }
            </p>
            <p className="text-blue-200 text-xs">USD equivalent (est.)</p>
          </div>
          
          {/* Daily Reward Estimate */}
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Daily Rewards</p>
            <p className="text-2xl font-bold">
              {currentRewardRate 
                ? formatNumber((Number(formatTokenAmount(currentRewardRate)) * 86400).toFixed(0))
                : '0'
              }
            </p>
            <p className="text-blue-200 text-xs">tokens per day (est.)</p>
          </div>
          
        </div>
        
        {/* Additional Info Bar */}
        <div className="mt-6 pt-4 border-t border-blue-400 flex flex-wrap justify-center gap-6 text-sm">
          <span className="text-blue-100">
            Contract Status: <span className="text-white font-semibold">Active</span>
          </span>
          <span className="text-blue-100">
            Network: <span className="text-white font-semibold">Sepolia Testnet</span>
          </span>
          <span className="text-blue-100">
            Version: <span className="text-white font-semibold">1.0.0</span>
          </span>
        </div>
      </div>
    </div>
  );
}
