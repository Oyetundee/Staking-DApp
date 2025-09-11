import { useState, useEffect, useCallback } from 'react';
import { useEthers } from '../ethers.jsx';
import { getStakingContract, getTokenContract } from '../contracts.js';

// Custom hook for reading contract data
export const useContractRead = ({ contract, functionName, args = [], enabled = true }) => {
  const { provider, account } = useEthers();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!enabled || !provider || !contract) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create contract instance with provider (for read operations)
      let contractInstance;
      if (contract === 'staking') {
        contractInstance = getStakingContract(provider);
      } else if (contract === 'token') {
        contractInstance = getTokenContract(provider);
      } else {
        throw new Error('Invalid contract type');
      }

      // Call the contract function
      const result = await contractInstance[functionName](...args);
      setData(result);
    } catch (err) {
      console.error(`Contract read error (${functionName}):`, err);
      setError(err.message || 'Contract read failed');
    } finally {
      setIsLoading(false);
    }
  }, [contract, functionName, JSON.stringify(args), enabled, provider]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    isLoading,
    error,
    refetch
  };
};

// Custom hook for writing to contracts
export const useContractWrite = () => {
  const { signer } = useEthers();
  const [data, setData] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const writeContract = useCallback(async ({ contract, functionName, args = [], value = 0 }) => {
    if (!signer) {
      throw new Error('Signer not available');
    }

    setIsPending(true);
    setError(null);
    setData(null);

    try {
      // Create contract instance with signer (for write operations)
      let contractInstance;
      if (contract === 'staking') {
        contractInstance = getStakingContract(signer);
      } else if (contract === 'token') {
        contractInstance = getTokenContract(signer);
      } else {
        throw new Error('Invalid contract type');
      }

      // Execute the contract function
      const tx = await contractInstance[functionName](...args, {
        value: value // for payable functions
      });
      
      console.log(`Transaction sent: ${tx.hash}`);
      setData(tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log(`Transaction mined: ${receipt.transactionHash}`);
      
      return receipt;
    } catch (err) {
      console.error(`Contract write error (${functionName}):`, err);
      setError(err.message || 'Transaction failed');
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [signer]);

  return {
    writeContract,
    data, // Transaction hash
    isPending,
    error
  };
};

// Hook for getting ETH balance
export const useEthBalance = (address) => {
  const { provider } = useEthers();
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!provider || !address) return;

    setIsLoading(true);
    setError(null);

    try {
      const ethBalance = await provider.getBalance(address);
      setBalance(ethBalance);
    } catch (err) {
      console.error('ETH balance error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [provider, address]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data: balance,
    isLoading,
    error,
    refetch
  };
};

// Hook specifically for token balance
export const useTokenBalance = (tokenAddress, userAddress) => {
  const { provider } = useEthers();
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!provider || !tokenAddress || !userAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const tokenContract = getTokenContract(provider);
      const tokenBalance = await tokenContract.balanceOf(userAddress);
      setBalance(tokenBalance);
    } catch (err) {
      console.error('Token balance error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [provider, tokenAddress, userAddress]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data: balance,
    isLoading,
    error,
    refetch
  };
};
