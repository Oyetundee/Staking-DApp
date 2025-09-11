# Staking DApp

A decentralized staking application built with React, Vite, Wagmi, RainbowKit, and TailwindCSS. This dApp allows users to stake tokens, earn rewards, and manage their positions on the Sepolia testnet.

## Features

### 🔗 Wallet Connection
- Connect/disconnect wallet using RainbowKit
- Support for multiple wallet providers
- Real-time balance display
- Network status indication

### 🏭 Token Management
- Mint test tokens for staking
- Real-time balance updates
- Automatic balance refresh after minting

### 🔐 Staking Operations
- Stake tokens with approval flow
- Input validation and error handling
- Maximum amount selection
- Transaction status tracking

### ⚖️ Position Management
- View current stake position
- Withdraw staked tokens (when unlocked)
- Claim accumulated rewards
- Emergency withdrawal option
- Lock duration and unlock time display

### 📊 Analytics & Data
- Protocol-wide statistics (total staked, APR, total stakers)
- All stake positions overview
- Real-time data updates
- User-friendly data formatting

## Smart Contracts

- **Staking Contract**: `0x21d92A7cA177d4bCCB5455003E15F340075A2653`
- **Token Contract**: `0x7f1E19bC8B08F2158D4012c509D51022D9b994eb`
- **Network**: Sepolia Testnet

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask or other Web3 wallet
- Sepolia testnet ETH for gas fees

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd staking-dapp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Setup Wallet

1. Install MetaMask or another Web3 wallet
2. Add Sepolia testnet to your wallet:
   - Network Name: Sepolia
   - RPC URL: https://rpc.sepolia.org
   - Chain ID: 11155111
   - Currency Symbol: ETH
   - Block Explorer: https://sepolia.etherscan.io

3. Get Sepolia ETH from a faucet:
   - https://sepoliafaucet.com/
   - https://faucet.sepolia.dev/

## Usage Guide

### 1. Connect Wallet
- Click the "Connect Wallet" button
- Select your preferred wallet provider
- Approve the connection

### 2. Mint Tokens
- Navigate to the "Mint" tab
- Enter the desired amount of tokens
- Click "Mint Tokens" and confirm the transaction
- Your balance will update automatically

### 3. Stake Tokens
- Go to the "Stake" tab
- Enter the amount you want to stake
- If needed, approve the staking contract to spend your tokens
- Click "Stake Tokens" and confirm the transaction

### 4. Manage Your Position
- Visit the "Manage" tab to view your staking position
- See your staked amount, pending rewards, and unlock status
- Withdraw tokens when they're unlocked
- Claim rewards at any time
- Use emergency withdraw if needed (may have penalties)

### 5. View Analytics
- Check the "Analytics" tab for protocol statistics
- See all stake positions across the protocol
- Monitor APR, total staked amounts, and participation rates

## Technical Architecture

### Frontend Stack
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **TailwindCSS**: Styling and design system
- **Wagmi**: React hooks for Ethereum
- **RainbowKit**: Wallet connection UI
- **Viem**: TypeScript interface for Ethereum
- **Ethers.js**: Ethereum library for contract interactions

### Key Components
- `WalletConnection`: Handles wallet connectivity and status
- `TokenMinting`: Manages token minting operations
- `StakingInterface`: Provides staking functionality
- `WithdrawalRewards`: Manages withdrawals and reward claims
- `DataDisplay`: Shows protocol statistics and positions

### Contract Integration
- Automated ABI management
- Real-time contract state synchronization
- Transaction status monitoring
- Error handling and user feedback
- Gas estimation and optimization

## Development

### Project Structure
```
src/
├── components/          # React components
├── contracts.js         # Contract addresses and ABIs
├── utils.js            # Utility functions
├── wagmi.js            # Wagmi configuration
├── App.jsx             # Main application component
└── main.jsx            # Application entry point
```

### Building for Production
```bash
npm run build
```

## Security Considerations

- Always verify contract addresses before interacting
- Use testnet for development and testing
- Implement proper error handling for failed transactions
- Validate user inputs before sending transactions
- Monitor for smart contract vulnerabilities

## Troubleshooting

### Common Issues

1. **MetaMask not connecting**
   - Ensure you're on the Sepolia testnet
   - Clear MetaMask cache and restart browser
   - Check if the site is allowed in MetaMask settings

2. **Transaction failing**
   - Ensure you have sufficient ETH for gas fees
   - Check if you have enough token balance
   - Verify contract approvals

3. **Data not updating**
   - Refresh the page
   - Check your network connection
   - Ensure you're connected to the correct network

---

Built with ❤️ using modern Web3 technologies

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
