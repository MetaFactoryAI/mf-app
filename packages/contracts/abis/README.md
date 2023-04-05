## MAKE SURE TO ADD "as const" TO THE END OF THE ABI DEFINITIONS!

wagmi can infer types based on ABI and EIP-712 Typed Data definitions (powered by ABIType), giving you full end-to-end type-safety from your contracts to your frontend and incredible developer experience (e.g. autocomplete ABI function names and catch misspellings, type ABI function arguments, etc.).

For this to work, you must either add const assertions to specific configuration parameters (more info on those below) or define them inline. For example, readContract's abi configuration parameter:

```ts
const abi = [
  // ...
] as const; // <--- const assertion
```

[Wagmi Type Inference Docs](https://wagmi.sh/core/typescript#type-inference)
