// ========================================
// SUBGRAPH ANALYTICS DASHBOARD COMPONENT
// ========================================
// This component displays data from our subgraph instead of calling the blockchain directly
// It shows protocol statistics, user statistics, and recent activity
// The data updates automatically as new events are indexed by the subgraph

import React from 'react';
import { useQuery } from '@apollo/client';     // Hook for GraphQL queries
import { useAccount } from 'wagmi';             // Hook to get connected wallet
import { formatEther } from 'viem';             // Utility to format big numbers
import { GET_USER_DATA, GET_PROTOCOL_STATS, GET_RECENT_ACTIVITY } from '../graphql/queries';

const SubgraphAnalytics = () => {
  // Get the currently connected wallet address
  const { address } = useAccount();

  // QUERY 1: Get user-specific data from the subgraph
  // This query gets the user's statistics and recent transactions
  const { data: userData, loading: userLoading, error: userError } = useQuery(GET_USER_DATA, {
    variables: { userAddress: address?.toLowerCase() || '' },  // Pass user's address as variable
    skip: !address,           // Don't run query if no wallet connected
    pollInterval: 30000,      // Re-fetch data every 30 seconds to get updates
  });

  // QUERY 2: Get overall protocol statistics from the subgraph
  // This gets aggregated data for the entire staking protocol
  const { data: protocolData, loading: protocolLoading, error: protocolError } = useQuery(GET_PROTOCOL_STATS, {
    pollInterval: 30000,      // Re-fetch every 30 seconds
  });

  // QUERY 3: Get recent activity across all users
  // This shows recent stakes, withdrawals, and claims by anyone
  const { data: activityData, loading: activityLoading, error: activityError } = useQuery(GET_RECENT_ACTIVITY, {
    variables: { first: 5 },  // Limit to 5 recent items
    pollInterval: 30000,      // Re-fetch every 30 seconds
  });

  // UTILITY FUNCTIONS for formatting data from the subgraph
  
  // Convert timestamp from contract (seconds since epoch) to readable date
  const formatTimestamp = (timestamp) => {
    const date = new Date(parseInt(timestamp) * 1000);  // Convert seconds to milliseconds
    return date.toLocaleString();                        // Format for user's locale
  };

  // Shorten wallet addresses for display (0x1234...abcd)
  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // ERROR HANDLING: If any query failed, show error message
  if (userError || protocolError || activityError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Analytics Dashboard</h2>
        <div className="text-red-600">
          Error loading data from subgraph: {userError?.message || protocolError?.message || activityError?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics Dashboard</h2>
        
        {/* Protocol Statistics */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Protocol Statistics</h3>
          {protocolLoading ? (
            <div className="text-gray-600">Loading protocol data...</div>
          ) : protocolData?.protocolStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-600 text-sm font-medium">Total Staked</div>
                <div className="text-2xl font-bold text-blue-800">
                  {parseFloat(formatEther(protocolData.protocolStats.currentTotalStaked)).toFixed(2)}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-600 text-sm font-medium">Unique Stakers</div>
                <div className="text-2xl font-bold text-green-800">
                  {protocolData.protocolStats.uniqueStakers}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-purple-600 text-sm font-medium">Total Rewards Paid</div>
                <div className="text-2xl font-bold text-purple-800">
                  {parseFloat(formatEther(protocolData.protocolStats.totalRewardsPaid)).toFixed(2)}
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-orange-600 text-sm font-medium">Total Transactions</div>
                <div className="text-2xl font-bold text-orange-800">
                  {protocolData.protocolStats.totalTransactions}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-600">No protocol data available</div>
          )}
        </div>

        {/* User Statistics */}
        {address && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Your Statistics</h3>
            {userLoading ? (
              <div className="text-gray-600">Loading your data...</div>
            ) : userData?.userStats ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-indigo-600 text-sm font-medium">Currently Staked</div>
                  <div className="text-xl font-bold text-indigo-800">
                    {parseFloat(formatEther(userData.userStats.currentStakedAmount)).toFixed(4)}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-green-600 text-sm font-medium">Total Rewards Claimed</div>
                  <div className="text-xl font-bold text-green-800">
                    {parseFloat(formatEther(userData.userStats.totalRewardsClaimed)).toFixed(4)}
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-blue-600 text-sm font-medium">Stakes Count</div>
                  <div className="text-xl font-bold text-blue-800">
                    {userData.userStats.stakingCount}
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-yellow-600 text-sm font-medium">Total Staked</div>
                  <div className="text-xl font-bold text-yellow-800">
                    {parseFloat(formatEther(userData.userStats.totalStaked)).toFixed(4)}
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-red-600 text-sm font-medium">Total Withdrawn</div>
                  <div className="text-xl font-bold text-red-800">
                    {parseFloat(formatEther(userData.userStats.totalWithdrawn)).toFixed(4)}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-gray-600 text-sm font-medium">First Stake</div>
                  <div className="text-sm font-bold text-gray-800">
                    {userData.userStats.firstStakeTimestamp !== '0' 
                      ? formatTimestamp(userData.userStats.firstStakeTimestamp)
                      : 'Never'
                    }
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-600">No activity found for your address</div>
            )}
          </div>
        )}

        {/* Recent Activity */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Recent Protocol Activity</h3>
          {activityLoading ? (
            <div className="text-gray-600">Loading recent activity...</div>
          ) : activityData ? (
            <div className="space-y-4">
              {/* Recent Stakes */}
              {activityData.stakeds?.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-green-700 mb-2">Recent Stakes</h4>
                  <div className="space-y-2">
                    {activityData.stakeds.slice(0, 3).map((stake) => (
                      <div key={stake.id} className="flex justify-between items-center bg-green-50 p-3 rounded">
                        <div>
                          <span className="font-medium">{formatAddress(stake.user)}</span>
                          <span className="text-green-600 ml-2">staked {parseFloat(formatEther(stake.amount)).toFixed(4)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTimestamp(stake.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Withdrawals */}
              {activityData.withdrawns?.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-blue-700 mb-2">Recent Withdrawals</h4>
                  <div className="space-y-2">
                    {activityData.withdrawns.slice(0, 3).map((withdrawal) => (
                      <div key={withdrawal.id} className="flex justify-between items-center bg-blue-50 p-3 rounded">
                        <div>
                          <span className="font-medium">{formatAddress(withdrawal.user)}</span>
                          <span className="text-blue-600 ml-2">withdrew {parseFloat(formatEther(withdrawal.amount)).toFixed(4)}</span>
                          {withdrawal.rewardsAccrued !== '0' && (
                            <span className="text-green-600 ml-1">
                              (+{parseFloat(formatEther(withdrawal.rewardsAccrued)).toFixed(4)} rewards)
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTimestamp(withdrawal.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Rewards Claimed */}
              {activityData.rewardsClaimeds?.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-purple-700 mb-2">Recent Rewards Claimed</h4>
                  <div className="space-y-2">
                    {activityData.rewardsClaimeds.slice(0, 3).map((claim) => (
                      <div key={claim.id} className="flex justify-between items-center bg-purple-50 p-3 rounded">
                        <div>
                          <span className="font-medium">{formatAddress(claim.user)}</span>
                          <span className="text-purple-600 ml-2">claimed {parseFloat(formatEther(claim.amount)).toFixed(4)} rewards</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTimestamp(claim.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-600">No recent activity</div>
          )}
        </div>

        {/* User Transaction History */}
        {address && userData?.userStats && (
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Your Recent Transactions</h3>
            <div className="space-y-2">
              {/* User's recent stakes */}
              {userData.stakeds?.map((stake) => (
                <div key={stake.id} className="flex justify-between items-center bg-green-50 p-3 rounded">
                  <div>
                    <span className="text-green-600 font-medium">Staked {parseFloat(formatEther(stake.amount)).toFixed(4)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatTimestamp(stake.timestamp)}
                  </div>
                </div>
              ))}
              
              {/* User's recent withdrawals */}
              {userData.withdrawns?.map((withdrawal) => (
                <div key={withdrawal.id} className="flex justify-between items-center bg-blue-50 p-3 rounded">
                  <div>
                    <span className="text-blue-600 font-medium">Withdrew {parseFloat(formatEther(withdrawal.amount)).toFixed(4)}</span>
                    {withdrawal.rewardsAccrued !== '0' && (
                      <span className="text-green-600 ml-2">
                        (+{parseFloat(formatEther(withdrawal.rewardsAccrued)).toFixed(4)} rewards)
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatTimestamp(withdrawal.timestamp)}
                  </div>
                </div>
              ))}
              
              {/* User's recent rewards claimed */}
              {userData.rewardsClaimeds?.map((claim) => (
                <div key={claim.id} className="flex justify-between items-center bg-purple-50 p-3 rounded">
                  <div>
                    <span className="text-purple-600 font-medium">Claimed {parseFloat(formatEther(claim.amount)).toFixed(4)} rewards</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatTimestamp(claim.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubgraphAnalytics;
