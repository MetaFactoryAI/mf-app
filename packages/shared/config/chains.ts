import { mainnet, goerli, Chain, configureChains } from 'wagmi';
import keyBy from 'lodash/keyBy';
import { optimism, polygon, gnosis } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { ALCHEMY_ID } from './public';
import { publicProvider } from 'wagmi/providers/public';

export const DefaultChains = [mainnet, goerli, polygon, optimism, gnosis];

export const ChainsById: Record<number, Chain> = keyBy(DefaultChains, 'id');

export const { chains, provider, webSocketProvider } = configureChains(
  DefaultChains,
  [alchemyProvider({ apiKey: ALCHEMY_ID }), publicProvider()],
);
