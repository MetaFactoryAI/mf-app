declare module 'windy-radix-palette/vars' {
  function toRadixVar(color: string, n: number | string): string;
  function toRadixVars(color: string): Record<number, string>;
}
