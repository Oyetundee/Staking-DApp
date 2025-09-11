import { ethers } from 'ethers';
import { createContext, useContext, useState, useEffect } from 'react';

// Ethers Context
const EthersContext = createContext();

export const useEthers = () => {
  const context = useContext(EthersContext);
  if (!context) {
    throw new Error('useEthers must be used within EthersProvider');
  }
  return context;
};

export const EthersProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize provider and connect to wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      // Create ethers provider
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Get signer
      const walletSigner = await browserProvider.getSigner();
      setSigner(walletSigner);
      
      // Get account address
      const address = await walletSigner.getAddress();
      setAccount(address);
      
      // Get network info
      const network = await browserProvider.getNetwork();
      setChainId(Number(network.chainId));
      
      setIsConnected(true);
      
      console.log('Connected to wallet:', address);
      console.log('Network:', network.name, 'Chain ID:', network.chainId);
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          connectWallet();
        }
      };

      const handleChainChanged = (chainId) => {
        setChainId(parseInt(chainId, 16));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        }
      } catch (error) {
        console.log('Auto-connect failed:', error);
      }
    };

    autoConnect();
  }, []);

  const value = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    connectWallet,
    disconnect
  };

  return (
    <EthersContext.Provider value={value}>
      {children}
    </EthersContext.Provider>
  );
};
