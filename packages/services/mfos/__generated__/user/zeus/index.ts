/* eslint-disable */

import { AllTypesProps, ReturnTypes, Ops } from './const';
import fetch, { Response } from 'node-fetch';
import WebSocket from 'ws';
export const HOST = 'http://localhost:8055/graphql';

export const HEADERS = {};
export const apiSubscription = (options: chainOptions) => (query: string) => {
  try {
    const queryString = options[0] + '?query=' + encodeURIComponent(query);
    const wsString = queryString.replace('http', 'ws');
    const host = (options.length > 1 && options[1]?.websocket?.[0]) || wsString;
    const webSocketOptions = options[1]?.websocket || [host];
    const ws = new WebSocket(...webSocketOptions);
    return {
      ws,
      on: (e: (args: any) => void) => {
        ws.onmessage = (event: any) => {
          if (event.data) {
            const parsed = JSON.parse(event.data);
            const data = parsed.data;
            return e(data);
          }
        };
      },
      off: (e: (args: any) => void) => {
        ws.onclose = e;
      },
      error: (e: (args: any) => void) => {
        ws.onerror = e;
      },
      open: (e: () => void) => {
        ws.onopen = e;
      },
    };
  } catch {
    throw new Error('No websockets implemented');
  }
};
const handleFetchResponse = (response: Response): Promise<GraphQLResponse> => {
  if (!response.ok) {
    return new Promise((_, reject) => {
      response
        .text()
        .then((text) => {
          try {
            reject(JSON.parse(text));
          } catch (err) {
            reject(text);
          }
        })
        .catch(reject);
    });
  }
  return response.json() as Promise<GraphQLResponse>;
};

export const apiFetch =
  (options: fetchOptions) =>
  (query: string, variables: Record<string, unknown> = {}) => {
    const fetchOptions = options[1] || {};
    if (fetchOptions.method && fetchOptions.method === 'GET') {
      return fetch(
        `${options[0]}?query=${encodeURIComponent(query)}`,
        fetchOptions,
      )
        .then(handleFetchResponse)
        .then((response: GraphQLResponse) => {
          if (response.errors) {
            throw new GraphQLError(response);
          }
          return response.data;
        });
    }
    return fetch(`${options[0]}`, {
      body: JSON.stringify({ query, variables }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      ...fetchOptions,
    })
      .then(handleFetchResponse)
      .then((response: GraphQLResponse) => {
        if (response.errors) {
          throw new GraphQLError(response);
        }
        return response.data;
      });
  };

export const InternalsBuildQuery = ({
  ops,
  props,
  returns,
  options,
  scalars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  options?: OperationOptions;
  scalars?: ScalarDefinition;
}) => {
  const ibb = (
    k: string,
    o: InputValueType | VType,
    p = '',
    root = true,
    vars: Array<{ name: string; graphQLType: string }> = [],
  ): string => {
    const keyForPath = purifyGraphQLKey(k);
    const newPath = [p, keyForPath].join(SEPARATOR);
    if (!o) {
      return '';
    }
    if (typeof o === 'boolean' || typeof o === 'number') {
      return k;
    }
    if (typeof o === 'string') {
      return `${k} ${o}`;
    }
    if (Array.isArray(o)) {
      const args = InternalArgsBuilt({
        props,
        returns,
        ops,
        scalars,
        vars,
      })(o[0], newPath);
      return `${ibb(args ? `${k}(${args})` : k, o[1], p, false, vars)}`;
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (
            typeof objectUnderAlias !== 'object' ||
            Array.isArray(objectUnderAlias)
          ) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(`${alias}:${operationName}`, operation, p, false, vars);
        })
        .join('\n');
    }
    const hasOperationName =
      root && options?.operationName ? ' ' + options.operationName : '';
    const keyForDirectives = o.__directives ?? '';
    const query = `{${Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map((e) =>
        ibb(...e, [p, `field<>${keyForPath}`].join(SEPARATOR), false, vars),
      )
      .join('\n')}}`;
    if (!root) {
      return `${k} ${keyForDirectives}${hasOperationName} ${query}`;
    }
    const varsString = vars
      .map((v) => `${v.name}: ${v.graphQLType}`)
      .join(', ');
    return `${k} ${keyForDirectives}${hasOperationName}${
      varsString ? `(${varsString})` : ''
    } ${query}`;
  };
  return ibb;
};

export const Thunder =
  (fn: FetchFunction) =>
  <
    O extends keyof typeof Ops,
    SCLR extends ScalarDefinition,
    R extends keyof ValueTypes = GenericOperation<O>,
  >(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<SCLR>,
  ) =>
  <Z extends ValueTypes[R]>(
    o: Z | ValueTypes[R],
    ops?: OperationOptions & { variables?: Record<string, unknown> },
  ) =>
    fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: graphqlOptions?.scalars,
      }),
      ops?.variables,
    ).then((data) => {
      if (graphqlOptions?.scalars) {
        return decodeScalarsInResponse({
          response: data,
          initialOp: operation,
          initialZeusQuery: o as VType,
          returns: ReturnTypes,
          scalars: graphqlOptions.scalars,
          ops: Ops,
        });
      }
      return data;
    }) as Promise<InputType<GraphQLTypes[R], Z, SCLR>>;

export const Chain = (...options: chainOptions) => Thunder(apiFetch(options));

export const SubscriptionThunder =
  (fn: SubscriptionFunction) =>
  <
    O extends keyof typeof Ops,
    SCLR extends ScalarDefinition,
    R extends keyof ValueTypes = GenericOperation<O>,
  >(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<SCLR>,
  ) =>
  <Z extends ValueTypes[R]>(
    o: Z | ValueTypes[R],
    ops?: OperationOptions & { variables?: ExtractVariables<Z> },
  ) => {
    const returnedFunction = fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: graphqlOptions?.scalars,
      }),
    ) as SubscriptionToGraphQL<Z, GraphQLTypes[R], SCLR>;
    if (returnedFunction?.on && graphqlOptions?.scalars) {
      const wrapped = returnedFunction.on;
      returnedFunction.on = (
        fnToCall: (args: InputType<GraphQLTypes[R], Z, SCLR>) => void,
      ) =>
        wrapped((data: InputType<GraphQLTypes[R], Z, SCLR>) => {
          if (graphqlOptions?.scalars) {
            return fnToCall(
              decodeScalarsInResponse({
                response: data,
                initialOp: operation,
                initialZeusQuery: o as VType,
                returns: ReturnTypes,
                scalars: graphqlOptions.scalars,
                ops: Ops,
              }),
            );
          }
          return fnToCall(data);
        });
    }
    return returnedFunction;
  };

export const Subscription = (...options: chainOptions) =>
  SubscriptionThunder(apiSubscription(options));
export const Zeus = <
  Z extends ValueTypes[R],
  O extends keyof typeof Ops,
  R extends keyof ValueTypes = GenericOperation<O>,
>(
  operation: O,
  o: Z | ValueTypes[R],
  ops?: {
    operationOptions?: OperationOptions;
    scalars?: ScalarDefinition;
  },
) =>
  InternalsBuildQuery({
    props: AllTypesProps,
    returns: ReturnTypes,
    ops: Ops,
    options: ops?.operationOptions,
    scalars: ops?.scalars,
  })(operation, o as VType);

export const ZeusSelect = <T>() => ((t: unknown) => t) as SelectionFunction<T>;

export const Selector = <T extends keyof ValueTypes>(key: T) =>
  key && ZeusSelect<ValueTypes[T]>();

export const TypeFromSelector = <T extends keyof ValueTypes>(key: T) =>
  key && ZeusSelect<ValueTypes[T]>();
export const Gql = Chain(HOST, {
  headers: {
    'Content-Type': 'application/json',
    ...HEADERS,
  },
});

export const ZeusScalars = ZeusSelect<ScalarCoders>();

export const decodeScalarsInResponse = <O extends Operations>({
  response,
  scalars,
  returns,
  ops,
  initialZeusQuery,
  initialOp,
}: {
  ops: O;
  response: any;
  returns: ReturnTypesType;
  scalars?: Record<string, ScalarResolver | undefined>;
  initialOp: keyof O;
  initialZeusQuery: InputValueType | VType;
}) => {
  if (!scalars) {
    return response;
  }
  const builder = PrepareScalarPaths({
    ops,
    returns,
  });

  const scalarPaths = builder(
    initialOp as string,
    ops[initialOp],
    initialZeusQuery,
  );
  if (scalarPaths) {
    const r = traverseResponse({ scalarPaths, resolvers: scalars })(
      initialOp as string,
      response,
      [ops[initialOp]],
    );
    return r;
  }
  return response;
};

export const traverseResponse = ({
  resolvers,
  scalarPaths,
}: {
  scalarPaths: { [x: string]: `scalar.${string}` };
  resolvers: {
    [x: string]: ScalarResolver | undefined;
  };
}) => {
  const ibb = (
    k: string,
    o: InputValueType | VType,
    p: string[] = [],
  ): unknown => {
    if (Array.isArray(o)) {
      return o.map((eachO) => ibb(k, eachO, p));
    }
    if (o == null) {
      return o;
    }
    const scalarPathString = p.join(SEPARATOR);
    const currentScalarString = scalarPaths[scalarPathString];
    if (currentScalarString) {
      const currentDecoder =
        resolvers[currentScalarString.split('.')[1]]?.decode;
      if (currentDecoder) {
        return currentDecoder(o);
      }
    }
    if (
      typeof o === 'boolean' ||
      typeof o === 'number' ||
      typeof o === 'string' ||
      !o
    ) {
      return o;
    }
    const entries = Object.entries(o).map(
      ([k, v]) => [k, ibb(k, v, [...p, purifyGraphQLKey(k)])] as const,
    );
    const objectFromEntries = entries.reduce<Record<string, unknown>>(
      (a, [k, v]) => {
        a[k] = v;
        return a;
      },
      {},
    );
    return objectFromEntries;
  };
  return ibb;
};

export type AllTypesPropsType = {
  [x: string]:
    | undefined
    | `scalar.${string}`
    | 'enum'
    | {
        [x: string]:
          | undefined
          | string
          | {
              [x: string]: string | undefined;
            };
      };
};

export type ReturnTypesType = {
  [x: string]:
    | {
        [x: string]: string | undefined;
      }
    | `scalar.${string}`
    | undefined;
};
export type InputValueType = {
  [x: string]:
    | undefined
    | boolean
    | string
    | number
    | [any, undefined | boolean | InputValueType]
    | InputValueType;
};
export type VType =
  | undefined
  | boolean
  | string
  | number
  | [any, undefined | boolean | InputValueType]
  | InputValueType;

export type PlainType = boolean | number | string | null | undefined;
export type ZeusArgsType =
  | PlainType
  | {
      [x: string]: ZeusArgsType;
    }
  | Array<ZeusArgsType>;

export type Operations = Record<string, string>;

export type VariableDefinition = {
  [x: string]: unknown;
};

export const SEPARATOR = '|';

export type fetchOptions = Parameters<typeof fetch>;
type websocketOptions = typeof WebSocket extends new (
  ...args: infer R
) => WebSocket
  ? R
  : never;
export type chainOptions =
  | [fetchOptions[0], fetchOptions[1] & { websocket?: websocketOptions }]
  | [fetchOptions[0]];
export type FetchFunction = (
  query: string,
  variables?: Record<string, unknown>,
) => Promise<any>;
export type SubscriptionFunction = (query: string) => any;
type NotUndefined<T> = T extends undefined ? never : T;
export type ResolverType<F> = NotUndefined<
  F extends [infer ARGS, any] ? ARGS : undefined
>;

export type OperationOptions = {
  operationName?: string;
};

export type ScalarCoder = Record<string, (s: unknown) => string>;

export interface GraphQLResponse {
  data?: Record<string, any>;
  errors?: Array<{
    message: string;
  }>;
}
export class GraphQLError extends Error {
  constructor(public response: GraphQLResponse) {
    super('');
    // eslint-disable-next-line no-console
    console.info(JSON.stringify(response));
  }
  toString() {
    return 'GraphQL Response Error';
  }
}
export type GenericOperation<O> = O extends keyof typeof Ops
  ? typeof Ops[O]
  : never;
export type ThunderGraphQLOptions<SCLR extends ScalarDefinition> = {
  scalars?: SCLR | ScalarCoders;
};

const ExtractScalar = (
  mappedParts: string[],
  returns: ReturnTypesType,
): `scalar.${string}` | undefined => {
  if (mappedParts.length === 0) {
    return;
  }
  const oKey = mappedParts[0];
  const returnP1 = returns[oKey];
  if (typeof returnP1 === 'object') {
    const returnP2 = returnP1[mappedParts[1]];
    if (returnP2) {
      return ExtractScalar([returnP2, ...mappedParts.slice(2)], returns);
    }
    return undefined;
  }
  return returnP1 as `scalar.${string}` | undefined;
};

export const PrepareScalarPaths = ({
  ops,
  returns,
}: {
  returns: ReturnTypesType;
  ops: Operations;
}) => {
  const ibb = (
    k: string,
    originalKey: string,
    o: InputValueType | VType,
    p: string[] = [],
    pOriginals: string[] = [],
    root = true,
  ): { [x: string]: `scalar.${string}` } | undefined => {
    if (!o) {
      return;
    }
    if (
      typeof o === 'boolean' ||
      typeof o === 'number' ||
      typeof o === 'string'
    ) {
      const extractionArray = [...pOriginals, originalKey];
      const isScalar = ExtractScalar(extractionArray, returns);
      if (isScalar?.startsWith('scalar')) {
        const partOfTree = {
          [[...p, k].join(SEPARATOR)]: isScalar,
        };
        return partOfTree;
      }
      return {};
    }
    if (Array.isArray(o)) {
      return ibb(k, k, o[1], p, pOriginals, false);
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (
            typeof objectUnderAlias !== 'object' ||
            Array.isArray(objectUnderAlias)
          ) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(alias, operationName, operation, p, pOriginals, false);
        })
        .reduce((a, b) => ({
          ...a,
          ...b,
        }));
    }
    const keyName = root ? ops[k] : k;
    return Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map(([k, v]) => {
        // Inline fragments shouldn't be added to the path as they aren't a field
        const isInlineFragment = originalKey.match(/^...\s*on/) != null;
        return ibb(
          k,
          k,
          v,
          isInlineFragment ? p : [...p, purifyGraphQLKey(keyName || k)],
          isInlineFragment
            ? pOriginals
            : [...pOriginals, purifyGraphQLKey(originalKey)],
          false,
        );
      })
      .reduce((a, b) => ({
        ...a,
        ...b,
      }));
  };
  return ibb;
};

export const purifyGraphQLKey = (k: string) =>
  k.replace(/\([^)]*\)/g, '').replace(/^[^:]*\:/g, '');

const mapPart = (p: string) => {
  const [isArg, isField] = p.split('<>');
  if (isField) {
    return {
      v: isField,
      __type: 'field',
    } as const;
  }
  return {
    v: isArg,
    __type: 'arg',
  } as const;
};

type Part = ReturnType<typeof mapPart>;

export const ResolveFromPath = (
  props: AllTypesPropsType,
  returns: ReturnTypesType,
  ops: Operations,
) => {
  const ResolvePropsType = (mappedParts: Part[]) => {
    const oKey = ops[mappedParts[0].v];
    const propsP1 = oKey ? props[oKey] : props[mappedParts[0].v];
    if (propsP1 === 'enum' && mappedParts.length === 1) {
      return 'enum';
    }
    if (
      typeof propsP1 === 'string' &&
      propsP1.startsWith('scalar.') &&
      mappedParts.length === 1
    ) {
      return propsP1;
    }
    if (typeof propsP1 === 'object') {
      if (mappedParts.length < 2) {
        return 'not';
      }
      const propsP2 = propsP1[mappedParts[1].v];
      if (typeof propsP2 === 'string') {
        return rpp(
          `${propsP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
      if (typeof propsP2 === 'object') {
        if (mappedParts.length < 3) {
          return 'not';
        }
        const propsP3 = propsP2[mappedParts[2].v];
        if (propsP3 && mappedParts[2].__type === 'arg') {
          return rpp(
            `${propsP3}${SEPARATOR}${mappedParts
              .slice(3)
              .map((mp) => mp.v)
              .join(SEPARATOR)}`,
          );
        }
      }
    }
  };
  const ResolveReturnType = (mappedParts: Part[]) => {
    if (mappedParts.length === 0) {
      return 'not';
    }
    const oKey = ops[mappedParts[0].v];
    const returnP1 = oKey ? returns[oKey] : returns[mappedParts[0].v];
    if (typeof returnP1 === 'object') {
      if (mappedParts.length < 2) return 'not';
      const returnP2 = returnP1[mappedParts[1].v];
      if (returnP2) {
        return rpp(
          `${returnP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
    }
  };
  const rpp = (path: string): 'enum' | 'not' | `scalar.${string}` => {
    const parts = path.split(SEPARATOR).filter((l) => l.length > 0);
    const mappedParts = parts.map(mapPart);
    const propsP1 = ResolvePropsType(mappedParts);
    if (propsP1) {
      return propsP1;
    }
    const returnP1 = ResolveReturnType(mappedParts);
    if (returnP1) {
      return returnP1;
    }
    return 'not';
  };
  return rpp;
};

export const InternalArgsBuilt = ({
  props,
  ops,
  returns,
  scalars,
  vars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  scalars?: ScalarDefinition;
  vars: Array<{ name: string; graphQLType: string }>;
}) => {
  const arb = (a: ZeusArgsType, p = '', root = true): string => {
    if (typeof a === 'string') {
      if (a.startsWith(START_VAR_NAME)) {
        const [varName, graphQLType] = a
          .replace(START_VAR_NAME, '$')
          .split(GRAPHQL_TYPE_SEPARATOR);
        const v = vars.find((v) => v.name === varName);
        if (!v) {
          vars.push({
            name: varName,
            graphQLType,
          });
        } else {
          if (v.graphQLType !== graphQLType) {
            throw new Error(
              `Invalid variable exists with two different GraphQL Types, "${v.graphQLType}" and ${graphQLType}`,
            );
          }
        }
        return varName;
      }
    }
    const checkType = ResolveFromPath(props, returns, ops)(p);
    if (checkType.startsWith('scalar.')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, ...splittedScalar] = checkType.split('.');
      const scalarKey = splittedScalar.join('.');
      return (scalars?.[scalarKey]?.encode?.(a) as string) || JSON.stringify(a);
    }
    if (Array.isArray(a)) {
      return `[${a.map((arr) => arb(arr, p, false)).join(', ')}]`;
    }
    if (typeof a === 'string') {
      if (checkType === 'enum') {
        return a;
      }
      return `${JSON.stringify(a)}`;
    }
    if (typeof a === 'object') {
      if (a === null) {
        return `null`;
      }
      const returnedObjectString = Object.entries(a)
        .filter(([, v]) => typeof v !== 'undefined')
        .map(([k, v]) => `${k}: ${arb(v, [p, k].join(SEPARATOR), false)}`)
        .join(',\n');
      if (!root) {
        return `{${returnedObjectString}}`;
      }
      return returnedObjectString;
    }
    return `${a}`;
  };
  return arb;
};

export const resolverFor = <
  X,
  T extends keyof ResolverInputTypes,
  Z extends keyof ResolverInputTypes[T],
  RET = unknown,
>(
  type: T,
  field: Z,
  fn: (
    args: Required<ResolverInputTypes[T]>[Z] extends [infer Input, any]
      ? Input
      : any,
    source: any,
  ) => Z extends keyof ModelTypes[T]
    ? ModelTypes[T][Z] | Promise<ModelTypes[T][Z]> | X
    : RET,
) => fn as (args?: any, source?: any) => RET;

export type UnwrapPromise<T> = T extends Promise<infer R> ? R : T;
export type ZeusState<T extends (...args: any[]) => Promise<any>> = NonNullable<
  UnwrapPromise<ReturnType<T>>
>;
export type ZeusHook<
  T extends (
    ...args: any[]
  ) => Record<string, (...args: any[]) => Promise<any>>,
  N extends keyof ReturnType<T>,
> = ZeusState<ReturnType<T>[N]>;

export type WithTypeNameValue<T> = T & {
  __typename?: boolean;
  __directives?: string;
};
export type AliasType<T> = WithTypeNameValue<T> & {
  __alias?: Record<string, WithTypeNameValue<T>>;
};
type DeepAnify<T> = {
  [P in keyof T]?: any;
};
type IsPayLoad<T> = T extends [any, infer PayLoad] ? PayLoad : T;
export type ScalarDefinition = Record<string, ScalarResolver>;

type IsScalar<S, SCLR extends ScalarDefinition> = S extends 'scalar' & {
  name: infer T;
}
  ? T extends keyof SCLR
    ? SCLR[T]['decode'] extends (s: unknown) => unknown
      ? ReturnType<SCLR[T]['decode']>
      : unknown
    : unknown
  : S;
type IsArray<T, U, SCLR extends ScalarDefinition> = T extends Array<infer R>
  ? InputType<R, U, SCLR>[]
  : InputType<T, U, SCLR>;
type FlattenArray<T> = T extends Array<infer R> ? R : T;
type BaseZeusResolver = boolean | 1 | string | Variable<any, string>;

type IsInterfaced<
  SRC extends DeepAnify<DST>,
  DST,
  SCLR extends ScalarDefinition,
> = FlattenArray<SRC> extends ZEUS_INTERFACES | ZEUS_UNIONS
  ? {
      [P in keyof SRC]: SRC[P] extends '__union' & infer R
        ? P extends keyof DST
          ? IsArray<
              R,
              '__typename' extends keyof DST
                ? DST[P] & { __typename: true }
                : DST[P],
              SCLR
            >
          : IsArray<
              R,
              '__typename' extends keyof DST ? { __typename: true } : never,
              SCLR
            >
        : never;
    }[keyof SRC] & {
      [P in keyof Omit<
        Pick<
          SRC,
          {
            [P in keyof DST]: SRC[P] extends '__union' & infer R ? never : P;
          }[keyof DST]
        >,
        '__typename'
      >]: IsPayLoad<DST[P]> extends BaseZeusResolver
        ? IsScalar<SRC[P], SCLR>
        : IsArray<SRC[P], DST[P], SCLR>;
    }
  : {
      [P in keyof Pick<SRC, keyof DST>]: IsPayLoad<
        DST[P]
      > extends BaseZeusResolver
        ? IsScalar<SRC[P], SCLR>
        : IsArray<SRC[P], DST[P], SCLR>;
    };

export type MapType<
  SRC,
  DST,
  SCLR extends ScalarDefinition,
> = SRC extends DeepAnify<DST> ? IsInterfaced<SRC, DST, SCLR> : never;
// eslint-disable-next-line @typescript-eslint/ban-types
export type InputType<
  SRC,
  DST,
  SCLR extends ScalarDefinition = {},
> = IsPayLoad<DST> extends { __alias: infer R }
  ? {
      [P in keyof R]: MapType<SRC, R[P], SCLR>[keyof MapType<SRC, R[P], SCLR>];
    } & MapType<SRC, Omit<IsPayLoad<DST>, '__alias'>, SCLR>
  : MapType<SRC, IsPayLoad<DST>, SCLR>;
export type SubscriptionToGraphQL<Z, T, SCLR extends ScalarDefinition> = {
  ws: WebSocket;
  on: (fn: (args: InputType<T, Z, SCLR>) => void) => void;
  off: (
    fn: (e: {
      data?: InputType<T, Z, SCLR>;
      code?: number;
      reason?: string;
      message?: string;
    }) => void,
  ) => void;
  error: (
    fn: (e: { data?: InputType<T, Z, SCLR>; errors?: string[] }) => void,
  ) => void;
  open: () => void;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type FromSelector<
  SELECTOR,
  NAME extends keyof GraphQLTypes,
  SCLR extends ScalarDefinition = {},
> = InputType<GraphQLTypes[NAME], SELECTOR, SCLR>;

export type ScalarResolver = {
  encode?: (s: unknown) => string;
  decode?: (s: unknown) => unknown;
};

export type SelectionFunction<V> = <T>(t: T | V) => T;

type BuiltInVariableTypes = {
  ['String']: string;
  ['Int']: number;
  ['Float']: number;
  ['ID']: unknown;
  ['Boolean']: boolean;
};
type AllVariableTypes = keyof BuiltInVariableTypes | keyof ZEUS_VARIABLES;
type VariableRequired<T extends string> =
  | `${T}!`
  | T
  | `[${T}]`
  | `[${T}]!`
  | `[${T}!]`
  | `[${T}!]!`;
type VR<T extends string> = VariableRequired<VariableRequired<T>>;

export type GraphQLVariableType = VR<AllVariableTypes>;

type ExtractVariableTypeString<T extends string> = T extends VR<infer R1>
  ? R1 extends VR<infer R2>
    ? R2 extends VR<infer R3>
      ? R3 extends VR<infer R4>
        ? R4 extends VR<infer R5>
          ? R5
          : R4
        : R3
      : R2
    : R1
  : T;

type DecomposeType<T, Type> = T extends `[${infer R}]`
  ? Array<DecomposeType<R, Type>> | undefined
  : T extends `${infer R}!`
  ? NonNullable<DecomposeType<R, Type>>
  : Type | undefined;

type ExtractTypeFromGraphQLType<T extends string> =
  T extends keyof ZEUS_VARIABLES
    ? ZEUS_VARIABLES[T]
    : T extends keyof BuiltInVariableTypes
    ? BuiltInVariableTypes[T]
    : any;

export type GetVariableType<T extends string> = DecomposeType<
  T,
  ExtractTypeFromGraphQLType<ExtractVariableTypeString<T>>
>;

type UndefinedKeys<T> = {
  [K in keyof T]-?: T[K] extends NonNullable<T[K]> ? never : K;
}[keyof T];

type WithNullableKeys<T> = Pick<T, UndefinedKeys<T>>;
type WithNonNullableKeys<T> = Omit<T, UndefinedKeys<T>>;

type OptionalKeys<T> = {
  [P in keyof T]?: T[P];
};

export type WithOptionalNullables<T> = OptionalKeys<WithNullableKeys<T>> &
  WithNonNullableKeys<T>;

export type Variable<T extends GraphQLVariableType, Name extends string> = {
  ' __zeus_name': Name;
  ' __zeus_type': T;
};

export type ExtractVariables<Query> = Query extends Variable<
  infer VType,
  infer VName
>
  ? { [key in VName]: GetVariableType<VType> }
  : Query extends [infer Inputs, infer Outputs]
  ? ExtractVariables<Inputs> & ExtractVariables<Outputs>
  : Query extends string | number | boolean
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : UnionToIntersection<
      {
        [K in keyof Query]: WithOptionalNullables<ExtractVariables<Query[K]>>;
      }[keyof Query]
    >;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

export const START_VAR_NAME = `$ZEUS_VAR`;
export const GRAPHQL_TYPE_SEPARATOR = `__$GRAPHQL__`;

export const $ = <Type extends GraphQLVariableType, Name extends string>(
  name: Name,
  graphqlType: Type,
) => {
  return (START_VAR_NAME +
    name +
    GRAPHQL_TYPE_SEPARATOR +
    graphqlType) as unknown as Variable<Type, Name>;
};
type ZEUS_INTERFACES = never;
export type ScalarCoders = {
  Date?: ScalarResolver;
  Hash?: ScalarResolver;
  JSON?: ScalarResolver;
  GraphQLStringOrFloat?: ScalarResolver;
  GraphQLBigInt?: ScalarResolver;
};
type ZEUS_UNIONS = never;

export type ValueTypes = {
  ['Query']: AliasType<{
    brands?: [
      {
        filter?:
          | ValueTypes['brands_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['brands'],
    ];
    brands_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['brands'],
    ];
    brands_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['brands_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['brands_aggregated'],
    ];
    brands_directus_users?: [
      {
        filter?:
          | ValueTypes['brands_directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['brands_directus_users'],
    ];
    brands_directus_users_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['brands_directus_users'],
    ];
    brands_directus_users_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['brands_directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['brands_directus_users_aggregated'],
    ];
    collaborators?: [
      {
        filter?:
          | ValueTypes['collaborators_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['collaborators'],
    ];
    collaborators_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['collaborators'],
    ];
    collaborators_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['collaborators_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['collaborators_aggregated'],
    ];
    collaborator_roles?: [
      {
        filter?:
          | ValueTypes['collaborator_roles_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['collaborator_roles'],
    ];
    collaborator_roles_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['collaborator_roles'],
    ];
    collaborator_roles_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['collaborator_roles_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['collaborator_roles_aggregated'],
    ];
    junction_directus_users_skills?: [
      {
        filter?:
          | ValueTypes['junction_directus_users_skills_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['junction_directus_users_skills'],
    ];
    junction_directus_users_skills_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['junction_directus_users_skills'],
    ];
    junction_directus_users_skills_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['junction_directus_users_skills_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['junction_directus_users_skills_aggregated'],
    ];
    skills?: [
      {
        filter?:
          | ValueTypes['skills_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['skills'],
    ];
    skills_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['skills'],
    ];
    skills_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['skills_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['skills_aggregated'],
    ];
    producers?: [
      {
        filter?:
          | ValueTypes['producers_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['producers'],
    ];
    producers_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['producers'],
    ];
    producers_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['producers_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['producers_aggregated'],
    ];
    producers_production_materials?: [
      {
        filter?:
          | ValueTypes['producers_production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['producers_production_materials'],
    ];
    producers_production_materials_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['producers_production_materials'],
    ];
    producers_production_materials_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['producers_production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['producers_production_materials_aggregated'],
    ];
    producers_production_methods?: [
      {
        filter?:
          | ValueTypes['producers_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['producers_production_methods'],
    ];
    producers_production_methods_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['producers_production_methods'],
    ];
    producers_production_methods_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['producers_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['producers_production_methods_aggregated'],
    ];
    production_methods?: [
      {
        filter?:
          | ValueTypes['production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['production_methods'],
    ];
    production_methods_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['production_methods'],
    ];
    production_methods_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['production_methods_aggregated'],
    ];
    production_materials_production_methods?: [
      {
        filter?:
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['production_materials_production_methods'],
    ];
    production_materials_production_methods_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['production_materials_production_methods'],
    ];
    production_materials_production_methods_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['production_materials_production_methods_aggregated'],
    ];
    fulfillers?: [
      {
        filter?:
          | ValueTypes['fulfillers_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['fulfillers'],
    ];
    fulfillers_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['fulfillers'],
    ];
    fulfillers_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['fulfillers_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['fulfillers_aggregated'],
    ];
    price_currencies?: [
      {
        filter?:
          | ValueTypes['price_currencies_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['price_currencies'],
    ];
    price_currencies_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['price_currencies'],
    ];
    price_currencies_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['price_currencies_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['price_currencies_aggregated'],
    ];
    stages?: [
      {
        filter?:
          | ValueTypes['stages_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['stages'],
    ];
    stages_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['stages'],
    ];
    stages_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['stages_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['stages_aggregated'],
    ];
    currencies?: [
      {
        filter?:
          | ValueTypes['currencies_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['currencies'],
    ];
    currencies_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['currencies'],
    ];
    currencies_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['currencies_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['currencies_aggregated'],
    ];
    products_content?: [
      {
        filter?:
          | ValueTypes['products_content_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products_content'],
    ];
    products_content_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['products_content'],
    ];
    products_content_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['products_content_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_content_aggregated'],
    ];
    products_contributors?: [
      {
        filter?:
          | ValueTypes['products_contributors_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products_contributors'],
    ];
    products_contributors_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['products_contributors'],
    ];
    products_contributors_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['products_contributors_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_contributors_aggregated'],
    ];
    products_design_files?: [
      {
        filter?:
          | ValueTypes['products_design_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products_design_files'],
    ];
    products_design_files_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['products_design_files'],
    ];
    products_design_files_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['products_design_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_design_files_aggregated'],
    ];
    products_files?: [
      {
        filter?:
          | ValueTypes['products_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products_files'],
    ];
    products_files_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['products_files'],
    ];
    products_files_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['products_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_files_aggregated'],
    ];
    products_production_materials?: [
      {
        filter?:
          | ValueTypes['products_production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products_production_materials'],
    ];
    products_production_materials_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['products_production_materials'],
    ];
    products_production_materials_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['products_production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_production_materials_aggregated'],
    ];
    products_production_methods?: [
      {
        filter?:
          | ValueTypes['products_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products_production_methods'],
    ];
    products_production_methods_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['products_production_methods'],
    ];
    products_production_methods_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['products_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_production_methods_aggregated'],
    ];
    products_wearables?: [
      {
        filter?:
          | ValueTypes['products_wearables_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products_wearables'],
    ];
    products_wearables_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['products_wearables'],
    ];
    products_wearables_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['products_wearables_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_wearables_aggregated'],
    ];
    file_formats?: [
      {
        filter?:
          | ValueTypes['file_formats_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['file_formats'],
    ];
    file_formats_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['file_formats'],
    ];
    file_formats_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['file_formats_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['file_formats_aggregated'],
    ];
    products?: [
      {
        filter?:
          | ValueTypes['products_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products'],
    ];
    products_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['products'],
    ];
    products_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['products_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_aggregated'],
    ];
    production_materials?: [
      {
        filter?:
          | ValueTypes['production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['production_materials'],
    ];
    production_materials_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['production_materials'],
    ];
    production_materials_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['production_materials_aggregated'],
    ];
    invoices?: [
      {
        filter?:
          | ValueTypes['invoices_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['invoices'],
    ];
    invoices_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['invoices'],
    ];
    invoices_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['invoices_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['invoices_aggregated'],
    ];
    production_materials_files?: [
      {
        filter?:
          | ValueTypes['production_materials_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['production_materials_files'],
    ];
    production_materials_files_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['production_materials_files'],
    ];
    production_materials_files_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['production_materials_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['production_materials_files_aggregated'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['brands']: AliasType<{
    created_at?: boolean | `@${string}`;
    created_at_func?: ValueTypes['datetime_functions'];
    description?: boolean | `@${string}`;
    discord_url?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    logo?: [
      {
        filter?:
          | ValueTypes['directus_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    name?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    twitter_url?: boolean | `@${string}`;
    website_url?: boolean | `@${string}`;
    products?: [
      {
        filter?:
          | ValueTypes['products_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products'],
    ];
    products_func?: ValueTypes['count_functions'];
    users?: [
      {
        filter?:
          | ValueTypes['brands_directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['brands_directus_users'],
    ];
    users_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  /** ISO8601 Date values */
  ['Date']: unknown;
  ['datetime_functions']: AliasType<{
    year?: boolean | `@${string}`;
    month?: boolean | `@${string}`;
    week?: boolean | `@${string}`;
    day?: boolean | `@${string}`;
    weekday?: boolean | `@${string}`;
    hour?: boolean | `@${string}`;
    minute?: boolean | `@${string}`;
    second?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_files']: AliasType<{
    id?: boolean | `@${string}`;
    storage?: boolean | `@${string}`;
    filename_disk?: boolean | `@${string}`;
    filename_download?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    type?: boolean | `@${string}`;
    folder?: [
      {
        filter?:
          | ValueTypes['directus_folders_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_folders'],
    ];
    uploaded_by?: [
      {
        filter?:
          | ValueTypes['directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    uploaded_on?: boolean | `@${string}`;
    uploaded_on_func?: ValueTypes['datetime_functions'];
    modified_by?: [
      {
        filter?:
          | ValueTypes['directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    modified_on?: boolean | `@${string}`;
    modified_on_func?: ValueTypes['datetime_functions'];
    charset?: boolean | `@${string}`;
    filesize?: boolean | `@${string}`;
    width?: boolean | `@${string}`;
    height?: boolean | `@${string}`;
    duration?: boolean | `@${string}`;
    embed?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    location?: boolean | `@${string}`;
    tags?: boolean | `@${string}`;
    tags_func?: ValueTypes['count_functions'];
    metadata?: boolean | `@${string}`;
    metadata_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_folders']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    parent?: [
      {
        filter?:
          | ValueTypes['directus_folders_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_folders'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_folders_filter']: {
    id?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    name?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    parent?:
      | ValueTypes['directus_folders_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['directus_folders_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['directus_folders_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['string_filter_operators']: {
    _eq?: string | undefined | null | Variable<any, string>;
    _neq?: string | undefined | null | Variable<any, string>;
    _contains?: string | undefined | null | Variable<any, string>;
    _icontains?: string | undefined | null | Variable<any, string>;
    _ncontains?: string | undefined | null | Variable<any, string>;
    _starts_with?: string | undefined | null | Variable<any, string>;
    _nstarts_with?: string | undefined | null | Variable<any, string>;
    _ends_with?: string | undefined | null | Variable<any, string>;
    _nends_with?: string | undefined | null | Variable<any, string>;
    _in?:
      | Array<string | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _nin?:
      | Array<string | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _null?: boolean | undefined | null | Variable<any, string>;
    _nnull?: boolean | undefined | null | Variable<any, string>;
    _empty?: boolean | undefined | null | Variable<any, string>;
    _nempty?: boolean | undefined | null | Variable<any, string>;
  };
  ['directus_users']: AliasType<{
    id?: boolean | `@${string}`;
    first_name?: boolean | `@${string}`;
    last_name?: boolean | `@${string}`;
    email?: boolean | `@${string}`;
    password?: boolean | `@${string}`;
    location?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    tags?: boolean | `@${string}`;
    tags_func?: ValueTypes['count_functions'];
    avatar?: [
      {
        filter?:
          | ValueTypes['directus_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    language?: boolean | `@${string}`;
    theme?: boolean | `@${string}`;
    tfa_secret?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    role?: [
      {
        filter?:
          | ValueTypes['directus_roles_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_roles'],
    ];
    token?: boolean | `@${string}`;
    last_access?: boolean | `@${string}`;
    last_access_func?: ValueTypes['datetime_functions'];
    last_page?: boolean | `@${string}`;
    provider?: boolean | `@${string}`;
    external_identifier?: boolean | `@${string}`;
    auth_data?: boolean | `@${string}`;
    auth_data_func?: ValueTypes['count_functions'];
    email_notifications?: boolean | `@${string}`;
    discord_handle?: boolean | `@${string}`;
    discord_id?: boolean | `@${string}`;
    timezone?: boolean | `@${string}`;
    twitter_handle?: boolean | `@${string}`;
    collaborators?: [
      {
        filter?:
          | ValueTypes['collaborators_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['collaborators'],
    ];
    collaborators_func?: ValueTypes['count_functions'];
    skills?: [
      {
        filter?:
          | ValueTypes['junction_directus_users_skills_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['junction_directus_users_skills'],
    ];
    skills_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  /** Hashed string values */
  ['Hash']: unknown;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  ['JSON']: unknown;
  ['count_functions']: AliasType<{
    count?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_files_filter']: {
    id?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    storage?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    filename_disk?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    filename_download?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    title?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    type?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    folder?:
      | ValueTypes['directus_folders_filter']
      | undefined
      | null
      | Variable<any, string>;
    uploaded_by?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    uploaded_on?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    uploaded_on_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    modified_by?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    modified_on?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    modified_on_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    charset?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    filesize?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    width?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    height?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    duration?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    embed?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    description?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    location?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    tags?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    tags_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    metadata?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    metadata_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['directus_files_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['directus_files_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_users_filter']: {
    id?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    first_name?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    last_name?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    email?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    password?:
      | ValueTypes['hash_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    location?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    title?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    description?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    tags?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    tags_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    avatar?:
      | ValueTypes['directus_files_filter']
      | undefined
      | null
      | Variable<any, string>;
    language?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    theme?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    tfa_secret?:
      | ValueTypes['hash_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    status?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    role?:
      | ValueTypes['directus_roles_filter']
      | undefined
      | null
      | Variable<any, string>;
    token?:
      | ValueTypes['hash_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    last_access?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    last_access_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    last_page?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    provider?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    external_identifier?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    auth_data?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    auth_data_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    email_notifications?:
      | ValueTypes['boolean_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    discord_handle?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    discord_id?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    timezone?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    twitter_handle?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    collaborators?:
      | ValueTypes['collaborators_filter']
      | undefined
      | null
      | Variable<any, string>;
    collaborators_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    skills?:
      | ValueTypes['junction_directus_users_skills_filter']
      | undefined
      | null
      | Variable<any, string>;
    skills_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['directus_users_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['directus_users_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['hash_filter_operators']: {
    _null?: boolean | undefined | null | Variable<any, string>;
    _nnull?: boolean | undefined | null | Variable<any, string>;
    _empty?: boolean | undefined | null | Variable<any, string>;
    _nempty?: boolean | undefined | null | Variable<any, string>;
  };
  ['count_function_filter_operators']: {
    count?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['number_filter_operators']: {
    _eq?:
      | ValueTypes['GraphQLStringOrFloat']
      | undefined
      | null
      | Variable<any, string>;
    _neq?:
      | ValueTypes['GraphQLStringOrFloat']
      | undefined
      | null
      | Variable<any, string>;
    _in?:
      | Array<ValueTypes['GraphQLStringOrFloat'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _nin?:
      | Array<ValueTypes['GraphQLStringOrFloat'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _gt?:
      | ValueTypes['GraphQLStringOrFloat']
      | undefined
      | null
      | Variable<any, string>;
    _gte?:
      | ValueTypes['GraphQLStringOrFloat']
      | undefined
      | null
      | Variable<any, string>;
    _lt?:
      | ValueTypes['GraphQLStringOrFloat']
      | undefined
      | null
      | Variable<any, string>;
    _lte?:
      | ValueTypes['GraphQLStringOrFloat']
      | undefined
      | null
      | Variable<any, string>;
    _null?: boolean | undefined | null | Variable<any, string>;
    _nnull?: boolean | undefined | null | Variable<any, string>;
    _between?:
      | Array<ValueTypes['GraphQLStringOrFloat'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _nbetween?:
      | Array<ValueTypes['GraphQLStringOrFloat'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  /** A Float or a String */
  ['GraphQLStringOrFloat']: unknown;
  ['directus_roles_filter']: {
    id?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    name?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    icon?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    description?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    ip_access?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    enforce_tfa?:
      | ValueTypes['boolean_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    admin_access?:
      | ValueTypes['boolean_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    app_access?:
      | ValueTypes['boolean_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    users?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    users_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['directus_roles_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['directus_roles_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['boolean_filter_operators']: {
    _eq?: boolean | undefined | null | Variable<any, string>;
    _neq?: boolean | undefined | null | Variable<any, string>;
    _null?: boolean | undefined | null | Variable<any, string>;
    _nnull?: boolean | undefined | null | Variable<any, string>;
  };
  ['date_filter_operators']: {
    _eq?: string | undefined | null | Variable<any, string>;
    _neq?: string | undefined | null | Variable<any, string>;
    _gt?: string | undefined | null | Variable<any, string>;
    _gte?: string | undefined | null | Variable<any, string>;
    _lt?: string | undefined | null | Variable<any, string>;
    _lte?: string | undefined | null | Variable<any, string>;
    _null?: boolean | undefined | null | Variable<any, string>;
    _nnull?: boolean | undefined | null | Variable<any, string>;
    _in?:
      | Array<string | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _nin?:
      | Array<string | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _between?:
      | Array<ValueTypes['GraphQLStringOrFloat'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _nbetween?:
      | Array<ValueTypes['GraphQLStringOrFloat'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['datetime_function_filter_operators']: {
    year?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    month?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    week?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    day?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    weekday?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    hour?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    minute?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    second?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['collaborators_filter']: {
    account?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    date_created?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    date_created_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    date_updated?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    date_updated_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    display_name?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    payment_eth_address?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    role?:
      | ValueTypes['collaborator_roles_filter']
      | undefined
      | null
      | Variable<any, string>;
    user_created?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['collaborators_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['collaborators_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['collaborator_roles_filter']: {
    description?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    name?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['collaborator_roles_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['collaborator_roles_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['junction_directus_users_skills_filter']: {
    directus_users_id?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    skills_id?:
      | ValueTypes['skills_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<
          ValueTypes['junction_directus_users_skills_filter'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<
          ValueTypes['junction_directus_users_skills_filter'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['skills_filter']: {
    description?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    name?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['skills_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['skills_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_roles']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    ip_access?: boolean | `@${string}`;
    enforce_tfa?: boolean | `@${string}`;
    admin_access?: boolean | `@${string}`;
    app_access?: boolean | `@${string}`;
    users?: [
      {
        filter?:
          | ValueTypes['directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    users_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborators']: AliasType<{
    account?: [
      {
        filter?:
          | ValueTypes['directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    date_created?: boolean | `@${string}`;
    date_created_func?: ValueTypes['datetime_functions'];
    date_updated?: boolean | `@${string}`;
    date_updated_func?: ValueTypes['datetime_functions'];
    display_name?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    payment_eth_address?: boolean | `@${string}`;
    role?: [
      {
        filter?:
          | ValueTypes['collaborator_roles_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['collaborator_roles'],
    ];
    user_created?: [
      {
        filter?:
          | ValueTypes['directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborator_roles']: AliasType<{
    description?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['junction_directus_users_skills']: AliasType<{
    directus_users_id?: [
      {
        filter?:
          | ValueTypes['directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    id?: boolean | `@${string}`;
    skills_id?: [
      {
        filter?:
          | ValueTypes['skills_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['skills'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['skills']: AliasType<{
    description?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** BigInt value */
  ['GraphQLBigInt']: unknown;
  ['products']: AliasType<{
    brand_id?: [
      {
        filter?:
          | ValueTypes['brands_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['brands'],
    ];
    clo3d_file?: [
      {
        filter?:
          | ValueTypes['directus_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    created_at?: boolean | `@${string}`;
    created_at_func?: ValueTypes['datetime_functions'];
    description?: boolean | `@${string}`;
    discord_channel_id?: boolean | `@${string}`;
    fulfiller_id?: [
      {
        filter?:
          | ValueTypes['fulfillers_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['fulfillers'],
    ];
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    nft_token_id?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    price?: [
      {
        filter?:
          | ValueTypes['price_currencies_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['price_currencies'],
    ];
    producer_id?: [
      {
        filter?:
          | ValueTypes['producers_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['producers'],
    ];
    product_stage?: [
      {
        filter?:
          | ValueTypes['stages_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['stages'],
    ];
    production_cost?: boolean | `@${string}`;
    quantity?: boolean | `@${string}`;
    release_date?: boolean | `@${string}`;
    release_date_func?: ValueTypes['datetime_functions'];
    sale_currency?: [
      {
        filter?:
          | ValueTypes['currencies_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['currencies'],
    ];
    sale_price?: boolean | `@${string}`;
    sale_type?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    shopify_id?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    notes?: boolean | `@${string}`;
    date_updated?: boolean | `@${string}`;
    date_updated_func?: ValueTypes['datetime_functions'];
    html_file?: [
      {
        filter?:
          | ValueTypes['directus_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    thumbnail?: [
      {
        filter?:
          | ValueTypes['directus_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    vrm_file?: [
      {
        filter?:
          | ValueTypes['directus_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    contributors?: [
      {
        filter?:
          | ValueTypes['products_contributors_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products_contributors'],
    ];
    contributors_func?: ValueTypes['count_functions'];
    materials?: [
      {
        filter?:
          | ValueTypes['products_production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products_production_materials'],
    ];
    materials_func?: ValueTypes['count_functions'];
    design_files?: [
      {
        filter?:
          | ValueTypes['products_design_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products_design_files'],
    ];
    design_files_func?: ValueTypes['count_functions'];
    content?: [
      {
        filter?:
          | ValueTypes['products_content_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products_content'],
    ];
    content_func?: ValueTypes['count_functions'];
    images?: [
      {
        filter?:
          | ValueTypes['products_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products_files'],
    ];
    images_func?: ValueTypes['count_functions'];
    wearable_files?: [
      {
        filter?:
          | ValueTypes['products_wearables_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products_wearables'],
    ];
    wearable_files_func?: ValueTypes['count_functions'];
    production_methods?: [
      {
        filter?:
          | ValueTypes['products_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products_production_methods'],
    ];
    production_methods_func?: ValueTypes['count_functions'];
    client_invoices?: [
      {
        filter?:
          | ValueTypes['invoices_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['invoices'],
    ];
    client_invoices_func?: ValueTypes['count_functions'];
    production_invoices?: [
      {
        filter?:
          | ValueTypes['invoices_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['invoices'],
    ];
    production_invoices_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_filter']: {
    created_at?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    created_at_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    description?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    discord_url?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    eth_address?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    logo?:
      | ValueTypes['directus_files_filter']
      | undefined
      | null
      | Variable<any, string>;
    name?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    notion_id?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    twitter_url?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    website_url?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    products?:
      | ValueTypes['products_filter']
      | undefined
      | null
      | Variable<any, string>;
    products_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    users?:
      | ValueTypes['brands_directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    users_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['brands_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['brands_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['products_filter']: {
    brand_id?:
      | ValueTypes['brands_filter']
      | undefined
      | null
      | Variable<any, string>;
    clo3d_file?:
      | ValueTypes['directus_files_filter']
      | undefined
      | null
      | Variable<any, string>;
    created_at?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    created_at_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    description?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    discord_channel_id?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    fulfiller_id?:
      | ValueTypes['fulfillers_filter']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    name?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    nft_token_id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    notion_id?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    price?:
      | ValueTypes['price_currencies_filter']
      | undefined
      | null
      | Variable<any, string>;
    producer_id?:
      | ValueTypes['producers_filter']
      | undefined
      | null
      | Variable<any, string>;
    product_stage?:
      | ValueTypes['stages_filter']
      | undefined
      | null
      | Variable<any, string>;
    production_cost?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    quantity?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    release_date?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    release_date_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    sale_currency?:
      | ValueTypes['currencies_filter']
      | undefined
      | null
      | Variable<any, string>;
    sale_price?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    sale_type?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    season?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    shopify_id?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    status?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    notes?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    date_updated?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    date_updated_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    html_file?:
      | ValueTypes['directus_files_filter']
      | undefined
      | null
      | Variable<any, string>;
    thumbnail?:
      | ValueTypes['directus_files_filter']
      | undefined
      | null
      | Variable<any, string>;
    vrm_file?:
      | ValueTypes['directus_files_filter']
      | undefined
      | null
      | Variable<any, string>;
    contributors?:
      | ValueTypes['products_contributors_filter']
      | undefined
      | null
      | Variable<any, string>;
    contributors_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    materials?:
      | ValueTypes['products_production_materials_filter']
      | undefined
      | null
      | Variable<any, string>;
    materials_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    design_files?:
      | ValueTypes['products_design_files_filter']
      | undefined
      | null
      | Variable<any, string>;
    design_files_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    content?:
      | ValueTypes['products_content_filter']
      | undefined
      | null
      | Variable<any, string>;
    content_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    images?:
      | ValueTypes['products_files_filter']
      | undefined
      | null
      | Variable<any, string>;
    images_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    wearable_files?:
      | ValueTypes['products_wearables_filter']
      | undefined
      | null
      | Variable<any, string>;
    wearable_files_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    production_methods?:
      | ValueTypes['products_production_methods_filter']
      | undefined
      | null
      | Variable<any, string>;
    production_methods_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    client_invoices?:
      | ValueTypes['invoices_filter']
      | undefined
      | null
      | Variable<any, string>;
    client_invoices_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    production_invoices?:
      | ValueTypes['invoices_filter']
      | undefined
      | null
      | Variable<any, string>;
    production_invoices_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['products_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['products_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['fulfillers_filter']: {
    address?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    created_at?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    created_at_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    email?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    eth_address?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    name?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    website_url?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['fulfillers_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['fulfillers_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['price_currencies_filter']: {
    amount?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    currency?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['price_currencies_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['price_currencies_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['producers_filter']: {
    created_at?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    created_at_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    email?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    eth_address?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    name?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    shipping_address?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    production_materials_stocked?:
      | ValueTypes['producers_production_materials_filter']
      | undefined
      | null
      | Variable<any, string>;
    production_materials_stocked_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    production_methods?:
      | ValueTypes['producers_production_methods_filter']
      | undefined
      | null
      | Variable<any, string>;
    production_methods_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    supplied_materials?:
      | ValueTypes['production_materials_filter']
      | undefined
      | null
      | Variable<any, string>;
    supplied_materials_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['producers_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['producers_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['producers_production_materials_filter']: {
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    producers_id?:
      | ValueTypes['producers_filter']
      | undefined
      | null
      | Variable<any, string>;
    production_materials_id?:
      | ValueTypes['production_materials_filter']
      | undefined
      | null
      | Variable<any, string>;
    quantity?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<
          ValueTypes['producers_production_materials_filter'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<
          ValueTypes['producers_production_materials_filter'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['production_materials_filter']: {
    base_price?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    color_palette?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    color_palette_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    composition?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    created_at?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    created_at_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    created_by?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    description?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    gender?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    made_in?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    name?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    neck_tag?:
      | ValueTypes['boolean_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    note?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    rating?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    size_guide?:
      | ValueTypes['directus_files_filter']
      | undefined
      | null
      | Variable<any, string>;
    supplier?:
      | ValueTypes['producers_filter']
      | undefined
      | null
      | Variable<any, string>;
    tags?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    tags_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    production_methods?:
      | ValueTypes['production_materials_production_methods_filter']
      | undefined
      | null
      | Variable<any, string>;
    production_methods_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    stocked_at?:
      | ValueTypes['producers_production_materials_filter']
      | undefined
      | null
      | Variable<any, string>;
    stocked_at_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    base_assets?:
      | ValueTypes['production_materials_files_filter']
      | undefined
      | null
      | Variable<any, string>;
    base_assets_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['production_materials_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['production_materials_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['production_materials_production_methods_filter']: {
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    production_materials_id?:
      | ValueTypes['production_materials_filter']
      | undefined
      | null
      | Variable<any, string>;
    production_methods_id?:
      | ValueTypes['production_methods_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['production_methods_filter']: {
    created_at?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    created_at_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    description?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    name?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    producers?:
      | ValueTypes['producers_production_methods_filter']
      | undefined
      | null
      | Variable<any, string>;
    producers_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    production_materials?:
      | ValueTypes['production_materials_production_methods_filter']
      | undefined
      | null
      | Variable<any, string>;
    production_materials_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['production_methods_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['production_methods_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['producers_production_methods_filter']: {
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    producers_id?:
      | ValueTypes['producers_filter']
      | undefined
      | null
      | Variable<any, string>;
    production_methods_id?:
      | ValueTypes['production_methods_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<
          ValueTypes['producers_production_methods_filter'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<
          ValueTypes['producers_production_methods_filter'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['production_materials_files_filter']: {
    directus_files_id?:
      | ValueTypes['directus_files_filter']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    production_materials_id?:
      | ValueTypes['production_materials_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<
          ValueTypes['production_materials_files_filter'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<
          ValueTypes['production_materials_files_filter'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['stages_filter']: {
    description?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    name?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    sort?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['stages_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['stages_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['currencies_filter']: {
    currency?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['currencies_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['currencies_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['products_contributors_filter']: {
    collaborators_id?:
      | ValueTypes['collaborators_filter']
      | undefined
      | null
      | Variable<any, string>;
    contribution_share?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    products_id?:
      | ValueTypes['products_filter']
      | undefined
      | null
      | Variable<any, string>;
    robot_earned?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['products_contributors_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['products_contributors_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['products_production_materials_filter']: {
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    production_materials_id?:
      | ValueTypes['production_materials_filter']
      | undefined
      | null
      | Variable<any, string>;
    products_id?:
      | ValueTypes['products_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<
          ValueTypes['products_production_materials_filter'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<
          ValueTypes['products_production_materials_filter'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['products_design_files_filter']: {
    directus_files_id?:
      | ValueTypes['directus_files_filter']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    products_id?:
      | ValueTypes['products_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['products_design_files_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['products_design_files_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['products_content_filter']: {
    directus_files_id?:
      | ValueTypes['directus_files_filter']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    products_id?:
      | ValueTypes['products_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['products_content_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['products_content_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['products_files_filter']: {
    directus_files_id?:
      | ValueTypes['directus_files_filter']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    products_id?:
      | ValueTypes['products_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['products_files_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['products_files_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['products_wearables_filter']: {
    directus_files_id?:
      | ValueTypes['directus_files_filter']
      | undefined
      | null
      | Variable<any, string>;
    file_format?:
      | ValueTypes['file_formats_filter']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    primary?:
      | ValueTypes['boolean_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    products_id?:
      | ValueTypes['products_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['products_wearables_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['products_wearables_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['file_formats_filter']: {
    description?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    extension?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    mime_type?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    name?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['file_formats_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['file_formats_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['products_production_methods_filter']: {
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    production_methods_id?:
      | ValueTypes['production_methods_filter']
      | undefined
      | null
      | Variable<any, string>;
    products_id?:
      | ValueTypes['products_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<
          ValueTypes['products_production_methods_filter'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<
          ValueTypes['products_production_methods_filter'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['invoices_filter']: {
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    user_created?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    date_created?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    date_created_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    user_updated?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    date_updated?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    date_updated_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    details?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    description?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    status?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    amount?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    transaction_url?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    production_product_id?:
      | ValueTypes['products_filter']
      | undefined
      | null
      | Variable<any, string>;
    client_product_id?:
      | ValueTypes['products_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['invoices_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['invoices_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['brands_directus_users_filter']: {
    brands_id?:
      | ValueTypes['brands_filter']
      | undefined
      | null
      | Variable<any, string>;
    directus_users_id?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['brands_directus_users_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['brands_directus_users_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['fulfillers']: AliasType<{
    address?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    created_at_func?: ValueTypes['datetime_functions'];
    email?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    website_url?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['price_currencies']: AliasType<{
    amount?: boolean | `@${string}`;
    currency?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['producers']: AliasType<{
    created_at?: boolean | `@${string}`;
    created_at_func?: ValueTypes['datetime_functions'];
    email?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    shipping_address?: boolean | `@${string}`;
    production_materials_stocked?: [
      {
        filter?:
          | ValueTypes['producers_production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['producers_production_materials'],
    ];
    production_materials_stocked_func?: ValueTypes['count_functions'];
    production_methods?: [
      {
        filter?:
          | ValueTypes['producers_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['producers_production_methods'],
    ];
    production_methods_func?: ValueTypes['count_functions'];
    supplied_materials?: [
      {
        filter?:
          | ValueTypes['production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['production_materials'],
    ];
    supplied_materials_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_materials']: AliasType<{
    id?: boolean | `@${string}`;
    producers_id?: [
      {
        filter?:
          | ValueTypes['producers_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['producers'],
    ];
    production_materials_id?: [
      {
        filter?:
          | ValueTypes['production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['production_materials'],
    ];
    quantity?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials']: AliasType<{
    base_price?: boolean | `@${string}`;
    color_palette?: boolean | `@${string}`;
    color_palette_func?: ValueTypes['count_functions'];
    composition?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    created_at_func?: ValueTypes['datetime_functions'];
    created_by?: [
      {
        filter?:
          | ValueTypes['directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    description?: boolean | `@${string}`;
    gender?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    made_in?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    neck_tag?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    rating?: boolean | `@${string}`;
    size_guide?: [
      {
        filter?:
          | ValueTypes['directus_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    supplier?: [
      {
        filter?:
          | ValueTypes['producers_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['producers'],
    ];
    tags?: boolean | `@${string}`;
    tags_func?: ValueTypes['count_functions'];
    production_methods?: [
      {
        filter?:
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['production_materials_production_methods'],
    ];
    production_methods_func?: ValueTypes['count_functions'];
    stocked_at?: [
      {
        filter?:
          | ValueTypes['producers_production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['producers_production_materials'],
    ];
    stocked_at_func?: ValueTypes['count_functions'];
    base_assets?: [
      {
        filter?:
          | ValueTypes['production_materials_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['production_materials_files'],
    ];
    base_assets_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_production_methods']: AliasType<{
    id?: boolean | `@${string}`;
    production_materials_id?: [
      {
        filter?:
          | ValueTypes['production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['production_materials'],
    ];
    production_methods_id?: [
      {
        filter?:
          | ValueTypes['production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['production_methods'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['production_methods']: AliasType<{
    created_at?: boolean | `@${string}`;
    created_at_func?: ValueTypes['datetime_functions'];
    description?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    producers?: [
      {
        filter?:
          | ValueTypes['producers_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['producers_production_methods'],
    ];
    producers_func?: ValueTypes['count_functions'];
    production_materials?: [
      {
        filter?:
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['production_materials_production_methods'],
    ];
    production_materials_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_methods']: AliasType<{
    id?: boolean | `@${string}`;
    producers_id?: [
      {
        filter?:
          | ValueTypes['producers_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['producers'],
    ];
    production_methods_id?: [
      {
        filter?:
          | ValueTypes['production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['production_methods'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_files']: AliasType<{
    directus_files_id?: [
      {
        filter?:
          | ValueTypes['directus_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    id?: boolean | `@${string}`;
    production_materials_id?: [
      {
        filter?:
          | ValueTypes['production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['production_materials'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['stages']: AliasType<{
    description?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    sort?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['currencies']: AliasType<{
    currency?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_contributors']: AliasType<{
    collaborators_id?: [
      {
        filter?:
          | ValueTypes['collaborators_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['collaborators'],
    ];
    contribution_share?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    products_id?: [
      {
        filter?:
          | ValueTypes['products_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products'],
    ];
    robot_earned?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_materials']: AliasType<{
    id?: boolean | `@${string}`;
    production_materials_id?: [
      {
        filter?:
          | ValueTypes['production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['production_materials'],
    ];
    products_id?: [
      {
        filter?:
          | ValueTypes['products_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_design_files']: AliasType<{
    directus_files_id?: [
      {
        filter?:
          | ValueTypes['directus_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    id?: boolean | `@${string}`;
    products_id?: [
      {
        filter?:
          | ValueTypes['products_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_content']: AliasType<{
    directus_files_id?: [
      {
        filter?:
          | ValueTypes['directus_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    id?: boolean | `@${string}`;
    products_id?: [
      {
        filter?:
          | ValueTypes['products_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_files']: AliasType<{
    directus_files_id?: [
      {
        filter?:
          | ValueTypes['directus_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    id?: boolean | `@${string}`;
    products_id?: [
      {
        filter?:
          | ValueTypes['products_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_wearables']: AliasType<{
    directus_files_id?: [
      {
        filter?:
          | ValueTypes['directus_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    file_format?: [
      {
        filter?:
          | ValueTypes['file_formats_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['file_formats'],
    ];
    id?: boolean | `@${string}`;
    primary?: boolean | `@${string}`;
    products_id?: [
      {
        filter?:
          | ValueTypes['products_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['file_formats']: AliasType<{
    description?: boolean | `@${string}`;
    extension?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    mime_type?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_methods']: AliasType<{
    id?: boolean | `@${string}`;
    production_methods_id?: [
      {
        filter?:
          | ValueTypes['production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['production_methods'],
    ];
    products_id?: [
      {
        filter?:
          | ValueTypes['products_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['invoices']: AliasType<{
    id?: boolean | `@${string}`;
    user_created?: [
      {
        filter?:
          | ValueTypes['directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    date_created?: boolean | `@${string}`;
    date_created_func?: ValueTypes['datetime_functions'];
    user_updated?: [
      {
        filter?:
          | ValueTypes['directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    date_updated?: boolean | `@${string}`;
    date_updated_func?: ValueTypes['datetime_functions'];
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    /** Invoice amount in USD */
    amount?: boolean | `@${string}`;
    transaction_url?: boolean | `@${string}`;
    production_product_id?: [
      {
        filter?:
          | ValueTypes['products_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products'],
    ];
    client_product_id?: [
      {
        filter?:
          | ValueTypes['products_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_directus_users']: AliasType<{
    brands_id?: [
      {
        filter?:
          | ValueTypes['brands_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['brands'],
    ];
    directus_users_id?: [
      {
        filter?:
          | ValueTypes['directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['brands_aggregated_count'];
    countDistinct?: ValueTypes['brands_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_aggregated_count']: AliasType<{
    created_at?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    discord_url?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    logo?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    twitter_url?: boolean | `@${string}`;
    website_url?: boolean | `@${string}`;
    products?: boolean | `@${string}`;
    users?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_directus_users_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['brands_directus_users_aggregated_count'];
    countDistinct?: ValueTypes['brands_directus_users_aggregated_count'];
    avg?: ValueTypes['brands_directus_users_aggregated_fields'];
    sum?: ValueTypes['brands_directus_users_aggregated_fields'];
    avgDistinct?: ValueTypes['brands_directus_users_aggregated_fields'];
    sumDistinct?: ValueTypes['brands_directus_users_aggregated_fields'];
    min?: ValueTypes['brands_directus_users_aggregated_fields'];
    max?: ValueTypes['brands_directus_users_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_directus_users_aggregated_count']: AliasType<{
    brands_id?: boolean | `@${string}`;
    directus_users_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_directus_users_aggregated_fields']: AliasType<{
    brands_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborators_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['collaborators_aggregated_count'];
    countDistinct?: ValueTypes['collaborators_aggregated_count'];
    avg?: ValueTypes['collaborators_aggregated_fields'];
    sum?: ValueTypes['collaborators_aggregated_fields'];
    avgDistinct?: ValueTypes['collaborators_aggregated_fields'];
    sumDistinct?: ValueTypes['collaborators_aggregated_fields'];
    min?: ValueTypes['collaborators_aggregated_fields'];
    max?: ValueTypes['collaborators_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborators_aggregated_count']: AliasType<{
    account?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    date_updated?: boolean | `@${string}`;
    display_name?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    payment_eth_address?: boolean | `@${string}`;
    role?: boolean | `@${string}`;
    user_created?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborators_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    role?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborator_roles_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['collaborator_roles_aggregated_count'];
    countDistinct?: ValueTypes['collaborator_roles_aggregated_count'];
    avg?: ValueTypes['collaborator_roles_aggregated_fields'];
    sum?: ValueTypes['collaborator_roles_aggregated_fields'];
    avgDistinct?: ValueTypes['collaborator_roles_aggregated_fields'];
    sumDistinct?: ValueTypes['collaborator_roles_aggregated_fields'];
    min?: ValueTypes['collaborator_roles_aggregated_fields'];
    max?: ValueTypes['collaborator_roles_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborator_roles_aggregated_count']: AliasType<{
    description?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborator_roles_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['junction_directus_users_skills_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['junction_directus_users_skills_aggregated_count'];
    countDistinct?: ValueTypes['junction_directus_users_skills_aggregated_count'];
    avg?: ValueTypes['junction_directus_users_skills_aggregated_fields'];
    sum?: ValueTypes['junction_directus_users_skills_aggregated_fields'];
    avgDistinct?: ValueTypes['junction_directus_users_skills_aggregated_fields'];
    sumDistinct?: ValueTypes['junction_directus_users_skills_aggregated_fields'];
    min?: ValueTypes['junction_directus_users_skills_aggregated_fields'];
    max?: ValueTypes['junction_directus_users_skills_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['junction_directus_users_skills_aggregated_count']: AliasType<{
    directus_users_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    skills_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['junction_directus_users_skills_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    skills_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['skills_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['skills_aggregated_count'];
    countDistinct?: ValueTypes['skills_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['skills_aggregated_count']: AliasType<{
    description?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['producers_aggregated_count'];
    countDistinct?: ValueTypes['producers_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_aggregated_count']: AliasType<{
    created_at?: boolean | `@${string}`;
    email?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    shipping_address?: boolean | `@${string}`;
    /** List of production materials in this producers inventory */
    production_materials_stocked?: boolean | `@${string}`;
    production_methods?: boolean | `@${string}`;
    /** Production materials manufactured / sourced by this producer */
    supplied_materials?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_materials_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['producers_production_materials_aggregated_count'];
    countDistinct?: ValueTypes['producers_production_materials_aggregated_count'];
    avg?: ValueTypes['producers_production_materials_aggregated_fields'];
    sum?: ValueTypes['producers_production_materials_aggregated_fields'];
    avgDistinct?: ValueTypes['producers_production_materials_aggregated_fields'];
    sumDistinct?: ValueTypes['producers_production_materials_aggregated_fields'];
    min?: ValueTypes['producers_production_materials_aggregated_fields'];
    max?: ValueTypes['producers_production_materials_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_materials_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    producers_id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    quantity?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_materials_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    producers_id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    quantity?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_methods_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['producers_production_methods_aggregated_count'];
    countDistinct?: ValueTypes['producers_production_methods_aggregated_count'];
    avg?: ValueTypes['producers_production_methods_aggregated_fields'];
    sum?: ValueTypes['producers_production_methods_aggregated_fields'];
    avgDistinct?: ValueTypes['producers_production_methods_aggregated_fields'];
    sumDistinct?: ValueTypes['producers_production_methods_aggregated_fields'];
    min?: ValueTypes['producers_production_methods_aggregated_fields'];
    max?: ValueTypes['producers_production_methods_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_methods_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    producers_id?: boolean | `@${string}`;
    production_methods_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_methods_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    producers_id?: boolean | `@${string}`;
    production_methods_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_methods_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['production_methods_aggregated_count'];
    countDistinct?: ValueTypes['production_methods_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['production_methods_aggregated_count']: AliasType<{
    created_at?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    /** List of producers that are cable of this production method */
    producers?: boolean | `@${string}`;
    production_materials?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_production_methods_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['production_materials_production_methods_aggregated_count'];
    countDistinct?: ValueTypes['production_materials_production_methods_aggregated_count'];
    avg?: ValueTypes['production_materials_production_methods_aggregated_fields'];
    sum?: ValueTypes['production_materials_production_methods_aggregated_fields'];
    avgDistinct?: ValueTypes['production_materials_production_methods_aggregated_fields'];
    sumDistinct?: ValueTypes['production_materials_production_methods_aggregated_fields'];
    min?: ValueTypes['production_materials_production_methods_aggregated_fields'];
    max?: ValueTypes['production_materials_production_methods_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_production_methods_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    production_methods_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_production_methods_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    production_methods_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['fulfillers_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['fulfillers_aggregated_count'];
    countDistinct?: ValueTypes['fulfillers_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['fulfillers_aggregated_count']: AliasType<{
    address?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    email?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    website_url?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['price_currencies_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['price_currencies_aggregated_count'];
    countDistinct?: ValueTypes['price_currencies_aggregated_count'];
    avg?: ValueTypes['price_currencies_aggregated_fields'];
    sum?: ValueTypes['price_currencies_aggregated_fields'];
    avgDistinct?: ValueTypes['price_currencies_aggregated_fields'];
    sumDistinct?: ValueTypes['price_currencies_aggregated_fields'];
    min?: ValueTypes['price_currencies_aggregated_fields'];
    max?: ValueTypes['price_currencies_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['price_currencies_aggregated_count']: AliasType<{
    amount?: boolean | `@${string}`;
    currency?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['price_currencies_aggregated_fields']: AliasType<{
    amount?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['stages_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['stages_aggregated_count'];
    countDistinct?: ValueTypes['stages_aggregated_count'];
    avg?: ValueTypes['stages_aggregated_fields'];
    sum?: ValueTypes['stages_aggregated_fields'];
    avgDistinct?: ValueTypes['stages_aggregated_fields'];
    sumDistinct?: ValueTypes['stages_aggregated_fields'];
    min?: ValueTypes['stages_aggregated_fields'];
    max?: ValueTypes['stages_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['stages_aggregated_count']: AliasType<{
    description?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    sort?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['stages_aggregated_fields']: AliasType<{
    sort?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['currencies_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['currencies_aggregated_count'];
    countDistinct?: ValueTypes['currencies_aggregated_count'];
    avg?: ValueTypes['currencies_aggregated_fields'];
    sum?: ValueTypes['currencies_aggregated_fields'];
    avgDistinct?: ValueTypes['currencies_aggregated_fields'];
    sumDistinct?: ValueTypes['currencies_aggregated_fields'];
    min?: ValueTypes['currencies_aggregated_fields'];
    max?: ValueTypes['currencies_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['currencies_aggregated_count']: AliasType<{
    currency?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['currencies_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_content_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_content_aggregated_count'];
    countDistinct?: ValueTypes['products_content_aggregated_count'];
    avg?: ValueTypes['products_content_aggregated_fields'];
    sum?: ValueTypes['products_content_aggregated_fields'];
    avgDistinct?: ValueTypes['products_content_aggregated_fields'];
    sumDistinct?: ValueTypes['products_content_aggregated_fields'];
    min?: ValueTypes['products_content_aggregated_fields'];
    max?: ValueTypes['products_content_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_content_aggregated_count']: AliasType<{
    directus_files_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_content_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_contributors_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_contributors_aggregated_count'];
    countDistinct?: ValueTypes['products_contributors_aggregated_count'];
    avg?: ValueTypes['products_contributors_aggregated_fields'];
    sum?: ValueTypes['products_contributors_aggregated_fields'];
    avgDistinct?: ValueTypes['products_contributors_aggregated_fields'];
    sumDistinct?: ValueTypes['products_contributors_aggregated_fields'];
    min?: ValueTypes['products_contributors_aggregated_fields'];
    max?: ValueTypes['products_contributors_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_contributors_aggregated_count']: AliasType<{
    collaborators_id?: boolean | `@${string}`;
    contribution_share?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    robot_earned?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_contributors_aggregated_fields']: AliasType<{
    collaborators_id?: boolean | `@${string}`;
    contribution_share?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    robot_earned?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_design_files_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_design_files_aggregated_count'];
    countDistinct?: ValueTypes['products_design_files_aggregated_count'];
    avg?: ValueTypes['products_design_files_aggregated_fields'];
    sum?: ValueTypes['products_design_files_aggregated_fields'];
    avgDistinct?: ValueTypes['products_design_files_aggregated_fields'];
    sumDistinct?: ValueTypes['products_design_files_aggregated_fields'];
    min?: ValueTypes['products_design_files_aggregated_fields'];
    max?: ValueTypes['products_design_files_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_design_files_aggregated_count']: AliasType<{
    directus_files_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_design_files_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_files_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_files_aggregated_count'];
    countDistinct?: ValueTypes['products_files_aggregated_count'];
    avg?: ValueTypes['products_files_aggregated_fields'];
    sum?: ValueTypes['products_files_aggregated_fields'];
    avgDistinct?: ValueTypes['products_files_aggregated_fields'];
    sumDistinct?: ValueTypes['products_files_aggregated_fields'];
    min?: ValueTypes['products_files_aggregated_fields'];
    max?: ValueTypes['products_files_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_files_aggregated_count']: AliasType<{
    directus_files_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_files_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_materials_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_production_materials_aggregated_count'];
    countDistinct?: ValueTypes['products_production_materials_aggregated_count'];
    avg?: ValueTypes['products_production_materials_aggregated_fields'];
    sum?: ValueTypes['products_production_materials_aggregated_fields'];
    avgDistinct?: ValueTypes['products_production_materials_aggregated_fields'];
    sumDistinct?: ValueTypes['products_production_materials_aggregated_fields'];
    min?: ValueTypes['products_production_materials_aggregated_fields'];
    max?: ValueTypes['products_production_materials_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_materials_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_materials_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_methods_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_production_methods_aggregated_count'];
    countDistinct?: ValueTypes['products_production_methods_aggregated_count'];
    avg?: ValueTypes['products_production_methods_aggregated_fields'];
    sum?: ValueTypes['products_production_methods_aggregated_fields'];
    avgDistinct?: ValueTypes['products_production_methods_aggregated_fields'];
    sumDistinct?: ValueTypes['products_production_methods_aggregated_fields'];
    min?: ValueTypes['products_production_methods_aggregated_fields'];
    max?: ValueTypes['products_production_methods_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_methods_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    production_methods_id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_methods_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    production_methods_id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_wearables_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_wearables_aggregated_count'];
    countDistinct?: ValueTypes['products_wearables_aggregated_count'];
    avg?: ValueTypes['products_wearables_aggregated_fields'];
    sum?: ValueTypes['products_wearables_aggregated_fields'];
    avgDistinct?: ValueTypes['products_wearables_aggregated_fields'];
    sumDistinct?: ValueTypes['products_wearables_aggregated_fields'];
    min?: ValueTypes['products_wearables_aggregated_fields'];
    max?: ValueTypes['products_wearables_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_wearables_aggregated_count']: AliasType<{
    directus_files_id?: boolean | `@${string}`;
    file_format?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    primary?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_wearables_aggregated_fields']: AliasType<{
    file_format?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['file_formats_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['file_formats_aggregated_count'];
    countDistinct?: ValueTypes['file_formats_aggregated_count'];
    avg?: ValueTypes['file_formats_aggregated_fields'];
    sum?: ValueTypes['file_formats_aggregated_fields'];
    avgDistinct?: ValueTypes['file_formats_aggregated_fields'];
    sumDistinct?: ValueTypes['file_formats_aggregated_fields'];
    min?: ValueTypes['file_formats_aggregated_fields'];
    max?: ValueTypes['file_formats_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['file_formats_aggregated_count']: AliasType<{
    description?: boolean | `@${string}`;
    extension?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    mime_type?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['file_formats_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_aggregated_count'];
    countDistinct?: ValueTypes['products_aggregated_count'];
    avg?: ValueTypes['products_aggregated_fields'];
    sum?: ValueTypes['products_aggregated_fields'];
    avgDistinct?: ValueTypes['products_aggregated_fields'];
    sumDistinct?: ValueTypes['products_aggregated_fields'];
    min?: ValueTypes['products_aggregated_fields'];
    max?: ValueTypes['products_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_aggregated_count']: AliasType<{
    brand_id?: boolean | `@${string}`;
    clo3d_file?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    discord_channel_id?: boolean | `@${string}`;
    fulfiller_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    nft_token_id?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    price?: boolean | `@${string}`;
    producer_id?: boolean | `@${string}`;
    product_stage?: boolean | `@${string}`;
    production_cost?: boolean | `@${string}`;
    quantity?: boolean | `@${string}`;
    release_date?: boolean | `@${string}`;
    sale_currency?: boolean | `@${string}`;
    sale_price?: boolean | `@${string}`;
    sale_type?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    shopify_id?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    notes?: boolean | `@${string}`;
    date_updated?: boolean | `@${string}`;
    html_file?: boolean | `@${string}`;
    thumbnail?: boolean | `@${string}`;
    vrm_file?: boolean | `@${string}`;
    contributors?: boolean | `@${string}`;
    materials?: boolean | `@${string}`;
    design_files?: boolean | `@${string}`;
    content?: boolean | `@${string}`;
    images?: boolean | `@${string}`;
    wearable_files?: boolean | `@${string}`;
    production_methods?: boolean | `@${string}`;
    /** Invoices to clients for deposits */
    client_invoices?: boolean | `@${string}`;
    /** Invoices from producers for production costs */
    production_invoices?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_aggregated_fields']: AliasType<{
    brand_id?: boolean | `@${string}`;
    fulfiller_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    nft_token_id?: boolean | `@${string}`;
    price?: boolean | `@${string}`;
    producer_id?: boolean | `@${string}`;
    production_cost?: boolean | `@${string}`;
    quantity?: boolean | `@${string}`;
    sale_currency?: boolean | `@${string}`;
    sale_price?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['production_materials_aggregated_count'];
    countDistinct?: ValueTypes['production_materials_aggregated_count'];
    avg?: ValueTypes['production_materials_aggregated_fields'];
    sum?: ValueTypes['production_materials_aggregated_fields'];
    avgDistinct?: ValueTypes['production_materials_aggregated_fields'];
    sumDistinct?: ValueTypes['production_materials_aggregated_fields'];
    min?: ValueTypes['production_materials_aggregated_fields'];
    max?: ValueTypes['production_materials_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_aggregated_count']: AliasType<{
    base_price?: boolean | `@${string}`;
    color_palette?: boolean | `@${string}`;
    composition?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    created_by?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    gender?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    made_in?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    neck_tag?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    rating?: boolean | `@${string}`;
    size_guide?: boolean | `@${string}`;
    supplier?: boolean | `@${string}`;
    tags?: boolean | `@${string}`;
    production_methods?: boolean | `@${string}`;
    stocked_at?: boolean | `@${string}`;
    /** Design files, mockups, base meshes for wearbles, CLO3d files, etc */
    base_assets?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_aggregated_fields']: AliasType<{
    base_price?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    supplier?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['invoices_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['invoices_aggregated_count'];
    countDistinct?: ValueTypes['invoices_aggregated_count'];
    avg?: ValueTypes['invoices_aggregated_fields'];
    sum?: ValueTypes['invoices_aggregated_fields'];
    avgDistinct?: ValueTypes['invoices_aggregated_fields'];
    sumDistinct?: ValueTypes['invoices_aggregated_fields'];
    min?: ValueTypes['invoices_aggregated_fields'];
    max?: ValueTypes['invoices_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['invoices_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    user_created?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    user_updated?: boolean | `@${string}`;
    date_updated?: boolean | `@${string}`;
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    /** Invoice amount in USD */
    amount?: boolean | `@${string}`;
    transaction_url?: boolean | `@${string}`;
    /** The product that this production invoice is for */
    production_product_id?: boolean | `@${string}`;
    /** Invoices to clients for a given product */
    client_product_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['invoices_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    /** Invoice amount in USD */
    amount?: boolean | `@${string}`;
    /** The product that this production invoice is for */
    production_product_id?: boolean | `@${string}`;
    /** Invoices to clients for a given product */
    client_product_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_files_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['production_materials_files_aggregated_count'];
    countDistinct?: ValueTypes['production_materials_files_aggregated_count'];
    avg?: ValueTypes['production_materials_files_aggregated_fields'];
    sum?: ValueTypes['production_materials_files_aggregated_fields'];
    avgDistinct?: ValueTypes['production_materials_files_aggregated_fields'];
    sumDistinct?: ValueTypes['production_materials_files_aggregated_fields'];
    min?: ValueTypes['production_materials_files_aggregated_fields'];
    max?: ValueTypes['production_materials_files_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_files_aggregated_count']: AliasType<{
    directus_files_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_files_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['Mutation']: AliasType<{
    create_brands_items?: [
      {
        filter?:
          | ValueTypes['brands_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_brands_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['brands'],
    ];
    create_brands_item?: [
      { data: ValueTypes['create_brands_input'] | Variable<any, string> },
      ValueTypes['brands'],
    ];
    create_brands_directus_users_items?: [
      {
        filter?:
          | ValueTypes['brands_directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_brands_directus_users_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['brands_directus_users'],
    ];
    create_brands_directus_users_item?: [
      {
        data:
          | ValueTypes['create_brands_directus_users_input']
          | Variable<any, string>;
      },
      ValueTypes['brands_directus_users'],
    ];
    create_collaborators_items?: [
      {
        filter?:
          | ValueTypes['collaborators_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_collaborators_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['collaborators'],
    ];
    create_collaborators_item?: [
      {
        data: ValueTypes['create_collaborators_input'] | Variable<any, string>;
      },
      ValueTypes['collaborators'],
    ];
    create_collaborator_roles_items?: [
      {
        filter?:
          | ValueTypes['collaborator_roles_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_collaborator_roles_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['collaborator_roles'],
    ];
    create_collaborator_roles_item?: [
      {
        data:
          | ValueTypes['create_collaborator_roles_input']
          | Variable<any, string>;
      },
      ValueTypes['collaborator_roles'],
    ];
    create_junction_directus_users_skills_items?: [
      {
        filter?:
          | ValueTypes['junction_directus_users_skills_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_junction_directus_users_skills_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['junction_directus_users_skills'],
    ];
    create_junction_directus_users_skills_item?: [
      {
        data:
          | ValueTypes['create_junction_directus_users_skills_input']
          | Variable<any, string>;
      },
      ValueTypes['junction_directus_users_skills'],
    ];
    create_skills_items?: [
      {
        filter?:
          | ValueTypes['skills_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_skills_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['skills'],
    ];
    create_skills_item?: [
      { data: ValueTypes['create_skills_input'] | Variable<any, string> },
      ValueTypes['skills'],
    ];
    create_producers_items?: [
      {
        filter?:
          | ValueTypes['producers_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_producers_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['producers'],
    ];
    create_producers_item?: [
      { data: ValueTypes['create_producers_input'] | Variable<any, string> },
      ValueTypes['producers'],
    ];
    create_producers_production_materials_items?: [
      {
        filter?:
          | ValueTypes['producers_production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_producers_production_materials_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['producers_production_materials'],
    ];
    create_producers_production_materials_item?: [
      {
        data:
          | ValueTypes['create_producers_production_materials_input']
          | Variable<any, string>;
      },
      ValueTypes['producers_production_materials'],
    ];
    create_producers_production_methods_items?: [
      {
        filter?:
          | ValueTypes['producers_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_producers_production_methods_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['producers_production_methods'],
    ];
    create_producers_production_methods_item?: [
      {
        data:
          | ValueTypes['create_producers_production_methods_input']
          | Variable<any, string>;
      },
      ValueTypes['producers_production_methods'],
    ];
    create_production_methods_items?: [
      {
        filter?:
          | ValueTypes['production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_production_methods_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['production_methods'],
    ];
    create_production_methods_item?: [
      {
        data:
          | ValueTypes['create_production_methods_input']
          | Variable<any, string>;
      },
      ValueTypes['production_methods'],
    ];
    create_production_materials_production_methods_items?: [
      {
        filter?:
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<
              ValueTypes['create_production_materials_production_methods_input']
            >
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['production_materials_production_methods'],
    ];
    create_production_materials_production_methods_item?: [
      {
        data:
          | ValueTypes['create_production_materials_production_methods_input']
          | Variable<any, string>;
      },
      ValueTypes['production_materials_production_methods'],
    ];
    create_fulfillers_items?: [
      {
        filter?:
          | ValueTypes['fulfillers_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_fulfillers_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['fulfillers'],
    ];
    create_fulfillers_item?: [
      { data: ValueTypes['create_fulfillers_input'] | Variable<any, string> },
      ValueTypes['fulfillers'],
    ];
    create_price_currencies_items?: [
      {
        filter?:
          | ValueTypes['price_currencies_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_price_currencies_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['price_currencies'],
    ];
    create_price_currencies_item?: [
      {
        data:
          | ValueTypes['create_price_currencies_input']
          | Variable<any, string>;
      },
      ValueTypes['price_currencies'],
    ];
    create_stages_items?: [
      {
        filter?:
          | ValueTypes['stages_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_stages_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['stages'],
    ];
    create_stages_item?: [
      { data: ValueTypes['create_stages_input'] | Variable<any, string> },
      ValueTypes['stages'],
    ];
    create_currencies_items?: [
      {
        filter?:
          | ValueTypes['currencies_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_currencies_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['currencies'],
    ];
    create_currencies_item?: [
      { data: ValueTypes['create_currencies_input'] | Variable<any, string> },
      ValueTypes['currencies'],
    ];
    create_products_content_items?: [
      {
        filter?:
          | ValueTypes['products_content_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_products_content_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_content'],
    ];
    create_products_content_item?: [
      {
        data:
          | ValueTypes['create_products_content_input']
          | Variable<any, string>;
      },
      ValueTypes['products_content'],
    ];
    create_products_contributors_items?: [
      {
        filter?:
          | ValueTypes['products_contributors_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_products_contributors_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_contributors'],
    ];
    create_products_contributors_item?: [
      {
        data:
          | ValueTypes['create_products_contributors_input']
          | Variable<any, string>;
      },
      ValueTypes['products_contributors'],
    ];
    create_products_design_files_items?: [
      {
        filter?:
          | ValueTypes['products_design_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_products_design_files_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_design_files'],
    ];
    create_products_design_files_item?: [
      {
        data:
          | ValueTypes['create_products_design_files_input']
          | Variable<any, string>;
      },
      ValueTypes['products_design_files'],
    ];
    create_products_files_items?: [
      {
        filter?:
          | ValueTypes['products_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_products_files_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_files'],
    ];
    create_products_files_item?: [
      {
        data: ValueTypes['create_products_files_input'] | Variable<any, string>;
      },
      ValueTypes['products_files'],
    ];
    create_products_production_materials_items?: [
      {
        filter?:
          | ValueTypes['products_production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_products_production_materials_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_production_materials'],
    ];
    create_products_production_materials_item?: [
      {
        data:
          | ValueTypes['create_products_production_materials_input']
          | Variable<any, string>;
      },
      ValueTypes['products_production_materials'],
    ];
    create_products_production_methods_items?: [
      {
        filter?:
          | ValueTypes['products_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_products_production_methods_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_production_methods'],
    ];
    create_products_production_methods_item?: [
      {
        data:
          | ValueTypes['create_products_production_methods_input']
          | Variable<any, string>;
      },
      ValueTypes['products_production_methods'],
    ];
    create_products_wearables_items?: [
      {
        filter?:
          | ValueTypes['products_wearables_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_products_wearables_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_wearables'],
    ];
    create_products_wearables_item?: [
      {
        data:
          | ValueTypes['create_products_wearables_input']
          | Variable<any, string>;
      },
      ValueTypes['products_wearables'],
    ];
    create_file_formats_items?: [
      {
        filter?:
          | ValueTypes['file_formats_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_file_formats_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['file_formats'],
    ];
    create_file_formats_item?: [
      { data: ValueTypes['create_file_formats_input'] | Variable<any, string> },
      ValueTypes['file_formats'],
    ];
    create_products_items?: [
      {
        filter?:
          | ValueTypes['products_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_products_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products'],
    ];
    create_products_item?: [
      { data: ValueTypes['create_products_input'] | Variable<any, string> },
      ValueTypes['products'],
    ];
    create_production_materials_items?: [
      {
        filter?:
          | ValueTypes['production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_production_materials_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['production_materials'],
    ];
    create_production_materials_item?: [
      {
        data:
          | ValueTypes['create_production_materials_input']
          | Variable<any, string>;
      },
      ValueTypes['production_materials'],
    ];
    create_invoices_items?: [
      {
        filter?:
          | ValueTypes['invoices_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_invoices_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['invoices'],
    ];
    create_invoices_item?: [
      { data: ValueTypes['create_invoices_input'] | Variable<any, string> },
      ValueTypes['invoices'],
    ];
    create_production_materials_files_items?: [
      {
        filter?:
          | ValueTypes['production_materials_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['create_production_materials_files_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['production_materials_files'],
    ];
    create_production_materials_files_item?: [
      {
        data:
          | ValueTypes['create_production_materials_files_input']
          | Variable<any, string>;
      },
      ValueTypes['production_materials_files'],
    ];
    update_brands_items?: [
      {
        filter?:
          | ValueTypes['brands_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data: ValueTypes['update_brands_input'] | Variable<any, string>;
      },
      ValueTypes['brands'],
    ];
    update_brands_batch?: [
      {
        filter?:
          | ValueTypes['brands_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_brands_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['brands'],
    ];
    update_brands_item?: [
      {
        id: string | Variable<any, string>;
        data: ValueTypes['update_brands_input'] | Variable<any, string>;
      },
      ValueTypes['brands'],
    ];
    update_brands_directus_users_items?: [
      {
        filter?:
          | ValueTypes['brands_directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_brands_directus_users_input']
          | Variable<any, string>;
      },
      ValueTypes['brands_directus_users'],
    ];
    update_brands_directus_users_batch?: [
      {
        filter?:
          | ValueTypes['brands_directus_users_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_brands_directus_users_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['brands_directus_users'],
    ];
    update_brands_directus_users_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_brands_directus_users_input']
          | Variable<any, string>;
      },
      ValueTypes['brands_directus_users'],
    ];
    update_collaborators_items?: [
      {
        filter?:
          | ValueTypes['collaborators_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data: ValueTypes['update_collaborators_input'] | Variable<any, string>;
      },
      ValueTypes['collaborators'],
    ];
    update_collaborators_batch?: [
      {
        filter?:
          | ValueTypes['collaborators_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_collaborators_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['collaborators'],
    ];
    update_collaborators_item?: [
      {
        id: string | Variable<any, string>;
        data: ValueTypes['update_collaborators_input'] | Variable<any, string>;
      },
      ValueTypes['collaborators'],
    ];
    update_collaborator_roles_items?: [
      {
        filter?:
          | ValueTypes['collaborator_roles_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_collaborator_roles_input']
          | Variable<any, string>;
      },
      ValueTypes['collaborator_roles'],
    ];
    update_collaborator_roles_batch?: [
      {
        filter?:
          | ValueTypes['collaborator_roles_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_collaborator_roles_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['collaborator_roles'],
    ];
    update_collaborator_roles_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_collaborator_roles_input']
          | Variable<any, string>;
      },
      ValueTypes['collaborator_roles'],
    ];
    update_junction_directus_users_skills_items?: [
      {
        filter?:
          | ValueTypes['junction_directus_users_skills_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_junction_directus_users_skills_input']
          | Variable<any, string>;
      },
      ValueTypes['junction_directus_users_skills'],
    ];
    update_junction_directus_users_skills_batch?: [
      {
        filter?:
          | ValueTypes['junction_directus_users_skills_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_junction_directus_users_skills_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['junction_directus_users_skills'],
    ];
    update_junction_directus_users_skills_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_junction_directus_users_skills_input']
          | Variable<any, string>;
      },
      ValueTypes['junction_directus_users_skills'],
    ];
    update_skills_items?: [
      {
        filter?:
          | ValueTypes['skills_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data: ValueTypes['update_skills_input'] | Variable<any, string>;
      },
      ValueTypes['skills'],
    ];
    update_skills_batch?: [
      {
        filter?:
          | ValueTypes['skills_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_skills_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['skills'],
    ];
    update_skills_item?: [
      {
        id: string | Variable<any, string>;
        data: ValueTypes['update_skills_input'] | Variable<any, string>;
      },
      ValueTypes['skills'],
    ];
    update_producers_items?: [
      {
        filter?:
          | ValueTypes['producers_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data: ValueTypes['update_producers_input'] | Variable<any, string>;
      },
      ValueTypes['producers'],
    ];
    update_producers_batch?: [
      {
        filter?:
          | ValueTypes['producers_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_producers_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['producers'],
    ];
    update_producers_item?: [
      {
        id: string | Variable<any, string>;
        data: ValueTypes['update_producers_input'] | Variable<any, string>;
      },
      ValueTypes['producers'],
    ];
    update_producers_production_materials_items?: [
      {
        filter?:
          | ValueTypes['producers_production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_producers_production_materials_input']
          | Variable<any, string>;
      },
      ValueTypes['producers_production_materials'],
    ];
    update_producers_production_materials_batch?: [
      {
        filter?:
          | ValueTypes['producers_production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_producers_production_materials_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['producers_production_materials'],
    ];
    update_producers_production_materials_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_producers_production_materials_input']
          | Variable<any, string>;
      },
      ValueTypes['producers_production_materials'],
    ];
    update_producers_production_methods_items?: [
      {
        filter?:
          | ValueTypes['producers_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_producers_production_methods_input']
          | Variable<any, string>;
      },
      ValueTypes['producers_production_methods'],
    ];
    update_producers_production_methods_batch?: [
      {
        filter?:
          | ValueTypes['producers_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_producers_production_methods_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['producers_production_methods'],
    ];
    update_producers_production_methods_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_producers_production_methods_input']
          | Variable<any, string>;
      },
      ValueTypes['producers_production_methods'],
    ];
    update_production_methods_items?: [
      {
        filter?:
          | ValueTypes['production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_production_methods_input']
          | Variable<any, string>;
      },
      ValueTypes['production_methods'],
    ];
    update_production_methods_batch?: [
      {
        filter?:
          | ValueTypes['production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_production_methods_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['production_methods'],
    ];
    update_production_methods_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_production_methods_input']
          | Variable<any, string>;
      },
      ValueTypes['production_methods'],
    ];
    update_production_materials_production_methods_items?: [
      {
        filter?:
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_production_materials_production_methods_input']
          | Variable<any, string>;
      },
      ValueTypes['production_materials_production_methods'],
    ];
    update_production_materials_production_methods_batch?: [
      {
        filter?:
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<
              ValueTypes['update_production_materials_production_methods_input']
            >
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['production_materials_production_methods'],
    ];
    update_production_materials_production_methods_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_production_materials_production_methods_input']
          | Variable<any, string>;
      },
      ValueTypes['production_materials_production_methods'],
    ];
    update_fulfillers_items?: [
      {
        filter?:
          | ValueTypes['fulfillers_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data: ValueTypes['update_fulfillers_input'] | Variable<any, string>;
      },
      ValueTypes['fulfillers'],
    ];
    update_fulfillers_batch?: [
      {
        filter?:
          | ValueTypes['fulfillers_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_fulfillers_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['fulfillers'],
    ];
    update_fulfillers_item?: [
      {
        id: string | Variable<any, string>;
        data: ValueTypes['update_fulfillers_input'] | Variable<any, string>;
      },
      ValueTypes['fulfillers'],
    ];
    update_price_currencies_items?: [
      {
        filter?:
          | ValueTypes['price_currencies_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_price_currencies_input']
          | Variable<any, string>;
      },
      ValueTypes['price_currencies'],
    ];
    update_price_currencies_batch?: [
      {
        filter?:
          | ValueTypes['price_currencies_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_price_currencies_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['price_currencies'],
    ];
    update_price_currencies_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_price_currencies_input']
          | Variable<any, string>;
      },
      ValueTypes['price_currencies'],
    ];
    update_stages_items?: [
      {
        filter?:
          | ValueTypes['stages_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data: ValueTypes['update_stages_input'] | Variable<any, string>;
      },
      ValueTypes['stages'],
    ];
    update_stages_batch?: [
      {
        filter?:
          | ValueTypes['stages_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_stages_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['stages'],
    ];
    update_stages_item?: [
      {
        id: string | Variable<any, string>;
        data: ValueTypes['update_stages_input'] | Variable<any, string>;
      },
      ValueTypes['stages'],
    ];
    update_currencies_items?: [
      {
        filter?:
          | ValueTypes['currencies_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data: ValueTypes['update_currencies_input'] | Variable<any, string>;
      },
      ValueTypes['currencies'],
    ];
    update_currencies_batch?: [
      {
        filter?:
          | ValueTypes['currencies_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_currencies_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['currencies'],
    ];
    update_currencies_item?: [
      {
        id: string | Variable<any, string>;
        data: ValueTypes['update_currencies_input'] | Variable<any, string>;
      },
      ValueTypes['currencies'],
    ];
    update_products_content_items?: [
      {
        filter?:
          | ValueTypes['products_content_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_products_content_input']
          | Variable<any, string>;
      },
      ValueTypes['products_content'],
    ];
    update_products_content_batch?: [
      {
        filter?:
          | ValueTypes['products_content_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_products_content_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_content'],
    ];
    update_products_content_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_products_content_input']
          | Variable<any, string>;
      },
      ValueTypes['products_content'],
    ];
    update_products_contributors_items?: [
      {
        filter?:
          | ValueTypes['products_contributors_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_products_contributors_input']
          | Variable<any, string>;
      },
      ValueTypes['products_contributors'],
    ];
    update_products_contributors_batch?: [
      {
        filter?:
          | ValueTypes['products_contributors_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_products_contributors_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_contributors'],
    ];
    update_products_contributors_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_products_contributors_input']
          | Variable<any, string>;
      },
      ValueTypes['products_contributors'],
    ];
    update_products_design_files_items?: [
      {
        filter?:
          | ValueTypes['products_design_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_products_design_files_input']
          | Variable<any, string>;
      },
      ValueTypes['products_design_files'],
    ];
    update_products_design_files_batch?: [
      {
        filter?:
          | ValueTypes['products_design_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_products_design_files_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_design_files'],
    ];
    update_products_design_files_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_products_design_files_input']
          | Variable<any, string>;
      },
      ValueTypes['products_design_files'],
    ];
    update_products_files_items?: [
      {
        filter?:
          | ValueTypes['products_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data: ValueTypes['update_products_files_input'] | Variable<any, string>;
      },
      ValueTypes['products_files'],
    ];
    update_products_files_batch?: [
      {
        filter?:
          | ValueTypes['products_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_products_files_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_files'],
    ];
    update_products_files_item?: [
      {
        id: string | Variable<any, string>;
        data: ValueTypes['update_products_files_input'] | Variable<any, string>;
      },
      ValueTypes['products_files'],
    ];
    update_products_production_materials_items?: [
      {
        filter?:
          | ValueTypes['products_production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_products_production_materials_input']
          | Variable<any, string>;
      },
      ValueTypes['products_production_materials'],
    ];
    update_products_production_materials_batch?: [
      {
        filter?:
          | ValueTypes['products_production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_products_production_materials_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_production_materials'],
    ];
    update_products_production_materials_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_products_production_materials_input']
          | Variable<any, string>;
      },
      ValueTypes['products_production_materials'],
    ];
    update_products_production_methods_items?: [
      {
        filter?:
          | ValueTypes['products_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_products_production_methods_input']
          | Variable<any, string>;
      },
      ValueTypes['products_production_methods'],
    ];
    update_products_production_methods_batch?: [
      {
        filter?:
          | ValueTypes['products_production_methods_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_products_production_methods_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_production_methods'],
    ];
    update_products_production_methods_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_products_production_methods_input']
          | Variable<any, string>;
      },
      ValueTypes['products_production_methods'],
    ];
    update_products_wearables_items?: [
      {
        filter?:
          | ValueTypes['products_wearables_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_products_wearables_input']
          | Variable<any, string>;
      },
      ValueTypes['products_wearables'],
    ];
    update_products_wearables_batch?: [
      {
        filter?:
          | ValueTypes['products_wearables_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_products_wearables_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products_wearables'],
    ];
    update_products_wearables_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_products_wearables_input']
          | Variable<any, string>;
      },
      ValueTypes['products_wearables'],
    ];
    update_file_formats_items?: [
      {
        filter?:
          | ValueTypes['file_formats_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data: ValueTypes['update_file_formats_input'] | Variable<any, string>;
      },
      ValueTypes['file_formats'],
    ];
    update_file_formats_batch?: [
      {
        filter?:
          | ValueTypes['file_formats_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_file_formats_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['file_formats'],
    ];
    update_file_formats_item?: [
      {
        id: string | Variable<any, string>;
        data: ValueTypes['update_file_formats_input'] | Variable<any, string>;
      },
      ValueTypes['file_formats'],
    ];
    update_products_items?: [
      {
        filter?:
          | ValueTypes['products_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data: ValueTypes['update_products_input'] | Variable<any, string>;
      },
      ValueTypes['products'],
    ];
    update_products_batch?: [
      {
        filter?:
          | ValueTypes['products_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_products_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['products'],
    ];
    update_products_item?: [
      {
        id: string | Variable<any, string>;
        data: ValueTypes['update_products_input'] | Variable<any, string>;
      },
      ValueTypes['products'],
    ];
    update_production_materials_items?: [
      {
        filter?:
          | ValueTypes['production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_production_materials_input']
          | Variable<any, string>;
      },
      ValueTypes['production_materials'],
    ];
    update_production_materials_batch?: [
      {
        filter?:
          | ValueTypes['production_materials_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_production_materials_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['production_materials'],
    ];
    update_production_materials_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_production_materials_input']
          | Variable<any, string>;
      },
      ValueTypes['production_materials'],
    ];
    update_invoices_items?: [
      {
        filter?:
          | ValueTypes['invoices_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data: ValueTypes['update_invoices_input'] | Variable<any, string>;
      },
      ValueTypes['invoices'],
    ];
    update_invoices_batch?: [
      {
        filter?:
          | ValueTypes['invoices_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_invoices_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['invoices'],
    ];
    update_invoices_item?: [
      {
        id: string | Variable<any, string>;
        data: ValueTypes['update_invoices_input'] | Variable<any, string>;
      },
      ValueTypes['invoices'],
    ];
    update_production_materials_files_items?: [
      {
        filter?:
          | ValueTypes['production_materials_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_production_materials_files_input']
          | Variable<any, string>;
      },
      ValueTypes['production_materials_files'],
    ];
    update_production_materials_files_batch?: [
      {
        filter?:
          | ValueTypes['production_materials_files_filter']
          | undefined
          | null
          | Variable<any, string>;
        sort?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        limit?: number | undefined | null | Variable<any, string>;
        offset?: number | undefined | null | Variable<any, string>;
        page?: number | undefined | null | Variable<any, string>;
        search?: string | undefined | null | Variable<any, string>;
        data?:
          | Array<ValueTypes['update_production_materials_files_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['production_materials_files'],
    ];
    update_production_materials_files_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_production_materials_files_input']
          | Variable<any, string>;
      },
      ValueTypes['production_materials_files'],
    ];
    delete_brands_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_brands_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_brands_directus_users_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_brands_directus_users_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_collaborators_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_collaborators_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_collaborator_roles_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_collaborator_roles_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_junction_directus_users_skills_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_junction_directus_users_skills_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_skills_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_skills_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_producers_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_producers_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_producers_production_materials_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_producers_production_materials_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_producers_production_methods_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_producers_production_methods_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_production_methods_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_production_methods_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_production_materials_production_methods_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_production_materials_production_methods_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_fulfillers_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_fulfillers_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_price_currencies_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_price_currencies_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_stages_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_stages_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_currencies_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_currencies_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_products_content_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_products_content_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_products_contributors_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_products_contributors_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_products_design_files_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_products_design_files_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_products_files_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_products_files_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_products_production_materials_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_products_production_materials_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_products_production_methods_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_products_production_methods_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_products_wearables_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_products_wearables_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_file_formats_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_file_formats_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_products_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_products_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_production_materials_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_production_materials_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_invoices_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_invoices_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_production_materials_files_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_production_materials_files_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['create_brands_input']: {
    created_at?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    discord_url?: string | undefined | null | Variable<any, string>;
    eth_address?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    logo?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    name: string | Variable<any, string>;
    notion_id?: string | undefined | null | Variable<any, string>;
    twitter_url?: string | undefined | null | Variable<any, string>;
    website_url?: string | undefined | null | Variable<any, string>;
    products?:
      | Array<ValueTypes['create_products_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    users?:
      | Array<
          ValueTypes['create_brands_directus_users_input'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_directus_files_input']: {
    id?: string | undefined | null | Variable<any, string>;
    storage: string | Variable<any, string>;
    filename_disk?: string | undefined | null | Variable<any, string>;
    filename_download: string | Variable<any, string>;
    title?: string | undefined | null | Variable<any, string>;
    type?: string | undefined | null | Variable<any, string>;
    folder?:
      | ValueTypes['create_directus_folders_input']
      | undefined
      | null
      | Variable<any, string>;
    uploaded_by?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    uploaded_on?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    modified_by?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    modified_on?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    charset?: string | undefined | null | Variable<any, string>;
    filesize?:
      | ValueTypes['GraphQLBigInt']
      | undefined
      | null
      | Variable<any, string>;
    width?: number | undefined | null | Variable<any, string>;
    height?: number | undefined | null | Variable<any, string>;
    duration?: number | undefined | null | Variable<any, string>;
    embed?: string | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    location?: string | undefined | null | Variable<any, string>;
    tags?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    metadata?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
  };
  ['create_directus_folders_input']: {
    id?: string | undefined | null | Variable<any, string>;
    name: string | Variable<any, string>;
    parent?:
      | ValueTypes['create_directus_folders_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_directus_users_input']: {
    id?: string | undefined | null | Variable<any, string>;
    first_name?: string | undefined | null | Variable<any, string>;
    last_name?: string | undefined | null | Variable<any, string>;
    email?: string | undefined | null | Variable<any, string>;
    password?: ValueTypes['Hash'] | undefined | null | Variable<any, string>;
    location?: string | undefined | null | Variable<any, string>;
    title?: string | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    tags?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    avatar?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    language?: string | undefined | null | Variable<any, string>;
    theme?: string | undefined | null | Variable<any, string>;
    tfa_secret?: ValueTypes['Hash'] | undefined | null | Variable<any, string>;
    status?: string | undefined | null | Variable<any, string>;
    role?:
      | ValueTypes['create_directus_roles_input']
      | undefined
      | null
      | Variable<any, string>;
    token?: ValueTypes['Hash'] | undefined | null | Variable<any, string>;
    last_access?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    last_page?: string | undefined | null | Variable<any, string>;
    provider?: string | undefined | null | Variable<any, string>;
    external_identifier?: string | undefined | null | Variable<any, string>;
    auth_data?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    email_notifications?: boolean | undefined | null | Variable<any, string>;
    discord_handle?: string | undefined | null | Variable<any, string>;
    discord_id?: string | undefined | null | Variable<any, string>;
    timezone?: string | undefined | null | Variable<any, string>;
    twitter_handle?: string | undefined | null | Variable<any, string>;
    collaborators?:
      | Array<ValueTypes['create_collaborators_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    skills?:
      | Array<
          | ValueTypes['create_junction_directus_users_skills_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_directus_roles_input']: {
    id?: string | undefined | null | Variable<any, string>;
    name: string | Variable<any, string>;
    icon?: string | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    ip_access?:
      | Array<string | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    enforce_tfa: boolean | Variable<any, string>;
    admin_access: boolean | Variable<any, string>;
    app_access?: boolean | undefined | null | Variable<any, string>;
    users?:
      | Array<ValueTypes['create_directus_users_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_collaborators_input']: {
    account?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    date_created?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    date_updated?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    display_name?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    payment_eth_address?: string | undefined | null | Variable<any, string>;
    role?:
      | ValueTypes['create_collaborator_roles_input']
      | undefined
      | null
      | Variable<any, string>;
    user_created?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_collaborator_roles_input']: {
    description?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
  };
  ['create_junction_directus_users_skills_input']: {
    directus_users_id?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    skills_id?:
      | ValueTypes['create_skills_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_skills_input']: {
    description?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    name: string | Variable<any, string>;
  };
  ['create_products_input']: {
    brand_id?:
      | ValueTypes['create_brands_input']
      | undefined
      | null
      | Variable<any, string>;
    clo3d_file?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    created_at?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    discord_channel_id?: string | undefined | null | Variable<any, string>;
    fulfiller_id?:
      | ValueTypes['create_fulfillers_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    name: string | Variable<any, string>;
    nft_token_id?: number | undefined | null | Variable<any, string>;
    notion_id?: string | undefined | null | Variable<any, string>;
    price?:
      | ValueTypes['create_price_currencies_input']
      | undefined
      | null
      | Variable<any, string>;
    producer_id?:
      | ValueTypes['create_producers_input']
      | undefined
      | null
      | Variable<any, string>;
    product_stage?:
      | ValueTypes['create_stages_input']
      | undefined
      | null
      | Variable<any, string>;
    production_cost?: number | undefined | null | Variable<any, string>;
    quantity?:
      | ValueTypes['GraphQLBigInt']
      | undefined
      | null
      | Variable<any, string>;
    release_date?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    sale_currency?:
      | ValueTypes['create_currencies_input']
      | undefined
      | null
      | Variable<any, string>;
    sale_price?: number | undefined | null | Variable<any, string>;
    sale_type?: string | undefined | null | Variable<any, string>;
    season?: number | undefined | null | Variable<any, string>;
    shopify_id?: string | undefined | null | Variable<any, string>;
    status?: string | undefined | null | Variable<any, string>;
    notes?: string | undefined | null | Variable<any, string>;
    date_updated?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    html_file?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    thumbnail?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    vrm_file?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    contributors?:
      | Array<
          ValueTypes['create_products_contributors_input'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
    materials?:
      | Array<
          | ValueTypes['create_products_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
    design_files?:
      | Array<
          ValueTypes['create_products_design_files_input'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
    content?:
      | Array<ValueTypes['create_products_content_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    images?:
      | Array<ValueTypes['create_products_files_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    wearable_files?:
      | Array<ValueTypes['create_products_wearables_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    production_methods?:
      | Array<
          | ValueTypes['create_products_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
    client_invoices?:
      | Array<ValueTypes['create_invoices_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    production_invoices?:
      | Array<ValueTypes['create_invoices_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_fulfillers_input']: {
    address?: string | undefined | null | Variable<any, string>;
    created_at?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    email?: string | undefined | null | Variable<any, string>;
    eth_address?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    website_url?: string | undefined | null | Variable<any, string>;
  };
  ['create_price_currencies_input']: {
    amount: number | Variable<any, string>;
    currency?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
  };
  ['create_producers_input']: {
    created_at?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    email?: string | undefined | null | Variable<any, string>;
    eth_address?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    shipping_address?: string | undefined | null | Variable<any, string>;
    production_materials_stocked?:
      | Array<
          | ValueTypes['create_producers_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
    production_methods?:
      | Array<
          | ValueTypes['create_producers_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
    supplied_materials?:
      | Array<
          ValueTypes['create_production_materials_input'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_producers_production_materials_input']: {
    id?: string | undefined | null | Variable<any, string>;
    producers_id?:
      | ValueTypes['create_producers_input']
      | undefined
      | null
      | Variable<any, string>;
    production_materials_id?:
      | ValueTypes['create_production_materials_input']
      | undefined
      | null
      | Variable<any, string>;
    quantity?: number | undefined | null | Variable<any, string>;
  };
  ['create_production_materials_input']: {
    base_price?: number | undefined | null | Variable<any, string>;
    color_palette?:
      | ValueTypes['JSON']
      | undefined
      | null
      | Variable<any, string>;
    composition?: string | undefined | null | Variable<any, string>;
    created_at?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    created_by?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    gender?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    made_in?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    neck_tag?: boolean | undefined | null | Variable<any, string>;
    note?: string | undefined | null | Variable<any, string>;
    rating?: string | undefined | null | Variable<any, string>;
    size_guide?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    supplier?:
      | ValueTypes['create_producers_input']
      | undefined
      | null
      | Variable<any, string>;
    tags?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    production_methods?:
      | Array<
          | ValueTypes['create_production_materials_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
    stocked_at?:
      | Array<
          | ValueTypes['create_producers_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
    base_assets?:
      | Array<
          | ValueTypes['create_production_materials_files_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_production_materials_production_methods_input']: {
    id?: string | undefined | null | Variable<any, string>;
    production_materials_id?:
      | ValueTypes['create_production_materials_input']
      | undefined
      | null
      | Variable<any, string>;
    production_methods_id?:
      | ValueTypes['create_production_methods_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_production_methods_input']: {
    created_at?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    producers?:
      | Array<
          | ValueTypes['create_producers_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
    production_materials?:
      | Array<
          | ValueTypes['create_production_materials_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_producers_production_methods_input']: {
    id?: string | undefined | null | Variable<any, string>;
    producers_id?:
      | ValueTypes['create_producers_input']
      | undefined
      | null
      | Variable<any, string>;
    production_methods_id?:
      | ValueTypes['create_production_methods_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_production_materials_files_input']: {
    directus_files_id?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    production_materials_id?:
      | ValueTypes['create_production_materials_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_stages_input']: {
    description?: string | undefined | null | Variable<any, string>;
    name: string | Variable<any, string>;
    sort?: number | undefined | null | Variable<any, string>;
  };
  ['create_currencies_input']: {
    currency: string | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
  };
  ['create_products_contributors_input']: {
    collaborators_id?:
      | ValueTypes['create_collaborators_input']
      | undefined
      | null
      | Variable<any, string>;
    contribution_share?: number | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    products_id?:
      | ValueTypes['create_products_input']
      | undefined
      | null
      | Variable<any, string>;
    robot_earned?: number | undefined | null | Variable<any, string>;
  };
  ['create_products_production_materials_input']: {
    id?: string | undefined | null | Variable<any, string>;
    production_materials_id?:
      | ValueTypes['create_production_materials_input']
      | undefined
      | null
      | Variable<any, string>;
    products_id?:
      | ValueTypes['create_products_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_products_design_files_input']: {
    directus_files_id?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    products_id?:
      | ValueTypes['create_products_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_products_content_input']: {
    directus_files_id?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    products_id?:
      | ValueTypes['create_products_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_products_files_input']: {
    directus_files_id?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    products_id?:
      | ValueTypes['create_products_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_products_wearables_input']: {
    directus_files_id?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    file_format?:
      | ValueTypes['create_file_formats_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    primary?: boolean | undefined | null | Variable<any, string>;
    products_id?:
      | ValueTypes['create_products_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_file_formats_input']: {
    description?: string | undefined | null | Variable<any, string>;
    extension?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    mime_type?: string | undefined | null | Variable<any, string>;
    name: string | Variable<any, string>;
  };
  ['create_products_production_methods_input']: {
    id?: string | undefined | null | Variable<any, string>;
    production_methods_id?:
      | ValueTypes['create_production_methods_input']
      | undefined
      | null
      | Variable<any, string>;
    products_id?:
      | ValueTypes['create_products_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_invoices_input']: {
    id?: string | undefined | null | Variable<any, string>;
    user_created?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    date_created?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    user_updated?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    date_updated?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: string | undefined | null | Variable<any, string>;
    description: string | Variable<any, string>;
    status?: string | undefined | null | Variable<any, string>;
    /** Invoice amount in USD */
    amount?: number | undefined | null | Variable<any, string>;
    transaction_url?: string | undefined | null | Variable<any, string>;
    production_product_id?:
      | ValueTypes['create_products_input']
      | undefined
      | null
      | Variable<any, string>;
    client_product_id?:
      | ValueTypes['create_products_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_brands_directus_users_input']: {
    brands_id?:
      | ValueTypes['create_brands_input']
      | undefined
      | null
      | Variable<any, string>;
    directus_users_id?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
  };
  ['update_brands_input']: {
    created_at?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    discord_url?: string | undefined | null | Variable<any, string>;
    eth_address?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    logo?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    notion_id?: string | undefined | null | Variable<any, string>;
    twitter_url?: string | undefined | null | Variable<any, string>;
    website_url?: string | undefined | null | Variable<any, string>;
    products?:
      | Array<ValueTypes['update_products_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    users?:
      | Array<
          ValueTypes['update_brands_directus_users_input'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_directus_files_input']: {
    id?: string | undefined | null | Variable<any, string>;
    storage?: string | undefined | null | Variable<any, string>;
    filename_disk?: string | undefined | null | Variable<any, string>;
    filename_download?: string | undefined | null | Variable<any, string>;
    title?: string | undefined | null | Variable<any, string>;
    type?: string | undefined | null | Variable<any, string>;
    folder?:
      | ValueTypes['update_directus_folders_input']
      | undefined
      | null
      | Variable<any, string>;
    uploaded_by?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    uploaded_on?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    modified_by?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    modified_on?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    charset?: string | undefined | null | Variable<any, string>;
    filesize?:
      | ValueTypes['GraphQLBigInt']
      | undefined
      | null
      | Variable<any, string>;
    width?: number | undefined | null | Variable<any, string>;
    height?: number | undefined | null | Variable<any, string>;
    duration?: number | undefined | null | Variable<any, string>;
    embed?: string | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    location?: string | undefined | null | Variable<any, string>;
    tags?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    metadata?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
  };
  ['update_directus_folders_input']: {
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    parent?:
      | ValueTypes['update_directus_folders_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_directus_users_input']: {
    id?: string | undefined | null | Variable<any, string>;
    first_name?: string | undefined | null | Variable<any, string>;
    last_name?: string | undefined | null | Variable<any, string>;
    email?: string | undefined | null | Variable<any, string>;
    password?: ValueTypes['Hash'] | undefined | null | Variable<any, string>;
    location?: string | undefined | null | Variable<any, string>;
    title?: string | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    tags?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    avatar?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    language?: string | undefined | null | Variable<any, string>;
    theme?: string | undefined | null | Variable<any, string>;
    tfa_secret?: ValueTypes['Hash'] | undefined | null | Variable<any, string>;
    status?: string | undefined | null | Variable<any, string>;
    role?:
      | ValueTypes['update_directus_roles_input']
      | undefined
      | null
      | Variable<any, string>;
    token?: ValueTypes['Hash'] | undefined | null | Variable<any, string>;
    last_access?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    last_page?: string | undefined | null | Variable<any, string>;
    provider?: string | undefined | null | Variable<any, string>;
    external_identifier?: string | undefined | null | Variable<any, string>;
    auth_data?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    email_notifications?: boolean | undefined | null | Variable<any, string>;
    discord_handle?: string | undefined | null | Variable<any, string>;
    discord_id?: string | undefined | null | Variable<any, string>;
    timezone?: string | undefined | null | Variable<any, string>;
    twitter_handle?: string | undefined | null | Variable<any, string>;
    collaborators?:
      | Array<ValueTypes['update_collaborators_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    skills?:
      | Array<
          | ValueTypes['update_junction_directus_users_skills_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_directus_roles_input']: {
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    icon?: string | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    ip_access?:
      | Array<string | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    enforce_tfa?: boolean | undefined | null | Variable<any, string>;
    admin_access?: boolean | undefined | null | Variable<any, string>;
    app_access?: boolean | undefined | null | Variable<any, string>;
    users?:
      | Array<ValueTypes['update_directus_users_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_collaborators_input']: {
    account?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    date_created?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    date_updated?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    display_name?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    payment_eth_address?: string | undefined | null | Variable<any, string>;
    role?:
      | ValueTypes['update_collaborator_roles_input']
      | undefined
      | null
      | Variable<any, string>;
    user_created?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_collaborator_roles_input']: {
    description?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
  };
  ['update_junction_directus_users_skills_input']: {
    directus_users_id?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    skills_id?:
      | ValueTypes['update_skills_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_skills_input']: {
    description?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
  };
  ['update_products_input']: {
    brand_id?:
      | ValueTypes['update_brands_input']
      | undefined
      | null
      | Variable<any, string>;
    clo3d_file?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    created_at?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    discord_channel_id?: string | undefined | null | Variable<any, string>;
    fulfiller_id?:
      | ValueTypes['update_fulfillers_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    nft_token_id?: number | undefined | null | Variable<any, string>;
    notion_id?: string | undefined | null | Variable<any, string>;
    price?:
      | ValueTypes['update_price_currencies_input']
      | undefined
      | null
      | Variable<any, string>;
    producer_id?:
      | ValueTypes['update_producers_input']
      | undefined
      | null
      | Variable<any, string>;
    product_stage?:
      | ValueTypes['update_stages_input']
      | undefined
      | null
      | Variable<any, string>;
    production_cost?: number | undefined | null | Variable<any, string>;
    quantity?:
      | ValueTypes['GraphQLBigInt']
      | undefined
      | null
      | Variable<any, string>;
    release_date?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    sale_currency?:
      | ValueTypes['update_currencies_input']
      | undefined
      | null
      | Variable<any, string>;
    sale_price?: number | undefined | null | Variable<any, string>;
    sale_type?: string | undefined | null | Variable<any, string>;
    season?: number | undefined | null | Variable<any, string>;
    shopify_id?: string | undefined | null | Variable<any, string>;
    status?: string | undefined | null | Variable<any, string>;
    notes?: string | undefined | null | Variable<any, string>;
    date_updated?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    html_file?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    thumbnail?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    vrm_file?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    contributors?:
      | Array<
          ValueTypes['update_products_contributors_input'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
    materials?:
      | Array<
          | ValueTypes['update_products_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
    design_files?:
      | Array<
          ValueTypes['update_products_design_files_input'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
    content?:
      | Array<ValueTypes['update_products_content_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    images?:
      | Array<ValueTypes['update_products_files_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    wearable_files?:
      | Array<ValueTypes['update_products_wearables_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    production_methods?:
      | Array<
          | ValueTypes['update_products_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
    client_invoices?:
      | Array<ValueTypes['update_invoices_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    production_invoices?:
      | Array<ValueTypes['update_invoices_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_fulfillers_input']: {
    address?: string | undefined | null | Variable<any, string>;
    created_at?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    email?: string | undefined | null | Variable<any, string>;
    eth_address?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    website_url?: string | undefined | null | Variable<any, string>;
  };
  ['update_price_currencies_input']: {
    amount?: number | undefined | null | Variable<any, string>;
    currency?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
  };
  ['update_producers_input']: {
    created_at?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    email?: string | undefined | null | Variable<any, string>;
    eth_address?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    shipping_address?: string | undefined | null | Variable<any, string>;
    production_materials_stocked?:
      | Array<
          | ValueTypes['update_producers_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
    production_methods?:
      | Array<
          | ValueTypes['update_producers_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
    supplied_materials?:
      | Array<
          ValueTypes['update_production_materials_input'] | undefined | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_producers_production_materials_input']: {
    id?: string | undefined | null | Variable<any, string>;
    producers_id?:
      | ValueTypes['update_producers_input']
      | undefined
      | null
      | Variable<any, string>;
    production_materials_id?:
      | ValueTypes['update_production_materials_input']
      | undefined
      | null
      | Variable<any, string>;
    quantity?: number | undefined | null | Variable<any, string>;
  };
  ['update_production_materials_input']: {
    base_price?: number | undefined | null | Variable<any, string>;
    color_palette?:
      | ValueTypes['JSON']
      | undefined
      | null
      | Variable<any, string>;
    composition?: string | undefined | null | Variable<any, string>;
    created_at?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    created_by?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    gender?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    made_in?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    neck_tag?: boolean | undefined | null | Variable<any, string>;
    note?: string | undefined | null | Variable<any, string>;
    rating?: string | undefined | null | Variable<any, string>;
    size_guide?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    supplier?:
      | ValueTypes['update_producers_input']
      | undefined
      | null
      | Variable<any, string>;
    tags?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    production_methods?:
      | Array<
          | ValueTypes['update_production_materials_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
    stocked_at?:
      | Array<
          | ValueTypes['update_producers_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
    base_assets?:
      | Array<
          | ValueTypes['update_production_materials_files_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_production_materials_production_methods_input']: {
    id?: string | undefined | null | Variable<any, string>;
    production_materials_id?:
      | ValueTypes['update_production_materials_input']
      | undefined
      | null
      | Variable<any, string>;
    production_methods_id?:
      | ValueTypes['update_production_methods_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_production_methods_input']: {
    created_at?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    producers?:
      | Array<
          | ValueTypes['update_producers_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
    production_materials?:
      | Array<
          | ValueTypes['update_production_materials_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_producers_production_methods_input']: {
    id?: string | undefined | null | Variable<any, string>;
    producers_id?:
      | ValueTypes['update_producers_input']
      | undefined
      | null
      | Variable<any, string>;
    production_methods_id?:
      | ValueTypes['update_production_methods_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_production_materials_files_input']: {
    directus_files_id?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    production_materials_id?:
      | ValueTypes['update_production_materials_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_stages_input']: {
    description?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    sort?: number | undefined | null | Variable<any, string>;
  };
  ['update_currencies_input']: {
    currency?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
  };
  ['update_products_contributors_input']: {
    collaborators_id?:
      | ValueTypes['update_collaborators_input']
      | undefined
      | null
      | Variable<any, string>;
    contribution_share?: number | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    products_id?:
      | ValueTypes['update_products_input']
      | undefined
      | null
      | Variable<any, string>;
    robot_earned?: number | undefined | null | Variable<any, string>;
  };
  ['update_products_production_materials_input']: {
    id?: string | undefined | null | Variable<any, string>;
    production_materials_id?:
      | ValueTypes['update_production_materials_input']
      | undefined
      | null
      | Variable<any, string>;
    products_id?:
      | ValueTypes['update_products_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_products_design_files_input']: {
    directus_files_id?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    products_id?:
      | ValueTypes['update_products_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_products_content_input']: {
    directus_files_id?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    products_id?:
      | ValueTypes['update_products_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_products_files_input']: {
    directus_files_id?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    products_id?:
      | ValueTypes['update_products_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_products_wearables_input']: {
    directus_files_id?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    file_format?:
      | ValueTypes['update_file_formats_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    primary?: boolean | undefined | null | Variable<any, string>;
    products_id?:
      | ValueTypes['update_products_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_file_formats_input']: {
    description?: string | undefined | null | Variable<any, string>;
    extension?: string | undefined | null | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    mime_type?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
  };
  ['update_products_production_methods_input']: {
    id?: string | undefined | null | Variable<any, string>;
    production_methods_id?:
      | ValueTypes['update_production_methods_input']
      | undefined
      | null
      | Variable<any, string>;
    products_id?:
      | ValueTypes['update_products_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_invoices_input']: {
    id?: string | undefined | null | Variable<any, string>;
    user_created?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    date_created?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    user_updated?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    date_updated?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: string | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    status?: string | undefined | null | Variable<any, string>;
    /** Invoice amount in USD */
    amount?: number | undefined | null | Variable<any, string>;
    transaction_url?: string | undefined | null | Variable<any, string>;
    production_product_id?:
      | ValueTypes['update_products_input']
      | undefined
      | null
      | Variable<any, string>;
    client_product_id?:
      | ValueTypes['update_products_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_brands_directus_users_input']: {
    brands_id?:
      | ValueTypes['update_brands_input']
      | undefined
      | null
      | Variable<any, string>;
    directus_users_id?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
  };
  ['delete_many']: AliasType<{
    ids?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['delete_one']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
};

export type ResolverInputTypes = {
  ['Query']: AliasType<{
    brands?: [
      {
        filter?: ResolverInputTypes['brands_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['brands'],
    ];
    brands_by_id?: [{ id: string }, ResolverInputTypes['brands']];
    brands_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ResolverInputTypes['brands_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['brands_aggregated'],
    ];
    brands_directus_users?: [
      {
        filter?:
          | ResolverInputTypes['brands_directus_users_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['brands_directus_users'],
    ];
    brands_directus_users_by_id?: [
      { id: string },
      ResolverInputTypes['brands_directus_users'],
    ];
    brands_directus_users_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['brands_directus_users_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['brands_directus_users_aggregated'],
    ];
    collaborators?: [
      {
        filter?: ResolverInputTypes['collaborators_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['collaborators'],
    ];
    collaborators_by_id?: [{ id: string }, ResolverInputTypes['collaborators']];
    collaborators_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ResolverInputTypes['collaborators_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['collaborators_aggregated'],
    ];
    collaborator_roles?: [
      {
        filter?:
          | ResolverInputTypes['collaborator_roles_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['collaborator_roles'],
    ];
    collaborator_roles_by_id?: [
      { id: string },
      ResolverInputTypes['collaborator_roles'],
    ];
    collaborator_roles_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['collaborator_roles_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['collaborator_roles_aggregated'],
    ];
    junction_directus_users_skills?: [
      {
        filter?:
          | ResolverInputTypes['junction_directus_users_skills_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['junction_directus_users_skills'],
    ];
    junction_directus_users_skills_by_id?: [
      { id: string },
      ResolverInputTypes['junction_directus_users_skills'],
    ];
    junction_directus_users_skills_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['junction_directus_users_skills_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['junction_directus_users_skills_aggregated'],
    ];
    skills?: [
      {
        filter?: ResolverInputTypes['skills_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['skills'],
    ];
    skills_by_id?: [{ id: string }, ResolverInputTypes['skills']];
    skills_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ResolverInputTypes['skills_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['skills_aggregated'],
    ];
    producers?: [
      {
        filter?: ResolverInputTypes['producers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['producers'],
    ];
    producers_by_id?: [{ id: string }, ResolverInputTypes['producers']];
    producers_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ResolverInputTypes['producers_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['producers_aggregated'],
    ];
    producers_production_materials?: [
      {
        filter?:
          | ResolverInputTypes['producers_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['producers_production_materials'],
    ];
    producers_production_materials_by_id?: [
      { id: string },
      ResolverInputTypes['producers_production_materials'],
    ];
    producers_production_materials_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['producers_production_materials_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['producers_production_materials_aggregated'],
    ];
    producers_production_methods?: [
      {
        filter?:
          | ResolverInputTypes['producers_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['producers_production_methods'],
    ];
    producers_production_methods_by_id?: [
      { id: string },
      ResolverInputTypes['producers_production_methods'],
    ];
    producers_production_methods_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['producers_production_methods_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['producers_production_methods_aggregated'],
    ];
    production_methods?: [
      {
        filter?:
          | ResolverInputTypes['production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['production_methods'],
    ];
    production_methods_by_id?: [
      { id: string },
      ResolverInputTypes['production_methods'],
    ];
    production_methods_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['production_methods_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['production_methods_aggregated'],
    ];
    production_materials_production_methods?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['production_materials_production_methods'],
    ];
    production_materials_production_methods_by_id?: [
      { id: string },
      ResolverInputTypes['production_materials_production_methods'],
    ];
    production_materials_production_methods_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['production_materials_production_methods_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['production_materials_production_methods_aggregated'],
    ];
    fulfillers?: [
      {
        filter?: ResolverInputTypes['fulfillers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['fulfillers'],
    ];
    fulfillers_by_id?: [{ id: string }, ResolverInputTypes['fulfillers']];
    fulfillers_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ResolverInputTypes['fulfillers_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['fulfillers_aggregated'],
    ];
    price_currencies?: [
      {
        filter?:
          | ResolverInputTypes['price_currencies_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['price_currencies'],
    ];
    price_currencies_by_id?: [
      { id: string },
      ResolverInputTypes['price_currencies'],
    ];
    price_currencies_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['price_currencies_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['price_currencies_aggregated'],
    ];
    stages?: [
      {
        filter?: ResolverInputTypes['stages_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['stages'],
    ];
    stages_by_id?: [{ id: string }, ResolverInputTypes['stages']];
    stages_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ResolverInputTypes['stages_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['stages_aggregated'],
    ];
    currencies?: [
      {
        filter?: ResolverInputTypes['currencies_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['currencies'],
    ];
    currencies_by_id?: [{ id: string }, ResolverInputTypes['currencies']];
    currencies_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ResolverInputTypes['currencies_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['currencies_aggregated'],
    ];
    products_content?: [
      {
        filter?:
          | ResolverInputTypes['products_content_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products_content'],
    ];
    products_content_by_id?: [
      { id: string },
      ResolverInputTypes['products_content'],
    ];
    products_content_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['products_content_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['products_content_aggregated'],
    ];
    products_contributors?: [
      {
        filter?:
          | ResolverInputTypes['products_contributors_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products_contributors'],
    ];
    products_contributors_by_id?: [
      { id: string },
      ResolverInputTypes['products_contributors'],
    ];
    products_contributors_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['products_contributors_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['products_contributors_aggregated'],
    ];
    products_design_files?: [
      {
        filter?:
          | ResolverInputTypes['products_design_files_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products_design_files'],
    ];
    products_design_files_by_id?: [
      { id: string },
      ResolverInputTypes['products_design_files'],
    ];
    products_design_files_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['products_design_files_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['products_design_files_aggregated'],
    ];
    products_files?: [
      {
        filter?: ResolverInputTypes['products_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products_files'],
    ];
    products_files_by_id?: [
      { id: string },
      ResolverInputTypes['products_files'],
    ];
    products_files_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ResolverInputTypes['products_files_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['products_files_aggregated'],
    ];
    products_production_materials?: [
      {
        filter?:
          | ResolverInputTypes['products_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products_production_materials'],
    ];
    products_production_materials_by_id?: [
      { id: string },
      ResolverInputTypes['products_production_materials'],
    ];
    products_production_materials_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['products_production_materials_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['products_production_materials_aggregated'],
    ];
    products_production_methods?: [
      {
        filter?:
          | ResolverInputTypes['products_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products_production_methods'],
    ];
    products_production_methods_by_id?: [
      { id: string },
      ResolverInputTypes['products_production_methods'],
    ];
    products_production_methods_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['products_production_methods_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['products_production_methods_aggregated'],
    ];
    products_wearables?: [
      {
        filter?:
          | ResolverInputTypes['products_wearables_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products_wearables'],
    ];
    products_wearables_by_id?: [
      { id: string },
      ResolverInputTypes['products_wearables'],
    ];
    products_wearables_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['products_wearables_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['products_wearables_aggregated'],
    ];
    file_formats?: [
      {
        filter?: ResolverInputTypes['file_formats_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['file_formats'],
    ];
    file_formats_by_id?: [{ id: string }, ResolverInputTypes['file_formats']];
    file_formats_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ResolverInputTypes['file_formats_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['file_formats_aggregated'],
    ];
    products?: [
      {
        filter?: ResolverInputTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products'],
    ];
    products_by_id?: [{ id: string }, ResolverInputTypes['products']];
    products_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ResolverInputTypes['products_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['products_aggregated'],
    ];
    production_materials?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['production_materials'],
    ];
    production_materials_by_id?: [
      { id: string },
      ResolverInputTypes['production_materials'],
    ];
    production_materials_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['production_materials_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['production_materials_aggregated'],
    ];
    invoices?: [
      {
        filter?: ResolverInputTypes['invoices_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['invoices'],
    ];
    invoices_by_id?: [{ id: string }, ResolverInputTypes['invoices']];
    invoices_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ResolverInputTypes['invoices_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['invoices_aggregated'],
    ];
    production_materials_files?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_files_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['production_materials_files'],
    ];
    production_materials_files_by_id?: [
      { id: string },
      ResolverInputTypes['production_materials_files'],
    ];
    production_materials_files_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['production_materials_files_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['production_materials_files_aggregated'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['brands']: AliasType<{
    created_at?: boolean | `@${string}`;
    created_at_func?: ResolverInputTypes['datetime_functions'];
    description?: boolean | `@${string}`;
    discord_url?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    logo?: [
      {
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_files'],
    ];
    name?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    twitter_url?: boolean | `@${string}`;
    website_url?: boolean | `@${string}`;
    products?: [
      {
        filter?: ResolverInputTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products'],
    ];
    products_func?: ResolverInputTypes['count_functions'];
    users?: [
      {
        filter?:
          | ResolverInputTypes['brands_directus_users_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['brands_directus_users'],
    ];
    users_func?: ResolverInputTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  /** ISO8601 Date values */
  ['Date']: unknown;
  ['datetime_functions']: AliasType<{
    year?: boolean | `@${string}`;
    month?: boolean | `@${string}`;
    week?: boolean | `@${string}`;
    day?: boolean | `@${string}`;
    weekday?: boolean | `@${string}`;
    hour?: boolean | `@${string}`;
    minute?: boolean | `@${string}`;
    second?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_files']: AliasType<{
    id?: boolean | `@${string}`;
    storage?: boolean | `@${string}`;
    filename_disk?: boolean | `@${string}`;
    filename_download?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    type?: boolean | `@${string}`;
    folder?: [
      {
        filter?:
          | ResolverInputTypes['directus_folders_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_folders'],
    ];
    uploaded_by?: [
      {
        filter?: ResolverInputTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_users'],
    ];
    uploaded_on?: boolean | `@${string}`;
    uploaded_on_func?: ResolverInputTypes['datetime_functions'];
    modified_by?: [
      {
        filter?: ResolverInputTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_users'],
    ];
    modified_on?: boolean | `@${string}`;
    modified_on_func?: ResolverInputTypes['datetime_functions'];
    charset?: boolean | `@${string}`;
    filesize?: boolean | `@${string}`;
    width?: boolean | `@${string}`;
    height?: boolean | `@${string}`;
    duration?: boolean | `@${string}`;
    embed?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    location?: boolean | `@${string}`;
    tags?: boolean | `@${string}`;
    tags_func?: ResolverInputTypes['count_functions'];
    metadata?: boolean | `@${string}`;
    metadata_func?: ResolverInputTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_folders']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    parent?: [
      {
        filter?:
          | ResolverInputTypes['directus_folders_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_folders'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_folders_filter']: {
    id?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    parent?: ResolverInputTypes['directus_folders_filter'] | undefined | null;
    _and?:
      | Array<ResolverInputTypes['directus_folders_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['directus_folders_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['string_filter_operators']: {
    _eq?: string | undefined | null;
    _neq?: string | undefined | null;
    _contains?: string | undefined | null;
    _icontains?: string | undefined | null;
    _ncontains?: string | undefined | null;
    _starts_with?: string | undefined | null;
    _nstarts_with?: string | undefined | null;
    _ends_with?: string | undefined | null;
    _nends_with?: string | undefined | null;
    _in?: Array<string | undefined | null> | undefined | null;
    _nin?: Array<string | undefined | null> | undefined | null;
    _null?: boolean | undefined | null;
    _nnull?: boolean | undefined | null;
    _empty?: boolean | undefined | null;
    _nempty?: boolean | undefined | null;
  };
  ['directus_users']: AliasType<{
    id?: boolean | `@${string}`;
    first_name?: boolean | `@${string}`;
    last_name?: boolean | `@${string}`;
    email?: boolean | `@${string}`;
    password?: boolean | `@${string}`;
    location?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    tags?: boolean | `@${string}`;
    tags_func?: ResolverInputTypes['count_functions'];
    avatar?: [
      {
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_files'],
    ];
    language?: boolean | `@${string}`;
    theme?: boolean | `@${string}`;
    tfa_secret?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    role?: [
      {
        filter?: ResolverInputTypes['directus_roles_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_roles'],
    ];
    token?: boolean | `@${string}`;
    last_access?: boolean | `@${string}`;
    last_access_func?: ResolverInputTypes['datetime_functions'];
    last_page?: boolean | `@${string}`;
    provider?: boolean | `@${string}`;
    external_identifier?: boolean | `@${string}`;
    auth_data?: boolean | `@${string}`;
    auth_data_func?: ResolverInputTypes['count_functions'];
    email_notifications?: boolean | `@${string}`;
    discord_handle?: boolean | `@${string}`;
    discord_id?: boolean | `@${string}`;
    timezone?: boolean | `@${string}`;
    twitter_handle?: boolean | `@${string}`;
    collaborators?: [
      {
        filter?: ResolverInputTypes['collaborators_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['collaborators'],
    ];
    collaborators_func?: ResolverInputTypes['count_functions'];
    skills?: [
      {
        filter?:
          | ResolverInputTypes['junction_directus_users_skills_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['junction_directus_users_skills'],
    ];
    skills_func?: ResolverInputTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  /** Hashed string values */
  ['Hash']: unknown;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  ['JSON']: unknown;
  ['count_functions']: AliasType<{
    count?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_files_filter']: {
    id?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    storage?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    filename_disk?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    filename_download?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    title?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    type?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    folder?: ResolverInputTypes['directus_folders_filter'] | undefined | null;
    uploaded_by?:
      | ResolverInputTypes['directus_users_filter']
      | undefined
      | null;
    uploaded_on?:
      | ResolverInputTypes['date_filter_operators']
      | undefined
      | null;
    uploaded_on_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    modified_by?:
      | ResolverInputTypes['directus_users_filter']
      | undefined
      | null;
    modified_on?:
      | ResolverInputTypes['date_filter_operators']
      | undefined
      | null;
    modified_on_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    charset?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    filesize?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    width?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    height?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    duration?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    embed?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    description?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    location?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    tags?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    tags_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    metadata?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    metadata_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ResolverInputTypes['directus_files_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['directus_files_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_users_filter']: {
    id?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    first_name?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    last_name?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    email?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    password?: ResolverInputTypes['hash_filter_operators'] | undefined | null;
    location?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    title?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    description?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    tags?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    tags_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    avatar?: ResolverInputTypes['directus_files_filter'] | undefined | null;
    language?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    theme?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    tfa_secret?: ResolverInputTypes['hash_filter_operators'] | undefined | null;
    status?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    role?: ResolverInputTypes['directus_roles_filter'] | undefined | null;
    token?: ResolverInputTypes['hash_filter_operators'] | undefined | null;
    last_access?:
      | ResolverInputTypes['date_filter_operators']
      | undefined
      | null;
    last_access_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    last_page?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    provider?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    external_identifier?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    auth_data?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    auth_data_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    email_notifications?:
      | ResolverInputTypes['boolean_filter_operators']
      | undefined
      | null;
    discord_handle?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    discord_id?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    timezone?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    twitter_handle?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    collaborators?:
      | ResolverInputTypes['collaborators_filter']
      | undefined
      | null;
    collaborators_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    skills?:
      | ResolverInputTypes['junction_directus_users_skills_filter']
      | undefined
      | null;
    skills_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ResolverInputTypes['directus_users_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['directus_users_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['hash_filter_operators']: {
    _null?: boolean | undefined | null;
    _nnull?: boolean | undefined | null;
    _empty?: boolean | undefined | null;
    _nempty?: boolean | undefined | null;
  };
  ['count_function_filter_operators']: {
    count?: ResolverInputTypes['number_filter_operators'] | undefined | null;
  };
  ['number_filter_operators']: {
    _eq?: ResolverInputTypes['GraphQLStringOrFloat'] | undefined | null;
    _neq?: ResolverInputTypes['GraphQLStringOrFloat'] | undefined | null;
    _in?:
      | Array<ResolverInputTypes['GraphQLStringOrFloat'] | undefined | null>
      | undefined
      | null;
    _nin?:
      | Array<ResolverInputTypes['GraphQLStringOrFloat'] | undefined | null>
      | undefined
      | null;
    _gt?: ResolverInputTypes['GraphQLStringOrFloat'] | undefined | null;
    _gte?: ResolverInputTypes['GraphQLStringOrFloat'] | undefined | null;
    _lt?: ResolverInputTypes['GraphQLStringOrFloat'] | undefined | null;
    _lte?: ResolverInputTypes['GraphQLStringOrFloat'] | undefined | null;
    _null?: boolean | undefined | null;
    _nnull?: boolean | undefined | null;
    _between?:
      | Array<ResolverInputTypes['GraphQLStringOrFloat'] | undefined | null>
      | undefined
      | null;
    _nbetween?:
      | Array<ResolverInputTypes['GraphQLStringOrFloat'] | undefined | null>
      | undefined
      | null;
  };
  /** A Float or a String */
  ['GraphQLStringOrFloat']: unknown;
  ['directus_roles_filter']: {
    id?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    icon?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    description?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    ip_access?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    enforce_tfa?:
      | ResolverInputTypes['boolean_filter_operators']
      | undefined
      | null;
    admin_access?:
      | ResolverInputTypes['boolean_filter_operators']
      | undefined
      | null;
    app_access?:
      | ResolverInputTypes['boolean_filter_operators']
      | undefined
      | null;
    users?: ResolverInputTypes['directus_users_filter'] | undefined | null;
    users_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ResolverInputTypes['directus_roles_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['directus_roles_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['boolean_filter_operators']: {
    _eq?: boolean | undefined | null;
    _neq?: boolean | undefined | null;
    _null?: boolean | undefined | null;
    _nnull?: boolean | undefined | null;
  };
  ['date_filter_operators']: {
    _eq?: string | undefined | null;
    _neq?: string | undefined | null;
    _gt?: string | undefined | null;
    _gte?: string | undefined | null;
    _lt?: string | undefined | null;
    _lte?: string | undefined | null;
    _null?: boolean | undefined | null;
    _nnull?: boolean | undefined | null;
    _in?: Array<string | undefined | null> | undefined | null;
    _nin?: Array<string | undefined | null> | undefined | null;
    _between?:
      | Array<ResolverInputTypes['GraphQLStringOrFloat'] | undefined | null>
      | undefined
      | null;
    _nbetween?:
      | Array<ResolverInputTypes['GraphQLStringOrFloat'] | undefined | null>
      | undefined
      | null;
  };
  ['datetime_function_filter_operators']: {
    year?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    month?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    week?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    day?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    weekday?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    hour?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    minute?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    second?: ResolverInputTypes['number_filter_operators'] | undefined | null;
  };
  ['collaborators_filter']: {
    account?: ResolverInputTypes['directus_users_filter'] | undefined | null;
    date_created?:
      | ResolverInputTypes['date_filter_operators']
      | undefined
      | null;
    date_created_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    date_updated?:
      | ResolverInputTypes['date_filter_operators']
      | undefined
      | null;
    date_updated_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    display_name?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    payment_eth_address?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    role?: ResolverInputTypes['collaborator_roles_filter'] | undefined | null;
    user_created?:
      | ResolverInputTypes['directus_users_filter']
      | undefined
      | null;
    _and?:
      | Array<ResolverInputTypes['collaborators_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['collaborators_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['collaborator_roles_filter']: {
    description?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    _and?:
      | Array<
          ResolverInputTypes['collaborator_roles_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ResolverInputTypes['collaborator_roles_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['junction_directus_users_skills_filter']: {
    directus_users_id?:
      | ResolverInputTypes['directus_users_filter']
      | undefined
      | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    skills_id?: ResolverInputTypes['skills_filter'] | undefined | null;
    _and?:
      | Array<
          | ResolverInputTypes['junction_directus_users_skills_filter']
          | undefined
          | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          | ResolverInputTypes['junction_directus_users_skills_filter']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['skills_filter']: {
    description?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    _and?:
      | Array<ResolverInputTypes['skills_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['skills_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_roles']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    ip_access?: boolean | `@${string}`;
    enforce_tfa?: boolean | `@${string}`;
    admin_access?: boolean | `@${string}`;
    app_access?: boolean | `@${string}`;
    users?: [
      {
        filter?: ResolverInputTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_users'],
    ];
    users_func?: ResolverInputTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborators']: AliasType<{
    account?: [
      {
        filter?: ResolverInputTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_users'],
    ];
    date_created?: boolean | `@${string}`;
    date_created_func?: ResolverInputTypes['datetime_functions'];
    date_updated?: boolean | `@${string}`;
    date_updated_func?: ResolverInputTypes['datetime_functions'];
    display_name?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    payment_eth_address?: boolean | `@${string}`;
    role?: [
      {
        filter?:
          | ResolverInputTypes['collaborator_roles_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['collaborator_roles'],
    ];
    user_created?: [
      {
        filter?: ResolverInputTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_users'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborator_roles']: AliasType<{
    description?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['junction_directus_users_skills']: AliasType<{
    directus_users_id?: [
      {
        filter?: ResolverInputTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_users'],
    ];
    id?: boolean | `@${string}`;
    skills_id?: [
      {
        filter?: ResolverInputTypes['skills_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['skills'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['skills']: AliasType<{
    description?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** BigInt value */
  ['GraphQLBigInt']: unknown;
  ['products']: AliasType<{
    brand_id?: [
      {
        filter?: ResolverInputTypes['brands_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['brands'],
    ];
    clo3d_file?: [
      {
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_files'],
    ];
    created_at?: boolean | `@${string}`;
    created_at_func?: ResolverInputTypes['datetime_functions'];
    description?: boolean | `@${string}`;
    discord_channel_id?: boolean | `@${string}`;
    fulfiller_id?: [
      {
        filter?: ResolverInputTypes['fulfillers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['fulfillers'],
    ];
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    nft_token_id?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    price?: [
      {
        filter?:
          | ResolverInputTypes['price_currencies_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['price_currencies'],
    ];
    producer_id?: [
      {
        filter?: ResolverInputTypes['producers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['producers'],
    ];
    product_stage?: [
      {
        filter?: ResolverInputTypes['stages_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['stages'],
    ];
    production_cost?: boolean | `@${string}`;
    quantity?: boolean | `@${string}`;
    release_date?: boolean | `@${string}`;
    release_date_func?: ResolverInputTypes['datetime_functions'];
    sale_currency?: [
      {
        filter?: ResolverInputTypes['currencies_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['currencies'],
    ];
    sale_price?: boolean | `@${string}`;
    sale_type?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    shopify_id?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    notes?: boolean | `@${string}`;
    date_updated?: boolean | `@${string}`;
    date_updated_func?: ResolverInputTypes['datetime_functions'];
    html_file?: [
      {
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_files'],
    ];
    thumbnail?: [
      {
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_files'],
    ];
    vrm_file?: [
      {
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_files'],
    ];
    contributors?: [
      {
        filter?:
          | ResolverInputTypes['products_contributors_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products_contributors'],
    ];
    contributors_func?: ResolverInputTypes['count_functions'];
    materials?: [
      {
        filter?:
          | ResolverInputTypes['products_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products_production_materials'],
    ];
    materials_func?: ResolverInputTypes['count_functions'];
    design_files?: [
      {
        filter?:
          | ResolverInputTypes['products_design_files_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products_design_files'],
    ];
    design_files_func?: ResolverInputTypes['count_functions'];
    content?: [
      {
        filter?:
          | ResolverInputTypes['products_content_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products_content'],
    ];
    content_func?: ResolverInputTypes['count_functions'];
    images?: [
      {
        filter?: ResolverInputTypes['products_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products_files'],
    ];
    images_func?: ResolverInputTypes['count_functions'];
    wearable_files?: [
      {
        filter?:
          | ResolverInputTypes['products_wearables_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products_wearables'],
    ];
    wearable_files_func?: ResolverInputTypes['count_functions'];
    production_methods?: [
      {
        filter?:
          | ResolverInputTypes['products_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products_production_methods'],
    ];
    production_methods_func?: ResolverInputTypes['count_functions'];
    client_invoices?: [
      {
        filter?: ResolverInputTypes['invoices_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['invoices'],
    ];
    client_invoices_func?: ResolverInputTypes['count_functions'];
    production_invoices?: [
      {
        filter?: ResolverInputTypes['invoices_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['invoices'],
    ];
    production_invoices_func?: ResolverInputTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_filter']: {
    created_at?: ResolverInputTypes['date_filter_operators'] | undefined | null;
    created_at_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    description?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    discord_url?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    eth_address?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    logo?: ResolverInputTypes['directus_files_filter'] | undefined | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    notion_id?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    twitter_url?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    website_url?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    products?: ResolverInputTypes['products_filter'] | undefined | null;
    products_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    users?:
      | ResolverInputTypes['brands_directus_users_filter']
      | undefined
      | null;
    users_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ResolverInputTypes['brands_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['brands_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['products_filter']: {
    brand_id?: ResolverInputTypes['brands_filter'] | undefined | null;
    clo3d_file?: ResolverInputTypes['directus_files_filter'] | undefined | null;
    created_at?: ResolverInputTypes['date_filter_operators'] | undefined | null;
    created_at_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    description?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    discord_channel_id?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    fulfiller_id?: ResolverInputTypes['fulfillers_filter'] | undefined | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    nft_token_id?:
      | ResolverInputTypes['number_filter_operators']
      | undefined
      | null;
    notion_id?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    price?: ResolverInputTypes['price_currencies_filter'] | undefined | null;
    producer_id?: ResolverInputTypes['producers_filter'] | undefined | null;
    product_stage?: ResolverInputTypes['stages_filter'] | undefined | null;
    production_cost?:
      | ResolverInputTypes['number_filter_operators']
      | undefined
      | null;
    quantity?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    release_date?:
      | ResolverInputTypes['date_filter_operators']
      | undefined
      | null;
    release_date_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    sale_currency?: ResolverInputTypes['currencies_filter'] | undefined | null;
    sale_price?:
      | ResolverInputTypes['number_filter_operators']
      | undefined
      | null;
    sale_type?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    season?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    shopify_id?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    status?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    notes?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    date_updated?:
      | ResolverInputTypes['date_filter_operators']
      | undefined
      | null;
    date_updated_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    html_file?: ResolverInputTypes['directus_files_filter'] | undefined | null;
    thumbnail?: ResolverInputTypes['directus_files_filter'] | undefined | null;
    vrm_file?: ResolverInputTypes['directus_files_filter'] | undefined | null;
    contributors?:
      | ResolverInputTypes['products_contributors_filter']
      | undefined
      | null;
    contributors_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    materials?:
      | ResolverInputTypes['products_production_materials_filter']
      | undefined
      | null;
    materials_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    design_files?:
      | ResolverInputTypes['products_design_files_filter']
      | undefined
      | null;
    design_files_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    content?: ResolverInputTypes['products_content_filter'] | undefined | null;
    content_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    images?: ResolverInputTypes['products_files_filter'] | undefined | null;
    images_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    wearable_files?:
      | ResolverInputTypes['products_wearables_filter']
      | undefined
      | null;
    wearable_files_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    production_methods?:
      | ResolverInputTypes['products_production_methods_filter']
      | undefined
      | null;
    production_methods_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    client_invoices?: ResolverInputTypes['invoices_filter'] | undefined | null;
    client_invoices_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    production_invoices?:
      | ResolverInputTypes['invoices_filter']
      | undefined
      | null;
    production_invoices_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ResolverInputTypes['products_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['products_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['fulfillers_filter']: {
    address?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    created_at?: ResolverInputTypes['date_filter_operators'] | undefined | null;
    created_at_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    email?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    eth_address?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    website_url?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ResolverInputTypes['fulfillers_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['fulfillers_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['price_currencies_filter']: {
    amount?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    currency?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    _and?:
      | Array<ResolverInputTypes['price_currencies_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['price_currencies_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['producers_filter']: {
    created_at?: ResolverInputTypes['date_filter_operators'] | undefined | null;
    created_at_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    email?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    eth_address?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    shipping_address?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    production_materials_stocked?:
      | ResolverInputTypes['producers_production_materials_filter']
      | undefined
      | null;
    production_materials_stocked_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    production_methods?:
      | ResolverInputTypes['producers_production_methods_filter']
      | undefined
      | null;
    production_methods_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    supplied_materials?:
      | ResolverInputTypes['production_materials_filter']
      | undefined
      | null;
    supplied_materials_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ResolverInputTypes['producers_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['producers_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['producers_production_materials_filter']: {
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    producers_id?: ResolverInputTypes['producers_filter'] | undefined | null;
    production_materials_id?:
      | ResolverInputTypes['production_materials_filter']
      | undefined
      | null;
    quantity?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    _and?:
      | Array<
          | ResolverInputTypes['producers_production_materials_filter']
          | undefined
          | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          | ResolverInputTypes['producers_production_materials_filter']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['production_materials_filter']: {
    base_price?:
      | ResolverInputTypes['number_filter_operators']
      | undefined
      | null;
    color_palette?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    color_palette_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    composition?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    created_at?: ResolverInputTypes['date_filter_operators'] | undefined | null;
    created_at_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    created_by?: ResolverInputTypes['directus_users_filter'] | undefined | null;
    description?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    gender?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    made_in?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    neck_tag?:
      | ResolverInputTypes['boolean_filter_operators']
      | undefined
      | null;
    note?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    rating?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    size_guide?: ResolverInputTypes['directus_files_filter'] | undefined | null;
    supplier?: ResolverInputTypes['producers_filter'] | undefined | null;
    tags?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    tags_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    production_methods?:
      | ResolverInputTypes['production_materials_production_methods_filter']
      | undefined
      | null;
    production_methods_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    stocked_at?:
      | ResolverInputTypes['producers_production_materials_filter']
      | undefined
      | null;
    stocked_at_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    base_assets?:
      | ResolverInputTypes['production_materials_files_filter']
      | undefined
      | null;
    base_assets_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<
          ResolverInputTypes['production_materials_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ResolverInputTypes['production_materials_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['production_materials_production_methods_filter']: {
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    production_materials_id?:
      | ResolverInputTypes['production_materials_filter']
      | undefined
      | null;
    production_methods_id?:
      | ResolverInputTypes['production_methods_filter']
      | undefined
      | null;
    _and?:
      | Array<
          | ResolverInputTypes['production_materials_production_methods_filter']
          | undefined
          | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          | ResolverInputTypes['production_materials_production_methods_filter']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['production_methods_filter']: {
    created_at?: ResolverInputTypes['date_filter_operators'] | undefined | null;
    created_at_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    description?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    producers?:
      | ResolverInputTypes['producers_production_methods_filter']
      | undefined
      | null;
    producers_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    production_materials?:
      | ResolverInputTypes['production_materials_production_methods_filter']
      | undefined
      | null;
    production_materials_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<
          ResolverInputTypes['production_methods_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ResolverInputTypes['production_methods_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['producers_production_methods_filter']: {
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    producers_id?: ResolverInputTypes['producers_filter'] | undefined | null;
    production_methods_id?:
      | ResolverInputTypes['production_methods_filter']
      | undefined
      | null;
    _and?:
      | Array<
          | ResolverInputTypes['producers_production_methods_filter']
          | undefined
          | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          | ResolverInputTypes['producers_production_methods_filter']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['production_materials_files_filter']: {
    directus_files_id?:
      | ResolverInputTypes['directus_files_filter']
      | undefined
      | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    production_materials_id?:
      | ResolverInputTypes['production_materials_filter']
      | undefined
      | null;
    _and?:
      | Array<
          | ResolverInputTypes['production_materials_files_filter']
          | undefined
          | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          | ResolverInputTypes['production_materials_files_filter']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['stages_filter']: {
    description?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    sort?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    _and?:
      | Array<ResolverInputTypes['stages_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['stages_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['currencies_filter']: {
    currency?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    _and?:
      | Array<ResolverInputTypes['currencies_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['currencies_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['products_contributors_filter']: {
    collaborators_id?:
      | ResolverInputTypes['collaborators_filter']
      | undefined
      | null;
    contribution_share?:
      | ResolverInputTypes['number_filter_operators']
      | undefined
      | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    products_id?: ResolverInputTypes['products_filter'] | undefined | null;
    robot_earned?:
      | ResolverInputTypes['number_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<
          ResolverInputTypes['products_contributors_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ResolverInputTypes['products_contributors_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['products_production_materials_filter']: {
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    production_materials_id?:
      | ResolverInputTypes['production_materials_filter']
      | undefined
      | null;
    products_id?: ResolverInputTypes['products_filter'] | undefined | null;
    _and?:
      | Array<
          | ResolverInputTypes['products_production_materials_filter']
          | undefined
          | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          | ResolverInputTypes['products_production_materials_filter']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['products_design_files_filter']: {
    directus_files_id?:
      | ResolverInputTypes['directus_files_filter']
      | undefined
      | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    products_id?: ResolverInputTypes['products_filter'] | undefined | null;
    _and?:
      | Array<
          ResolverInputTypes['products_design_files_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ResolverInputTypes['products_design_files_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['products_content_filter']: {
    directus_files_id?:
      | ResolverInputTypes['directus_files_filter']
      | undefined
      | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    products_id?: ResolverInputTypes['products_filter'] | undefined | null;
    _and?:
      | Array<ResolverInputTypes['products_content_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['products_content_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['products_files_filter']: {
    directus_files_id?:
      | ResolverInputTypes['directus_files_filter']
      | undefined
      | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    products_id?: ResolverInputTypes['products_filter'] | undefined | null;
    _and?:
      | Array<ResolverInputTypes['products_files_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['products_files_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['products_wearables_filter']: {
    directus_files_id?:
      | ResolverInputTypes['directus_files_filter']
      | undefined
      | null;
    file_format?: ResolverInputTypes['file_formats_filter'] | undefined | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    primary?: ResolverInputTypes['boolean_filter_operators'] | undefined | null;
    products_id?: ResolverInputTypes['products_filter'] | undefined | null;
    _and?:
      | Array<
          ResolverInputTypes['products_wearables_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ResolverInputTypes['products_wearables_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['file_formats_filter']: {
    description?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    extension?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    mime_type?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    _and?:
      | Array<ResolverInputTypes['file_formats_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['file_formats_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['products_production_methods_filter']: {
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    production_methods_id?:
      | ResolverInputTypes['production_methods_filter']
      | undefined
      | null;
    products_id?: ResolverInputTypes['products_filter'] | undefined | null;
    _and?:
      | Array<
          | ResolverInputTypes['products_production_methods_filter']
          | undefined
          | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          | ResolverInputTypes['products_production_methods_filter']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['invoices_filter']: {
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    user_created?:
      | ResolverInputTypes['directus_users_filter']
      | undefined
      | null;
    date_created?:
      | ResolverInputTypes['date_filter_operators']
      | undefined
      | null;
    date_created_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    user_updated?:
      | ResolverInputTypes['directus_users_filter']
      | undefined
      | null;
    date_updated?:
      | ResolverInputTypes['date_filter_operators']
      | undefined
      | null;
    date_updated_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    details?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    description?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    status?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    amount?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    transaction_url?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    production_product_id?:
      | ResolverInputTypes['products_filter']
      | undefined
      | null;
    client_product_id?:
      | ResolverInputTypes['products_filter']
      | undefined
      | null;
    _and?:
      | Array<ResolverInputTypes['invoices_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['invoices_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['brands_directus_users_filter']: {
    brands_id?: ResolverInputTypes['brands_filter'] | undefined | null;
    directus_users_id?:
      | ResolverInputTypes['directus_users_filter']
      | undefined
      | null;
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    _and?:
      | Array<
          ResolverInputTypes['brands_directus_users_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ResolverInputTypes['brands_directus_users_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['fulfillers']: AliasType<{
    address?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    created_at_func?: ResolverInputTypes['datetime_functions'];
    email?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    website_url?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['price_currencies']: AliasType<{
    amount?: boolean | `@${string}`;
    currency?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['producers']: AliasType<{
    created_at?: boolean | `@${string}`;
    created_at_func?: ResolverInputTypes['datetime_functions'];
    email?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    shipping_address?: boolean | `@${string}`;
    production_materials_stocked?: [
      {
        filter?:
          | ResolverInputTypes['producers_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['producers_production_materials'],
    ];
    production_materials_stocked_func?: ResolverInputTypes['count_functions'];
    production_methods?: [
      {
        filter?:
          | ResolverInputTypes['producers_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['producers_production_methods'],
    ];
    production_methods_func?: ResolverInputTypes['count_functions'];
    supplied_materials?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['production_materials'],
    ];
    supplied_materials_func?: ResolverInputTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_materials']: AliasType<{
    id?: boolean | `@${string}`;
    producers_id?: [
      {
        filter?: ResolverInputTypes['producers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['producers'],
    ];
    production_materials_id?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['production_materials'],
    ];
    quantity?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials']: AliasType<{
    base_price?: boolean | `@${string}`;
    color_palette?: boolean | `@${string}`;
    color_palette_func?: ResolverInputTypes['count_functions'];
    composition?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    created_at_func?: ResolverInputTypes['datetime_functions'];
    created_by?: [
      {
        filter?: ResolverInputTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_users'],
    ];
    description?: boolean | `@${string}`;
    gender?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    made_in?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    neck_tag?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    rating?: boolean | `@${string}`;
    size_guide?: [
      {
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_files'],
    ];
    supplier?: [
      {
        filter?: ResolverInputTypes['producers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['producers'],
    ];
    tags?: boolean | `@${string}`;
    tags_func?: ResolverInputTypes['count_functions'];
    production_methods?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['production_materials_production_methods'],
    ];
    production_methods_func?: ResolverInputTypes['count_functions'];
    stocked_at?: [
      {
        filter?:
          | ResolverInputTypes['producers_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['producers_production_materials'],
    ];
    stocked_at_func?: ResolverInputTypes['count_functions'];
    base_assets?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_files_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['production_materials_files'],
    ];
    base_assets_func?: ResolverInputTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_production_methods']: AliasType<{
    id?: boolean | `@${string}`;
    production_materials_id?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['production_materials'],
    ];
    production_methods_id?: [
      {
        filter?:
          | ResolverInputTypes['production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['production_methods'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['production_methods']: AliasType<{
    created_at?: boolean | `@${string}`;
    created_at_func?: ResolverInputTypes['datetime_functions'];
    description?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    producers?: [
      {
        filter?:
          | ResolverInputTypes['producers_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['producers_production_methods'],
    ];
    producers_func?: ResolverInputTypes['count_functions'];
    production_materials?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['production_materials_production_methods'],
    ];
    production_materials_func?: ResolverInputTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_methods']: AliasType<{
    id?: boolean | `@${string}`;
    producers_id?: [
      {
        filter?: ResolverInputTypes['producers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['producers'],
    ];
    production_methods_id?: [
      {
        filter?:
          | ResolverInputTypes['production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['production_methods'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_files']: AliasType<{
    directus_files_id?: [
      {
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_files'],
    ];
    id?: boolean | `@${string}`;
    production_materials_id?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['production_materials'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['stages']: AliasType<{
    description?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    sort?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['currencies']: AliasType<{
    currency?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_contributors']: AliasType<{
    collaborators_id?: [
      {
        filter?: ResolverInputTypes['collaborators_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['collaborators'],
    ];
    contribution_share?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    products_id?: [
      {
        filter?: ResolverInputTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products'],
    ];
    robot_earned?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_materials']: AliasType<{
    id?: boolean | `@${string}`;
    production_materials_id?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['production_materials'],
    ];
    products_id?: [
      {
        filter?: ResolverInputTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_design_files']: AliasType<{
    directus_files_id?: [
      {
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_files'],
    ];
    id?: boolean | `@${string}`;
    products_id?: [
      {
        filter?: ResolverInputTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_content']: AliasType<{
    directus_files_id?: [
      {
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_files'],
    ];
    id?: boolean | `@${string}`;
    products_id?: [
      {
        filter?: ResolverInputTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_files']: AliasType<{
    directus_files_id?: [
      {
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_files'],
    ];
    id?: boolean | `@${string}`;
    products_id?: [
      {
        filter?: ResolverInputTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_wearables']: AliasType<{
    directus_files_id?: [
      {
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_files'],
    ];
    file_format?: [
      {
        filter?: ResolverInputTypes['file_formats_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['file_formats'],
    ];
    id?: boolean | `@${string}`;
    primary?: boolean | `@${string}`;
    products_id?: [
      {
        filter?: ResolverInputTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['file_formats']: AliasType<{
    description?: boolean | `@${string}`;
    extension?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    mime_type?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_methods']: AliasType<{
    id?: boolean | `@${string}`;
    production_methods_id?: [
      {
        filter?:
          | ResolverInputTypes['production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['production_methods'],
    ];
    products_id?: [
      {
        filter?: ResolverInputTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['invoices']: AliasType<{
    id?: boolean | `@${string}`;
    user_created?: [
      {
        filter?: ResolverInputTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_users'],
    ];
    date_created?: boolean | `@${string}`;
    date_created_func?: ResolverInputTypes['datetime_functions'];
    user_updated?: [
      {
        filter?: ResolverInputTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_users'],
    ];
    date_updated?: boolean | `@${string}`;
    date_updated_func?: ResolverInputTypes['datetime_functions'];
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    /** Invoice amount in USD */
    amount?: boolean | `@${string}`;
    transaction_url?: boolean | `@${string}`;
    production_product_id?: [
      {
        filter?: ResolverInputTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products'],
    ];
    client_product_id?: [
      {
        filter?: ResolverInputTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_directus_users']: AliasType<{
    brands_id?: [
      {
        filter?: ResolverInputTypes['brands_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['brands'],
    ];
    directus_users_id?: [
      {
        filter?: ResolverInputTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_users'],
    ];
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['brands_aggregated_count'];
    countDistinct?: ResolverInputTypes['brands_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_aggregated_count']: AliasType<{
    created_at?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    discord_url?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    logo?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    twitter_url?: boolean | `@${string}`;
    website_url?: boolean | `@${string}`;
    products?: boolean | `@${string}`;
    users?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_directus_users_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['brands_directus_users_aggregated_count'];
    countDistinct?: ResolverInputTypes['brands_directus_users_aggregated_count'];
    avg?: ResolverInputTypes['brands_directus_users_aggregated_fields'];
    sum?: ResolverInputTypes['brands_directus_users_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['brands_directus_users_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['brands_directus_users_aggregated_fields'];
    min?: ResolverInputTypes['brands_directus_users_aggregated_fields'];
    max?: ResolverInputTypes['brands_directus_users_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_directus_users_aggregated_count']: AliasType<{
    brands_id?: boolean | `@${string}`;
    directus_users_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_directus_users_aggregated_fields']: AliasType<{
    brands_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborators_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['collaborators_aggregated_count'];
    countDistinct?: ResolverInputTypes['collaborators_aggregated_count'];
    avg?: ResolverInputTypes['collaborators_aggregated_fields'];
    sum?: ResolverInputTypes['collaborators_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['collaborators_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['collaborators_aggregated_fields'];
    min?: ResolverInputTypes['collaborators_aggregated_fields'];
    max?: ResolverInputTypes['collaborators_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborators_aggregated_count']: AliasType<{
    account?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    date_updated?: boolean | `@${string}`;
    display_name?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    payment_eth_address?: boolean | `@${string}`;
    role?: boolean | `@${string}`;
    user_created?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborators_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    role?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborator_roles_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['collaborator_roles_aggregated_count'];
    countDistinct?: ResolverInputTypes['collaborator_roles_aggregated_count'];
    avg?: ResolverInputTypes['collaborator_roles_aggregated_fields'];
    sum?: ResolverInputTypes['collaborator_roles_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['collaborator_roles_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['collaborator_roles_aggregated_fields'];
    min?: ResolverInputTypes['collaborator_roles_aggregated_fields'];
    max?: ResolverInputTypes['collaborator_roles_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborator_roles_aggregated_count']: AliasType<{
    description?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborator_roles_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['junction_directus_users_skills_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['junction_directus_users_skills_aggregated_count'];
    countDistinct?: ResolverInputTypes['junction_directus_users_skills_aggregated_count'];
    avg?: ResolverInputTypes['junction_directus_users_skills_aggregated_fields'];
    sum?: ResolverInputTypes['junction_directus_users_skills_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['junction_directus_users_skills_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['junction_directus_users_skills_aggregated_fields'];
    min?: ResolverInputTypes['junction_directus_users_skills_aggregated_fields'];
    max?: ResolverInputTypes['junction_directus_users_skills_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['junction_directus_users_skills_aggregated_count']: AliasType<{
    directus_users_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    skills_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['junction_directus_users_skills_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    skills_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['skills_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['skills_aggregated_count'];
    countDistinct?: ResolverInputTypes['skills_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['skills_aggregated_count']: AliasType<{
    description?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['producers_aggregated_count'];
    countDistinct?: ResolverInputTypes['producers_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_aggregated_count']: AliasType<{
    created_at?: boolean | `@${string}`;
    email?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    shipping_address?: boolean | `@${string}`;
    /** List of production materials in this producers inventory */
    production_materials_stocked?: boolean | `@${string}`;
    production_methods?: boolean | `@${string}`;
    /** Production materials manufactured / sourced by this producer */
    supplied_materials?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_materials_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['producers_production_materials_aggregated_count'];
    countDistinct?: ResolverInputTypes['producers_production_materials_aggregated_count'];
    avg?: ResolverInputTypes['producers_production_materials_aggregated_fields'];
    sum?: ResolverInputTypes['producers_production_materials_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['producers_production_materials_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['producers_production_materials_aggregated_fields'];
    min?: ResolverInputTypes['producers_production_materials_aggregated_fields'];
    max?: ResolverInputTypes['producers_production_materials_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_materials_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    producers_id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    quantity?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_materials_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    producers_id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    quantity?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_methods_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['producers_production_methods_aggregated_count'];
    countDistinct?: ResolverInputTypes['producers_production_methods_aggregated_count'];
    avg?: ResolverInputTypes['producers_production_methods_aggregated_fields'];
    sum?: ResolverInputTypes['producers_production_methods_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['producers_production_methods_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['producers_production_methods_aggregated_fields'];
    min?: ResolverInputTypes['producers_production_methods_aggregated_fields'];
    max?: ResolverInputTypes['producers_production_methods_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_methods_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    producers_id?: boolean | `@${string}`;
    production_methods_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_methods_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    producers_id?: boolean | `@${string}`;
    production_methods_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_methods_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['production_methods_aggregated_count'];
    countDistinct?: ResolverInputTypes['production_methods_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['production_methods_aggregated_count']: AliasType<{
    created_at?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    /** List of producers that are cable of this production method */
    producers?: boolean | `@${string}`;
    production_materials?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_production_methods_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['production_materials_production_methods_aggregated_count'];
    countDistinct?: ResolverInputTypes['production_materials_production_methods_aggregated_count'];
    avg?: ResolverInputTypes['production_materials_production_methods_aggregated_fields'];
    sum?: ResolverInputTypes['production_materials_production_methods_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['production_materials_production_methods_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['production_materials_production_methods_aggregated_fields'];
    min?: ResolverInputTypes['production_materials_production_methods_aggregated_fields'];
    max?: ResolverInputTypes['production_materials_production_methods_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_production_methods_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    production_methods_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_production_methods_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    production_methods_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['fulfillers_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['fulfillers_aggregated_count'];
    countDistinct?: ResolverInputTypes['fulfillers_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['fulfillers_aggregated_count']: AliasType<{
    address?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    email?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    website_url?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['price_currencies_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['price_currencies_aggregated_count'];
    countDistinct?: ResolverInputTypes['price_currencies_aggregated_count'];
    avg?: ResolverInputTypes['price_currencies_aggregated_fields'];
    sum?: ResolverInputTypes['price_currencies_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['price_currencies_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['price_currencies_aggregated_fields'];
    min?: ResolverInputTypes['price_currencies_aggregated_fields'];
    max?: ResolverInputTypes['price_currencies_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['price_currencies_aggregated_count']: AliasType<{
    amount?: boolean | `@${string}`;
    currency?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['price_currencies_aggregated_fields']: AliasType<{
    amount?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['stages_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['stages_aggregated_count'];
    countDistinct?: ResolverInputTypes['stages_aggregated_count'];
    avg?: ResolverInputTypes['stages_aggregated_fields'];
    sum?: ResolverInputTypes['stages_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['stages_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['stages_aggregated_fields'];
    min?: ResolverInputTypes['stages_aggregated_fields'];
    max?: ResolverInputTypes['stages_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['stages_aggregated_count']: AliasType<{
    description?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    sort?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['stages_aggregated_fields']: AliasType<{
    sort?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['currencies_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['currencies_aggregated_count'];
    countDistinct?: ResolverInputTypes['currencies_aggregated_count'];
    avg?: ResolverInputTypes['currencies_aggregated_fields'];
    sum?: ResolverInputTypes['currencies_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['currencies_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['currencies_aggregated_fields'];
    min?: ResolverInputTypes['currencies_aggregated_fields'];
    max?: ResolverInputTypes['currencies_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['currencies_aggregated_count']: AliasType<{
    currency?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['currencies_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_content_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['products_content_aggregated_count'];
    countDistinct?: ResolverInputTypes['products_content_aggregated_count'];
    avg?: ResolverInputTypes['products_content_aggregated_fields'];
    sum?: ResolverInputTypes['products_content_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['products_content_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['products_content_aggregated_fields'];
    min?: ResolverInputTypes['products_content_aggregated_fields'];
    max?: ResolverInputTypes['products_content_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_content_aggregated_count']: AliasType<{
    directus_files_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_content_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_contributors_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['products_contributors_aggregated_count'];
    countDistinct?: ResolverInputTypes['products_contributors_aggregated_count'];
    avg?: ResolverInputTypes['products_contributors_aggregated_fields'];
    sum?: ResolverInputTypes['products_contributors_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['products_contributors_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['products_contributors_aggregated_fields'];
    min?: ResolverInputTypes['products_contributors_aggregated_fields'];
    max?: ResolverInputTypes['products_contributors_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_contributors_aggregated_count']: AliasType<{
    collaborators_id?: boolean | `@${string}`;
    contribution_share?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    robot_earned?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_contributors_aggregated_fields']: AliasType<{
    collaborators_id?: boolean | `@${string}`;
    contribution_share?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    robot_earned?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_design_files_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['products_design_files_aggregated_count'];
    countDistinct?: ResolverInputTypes['products_design_files_aggregated_count'];
    avg?: ResolverInputTypes['products_design_files_aggregated_fields'];
    sum?: ResolverInputTypes['products_design_files_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['products_design_files_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['products_design_files_aggregated_fields'];
    min?: ResolverInputTypes['products_design_files_aggregated_fields'];
    max?: ResolverInputTypes['products_design_files_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_design_files_aggregated_count']: AliasType<{
    directus_files_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_design_files_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_files_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['products_files_aggregated_count'];
    countDistinct?: ResolverInputTypes['products_files_aggregated_count'];
    avg?: ResolverInputTypes['products_files_aggregated_fields'];
    sum?: ResolverInputTypes['products_files_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['products_files_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['products_files_aggregated_fields'];
    min?: ResolverInputTypes['products_files_aggregated_fields'];
    max?: ResolverInputTypes['products_files_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_files_aggregated_count']: AliasType<{
    directus_files_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_files_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_materials_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['products_production_materials_aggregated_count'];
    countDistinct?: ResolverInputTypes['products_production_materials_aggregated_count'];
    avg?: ResolverInputTypes['products_production_materials_aggregated_fields'];
    sum?: ResolverInputTypes['products_production_materials_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['products_production_materials_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['products_production_materials_aggregated_fields'];
    min?: ResolverInputTypes['products_production_materials_aggregated_fields'];
    max?: ResolverInputTypes['products_production_materials_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_materials_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_materials_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_methods_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['products_production_methods_aggregated_count'];
    countDistinct?: ResolverInputTypes['products_production_methods_aggregated_count'];
    avg?: ResolverInputTypes['products_production_methods_aggregated_fields'];
    sum?: ResolverInputTypes['products_production_methods_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['products_production_methods_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['products_production_methods_aggregated_fields'];
    min?: ResolverInputTypes['products_production_methods_aggregated_fields'];
    max?: ResolverInputTypes['products_production_methods_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_methods_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    production_methods_id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_methods_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    production_methods_id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_wearables_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['products_wearables_aggregated_count'];
    countDistinct?: ResolverInputTypes['products_wearables_aggregated_count'];
    avg?: ResolverInputTypes['products_wearables_aggregated_fields'];
    sum?: ResolverInputTypes['products_wearables_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['products_wearables_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['products_wearables_aggregated_fields'];
    min?: ResolverInputTypes['products_wearables_aggregated_fields'];
    max?: ResolverInputTypes['products_wearables_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_wearables_aggregated_count']: AliasType<{
    directus_files_id?: boolean | `@${string}`;
    file_format?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    primary?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_wearables_aggregated_fields']: AliasType<{
    file_format?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['file_formats_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['file_formats_aggregated_count'];
    countDistinct?: ResolverInputTypes['file_formats_aggregated_count'];
    avg?: ResolverInputTypes['file_formats_aggregated_fields'];
    sum?: ResolverInputTypes['file_formats_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['file_formats_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['file_formats_aggregated_fields'];
    min?: ResolverInputTypes['file_formats_aggregated_fields'];
    max?: ResolverInputTypes['file_formats_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['file_formats_aggregated_count']: AliasType<{
    description?: boolean | `@${string}`;
    extension?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    mime_type?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['file_formats_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['products_aggregated_count'];
    countDistinct?: ResolverInputTypes['products_aggregated_count'];
    avg?: ResolverInputTypes['products_aggregated_fields'];
    sum?: ResolverInputTypes['products_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['products_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['products_aggregated_fields'];
    min?: ResolverInputTypes['products_aggregated_fields'];
    max?: ResolverInputTypes['products_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_aggregated_count']: AliasType<{
    brand_id?: boolean | `@${string}`;
    clo3d_file?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    discord_channel_id?: boolean | `@${string}`;
    fulfiller_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    nft_token_id?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    price?: boolean | `@${string}`;
    producer_id?: boolean | `@${string}`;
    product_stage?: boolean | `@${string}`;
    production_cost?: boolean | `@${string}`;
    quantity?: boolean | `@${string}`;
    release_date?: boolean | `@${string}`;
    sale_currency?: boolean | `@${string}`;
    sale_price?: boolean | `@${string}`;
    sale_type?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    shopify_id?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    notes?: boolean | `@${string}`;
    date_updated?: boolean | `@${string}`;
    html_file?: boolean | `@${string}`;
    thumbnail?: boolean | `@${string}`;
    vrm_file?: boolean | `@${string}`;
    contributors?: boolean | `@${string}`;
    materials?: boolean | `@${string}`;
    design_files?: boolean | `@${string}`;
    content?: boolean | `@${string}`;
    images?: boolean | `@${string}`;
    wearable_files?: boolean | `@${string}`;
    production_methods?: boolean | `@${string}`;
    /** Invoices to clients for deposits */
    client_invoices?: boolean | `@${string}`;
    /** Invoices from producers for production costs */
    production_invoices?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_aggregated_fields']: AliasType<{
    brand_id?: boolean | `@${string}`;
    fulfiller_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    nft_token_id?: boolean | `@${string}`;
    price?: boolean | `@${string}`;
    producer_id?: boolean | `@${string}`;
    production_cost?: boolean | `@${string}`;
    quantity?: boolean | `@${string}`;
    sale_currency?: boolean | `@${string}`;
    sale_price?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['production_materials_aggregated_count'];
    countDistinct?: ResolverInputTypes['production_materials_aggregated_count'];
    avg?: ResolverInputTypes['production_materials_aggregated_fields'];
    sum?: ResolverInputTypes['production_materials_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['production_materials_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['production_materials_aggregated_fields'];
    min?: ResolverInputTypes['production_materials_aggregated_fields'];
    max?: ResolverInputTypes['production_materials_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_aggregated_count']: AliasType<{
    base_price?: boolean | `@${string}`;
    color_palette?: boolean | `@${string}`;
    composition?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    created_by?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    gender?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    made_in?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    neck_tag?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    rating?: boolean | `@${string}`;
    size_guide?: boolean | `@${string}`;
    supplier?: boolean | `@${string}`;
    tags?: boolean | `@${string}`;
    production_methods?: boolean | `@${string}`;
    stocked_at?: boolean | `@${string}`;
    /** Design files, mockups, base meshes for wearbles, CLO3d files, etc */
    base_assets?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_aggregated_fields']: AliasType<{
    base_price?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    supplier?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['invoices_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['invoices_aggregated_count'];
    countDistinct?: ResolverInputTypes['invoices_aggregated_count'];
    avg?: ResolverInputTypes['invoices_aggregated_fields'];
    sum?: ResolverInputTypes['invoices_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['invoices_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['invoices_aggregated_fields'];
    min?: ResolverInputTypes['invoices_aggregated_fields'];
    max?: ResolverInputTypes['invoices_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['invoices_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    user_created?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    user_updated?: boolean | `@${string}`;
    date_updated?: boolean | `@${string}`;
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    /** Invoice amount in USD */
    amount?: boolean | `@${string}`;
    transaction_url?: boolean | `@${string}`;
    /** The product that this production invoice is for */
    production_product_id?: boolean | `@${string}`;
    /** Invoices to clients for a given product */
    client_product_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['invoices_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    /** Invoice amount in USD */
    amount?: boolean | `@${string}`;
    /** The product that this production invoice is for */
    production_product_id?: boolean | `@${string}`;
    /** Invoices to clients for a given product */
    client_product_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_files_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['production_materials_files_aggregated_count'];
    countDistinct?: ResolverInputTypes['production_materials_files_aggregated_count'];
    avg?: ResolverInputTypes['production_materials_files_aggregated_fields'];
    sum?: ResolverInputTypes['production_materials_files_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['production_materials_files_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['production_materials_files_aggregated_fields'];
    min?: ResolverInputTypes['production_materials_files_aggregated_fields'];
    max?: ResolverInputTypes['production_materials_files_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_files_aggregated_count']: AliasType<{
    directus_files_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_files_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['Mutation']: AliasType<{
    create_brands_items?: [
      {
        filter?: ResolverInputTypes['brands_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_brands_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['brands'],
    ];
    create_brands_item?: [
      { data: ResolverInputTypes['create_brands_input'] },
      ResolverInputTypes['brands'],
    ];
    create_brands_directus_users_items?: [
      {
        filter?:
          | ResolverInputTypes['brands_directus_users_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_brands_directus_users_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['brands_directus_users'],
    ];
    create_brands_directus_users_item?: [
      { data: ResolverInputTypes['create_brands_directus_users_input'] },
      ResolverInputTypes['brands_directus_users'],
    ];
    create_collaborators_items?: [
      {
        filter?: ResolverInputTypes['collaborators_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_collaborators_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['collaborators'],
    ];
    create_collaborators_item?: [
      { data: ResolverInputTypes['create_collaborators_input'] },
      ResolverInputTypes['collaborators'],
    ];
    create_collaborator_roles_items?: [
      {
        filter?:
          | ResolverInputTypes['collaborator_roles_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_collaborator_roles_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['collaborator_roles'],
    ];
    create_collaborator_roles_item?: [
      { data: ResolverInputTypes['create_collaborator_roles_input'] },
      ResolverInputTypes['collaborator_roles'],
    ];
    create_junction_directus_users_skills_items?: [
      {
        filter?:
          | ResolverInputTypes['junction_directus_users_skills_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<
              ResolverInputTypes['create_junction_directus_users_skills_input']
            >
          | undefined
          | null;
      },
      ResolverInputTypes['junction_directus_users_skills'],
    ];
    create_junction_directus_users_skills_item?: [
      {
        data: ResolverInputTypes['create_junction_directus_users_skills_input'];
      },
      ResolverInputTypes['junction_directus_users_skills'],
    ];
    create_skills_items?: [
      {
        filter?: ResolverInputTypes['skills_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_skills_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['skills'],
    ];
    create_skills_item?: [
      { data: ResolverInputTypes['create_skills_input'] },
      ResolverInputTypes['skills'],
    ];
    create_producers_items?: [
      {
        filter?: ResolverInputTypes['producers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_producers_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['producers'],
    ];
    create_producers_item?: [
      { data: ResolverInputTypes['create_producers_input'] },
      ResolverInputTypes['producers'],
    ];
    create_producers_production_materials_items?: [
      {
        filter?:
          | ResolverInputTypes['producers_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<
              ResolverInputTypes['create_producers_production_materials_input']
            >
          | undefined
          | null;
      },
      ResolverInputTypes['producers_production_materials'],
    ];
    create_producers_production_materials_item?: [
      {
        data: ResolverInputTypes['create_producers_production_materials_input'];
      },
      ResolverInputTypes['producers_production_materials'],
    ];
    create_producers_production_methods_items?: [
      {
        filter?:
          | ResolverInputTypes['producers_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<
              ResolverInputTypes['create_producers_production_methods_input']
            >
          | undefined
          | null;
      },
      ResolverInputTypes['producers_production_methods'],
    ];
    create_producers_production_methods_item?: [
      { data: ResolverInputTypes['create_producers_production_methods_input'] },
      ResolverInputTypes['producers_production_methods'],
    ];
    create_production_methods_items?: [
      {
        filter?:
          | ResolverInputTypes['production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_production_methods_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['production_methods'],
    ];
    create_production_methods_item?: [
      { data: ResolverInputTypes['create_production_methods_input'] },
      ResolverInputTypes['production_methods'],
    ];
    create_production_materials_production_methods_items?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<
              ResolverInputTypes['create_production_materials_production_methods_input']
            >
          | undefined
          | null;
      },
      ResolverInputTypes['production_materials_production_methods'],
    ];
    create_production_materials_production_methods_item?: [
      {
        data: ResolverInputTypes['create_production_materials_production_methods_input'];
      },
      ResolverInputTypes['production_materials_production_methods'],
    ];
    create_fulfillers_items?: [
      {
        filter?: ResolverInputTypes['fulfillers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_fulfillers_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['fulfillers'],
    ];
    create_fulfillers_item?: [
      { data: ResolverInputTypes['create_fulfillers_input'] },
      ResolverInputTypes['fulfillers'],
    ];
    create_price_currencies_items?: [
      {
        filter?:
          | ResolverInputTypes['price_currencies_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_price_currencies_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['price_currencies'],
    ];
    create_price_currencies_item?: [
      { data: ResolverInputTypes['create_price_currencies_input'] },
      ResolverInputTypes['price_currencies'],
    ];
    create_stages_items?: [
      {
        filter?: ResolverInputTypes['stages_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_stages_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['stages'],
    ];
    create_stages_item?: [
      { data: ResolverInputTypes['create_stages_input'] },
      ResolverInputTypes['stages'],
    ];
    create_currencies_items?: [
      {
        filter?: ResolverInputTypes['currencies_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_currencies_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['currencies'],
    ];
    create_currencies_item?: [
      { data: ResolverInputTypes['create_currencies_input'] },
      ResolverInputTypes['currencies'],
    ];
    create_products_content_items?: [
      {
        filter?:
          | ResolverInputTypes['products_content_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_products_content_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['products_content'],
    ];
    create_products_content_item?: [
      { data: ResolverInputTypes['create_products_content_input'] },
      ResolverInputTypes['products_content'],
    ];
    create_products_contributors_items?: [
      {
        filter?:
          | ResolverInputTypes['products_contributors_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_products_contributors_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['products_contributors'],
    ];
    create_products_contributors_item?: [
      { data: ResolverInputTypes['create_products_contributors_input'] },
      ResolverInputTypes['products_contributors'],
    ];
    create_products_design_files_items?: [
      {
        filter?:
          | ResolverInputTypes['products_design_files_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_products_design_files_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['products_design_files'],
    ];
    create_products_design_files_item?: [
      { data: ResolverInputTypes['create_products_design_files_input'] },
      ResolverInputTypes['products_design_files'],
    ];
    create_products_files_items?: [
      {
        filter?: ResolverInputTypes['products_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_products_files_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['products_files'],
    ];
    create_products_files_item?: [
      { data: ResolverInputTypes['create_products_files_input'] },
      ResolverInputTypes['products_files'],
    ];
    create_products_production_materials_items?: [
      {
        filter?:
          | ResolverInputTypes['products_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<
              ResolverInputTypes['create_products_production_materials_input']
            >
          | undefined
          | null;
      },
      ResolverInputTypes['products_production_materials'],
    ];
    create_products_production_materials_item?: [
      {
        data: ResolverInputTypes['create_products_production_materials_input'];
      },
      ResolverInputTypes['products_production_materials'],
    ];
    create_products_production_methods_items?: [
      {
        filter?:
          | ResolverInputTypes['products_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<
              ResolverInputTypes['create_products_production_methods_input']
            >
          | undefined
          | null;
      },
      ResolverInputTypes['products_production_methods'],
    ];
    create_products_production_methods_item?: [
      { data: ResolverInputTypes['create_products_production_methods_input'] },
      ResolverInputTypes['products_production_methods'],
    ];
    create_products_wearables_items?: [
      {
        filter?:
          | ResolverInputTypes['products_wearables_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_products_wearables_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['products_wearables'],
    ];
    create_products_wearables_item?: [
      { data: ResolverInputTypes['create_products_wearables_input'] },
      ResolverInputTypes['products_wearables'],
    ];
    create_file_formats_items?: [
      {
        filter?: ResolverInputTypes['file_formats_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_file_formats_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['file_formats'],
    ];
    create_file_formats_item?: [
      { data: ResolverInputTypes['create_file_formats_input'] },
      ResolverInputTypes['file_formats'],
    ];
    create_products_items?: [
      {
        filter?: ResolverInputTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_products_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['products'],
    ];
    create_products_item?: [
      { data: ResolverInputTypes['create_products_input'] },
      ResolverInputTypes['products'],
    ];
    create_production_materials_items?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_production_materials_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['production_materials'],
    ];
    create_production_materials_item?: [
      { data: ResolverInputTypes['create_production_materials_input'] },
      ResolverInputTypes['production_materials'],
    ];
    create_invoices_items?: [
      {
        filter?: ResolverInputTypes['invoices_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_invoices_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['invoices'],
    ];
    create_invoices_item?: [
      { data: ResolverInputTypes['create_invoices_input'] },
      ResolverInputTypes['invoices'],
    ];
    create_production_materials_files_items?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_files_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_production_materials_files_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['production_materials_files'],
    ];
    create_production_materials_files_item?: [
      { data: ResolverInputTypes['create_production_materials_files_input'] },
      ResolverInputTypes['production_materials_files'],
    ];
    update_brands_items?: [
      {
        filter?: ResolverInputTypes['brands_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_brands_input'];
      },
      ResolverInputTypes['brands'],
    ];
    update_brands_batch?: [
      {
        filter?: ResolverInputTypes['brands_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_brands_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['brands'],
    ];
    update_brands_item?: [
      { id: string; data: ResolverInputTypes['update_brands_input'] },
      ResolverInputTypes['brands'],
    ];
    update_brands_directus_users_items?: [
      {
        filter?:
          | ResolverInputTypes['brands_directus_users_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_brands_directus_users_input'];
      },
      ResolverInputTypes['brands_directus_users'],
    ];
    update_brands_directus_users_batch?: [
      {
        filter?:
          | ResolverInputTypes['brands_directus_users_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_brands_directus_users_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['brands_directus_users'],
    ];
    update_brands_directus_users_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_brands_directus_users_input'];
      },
      ResolverInputTypes['brands_directus_users'],
    ];
    update_collaborators_items?: [
      {
        filter?: ResolverInputTypes['collaborators_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_collaborators_input'];
      },
      ResolverInputTypes['collaborators'],
    ];
    update_collaborators_batch?: [
      {
        filter?: ResolverInputTypes['collaborators_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_collaborators_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['collaborators'],
    ];
    update_collaborators_item?: [
      { id: string; data: ResolverInputTypes['update_collaborators_input'] },
      ResolverInputTypes['collaborators'],
    ];
    update_collaborator_roles_items?: [
      {
        filter?:
          | ResolverInputTypes['collaborator_roles_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_collaborator_roles_input'];
      },
      ResolverInputTypes['collaborator_roles'],
    ];
    update_collaborator_roles_batch?: [
      {
        filter?:
          | ResolverInputTypes['collaborator_roles_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_collaborator_roles_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['collaborator_roles'],
    ];
    update_collaborator_roles_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_collaborator_roles_input'];
      },
      ResolverInputTypes['collaborator_roles'],
    ];
    update_junction_directus_users_skills_items?: [
      {
        filter?:
          | ResolverInputTypes['junction_directus_users_skills_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_junction_directus_users_skills_input'];
      },
      ResolverInputTypes['junction_directus_users_skills'],
    ];
    update_junction_directus_users_skills_batch?: [
      {
        filter?:
          | ResolverInputTypes['junction_directus_users_skills_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<
              ResolverInputTypes['update_junction_directus_users_skills_input']
            >
          | undefined
          | null;
      },
      ResolverInputTypes['junction_directus_users_skills'],
    ];
    update_junction_directus_users_skills_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_junction_directus_users_skills_input'];
      },
      ResolverInputTypes['junction_directus_users_skills'],
    ];
    update_skills_items?: [
      {
        filter?: ResolverInputTypes['skills_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_skills_input'];
      },
      ResolverInputTypes['skills'],
    ];
    update_skills_batch?: [
      {
        filter?: ResolverInputTypes['skills_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_skills_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['skills'],
    ];
    update_skills_item?: [
      { id: string; data: ResolverInputTypes['update_skills_input'] },
      ResolverInputTypes['skills'],
    ];
    update_producers_items?: [
      {
        filter?: ResolverInputTypes['producers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_producers_input'];
      },
      ResolverInputTypes['producers'],
    ];
    update_producers_batch?: [
      {
        filter?: ResolverInputTypes['producers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_producers_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['producers'],
    ];
    update_producers_item?: [
      { id: string; data: ResolverInputTypes['update_producers_input'] },
      ResolverInputTypes['producers'],
    ];
    update_producers_production_materials_items?: [
      {
        filter?:
          | ResolverInputTypes['producers_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_producers_production_materials_input'];
      },
      ResolverInputTypes['producers_production_materials'],
    ];
    update_producers_production_materials_batch?: [
      {
        filter?:
          | ResolverInputTypes['producers_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<
              ResolverInputTypes['update_producers_production_materials_input']
            >
          | undefined
          | null;
      },
      ResolverInputTypes['producers_production_materials'],
    ];
    update_producers_production_materials_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_producers_production_materials_input'];
      },
      ResolverInputTypes['producers_production_materials'],
    ];
    update_producers_production_methods_items?: [
      {
        filter?:
          | ResolverInputTypes['producers_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_producers_production_methods_input'];
      },
      ResolverInputTypes['producers_production_methods'],
    ];
    update_producers_production_methods_batch?: [
      {
        filter?:
          | ResolverInputTypes['producers_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<
              ResolverInputTypes['update_producers_production_methods_input']
            >
          | undefined
          | null;
      },
      ResolverInputTypes['producers_production_methods'],
    ];
    update_producers_production_methods_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_producers_production_methods_input'];
      },
      ResolverInputTypes['producers_production_methods'],
    ];
    update_production_methods_items?: [
      {
        filter?:
          | ResolverInputTypes['production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_production_methods_input'];
      },
      ResolverInputTypes['production_methods'],
    ];
    update_production_methods_batch?: [
      {
        filter?:
          | ResolverInputTypes['production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_production_methods_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['production_methods'],
    ];
    update_production_methods_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_production_methods_input'];
      },
      ResolverInputTypes['production_methods'],
    ];
    update_production_materials_production_methods_items?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_production_materials_production_methods_input'];
      },
      ResolverInputTypes['production_materials_production_methods'],
    ];
    update_production_materials_production_methods_batch?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<
              ResolverInputTypes['update_production_materials_production_methods_input']
            >
          | undefined
          | null;
      },
      ResolverInputTypes['production_materials_production_methods'],
    ];
    update_production_materials_production_methods_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_production_materials_production_methods_input'];
      },
      ResolverInputTypes['production_materials_production_methods'],
    ];
    update_fulfillers_items?: [
      {
        filter?: ResolverInputTypes['fulfillers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_fulfillers_input'];
      },
      ResolverInputTypes['fulfillers'],
    ];
    update_fulfillers_batch?: [
      {
        filter?: ResolverInputTypes['fulfillers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_fulfillers_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['fulfillers'],
    ];
    update_fulfillers_item?: [
      { id: string; data: ResolverInputTypes['update_fulfillers_input'] },
      ResolverInputTypes['fulfillers'],
    ];
    update_price_currencies_items?: [
      {
        filter?:
          | ResolverInputTypes['price_currencies_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_price_currencies_input'];
      },
      ResolverInputTypes['price_currencies'],
    ];
    update_price_currencies_batch?: [
      {
        filter?:
          | ResolverInputTypes['price_currencies_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_price_currencies_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['price_currencies'],
    ];
    update_price_currencies_item?: [
      { id: string; data: ResolverInputTypes['update_price_currencies_input'] },
      ResolverInputTypes['price_currencies'],
    ];
    update_stages_items?: [
      {
        filter?: ResolverInputTypes['stages_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_stages_input'];
      },
      ResolverInputTypes['stages'],
    ];
    update_stages_batch?: [
      {
        filter?: ResolverInputTypes['stages_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_stages_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['stages'],
    ];
    update_stages_item?: [
      { id: string; data: ResolverInputTypes['update_stages_input'] },
      ResolverInputTypes['stages'],
    ];
    update_currencies_items?: [
      {
        filter?: ResolverInputTypes['currencies_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_currencies_input'];
      },
      ResolverInputTypes['currencies'],
    ];
    update_currencies_batch?: [
      {
        filter?: ResolverInputTypes['currencies_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_currencies_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['currencies'],
    ];
    update_currencies_item?: [
      { id: string; data: ResolverInputTypes['update_currencies_input'] },
      ResolverInputTypes['currencies'],
    ];
    update_products_content_items?: [
      {
        filter?:
          | ResolverInputTypes['products_content_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_products_content_input'];
      },
      ResolverInputTypes['products_content'],
    ];
    update_products_content_batch?: [
      {
        filter?:
          | ResolverInputTypes['products_content_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_products_content_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['products_content'],
    ];
    update_products_content_item?: [
      { id: string; data: ResolverInputTypes['update_products_content_input'] },
      ResolverInputTypes['products_content'],
    ];
    update_products_contributors_items?: [
      {
        filter?:
          | ResolverInputTypes['products_contributors_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_products_contributors_input'];
      },
      ResolverInputTypes['products_contributors'],
    ];
    update_products_contributors_batch?: [
      {
        filter?:
          | ResolverInputTypes['products_contributors_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_products_contributors_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['products_contributors'],
    ];
    update_products_contributors_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_products_contributors_input'];
      },
      ResolverInputTypes['products_contributors'],
    ];
    update_products_design_files_items?: [
      {
        filter?:
          | ResolverInputTypes['products_design_files_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_products_design_files_input'];
      },
      ResolverInputTypes['products_design_files'],
    ];
    update_products_design_files_batch?: [
      {
        filter?:
          | ResolverInputTypes['products_design_files_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_products_design_files_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['products_design_files'],
    ];
    update_products_design_files_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_products_design_files_input'];
      },
      ResolverInputTypes['products_design_files'],
    ];
    update_products_files_items?: [
      {
        filter?: ResolverInputTypes['products_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_products_files_input'];
      },
      ResolverInputTypes['products_files'],
    ];
    update_products_files_batch?: [
      {
        filter?: ResolverInputTypes['products_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_products_files_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['products_files'],
    ];
    update_products_files_item?: [
      { id: string; data: ResolverInputTypes['update_products_files_input'] },
      ResolverInputTypes['products_files'],
    ];
    update_products_production_materials_items?: [
      {
        filter?:
          | ResolverInputTypes['products_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_products_production_materials_input'];
      },
      ResolverInputTypes['products_production_materials'],
    ];
    update_products_production_materials_batch?: [
      {
        filter?:
          | ResolverInputTypes['products_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<
              ResolverInputTypes['update_products_production_materials_input']
            >
          | undefined
          | null;
      },
      ResolverInputTypes['products_production_materials'],
    ];
    update_products_production_materials_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_products_production_materials_input'];
      },
      ResolverInputTypes['products_production_materials'],
    ];
    update_products_production_methods_items?: [
      {
        filter?:
          | ResolverInputTypes['products_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_products_production_methods_input'];
      },
      ResolverInputTypes['products_production_methods'],
    ];
    update_products_production_methods_batch?: [
      {
        filter?:
          | ResolverInputTypes['products_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<
              ResolverInputTypes['update_products_production_methods_input']
            >
          | undefined
          | null;
      },
      ResolverInputTypes['products_production_methods'],
    ];
    update_products_production_methods_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_products_production_methods_input'];
      },
      ResolverInputTypes['products_production_methods'],
    ];
    update_products_wearables_items?: [
      {
        filter?:
          | ResolverInputTypes['products_wearables_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_products_wearables_input'];
      },
      ResolverInputTypes['products_wearables'],
    ];
    update_products_wearables_batch?: [
      {
        filter?:
          | ResolverInputTypes['products_wearables_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_products_wearables_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['products_wearables'],
    ];
    update_products_wearables_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_products_wearables_input'];
      },
      ResolverInputTypes['products_wearables'],
    ];
    update_file_formats_items?: [
      {
        filter?: ResolverInputTypes['file_formats_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_file_formats_input'];
      },
      ResolverInputTypes['file_formats'],
    ];
    update_file_formats_batch?: [
      {
        filter?: ResolverInputTypes['file_formats_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_file_formats_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['file_formats'],
    ];
    update_file_formats_item?: [
      { id: string; data: ResolverInputTypes['update_file_formats_input'] },
      ResolverInputTypes['file_formats'],
    ];
    update_products_items?: [
      {
        filter?: ResolverInputTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_products_input'];
      },
      ResolverInputTypes['products'],
    ];
    update_products_batch?: [
      {
        filter?: ResolverInputTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_products_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['products'],
    ];
    update_products_item?: [
      { id: string; data: ResolverInputTypes['update_products_input'] },
      ResolverInputTypes['products'],
    ];
    update_production_materials_items?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_production_materials_input'];
      },
      ResolverInputTypes['production_materials'],
    ];
    update_production_materials_batch?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_production_materials_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['production_materials'],
    ];
    update_production_materials_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_production_materials_input'];
      },
      ResolverInputTypes['production_materials'],
    ];
    update_invoices_items?: [
      {
        filter?: ResolverInputTypes['invoices_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_invoices_input'];
      },
      ResolverInputTypes['invoices'],
    ];
    update_invoices_batch?: [
      {
        filter?: ResolverInputTypes['invoices_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_invoices_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['invoices'],
    ];
    update_invoices_item?: [
      { id: string; data: ResolverInputTypes['update_invoices_input'] },
      ResolverInputTypes['invoices'],
    ];
    update_production_materials_files_items?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_files_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_production_materials_files_input'];
      },
      ResolverInputTypes['production_materials_files'],
    ];
    update_production_materials_files_batch?: [
      {
        filter?:
          | ResolverInputTypes['production_materials_files_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_production_materials_files_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['production_materials_files'],
    ];
    update_production_materials_files_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_production_materials_files_input'];
      },
      ResolverInputTypes['production_materials_files'],
    ];
    delete_brands_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_brands_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_brands_directus_users_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_brands_directus_users_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_collaborators_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_collaborators_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_collaborator_roles_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_collaborator_roles_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_junction_directus_users_skills_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_junction_directus_users_skills_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_skills_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_skills_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_producers_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_producers_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_producers_production_materials_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_producers_production_materials_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_producers_production_methods_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_producers_production_methods_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_production_methods_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_production_methods_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_production_materials_production_methods_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_production_materials_production_methods_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_fulfillers_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_fulfillers_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_price_currencies_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_price_currencies_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_stages_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_stages_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_currencies_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_currencies_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_products_content_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_products_content_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_products_contributors_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_products_contributors_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_products_design_files_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_products_design_files_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_products_files_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_products_files_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_products_production_materials_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_products_production_materials_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_products_production_methods_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_products_production_methods_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_products_wearables_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_products_wearables_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_file_formats_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_file_formats_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_products_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_products_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_production_materials_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_production_materials_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_invoices_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_invoices_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_production_materials_files_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_production_materials_files_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['create_brands_input']: {
    created_at?: ResolverInputTypes['Date'] | undefined | null;
    description?: string | undefined | null;
    discord_url?: string | undefined | null;
    eth_address?: string | undefined | null;
    id?: string | undefined | null;
    logo?: ResolverInputTypes['create_directus_files_input'] | undefined | null;
    name: string;
    notion_id?: string | undefined | null;
    twitter_url?: string | undefined | null;
    website_url?: string | undefined | null;
    products?:
      | Array<ResolverInputTypes['create_products_input'] | undefined | null>
      | undefined
      | null;
    users?:
      | Array<
          | ResolverInputTypes['create_brands_directus_users_input']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['create_directus_files_input']: {
    id?: string | undefined | null;
    storage: string;
    filename_disk?: string | undefined | null;
    filename_download: string;
    title?: string | undefined | null;
    type?: string | undefined | null;
    folder?:
      | ResolverInputTypes['create_directus_folders_input']
      | undefined
      | null;
    uploaded_by?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
    uploaded_on?: ResolverInputTypes['Date'] | undefined | null;
    modified_by?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
    modified_on?: ResolverInputTypes['Date'] | undefined | null;
    charset?: string | undefined | null;
    filesize?: ResolverInputTypes['GraphQLBigInt'] | undefined | null;
    width?: number | undefined | null;
    height?: number | undefined | null;
    duration?: number | undefined | null;
    embed?: string | undefined | null;
    description?: string | undefined | null;
    location?: string | undefined | null;
    tags?: ResolverInputTypes['JSON'] | undefined | null;
    metadata?: ResolverInputTypes['JSON'] | undefined | null;
  };
  ['create_directus_folders_input']: {
    id?: string | undefined | null;
    name: string;
    parent?:
      | ResolverInputTypes['create_directus_folders_input']
      | undefined
      | null;
  };
  ['create_directus_users_input']: {
    id?: string | undefined | null;
    first_name?: string | undefined | null;
    last_name?: string | undefined | null;
    email?: string | undefined | null;
    password?: ResolverInputTypes['Hash'] | undefined | null;
    location?: string | undefined | null;
    title?: string | undefined | null;
    description?: string | undefined | null;
    tags?: ResolverInputTypes['JSON'] | undefined | null;
    avatar?:
      | ResolverInputTypes['create_directus_files_input']
      | undefined
      | null;
    language?: string | undefined | null;
    theme?: string | undefined | null;
    tfa_secret?: ResolverInputTypes['Hash'] | undefined | null;
    status?: string | undefined | null;
    role?: ResolverInputTypes['create_directus_roles_input'] | undefined | null;
    token?: ResolverInputTypes['Hash'] | undefined | null;
    last_access?: ResolverInputTypes['Date'] | undefined | null;
    last_page?: string | undefined | null;
    provider?: string | undefined | null;
    external_identifier?: string | undefined | null;
    auth_data?: ResolverInputTypes['JSON'] | undefined | null;
    email_notifications?: boolean | undefined | null;
    discord_handle?: string | undefined | null;
    discord_id?: string | undefined | null;
    timezone?: string | undefined | null;
    twitter_handle?: string | undefined | null;
    collaborators?:
      | Array<
          ResolverInputTypes['create_collaborators_input'] | undefined | null
        >
      | undefined
      | null;
    skills?:
      | Array<
          | ResolverInputTypes['create_junction_directus_users_skills_input']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['create_directus_roles_input']: {
    id?: string | undefined | null;
    name: string;
    icon?: string | undefined | null;
    description?: string | undefined | null;
    ip_access?: Array<string | undefined | null> | undefined | null;
    enforce_tfa: boolean;
    admin_access: boolean;
    app_access?: boolean | undefined | null;
    users?:
      | Array<
          ResolverInputTypes['create_directus_users_input'] | undefined | null
        >
      | undefined
      | null;
  };
  ['create_collaborators_input']: {
    account?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
    date_created?: ResolverInputTypes['Date'] | undefined | null;
    date_updated?: ResolverInputTypes['Date'] | undefined | null;
    display_name?: string | undefined | null;
    id?: string | undefined | null;
    payment_eth_address?: string | undefined | null;
    role?:
      | ResolverInputTypes['create_collaborator_roles_input']
      | undefined
      | null;
    user_created?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
  };
  ['create_collaborator_roles_input']: {
    description?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
  };
  ['create_junction_directus_users_skills_input']: {
    directus_users_id?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
    id?: string | undefined | null;
    skills_id?: ResolverInputTypes['create_skills_input'] | undefined | null;
  };
  ['create_skills_input']: {
    description?: string | undefined | null;
    id?: string | undefined | null;
    name: string;
  };
  ['create_products_input']: {
    brand_id?: ResolverInputTypes['create_brands_input'] | undefined | null;
    clo3d_file?:
      | ResolverInputTypes['create_directus_files_input']
      | undefined
      | null;
    created_at?: ResolverInputTypes['Date'] | undefined | null;
    description?: string | undefined | null;
    discord_channel_id?: string | undefined | null;
    fulfiller_id?:
      | ResolverInputTypes['create_fulfillers_input']
      | undefined
      | null;
    id?: string | undefined | null;
    name: string;
    nft_token_id?: number | undefined | null;
    notion_id?: string | undefined | null;
    price?:
      | ResolverInputTypes['create_price_currencies_input']
      | undefined
      | null;
    producer_id?:
      | ResolverInputTypes['create_producers_input']
      | undefined
      | null;
    product_stage?:
      | ResolverInputTypes['create_stages_input']
      | undefined
      | null;
    production_cost?: number | undefined | null;
    quantity?: ResolverInputTypes['GraphQLBigInt'] | undefined | null;
    release_date?: ResolverInputTypes['Date'] | undefined | null;
    sale_currency?:
      | ResolverInputTypes['create_currencies_input']
      | undefined
      | null;
    sale_price?: number | undefined | null;
    sale_type?: string | undefined | null;
    season?: number | undefined | null;
    shopify_id?: string | undefined | null;
    status?: string | undefined | null;
    notes?: string | undefined | null;
    date_updated?: ResolverInputTypes['Date'] | undefined | null;
    html_file?:
      | ResolverInputTypes['create_directus_files_input']
      | undefined
      | null;
    thumbnail?:
      | ResolverInputTypes['create_directus_files_input']
      | undefined
      | null;
    vrm_file?:
      | ResolverInputTypes['create_directus_files_input']
      | undefined
      | null;
    contributors?:
      | Array<
          | ResolverInputTypes['create_products_contributors_input']
          | undefined
          | null
        >
      | undefined
      | null;
    materials?:
      | Array<
          | ResolverInputTypes['create_products_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null;
    design_files?:
      | Array<
          | ResolverInputTypes['create_products_design_files_input']
          | undefined
          | null
        >
      | undefined
      | null;
    content?:
      | Array<
          ResolverInputTypes['create_products_content_input'] | undefined | null
        >
      | undefined
      | null;
    images?:
      | Array<
          ResolverInputTypes['create_products_files_input'] | undefined | null
        >
      | undefined
      | null;
    wearable_files?:
      | Array<
          | ResolverInputTypes['create_products_wearables_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_methods?:
      | Array<
          | ResolverInputTypes['create_products_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    client_invoices?:
      | Array<ResolverInputTypes['create_invoices_input'] | undefined | null>
      | undefined
      | null;
    production_invoices?:
      | Array<ResolverInputTypes['create_invoices_input'] | undefined | null>
      | undefined
      | null;
  };
  ['create_fulfillers_input']: {
    address?: string | undefined | null;
    created_at?: ResolverInputTypes['Date'] | undefined | null;
    email?: string | undefined | null;
    eth_address?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
    website_url?: string | undefined | null;
  };
  ['create_price_currencies_input']: {
    amount: number;
    currency?: string | undefined | null;
    id?: string | undefined | null;
  };
  ['create_producers_input']: {
    created_at?: ResolverInputTypes['Date'] | undefined | null;
    email?: string | undefined | null;
    eth_address?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
    shipping_address?: string | undefined | null;
    production_materials_stocked?:
      | Array<
          | ResolverInputTypes['create_producers_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_methods?:
      | Array<
          | ResolverInputTypes['create_producers_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    supplied_materials?:
      | Array<
          | ResolverInputTypes['create_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['create_producers_production_materials_input']: {
    id?: string | undefined | null;
    producers_id?:
      | ResolverInputTypes['create_producers_input']
      | undefined
      | null;
    production_materials_id?:
      | ResolverInputTypes['create_production_materials_input']
      | undefined
      | null;
    quantity?: number | undefined | null;
  };
  ['create_production_materials_input']: {
    base_price?: number | undefined | null;
    color_palette?: ResolverInputTypes['JSON'] | undefined | null;
    composition?: string | undefined | null;
    created_at?: ResolverInputTypes['Date'] | undefined | null;
    created_by?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
    description?: string | undefined | null;
    gender?: string | undefined | null;
    id?: string | undefined | null;
    made_in?: string | undefined | null;
    name?: string | undefined | null;
    neck_tag?: boolean | undefined | null;
    note?: string | undefined | null;
    rating?: string | undefined | null;
    size_guide?:
      | ResolverInputTypes['create_directus_files_input']
      | undefined
      | null;
    supplier?: ResolverInputTypes['create_producers_input'] | undefined | null;
    tags?: ResolverInputTypes['JSON'] | undefined | null;
    production_methods?:
      | Array<
          | ResolverInputTypes['create_production_materials_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    stocked_at?:
      | Array<
          | ResolverInputTypes['create_producers_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null;
    base_assets?:
      | Array<
          | ResolverInputTypes['create_production_materials_files_input']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['create_production_materials_production_methods_input']: {
    id?: string | undefined | null;
    production_materials_id?:
      | ResolverInputTypes['create_production_materials_input']
      | undefined
      | null;
    production_methods_id?:
      | ResolverInputTypes['create_production_methods_input']
      | undefined
      | null;
  };
  ['create_production_methods_input']: {
    created_at?: ResolverInputTypes['Date'] | undefined | null;
    description?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
    producers?:
      | Array<
          | ResolverInputTypes['create_producers_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_materials?:
      | Array<
          | ResolverInputTypes['create_production_materials_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['create_producers_production_methods_input']: {
    id?: string | undefined | null;
    producers_id?:
      | ResolverInputTypes['create_producers_input']
      | undefined
      | null;
    production_methods_id?:
      | ResolverInputTypes['create_production_methods_input']
      | undefined
      | null;
  };
  ['create_production_materials_files_input']: {
    directus_files_id?:
      | ResolverInputTypes['create_directus_files_input']
      | undefined
      | null;
    id?: string | undefined | null;
    production_materials_id?:
      | ResolverInputTypes['create_production_materials_input']
      | undefined
      | null;
  };
  ['create_stages_input']: {
    description?: string | undefined | null;
    name: string;
    sort?: number | undefined | null;
  };
  ['create_currencies_input']: {
    currency: string;
    id?: string | undefined | null;
  };
  ['create_products_contributors_input']: {
    collaborators_id?:
      | ResolverInputTypes['create_collaborators_input']
      | undefined
      | null;
    contribution_share?: number | undefined | null;
    id?: string | undefined | null;
    products_id?:
      | ResolverInputTypes['create_products_input']
      | undefined
      | null;
    robot_earned?: number | undefined | null;
  };
  ['create_products_production_materials_input']: {
    id?: string | undefined | null;
    production_materials_id?:
      | ResolverInputTypes['create_production_materials_input']
      | undefined
      | null;
    products_id?:
      | ResolverInputTypes['create_products_input']
      | undefined
      | null;
  };
  ['create_products_design_files_input']: {
    directus_files_id?:
      | ResolverInputTypes['create_directus_files_input']
      | undefined
      | null;
    id?: string | undefined | null;
    products_id?:
      | ResolverInputTypes['create_products_input']
      | undefined
      | null;
  };
  ['create_products_content_input']: {
    directus_files_id?:
      | ResolverInputTypes['create_directus_files_input']
      | undefined
      | null;
    id?: string | undefined | null;
    products_id?:
      | ResolverInputTypes['create_products_input']
      | undefined
      | null;
  };
  ['create_products_files_input']: {
    directus_files_id?:
      | ResolverInputTypes['create_directus_files_input']
      | undefined
      | null;
    id?: string | undefined | null;
    products_id?:
      | ResolverInputTypes['create_products_input']
      | undefined
      | null;
  };
  ['create_products_wearables_input']: {
    directus_files_id?:
      | ResolverInputTypes['create_directus_files_input']
      | undefined
      | null;
    file_format?:
      | ResolverInputTypes['create_file_formats_input']
      | undefined
      | null;
    id?: string | undefined | null;
    primary?: boolean | undefined | null;
    products_id?:
      | ResolverInputTypes['create_products_input']
      | undefined
      | null;
  };
  ['create_file_formats_input']: {
    description?: string | undefined | null;
    extension?: string | undefined | null;
    id?: string | undefined | null;
    mime_type?: string | undefined | null;
    name: string;
  };
  ['create_products_production_methods_input']: {
    id?: string | undefined | null;
    production_methods_id?:
      | ResolverInputTypes['create_production_methods_input']
      | undefined
      | null;
    products_id?:
      | ResolverInputTypes['create_products_input']
      | undefined
      | null;
  };
  ['create_invoices_input']: {
    id?: string | undefined | null;
    user_created?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
    date_created?: ResolverInputTypes['Date'] | undefined | null;
    user_updated?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
    date_updated?: ResolverInputTypes['Date'] | undefined | null;
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: string | undefined | null;
    description: string;
    status?: string | undefined | null;
    /** Invoice amount in USD */
    amount?: number | undefined | null;
    transaction_url?: string | undefined | null;
    production_product_id?:
      | ResolverInputTypes['create_products_input']
      | undefined
      | null;
    client_product_id?:
      | ResolverInputTypes['create_products_input']
      | undefined
      | null;
  };
  ['create_brands_directus_users_input']: {
    brands_id?: ResolverInputTypes['create_brands_input'] | undefined | null;
    directus_users_id?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
    id?: string | undefined | null;
  };
  ['update_brands_input']: {
    created_at?: ResolverInputTypes['Date'] | undefined | null;
    description?: string | undefined | null;
    discord_url?: string | undefined | null;
    eth_address?: string | undefined | null;
    id?: string | undefined | null;
    logo?: ResolverInputTypes['update_directus_files_input'] | undefined | null;
    name?: string | undefined | null;
    notion_id?: string | undefined | null;
    twitter_url?: string | undefined | null;
    website_url?: string | undefined | null;
    products?:
      | Array<ResolverInputTypes['update_products_input'] | undefined | null>
      | undefined
      | null;
    users?:
      | Array<
          | ResolverInputTypes['update_brands_directus_users_input']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['update_directus_files_input']: {
    id?: string | undefined | null;
    storage?: string | undefined | null;
    filename_disk?: string | undefined | null;
    filename_download?: string | undefined | null;
    title?: string | undefined | null;
    type?: string | undefined | null;
    folder?:
      | ResolverInputTypes['update_directus_folders_input']
      | undefined
      | null;
    uploaded_by?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
    uploaded_on?: ResolverInputTypes['Date'] | undefined | null;
    modified_by?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
    modified_on?: ResolverInputTypes['Date'] | undefined | null;
    charset?: string | undefined | null;
    filesize?: ResolverInputTypes['GraphQLBigInt'] | undefined | null;
    width?: number | undefined | null;
    height?: number | undefined | null;
    duration?: number | undefined | null;
    embed?: string | undefined | null;
    description?: string | undefined | null;
    location?: string | undefined | null;
    tags?: ResolverInputTypes['JSON'] | undefined | null;
    metadata?: ResolverInputTypes['JSON'] | undefined | null;
  };
  ['update_directus_folders_input']: {
    id?: string | undefined | null;
    name?: string | undefined | null;
    parent?:
      | ResolverInputTypes['update_directus_folders_input']
      | undefined
      | null;
  };
  ['update_directus_users_input']: {
    id?: string | undefined | null;
    first_name?: string | undefined | null;
    last_name?: string | undefined | null;
    email?: string | undefined | null;
    password?: ResolverInputTypes['Hash'] | undefined | null;
    location?: string | undefined | null;
    title?: string | undefined | null;
    description?: string | undefined | null;
    tags?: ResolverInputTypes['JSON'] | undefined | null;
    avatar?:
      | ResolverInputTypes['update_directus_files_input']
      | undefined
      | null;
    language?: string | undefined | null;
    theme?: string | undefined | null;
    tfa_secret?: ResolverInputTypes['Hash'] | undefined | null;
    status?: string | undefined | null;
    role?: ResolverInputTypes['update_directus_roles_input'] | undefined | null;
    token?: ResolverInputTypes['Hash'] | undefined | null;
    last_access?: ResolverInputTypes['Date'] | undefined | null;
    last_page?: string | undefined | null;
    provider?: string | undefined | null;
    external_identifier?: string | undefined | null;
    auth_data?: ResolverInputTypes['JSON'] | undefined | null;
    email_notifications?: boolean | undefined | null;
    discord_handle?: string | undefined | null;
    discord_id?: string | undefined | null;
    timezone?: string | undefined | null;
    twitter_handle?: string | undefined | null;
    collaborators?:
      | Array<
          ResolverInputTypes['update_collaborators_input'] | undefined | null
        >
      | undefined
      | null;
    skills?:
      | Array<
          | ResolverInputTypes['update_junction_directus_users_skills_input']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['update_directus_roles_input']: {
    id?: string | undefined | null;
    name?: string | undefined | null;
    icon?: string | undefined | null;
    description?: string | undefined | null;
    ip_access?: Array<string | undefined | null> | undefined | null;
    enforce_tfa?: boolean | undefined | null;
    admin_access?: boolean | undefined | null;
    app_access?: boolean | undefined | null;
    users?:
      | Array<
          ResolverInputTypes['update_directus_users_input'] | undefined | null
        >
      | undefined
      | null;
  };
  ['update_collaborators_input']: {
    account?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
    date_created?: ResolverInputTypes['Date'] | undefined | null;
    date_updated?: ResolverInputTypes['Date'] | undefined | null;
    display_name?: string | undefined | null;
    id?: string | undefined | null;
    payment_eth_address?: string | undefined | null;
    role?:
      | ResolverInputTypes['update_collaborator_roles_input']
      | undefined
      | null;
    user_created?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
  };
  ['update_collaborator_roles_input']: {
    description?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
  };
  ['update_junction_directus_users_skills_input']: {
    directus_users_id?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
    id?: string | undefined | null;
    skills_id?: ResolverInputTypes['update_skills_input'] | undefined | null;
  };
  ['update_skills_input']: {
    description?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
  };
  ['update_products_input']: {
    brand_id?: ResolverInputTypes['update_brands_input'] | undefined | null;
    clo3d_file?:
      | ResolverInputTypes['update_directus_files_input']
      | undefined
      | null;
    created_at?: ResolverInputTypes['Date'] | undefined | null;
    description?: string | undefined | null;
    discord_channel_id?: string | undefined | null;
    fulfiller_id?:
      | ResolverInputTypes['update_fulfillers_input']
      | undefined
      | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
    nft_token_id?: number | undefined | null;
    notion_id?: string | undefined | null;
    price?:
      | ResolverInputTypes['update_price_currencies_input']
      | undefined
      | null;
    producer_id?:
      | ResolverInputTypes['update_producers_input']
      | undefined
      | null;
    product_stage?:
      | ResolverInputTypes['update_stages_input']
      | undefined
      | null;
    production_cost?: number | undefined | null;
    quantity?: ResolverInputTypes['GraphQLBigInt'] | undefined | null;
    release_date?: ResolverInputTypes['Date'] | undefined | null;
    sale_currency?:
      | ResolverInputTypes['update_currencies_input']
      | undefined
      | null;
    sale_price?: number | undefined | null;
    sale_type?: string | undefined | null;
    season?: number | undefined | null;
    shopify_id?: string | undefined | null;
    status?: string | undefined | null;
    notes?: string | undefined | null;
    date_updated?: ResolverInputTypes['Date'] | undefined | null;
    html_file?:
      | ResolverInputTypes['update_directus_files_input']
      | undefined
      | null;
    thumbnail?:
      | ResolverInputTypes['update_directus_files_input']
      | undefined
      | null;
    vrm_file?:
      | ResolverInputTypes['update_directus_files_input']
      | undefined
      | null;
    contributors?:
      | Array<
          | ResolverInputTypes['update_products_contributors_input']
          | undefined
          | null
        >
      | undefined
      | null;
    materials?:
      | Array<
          | ResolverInputTypes['update_products_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null;
    design_files?:
      | Array<
          | ResolverInputTypes['update_products_design_files_input']
          | undefined
          | null
        >
      | undefined
      | null;
    content?:
      | Array<
          ResolverInputTypes['update_products_content_input'] | undefined | null
        >
      | undefined
      | null;
    images?:
      | Array<
          ResolverInputTypes['update_products_files_input'] | undefined | null
        >
      | undefined
      | null;
    wearable_files?:
      | Array<
          | ResolverInputTypes['update_products_wearables_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_methods?:
      | Array<
          | ResolverInputTypes['update_products_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    client_invoices?:
      | Array<ResolverInputTypes['update_invoices_input'] | undefined | null>
      | undefined
      | null;
    production_invoices?:
      | Array<ResolverInputTypes['update_invoices_input'] | undefined | null>
      | undefined
      | null;
  };
  ['update_fulfillers_input']: {
    address?: string | undefined | null;
    created_at?: ResolverInputTypes['Date'] | undefined | null;
    email?: string | undefined | null;
    eth_address?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
    website_url?: string | undefined | null;
  };
  ['update_price_currencies_input']: {
    amount?: number | undefined | null;
    currency?: string | undefined | null;
    id?: string | undefined | null;
  };
  ['update_producers_input']: {
    created_at?: ResolverInputTypes['Date'] | undefined | null;
    email?: string | undefined | null;
    eth_address?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
    shipping_address?: string | undefined | null;
    production_materials_stocked?:
      | Array<
          | ResolverInputTypes['update_producers_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_methods?:
      | Array<
          | ResolverInputTypes['update_producers_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    supplied_materials?:
      | Array<
          | ResolverInputTypes['update_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['update_producers_production_materials_input']: {
    id?: string | undefined | null;
    producers_id?:
      | ResolverInputTypes['update_producers_input']
      | undefined
      | null;
    production_materials_id?:
      | ResolverInputTypes['update_production_materials_input']
      | undefined
      | null;
    quantity?: number | undefined | null;
  };
  ['update_production_materials_input']: {
    base_price?: number | undefined | null;
    color_palette?: ResolverInputTypes['JSON'] | undefined | null;
    composition?: string | undefined | null;
    created_at?: ResolverInputTypes['Date'] | undefined | null;
    created_by?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
    description?: string | undefined | null;
    gender?: string | undefined | null;
    id?: string | undefined | null;
    made_in?: string | undefined | null;
    name?: string | undefined | null;
    neck_tag?: boolean | undefined | null;
    note?: string | undefined | null;
    rating?: string | undefined | null;
    size_guide?:
      | ResolverInputTypes['update_directus_files_input']
      | undefined
      | null;
    supplier?: ResolverInputTypes['update_producers_input'] | undefined | null;
    tags?: ResolverInputTypes['JSON'] | undefined | null;
    production_methods?:
      | Array<
          | ResolverInputTypes['update_production_materials_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    stocked_at?:
      | Array<
          | ResolverInputTypes['update_producers_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null;
    base_assets?:
      | Array<
          | ResolverInputTypes['update_production_materials_files_input']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['update_production_materials_production_methods_input']: {
    id?: string | undefined | null;
    production_materials_id?:
      | ResolverInputTypes['update_production_materials_input']
      | undefined
      | null;
    production_methods_id?:
      | ResolverInputTypes['update_production_methods_input']
      | undefined
      | null;
  };
  ['update_production_methods_input']: {
    created_at?: ResolverInputTypes['Date'] | undefined | null;
    description?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
    producers?:
      | Array<
          | ResolverInputTypes['update_producers_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_materials?:
      | Array<
          | ResolverInputTypes['update_production_materials_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['update_producers_production_methods_input']: {
    id?: string | undefined | null;
    producers_id?:
      | ResolverInputTypes['update_producers_input']
      | undefined
      | null;
    production_methods_id?:
      | ResolverInputTypes['update_production_methods_input']
      | undefined
      | null;
  };
  ['update_production_materials_files_input']: {
    directus_files_id?:
      | ResolverInputTypes['update_directus_files_input']
      | undefined
      | null;
    id?: string | undefined | null;
    production_materials_id?:
      | ResolverInputTypes['update_production_materials_input']
      | undefined
      | null;
  };
  ['update_stages_input']: {
    description?: string | undefined | null;
    name?: string | undefined | null;
    sort?: number | undefined | null;
  };
  ['update_currencies_input']: {
    currency?: string | undefined | null;
    id?: string | undefined | null;
  };
  ['update_products_contributors_input']: {
    collaborators_id?:
      | ResolverInputTypes['update_collaborators_input']
      | undefined
      | null;
    contribution_share?: number | undefined | null;
    id?: string | undefined | null;
    products_id?:
      | ResolverInputTypes['update_products_input']
      | undefined
      | null;
    robot_earned?: number | undefined | null;
  };
  ['update_products_production_materials_input']: {
    id?: string | undefined | null;
    production_materials_id?:
      | ResolverInputTypes['update_production_materials_input']
      | undefined
      | null;
    products_id?:
      | ResolverInputTypes['update_products_input']
      | undefined
      | null;
  };
  ['update_products_design_files_input']: {
    directus_files_id?:
      | ResolverInputTypes['update_directus_files_input']
      | undefined
      | null;
    id?: string | undefined | null;
    products_id?:
      | ResolverInputTypes['update_products_input']
      | undefined
      | null;
  };
  ['update_products_content_input']: {
    directus_files_id?:
      | ResolverInputTypes['update_directus_files_input']
      | undefined
      | null;
    id?: string | undefined | null;
    products_id?:
      | ResolverInputTypes['update_products_input']
      | undefined
      | null;
  };
  ['update_products_files_input']: {
    directus_files_id?:
      | ResolverInputTypes['update_directus_files_input']
      | undefined
      | null;
    id?: string | undefined | null;
    products_id?:
      | ResolverInputTypes['update_products_input']
      | undefined
      | null;
  };
  ['update_products_wearables_input']: {
    directus_files_id?:
      | ResolverInputTypes['update_directus_files_input']
      | undefined
      | null;
    file_format?:
      | ResolverInputTypes['update_file_formats_input']
      | undefined
      | null;
    id?: string | undefined | null;
    primary?: boolean | undefined | null;
    products_id?:
      | ResolverInputTypes['update_products_input']
      | undefined
      | null;
  };
  ['update_file_formats_input']: {
    description?: string | undefined | null;
    extension?: string | undefined | null;
    id?: string | undefined | null;
    mime_type?: string | undefined | null;
    name?: string | undefined | null;
  };
  ['update_products_production_methods_input']: {
    id?: string | undefined | null;
    production_methods_id?:
      | ResolverInputTypes['update_production_methods_input']
      | undefined
      | null;
    products_id?:
      | ResolverInputTypes['update_products_input']
      | undefined
      | null;
  };
  ['update_invoices_input']: {
    id?: string | undefined | null;
    user_created?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
    date_created?: ResolverInputTypes['Date'] | undefined | null;
    user_updated?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
    date_updated?: ResolverInputTypes['Date'] | undefined | null;
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: string | undefined | null;
    description?: string | undefined | null;
    status?: string | undefined | null;
    /** Invoice amount in USD */
    amount?: number | undefined | null;
    transaction_url?: string | undefined | null;
    production_product_id?:
      | ResolverInputTypes['update_products_input']
      | undefined
      | null;
    client_product_id?:
      | ResolverInputTypes['update_products_input']
      | undefined
      | null;
  };
  ['update_brands_directus_users_input']: {
    brands_id?: ResolverInputTypes['update_brands_input'] | undefined | null;
    directus_users_id?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
    id?: string | undefined | null;
  };
  ['delete_many']: AliasType<{
    ids?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['delete_one']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
};

export type ModelTypes = {
  ['Query']: {
    brands: Array<ModelTypes['brands']>;
    brands_by_id?: ModelTypes['brands'] | undefined;
    brands_aggregated: Array<ModelTypes['brands_aggregated']>;
    brands_directus_users: Array<ModelTypes['brands_directus_users']>;
    brands_directus_users_by_id?:
      | ModelTypes['brands_directus_users']
      | undefined;
    brands_directus_users_aggregated: Array<
      ModelTypes['brands_directus_users_aggregated']
    >;
    collaborators: Array<ModelTypes['collaborators']>;
    collaborators_by_id?: ModelTypes['collaborators'] | undefined;
    collaborators_aggregated: Array<ModelTypes['collaborators_aggregated']>;
    collaborator_roles: Array<ModelTypes['collaborator_roles']>;
    collaborator_roles_by_id?: ModelTypes['collaborator_roles'] | undefined;
    collaborator_roles_aggregated: Array<
      ModelTypes['collaborator_roles_aggregated']
    >;
    junction_directus_users_skills: Array<
      ModelTypes['junction_directus_users_skills']
    >;
    junction_directus_users_skills_by_id?:
      | ModelTypes['junction_directus_users_skills']
      | undefined;
    junction_directus_users_skills_aggregated: Array<
      ModelTypes['junction_directus_users_skills_aggregated']
    >;
    skills: Array<ModelTypes['skills']>;
    skills_by_id?: ModelTypes['skills'] | undefined;
    skills_aggregated: Array<ModelTypes['skills_aggregated']>;
    producers: Array<ModelTypes['producers']>;
    producers_by_id?: ModelTypes['producers'] | undefined;
    producers_aggregated: Array<ModelTypes['producers_aggregated']>;
    producers_production_materials: Array<
      ModelTypes['producers_production_materials']
    >;
    producers_production_materials_by_id?:
      | ModelTypes['producers_production_materials']
      | undefined;
    producers_production_materials_aggregated: Array<
      ModelTypes['producers_production_materials_aggregated']
    >;
    producers_production_methods: Array<
      ModelTypes['producers_production_methods']
    >;
    producers_production_methods_by_id?:
      | ModelTypes['producers_production_methods']
      | undefined;
    producers_production_methods_aggregated: Array<
      ModelTypes['producers_production_methods_aggregated']
    >;
    production_methods: Array<ModelTypes['production_methods']>;
    production_methods_by_id?: ModelTypes['production_methods'] | undefined;
    production_methods_aggregated: Array<
      ModelTypes['production_methods_aggregated']
    >;
    production_materials_production_methods: Array<
      ModelTypes['production_materials_production_methods']
    >;
    production_materials_production_methods_by_id?:
      | ModelTypes['production_materials_production_methods']
      | undefined;
    production_materials_production_methods_aggregated: Array<
      ModelTypes['production_materials_production_methods_aggregated']
    >;
    fulfillers: Array<ModelTypes['fulfillers']>;
    fulfillers_by_id?: ModelTypes['fulfillers'] | undefined;
    fulfillers_aggregated: Array<ModelTypes['fulfillers_aggregated']>;
    price_currencies: Array<ModelTypes['price_currencies']>;
    price_currencies_by_id?: ModelTypes['price_currencies'] | undefined;
    price_currencies_aggregated: Array<
      ModelTypes['price_currencies_aggregated']
    >;
    stages: Array<ModelTypes['stages']>;
    stages_by_id?: ModelTypes['stages'] | undefined;
    stages_aggregated: Array<ModelTypes['stages_aggregated']>;
    currencies: Array<ModelTypes['currencies']>;
    currencies_by_id?: ModelTypes['currencies'] | undefined;
    currencies_aggregated: Array<ModelTypes['currencies_aggregated']>;
    products_content: Array<ModelTypes['products_content']>;
    products_content_by_id?: ModelTypes['products_content'] | undefined;
    products_content_aggregated: Array<
      ModelTypes['products_content_aggregated']
    >;
    products_contributors: Array<ModelTypes['products_contributors']>;
    products_contributors_by_id?:
      | ModelTypes['products_contributors']
      | undefined;
    products_contributors_aggregated: Array<
      ModelTypes['products_contributors_aggregated']
    >;
    products_design_files: Array<ModelTypes['products_design_files']>;
    products_design_files_by_id?:
      | ModelTypes['products_design_files']
      | undefined;
    products_design_files_aggregated: Array<
      ModelTypes['products_design_files_aggregated']
    >;
    products_files: Array<ModelTypes['products_files']>;
    products_files_by_id?: ModelTypes['products_files'] | undefined;
    products_files_aggregated: Array<ModelTypes['products_files_aggregated']>;
    products_production_materials: Array<
      ModelTypes['products_production_materials']
    >;
    products_production_materials_by_id?:
      | ModelTypes['products_production_materials']
      | undefined;
    products_production_materials_aggregated: Array<
      ModelTypes['products_production_materials_aggregated']
    >;
    products_production_methods: Array<
      ModelTypes['products_production_methods']
    >;
    products_production_methods_by_id?:
      | ModelTypes['products_production_methods']
      | undefined;
    products_production_methods_aggregated: Array<
      ModelTypes['products_production_methods_aggregated']
    >;
    products_wearables: Array<ModelTypes['products_wearables']>;
    products_wearables_by_id?: ModelTypes['products_wearables'] | undefined;
    products_wearables_aggregated: Array<
      ModelTypes['products_wearables_aggregated']
    >;
    file_formats: Array<ModelTypes['file_formats']>;
    file_formats_by_id?: ModelTypes['file_formats'] | undefined;
    file_formats_aggregated: Array<ModelTypes['file_formats_aggregated']>;
    products: Array<ModelTypes['products']>;
    products_by_id?: ModelTypes['products'] | undefined;
    products_aggregated: Array<ModelTypes['products_aggregated']>;
    production_materials: Array<ModelTypes['production_materials']>;
    production_materials_by_id?: ModelTypes['production_materials'] | undefined;
    production_materials_aggregated: Array<
      ModelTypes['production_materials_aggregated']
    >;
    invoices: Array<ModelTypes['invoices']>;
    invoices_by_id?: ModelTypes['invoices'] | undefined;
    invoices_aggregated: Array<ModelTypes['invoices_aggregated']>;
    production_materials_files: Array<ModelTypes['production_materials_files']>;
    production_materials_files_by_id?:
      | ModelTypes['production_materials_files']
      | undefined;
    production_materials_files_aggregated: Array<
      ModelTypes['production_materials_files_aggregated']
    >;
  };
  ['brands']: {
    created_at?: ModelTypes['Date'] | undefined;
    created_at_func?: ModelTypes['datetime_functions'] | undefined;
    description?: string | undefined;
    discord_url?: string | undefined;
    eth_address?: string | undefined;
    id: string;
    logo?: ModelTypes['directus_files'] | undefined;
    name: string;
    notion_id?: string | undefined;
    twitter_url?: string | undefined;
    website_url?: string | undefined;
    products?: Array<ModelTypes['products'] | undefined> | undefined;
    products_func?: ModelTypes['count_functions'] | undefined;
    users?: Array<ModelTypes['brands_directus_users'] | undefined> | undefined;
    users_func?: ModelTypes['count_functions'] | undefined;
  };
  /** ISO8601 Date values */
  ['Date']: any;
  ['datetime_functions']: {
    year?: number | undefined;
    month?: number | undefined;
    week?: number | undefined;
    day?: number | undefined;
    weekday?: number | undefined;
    hour?: number | undefined;
    minute?: number | undefined;
    second?: number | undefined;
  };
  ['directus_files']: {
    id: string;
    storage: string;
    filename_disk?: string | undefined;
    filename_download: string;
    title?: string | undefined;
    type?: string | undefined;
    folder?: ModelTypes['directus_folders'] | undefined;
    uploaded_by?: ModelTypes['directus_users'] | undefined;
    uploaded_on?: ModelTypes['Date'] | undefined;
    uploaded_on_func?: ModelTypes['datetime_functions'] | undefined;
    modified_by?: ModelTypes['directus_users'] | undefined;
    modified_on?: ModelTypes['Date'] | undefined;
    modified_on_func?: ModelTypes['datetime_functions'] | undefined;
    charset?: string | undefined;
    filesize?: ModelTypes['GraphQLBigInt'] | undefined;
    width?: number | undefined;
    height?: number | undefined;
    duration?: number | undefined;
    embed?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    tags?: ModelTypes['JSON'] | undefined;
    tags_func?: ModelTypes['count_functions'] | undefined;
    metadata?: ModelTypes['JSON'] | undefined;
    metadata_func?: ModelTypes['count_functions'] | undefined;
  };
  ['directus_folders']: {
    id: string;
    name: string;
    parent?: ModelTypes['directus_folders'] | undefined;
  };
  ['directus_folders_filter']: {
    id?: ModelTypes['string_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    parent?: ModelTypes['directus_folders_filter'] | undefined;
    _and?: Array<ModelTypes['directus_folders_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['directus_folders_filter'] | undefined> | undefined;
  };
  ['string_filter_operators']: {
    _eq?: string | undefined;
    _neq?: string | undefined;
    _contains?: string | undefined;
    _icontains?: string | undefined;
    _ncontains?: string | undefined;
    _starts_with?: string | undefined;
    _nstarts_with?: string | undefined;
    _ends_with?: string | undefined;
    _nends_with?: string | undefined;
    _in?: Array<string | undefined> | undefined;
    _nin?: Array<string | undefined> | undefined;
    _null?: boolean | undefined;
    _nnull?: boolean | undefined;
    _empty?: boolean | undefined;
    _nempty?: boolean | undefined;
  };
  ['directus_users']: {
    id: string;
    first_name?: string | undefined;
    last_name?: string | undefined;
    email?: string | undefined;
    password?: ModelTypes['Hash'] | undefined;
    location?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    tags?: ModelTypes['JSON'] | undefined;
    tags_func?: ModelTypes['count_functions'] | undefined;
    avatar?: ModelTypes['directus_files'] | undefined;
    language?: string | undefined;
    theme?: string | undefined;
    tfa_secret?: ModelTypes['Hash'] | undefined;
    status?: string | undefined;
    role?: ModelTypes['directus_roles'] | undefined;
    token?: ModelTypes['Hash'] | undefined;
    last_access?: ModelTypes['Date'] | undefined;
    last_access_func?: ModelTypes['datetime_functions'] | undefined;
    last_page?: string | undefined;
    provider?: string | undefined;
    external_identifier?: string | undefined;
    auth_data?: ModelTypes['JSON'] | undefined;
    auth_data_func?: ModelTypes['count_functions'] | undefined;
    email_notifications?: boolean | undefined;
    discord_handle?: string | undefined;
    discord_id?: string | undefined;
    timezone?: string | undefined;
    twitter_handle?: string | undefined;
    collaborators?: Array<ModelTypes['collaborators'] | undefined> | undefined;
    collaborators_func?: ModelTypes['count_functions'] | undefined;
    skills?:
      | Array<ModelTypes['junction_directus_users_skills'] | undefined>
      | undefined;
    skills_func?: ModelTypes['count_functions'] | undefined;
  };
  /** Hashed string values */
  ['Hash']: any;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  ['JSON']: any;
  ['count_functions']: {
    count?: number | undefined;
  };
  ['directus_files_filter']: {
    id?: ModelTypes['string_filter_operators'] | undefined;
    storage?: ModelTypes['string_filter_operators'] | undefined;
    filename_disk?: ModelTypes['string_filter_operators'] | undefined;
    filename_download?: ModelTypes['string_filter_operators'] | undefined;
    title?: ModelTypes['string_filter_operators'] | undefined;
    type?: ModelTypes['string_filter_operators'] | undefined;
    folder?: ModelTypes['directus_folders_filter'] | undefined;
    uploaded_by?: ModelTypes['directus_users_filter'] | undefined;
    uploaded_on?: ModelTypes['date_filter_operators'] | undefined;
    uploaded_on_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    modified_by?: ModelTypes['directus_users_filter'] | undefined;
    modified_on?: ModelTypes['date_filter_operators'] | undefined;
    modified_on_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    charset?: ModelTypes['string_filter_operators'] | undefined;
    filesize?: ModelTypes['number_filter_operators'] | undefined;
    width?: ModelTypes['number_filter_operators'] | undefined;
    height?: ModelTypes['number_filter_operators'] | undefined;
    duration?: ModelTypes['number_filter_operators'] | undefined;
    embed?: ModelTypes['string_filter_operators'] | undefined;
    description?: ModelTypes['string_filter_operators'] | undefined;
    location?: ModelTypes['string_filter_operators'] | undefined;
    tags?: ModelTypes['string_filter_operators'] | undefined;
    tags_func?: ModelTypes['count_function_filter_operators'] | undefined;
    metadata?: ModelTypes['string_filter_operators'] | undefined;
    metadata_func?: ModelTypes['count_function_filter_operators'] | undefined;
    _and?: Array<ModelTypes['directus_files_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['directus_files_filter'] | undefined> | undefined;
  };
  ['directus_users_filter']: {
    id?: ModelTypes['string_filter_operators'] | undefined;
    first_name?: ModelTypes['string_filter_operators'] | undefined;
    last_name?: ModelTypes['string_filter_operators'] | undefined;
    email?: ModelTypes['string_filter_operators'] | undefined;
    password?: ModelTypes['hash_filter_operators'] | undefined;
    location?: ModelTypes['string_filter_operators'] | undefined;
    title?: ModelTypes['string_filter_operators'] | undefined;
    description?: ModelTypes['string_filter_operators'] | undefined;
    tags?: ModelTypes['string_filter_operators'] | undefined;
    tags_func?: ModelTypes['count_function_filter_operators'] | undefined;
    avatar?: ModelTypes['directus_files_filter'] | undefined;
    language?: ModelTypes['string_filter_operators'] | undefined;
    theme?: ModelTypes['string_filter_operators'] | undefined;
    tfa_secret?: ModelTypes['hash_filter_operators'] | undefined;
    status?: ModelTypes['string_filter_operators'] | undefined;
    role?: ModelTypes['directus_roles_filter'] | undefined;
    token?: ModelTypes['hash_filter_operators'] | undefined;
    last_access?: ModelTypes['date_filter_operators'] | undefined;
    last_access_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    last_page?: ModelTypes['string_filter_operators'] | undefined;
    provider?: ModelTypes['string_filter_operators'] | undefined;
    external_identifier?: ModelTypes['string_filter_operators'] | undefined;
    auth_data?: ModelTypes['string_filter_operators'] | undefined;
    auth_data_func?: ModelTypes['count_function_filter_operators'] | undefined;
    email_notifications?: ModelTypes['boolean_filter_operators'] | undefined;
    discord_handle?: ModelTypes['string_filter_operators'] | undefined;
    discord_id?: ModelTypes['string_filter_operators'] | undefined;
    timezone?: ModelTypes['string_filter_operators'] | undefined;
    twitter_handle?: ModelTypes['string_filter_operators'] | undefined;
    collaborators?: ModelTypes['collaborators_filter'] | undefined;
    collaborators_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    skills?: ModelTypes['junction_directus_users_skills_filter'] | undefined;
    skills_func?: ModelTypes['count_function_filter_operators'] | undefined;
    _and?: Array<ModelTypes['directus_users_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['directus_users_filter'] | undefined> | undefined;
  };
  ['hash_filter_operators']: {
    _null?: boolean | undefined;
    _nnull?: boolean | undefined;
    _empty?: boolean | undefined;
    _nempty?: boolean | undefined;
  };
  ['count_function_filter_operators']: {
    count?: ModelTypes['number_filter_operators'] | undefined;
  };
  ['number_filter_operators']: {
    _eq?: ModelTypes['GraphQLStringOrFloat'] | undefined;
    _neq?: ModelTypes['GraphQLStringOrFloat'] | undefined;
    _in?: Array<ModelTypes['GraphQLStringOrFloat'] | undefined> | undefined;
    _nin?: Array<ModelTypes['GraphQLStringOrFloat'] | undefined> | undefined;
    _gt?: ModelTypes['GraphQLStringOrFloat'] | undefined;
    _gte?: ModelTypes['GraphQLStringOrFloat'] | undefined;
    _lt?: ModelTypes['GraphQLStringOrFloat'] | undefined;
    _lte?: ModelTypes['GraphQLStringOrFloat'] | undefined;
    _null?: boolean | undefined;
    _nnull?: boolean | undefined;
    _between?:
      | Array<ModelTypes['GraphQLStringOrFloat'] | undefined>
      | undefined;
    _nbetween?:
      | Array<ModelTypes['GraphQLStringOrFloat'] | undefined>
      | undefined;
  };
  /** A Float or a String */
  ['GraphQLStringOrFloat']: any;
  ['directus_roles_filter']: {
    id?: ModelTypes['string_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    icon?: ModelTypes['string_filter_operators'] | undefined;
    description?: ModelTypes['string_filter_operators'] | undefined;
    ip_access?: ModelTypes['string_filter_operators'] | undefined;
    enforce_tfa?: ModelTypes['boolean_filter_operators'] | undefined;
    admin_access?: ModelTypes['boolean_filter_operators'] | undefined;
    app_access?: ModelTypes['boolean_filter_operators'] | undefined;
    users?: ModelTypes['directus_users_filter'] | undefined;
    users_func?: ModelTypes['count_function_filter_operators'] | undefined;
    _and?: Array<ModelTypes['directus_roles_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['directus_roles_filter'] | undefined> | undefined;
  };
  ['boolean_filter_operators']: {
    _eq?: boolean | undefined;
    _neq?: boolean | undefined;
    _null?: boolean | undefined;
    _nnull?: boolean | undefined;
  };
  ['date_filter_operators']: {
    _eq?: string | undefined;
    _neq?: string | undefined;
    _gt?: string | undefined;
    _gte?: string | undefined;
    _lt?: string | undefined;
    _lte?: string | undefined;
    _null?: boolean | undefined;
    _nnull?: boolean | undefined;
    _in?: Array<string | undefined> | undefined;
    _nin?: Array<string | undefined> | undefined;
    _between?:
      | Array<ModelTypes['GraphQLStringOrFloat'] | undefined>
      | undefined;
    _nbetween?:
      | Array<ModelTypes['GraphQLStringOrFloat'] | undefined>
      | undefined;
  };
  ['datetime_function_filter_operators']: {
    year?: ModelTypes['number_filter_operators'] | undefined;
    month?: ModelTypes['number_filter_operators'] | undefined;
    week?: ModelTypes['number_filter_operators'] | undefined;
    day?: ModelTypes['number_filter_operators'] | undefined;
    weekday?: ModelTypes['number_filter_operators'] | undefined;
    hour?: ModelTypes['number_filter_operators'] | undefined;
    minute?: ModelTypes['number_filter_operators'] | undefined;
    second?: ModelTypes['number_filter_operators'] | undefined;
  };
  ['collaborators_filter']: {
    account?: ModelTypes['directus_users_filter'] | undefined;
    date_created?: ModelTypes['date_filter_operators'] | undefined;
    date_created_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    date_updated?: ModelTypes['date_filter_operators'] | undefined;
    date_updated_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    display_name?: ModelTypes['string_filter_operators'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    payment_eth_address?: ModelTypes['string_filter_operators'] | undefined;
    role?: ModelTypes['collaborator_roles_filter'] | undefined;
    user_created?: ModelTypes['directus_users_filter'] | undefined;
    _and?: Array<ModelTypes['collaborators_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['collaborators_filter'] | undefined> | undefined;
  };
  ['collaborator_roles_filter']: {
    description?: ModelTypes['string_filter_operators'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    _and?:
      | Array<ModelTypes['collaborator_roles_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['collaborator_roles_filter'] | undefined>
      | undefined;
  };
  ['junction_directus_users_skills_filter']: {
    directus_users_id?: ModelTypes['directus_users_filter'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    skills_id?: ModelTypes['skills_filter'] | undefined;
    _and?:
      | Array<ModelTypes['junction_directus_users_skills_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['junction_directus_users_skills_filter'] | undefined>
      | undefined;
  };
  ['skills_filter']: {
    description?: ModelTypes['string_filter_operators'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    _and?: Array<ModelTypes['skills_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['skills_filter'] | undefined> | undefined;
  };
  ['directus_roles']: {
    id: string;
    name: string;
    icon?: string | undefined;
    description?: string | undefined;
    ip_access?: Array<string | undefined> | undefined;
    enforce_tfa: boolean;
    admin_access: boolean;
    app_access?: boolean | undefined;
    users?: Array<ModelTypes['directus_users'] | undefined> | undefined;
    users_func?: ModelTypes['count_functions'] | undefined;
  };
  ['collaborators']: {
    account?: ModelTypes['directus_users'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    date_created_func?: ModelTypes['datetime_functions'] | undefined;
    date_updated?: ModelTypes['Date'] | undefined;
    date_updated_func?: ModelTypes['datetime_functions'] | undefined;
    display_name?: string | undefined;
    id: string;
    payment_eth_address?: string | undefined;
    role?: ModelTypes['collaborator_roles'] | undefined;
    user_created?: ModelTypes['directus_users'] | undefined;
  };
  ['collaborator_roles']: {
    description?: string | undefined;
    id: string;
    name?: string | undefined;
  };
  ['junction_directus_users_skills']: {
    directus_users_id?: ModelTypes['directus_users'] | undefined;
    id: string;
    skills_id?: ModelTypes['skills'] | undefined;
  };
  ['skills']: {
    description?: string | undefined;
    id: string;
    name: string;
  };
  /** BigInt value */
  ['GraphQLBigInt']: any;
  ['products']: {
    brand_id?: ModelTypes['brands'] | undefined;
    clo3d_file?: ModelTypes['directus_files'] | undefined;
    created_at?: ModelTypes['Date'] | undefined;
    created_at_func?: ModelTypes['datetime_functions'] | undefined;
    description?: string | undefined;
    discord_channel_id?: string | undefined;
    fulfiller_id?: ModelTypes['fulfillers'] | undefined;
    id: string;
    name: string;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    price?: ModelTypes['price_currencies'] | undefined;
    producer_id?: ModelTypes['producers'] | undefined;
    product_stage?: ModelTypes['stages'] | undefined;
    production_cost?: number | undefined;
    quantity?: ModelTypes['GraphQLBigInt'] | undefined;
    release_date?: ModelTypes['Date'] | undefined;
    release_date_func?: ModelTypes['datetime_functions'] | undefined;
    sale_currency?: ModelTypes['currencies'] | undefined;
    sale_price?: number | undefined;
    sale_type?: string | undefined;
    season?: number | undefined;
    shopify_id?: string | undefined;
    status?: string | undefined;
    notes?: string | undefined;
    date_updated?: ModelTypes['Date'] | undefined;
    date_updated_func?: ModelTypes['datetime_functions'] | undefined;
    html_file?: ModelTypes['directus_files'] | undefined;
    thumbnail?: ModelTypes['directus_files'] | undefined;
    vrm_file?: ModelTypes['directus_files'] | undefined;
    contributors?:
      | Array<ModelTypes['products_contributors'] | undefined>
      | undefined;
    contributors_func?: ModelTypes['count_functions'] | undefined;
    materials?:
      | Array<ModelTypes['products_production_materials'] | undefined>
      | undefined;
    materials_func?: ModelTypes['count_functions'] | undefined;
    design_files?:
      | Array<ModelTypes['products_design_files'] | undefined>
      | undefined;
    design_files_func?: ModelTypes['count_functions'] | undefined;
    content?: Array<ModelTypes['products_content'] | undefined> | undefined;
    content_func?: ModelTypes['count_functions'] | undefined;
    images?: Array<ModelTypes['products_files'] | undefined> | undefined;
    images_func?: ModelTypes['count_functions'] | undefined;
    wearable_files?:
      | Array<ModelTypes['products_wearables'] | undefined>
      | undefined;
    wearable_files_func?: ModelTypes['count_functions'] | undefined;
    production_methods?:
      | Array<ModelTypes['products_production_methods'] | undefined>
      | undefined;
    production_methods_func?: ModelTypes['count_functions'] | undefined;
    client_invoices?: Array<ModelTypes['invoices'] | undefined> | undefined;
    client_invoices_func?: ModelTypes['count_functions'] | undefined;
    production_invoices?: Array<ModelTypes['invoices'] | undefined> | undefined;
    production_invoices_func?: ModelTypes['count_functions'] | undefined;
  };
  ['brands_filter']: {
    created_at?: ModelTypes['date_filter_operators'] | undefined;
    created_at_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    description?: ModelTypes['string_filter_operators'] | undefined;
    discord_url?: ModelTypes['string_filter_operators'] | undefined;
    eth_address?: ModelTypes['string_filter_operators'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    logo?: ModelTypes['directus_files_filter'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    notion_id?: ModelTypes['string_filter_operators'] | undefined;
    twitter_url?: ModelTypes['string_filter_operators'] | undefined;
    website_url?: ModelTypes['string_filter_operators'] | undefined;
    products?: ModelTypes['products_filter'] | undefined;
    products_func?: ModelTypes['count_function_filter_operators'] | undefined;
    users?: ModelTypes['brands_directus_users_filter'] | undefined;
    users_func?: ModelTypes['count_function_filter_operators'] | undefined;
    _and?: Array<ModelTypes['brands_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['brands_filter'] | undefined> | undefined;
  };
  ['products_filter']: {
    brand_id?: ModelTypes['brands_filter'] | undefined;
    clo3d_file?: ModelTypes['directus_files_filter'] | undefined;
    created_at?: ModelTypes['date_filter_operators'] | undefined;
    created_at_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    description?: ModelTypes['string_filter_operators'] | undefined;
    discord_channel_id?: ModelTypes['string_filter_operators'] | undefined;
    fulfiller_id?: ModelTypes['fulfillers_filter'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    nft_token_id?: ModelTypes['number_filter_operators'] | undefined;
    notion_id?: ModelTypes['string_filter_operators'] | undefined;
    price?: ModelTypes['price_currencies_filter'] | undefined;
    producer_id?: ModelTypes['producers_filter'] | undefined;
    product_stage?: ModelTypes['stages_filter'] | undefined;
    production_cost?: ModelTypes['number_filter_operators'] | undefined;
    quantity?: ModelTypes['number_filter_operators'] | undefined;
    release_date?: ModelTypes['date_filter_operators'] | undefined;
    release_date_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    sale_currency?: ModelTypes['currencies_filter'] | undefined;
    sale_price?: ModelTypes['number_filter_operators'] | undefined;
    sale_type?: ModelTypes['string_filter_operators'] | undefined;
    season?: ModelTypes['number_filter_operators'] | undefined;
    shopify_id?: ModelTypes['string_filter_operators'] | undefined;
    status?: ModelTypes['string_filter_operators'] | undefined;
    notes?: ModelTypes['string_filter_operators'] | undefined;
    date_updated?: ModelTypes['date_filter_operators'] | undefined;
    date_updated_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    html_file?: ModelTypes['directus_files_filter'] | undefined;
    thumbnail?: ModelTypes['directus_files_filter'] | undefined;
    vrm_file?: ModelTypes['directus_files_filter'] | undefined;
    contributors?: ModelTypes['products_contributors_filter'] | undefined;
    contributors_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    materials?: ModelTypes['products_production_materials_filter'] | undefined;
    materials_func?: ModelTypes['count_function_filter_operators'] | undefined;
    design_files?: ModelTypes['products_design_files_filter'] | undefined;
    design_files_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    content?: ModelTypes['products_content_filter'] | undefined;
    content_func?: ModelTypes['count_function_filter_operators'] | undefined;
    images?: ModelTypes['products_files_filter'] | undefined;
    images_func?: ModelTypes['count_function_filter_operators'] | undefined;
    wearable_files?: ModelTypes['products_wearables_filter'] | undefined;
    wearable_files_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    production_methods?:
      | ModelTypes['products_production_methods_filter']
      | undefined;
    production_methods_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    client_invoices?: ModelTypes['invoices_filter'] | undefined;
    client_invoices_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    production_invoices?: ModelTypes['invoices_filter'] | undefined;
    production_invoices_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    _and?: Array<ModelTypes['products_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['products_filter'] | undefined> | undefined;
  };
  ['fulfillers_filter']: {
    address?: ModelTypes['string_filter_operators'] | undefined;
    created_at?: ModelTypes['date_filter_operators'] | undefined;
    created_at_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    email?: ModelTypes['string_filter_operators'] | undefined;
    eth_address?: ModelTypes['string_filter_operators'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    website_url?: ModelTypes['string_filter_operators'] | undefined;
    _and?: Array<ModelTypes['fulfillers_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['fulfillers_filter'] | undefined> | undefined;
  };
  ['price_currencies_filter']: {
    amount?: ModelTypes['number_filter_operators'] | undefined;
    currency?: ModelTypes['string_filter_operators'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    _and?: Array<ModelTypes['price_currencies_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['price_currencies_filter'] | undefined> | undefined;
  };
  ['producers_filter']: {
    created_at?: ModelTypes['date_filter_operators'] | undefined;
    created_at_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    email?: ModelTypes['string_filter_operators'] | undefined;
    eth_address?: ModelTypes['string_filter_operators'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    shipping_address?: ModelTypes['string_filter_operators'] | undefined;
    production_materials_stocked?:
      | ModelTypes['producers_production_materials_filter']
      | undefined;
    production_materials_stocked_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    production_methods?:
      | ModelTypes['producers_production_methods_filter']
      | undefined;
    production_methods_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    supplied_materials?: ModelTypes['production_materials_filter'] | undefined;
    supplied_materials_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    _and?: Array<ModelTypes['producers_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['producers_filter'] | undefined> | undefined;
  };
  ['producers_production_materials_filter']: {
    id?: ModelTypes['number_filter_operators'] | undefined;
    producers_id?: ModelTypes['producers_filter'] | undefined;
    production_materials_id?:
      | ModelTypes['production_materials_filter']
      | undefined;
    quantity?: ModelTypes['number_filter_operators'] | undefined;
    _and?:
      | Array<ModelTypes['producers_production_materials_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['producers_production_materials_filter'] | undefined>
      | undefined;
  };
  ['production_materials_filter']: {
    base_price?: ModelTypes['number_filter_operators'] | undefined;
    color_palette?: ModelTypes['string_filter_operators'] | undefined;
    color_palette_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    composition?: ModelTypes['string_filter_operators'] | undefined;
    created_at?: ModelTypes['date_filter_operators'] | undefined;
    created_at_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    created_by?: ModelTypes['directus_users_filter'] | undefined;
    description?: ModelTypes['string_filter_operators'] | undefined;
    gender?: ModelTypes['string_filter_operators'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    made_in?: ModelTypes['string_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    neck_tag?: ModelTypes['boolean_filter_operators'] | undefined;
    note?: ModelTypes['string_filter_operators'] | undefined;
    rating?: ModelTypes['string_filter_operators'] | undefined;
    size_guide?: ModelTypes['directus_files_filter'] | undefined;
    supplier?: ModelTypes['producers_filter'] | undefined;
    tags?: ModelTypes['string_filter_operators'] | undefined;
    tags_func?: ModelTypes['count_function_filter_operators'] | undefined;
    production_methods?:
      | ModelTypes['production_materials_production_methods_filter']
      | undefined;
    production_methods_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    stocked_at?:
      | ModelTypes['producers_production_materials_filter']
      | undefined;
    stocked_at_func?: ModelTypes['count_function_filter_operators'] | undefined;
    base_assets?: ModelTypes['production_materials_files_filter'] | undefined;
    base_assets_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    _and?:
      | Array<ModelTypes['production_materials_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['production_materials_filter'] | undefined>
      | undefined;
  };
  ['production_materials_production_methods_filter']: {
    id?: ModelTypes['number_filter_operators'] | undefined;
    production_materials_id?:
      | ModelTypes['production_materials_filter']
      | undefined;
    production_methods_id?: ModelTypes['production_methods_filter'] | undefined;
    _and?:
      | Array<
          | ModelTypes['production_materials_production_methods_filter']
          | undefined
        >
      | undefined;
    _or?:
      | Array<
          | ModelTypes['production_materials_production_methods_filter']
          | undefined
        >
      | undefined;
  };
  ['production_methods_filter']: {
    created_at?: ModelTypes['date_filter_operators'] | undefined;
    created_at_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    description?: ModelTypes['string_filter_operators'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    producers?: ModelTypes['producers_production_methods_filter'] | undefined;
    producers_func?: ModelTypes['count_function_filter_operators'] | undefined;
    production_materials?:
      | ModelTypes['production_materials_production_methods_filter']
      | undefined;
    production_materials_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    _and?:
      | Array<ModelTypes['production_methods_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['production_methods_filter'] | undefined>
      | undefined;
  };
  ['producers_production_methods_filter']: {
    id?: ModelTypes['number_filter_operators'] | undefined;
    producers_id?: ModelTypes['producers_filter'] | undefined;
    production_methods_id?: ModelTypes['production_methods_filter'] | undefined;
    _and?:
      | Array<ModelTypes['producers_production_methods_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['producers_production_methods_filter'] | undefined>
      | undefined;
  };
  ['production_materials_files_filter']: {
    directus_files_id?: ModelTypes['directus_files_filter'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    production_materials_id?:
      | ModelTypes['production_materials_filter']
      | undefined;
    _and?:
      | Array<ModelTypes['production_materials_files_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['production_materials_files_filter'] | undefined>
      | undefined;
  };
  ['stages_filter']: {
    description?: ModelTypes['string_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    sort?: ModelTypes['number_filter_operators'] | undefined;
    _and?: Array<ModelTypes['stages_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['stages_filter'] | undefined> | undefined;
  };
  ['currencies_filter']: {
    currency?: ModelTypes['string_filter_operators'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    _and?: Array<ModelTypes['currencies_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['currencies_filter'] | undefined> | undefined;
  };
  ['products_contributors_filter']: {
    collaborators_id?: ModelTypes['collaborators_filter'] | undefined;
    contribution_share?: ModelTypes['number_filter_operators'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    products_id?: ModelTypes['products_filter'] | undefined;
    robot_earned?: ModelTypes['number_filter_operators'] | undefined;
    _and?:
      | Array<ModelTypes['products_contributors_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['products_contributors_filter'] | undefined>
      | undefined;
  };
  ['products_production_materials_filter']: {
    id?: ModelTypes['number_filter_operators'] | undefined;
    production_materials_id?:
      | ModelTypes['production_materials_filter']
      | undefined;
    products_id?: ModelTypes['products_filter'] | undefined;
    _and?:
      | Array<ModelTypes['products_production_materials_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['products_production_materials_filter'] | undefined>
      | undefined;
  };
  ['products_design_files_filter']: {
    directus_files_id?: ModelTypes['directus_files_filter'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    products_id?: ModelTypes['products_filter'] | undefined;
    _and?:
      | Array<ModelTypes['products_design_files_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['products_design_files_filter'] | undefined>
      | undefined;
  };
  ['products_content_filter']: {
    directus_files_id?: ModelTypes['directus_files_filter'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    products_id?: ModelTypes['products_filter'] | undefined;
    _and?: Array<ModelTypes['products_content_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['products_content_filter'] | undefined> | undefined;
  };
  ['products_files_filter']: {
    directus_files_id?: ModelTypes['directus_files_filter'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    products_id?: ModelTypes['products_filter'] | undefined;
    _and?: Array<ModelTypes['products_files_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['products_files_filter'] | undefined> | undefined;
  };
  ['products_wearables_filter']: {
    directus_files_id?: ModelTypes['directus_files_filter'] | undefined;
    file_format?: ModelTypes['file_formats_filter'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    primary?: ModelTypes['boolean_filter_operators'] | undefined;
    products_id?: ModelTypes['products_filter'] | undefined;
    _and?:
      | Array<ModelTypes['products_wearables_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['products_wearables_filter'] | undefined>
      | undefined;
  };
  ['file_formats_filter']: {
    description?: ModelTypes['string_filter_operators'] | undefined;
    extension?: ModelTypes['string_filter_operators'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    mime_type?: ModelTypes['string_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    _and?: Array<ModelTypes['file_formats_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['file_formats_filter'] | undefined> | undefined;
  };
  ['products_production_methods_filter']: {
    id?: ModelTypes['number_filter_operators'] | undefined;
    production_methods_id?: ModelTypes['production_methods_filter'] | undefined;
    products_id?: ModelTypes['products_filter'] | undefined;
    _and?:
      | Array<ModelTypes['products_production_methods_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['products_production_methods_filter'] | undefined>
      | undefined;
  };
  ['invoices_filter']: {
    id?: ModelTypes['number_filter_operators'] | undefined;
    user_created?: ModelTypes['directus_users_filter'] | undefined;
    date_created?: ModelTypes['date_filter_operators'] | undefined;
    date_created_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    user_updated?: ModelTypes['directus_users_filter'] | undefined;
    date_updated?: ModelTypes['date_filter_operators'] | undefined;
    date_updated_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    details?: ModelTypes['string_filter_operators'] | undefined;
    description?: ModelTypes['string_filter_operators'] | undefined;
    status?: ModelTypes['string_filter_operators'] | undefined;
    amount?: ModelTypes['number_filter_operators'] | undefined;
    transaction_url?: ModelTypes['string_filter_operators'] | undefined;
    production_product_id?: ModelTypes['products_filter'] | undefined;
    client_product_id?: ModelTypes['products_filter'] | undefined;
    _and?: Array<ModelTypes['invoices_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['invoices_filter'] | undefined> | undefined;
  };
  ['brands_directus_users_filter']: {
    brands_id?: ModelTypes['brands_filter'] | undefined;
    directus_users_id?: ModelTypes['directus_users_filter'] | undefined;
    id?: ModelTypes['number_filter_operators'] | undefined;
    _and?:
      | Array<ModelTypes['brands_directus_users_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['brands_directus_users_filter'] | undefined>
      | undefined;
  };
  ['fulfillers']: {
    address?: string | undefined;
    created_at?: ModelTypes['Date'] | undefined;
    created_at_func?: ModelTypes['datetime_functions'] | undefined;
    email?: string | undefined;
    eth_address?: string | undefined;
    id: string;
    name?: string | undefined;
    website_url?: string | undefined;
  };
  ['price_currencies']: {
    amount: number;
    currency?: string | undefined;
    id: string;
  };
  ['producers']: {
    created_at?: ModelTypes['Date'] | undefined;
    created_at_func?: ModelTypes['datetime_functions'] | undefined;
    email?: string | undefined;
    eth_address?: string | undefined;
    id: string;
    name?: string | undefined;
    shipping_address?: string | undefined;
    production_materials_stocked?:
      | Array<ModelTypes['producers_production_materials'] | undefined>
      | undefined;
    production_materials_stocked_func?:
      | ModelTypes['count_functions']
      | undefined;
    production_methods?:
      | Array<ModelTypes['producers_production_methods'] | undefined>
      | undefined;
    production_methods_func?: ModelTypes['count_functions'] | undefined;
    supplied_materials?:
      | Array<ModelTypes['production_materials'] | undefined>
      | undefined;
    supplied_materials_func?: ModelTypes['count_functions'] | undefined;
  };
  ['producers_production_materials']: {
    id: string;
    producers_id?: ModelTypes['producers'] | undefined;
    production_materials_id?: ModelTypes['production_materials'] | undefined;
    quantity?: number | undefined;
  };
  ['production_materials']: {
    base_price?: number | undefined;
    color_palette?: ModelTypes['JSON'] | undefined;
    color_palette_func?: ModelTypes['count_functions'] | undefined;
    composition?: string | undefined;
    created_at?: ModelTypes['Date'] | undefined;
    created_at_func?: ModelTypes['datetime_functions'] | undefined;
    created_by?: ModelTypes['directus_users'] | undefined;
    description?: string | undefined;
    gender?: string | undefined;
    id: string;
    made_in?: string | undefined;
    name?: string | undefined;
    neck_tag?: boolean | undefined;
    note?: string | undefined;
    rating?: string | undefined;
    size_guide?: ModelTypes['directus_files'] | undefined;
    supplier?: ModelTypes['producers'] | undefined;
    tags?: ModelTypes['JSON'] | undefined;
    tags_func?: ModelTypes['count_functions'] | undefined;
    production_methods?:
      | Array<ModelTypes['production_materials_production_methods'] | undefined>
      | undefined;
    production_methods_func?: ModelTypes['count_functions'] | undefined;
    stocked_at?:
      | Array<ModelTypes['producers_production_materials'] | undefined>
      | undefined;
    stocked_at_func?: ModelTypes['count_functions'] | undefined;
    base_assets?:
      | Array<ModelTypes['production_materials_files'] | undefined>
      | undefined;
    base_assets_func?: ModelTypes['count_functions'] | undefined;
  };
  ['production_materials_production_methods']: {
    id: string;
    production_materials_id?: ModelTypes['production_materials'] | undefined;
    production_methods_id?: ModelTypes['production_methods'] | undefined;
  };
  ['production_methods']: {
    created_at?: ModelTypes['Date'] | undefined;
    created_at_func?: ModelTypes['datetime_functions'] | undefined;
    description?: string | undefined;
    id: string;
    name?: string | undefined;
    producers?:
      | Array<ModelTypes['producers_production_methods'] | undefined>
      | undefined;
    producers_func?: ModelTypes['count_functions'] | undefined;
    production_materials?:
      | Array<ModelTypes['production_materials_production_methods'] | undefined>
      | undefined;
    production_materials_func?: ModelTypes['count_functions'] | undefined;
  };
  ['producers_production_methods']: {
    id: string;
    producers_id?: ModelTypes['producers'] | undefined;
    production_methods_id?: ModelTypes['production_methods'] | undefined;
  };
  ['production_materials_files']: {
    directus_files_id?: ModelTypes['directus_files'] | undefined;
    id: string;
    production_materials_id?: ModelTypes['production_materials'] | undefined;
  };
  ['stages']: {
    description?: string | undefined;
    name: string;
    sort?: number | undefined;
  };
  ['currencies']: {
    currency: string;
    id: string;
  };
  ['products_contributors']: {
    collaborators_id?: ModelTypes['collaborators'] | undefined;
    contribution_share?: number | undefined;
    id: string;
    products_id?: ModelTypes['products'] | undefined;
    robot_earned?: number | undefined;
  };
  ['products_production_materials']: {
    id: string;
    production_materials_id?: ModelTypes['production_materials'] | undefined;
    products_id?: ModelTypes['products'] | undefined;
  };
  ['products_design_files']: {
    directus_files_id?: ModelTypes['directus_files'] | undefined;
    id: string;
    products_id?: ModelTypes['products'] | undefined;
  };
  ['products_content']: {
    directus_files_id?: ModelTypes['directus_files'] | undefined;
    id: string;
    products_id?: ModelTypes['products'] | undefined;
  };
  ['products_files']: {
    directus_files_id?: ModelTypes['directus_files'] | undefined;
    id: string;
    products_id?: ModelTypes['products'] | undefined;
  };
  ['products_wearables']: {
    directus_files_id?: ModelTypes['directus_files'] | undefined;
    file_format?: ModelTypes['file_formats'] | undefined;
    id: string;
    primary?: boolean | undefined;
    products_id?: ModelTypes['products'] | undefined;
  };
  ['file_formats']: {
    description?: string | undefined;
    extension?: string | undefined;
    id: string;
    mime_type?: string | undefined;
    name: string;
  };
  ['products_production_methods']: {
    id: string;
    production_methods_id?: ModelTypes['production_methods'] | undefined;
    products_id?: ModelTypes['products'] | undefined;
  };
  ['invoices']: {
    id: string;
    user_created?: ModelTypes['directus_users'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    date_created_func?: ModelTypes['datetime_functions'] | undefined;
    user_updated?: ModelTypes['directus_users'] | undefined;
    date_updated?: ModelTypes['Date'] | undefined;
    date_updated_func?: ModelTypes['datetime_functions'] | undefined;
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: string | undefined;
    description: string;
    status?: string | undefined;
    /** Invoice amount in USD */
    amount?: number | undefined;
    transaction_url?: string | undefined;
    production_product_id?: ModelTypes['products'] | undefined;
    client_product_id?: ModelTypes['products'] | undefined;
  };
  ['brands_directus_users']: {
    brands_id?: ModelTypes['brands'] | undefined;
    directus_users_id?: ModelTypes['directus_users'] | undefined;
    id: string;
  };
  ['brands_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['brands_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['brands_aggregated_count'] | undefined;
  };
  ['brands_aggregated_count']: {
    created_at?: number | undefined;
    description?: number | undefined;
    discord_url?: number | undefined;
    eth_address?: number | undefined;
    id?: number | undefined;
    logo?: number | undefined;
    name?: number | undefined;
    notion_id?: number | undefined;
    twitter_url?: number | undefined;
    website_url?: number | undefined;
    products?: number | undefined;
    users?: number | undefined;
  };
  ['brands_directus_users_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['brands_directus_users_aggregated_count'] | undefined;
    countDistinct?:
      | ModelTypes['brands_directus_users_aggregated_count']
      | undefined;
    avg?: ModelTypes['brands_directus_users_aggregated_fields'] | undefined;
    sum?: ModelTypes['brands_directus_users_aggregated_fields'] | undefined;
    avgDistinct?:
      | ModelTypes['brands_directus_users_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['brands_directus_users_aggregated_fields']
      | undefined;
    min?: ModelTypes['brands_directus_users_aggregated_fields'] | undefined;
    max?: ModelTypes['brands_directus_users_aggregated_fields'] | undefined;
  };
  ['brands_directus_users_aggregated_count']: {
    brands_id?: number | undefined;
    directus_users_id?: number | undefined;
    id?: number | undefined;
  };
  ['brands_directus_users_aggregated_fields']: {
    brands_id?: number | undefined;
    id?: number | undefined;
  };
  ['collaborators_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['collaborators_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['collaborators_aggregated_count'] | undefined;
    avg?: ModelTypes['collaborators_aggregated_fields'] | undefined;
    sum?: ModelTypes['collaborators_aggregated_fields'] | undefined;
    avgDistinct?: ModelTypes['collaborators_aggregated_fields'] | undefined;
    sumDistinct?: ModelTypes['collaborators_aggregated_fields'] | undefined;
    min?: ModelTypes['collaborators_aggregated_fields'] | undefined;
    max?: ModelTypes['collaborators_aggregated_fields'] | undefined;
  };
  ['collaborators_aggregated_count']: {
    account?: number | undefined;
    date_created?: number | undefined;
    date_updated?: number | undefined;
    display_name?: number | undefined;
    id?: number | undefined;
    payment_eth_address?: number | undefined;
    role?: number | undefined;
    user_created?: number | undefined;
  };
  ['collaborators_aggregated_fields']: {
    id?: number | undefined;
    role?: number | undefined;
  };
  ['collaborator_roles_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['collaborator_roles_aggregated_count'] | undefined;
    countDistinct?:
      | ModelTypes['collaborator_roles_aggregated_count']
      | undefined;
    avg?: ModelTypes['collaborator_roles_aggregated_fields'] | undefined;
    sum?: ModelTypes['collaborator_roles_aggregated_fields'] | undefined;
    avgDistinct?:
      | ModelTypes['collaborator_roles_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['collaborator_roles_aggregated_fields']
      | undefined;
    min?: ModelTypes['collaborator_roles_aggregated_fields'] | undefined;
    max?: ModelTypes['collaborator_roles_aggregated_fields'] | undefined;
  };
  ['collaborator_roles_aggregated_count']: {
    description?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
  };
  ['collaborator_roles_aggregated_fields']: {
    id?: number | undefined;
  };
  ['junction_directus_users_skills_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | ModelTypes['junction_directus_users_skills_aggregated_count']
      | undefined;
    countDistinct?:
      | ModelTypes['junction_directus_users_skills_aggregated_count']
      | undefined;
    avg?:
      | ModelTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
    sum?:
      | ModelTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
    avgDistinct?:
      | ModelTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
    min?:
      | ModelTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
    max?:
      | ModelTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
  };
  ['junction_directus_users_skills_aggregated_count']: {
    directus_users_id?: number | undefined;
    id?: number | undefined;
    skills_id?: number | undefined;
  };
  ['junction_directus_users_skills_aggregated_fields']: {
    id?: number | undefined;
    skills_id?: number | undefined;
  };
  ['skills_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['skills_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['skills_aggregated_count'] | undefined;
  };
  ['skills_aggregated_count']: {
    description?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
  };
  ['producers_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['producers_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['producers_aggregated_count'] | undefined;
  };
  ['producers_aggregated_count']: {
    created_at?: number | undefined;
    email?: number | undefined;
    eth_address?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
    shipping_address?: number | undefined;
    /** List of production materials in this producers inventory */
    production_materials_stocked?: number | undefined;
    production_methods?: number | undefined;
    /** Production materials manufactured / sourced by this producer */
    supplied_materials?: number | undefined;
  };
  ['producers_production_materials_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | ModelTypes['producers_production_materials_aggregated_count']
      | undefined;
    countDistinct?:
      | ModelTypes['producers_production_materials_aggregated_count']
      | undefined;
    avg?:
      | ModelTypes['producers_production_materials_aggregated_fields']
      | undefined;
    sum?:
      | ModelTypes['producers_production_materials_aggregated_fields']
      | undefined;
    avgDistinct?:
      | ModelTypes['producers_production_materials_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['producers_production_materials_aggregated_fields']
      | undefined;
    min?:
      | ModelTypes['producers_production_materials_aggregated_fields']
      | undefined;
    max?:
      | ModelTypes['producers_production_materials_aggregated_fields']
      | undefined;
  };
  ['producers_production_materials_aggregated_count']: {
    id?: number | undefined;
    producers_id?: number | undefined;
    production_materials_id?: number | undefined;
    quantity?: number | undefined;
  };
  ['producers_production_materials_aggregated_fields']: {
    id?: number | undefined;
    producers_id?: number | undefined;
    production_materials_id?: number | undefined;
    quantity?: number | undefined;
  };
  ['producers_production_methods_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | ModelTypes['producers_production_methods_aggregated_count']
      | undefined;
    countDistinct?:
      | ModelTypes['producers_production_methods_aggregated_count']
      | undefined;
    avg?:
      | ModelTypes['producers_production_methods_aggregated_fields']
      | undefined;
    sum?:
      | ModelTypes['producers_production_methods_aggregated_fields']
      | undefined;
    avgDistinct?:
      | ModelTypes['producers_production_methods_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['producers_production_methods_aggregated_fields']
      | undefined;
    min?:
      | ModelTypes['producers_production_methods_aggregated_fields']
      | undefined;
    max?:
      | ModelTypes['producers_production_methods_aggregated_fields']
      | undefined;
  };
  ['producers_production_methods_aggregated_count']: {
    id?: number | undefined;
    producers_id?: number | undefined;
    production_methods_id?: number | undefined;
  };
  ['producers_production_methods_aggregated_fields']: {
    id?: number | undefined;
    producers_id?: number | undefined;
    production_methods_id?: number | undefined;
  };
  ['production_methods_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['production_methods_aggregated_count'] | undefined;
    countDistinct?:
      | ModelTypes['production_methods_aggregated_count']
      | undefined;
  };
  ['production_methods_aggregated_count']: {
    created_at?: number | undefined;
    description?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
    /** List of producers that are cable of this production method */
    producers?: number | undefined;
    production_materials?: number | undefined;
  };
  ['production_materials_production_methods_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | ModelTypes['production_materials_production_methods_aggregated_count']
      | undefined;
    countDistinct?:
      | ModelTypes['production_materials_production_methods_aggregated_count']
      | undefined;
    avg?:
      | ModelTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
    sum?:
      | ModelTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
    avgDistinct?:
      | ModelTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
    min?:
      | ModelTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
    max?:
      | ModelTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
  };
  ['production_materials_production_methods_aggregated_count']: {
    id?: number | undefined;
    production_materials_id?: number | undefined;
    production_methods_id?: number | undefined;
  };
  ['production_materials_production_methods_aggregated_fields']: {
    id?: number | undefined;
    production_materials_id?: number | undefined;
    production_methods_id?: number | undefined;
  };
  ['fulfillers_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['fulfillers_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['fulfillers_aggregated_count'] | undefined;
  };
  ['fulfillers_aggregated_count']: {
    address?: number | undefined;
    created_at?: number | undefined;
    email?: number | undefined;
    eth_address?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
    website_url?: number | undefined;
  };
  ['price_currencies_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['price_currencies_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['price_currencies_aggregated_count'] | undefined;
    avg?: ModelTypes['price_currencies_aggregated_fields'] | undefined;
    sum?: ModelTypes['price_currencies_aggregated_fields'] | undefined;
    avgDistinct?: ModelTypes['price_currencies_aggregated_fields'] | undefined;
    sumDistinct?: ModelTypes['price_currencies_aggregated_fields'] | undefined;
    min?: ModelTypes['price_currencies_aggregated_fields'] | undefined;
    max?: ModelTypes['price_currencies_aggregated_fields'] | undefined;
  };
  ['price_currencies_aggregated_count']: {
    amount?: number | undefined;
    currency?: number | undefined;
    id?: number | undefined;
  };
  ['price_currencies_aggregated_fields']: {
    amount?: number | undefined;
    id?: number | undefined;
  };
  ['stages_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['stages_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['stages_aggregated_count'] | undefined;
    avg?: ModelTypes['stages_aggregated_fields'] | undefined;
    sum?: ModelTypes['stages_aggregated_fields'] | undefined;
    avgDistinct?: ModelTypes['stages_aggregated_fields'] | undefined;
    sumDistinct?: ModelTypes['stages_aggregated_fields'] | undefined;
    min?: ModelTypes['stages_aggregated_fields'] | undefined;
    max?: ModelTypes['stages_aggregated_fields'] | undefined;
  };
  ['stages_aggregated_count']: {
    description?: number | undefined;
    name?: number | undefined;
    sort?: number | undefined;
  };
  ['stages_aggregated_fields']: {
    sort?: number | undefined;
  };
  ['currencies_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['currencies_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['currencies_aggregated_count'] | undefined;
    avg?: ModelTypes['currencies_aggregated_fields'] | undefined;
    sum?: ModelTypes['currencies_aggregated_fields'] | undefined;
    avgDistinct?: ModelTypes['currencies_aggregated_fields'] | undefined;
    sumDistinct?: ModelTypes['currencies_aggregated_fields'] | undefined;
    min?: ModelTypes['currencies_aggregated_fields'] | undefined;
    max?: ModelTypes['currencies_aggregated_fields'] | undefined;
  };
  ['currencies_aggregated_count']: {
    currency?: number | undefined;
    id?: number | undefined;
  };
  ['currencies_aggregated_fields']: {
    id?: number | undefined;
  };
  ['products_content_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['products_content_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['products_content_aggregated_count'] | undefined;
    avg?: ModelTypes['products_content_aggregated_fields'] | undefined;
    sum?: ModelTypes['products_content_aggregated_fields'] | undefined;
    avgDistinct?: ModelTypes['products_content_aggregated_fields'] | undefined;
    sumDistinct?: ModelTypes['products_content_aggregated_fields'] | undefined;
    min?: ModelTypes['products_content_aggregated_fields'] | undefined;
    max?: ModelTypes['products_content_aggregated_fields'] | undefined;
  };
  ['products_content_aggregated_count']: {
    directus_files_id?: number | undefined;
    id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_content_aggregated_fields']: {
    id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_contributors_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['products_contributors_aggregated_count'] | undefined;
    countDistinct?:
      | ModelTypes['products_contributors_aggregated_count']
      | undefined;
    avg?: ModelTypes['products_contributors_aggregated_fields'] | undefined;
    sum?: ModelTypes['products_contributors_aggregated_fields'] | undefined;
    avgDistinct?:
      | ModelTypes['products_contributors_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['products_contributors_aggregated_fields']
      | undefined;
    min?: ModelTypes['products_contributors_aggregated_fields'] | undefined;
    max?: ModelTypes['products_contributors_aggregated_fields'] | undefined;
  };
  ['products_contributors_aggregated_count']: {
    collaborators_id?: number | undefined;
    contribution_share?: number | undefined;
    id?: number | undefined;
    products_id?: number | undefined;
    robot_earned?: number | undefined;
  };
  ['products_contributors_aggregated_fields']: {
    collaborators_id?: number | undefined;
    contribution_share?: number | undefined;
    id?: number | undefined;
    products_id?: number | undefined;
    robot_earned?: number | undefined;
  };
  ['products_design_files_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['products_design_files_aggregated_count'] | undefined;
    countDistinct?:
      | ModelTypes['products_design_files_aggregated_count']
      | undefined;
    avg?: ModelTypes['products_design_files_aggregated_fields'] | undefined;
    sum?: ModelTypes['products_design_files_aggregated_fields'] | undefined;
    avgDistinct?:
      | ModelTypes['products_design_files_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['products_design_files_aggregated_fields']
      | undefined;
    min?: ModelTypes['products_design_files_aggregated_fields'] | undefined;
    max?: ModelTypes['products_design_files_aggregated_fields'] | undefined;
  };
  ['products_design_files_aggregated_count']: {
    directus_files_id?: number | undefined;
    id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_design_files_aggregated_fields']: {
    id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_files_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['products_files_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['products_files_aggregated_count'] | undefined;
    avg?: ModelTypes['products_files_aggregated_fields'] | undefined;
    sum?: ModelTypes['products_files_aggregated_fields'] | undefined;
    avgDistinct?: ModelTypes['products_files_aggregated_fields'] | undefined;
    sumDistinct?: ModelTypes['products_files_aggregated_fields'] | undefined;
    min?: ModelTypes['products_files_aggregated_fields'] | undefined;
    max?: ModelTypes['products_files_aggregated_fields'] | undefined;
  };
  ['products_files_aggregated_count']: {
    directus_files_id?: number | undefined;
    id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_files_aggregated_fields']: {
    id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_production_materials_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | ModelTypes['products_production_materials_aggregated_count']
      | undefined;
    countDistinct?:
      | ModelTypes['products_production_materials_aggregated_count']
      | undefined;
    avg?:
      | ModelTypes['products_production_materials_aggregated_fields']
      | undefined;
    sum?:
      | ModelTypes['products_production_materials_aggregated_fields']
      | undefined;
    avgDistinct?:
      | ModelTypes['products_production_materials_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['products_production_materials_aggregated_fields']
      | undefined;
    min?:
      | ModelTypes['products_production_materials_aggregated_fields']
      | undefined;
    max?:
      | ModelTypes['products_production_materials_aggregated_fields']
      | undefined;
  };
  ['products_production_materials_aggregated_count']: {
    id?: number | undefined;
    production_materials_id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_production_materials_aggregated_fields']: {
    id?: number | undefined;
    production_materials_id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_production_methods_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | ModelTypes['products_production_methods_aggregated_count']
      | undefined;
    countDistinct?:
      | ModelTypes['products_production_methods_aggregated_count']
      | undefined;
    avg?:
      | ModelTypes['products_production_methods_aggregated_fields']
      | undefined;
    sum?:
      | ModelTypes['products_production_methods_aggregated_fields']
      | undefined;
    avgDistinct?:
      | ModelTypes['products_production_methods_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['products_production_methods_aggregated_fields']
      | undefined;
    min?:
      | ModelTypes['products_production_methods_aggregated_fields']
      | undefined;
    max?:
      | ModelTypes['products_production_methods_aggregated_fields']
      | undefined;
  };
  ['products_production_methods_aggregated_count']: {
    id?: number | undefined;
    production_methods_id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_production_methods_aggregated_fields']: {
    id?: number | undefined;
    production_methods_id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_wearables_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['products_wearables_aggregated_count'] | undefined;
    countDistinct?:
      | ModelTypes['products_wearables_aggregated_count']
      | undefined;
    avg?: ModelTypes['products_wearables_aggregated_fields'] | undefined;
    sum?: ModelTypes['products_wearables_aggregated_fields'] | undefined;
    avgDistinct?:
      | ModelTypes['products_wearables_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['products_wearables_aggregated_fields']
      | undefined;
    min?: ModelTypes['products_wearables_aggregated_fields'] | undefined;
    max?: ModelTypes['products_wearables_aggregated_fields'] | undefined;
  };
  ['products_wearables_aggregated_count']: {
    directus_files_id?: number | undefined;
    file_format?: number | undefined;
    id?: number | undefined;
    primary?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_wearables_aggregated_fields']: {
    file_format?: number | undefined;
    id?: number | undefined;
    products_id?: number | undefined;
  };
  ['file_formats_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['file_formats_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['file_formats_aggregated_count'] | undefined;
    avg?: ModelTypes['file_formats_aggregated_fields'] | undefined;
    sum?: ModelTypes['file_formats_aggregated_fields'] | undefined;
    avgDistinct?: ModelTypes['file_formats_aggregated_fields'] | undefined;
    sumDistinct?: ModelTypes['file_formats_aggregated_fields'] | undefined;
    min?: ModelTypes['file_formats_aggregated_fields'] | undefined;
    max?: ModelTypes['file_formats_aggregated_fields'] | undefined;
  };
  ['file_formats_aggregated_count']: {
    description?: number | undefined;
    extension?: number | undefined;
    id?: number | undefined;
    mime_type?: number | undefined;
    name?: number | undefined;
  };
  ['file_formats_aggregated_fields']: {
    id?: number | undefined;
  };
  ['products_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['products_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['products_aggregated_count'] | undefined;
    avg?: ModelTypes['products_aggregated_fields'] | undefined;
    sum?: ModelTypes['products_aggregated_fields'] | undefined;
    avgDistinct?: ModelTypes['products_aggregated_fields'] | undefined;
    sumDistinct?: ModelTypes['products_aggregated_fields'] | undefined;
    min?: ModelTypes['products_aggregated_fields'] | undefined;
    max?: ModelTypes['products_aggregated_fields'] | undefined;
  };
  ['products_aggregated_count']: {
    brand_id?: number | undefined;
    clo3d_file?: number | undefined;
    created_at?: number | undefined;
    description?: number | undefined;
    discord_channel_id?: number | undefined;
    fulfiller_id?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
    nft_token_id?: number | undefined;
    notion_id?: number | undefined;
    price?: number | undefined;
    producer_id?: number | undefined;
    product_stage?: number | undefined;
    production_cost?: number | undefined;
    quantity?: number | undefined;
    release_date?: number | undefined;
    sale_currency?: number | undefined;
    sale_price?: number | undefined;
    sale_type?: number | undefined;
    season?: number | undefined;
    shopify_id?: number | undefined;
    status?: number | undefined;
    notes?: number | undefined;
    date_updated?: number | undefined;
    html_file?: number | undefined;
    thumbnail?: number | undefined;
    vrm_file?: number | undefined;
    contributors?: number | undefined;
    materials?: number | undefined;
    design_files?: number | undefined;
    content?: number | undefined;
    images?: number | undefined;
    wearable_files?: number | undefined;
    production_methods?: number | undefined;
    /** Invoices to clients for deposits */
    client_invoices?: number | undefined;
    /** Invoices from producers for production costs */
    production_invoices?: number | undefined;
  };
  ['products_aggregated_fields']: {
    brand_id?: number | undefined;
    fulfiller_id?: number | undefined;
    id?: number | undefined;
    nft_token_id?: number | undefined;
    price?: number | undefined;
    producer_id?: number | undefined;
    production_cost?: number | undefined;
    quantity?: number | undefined;
    sale_currency?: number | undefined;
    sale_price?: number | undefined;
    season?: number | undefined;
  };
  ['production_materials_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['production_materials_aggregated_count'] | undefined;
    countDistinct?:
      | ModelTypes['production_materials_aggregated_count']
      | undefined;
    avg?: ModelTypes['production_materials_aggregated_fields'] | undefined;
    sum?: ModelTypes['production_materials_aggregated_fields'] | undefined;
    avgDistinct?:
      | ModelTypes['production_materials_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['production_materials_aggregated_fields']
      | undefined;
    min?: ModelTypes['production_materials_aggregated_fields'] | undefined;
    max?: ModelTypes['production_materials_aggregated_fields'] | undefined;
  };
  ['production_materials_aggregated_count']: {
    base_price?: number | undefined;
    color_palette?: number | undefined;
    composition?: number | undefined;
    created_at?: number | undefined;
    created_by?: number | undefined;
    description?: number | undefined;
    gender?: number | undefined;
    id?: number | undefined;
    made_in?: number | undefined;
    name?: number | undefined;
    neck_tag?: number | undefined;
    note?: number | undefined;
    rating?: number | undefined;
    size_guide?: number | undefined;
    supplier?: number | undefined;
    tags?: number | undefined;
    production_methods?: number | undefined;
    stocked_at?: number | undefined;
    /** Design files, mockups, base meshes for wearbles, CLO3d files, etc */
    base_assets?: number | undefined;
  };
  ['production_materials_aggregated_fields']: {
    base_price?: number | undefined;
    id?: number | undefined;
    supplier?: number | undefined;
  };
  ['invoices_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['invoices_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['invoices_aggregated_count'] | undefined;
    avg?: ModelTypes['invoices_aggregated_fields'] | undefined;
    sum?: ModelTypes['invoices_aggregated_fields'] | undefined;
    avgDistinct?: ModelTypes['invoices_aggregated_fields'] | undefined;
    sumDistinct?: ModelTypes['invoices_aggregated_fields'] | undefined;
    min?: ModelTypes['invoices_aggregated_fields'] | undefined;
    max?: ModelTypes['invoices_aggregated_fields'] | undefined;
  };
  ['invoices_aggregated_count']: {
    id?: number | undefined;
    user_created?: number | undefined;
    date_created?: number | undefined;
    user_updated?: number | undefined;
    date_updated?: number | undefined;
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: number | undefined;
    description?: number | undefined;
    status?: number | undefined;
    /** Invoice amount in USD */
    amount?: number | undefined;
    transaction_url?: number | undefined;
    /** The product that this production invoice is for */
    production_product_id?: number | undefined;
    /** Invoices to clients for a given product */
    client_product_id?: number | undefined;
  };
  ['invoices_aggregated_fields']: {
    id?: number | undefined;
    /** Invoice amount in USD */
    amount?: number | undefined;
    /** The product that this production invoice is for */
    production_product_id?: number | undefined;
    /** Invoices to clients for a given product */
    client_product_id?: number | undefined;
  };
  ['production_materials_files_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | ModelTypes['production_materials_files_aggregated_count']
      | undefined;
    countDistinct?:
      | ModelTypes['production_materials_files_aggregated_count']
      | undefined;
    avg?:
      | ModelTypes['production_materials_files_aggregated_fields']
      | undefined;
    sum?:
      | ModelTypes['production_materials_files_aggregated_fields']
      | undefined;
    avgDistinct?:
      | ModelTypes['production_materials_files_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['production_materials_files_aggregated_fields']
      | undefined;
    min?:
      | ModelTypes['production_materials_files_aggregated_fields']
      | undefined;
    max?:
      | ModelTypes['production_materials_files_aggregated_fields']
      | undefined;
  };
  ['production_materials_files_aggregated_count']: {
    directus_files_id?: number | undefined;
    id?: number | undefined;
    production_materials_id?: number | undefined;
  };
  ['production_materials_files_aggregated_fields']: {
    id?: number | undefined;
    production_materials_id?: number | undefined;
  };
  ['Mutation']: {
    create_brands_items: Array<ModelTypes['brands']>;
    create_brands_item?: ModelTypes['brands'] | undefined;
    create_brands_directus_users_items: Array<
      ModelTypes['brands_directus_users']
    >;
    create_brands_directus_users_item?:
      | ModelTypes['brands_directus_users']
      | undefined;
    create_collaborators_items: Array<ModelTypes['collaborators']>;
    create_collaborators_item?: ModelTypes['collaborators'] | undefined;
    create_collaborator_roles_items: Array<ModelTypes['collaborator_roles']>;
    create_collaborator_roles_item?:
      | ModelTypes['collaborator_roles']
      | undefined;
    create_junction_directus_users_skills_items: Array<
      ModelTypes['junction_directus_users_skills']
    >;
    create_junction_directus_users_skills_item?:
      | ModelTypes['junction_directus_users_skills']
      | undefined;
    create_skills_items: Array<ModelTypes['skills']>;
    create_skills_item?: ModelTypes['skills'] | undefined;
    create_producers_items: Array<ModelTypes['producers']>;
    create_producers_item?: ModelTypes['producers'] | undefined;
    create_producers_production_materials_items: Array<
      ModelTypes['producers_production_materials']
    >;
    create_producers_production_materials_item?:
      | ModelTypes['producers_production_materials']
      | undefined;
    create_producers_production_methods_items: Array<
      ModelTypes['producers_production_methods']
    >;
    create_producers_production_methods_item?:
      | ModelTypes['producers_production_methods']
      | undefined;
    create_production_methods_items: Array<ModelTypes['production_methods']>;
    create_production_methods_item?:
      | ModelTypes['production_methods']
      | undefined;
    create_production_materials_production_methods_items: Array<
      ModelTypes['production_materials_production_methods']
    >;
    create_production_materials_production_methods_item?:
      | ModelTypes['production_materials_production_methods']
      | undefined;
    create_fulfillers_items: Array<ModelTypes['fulfillers']>;
    create_fulfillers_item?: ModelTypes['fulfillers'] | undefined;
    create_price_currencies_items: Array<ModelTypes['price_currencies']>;
    create_price_currencies_item?: ModelTypes['price_currencies'] | undefined;
    create_stages_items: Array<ModelTypes['stages']>;
    create_stages_item?: ModelTypes['stages'] | undefined;
    create_currencies_items: Array<ModelTypes['currencies']>;
    create_currencies_item?: ModelTypes['currencies'] | undefined;
    create_products_content_items: Array<ModelTypes['products_content']>;
    create_products_content_item?: ModelTypes['products_content'] | undefined;
    create_products_contributors_items: Array<
      ModelTypes['products_contributors']
    >;
    create_products_contributors_item?:
      | ModelTypes['products_contributors']
      | undefined;
    create_products_design_files_items: Array<
      ModelTypes['products_design_files']
    >;
    create_products_design_files_item?:
      | ModelTypes['products_design_files']
      | undefined;
    create_products_files_items: Array<ModelTypes['products_files']>;
    create_products_files_item?: ModelTypes['products_files'] | undefined;
    create_products_production_materials_items: Array<
      ModelTypes['products_production_materials']
    >;
    create_products_production_materials_item?:
      | ModelTypes['products_production_materials']
      | undefined;
    create_products_production_methods_items: Array<
      ModelTypes['products_production_methods']
    >;
    create_products_production_methods_item?:
      | ModelTypes['products_production_methods']
      | undefined;
    create_products_wearables_items: Array<ModelTypes['products_wearables']>;
    create_products_wearables_item?:
      | ModelTypes['products_wearables']
      | undefined;
    create_file_formats_items: Array<ModelTypes['file_formats']>;
    create_file_formats_item?: ModelTypes['file_formats'] | undefined;
    create_products_items: Array<ModelTypes['products']>;
    create_products_item?: ModelTypes['products'] | undefined;
    create_production_materials_items: Array<
      ModelTypes['production_materials']
    >;
    create_production_materials_item?:
      | ModelTypes['production_materials']
      | undefined;
    create_invoices_items: Array<ModelTypes['invoices']>;
    create_invoices_item?: ModelTypes['invoices'] | undefined;
    create_production_materials_files_items: Array<
      ModelTypes['production_materials_files']
    >;
    create_production_materials_files_item?:
      | ModelTypes['production_materials_files']
      | undefined;
    update_brands_items: Array<ModelTypes['brands']>;
    update_brands_batch: Array<ModelTypes['brands']>;
    update_brands_item?: ModelTypes['brands'] | undefined;
    update_brands_directus_users_items: Array<
      ModelTypes['brands_directus_users']
    >;
    update_brands_directus_users_batch: Array<
      ModelTypes['brands_directus_users']
    >;
    update_brands_directus_users_item?:
      | ModelTypes['brands_directus_users']
      | undefined;
    update_collaborators_items: Array<ModelTypes['collaborators']>;
    update_collaborators_batch: Array<ModelTypes['collaborators']>;
    update_collaborators_item?: ModelTypes['collaborators'] | undefined;
    update_collaborator_roles_items: Array<ModelTypes['collaborator_roles']>;
    update_collaborator_roles_batch: Array<ModelTypes['collaborator_roles']>;
    update_collaborator_roles_item?:
      | ModelTypes['collaborator_roles']
      | undefined;
    update_junction_directus_users_skills_items: Array<
      ModelTypes['junction_directus_users_skills']
    >;
    update_junction_directus_users_skills_batch: Array<
      ModelTypes['junction_directus_users_skills']
    >;
    update_junction_directus_users_skills_item?:
      | ModelTypes['junction_directus_users_skills']
      | undefined;
    update_skills_items: Array<ModelTypes['skills']>;
    update_skills_batch: Array<ModelTypes['skills']>;
    update_skills_item?: ModelTypes['skills'] | undefined;
    update_producers_items: Array<ModelTypes['producers']>;
    update_producers_batch: Array<ModelTypes['producers']>;
    update_producers_item?: ModelTypes['producers'] | undefined;
    update_producers_production_materials_items: Array<
      ModelTypes['producers_production_materials']
    >;
    update_producers_production_materials_batch: Array<
      ModelTypes['producers_production_materials']
    >;
    update_producers_production_materials_item?:
      | ModelTypes['producers_production_materials']
      | undefined;
    update_producers_production_methods_items: Array<
      ModelTypes['producers_production_methods']
    >;
    update_producers_production_methods_batch: Array<
      ModelTypes['producers_production_methods']
    >;
    update_producers_production_methods_item?:
      | ModelTypes['producers_production_methods']
      | undefined;
    update_production_methods_items: Array<ModelTypes['production_methods']>;
    update_production_methods_batch: Array<ModelTypes['production_methods']>;
    update_production_methods_item?:
      | ModelTypes['production_methods']
      | undefined;
    update_production_materials_production_methods_items: Array<
      ModelTypes['production_materials_production_methods']
    >;
    update_production_materials_production_methods_batch: Array<
      ModelTypes['production_materials_production_methods']
    >;
    update_production_materials_production_methods_item?:
      | ModelTypes['production_materials_production_methods']
      | undefined;
    update_fulfillers_items: Array<ModelTypes['fulfillers']>;
    update_fulfillers_batch: Array<ModelTypes['fulfillers']>;
    update_fulfillers_item?: ModelTypes['fulfillers'] | undefined;
    update_price_currencies_items: Array<ModelTypes['price_currencies']>;
    update_price_currencies_batch: Array<ModelTypes['price_currencies']>;
    update_price_currencies_item?: ModelTypes['price_currencies'] | undefined;
    update_stages_items: Array<ModelTypes['stages']>;
    update_stages_batch: Array<ModelTypes['stages']>;
    update_stages_item?: ModelTypes['stages'] | undefined;
    update_currencies_items: Array<ModelTypes['currencies']>;
    update_currencies_batch: Array<ModelTypes['currencies']>;
    update_currencies_item?: ModelTypes['currencies'] | undefined;
    update_products_content_items: Array<ModelTypes['products_content']>;
    update_products_content_batch: Array<ModelTypes['products_content']>;
    update_products_content_item?: ModelTypes['products_content'] | undefined;
    update_products_contributors_items: Array<
      ModelTypes['products_contributors']
    >;
    update_products_contributors_batch: Array<
      ModelTypes['products_contributors']
    >;
    update_products_contributors_item?:
      | ModelTypes['products_contributors']
      | undefined;
    update_products_design_files_items: Array<
      ModelTypes['products_design_files']
    >;
    update_products_design_files_batch: Array<
      ModelTypes['products_design_files']
    >;
    update_products_design_files_item?:
      | ModelTypes['products_design_files']
      | undefined;
    update_products_files_items: Array<ModelTypes['products_files']>;
    update_products_files_batch: Array<ModelTypes['products_files']>;
    update_products_files_item?: ModelTypes['products_files'] | undefined;
    update_products_production_materials_items: Array<
      ModelTypes['products_production_materials']
    >;
    update_products_production_materials_batch: Array<
      ModelTypes['products_production_materials']
    >;
    update_products_production_materials_item?:
      | ModelTypes['products_production_materials']
      | undefined;
    update_products_production_methods_items: Array<
      ModelTypes['products_production_methods']
    >;
    update_products_production_methods_batch: Array<
      ModelTypes['products_production_methods']
    >;
    update_products_production_methods_item?:
      | ModelTypes['products_production_methods']
      | undefined;
    update_products_wearables_items: Array<ModelTypes['products_wearables']>;
    update_products_wearables_batch: Array<ModelTypes['products_wearables']>;
    update_products_wearables_item?:
      | ModelTypes['products_wearables']
      | undefined;
    update_file_formats_items: Array<ModelTypes['file_formats']>;
    update_file_formats_batch: Array<ModelTypes['file_formats']>;
    update_file_formats_item?: ModelTypes['file_formats'] | undefined;
    update_products_items: Array<ModelTypes['products']>;
    update_products_batch: Array<ModelTypes['products']>;
    update_products_item?: ModelTypes['products'] | undefined;
    update_production_materials_items: Array<
      ModelTypes['production_materials']
    >;
    update_production_materials_batch: Array<
      ModelTypes['production_materials']
    >;
    update_production_materials_item?:
      | ModelTypes['production_materials']
      | undefined;
    update_invoices_items: Array<ModelTypes['invoices']>;
    update_invoices_batch: Array<ModelTypes['invoices']>;
    update_invoices_item?: ModelTypes['invoices'] | undefined;
    update_production_materials_files_items: Array<
      ModelTypes['production_materials_files']
    >;
    update_production_materials_files_batch: Array<
      ModelTypes['production_materials_files']
    >;
    update_production_materials_files_item?:
      | ModelTypes['production_materials_files']
      | undefined;
    delete_brands_items?: ModelTypes['delete_many'] | undefined;
    delete_brands_item?: ModelTypes['delete_one'] | undefined;
    delete_brands_directus_users_items?: ModelTypes['delete_many'] | undefined;
    delete_brands_directus_users_item?: ModelTypes['delete_one'] | undefined;
    delete_collaborators_items?: ModelTypes['delete_many'] | undefined;
    delete_collaborators_item?: ModelTypes['delete_one'] | undefined;
    delete_collaborator_roles_items?: ModelTypes['delete_many'] | undefined;
    delete_collaborator_roles_item?: ModelTypes['delete_one'] | undefined;
    delete_junction_directus_users_skills_items?:
      | ModelTypes['delete_many']
      | undefined;
    delete_junction_directus_users_skills_item?:
      | ModelTypes['delete_one']
      | undefined;
    delete_skills_items?: ModelTypes['delete_many'] | undefined;
    delete_skills_item?: ModelTypes['delete_one'] | undefined;
    delete_producers_items?: ModelTypes['delete_many'] | undefined;
    delete_producers_item?: ModelTypes['delete_one'] | undefined;
    delete_producers_production_materials_items?:
      | ModelTypes['delete_many']
      | undefined;
    delete_producers_production_materials_item?:
      | ModelTypes['delete_one']
      | undefined;
    delete_producers_production_methods_items?:
      | ModelTypes['delete_many']
      | undefined;
    delete_producers_production_methods_item?:
      | ModelTypes['delete_one']
      | undefined;
    delete_production_methods_items?: ModelTypes['delete_many'] | undefined;
    delete_production_methods_item?: ModelTypes['delete_one'] | undefined;
    delete_production_materials_production_methods_items?:
      | ModelTypes['delete_many']
      | undefined;
    delete_production_materials_production_methods_item?:
      | ModelTypes['delete_one']
      | undefined;
    delete_fulfillers_items?: ModelTypes['delete_many'] | undefined;
    delete_fulfillers_item?: ModelTypes['delete_one'] | undefined;
    delete_price_currencies_items?: ModelTypes['delete_many'] | undefined;
    delete_price_currencies_item?: ModelTypes['delete_one'] | undefined;
    delete_stages_items?: ModelTypes['delete_many'] | undefined;
    delete_stages_item?: ModelTypes['delete_one'] | undefined;
    delete_currencies_items?: ModelTypes['delete_many'] | undefined;
    delete_currencies_item?: ModelTypes['delete_one'] | undefined;
    delete_products_content_items?: ModelTypes['delete_many'] | undefined;
    delete_products_content_item?: ModelTypes['delete_one'] | undefined;
    delete_products_contributors_items?: ModelTypes['delete_many'] | undefined;
    delete_products_contributors_item?: ModelTypes['delete_one'] | undefined;
    delete_products_design_files_items?: ModelTypes['delete_many'] | undefined;
    delete_products_design_files_item?: ModelTypes['delete_one'] | undefined;
    delete_products_files_items?: ModelTypes['delete_many'] | undefined;
    delete_products_files_item?: ModelTypes['delete_one'] | undefined;
    delete_products_production_materials_items?:
      | ModelTypes['delete_many']
      | undefined;
    delete_products_production_materials_item?:
      | ModelTypes['delete_one']
      | undefined;
    delete_products_production_methods_items?:
      | ModelTypes['delete_many']
      | undefined;
    delete_products_production_methods_item?:
      | ModelTypes['delete_one']
      | undefined;
    delete_products_wearables_items?: ModelTypes['delete_many'] | undefined;
    delete_products_wearables_item?: ModelTypes['delete_one'] | undefined;
    delete_file_formats_items?: ModelTypes['delete_many'] | undefined;
    delete_file_formats_item?: ModelTypes['delete_one'] | undefined;
    delete_products_items?: ModelTypes['delete_many'] | undefined;
    delete_products_item?: ModelTypes['delete_one'] | undefined;
    delete_production_materials_items?: ModelTypes['delete_many'] | undefined;
    delete_production_materials_item?: ModelTypes['delete_one'] | undefined;
    delete_invoices_items?: ModelTypes['delete_many'] | undefined;
    delete_invoices_item?: ModelTypes['delete_one'] | undefined;
    delete_production_materials_files_items?:
      | ModelTypes['delete_many']
      | undefined;
    delete_production_materials_files_item?:
      | ModelTypes['delete_one']
      | undefined;
  };
  ['create_brands_input']: {
    created_at?: ModelTypes['Date'] | undefined;
    description?: string | undefined;
    discord_url?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    logo?: ModelTypes['create_directus_files_input'] | undefined;
    name: string;
    notion_id?: string | undefined;
    twitter_url?: string | undefined;
    website_url?: string | undefined;
    products?:
      | Array<ModelTypes['create_products_input'] | undefined>
      | undefined;
    users?:
      | Array<ModelTypes['create_brands_directus_users_input'] | undefined>
      | undefined;
  };
  ['create_directus_files_input']: {
    id?: string | undefined;
    storage: string;
    filename_disk?: string | undefined;
    filename_download: string;
    title?: string | undefined;
    type?: string | undefined;
    folder?: ModelTypes['create_directus_folders_input'] | undefined;
    uploaded_by?: ModelTypes['create_directus_users_input'] | undefined;
    uploaded_on?: ModelTypes['Date'] | undefined;
    modified_by?: ModelTypes['create_directus_users_input'] | undefined;
    modified_on?: ModelTypes['Date'] | undefined;
    charset?: string | undefined;
    filesize?: ModelTypes['GraphQLBigInt'] | undefined;
    width?: number | undefined;
    height?: number | undefined;
    duration?: number | undefined;
    embed?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    tags?: ModelTypes['JSON'] | undefined;
    metadata?: ModelTypes['JSON'] | undefined;
  };
  ['create_directus_folders_input']: {
    id?: string | undefined;
    name: string;
    parent?: ModelTypes['create_directus_folders_input'] | undefined;
  };
  ['create_directus_users_input']: {
    id?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    email?: string | undefined;
    password?: ModelTypes['Hash'] | undefined;
    location?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    tags?: ModelTypes['JSON'] | undefined;
    avatar?: ModelTypes['create_directus_files_input'] | undefined;
    language?: string | undefined;
    theme?: string | undefined;
    tfa_secret?: ModelTypes['Hash'] | undefined;
    status?: string | undefined;
    role?: ModelTypes['create_directus_roles_input'] | undefined;
    token?: ModelTypes['Hash'] | undefined;
    last_access?: ModelTypes['Date'] | undefined;
    last_page?: string | undefined;
    provider?: string | undefined;
    external_identifier?: string | undefined;
    auth_data?: ModelTypes['JSON'] | undefined;
    email_notifications?: boolean | undefined;
    discord_handle?: string | undefined;
    discord_id?: string | undefined;
    timezone?: string | undefined;
    twitter_handle?: string | undefined;
    collaborators?:
      | Array<ModelTypes['create_collaborators_input'] | undefined>
      | undefined;
    skills?:
      | Array<
          ModelTypes['create_junction_directus_users_skills_input'] | undefined
        >
      | undefined;
  };
  ['create_directus_roles_input']: {
    id?: string | undefined;
    name: string;
    icon?: string | undefined;
    description?: string | undefined;
    ip_access?: Array<string | undefined> | undefined;
    enforce_tfa: boolean;
    admin_access: boolean;
    app_access?: boolean | undefined;
    users?:
      | Array<ModelTypes['create_directus_users_input'] | undefined>
      | undefined;
  };
  ['create_collaborators_input']: {
    account?: ModelTypes['create_directus_users_input'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    date_updated?: ModelTypes['Date'] | undefined;
    display_name?: string | undefined;
    id?: string | undefined;
    payment_eth_address?: string | undefined;
    role?: ModelTypes['create_collaborator_roles_input'] | undefined;
    user_created?: ModelTypes['create_directus_users_input'] | undefined;
  };
  ['create_collaborator_roles_input']: {
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
  };
  ['create_junction_directus_users_skills_input']: {
    directus_users_id?: ModelTypes['create_directus_users_input'] | undefined;
    id?: string | undefined;
    skills_id?: ModelTypes['create_skills_input'] | undefined;
  };
  ['create_skills_input']: {
    description?: string | undefined;
    id?: string | undefined;
    name: string;
  };
  ['create_products_input']: {
    brand_id?: ModelTypes['create_brands_input'] | undefined;
    clo3d_file?: ModelTypes['create_directus_files_input'] | undefined;
    created_at?: ModelTypes['Date'] | undefined;
    description?: string | undefined;
    discord_channel_id?: string | undefined;
    fulfiller_id?: ModelTypes['create_fulfillers_input'] | undefined;
    id?: string | undefined;
    name: string;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    price?: ModelTypes['create_price_currencies_input'] | undefined;
    producer_id?: ModelTypes['create_producers_input'] | undefined;
    product_stage?: ModelTypes['create_stages_input'] | undefined;
    production_cost?: number | undefined;
    quantity?: ModelTypes['GraphQLBigInt'] | undefined;
    release_date?: ModelTypes['Date'] | undefined;
    sale_currency?: ModelTypes['create_currencies_input'] | undefined;
    sale_price?: number | undefined;
    sale_type?: string | undefined;
    season?: number | undefined;
    shopify_id?: string | undefined;
    status?: string | undefined;
    notes?: string | undefined;
    date_updated?: ModelTypes['Date'] | undefined;
    html_file?: ModelTypes['create_directus_files_input'] | undefined;
    thumbnail?: ModelTypes['create_directus_files_input'] | undefined;
    vrm_file?: ModelTypes['create_directus_files_input'] | undefined;
    contributors?:
      | Array<ModelTypes['create_products_contributors_input'] | undefined>
      | undefined;
    materials?:
      | Array<
          ModelTypes['create_products_production_materials_input'] | undefined
        >
      | undefined;
    design_files?:
      | Array<ModelTypes['create_products_design_files_input'] | undefined>
      | undefined;
    content?:
      | Array<ModelTypes['create_products_content_input'] | undefined>
      | undefined;
    images?:
      | Array<ModelTypes['create_products_files_input'] | undefined>
      | undefined;
    wearable_files?:
      | Array<ModelTypes['create_products_wearables_input'] | undefined>
      | undefined;
    production_methods?:
      | Array<
          ModelTypes['create_products_production_methods_input'] | undefined
        >
      | undefined;
    client_invoices?:
      | Array<ModelTypes['create_invoices_input'] | undefined>
      | undefined;
    production_invoices?:
      | Array<ModelTypes['create_invoices_input'] | undefined>
      | undefined;
  };
  ['create_fulfillers_input']: {
    address?: string | undefined;
    created_at?: ModelTypes['Date'] | undefined;
    email?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    website_url?: string | undefined;
  };
  ['create_price_currencies_input']: {
    amount: number;
    currency?: string | undefined;
    id?: string | undefined;
  };
  ['create_producers_input']: {
    created_at?: ModelTypes['Date'] | undefined;
    email?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    shipping_address?: string | undefined;
    production_materials_stocked?:
      | Array<
          ModelTypes['create_producers_production_materials_input'] | undefined
        >
      | undefined;
    production_methods?:
      | Array<
          ModelTypes['create_producers_production_methods_input'] | undefined
        >
      | undefined;
    supplied_materials?:
      | Array<ModelTypes['create_production_materials_input'] | undefined>
      | undefined;
  };
  ['create_producers_production_materials_input']: {
    id?: string | undefined;
    producers_id?: ModelTypes['create_producers_input'] | undefined;
    production_materials_id?:
      | ModelTypes['create_production_materials_input']
      | undefined;
    quantity?: number | undefined;
  };
  ['create_production_materials_input']: {
    base_price?: number | undefined;
    color_palette?: ModelTypes['JSON'] | undefined;
    composition?: string | undefined;
    created_at?: ModelTypes['Date'] | undefined;
    created_by?: ModelTypes['create_directus_users_input'] | undefined;
    description?: string | undefined;
    gender?: string | undefined;
    id?: string | undefined;
    made_in?: string | undefined;
    name?: string | undefined;
    neck_tag?: boolean | undefined;
    note?: string | undefined;
    rating?: string | undefined;
    size_guide?: ModelTypes['create_directus_files_input'] | undefined;
    supplier?: ModelTypes['create_producers_input'] | undefined;
    tags?: ModelTypes['JSON'] | undefined;
    production_methods?:
      | Array<
          | ModelTypes['create_production_materials_production_methods_input']
          | undefined
        >
      | undefined;
    stocked_at?:
      | Array<
          ModelTypes['create_producers_production_materials_input'] | undefined
        >
      | undefined;
    base_assets?:
      | Array<ModelTypes['create_production_materials_files_input'] | undefined>
      | undefined;
  };
  ['create_production_materials_production_methods_input']: {
    id?: string | undefined;
    production_materials_id?:
      | ModelTypes['create_production_materials_input']
      | undefined;
    production_methods_id?:
      | ModelTypes['create_production_methods_input']
      | undefined;
  };
  ['create_production_methods_input']: {
    created_at?: ModelTypes['Date'] | undefined;
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    producers?:
      | Array<
          ModelTypes['create_producers_production_methods_input'] | undefined
        >
      | undefined;
    production_materials?:
      | Array<
          | ModelTypes['create_production_materials_production_methods_input']
          | undefined
        >
      | undefined;
  };
  ['create_producers_production_methods_input']: {
    id?: string | undefined;
    producers_id?: ModelTypes['create_producers_input'] | undefined;
    production_methods_id?:
      | ModelTypes['create_production_methods_input']
      | undefined;
  };
  ['create_production_materials_files_input']: {
    directus_files_id?: ModelTypes['create_directus_files_input'] | undefined;
    id?: string | undefined;
    production_materials_id?:
      | ModelTypes['create_production_materials_input']
      | undefined;
  };
  ['create_stages_input']: {
    description?: string | undefined;
    name: string;
    sort?: number | undefined;
  };
  ['create_currencies_input']: {
    currency: string;
    id?: string | undefined;
  };
  ['create_products_contributors_input']: {
    collaborators_id?: ModelTypes['create_collaborators_input'] | undefined;
    contribution_share?: number | undefined;
    id?: string | undefined;
    products_id?: ModelTypes['create_products_input'] | undefined;
    robot_earned?: number | undefined;
  };
  ['create_products_production_materials_input']: {
    id?: string | undefined;
    production_materials_id?:
      | ModelTypes['create_production_materials_input']
      | undefined;
    products_id?: ModelTypes['create_products_input'] | undefined;
  };
  ['create_products_design_files_input']: {
    directus_files_id?: ModelTypes['create_directus_files_input'] | undefined;
    id?: string | undefined;
    products_id?: ModelTypes['create_products_input'] | undefined;
  };
  ['create_products_content_input']: {
    directus_files_id?: ModelTypes['create_directus_files_input'] | undefined;
    id?: string | undefined;
    products_id?: ModelTypes['create_products_input'] | undefined;
  };
  ['create_products_files_input']: {
    directus_files_id?: ModelTypes['create_directus_files_input'] | undefined;
    id?: string | undefined;
    products_id?: ModelTypes['create_products_input'] | undefined;
  };
  ['create_products_wearables_input']: {
    directus_files_id?: ModelTypes['create_directus_files_input'] | undefined;
    file_format?: ModelTypes['create_file_formats_input'] | undefined;
    id?: string | undefined;
    primary?: boolean | undefined;
    products_id?: ModelTypes['create_products_input'] | undefined;
  };
  ['create_file_formats_input']: {
    description?: string | undefined;
    extension?: string | undefined;
    id?: string | undefined;
    mime_type?: string | undefined;
    name: string;
  };
  ['create_products_production_methods_input']: {
    id?: string | undefined;
    production_methods_id?:
      | ModelTypes['create_production_methods_input']
      | undefined;
    products_id?: ModelTypes['create_products_input'] | undefined;
  };
  ['create_invoices_input']: {
    id?: string | undefined;
    user_created?: ModelTypes['create_directus_users_input'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    user_updated?: ModelTypes['create_directus_users_input'] | undefined;
    date_updated?: ModelTypes['Date'] | undefined;
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: string | undefined;
    description: string;
    status?: string | undefined;
    /** Invoice amount in USD */
    amount?: number | undefined;
    transaction_url?: string | undefined;
    production_product_id?: ModelTypes['create_products_input'] | undefined;
    client_product_id?: ModelTypes['create_products_input'] | undefined;
  };
  ['create_brands_directus_users_input']: {
    brands_id?: ModelTypes['create_brands_input'] | undefined;
    directus_users_id?: ModelTypes['create_directus_users_input'] | undefined;
    id?: string | undefined;
  };
  ['update_brands_input']: {
    created_at?: ModelTypes['Date'] | undefined;
    description?: string | undefined;
    discord_url?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    logo?: ModelTypes['update_directus_files_input'] | undefined;
    name?: string | undefined;
    notion_id?: string | undefined;
    twitter_url?: string | undefined;
    website_url?: string | undefined;
    products?:
      | Array<ModelTypes['update_products_input'] | undefined>
      | undefined;
    users?:
      | Array<ModelTypes['update_brands_directus_users_input'] | undefined>
      | undefined;
  };
  ['update_directus_files_input']: {
    id?: string | undefined;
    storage?: string | undefined;
    filename_disk?: string | undefined;
    filename_download?: string | undefined;
    title?: string | undefined;
    type?: string | undefined;
    folder?: ModelTypes['update_directus_folders_input'] | undefined;
    uploaded_by?: ModelTypes['update_directus_users_input'] | undefined;
    uploaded_on?: ModelTypes['Date'] | undefined;
    modified_by?: ModelTypes['update_directus_users_input'] | undefined;
    modified_on?: ModelTypes['Date'] | undefined;
    charset?: string | undefined;
    filesize?: ModelTypes['GraphQLBigInt'] | undefined;
    width?: number | undefined;
    height?: number | undefined;
    duration?: number | undefined;
    embed?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    tags?: ModelTypes['JSON'] | undefined;
    metadata?: ModelTypes['JSON'] | undefined;
  };
  ['update_directus_folders_input']: {
    id?: string | undefined;
    name?: string | undefined;
    parent?: ModelTypes['update_directus_folders_input'] | undefined;
  };
  ['update_directus_users_input']: {
    id?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    email?: string | undefined;
    password?: ModelTypes['Hash'] | undefined;
    location?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    tags?: ModelTypes['JSON'] | undefined;
    avatar?: ModelTypes['update_directus_files_input'] | undefined;
    language?: string | undefined;
    theme?: string | undefined;
    tfa_secret?: ModelTypes['Hash'] | undefined;
    status?: string | undefined;
    role?: ModelTypes['update_directus_roles_input'] | undefined;
    token?: ModelTypes['Hash'] | undefined;
    last_access?: ModelTypes['Date'] | undefined;
    last_page?: string | undefined;
    provider?: string | undefined;
    external_identifier?: string | undefined;
    auth_data?: ModelTypes['JSON'] | undefined;
    email_notifications?: boolean | undefined;
    discord_handle?: string | undefined;
    discord_id?: string | undefined;
    timezone?: string | undefined;
    twitter_handle?: string | undefined;
    collaborators?:
      | Array<ModelTypes['update_collaborators_input'] | undefined>
      | undefined;
    skills?:
      | Array<
          ModelTypes['update_junction_directus_users_skills_input'] | undefined
        >
      | undefined;
  };
  ['update_directus_roles_input']: {
    id?: string | undefined;
    name?: string | undefined;
    icon?: string | undefined;
    description?: string | undefined;
    ip_access?: Array<string | undefined> | undefined;
    enforce_tfa?: boolean | undefined;
    admin_access?: boolean | undefined;
    app_access?: boolean | undefined;
    users?:
      | Array<ModelTypes['update_directus_users_input'] | undefined>
      | undefined;
  };
  ['update_collaborators_input']: {
    account?: ModelTypes['update_directus_users_input'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    date_updated?: ModelTypes['Date'] | undefined;
    display_name?: string | undefined;
    id?: string | undefined;
    payment_eth_address?: string | undefined;
    role?: ModelTypes['update_collaborator_roles_input'] | undefined;
    user_created?: ModelTypes['update_directus_users_input'] | undefined;
  };
  ['update_collaborator_roles_input']: {
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
  };
  ['update_junction_directus_users_skills_input']: {
    directus_users_id?: ModelTypes['update_directus_users_input'] | undefined;
    id?: string | undefined;
    skills_id?: ModelTypes['update_skills_input'] | undefined;
  };
  ['update_skills_input']: {
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
  };
  ['update_products_input']: {
    brand_id?: ModelTypes['update_brands_input'] | undefined;
    clo3d_file?: ModelTypes['update_directus_files_input'] | undefined;
    created_at?: ModelTypes['Date'] | undefined;
    description?: string | undefined;
    discord_channel_id?: string | undefined;
    fulfiller_id?: ModelTypes['update_fulfillers_input'] | undefined;
    id?: string | undefined;
    name?: string | undefined;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    price?: ModelTypes['update_price_currencies_input'] | undefined;
    producer_id?: ModelTypes['update_producers_input'] | undefined;
    product_stage?: ModelTypes['update_stages_input'] | undefined;
    production_cost?: number | undefined;
    quantity?: ModelTypes['GraphQLBigInt'] | undefined;
    release_date?: ModelTypes['Date'] | undefined;
    sale_currency?: ModelTypes['update_currencies_input'] | undefined;
    sale_price?: number | undefined;
    sale_type?: string | undefined;
    season?: number | undefined;
    shopify_id?: string | undefined;
    status?: string | undefined;
    notes?: string | undefined;
    date_updated?: ModelTypes['Date'] | undefined;
    html_file?: ModelTypes['update_directus_files_input'] | undefined;
    thumbnail?: ModelTypes['update_directus_files_input'] | undefined;
    vrm_file?: ModelTypes['update_directus_files_input'] | undefined;
    contributors?:
      | Array<ModelTypes['update_products_contributors_input'] | undefined>
      | undefined;
    materials?:
      | Array<
          ModelTypes['update_products_production_materials_input'] | undefined
        >
      | undefined;
    design_files?:
      | Array<ModelTypes['update_products_design_files_input'] | undefined>
      | undefined;
    content?:
      | Array<ModelTypes['update_products_content_input'] | undefined>
      | undefined;
    images?:
      | Array<ModelTypes['update_products_files_input'] | undefined>
      | undefined;
    wearable_files?:
      | Array<ModelTypes['update_products_wearables_input'] | undefined>
      | undefined;
    production_methods?:
      | Array<
          ModelTypes['update_products_production_methods_input'] | undefined
        >
      | undefined;
    client_invoices?:
      | Array<ModelTypes['update_invoices_input'] | undefined>
      | undefined;
    production_invoices?:
      | Array<ModelTypes['update_invoices_input'] | undefined>
      | undefined;
  };
  ['update_fulfillers_input']: {
    address?: string | undefined;
    created_at?: ModelTypes['Date'] | undefined;
    email?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    website_url?: string | undefined;
  };
  ['update_price_currencies_input']: {
    amount?: number | undefined;
    currency?: string | undefined;
    id?: string | undefined;
  };
  ['update_producers_input']: {
    created_at?: ModelTypes['Date'] | undefined;
    email?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    shipping_address?: string | undefined;
    production_materials_stocked?:
      | Array<
          ModelTypes['update_producers_production_materials_input'] | undefined
        >
      | undefined;
    production_methods?:
      | Array<
          ModelTypes['update_producers_production_methods_input'] | undefined
        >
      | undefined;
    supplied_materials?:
      | Array<ModelTypes['update_production_materials_input'] | undefined>
      | undefined;
  };
  ['update_producers_production_materials_input']: {
    id?: string | undefined;
    producers_id?: ModelTypes['update_producers_input'] | undefined;
    production_materials_id?:
      | ModelTypes['update_production_materials_input']
      | undefined;
    quantity?: number | undefined;
  };
  ['update_production_materials_input']: {
    base_price?: number | undefined;
    color_palette?: ModelTypes['JSON'] | undefined;
    composition?: string | undefined;
    created_at?: ModelTypes['Date'] | undefined;
    created_by?: ModelTypes['update_directus_users_input'] | undefined;
    description?: string | undefined;
    gender?: string | undefined;
    id?: string | undefined;
    made_in?: string | undefined;
    name?: string | undefined;
    neck_tag?: boolean | undefined;
    note?: string | undefined;
    rating?: string | undefined;
    size_guide?: ModelTypes['update_directus_files_input'] | undefined;
    supplier?: ModelTypes['update_producers_input'] | undefined;
    tags?: ModelTypes['JSON'] | undefined;
    production_methods?:
      | Array<
          | ModelTypes['update_production_materials_production_methods_input']
          | undefined
        >
      | undefined;
    stocked_at?:
      | Array<
          ModelTypes['update_producers_production_materials_input'] | undefined
        >
      | undefined;
    base_assets?:
      | Array<ModelTypes['update_production_materials_files_input'] | undefined>
      | undefined;
  };
  ['update_production_materials_production_methods_input']: {
    id?: string | undefined;
    production_materials_id?:
      | ModelTypes['update_production_materials_input']
      | undefined;
    production_methods_id?:
      | ModelTypes['update_production_methods_input']
      | undefined;
  };
  ['update_production_methods_input']: {
    created_at?: ModelTypes['Date'] | undefined;
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    producers?:
      | Array<
          ModelTypes['update_producers_production_methods_input'] | undefined
        >
      | undefined;
    production_materials?:
      | Array<
          | ModelTypes['update_production_materials_production_methods_input']
          | undefined
        >
      | undefined;
  };
  ['update_producers_production_methods_input']: {
    id?: string | undefined;
    producers_id?: ModelTypes['update_producers_input'] | undefined;
    production_methods_id?:
      | ModelTypes['update_production_methods_input']
      | undefined;
  };
  ['update_production_materials_files_input']: {
    directus_files_id?: ModelTypes['update_directus_files_input'] | undefined;
    id?: string | undefined;
    production_materials_id?:
      | ModelTypes['update_production_materials_input']
      | undefined;
  };
  ['update_stages_input']: {
    description?: string | undefined;
    name?: string | undefined;
    sort?: number | undefined;
  };
  ['update_currencies_input']: {
    currency?: string | undefined;
    id?: string | undefined;
  };
  ['update_products_contributors_input']: {
    collaborators_id?: ModelTypes['update_collaborators_input'] | undefined;
    contribution_share?: number | undefined;
    id?: string | undefined;
    products_id?: ModelTypes['update_products_input'] | undefined;
    robot_earned?: number | undefined;
  };
  ['update_products_production_materials_input']: {
    id?: string | undefined;
    production_materials_id?:
      | ModelTypes['update_production_materials_input']
      | undefined;
    products_id?: ModelTypes['update_products_input'] | undefined;
  };
  ['update_products_design_files_input']: {
    directus_files_id?: ModelTypes['update_directus_files_input'] | undefined;
    id?: string | undefined;
    products_id?: ModelTypes['update_products_input'] | undefined;
  };
  ['update_products_content_input']: {
    directus_files_id?: ModelTypes['update_directus_files_input'] | undefined;
    id?: string | undefined;
    products_id?: ModelTypes['update_products_input'] | undefined;
  };
  ['update_products_files_input']: {
    directus_files_id?: ModelTypes['update_directus_files_input'] | undefined;
    id?: string | undefined;
    products_id?: ModelTypes['update_products_input'] | undefined;
  };
  ['update_products_wearables_input']: {
    directus_files_id?: ModelTypes['update_directus_files_input'] | undefined;
    file_format?: ModelTypes['update_file_formats_input'] | undefined;
    id?: string | undefined;
    primary?: boolean | undefined;
    products_id?: ModelTypes['update_products_input'] | undefined;
  };
  ['update_file_formats_input']: {
    description?: string | undefined;
    extension?: string | undefined;
    id?: string | undefined;
    mime_type?: string | undefined;
    name?: string | undefined;
  };
  ['update_products_production_methods_input']: {
    id?: string | undefined;
    production_methods_id?:
      | ModelTypes['update_production_methods_input']
      | undefined;
    products_id?: ModelTypes['update_products_input'] | undefined;
  };
  ['update_invoices_input']: {
    id?: string | undefined;
    user_created?: ModelTypes['update_directus_users_input'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    user_updated?: ModelTypes['update_directus_users_input'] | undefined;
    date_updated?: ModelTypes['Date'] | undefined;
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: string | undefined;
    description?: string | undefined;
    status?: string | undefined;
    /** Invoice amount in USD */
    amount?: number | undefined;
    transaction_url?: string | undefined;
    production_product_id?: ModelTypes['update_products_input'] | undefined;
    client_product_id?: ModelTypes['update_products_input'] | undefined;
  };
  ['update_brands_directus_users_input']: {
    brands_id?: ModelTypes['update_brands_input'] | undefined;
    directus_users_id?: ModelTypes['update_directus_users_input'] | undefined;
    id?: string | undefined;
  };
  ['delete_many']: {
    ids: Array<string | undefined>;
  };
  ['delete_one']: {
    id: string;
  };
};

export type GraphQLTypes = {
  ['Query']: {
    __typename: 'Query';
    brands: Array<GraphQLTypes['brands']>;
    brands_by_id?: GraphQLTypes['brands'] | undefined;
    brands_aggregated: Array<GraphQLTypes['brands_aggregated']>;
    brands_directus_users: Array<GraphQLTypes['brands_directus_users']>;
    brands_directus_users_by_id?:
      | GraphQLTypes['brands_directus_users']
      | undefined;
    brands_directus_users_aggregated: Array<
      GraphQLTypes['brands_directus_users_aggregated']
    >;
    collaborators: Array<GraphQLTypes['collaborators']>;
    collaborators_by_id?: GraphQLTypes['collaborators'] | undefined;
    collaborators_aggregated: Array<GraphQLTypes['collaborators_aggregated']>;
    collaborator_roles: Array<GraphQLTypes['collaborator_roles']>;
    collaborator_roles_by_id?: GraphQLTypes['collaborator_roles'] | undefined;
    collaborator_roles_aggregated: Array<
      GraphQLTypes['collaborator_roles_aggregated']
    >;
    junction_directus_users_skills: Array<
      GraphQLTypes['junction_directus_users_skills']
    >;
    junction_directus_users_skills_by_id?:
      | GraphQLTypes['junction_directus_users_skills']
      | undefined;
    junction_directus_users_skills_aggregated: Array<
      GraphQLTypes['junction_directus_users_skills_aggregated']
    >;
    skills: Array<GraphQLTypes['skills']>;
    skills_by_id?: GraphQLTypes['skills'] | undefined;
    skills_aggregated: Array<GraphQLTypes['skills_aggregated']>;
    producers: Array<GraphQLTypes['producers']>;
    producers_by_id?: GraphQLTypes['producers'] | undefined;
    producers_aggregated: Array<GraphQLTypes['producers_aggregated']>;
    producers_production_materials: Array<
      GraphQLTypes['producers_production_materials']
    >;
    producers_production_materials_by_id?:
      | GraphQLTypes['producers_production_materials']
      | undefined;
    producers_production_materials_aggregated: Array<
      GraphQLTypes['producers_production_materials_aggregated']
    >;
    producers_production_methods: Array<
      GraphQLTypes['producers_production_methods']
    >;
    producers_production_methods_by_id?:
      | GraphQLTypes['producers_production_methods']
      | undefined;
    producers_production_methods_aggregated: Array<
      GraphQLTypes['producers_production_methods_aggregated']
    >;
    production_methods: Array<GraphQLTypes['production_methods']>;
    production_methods_by_id?: GraphQLTypes['production_methods'] | undefined;
    production_methods_aggregated: Array<
      GraphQLTypes['production_methods_aggregated']
    >;
    production_materials_production_methods: Array<
      GraphQLTypes['production_materials_production_methods']
    >;
    production_materials_production_methods_by_id?:
      | GraphQLTypes['production_materials_production_methods']
      | undefined;
    production_materials_production_methods_aggregated: Array<
      GraphQLTypes['production_materials_production_methods_aggregated']
    >;
    fulfillers: Array<GraphQLTypes['fulfillers']>;
    fulfillers_by_id?: GraphQLTypes['fulfillers'] | undefined;
    fulfillers_aggregated: Array<GraphQLTypes['fulfillers_aggregated']>;
    price_currencies: Array<GraphQLTypes['price_currencies']>;
    price_currencies_by_id?: GraphQLTypes['price_currencies'] | undefined;
    price_currencies_aggregated: Array<
      GraphQLTypes['price_currencies_aggregated']
    >;
    stages: Array<GraphQLTypes['stages']>;
    stages_by_id?: GraphQLTypes['stages'] | undefined;
    stages_aggregated: Array<GraphQLTypes['stages_aggregated']>;
    currencies: Array<GraphQLTypes['currencies']>;
    currencies_by_id?: GraphQLTypes['currencies'] | undefined;
    currencies_aggregated: Array<GraphQLTypes['currencies_aggregated']>;
    products_content: Array<GraphQLTypes['products_content']>;
    products_content_by_id?: GraphQLTypes['products_content'] | undefined;
    products_content_aggregated: Array<
      GraphQLTypes['products_content_aggregated']
    >;
    products_contributors: Array<GraphQLTypes['products_contributors']>;
    products_contributors_by_id?:
      | GraphQLTypes['products_contributors']
      | undefined;
    products_contributors_aggregated: Array<
      GraphQLTypes['products_contributors_aggregated']
    >;
    products_design_files: Array<GraphQLTypes['products_design_files']>;
    products_design_files_by_id?:
      | GraphQLTypes['products_design_files']
      | undefined;
    products_design_files_aggregated: Array<
      GraphQLTypes['products_design_files_aggregated']
    >;
    products_files: Array<GraphQLTypes['products_files']>;
    products_files_by_id?: GraphQLTypes['products_files'] | undefined;
    products_files_aggregated: Array<GraphQLTypes['products_files_aggregated']>;
    products_production_materials: Array<
      GraphQLTypes['products_production_materials']
    >;
    products_production_materials_by_id?:
      | GraphQLTypes['products_production_materials']
      | undefined;
    products_production_materials_aggregated: Array<
      GraphQLTypes['products_production_materials_aggregated']
    >;
    products_production_methods: Array<
      GraphQLTypes['products_production_methods']
    >;
    products_production_methods_by_id?:
      | GraphQLTypes['products_production_methods']
      | undefined;
    products_production_methods_aggregated: Array<
      GraphQLTypes['products_production_methods_aggregated']
    >;
    products_wearables: Array<GraphQLTypes['products_wearables']>;
    products_wearables_by_id?: GraphQLTypes['products_wearables'] | undefined;
    products_wearables_aggregated: Array<
      GraphQLTypes['products_wearables_aggregated']
    >;
    file_formats: Array<GraphQLTypes['file_formats']>;
    file_formats_by_id?: GraphQLTypes['file_formats'] | undefined;
    file_formats_aggregated: Array<GraphQLTypes['file_formats_aggregated']>;
    products: Array<GraphQLTypes['products']>;
    products_by_id?: GraphQLTypes['products'] | undefined;
    products_aggregated: Array<GraphQLTypes['products_aggregated']>;
    production_materials: Array<GraphQLTypes['production_materials']>;
    production_materials_by_id?:
      | GraphQLTypes['production_materials']
      | undefined;
    production_materials_aggregated: Array<
      GraphQLTypes['production_materials_aggregated']
    >;
    invoices: Array<GraphQLTypes['invoices']>;
    invoices_by_id?: GraphQLTypes['invoices'] | undefined;
    invoices_aggregated: Array<GraphQLTypes['invoices_aggregated']>;
    production_materials_files: Array<
      GraphQLTypes['production_materials_files']
    >;
    production_materials_files_by_id?:
      | GraphQLTypes['production_materials_files']
      | undefined;
    production_materials_files_aggregated: Array<
      GraphQLTypes['production_materials_files_aggregated']
    >;
  };
  ['brands']: {
    __typename: 'brands';
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    description?: string | undefined;
    discord_url?: string | undefined;
    eth_address?: string | undefined;
    id: string;
    logo?: GraphQLTypes['directus_files'] | undefined;
    name: string;
    notion_id?: string | undefined;
    twitter_url?: string | undefined;
    website_url?: string | undefined;
    products?: Array<GraphQLTypes['products'] | undefined> | undefined;
    products_func?: GraphQLTypes['count_functions'] | undefined;
    users?:
      | Array<GraphQLTypes['brands_directus_users'] | undefined>
      | undefined;
    users_func?: GraphQLTypes['count_functions'] | undefined;
  };
  /** ISO8601 Date values */
  ['Date']: 'scalar' & { name: 'Date' };
  ['datetime_functions']: {
    __typename: 'datetime_functions';
    year?: number | undefined;
    month?: number | undefined;
    week?: number | undefined;
    day?: number | undefined;
    weekday?: number | undefined;
    hour?: number | undefined;
    minute?: number | undefined;
    second?: number | undefined;
  };
  ['directus_files']: {
    __typename: 'directus_files';
    id: string;
    storage: string;
    filename_disk?: string | undefined;
    filename_download: string;
    title?: string | undefined;
    type?: string | undefined;
    folder?: GraphQLTypes['directus_folders'] | undefined;
    uploaded_by?: GraphQLTypes['directus_users'] | undefined;
    uploaded_on?: GraphQLTypes['Date'] | undefined;
    uploaded_on_func?: GraphQLTypes['datetime_functions'] | undefined;
    modified_by?: GraphQLTypes['directus_users'] | undefined;
    modified_on?: GraphQLTypes['Date'] | undefined;
    modified_on_func?: GraphQLTypes['datetime_functions'] | undefined;
    charset?: string | undefined;
    filesize?: GraphQLTypes['GraphQLBigInt'] | undefined;
    width?: number | undefined;
    height?: number | undefined;
    duration?: number | undefined;
    embed?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    tags_func?: GraphQLTypes['count_functions'] | undefined;
    metadata?: GraphQLTypes['JSON'] | undefined;
    metadata_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['directus_folders']: {
    __typename: 'directus_folders';
    id: string;
    name: string;
    parent?: GraphQLTypes['directus_folders'] | undefined;
  };
  ['directus_folders_filter']: {
    id?: GraphQLTypes['string_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    parent?: GraphQLTypes['directus_folders_filter'] | undefined;
    _and?:
      | Array<GraphQLTypes['directus_folders_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['directus_folders_filter'] | undefined>
      | undefined;
  };
  ['string_filter_operators']: {
    _eq?: string | undefined;
    _neq?: string | undefined;
    _contains?: string | undefined;
    _icontains?: string | undefined;
    _ncontains?: string | undefined;
    _starts_with?: string | undefined;
    _nstarts_with?: string | undefined;
    _ends_with?: string | undefined;
    _nends_with?: string | undefined;
    _in?: Array<string | undefined> | undefined;
    _nin?: Array<string | undefined> | undefined;
    _null?: boolean | undefined;
    _nnull?: boolean | undefined;
    _empty?: boolean | undefined;
    _nempty?: boolean | undefined;
  };
  ['directus_users']: {
    __typename: 'directus_users';
    id: string;
    first_name?: string | undefined;
    last_name?: string | undefined;
    email?: string | undefined;
    password?: GraphQLTypes['Hash'] | undefined;
    location?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    tags_func?: GraphQLTypes['count_functions'] | undefined;
    avatar?: GraphQLTypes['directus_files'] | undefined;
    language?: string | undefined;
    theme?: string | undefined;
    tfa_secret?: GraphQLTypes['Hash'] | undefined;
    status?: string | undefined;
    role?: GraphQLTypes['directus_roles'] | undefined;
    token?: GraphQLTypes['Hash'] | undefined;
    last_access?: GraphQLTypes['Date'] | undefined;
    last_access_func?: GraphQLTypes['datetime_functions'] | undefined;
    last_page?: string | undefined;
    provider?: string | undefined;
    external_identifier?: string | undefined;
    auth_data?: GraphQLTypes['JSON'] | undefined;
    auth_data_func?: GraphQLTypes['count_functions'] | undefined;
    email_notifications?: boolean | undefined;
    discord_handle?: string | undefined;
    discord_id?: string | undefined;
    timezone?: string | undefined;
    twitter_handle?: string | undefined;
    collaborators?:
      | Array<GraphQLTypes['collaborators'] | undefined>
      | undefined;
    collaborators_func?: GraphQLTypes['count_functions'] | undefined;
    skills?:
      | Array<GraphQLTypes['junction_directus_users_skills'] | undefined>
      | undefined;
    skills_func?: GraphQLTypes['count_functions'] | undefined;
  };
  /** Hashed string values */
  ['Hash']: 'scalar' & { name: 'Hash' };
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  ['JSON']: 'scalar' & { name: 'JSON' };
  ['count_functions']: {
    __typename: 'count_functions';
    count?: number | undefined;
  };
  ['directus_files_filter']: {
    id?: GraphQLTypes['string_filter_operators'] | undefined;
    storage?: GraphQLTypes['string_filter_operators'] | undefined;
    filename_disk?: GraphQLTypes['string_filter_operators'] | undefined;
    filename_download?: GraphQLTypes['string_filter_operators'] | undefined;
    title?: GraphQLTypes['string_filter_operators'] | undefined;
    type?: GraphQLTypes['string_filter_operators'] | undefined;
    folder?: GraphQLTypes['directus_folders_filter'] | undefined;
    uploaded_by?: GraphQLTypes['directus_users_filter'] | undefined;
    uploaded_on?: GraphQLTypes['date_filter_operators'] | undefined;
    uploaded_on_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    modified_by?: GraphQLTypes['directus_users_filter'] | undefined;
    modified_on?: GraphQLTypes['date_filter_operators'] | undefined;
    modified_on_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    charset?: GraphQLTypes['string_filter_operators'] | undefined;
    filesize?: GraphQLTypes['number_filter_operators'] | undefined;
    width?: GraphQLTypes['number_filter_operators'] | undefined;
    height?: GraphQLTypes['number_filter_operators'] | undefined;
    duration?: GraphQLTypes['number_filter_operators'] | undefined;
    embed?: GraphQLTypes['string_filter_operators'] | undefined;
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    location?: GraphQLTypes['string_filter_operators'] | undefined;
    tags?: GraphQLTypes['string_filter_operators'] | undefined;
    tags_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    metadata?: GraphQLTypes['string_filter_operators'] | undefined;
    metadata_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    _and?: Array<GraphQLTypes['directus_files_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['directus_files_filter'] | undefined> | undefined;
  };
  ['directus_users_filter']: {
    id?: GraphQLTypes['string_filter_operators'] | undefined;
    first_name?: GraphQLTypes['string_filter_operators'] | undefined;
    last_name?: GraphQLTypes['string_filter_operators'] | undefined;
    email?: GraphQLTypes['string_filter_operators'] | undefined;
    password?: GraphQLTypes['hash_filter_operators'] | undefined;
    location?: GraphQLTypes['string_filter_operators'] | undefined;
    title?: GraphQLTypes['string_filter_operators'] | undefined;
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    tags?: GraphQLTypes['string_filter_operators'] | undefined;
    tags_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    avatar?: GraphQLTypes['directus_files_filter'] | undefined;
    language?: GraphQLTypes['string_filter_operators'] | undefined;
    theme?: GraphQLTypes['string_filter_operators'] | undefined;
    tfa_secret?: GraphQLTypes['hash_filter_operators'] | undefined;
    status?: GraphQLTypes['string_filter_operators'] | undefined;
    role?: GraphQLTypes['directus_roles_filter'] | undefined;
    token?: GraphQLTypes['hash_filter_operators'] | undefined;
    last_access?: GraphQLTypes['date_filter_operators'] | undefined;
    last_access_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    last_page?: GraphQLTypes['string_filter_operators'] | undefined;
    provider?: GraphQLTypes['string_filter_operators'] | undefined;
    external_identifier?: GraphQLTypes['string_filter_operators'] | undefined;
    auth_data?: GraphQLTypes['string_filter_operators'] | undefined;
    auth_data_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    email_notifications?: GraphQLTypes['boolean_filter_operators'] | undefined;
    discord_handle?: GraphQLTypes['string_filter_operators'] | undefined;
    discord_id?: GraphQLTypes['string_filter_operators'] | undefined;
    timezone?: GraphQLTypes['string_filter_operators'] | undefined;
    twitter_handle?: GraphQLTypes['string_filter_operators'] | undefined;
    collaborators?: GraphQLTypes['collaborators_filter'] | undefined;
    collaborators_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    skills?: GraphQLTypes['junction_directus_users_skills_filter'] | undefined;
    skills_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    _and?: Array<GraphQLTypes['directus_users_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['directus_users_filter'] | undefined> | undefined;
  };
  ['hash_filter_operators']: {
    _null?: boolean | undefined;
    _nnull?: boolean | undefined;
    _empty?: boolean | undefined;
    _nempty?: boolean | undefined;
  };
  ['count_function_filter_operators']: {
    count?: GraphQLTypes['number_filter_operators'] | undefined;
  };
  ['number_filter_operators']: {
    _eq?: GraphQLTypes['GraphQLStringOrFloat'] | undefined;
    _neq?: GraphQLTypes['GraphQLStringOrFloat'] | undefined;
    _in?: Array<GraphQLTypes['GraphQLStringOrFloat'] | undefined> | undefined;
    _nin?: Array<GraphQLTypes['GraphQLStringOrFloat'] | undefined> | undefined;
    _gt?: GraphQLTypes['GraphQLStringOrFloat'] | undefined;
    _gte?: GraphQLTypes['GraphQLStringOrFloat'] | undefined;
    _lt?: GraphQLTypes['GraphQLStringOrFloat'] | undefined;
    _lte?: GraphQLTypes['GraphQLStringOrFloat'] | undefined;
    _null?: boolean | undefined;
    _nnull?: boolean | undefined;
    _between?:
      | Array<GraphQLTypes['GraphQLStringOrFloat'] | undefined>
      | undefined;
    _nbetween?:
      | Array<GraphQLTypes['GraphQLStringOrFloat'] | undefined>
      | undefined;
  };
  /** A Float or a String */
  ['GraphQLStringOrFloat']: 'scalar' & { name: 'GraphQLStringOrFloat' };
  ['directus_roles_filter']: {
    id?: GraphQLTypes['string_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    icon?: GraphQLTypes['string_filter_operators'] | undefined;
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    ip_access?: GraphQLTypes['string_filter_operators'] | undefined;
    enforce_tfa?: GraphQLTypes['boolean_filter_operators'] | undefined;
    admin_access?: GraphQLTypes['boolean_filter_operators'] | undefined;
    app_access?: GraphQLTypes['boolean_filter_operators'] | undefined;
    users?: GraphQLTypes['directus_users_filter'] | undefined;
    users_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    _and?: Array<GraphQLTypes['directus_roles_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['directus_roles_filter'] | undefined> | undefined;
  };
  ['boolean_filter_operators']: {
    _eq?: boolean | undefined;
    _neq?: boolean | undefined;
    _null?: boolean | undefined;
    _nnull?: boolean | undefined;
  };
  ['date_filter_operators']: {
    _eq?: string | undefined;
    _neq?: string | undefined;
    _gt?: string | undefined;
    _gte?: string | undefined;
    _lt?: string | undefined;
    _lte?: string | undefined;
    _null?: boolean | undefined;
    _nnull?: boolean | undefined;
    _in?: Array<string | undefined> | undefined;
    _nin?: Array<string | undefined> | undefined;
    _between?:
      | Array<GraphQLTypes['GraphQLStringOrFloat'] | undefined>
      | undefined;
    _nbetween?:
      | Array<GraphQLTypes['GraphQLStringOrFloat'] | undefined>
      | undefined;
  };
  ['datetime_function_filter_operators']: {
    year?: GraphQLTypes['number_filter_operators'] | undefined;
    month?: GraphQLTypes['number_filter_operators'] | undefined;
    week?: GraphQLTypes['number_filter_operators'] | undefined;
    day?: GraphQLTypes['number_filter_operators'] | undefined;
    weekday?: GraphQLTypes['number_filter_operators'] | undefined;
    hour?: GraphQLTypes['number_filter_operators'] | undefined;
    minute?: GraphQLTypes['number_filter_operators'] | undefined;
    second?: GraphQLTypes['number_filter_operators'] | undefined;
  };
  ['collaborators_filter']: {
    account?: GraphQLTypes['directus_users_filter'] | undefined;
    date_created?: GraphQLTypes['date_filter_operators'] | undefined;
    date_created_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    date_updated?: GraphQLTypes['date_filter_operators'] | undefined;
    date_updated_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    display_name?: GraphQLTypes['string_filter_operators'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    payment_eth_address?: GraphQLTypes['string_filter_operators'] | undefined;
    role?: GraphQLTypes['collaborator_roles_filter'] | undefined;
    user_created?: GraphQLTypes['directus_users_filter'] | undefined;
    _and?: Array<GraphQLTypes['collaborators_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['collaborators_filter'] | undefined> | undefined;
  };
  ['collaborator_roles_filter']: {
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    _and?:
      | Array<GraphQLTypes['collaborator_roles_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['collaborator_roles_filter'] | undefined>
      | undefined;
  };
  ['junction_directus_users_skills_filter']: {
    directus_users_id?: GraphQLTypes['directus_users_filter'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    skills_id?: GraphQLTypes['skills_filter'] | undefined;
    _and?:
      | Array<GraphQLTypes['junction_directus_users_skills_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['junction_directus_users_skills_filter'] | undefined>
      | undefined;
  };
  ['skills_filter']: {
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    _and?: Array<GraphQLTypes['skills_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['skills_filter'] | undefined> | undefined;
  };
  ['directus_roles']: {
    __typename: 'directus_roles';
    id: string;
    name: string;
    icon?: string | undefined;
    description?: string | undefined;
    ip_access?: Array<string | undefined> | undefined;
    enforce_tfa: boolean;
    admin_access: boolean;
    app_access?: boolean | undefined;
    users?: Array<GraphQLTypes['directus_users'] | undefined> | undefined;
    users_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['collaborators']: {
    __typename: 'collaborators';
    account?: GraphQLTypes['directus_users'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functions'] | undefined;
    date_updated?: GraphQLTypes['Date'] | undefined;
    date_updated_func?: GraphQLTypes['datetime_functions'] | undefined;
    display_name?: string | undefined;
    id: string;
    payment_eth_address?: string | undefined;
    role?: GraphQLTypes['collaborator_roles'] | undefined;
    user_created?: GraphQLTypes['directus_users'] | undefined;
  };
  ['collaborator_roles']: {
    __typename: 'collaborator_roles';
    description?: string | undefined;
    id: string;
    name?: string | undefined;
  };
  ['junction_directus_users_skills']: {
    __typename: 'junction_directus_users_skills';
    directus_users_id?: GraphQLTypes['directus_users'] | undefined;
    id: string;
    skills_id?: GraphQLTypes['skills'] | undefined;
  };
  ['skills']: {
    __typename: 'skills';
    description?: string | undefined;
    id: string;
    name: string;
  };
  /** BigInt value */
  ['GraphQLBigInt']: 'scalar' & { name: 'GraphQLBigInt' };
  ['products']: {
    __typename: 'products';
    brand_id?: GraphQLTypes['brands'] | undefined;
    clo3d_file?: GraphQLTypes['directus_files'] | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    description?: string | undefined;
    discord_channel_id?: string | undefined;
    fulfiller_id?: GraphQLTypes['fulfillers'] | undefined;
    id: string;
    name: string;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    price?: GraphQLTypes['price_currencies'] | undefined;
    producer_id?: GraphQLTypes['producers'] | undefined;
    product_stage?: GraphQLTypes['stages'] | undefined;
    production_cost?: number | undefined;
    quantity?: GraphQLTypes['GraphQLBigInt'] | undefined;
    release_date?: GraphQLTypes['Date'] | undefined;
    release_date_func?: GraphQLTypes['datetime_functions'] | undefined;
    sale_currency?: GraphQLTypes['currencies'] | undefined;
    sale_price?: number | undefined;
    sale_type?: string | undefined;
    season?: number | undefined;
    shopify_id?: string | undefined;
    status?: string | undefined;
    notes?: string | undefined;
    date_updated?: GraphQLTypes['Date'] | undefined;
    date_updated_func?: GraphQLTypes['datetime_functions'] | undefined;
    html_file?: GraphQLTypes['directus_files'] | undefined;
    thumbnail?: GraphQLTypes['directus_files'] | undefined;
    vrm_file?: GraphQLTypes['directus_files'] | undefined;
    contributors?:
      | Array<GraphQLTypes['products_contributors'] | undefined>
      | undefined;
    contributors_func?: GraphQLTypes['count_functions'] | undefined;
    materials?:
      | Array<GraphQLTypes['products_production_materials'] | undefined>
      | undefined;
    materials_func?: GraphQLTypes['count_functions'] | undefined;
    design_files?:
      | Array<GraphQLTypes['products_design_files'] | undefined>
      | undefined;
    design_files_func?: GraphQLTypes['count_functions'] | undefined;
    content?: Array<GraphQLTypes['products_content'] | undefined> | undefined;
    content_func?: GraphQLTypes['count_functions'] | undefined;
    images?: Array<GraphQLTypes['products_files'] | undefined> | undefined;
    images_func?: GraphQLTypes['count_functions'] | undefined;
    wearable_files?:
      | Array<GraphQLTypes['products_wearables'] | undefined>
      | undefined;
    wearable_files_func?: GraphQLTypes['count_functions'] | undefined;
    production_methods?:
      | Array<GraphQLTypes['products_production_methods'] | undefined>
      | undefined;
    production_methods_func?: GraphQLTypes['count_functions'] | undefined;
    client_invoices?: Array<GraphQLTypes['invoices'] | undefined> | undefined;
    client_invoices_func?: GraphQLTypes['count_functions'] | undefined;
    production_invoices?:
      | Array<GraphQLTypes['invoices'] | undefined>
      | undefined;
    production_invoices_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['brands_filter']: {
    created_at?: GraphQLTypes['date_filter_operators'] | undefined;
    created_at_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    discord_url?: GraphQLTypes['string_filter_operators'] | undefined;
    eth_address?: GraphQLTypes['string_filter_operators'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    logo?: GraphQLTypes['directus_files_filter'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    notion_id?: GraphQLTypes['string_filter_operators'] | undefined;
    twitter_url?: GraphQLTypes['string_filter_operators'] | undefined;
    website_url?: GraphQLTypes['string_filter_operators'] | undefined;
    products?: GraphQLTypes['products_filter'] | undefined;
    products_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    users?: GraphQLTypes['brands_directus_users_filter'] | undefined;
    users_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    _and?: Array<GraphQLTypes['brands_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['brands_filter'] | undefined> | undefined;
  };
  ['products_filter']: {
    brand_id?: GraphQLTypes['brands_filter'] | undefined;
    clo3d_file?: GraphQLTypes['directus_files_filter'] | undefined;
    created_at?: GraphQLTypes['date_filter_operators'] | undefined;
    created_at_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    discord_channel_id?: GraphQLTypes['string_filter_operators'] | undefined;
    fulfiller_id?: GraphQLTypes['fulfillers_filter'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    nft_token_id?: GraphQLTypes['number_filter_operators'] | undefined;
    notion_id?: GraphQLTypes['string_filter_operators'] | undefined;
    price?: GraphQLTypes['price_currencies_filter'] | undefined;
    producer_id?: GraphQLTypes['producers_filter'] | undefined;
    product_stage?: GraphQLTypes['stages_filter'] | undefined;
    production_cost?: GraphQLTypes['number_filter_operators'] | undefined;
    quantity?: GraphQLTypes['number_filter_operators'] | undefined;
    release_date?: GraphQLTypes['date_filter_operators'] | undefined;
    release_date_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    sale_currency?: GraphQLTypes['currencies_filter'] | undefined;
    sale_price?: GraphQLTypes['number_filter_operators'] | undefined;
    sale_type?: GraphQLTypes['string_filter_operators'] | undefined;
    season?: GraphQLTypes['number_filter_operators'] | undefined;
    shopify_id?: GraphQLTypes['string_filter_operators'] | undefined;
    status?: GraphQLTypes['string_filter_operators'] | undefined;
    notes?: GraphQLTypes['string_filter_operators'] | undefined;
    date_updated?: GraphQLTypes['date_filter_operators'] | undefined;
    date_updated_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    html_file?: GraphQLTypes['directus_files_filter'] | undefined;
    thumbnail?: GraphQLTypes['directus_files_filter'] | undefined;
    vrm_file?: GraphQLTypes['directus_files_filter'] | undefined;
    contributors?: GraphQLTypes['products_contributors_filter'] | undefined;
    contributors_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    materials?:
      | GraphQLTypes['products_production_materials_filter']
      | undefined;
    materials_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    design_files?: GraphQLTypes['products_design_files_filter'] | undefined;
    design_files_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    content?: GraphQLTypes['products_content_filter'] | undefined;
    content_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    images?: GraphQLTypes['products_files_filter'] | undefined;
    images_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    wearable_files?: GraphQLTypes['products_wearables_filter'] | undefined;
    wearable_files_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    production_methods?:
      | GraphQLTypes['products_production_methods_filter']
      | undefined;
    production_methods_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    client_invoices?: GraphQLTypes['invoices_filter'] | undefined;
    client_invoices_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    production_invoices?: GraphQLTypes['invoices_filter'] | undefined;
    production_invoices_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    _and?: Array<GraphQLTypes['products_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['products_filter'] | undefined> | undefined;
  };
  ['fulfillers_filter']: {
    address?: GraphQLTypes['string_filter_operators'] | undefined;
    created_at?: GraphQLTypes['date_filter_operators'] | undefined;
    created_at_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    email?: GraphQLTypes['string_filter_operators'] | undefined;
    eth_address?: GraphQLTypes['string_filter_operators'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    website_url?: GraphQLTypes['string_filter_operators'] | undefined;
    _and?: Array<GraphQLTypes['fulfillers_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['fulfillers_filter'] | undefined> | undefined;
  };
  ['price_currencies_filter']: {
    amount?: GraphQLTypes['number_filter_operators'] | undefined;
    currency?: GraphQLTypes['string_filter_operators'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    _and?:
      | Array<GraphQLTypes['price_currencies_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['price_currencies_filter'] | undefined>
      | undefined;
  };
  ['producers_filter']: {
    created_at?: GraphQLTypes['date_filter_operators'] | undefined;
    created_at_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    email?: GraphQLTypes['string_filter_operators'] | undefined;
    eth_address?: GraphQLTypes['string_filter_operators'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    shipping_address?: GraphQLTypes['string_filter_operators'] | undefined;
    production_materials_stocked?:
      | GraphQLTypes['producers_production_materials_filter']
      | undefined;
    production_materials_stocked_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    production_methods?:
      | GraphQLTypes['producers_production_methods_filter']
      | undefined;
    production_methods_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    supplied_materials?:
      | GraphQLTypes['production_materials_filter']
      | undefined;
    supplied_materials_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    _and?: Array<GraphQLTypes['producers_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['producers_filter'] | undefined> | undefined;
  };
  ['producers_production_materials_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    producers_id?: GraphQLTypes['producers_filter'] | undefined;
    production_materials_id?:
      | GraphQLTypes['production_materials_filter']
      | undefined;
    quantity?: GraphQLTypes['number_filter_operators'] | undefined;
    _and?:
      | Array<GraphQLTypes['producers_production_materials_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['producers_production_materials_filter'] | undefined>
      | undefined;
  };
  ['production_materials_filter']: {
    base_price?: GraphQLTypes['number_filter_operators'] | undefined;
    color_palette?: GraphQLTypes['string_filter_operators'] | undefined;
    color_palette_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    composition?: GraphQLTypes['string_filter_operators'] | undefined;
    created_at?: GraphQLTypes['date_filter_operators'] | undefined;
    created_at_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    created_by?: GraphQLTypes['directus_users_filter'] | undefined;
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    gender?: GraphQLTypes['string_filter_operators'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    made_in?: GraphQLTypes['string_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    neck_tag?: GraphQLTypes['boolean_filter_operators'] | undefined;
    note?: GraphQLTypes['string_filter_operators'] | undefined;
    rating?: GraphQLTypes['string_filter_operators'] | undefined;
    size_guide?: GraphQLTypes['directus_files_filter'] | undefined;
    supplier?: GraphQLTypes['producers_filter'] | undefined;
    tags?: GraphQLTypes['string_filter_operators'] | undefined;
    tags_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    production_methods?:
      | GraphQLTypes['production_materials_production_methods_filter']
      | undefined;
    production_methods_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    stocked_at?:
      | GraphQLTypes['producers_production_materials_filter']
      | undefined;
    stocked_at_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    base_assets?: GraphQLTypes['production_materials_files_filter'] | undefined;
    base_assets_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    _and?:
      | Array<GraphQLTypes['production_materials_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['production_materials_filter'] | undefined>
      | undefined;
  };
  ['production_materials_production_methods_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    production_materials_id?:
      | GraphQLTypes['production_materials_filter']
      | undefined;
    production_methods_id?:
      | GraphQLTypes['production_methods_filter']
      | undefined;
    _and?:
      | Array<
          | GraphQLTypes['production_materials_production_methods_filter']
          | undefined
        >
      | undefined;
    _or?:
      | Array<
          | GraphQLTypes['production_materials_production_methods_filter']
          | undefined
        >
      | undefined;
  };
  ['production_methods_filter']: {
    created_at?: GraphQLTypes['date_filter_operators'] | undefined;
    created_at_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    producers?: GraphQLTypes['producers_production_methods_filter'] | undefined;
    producers_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    production_materials?:
      | GraphQLTypes['production_materials_production_methods_filter']
      | undefined;
    production_materials_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    _and?:
      | Array<GraphQLTypes['production_methods_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['production_methods_filter'] | undefined>
      | undefined;
  };
  ['producers_production_methods_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    producers_id?: GraphQLTypes['producers_filter'] | undefined;
    production_methods_id?:
      | GraphQLTypes['production_methods_filter']
      | undefined;
    _and?:
      | Array<GraphQLTypes['producers_production_methods_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['producers_production_methods_filter'] | undefined>
      | undefined;
  };
  ['production_materials_files_filter']: {
    directus_files_id?: GraphQLTypes['directus_files_filter'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    production_materials_id?:
      | GraphQLTypes['production_materials_filter']
      | undefined;
    _and?:
      | Array<GraphQLTypes['production_materials_files_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['production_materials_files_filter'] | undefined>
      | undefined;
  };
  ['stages_filter']: {
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    sort?: GraphQLTypes['number_filter_operators'] | undefined;
    _and?: Array<GraphQLTypes['stages_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['stages_filter'] | undefined> | undefined;
  };
  ['currencies_filter']: {
    currency?: GraphQLTypes['string_filter_operators'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    _and?: Array<GraphQLTypes['currencies_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['currencies_filter'] | undefined> | undefined;
  };
  ['products_contributors_filter']: {
    collaborators_id?: GraphQLTypes['collaborators_filter'] | undefined;
    contribution_share?: GraphQLTypes['number_filter_operators'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    products_id?: GraphQLTypes['products_filter'] | undefined;
    robot_earned?: GraphQLTypes['number_filter_operators'] | undefined;
    _and?:
      | Array<GraphQLTypes['products_contributors_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['products_contributors_filter'] | undefined>
      | undefined;
  };
  ['products_production_materials_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    production_materials_id?:
      | GraphQLTypes['production_materials_filter']
      | undefined;
    products_id?: GraphQLTypes['products_filter'] | undefined;
    _and?:
      | Array<GraphQLTypes['products_production_materials_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['products_production_materials_filter'] | undefined>
      | undefined;
  };
  ['products_design_files_filter']: {
    directus_files_id?: GraphQLTypes['directus_files_filter'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    products_id?: GraphQLTypes['products_filter'] | undefined;
    _and?:
      | Array<GraphQLTypes['products_design_files_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['products_design_files_filter'] | undefined>
      | undefined;
  };
  ['products_content_filter']: {
    directus_files_id?: GraphQLTypes['directus_files_filter'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    products_id?: GraphQLTypes['products_filter'] | undefined;
    _and?:
      | Array<GraphQLTypes['products_content_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['products_content_filter'] | undefined>
      | undefined;
  };
  ['products_files_filter']: {
    directus_files_id?: GraphQLTypes['directus_files_filter'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    products_id?: GraphQLTypes['products_filter'] | undefined;
    _and?: Array<GraphQLTypes['products_files_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['products_files_filter'] | undefined> | undefined;
  };
  ['products_wearables_filter']: {
    directus_files_id?: GraphQLTypes['directus_files_filter'] | undefined;
    file_format?: GraphQLTypes['file_formats_filter'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    primary?: GraphQLTypes['boolean_filter_operators'] | undefined;
    products_id?: GraphQLTypes['products_filter'] | undefined;
    _and?:
      | Array<GraphQLTypes['products_wearables_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['products_wearables_filter'] | undefined>
      | undefined;
  };
  ['file_formats_filter']: {
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    extension?: GraphQLTypes['string_filter_operators'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    mime_type?: GraphQLTypes['string_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    _and?: Array<GraphQLTypes['file_formats_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['file_formats_filter'] | undefined> | undefined;
  };
  ['products_production_methods_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    production_methods_id?:
      | GraphQLTypes['production_methods_filter']
      | undefined;
    products_id?: GraphQLTypes['products_filter'] | undefined;
    _and?:
      | Array<GraphQLTypes['products_production_methods_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['products_production_methods_filter'] | undefined>
      | undefined;
  };
  ['invoices_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    user_created?: GraphQLTypes['directus_users_filter'] | undefined;
    date_created?: GraphQLTypes['date_filter_operators'] | undefined;
    date_created_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    user_updated?: GraphQLTypes['directus_users_filter'] | undefined;
    date_updated?: GraphQLTypes['date_filter_operators'] | undefined;
    date_updated_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    details?: GraphQLTypes['string_filter_operators'] | undefined;
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    status?: GraphQLTypes['string_filter_operators'] | undefined;
    amount?: GraphQLTypes['number_filter_operators'] | undefined;
    transaction_url?: GraphQLTypes['string_filter_operators'] | undefined;
    production_product_id?: GraphQLTypes['products_filter'] | undefined;
    client_product_id?: GraphQLTypes['products_filter'] | undefined;
    _and?: Array<GraphQLTypes['invoices_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['invoices_filter'] | undefined> | undefined;
  };
  ['brands_directus_users_filter']: {
    brands_id?: GraphQLTypes['brands_filter'] | undefined;
    directus_users_id?: GraphQLTypes['directus_users_filter'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    _and?:
      | Array<GraphQLTypes['brands_directus_users_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['brands_directus_users_filter'] | undefined>
      | undefined;
  };
  ['fulfillers']: {
    __typename: 'fulfillers';
    address?: string | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    email?: string | undefined;
    eth_address?: string | undefined;
    id: string;
    name?: string | undefined;
    website_url?: string | undefined;
  };
  ['price_currencies']: {
    __typename: 'price_currencies';
    amount: number;
    currency?: string | undefined;
    id: string;
  };
  ['producers']: {
    __typename: 'producers';
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    email?: string | undefined;
    eth_address?: string | undefined;
    id: string;
    name?: string | undefined;
    shipping_address?: string | undefined;
    production_materials_stocked?:
      | Array<GraphQLTypes['producers_production_materials'] | undefined>
      | undefined;
    production_materials_stocked_func?:
      | GraphQLTypes['count_functions']
      | undefined;
    production_methods?:
      | Array<GraphQLTypes['producers_production_methods'] | undefined>
      | undefined;
    production_methods_func?: GraphQLTypes['count_functions'] | undefined;
    supplied_materials?:
      | Array<GraphQLTypes['production_materials'] | undefined>
      | undefined;
    supplied_materials_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['producers_production_materials']: {
    __typename: 'producers_production_materials';
    id: string;
    producers_id?: GraphQLTypes['producers'] | undefined;
    production_materials_id?: GraphQLTypes['production_materials'] | undefined;
    quantity?: number | undefined;
  };
  ['production_materials']: {
    __typename: 'production_materials';
    base_price?: number | undefined;
    color_palette?: GraphQLTypes['JSON'] | undefined;
    color_palette_func?: GraphQLTypes['count_functions'] | undefined;
    composition?: string | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    created_by?: GraphQLTypes['directus_users'] | undefined;
    description?: string | undefined;
    gender?: string | undefined;
    id: string;
    made_in?: string | undefined;
    name?: string | undefined;
    neck_tag?: boolean | undefined;
    note?: string | undefined;
    rating?: string | undefined;
    size_guide?: GraphQLTypes['directus_files'] | undefined;
    supplier?: GraphQLTypes['producers'] | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    tags_func?: GraphQLTypes['count_functions'] | undefined;
    production_methods?:
      | Array<
          GraphQLTypes['production_materials_production_methods'] | undefined
        >
      | undefined;
    production_methods_func?: GraphQLTypes['count_functions'] | undefined;
    stocked_at?:
      | Array<GraphQLTypes['producers_production_materials'] | undefined>
      | undefined;
    stocked_at_func?: GraphQLTypes['count_functions'] | undefined;
    base_assets?:
      | Array<GraphQLTypes['production_materials_files'] | undefined>
      | undefined;
    base_assets_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['production_materials_production_methods']: {
    __typename: 'production_materials_production_methods';
    id: string;
    production_materials_id?: GraphQLTypes['production_materials'] | undefined;
    production_methods_id?: GraphQLTypes['production_methods'] | undefined;
  };
  ['production_methods']: {
    __typename: 'production_methods';
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    description?: string | undefined;
    id: string;
    name?: string | undefined;
    producers?:
      | Array<GraphQLTypes['producers_production_methods'] | undefined>
      | undefined;
    producers_func?: GraphQLTypes['count_functions'] | undefined;
    production_materials?:
      | Array<
          GraphQLTypes['production_materials_production_methods'] | undefined
        >
      | undefined;
    production_materials_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['producers_production_methods']: {
    __typename: 'producers_production_methods';
    id: string;
    producers_id?: GraphQLTypes['producers'] | undefined;
    production_methods_id?: GraphQLTypes['production_methods'] | undefined;
  };
  ['production_materials_files']: {
    __typename: 'production_materials_files';
    directus_files_id?: GraphQLTypes['directus_files'] | undefined;
    id: string;
    production_materials_id?: GraphQLTypes['production_materials'] | undefined;
  };
  ['stages']: {
    __typename: 'stages';
    description?: string | undefined;
    name: string;
    sort?: number | undefined;
  };
  ['currencies']: {
    __typename: 'currencies';
    currency: string;
    id: string;
  };
  ['products_contributors']: {
    __typename: 'products_contributors';
    collaborators_id?: GraphQLTypes['collaborators'] | undefined;
    contribution_share?: number | undefined;
    id: string;
    products_id?: GraphQLTypes['products'] | undefined;
    robot_earned?: number | undefined;
  };
  ['products_production_materials']: {
    __typename: 'products_production_materials';
    id: string;
    production_materials_id?: GraphQLTypes['production_materials'] | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
  };
  ['products_design_files']: {
    __typename: 'products_design_files';
    directus_files_id?: GraphQLTypes['directus_files'] | undefined;
    id: string;
    products_id?: GraphQLTypes['products'] | undefined;
  };
  ['products_content']: {
    __typename: 'products_content';
    directus_files_id?: GraphQLTypes['directus_files'] | undefined;
    id: string;
    products_id?: GraphQLTypes['products'] | undefined;
  };
  ['products_files']: {
    __typename: 'products_files';
    directus_files_id?: GraphQLTypes['directus_files'] | undefined;
    id: string;
    products_id?: GraphQLTypes['products'] | undefined;
  };
  ['products_wearables']: {
    __typename: 'products_wearables';
    directus_files_id?: GraphQLTypes['directus_files'] | undefined;
    file_format?: GraphQLTypes['file_formats'] | undefined;
    id: string;
    primary?: boolean | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
  };
  ['file_formats']: {
    __typename: 'file_formats';
    description?: string | undefined;
    extension?: string | undefined;
    id: string;
    mime_type?: string | undefined;
    name: string;
  };
  ['products_production_methods']: {
    __typename: 'products_production_methods';
    id: string;
    production_methods_id?: GraphQLTypes['production_methods'] | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
  };
  ['invoices']: {
    __typename: 'invoices';
    id: string;
    user_created?: GraphQLTypes['directus_users'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functions'] | undefined;
    user_updated?: GraphQLTypes['directus_users'] | undefined;
    date_updated?: GraphQLTypes['Date'] | undefined;
    date_updated_func?: GraphQLTypes['datetime_functions'] | undefined;
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: string | undefined;
    description: string;
    status?: string | undefined;
    /** Invoice amount in USD */
    amount?: number | undefined;
    transaction_url?: string | undefined;
    production_product_id?: GraphQLTypes['products'] | undefined;
    client_product_id?: GraphQLTypes['products'] | undefined;
  };
  ['brands_directus_users']: {
    __typename: 'brands_directus_users';
    brands_id?: GraphQLTypes['brands'] | undefined;
    directus_users_id?: GraphQLTypes['directus_users'] | undefined;
    id: string;
  };
  ['brands_aggregated']: {
    __typename: 'brands_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['brands_aggregated_count'] | undefined;
    countDistinct?: GraphQLTypes['brands_aggregated_count'] | undefined;
  };
  ['brands_aggregated_count']: {
    __typename: 'brands_aggregated_count';
    created_at?: number | undefined;
    description?: number | undefined;
    discord_url?: number | undefined;
    eth_address?: number | undefined;
    id?: number | undefined;
    logo?: number | undefined;
    name?: number | undefined;
    notion_id?: number | undefined;
    twitter_url?: number | undefined;
    website_url?: number | undefined;
    products?: number | undefined;
    users?: number | undefined;
  };
  ['brands_directus_users_aggregated']: {
    __typename: 'brands_directus_users_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['brands_directus_users_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['brands_directus_users_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['brands_directus_users_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['brands_directus_users_aggregated_fields'] | undefined;
    avgDistinct?:
      | GraphQLTypes['brands_directus_users_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['brands_directus_users_aggregated_fields']
      | undefined;
    min?: GraphQLTypes['brands_directus_users_aggregated_fields'] | undefined;
    max?: GraphQLTypes['brands_directus_users_aggregated_fields'] | undefined;
  };
  ['brands_directus_users_aggregated_count']: {
    __typename: 'brands_directus_users_aggregated_count';
    brands_id?: number | undefined;
    directus_users_id?: number | undefined;
    id?: number | undefined;
  };
  ['brands_directus_users_aggregated_fields']: {
    __typename: 'brands_directus_users_aggregated_fields';
    brands_id?: number | undefined;
    id?: number | undefined;
  };
  ['collaborators_aggregated']: {
    __typename: 'collaborators_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['collaborators_aggregated_count'] | undefined;
    countDistinct?: GraphQLTypes['collaborators_aggregated_count'] | undefined;
    avg?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    min?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    max?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
  };
  ['collaborators_aggregated_count']: {
    __typename: 'collaborators_aggregated_count';
    account?: number | undefined;
    date_created?: number | undefined;
    date_updated?: number | undefined;
    display_name?: number | undefined;
    id?: number | undefined;
    payment_eth_address?: number | undefined;
    role?: number | undefined;
    user_created?: number | undefined;
  };
  ['collaborators_aggregated_fields']: {
    __typename: 'collaborators_aggregated_fields';
    id?: number | undefined;
    role?: number | undefined;
  };
  ['collaborator_roles_aggregated']: {
    __typename: 'collaborator_roles_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['collaborator_roles_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['collaborator_roles_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['collaborator_roles_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['collaborator_roles_aggregated_fields'] | undefined;
    avgDistinct?:
      | GraphQLTypes['collaborator_roles_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['collaborator_roles_aggregated_fields']
      | undefined;
    min?: GraphQLTypes['collaborator_roles_aggregated_fields'] | undefined;
    max?: GraphQLTypes['collaborator_roles_aggregated_fields'] | undefined;
  };
  ['collaborator_roles_aggregated_count']: {
    __typename: 'collaborator_roles_aggregated_count';
    description?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
  };
  ['collaborator_roles_aggregated_fields']: {
    __typename: 'collaborator_roles_aggregated_fields';
    id?: number | undefined;
  };
  ['junction_directus_users_skills_aggregated']: {
    __typename: 'junction_directus_users_skills_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['junction_directus_users_skills_aggregated_count']
      | undefined;
    countDistinct?:
      | GraphQLTypes['junction_directus_users_skills_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
    avgDistinct?:
      | GraphQLTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
    min?:
      | GraphQLTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
    max?:
      | GraphQLTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
  };
  ['junction_directus_users_skills_aggregated_count']: {
    __typename: 'junction_directus_users_skills_aggregated_count';
    directus_users_id?: number | undefined;
    id?: number | undefined;
    skills_id?: number | undefined;
  };
  ['junction_directus_users_skills_aggregated_fields']: {
    __typename: 'junction_directus_users_skills_aggregated_fields';
    id?: number | undefined;
    skills_id?: number | undefined;
  };
  ['skills_aggregated']: {
    __typename: 'skills_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['skills_aggregated_count'] | undefined;
    countDistinct?: GraphQLTypes['skills_aggregated_count'] | undefined;
  };
  ['skills_aggregated_count']: {
    __typename: 'skills_aggregated_count';
    description?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
  };
  ['producers_aggregated']: {
    __typename: 'producers_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['producers_aggregated_count'] | undefined;
    countDistinct?: GraphQLTypes['producers_aggregated_count'] | undefined;
  };
  ['producers_aggregated_count']: {
    __typename: 'producers_aggregated_count';
    created_at?: number | undefined;
    email?: number | undefined;
    eth_address?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
    shipping_address?: number | undefined;
    /** List of production materials in this producers inventory */
    production_materials_stocked?: number | undefined;
    production_methods?: number | undefined;
    /** Production materials manufactured / sourced by this producer */
    supplied_materials?: number | undefined;
  };
  ['producers_production_materials_aggregated']: {
    __typename: 'producers_production_materials_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['producers_production_materials_aggregated_count']
      | undefined;
    countDistinct?:
      | GraphQLTypes['producers_production_materials_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['producers_production_materials_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['producers_production_materials_aggregated_fields']
      | undefined;
    avgDistinct?:
      | GraphQLTypes['producers_production_materials_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['producers_production_materials_aggregated_fields']
      | undefined;
    min?:
      | GraphQLTypes['producers_production_materials_aggregated_fields']
      | undefined;
    max?:
      | GraphQLTypes['producers_production_materials_aggregated_fields']
      | undefined;
  };
  ['producers_production_materials_aggregated_count']: {
    __typename: 'producers_production_materials_aggregated_count';
    id?: number | undefined;
    producers_id?: number | undefined;
    production_materials_id?: number | undefined;
    quantity?: number | undefined;
  };
  ['producers_production_materials_aggregated_fields']: {
    __typename: 'producers_production_materials_aggregated_fields';
    id?: number | undefined;
    producers_id?: number | undefined;
    production_materials_id?: number | undefined;
    quantity?: number | undefined;
  };
  ['producers_production_methods_aggregated']: {
    __typename: 'producers_production_methods_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['producers_production_methods_aggregated_count']
      | undefined;
    countDistinct?:
      | GraphQLTypes['producers_production_methods_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['producers_production_methods_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['producers_production_methods_aggregated_fields']
      | undefined;
    avgDistinct?:
      | GraphQLTypes['producers_production_methods_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['producers_production_methods_aggregated_fields']
      | undefined;
    min?:
      | GraphQLTypes['producers_production_methods_aggregated_fields']
      | undefined;
    max?:
      | GraphQLTypes['producers_production_methods_aggregated_fields']
      | undefined;
  };
  ['producers_production_methods_aggregated_count']: {
    __typename: 'producers_production_methods_aggregated_count';
    id?: number | undefined;
    producers_id?: number | undefined;
    production_methods_id?: number | undefined;
  };
  ['producers_production_methods_aggregated_fields']: {
    __typename: 'producers_production_methods_aggregated_fields';
    id?: number | undefined;
    producers_id?: number | undefined;
    production_methods_id?: number | undefined;
  };
  ['production_methods_aggregated']: {
    __typename: 'production_methods_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['production_methods_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['production_methods_aggregated_count']
      | undefined;
  };
  ['production_methods_aggregated_count']: {
    __typename: 'production_methods_aggregated_count';
    created_at?: number | undefined;
    description?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
    /** List of producers that are cable of this production method */
    producers?: number | undefined;
    production_materials?: number | undefined;
  };
  ['production_materials_production_methods_aggregated']: {
    __typename: 'production_materials_production_methods_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['production_materials_production_methods_aggregated_count']
      | undefined;
    countDistinct?:
      | GraphQLTypes['production_materials_production_methods_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
    avgDistinct?:
      | GraphQLTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
    min?:
      | GraphQLTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
    max?:
      | GraphQLTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
  };
  ['production_materials_production_methods_aggregated_count']: {
    __typename: 'production_materials_production_methods_aggregated_count';
    id?: number | undefined;
    production_materials_id?: number | undefined;
    production_methods_id?: number | undefined;
  };
  ['production_materials_production_methods_aggregated_fields']: {
    __typename: 'production_materials_production_methods_aggregated_fields';
    id?: number | undefined;
    production_materials_id?: number | undefined;
    production_methods_id?: number | undefined;
  };
  ['fulfillers_aggregated']: {
    __typename: 'fulfillers_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['fulfillers_aggregated_count'] | undefined;
    countDistinct?: GraphQLTypes['fulfillers_aggregated_count'] | undefined;
  };
  ['fulfillers_aggregated_count']: {
    __typename: 'fulfillers_aggregated_count';
    address?: number | undefined;
    created_at?: number | undefined;
    email?: number | undefined;
    eth_address?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
    website_url?: number | undefined;
  };
  ['price_currencies_aggregated']: {
    __typename: 'price_currencies_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['price_currencies_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['price_currencies_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['price_currencies_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['price_currencies_aggregated_fields'] | undefined;
    avgDistinct?:
      | GraphQLTypes['price_currencies_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['price_currencies_aggregated_fields']
      | undefined;
    min?: GraphQLTypes['price_currencies_aggregated_fields'] | undefined;
    max?: GraphQLTypes['price_currencies_aggregated_fields'] | undefined;
  };
  ['price_currencies_aggregated_count']: {
    __typename: 'price_currencies_aggregated_count';
    amount?: number | undefined;
    currency?: number | undefined;
    id?: number | undefined;
  };
  ['price_currencies_aggregated_fields']: {
    __typename: 'price_currencies_aggregated_fields';
    amount?: number | undefined;
    id?: number | undefined;
  };
  ['stages_aggregated']: {
    __typename: 'stages_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['stages_aggregated_count'] | undefined;
    countDistinct?: GraphQLTypes['stages_aggregated_count'] | undefined;
    avg?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    min?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    max?: GraphQLTypes['stages_aggregated_fields'] | undefined;
  };
  ['stages_aggregated_count']: {
    __typename: 'stages_aggregated_count';
    description?: number | undefined;
    name?: number | undefined;
    sort?: number | undefined;
  };
  ['stages_aggregated_fields']: {
    __typename: 'stages_aggregated_fields';
    sort?: number | undefined;
  };
  ['currencies_aggregated']: {
    __typename: 'currencies_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['currencies_aggregated_count'] | undefined;
    countDistinct?: GraphQLTypes['currencies_aggregated_count'] | undefined;
    avg?: GraphQLTypes['currencies_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['currencies_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['currencies_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['currencies_aggregated_fields'] | undefined;
    min?: GraphQLTypes['currencies_aggregated_fields'] | undefined;
    max?: GraphQLTypes['currencies_aggregated_fields'] | undefined;
  };
  ['currencies_aggregated_count']: {
    __typename: 'currencies_aggregated_count';
    currency?: number | undefined;
    id?: number | undefined;
  };
  ['currencies_aggregated_fields']: {
    __typename: 'currencies_aggregated_fields';
    id?: number | undefined;
  };
  ['products_content_aggregated']: {
    __typename: 'products_content_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_content_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['products_content_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['products_content_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_content_aggregated_fields'] | undefined;
    avgDistinct?:
      | GraphQLTypes['products_content_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['products_content_aggregated_fields']
      | undefined;
    min?: GraphQLTypes['products_content_aggregated_fields'] | undefined;
    max?: GraphQLTypes['products_content_aggregated_fields'] | undefined;
  };
  ['products_content_aggregated_count']: {
    __typename: 'products_content_aggregated_count';
    directus_files_id?: number | undefined;
    id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_content_aggregated_fields']: {
    __typename: 'products_content_aggregated_fields';
    id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_contributors_aggregated']: {
    __typename: 'products_contributors_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_contributors_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['products_contributors_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['products_contributors_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_contributors_aggregated_fields'] | undefined;
    avgDistinct?:
      | GraphQLTypes['products_contributors_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['products_contributors_aggregated_fields']
      | undefined;
    min?: GraphQLTypes['products_contributors_aggregated_fields'] | undefined;
    max?: GraphQLTypes['products_contributors_aggregated_fields'] | undefined;
  };
  ['products_contributors_aggregated_count']: {
    __typename: 'products_contributors_aggregated_count';
    collaborators_id?: number | undefined;
    contribution_share?: number | undefined;
    id?: number | undefined;
    products_id?: number | undefined;
    robot_earned?: number | undefined;
  };
  ['products_contributors_aggregated_fields']: {
    __typename: 'products_contributors_aggregated_fields';
    collaborators_id?: number | undefined;
    contribution_share?: number | undefined;
    id?: number | undefined;
    products_id?: number | undefined;
    robot_earned?: number | undefined;
  };
  ['products_design_files_aggregated']: {
    __typename: 'products_design_files_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_design_files_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['products_design_files_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['products_design_files_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_design_files_aggregated_fields'] | undefined;
    avgDistinct?:
      | GraphQLTypes['products_design_files_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['products_design_files_aggregated_fields']
      | undefined;
    min?: GraphQLTypes['products_design_files_aggregated_fields'] | undefined;
    max?: GraphQLTypes['products_design_files_aggregated_fields'] | undefined;
  };
  ['products_design_files_aggregated_count']: {
    __typename: 'products_design_files_aggregated_count';
    directus_files_id?: number | undefined;
    id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_design_files_aggregated_fields']: {
    __typename: 'products_design_files_aggregated_fields';
    id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_files_aggregated']: {
    __typename: 'products_files_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_files_aggregated_count'] | undefined;
    countDistinct?: GraphQLTypes['products_files_aggregated_count'] | undefined;
    avg?: GraphQLTypes['products_files_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_files_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['products_files_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['products_files_aggregated_fields'] | undefined;
    min?: GraphQLTypes['products_files_aggregated_fields'] | undefined;
    max?: GraphQLTypes['products_files_aggregated_fields'] | undefined;
  };
  ['products_files_aggregated_count']: {
    __typename: 'products_files_aggregated_count';
    directus_files_id?: number | undefined;
    id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_files_aggregated_fields']: {
    __typename: 'products_files_aggregated_fields';
    id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_production_materials_aggregated']: {
    __typename: 'products_production_materials_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['products_production_materials_aggregated_count']
      | undefined;
    countDistinct?:
      | GraphQLTypes['products_production_materials_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['products_production_materials_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['products_production_materials_aggregated_fields']
      | undefined;
    avgDistinct?:
      | GraphQLTypes['products_production_materials_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['products_production_materials_aggregated_fields']
      | undefined;
    min?:
      | GraphQLTypes['products_production_materials_aggregated_fields']
      | undefined;
    max?:
      | GraphQLTypes['products_production_materials_aggregated_fields']
      | undefined;
  };
  ['products_production_materials_aggregated_count']: {
    __typename: 'products_production_materials_aggregated_count';
    id?: number | undefined;
    production_materials_id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_production_materials_aggregated_fields']: {
    __typename: 'products_production_materials_aggregated_fields';
    id?: number | undefined;
    production_materials_id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_production_methods_aggregated']: {
    __typename: 'products_production_methods_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['products_production_methods_aggregated_count']
      | undefined;
    countDistinct?:
      | GraphQLTypes['products_production_methods_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['products_production_methods_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['products_production_methods_aggregated_fields']
      | undefined;
    avgDistinct?:
      | GraphQLTypes['products_production_methods_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['products_production_methods_aggregated_fields']
      | undefined;
    min?:
      | GraphQLTypes['products_production_methods_aggregated_fields']
      | undefined;
    max?:
      | GraphQLTypes['products_production_methods_aggregated_fields']
      | undefined;
  };
  ['products_production_methods_aggregated_count']: {
    __typename: 'products_production_methods_aggregated_count';
    id?: number | undefined;
    production_methods_id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_production_methods_aggregated_fields']: {
    __typename: 'products_production_methods_aggregated_fields';
    id?: number | undefined;
    production_methods_id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_wearables_aggregated']: {
    __typename: 'products_wearables_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_wearables_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['products_wearables_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['products_wearables_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_wearables_aggregated_fields'] | undefined;
    avgDistinct?:
      | GraphQLTypes['products_wearables_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['products_wearables_aggregated_fields']
      | undefined;
    min?: GraphQLTypes['products_wearables_aggregated_fields'] | undefined;
    max?: GraphQLTypes['products_wearables_aggregated_fields'] | undefined;
  };
  ['products_wearables_aggregated_count']: {
    __typename: 'products_wearables_aggregated_count';
    directus_files_id?: number | undefined;
    file_format?: number | undefined;
    id?: number | undefined;
    primary?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_wearables_aggregated_fields']: {
    __typename: 'products_wearables_aggregated_fields';
    file_format?: number | undefined;
    id?: number | undefined;
    products_id?: number | undefined;
  };
  ['file_formats_aggregated']: {
    __typename: 'file_formats_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['file_formats_aggregated_count'] | undefined;
    countDistinct?: GraphQLTypes['file_formats_aggregated_count'] | undefined;
    avg?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    min?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    max?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
  };
  ['file_formats_aggregated_count']: {
    __typename: 'file_formats_aggregated_count';
    description?: number | undefined;
    extension?: number | undefined;
    id?: number | undefined;
    mime_type?: number | undefined;
    name?: number | undefined;
  };
  ['file_formats_aggregated_fields']: {
    __typename: 'file_formats_aggregated_fields';
    id?: number | undefined;
  };
  ['products_aggregated']: {
    __typename: 'products_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_aggregated_count'] | undefined;
    countDistinct?: GraphQLTypes['products_aggregated_count'] | undefined;
    avg?: GraphQLTypes['products_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['products_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['products_aggregated_fields'] | undefined;
    min?: GraphQLTypes['products_aggregated_fields'] | undefined;
    max?: GraphQLTypes['products_aggregated_fields'] | undefined;
  };
  ['products_aggregated_count']: {
    __typename: 'products_aggregated_count';
    brand_id?: number | undefined;
    clo3d_file?: number | undefined;
    created_at?: number | undefined;
    description?: number | undefined;
    discord_channel_id?: number | undefined;
    fulfiller_id?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
    nft_token_id?: number | undefined;
    notion_id?: number | undefined;
    price?: number | undefined;
    producer_id?: number | undefined;
    product_stage?: number | undefined;
    production_cost?: number | undefined;
    quantity?: number | undefined;
    release_date?: number | undefined;
    sale_currency?: number | undefined;
    sale_price?: number | undefined;
    sale_type?: number | undefined;
    season?: number | undefined;
    shopify_id?: number | undefined;
    status?: number | undefined;
    notes?: number | undefined;
    date_updated?: number | undefined;
    html_file?: number | undefined;
    thumbnail?: number | undefined;
    vrm_file?: number | undefined;
    contributors?: number | undefined;
    materials?: number | undefined;
    design_files?: number | undefined;
    content?: number | undefined;
    images?: number | undefined;
    wearable_files?: number | undefined;
    production_methods?: number | undefined;
    /** Invoices to clients for deposits */
    client_invoices?: number | undefined;
    /** Invoices from producers for production costs */
    production_invoices?: number | undefined;
  };
  ['products_aggregated_fields']: {
    __typename: 'products_aggregated_fields';
    brand_id?: number | undefined;
    fulfiller_id?: number | undefined;
    id?: number | undefined;
    nft_token_id?: number | undefined;
    price?: number | undefined;
    producer_id?: number | undefined;
    production_cost?: number | undefined;
    quantity?: number | undefined;
    sale_currency?: number | undefined;
    sale_price?: number | undefined;
    season?: number | undefined;
  };
  ['production_materials_aggregated']: {
    __typename: 'production_materials_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['production_materials_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['production_materials_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['production_materials_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['production_materials_aggregated_fields'] | undefined;
    avgDistinct?:
      | GraphQLTypes['production_materials_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['production_materials_aggregated_fields']
      | undefined;
    min?: GraphQLTypes['production_materials_aggregated_fields'] | undefined;
    max?: GraphQLTypes['production_materials_aggregated_fields'] | undefined;
  };
  ['production_materials_aggregated_count']: {
    __typename: 'production_materials_aggregated_count';
    base_price?: number | undefined;
    color_palette?: number | undefined;
    composition?: number | undefined;
    created_at?: number | undefined;
    created_by?: number | undefined;
    description?: number | undefined;
    gender?: number | undefined;
    id?: number | undefined;
    made_in?: number | undefined;
    name?: number | undefined;
    neck_tag?: number | undefined;
    note?: number | undefined;
    rating?: number | undefined;
    size_guide?: number | undefined;
    supplier?: number | undefined;
    tags?: number | undefined;
    production_methods?: number | undefined;
    stocked_at?: number | undefined;
    /** Design files, mockups, base meshes for wearbles, CLO3d files, etc */
    base_assets?: number | undefined;
  };
  ['production_materials_aggregated_fields']: {
    __typename: 'production_materials_aggregated_fields';
    base_price?: number | undefined;
    id?: number | undefined;
    supplier?: number | undefined;
  };
  ['invoices_aggregated']: {
    __typename: 'invoices_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['invoices_aggregated_count'] | undefined;
    countDistinct?: GraphQLTypes['invoices_aggregated_count'] | undefined;
    avg?: GraphQLTypes['invoices_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['invoices_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['invoices_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['invoices_aggregated_fields'] | undefined;
    min?: GraphQLTypes['invoices_aggregated_fields'] | undefined;
    max?: GraphQLTypes['invoices_aggregated_fields'] | undefined;
  };
  ['invoices_aggregated_count']: {
    __typename: 'invoices_aggregated_count';
    id?: number | undefined;
    user_created?: number | undefined;
    date_created?: number | undefined;
    user_updated?: number | undefined;
    date_updated?: number | undefined;
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: number | undefined;
    description?: number | undefined;
    status?: number | undefined;
    /** Invoice amount in USD */
    amount?: number | undefined;
    transaction_url?: number | undefined;
    /** The product that this production invoice is for */
    production_product_id?: number | undefined;
    /** Invoices to clients for a given product */
    client_product_id?: number | undefined;
  };
  ['invoices_aggregated_fields']: {
    __typename: 'invoices_aggregated_fields';
    id?: number | undefined;
    /** Invoice amount in USD */
    amount?: number | undefined;
    /** The product that this production invoice is for */
    production_product_id?: number | undefined;
    /** Invoices to clients for a given product */
    client_product_id?: number | undefined;
  };
  ['production_materials_files_aggregated']: {
    __typename: 'production_materials_files_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['production_materials_files_aggregated_count']
      | undefined;
    countDistinct?:
      | GraphQLTypes['production_materials_files_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['production_materials_files_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['production_materials_files_aggregated_fields']
      | undefined;
    avgDistinct?:
      | GraphQLTypes['production_materials_files_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['production_materials_files_aggregated_fields']
      | undefined;
    min?:
      | GraphQLTypes['production_materials_files_aggregated_fields']
      | undefined;
    max?:
      | GraphQLTypes['production_materials_files_aggregated_fields']
      | undefined;
  };
  ['production_materials_files_aggregated_count']: {
    __typename: 'production_materials_files_aggregated_count';
    directus_files_id?: number | undefined;
    id?: number | undefined;
    production_materials_id?: number | undefined;
  };
  ['production_materials_files_aggregated_fields']: {
    __typename: 'production_materials_files_aggregated_fields';
    id?: number | undefined;
    production_materials_id?: number | undefined;
  };
  ['Mutation']: {
    __typename: 'Mutation';
    create_brands_items: Array<GraphQLTypes['brands']>;
    create_brands_item?: GraphQLTypes['brands'] | undefined;
    create_brands_directus_users_items: Array<
      GraphQLTypes['brands_directus_users']
    >;
    create_brands_directus_users_item?:
      | GraphQLTypes['brands_directus_users']
      | undefined;
    create_collaborators_items: Array<GraphQLTypes['collaborators']>;
    create_collaborators_item?: GraphQLTypes['collaborators'] | undefined;
    create_collaborator_roles_items: Array<GraphQLTypes['collaborator_roles']>;
    create_collaborator_roles_item?:
      | GraphQLTypes['collaborator_roles']
      | undefined;
    create_junction_directus_users_skills_items: Array<
      GraphQLTypes['junction_directus_users_skills']
    >;
    create_junction_directus_users_skills_item?:
      | GraphQLTypes['junction_directus_users_skills']
      | undefined;
    create_skills_items: Array<GraphQLTypes['skills']>;
    create_skills_item?: GraphQLTypes['skills'] | undefined;
    create_producers_items: Array<GraphQLTypes['producers']>;
    create_producers_item?: GraphQLTypes['producers'] | undefined;
    create_producers_production_materials_items: Array<
      GraphQLTypes['producers_production_materials']
    >;
    create_producers_production_materials_item?:
      | GraphQLTypes['producers_production_materials']
      | undefined;
    create_producers_production_methods_items: Array<
      GraphQLTypes['producers_production_methods']
    >;
    create_producers_production_methods_item?:
      | GraphQLTypes['producers_production_methods']
      | undefined;
    create_production_methods_items: Array<GraphQLTypes['production_methods']>;
    create_production_methods_item?:
      | GraphQLTypes['production_methods']
      | undefined;
    create_production_materials_production_methods_items: Array<
      GraphQLTypes['production_materials_production_methods']
    >;
    create_production_materials_production_methods_item?:
      | GraphQLTypes['production_materials_production_methods']
      | undefined;
    create_fulfillers_items: Array<GraphQLTypes['fulfillers']>;
    create_fulfillers_item?: GraphQLTypes['fulfillers'] | undefined;
    create_price_currencies_items: Array<GraphQLTypes['price_currencies']>;
    create_price_currencies_item?: GraphQLTypes['price_currencies'] | undefined;
    create_stages_items: Array<GraphQLTypes['stages']>;
    create_stages_item?: GraphQLTypes['stages'] | undefined;
    create_currencies_items: Array<GraphQLTypes['currencies']>;
    create_currencies_item?: GraphQLTypes['currencies'] | undefined;
    create_products_content_items: Array<GraphQLTypes['products_content']>;
    create_products_content_item?: GraphQLTypes['products_content'] | undefined;
    create_products_contributors_items: Array<
      GraphQLTypes['products_contributors']
    >;
    create_products_contributors_item?:
      | GraphQLTypes['products_contributors']
      | undefined;
    create_products_design_files_items: Array<
      GraphQLTypes['products_design_files']
    >;
    create_products_design_files_item?:
      | GraphQLTypes['products_design_files']
      | undefined;
    create_products_files_items: Array<GraphQLTypes['products_files']>;
    create_products_files_item?: GraphQLTypes['products_files'] | undefined;
    create_products_production_materials_items: Array<
      GraphQLTypes['products_production_materials']
    >;
    create_products_production_materials_item?:
      | GraphQLTypes['products_production_materials']
      | undefined;
    create_products_production_methods_items: Array<
      GraphQLTypes['products_production_methods']
    >;
    create_products_production_methods_item?:
      | GraphQLTypes['products_production_methods']
      | undefined;
    create_products_wearables_items: Array<GraphQLTypes['products_wearables']>;
    create_products_wearables_item?:
      | GraphQLTypes['products_wearables']
      | undefined;
    create_file_formats_items: Array<GraphQLTypes['file_formats']>;
    create_file_formats_item?: GraphQLTypes['file_formats'] | undefined;
    create_products_items: Array<GraphQLTypes['products']>;
    create_products_item?: GraphQLTypes['products'] | undefined;
    create_production_materials_items: Array<
      GraphQLTypes['production_materials']
    >;
    create_production_materials_item?:
      | GraphQLTypes['production_materials']
      | undefined;
    create_invoices_items: Array<GraphQLTypes['invoices']>;
    create_invoices_item?: GraphQLTypes['invoices'] | undefined;
    create_production_materials_files_items: Array<
      GraphQLTypes['production_materials_files']
    >;
    create_production_materials_files_item?:
      | GraphQLTypes['production_materials_files']
      | undefined;
    update_brands_items: Array<GraphQLTypes['brands']>;
    update_brands_batch: Array<GraphQLTypes['brands']>;
    update_brands_item?: GraphQLTypes['brands'] | undefined;
    update_brands_directus_users_items: Array<
      GraphQLTypes['brands_directus_users']
    >;
    update_brands_directus_users_batch: Array<
      GraphQLTypes['brands_directus_users']
    >;
    update_brands_directus_users_item?:
      | GraphQLTypes['brands_directus_users']
      | undefined;
    update_collaborators_items: Array<GraphQLTypes['collaborators']>;
    update_collaborators_batch: Array<GraphQLTypes['collaborators']>;
    update_collaborators_item?: GraphQLTypes['collaborators'] | undefined;
    update_collaborator_roles_items: Array<GraphQLTypes['collaborator_roles']>;
    update_collaborator_roles_batch: Array<GraphQLTypes['collaborator_roles']>;
    update_collaborator_roles_item?:
      | GraphQLTypes['collaborator_roles']
      | undefined;
    update_junction_directus_users_skills_items: Array<
      GraphQLTypes['junction_directus_users_skills']
    >;
    update_junction_directus_users_skills_batch: Array<
      GraphQLTypes['junction_directus_users_skills']
    >;
    update_junction_directus_users_skills_item?:
      | GraphQLTypes['junction_directus_users_skills']
      | undefined;
    update_skills_items: Array<GraphQLTypes['skills']>;
    update_skills_batch: Array<GraphQLTypes['skills']>;
    update_skills_item?: GraphQLTypes['skills'] | undefined;
    update_producers_items: Array<GraphQLTypes['producers']>;
    update_producers_batch: Array<GraphQLTypes['producers']>;
    update_producers_item?: GraphQLTypes['producers'] | undefined;
    update_producers_production_materials_items: Array<
      GraphQLTypes['producers_production_materials']
    >;
    update_producers_production_materials_batch: Array<
      GraphQLTypes['producers_production_materials']
    >;
    update_producers_production_materials_item?:
      | GraphQLTypes['producers_production_materials']
      | undefined;
    update_producers_production_methods_items: Array<
      GraphQLTypes['producers_production_methods']
    >;
    update_producers_production_methods_batch: Array<
      GraphQLTypes['producers_production_methods']
    >;
    update_producers_production_methods_item?:
      | GraphQLTypes['producers_production_methods']
      | undefined;
    update_production_methods_items: Array<GraphQLTypes['production_methods']>;
    update_production_methods_batch: Array<GraphQLTypes['production_methods']>;
    update_production_methods_item?:
      | GraphQLTypes['production_methods']
      | undefined;
    update_production_materials_production_methods_items: Array<
      GraphQLTypes['production_materials_production_methods']
    >;
    update_production_materials_production_methods_batch: Array<
      GraphQLTypes['production_materials_production_methods']
    >;
    update_production_materials_production_methods_item?:
      | GraphQLTypes['production_materials_production_methods']
      | undefined;
    update_fulfillers_items: Array<GraphQLTypes['fulfillers']>;
    update_fulfillers_batch: Array<GraphQLTypes['fulfillers']>;
    update_fulfillers_item?: GraphQLTypes['fulfillers'] | undefined;
    update_price_currencies_items: Array<GraphQLTypes['price_currencies']>;
    update_price_currencies_batch: Array<GraphQLTypes['price_currencies']>;
    update_price_currencies_item?: GraphQLTypes['price_currencies'] | undefined;
    update_stages_items: Array<GraphQLTypes['stages']>;
    update_stages_batch: Array<GraphQLTypes['stages']>;
    update_stages_item?: GraphQLTypes['stages'] | undefined;
    update_currencies_items: Array<GraphQLTypes['currencies']>;
    update_currencies_batch: Array<GraphQLTypes['currencies']>;
    update_currencies_item?: GraphQLTypes['currencies'] | undefined;
    update_products_content_items: Array<GraphQLTypes['products_content']>;
    update_products_content_batch: Array<GraphQLTypes['products_content']>;
    update_products_content_item?: GraphQLTypes['products_content'] | undefined;
    update_products_contributors_items: Array<
      GraphQLTypes['products_contributors']
    >;
    update_products_contributors_batch: Array<
      GraphQLTypes['products_contributors']
    >;
    update_products_contributors_item?:
      | GraphQLTypes['products_contributors']
      | undefined;
    update_products_design_files_items: Array<
      GraphQLTypes['products_design_files']
    >;
    update_products_design_files_batch: Array<
      GraphQLTypes['products_design_files']
    >;
    update_products_design_files_item?:
      | GraphQLTypes['products_design_files']
      | undefined;
    update_products_files_items: Array<GraphQLTypes['products_files']>;
    update_products_files_batch: Array<GraphQLTypes['products_files']>;
    update_products_files_item?: GraphQLTypes['products_files'] | undefined;
    update_products_production_materials_items: Array<
      GraphQLTypes['products_production_materials']
    >;
    update_products_production_materials_batch: Array<
      GraphQLTypes['products_production_materials']
    >;
    update_products_production_materials_item?:
      | GraphQLTypes['products_production_materials']
      | undefined;
    update_products_production_methods_items: Array<
      GraphQLTypes['products_production_methods']
    >;
    update_products_production_methods_batch: Array<
      GraphQLTypes['products_production_methods']
    >;
    update_products_production_methods_item?:
      | GraphQLTypes['products_production_methods']
      | undefined;
    update_products_wearables_items: Array<GraphQLTypes['products_wearables']>;
    update_products_wearables_batch: Array<GraphQLTypes['products_wearables']>;
    update_products_wearables_item?:
      | GraphQLTypes['products_wearables']
      | undefined;
    update_file_formats_items: Array<GraphQLTypes['file_formats']>;
    update_file_formats_batch: Array<GraphQLTypes['file_formats']>;
    update_file_formats_item?: GraphQLTypes['file_formats'] | undefined;
    update_products_items: Array<GraphQLTypes['products']>;
    update_products_batch: Array<GraphQLTypes['products']>;
    update_products_item?: GraphQLTypes['products'] | undefined;
    update_production_materials_items: Array<
      GraphQLTypes['production_materials']
    >;
    update_production_materials_batch: Array<
      GraphQLTypes['production_materials']
    >;
    update_production_materials_item?:
      | GraphQLTypes['production_materials']
      | undefined;
    update_invoices_items: Array<GraphQLTypes['invoices']>;
    update_invoices_batch: Array<GraphQLTypes['invoices']>;
    update_invoices_item?: GraphQLTypes['invoices'] | undefined;
    update_production_materials_files_items: Array<
      GraphQLTypes['production_materials_files']
    >;
    update_production_materials_files_batch: Array<
      GraphQLTypes['production_materials_files']
    >;
    update_production_materials_files_item?:
      | GraphQLTypes['production_materials_files']
      | undefined;
    delete_brands_items?: GraphQLTypes['delete_many'] | undefined;
    delete_brands_item?: GraphQLTypes['delete_one'] | undefined;
    delete_brands_directus_users_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_brands_directus_users_item?: GraphQLTypes['delete_one'] | undefined;
    delete_collaborators_items?: GraphQLTypes['delete_many'] | undefined;
    delete_collaborators_item?: GraphQLTypes['delete_one'] | undefined;
    delete_collaborator_roles_items?: GraphQLTypes['delete_many'] | undefined;
    delete_collaborator_roles_item?: GraphQLTypes['delete_one'] | undefined;
    delete_junction_directus_users_skills_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_junction_directus_users_skills_item?:
      | GraphQLTypes['delete_one']
      | undefined;
    delete_skills_items?: GraphQLTypes['delete_many'] | undefined;
    delete_skills_item?: GraphQLTypes['delete_one'] | undefined;
    delete_producers_items?: GraphQLTypes['delete_many'] | undefined;
    delete_producers_item?: GraphQLTypes['delete_one'] | undefined;
    delete_producers_production_materials_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_producers_production_materials_item?:
      | GraphQLTypes['delete_one']
      | undefined;
    delete_producers_production_methods_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_producers_production_methods_item?:
      | GraphQLTypes['delete_one']
      | undefined;
    delete_production_methods_items?: GraphQLTypes['delete_many'] | undefined;
    delete_production_methods_item?: GraphQLTypes['delete_one'] | undefined;
    delete_production_materials_production_methods_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_production_materials_production_methods_item?:
      | GraphQLTypes['delete_one']
      | undefined;
    delete_fulfillers_items?: GraphQLTypes['delete_many'] | undefined;
    delete_fulfillers_item?: GraphQLTypes['delete_one'] | undefined;
    delete_price_currencies_items?: GraphQLTypes['delete_many'] | undefined;
    delete_price_currencies_item?: GraphQLTypes['delete_one'] | undefined;
    delete_stages_items?: GraphQLTypes['delete_many'] | undefined;
    delete_stages_item?: GraphQLTypes['delete_one'] | undefined;
    delete_currencies_items?: GraphQLTypes['delete_many'] | undefined;
    delete_currencies_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_content_items?: GraphQLTypes['delete_many'] | undefined;
    delete_products_content_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_contributors_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_products_contributors_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_design_files_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_products_design_files_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_files_items?: GraphQLTypes['delete_many'] | undefined;
    delete_products_files_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_production_materials_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_products_production_materials_item?:
      | GraphQLTypes['delete_one']
      | undefined;
    delete_products_production_methods_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_products_production_methods_item?:
      | GraphQLTypes['delete_one']
      | undefined;
    delete_products_wearables_items?: GraphQLTypes['delete_many'] | undefined;
    delete_products_wearables_item?: GraphQLTypes['delete_one'] | undefined;
    delete_file_formats_items?: GraphQLTypes['delete_many'] | undefined;
    delete_file_formats_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_items?: GraphQLTypes['delete_many'] | undefined;
    delete_products_item?: GraphQLTypes['delete_one'] | undefined;
    delete_production_materials_items?: GraphQLTypes['delete_many'] | undefined;
    delete_production_materials_item?: GraphQLTypes['delete_one'] | undefined;
    delete_invoices_items?: GraphQLTypes['delete_many'] | undefined;
    delete_invoices_item?: GraphQLTypes['delete_one'] | undefined;
    delete_production_materials_files_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_production_materials_files_item?:
      | GraphQLTypes['delete_one']
      | undefined;
  };
  ['create_brands_input']: {
    created_at?: GraphQLTypes['Date'] | undefined;
    description?: string | undefined;
    discord_url?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    logo?: GraphQLTypes['create_directus_files_input'] | undefined;
    name: string;
    notion_id?: string | undefined;
    twitter_url?: string | undefined;
    website_url?: string | undefined;
    products?:
      | Array<GraphQLTypes['create_products_input'] | undefined>
      | undefined;
    users?:
      | Array<GraphQLTypes['create_brands_directus_users_input'] | undefined>
      | undefined;
  };
  ['create_directus_files_input']: {
    id?: string | undefined;
    storage: string;
    filename_disk?: string | undefined;
    filename_download: string;
    title?: string | undefined;
    type?: string | undefined;
    folder?: GraphQLTypes['create_directus_folders_input'] | undefined;
    uploaded_by?: GraphQLTypes['create_directus_users_input'] | undefined;
    uploaded_on?: GraphQLTypes['Date'] | undefined;
    modified_by?: GraphQLTypes['create_directus_users_input'] | undefined;
    modified_on?: GraphQLTypes['Date'] | undefined;
    charset?: string | undefined;
    filesize?: GraphQLTypes['GraphQLBigInt'] | undefined;
    width?: number | undefined;
    height?: number | undefined;
    duration?: number | undefined;
    embed?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    metadata?: GraphQLTypes['JSON'] | undefined;
  };
  ['create_directus_folders_input']: {
    id?: string | undefined;
    name: string;
    parent?: GraphQLTypes['create_directus_folders_input'] | undefined;
  };
  ['create_directus_users_input']: {
    id?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    email?: string | undefined;
    password?: GraphQLTypes['Hash'] | undefined;
    location?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    avatar?: GraphQLTypes['create_directus_files_input'] | undefined;
    language?: string | undefined;
    theme?: string | undefined;
    tfa_secret?: GraphQLTypes['Hash'] | undefined;
    status?: string | undefined;
    role?: GraphQLTypes['create_directus_roles_input'] | undefined;
    token?: GraphQLTypes['Hash'] | undefined;
    last_access?: GraphQLTypes['Date'] | undefined;
    last_page?: string | undefined;
    provider?: string | undefined;
    external_identifier?: string | undefined;
    auth_data?: GraphQLTypes['JSON'] | undefined;
    email_notifications?: boolean | undefined;
    discord_handle?: string | undefined;
    discord_id?: string | undefined;
    timezone?: string | undefined;
    twitter_handle?: string | undefined;
    collaborators?:
      | Array<GraphQLTypes['create_collaborators_input'] | undefined>
      | undefined;
    skills?:
      | Array<
          | GraphQLTypes['create_junction_directus_users_skills_input']
          | undefined
        >
      | undefined;
  };
  ['create_directus_roles_input']: {
    id?: string | undefined;
    name: string;
    icon?: string | undefined;
    description?: string | undefined;
    ip_access?: Array<string | undefined> | undefined;
    enforce_tfa: boolean;
    admin_access: boolean;
    app_access?: boolean | undefined;
    users?:
      | Array<GraphQLTypes['create_directus_users_input'] | undefined>
      | undefined;
  };
  ['create_collaborators_input']: {
    account?: GraphQLTypes['create_directus_users_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_updated?: GraphQLTypes['Date'] | undefined;
    display_name?: string | undefined;
    id?: string | undefined;
    payment_eth_address?: string | undefined;
    role?: GraphQLTypes['create_collaborator_roles_input'] | undefined;
    user_created?: GraphQLTypes['create_directus_users_input'] | undefined;
  };
  ['create_collaborator_roles_input']: {
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
  };
  ['create_junction_directus_users_skills_input']: {
    directus_users_id?: GraphQLTypes['create_directus_users_input'] | undefined;
    id?: string | undefined;
    skills_id?: GraphQLTypes['create_skills_input'] | undefined;
  };
  ['create_skills_input']: {
    description?: string | undefined;
    id?: string | undefined;
    name: string;
  };
  ['create_products_input']: {
    brand_id?: GraphQLTypes['create_brands_input'] | undefined;
    clo3d_file?: GraphQLTypes['create_directus_files_input'] | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    description?: string | undefined;
    discord_channel_id?: string | undefined;
    fulfiller_id?: GraphQLTypes['create_fulfillers_input'] | undefined;
    id?: string | undefined;
    name: string;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    price?: GraphQLTypes['create_price_currencies_input'] | undefined;
    producer_id?: GraphQLTypes['create_producers_input'] | undefined;
    product_stage?: GraphQLTypes['create_stages_input'] | undefined;
    production_cost?: number | undefined;
    quantity?: GraphQLTypes['GraphQLBigInt'] | undefined;
    release_date?: GraphQLTypes['Date'] | undefined;
    sale_currency?: GraphQLTypes['create_currencies_input'] | undefined;
    sale_price?: number | undefined;
    sale_type?: string | undefined;
    season?: number | undefined;
    shopify_id?: string | undefined;
    status?: string | undefined;
    notes?: string | undefined;
    date_updated?: GraphQLTypes['Date'] | undefined;
    html_file?: GraphQLTypes['create_directus_files_input'] | undefined;
    thumbnail?: GraphQLTypes['create_directus_files_input'] | undefined;
    vrm_file?: GraphQLTypes['create_directus_files_input'] | undefined;
    contributors?:
      | Array<GraphQLTypes['create_products_contributors_input'] | undefined>
      | undefined;
    materials?:
      | Array<
          GraphQLTypes['create_products_production_materials_input'] | undefined
        >
      | undefined;
    design_files?:
      | Array<GraphQLTypes['create_products_design_files_input'] | undefined>
      | undefined;
    content?:
      | Array<GraphQLTypes['create_products_content_input'] | undefined>
      | undefined;
    images?:
      | Array<GraphQLTypes['create_products_files_input'] | undefined>
      | undefined;
    wearable_files?:
      | Array<GraphQLTypes['create_products_wearables_input'] | undefined>
      | undefined;
    production_methods?:
      | Array<
          GraphQLTypes['create_products_production_methods_input'] | undefined
        >
      | undefined;
    client_invoices?:
      | Array<GraphQLTypes['create_invoices_input'] | undefined>
      | undefined;
    production_invoices?:
      | Array<GraphQLTypes['create_invoices_input'] | undefined>
      | undefined;
  };
  ['create_fulfillers_input']: {
    address?: string | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    email?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    website_url?: string | undefined;
  };
  ['create_price_currencies_input']: {
    amount: number;
    currency?: string | undefined;
    id?: string | undefined;
  };
  ['create_producers_input']: {
    created_at?: GraphQLTypes['Date'] | undefined;
    email?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    shipping_address?: string | undefined;
    production_materials_stocked?:
      | Array<
          | GraphQLTypes['create_producers_production_materials_input']
          | undefined
        >
      | undefined;
    production_methods?:
      | Array<
          GraphQLTypes['create_producers_production_methods_input'] | undefined
        >
      | undefined;
    supplied_materials?:
      | Array<GraphQLTypes['create_production_materials_input'] | undefined>
      | undefined;
  };
  ['create_producers_production_materials_input']: {
    id?: string | undefined;
    producers_id?: GraphQLTypes['create_producers_input'] | undefined;
    production_materials_id?:
      | GraphQLTypes['create_production_materials_input']
      | undefined;
    quantity?: number | undefined;
  };
  ['create_production_materials_input']: {
    base_price?: number | undefined;
    color_palette?: GraphQLTypes['JSON'] | undefined;
    composition?: string | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    created_by?: GraphQLTypes['create_directus_users_input'] | undefined;
    description?: string | undefined;
    gender?: string | undefined;
    id?: string | undefined;
    made_in?: string | undefined;
    name?: string | undefined;
    neck_tag?: boolean | undefined;
    note?: string | undefined;
    rating?: string | undefined;
    size_guide?: GraphQLTypes['create_directus_files_input'] | undefined;
    supplier?: GraphQLTypes['create_producers_input'] | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    production_methods?:
      | Array<
          | GraphQLTypes['create_production_materials_production_methods_input']
          | undefined
        >
      | undefined;
    stocked_at?:
      | Array<
          | GraphQLTypes['create_producers_production_materials_input']
          | undefined
        >
      | undefined;
    base_assets?:
      | Array<
          GraphQLTypes['create_production_materials_files_input'] | undefined
        >
      | undefined;
  };
  ['create_production_materials_production_methods_input']: {
    id?: string | undefined;
    production_materials_id?:
      | GraphQLTypes['create_production_materials_input']
      | undefined;
    production_methods_id?:
      | GraphQLTypes['create_production_methods_input']
      | undefined;
  };
  ['create_production_methods_input']: {
    created_at?: GraphQLTypes['Date'] | undefined;
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    producers?:
      | Array<
          GraphQLTypes['create_producers_production_methods_input'] | undefined
        >
      | undefined;
    production_materials?:
      | Array<
          | GraphQLTypes['create_production_materials_production_methods_input']
          | undefined
        >
      | undefined;
  };
  ['create_producers_production_methods_input']: {
    id?: string | undefined;
    producers_id?: GraphQLTypes['create_producers_input'] | undefined;
    production_methods_id?:
      | GraphQLTypes['create_production_methods_input']
      | undefined;
  };
  ['create_production_materials_files_input']: {
    directus_files_id?: GraphQLTypes['create_directus_files_input'] | undefined;
    id?: string | undefined;
    production_materials_id?:
      | GraphQLTypes['create_production_materials_input']
      | undefined;
  };
  ['create_stages_input']: {
    description?: string | undefined;
    name: string;
    sort?: number | undefined;
  };
  ['create_currencies_input']: {
    currency: string;
    id?: string | undefined;
  };
  ['create_products_contributors_input']: {
    collaborators_id?: GraphQLTypes['create_collaborators_input'] | undefined;
    contribution_share?: number | undefined;
    id?: string | undefined;
    products_id?: GraphQLTypes['create_products_input'] | undefined;
    robot_earned?: number | undefined;
  };
  ['create_products_production_materials_input']: {
    id?: string | undefined;
    production_materials_id?:
      | GraphQLTypes['create_production_materials_input']
      | undefined;
    products_id?: GraphQLTypes['create_products_input'] | undefined;
  };
  ['create_products_design_files_input']: {
    directus_files_id?: GraphQLTypes['create_directus_files_input'] | undefined;
    id?: string | undefined;
    products_id?: GraphQLTypes['create_products_input'] | undefined;
  };
  ['create_products_content_input']: {
    directus_files_id?: GraphQLTypes['create_directus_files_input'] | undefined;
    id?: string | undefined;
    products_id?: GraphQLTypes['create_products_input'] | undefined;
  };
  ['create_products_files_input']: {
    directus_files_id?: GraphQLTypes['create_directus_files_input'] | undefined;
    id?: string | undefined;
    products_id?: GraphQLTypes['create_products_input'] | undefined;
  };
  ['create_products_wearables_input']: {
    directus_files_id?: GraphQLTypes['create_directus_files_input'] | undefined;
    file_format?: GraphQLTypes['create_file_formats_input'] | undefined;
    id?: string | undefined;
    primary?: boolean | undefined;
    products_id?: GraphQLTypes['create_products_input'] | undefined;
  };
  ['create_file_formats_input']: {
    description?: string | undefined;
    extension?: string | undefined;
    id?: string | undefined;
    mime_type?: string | undefined;
    name: string;
  };
  ['create_products_production_methods_input']: {
    id?: string | undefined;
    production_methods_id?:
      | GraphQLTypes['create_production_methods_input']
      | undefined;
    products_id?: GraphQLTypes['create_products_input'] | undefined;
  };
  ['create_invoices_input']: {
    id?: string | undefined;
    user_created?: GraphQLTypes['create_directus_users_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    user_updated?: GraphQLTypes['create_directus_users_input'] | undefined;
    date_updated?: GraphQLTypes['Date'] | undefined;
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: string | undefined;
    description: string;
    status?: string | undefined;
    /** Invoice amount in USD */
    amount?: number | undefined;
    transaction_url?: string | undefined;
    production_product_id?: GraphQLTypes['create_products_input'] | undefined;
    client_product_id?: GraphQLTypes['create_products_input'] | undefined;
  };
  ['create_brands_directus_users_input']: {
    brands_id?: GraphQLTypes['create_brands_input'] | undefined;
    directus_users_id?: GraphQLTypes['create_directus_users_input'] | undefined;
    id?: string | undefined;
  };
  ['update_brands_input']: {
    created_at?: GraphQLTypes['Date'] | undefined;
    description?: string | undefined;
    discord_url?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    logo?: GraphQLTypes['update_directus_files_input'] | undefined;
    name?: string | undefined;
    notion_id?: string | undefined;
    twitter_url?: string | undefined;
    website_url?: string | undefined;
    products?:
      | Array<GraphQLTypes['update_products_input'] | undefined>
      | undefined;
    users?:
      | Array<GraphQLTypes['update_brands_directus_users_input'] | undefined>
      | undefined;
  };
  ['update_directus_files_input']: {
    id?: string | undefined;
    storage?: string | undefined;
    filename_disk?: string | undefined;
    filename_download?: string | undefined;
    title?: string | undefined;
    type?: string | undefined;
    folder?: GraphQLTypes['update_directus_folders_input'] | undefined;
    uploaded_by?: GraphQLTypes['update_directus_users_input'] | undefined;
    uploaded_on?: GraphQLTypes['Date'] | undefined;
    modified_by?: GraphQLTypes['update_directus_users_input'] | undefined;
    modified_on?: GraphQLTypes['Date'] | undefined;
    charset?: string | undefined;
    filesize?: GraphQLTypes['GraphQLBigInt'] | undefined;
    width?: number | undefined;
    height?: number | undefined;
    duration?: number | undefined;
    embed?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    metadata?: GraphQLTypes['JSON'] | undefined;
  };
  ['update_directus_folders_input']: {
    id?: string | undefined;
    name?: string | undefined;
    parent?: GraphQLTypes['update_directus_folders_input'] | undefined;
  };
  ['update_directus_users_input']: {
    id?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    email?: string | undefined;
    password?: GraphQLTypes['Hash'] | undefined;
    location?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    avatar?: GraphQLTypes['update_directus_files_input'] | undefined;
    language?: string | undefined;
    theme?: string | undefined;
    tfa_secret?: GraphQLTypes['Hash'] | undefined;
    status?: string | undefined;
    role?: GraphQLTypes['update_directus_roles_input'] | undefined;
    token?: GraphQLTypes['Hash'] | undefined;
    last_access?: GraphQLTypes['Date'] | undefined;
    last_page?: string | undefined;
    provider?: string | undefined;
    external_identifier?: string | undefined;
    auth_data?: GraphQLTypes['JSON'] | undefined;
    email_notifications?: boolean | undefined;
    discord_handle?: string | undefined;
    discord_id?: string | undefined;
    timezone?: string | undefined;
    twitter_handle?: string | undefined;
    collaborators?:
      | Array<GraphQLTypes['update_collaborators_input'] | undefined>
      | undefined;
    skills?:
      | Array<
          | GraphQLTypes['update_junction_directus_users_skills_input']
          | undefined
        >
      | undefined;
  };
  ['update_directus_roles_input']: {
    id?: string | undefined;
    name?: string | undefined;
    icon?: string | undefined;
    description?: string | undefined;
    ip_access?: Array<string | undefined> | undefined;
    enforce_tfa?: boolean | undefined;
    admin_access?: boolean | undefined;
    app_access?: boolean | undefined;
    users?:
      | Array<GraphQLTypes['update_directus_users_input'] | undefined>
      | undefined;
  };
  ['update_collaborators_input']: {
    account?: GraphQLTypes['update_directus_users_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_updated?: GraphQLTypes['Date'] | undefined;
    display_name?: string | undefined;
    id?: string | undefined;
    payment_eth_address?: string | undefined;
    role?: GraphQLTypes['update_collaborator_roles_input'] | undefined;
    user_created?: GraphQLTypes['update_directus_users_input'] | undefined;
  };
  ['update_collaborator_roles_input']: {
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
  };
  ['update_junction_directus_users_skills_input']: {
    directus_users_id?: GraphQLTypes['update_directus_users_input'] | undefined;
    id?: string | undefined;
    skills_id?: GraphQLTypes['update_skills_input'] | undefined;
  };
  ['update_skills_input']: {
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
  };
  ['update_products_input']: {
    brand_id?: GraphQLTypes['update_brands_input'] | undefined;
    clo3d_file?: GraphQLTypes['update_directus_files_input'] | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    description?: string | undefined;
    discord_channel_id?: string | undefined;
    fulfiller_id?: GraphQLTypes['update_fulfillers_input'] | undefined;
    id?: string | undefined;
    name?: string | undefined;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    price?: GraphQLTypes['update_price_currencies_input'] | undefined;
    producer_id?: GraphQLTypes['update_producers_input'] | undefined;
    product_stage?: GraphQLTypes['update_stages_input'] | undefined;
    production_cost?: number | undefined;
    quantity?: GraphQLTypes['GraphQLBigInt'] | undefined;
    release_date?: GraphQLTypes['Date'] | undefined;
    sale_currency?: GraphQLTypes['update_currencies_input'] | undefined;
    sale_price?: number | undefined;
    sale_type?: string | undefined;
    season?: number | undefined;
    shopify_id?: string | undefined;
    status?: string | undefined;
    notes?: string | undefined;
    date_updated?: GraphQLTypes['Date'] | undefined;
    html_file?: GraphQLTypes['update_directus_files_input'] | undefined;
    thumbnail?: GraphQLTypes['update_directus_files_input'] | undefined;
    vrm_file?: GraphQLTypes['update_directus_files_input'] | undefined;
    contributors?:
      | Array<GraphQLTypes['update_products_contributors_input'] | undefined>
      | undefined;
    materials?:
      | Array<
          GraphQLTypes['update_products_production_materials_input'] | undefined
        >
      | undefined;
    design_files?:
      | Array<GraphQLTypes['update_products_design_files_input'] | undefined>
      | undefined;
    content?:
      | Array<GraphQLTypes['update_products_content_input'] | undefined>
      | undefined;
    images?:
      | Array<GraphQLTypes['update_products_files_input'] | undefined>
      | undefined;
    wearable_files?:
      | Array<GraphQLTypes['update_products_wearables_input'] | undefined>
      | undefined;
    production_methods?:
      | Array<
          GraphQLTypes['update_products_production_methods_input'] | undefined
        >
      | undefined;
    client_invoices?:
      | Array<GraphQLTypes['update_invoices_input'] | undefined>
      | undefined;
    production_invoices?:
      | Array<GraphQLTypes['update_invoices_input'] | undefined>
      | undefined;
  };
  ['update_fulfillers_input']: {
    address?: string | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    email?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    website_url?: string | undefined;
  };
  ['update_price_currencies_input']: {
    amount?: number | undefined;
    currency?: string | undefined;
    id?: string | undefined;
  };
  ['update_producers_input']: {
    created_at?: GraphQLTypes['Date'] | undefined;
    email?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    shipping_address?: string | undefined;
    production_materials_stocked?:
      | Array<
          | GraphQLTypes['update_producers_production_materials_input']
          | undefined
        >
      | undefined;
    production_methods?:
      | Array<
          GraphQLTypes['update_producers_production_methods_input'] | undefined
        >
      | undefined;
    supplied_materials?:
      | Array<GraphQLTypes['update_production_materials_input'] | undefined>
      | undefined;
  };
  ['update_producers_production_materials_input']: {
    id?: string | undefined;
    producers_id?: GraphQLTypes['update_producers_input'] | undefined;
    production_materials_id?:
      | GraphQLTypes['update_production_materials_input']
      | undefined;
    quantity?: number | undefined;
  };
  ['update_production_materials_input']: {
    base_price?: number | undefined;
    color_palette?: GraphQLTypes['JSON'] | undefined;
    composition?: string | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    created_by?: GraphQLTypes['update_directus_users_input'] | undefined;
    description?: string | undefined;
    gender?: string | undefined;
    id?: string | undefined;
    made_in?: string | undefined;
    name?: string | undefined;
    neck_tag?: boolean | undefined;
    note?: string | undefined;
    rating?: string | undefined;
    size_guide?: GraphQLTypes['update_directus_files_input'] | undefined;
    supplier?: GraphQLTypes['update_producers_input'] | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    production_methods?:
      | Array<
          | GraphQLTypes['update_production_materials_production_methods_input']
          | undefined
        >
      | undefined;
    stocked_at?:
      | Array<
          | GraphQLTypes['update_producers_production_materials_input']
          | undefined
        >
      | undefined;
    base_assets?:
      | Array<
          GraphQLTypes['update_production_materials_files_input'] | undefined
        >
      | undefined;
  };
  ['update_production_materials_production_methods_input']: {
    id?: string | undefined;
    production_materials_id?:
      | GraphQLTypes['update_production_materials_input']
      | undefined;
    production_methods_id?:
      | GraphQLTypes['update_production_methods_input']
      | undefined;
  };
  ['update_production_methods_input']: {
    created_at?: GraphQLTypes['Date'] | undefined;
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    producers?:
      | Array<
          GraphQLTypes['update_producers_production_methods_input'] | undefined
        >
      | undefined;
    production_materials?:
      | Array<
          | GraphQLTypes['update_production_materials_production_methods_input']
          | undefined
        >
      | undefined;
  };
  ['update_producers_production_methods_input']: {
    id?: string | undefined;
    producers_id?: GraphQLTypes['update_producers_input'] | undefined;
    production_methods_id?:
      | GraphQLTypes['update_production_methods_input']
      | undefined;
  };
  ['update_production_materials_files_input']: {
    directus_files_id?: GraphQLTypes['update_directus_files_input'] | undefined;
    id?: string | undefined;
    production_materials_id?:
      | GraphQLTypes['update_production_materials_input']
      | undefined;
  };
  ['update_stages_input']: {
    description?: string | undefined;
    name?: string | undefined;
    sort?: number | undefined;
  };
  ['update_currencies_input']: {
    currency?: string | undefined;
    id?: string | undefined;
  };
  ['update_products_contributors_input']: {
    collaborators_id?: GraphQLTypes['update_collaborators_input'] | undefined;
    contribution_share?: number | undefined;
    id?: string | undefined;
    products_id?: GraphQLTypes['update_products_input'] | undefined;
    robot_earned?: number | undefined;
  };
  ['update_products_production_materials_input']: {
    id?: string | undefined;
    production_materials_id?:
      | GraphQLTypes['update_production_materials_input']
      | undefined;
    products_id?: GraphQLTypes['update_products_input'] | undefined;
  };
  ['update_products_design_files_input']: {
    directus_files_id?: GraphQLTypes['update_directus_files_input'] | undefined;
    id?: string | undefined;
    products_id?: GraphQLTypes['update_products_input'] | undefined;
  };
  ['update_products_content_input']: {
    directus_files_id?: GraphQLTypes['update_directus_files_input'] | undefined;
    id?: string | undefined;
    products_id?: GraphQLTypes['update_products_input'] | undefined;
  };
  ['update_products_files_input']: {
    directus_files_id?: GraphQLTypes['update_directus_files_input'] | undefined;
    id?: string | undefined;
    products_id?: GraphQLTypes['update_products_input'] | undefined;
  };
  ['update_products_wearables_input']: {
    directus_files_id?: GraphQLTypes['update_directus_files_input'] | undefined;
    file_format?: GraphQLTypes['update_file_formats_input'] | undefined;
    id?: string | undefined;
    primary?: boolean | undefined;
    products_id?: GraphQLTypes['update_products_input'] | undefined;
  };
  ['update_file_formats_input']: {
    description?: string | undefined;
    extension?: string | undefined;
    id?: string | undefined;
    mime_type?: string | undefined;
    name?: string | undefined;
  };
  ['update_products_production_methods_input']: {
    id?: string | undefined;
    production_methods_id?:
      | GraphQLTypes['update_production_methods_input']
      | undefined;
    products_id?: GraphQLTypes['update_products_input'] | undefined;
  };
  ['update_invoices_input']: {
    id?: string | undefined;
    user_created?: GraphQLTypes['update_directus_users_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    user_updated?: GraphQLTypes['update_directus_users_input'] | undefined;
    date_updated?: GraphQLTypes['Date'] | undefined;
    /** Any relevant info / recipients / links / images / files for this invoice */
    details?: string | undefined;
    description?: string | undefined;
    status?: string | undefined;
    /** Invoice amount in USD */
    amount?: number | undefined;
    transaction_url?: string | undefined;
    production_product_id?: GraphQLTypes['update_products_input'] | undefined;
    client_product_id?: GraphQLTypes['update_products_input'] | undefined;
  };
  ['update_brands_directus_users_input']: {
    brands_id?: GraphQLTypes['update_brands_input'] | undefined;
    directus_users_id?: GraphQLTypes['update_directus_users_input'] | undefined;
    id?: string | undefined;
  };
  ['delete_many']: {
    __typename: 'delete_many';
    ids: Array<string | undefined>;
  };
  ['delete_one']: {
    __typename: 'delete_one';
    id: string;
  };
};

type ZEUS_VARIABLES = {
  ['Date']: ValueTypes['Date'];
  ['directus_folders_filter']: ValueTypes['directus_folders_filter'];
  ['string_filter_operators']: ValueTypes['string_filter_operators'];
  ['Hash']: ValueTypes['Hash'];
  ['JSON']: ValueTypes['JSON'];
  ['directus_files_filter']: ValueTypes['directus_files_filter'];
  ['directus_users_filter']: ValueTypes['directus_users_filter'];
  ['hash_filter_operators']: ValueTypes['hash_filter_operators'];
  ['count_function_filter_operators']: ValueTypes['count_function_filter_operators'];
  ['number_filter_operators']: ValueTypes['number_filter_operators'];
  ['GraphQLStringOrFloat']: ValueTypes['GraphQLStringOrFloat'];
  ['directus_roles_filter']: ValueTypes['directus_roles_filter'];
  ['boolean_filter_operators']: ValueTypes['boolean_filter_operators'];
  ['date_filter_operators']: ValueTypes['date_filter_operators'];
  ['datetime_function_filter_operators']: ValueTypes['datetime_function_filter_operators'];
  ['collaborators_filter']: ValueTypes['collaborators_filter'];
  ['collaborator_roles_filter']: ValueTypes['collaborator_roles_filter'];
  ['junction_directus_users_skills_filter']: ValueTypes['junction_directus_users_skills_filter'];
  ['skills_filter']: ValueTypes['skills_filter'];
  ['GraphQLBigInt']: ValueTypes['GraphQLBigInt'];
  ['brands_filter']: ValueTypes['brands_filter'];
  ['products_filter']: ValueTypes['products_filter'];
  ['fulfillers_filter']: ValueTypes['fulfillers_filter'];
  ['price_currencies_filter']: ValueTypes['price_currencies_filter'];
  ['producers_filter']: ValueTypes['producers_filter'];
  ['producers_production_materials_filter']: ValueTypes['producers_production_materials_filter'];
  ['production_materials_filter']: ValueTypes['production_materials_filter'];
  ['production_materials_production_methods_filter']: ValueTypes['production_materials_production_methods_filter'];
  ['production_methods_filter']: ValueTypes['production_methods_filter'];
  ['producers_production_methods_filter']: ValueTypes['producers_production_methods_filter'];
  ['production_materials_files_filter']: ValueTypes['production_materials_files_filter'];
  ['stages_filter']: ValueTypes['stages_filter'];
  ['currencies_filter']: ValueTypes['currencies_filter'];
  ['products_contributors_filter']: ValueTypes['products_contributors_filter'];
  ['products_production_materials_filter']: ValueTypes['products_production_materials_filter'];
  ['products_design_files_filter']: ValueTypes['products_design_files_filter'];
  ['products_content_filter']: ValueTypes['products_content_filter'];
  ['products_files_filter']: ValueTypes['products_files_filter'];
  ['products_wearables_filter']: ValueTypes['products_wearables_filter'];
  ['file_formats_filter']: ValueTypes['file_formats_filter'];
  ['products_production_methods_filter']: ValueTypes['products_production_methods_filter'];
  ['invoices_filter']: ValueTypes['invoices_filter'];
  ['brands_directus_users_filter']: ValueTypes['brands_directus_users_filter'];
  ['create_brands_input']: ValueTypes['create_brands_input'];
  ['create_directus_files_input']: ValueTypes['create_directus_files_input'];
  ['create_directus_folders_input']: ValueTypes['create_directus_folders_input'];
  ['create_directus_users_input']: ValueTypes['create_directus_users_input'];
  ['create_directus_roles_input']: ValueTypes['create_directus_roles_input'];
  ['create_collaborators_input']: ValueTypes['create_collaborators_input'];
  ['create_collaborator_roles_input']: ValueTypes['create_collaborator_roles_input'];
  ['create_junction_directus_users_skills_input']: ValueTypes['create_junction_directus_users_skills_input'];
  ['create_skills_input']: ValueTypes['create_skills_input'];
  ['create_products_input']: ValueTypes['create_products_input'];
  ['create_fulfillers_input']: ValueTypes['create_fulfillers_input'];
  ['create_price_currencies_input']: ValueTypes['create_price_currencies_input'];
  ['create_producers_input']: ValueTypes['create_producers_input'];
  ['create_producers_production_materials_input']: ValueTypes['create_producers_production_materials_input'];
  ['create_production_materials_input']: ValueTypes['create_production_materials_input'];
  ['create_production_materials_production_methods_input']: ValueTypes['create_production_materials_production_methods_input'];
  ['create_production_methods_input']: ValueTypes['create_production_methods_input'];
  ['create_producers_production_methods_input']: ValueTypes['create_producers_production_methods_input'];
  ['create_production_materials_files_input']: ValueTypes['create_production_materials_files_input'];
  ['create_stages_input']: ValueTypes['create_stages_input'];
  ['create_currencies_input']: ValueTypes['create_currencies_input'];
  ['create_products_contributors_input']: ValueTypes['create_products_contributors_input'];
  ['create_products_production_materials_input']: ValueTypes['create_products_production_materials_input'];
  ['create_products_design_files_input']: ValueTypes['create_products_design_files_input'];
  ['create_products_content_input']: ValueTypes['create_products_content_input'];
  ['create_products_files_input']: ValueTypes['create_products_files_input'];
  ['create_products_wearables_input']: ValueTypes['create_products_wearables_input'];
  ['create_file_formats_input']: ValueTypes['create_file_formats_input'];
  ['create_products_production_methods_input']: ValueTypes['create_products_production_methods_input'];
  ['create_invoices_input']: ValueTypes['create_invoices_input'];
  ['create_brands_directus_users_input']: ValueTypes['create_brands_directus_users_input'];
  ['update_brands_input']: ValueTypes['update_brands_input'];
  ['update_directus_files_input']: ValueTypes['update_directus_files_input'];
  ['update_directus_folders_input']: ValueTypes['update_directus_folders_input'];
  ['update_directus_users_input']: ValueTypes['update_directus_users_input'];
  ['update_directus_roles_input']: ValueTypes['update_directus_roles_input'];
  ['update_collaborators_input']: ValueTypes['update_collaborators_input'];
  ['update_collaborator_roles_input']: ValueTypes['update_collaborator_roles_input'];
  ['update_junction_directus_users_skills_input']: ValueTypes['update_junction_directus_users_skills_input'];
  ['update_skills_input']: ValueTypes['update_skills_input'];
  ['update_products_input']: ValueTypes['update_products_input'];
  ['update_fulfillers_input']: ValueTypes['update_fulfillers_input'];
  ['update_price_currencies_input']: ValueTypes['update_price_currencies_input'];
  ['update_producers_input']: ValueTypes['update_producers_input'];
  ['update_producers_production_materials_input']: ValueTypes['update_producers_production_materials_input'];
  ['update_production_materials_input']: ValueTypes['update_production_materials_input'];
  ['update_production_materials_production_methods_input']: ValueTypes['update_production_materials_production_methods_input'];
  ['update_production_methods_input']: ValueTypes['update_production_methods_input'];
  ['update_producers_production_methods_input']: ValueTypes['update_producers_production_methods_input'];
  ['update_production_materials_files_input']: ValueTypes['update_production_materials_files_input'];
  ['update_stages_input']: ValueTypes['update_stages_input'];
  ['update_currencies_input']: ValueTypes['update_currencies_input'];
  ['update_products_contributors_input']: ValueTypes['update_products_contributors_input'];
  ['update_products_production_materials_input']: ValueTypes['update_products_production_materials_input'];
  ['update_products_design_files_input']: ValueTypes['update_products_design_files_input'];
  ['update_products_content_input']: ValueTypes['update_products_content_input'];
  ['update_products_files_input']: ValueTypes['update_products_files_input'];
  ['update_products_wearables_input']: ValueTypes['update_products_wearables_input'];
  ['update_file_formats_input']: ValueTypes['update_file_formats_input'];
  ['update_products_production_methods_input']: ValueTypes['update_products_production_methods_input'];
  ['update_invoices_input']: ValueTypes['update_invoices_input'];
  ['update_brands_directus_users_input']: ValueTypes['update_brands_directus_users_input'];
};
