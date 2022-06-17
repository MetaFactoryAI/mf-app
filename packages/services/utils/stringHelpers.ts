import { isNotNullOrUndefined } from './typeHelpers';

export const composeListIntoString = <T>(
  array: Array<T | null | undefined> | undefined,
): string => (array || []).filter(isNotNullOrUndefined).join(',');
