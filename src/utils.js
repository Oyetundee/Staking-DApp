import { ethers } from 'ethers';

// Format token amounts from wei to ether
export const formatTokenAmount = (amount, decimals = 18) => {
  if (!amount) return '0';
  return ethers.formatUnits(amount.toString(), decimals);
};

// Parse token amounts from ether to wei
export const parseTokenAmount = (amount, decimals = 18) => {
  if (!amount || amount === '') return '0';
  return ethers.parseUnits(amount.toString(), decimals);
};

// Format timestamp to readable date
export const formatTimestamp = (timestamp) => {
  if (!timestamp || timestamp === 0) return 'N/A';
  return new Date(parseInt(timestamp.toString()) * 1000).toLocaleString();
};

// Calculate time until unlock
export const calculateTimeUntilUnlock = (timestamp, lockDuration) => {
  if (!timestamp || !lockDuration) return 'N/A';
  
  const unlockTime = parseInt(timestamp.toString()) + parseInt(lockDuration.toString());
  const currentTime = Math.floor(Date.now() / 1000);
  const timeLeft = unlockTime - currentTime;
  
  if (timeLeft <= 0) return 'Unlocked';
  
  const days = Math.floor(timeLeft / (24 * 60 * 60));
  const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((timeLeft % (60 * 60)) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Format percentage
export const formatPercentage = (value, decimals = 2) => {
  if (!value) return '0%';
  return `${parseFloat(value).toFixed(decimals)}%`;
};

// Format large numbers
export const formatNumber = (value, decimals = 2) => {
  if (!value) return '0';
  const num = parseFloat(value);
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
  return num.toFixed(decimals);
};

// Truncate address
export const truncateAddress = (address, startLength = 6, endLength = 4) => {
  if (!address) return '';
  return `${address.substring(0, startLength)}...${address.substring(address.length - endLength)}`;
};

// Handle transaction errors
export const handleTransactionError = (error) => {
  if (error?.reason) return error.reason;
  if (error?.message) {
    if (error.message.includes('user rejected')) {
      return 'Transaction rejected by user';
    }
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }
    if (error.message.includes('execution reverted')) {
      return 'Transaction failed - check contract requirements';
    }
    return error.message;
  }
  return 'An unknown error occurred';
};

// Check if user can unstake (lock period ended)
export const canUnstake = (timestamp, lockDuration) => {
  if (!timestamp || !lockDuration) return false;
  const unlockTime = parseInt(timestamp.toString()) + parseInt(lockDuration.toString());
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= unlockTime;
};
