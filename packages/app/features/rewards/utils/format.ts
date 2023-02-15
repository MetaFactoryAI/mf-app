import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

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

export const formatNumber = (number: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(number);

export const formatToUSD = ({
  usdPrice,
  number,
}: {
  usdPrice: number;
  number?: BigNumber;
}) => {
  const usdValue = usdPrice * Number(formatToken(number));
  return formatNumber(usdValue);
};

export const formatToken = (
  number?: BigNumber | string,
  decimals: string | number = 18,
): string | undefined => {
  if (!number) {
    return;
  }
  const num = BigNumber.from(number);
  const formatted = formatUnits(num, Number(decimals));
  const split = formatted.split('.');
  if (split.length > 1) {
    // eslint-disable-next-line consistent-return
    return `${split[0]}.${split[1].substr(0, 6)}`;
  }
  // eslint-disable-next-line consistent-return
  return formatted;
};
