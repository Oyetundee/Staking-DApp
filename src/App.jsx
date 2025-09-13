import { useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import WalletConnection from './components/WalletConnection';
import TokenMinting from './components/TokenMinting';
import StakingInterface from './components/StakingInterface';
import WithdrawalRewards from './components/WithdrawalRewards';
import DataDisplay from './components/DataDisplay';
import SubgraphAnalytics from './components/SubgraphAnalytics';
import { apolloClient } from './graphql/client';

function App() {
  const [activeTab, setActiveTab] = useState('stake');

  const tabs = [
    { id: 'stake', name: 'Stake' },
    { id: 'manage', name: 'Manage' },
    { id: 'mint', name: 'Mint' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'subgraph', name: 'Subgraph Data' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stake':
        return <StakingInterface />;
      case 'manage':
        return <WithdrawalRewards />;
      case 'mint':
        return <TokenMinting />;
      case 'analytics':
        return <DataDisplay />;
      case 'subgraph':
        return <SubgraphAnalytics />;
      default:
        return <StakingInterface />;
    }
  };

  return (
    <ApolloProvider client={apolloClient}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <WalletConnection />
          
          {/* Navigation Tabs */}
          <div className="mt-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {renderTabContent()}
          </div>

          {/* Footer */}
          <footer className="mt-16 border-t border-gray-200 pt-8">
            <div className="text-center text-gray-500 text-sm">
              <p className="inline-flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>Connected to Sepolia Testnet</span>
                <span className="mx-4">|</span>
                <span>Subgraph: Staking Contract v0.0.2</span>
              </p>
            </div>
          </footer>
        </div>
      </div>
    </ApolloProvider>
  );
}

export default App;
