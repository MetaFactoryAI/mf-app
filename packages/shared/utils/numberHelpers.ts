import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

export const formatNumber = (number: number | string, decimals = 2): string => {
  if (typeof number === 'string') {
    number = parseFloat(number);
  }
  return number.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};
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
