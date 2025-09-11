import React, { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI, TOKEN_CONTRACT_ADDRESS, TOKEN_ABI } from '../contracts';
import { parseTokenAmount, formatTokenAmount } from '../utils';

export default function DebugPanel() {
  const [testAmount, setTestAmount] = useState('1');
  const { address } = useAccount();
  
  // Test contract reads
  const { data: tokenBalance } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  const { data: allowance } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'allowance',
    args: [address, STAKING_CONTRACT_ADDRESS],
  });

  const { data: stakingTokenAddress } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'stakingToken',
  });

  // Test contract writes
  const { writeContract: testStake, isPending: isStakePending, error: stakeError } = useWriteContract();
  const { writeContract: testApprove, isPending: isApprovePending, error: approveError } = useWriteContract();

  const handleTestStake = () => {
    console.log('Testing stake with amount:', testAmount);
    try {
      const parsedAmount = parseTokenAmount(testAmount);
      console.log('Parsed amount:', parsedAmount.toString());
      
      testStake({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'stake',
        args: [parsedAmount],
      });
    } catch (error) {
      console.error('Test stake error:', error);
    }
  };

  const handleTestApprove = () => {
    console.log('Testing approve with amount:', testAmount);
    try {
      const parsedAmount = parseTokenAmount(testAmount);
      console.log('Parsed amount for approve:', parsedAmount.toString());
      
      testApprove({
        address: TOKEN_CONTRACT_ADDRESS,
        abi: TOKEN_ABI,
        functionName: 'approve',
        args: [STAKING_CONTRACT_ADDRESS, parsedAmount],
      });
    } catch (error) {
      console.error('Test approve error:', error);
    }
  };

  if (!address) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please connect your wallet to see debug info</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">🐛 Debug Panel</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Contract Info:</h4>
            <p>Staking Contract: {STAKING_CONTRACT_ADDRESS}</p>
            <p>Token Contract: {TOKEN_CONTRACT_ADDRESS}</p>
            <p>Staking Token (from contract): {stakingTokenAddress || 'Loading...'}</p>
            <p>Contracts Match: {stakingTokenAddress?.toLowerCase() === TOKEN_CONTRACT_ADDRESS.toLowerCase() ? '✅' : '❌'}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Account Info:</h4>
            <p>Address: {address}</p>
            <p>Token Balance: {tokenBalance ? formatTokenAmount(tokenBalance) : 'Loading...'}</p>
            <p>Allowance: {allowance ? formatTokenAmount(allowance) : 'Loading...'}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Test Transactions:</h4>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              placeholder="Test amount"
              className="px-3 py-2 border rounded w-32"
              step="0.1"
              min="0"
            />
            <button
              onClick={handleTestApprove}
              disabled={isApprovePending}
              className="px-4 py-2 bg-yellow-500 text-white rounded disabled:opacity-50"
            >
              {isApprovePending ? 'Approving...' : 'Test Approve'}
            </button>
            <button
              onClick={handleTestStake}
              disabled={isStakePending}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {isStakePending ? 'Staking...' : 'Test Stake'}
            </button>
          </div>
          
          {stakeError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              Stake Error: {stakeError.message}
            </div>
          )}
          
          {approveError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              Approve Error: {approveError.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
