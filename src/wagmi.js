import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Staking DApp',
  projectId: '8e2316c4e14f5a2ff1bad45908857815',
  chains: [sepolia],
  ssr: false,
});
