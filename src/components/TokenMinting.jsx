import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { TOKEN_CONTRACT_ADDRESS, TOKEN_ABI } from '../contracts';
import { parseTokenAmount, handleTransactionError } from '../utils';

export default function TokenMinting() {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { address } = useAccount();
  const { refetch: refetchBalance } = useBalance({
    address,
    token: TOKEN_CONTRACT_ADDRESS,
    watch: true,
  });

  const { data: hash, writeContract: mint, isPending } = useWriteContract();

  const { isLoading: isTransactionLoading } = useWaitForTransactionReceipt({
    hash,
  });

  const { isSuccess, isError, error: transactionError } = useWaitForTransactionReceipt({ hash });

  // Handle transaction success
  React.useEffect(() => {
    if (isSuccess && hash) {
      setSuccess(`Successfully minted ${amount} tokens!`);
      setAmount('');
      setIsLoading(false);
      setError('');
      refetchBalance();
    }
  }, [isSuccess, hash, amount, refetchBalance]);

  // Handle transaction error
  React.useEffect(() => {
    if (isError && transactionError) {
      setError(handleTransactionError(transactionError));
      setIsLoading(false);
    }
  }, [isError, transactionError]);

  const handleMint = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const parsedAmount = parseTokenAmount(amount);
      mint({
        address: TOKEN_CONTRACT_ADDRESS,
        abi: TOKEN_ABI,
        functionName: 'mint',
        args: [address, parsedAmount],
      });
    } catch (error) {
      setError(handleTransactionError(error));
      setIsLoading(false);
    }
  };

  const isButtonLoading = isLoading || isPending || isTransactionLoading;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Mint Tokens</h2>
      </div>

      <p className="text-gray-600 mb-6">
        Mint new tokens to your wallet for staking. You can mint any amount of test tokens.
      </p>

      <form onSubmit={handleMint} className="space-y-4">
        <div>
          <label htmlFor="mint-amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Mint
          </label>
          <div className="relative">
            <input
              type="number"
              id="mint-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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

        <button
          type="submit"
          disabled={isButtonLoading || !address}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isButtonLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {isTransactionLoading ? 'Confirming...' : 'Minting...'}
            </div>
          ) : (
            'Mint Tokens'
          )}
        </button>

        {!address && (
          <p className="text-yellow-600 text-sm text-center">
            Please connect your wallet to mint tokens
          </p>
        )}
      </form>
    </div>
  );
}
