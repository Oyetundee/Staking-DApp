import {
  EmergencyWithdrawn as EmergencyWithdrawnEvent,
  RewardsClaimed as RewardsClaimedEvent,
  Staked as StakedEvent,
  Withdrawn as WithdrawnEvent
} from "../generated/StakingContract/StakingContract"

// Import only the core entities we need
import {
  EmergencyWithdrawn,        
  RewardsClaimed,            
  Staked,                    
  Withdrawn,                 
  UserStats,                 
  ProtocolStats              
} from "../generated/schema"

// Import utility types for handling big numbers and addresses
import { BigInt, Address } from "@graphprotocol/graph-ts"


function getOrCreateUserStats(userAddress: Address): UserStats {
  // Try to load existing UserStats using the user's address as the ID
  let userStats = UserStats.load(userAddress.toHexString())
  
  // If no UserStats exists for this user, create a new one with all values set to 0
  if (userStats == null) {
    userStats = new UserStats(userAddress.toHexString())  
    userStats.user = userAddress                          
    userStats.totalStaked = BigInt.fromI32(0)            
    userStats.totalWithdrawn = BigInt.fromI32(0)
    userStats.totalRewardsClaimed = BigInt.fromI32(0)
    userStats.totalEmergencyWithdrawn = BigInt.fromI32(0)
    userStats.totalPenaltiesPaid = BigInt.fromI32(0)
    userStats.currentStakedAmount = BigInt.fromI32(0)
    userStats.stakingCount = BigInt.fromI32(0)
    userStats.withdrawalCount = BigInt.fromI32(0)
    userStats.emergencyWithdrawalCount = BigInt.fromI32(0)
    userStats.rewardClaimCount = BigInt.fromI32(0)
    userStats.firstStakeTimestamp = BigInt.fromI32(0)
    userStats.lastActivityTimestamp = BigInt.fromI32(0)
  }
  return userStats  // Return the UserStats
}

function getOrCreateProtocolStats(): ProtocolStats {
  // Try to load the single ProtocolStats record
  let protocolStats = ProtocolStats.load("protocol")
  
  // If no ProtocolStats exists yet, create it with all values set to 0
  if (protocolStats == null) {
    protocolStats = new ProtocolStats("protocol")         // Always use "protocol" as ID
    protocolStats.totalStaked = BigInt.fromI32(0)         // Initialize all counters to 0
    protocolStats.totalWithdrawn = BigInt.fromI32(0)
    protocolStats.totalRewardsPaid = BigInt.fromI32(0)
    protocolStats.totalEmergencyWithdrawn = BigInt.fromI32(0)
    protocolStats.totalPenaltiesCollected = BigInt.fromI32(0)
    protocolStats.currentTotalStaked = BigInt.fromI32(0)
    protocolStats.uniqueStakers = BigInt.fromI32(0)
    protocolStats.totalTransactions = BigInt.fromI32(0)
    protocolStats.currentRewardRate = BigInt.fromI32(0)
    protocolStats.lastUpdatedTimestamp = BigInt.fromI32(0)
    protocolStats.lastUpdatedBlock = BigInt.fromI32(0)
  }
  return protocolStats  // Return the ProtocolStats (either existing or newly created)
}


export function handleEmergencyWithdrawn(event: EmergencyWithdrawnEvent): void {
  
  
  
  let entity = new EmergencyWithdrawn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  // Fill in the event data from the smart contract event
  entity.user = event.params.user                    // Who did the emergency withdrawal
  entity.amount = event.params.amount                // Amount they withdrew
  entity.penalty = event.params.penalty              // Penalty they paid (50% of amount)
  entity.timestamp = event.params.timestamp          // When it happened (from contract)
  entity.newTotalStaked = event.params.newTotalStaked // Total protocol stake after this withdrawal

  // Add blockchain metadata
  entity.blockNumber = event.block.number            // Block number
  entity.blockTimestamp = event.block.timestamp      // Block timestamp
  entity.transactionHash = event.transaction.hash    // Transaction hash

  entity.save()  // Save the event record to the database

  // Update user statistics
  // Get or create UserStats for this user
  let userStats = getOrCreateUserStats(event.params.user)
  
  // Update user's lifetime totals
  userStats.totalEmergencyWithdrawn = userStats.totalEmergencyWithdrawn.plus(event.params.amount)
  userStats.totalPenaltiesPaid = userStats.totalPenaltiesPaid.plus(event.params.penalty)
  userStats.currentStakedAmount = userStats.currentStakedAmount.minus(event.params.amount)  // Reduce current stake
  userStats.emergencyWithdrawalCount = userStats.emergencyWithdrawalCount.plus(BigInt.fromI32(1))  // Increment count
  userStats.lastActivityTimestamp = event.block.timestamp  // Update last activity time
  
  userStats.save()  // Save updated user statistics

  // Update protocol statistics
  // Get the single ProtocolStats record
  let protocolStats = getOrCreateProtocolStats()
  
  // Update protocol totals
  protocolStats.totalEmergencyWithdrawn = protocolStats.totalEmergencyWithdrawn.plus(event.params.amount)
  protocolStats.totalPenaltiesCollected = protocolStats.totalPenaltiesCollected.plus(event.params.penalty)
  protocolStats.currentTotalStaked = event.params.newTotalStaked  // Update current total from contract
  protocolStats.totalTransactions = protocolStats.totalTransactions.plus(BigInt.fromI32(1))  // Increment transaction count
  protocolStats.lastUpdatedTimestamp = event.block.timestamp  // Update last modified time
  protocolStats.lastUpdatedBlock = event.block.number        // Update last modified block
  
  protocolStats.save()  // Save updated protocol statistics
}

export function handleRewardsClaimed(event: RewardsClaimedEvent): void {
  let entity = new RewardsClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.amount = event.params.amount
  entity.timestamp = event.params.timestamp
  entity.newPendingRewards = event.params.newPendingRewards
  entity.totalStaked = event.params.totalStaked

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  // Update user statistics
  let userStats = getOrCreateUserStats(event.params.user)
  userStats.totalRewardsClaimed = userStats.totalRewardsClaimed.plus(event.params.amount)
  userStats.rewardClaimCount = userStats.rewardClaimCount.plus(BigInt.fromI32(1))
  userStats.lastActivityTimestamp = event.block.timestamp
  userStats.save()

  // Update protocol statistics
  let protocolStats = getOrCreateProtocolStats()
  protocolStats.totalRewardsPaid = protocolStats.totalRewardsPaid.plus(event.params.amount)
  protocolStats.totalTransactions = protocolStats.totalTransactions.plus(BigInt.fromI32(1))
  protocolStats.lastUpdatedTimestamp = event.block.timestamp
  protocolStats.lastUpdatedBlock = event.block.number
  protocolStats.save()
}

export function handleStaked(event: StakedEvent): void {
  let entity = new Staked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.amount = event.params.amount
  entity.timestamp = event.params.timestamp
  entity.newTotalStaked = event.params.newTotalStaked
  entity.currentRewardRate = event.params.currentRewardRate

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  // Update user statistics
  let userStats = getOrCreateUserStats(event.params.user)
  userStats.totalStaked = userStats.totalStaked.plus(event.params.amount)
  userStats.currentStakedAmount = userStats.currentStakedAmount.plus(event.params.amount)
  userStats.stakingCount = userStats.stakingCount.plus(BigInt.fromI32(1))
  userStats.lastActivityTimestamp = event.block.timestamp
  
  // Set first stake timestamp if this is the first stake
  if (userStats.firstStakeTimestamp.equals(BigInt.fromI32(0))) {
    userStats.firstStakeTimestamp = event.block.timestamp
  }
  
  userStats.save()

  // Update protocol statistics
  let protocolStats = getOrCreateProtocolStats()
  protocolStats.totalStaked = protocolStats.totalStaked.plus(event.params.amount)
  protocolStats.currentTotalStaked = event.params.newTotalStaked
  protocolStats.currentRewardRate = event.params.currentRewardRate
  protocolStats.totalTransactions = protocolStats.totalTransactions.plus(BigInt.fromI32(1))
  protocolStats.lastUpdatedTimestamp = event.block.timestamp
  protocolStats.lastUpdatedBlock = event.block.number
  
  // Check if this is a new unique staker
  if (userStats.stakingCount.equals(BigInt.fromI32(1))) {
    protocolStats.uniqueStakers = protocolStats.uniqueStakers.plus(BigInt.fromI32(1))
  }
  
  protocolStats.save()
}

export function handleWithdrawn(event: WithdrawnEvent): void {
  let entity = new Withdrawn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.amount = event.params.amount
  entity.timestamp = event.params.timestamp
  entity.newTotalStaked = event.params.newTotalStaked
  entity.currentRewardRate = event.params.currentRewardRate
  entity.rewardsAccrued = event.params.rewardsAccrued

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  // Update user statistics
  let userStats = getOrCreateUserStats(event.params.user)
  userStats.totalWithdrawn = userStats.totalWithdrawn.plus(event.params.amount)
  userStats.currentStakedAmount = userStats.currentStakedAmount.minus(event.params.amount)
  userStats.withdrawalCount = userStats.withdrawalCount.plus(BigInt.fromI32(1))
  userStats.lastActivityTimestamp = event.block.timestamp
  userStats.save()

  // Update protocol statistics
  let protocolStats = getOrCreateProtocolStats()
  protocolStats.totalWithdrawn = protocolStats.totalWithdrawn.plus(event.params.amount)
  protocolStats.currentTotalStaked = event.params.newTotalStaked
  protocolStats.currentRewardRate = event.params.currentRewardRate
  protocolStats.totalTransactions = protocolStats.totalTransactions.plus(BigInt.fromI32(1))
  protocolStats.lastUpdatedTimestamp = event.block.timestamp
  protocolStats.lastUpdatedBlock = event.block.number
  protocolStats.save()
}
