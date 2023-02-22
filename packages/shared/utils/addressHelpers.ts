export const formatAddress = (
  address: string | null | undefined,
  ensName?: string | null,
  chars = 4,
): string => {
  if (ensName) return ensName;
  if (address)
    return `${address.substring(0, chars)}...${address.substring(
      address.length - chars,
    )}`;
  return '';
};
