import { gql } from '@apollo/client';

// ========================================
// GRAPHQL QUERIES FOR SUBGRAPH DATA
// ========================================
// These queries fetch data from our deployed subgraph
// Each query uses GraphQL syntax to specify exactly what data we want
// The subgraph will return this data much faster than calling the blockchain directly

// Query to get all data related to a specific user
// This includes their lifetime statistics and recent transaction history
export const GET_USER_DATA = gql`
  query GetUserData($userAddress: String!) {
    # Get the UserStats record for this specific user (by wallet address)
    # This contains all their lifetime statistics in one record
    userStats(id: $userAddress) {
      id                        # User's wallet address
      user                      # User's wallet address (for queries)
      totalStaked               # Total amount ever staked
      totalWithdrawn            # Total amount ever withdrawn
      totalRewardsClaimed       # Total rewards ever claimed
      totalEmergencyWithdrawn   # Total emergency withdrawals
      totalPenaltiesPaid        # Total penalties paid on emergency withdrawals
      currentStakedAmount       # Currently staked amount
      stakingCount              # Number of stakes
      withdrawalCount           # Number of withdrawals
      emergencyWithdrawalCount  # Number of emergency withdrawals
      rewardClaimCount          # Number of reward claims
      firstStakeTimestamp       # When user first staked
      lastActivityTimestamp     # When user last did anything
    }
    
    # Get the 5 most recent staking transactions by this user
    # where: filters to only this user's transactions
    # orderBy/orderDirection: sorts by timestamp, newest first
    # first: limits to 5 results
    stakeds(
      where: { user: $userAddress }    # Only this user's stakes
      orderBy: timestamp               # Sort by when they staked
      orderDirection: desc             # Newest first
      first: 5                         # Limit to 5 results
    ) {
      id                      # Unique event ID
      amount                  # Amount they staked
      timestamp               # When they staked (from contract)
      blockTimestamp          # Block timestamp
      transactionHash         # Transaction hash (for etherscan links)
      newTotalStaked          # Total protocol stake after their stake
      currentRewardRate       # Reward rate at time of stake
    }
    
    # Get the 5 most recent withdrawals by this user
    withdrawns(
      where: { user: $userAddress }    # Only this user's withdrawals
      orderBy: timestamp               # Sort by when they withdrew
      orderDirection: desc             # Newest first
      first: 5                         # Limit to 5 results
    ) {
      id                      # Unique event ID
      amount                  # Amount they withdrew
      timestamp               # When they withdrew (from contract)
      blockTimestamp          # Block timestamp
      transactionHash         # Transaction hash
      rewardsAccrued          # Rewards they earned and claimed with withdrawal
    }
    
    # Get the 5 most recent reward claims by this user
    rewardsClaimeds(
      where: { user: $userAddress }    # Only this user's reward claims
      orderBy: timestamp               # Sort by when they claimed
      orderDirection: desc             # Newest first
      first: 5                         # Limit to 5 results
    ) {
      id                      # Unique event ID
      amount                  # Amount of rewards claimed
      timestamp               # When they claimed (from contract)
      blockTimestamp          # Block timestamp
      transactionHash         # Transaction hash
    }
  }
`;

// Query to get overall protocol statistics
// This gets the single ProtocolStats record that contains all the summary data
export const GET_PROTOCOL_STATS = gql`
  query GetProtocolStats {
    # Get the single protocol statistics record (ID is always "protocol")
    # This contains aggregated data for the entire staking protocol
    protocolStats(id: "protocol") {
      id                        # Always "protocol" (there's only one record)
      totalStaked               # Total amount ever staked by all users
      totalWithdrawn            # Total amount ever withdrawn by all users
      totalRewardsPaid          # Total rewards paid to all users
      totalEmergencyWithdrawn   # Total emergency withdrawals across all users
      totalPenaltiesCollected   # Total penalties collected from emergency withdrawals
      currentTotalStaked        # Current amount staked in the protocol
      uniqueStakers             # Number of unique users who have staked
      totalTransactions         # Total number of transactions (stakes/withdrawals/claims)
      currentRewardRate         # Current reward rate
      lastUpdatedTimestamp      # When this data was last updated
      lastUpdatedBlock          # Block number when last updated
    }
  }
`;

// Get recent protocol activity
export const GET_RECENT_ACTIVITY = gql`
  query GetRecentActivity($first: Int = 10) {
    # Recent stakes
    stakeds(orderBy: timestamp, orderDirection: desc, first: $first) {
      id
      user
      amount
      timestamp
      blockTimestamp
      transactionHash
      currentRewardRate
    }
    
    # Recent withdrawals
    withdrawns(orderBy: timestamp, orderDirection: desc, first: $first) {
      id
      user
      amount
      timestamp
      blockTimestamp
      transactionHash
      rewardsAccrued
    }
    
    # Recent rewards claimed
    rewardsClaimeds(orderBy: timestamp, orderDirection: desc, first: $first) {
      id
      user
      amount
      timestamp
      blockTimestamp
      transactionHash
    }
    
    # Recent emergency withdrawals
    emergencyWithdrawns(orderBy: timestamp, orderDirection: desc, first: $first) {
      id
      user
      amount
      penalty
      timestamp
      blockTimestamp
      transactionHash
    }
  }
`;

// Get user activity history with pagination
export const GET_USER_ACTIVITY_HISTORY = gql`
  query GetUserActivityHistory($userAddress: String!, $first: Int = 20, $skip: Int = 0) {
    stakeds(
      where: { user: $userAddress }
      orderBy: timestamp
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      amount
      timestamp
      blockTimestamp
      transactionHash
      newTotalStaked
      currentRewardRate
    }
    
    withdrawns(
      where: { user: $userAddress }
      orderBy: timestamp
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      amount
      timestamp
      blockTimestamp
      transactionHash
      rewardsAccrued
    }
    
    rewardsClaimeds(
      where: { user: $userAddress }
      orderBy: timestamp
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      amount
      timestamp
      blockTimestamp
      transactionHash
    }
    
    emergencyWithdrawns(
      where: { user: $userAddress }
      orderBy: timestamp
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      amount
      penalty
      timestamp
      blockTimestamp
      transactionHash
    }
  }
`;

// Get reward rate changes over time
export const GET_REWARD_RATE_HISTORY = gql`
  query GetRewardRateHistory($first: Int = 50) {
    rewardRateUpdateds(orderBy: timestamp, orderDirection: desc, first: $first) {
      id
      oldRate
      newRate
      timestamp
      totalStaked
      blockTimestamp
      transactionHash
    }
  }
`;
