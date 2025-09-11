import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { TOKEN_CONTRACT_ADDRESS } from '../contracts';
import { formatTokenAmount, truncateAddress } from '../utils';

export default function WalletConnection() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const currentChain = chainId === sepolia.id ? sepolia : null;
  const { data: ethBalance } = useBalance({
    address,
    watch: true,
  });
  const { data: tokenBalance } = useBalance({
    address,
    token: TOKEN_CONTRACT_ADDRESS,
    watch: true,
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staking DApp</h1>
          <p className="text-gray-600 text-sm">Earn rewards by staking tokens</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
        {isConnected && (
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {truncateAddress(address)}
            </div>
            <div className="text-xs text-gray-500">
              {currentChain?.name || 'Unknown Network'}
            </div>
            <div className="text-xs font-medium">
              ETH: {ethBalance ? formatTokenAmount(ethBalance.value).substring(0, 8) : '0.00'}
            </div>
            <div className="text-xs font-medium text-blue-600">
              Tokens: {tokenBalance ? formatTokenAmount(tokenBalance.value).substring(0, 8) : '0.00'}
            </div>
          </div>
        )}
        
        <ConnectButton 
          chainStatus="none"
          accountStatus={{
            smallScreen: 'avatar',
            largeScreen: 'full',
          }}
        />
      </div>
    </div>
  );
}
