import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Your subgraph endpoint
const httpLink = createHttpLink({
  uri: 'https://api.studio.thegraph.com/query/120786/staking-contract/v0.0.6',
});

// Configure Apollo Client
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
