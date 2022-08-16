import { getAddress, isAddress } from '@ethersproject/address';
import type { BaseProvider } from '@ethersproject/providers';

export const resolveIfEnsName = async (
  ensName: string | null | undefined,
  provider: BaseProvider,
): Promise<string | null> => {
  if (!ensName) return null;

  if (isAddress(ensName)) return ensName;

  return provider.resolveName(ensName);
};

export const lookupEnsAddress = async (
  ethAddress: string | null | undefined,
  provider: BaseProvider,
): Promise<string | null> => {
  if (!ethAddress || !isAddress(ethAddress)) return null;

  return provider.lookupAddress(ethAddress);
};

export const ethAddressToEip155 = (address: string): string =>
  `eip155:1:${getAddress(address)}`;

export const eip155ToEthAddress = (eip155String: string): string =>
  getAddress(eip155String.replace('eip155:1:', ''));

export const isAddressEqual = (
  a: string | null | undefined,
  b: string | null | undefined,
): boolean => {
  if (!a || !b) return false;

  return a.toLowerCase() === b.toLowerCase();
};
