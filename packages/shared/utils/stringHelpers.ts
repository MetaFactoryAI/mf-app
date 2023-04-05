import { isNotNullOrUndefined } from 'services/utils/typeHelpers';

export const composeListIntoString = <T>(
  array: Array<T | null | undefined> | undefined,
): string => (array || []).filter(isNotNullOrUndefined).join(',');

export type HexString = `0x${string}`;
