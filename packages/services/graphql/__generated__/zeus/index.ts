/* eslint-disable */

import { AllTypesProps, ReturnTypes, Ops } from './const';
import fetch, { Response } from 'node-fetch';
import WebSocket from 'ws';
export const HOST = 'http://localhost:8080/v1/graphql';

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
    console.error(response);
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
  T extends keyof ModelTypes,
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
  date?: ScalarResolver;
  jsonb?: ScalarResolver;
  numeric?: ScalarResolver;
  timestamptz?: ScalarResolver;
  uuid?: ScalarResolver;
};
type ZEUS_UNIONS = never;

export type ValueTypes = {
  /** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
  ['Int_comparison_exp']: {
    _eq?: number | undefined | null | Variable<any, string>;
    _gt?: number | undefined | null | Variable<any, string>;
    _gte?: number | undefined | null | Variable<any, string>;
    _in?: Array<number> | undefined | null | Variable<any, string>;
    _is_null?: boolean | undefined | null | Variable<any, string>;
    _lt?: number | undefined | null | Variable<any, string>;
    _lte?: number | undefined | null | Variable<any, string>;
    _neq?: number | undefined | null | Variable<any, string>;
    _nin?: Array<number> | undefined | null | Variable<any, string>;
  };
  /** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
  ['String_comparison_exp']: {
    _eq?: string | undefined | null | Variable<any, string>;
    _gt?: string | undefined | null | Variable<any, string>;
    _gte?: string | undefined | null | Variable<any, string>;
    /** does the column match the given case-insensitive pattern */
    _ilike?: string | undefined | null | Variable<any, string>;
    _in?: Array<string> | undefined | null | Variable<any, string>;
    /** does the column match the given POSIX regular expression, case insensitive */
    _iregex?: string | undefined | null | Variable<any, string>;
    _is_null?: boolean | undefined | null | Variable<any, string>;
    /** does the column match the given pattern */
    _like?: string | undefined | null | Variable<any, string>;
    _lt?: string | undefined | null | Variable<any, string>;
    _lte?: string | undefined | null | Variable<any, string>;
    _neq?: string | undefined | null | Variable<any, string>;
    /** does the column NOT match the given case-insensitive pattern */
    _nilike?: string | undefined | null | Variable<any, string>;
    _nin?: Array<string> | undefined | null | Variable<any, string>;
    /** does the column NOT match the given POSIX regular expression, case insensitive */
    _niregex?: string | undefined | null | Variable<any, string>;
    /** does the column NOT match the given pattern */
    _nlike?: string | undefined | null | Variable<any, string>;
    /** does the column NOT match the given POSIX regular expression, case sensitive */
    _nregex?: string | undefined | null | Variable<any, string>;
    /** does the column NOT match the given SQL regular expression */
    _nsimilar?: string | undefined | null | Variable<any, string>;
    /** does the column match the given POSIX regular expression, case sensitive */
    _regex?: string | undefined | null | Variable<any, string>;
    /** does the column match the given SQL regular expression */
    _similar?: string | undefined | null | Variable<any, string>;
  };
  /** columns and relationships of "contribution_votes" */
  ['contribution_votes']: AliasType<{
    /** An object relationship */
    contribution?: ValueTypes['contributions'];
    contribution_id?: boolean | `@${string}`;
    rating?: boolean | `@${string}`;
    /** An object relationship */
    user?: ValueTypes['users'];
    user_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "contribution_votes" */
  ['contribution_votes_aggregate']: AliasType<{
    aggregate?: ValueTypes['contribution_votes_aggregate_fields'];
    nodes?: ValueTypes['contribution_votes'];
    __typename?: boolean | `@${string}`;
  }>;
  ['contribution_votes_aggregate_bool_exp']: {
    count?:
      | ValueTypes['contribution_votes_aggregate_bool_exp_count']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['contribution_votes_aggregate_bool_exp_count']: {
    arguments?:
      | Array<ValueTypes['contribution_votes_select_column']>
      | undefined
      | null
      | Variable<any, string>;
    distinct?: boolean | undefined | null | Variable<any, string>;
    filter?:
      | ValueTypes['contribution_votes_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    predicate: ValueTypes['Int_comparison_exp'] | Variable<any, string>;
  };
  /** aggregate fields of "contribution_votes" */
  ['contribution_votes_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?:
          | Array<ValueTypes['contribution_votes_select_column']>
          | undefined
          | null
          | Variable<any, string>;
        distinct?: boolean | undefined | null | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    max?: ValueTypes['contribution_votes_max_fields'];
    min?: ValueTypes['contribution_votes_min_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** order by aggregate values of table "contribution_votes" */
  ['contribution_votes_aggregate_order_by']: {
    count?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    max?:
      | ValueTypes['contribution_votes_max_order_by']
      | undefined
      | null
      | Variable<any, string>;
    min?:
      | ValueTypes['contribution_votes_min_order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** input type for inserting array relation for remote table "contribution_votes" */
  ['contribution_votes_arr_rel_insert_input']: {
    data:
      | Array<ValueTypes['contribution_votes_insert_input']>
      | Variable<any, string>;
    /** upsert condition */
    on_conflict?:
      | ValueTypes['contribution_votes_on_conflict']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Boolean expression to filter rows from the table "contribution_votes". All fields are combined with a logical 'AND'. */
  ['contribution_votes_bool_exp']: {
    _and?:
      | Array<ValueTypes['contribution_votes_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    _not?:
      | ValueTypes['contribution_votes_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['contribution_votes_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    contribution?:
      | ValueTypes['contributions_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    contribution_id?:
      | ValueTypes['uuid_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    rating?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    user?:
      | ValueTypes['users_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    user_id?:
      | ValueTypes['uuid_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** unique or primary key constraints on table "contribution_votes" */
  ['contribution_votes_constraint']: contribution_votes_constraint;
  /** input type for inserting data into table "contribution_votes" */
  ['contribution_votes_insert_input']: {
    contribution?:
      | ValueTypes['contributions_obj_rel_insert_input']
      | undefined
      | null
      | Variable<any, string>;
    contribution_id?:
      | ValueTypes['uuid']
      | undefined
      | null
      | Variable<any, string>;
    rating?: string | undefined | null | Variable<any, string>;
    user?:
      | ValueTypes['users_obj_rel_insert_input']
      | undefined
      | null
      | Variable<any, string>;
    user_id?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
  };
  /** aggregate max on columns */
  ['contribution_votes_max_fields']: AliasType<{
    contribution_id?: boolean | `@${string}`;
    rating?: boolean | `@${string}`;
    user_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by max() on columns of table "contribution_votes" */
  ['contribution_votes_max_order_by']: {
    contribution_id?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    rating?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    user_id?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
  };
  /** aggregate min on columns */
  ['contribution_votes_min_fields']: AliasType<{
    contribution_id?: boolean | `@${string}`;
    rating?: boolean | `@${string}`;
    user_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by min() on columns of table "contribution_votes" */
  ['contribution_votes_min_order_by']: {
    contribution_id?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    rating?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    user_id?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
  };
  /** response of any mutation on the table "contribution_votes" */
  ['contribution_votes_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['contribution_votes'];
    __typename?: boolean | `@${string}`;
  }>;
  /** on_conflict condition type for table "contribution_votes" */
  ['contribution_votes_on_conflict']: {
    constraint:
      | ValueTypes['contribution_votes_constraint']
      | Variable<any, string>;
    update_columns:
      | Array<ValueTypes['contribution_votes_update_column']>
      | Variable<any, string>;
    where?:
      | ValueTypes['contribution_votes_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Ordering options when selecting data from "contribution_votes". */
  ['contribution_votes_order_by']: {
    contribution?:
      | ValueTypes['contributions_order_by']
      | undefined
      | null
      | Variable<any, string>;
    contribution_id?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    rating?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    user?:
      | ValueTypes['users_order_by']
      | undefined
      | null
      | Variable<any, string>;
    user_id?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
  };
  /** primary key columns input for table: contribution_votes */
  ['contribution_votes_pk_columns_input']: {
    contribution_id: ValueTypes['uuid'] | Variable<any, string>;
    user_id: ValueTypes['uuid'] | Variable<any, string>;
  };
  /** select columns of table "contribution_votes" */
  ['contribution_votes_select_column']: contribution_votes_select_column;
  /** input type for updating data in table "contribution_votes" */
  ['contribution_votes_set_input']: {
    contribution_id?:
      | ValueTypes['uuid']
      | undefined
      | null
      | Variable<any, string>;
    rating?: string | undefined | null | Variable<any, string>;
    user_id?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
  };
  /** Streaming cursor of the table "contribution_votes" */
  ['contribution_votes_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value:
      | ValueTypes['contribution_votes_stream_cursor_value_input']
      | Variable<any, string>;
    /** cursor ordering */
    ordering?:
      | ValueTypes['cursor_ordering']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Initial value of the column from where the streaming should start */
  ['contribution_votes_stream_cursor_value_input']: {
    contribution_id?:
      | ValueTypes['uuid']
      | undefined
      | null
      | Variable<any, string>;
    rating?: string | undefined | null | Variable<any, string>;
    user_id?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
  };
  /** update columns of table "contribution_votes" */
  ['contribution_votes_update_column']: contribution_votes_update_column;
  ['contribution_votes_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ValueTypes['contribution_votes_set_input']
      | undefined
      | null
      | Variable<any, string>;
    /** filter the rows which have to be updated */
    where: ValueTypes['contribution_votes_bool_exp'] | Variable<any, string>;
  };
  /** columns and relationships of "contributions" */
  ['contributions']: AliasType<{
    artifact?: boolean | `@${string}`;
    /** An object relationship */
    author?: ValueTypes['users'];
    category?: boolean | `@${string}`;
    contributors?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contributors_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contributors_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contributors_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributors'],
    ];
    contributors_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contributors_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contributors_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contributors_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributors_aggregate'],
    ];
    created_at?: boolean | `@${string}`;
    created_by?: boolean | `@${string}`;
    date?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    effort?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    impact?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    votes?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contribution_votes_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contribution_votes_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contribution_votes_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contribution_votes'],
    ];
    votes_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contribution_votes_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contribution_votes_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contribution_votes_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contribution_votes_aggregate'],
    ];
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "contributions" */
  ['contributions_aggregate']: AliasType<{
    aggregate?: ValueTypes['contributions_aggregate_fields'];
    nodes?: ValueTypes['contributions'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate fields of "contributions" */
  ['contributions_aggregate_fields']: AliasType<{
    avg?: ValueTypes['contributions_avg_fields'];
    count?: [
      {
        columns?:
          | Array<ValueTypes['contributions_select_column']>
          | undefined
          | null
          | Variable<any, string>;
        distinct?: boolean | undefined | null | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    max?: ValueTypes['contributions_max_fields'];
    min?: ValueTypes['contributions_min_fields'];
    stddev?: ValueTypes['contributions_stddev_fields'];
    stddev_pop?: ValueTypes['contributions_stddev_pop_fields'];
    stddev_samp?: ValueTypes['contributions_stddev_samp_fields'];
    sum?: ValueTypes['contributions_sum_fields'];
    var_pop?: ValueTypes['contributions_var_pop_fields'];
    var_samp?: ValueTypes['contributions_var_samp_fields'];
    variance?: ValueTypes['contributions_variance_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate avg on columns */
  ['contributions_avg_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Boolean expression to filter rows from the table "contributions". All fields are combined with a logical 'AND'. */
  ['contributions_bool_exp']: {
    _and?:
      | Array<ValueTypes['contributions_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    _not?:
      | ValueTypes['contributions_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['contributions_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    artifact?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    author?:
      | ValueTypes['users_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    category?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    contributors?:
      | ValueTypes['contributors_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    contributors_aggregate?:
      | ValueTypes['contributors_aggregate_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    created_at?:
      | ValueTypes['timestamptz_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    created_by?:
      | ValueTypes['uuid_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    date?:
      | ValueTypes['date_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    description?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    effort?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['uuid_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    impact?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    title?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    votes?:
      | ValueTypes['contribution_votes_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    votes_aggregate?:
      | ValueTypes['contribution_votes_aggregate_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    weight?:
      | ValueTypes['Int_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** unique or primary key constraints on table "contributions" */
  ['contributions_constraint']: contributions_constraint;
  /** input type for incrementing numeric columns in table "contributions" */
  ['contributions_inc_input']: {
    weight?: number | undefined | null | Variable<any, string>;
  };
  /** input type for inserting data into table "contributions" */
  ['contributions_insert_input']: {
    artifact?: string | undefined | null | Variable<any, string>;
    author?:
      | ValueTypes['users_obj_rel_insert_input']
      | undefined
      | null
      | Variable<any, string>;
    category?: string | undefined | null | Variable<any, string>;
    contributors?:
      | ValueTypes['contributors_arr_rel_insert_input']
      | undefined
      | null
      | Variable<any, string>;
    created_at?:
      | ValueTypes['timestamptz']
      | undefined
      | null
      | Variable<any, string>;
    created_by?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    date?: ValueTypes['date'] | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    effort?: string | undefined | null | Variable<any, string>;
    id?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    impact?: string | undefined | null | Variable<any, string>;
    title?: string | undefined | null | Variable<any, string>;
    votes?:
      | ValueTypes['contribution_votes_arr_rel_insert_input']
      | undefined
      | null
      | Variable<any, string>;
    weight?: number | undefined | null | Variable<any, string>;
  };
  /** aggregate max on columns */
  ['contributions_max_fields']: AliasType<{
    artifact?: boolean | `@${string}`;
    category?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    created_by?: boolean | `@${string}`;
    date?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    effort?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    impact?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate min on columns */
  ['contributions_min_fields']: AliasType<{
    artifact?: boolean | `@${string}`;
    category?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    created_by?: boolean | `@${string}`;
    date?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    effort?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    impact?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** response of any mutation on the table "contributions" */
  ['contributions_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['contributions'];
    __typename?: boolean | `@${string}`;
  }>;
  /** input type for inserting object relation for remote table "contributions" */
  ['contributions_obj_rel_insert_input']: {
    data: ValueTypes['contributions_insert_input'] | Variable<any, string>;
    /** upsert condition */
    on_conflict?:
      | ValueTypes['contributions_on_conflict']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** on_conflict condition type for table "contributions" */
  ['contributions_on_conflict']: {
    constraint: ValueTypes['contributions_constraint'] | Variable<any, string>;
    update_columns:
      | Array<ValueTypes['contributions_update_column']>
      | Variable<any, string>;
    where?:
      | ValueTypes['contributions_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Ordering options when selecting data from "contributions". */
  ['contributions_order_by']: {
    artifact?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    author?:
      | ValueTypes['users_order_by']
      | undefined
      | null
      | Variable<any, string>;
    category?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    contributors_aggregate?:
      | ValueTypes['contributors_aggregate_order_by']
      | undefined
      | null
      | Variable<any, string>;
    created_at?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    created_by?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    date?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    description?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    effort?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    id?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    impact?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    title?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    votes_aggregate?:
      | ValueTypes['contribution_votes_aggregate_order_by']
      | undefined
      | null
      | Variable<any, string>;
    weight?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
  };
  /** primary key columns input for table: contributions */
  ['contributions_pk_columns_input']: {
    id: ValueTypes['uuid'] | Variable<any, string>;
  };
  /** select columns of table "contributions" */
  ['contributions_select_column']: contributions_select_column;
  /** input type for updating data in table "contributions" */
  ['contributions_set_input']: {
    artifact?: string | undefined | null | Variable<any, string>;
    category?: string | undefined | null | Variable<any, string>;
    created_at?:
      | ValueTypes['timestamptz']
      | undefined
      | null
      | Variable<any, string>;
    created_by?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    date?: ValueTypes['date'] | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    effort?: string | undefined | null | Variable<any, string>;
    id?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    impact?: string | undefined | null | Variable<any, string>;
    title?: string | undefined | null | Variable<any, string>;
    weight?: number | undefined | null | Variable<any, string>;
  };
  /** aggregate stddev on columns */
  ['contributions_stddev_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate stddev_pop on columns */
  ['contributions_stddev_pop_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate stddev_samp on columns */
  ['contributions_stddev_samp_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Streaming cursor of the table "contributions" */
  ['contributions_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value:
      | ValueTypes['contributions_stream_cursor_value_input']
      | Variable<any, string>;
    /** cursor ordering */
    ordering?:
      | ValueTypes['cursor_ordering']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Initial value of the column from where the streaming should start */
  ['contributions_stream_cursor_value_input']: {
    artifact?: string | undefined | null | Variable<any, string>;
    category?: string | undefined | null | Variable<any, string>;
    created_at?:
      | ValueTypes['timestamptz']
      | undefined
      | null
      | Variable<any, string>;
    created_by?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    date?: ValueTypes['date'] | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    effort?: string | undefined | null | Variable<any, string>;
    id?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    impact?: string | undefined | null | Variable<any, string>;
    title?: string | undefined | null | Variable<any, string>;
    weight?: number | undefined | null | Variable<any, string>;
  };
  /** aggregate sum on columns */
  ['contributions_sum_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** update columns of table "contributions" */
  ['contributions_update_column']: contributions_update_column;
  ['contributions_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?:
      | ValueTypes['contributions_inc_input']
      | undefined
      | null
      | Variable<any, string>;
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ValueTypes['contributions_set_input']
      | undefined
      | null
      | Variable<any, string>;
    /** filter the rows which have to be updated */
    where: ValueTypes['contributions_bool_exp'] | Variable<any, string>;
  };
  /** aggregate var_pop on columns */
  ['contributions_var_pop_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate var_samp on columns */
  ['contributions_var_samp_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate variance on columns */
  ['contributions_variance_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** columns and relationships of "contributors" */
  ['contributors']: AliasType<{
    /** An object relationship */
    contribution?: ValueTypes['contributions'];
    contribution_id?: boolean | `@${string}`;
    contribution_share?: boolean | `@${string}`;
    /** An object relationship */
    user?: ValueTypes['users'];
    user_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "contributors" */
  ['contributors_aggregate']: AliasType<{
    aggregate?: ValueTypes['contributors_aggregate_fields'];
    nodes?: ValueTypes['contributors'];
    __typename?: boolean | `@${string}`;
  }>;
  ['contributors_aggregate_bool_exp']: {
    count?:
      | ValueTypes['contributors_aggregate_bool_exp_count']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['contributors_aggregate_bool_exp_count']: {
    arguments?:
      | Array<ValueTypes['contributors_select_column']>
      | undefined
      | null
      | Variable<any, string>;
    distinct?: boolean | undefined | null | Variable<any, string>;
    filter?:
      | ValueTypes['contributors_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    predicate: ValueTypes['Int_comparison_exp'] | Variable<any, string>;
  };
  /** aggregate fields of "contributors" */
  ['contributors_aggregate_fields']: AliasType<{
    avg?: ValueTypes['contributors_avg_fields'];
    count?: [
      {
        columns?:
          | Array<ValueTypes['contributors_select_column']>
          | undefined
          | null
          | Variable<any, string>;
        distinct?: boolean | undefined | null | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    max?: ValueTypes['contributors_max_fields'];
    min?: ValueTypes['contributors_min_fields'];
    stddev?: ValueTypes['contributors_stddev_fields'];
    stddev_pop?: ValueTypes['contributors_stddev_pop_fields'];
    stddev_samp?: ValueTypes['contributors_stddev_samp_fields'];
    sum?: ValueTypes['contributors_sum_fields'];
    var_pop?: ValueTypes['contributors_var_pop_fields'];
    var_samp?: ValueTypes['contributors_var_samp_fields'];
    variance?: ValueTypes['contributors_variance_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** order by aggregate values of table "contributors" */
  ['contributors_aggregate_order_by']: {
    avg?:
      | ValueTypes['contributors_avg_order_by']
      | undefined
      | null
      | Variable<any, string>;
    count?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    max?:
      | ValueTypes['contributors_max_order_by']
      | undefined
      | null
      | Variable<any, string>;
    min?:
      | ValueTypes['contributors_min_order_by']
      | undefined
      | null
      | Variable<any, string>;
    stddev?:
      | ValueTypes['contributors_stddev_order_by']
      | undefined
      | null
      | Variable<any, string>;
    stddev_pop?:
      | ValueTypes['contributors_stddev_pop_order_by']
      | undefined
      | null
      | Variable<any, string>;
    stddev_samp?:
      | ValueTypes['contributors_stddev_samp_order_by']
      | undefined
      | null
      | Variable<any, string>;
    sum?:
      | ValueTypes['contributors_sum_order_by']
      | undefined
      | null
      | Variable<any, string>;
    var_pop?:
      | ValueTypes['contributors_var_pop_order_by']
      | undefined
      | null
      | Variable<any, string>;
    var_samp?:
      | ValueTypes['contributors_var_samp_order_by']
      | undefined
      | null
      | Variable<any, string>;
    variance?:
      | ValueTypes['contributors_variance_order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** input type for inserting array relation for remote table "contributors" */
  ['contributors_arr_rel_insert_input']: {
    data:
      | Array<ValueTypes['contributors_insert_input']>
      | Variable<any, string>;
    /** upsert condition */
    on_conflict?:
      | ValueTypes['contributors_on_conflict']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate avg on columns */
  ['contributors_avg_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by avg() on columns of table "contributors" */
  ['contributors_avg_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Boolean expression to filter rows from the table "contributors". All fields are combined with a logical 'AND'. */
  ['contributors_bool_exp']: {
    _and?:
      | Array<ValueTypes['contributors_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    _not?:
      | ValueTypes['contributors_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['contributors_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    contribution?:
      | ValueTypes['contributions_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    contribution_id?:
      | ValueTypes['uuid_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    contribution_share?:
      | ValueTypes['numeric_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    user?:
      | ValueTypes['users_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    user_id?:
      | ValueTypes['uuid_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** unique or primary key constraints on table "contributors" */
  ['contributors_constraint']: contributors_constraint;
  /** input type for incrementing numeric columns in table "contributors" */
  ['contributors_inc_input']: {
    contribution_share?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** input type for inserting data into table "contributors" */
  ['contributors_insert_input']: {
    contribution?:
      | ValueTypes['contributions_obj_rel_insert_input']
      | undefined
      | null
      | Variable<any, string>;
    contribution_id?:
      | ValueTypes['uuid']
      | undefined
      | null
      | Variable<any, string>;
    contribution_share?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
    user?:
      | ValueTypes['users_obj_rel_insert_input']
      | undefined
      | null
      | Variable<any, string>;
    user_id?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
  };
  /** aggregate max on columns */
  ['contributors_max_fields']: AliasType<{
    contribution_id?: boolean | `@${string}`;
    contribution_share?: boolean | `@${string}`;
    user_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by max() on columns of table "contributors" */
  ['contributors_max_order_by']: {
    contribution_id?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    user_id?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
  };
  /** aggregate min on columns */
  ['contributors_min_fields']: AliasType<{
    contribution_id?: boolean | `@${string}`;
    contribution_share?: boolean | `@${string}`;
    user_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by min() on columns of table "contributors" */
  ['contributors_min_order_by']: {
    contribution_id?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    user_id?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
  };
  /** response of any mutation on the table "contributors" */
  ['contributors_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['contributors'];
    __typename?: boolean | `@${string}`;
  }>;
  /** on_conflict condition type for table "contributors" */
  ['contributors_on_conflict']: {
    constraint: ValueTypes['contributors_constraint'] | Variable<any, string>;
    update_columns:
      | Array<ValueTypes['contributors_update_column']>
      | Variable<any, string>;
    where?:
      | ValueTypes['contributors_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Ordering options when selecting data from "contributors". */
  ['contributors_order_by']: {
    contribution?:
      | ValueTypes['contributions_order_by']
      | undefined
      | null
      | Variable<any, string>;
    contribution_id?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    user?:
      | ValueTypes['users_order_by']
      | undefined
      | null
      | Variable<any, string>;
    user_id?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
  };
  /** primary key columns input for table: contributors */
  ['contributors_pk_columns_input']: {
    contribution_id: ValueTypes['uuid'] | Variable<any, string>;
    user_id: ValueTypes['uuid'] | Variable<any, string>;
  };
  /** select columns of table "contributors" */
  ['contributors_select_column']: contributors_select_column;
  /** input type for updating data in table "contributors" */
  ['contributors_set_input']: {
    contribution_id?:
      | ValueTypes['uuid']
      | undefined
      | null
      | Variable<any, string>;
    contribution_share?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
    user_id?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
  };
  /** aggregate stddev on columns */
  ['contributors_stddev_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by stddev() on columns of table "contributors" */
  ['contributors_stddev_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate stddev_pop on columns */
  ['contributors_stddev_pop_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by stddev_pop() on columns of table "contributors" */
  ['contributors_stddev_pop_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate stddev_samp on columns */
  ['contributors_stddev_samp_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by stddev_samp() on columns of table "contributors" */
  ['contributors_stddev_samp_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Streaming cursor of the table "contributors" */
  ['contributors_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value:
      | ValueTypes['contributors_stream_cursor_value_input']
      | Variable<any, string>;
    /** cursor ordering */
    ordering?:
      | ValueTypes['cursor_ordering']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Initial value of the column from where the streaming should start */
  ['contributors_stream_cursor_value_input']: {
    contribution_id?:
      | ValueTypes['uuid']
      | undefined
      | null
      | Variable<any, string>;
    contribution_share?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
    user_id?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
  };
  /** aggregate sum on columns */
  ['contributors_sum_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by sum() on columns of table "contributors" */
  ['contributors_sum_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** update columns of table "contributors" */
  ['contributors_update_column']: contributors_update_column;
  ['contributors_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?:
      | ValueTypes['contributors_inc_input']
      | undefined
      | null
      | Variable<any, string>;
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ValueTypes['contributors_set_input']
      | undefined
      | null
      | Variable<any, string>;
    /** filter the rows which have to be updated */
    where: ValueTypes['contributors_bool_exp'] | Variable<any, string>;
  };
  /** aggregate var_pop on columns */
  ['contributors_var_pop_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by var_pop() on columns of table "contributors" */
  ['contributors_var_pop_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate var_samp on columns */
  ['contributors_var_samp_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by var_samp() on columns of table "contributors" */
  ['contributors_var_samp_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate variance on columns */
  ['contributors_variance_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by variance() on columns of table "contributors" */
  ['contributors_variance_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** ordering argument of a cursor */
  ['cursor_ordering']: cursor_ordering;
  ['date']: unknown;
  /** Boolean expression to compare columns of type "date". All fields are combined with logical 'AND'. */
  ['date_comparison_exp']: {
    _eq?: ValueTypes['date'] | undefined | null | Variable<any, string>;
    _gt?: ValueTypes['date'] | undefined | null | Variable<any, string>;
    _gte?: ValueTypes['date'] | undefined | null | Variable<any, string>;
    _in?: Array<ValueTypes['date']> | undefined | null | Variable<any, string>;
    _is_null?: boolean | undefined | null | Variable<any, string>;
    _lt?: ValueTypes['date'] | undefined | null | Variable<any, string>;
    _lte?: ValueTypes['date'] | undefined | null | Variable<any, string>;
    _neq?: ValueTypes['date'] | undefined | null | Variable<any, string>;
    _nin?: Array<ValueTypes['date']> | undefined | null | Variable<any, string>;
  };
  ['jsonb']: unknown;
  ['jsonb_cast_exp']: {
    String?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
  ['jsonb_comparison_exp']: {
    _cast?:
      | ValueTypes['jsonb_cast_exp']
      | undefined
      | null
      | Variable<any, string>;
    /** is the column contained in the given json value */
    _contained_in?:
      | ValueTypes['jsonb']
      | undefined
      | null
      | Variable<any, string>;
    /** does the column contain the given json value at the top level */
    _contains?: ValueTypes['jsonb'] | undefined | null | Variable<any, string>;
    _eq?: ValueTypes['jsonb'] | undefined | null | Variable<any, string>;
    _gt?: ValueTypes['jsonb'] | undefined | null | Variable<any, string>;
    _gte?: ValueTypes['jsonb'] | undefined | null | Variable<any, string>;
    /** does the string exist as a top-level key in the column */
    _has_key?: string | undefined | null | Variable<any, string>;
    /** do all of these strings exist as top-level keys in the column */
    _has_keys_all?: Array<string> | undefined | null | Variable<any, string>;
    /** do any of these strings exist as top-level keys in the column */
    _has_keys_any?: Array<string> | undefined | null | Variable<any, string>;
    _in?: Array<ValueTypes['jsonb']> | undefined | null | Variable<any, string>;
    _is_null?: boolean | undefined | null | Variable<any, string>;
    _lt?: ValueTypes['jsonb'] | undefined | null | Variable<any, string>;
    _lte?: ValueTypes['jsonb'] | undefined | null | Variable<any, string>;
    _neq?: ValueTypes['jsonb'] | undefined | null | Variable<any, string>;
    _nin?:
      | Array<ValueTypes['jsonb']>
      | undefined
      | null
      | Variable<any, string>;
  };
  /** mutation root */
  ['mutation_root']: AliasType<{
    delete_contribution_votes?: [
      {
        /** filter the rows which have to be deleted */
        where:
          | ValueTypes['contribution_votes_bool_exp']
          | Variable<any, string>;
      },
      ValueTypes['contribution_votes_mutation_response'],
    ];
    delete_contribution_votes_by_pk?: [
      {
        contribution_id: ValueTypes['uuid'] | Variable<any, string>;
        user_id: ValueTypes['uuid'] | Variable<any, string>;
      },
      ValueTypes['contribution_votes'],
    ];
    delete_contributions?: [
      {
        /** filter the rows which have to be deleted */
        where: ValueTypes['contributions_bool_exp'] | Variable<any, string>;
      },
      ValueTypes['contributions_mutation_response'],
    ];
    delete_contributions_by_pk?: [
      { id: ValueTypes['uuid'] | Variable<any, string> },
      ValueTypes['contributions'],
    ];
    delete_contributors?: [
      {
        /** filter the rows which have to be deleted */
        where: ValueTypes['contributors_bool_exp'] | Variable<any, string>;
      },
      ValueTypes['contributors_mutation_response'],
    ];
    delete_contributors_by_pk?: [
      {
        contribution_id: ValueTypes['uuid'] | Variable<any, string>;
        user_id: ValueTypes['uuid'] | Variable<any, string>;
      },
      ValueTypes['contributors'],
    ];
    delete_robot_merkle_claims?: [
      {
        /** filter the rows which have to be deleted */
        where:
          | ValueTypes['robot_merkle_claims_bool_exp']
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_claims_mutation_response'],
    ];
    delete_robot_merkle_claims_by_pk?: [
      { id: ValueTypes['uuid'] | Variable<any, string> },
      ValueTypes['robot_merkle_claims'],
    ];
    delete_robot_merkle_roots?: [
      {
        /** filter the rows which have to be deleted */
        where:
          | ValueTypes['robot_merkle_roots_bool_exp']
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_roots_mutation_response'],
    ];
    delete_robot_merkle_roots_by_pk?: [
      { hash: string | Variable<any, string> },
      ValueTypes['robot_merkle_roots'],
    ];
    delete_robot_order?: [
      {
        /** filter the rows which have to be deleted */
        where: ValueTypes['robot_order_bool_exp'] | Variable<any, string>;
      },
      ValueTypes['robot_order_mutation_response'],
    ];
    delete_robot_order_by_pk?: [
      { order_id: string | Variable<any, string> },
      ValueTypes['robot_order'],
    ];
    delete_robot_product?: [
      {
        /** filter the rows which have to be deleted */
        where: ValueTypes['robot_product_bool_exp'] | Variable<any, string>;
      },
      ValueTypes['robot_product_mutation_response'],
    ];
    delete_robot_product_by_pk?: [
      { id: string | Variable<any, string> },
      ValueTypes['robot_product'],
    ];
    delete_robot_product_designer?: [
      {
        /** filter the rows which have to be deleted */
        where:
          | ValueTypes['robot_product_designer_bool_exp']
          | Variable<any, string>;
      },
      ValueTypes['robot_product_designer_mutation_response'],
    ];
    delete_robot_product_designer_by_pk?: [
      {
        eth_address: string | Variable<any, string>;
        product_id: string | Variable<any, string>;
      },
      ValueTypes['robot_product_designer'],
    ];
    delete_shop_api_users?: [
      {
        /** filter the rows which have to be deleted */
        where: ValueTypes['shop_api_users_bool_exp'] | Variable<any, string>;
      },
      ValueTypes['shop_api_users_mutation_response'],
    ];
    delete_shop_api_users_by_pk?: [
      { username: string | Variable<any, string> },
      ValueTypes['shop_api_users'],
    ];
    delete_shop_product_locks?: [
      {
        /** filter the rows which have to be deleted */
        where:
          | ValueTypes['shop_product_locks_bool_exp']
          | Variable<any, string>;
      },
      ValueTypes['shop_product_locks_mutation_response'],
    ];
    delete_shop_product_locks_by_pk?: [
      {
        access_code: string | Variable<any, string>;
        lock_id: string | Variable<any, string>;
      },
      ValueTypes['shop_product_locks'],
    ];
    delete_users?: [
      {
        /** filter the rows which have to be deleted */
        where: ValueTypes['users_bool_exp'] | Variable<any, string>;
      },
      ValueTypes['users_mutation_response'],
    ];
    delete_users_by_pk?: [
      { id: ValueTypes['uuid'] | Variable<any, string> },
      ValueTypes['users'],
    ];
    insert_contribution_votes?: [
      {
        /** the rows to be inserted */
        objects:
          | Array<ValueTypes['contribution_votes_insert_input']>
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['contribution_votes_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contribution_votes_mutation_response'],
    ];
    insert_contribution_votes_one?: [
      {
        /** the row to be inserted */
        object:
          | ValueTypes['contribution_votes_insert_input']
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['contribution_votes_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contribution_votes'],
    ];
    insert_contributions?: [
      {
        /** the rows to be inserted */
        objects:
          | Array<ValueTypes['contributions_insert_input']>
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['contributions_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributions_mutation_response'],
    ];
    insert_contributions_one?: [
      {
        /** the row to be inserted */
        object:
          | ValueTypes['contributions_insert_input']
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['contributions_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributions'],
    ];
    insert_contributors?: [
      {
        /** the rows to be inserted */
        objects:
          | Array<ValueTypes['contributors_insert_input']>
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['contributors_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributors_mutation_response'],
    ];
    insert_contributors_one?: [
      {
        /** the row to be inserted */
        object:
          | ValueTypes['contributors_insert_input']
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['contributors_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributors'],
    ];
    insert_robot_merkle_claims?: [
      {
        /** the rows to be inserted */
        objects:
          | Array<ValueTypes['robot_merkle_claims_insert_input']>
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['robot_merkle_claims_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_claims_mutation_response'],
    ];
    insert_robot_merkle_claims_one?: [
      {
        /** the row to be inserted */
        object:
          | ValueTypes['robot_merkle_claims_insert_input']
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['robot_merkle_claims_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_claims'],
    ];
    insert_robot_merkle_roots?: [
      {
        /** the rows to be inserted */
        objects:
          | Array<ValueTypes['robot_merkle_roots_insert_input']>
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['robot_merkle_roots_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_roots_mutation_response'],
    ];
    insert_robot_merkle_roots_one?: [
      {
        /** the row to be inserted */
        object:
          | ValueTypes['robot_merkle_roots_insert_input']
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['robot_merkle_roots_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_roots'],
    ];
    insert_robot_order?: [
      {
        /** the rows to be inserted */
        objects:
          | Array<ValueTypes['robot_order_insert_input']>
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['robot_order_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_order_mutation_response'],
    ];
    insert_robot_order_one?: [
      {
        /** the row to be inserted */
        object:
          | ValueTypes['robot_order_insert_input']
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['robot_order_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_order'],
    ];
    insert_robot_product?: [
      {
        /** the rows to be inserted */
        objects:
          | Array<ValueTypes['robot_product_insert_input']>
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['robot_product_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product_mutation_response'],
    ];
    insert_robot_product_designer?: [
      {
        /** the rows to be inserted */
        objects:
          | Array<ValueTypes['robot_product_designer_insert_input']>
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['robot_product_designer_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product_designer_mutation_response'],
    ];
    insert_robot_product_designer_one?: [
      {
        /** the row to be inserted */
        object:
          | ValueTypes['robot_product_designer_insert_input']
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['robot_product_designer_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product_designer'],
    ];
    insert_robot_product_one?: [
      {
        /** the row to be inserted */
        object:
          | ValueTypes['robot_product_insert_input']
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['robot_product_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product'],
    ];
    insert_shop_api_users?: [
      {
        /** the rows to be inserted */
        objects:
          | Array<ValueTypes['shop_api_users_insert_input']>
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['shop_api_users_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['shop_api_users_mutation_response'],
    ];
    insert_shop_api_users_one?: [
      {
        /** the row to be inserted */
        object:
          | ValueTypes['shop_api_users_insert_input']
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['shop_api_users_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['shop_api_users'],
    ];
    insert_shop_product_locks?: [
      {
        /** the rows to be inserted */
        objects:
          | Array<ValueTypes['shop_product_locks_insert_input']>
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['shop_product_locks_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['shop_product_locks_mutation_response'],
    ];
    insert_shop_product_locks_one?: [
      {
        /** the row to be inserted */
        object:
          | ValueTypes['shop_product_locks_insert_input']
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['shop_product_locks_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['shop_product_locks'],
    ];
    insert_users?: [
      {
        /** the rows to be inserted */
        objects:
          | Array<ValueTypes['users_insert_input']>
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['users_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['users_mutation_response'],
    ];
    insert_users_one?: [
      {
        /** the row to be inserted */
        object:
          | ValueTypes['users_insert_input']
          | Variable<any, string> /** upsert condition */;
        on_conflict?:
          | ValueTypes['users_on_conflict']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['users'],
    ];
    update_contribution_votes?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ValueTypes['contribution_votes_set_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** filter the rows which have to be updated */;
        where:
          | ValueTypes['contribution_votes_bool_exp']
          | Variable<any, string>;
      },
      ValueTypes['contribution_votes_mutation_response'],
    ];
    update_contribution_votes_by_pk?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ValueTypes['contribution_votes_set_input']
          | undefined
          | null
          | Variable<any, string>;
        pk_columns:
          | ValueTypes['contribution_votes_pk_columns_input']
          | Variable<any, string>;
      },
      ValueTypes['contribution_votes'],
    ];
    update_contribution_votes_many?: [
      {
        /** updates to execute, in order */
        updates:
          | Array<ValueTypes['contribution_votes_updates']>
          | Variable<any, string>;
      },
      ValueTypes['contribution_votes_mutation_response'],
    ];
    update_contributions?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['contributions_inc_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['contributions_set_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** filter the rows which have to be updated */;
        where: ValueTypes['contributions_bool_exp'] | Variable<any, string>;
      },
      ValueTypes['contributions_mutation_response'],
    ];
    update_contributions_by_pk?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['contributions_inc_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['contributions_set_input']
          | undefined
          | null
          | Variable<any, string>;
        pk_columns:
          | ValueTypes['contributions_pk_columns_input']
          | Variable<any, string>;
      },
      ValueTypes['contributions'],
    ];
    update_contributions_many?: [
      {
        /** updates to execute, in order */
        updates:
          | Array<ValueTypes['contributions_updates']>
          | Variable<any, string>;
      },
      ValueTypes['contributions_mutation_response'],
    ];
    update_contributors?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['contributors_inc_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['contributors_set_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** filter the rows which have to be updated */;
        where: ValueTypes['contributors_bool_exp'] | Variable<any, string>;
      },
      ValueTypes['contributors_mutation_response'],
    ];
    update_contributors_by_pk?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['contributors_inc_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['contributors_set_input']
          | undefined
          | null
          | Variable<any, string>;
        pk_columns:
          | ValueTypes['contributors_pk_columns_input']
          | Variable<any, string>;
      },
      ValueTypes['contributors'],
    ];
    update_contributors_many?: [
      {
        /** updates to execute, in order */
        updates:
          | Array<ValueTypes['contributors_updates']>
          | Variable<any, string>;
      },
      ValueTypes['contributors_mutation_response'],
    ];
    update_robot_merkle_claims?: [
      {
        /** append existing jsonb value of filtered columns with new jsonb value */
        _append?:
          | ValueTypes['robot_merkle_claims_append_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */;
        _delete_at_path?:
          | ValueTypes['robot_merkle_claims_delete_at_path_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */;
        _delete_elem?:
          | ValueTypes['robot_merkle_claims_delete_elem_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** delete key/value pair or string element. key/value pairs are matched based on their key value */;
        _delete_key?:
          | ValueTypes['robot_merkle_claims_delete_key_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** prepend existing jsonb value of filtered columns with new jsonb value */;
        _prepend?:
          | ValueTypes['robot_merkle_claims_prepend_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['robot_merkle_claims_set_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** filter the rows which have to be updated */;
        where:
          | ValueTypes['robot_merkle_claims_bool_exp']
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_claims_mutation_response'],
    ];
    update_robot_merkle_claims_by_pk?: [
      {
        /** append existing jsonb value of filtered columns with new jsonb value */
        _append?:
          | ValueTypes['robot_merkle_claims_append_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */;
        _delete_at_path?:
          | ValueTypes['robot_merkle_claims_delete_at_path_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */;
        _delete_elem?:
          | ValueTypes['robot_merkle_claims_delete_elem_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** delete key/value pair or string element. key/value pairs are matched based on their key value */;
        _delete_key?:
          | ValueTypes['robot_merkle_claims_delete_key_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** prepend existing jsonb value of filtered columns with new jsonb value */;
        _prepend?:
          | ValueTypes['robot_merkle_claims_prepend_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['robot_merkle_claims_set_input']
          | undefined
          | null
          | Variable<any, string>;
        pk_columns:
          | ValueTypes['robot_merkle_claims_pk_columns_input']
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_claims'],
    ];
    update_robot_merkle_claims_many?: [
      {
        /** updates to execute, in order */
        updates:
          | Array<ValueTypes['robot_merkle_claims_updates']>
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_claims_mutation_response'],
    ];
    update_robot_merkle_roots?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ValueTypes['robot_merkle_roots_set_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** filter the rows which have to be updated */;
        where:
          | ValueTypes['robot_merkle_roots_bool_exp']
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_roots_mutation_response'],
    ];
    update_robot_merkle_roots_by_pk?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ValueTypes['robot_merkle_roots_set_input']
          | undefined
          | null
          | Variable<any, string>;
        pk_columns:
          | ValueTypes['robot_merkle_roots_pk_columns_input']
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_roots'],
    ];
    update_robot_merkle_roots_many?: [
      {
        /** updates to execute, in order */
        updates:
          | Array<ValueTypes['robot_merkle_roots_updates']>
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_roots_mutation_response'],
    ];
    update_robot_order?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['robot_order_inc_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['robot_order_set_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** filter the rows which have to be updated */;
        where: ValueTypes['robot_order_bool_exp'] | Variable<any, string>;
      },
      ValueTypes['robot_order_mutation_response'],
    ];
    update_robot_order_by_pk?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['robot_order_inc_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['robot_order_set_input']
          | undefined
          | null
          | Variable<any, string>;
        pk_columns:
          | ValueTypes['robot_order_pk_columns_input']
          | Variable<any, string>;
      },
      ValueTypes['robot_order'],
    ];
    update_robot_order_many?: [
      {
        /** updates to execute, in order */
        updates:
          | Array<ValueTypes['robot_order_updates']>
          | Variable<any, string>;
      },
      ValueTypes['robot_order_mutation_response'],
    ];
    update_robot_product?: [
      {
        /** append existing jsonb value of filtered columns with new jsonb value */
        _append?:
          | ValueTypes['robot_product_append_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */;
        _delete_at_path?:
          | ValueTypes['robot_product_delete_at_path_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */;
        _delete_elem?:
          | ValueTypes['robot_product_delete_elem_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** delete key/value pair or string element. key/value pairs are matched based on their key value */;
        _delete_key?:
          | ValueTypes['robot_product_delete_key_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** increments the numeric columns with given value of the filtered values */;
        _inc?:
          | ValueTypes['robot_product_inc_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** prepend existing jsonb value of filtered columns with new jsonb value */;
        _prepend?:
          | ValueTypes['robot_product_prepend_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['robot_product_set_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** filter the rows which have to be updated */;
        where: ValueTypes['robot_product_bool_exp'] | Variable<any, string>;
      },
      ValueTypes['robot_product_mutation_response'],
    ];
    update_robot_product_by_pk?: [
      {
        /** append existing jsonb value of filtered columns with new jsonb value */
        _append?:
          | ValueTypes['robot_product_append_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */;
        _delete_at_path?:
          | ValueTypes['robot_product_delete_at_path_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */;
        _delete_elem?:
          | ValueTypes['robot_product_delete_elem_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** delete key/value pair or string element. key/value pairs are matched based on their key value */;
        _delete_key?:
          | ValueTypes['robot_product_delete_key_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** increments the numeric columns with given value of the filtered values */;
        _inc?:
          | ValueTypes['robot_product_inc_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** prepend existing jsonb value of filtered columns with new jsonb value */;
        _prepend?:
          | ValueTypes['robot_product_prepend_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['robot_product_set_input']
          | undefined
          | null
          | Variable<any, string>;
        pk_columns:
          | ValueTypes['robot_product_pk_columns_input']
          | Variable<any, string>;
      },
      ValueTypes['robot_product'],
    ];
    update_robot_product_designer?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['robot_product_designer_inc_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['robot_product_designer_set_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** filter the rows which have to be updated */;
        where:
          | ValueTypes['robot_product_designer_bool_exp']
          | Variable<any, string>;
      },
      ValueTypes['robot_product_designer_mutation_response'],
    ];
    update_robot_product_designer_by_pk?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['robot_product_designer_inc_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['robot_product_designer_set_input']
          | undefined
          | null
          | Variable<any, string>;
        pk_columns:
          | ValueTypes['robot_product_designer_pk_columns_input']
          | Variable<any, string>;
      },
      ValueTypes['robot_product_designer'],
    ];
    update_robot_product_designer_many?: [
      {
        /** updates to execute, in order */
        updates:
          | Array<ValueTypes['robot_product_designer_updates']>
          | Variable<any, string>;
      },
      ValueTypes['robot_product_designer_mutation_response'],
    ];
    update_robot_product_many?: [
      {
        /** updates to execute, in order */
        updates:
          | Array<ValueTypes['robot_product_updates']>
          | Variable<any, string>;
      },
      ValueTypes['robot_product_mutation_response'],
    ];
    update_shop_api_users?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ValueTypes['shop_api_users_set_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** filter the rows which have to be updated */;
        where: ValueTypes['shop_api_users_bool_exp'] | Variable<any, string>;
      },
      ValueTypes['shop_api_users_mutation_response'],
    ];
    update_shop_api_users_by_pk?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ValueTypes['shop_api_users_set_input']
          | undefined
          | null
          | Variable<any, string>;
        pk_columns:
          | ValueTypes['shop_api_users_pk_columns_input']
          | Variable<any, string>;
      },
      ValueTypes['shop_api_users'],
    ];
    update_shop_api_users_many?: [
      {
        /** updates to execute, in order */
        updates:
          | Array<ValueTypes['shop_api_users_updates']>
          | Variable<any, string>;
      },
      ValueTypes['shop_api_users_mutation_response'],
    ];
    update_shop_product_locks?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ValueTypes['shop_product_locks_set_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** filter the rows which have to be updated */;
        where:
          | ValueTypes['shop_product_locks_bool_exp']
          | Variable<any, string>;
      },
      ValueTypes['shop_product_locks_mutation_response'],
    ];
    update_shop_product_locks_by_pk?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ValueTypes['shop_product_locks_set_input']
          | undefined
          | null
          | Variable<any, string>;
        pk_columns:
          | ValueTypes['shop_product_locks_pk_columns_input']
          | Variable<any, string>;
      },
      ValueTypes['shop_product_locks'],
    ];
    update_shop_product_locks_many?: [
      {
        /** updates to execute, in order */
        updates:
          | Array<ValueTypes['shop_product_locks_updates']>
          | Variable<any, string>;
      },
      ValueTypes['shop_product_locks_mutation_response'],
    ];
    update_users?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ValueTypes['users_set_input']
          | undefined
          | null
          | Variable<
              any,
              string
            > /** filter the rows which have to be updated */;
        where: ValueTypes['users_bool_exp'] | Variable<any, string>;
      },
      ValueTypes['users_mutation_response'],
    ];
    update_users_by_pk?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ValueTypes['users_set_input']
          | undefined
          | null
          | Variable<any, string>;
        pk_columns:
          | ValueTypes['users_pk_columns_input']
          | Variable<any, string>;
      },
      ValueTypes['users'],
    ];
    update_users_many?: [
      {
        /** updates to execute, in order */
        updates: Array<ValueTypes['users_updates']> | Variable<any, string>;
      },
      ValueTypes['users_mutation_response'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['numeric']: number;
  /** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
  ['numeric_comparison_exp']: {
    _eq?: ValueTypes['numeric'] | undefined | null | Variable<any, string>;
    _gt?: ValueTypes['numeric'] | undefined | null | Variable<any, string>;
    _gte?: ValueTypes['numeric'] | undefined | null | Variable<any, string>;
    _in?:
      | Array<ValueTypes['numeric']>
      | undefined
      | null
      | Variable<any, string>;
    _is_null?: boolean | undefined | null | Variable<any, string>;
    _lt?: ValueTypes['numeric'] | undefined | null | Variable<any, string>;
    _lte?: ValueTypes['numeric'] | undefined | null | Variable<any, string>;
    _neq?: ValueTypes['numeric'] | undefined | null | Variable<any, string>;
    _nin?:
      | Array<ValueTypes['numeric']>
      | undefined
      | null
      | Variable<any, string>;
  };
  /** column ordering options */
  ['order_by']: order_by;
  ['query_root']: AliasType<{
    contribution_votes?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contribution_votes_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contribution_votes_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contribution_votes_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contribution_votes'],
    ];
    contribution_votes_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contribution_votes_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contribution_votes_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contribution_votes_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contribution_votes_aggregate'],
    ];
    contribution_votes_by_pk?: [
      {
        contribution_id: ValueTypes['uuid'] | Variable<any, string>;
        user_id: ValueTypes['uuid'] | Variable<any, string>;
      },
      ValueTypes['contribution_votes'],
    ];
    contributions?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contributions_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contributions_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contributions_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributions'],
    ];
    contributions_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contributions_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contributions_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contributions_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributions_aggregate'],
    ];
    contributions_by_pk?: [
      { id: ValueTypes['uuid'] | Variable<any, string> },
      ValueTypes['contributions'],
    ];
    contributors?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contributors_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contributors_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contributors_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributors'],
    ];
    contributors_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contributors_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contributors_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contributors_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributors_aggregate'],
    ];
    contributors_by_pk?: [
      {
        contribution_id: ValueTypes['uuid'] | Variable<any, string>;
        user_id: ValueTypes['uuid'] | Variable<any, string>;
      },
      ValueTypes['contributors'],
    ];
    robot_merkle_claims?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_merkle_claims_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_merkle_claims_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_merkle_claims_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_claims'],
    ];
    robot_merkle_claims_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_merkle_claims_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_merkle_claims_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_merkle_claims_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_claims_aggregate'],
    ];
    robot_merkle_claims_by_pk?: [
      { id: ValueTypes['uuid'] | Variable<any, string> },
      ValueTypes['robot_merkle_claims'],
    ];
    robot_merkle_roots?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_merkle_roots_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_merkle_roots_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_merkle_roots_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_roots'],
    ];
    robot_merkle_roots_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_merkle_roots_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_merkle_roots_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_merkle_roots_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_roots_aggregate'],
    ];
    robot_merkle_roots_by_pk?: [
      { hash: string | Variable<any, string> },
      ValueTypes['robot_merkle_roots'],
    ];
    robot_order?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_order_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_order_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_order_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_order'],
    ];
    robot_order_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_order_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_order_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_order_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_order_aggregate'],
    ];
    robot_order_by_pk?: [
      { order_id: string | Variable<any, string> },
      ValueTypes['robot_order'],
    ];
    robot_product?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_product_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_product_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_product_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product'],
    ];
    robot_product_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_product_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_product_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_product_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product_aggregate'],
    ];
    robot_product_by_pk?: [
      { id: string | Variable<any, string> },
      ValueTypes['robot_product'],
    ];
    robot_product_designer?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_product_designer_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_product_designer_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_product_designer_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product_designer'],
    ];
    robot_product_designer_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_product_designer_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_product_designer_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_product_designer_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product_designer_aggregate'],
    ];
    robot_product_designer_by_pk?: [
      {
        eth_address: string | Variable<any, string>;
        product_id: string | Variable<any, string>;
      },
      ValueTypes['robot_product_designer'],
    ];
    shop_api_users?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['shop_api_users_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['shop_api_users_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['shop_api_users_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['shop_api_users'],
    ];
    shop_api_users_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['shop_api_users_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['shop_api_users_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['shop_api_users_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['shop_api_users_aggregate'],
    ];
    shop_api_users_by_pk?: [
      { username: string | Variable<any, string> },
      ValueTypes['shop_api_users'],
    ];
    shop_product_locks?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['shop_product_locks_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['shop_product_locks_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['shop_product_locks_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['shop_product_locks'],
    ];
    shop_product_locks_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['shop_product_locks_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['shop_product_locks_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['shop_product_locks_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['shop_product_locks_aggregate'],
    ];
    shop_product_locks_by_pk?: [
      {
        access_code: string | Variable<any, string>;
        lock_id: string | Variable<any, string>;
      },
      ValueTypes['shop_product_locks'],
    ];
    users?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['users_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['users_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['users_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['users'],
    ];
    users_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['users_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['users_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['users_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['users_aggregate'],
    ];
    users_by_pk?: [
      { id: ValueTypes['uuid'] | Variable<any, string> },
      ValueTypes['users'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  /** Claim data for recipients in a merkle giveaway */
  ['robot_merkle_claims']: AliasType<{
    claim_json?: [
      {
        /** JSON select path */
        path?: string | undefined | null | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    id?: boolean | `@${string}`;
    /** An object relationship */
    merkle_root?: ValueTypes['robot_merkle_roots'];
    merkle_root_hash?: boolean | `@${string}`;
    recipient_eth_address?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "robot.merkle_claims" */
  ['robot_merkle_claims_aggregate']: AliasType<{
    aggregate?: ValueTypes['robot_merkle_claims_aggregate_fields'];
    nodes?: ValueTypes['robot_merkle_claims'];
    __typename?: boolean | `@${string}`;
  }>;
  ['robot_merkle_claims_aggregate_bool_exp']: {
    count?:
      | ValueTypes['robot_merkle_claims_aggregate_bool_exp_count']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['robot_merkle_claims_aggregate_bool_exp_count']: {
    arguments?:
      | Array<ValueTypes['robot_merkle_claims_select_column']>
      | undefined
      | null
      | Variable<any, string>;
    distinct?: boolean | undefined | null | Variable<any, string>;
    filter?:
      | ValueTypes['robot_merkle_claims_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    predicate: ValueTypes['Int_comparison_exp'] | Variable<any, string>;
  };
  /** aggregate fields of "robot.merkle_claims" */
  ['robot_merkle_claims_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?:
          | Array<ValueTypes['robot_merkle_claims_select_column']>
          | undefined
          | null
          | Variable<any, string>;
        distinct?: boolean | undefined | null | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    max?: ValueTypes['robot_merkle_claims_max_fields'];
    min?: ValueTypes['robot_merkle_claims_min_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** order by aggregate values of table "robot.merkle_claims" */
  ['robot_merkle_claims_aggregate_order_by']: {
    count?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    max?:
      | ValueTypes['robot_merkle_claims_max_order_by']
      | undefined
      | null
      | Variable<any, string>;
    min?:
      | ValueTypes['robot_merkle_claims_min_order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** append existing jsonb value of filtered columns with new jsonb value */
  ['robot_merkle_claims_append_input']: {
    claim_json?: ValueTypes['jsonb'] | undefined | null | Variable<any, string>;
  };
  /** input type for inserting array relation for remote table "robot.merkle_claims" */
  ['robot_merkle_claims_arr_rel_insert_input']: {
    data:
      | Array<ValueTypes['robot_merkle_claims_insert_input']>
      | Variable<any, string>;
    /** upsert condition */
    on_conflict?:
      | ValueTypes['robot_merkle_claims_on_conflict']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Boolean expression to filter rows from the table "robot.merkle_claims". All fields are combined with a logical 'AND'. */
  ['robot_merkle_claims_bool_exp']: {
    _and?:
      | Array<ValueTypes['robot_merkle_claims_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    _not?:
      | ValueTypes['robot_merkle_claims_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['robot_merkle_claims_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    claim_json?:
      | ValueTypes['jsonb_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['uuid_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    merkle_root?:
      | ValueTypes['robot_merkle_roots_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    merkle_root_hash?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    recipient_eth_address?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** unique or primary key constraints on table "robot.merkle_claims" */
  ['robot_merkle_claims_constraint']: robot_merkle_claims_constraint;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  ['robot_merkle_claims_delete_at_path_input']: {
    claim_json?: Array<string> | undefined | null | Variable<any, string>;
  };
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  ['robot_merkle_claims_delete_elem_input']: {
    claim_json?: number | undefined | null | Variable<any, string>;
  };
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  ['robot_merkle_claims_delete_key_input']: {
    claim_json?: string | undefined | null | Variable<any, string>;
  };
  /** input type for inserting data into table "robot.merkle_claims" */
  ['robot_merkle_claims_insert_input']: {
    claim_json?: ValueTypes['jsonb'] | undefined | null | Variable<any, string>;
    id?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    merkle_root?:
      | ValueTypes['robot_merkle_roots_obj_rel_insert_input']
      | undefined
      | null
      | Variable<any, string>;
    merkle_root_hash?: string | undefined | null | Variable<any, string>;
    recipient_eth_address?: string | undefined | null | Variable<any, string>;
  };
  /** aggregate max on columns */
  ['robot_merkle_claims_max_fields']: AliasType<{
    id?: boolean | `@${string}`;
    merkle_root_hash?: boolean | `@${string}`;
    recipient_eth_address?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by max() on columns of table "robot.merkle_claims" */
  ['robot_merkle_claims_max_order_by']: {
    id?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    merkle_root_hash?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    recipient_eth_address?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate min on columns */
  ['robot_merkle_claims_min_fields']: AliasType<{
    id?: boolean | `@${string}`;
    merkle_root_hash?: boolean | `@${string}`;
    recipient_eth_address?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by min() on columns of table "robot.merkle_claims" */
  ['robot_merkle_claims_min_order_by']: {
    id?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    merkle_root_hash?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    recipient_eth_address?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** response of any mutation on the table "robot.merkle_claims" */
  ['robot_merkle_claims_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['robot_merkle_claims'];
    __typename?: boolean | `@${string}`;
  }>;
  /** on_conflict condition type for table "robot.merkle_claims" */
  ['robot_merkle_claims_on_conflict']: {
    constraint:
      | ValueTypes['robot_merkle_claims_constraint']
      | Variable<any, string>;
    update_columns:
      | Array<ValueTypes['robot_merkle_claims_update_column']>
      | Variable<any, string>;
    where?:
      | ValueTypes['robot_merkle_claims_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Ordering options when selecting data from "robot.merkle_claims". */
  ['robot_merkle_claims_order_by']: {
    claim_json?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    id?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    merkle_root?:
      | ValueTypes['robot_merkle_roots_order_by']
      | undefined
      | null
      | Variable<any, string>;
    merkle_root_hash?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    recipient_eth_address?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** primary key columns input for table: robot.merkle_claims */
  ['robot_merkle_claims_pk_columns_input']: {
    id: ValueTypes['uuid'] | Variable<any, string>;
  };
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  ['robot_merkle_claims_prepend_input']: {
    claim_json?: ValueTypes['jsonb'] | undefined | null | Variable<any, string>;
  };
  /** select columns of table "robot.merkle_claims" */
  ['robot_merkle_claims_select_column']: robot_merkle_claims_select_column;
  /** input type for updating data in table "robot.merkle_claims" */
  ['robot_merkle_claims_set_input']: {
    claim_json?: ValueTypes['jsonb'] | undefined | null | Variable<any, string>;
    id?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    merkle_root_hash?: string | undefined | null | Variable<any, string>;
    recipient_eth_address?: string | undefined | null | Variable<any, string>;
  };
  /** Streaming cursor of the table "robot_merkle_claims" */
  ['robot_merkle_claims_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value:
      | ValueTypes['robot_merkle_claims_stream_cursor_value_input']
      | Variable<any, string>;
    /** cursor ordering */
    ordering?:
      | ValueTypes['cursor_ordering']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_merkle_claims_stream_cursor_value_input']: {
    claim_json?: ValueTypes['jsonb'] | undefined | null | Variable<any, string>;
    id?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    merkle_root_hash?: string | undefined | null | Variable<any, string>;
    recipient_eth_address?: string | undefined | null | Variable<any, string>;
  };
  /** update columns of table "robot.merkle_claims" */
  ['robot_merkle_claims_update_column']: robot_merkle_claims_update_column;
  ['robot_merkle_claims_updates']: {
    /** append existing jsonb value of filtered columns with new jsonb value */
    _append?:
      | ValueTypes['robot_merkle_claims_append_input']
      | undefined
      | null
      | Variable<any, string>;
    /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
    _delete_at_path?:
      | ValueTypes['robot_merkle_claims_delete_at_path_input']
      | undefined
      | null
      | Variable<any, string>;
    /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
    _delete_elem?:
      | ValueTypes['robot_merkle_claims_delete_elem_input']
      | undefined
      | null
      | Variable<any, string>;
    /** delete key/value pair or string element. key/value pairs are matched based on their key value */
    _delete_key?:
      | ValueTypes['robot_merkle_claims_delete_key_input']
      | undefined
      | null
      | Variable<any, string>;
    /** prepend existing jsonb value of filtered columns with new jsonb value */
    _prepend?:
      | ValueTypes['robot_merkle_claims_prepend_input']
      | undefined
      | null
      | Variable<any, string>;
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ValueTypes['robot_merkle_claims_set_input']
      | undefined
      | null
      | Variable<any, string>;
    /** filter the rows which have to be updated */
    where: ValueTypes['robot_merkle_claims_bool_exp'] | Variable<any, string>;
  };
  /** Each merkle root corresponds to a distribution in the giveaway contract */
  ['robot_merkle_roots']: AliasType<{
    contract_address?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    hash?: boolean | `@${string}`;
    merkle_claims?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_merkle_claims_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_merkle_claims_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_merkle_claims_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_claims'],
    ];
    merkle_claims_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_merkle_claims_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_merkle_claims_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_merkle_claims_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_claims_aggregate'],
    ];
    network?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "robot.merkle_roots" */
  ['robot_merkle_roots_aggregate']: AliasType<{
    aggregate?: ValueTypes['robot_merkle_roots_aggregate_fields'];
    nodes?: ValueTypes['robot_merkle_roots'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate fields of "robot.merkle_roots" */
  ['robot_merkle_roots_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?:
          | Array<ValueTypes['robot_merkle_roots_select_column']>
          | undefined
          | null
          | Variable<any, string>;
        distinct?: boolean | undefined | null | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    max?: ValueTypes['robot_merkle_roots_max_fields'];
    min?: ValueTypes['robot_merkle_roots_min_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** Boolean expression to filter rows from the table "robot.merkle_roots". All fields are combined with a logical 'AND'. */
  ['robot_merkle_roots_bool_exp']: {
    _and?:
      | Array<ValueTypes['robot_merkle_roots_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    _not?:
      | ValueTypes['robot_merkle_roots_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['robot_merkle_roots_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    contract_address?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    created_at?:
      | ValueTypes['timestamptz_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    hash?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    merkle_claims?:
      | ValueTypes['robot_merkle_claims_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    merkle_claims_aggregate?:
      | ValueTypes['robot_merkle_claims_aggregate_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    network?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** unique or primary key constraints on table "robot.merkle_roots" */
  ['robot_merkle_roots_constraint']: robot_merkle_roots_constraint;
  /** input type for inserting data into table "robot.merkle_roots" */
  ['robot_merkle_roots_insert_input']: {
    contract_address?: string | undefined | null | Variable<any, string>;
    created_at?:
      | ValueTypes['timestamptz']
      | undefined
      | null
      | Variable<any, string>;
    hash?: string | undefined | null | Variable<any, string>;
    merkle_claims?:
      | ValueTypes['robot_merkle_claims_arr_rel_insert_input']
      | undefined
      | null
      | Variable<any, string>;
    network?: string | undefined | null | Variable<any, string>;
  };
  /** aggregate max on columns */
  ['robot_merkle_roots_max_fields']: AliasType<{
    contract_address?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    hash?: boolean | `@${string}`;
    network?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate min on columns */
  ['robot_merkle_roots_min_fields']: AliasType<{
    contract_address?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    hash?: boolean | `@${string}`;
    network?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** response of any mutation on the table "robot.merkle_roots" */
  ['robot_merkle_roots_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['robot_merkle_roots'];
    __typename?: boolean | `@${string}`;
  }>;
  /** input type for inserting object relation for remote table "robot.merkle_roots" */
  ['robot_merkle_roots_obj_rel_insert_input']: {
    data: ValueTypes['robot_merkle_roots_insert_input'] | Variable<any, string>;
    /** upsert condition */
    on_conflict?:
      | ValueTypes['robot_merkle_roots_on_conflict']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** on_conflict condition type for table "robot.merkle_roots" */
  ['robot_merkle_roots_on_conflict']: {
    constraint:
      | ValueTypes['robot_merkle_roots_constraint']
      | Variable<any, string>;
    update_columns:
      | Array<ValueTypes['robot_merkle_roots_update_column']>
      | Variable<any, string>;
    where?:
      | ValueTypes['robot_merkle_roots_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Ordering options when selecting data from "robot.merkle_roots". */
  ['robot_merkle_roots_order_by']: {
    contract_address?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    created_at?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    hash?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    merkle_claims_aggregate?:
      | ValueTypes['robot_merkle_claims_aggregate_order_by']
      | undefined
      | null
      | Variable<any, string>;
    network?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
  };
  /** primary key columns input for table: robot.merkle_roots */
  ['robot_merkle_roots_pk_columns_input']: {
    hash: string | Variable<any, string>;
  };
  /** select columns of table "robot.merkle_roots" */
  ['robot_merkle_roots_select_column']: robot_merkle_roots_select_column;
  /** input type for updating data in table "robot.merkle_roots" */
  ['robot_merkle_roots_set_input']: {
    contract_address?: string | undefined | null | Variable<any, string>;
    created_at?:
      | ValueTypes['timestamptz']
      | undefined
      | null
      | Variable<any, string>;
    hash?: string | undefined | null | Variable<any, string>;
    network?: string | undefined | null | Variable<any, string>;
  };
  /** Streaming cursor of the table "robot_merkle_roots" */
  ['robot_merkle_roots_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value:
      | ValueTypes['robot_merkle_roots_stream_cursor_value_input']
      | Variable<any, string>;
    /** cursor ordering */
    ordering?:
      | ValueTypes['cursor_ordering']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_merkle_roots_stream_cursor_value_input']: {
    contract_address?: string | undefined | null | Variable<any, string>;
    created_at?:
      | ValueTypes['timestamptz']
      | undefined
      | null
      | Variable<any, string>;
    hash?: string | undefined | null | Variable<any, string>;
    network?: string | undefined | null | Variable<any, string>;
  };
  /** update columns of table "robot.merkle_roots" */
  ['robot_merkle_roots_update_column']: robot_merkle_roots_update_column;
  ['robot_merkle_roots_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ValueTypes['robot_merkle_roots_set_input']
      | undefined
      | null
      | Variable<any, string>;
    /** filter the rows which have to be updated */
    where: ValueTypes['robot_merkle_roots_bool_exp'] | Variable<any, string>;
  };
  /** Orders for ROBOT rewards */
  ['robot_order']: AliasType<{
    buyer_address?: boolean | `@${string}`;
    buyer_reward?: boolean | `@${string}`;
    date?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    order_id?: boolean | `@${string}`;
    order_number?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "robot.order" */
  ['robot_order_aggregate']: AliasType<{
    aggregate?: ValueTypes['robot_order_aggregate_fields'];
    nodes?: ValueTypes['robot_order'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate fields of "robot.order" */
  ['robot_order_aggregate_fields']: AliasType<{
    avg?: ValueTypes['robot_order_avg_fields'];
    count?: [
      {
        columns?:
          | Array<ValueTypes['robot_order_select_column']>
          | undefined
          | null
          | Variable<any, string>;
        distinct?: boolean | undefined | null | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    max?: ValueTypes['robot_order_max_fields'];
    min?: ValueTypes['robot_order_min_fields'];
    stddev?: ValueTypes['robot_order_stddev_fields'];
    stddev_pop?: ValueTypes['robot_order_stddev_pop_fields'];
    stddev_samp?: ValueTypes['robot_order_stddev_samp_fields'];
    sum?: ValueTypes['robot_order_sum_fields'];
    var_pop?: ValueTypes['robot_order_var_pop_fields'];
    var_samp?: ValueTypes['robot_order_var_samp_fields'];
    variance?: ValueTypes['robot_order_variance_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate avg on columns */
  ['robot_order_avg_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Boolean expression to filter rows from the table "robot.order". All fields are combined with a logical 'AND'. */
  ['robot_order_bool_exp']: {
    _and?:
      | Array<ValueTypes['robot_order_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    _not?:
      | ValueTypes['robot_order_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['robot_order_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    buyer_address?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    buyer_reward?:
      | ValueTypes['numeric_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    date?:
      | ValueTypes['date_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    dollars_spent?:
      | ValueTypes['numeric_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    order_id?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    order_number?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    season?:
      | ValueTypes['numeric_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** unique or primary key constraints on table "robot.order" */
  ['robot_order_constraint']: robot_order_constraint;
  /** input type for incrementing numeric columns in table "robot.order" */
  ['robot_order_inc_input']: {
    buyer_reward?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
    dollars_spent?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
    season?: ValueTypes['numeric'] | undefined | null | Variable<any, string>;
  };
  /** input type for inserting data into table "robot.order" */
  ['robot_order_insert_input']: {
    buyer_address?: string | undefined | null | Variable<any, string>;
    buyer_reward?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
    date?: ValueTypes['date'] | undefined | null | Variable<any, string>;
    dollars_spent?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
    order_id?: string | undefined | null | Variable<any, string>;
    order_number?: string | undefined | null | Variable<any, string>;
    season?: ValueTypes['numeric'] | undefined | null | Variable<any, string>;
  };
  /** aggregate max on columns */
  ['robot_order_max_fields']: AliasType<{
    buyer_address?: boolean | `@${string}`;
    buyer_reward?: boolean | `@${string}`;
    date?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    order_id?: boolean | `@${string}`;
    order_number?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate min on columns */
  ['robot_order_min_fields']: AliasType<{
    buyer_address?: boolean | `@${string}`;
    buyer_reward?: boolean | `@${string}`;
    date?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    order_id?: boolean | `@${string}`;
    order_number?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** response of any mutation on the table "robot.order" */
  ['robot_order_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['robot_order'];
    __typename?: boolean | `@${string}`;
  }>;
  /** on_conflict condition type for table "robot.order" */
  ['robot_order_on_conflict']: {
    constraint: ValueTypes['robot_order_constraint'] | Variable<any, string>;
    update_columns:
      | Array<ValueTypes['robot_order_update_column']>
      | Variable<any, string>;
    where?:
      | ValueTypes['robot_order_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Ordering options when selecting data from "robot.order". */
  ['robot_order_order_by']: {
    buyer_address?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    buyer_reward?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    date?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    dollars_spent?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    order_id?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    order_number?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    season?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
  };
  /** primary key columns input for table: robot.order */
  ['robot_order_pk_columns_input']: {
    order_id: string | Variable<any, string>;
  };
  /** select columns of table "robot.order" */
  ['robot_order_select_column']: robot_order_select_column;
  /** input type for updating data in table "robot.order" */
  ['robot_order_set_input']: {
    buyer_address?: string | undefined | null | Variable<any, string>;
    buyer_reward?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
    date?: ValueTypes['date'] | undefined | null | Variable<any, string>;
    dollars_spent?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
    order_id?: string | undefined | null | Variable<any, string>;
    order_number?: string | undefined | null | Variable<any, string>;
    season?: ValueTypes['numeric'] | undefined | null | Variable<any, string>;
  };
  /** aggregate stddev on columns */
  ['robot_order_stddev_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate stddev_pop on columns */
  ['robot_order_stddev_pop_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate stddev_samp on columns */
  ['robot_order_stddev_samp_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Streaming cursor of the table "robot_order" */
  ['robot_order_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value:
      | ValueTypes['robot_order_stream_cursor_value_input']
      | Variable<any, string>;
    /** cursor ordering */
    ordering?:
      | ValueTypes['cursor_ordering']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_order_stream_cursor_value_input']: {
    buyer_address?: string | undefined | null | Variable<any, string>;
    buyer_reward?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
    date?: ValueTypes['date'] | undefined | null | Variable<any, string>;
    dollars_spent?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
    order_id?: string | undefined | null | Variable<any, string>;
    order_number?: string | undefined | null | Variable<any, string>;
    season?: ValueTypes['numeric'] | undefined | null | Variable<any, string>;
  };
  /** aggregate sum on columns */
  ['robot_order_sum_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** update columns of table "robot.order" */
  ['robot_order_update_column']: robot_order_update_column;
  ['robot_order_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?:
      | ValueTypes['robot_order_inc_input']
      | undefined
      | null
      | Variable<any, string>;
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ValueTypes['robot_order_set_input']
      | undefined
      | null
      | Variable<any, string>;
    /** filter the rows which have to be updated */
    where: ValueTypes['robot_order_bool_exp'] | Variable<any, string>;
  };
  /** aggregate var_pop on columns */
  ['robot_order_var_pop_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate var_samp on columns */
  ['robot_order_var_samp_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate variance on columns */
  ['robot_order_variance_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Products for ROBOT designer rewards */
  ['robot_product']: AliasType<{
    designers?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_product_designer_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_product_designer_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_product_designer_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product_designer'],
    ];
    designers_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_product_designer_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_product_designer_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_product_designer_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product_designer_aggregate'],
    ];
    id?: boolean | `@${string}`;
    nft_metadata?: [
      {
        /** JSON select path */
        path?: string | undefined | null | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    nft_token_id?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    shopify_id?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "robot.product" */
  ['robot_product_aggregate']: AliasType<{
    aggregate?: ValueTypes['robot_product_aggregate_fields'];
    nodes?: ValueTypes['robot_product'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate fields of "robot.product" */
  ['robot_product_aggregate_fields']: AliasType<{
    avg?: ValueTypes['robot_product_avg_fields'];
    count?: [
      {
        columns?:
          | Array<ValueTypes['robot_product_select_column']>
          | undefined
          | null
          | Variable<any, string>;
        distinct?: boolean | undefined | null | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    max?: ValueTypes['robot_product_max_fields'];
    min?: ValueTypes['robot_product_min_fields'];
    stddev?: ValueTypes['robot_product_stddev_fields'];
    stddev_pop?: ValueTypes['robot_product_stddev_pop_fields'];
    stddev_samp?: ValueTypes['robot_product_stddev_samp_fields'];
    sum?: ValueTypes['robot_product_sum_fields'];
    var_pop?: ValueTypes['robot_product_var_pop_fields'];
    var_samp?: ValueTypes['robot_product_var_samp_fields'];
    variance?: ValueTypes['robot_product_variance_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** append existing jsonb value of filtered columns with new jsonb value */
  ['robot_product_append_input']: {
    nft_metadata?:
      | ValueTypes['jsonb']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate avg on columns */
  ['robot_product_avg_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Boolean expression to filter rows from the table "robot.product". All fields are combined with a logical 'AND'. */
  ['robot_product_bool_exp']: {
    _and?:
      | Array<ValueTypes['robot_product_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    _not?:
      | ValueTypes['robot_product_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['robot_product_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    designers?:
      | ValueTypes['robot_product_designer_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    designers_aggregate?:
      | ValueTypes['robot_product_designer_aggregate_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    nft_metadata?:
      | ValueTypes['jsonb_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    nft_token_id?:
      | ValueTypes['Int_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    notion_id?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    shopify_id?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    title?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** unique or primary key constraints on table "robot.product" */
  ['robot_product_constraint']: robot_product_constraint;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  ['robot_product_delete_at_path_input']: {
    nft_metadata?: Array<string> | undefined | null | Variable<any, string>;
  };
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  ['robot_product_delete_elem_input']: {
    nft_metadata?: number | undefined | null | Variable<any, string>;
  };
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  ['robot_product_delete_key_input']: {
    nft_metadata?: string | undefined | null | Variable<any, string>;
  };
  /** Designer receiving ROBOT rewards */
  ['robot_product_designer']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    designer_name?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    /** An object relationship */
    product?: ValueTypes['robot_product'];
    product_id?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "robot.product_designer" */
  ['robot_product_designer_aggregate']: AliasType<{
    aggregate?: ValueTypes['robot_product_designer_aggregate_fields'];
    nodes?: ValueTypes['robot_product_designer'];
    __typename?: boolean | `@${string}`;
  }>;
  ['robot_product_designer_aggregate_bool_exp']: {
    count?:
      | ValueTypes['robot_product_designer_aggregate_bool_exp_count']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['robot_product_designer_aggregate_bool_exp_count']: {
    arguments?:
      | Array<ValueTypes['robot_product_designer_select_column']>
      | undefined
      | null
      | Variable<any, string>;
    distinct?: boolean | undefined | null | Variable<any, string>;
    filter?:
      | ValueTypes['robot_product_designer_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    predicate: ValueTypes['Int_comparison_exp'] | Variable<any, string>;
  };
  /** aggregate fields of "robot.product_designer" */
  ['robot_product_designer_aggregate_fields']: AliasType<{
    avg?: ValueTypes['robot_product_designer_avg_fields'];
    count?: [
      {
        columns?:
          | Array<ValueTypes['robot_product_designer_select_column']>
          | undefined
          | null
          | Variable<any, string>;
        distinct?: boolean | undefined | null | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    max?: ValueTypes['robot_product_designer_max_fields'];
    min?: ValueTypes['robot_product_designer_min_fields'];
    stddev?: ValueTypes['robot_product_designer_stddev_fields'];
    stddev_pop?: ValueTypes['robot_product_designer_stddev_pop_fields'];
    stddev_samp?: ValueTypes['robot_product_designer_stddev_samp_fields'];
    sum?: ValueTypes['robot_product_designer_sum_fields'];
    var_pop?: ValueTypes['robot_product_designer_var_pop_fields'];
    var_samp?: ValueTypes['robot_product_designer_var_samp_fields'];
    variance?: ValueTypes['robot_product_designer_variance_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** order by aggregate values of table "robot.product_designer" */
  ['robot_product_designer_aggregate_order_by']: {
    avg?:
      | ValueTypes['robot_product_designer_avg_order_by']
      | undefined
      | null
      | Variable<any, string>;
    count?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    max?:
      | ValueTypes['robot_product_designer_max_order_by']
      | undefined
      | null
      | Variable<any, string>;
    min?:
      | ValueTypes['robot_product_designer_min_order_by']
      | undefined
      | null
      | Variable<any, string>;
    stddev?:
      | ValueTypes['robot_product_designer_stddev_order_by']
      | undefined
      | null
      | Variable<any, string>;
    stddev_pop?:
      | ValueTypes['robot_product_designer_stddev_pop_order_by']
      | undefined
      | null
      | Variable<any, string>;
    stddev_samp?:
      | ValueTypes['robot_product_designer_stddev_samp_order_by']
      | undefined
      | null
      | Variable<any, string>;
    sum?:
      | ValueTypes['robot_product_designer_sum_order_by']
      | undefined
      | null
      | Variable<any, string>;
    var_pop?:
      | ValueTypes['robot_product_designer_var_pop_order_by']
      | undefined
      | null
      | Variable<any, string>;
    var_samp?:
      | ValueTypes['robot_product_designer_var_samp_order_by']
      | undefined
      | null
      | Variable<any, string>;
    variance?:
      | ValueTypes['robot_product_designer_variance_order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** input type for inserting array relation for remote table "robot.product_designer" */
  ['robot_product_designer_arr_rel_insert_input']: {
    data:
      | Array<ValueTypes['robot_product_designer_insert_input']>
      | Variable<any, string>;
    /** upsert condition */
    on_conflict?:
      | ValueTypes['robot_product_designer_on_conflict']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate avg on columns */
  ['robot_product_designer_avg_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by avg() on columns of table "robot.product_designer" */
  ['robot_product_designer_avg_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    robot_reward?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Boolean expression to filter rows from the table "robot.product_designer". All fields are combined with a logical 'AND'. */
  ['robot_product_designer_bool_exp']: {
    _and?:
      | Array<ValueTypes['robot_product_designer_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    _not?:
      | ValueTypes['robot_product_designer_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['robot_product_designer_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    contribution_share?:
      | ValueTypes['numeric_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    designer_name?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    eth_address?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    product?:
      | ValueTypes['robot_product_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    product_id?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    robot_reward?:
      | ValueTypes['numeric_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** unique or primary key constraints on table "robot.product_designer" */
  ['robot_product_designer_constraint']: robot_product_designer_constraint;
  /** input type for incrementing numeric columns in table "robot.product_designer" */
  ['robot_product_designer_inc_input']: {
    contribution_share?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
    robot_reward?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** input type for inserting data into table "robot.product_designer" */
  ['robot_product_designer_insert_input']: {
    contribution_share?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
    designer_name?: string | undefined | null | Variable<any, string>;
    eth_address?: string | undefined | null | Variable<any, string>;
    product?:
      | ValueTypes['robot_product_obj_rel_insert_input']
      | undefined
      | null
      | Variable<any, string>;
    product_id?: string | undefined | null | Variable<any, string>;
    robot_reward?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate max on columns */
  ['robot_product_designer_max_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    designer_name?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    product_id?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by max() on columns of table "robot.product_designer" */
  ['robot_product_designer_max_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    designer_name?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    eth_address?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    product_id?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    robot_reward?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate min on columns */
  ['robot_product_designer_min_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    designer_name?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    product_id?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by min() on columns of table "robot.product_designer" */
  ['robot_product_designer_min_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    designer_name?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    eth_address?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    product_id?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    robot_reward?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** response of any mutation on the table "robot.product_designer" */
  ['robot_product_designer_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['robot_product_designer'];
    __typename?: boolean | `@${string}`;
  }>;
  /** on_conflict condition type for table "robot.product_designer" */
  ['robot_product_designer_on_conflict']: {
    constraint:
      | ValueTypes['robot_product_designer_constraint']
      | Variable<any, string>;
    update_columns:
      | Array<ValueTypes['robot_product_designer_update_column']>
      | Variable<any, string>;
    where?:
      | ValueTypes['robot_product_designer_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Ordering options when selecting data from "robot.product_designer". */
  ['robot_product_designer_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    designer_name?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    eth_address?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    product?:
      | ValueTypes['robot_product_order_by']
      | undefined
      | null
      | Variable<any, string>;
    product_id?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    robot_reward?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** primary key columns input for table: robot.product_designer */
  ['robot_product_designer_pk_columns_input']: {
    eth_address: string | Variable<any, string>;
    product_id: string | Variable<any, string>;
  };
  /** select columns of table "robot.product_designer" */
  ['robot_product_designer_select_column']: robot_product_designer_select_column;
  /** input type for updating data in table "robot.product_designer" */
  ['robot_product_designer_set_input']: {
    contribution_share?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
    designer_name?: string | undefined | null | Variable<any, string>;
    eth_address?: string | undefined | null | Variable<any, string>;
    product_id?: string | undefined | null | Variable<any, string>;
    robot_reward?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate stddev on columns */
  ['robot_product_designer_stddev_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by stddev() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    robot_reward?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate stddev_pop on columns */
  ['robot_product_designer_stddev_pop_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by stddev_pop() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_pop_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    robot_reward?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate stddev_samp on columns */
  ['robot_product_designer_stddev_samp_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by stddev_samp() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_samp_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    robot_reward?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Streaming cursor of the table "robot_product_designer" */
  ['robot_product_designer_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value:
      | ValueTypes['robot_product_designer_stream_cursor_value_input']
      | Variable<any, string>;
    /** cursor ordering */
    ordering?:
      | ValueTypes['cursor_ordering']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_product_designer_stream_cursor_value_input']: {
    contribution_share?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
    designer_name?: string | undefined | null | Variable<any, string>;
    eth_address?: string | undefined | null | Variable<any, string>;
    product_id?: string | undefined | null | Variable<any, string>;
    robot_reward?:
      | ValueTypes['numeric']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate sum on columns */
  ['robot_product_designer_sum_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by sum() on columns of table "robot.product_designer" */
  ['robot_product_designer_sum_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    robot_reward?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** update columns of table "robot.product_designer" */
  ['robot_product_designer_update_column']: robot_product_designer_update_column;
  ['robot_product_designer_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?:
      | ValueTypes['robot_product_designer_inc_input']
      | undefined
      | null
      | Variable<any, string>;
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ValueTypes['robot_product_designer_set_input']
      | undefined
      | null
      | Variable<any, string>;
    /** filter the rows which have to be updated */
    where:
      | ValueTypes['robot_product_designer_bool_exp']
      | Variable<any, string>;
  };
  /** aggregate var_pop on columns */
  ['robot_product_designer_var_pop_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by var_pop() on columns of table "robot.product_designer" */
  ['robot_product_designer_var_pop_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    robot_reward?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate var_samp on columns */
  ['robot_product_designer_var_samp_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by var_samp() on columns of table "robot.product_designer" */
  ['robot_product_designer_var_samp_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    robot_reward?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** aggregate variance on columns */
  ['robot_product_designer_variance_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by variance() on columns of table "robot.product_designer" */
  ['robot_product_designer_variance_order_by']: {
    contribution_share?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    robot_reward?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** input type for incrementing numeric columns in table "robot.product" */
  ['robot_product_inc_input']: {
    nft_token_id?: number | undefined | null | Variable<any, string>;
  };
  /** input type for inserting data into table "robot.product" */
  ['robot_product_insert_input']: {
    designers?:
      | ValueTypes['robot_product_designer_arr_rel_insert_input']
      | undefined
      | null
      | Variable<any, string>;
    id?: string | undefined | null | Variable<any, string>;
    nft_metadata?:
      | ValueTypes['jsonb']
      | undefined
      | null
      | Variable<any, string>;
    nft_token_id?: number | undefined | null | Variable<any, string>;
    notion_id?: string | undefined | null | Variable<any, string>;
    shopify_id?: string | undefined | null | Variable<any, string>;
    title?: string | undefined | null | Variable<any, string>;
  };
  /** aggregate max on columns */
  ['robot_product_max_fields']: AliasType<{
    id?: boolean | `@${string}`;
    nft_token_id?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    shopify_id?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate min on columns */
  ['robot_product_min_fields']: AliasType<{
    id?: boolean | `@${string}`;
    nft_token_id?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    shopify_id?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** response of any mutation on the table "robot.product" */
  ['robot_product_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['robot_product'];
    __typename?: boolean | `@${string}`;
  }>;
  /** input type for inserting object relation for remote table "robot.product" */
  ['robot_product_obj_rel_insert_input']: {
    data: ValueTypes['robot_product_insert_input'] | Variable<any, string>;
    /** upsert condition */
    on_conflict?:
      | ValueTypes['robot_product_on_conflict']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** on_conflict condition type for table "robot.product" */
  ['robot_product_on_conflict']: {
    constraint: ValueTypes['robot_product_constraint'] | Variable<any, string>;
    update_columns:
      | Array<ValueTypes['robot_product_update_column']>
      | Variable<any, string>;
    where?:
      | ValueTypes['robot_product_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Ordering options when selecting data from "robot.product". */
  ['robot_product_order_by']: {
    designers_aggregate?:
      | ValueTypes['robot_product_designer_aggregate_order_by']
      | undefined
      | null
      | Variable<any, string>;
    id?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    nft_metadata?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    nft_token_id?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    notion_id?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    shopify_id?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    title?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
  };
  /** primary key columns input for table: robot.product */
  ['robot_product_pk_columns_input']: {
    id: string | Variable<any, string>;
  };
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  ['robot_product_prepend_input']: {
    nft_metadata?:
      | ValueTypes['jsonb']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** select columns of table "robot.product" */
  ['robot_product_select_column']: robot_product_select_column;
  /** input type for updating data in table "robot.product" */
  ['robot_product_set_input']: {
    id?: string | undefined | null | Variable<any, string>;
    nft_metadata?:
      | ValueTypes['jsonb']
      | undefined
      | null
      | Variable<any, string>;
    nft_token_id?: number | undefined | null | Variable<any, string>;
    notion_id?: string | undefined | null | Variable<any, string>;
    shopify_id?: string | undefined | null | Variable<any, string>;
    title?: string | undefined | null | Variable<any, string>;
  };
  /** aggregate stddev on columns */
  ['robot_product_stddev_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate stddev_pop on columns */
  ['robot_product_stddev_pop_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate stddev_samp on columns */
  ['robot_product_stddev_samp_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Streaming cursor of the table "robot_product" */
  ['robot_product_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value:
      | ValueTypes['robot_product_stream_cursor_value_input']
      | Variable<any, string>;
    /** cursor ordering */
    ordering?:
      | ValueTypes['cursor_ordering']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_product_stream_cursor_value_input']: {
    id?: string | undefined | null | Variable<any, string>;
    nft_metadata?:
      | ValueTypes['jsonb']
      | undefined
      | null
      | Variable<any, string>;
    nft_token_id?: number | undefined | null | Variable<any, string>;
    notion_id?: string | undefined | null | Variable<any, string>;
    shopify_id?: string | undefined | null | Variable<any, string>;
    title?: string | undefined | null | Variable<any, string>;
  };
  /** aggregate sum on columns */
  ['robot_product_sum_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** update columns of table "robot.product" */
  ['robot_product_update_column']: robot_product_update_column;
  ['robot_product_updates']: {
    /** append existing jsonb value of filtered columns with new jsonb value */
    _append?:
      | ValueTypes['robot_product_append_input']
      | undefined
      | null
      | Variable<any, string>;
    /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
    _delete_at_path?:
      | ValueTypes['robot_product_delete_at_path_input']
      | undefined
      | null
      | Variable<any, string>;
    /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
    _delete_elem?:
      | ValueTypes['robot_product_delete_elem_input']
      | undefined
      | null
      | Variable<any, string>;
    /** delete key/value pair or string element. key/value pairs are matched based on their key value */
    _delete_key?:
      | ValueTypes['robot_product_delete_key_input']
      | undefined
      | null
      | Variable<any, string>;
    /** increments the numeric columns with given value of the filtered values */
    _inc?:
      | ValueTypes['robot_product_inc_input']
      | undefined
      | null
      | Variable<any, string>;
    /** prepend existing jsonb value of filtered columns with new jsonb value */
    _prepend?:
      | ValueTypes['robot_product_prepend_input']
      | undefined
      | null
      | Variable<any, string>;
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ValueTypes['robot_product_set_input']
      | undefined
      | null
      | Variable<any, string>;
    /** filter the rows which have to be updated */
    where: ValueTypes['robot_product_bool_exp'] | Variable<any, string>;
  };
  /** aggregate var_pop on columns */
  ['robot_product_var_pop_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate var_samp on columns */
  ['robot_product_var_samp_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate variance on columns */
  ['robot_product_variance_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** columns and relationships of "shop.api_users" */
  ['shop_api_users']: AliasType<{
    password_hash?: boolean | `@${string}`;
    username?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "shop.api_users" */
  ['shop_api_users_aggregate']: AliasType<{
    aggregate?: ValueTypes['shop_api_users_aggregate_fields'];
    nodes?: ValueTypes['shop_api_users'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate fields of "shop.api_users" */
  ['shop_api_users_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?:
          | Array<ValueTypes['shop_api_users_select_column']>
          | undefined
          | null
          | Variable<any, string>;
        distinct?: boolean | undefined | null | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    max?: ValueTypes['shop_api_users_max_fields'];
    min?: ValueTypes['shop_api_users_min_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** Boolean expression to filter rows from the table "shop.api_users". All fields are combined with a logical 'AND'. */
  ['shop_api_users_bool_exp']: {
    _and?:
      | Array<ValueTypes['shop_api_users_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    _not?:
      | ValueTypes['shop_api_users_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['shop_api_users_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    password_hash?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    username?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** unique or primary key constraints on table "shop.api_users" */
  ['shop_api_users_constraint']: shop_api_users_constraint;
  /** input type for inserting data into table "shop.api_users" */
  ['shop_api_users_insert_input']: {
    password_hash?: string | undefined | null | Variable<any, string>;
    username?: string | undefined | null | Variable<any, string>;
  };
  /** aggregate max on columns */
  ['shop_api_users_max_fields']: AliasType<{
    password_hash?: boolean | `@${string}`;
    username?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate min on columns */
  ['shop_api_users_min_fields']: AliasType<{
    password_hash?: boolean | `@${string}`;
    username?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** response of any mutation on the table "shop.api_users" */
  ['shop_api_users_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['shop_api_users'];
    __typename?: boolean | `@${string}`;
  }>;
  /** on_conflict condition type for table "shop.api_users" */
  ['shop_api_users_on_conflict']: {
    constraint: ValueTypes['shop_api_users_constraint'] | Variable<any, string>;
    update_columns:
      | Array<ValueTypes['shop_api_users_update_column']>
      | Variable<any, string>;
    where?:
      | ValueTypes['shop_api_users_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Ordering options when selecting data from "shop.api_users". */
  ['shop_api_users_order_by']: {
    password_hash?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    username?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** primary key columns input for table: shop.api_users */
  ['shop_api_users_pk_columns_input']: {
    username: string | Variable<any, string>;
  };
  /** select columns of table "shop.api_users" */
  ['shop_api_users_select_column']: shop_api_users_select_column;
  /** input type for updating data in table "shop.api_users" */
  ['shop_api_users_set_input']: {
    password_hash?: string | undefined | null | Variable<any, string>;
    username?: string | undefined | null | Variable<any, string>;
  };
  /** Streaming cursor of the table "shop_api_users" */
  ['shop_api_users_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value:
      | ValueTypes['shop_api_users_stream_cursor_value_input']
      | Variable<any, string>;
    /** cursor ordering */
    ordering?:
      | ValueTypes['cursor_ordering']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Initial value of the column from where the streaming should start */
  ['shop_api_users_stream_cursor_value_input']: {
    password_hash?: string | undefined | null | Variable<any, string>;
    username?: string | undefined | null | Variable<any, string>;
  };
  /** update columns of table "shop.api_users" */
  ['shop_api_users_update_column']: shop_api_users_update_column;
  ['shop_api_users_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ValueTypes['shop_api_users_set_input']
      | undefined
      | null
      | Variable<any, string>;
    /** filter the rows which have to be updated */
    where: ValueTypes['shop_api_users_bool_exp'] | Variable<any, string>;
  };
  /** columns and relationships of "shop.product_locks" */
  ['shop_product_locks']: AliasType<{
    access_code?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    customer_eth_address?: boolean | `@${string}`;
    lock_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "shop.product_locks" */
  ['shop_product_locks_aggregate']: AliasType<{
    aggregate?: ValueTypes['shop_product_locks_aggregate_fields'];
    nodes?: ValueTypes['shop_product_locks'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate fields of "shop.product_locks" */
  ['shop_product_locks_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?:
          | Array<ValueTypes['shop_product_locks_select_column']>
          | undefined
          | null
          | Variable<any, string>;
        distinct?: boolean | undefined | null | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    max?: ValueTypes['shop_product_locks_max_fields'];
    min?: ValueTypes['shop_product_locks_min_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** Boolean expression to filter rows from the table "shop.product_locks". All fields are combined with a logical 'AND'. */
  ['shop_product_locks_bool_exp']: {
    _and?:
      | Array<ValueTypes['shop_product_locks_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    _not?:
      | ValueTypes['shop_product_locks_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['shop_product_locks_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    access_code?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    created_at?:
      | ValueTypes['timestamptz_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    customer_eth_address?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    lock_id?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** unique or primary key constraints on table "shop.product_locks" */
  ['shop_product_locks_constraint']: shop_product_locks_constraint;
  /** input type for inserting data into table "shop.product_locks" */
  ['shop_product_locks_insert_input']: {
    access_code?: string | undefined | null | Variable<any, string>;
    created_at?:
      | ValueTypes['timestamptz']
      | undefined
      | null
      | Variable<any, string>;
    customer_eth_address?: string | undefined | null | Variable<any, string>;
    lock_id?: string | undefined | null | Variable<any, string>;
  };
  /** aggregate max on columns */
  ['shop_product_locks_max_fields']: AliasType<{
    access_code?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    customer_eth_address?: boolean | `@${string}`;
    lock_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate min on columns */
  ['shop_product_locks_min_fields']: AliasType<{
    access_code?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    customer_eth_address?: boolean | `@${string}`;
    lock_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** response of any mutation on the table "shop.product_locks" */
  ['shop_product_locks_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['shop_product_locks'];
    __typename?: boolean | `@${string}`;
  }>;
  /** on_conflict condition type for table "shop.product_locks" */
  ['shop_product_locks_on_conflict']: {
    constraint:
      | ValueTypes['shop_product_locks_constraint']
      | Variable<any, string>;
    update_columns:
      | Array<ValueTypes['shop_product_locks_update_column']>
      | Variable<any, string>;
    where?:
      | ValueTypes['shop_product_locks_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Ordering options when selecting data from "shop.product_locks". */
  ['shop_product_locks_order_by']: {
    access_code?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    created_at?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    customer_eth_address?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    lock_id?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
  };
  /** primary key columns input for table: shop.product_locks */
  ['shop_product_locks_pk_columns_input']: {
    access_code: string | Variable<any, string>;
    lock_id: string | Variable<any, string>;
  };
  /** select columns of table "shop.product_locks" */
  ['shop_product_locks_select_column']: shop_product_locks_select_column;
  /** input type for updating data in table "shop.product_locks" */
  ['shop_product_locks_set_input']: {
    access_code?: string | undefined | null | Variable<any, string>;
    created_at?:
      | ValueTypes['timestamptz']
      | undefined
      | null
      | Variable<any, string>;
    customer_eth_address?: string | undefined | null | Variable<any, string>;
    lock_id?: string | undefined | null | Variable<any, string>;
  };
  /** Streaming cursor of the table "shop_product_locks" */
  ['shop_product_locks_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value:
      | ValueTypes['shop_product_locks_stream_cursor_value_input']
      | Variable<any, string>;
    /** cursor ordering */
    ordering?:
      | ValueTypes['cursor_ordering']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Initial value of the column from where the streaming should start */
  ['shop_product_locks_stream_cursor_value_input']: {
    access_code?: string | undefined | null | Variable<any, string>;
    created_at?:
      | ValueTypes['timestamptz']
      | undefined
      | null
      | Variable<any, string>;
    customer_eth_address?: string | undefined | null | Variable<any, string>;
    lock_id?: string | undefined | null | Variable<any, string>;
  };
  /** update columns of table "shop.product_locks" */
  ['shop_product_locks_update_column']: shop_product_locks_update_column;
  ['shop_product_locks_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ValueTypes['shop_product_locks_set_input']
      | undefined
      | null
      | Variable<any, string>;
    /** filter the rows which have to be updated */
    where: ValueTypes['shop_product_locks_bool_exp'] | Variable<any, string>;
  };
  ['subscription_root']: AliasType<{
    contribution_votes?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contribution_votes_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contribution_votes_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contribution_votes_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contribution_votes'],
    ];
    contribution_votes_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contribution_votes_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contribution_votes_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contribution_votes_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contribution_votes_aggregate'],
    ];
    contribution_votes_by_pk?: [
      {
        contribution_id: ValueTypes['uuid'] | Variable<any, string>;
        user_id: ValueTypes['uuid'] | Variable<any, string>;
      },
      ValueTypes['contribution_votes'],
    ];
    contribution_votes_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size:
          | number
          | Variable<
              any,
              string
            > /** cursor to stream the results returned by the query */;
        cursor:
          | Array<
              | ValueTypes['contribution_votes_stream_cursor_input']
              | undefined
              | null
            >
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contribution_votes_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contribution_votes'],
    ];
    contributions?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contributions_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contributions_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contributions_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributions'],
    ];
    contributions_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contributions_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contributions_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contributions_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributions_aggregate'],
    ];
    contributions_by_pk?: [
      { id: ValueTypes['uuid'] | Variable<any, string> },
      ValueTypes['contributions'],
    ];
    contributions_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size:
          | number
          | Variable<
              any,
              string
            > /** cursor to stream the results returned by the query */;
        cursor:
          | Array<
              ValueTypes['contributions_stream_cursor_input'] | undefined | null
            >
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contributions_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributions'],
    ];
    contributors?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contributors_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contributors_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contributors_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributors'],
    ];
    contributors_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['contributors_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['contributors_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contributors_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributors_aggregate'],
    ];
    contributors_by_pk?: [
      {
        contribution_id: ValueTypes['uuid'] | Variable<any, string>;
        user_id: ValueTypes['uuid'] | Variable<any, string>;
      },
      ValueTypes['contributors'],
    ];
    contributors_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size:
          | number
          | Variable<
              any,
              string
            > /** cursor to stream the results returned by the query */;
        cursor:
          | Array<
              ValueTypes['contributors_stream_cursor_input'] | undefined | null
            >
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['contributors_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['contributors'],
    ];
    robot_merkle_claims?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_merkle_claims_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_merkle_claims_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_merkle_claims_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_claims'],
    ];
    robot_merkle_claims_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_merkle_claims_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_merkle_claims_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_merkle_claims_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_claims_aggregate'],
    ];
    robot_merkle_claims_by_pk?: [
      { id: ValueTypes['uuid'] | Variable<any, string> },
      ValueTypes['robot_merkle_claims'],
    ];
    robot_merkle_claims_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size:
          | number
          | Variable<
              any,
              string
            > /** cursor to stream the results returned by the query */;
        cursor:
          | Array<
              | ValueTypes['robot_merkle_claims_stream_cursor_input']
              | undefined
              | null
            >
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_merkle_claims_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_claims'],
    ];
    robot_merkle_roots?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_merkle_roots_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_merkle_roots_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_merkle_roots_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_roots'],
    ];
    robot_merkle_roots_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_merkle_roots_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_merkle_roots_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_merkle_roots_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_roots_aggregate'],
    ];
    robot_merkle_roots_by_pk?: [
      { hash: string | Variable<any, string> },
      ValueTypes['robot_merkle_roots'],
    ];
    robot_merkle_roots_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size:
          | number
          | Variable<
              any,
              string
            > /** cursor to stream the results returned by the query */;
        cursor:
          | Array<
              | ValueTypes['robot_merkle_roots_stream_cursor_input']
              | undefined
              | null
            >
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_merkle_roots_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_merkle_roots'],
    ];
    robot_order?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_order_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_order_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_order_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_order'],
    ];
    robot_order_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_order_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_order_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_order_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_order_aggregate'],
    ];
    robot_order_by_pk?: [
      { order_id: string | Variable<any, string> },
      ValueTypes['robot_order'],
    ];
    robot_order_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size:
          | number
          | Variable<
              any,
              string
            > /** cursor to stream the results returned by the query */;
        cursor:
          | Array<
              ValueTypes['robot_order_stream_cursor_input'] | undefined | null
            >
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_order_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_order'],
    ];
    robot_product?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_product_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_product_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_product_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product'],
    ];
    robot_product_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_product_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_product_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_product_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product_aggregate'],
    ];
    robot_product_by_pk?: [
      { id: string | Variable<any, string> },
      ValueTypes['robot_product'],
    ];
    robot_product_designer?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_product_designer_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_product_designer_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_product_designer_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product_designer'],
    ];
    robot_product_designer_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['robot_product_designer_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['robot_product_designer_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_product_designer_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product_designer_aggregate'],
    ];
    robot_product_designer_by_pk?: [
      {
        eth_address: string | Variable<any, string>;
        product_id: string | Variable<any, string>;
      },
      ValueTypes['robot_product_designer'],
    ];
    robot_product_designer_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size:
          | number
          | Variable<
              any,
              string
            > /** cursor to stream the results returned by the query */;
        cursor:
          | Array<
              | ValueTypes['robot_product_designer_stream_cursor_input']
              | undefined
              | null
            >
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_product_designer_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product_designer'],
    ];
    robot_product_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size:
          | number
          | Variable<
              any,
              string
            > /** cursor to stream the results returned by the query */;
        cursor:
          | Array<
              ValueTypes['robot_product_stream_cursor_input'] | undefined | null
            >
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['robot_product_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['robot_product'],
    ];
    shop_api_users?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['shop_api_users_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['shop_api_users_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['shop_api_users_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['shop_api_users'],
    ];
    shop_api_users_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['shop_api_users_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['shop_api_users_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['shop_api_users_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['shop_api_users_aggregate'],
    ];
    shop_api_users_by_pk?: [
      { username: string | Variable<any, string> },
      ValueTypes['shop_api_users'],
    ];
    shop_api_users_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size:
          | number
          | Variable<
              any,
              string
            > /** cursor to stream the results returned by the query */;
        cursor:
          | Array<
              | ValueTypes['shop_api_users_stream_cursor_input']
              | undefined
              | null
            >
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['shop_api_users_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['shop_api_users'],
    ];
    shop_product_locks?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['shop_product_locks_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['shop_product_locks_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['shop_product_locks_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['shop_product_locks'],
    ];
    shop_product_locks_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['shop_product_locks_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['shop_product_locks_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['shop_product_locks_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['shop_product_locks_aggregate'],
    ];
    shop_product_locks_by_pk?: [
      {
        access_code: string | Variable<any, string>;
        lock_id: string | Variable<any, string>;
      },
      ValueTypes['shop_product_locks'],
    ];
    shop_product_locks_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size:
          | number
          | Variable<
              any,
              string
            > /** cursor to stream the results returned by the query */;
        cursor:
          | Array<
              | ValueTypes['shop_product_locks_stream_cursor_input']
              | undefined
              | null
            >
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['shop_product_locks_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['shop_product_locks'],
    ];
    users?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['users_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['users_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['users_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['users'],
    ];
    users_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ValueTypes['users_select_column']>
          | undefined
          | null
          | Variable<any, string> /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null
          | Variable<
              any,
              string
            > /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null
          | Variable<any, string> /** sort the rows by one or more columns */;
        order_by?:
          | Array<ValueTypes['users_order_by']>
          | undefined
          | null
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['users_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['users_aggregate'],
    ];
    users_by_pk?: [
      { id: ValueTypes['uuid'] | Variable<any, string> },
      ValueTypes['users'],
    ];
    users_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size:
          | number
          | Variable<
              any,
              string
            > /** cursor to stream the results returned by the query */;
        cursor:
          | Array<ValueTypes['users_stream_cursor_input'] | undefined | null>
          | Variable<any, string> /** filter the rows returned */;
        where?:
          | ValueTypes['users_bool_exp']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['users'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['timestamptz']: unknown;
  /** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
  ['timestamptz_comparison_exp']: {
    _eq?: ValueTypes['timestamptz'] | undefined | null | Variable<any, string>;
    _gt?: ValueTypes['timestamptz'] | undefined | null | Variable<any, string>;
    _gte?: ValueTypes['timestamptz'] | undefined | null | Variable<any, string>;
    _in?:
      | Array<ValueTypes['timestamptz']>
      | undefined
      | null
      | Variable<any, string>;
    _is_null?: boolean | undefined | null | Variable<any, string>;
    _lt?: ValueTypes['timestamptz'] | undefined | null | Variable<any, string>;
    _lte?: ValueTypes['timestamptz'] | undefined | null | Variable<any, string>;
    _neq?: ValueTypes['timestamptz'] | undefined | null | Variable<any, string>;
    _nin?:
      | Array<ValueTypes['timestamptz']>
      | undefined
      | null
      | Variable<any, string>;
  };
  /** columns and relationships of "users" */
  ['users']: AliasType<{
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "users" */
  ['users_aggregate']: AliasType<{
    aggregate?: ValueTypes['users_aggregate_fields'];
    nodes?: ValueTypes['users'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate fields of "users" */
  ['users_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?:
          | Array<ValueTypes['users_select_column']>
          | undefined
          | null
          | Variable<any, string>;
        distinct?: boolean | undefined | null | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    max?: ValueTypes['users_max_fields'];
    min?: ValueTypes['users_min_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** Boolean expression to filter rows from the table "users". All fields are combined with a logical 'AND'. */
  ['users_bool_exp']: {
    _and?:
      | Array<ValueTypes['users_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    _not?:
      | ValueTypes['users_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['users_bool_exp']>
      | undefined
      | null
      | Variable<any, string>;
    eth_address?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    id?:
      | ValueTypes['uuid_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
    name?:
      | ValueTypes['String_comparison_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** unique or primary key constraints on table "users" */
  ['users_constraint']: users_constraint;
  /** input type for inserting data into table "users" */
  ['users_insert_input']: {
    eth_address?: string | undefined | null | Variable<any, string>;
    id?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
  };
  /** aggregate max on columns */
  ['users_max_fields']: AliasType<{
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate min on columns */
  ['users_min_fields']: AliasType<{
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** response of any mutation on the table "users" */
  ['users_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['users'];
    __typename?: boolean | `@${string}`;
  }>;
  /** input type for inserting object relation for remote table "users" */
  ['users_obj_rel_insert_input']: {
    data: ValueTypes['users_insert_input'] | Variable<any, string>;
    /** upsert condition */
    on_conflict?:
      | ValueTypes['users_on_conflict']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** on_conflict condition type for table "users" */
  ['users_on_conflict']: {
    constraint: ValueTypes['users_constraint'] | Variable<any, string>;
    update_columns:
      | Array<ValueTypes['users_update_column']>
      | Variable<any, string>;
    where?:
      | ValueTypes['users_bool_exp']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Ordering options when selecting data from "users". */
  ['users_order_by']: {
    eth_address?:
      | ValueTypes['order_by']
      | undefined
      | null
      | Variable<any, string>;
    id?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
    name?: ValueTypes['order_by'] | undefined | null | Variable<any, string>;
  };
  /** primary key columns input for table: users */
  ['users_pk_columns_input']: {
    id: ValueTypes['uuid'] | Variable<any, string>;
  };
  /** select columns of table "users" */
  ['users_select_column']: users_select_column;
  /** input type for updating data in table "users" */
  ['users_set_input']: {
    eth_address?: string | undefined | null | Variable<any, string>;
    id?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
  };
  /** Streaming cursor of the table "users" */
  ['users_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value:
      | ValueTypes['users_stream_cursor_value_input']
      | Variable<any, string>;
    /** cursor ordering */
    ordering?:
      | ValueTypes['cursor_ordering']
      | undefined
      | null
      | Variable<any, string>;
  };
  /** Initial value of the column from where the streaming should start */
  ['users_stream_cursor_value_input']: {
    eth_address?: string | undefined | null | Variable<any, string>;
    id?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
  };
  /** update columns of table "users" */
  ['users_update_column']: users_update_column;
  ['users_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ValueTypes['users_set_input']
      | undefined
      | null
      | Variable<any, string>;
    /** filter the rows which have to be updated */
    where: ValueTypes['users_bool_exp'] | Variable<any, string>;
  };
  ['uuid']: unknown;
  /** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
  ['uuid_comparison_exp']: {
    _eq?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    _gt?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    _gte?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    _in?: Array<ValueTypes['uuid']> | undefined | null | Variable<any, string>;
    _is_null?: boolean | undefined | null | Variable<any, string>;
    _lt?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    _lte?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    _neq?: ValueTypes['uuid'] | undefined | null | Variable<any, string>;
    _nin?: Array<ValueTypes['uuid']> | undefined | null | Variable<any, string>;
  };
};

export type ResolverInputTypes = {
  /** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
  ['Int_comparison_exp']: {
    _eq?: number | undefined | null;
    _gt?: number | undefined | null;
    _gte?: number | undefined | null;
    _in?: Array<number> | undefined | null;
    _is_null?: boolean | undefined | null;
    _lt?: number | undefined | null;
    _lte?: number | undefined | null;
    _neq?: number | undefined | null;
    _nin?: Array<number> | undefined | null;
  };
  /** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
  ['String_comparison_exp']: {
    _eq?: string | undefined | null;
    _gt?: string | undefined | null;
    _gte?: string | undefined | null;
    /** does the column match the given case-insensitive pattern */
    _ilike?: string | undefined | null;
    _in?: Array<string> | undefined | null;
    /** does the column match the given POSIX regular expression, case insensitive */
    _iregex?: string | undefined | null;
    _is_null?: boolean | undefined | null;
    /** does the column match the given pattern */
    _like?: string | undefined | null;
    _lt?: string | undefined | null;
    _lte?: string | undefined | null;
    _neq?: string | undefined | null;
    /** does the column NOT match the given case-insensitive pattern */
    _nilike?: string | undefined | null;
    _nin?: Array<string> | undefined | null;
    /** does the column NOT match the given POSIX regular expression, case insensitive */
    _niregex?: string | undefined | null;
    /** does the column NOT match the given pattern */
    _nlike?: string | undefined | null;
    /** does the column NOT match the given POSIX regular expression, case sensitive */
    _nregex?: string | undefined | null;
    /** does the column NOT match the given SQL regular expression */
    _nsimilar?: string | undefined | null;
    /** does the column match the given POSIX regular expression, case sensitive */
    _regex?: string | undefined | null;
    /** does the column match the given SQL regular expression */
    _similar?: string | undefined | null;
  };
  /** columns and relationships of "contribution_votes" */
  ['contribution_votes']: AliasType<{
    /** An object relationship */
    contribution?: ResolverInputTypes['contributions'];
    contribution_id?: boolean | `@${string}`;
    rating?: boolean | `@${string}`;
    /** An object relationship */
    user?: ResolverInputTypes['users'];
    user_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "contribution_votes" */
  ['contribution_votes_aggregate']: AliasType<{
    aggregate?: ResolverInputTypes['contribution_votes_aggregate_fields'];
    nodes?: ResolverInputTypes['contribution_votes'];
    __typename?: boolean | `@${string}`;
  }>;
  ['contribution_votes_aggregate_bool_exp']: {
    count?:
      | ResolverInputTypes['contribution_votes_aggregate_bool_exp_count']
      | undefined
      | null;
  };
  ['contribution_votes_aggregate_bool_exp_count']: {
    arguments?:
      | Array<ResolverInputTypes['contribution_votes_select_column']>
      | undefined
      | null;
    distinct?: boolean | undefined | null;
    filter?:
      | ResolverInputTypes['contribution_votes_bool_exp']
      | undefined
      | null;
    predicate: ResolverInputTypes['Int_comparison_exp'];
  };
  /** aggregate fields of "contribution_votes" */
  ['contribution_votes_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?:
          | Array<ResolverInputTypes['contribution_votes_select_column']>
          | undefined
          | null;
        distinct?: boolean | undefined | null;
      },
      boolean | `@${string}`,
    ];
    max?: ResolverInputTypes['contribution_votes_max_fields'];
    min?: ResolverInputTypes['contribution_votes_min_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** order by aggregate values of table "contribution_votes" */
  ['contribution_votes_aggregate_order_by']: {
    count?: ResolverInputTypes['order_by'] | undefined | null;
    max?:
      | ResolverInputTypes['contribution_votes_max_order_by']
      | undefined
      | null;
    min?:
      | ResolverInputTypes['contribution_votes_min_order_by']
      | undefined
      | null;
  };
  /** input type for inserting array relation for remote table "contribution_votes" */
  ['contribution_votes_arr_rel_insert_input']: {
    data: Array<ResolverInputTypes['contribution_votes_insert_input']>;
    /** upsert condition */
    on_conflict?:
      | ResolverInputTypes['contribution_votes_on_conflict']
      | undefined
      | null;
  };
  /** Boolean expression to filter rows from the table "contribution_votes". All fields are combined with a logical 'AND'. */
  ['contribution_votes_bool_exp']: {
    _and?:
      | Array<ResolverInputTypes['contribution_votes_bool_exp']>
      | undefined
      | null;
    _not?: ResolverInputTypes['contribution_votes_bool_exp'] | undefined | null;
    _or?:
      | Array<ResolverInputTypes['contribution_votes_bool_exp']>
      | undefined
      | null;
    contribution?:
      | ResolverInputTypes['contributions_bool_exp']
      | undefined
      | null;
    contribution_id?:
      | ResolverInputTypes['uuid_comparison_exp']
      | undefined
      | null;
    rating?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
    user?: ResolverInputTypes['users_bool_exp'] | undefined | null;
    user_id?: ResolverInputTypes['uuid_comparison_exp'] | undefined | null;
  };
  /** unique or primary key constraints on table "contribution_votes" */
  ['contribution_votes_constraint']: contribution_votes_constraint;
  /** input type for inserting data into table "contribution_votes" */
  ['contribution_votes_insert_input']: {
    contribution?:
      | ResolverInputTypes['contributions_obj_rel_insert_input']
      | undefined
      | null;
    contribution_id?: ResolverInputTypes['uuid'] | undefined | null;
    rating?: string | undefined | null;
    user?: ResolverInputTypes['users_obj_rel_insert_input'] | undefined | null;
    user_id?: ResolverInputTypes['uuid'] | undefined | null;
  };
  /** aggregate max on columns */
  ['contribution_votes_max_fields']: AliasType<{
    contribution_id?: boolean | `@${string}`;
    rating?: boolean | `@${string}`;
    user_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by max() on columns of table "contribution_votes" */
  ['contribution_votes_max_order_by']: {
    contribution_id?: ResolverInputTypes['order_by'] | undefined | null;
    rating?: ResolverInputTypes['order_by'] | undefined | null;
    user_id?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** aggregate min on columns */
  ['contribution_votes_min_fields']: AliasType<{
    contribution_id?: boolean | `@${string}`;
    rating?: boolean | `@${string}`;
    user_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by min() on columns of table "contribution_votes" */
  ['contribution_votes_min_order_by']: {
    contribution_id?: ResolverInputTypes['order_by'] | undefined | null;
    rating?: ResolverInputTypes['order_by'] | undefined | null;
    user_id?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** response of any mutation on the table "contribution_votes" */
  ['contribution_votes_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ResolverInputTypes['contribution_votes'];
    __typename?: boolean | `@${string}`;
  }>;
  /** on_conflict condition type for table "contribution_votes" */
  ['contribution_votes_on_conflict']: {
    constraint: ResolverInputTypes['contribution_votes_constraint'];
    update_columns: Array<
      ResolverInputTypes['contribution_votes_update_column']
    >;
    where?:
      | ResolverInputTypes['contribution_votes_bool_exp']
      | undefined
      | null;
  };
  /** Ordering options when selecting data from "contribution_votes". */
  ['contribution_votes_order_by']: {
    contribution?:
      | ResolverInputTypes['contributions_order_by']
      | undefined
      | null;
    contribution_id?: ResolverInputTypes['order_by'] | undefined | null;
    rating?: ResolverInputTypes['order_by'] | undefined | null;
    user?: ResolverInputTypes['users_order_by'] | undefined | null;
    user_id?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** primary key columns input for table: contribution_votes */
  ['contribution_votes_pk_columns_input']: {
    contribution_id: ResolverInputTypes['uuid'];
    user_id: ResolverInputTypes['uuid'];
  };
  /** select columns of table "contribution_votes" */
  ['contribution_votes_select_column']: contribution_votes_select_column;
  /** input type for updating data in table "contribution_votes" */
  ['contribution_votes_set_input']: {
    contribution_id?: ResolverInputTypes['uuid'] | undefined | null;
    rating?: string | undefined | null;
    user_id?: ResolverInputTypes['uuid'] | undefined | null;
  };
  /** Streaming cursor of the table "contribution_votes" */
  ['contribution_votes_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ResolverInputTypes['contribution_votes_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ResolverInputTypes['cursor_ordering'] | undefined | null;
  };
  /** Initial value of the column from where the streaming should start */
  ['contribution_votes_stream_cursor_value_input']: {
    contribution_id?: ResolverInputTypes['uuid'] | undefined | null;
    rating?: string | undefined | null;
    user_id?: ResolverInputTypes['uuid'] | undefined | null;
  };
  /** update columns of table "contribution_votes" */
  ['contribution_votes_update_column']: contribution_votes_update_column;
  ['contribution_votes_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ResolverInputTypes['contribution_votes_set_input']
      | undefined
      | null;
    /** filter the rows which have to be updated */
    where: ResolverInputTypes['contribution_votes_bool_exp'];
  };
  /** columns and relationships of "contributions" */
  ['contributions']: AliasType<{
    artifact?: boolean | `@${string}`;
    /** An object relationship */
    author?: ResolverInputTypes['users'];
    category?: boolean | `@${string}`;
    contributors?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contributors_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contributors_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['contributors_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['contributors'],
    ];
    contributors_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contributors_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contributors_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['contributors_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['contributors_aggregate'],
    ];
    created_at?: boolean | `@${string}`;
    created_by?: boolean | `@${string}`;
    date?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    effort?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    impact?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    votes?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contribution_votes_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contribution_votes_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['contribution_votes_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['contribution_votes'],
    ];
    votes_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contribution_votes_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contribution_votes_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['contribution_votes_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['contribution_votes_aggregate'],
    ];
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "contributions" */
  ['contributions_aggregate']: AliasType<{
    aggregate?: ResolverInputTypes['contributions_aggregate_fields'];
    nodes?: ResolverInputTypes['contributions'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate fields of "contributions" */
  ['contributions_aggregate_fields']: AliasType<{
    avg?: ResolverInputTypes['contributions_avg_fields'];
    count?: [
      {
        columns?:
          | Array<ResolverInputTypes['contributions_select_column']>
          | undefined
          | null;
        distinct?: boolean | undefined | null;
      },
      boolean | `@${string}`,
    ];
    max?: ResolverInputTypes['contributions_max_fields'];
    min?: ResolverInputTypes['contributions_min_fields'];
    stddev?: ResolverInputTypes['contributions_stddev_fields'];
    stddev_pop?: ResolverInputTypes['contributions_stddev_pop_fields'];
    stddev_samp?: ResolverInputTypes['contributions_stddev_samp_fields'];
    sum?: ResolverInputTypes['contributions_sum_fields'];
    var_pop?: ResolverInputTypes['contributions_var_pop_fields'];
    var_samp?: ResolverInputTypes['contributions_var_samp_fields'];
    variance?: ResolverInputTypes['contributions_variance_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate avg on columns */
  ['contributions_avg_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Boolean expression to filter rows from the table "contributions". All fields are combined with a logical 'AND'. */
  ['contributions_bool_exp']: {
    _and?:
      | Array<ResolverInputTypes['contributions_bool_exp']>
      | undefined
      | null;
    _not?: ResolverInputTypes['contributions_bool_exp'] | undefined | null;
    _or?:
      | Array<ResolverInputTypes['contributions_bool_exp']>
      | undefined
      | null;
    artifact?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
    author?: ResolverInputTypes['users_bool_exp'] | undefined | null;
    category?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
    contributors?:
      | ResolverInputTypes['contributors_bool_exp']
      | undefined
      | null;
    contributors_aggregate?:
      | ResolverInputTypes['contributors_aggregate_bool_exp']
      | undefined
      | null;
    created_at?:
      | ResolverInputTypes['timestamptz_comparison_exp']
      | undefined
      | null;
    created_by?: ResolverInputTypes['uuid_comparison_exp'] | undefined | null;
    date?: ResolverInputTypes['date_comparison_exp'] | undefined | null;
    description?:
      | ResolverInputTypes['String_comparison_exp']
      | undefined
      | null;
    effort?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
    id?: ResolverInputTypes['uuid_comparison_exp'] | undefined | null;
    impact?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
    title?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
    votes?:
      | ResolverInputTypes['contribution_votes_bool_exp']
      | undefined
      | null;
    votes_aggregate?:
      | ResolverInputTypes['contribution_votes_aggregate_bool_exp']
      | undefined
      | null;
    weight?: ResolverInputTypes['Int_comparison_exp'] | undefined | null;
  };
  /** unique or primary key constraints on table "contributions" */
  ['contributions_constraint']: contributions_constraint;
  /** input type for incrementing numeric columns in table "contributions" */
  ['contributions_inc_input']: {
    weight?: number | undefined | null;
  };
  /** input type for inserting data into table "contributions" */
  ['contributions_insert_input']: {
    artifact?: string | undefined | null;
    author?:
      | ResolverInputTypes['users_obj_rel_insert_input']
      | undefined
      | null;
    category?: string | undefined | null;
    contributors?:
      | ResolverInputTypes['contributors_arr_rel_insert_input']
      | undefined
      | null;
    created_at?: ResolverInputTypes['timestamptz'] | undefined | null;
    created_by?: ResolverInputTypes['uuid'] | undefined | null;
    date?: ResolverInputTypes['date'] | undefined | null;
    description?: string | undefined | null;
    effort?: string | undefined | null;
    id?: ResolverInputTypes['uuid'] | undefined | null;
    impact?: string | undefined | null;
    title?: string | undefined | null;
    votes?:
      | ResolverInputTypes['contribution_votes_arr_rel_insert_input']
      | undefined
      | null;
    weight?: number | undefined | null;
  };
  /** aggregate max on columns */
  ['contributions_max_fields']: AliasType<{
    artifact?: boolean | `@${string}`;
    category?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    created_by?: boolean | `@${string}`;
    date?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    effort?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    impact?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate min on columns */
  ['contributions_min_fields']: AliasType<{
    artifact?: boolean | `@${string}`;
    category?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    created_by?: boolean | `@${string}`;
    date?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    effort?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    impact?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** response of any mutation on the table "contributions" */
  ['contributions_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ResolverInputTypes['contributions'];
    __typename?: boolean | `@${string}`;
  }>;
  /** input type for inserting object relation for remote table "contributions" */
  ['contributions_obj_rel_insert_input']: {
    data: ResolverInputTypes['contributions_insert_input'];
    /** upsert condition */
    on_conflict?:
      | ResolverInputTypes['contributions_on_conflict']
      | undefined
      | null;
  };
  /** on_conflict condition type for table "contributions" */
  ['contributions_on_conflict']: {
    constraint: ResolverInputTypes['contributions_constraint'];
    update_columns: Array<ResolverInputTypes['contributions_update_column']>;
    where?: ResolverInputTypes['contributions_bool_exp'] | undefined | null;
  };
  /** Ordering options when selecting data from "contributions". */
  ['contributions_order_by']: {
    artifact?: ResolverInputTypes['order_by'] | undefined | null;
    author?: ResolverInputTypes['users_order_by'] | undefined | null;
    category?: ResolverInputTypes['order_by'] | undefined | null;
    contributors_aggregate?:
      | ResolverInputTypes['contributors_aggregate_order_by']
      | undefined
      | null;
    created_at?: ResolverInputTypes['order_by'] | undefined | null;
    created_by?: ResolverInputTypes['order_by'] | undefined | null;
    date?: ResolverInputTypes['order_by'] | undefined | null;
    description?: ResolverInputTypes['order_by'] | undefined | null;
    effort?: ResolverInputTypes['order_by'] | undefined | null;
    id?: ResolverInputTypes['order_by'] | undefined | null;
    impact?: ResolverInputTypes['order_by'] | undefined | null;
    title?: ResolverInputTypes['order_by'] | undefined | null;
    votes_aggregate?:
      | ResolverInputTypes['contribution_votes_aggregate_order_by']
      | undefined
      | null;
    weight?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** primary key columns input for table: contributions */
  ['contributions_pk_columns_input']: {
    id: ResolverInputTypes['uuid'];
  };
  /** select columns of table "contributions" */
  ['contributions_select_column']: contributions_select_column;
  /** input type for updating data in table "contributions" */
  ['contributions_set_input']: {
    artifact?: string | undefined | null;
    category?: string | undefined | null;
    created_at?: ResolverInputTypes['timestamptz'] | undefined | null;
    created_by?: ResolverInputTypes['uuid'] | undefined | null;
    date?: ResolverInputTypes['date'] | undefined | null;
    description?: string | undefined | null;
    effort?: string | undefined | null;
    id?: ResolverInputTypes['uuid'] | undefined | null;
    impact?: string | undefined | null;
    title?: string | undefined | null;
    weight?: number | undefined | null;
  };
  /** aggregate stddev on columns */
  ['contributions_stddev_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate stddev_pop on columns */
  ['contributions_stddev_pop_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate stddev_samp on columns */
  ['contributions_stddev_samp_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Streaming cursor of the table "contributions" */
  ['contributions_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ResolverInputTypes['contributions_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ResolverInputTypes['cursor_ordering'] | undefined | null;
  };
  /** Initial value of the column from where the streaming should start */
  ['contributions_stream_cursor_value_input']: {
    artifact?: string | undefined | null;
    category?: string | undefined | null;
    created_at?: ResolverInputTypes['timestamptz'] | undefined | null;
    created_by?: ResolverInputTypes['uuid'] | undefined | null;
    date?: ResolverInputTypes['date'] | undefined | null;
    description?: string | undefined | null;
    effort?: string | undefined | null;
    id?: ResolverInputTypes['uuid'] | undefined | null;
    impact?: string | undefined | null;
    title?: string | undefined | null;
    weight?: number | undefined | null;
  };
  /** aggregate sum on columns */
  ['contributions_sum_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** update columns of table "contributions" */
  ['contributions_update_column']: contributions_update_column;
  ['contributions_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?: ResolverInputTypes['contributions_inc_input'] | undefined | null;
    /** sets the columns of the filtered rows to the given values */
    _set?: ResolverInputTypes['contributions_set_input'] | undefined | null;
    /** filter the rows which have to be updated */
    where: ResolverInputTypes['contributions_bool_exp'];
  };
  /** aggregate var_pop on columns */
  ['contributions_var_pop_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate var_samp on columns */
  ['contributions_var_samp_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate variance on columns */
  ['contributions_variance_fields']: AliasType<{
    weight?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** columns and relationships of "contributors" */
  ['contributors']: AliasType<{
    /** An object relationship */
    contribution?: ResolverInputTypes['contributions'];
    contribution_id?: boolean | `@${string}`;
    contribution_share?: boolean | `@${string}`;
    /** An object relationship */
    user?: ResolverInputTypes['users'];
    user_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "contributors" */
  ['contributors_aggregate']: AliasType<{
    aggregate?: ResolverInputTypes['contributors_aggregate_fields'];
    nodes?: ResolverInputTypes['contributors'];
    __typename?: boolean | `@${string}`;
  }>;
  ['contributors_aggregate_bool_exp']: {
    count?:
      | ResolverInputTypes['contributors_aggregate_bool_exp_count']
      | undefined
      | null;
  };
  ['contributors_aggregate_bool_exp_count']: {
    arguments?:
      | Array<ResolverInputTypes['contributors_select_column']>
      | undefined
      | null;
    distinct?: boolean | undefined | null;
    filter?: ResolverInputTypes['contributors_bool_exp'] | undefined | null;
    predicate: ResolverInputTypes['Int_comparison_exp'];
  };
  /** aggregate fields of "contributors" */
  ['contributors_aggregate_fields']: AliasType<{
    avg?: ResolverInputTypes['contributors_avg_fields'];
    count?: [
      {
        columns?:
          | Array<ResolverInputTypes['contributors_select_column']>
          | undefined
          | null;
        distinct?: boolean | undefined | null;
      },
      boolean | `@${string}`,
    ];
    max?: ResolverInputTypes['contributors_max_fields'];
    min?: ResolverInputTypes['contributors_min_fields'];
    stddev?: ResolverInputTypes['contributors_stddev_fields'];
    stddev_pop?: ResolverInputTypes['contributors_stddev_pop_fields'];
    stddev_samp?: ResolverInputTypes['contributors_stddev_samp_fields'];
    sum?: ResolverInputTypes['contributors_sum_fields'];
    var_pop?: ResolverInputTypes['contributors_var_pop_fields'];
    var_samp?: ResolverInputTypes['contributors_var_samp_fields'];
    variance?: ResolverInputTypes['contributors_variance_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** order by aggregate values of table "contributors" */
  ['contributors_aggregate_order_by']: {
    avg?: ResolverInputTypes['contributors_avg_order_by'] | undefined | null;
    count?: ResolverInputTypes['order_by'] | undefined | null;
    max?: ResolverInputTypes['contributors_max_order_by'] | undefined | null;
    min?: ResolverInputTypes['contributors_min_order_by'] | undefined | null;
    stddev?:
      | ResolverInputTypes['contributors_stddev_order_by']
      | undefined
      | null;
    stddev_pop?:
      | ResolverInputTypes['contributors_stddev_pop_order_by']
      | undefined
      | null;
    stddev_samp?:
      | ResolverInputTypes['contributors_stddev_samp_order_by']
      | undefined
      | null;
    sum?: ResolverInputTypes['contributors_sum_order_by'] | undefined | null;
    var_pop?:
      | ResolverInputTypes['contributors_var_pop_order_by']
      | undefined
      | null;
    var_samp?:
      | ResolverInputTypes['contributors_var_samp_order_by']
      | undefined
      | null;
    variance?:
      | ResolverInputTypes['contributors_variance_order_by']
      | undefined
      | null;
  };
  /** input type for inserting array relation for remote table "contributors" */
  ['contributors_arr_rel_insert_input']: {
    data: Array<ResolverInputTypes['contributors_insert_input']>;
    /** upsert condition */
    on_conflict?:
      | ResolverInputTypes['contributors_on_conflict']
      | undefined
      | null;
  };
  /** aggregate avg on columns */
  ['contributors_avg_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by avg() on columns of table "contributors" */
  ['contributors_avg_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** Boolean expression to filter rows from the table "contributors". All fields are combined with a logical 'AND'. */
  ['contributors_bool_exp']: {
    _and?:
      | Array<ResolverInputTypes['contributors_bool_exp']>
      | undefined
      | null;
    _not?: ResolverInputTypes['contributors_bool_exp'] | undefined | null;
    _or?: Array<ResolverInputTypes['contributors_bool_exp']> | undefined | null;
    contribution?:
      | ResolverInputTypes['contributions_bool_exp']
      | undefined
      | null;
    contribution_id?:
      | ResolverInputTypes['uuid_comparison_exp']
      | undefined
      | null;
    contribution_share?:
      | ResolverInputTypes['numeric_comparison_exp']
      | undefined
      | null;
    user?: ResolverInputTypes['users_bool_exp'] | undefined | null;
    user_id?: ResolverInputTypes['uuid_comparison_exp'] | undefined | null;
  };
  /** unique or primary key constraints on table "contributors" */
  ['contributors_constraint']: contributors_constraint;
  /** input type for incrementing numeric columns in table "contributors" */
  ['contributors_inc_input']: {
    contribution_share?: ResolverInputTypes['numeric'] | undefined | null;
  };
  /** input type for inserting data into table "contributors" */
  ['contributors_insert_input']: {
    contribution?:
      | ResolverInputTypes['contributions_obj_rel_insert_input']
      | undefined
      | null;
    contribution_id?: ResolverInputTypes['uuid'] | undefined | null;
    contribution_share?: ResolverInputTypes['numeric'] | undefined | null;
    user?: ResolverInputTypes['users_obj_rel_insert_input'] | undefined | null;
    user_id?: ResolverInputTypes['uuid'] | undefined | null;
  };
  /** aggregate max on columns */
  ['contributors_max_fields']: AliasType<{
    contribution_id?: boolean | `@${string}`;
    contribution_share?: boolean | `@${string}`;
    user_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by max() on columns of table "contributors" */
  ['contributors_max_order_by']: {
    contribution_id?: ResolverInputTypes['order_by'] | undefined | null;
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
    user_id?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** aggregate min on columns */
  ['contributors_min_fields']: AliasType<{
    contribution_id?: boolean | `@${string}`;
    contribution_share?: boolean | `@${string}`;
    user_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by min() on columns of table "contributors" */
  ['contributors_min_order_by']: {
    contribution_id?: ResolverInputTypes['order_by'] | undefined | null;
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
    user_id?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** response of any mutation on the table "contributors" */
  ['contributors_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ResolverInputTypes['contributors'];
    __typename?: boolean | `@${string}`;
  }>;
  /** on_conflict condition type for table "contributors" */
  ['contributors_on_conflict']: {
    constraint: ResolverInputTypes['contributors_constraint'];
    update_columns: Array<ResolverInputTypes['contributors_update_column']>;
    where?: ResolverInputTypes['contributors_bool_exp'] | undefined | null;
  };
  /** Ordering options when selecting data from "contributors". */
  ['contributors_order_by']: {
    contribution?:
      | ResolverInputTypes['contributions_order_by']
      | undefined
      | null;
    contribution_id?: ResolverInputTypes['order_by'] | undefined | null;
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
    user?: ResolverInputTypes['users_order_by'] | undefined | null;
    user_id?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** primary key columns input for table: contributors */
  ['contributors_pk_columns_input']: {
    contribution_id: ResolverInputTypes['uuid'];
    user_id: ResolverInputTypes['uuid'];
  };
  /** select columns of table "contributors" */
  ['contributors_select_column']: contributors_select_column;
  /** input type for updating data in table "contributors" */
  ['contributors_set_input']: {
    contribution_id?: ResolverInputTypes['uuid'] | undefined | null;
    contribution_share?: ResolverInputTypes['numeric'] | undefined | null;
    user_id?: ResolverInputTypes['uuid'] | undefined | null;
  };
  /** aggregate stddev on columns */
  ['contributors_stddev_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by stddev() on columns of table "contributors" */
  ['contributors_stddev_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** aggregate stddev_pop on columns */
  ['contributors_stddev_pop_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by stddev_pop() on columns of table "contributors" */
  ['contributors_stddev_pop_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** aggregate stddev_samp on columns */
  ['contributors_stddev_samp_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by stddev_samp() on columns of table "contributors" */
  ['contributors_stddev_samp_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** Streaming cursor of the table "contributors" */
  ['contributors_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ResolverInputTypes['contributors_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ResolverInputTypes['cursor_ordering'] | undefined | null;
  };
  /** Initial value of the column from where the streaming should start */
  ['contributors_stream_cursor_value_input']: {
    contribution_id?: ResolverInputTypes['uuid'] | undefined | null;
    contribution_share?: ResolverInputTypes['numeric'] | undefined | null;
    user_id?: ResolverInputTypes['uuid'] | undefined | null;
  };
  /** aggregate sum on columns */
  ['contributors_sum_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by sum() on columns of table "contributors" */
  ['contributors_sum_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** update columns of table "contributors" */
  ['contributors_update_column']: contributors_update_column;
  ['contributors_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?: ResolverInputTypes['contributors_inc_input'] | undefined | null;
    /** sets the columns of the filtered rows to the given values */
    _set?: ResolverInputTypes['contributors_set_input'] | undefined | null;
    /** filter the rows which have to be updated */
    where: ResolverInputTypes['contributors_bool_exp'];
  };
  /** aggregate var_pop on columns */
  ['contributors_var_pop_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by var_pop() on columns of table "contributors" */
  ['contributors_var_pop_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** aggregate var_samp on columns */
  ['contributors_var_samp_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by var_samp() on columns of table "contributors" */
  ['contributors_var_samp_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** aggregate variance on columns */
  ['contributors_variance_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by variance() on columns of table "contributors" */
  ['contributors_variance_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** ordering argument of a cursor */
  ['cursor_ordering']: cursor_ordering;
  ['date']: unknown;
  /** Boolean expression to compare columns of type "date". All fields are combined with logical 'AND'. */
  ['date_comparison_exp']: {
    _eq?: ResolverInputTypes['date'] | undefined | null;
    _gt?: ResolverInputTypes['date'] | undefined | null;
    _gte?: ResolverInputTypes['date'] | undefined | null;
    _in?: Array<ResolverInputTypes['date']> | undefined | null;
    _is_null?: boolean | undefined | null;
    _lt?: ResolverInputTypes['date'] | undefined | null;
    _lte?: ResolverInputTypes['date'] | undefined | null;
    _neq?: ResolverInputTypes['date'] | undefined | null;
    _nin?: Array<ResolverInputTypes['date']> | undefined | null;
  };
  ['jsonb']: unknown;
  ['jsonb_cast_exp']: {
    String?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
  };
  /** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
  ['jsonb_comparison_exp']: {
    _cast?: ResolverInputTypes['jsonb_cast_exp'] | undefined | null;
    /** is the column contained in the given json value */
    _contained_in?: ResolverInputTypes['jsonb'] | undefined | null;
    /** does the column contain the given json value at the top level */
    _contains?: ResolverInputTypes['jsonb'] | undefined | null;
    _eq?: ResolverInputTypes['jsonb'] | undefined | null;
    _gt?: ResolverInputTypes['jsonb'] | undefined | null;
    _gte?: ResolverInputTypes['jsonb'] | undefined | null;
    /** does the string exist as a top-level key in the column */
    _has_key?: string | undefined | null;
    /** do all of these strings exist as top-level keys in the column */
    _has_keys_all?: Array<string> | undefined | null;
    /** do any of these strings exist as top-level keys in the column */
    _has_keys_any?: Array<string> | undefined | null;
    _in?: Array<ResolverInputTypes['jsonb']> | undefined | null;
    _is_null?: boolean | undefined | null;
    _lt?: ResolverInputTypes['jsonb'] | undefined | null;
    _lte?: ResolverInputTypes['jsonb'] | undefined | null;
    _neq?: ResolverInputTypes['jsonb'] | undefined | null;
    _nin?: Array<ResolverInputTypes['jsonb']> | undefined | null;
  };
  /** mutation root */
  ['mutation_root']: AliasType<{
    delete_contribution_votes?: [
      {
        /** filter the rows which have to be deleted */
        where: ResolverInputTypes['contribution_votes_bool_exp'];
      },
      ResolverInputTypes['contribution_votes_mutation_response'],
    ];
    delete_contribution_votes_by_pk?: [
      {
        contribution_id: ResolverInputTypes['uuid'];
        user_id: ResolverInputTypes['uuid'];
      },
      ResolverInputTypes['contribution_votes'],
    ];
    delete_contributions?: [
      {
        /** filter the rows which have to be deleted */
        where: ResolverInputTypes['contributions_bool_exp'];
      },
      ResolverInputTypes['contributions_mutation_response'],
    ];
    delete_contributions_by_pk?: [
      { id: ResolverInputTypes['uuid'] },
      ResolverInputTypes['contributions'],
    ];
    delete_contributors?: [
      {
        /** filter the rows which have to be deleted */
        where: ResolverInputTypes['contributors_bool_exp'];
      },
      ResolverInputTypes['contributors_mutation_response'],
    ];
    delete_contributors_by_pk?: [
      {
        contribution_id: ResolverInputTypes['uuid'];
        user_id: ResolverInputTypes['uuid'];
      },
      ResolverInputTypes['contributors'],
    ];
    delete_robot_merkle_claims?: [
      {
        /** filter the rows which have to be deleted */
        where: ResolverInputTypes['robot_merkle_claims_bool_exp'];
      },
      ResolverInputTypes['robot_merkle_claims_mutation_response'],
    ];
    delete_robot_merkle_claims_by_pk?: [
      { id: ResolverInputTypes['uuid'] },
      ResolverInputTypes['robot_merkle_claims'],
    ];
    delete_robot_merkle_roots?: [
      {
        /** filter the rows which have to be deleted */
        where: ResolverInputTypes['robot_merkle_roots_bool_exp'];
      },
      ResolverInputTypes['robot_merkle_roots_mutation_response'],
    ];
    delete_robot_merkle_roots_by_pk?: [
      { hash: string },
      ResolverInputTypes['robot_merkle_roots'],
    ];
    delete_robot_order?: [
      {
        /** filter the rows which have to be deleted */
        where: ResolverInputTypes['robot_order_bool_exp'];
      },
      ResolverInputTypes['robot_order_mutation_response'],
    ];
    delete_robot_order_by_pk?: [
      { order_id: string },
      ResolverInputTypes['robot_order'],
    ];
    delete_robot_product?: [
      {
        /** filter the rows which have to be deleted */
        where: ResolverInputTypes['robot_product_bool_exp'];
      },
      ResolverInputTypes['robot_product_mutation_response'],
    ];
    delete_robot_product_by_pk?: [
      { id: string },
      ResolverInputTypes['robot_product'],
    ];
    delete_robot_product_designer?: [
      {
        /** filter the rows which have to be deleted */
        where: ResolverInputTypes['robot_product_designer_bool_exp'];
      },
      ResolverInputTypes['robot_product_designer_mutation_response'],
    ];
    delete_robot_product_designer_by_pk?: [
      { eth_address: string; product_id: string },
      ResolverInputTypes['robot_product_designer'],
    ];
    delete_shop_api_users?: [
      {
        /** filter the rows which have to be deleted */
        where: ResolverInputTypes['shop_api_users_bool_exp'];
      },
      ResolverInputTypes['shop_api_users_mutation_response'],
    ];
    delete_shop_api_users_by_pk?: [
      { username: string },
      ResolverInputTypes['shop_api_users'],
    ];
    delete_shop_product_locks?: [
      {
        /** filter the rows which have to be deleted */
        where: ResolverInputTypes['shop_product_locks_bool_exp'];
      },
      ResolverInputTypes['shop_product_locks_mutation_response'],
    ];
    delete_shop_product_locks_by_pk?: [
      { access_code: string; lock_id: string },
      ResolverInputTypes['shop_product_locks'],
    ];
    delete_users?: [
      {
        /** filter the rows which have to be deleted */
        where: ResolverInputTypes['users_bool_exp'];
      },
      ResolverInputTypes['users_mutation_response'],
    ];
    delete_users_by_pk?: [
      { id: ResolverInputTypes['uuid'] },
      ResolverInputTypes['users'],
    ];
    insert_contribution_votes?: [
      {
        /** the rows to be inserted */
        objects: Array<
          ResolverInputTypes['contribution_votes_insert_input']
        > /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['contribution_votes_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['contribution_votes_mutation_response'],
    ];
    insert_contribution_votes_one?: [
      {
        /** the row to be inserted */
        object: ResolverInputTypes['contribution_votes_insert_input'] /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['contribution_votes_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['contribution_votes'],
    ];
    insert_contributions?: [
      {
        /** the rows to be inserted */
        objects: Array<
          ResolverInputTypes['contributions_insert_input']
        > /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['contributions_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['contributions_mutation_response'],
    ];
    insert_contributions_one?: [
      {
        /** the row to be inserted */
        object: ResolverInputTypes['contributions_insert_input'] /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['contributions_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['contributions'],
    ];
    insert_contributors?: [
      {
        /** the rows to be inserted */
        objects: Array<
          ResolverInputTypes['contributors_insert_input']
        > /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['contributors_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['contributors_mutation_response'],
    ];
    insert_contributors_one?: [
      {
        /** the row to be inserted */
        object: ResolverInputTypes['contributors_insert_input'] /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['contributors_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['contributors'],
    ];
    insert_robot_merkle_claims?: [
      {
        /** the rows to be inserted */
        objects: Array<
          ResolverInputTypes['robot_merkle_claims_insert_input']
        > /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['robot_merkle_claims_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_claims_mutation_response'],
    ];
    insert_robot_merkle_claims_one?: [
      {
        /** the row to be inserted */
        object: ResolverInputTypes['robot_merkle_claims_insert_input'] /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['robot_merkle_claims_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_claims'],
    ];
    insert_robot_merkle_roots?: [
      {
        /** the rows to be inserted */
        objects: Array<
          ResolverInputTypes['robot_merkle_roots_insert_input']
        > /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['robot_merkle_roots_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_roots_mutation_response'],
    ];
    insert_robot_merkle_roots_one?: [
      {
        /** the row to be inserted */
        object: ResolverInputTypes['robot_merkle_roots_insert_input'] /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['robot_merkle_roots_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_roots'],
    ];
    insert_robot_order?: [
      {
        /** the rows to be inserted */
        objects: Array<
          ResolverInputTypes['robot_order_insert_input']
        > /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['robot_order_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_order_mutation_response'],
    ];
    insert_robot_order_one?: [
      {
        /** the row to be inserted */
        object: ResolverInputTypes['robot_order_insert_input'] /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['robot_order_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_order'],
    ];
    insert_robot_product?: [
      {
        /** the rows to be inserted */
        objects: Array<
          ResolverInputTypes['robot_product_insert_input']
        > /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['robot_product_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_product_mutation_response'],
    ];
    insert_robot_product_designer?: [
      {
        /** the rows to be inserted */
        objects: Array<
          ResolverInputTypes['robot_product_designer_insert_input']
        > /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['robot_product_designer_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_product_designer_mutation_response'],
    ];
    insert_robot_product_designer_one?: [
      {
        /** the row to be inserted */
        object: ResolverInputTypes['robot_product_designer_insert_input'] /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['robot_product_designer_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_product_designer'],
    ];
    insert_robot_product_one?: [
      {
        /** the row to be inserted */
        object: ResolverInputTypes['robot_product_insert_input'] /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['robot_product_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_product'],
    ];
    insert_shop_api_users?: [
      {
        /** the rows to be inserted */
        objects: Array<
          ResolverInputTypes['shop_api_users_insert_input']
        > /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['shop_api_users_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['shop_api_users_mutation_response'],
    ];
    insert_shop_api_users_one?: [
      {
        /** the row to be inserted */
        object: ResolverInputTypes['shop_api_users_insert_input'] /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['shop_api_users_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['shop_api_users'],
    ];
    insert_shop_product_locks?: [
      {
        /** the rows to be inserted */
        objects: Array<
          ResolverInputTypes['shop_product_locks_insert_input']
        > /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['shop_product_locks_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['shop_product_locks_mutation_response'],
    ];
    insert_shop_product_locks_one?: [
      {
        /** the row to be inserted */
        object: ResolverInputTypes['shop_product_locks_insert_input'] /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['shop_product_locks_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['shop_product_locks'],
    ];
    insert_users?: [
      {
        /** the rows to be inserted */
        objects: Array<
          ResolverInputTypes['users_insert_input']
        > /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['users_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['users_mutation_response'],
    ];
    insert_users_one?: [
      {
        /** the row to be inserted */
        object: ResolverInputTypes['users_insert_input'] /** upsert condition */;
        on_conflict?:
          | ResolverInputTypes['users_on_conflict']
          | undefined
          | null;
      },
      ResolverInputTypes['users'],
    ];
    update_contribution_votes?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ResolverInputTypes['contribution_votes_set_input']
          | undefined
          | null /** filter the rows which have to be updated */;
        where: ResolverInputTypes['contribution_votes_bool_exp'];
      },
      ResolverInputTypes['contribution_votes_mutation_response'],
    ];
    update_contribution_votes_by_pk?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ResolverInputTypes['contribution_votes_set_input']
          | undefined
          | null;
        pk_columns: ResolverInputTypes['contribution_votes_pk_columns_input'];
      },
      ResolverInputTypes['contribution_votes'],
    ];
    update_contribution_votes_many?: [
      {
        /** updates to execute, in order */
        updates: Array<ResolverInputTypes['contribution_votes_updates']>;
      },
      ResolverInputTypes['contribution_votes_mutation_response'],
    ];
    update_contributions?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ResolverInputTypes['contributions_inc_input']
          | undefined
          | null /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ResolverInputTypes['contributions_set_input']
          | undefined
          | null /** filter the rows which have to be updated */;
        where: ResolverInputTypes['contributions_bool_exp'];
      },
      ResolverInputTypes['contributions_mutation_response'],
    ];
    update_contributions_by_pk?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ResolverInputTypes['contributions_inc_input']
          | undefined
          | null /** sets the columns of the filtered rows to the given values */;
        _set?: ResolverInputTypes['contributions_set_input'] | undefined | null;
        pk_columns: ResolverInputTypes['contributions_pk_columns_input'];
      },
      ResolverInputTypes['contributions'],
    ];
    update_contributions_many?: [
      {
        /** updates to execute, in order */
        updates: Array<ResolverInputTypes['contributions_updates']>;
      },
      ResolverInputTypes['contributions_mutation_response'],
    ];
    update_contributors?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ResolverInputTypes['contributors_inc_input']
          | undefined
          | null /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ResolverInputTypes['contributors_set_input']
          | undefined
          | null /** filter the rows which have to be updated */;
        where: ResolverInputTypes['contributors_bool_exp'];
      },
      ResolverInputTypes['contributors_mutation_response'],
    ];
    update_contributors_by_pk?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ResolverInputTypes['contributors_inc_input']
          | undefined
          | null /** sets the columns of the filtered rows to the given values */;
        _set?: ResolverInputTypes['contributors_set_input'] | undefined | null;
        pk_columns: ResolverInputTypes['contributors_pk_columns_input'];
      },
      ResolverInputTypes['contributors'],
    ];
    update_contributors_many?: [
      {
        /** updates to execute, in order */
        updates: Array<ResolverInputTypes['contributors_updates']>;
      },
      ResolverInputTypes['contributors_mutation_response'],
    ];
    update_robot_merkle_claims?: [
      {
        /** append existing jsonb value of filtered columns with new jsonb value */
        _append?:
          | ResolverInputTypes['robot_merkle_claims_append_input']
          | undefined
          | null /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */;
        _delete_at_path?:
          | ResolverInputTypes['robot_merkle_claims_delete_at_path_input']
          | undefined
          | null /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */;
        _delete_elem?:
          | ResolverInputTypes['robot_merkle_claims_delete_elem_input']
          | undefined
          | null /** delete key/value pair or string element. key/value pairs are matched based on their key value */;
        _delete_key?:
          | ResolverInputTypes['robot_merkle_claims_delete_key_input']
          | undefined
          | null /** prepend existing jsonb value of filtered columns with new jsonb value */;
        _prepend?:
          | ResolverInputTypes['robot_merkle_claims_prepend_input']
          | undefined
          | null /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ResolverInputTypes['robot_merkle_claims_set_input']
          | undefined
          | null /** filter the rows which have to be updated */;
        where: ResolverInputTypes['robot_merkle_claims_bool_exp'];
      },
      ResolverInputTypes['robot_merkle_claims_mutation_response'],
    ];
    update_robot_merkle_claims_by_pk?: [
      {
        /** append existing jsonb value of filtered columns with new jsonb value */
        _append?:
          | ResolverInputTypes['robot_merkle_claims_append_input']
          | undefined
          | null /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */;
        _delete_at_path?:
          | ResolverInputTypes['robot_merkle_claims_delete_at_path_input']
          | undefined
          | null /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */;
        _delete_elem?:
          | ResolverInputTypes['robot_merkle_claims_delete_elem_input']
          | undefined
          | null /** delete key/value pair or string element. key/value pairs are matched based on their key value */;
        _delete_key?:
          | ResolverInputTypes['robot_merkle_claims_delete_key_input']
          | undefined
          | null /** prepend existing jsonb value of filtered columns with new jsonb value */;
        _prepend?:
          | ResolverInputTypes['robot_merkle_claims_prepend_input']
          | undefined
          | null /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ResolverInputTypes['robot_merkle_claims_set_input']
          | undefined
          | null;
        pk_columns: ResolverInputTypes['robot_merkle_claims_pk_columns_input'];
      },
      ResolverInputTypes['robot_merkle_claims'],
    ];
    update_robot_merkle_claims_many?: [
      {
        /** updates to execute, in order */
        updates: Array<ResolverInputTypes['robot_merkle_claims_updates']>;
      },
      ResolverInputTypes['robot_merkle_claims_mutation_response'],
    ];
    update_robot_merkle_roots?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ResolverInputTypes['robot_merkle_roots_set_input']
          | undefined
          | null /** filter the rows which have to be updated */;
        where: ResolverInputTypes['robot_merkle_roots_bool_exp'];
      },
      ResolverInputTypes['robot_merkle_roots_mutation_response'],
    ];
    update_robot_merkle_roots_by_pk?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ResolverInputTypes['robot_merkle_roots_set_input']
          | undefined
          | null;
        pk_columns: ResolverInputTypes['robot_merkle_roots_pk_columns_input'];
      },
      ResolverInputTypes['robot_merkle_roots'],
    ];
    update_robot_merkle_roots_many?: [
      {
        /** updates to execute, in order */
        updates: Array<ResolverInputTypes['robot_merkle_roots_updates']>;
      },
      ResolverInputTypes['robot_merkle_roots_mutation_response'],
    ];
    update_robot_order?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ResolverInputTypes['robot_order_inc_input']
          | undefined
          | null /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ResolverInputTypes['robot_order_set_input']
          | undefined
          | null /** filter the rows which have to be updated */;
        where: ResolverInputTypes['robot_order_bool_exp'];
      },
      ResolverInputTypes['robot_order_mutation_response'],
    ];
    update_robot_order_by_pk?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ResolverInputTypes['robot_order_inc_input']
          | undefined
          | null /** sets the columns of the filtered rows to the given values */;
        _set?: ResolverInputTypes['robot_order_set_input'] | undefined | null;
        pk_columns: ResolverInputTypes['robot_order_pk_columns_input'];
      },
      ResolverInputTypes['robot_order'],
    ];
    update_robot_order_many?: [
      {
        /** updates to execute, in order */
        updates: Array<ResolverInputTypes['robot_order_updates']>;
      },
      ResolverInputTypes['robot_order_mutation_response'],
    ];
    update_robot_product?: [
      {
        /** append existing jsonb value of filtered columns with new jsonb value */
        _append?:
          | ResolverInputTypes['robot_product_append_input']
          | undefined
          | null /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */;
        _delete_at_path?:
          | ResolverInputTypes['robot_product_delete_at_path_input']
          | undefined
          | null /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */;
        _delete_elem?:
          | ResolverInputTypes['robot_product_delete_elem_input']
          | undefined
          | null /** delete key/value pair or string element. key/value pairs are matched based on their key value */;
        _delete_key?:
          | ResolverInputTypes['robot_product_delete_key_input']
          | undefined
          | null /** increments the numeric columns with given value of the filtered values */;
        _inc?:
          | ResolverInputTypes['robot_product_inc_input']
          | undefined
          | null /** prepend existing jsonb value of filtered columns with new jsonb value */;
        _prepend?:
          | ResolverInputTypes['robot_product_prepend_input']
          | undefined
          | null /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ResolverInputTypes['robot_product_set_input']
          | undefined
          | null /** filter the rows which have to be updated */;
        where: ResolverInputTypes['robot_product_bool_exp'];
      },
      ResolverInputTypes['robot_product_mutation_response'],
    ];
    update_robot_product_by_pk?: [
      {
        /** append existing jsonb value of filtered columns with new jsonb value */
        _append?:
          | ResolverInputTypes['robot_product_append_input']
          | undefined
          | null /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */;
        _delete_at_path?:
          | ResolverInputTypes['robot_product_delete_at_path_input']
          | undefined
          | null /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */;
        _delete_elem?:
          | ResolverInputTypes['robot_product_delete_elem_input']
          | undefined
          | null /** delete key/value pair or string element. key/value pairs are matched based on their key value */;
        _delete_key?:
          | ResolverInputTypes['robot_product_delete_key_input']
          | undefined
          | null /** increments the numeric columns with given value of the filtered values */;
        _inc?:
          | ResolverInputTypes['robot_product_inc_input']
          | undefined
          | null /** prepend existing jsonb value of filtered columns with new jsonb value */;
        _prepend?:
          | ResolverInputTypes['robot_product_prepend_input']
          | undefined
          | null /** sets the columns of the filtered rows to the given values */;
        _set?: ResolverInputTypes['robot_product_set_input'] | undefined | null;
        pk_columns: ResolverInputTypes['robot_product_pk_columns_input'];
      },
      ResolverInputTypes['robot_product'],
    ];
    update_robot_product_designer?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ResolverInputTypes['robot_product_designer_inc_input']
          | undefined
          | null /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ResolverInputTypes['robot_product_designer_set_input']
          | undefined
          | null /** filter the rows which have to be updated */;
        where: ResolverInputTypes['robot_product_designer_bool_exp'];
      },
      ResolverInputTypes['robot_product_designer_mutation_response'],
    ];
    update_robot_product_designer_by_pk?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ResolverInputTypes['robot_product_designer_inc_input']
          | undefined
          | null /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ResolverInputTypes['robot_product_designer_set_input']
          | undefined
          | null;
        pk_columns: ResolverInputTypes['robot_product_designer_pk_columns_input'];
      },
      ResolverInputTypes['robot_product_designer'],
    ];
    update_robot_product_designer_many?: [
      {
        /** updates to execute, in order */
        updates: Array<ResolverInputTypes['robot_product_designer_updates']>;
      },
      ResolverInputTypes['robot_product_designer_mutation_response'],
    ];
    update_robot_product_many?: [
      {
        /** updates to execute, in order */
        updates: Array<ResolverInputTypes['robot_product_updates']>;
      },
      ResolverInputTypes['robot_product_mutation_response'],
    ];
    update_shop_api_users?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ResolverInputTypes['shop_api_users_set_input']
          | undefined
          | null /** filter the rows which have to be updated */;
        where: ResolverInputTypes['shop_api_users_bool_exp'];
      },
      ResolverInputTypes['shop_api_users_mutation_response'],
    ];
    update_shop_api_users_by_pk?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ResolverInputTypes['shop_api_users_set_input']
          | undefined
          | null;
        pk_columns: ResolverInputTypes['shop_api_users_pk_columns_input'];
      },
      ResolverInputTypes['shop_api_users'],
    ];
    update_shop_api_users_many?: [
      {
        /** updates to execute, in order */
        updates: Array<ResolverInputTypes['shop_api_users_updates']>;
      },
      ResolverInputTypes['shop_api_users_mutation_response'],
    ];
    update_shop_product_locks?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ResolverInputTypes['shop_product_locks_set_input']
          | undefined
          | null /** filter the rows which have to be updated */;
        where: ResolverInputTypes['shop_product_locks_bool_exp'];
      },
      ResolverInputTypes['shop_product_locks_mutation_response'],
    ];
    update_shop_product_locks_by_pk?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ResolverInputTypes['shop_product_locks_set_input']
          | undefined
          | null;
        pk_columns: ResolverInputTypes['shop_product_locks_pk_columns_input'];
      },
      ResolverInputTypes['shop_product_locks'],
    ];
    update_shop_product_locks_many?: [
      {
        /** updates to execute, in order */
        updates: Array<ResolverInputTypes['shop_product_locks_updates']>;
      },
      ResolverInputTypes['shop_product_locks_mutation_response'],
    ];
    update_users?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ResolverInputTypes['users_set_input']
          | undefined
          | null /** filter the rows which have to be updated */;
        where: ResolverInputTypes['users_bool_exp'];
      },
      ResolverInputTypes['users_mutation_response'],
    ];
    update_users_by_pk?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?: ResolverInputTypes['users_set_input'] | undefined | null;
        pk_columns: ResolverInputTypes['users_pk_columns_input'];
      },
      ResolverInputTypes['users'],
    ];
    update_users_many?: [
      {
        /** updates to execute, in order */
        updates: Array<ResolverInputTypes['users_updates']>;
      },
      ResolverInputTypes['users_mutation_response'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['numeric']: number;
  /** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
  ['numeric_comparison_exp']: {
    _eq?: ResolverInputTypes['numeric'] | undefined | null;
    _gt?: ResolverInputTypes['numeric'] | undefined | null;
    _gte?: ResolverInputTypes['numeric'] | undefined | null;
    _in?: Array<ResolverInputTypes['numeric']> | undefined | null;
    _is_null?: boolean | undefined | null;
    _lt?: ResolverInputTypes['numeric'] | undefined | null;
    _lte?: ResolverInputTypes['numeric'] | undefined | null;
    _neq?: ResolverInputTypes['numeric'] | undefined | null;
    _nin?: Array<ResolverInputTypes['numeric']> | undefined | null;
  };
  /** column ordering options */
  ['order_by']: order_by;
  ['query_root']: AliasType<{
    contribution_votes?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contribution_votes_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contribution_votes_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['contribution_votes_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['contribution_votes'],
    ];
    contribution_votes_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contribution_votes_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contribution_votes_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['contribution_votes_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['contribution_votes_aggregate'],
    ];
    contribution_votes_by_pk?: [
      {
        contribution_id: ResolverInputTypes['uuid'];
        user_id: ResolverInputTypes['uuid'];
      },
      ResolverInputTypes['contribution_votes'],
    ];
    contributions?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contributions_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contributions_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['contributions_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['contributions'],
    ];
    contributions_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contributions_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contributions_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['contributions_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['contributions_aggregate'],
    ];
    contributions_by_pk?: [
      { id: ResolverInputTypes['uuid'] },
      ResolverInputTypes['contributions'],
    ];
    contributors?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contributors_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contributors_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['contributors_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['contributors'],
    ];
    contributors_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contributors_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contributors_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['contributors_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['contributors_aggregate'],
    ];
    contributors_by_pk?: [
      {
        contribution_id: ResolverInputTypes['uuid'];
        user_id: ResolverInputTypes['uuid'];
      },
      ResolverInputTypes['contributors'],
    ];
    robot_merkle_claims?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_merkle_claims_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_merkle_claims_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_merkle_claims_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_claims'],
    ];
    robot_merkle_claims_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_merkle_claims_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_merkle_claims_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_merkle_claims_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_claims_aggregate'],
    ];
    robot_merkle_claims_by_pk?: [
      { id: ResolverInputTypes['uuid'] },
      ResolverInputTypes['robot_merkle_claims'],
    ];
    robot_merkle_roots?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_merkle_roots_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_merkle_roots_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_merkle_roots_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_roots'],
    ];
    robot_merkle_roots_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_merkle_roots_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_merkle_roots_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_merkle_roots_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_roots_aggregate'],
    ];
    robot_merkle_roots_by_pk?: [
      { hash: string },
      ResolverInputTypes['robot_merkle_roots'],
    ];
    robot_order?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_order_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_order_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['robot_order_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['robot_order'],
    ];
    robot_order_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_order_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_order_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['robot_order_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['robot_order_aggregate'],
    ];
    robot_order_by_pk?: [
      { order_id: string },
      ResolverInputTypes['robot_order'],
    ];
    robot_product?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_product_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_product_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['robot_product_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['robot_product'],
    ];
    robot_product_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_product_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_product_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['robot_product_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['robot_product_aggregate'],
    ];
    robot_product_by_pk?: [{ id: string }, ResolverInputTypes['robot_product']];
    robot_product_designer?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_product_designer_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_product_designer_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_product_designer_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_product_designer'],
    ];
    robot_product_designer_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_product_designer_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_product_designer_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_product_designer_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_product_designer_aggregate'],
    ];
    robot_product_designer_by_pk?: [
      { eth_address: string; product_id: string },
      ResolverInputTypes['robot_product_designer'],
    ];
    shop_api_users?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['shop_api_users_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['shop_api_users_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['shop_api_users_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['shop_api_users'],
    ];
    shop_api_users_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['shop_api_users_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['shop_api_users_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['shop_api_users_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['shop_api_users_aggregate'],
    ];
    shop_api_users_by_pk?: [
      { username: string },
      ResolverInputTypes['shop_api_users'],
    ];
    shop_product_locks?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['shop_product_locks_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['shop_product_locks_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['shop_product_locks_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['shop_product_locks'],
    ];
    shop_product_locks_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['shop_product_locks_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['shop_product_locks_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['shop_product_locks_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['shop_product_locks_aggregate'],
    ];
    shop_product_locks_by_pk?: [
      { access_code: string; lock_id: string },
      ResolverInputTypes['shop_product_locks'],
    ];
    users?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['users_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['users_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['users_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['users'],
    ];
    users_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['users_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['users_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['users_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['users_aggregate'],
    ];
    users_by_pk?: [
      { id: ResolverInputTypes['uuid'] },
      ResolverInputTypes['users'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  /** Claim data for recipients in a merkle giveaway */
  ['robot_merkle_claims']: AliasType<{
    claim_json?: [
      {
        /** JSON select path */ path?: string | undefined | null;
      },
      boolean | `@${string}`,
    ];
    id?: boolean | `@${string}`;
    /** An object relationship */
    merkle_root?: ResolverInputTypes['robot_merkle_roots'];
    merkle_root_hash?: boolean | `@${string}`;
    recipient_eth_address?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "robot.merkle_claims" */
  ['robot_merkle_claims_aggregate']: AliasType<{
    aggregate?: ResolverInputTypes['robot_merkle_claims_aggregate_fields'];
    nodes?: ResolverInputTypes['robot_merkle_claims'];
    __typename?: boolean | `@${string}`;
  }>;
  ['robot_merkle_claims_aggregate_bool_exp']: {
    count?:
      | ResolverInputTypes['robot_merkle_claims_aggregate_bool_exp_count']
      | undefined
      | null;
  };
  ['robot_merkle_claims_aggregate_bool_exp_count']: {
    arguments?:
      | Array<ResolverInputTypes['robot_merkle_claims_select_column']>
      | undefined
      | null;
    distinct?: boolean | undefined | null;
    filter?:
      | ResolverInputTypes['robot_merkle_claims_bool_exp']
      | undefined
      | null;
    predicate: ResolverInputTypes['Int_comparison_exp'];
  };
  /** aggregate fields of "robot.merkle_claims" */
  ['robot_merkle_claims_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?:
          | Array<ResolverInputTypes['robot_merkle_claims_select_column']>
          | undefined
          | null;
        distinct?: boolean | undefined | null;
      },
      boolean | `@${string}`,
    ];
    max?: ResolverInputTypes['robot_merkle_claims_max_fields'];
    min?: ResolverInputTypes['robot_merkle_claims_min_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** order by aggregate values of table "robot.merkle_claims" */
  ['robot_merkle_claims_aggregate_order_by']: {
    count?: ResolverInputTypes['order_by'] | undefined | null;
    max?:
      | ResolverInputTypes['robot_merkle_claims_max_order_by']
      | undefined
      | null;
    min?:
      | ResolverInputTypes['robot_merkle_claims_min_order_by']
      | undefined
      | null;
  };
  /** append existing jsonb value of filtered columns with new jsonb value */
  ['robot_merkle_claims_append_input']: {
    claim_json?: ResolverInputTypes['jsonb'] | undefined | null;
  };
  /** input type for inserting array relation for remote table "robot.merkle_claims" */
  ['robot_merkle_claims_arr_rel_insert_input']: {
    data: Array<ResolverInputTypes['robot_merkle_claims_insert_input']>;
    /** upsert condition */
    on_conflict?:
      | ResolverInputTypes['robot_merkle_claims_on_conflict']
      | undefined
      | null;
  };
  /** Boolean expression to filter rows from the table "robot.merkle_claims". All fields are combined with a logical 'AND'. */
  ['robot_merkle_claims_bool_exp']: {
    _and?:
      | Array<ResolverInputTypes['robot_merkle_claims_bool_exp']>
      | undefined
      | null;
    _not?:
      | ResolverInputTypes['robot_merkle_claims_bool_exp']
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['robot_merkle_claims_bool_exp']>
      | undefined
      | null;
    claim_json?: ResolverInputTypes['jsonb_comparison_exp'] | undefined | null;
    id?: ResolverInputTypes['uuid_comparison_exp'] | undefined | null;
    merkle_root?:
      | ResolverInputTypes['robot_merkle_roots_bool_exp']
      | undefined
      | null;
    merkle_root_hash?:
      | ResolverInputTypes['String_comparison_exp']
      | undefined
      | null;
    recipient_eth_address?:
      | ResolverInputTypes['String_comparison_exp']
      | undefined
      | null;
  };
  /** unique or primary key constraints on table "robot.merkle_claims" */
  ['robot_merkle_claims_constraint']: robot_merkle_claims_constraint;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  ['robot_merkle_claims_delete_at_path_input']: {
    claim_json?: Array<string> | undefined | null;
  };
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  ['robot_merkle_claims_delete_elem_input']: {
    claim_json?: number | undefined | null;
  };
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  ['robot_merkle_claims_delete_key_input']: {
    claim_json?: string | undefined | null;
  };
  /** input type for inserting data into table "robot.merkle_claims" */
  ['robot_merkle_claims_insert_input']: {
    claim_json?: ResolverInputTypes['jsonb'] | undefined | null;
    id?: ResolverInputTypes['uuid'] | undefined | null;
    merkle_root?:
      | ResolverInputTypes['robot_merkle_roots_obj_rel_insert_input']
      | undefined
      | null;
    merkle_root_hash?: string | undefined | null;
    recipient_eth_address?: string | undefined | null;
  };
  /** aggregate max on columns */
  ['robot_merkle_claims_max_fields']: AliasType<{
    id?: boolean | `@${string}`;
    merkle_root_hash?: boolean | `@${string}`;
    recipient_eth_address?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by max() on columns of table "robot.merkle_claims" */
  ['robot_merkle_claims_max_order_by']: {
    id?: ResolverInputTypes['order_by'] | undefined | null;
    merkle_root_hash?: ResolverInputTypes['order_by'] | undefined | null;
    recipient_eth_address?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** aggregate min on columns */
  ['robot_merkle_claims_min_fields']: AliasType<{
    id?: boolean | `@${string}`;
    merkle_root_hash?: boolean | `@${string}`;
    recipient_eth_address?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by min() on columns of table "robot.merkle_claims" */
  ['robot_merkle_claims_min_order_by']: {
    id?: ResolverInputTypes['order_by'] | undefined | null;
    merkle_root_hash?: ResolverInputTypes['order_by'] | undefined | null;
    recipient_eth_address?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** response of any mutation on the table "robot.merkle_claims" */
  ['robot_merkle_claims_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ResolverInputTypes['robot_merkle_claims'];
    __typename?: boolean | `@${string}`;
  }>;
  /** on_conflict condition type for table "robot.merkle_claims" */
  ['robot_merkle_claims_on_conflict']: {
    constraint: ResolverInputTypes['robot_merkle_claims_constraint'];
    update_columns: Array<
      ResolverInputTypes['robot_merkle_claims_update_column']
    >;
    where?:
      | ResolverInputTypes['robot_merkle_claims_bool_exp']
      | undefined
      | null;
  };
  /** Ordering options when selecting data from "robot.merkle_claims". */
  ['robot_merkle_claims_order_by']: {
    claim_json?: ResolverInputTypes['order_by'] | undefined | null;
    id?: ResolverInputTypes['order_by'] | undefined | null;
    merkle_root?:
      | ResolverInputTypes['robot_merkle_roots_order_by']
      | undefined
      | null;
    merkle_root_hash?: ResolverInputTypes['order_by'] | undefined | null;
    recipient_eth_address?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** primary key columns input for table: robot.merkle_claims */
  ['robot_merkle_claims_pk_columns_input']: {
    id: ResolverInputTypes['uuid'];
  };
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  ['robot_merkle_claims_prepend_input']: {
    claim_json?: ResolverInputTypes['jsonb'] | undefined | null;
  };
  /** select columns of table "robot.merkle_claims" */
  ['robot_merkle_claims_select_column']: robot_merkle_claims_select_column;
  /** input type for updating data in table "robot.merkle_claims" */
  ['robot_merkle_claims_set_input']: {
    claim_json?: ResolverInputTypes['jsonb'] | undefined | null;
    id?: ResolverInputTypes['uuid'] | undefined | null;
    merkle_root_hash?: string | undefined | null;
    recipient_eth_address?: string | undefined | null;
  };
  /** Streaming cursor of the table "robot_merkle_claims" */
  ['robot_merkle_claims_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ResolverInputTypes['robot_merkle_claims_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ResolverInputTypes['cursor_ordering'] | undefined | null;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_merkle_claims_stream_cursor_value_input']: {
    claim_json?: ResolverInputTypes['jsonb'] | undefined | null;
    id?: ResolverInputTypes['uuid'] | undefined | null;
    merkle_root_hash?: string | undefined | null;
    recipient_eth_address?: string | undefined | null;
  };
  /** update columns of table "robot.merkle_claims" */
  ['robot_merkle_claims_update_column']: robot_merkle_claims_update_column;
  ['robot_merkle_claims_updates']: {
    /** append existing jsonb value of filtered columns with new jsonb value */
    _append?:
      | ResolverInputTypes['robot_merkle_claims_append_input']
      | undefined
      | null;
    /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
    _delete_at_path?:
      | ResolverInputTypes['robot_merkle_claims_delete_at_path_input']
      | undefined
      | null;
    /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
    _delete_elem?:
      | ResolverInputTypes['robot_merkle_claims_delete_elem_input']
      | undefined
      | null;
    /** delete key/value pair or string element. key/value pairs are matched based on their key value */
    _delete_key?:
      | ResolverInputTypes['robot_merkle_claims_delete_key_input']
      | undefined
      | null;
    /** prepend existing jsonb value of filtered columns with new jsonb value */
    _prepend?:
      | ResolverInputTypes['robot_merkle_claims_prepend_input']
      | undefined
      | null;
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ResolverInputTypes['robot_merkle_claims_set_input']
      | undefined
      | null;
    /** filter the rows which have to be updated */
    where: ResolverInputTypes['robot_merkle_claims_bool_exp'];
  };
  /** Each merkle root corresponds to a distribution in the giveaway contract */
  ['robot_merkle_roots']: AliasType<{
    contract_address?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    hash?: boolean | `@${string}`;
    merkle_claims?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_merkle_claims_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_merkle_claims_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_merkle_claims_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_claims'],
    ];
    merkle_claims_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_merkle_claims_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_merkle_claims_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_merkle_claims_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_claims_aggregate'],
    ];
    network?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "robot.merkle_roots" */
  ['robot_merkle_roots_aggregate']: AliasType<{
    aggregate?: ResolverInputTypes['robot_merkle_roots_aggregate_fields'];
    nodes?: ResolverInputTypes['robot_merkle_roots'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate fields of "robot.merkle_roots" */
  ['robot_merkle_roots_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?:
          | Array<ResolverInputTypes['robot_merkle_roots_select_column']>
          | undefined
          | null;
        distinct?: boolean | undefined | null;
      },
      boolean | `@${string}`,
    ];
    max?: ResolverInputTypes['robot_merkle_roots_max_fields'];
    min?: ResolverInputTypes['robot_merkle_roots_min_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** Boolean expression to filter rows from the table "robot.merkle_roots". All fields are combined with a logical 'AND'. */
  ['robot_merkle_roots_bool_exp']: {
    _and?:
      | Array<ResolverInputTypes['robot_merkle_roots_bool_exp']>
      | undefined
      | null;
    _not?: ResolverInputTypes['robot_merkle_roots_bool_exp'] | undefined | null;
    _or?:
      | Array<ResolverInputTypes['robot_merkle_roots_bool_exp']>
      | undefined
      | null;
    contract_address?:
      | ResolverInputTypes['String_comparison_exp']
      | undefined
      | null;
    created_at?:
      | ResolverInputTypes['timestamptz_comparison_exp']
      | undefined
      | null;
    hash?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
    merkle_claims?:
      | ResolverInputTypes['robot_merkle_claims_bool_exp']
      | undefined
      | null;
    merkle_claims_aggregate?:
      | ResolverInputTypes['robot_merkle_claims_aggregate_bool_exp']
      | undefined
      | null;
    network?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
  };
  /** unique or primary key constraints on table "robot.merkle_roots" */
  ['robot_merkle_roots_constraint']: robot_merkle_roots_constraint;
  /** input type for inserting data into table "robot.merkle_roots" */
  ['robot_merkle_roots_insert_input']: {
    contract_address?: string | undefined | null;
    created_at?: ResolverInputTypes['timestamptz'] | undefined | null;
    hash?: string | undefined | null;
    merkle_claims?:
      | ResolverInputTypes['robot_merkle_claims_arr_rel_insert_input']
      | undefined
      | null;
    network?: string | undefined | null;
  };
  /** aggregate max on columns */
  ['robot_merkle_roots_max_fields']: AliasType<{
    contract_address?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    hash?: boolean | `@${string}`;
    network?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate min on columns */
  ['robot_merkle_roots_min_fields']: AliasType<{
    contract_address?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    hash?: boolean | `@${string}`;
    network?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** response of any mutation on the table "robot.merkle_roots" */
  ['robot_merkle_roots_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ResolverInputTypes['robot_merkle_roots'];
    __typename?: boolean | `@${string}`;
  }>;
  /** input type for inserting object relation for remote table "robot.merkle_roots" */
  ['robot_merkle_roots_obj_rel_insert_input']: {
    data: ResolverInputTypes['robot_merkle_roots_insert_input'];
    /** upsert condition */
    on_conflict?:
      | ResolverInputTypes['robot_merkle_roots_on_conflict']
      | undefined
      | null;
  };
  /** on_conflict condition type for table "robot.merkle_roots" */
  ['robot_merkle_roots_on_conflict']: {
    constraint: ResolverInputTypes['robot_merkle_roots_constraint'];
    update_columns: Array<
      ResolverInputTypes['robot_merkle_roots_update_column']
    >;
    where?:
      | ResolverInputTypes['robot_merkle_roots_bool_exp']
      | undefined
      | null;
  };
  /** Ordering options when selecting data from "robot.merkle_roots". */
  ['robot_merkle_roots_order_by']: {
    contract_address?: ResolverInputTypes['order_by'] | undefined | null;
    created_at?: ResolverInputTypes['order_by'] | undefined | null;
    hash?: ResolverInputTypes['order_by'] | undefined | null;
    merkle_claims_aggregate?:
      | ResolverInputTypes['robot_merkle_claims_aggregate_order_by']
      | undefined
      | null;
    network?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** primary key columns input for table: robot.merkle_roots */
  ['robot_merkle_roots_pk_columns_input']: {
    hash: string;
  };
  /** select columns of table "robot.merkle_roots" */
  ['robot_merkle_roots_select_column']: robot_merkle_roots_select_column;
  /** input type for updating data in table "robot.merkle_roots" */
  ['robot_merkle_roots_set_input']: {
    contract_address?: string | undefined | null;
    created_at?: ResolverInputTypes['timestamptz'] | undefined | null;
    hash?: string | undefined | null;
    network?: string | undefined | null;
  };
  /** Streaming cursor of the table "robot_merkle_roots" */
  ['robot_merkle_roots_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ResolverInputTypes['robot_merkle_roots_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ResolverInputTypes['cursor_ordering'] | undefined | null;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_merkle_roots_stream_cursor_value_input']: {
    contract_address?: string | undefined | null;
    created_at?: ResolverInputTypes['timestamptz'] | undefined | null;
    hash?: string | undefined | null;
    network?: string | undefined | null;
  };
  /** update columns of table "robot.merkle_roots" */
  ['robot_merkle_roots_update_column']: robot_merkle_roots_update_column;
  ['robot_merkle_roots_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ResolverInputTypes['robot_merkle_roots_set_input']
      | undefined
      | null;
    /** filter the rows which have to be updated */
    where: ResolverInputTypes['robot_merkle_roots_bool_exp'];
  };
  /** Orders for ROBOT rewards */
  ['robot_order']: AliasType<{
    buyer_address?: boolean | `@${string}`;
    buyer_reward?: boolean | `@${string}`;
    date?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    order_id?: boolean | `@${string}`;
    order_number?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "robot.order" */
  ['robot_order_aggregate']: AliasType<{
    aggregate?: ResolverInputTypes['robot_order_aggregate_fields'];
    nodes?: ResolverInputTypes['robot_order'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate fields of "robot.order" */
  ['robot_order_aggregate_fields']: AliasType<{
    avg?: ResolverInputTypes['robot_order_avg_fields'];
    count?: [
      {
        columns?:
          | Array<ResolverInputTypes['robot_order_select_column']>
          | undefined
          | null;
        distinct?: boolean | undefined | null;
      },
      boolean | `@${string}`,
    ];
    max?: ResolverInputTypes['robot_order_max_fields'];
    min?: ResolverInputTypes['robot_order_min_fields'];
    stddev?: ResolverInputTypes['robot_order_stddev_fields'];
    stddev_pop?: ResolverInputTypes['robot_order_stddev_pop_fields'];
    stddev_samp?: ResolverInputTypes['robot_order_stddev_samp_fields'];
    sum?: ResolverInputTypes['robot_order_sum_fields'];
    var_pop?: ResolverInputTypes['robot_order_var_pop_fields'];
    var_samp?: ResolverInputTypes['robot_order_var_samp_fields'];
    variance?: ResolverInputTypes['robot_order_variance_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate avg on columns */
  ['robot_order_avg_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Boolean expression to filter rows from the table "robot.order". All fields are combined with a logical 'AND'. */
  ['robot_order_bool_exp']: {
    _and?: Array<ResolverInputTypes['robot_order_bool_exp']> | undefined | null;
    _not?: ResolverInputTypes['robot_order_bool_exp'] | undefined | null;
    _or?: Array<ResolverInputTypes['robot_order_bool_exp']> | undefined | null;
    buyer_address?:
      | ResolverInputTypes['String_comparison_exp']
      | undefined
      | null;
    buyer_reward?:
      | ResolverInputTypes['numeric_comparison_exp']
      | undefined
      | null;
    date?: ResolverInputTypes['date_comparison_exp'] | undefined | null;
    dollars_spent?:
      | ResolverInputTypes['numeric_comparison_exp']
      | undefined
      | null;
    order_id?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
    order_number?:
      | ResolverInputTypes['String_comparison_exp']
      | undefined
      | null;
    season?: ResolverInputTypes['numeric_comparison_exp'] | undefined | null;
  };
  /** unique or primary key constraints on table "robot.order" */
  ['robot_order_constraint']: robot_order_constraint;
  /** input type for incrementing numeric columns in table "robot.order" */
  ['robot_order_inc_input']: {
    buyer_reward?: ResolverInputTypes['numeric'] | undefined | null;
    dollars_spent?: ResolverInputTypes['numeric'] | undefined | null;
    season?: ResolverInputTypes['numeric'] | undefined | null;
  };
  /** input type for inserting data into table "robot.order" */
  ['robot_order_insert_input']: {
    buyer_address?: string | undefined | null;
    buyer_reward?: ResolverInputTypes['numeric'] | undefined | null;
    date?: ResolverInputTypes['date'] | undefined | null;
    dollars_spent?: ResolverInputTypes['numeric'] | undefined | null;
    order_id?: string | undefined | null;
    order_number?: string | undefined | null;
    season?: ResolverInputTypes['numeric'] | undefined | null;
  };
  /** aggregate max on columns */
  ['robot_order_max_fields']: AliasType<{
    buyer_address?: boolean | `@${string}`;
    buyer_reward?: boolean | `@${string}`;
    date?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    order_id?: boolean | `@${string}`;
    order_number?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate min on columns */
  ['robot_order_min_fields']: AliasType<{
    buyer_address?: boolean | `@${string}`;
    buyer_reward?: boolean | `@${string}`;
    date?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    order_id?: boolean | `@${string}`;
    order_number?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** response of any mutation on the table "robot.order" */
  ['robot_order_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ResolverInputTypes['robot_order'];
    __typename?: boolean | `@${string}`;
  }>;
  /** on_conflict condition type for table "robot.order" */
  ['robot_order_on_conflict']: {
    constraint: ResolverInputTypes['robot_order_constraint'];
    update_columns: Array<ResolverInputTypes['robot_order_update_column']>;
    where?: ResolverInputTypes['robot_order_bool_exp'] | undefined | null;
  };
  /** Ordering options when selecting data from "robot.order". */
  ['robot_order_order_by']: {
    buyer_address?: ResolverInputTypes['order_by'] | undefined | null;
    buyer_reward?: ResolverInputTypes['order_by'] | undefined | null;
    date?: ResolverInputTypes['order_by'] | undefined | null;
    dollars_spent?: ResolverInputTypes['order_by'] | undefined | null;
    order_id?: ResolverInputTypes['order_by'] | undefined | null;
    order_number?: ResolverInputTypes['order_by'] | undefined | null;
    season?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** primary key columns input for table: robot.order */
  ['robot_order_pk_columns_input']: {
    order_id: string;
  };
  /** select columns of table "robot.order" */
  ['robot_order_select_column']: robot_order_select_column;
  /** input type for updating data in table "robot.order" */
  ['robot_order_set_input']: {
    buyer_address?: string | undefined | null;
    buyer_reward?: ResolverInputTypes['numeric'] | undefined | null;
    date?: ResolverInputTypes['date'] | undefined | null;
    dollars_spent?: ResolverInputTypes['numeric'] | undefined | null;
    order_id?: string | undefined | null;
    order_number?: string | undefined | null;
    season?: ResolverInputTypes['numeric'] | undefined | null;
  };
  /** aggregate stddev on columns */
  ['robot_order_stddev_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate stddev_pop on columns */
  ['robot_order_stddev_pop_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate stddev_samp on columns */
  ['robot_order_stddev_samp_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Streaming cursor of the table "robot_order" */
  ['robot_order_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ResolverInputTypes['robot_order_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ResolverInputTypes['cursor_ordering'] | undefined | null;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_order_stream_cursor_value_input']: {
    buyer_address?: string | undefined | null;
    buyer_reward?: ResolverInputTypes['numeric'] | undefined | null;
    date?: ResolverInputTypes['date'] | undefined | null;
    dollars_spent?: ResolverInputTypes['numeric'] | undefined | null;
    order_id?: string | undefined | null;
    order_number?: string | undefined | null;
    season?: ResolverInputTypes['numeric'] | undefined | null;
  };
  /** aggregate sum on columns */
  ['robot_order_sum_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** update columns of table "robot.order" */
  ['robot_order_update_column']: robot_order_update_column;
  ['robot_order_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?: ResolverInputTypes['robot_order_inc_input'] | undefined | null;
    /** sets the columns of the filtered rows to the given values */
    _set?: ResolverInputTypes['robot_order_set_input'] | undefined | null;
    /** filter the rows which have to be updated */
    where: ResolverInputTypes['robot_order_bool_exp'];
  };
  /** aggregate var_pop on columns */
  ['robot_order_var_pop_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate var_samp on columns */
  ['robot_order_var_samp_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate variance on columns */
  ['robot_order_variance_fields']: AliasType<{
    buyer_reward?: boolean | `@${string}`;
    dollars_spent?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Products for ROBOT designer rewards */
  ['robot_product']: AliasType<{
    designers?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_product_designer_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_product_designer_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_product_designer_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_product_designer'],
    ];
    designers_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_product_designer_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_product_designer_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_product_designer_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_product_designer_aggregate'],
    ];
    id?: boolean | `@${string}`;
    nft_metadata?: [
      {
        /** JSON select path */ path?: string | undefined | null;
      },
      boolean | `@${string}`,
    ];
    nft_token_id?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    shopify_id?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "robot.product" */
  ['robot_product_aggregate']: AliasType<{
    aggregate?: ResolverInputTypes['robot_product_aggregate_fields'];
    nodes?: ResolverInputTypes['robot_product'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate fields of "robot.product" */
  ['robot_product_aggregate_fields']: AliasType<{
    avg?: ResolverInputTypes['robot_product_avg_fields'];
    count?: [
      {
        columns?:
          | Array<ResolverInputTypes['robot_product_select_column']>
          | undefined
          | null;
        distinct?: boolean | undefined | null;
      },
      boolean | `@${string}`,
    ];
    max?: ResolverInputTypes['robot_product_max_fields'];
    min?: ResolverInputTypes['robot_product_min_fields'];
    stddev?: ResolverInputTypes['robot_product_stddev_fields'];
    stddev_pop?: ResolverInputTypes['robot_product_stddev_pop_fields'];
    stddev_samp?: ResolverInputTypes['robot_product_stddev_samp_fields'];
    sum?: ResolverInputTypes['robot_product_sum_fields'];
    var_pop?: ResolverInputTypes['robot_product_var_pop_fields'];
    var_samp?: ResolverInputTypes['robot_product_var_samp_fields'];
    variance?: ResolverInputTypes['robot_product_variance_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** append existing jsonb value of filtered columns with new jsonb value */
  ['robot_product_append_input']: {
    nft_metadata?: ResolverInputTypes['jsonb'] | undefined | null;
  };
  /** aggregate avg on columns */
  ['robot_product_avg_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Boolean expression to filter rows from the table "robot.product". All fields are combined with a logical 'AND'. */
  ['robot_product_bool_exp']: {
    _and?:
      | Array<ResolverInputTypes['robot_product_bool_exp']>
      | undefined
      | null;
    _not?: ResolverInputTypes['robot_product_bool_exp'] | undefined | null;
    _or?:
      | Array<ResolverInputTypes['robot_product_bool_exp']>
      | undefined
      | null;
    designers?:
      | ResolverInputTypes['robot_product_designer_bool_exp']
      | undefined
      | null;
    designers_aggregate?:
      | ResolverInputTypes['robot_product_designer_aggregate_bool_exp']
      | undefined
      | null;
    id?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
    nft_metadata?:
      | ResolverInputTypes['jsonb_comparison_exp']
      | undefined
      | null;
    nft_token_id?: ResolverInputTypes['Int_comparison_exp'] | undefined | null;
    notion_id?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
    shopify_id?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
    title?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
  };
  /** unique or primary key constraints on table "robot.product" */
  ['robot_product_constraint']: robot_product_constraint;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  ['robot_product_delete_at_path_input']: {
    nft_metadata?: Array<string> | undefined | null;
  };
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  ['robot_product_delete_elem_input']: {
    nft_metadata?: number | undefined | null;
  };
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  ['robot_product_delete_key_input']: {
    nft_metadata?: string | undefined | null;
  };
  /** Designer receiving ROBOT rewards */
  ['robot_product_designer']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    designer_name?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    /** An object relationship */
    product?: ResolverInputTypes['robot_product'];
    product_id?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "robot.product_designer" */
  ['robot_product_designer_aggregate']: AliasType<{
    aggregate?: ResolverInputTypes['robot_product_designer_aggregate_fields'];
    nodes?: ResolverInputTypes['robot_product_designer'];
    __typename?: boolean | `@${string}`;
  }>;
  ['robot_product_designer_aggregate_bool_exp']: {
    count?:
      | ResolverInputTypes['robot_product_designer_aggregate_bool_exp_count']
      | undefined
      | null;
  };
  ['robot_product_designer_aggregate_bool_exp_count']: {
    arguments?:
      | Array<ResolverInputTypes['robot_product_designer_select_column']>
      | undefined
      | null;
    distinct?: boolean | undefined | null;
    filter?:
      | ResolverInputTypes['robot_product_designer_bool_exp']
      | undefined
      | null;
    predicate: ResolverInputTypes['Int_comparison_exp'];
  };
  /** aggregate fields of "robot.product_designer" */
  ['robot_product_designer_aggregate_fields']: AliasType<{
    avg?: ResolverInputTypes['robot_product_designer_avg_fields'];
    count?: [
      {
        columns?:
          | Array<ResolverInputTypes['robot_product_designer_select_column']>
          | undefined
          | null;
        distinct?: boolean | undefined | null;
      },
      boolean | `@${string}`,
    ];
    max?: ResolverInputTypes['robot_product_designer_max_fields'];
    min?: ResolverInputTypes['robot_product_designer_min_fields'];
    stddev?: ResolverInputTypes['robot_product_designer_stddev_fields'];
    stddev_pop?: ResolverInputTypes['robot_product_designer_stddev_pop_fields'];
    stddev_samp?: ResolverInputTypes['robot_product_designer_stddev_samp_fields'];
    sum?: ResolverInputTypes['robot_product_designer_sum_fields'];
    var_pop?: ResolverInputTypes['robot_product_designer_var_pop_fields'];
    var_samp?: ResolverInputTypes['robot_product_designer_var_samp_fields'];
    variance?: ResolverInputTypes['robot_product_designer_variance_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** order by aggregate values of table "robot.product_designer" */
  ['robot_product_designer_aggregate_order_by']: {
    avg?:
      | ResolverInputTypes['robot_product_designer_avg_order_by']
      | undefined
      | null;
    count?: ResolverInputTypes['order_by'] | undefined | null;
    max?:
      | ResolverInputTypes['robot_product_designer_max_order_by']
      | undefined
      | null;
    min?:
      | ResolverInputTypes['robot_product_designer_min_order_by']
      | undefined
      | null;
    stddev?:
      | ResolverInputTypes['robot_product_designer_stddev_order_by']
      | undefined
      | null;
    stddev_pop?:
      | ResolverInputTypes['robot_product_designer_stddev_pop_order_by']
      | undefined
      | null;
    stddev_samp?:
      | ResolverInputTypes['robot_product_designer_stddev_samp_order_by']
      | undefined
      | null;
    sum?:
      | ResolverInputTypes['robot_product_designer_sum_order_by']
      | undefined
      | null;
    var_pop?:
      | ResolverInputTypes['robot_product_designer_var_pop_order_by']
      | undefined
      | null;
    var_samp?:
      | ResolverInputTypes['robot_product_designer_var_samp_order_by']
      | undefined
      | null;
    variance?:
      | ResolverInputTypes['robot_product_designer_variance_order_by']
      | undefined
      | null;
  };
  /** input type for inserting array relation for remote table "robot.product_designer" */
  ['robot_product_designer_arr_rel_insert_input']: {
    data: Array<ResolverInputTypes['robot_product_designer_insert_input']>;
    /** upsert condition */
    on_conflict?:
      | ResolverInputTypes['robot_product_designer_on_conflict']
      | undefined
      | null;
  };
  /** aggregate avg on columns */
  ['robot_product_designer_avg_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by avg() on columns of table "robot.product_designer" */
  ['robot_product_designer_avg_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
    robot_reward?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** Boolean expression to filter rows from the table "robot.product_designer". All fields are combined with a logical 'AND'. */
  ['robot_product_designer_bool_exp']: {
    _and?:
      | Array<ResolverInputTypes['robot_product_designer_bool_exp']>
      | undefined
      | null;
    _not?:
      | ResolverInputTypes['robot_product_designer_bool_exp']
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['robot_product_designer_bool_exp']>
      | undefined
      | null;
    contribution_share?:
      | ResolverInputTypes['numeric_comparison_exp']
      | undefined
      | null;
    designer_name?:
      | ResolverInputTypes['String_comparison_exp']
      | undefined
      | null;
    eth_address?:
      | ResolverInputTypes['String_comparison_exp']
      | undefined
      | null;
    product?: ResolverInputTypes['robot_product_bool_exp'] | undefined | null;
    product_id?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
    robot_reward?:
      | ResolverInputTypes['numeric_comparison_exp']
      | undefined
      | null;
  };
  /** unique or primary key constraints on table "robot.product_designer" */
  ['robot_product_designer_constraint']: robot_product_designer_constraint;
  /** input type for incrementing numeric columns in table "robot.product_designer" */
  ['robot_product_designer_inc_input']: {
    contribution_share?: ResolverInputTypes['numeric'] | undefined | null;
    robot_reward?: ResolverInputTypes['numeric'] | undefined | null;
  };
  /** input type for inserting data into table "robot.product_designer" */
  ['robot_product_designer_insert_input']: {
    contribution_share?: ResolverInputTypes['numeric'] | undefined | null;
    designer_name?: string | undefined | null;
    eth_address?: string | undefined | null;
    product?:
      | ResolverInputTypes['robot_product_obj_rel_insert_input']
      | undefined
      | null;
    product_id?: string | undefined | null;
    robot_reward?: ResolverInputTypes['numeric'] | undefined | null;
  };
  /** aggregate max on columns */
  ['robot_product_designer_max_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    designer_name?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    product_id?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by max() on columns of table "robot.product_designer" */
  ['robot_product_designer_max_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
    designer_name?: ResolverInputTypes['order_by'] | undefined | null;
    eth_address?: ResolverInputTypes['order_by'] | undefined | null;
    product_id?: ResolverInputTypes['order_by'] | undefined | null;
    robot_reward?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** aggregate min on columns */
  ['robot_product_designer_min_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    designer_name?: boolean | `@${string}`;
    eth_address?: boolean | `@${string}`;
    product_id?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by min() on columns of table "robot.product_designer" */
  ['robot_product_designer_min_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
    designer_name?: ResolverInputTypes['order_by'] | undefined | null;
    eth_address?: ResolverInputTypes['order_by'] | undefined | null;
    product_id?: ResolverInputTypes['order_by'] | undefined | null;
    robot_reward?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** response of any mutation on the table "robot.product_designer" */
  ['robot_product_designer_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ResolverInputTypes['robot_product_designer'];
    __typename?: boolean | `@${string}`;
  }>;
  /** on_conflict condition type for table "robot.product_designer" */
  ['robot_product_designer_on_conflict']: {
    constraint: ResolverInputTypes['robot_product_designer_constraint'];
    update_columns: Array<
      ResolverInputTypes['robot_product_designer_update_column']
    >;
    where?:
      | ResolverInputTypes['robot_product_designer_bool_exp']
      | undefined
      | null;
  };
  /** Ordering options when selecting data from "robot.product_designer". */
  ['robot_product_designer_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
    designer_name?: ResolverInputTypes['order_by'] | undefined | null;
    eth_address?: ResolverInputTypes['order_by'] | undefined | null;
    product?: ResolverInputTypes['robot_product_order_by'] | undefined | null;
    product_id?: ResolverInputTypes['order_by'] | undefined | null;
    robot_reward?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** primary key columns input for table: robot.product_designer */
  ['robot_product_designer_pk_columns_input']: {
    eth_address: string;
    product_id: string;
  };
  /** select columns of table "robot.product_designer" */
  ['robot_product_designer_select_column']: robot_product_designer_select_column;
  /** input type for updating data in table "robot.product_designer" */
  ['robot_product_designer_set_input']: {
    contribution_share?: ResolverInputTypes['numeric'] | undefined | null;
    designer_name?: string | undefined | null;
    eth_address?: string | undefined | null;
    product_id?: string | undefined | null;
    robot_reward?: ResolverInputTypes['numeric'] | undefined | null;
  };
  /** aggregate stddev on columns */
  ['robot_product_designer_stddev_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by stddev() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
    robot_reward?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** aggregate stddev_pop on columns */
  ['robot_product_designer_stddev_pop_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by stddev_pop() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_pop_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
    robot_reward?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** aggregate stddev_samp on columns */
  ['robot_product_designer_stddev_samp_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by stddev_samp() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_samp_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
    robot_reward?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** Streaming cursor of the table "robot_product_designer" */
  ['robot_product_designer_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ResolverInputTypes['robot_product_designer_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ResolverInputTypes['cursor_ordering'] | undefined | null;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_product_designer_stream_cursor_value_input']: {
    contribution_share?: ResolverInputTypes['numeric'] | undefined | null;
    designer_name?: string | undefined | null;
    eth_address?: string | undefined | null;
    product_id?: string | undefined | null;
    robot_reward?: ResolverInputTypes['numeric'] | undefined | null;
  };
  /** aggregate sum on columns */
  ['robot_product_designer_sum_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by sum() on columns of table "robot.product_designer" */
  ['robot_product_designer_sum_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
    robot_reward?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** update columns of table "robot.product_designer" */
  ['robot_product_designer_update_column']: robot_product_designer_update_column;
  ['robot_product_designer_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?:
      | ResolverInputTypes['robot_product_designer_inc_input']
      | undefined
      | null;
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ResolverInputTypes['robot_product_designer_set_input']
      | undefined
      | null;
    /** filter the rows which have to be updated */
    where: ResolverInputTypes['robot_product_designer_bool_exp'];
  };
  /** aggregate var_pop on columns */
  ['robot_product_designer_var_pop_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by var_pop() on columns of table "robot.product_designer" */
  ['robot_product_designer_var_pop_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
    robot_reward?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** aggregate var_samp on columns */
  ['robot_product_designer_var_samp_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by var_samp() on columns of table "robot.product_designer" */
  ['robot_product_designer_var_samp_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
    robot_reward?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** aggregate variance on columns */
  ['robot_product_designer_variance_fields']: AliasType<{
    contribution_share?: boolean | `@${string}`;
    robot_reward?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** order by variance() on columns of table "robot.product_designer" */
  ['robot_product_designer_variance_order_by']: {
    contribution_share?: ResolverInputTypes['order_by'] | undefined | null;
    robot_reward?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** input type for incrementing numeric columns in table "robot.product" */
  ['robot_product_inc_input']: {
    nft_token_id?: number | undefined | null;
  };
  /** input type for inserting data into table "robot.product" */
  ['robot_product_insert_input']: {
    designers?:
      | ResolverInputTypes['robot_product_designer_arr_rel_insert_input']
      | undefined
      | null;
    id?: string | undefined | null;
    nft_metadata?: ResolverInputTypes['jsonb'] | undefined | null;
    nft_token_id?: number | undefined | null;
    notion_id?: string | undefined | null;
    shopify_id?: string | undefined | null;
    title?: string | undefined | null;
  };
  /** aggregate max on columns */
  ['robot_product_max_fields']: AliasType<{
    id?: boolean | `@${string}`;
    nft_token_id?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    shopify_id?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate min on columns */
  ['robot_product_min_fields']: AliasType<{
    id?: boolean | `@${string}`;
    nft_token_id?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    shopify_id?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** response of any mutation on the table "robot.product" */
  ['robot_product_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ResolverInputTypes['robot_product'];
    __typename?: boolean | `@${string}`;
  }>;
  /** input type for inserting object relation for remote table "robot.product" */
  ['robot_product_obj_rel_insert_input']: {
    data: ResolverInputTypes['robot_product_insert_input'];
    /** upsert condition */
    on_conflict?:
      | ResolverInputTypes['robot_product_on_conflict']
      | undefined
      | null;
  };
  /** on_conflict condition type for table "robot.product" */
  ['robot_product_on_conflict']: {
    constraint: ResolverInputTypes['robot_product_constraint'];
    update_columns: Array<ResolverInputTypes['robot_product_update_column']>;
    where?: ResolverInputTypes['robot_product_bool_exp'] | undefined | null;
  };
  /** Ordering options when selecting data from "robot.product". */
  ['robot_product_order_by']: {
    designers_aggregate?:
      | ResolverInputTypes['robot_product_designer_aggregate_order_by']
      | undefined
      | null;
    id?: ResolverInputTypes['order_by'] | undefined | null;
    nft_metadata?: ResolverInputTypes['order_by'] | undefined | null;
    nft_token_id?: ResolverInputTypes['order_by'] | undefined | null;
    notion_id?: ResolverInputTypes['order_by'] | undefined | null;
    shopify_id?: ResolverInputTypes['order_by'] | undefined | null;
    title?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** primary key columns input for table: robot.product */
  ['robot_product_pk_columns_input']: {
    id: string;
  };
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  ['robot_product_prepend_input']: {
    nft_metadata?: ResolverInputTypes['jsonb'] | undefined | null;
  };
  /** select columns of table "robot.product" */
  ['robot_product_select_column']: robot_product_select_column;
  /** input type for updating data in table "robot.product" */
  ['robot_product_set_input']: {
    id?: string | undefined | null;
    nft_metadata?: ResolverInputTypes['jsonb'] | undefined | null;
    nft_token_id?: number | undefined | null;
    notion_id?: string | undefined | null;
    shopify_id?: string | undefined | null;
    title?: string | undefined | null;
  };
  /** aggregate stddev on columns */
  ['robot_product_stddev_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate stddev_pop on columns */
  ['robot_product_stddev_pop_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate stddev_samp on columns */
  ['robot_product_stddev_samp_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Streaming cursor of the table "robot_product" */
  ['robot_product_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ResolverInputTypes['robot_product_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ResolverInputTypes['cursor_ordering'] | undefined | null;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_product_stream_cursor_value_input']: {
    id?: string | undefined | null;
    nft_metadata?: ResolverInputTypes['jsonb'] | undefined | null;
    nft_token_id?: number | undefined | null;
    notion_id?: string | undefined | null;
    shopify_id?: string | undefined | null;
    title?: string | undefined | null;
  };
  /** aggregate sum on columns */
  ['robot_product_sum_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** update columns of table "robot.product" */
  ['robot_product_update_column']: robot_product_update_column;
  ['robot_product_updates']: {
    /** append existing jsonb value of filtered columns with new jsonb value */
    _append?:
      | ResolverInputTypes['robot_product_append_input']
      | undefined
      | null;
    /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
    _delete_at_path?:
      | ResolverInputTypes['robot_product_delete_at_path_input']
      | undefined
      | null;
    /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
    _delete_elem?:
      | ResolverInputTypes['robot_product_delete_elem_input']
      | undefined
      | null;
    /** delete key/value pair or string element. key/value pairs are matched based on their key value */
    _delete_key?:
      | ResolverInputTypes['robot_product_delete_key_input']
      | undefined
      | null;
    /** increments the numeric columns with given value of the filtered values */
    _inc?: ResolverInputTypes['robot_product_inc_input'] | undefined | null;
    /** prepend existing jsonb value of filtered columns with new jsonb value */
    _prepend?:
      | ResolverInputTypes['robot_product_prepend_input']
      | undefined
      | null;
    /** sets the columns of the filtered rows to the given values */
    _set?: ResolverInputTypes['robot_product_set_input'] | undefined | null;
    /** filter the rows which have to be updated */
    where: ResolverInputTypes['robot_product_bool_exp'];
  };
  /** aggregate var_pop on columns */
  ['robot_product_var_pop_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate var_samp on columns */
  ['robot_product_var_samp_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate variance on columns */
  ['robot_product_variance_fields']: AliasType<{
    nft_token_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** columns and relationships of "shop.api_users" */
  ['shop_api_users']: AliasType<{
    password_hash?: boolean | `@${string}`;
    username?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "shop.api_users" */
  ['shop_api_users_aggregate']: AliasType<{
    aggregate?: ResolverInputTypes['shop_api_users_aggregate_fields'];
    nodes?: ResolverInputTypes['shop_api_users'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate fields of "shop.api_users" */
  ['shop_api_users_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?:
          | Array<ResolverInputTypes['shop_api_users_select_column']>
          | undefined
          | null;
        distinct?: boolean | undefined | null;
      },
      boolean | `@${string}`,
    ];
    max?: ResolverInputTypes['shop_api_users_max_fields'];
    min?: ResolverInputTypes['shop_api_users_min_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** Boolean expression to filter rows from the table "shop.api_users". All fields are combined with a logical 'AND'. */
  ['shop_api_users_bool_exp']: {
    _and?:
      | Array<ResolverInputTypes['shop_api_users_bool_exp']>
      | undefined
      | null;
    _not?: ResolverInputTypes['shop_api_users_bool_exp'] | undefined | null;
    _or?:
      | Array<ResolverInputTypes['shop_api_users_bool_exp']>
      | undefined
      | null;
    password_hash?:
      | ResolverInputTypes['String_comparison_exp']
      | undefined
      | null;
    username?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
  };
  /** unique or primary key constraints on table "shop.api_users" */
  ['shop_api_users_constraint']: shop_api_users_constraint;
  /** input type for inserting data into table "shop.api_users" */
  ['shop_api_users_insert_input']: {
    password_hash?: string | undefined | null;
    username?: string | undefined | null;
  };
  /** aggregate max on columns */
  ['shop_api_users_max_fields']: AliasType<{
    password_hash?: boolean | `@${string}`;
    username?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate min on columns */
  ['shop_api_users_min_fields']: AliasType<{
    password_hash?: boolean | `@${string}`;
    username?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** response of any mutation on the table "shop.api_users" */
  ['shop_api_users_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ResolverInputTypes['shop_api_users'];
    __typename?: boolean | `@${string}`;
  }>;
  /** on_conflict condition type for table "shop.api_users" */
  ['shop_api_users_on_conflict']: {
    constraint: ResolverInputTypes['shop_api_users_constraint'];
    update_columns: Array<ResolverInputTypes['shop_api_users_update_column']>;
    where?: ResolverInputTypes['shop_api_users_bool_exp'] | undefined | null;
  };
  /** Ordering options when selecting data from "shop.api_users". */
  ['shop_api_users_order_by']: {
    password_hash?: ResolverInputTypes['order_by'] | undefined | null;
    username?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** primary key columns input for table: shop.api_users */
  ['shop_api_users_pk_columns_input']: {
    username: string;
  };
  /** select columns of table "shop.api_users" */
  ['shop_api_users_select_column']: shop_api_users_select_column;
  /** input type for updating data in table "shop.api_users" */
  ['shop_api_users_set_input']: {
    password_hash?: string | undefined | null;
    username?: string | undefined | null;
  };
  /** Streaming cursor of the table "shop_api_users" */
  ['shop_api_users_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ResolverInputTypes['shop_api_users_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ResolverInputTypes['cursor_ordering'] | undefined | null;
  };
  /** Initial value of the column from where the streaming should start */
  ['shop_api_users_stream_cursor_value_input']: {
    password_hash?: string | undefined | null;
    username?: string | undefined | null;
  };
  /** update columns of table "shop.api_users" */
  ['shop_api_users_update_column']: shop_api_users_update_column;
  ['shop_api_users_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?: ResolverInputTypes['shop_api_users_set_input'] | undefined | null;
    /** filter the rows which have to be updated */
    where: ResolverInputTypes['shop_api_users_bool_exp'];
  };
  /** columns and relationships of "shop.product_locks" */
  ['shop_product_locks']: AliasType<{
    access_code?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    customer_eth_address?: boolean | `@${string}`;
    lock_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "shop.product_locks" */
  ['shop_product_locks_aggregate']: AliasType<{
    aggregate?: ResolverInputTypes['shop_product_locks_aggregate_fields'];
    nodes?: ResolverInputTypes['shop_product_locks'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate fields of "shop.product_locks" */
  ['shop_product_locks_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?:
          | Array<ResolverInputTypes['shop_product_locks_select_column']>
          | undefined
          | null;
        distinct?: boolean | undefined | null;
      },
      boolean | `@${string}`,
    ];
    max?: ResolverInputTypes['shop_product_locks_max_fields'];
    min?: ResolverInputTypes['shop_product_locks_min_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** Boolean expression to filter rows from the table "shop.product_locks". All fields are combined with a logical 'AND'. */
  ['shop_product_locks_bool_exp']: {
    _and?:
      | Array<ResolverInputTypes['shop_product_locks_bool_exp']>
      | undefined
      | null;
    _not?: ResolverInputTypes['shop_product_locks_bool_exp'] | undefined | null;
    _or?:
      | Array<ResolverInputTypes['shop_product_locks_bool_exp']>
      | undefined
      | null;
    access_code?:
      | ResolverInputTypes['String_comparison_exp']
      | undefined
      | null;
    created_at?:
      | ResolverInputTypes['timestamptz_comparison_exp']
      | undefined
      | null;
    customer_eth_address?:
      | ResolverInputTypes['String_comparison_exp']
      | undefined
      | null;
    lock_id?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
  };
  /** unique or primary key constraints on table "shop.product_locks" */
  ['shop_product_locks_constraint']: shop_product_locks_constraint;
  /** input type for inserting data into table "shop.product_locks" */
  ['shop_product_locks_insert_input']: {
    access_code?: string | undefined | null;
    created_at?: ResolverInputTypes['timestamptz'] | undefined | null;
    customer_eth_address?: string | undefined | null;
    lock_id?: string | undefined | null;
  };
  /** aggregate max on columns */
  ['shop_product_locks_max_fields']: AliasType<{
    access_code?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    customer_eth_address?: boolean | `@${string}`;
    lock_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate min on columns */
  ['shop_product_locks_min_fields']: AliasType<{
    access_code?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    customer_eth_address?: boolean | `@${string}`;
    lock_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** response of any mutation on the table "shop.product_locks" */
  ['shop_product_locks_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ResolverInputTypes['shop_product_locks'];
    __typename?: boolean | `@${string}`;
  }>;
  /** on_conflict condition type for table "shop.product_locks" */
  ['shop_product_locks_on_conflict']: {
    constraint: ResolverInputTypes['shop_product_locks_constraint'];
    update_columns: Array<
      ResolverInputTypes['shop_product_locks_update_column']
    >;
    where?:
      | ResolverInputTypes['shop_product_locks_bool_exp']
      | undefined
      | null;
  };
  /** Ordering options when selecting data from "shop.product_locks". */
  ['shop_product_locks_order_by']: {
    access_code?: ResolverInputTypes['order_by'] | undefined | null;
    created_at?: ResolverInputTypes['order_by'] | undefined | null;
    customer_eth_address?: ResolverInputTypes['order_by'] | undefined | null;
    lock_id?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** primary key columns input for table: shop.product_locks */
  ['shop_product_locks_pk_columns_input']: {
    access_code: string;
    lock_id: string;
  };
  /** select columns of table "shop.product_locks" */
  ['shop_product_locks_select_column']: shop_product_locks_select_column;
  /** input type for updating data in table "shop.product_locks" */
  ['shop_product_locks_set_input']: {
    access_code?: string | undefined | null;
    created_at?: ResolverInputTypes['timestamptz'] | undefined | null;
    customer_eth_address?: string | undefined | null;
    lock_id?: string | undefined | null;
  };
  /** Streaming cursor of the table "shop_product_locks" */
  ['shop_product_locks_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ResolverInputTypes['shop_product_locks_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ResolverInputTypes['cursor_ordering'] | undefined | null;
  };
  /** Initial value of the column from where the streaming should start */
  ['shop_product_locks_stream_cursor_value_input']: {
    access_code?: string | undefined | null;
    created_at?: ResolverInputTypes['timestamptz'] | undefined | null;
    customer_eth_address?: string | undefined | null;
    lock_id?: string | undefined | null;
  };
  /** update columns of table "shop.product_locks" */
  ['shop_product_locks_update_column']: shop_product_locks_update_column;
  ['shop_product_locks_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?:
      | ResolverInputTypes['shop_product_locks_set_input']
      | undefined
      | null;
    /** filter the rows which have to be updated */
    where: ResolverInputTypes['shop_product_locks_bool_exp'];
  };
  ['subscription_root']: AliasType<{
    contribution_votes?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contribution_votes_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contribution_votes_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['contribution_votes_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['contribution_votes'],
    ];
    contribution_votes_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contribution_votes_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contribution_votes_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['contribution_votes_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['contribution_votes_aggregate'],
    ];
    contribution_votes_by_pk?: [
      {
        contribution_id: ResolverInputTypes['uuid'];
        user_id: ResolverInputTypes['uuid'];
      },
      ResolverInputTypes['contribution_votes'],
    ];
    contribution_votes_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size: number /** cursor to stream the results returned by the query */;
        cursor: Array<
          | ResolverInputTypes['contribution_votes_stream_cursor_input']
          | undefined
          | null
        > /** filter the rows returned */;
        where?:
          | ResolverInputTypes['contribution_votes_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['contribution_votes'],
    ];
    contributions?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contributions_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contributions_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['contributions_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['contributions'],
    ];
    contributions_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contributions_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contributions_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['contributions_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['contributions_aggregate'],
    ];
    contributions_by_pk?: [
      { id: ResolverInputTypes['uuid'] },
      ResolverInputTypes['contributions'],
    ];
    contributions_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size: number /** cursor to stream the results returned by the query */;
        cursor: Array<
          | ResolverInputTypes['contributions_stream_cursor_input']
          | undefined
          | null
        > /** filter the rows returned */;
        where?: ResolverInputTypes['contributions_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['contributions'],
    ];
    contributors?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contributors_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contributors_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['contributors_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['contributors'],
    ];
    contributors_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['contributors_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['contributors_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['contributors_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['contributors_aggregate'],
    ];
    contributors_by_pk?: [
      {
        contribution_id: ResolverInputTypes['uuid'];
        user_id: ResolverInputTypes['uuid'];
      },
      ResolverInputTypes['contributors'],
    ];
    contributors_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size: number /** cursor to stream the results returned by the query */;
        cursor: Array<
          | ResolverInputTypes['contributors_stream_cursor_input']
          | undefined
          | null
        > /** filter the rows returned */;
        where?: ResolverInputTypes['contributors_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['contributors'],
    ];
    robot_merkle_claims?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_merkle_claims_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_merkle_claims_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_merkle_claims_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_claims'],
    ];
    robot_merkle_claims_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_merkle_claims_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_merkle_claims_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_merkle_claims_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_claims_aggregate'],
    ];
    robot_merkle_claims_by_pk?: [
      { id: ResolverInputTypes['uuid'] },
      ResolverInputTypes['robot_merkle_claims'],
    ];
    robot_merkle_claims_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size: number /** cursor to stream the results returned by the query */;
        cursor: Array<
          | ResolverInputTypes['robot_merkle_claims_stream_cursor_input']
          | undefined
          | null
        > /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_merkle_claims_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_claims'],
    ];
    robot_merkle_roots?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_merkle_roots_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_merkle_roots_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_merkle_roots_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_roots'],
    ];
    robot_merkle_roots_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_merkle_roots_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_merkle_roots_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_merkle_roots_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_roots_aggregate'],
    ];
    robot_merkle_roots_by_pk?: [
      { hash: string },
      ResolverInputTypes['robot_merkle_roots'],
    ];
    robot_merkle_roots_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size: number /** cursor to stream the results returned by the query */;
        cursor: Array<
          | ResolverInputTypes['robot_merkle_roots_stream_cursor_input']
          | undefined
          | null
        > /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_merkle_roots_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_merkle_roots'],
    ];
    robot_order?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_order_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_order_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['robot_order_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['robot_order'],
    ];
    robot_order_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_order_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_order_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['robot_order_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['robot_order_aggregate'],
    ];
    robot_order_by_pk?: [
      { order_id: string },
      ResolverInputTypes['robot_order'],
    ];
    robot_order_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size: number /** cursor to stream the results returned by the query */;
        cursor: Array<
          | ResolverInputTypes['robot_order_stream_cursor_input']
          | undefined
          | null
        > /** filter the rows returned */;
        where?: ResolverInputTypes['robot_order_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['robot_order'],
    ];
    robot_product?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_product_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_product_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['robot_product_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['robot_product'],
    ];
    robot_product_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_product_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_product_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['robot_product_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['robot_product_aggregate'],
    ];
    robot_product_by_pk?: [{ id: string }, ResolverInputTypes['robot_product']];
    robot_product_designer?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_product_designer_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_product_designer_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_product_designer_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_product_designer'],
    ];
    robot_product_designer_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['robot_product_designer_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['robot_product_designer_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_product_designer_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_product_designer_aggregate'],
    ];
    robot_product_designer_by_pk?: [
      { eth_address: string; product_id: string },
      ResolverInputTypes['robot_product_designer'],
    ];
    robot_product_designer_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size: number /** cursor to stream the results returned by the query */;
        cursor: Array<
          | ResolverInputTypes['robot_product_designer_stream_cursor_input']
          | undefined
          | null
        > /** filter the rows returned */;
        where?:
          | ResolverInputTypes['robot_product_designer_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['robot_product_designer'],
    ];
    robot_product_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size: number /** cursor to stream the results returned by the query */;
        cursor: Array<
          | ResolverInputTypes['robot_product_stream_cursor_input']
          | undefined
          | null
        > /** filter the rows returned */;
        where?: ResolverInputTypes['robot_product_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['robot_product'],
    ];
    shop_api_users?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['shop_api_users_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['shop_api_users_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['shop_api_users_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['shop_api_users'],
    ];
    shop_api_users_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['shop_api_users_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['shop_api_users_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['shop_api_users_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['shop_api_users_aggregate'],
    ];
    shop_api_users_by_pk?: [
      { username: string },
      ResolverInputTypes['shop_api_users'],
    ];
    shop_api_users_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size: number /** cursor to stream the results returned by the query */;
        cursor: Array<
          | ResolverInputTypes['shop_api_users_stream_cursor_input']
          | undefined
          | null
        > /** filter the rows returned */;
        where?:
          | ResolverInputTypes['shop_api_users_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['shop_api_users'],
    ];
    shop_product_locks?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['shop_product_locks_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['shop_product_locks_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['shop_product_locks_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['shop_product_locks'],
    ];
    shop_product_locks_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['shop_product_locks_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['shop_product_locks_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?:
          | ResolverInputTypes['shop_product_locks_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['shop_product_locks_aggregate'],
    ];
    shop_product_locks_by_pk?: [
      { access_code: string; lock_id: string },
      ResolverInputTypes['shop_product_locks'],
    ];
    shop_product_locks_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size: number /** cursor to stream the results returned by the query */;
        cursor: Array<
          | ResolverInputTypes['shop_product_locks_stream_cursor_input']
          | undefined
          | null
        > /** filter the rows returned */;
        where?:
          | ResolverInputTypes['shop_product_locks_bool_exp']
          | undefined
          | null;
      },
      ResolverInputTypes['shop_product_locks'],
    ];
    users?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['users_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['users_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['users_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['users'],
    ];
    users_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?:
          | Array<ResolverInputTypes['users_select_column']>
          | undefined
          | null /** limit the number of rows returned */;
        limit?:
          | number
          | undefined
          | null /** skip the first n rows. Use only with order_by */;
        offset?:
          | number
          | undefined
          | null /** sort the rows by one or more columns */;
        order_by?:
          | Array<ResolverInputTypes['users_order_by']>
          | undefined
          | null /** filter the rows returned */;
        where?: ResolverInputTypes['users_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['users_aggregate'],
    ];
    users_by_pk?: [
      { id: ResolverInputTypes['uuid'] },
      ResolverInputTypes['users'],
    ];
    users_stream?: [
      {
        /** maximum number of rows returned in a single batch */
        batch_size: number /** cursor to stream the results returned by the query */;
        cursor: Array<
          ResolverInputTypes['users_stream_cursor_input'] | undefined | null
        > /** filter the rows returned */;
        where?: ResolverInputTypes['users_bool_exp'] | undefined | null;
      },
      ResolverInputTypes['users'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['timestamptz']: unknown;
  /** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
  ['timestamptz_comparison_exp']: {
    _eq?: ResolverInputTypes['timestamptz'] | undefined | null;
    _gt?: ResolverInputTypes['timestamptz'] | undefined | null;
    _gte?: ResolverInputTypes['timestamptz'] | undefined | null;
    _in?: Array<ResolverInputTypes['timestamptz']> | undefined | null;
    _is_null?: boolean | undefined | null;
    _lt?: ResolverInputTypes['timestamptz'] | undefined | null;
    _lte?: ResolverInputTypes['timestamptz'] | undefined | null;
    _neq?: ResolverInputTypes['timestamptz'] | undefined | null;
    _nin?: Array<ResolverInputTypes['timestamptz']> | undefined | null;
  };
  /** columns and relationships of "users" */
  ['users']: AliasType<{
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregated selection of "users" */
  ['users_aggregate']: AliasType<{
    aggregate?: ResolverInputTypes['users_aggregate_fields'];
    nodes?: ResolverInputTypes['users'];
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate fields of "users" */
  ['users_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?:
          | Array<ResolverInputTypes['users_select_column']>
          | undefined
          | null;
        distinct?: boolean | undefined | null;
      },
      boolean | `@${string}`,
    ];
    max?: ResolverInputTypes['users_max_fields'];
    min?: ResolverInputTypes['users_min_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  /** Boolean expression to filter rows from the table "users". All fields are combined with a logical 'AND'. */
  ['users_bool_exp']: {
    _and?: Array<ResolverInputTypes['users_bool_exp']> | undefined | null;
    _not?: ResolverInputTypes['users_bool_exp'] | undefined | null;
    _or?: Array<ResolverInputTypes['users_bool_exp']> | undefined | null;
    eth_address?:
      | ResolverInputTypes['String_comparison_exp']
      | undefined
      | null;
    id?: ResolverInputTypes['uuid_comparison_exp'] | undefined | null;
    name?: ResolverInputTypes['String_comparison_exp'] | undefined | null;
  };
  /** unique or primary key constraints on table "users" */
  ['users_constraint']: users_constraint;
  /** input type for inserting data into table "users" */
  ['users_insert_input']: {
    eth_address?: string | undefined | null;
    id?: ResolverInputTypes['uuid'] | undefined | null;
    name?: string | undefined | null;
  };
  /** aggregate max on columns */
  ['users_max_fields']: AliasType<{
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** aggregate min on columns */
  ['users_min_fields']: AliasType<{
    eth_address?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** response of any mutation on the table "users" */
  ['users_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean | `@${string}`;
    /** data from the rows affected by the mutation */
    returning?: ResolverInputTypes['users'];
    __typename?: boolean | `@${string}`;
  }>;
  /** input type for inserting object relation for remote table "users" */
  ['users_obj_rel_insert_input']: {
    data: ResolverInputTypes['users_insert_input'];
    /** upsert condition */
    on_conflict?: ResolverInputTypes['users_on_conflict'] | undefined | null;
  };
  /** on_conflict condition type for table "users" */
  ['users_on_conflict']: {
    constraint: ResolverInputTypes['users_constraint'];
    update_columns: Array<ResolverInputTypes['users_update_column']>;
    where?: ResolverInputTypes['users_bool_exp'] | undefined | null;
  };
  /** Ordering options when selecting data from "users". */
  ['users_order_by']: {
    eth_address?: ResolverInputTypes['order_by'] | undefined | null;
    id?: ResolverInputTypes['order_by'] | undefined | null;
    name?: ResolverInputTypes['order_by'] | undefined | null;
  };
  /** primary key columns input for table: users */
  ['users_pk_columns_input']: {
    id: ResolverInputTypes['uuid'];
  };
  /** select columns of table "users" */
  ['users_select_column']: users_select_column;
  /** input type for updating data in table "users" */
  ['users_set_input']: {
    eth_address?: string | undefined | null;
    id?: ResolverInputTypes['uuid'] | undefined | null;
    name?: string | undefined | null;
  };
  /** Streaming cursor of the table "users" */
  ['users_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ResolverInputTypes['users_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ResolverInputTypes['cursor_ordering'] | undefined | null;
  };
  /** Initial value of the column from where the streaming should start */
  ['users_stream_cursor_value_input']: {
    eth_address?: string | undefined | null;
    id?: ResolverInputTypes['uuid'] | undefined | null;
    name?: string | undefined | null;
  };
  /** update columns of table "users" */
  ['users_update_column']: users_update_column;
  ['users_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?: ResolverInputTypes['users_set_input'] | undefined | null;
    /** filter the rows which have to be updated */
    where: ResolverInputTypes['users_bool_exp'];
  };
  ['uuid']: unknown;
  /** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
  ['uuid_comparison_exp']: {
    _eq?: ResolverInputTypes['uuid'] | undefined | null;
    _gt?: ResolverInputTypes['uuid'] | undefined | null;
    _gte?: ResolverInputTypes['uuid'] | undefined | null;
    _in?: Array<ResolverInputTypes['uuid']> | undefined | null;
    _is_null?: boolean | undefined | null;
    _lt?: ResolverInputTypes['uuid'] | undefined | null;
    _lte?: ResolverInputTypes['uuid'] | undefined | null;
    _neq?: ResolverInputTypes['uuid'] | undefined | null;
    _nin?: Array<ResolverInputTypes['uuid']> | undefined | null;
  };
};

export type ModelTypes = {
  /** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
  ['Int_comparison_exp']: {
    _eq?: number | undefined;
    _gt?: number | undefined;
    _gte?: number | undefined;
    _in?: Array<number> | undefined;
    _is_null?: boolean | undefined;
    _lt?: number | undefined;
    _lte?: number | undefined;
    _neq?: number | undefined;
    _nin?: Array<number> | undefined;
  };
  /** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
  ['String_comparison_exp']: {
    _eq?: string | undefined;
    _gt?: string | undefined;
    _gte?: string | undefined;
    /** does the column match the given case-insensitive pattern */
    _ilike?: string | undefined;
    _in?: Array<string> | undefined;
    /** does the column match the given POSIX regular expression, case insensitive */
    _iregex?: string | undefined;
    _is_null?: boolean | undefined;
    /** does the column match the given pattern */
    _like?: string | undefined;
    _lt?: string | undefined;
    _lte?: string | undefined;
    _neq?: string | undefined;
    /** does the column NOT match the given case-insensitive pattern */
    _nilike?: string | undefined;
    _nin?: Array<string> | undefined;
    /** does the column NOT match the given POSIX regular expression, case insensitive */
    _niregex?: string | undefined;
    /** does the column NOT match the given pattern */
    _nlike?: string | undefined;
    /** does the column NOT match the given POSIX regular expression, case sensitive */
    _nregex?: string | undefined;
    /** does the column NOT match the given SQL regular expression */
    _nsimilar?: string | undefined;
    /** does the column match the given POSIX regular expression, case sensitive */
    _regex?: string | undefined;
    /** does the column match the given SQL regular expression */
    _similar?: string | undefined;
  };
  /** columns and relationships of "contribution_votes" */
  ['contribution_votes']: {
    /** An object relationship */
    contribution: ModelTypes['contributions'];
    contribution_id: ModelTypes['uuid'];
    rating: string;
    /** An object relationship */
    user: ModelTypes['users'];
    user_id: ModelTypes['uuid'];
  };
  /** aggregated selection of "contribution_votes" */
  ['contribution_votes_aggregate']: {
    aggregate?: ModelTypes['contribution_votes_aggregate_fields'] | undefined;
    nodes: Array<ModelTypes['contribution_votes']>;
  };
  ['contribution_votes_aggregate_bool_exp']: {
    count?:
      | ModelTypes['contribution_votes_aggregate_bool_exp_count']
      | undefined;
  };
  ['contribution_votes_aggregate_bool_exp_count']: {
    arguments?:
      | Array<ModelTypes['contribution_votes_select_column']>
      | undefined;
    distinct?: boolean | undefined;
    filter?: ModelTypes['contribution_votes_bool_exp'] | undefined;
    predicate: ModelTypes['Int_comparison_exp'];
  };
  /** aggregate fields of "contribution_votes" */
  ['contribution_votes_aggregate_fields']: {
    count: number;
    max?: ModelTypes['contribution_votes_max_fields'] | undefined;
    min?: ModelTypes['contribution_votes_min_fields'] | undefined;
  };
  /** order by aggregate values of table "contribution_votes" */
  ['contribution_votes_aggregate_order_by']: {
    count?: ModelTypes['order_by'] | undefined;
    max?: ModelTypes['contribution_votes_max_order_by'] | undefined;
    min?: ModelTypes['contribution_votes_min_order_by'] | undefined;
  };
  /** input type for inserting array relation for remote table "contribution_votes" */
  ['contribution_votes_arr_rel_insert_input']: {
    data: Array<ModelTypes['contribution_votes_insert_input']>;
    /** upsert condition */
    on_conflict?: ModelTypes['contribution_votes_on_conflict'] | undefined;
  };
  /** Boolean expression to filter rows from the table "contribution_votes". All fields are combined with a logical 'AND'. */
  ['contribution_votes_bool_exp']: {
    _and?: Array<ModelTypes['contribution_votes_bool_exp']> | undefined;
    _not?: ModelTypes['contribution_votes_bool_exp'] | undefined;
    _or?: Array<ModelTypes['contribution_votes_bool_exp']> | undefined;
    contribution?: ModelTypes['contributions_bool_exp'] | undefined;
    contribution_id?: ModelTypes['uuid_comparison_exp'] | undefined;
    rating?: ModelTypes['String_comparison_exp'] | undefined;
    user?: ModelTypes['users_bool_exp'] | undefined;
    user_id?: ModelTypes['uuid_comparison_exp'] | undefined;
  };
  ['contribution_votes_constraint']: contribution_votes_constraint;
  /** input type for inserting data into table "contribution_votes" */
  ['contribution_votes_insert_input']: {
    contribution?: ModelTypes['contributions_obj_rel_insert_input'] | undefined;
    contribution_id?: ModelTypes['uuid'] | undefined;
    rating?: string | undefined;
    user?: ModelTypes['users_obj_rel_insert_input'] | undefined;
    user_id?: ModelTypes['uuid'] | undefined;
  };
  /** aggregate max on columns */
  ['contribution_votes_max_fields']: {
    contribution_id?: ModelTypes['uuid'] | undefined;
    rating?: string | undefined;
    user_id?: ModelTypes['uuid'] | undefined;
  };
  /** order by max() on columns of table "contribution_votes" */
  ['contribution_votes_max_order_by']: {
    contribution_id?: ModelTypes['order_by'] | undefined;
    rating?: ModelTypes['order_by'] | undefined;
    user_id?: ModelTypes['order_by'] | undefined;
  };
  /** aggregate min on columns */
  ['contribution_votes_min_fields']: {
    contribution_id?: ModelTypes['uuid'] | undefined;
    rating?: string | undefined;
    user_id?: ModelTypes['uuid'] | undefined;
  };
  /** order by min() on columns of table "contribution_votes" */
  ['contribution_votes_min_order_by']: {
    contribution_id?: ModelTypes['order_by'] | undefined;
    rating?: ModelTypes['order_by'] | undefined;
    user_id?: ModelTypes['order_by'] | undefined;
  };
  /** response of any mutation on the table "contribution_votes" */
  ['contribution_votes_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<ModelTypes['contribution_votes']>;
  };
  /** on_conflict condition type for table "contribution_votes" */
  ['contribution_votes_on_conflict']: {
    constraint: ModelTypes['contribution_votes_constraint'];
    update_columns: Array<ModelTypes['contribution_votes_update_column']>;
    where?: ModelTypes['contribution_votes_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "contribution_votes". */
  ['contribution_votes_order_by']: {
    contribution?: ModelTypes['contributions_order_by'] | undefined;
    contribution_id?: ModelTypes['order_by'] | undefined;
    rating?: ModelTypes['order_by'] | undefined;
    user?: ModelTypes['users_order_by'] | undefined;
    user_id?: ModelTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: contribution_votes */
  ['contribution_votes_pk_columns_input']: {
    contribution_id: ModelTypes['uuid'];
    user_id: ModelTypes['uuid'];
  };
  ['contribution_votes_select_column']: contribution_votes_select_column;
  /** input type for updating data in table "contribution_votes" */
  ['contribution_votes_set_input']: {
    contribution_id?: ModelTypes['uuid'] | undefined;
    rating?: string | undefined;
    user_id?: ModelTypes['uuid'] | undefined;
  };
  /** Streaming cursor of the table "contribution_votes" */
  ['contribution_votes_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ModelTypes['contribution_votes_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ModelTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['contribution_votes_stream_cursor_value_input']: {
    contribution_id?: ModelTypes['uuid'] | undefined;
    rating?: string | undefined;
    user_id?: ModelTypes['uuid'] | undefined;
  };
  ['contribution_votes_update_column']: contribution_votes_update_column;
  ['contribution_votes_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?: ModelTypes['contribution_votes_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: ModelTypes['contribution_votes_bool_exp'];
  };
  /** columns and relationships of "contributions" */
  ['contributions']: {
    artifact?: string | undefined;
    /** An object relationship */
    author: ModelTypes['users'];
    category?: string | undefined;
    /** An array relationship */
    contributors: Array<ModelTypes['contributors']>;
    /** An aggregate relationship */
    contributors_aggregate: ModelTypes['contributors_aggregate'];
    created_at: ModelTypes['timestamptz'];
    created_by: ModelTypes['uuid'];
    date: ModelTypes['date'];
    description?: string | undefined;
    effort?: string | undefined;
    id: ModelTypes['uuid'];
    impact?: string | undefined;
    title: string;
    /** An array relationship */
    votes: Array<ModelTypes['contribution_votes']>;
    /** An aggregate relationship */
    votes_aggregate: ModelTypes['contribution_votes_aggregate'];
    weight?: number | undefined;
  };
  /** aggregated selection of "contributions" */
  ['contributions_aggregate']: {
    aggregate?: ModelTypes['contributions_aggregate_fields'] | undefined;
    nodes: Array<ModelTypes['contributions']>;
  };
  /** aggregate fields of "contributions" */
  ['contributions_aggregate_fields']: {
    avg?: ModelTypes['contributions_avg_fields'] | undefined;
    count: number;
    max?: ModelTypes['contributions_max_fields'] | undefined;
    min?: ModelTypes['contributions_min_fields'] | undefined;
    stddev?: ModelTypes['contributions_stddev_fields'] | undefined;
    stddev_pop?: ModelTypes['contributions_stddev_pop_fields'] | undefined;
    stddev_samp?: ModelTypes['contributions_stddev_samp_fields'] | undefined;
    sum?: ModelTypes['contributions_sum_fields'] | undefined;
    var_pop?: ModelTypes['contributions_var_pop_fields'] | undefined;
    var_samp?: ModelTypes['contributions_var_samp_fields'] | undefined;
    variance?: ModelTypes['contributions_variance_fields'] | undefined;
  };
  /** aggregate avg on columns */
  ['contributions_avg_fields']: {
    weight?: number | undefined;
  };
  /** Boolean expression to filter rows from the table "contributions". All fields are combined with a logical 'AND'. */
  ['contributions_bool_exp']: {
    _and?: Array<ModelTypes['contributions_bool_exp']> | undefined;
    _not?: ModelTypes['contributions_bool_exp'] | undefined;
    _or?: Array<ModelTypes['contributions_bool_exp']> | undefined;
    artifact?: ModelTypes['String_comparison_exp'] | undefined;
    author?: ModelTypes['users_bool_exp'] | undefined;
    category?: ModelTypes['String_comparison_exp'] | undefined;
    contributors?: ModelTypes['contributors_bool_exp'] | undefined;
    contributors_aggregate?:
      | ModelTypes['contributors_aggregate_bool_exp']
      | undefined;
    created_at?: ModelTypes['timestamptz_comparison_exp'] | undefined;
    created_by?: ModelTypes['uuid_comparison_exp'] | undefined;
    date?: ModelTypes['date_comparison_exp'] | undefined;
    description?: ModelTypes['String_comparison_exp'] | undefined;
    effort?: ModelTypes['String_comparison_exp'] | undefined;
    id?: ModelTypes['uuid_comparison_exp'] | undefined;
    impact?: ModelTypes['String_comparison_exp'] | undefined;
    title?: ModelTypes['String_comparison_exp'] | undefined;
    votes?: ModelTypes['contribution_votes_bool_exp'] | undefined;
    votes_aggregate?:
      | ModelTypes['contribution_votes_aggregate_bool_exp']
      | undefined;
    weight?: ModelTypes['Int_comparison_exp'] | undefined;
  };
  ['contributions_constraint']: contributions_constraint;
  /** input type for incrementing numeric columns in table "contributions" */
  ['contributions_inc_input']: {
    weight?: number | undefined;
  };
  /** input type for inserting data into table "contributions" */
  ['contributions_insert_input']: {
    artifact?: string | undefined;
    author?: ModelTypes['users_obj_rel_insert_input'] | undefined;
    category?: string | undefined;
    contributors?: ModelTypes['contributors_arr_rel_insert_input'] | undefined;
    created_at?: ModelTypes['timestamptz'] | undefined;
    created_by?: ModelTypes['uuid'] | undefined;
    date?: ModelTypes['date'] | undefined;
    description?: string | undefined;
    effort?: string | undefined;
    id?: ModelTypes['uuid'] | undefined;
    impact?: string | undefined;
    title?: string | undefined;
    votes?: ModelTypes['contribution_votes_arr_rel_insert_input'] | undefined;
    weight?: number | undefined;
  };
  /** aggregate max on columns */
  ['contributions_max_fields']: {
    artifact?: string | undefined;
    category?: string | undefined;
    created_at?: ModelTypes['timestamptz'] | undefined;
    created_by?: ModelTypes['uuid'] | undefined;
    date?: ModelTypes['date'] | undefined;
    description?: string | undefined;
    effort?: string | undefined;
    id?: ModelTypes['uuid'] | undefined;
    impact?: string | undefined;
    title?: string | undefined;
    weight?: number | undefined;
  };
  /** aggregate min on columns */
  ['contributions_min_fields']: {
    artifact?: string | undefined;
    category?: string | undefined;
    created_at?: ModelTypes['timestamptz'] | undefined;
    created_by?: ModelTypes['uuid'] | undefined;
    date?: ModelTypes['date'] | undefined;
    description?: string | undefined;
    effort?: string | undefined;
    id?: ModelTypes['uuid'] | undefined;
    impact?: string | undefined;
    title?: string | undefined;
    weight?: number | undefined;
  };
  /** response of any mutation on the table "contributions" */
  ['contributions_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<ModelTypes['contributions']>;
  };
  /** input type for inserting object relation for remote table "contributions" */
  ['contributions_obj_rel_insert_input']: {
    data: ModelTypes['contributions_insert_input'];
    /** upsert condition */
    on_conflict?: ModelTypes['contributions_on_conflict'] | undefined;
  };
  /** on_conflict condition type for table "contributions" */
  ['contributions_on_conflict']: {
    constraint: ModelTypes['contributions_constraint'];
    update_columns: Array<ModelTypes['contributions_update_column']>;
    where?: ModelTypes['contributions_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "contributions". */
  ['contributions_order_by']: {
    artifact?: ModelTypes['order_by'] | undefined;
    author?: ModelTypes['users_order_by'] | undefined;
    category?: ModelTypes['order_by'] | undefined;
    contributors_aggregate?:
      | ModelTypes['contributors_aggregate_order_by']
      | undefined;
    created_at?: ModelTypes['order_by'] | undefined;
    created_by?: ModelTypes['order_by'] | undefined;
    date?: ModelTypes['order_by'] | undefined;
    description?: ModelTypes['order_by'] | undefined;
    effort?: ModelTypes['order_by'] | undefined;
    id?: ModelTypes['order_by'] | undefined;
    impact?: ModelTypes['order_by'] | undefined;
    title?: ModelTypes['order_by'] | undefined;
    votes_aggregate?:
      | ModelTypes['contribution_votes_aggregate_order_by']
      | undefined;
    weight?: ModelTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: contributions */
  ['contributions_pk_columns_input']: {
    id: ModelTypes['uuid'];
  };
  ['contributions_select_column']: contributions_select_column;
  /** input type for updating data in table "contributions" */
  ['contributions_set_input']: {
    artifact?: string | undefined;
    category?: string | undefined;
    created_at?: ModelTypes['timestamptz'] | undefined;
    created_by?: ModelTypes['uuid'] | undefined;
    date?: ModelTypes['date'] | undefined;
    description?: string | undefined;
    effort?: string | undefined;
    id?: ModelTypes['uuid'] | undefined;
    impact?: string | undefined;
    title?: string | undefined;
    weight?: number | undefined;
  };
  /** aggregate stddev on columns */
  ['contributions_stddev_fields']: {
    weight?: number | undefined;
  };
  /** aggregate stddev_pop on columns */
  ['contributions_stddev_pop_fields']: {
    weight?: number | undefined;
  };
  /** aggregate stddev_samp on columns */
  ['contributions_stddev_samp_fields']: {
    weight?: number | undefined;
  };
  /** Streaming cursor of the table "contributions" */
  ['contributions_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ModelTypes['contributions_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ModelTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['contributions_stream_cursor_value_input']: {
    artifact?: string | undefined;
    category?: string | undefined;
    created_at?: ModelTypes['timestamptz'] | undefined;
    created_by?: ModelTypes['uuid'] | undefined;
    date?: ModelTypes['date'] | undefined;
    description?: string | undefined;
    effort?: string | undefined;
    id?: ModelTypes['uuid'] | undefined;
    impact?: string | undefined;
    title?: string | undefined;
    weight?: number | undefined;
  };
  /** aggregate sum on columns */
  ['contributions_sum_fields']: {
    weight?: number | undefined;
  };
  ['contributions_update_column']: contributions_update_column;
  ['contributions_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?: ModelTypes['contributions_inc_input'] | undefined;
    /** sets the columns of the filtered rows to the given values */
    _set?: ModelTypes['contributions_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: ModelTypes['contributions_bool_exp'];
  };
  /** aggregate var_pop on columns */
  ['contributions_var_pop_fields']: {
    weight?: number | undefined;
  };
  /** aggregate var_samp on columns */
  ['contributions_var_samp_fields']: {
    weight?: number | undefined;
  };
  /** aggregate variance on columns */
  ['contributions_variance_fields']: {
    weight?: number | undefined;
  };
  /** columns and relationships of "contributors" */
  ['contributors']: {
    /** An object relationship */
    contribution: ModelTypes['contributions'];
    contribution_id: ModelTypes['uuid'];
    contribution_share: ModelTypes['numeric'];
    /** An object relationship */
    user: ModelTypes['users'];
    user_id: ModelTypes['uuid'];
  };
  /** aggregated selection of "contributors" */
  ['contributors_aggregate']: {
    aggregate?: ModelTypes['contributors_aggregate_fields'] | undefined;
    nodes: Array<ModelTypes['contributors']>;
  };
  ['contributors_aggregate_bool_exp']: {
    count?: ModelTypes['contributors_aggregate_bool_exp_count'] | undefined;
  };
  ['contributors_aggregate_bool_exp_count']: {
    arguments?: Array<ModelTypes['contributors_select_column']> | undefined;
    distinct?: boolean | undefined;
    filter?: ModelTypes['contributors_bool_exp'] | undefined;
    predicate: ModelTypes['Int_comparison_exp'];
  };
  /** aggregate fields of "contributors" */
  ['contributors_aggregate_fields']: {
    avg?: ModelTypes['contributors_avg_fields'] | undefined;
    count: number;
    max?: ModelTypes['contributors_max_fields'] | undefined;
    min?: ModelTypes['contributors_min_fields'] | undefined;
    stddev?: ModelTypes['contributors_stddev_fields'] | undefined;
    stddev_pop?: ModelTypes['contributors_stddev_pop_fields'] | undefined;
    stddev_samp?: ModelTypes['contributors_stddev_samp_fields'] | undefined;
    sum?: ModelTypes['contributors_sum_fields'] | undefined;
    var_pop?: ModelTypes['contributors_var_pop_fields'] | undefined;
    var_samp?: ModelTypes['contributors_var_samp_fields'] | undefined;
    variance?: ModelTypes['contributors_variance_fields'] | undefined;
  };
  /** order by aggregate values of table "contributors" */
  ['contributors_aggregate_order_by']: {
    avg?: ModelTypes['contributors_avg_order_by'] | undefined;
    count?: ModelTypes['order_by'] | undefined;
    max?: ModelTypes['contributors_max_order_by'] | undefined;
    min?: ModelTypes['contributors_min_order_by'] | undefined;
    stddev?: ModelTypes['contributors_stddev_order_by'] | undefined;
    stddev_pop?: ModelTypes['contributors_stddev_pop_order_by'] | undefined;
    stddev_samp?: ModelTypes['contributors_stddev_samp_order_by'] | undefined;
    sum?: ModelTypes['contributors_sum_order_by'] | undefined;
    var_pop?: ModelTypes['contributors_var_pop_order_by'] | undefined;
    var_samp?: ModelTypes['contributors_var_samp_order_by'] | undefined;
    variance?: ModelTypes['contributors_variance_order_by'] | undefined;
  };
  /** input type for inserting array relation for remote table "contributors" */
  ['contributors_arr_rel_insert_input']: {
    data: Array<ModelTypes['contributors_insert_input']>;
    /** upsert condition */
    on_conflict?: ModelTypes['contributors_on_conflict'] | undefined;
  };
  /** aggregate avg on columns */
  ['contributors_avg_fields']: {
    contribution_share?: number | undefined;
  };
  /** order by avg() on columns of table "contributors" */
  ['contributors_avg_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
  };
  /** Boolean expression to filter rows from the table "contributors". All fields are combined with a logical 'AND'. */
  ['contributors_bool_exp']: {
    _and?: Array<ModelTypes['contributors_bool_exp']> | undefined;
    _not?: ModelTypes['contributors_bool_exp'] | undefined;
    _or?: Array<ModelTypes['contributors_bool_exp']> | undefined;
    contribution?: ModelTypes['contributions_bool_exp'] | undefined;
    contribution_id?: ModelTypes['uuid_comparison_exp'] | undefined;
    contribution_share?: ModelTypes['numeric_comparison_exp'] | undefined;
    user?: ModelTypes['users_bool_exp'] | undefined;
    user_id?: ModelTypes['uuid_comparison_exp'] | undefined;
  };
  ['contributors_constraint']: contributors_constraint;
  /** input type for incrementing numeric columns in table "contributors" */
  ['contributors_inc_input']: {
    contribution_share?: ModelTypes['numeric'] | undefined;
  };
  /** input type for inserting data into table "contributors" */
  ['contributors_insert_input']: {
    contribution?: ModelTypes['contributions_obj_rel_insert_input'] | undefined;
    contribution_id?: ModelTypes['uuid'] | undefined;
    contribution_share?: ModelTypes['numeric'] | undefined;
    user?: ModelTypes['users_obj_rel_insert_input'] | undefined;
    user_id?: ModelTypes['uuid'] | undefined;
  };
  /** aggregate max on columns */
  ['contributors_max_fields']: {
    contribution_id?: ModelTypes['uuid'] | undefined;
    contribution_share?: ModelTypes['numeric'] | undefined;
    user_id?: ModelTypes['uuid'] | undefined;
  };
  /** order by max() on columns of table "contributors" */
  ['contributors_max_order_by']: {
    contribution_id?: ModelTypes['order_by'] | undefined;
    contribution_share?: ModelTypes['order_by'] | undefined;
    user_id?: ModelTypes['order_by'] | undefined;
  };
  /** aggregate min on columns */
  ['contributors_min_fields']: {
    contribution_id?: ModelTypes['uuid'] | undefined;
    contribution_share?: ModelTypes['numeric'] | undefined;
    user_id?: ModelTypes['uuid'] | undefined;
  };
  /** order by min() on columns of table "contributors" */
  ['contributors_min_order_by']: {
    contribution_id?: ModelTypes['order_by'] | undefined;
    contribution_share?: ModelTypes['order_by'] | undefined;
    user_id?: ModelTypes['order_by'] | undefined;
  };
  /** response of any mutation on the table "contributors" */
  ['contributors_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<ModelTypes['contributors']>;
  };
  /** on_conflict condition type for table "contributors" */
  ['contributors_on_conflict']: {
    constraint: ModelTypes['contributors_constraint'];
    update_columns: Array<ModelTypes['contributors_update_column']>;
    where?: ModelTypes['contributors_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "contributors". */
  ['contributors_order_by']: {
    contribution?: ModelTypes['contributions_order_by'] | undefined;
    contribution_id?: ModelTypes['order_by'] | undefined;
    contribution_share?: ModelTypes['order_by'] | undefined;
    user?: ModelTypes['users_order_by'] | undefined;
    user_id?: ModelTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: contributors */
  ['contributors_pk_columns_input']: {
    contribution_id: ModelTypes['uuid'];
    user_id: ModelTypes['uuid'];
  };
  ['contributors_select_column']: contributors_select_column;
  /** input type for updating data in table "contributors" */
  ['contributors_set_input']: {
    contribution_id?: ModelTypes['uuid'] | undefined;
    contribution_share?: ModelTypes['numeric'] | undefined;
    user_id?: ModelTypes['uuid'] | undefined;
  };
  /** aggregate stddev on columns */
  ['contributors_stddev_fields']: {
    contribution_share?: number | undefined;
  };
  /** order by stddev() on columns of table "contributors" */
  ['contributors_stddev_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
  };
  /** aggregate stddev_pop on columns */
  ['contributors_stddev_pop_fields']: {
    contribution_share?: number | undefined;
  };
  /** order by stddev_pop() on columns of table "contributors" */
  ['contributors_stddev_pop_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
  };
  /** aggregate stddev_samp on columns */
  ['contributors_stddev_samp_fields']: {
    contribution_share?: number | undefined;
  };
  /** order by stddev_samp() on columns of table "contributors" */
  ['contributors_stddev_samp_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
  };
  /** Streaming cursor of the table "contributors" */
  ['contributors_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ModelTypes['contributors_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ModelTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['contributors_stream_cursor_value_input']: {
    contribution_id?: ModelTypes['uuid'] | undefined;
    contribution_share?: ModelTypes['numeric'] | undefined;
    user_id?: ModelTypes['uuid'] | undefined;
  };
  /** aggregate sum on columns */
  ['contributors_sum_fields']: {
    contribution_share?: ModelTypes['numeric'] | undefined;
  };
  /** order by sum() on columns of table "contributors" */
  ['contributors_sum_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
  };
  ['contributors_update_column']: contributors_update_column;
  ['contributors_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?: ModelTypes['contributors_inc_input'] | undefined;
    /** sets the columns of the filtered rows to the given values */
    _set?: ModelTypes['contributors_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: ModelTypes['contributors_bool_exp'];
  };
  /** aggregate var_pop on columns */
  ['contributors_var_pop_fields']: {
    contribution_share?: number | undefined;
  };
  /** order by var_pop() on columns of table "contributors" */
  ['contributors_var_pop_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
  };
  /** aggregate var_samp on columns */
  ['contributors_var_samp_fields']: {
    contribution_share?: number | undefined;
  };
  /** order by var_samp() on columns of table "contributors" */
  ['contributors_var_samp_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
  };
  /** aggregate variance on columns */
  ['contributors_variance_fields']: {
    contribution_share?: number | undefined;
  };
  /** order by variance() on columns of table "contributors" */
  ['contributors_variance_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
  };
  ['cursor_ordering']: cursor_ordering;
  ['date']: any;
  /** Boolean expression to compare columns of type "date". All fields are combined with logical 'AND'. */
  ['date_comparison_exp']: {
    _eq?: ModelTypes['date'] | undefined;
    _gt?: ModelTypes['date'] | undefined;
    _gte?: ModelTypes['date'] | undefined;
    _in?: Array<ModelTypes['date']> | undefined;
    _is_null?: boolean | undefined;
    _lt?: ModelTypes['date'] | undefined;
    _lte?: ModelTypes['date'] | undefined;
    _neq?: ModelTypes['date'] | undefined;
    _nin?: Array<ModelTypes['date']> | undefined;
  };
  ['jsonb']: any;
  ['jsonb_cast_exp']: {
    String?: ModelTypes['String_comparison_exp'] | undefined;
  };
  /** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
  ['jsonb_comparison_exp']: {
    _cast?: ModelTypes['jsonb_cast_exp'] | undefined;
    /** is the column contained in the given json value */
    _contained_in?: ModelTypes['jsonb'] | undefined;
    /** does the column contain the given json value at the top level */
    _contains?: ModelTypes['jsonb'] | undefined;
    _eq?: ModelTypes['jsonb'] | undefined;
    _gt?: ModelTypes['jsonb'] | undefined;
    _gte?: ModelTypes['jsonb'] | undefined;
    /** does the string exist as a top-level key in the column */
    _has_key?: string | undefined;
    /** do all of these strings exist as top-level keys in the column */
    _has_keys_all?: Array<string> | undefined;
    /** do any of these strings exist as top-level keys in the column */
    _has_keys_any?: Array<string> | undefined;
    _in?: Array<ModelTypes['jsonb']> | undefined;
    _is_null?: boolean | undefined;
    _lt?: ModelTypes['jsonb'] | undefined;
    _lte?: ModelTypes['jsonb'] | undefined;
    _neq?: ModelTypes['jsonb'] | undefined;
    _nin?: Array<ModelTypes['jsonb']> | undefined;
  };
  /** mutation root */
  ['mutation_root']: {
    /** delete data from the table: "contribution_votes" */
    delete_contribution_votes?:
      | ModelTypes['contribution_votes_mutation_response']
      | undefined;
    /** delete single row from the table: "contribution_votes" */
    delete_contribution_votes_by_pk?:
      | ModelTypes['contribution_votes']
      | undefined;
    /** delete data from the table: "contributions" */
    delete_contributions?:
      | ModelTypes['contributions_mutation_response']
      | undefined;
    /** delete single row from the table: "contributions" */
    delete_contributions_by_pk?: ModelTypes['contributions'] | undefined;
    /** delete data from the table: "contributors" */
    delete_contributors?:
      | ModelTypes['contributors_mutation_response']
      | undefined;
    /** delete single row from the table: "contributors" */
    delete_contributors_by_pk?: ModelTypes['contributors'] | undefined;
    /** delete data from the table: "robot.merkle_claims" */
    delete_robot_merkle_claims?:
      | ModelTypes['robot_merkle_claims_mutation_response']
      | undefined;
    /** delete single row from the table: "robot.merkle_claims" */
    delete_robot_merkle_claims_by_pk?:
      | ModelTypes['robot_merkle_claims']
      | undefined;
    /** delete data from the table: "robot.merkle_roots" */
    delete_robot_merkle_roots?:
      | ModelTypes['robot_merkle_roots_mutation_response']
      | undefined;
    /** delete single row from the table: "robot.merkle_roots" */
    delete_robot_merkle_roots_by_pk?:
      | ModelTypes['robot_merkle_roots']
      | undefined;
    /** delete data from the table: "robot.order" */
    delete_robot_order?:
      | ModelTypes['robot_order_mutation_response']
      | undefined;
    /** delete single row from the table: "robot.order" */
    delete_robot_order_by_pk?: ModelTypes['robot_order'] | undefined;
    /** delete data from the table: "robot.product" */
    delete_robot_product?:
      | ModelTypes['robot_product_mutation_response']
      | undefined;
    /** delete single row from the table: "robot.product" */
    delete_robot_product_by_pk?: ModelTypes['robot_product'] | undefined;
    /** delete data from the table: "robot.product_designer" */
    delete_robot_product_designer?:
      | ModelTypes['robot_product_designer_mutation_response']
      | undefined;
    /** delete single row from the table: "robot.product_designer" */
    delete_robot_product_designer_by_pk?:
      | ModelTypes['robot_product_designer']
      | undefined;
    /** delete data from the table: "shop.api_users" */
    delete_shop_api_users?:
      | ModelTypes['shop_api_users_mutation_response']
      | undefined;
    /** delete single row from the table: "shop.api_users" */
    delete_shop_api_users_by_pk?: ModelTypes['shop_api_users'] | undefined;
    /** delete data from the table: "shop.product_locks" */
    delete_shop_product_locks?:
      | ModelTypes['shop_product_locks_mutation_response']
      | undefined;
    /** delete single row from the table: "shop.product_locks" */
    delete_shop_product_locks_by_pk?:
      | ModelTypes['shop_product_locks']
      | undefined;
    /** delete data from the table: "users" */
    delete_users?: ModelTypes['users_mutation_response'] | undefined;
    /** delete single row from the table: "users" */
    delete_users_by_pk?: ModelTypes['users'] | undefined;
    /** insert data into the table: "contribution_votes" */
    insert_contribution_votes?:
      | ModelTypes['contribution_votes_mutation_response']
      | undefined;
    /** insert a single row into the table: "contribution_votes" */
    insert_contribution_votes_one?:
      | ModelTypes['contribution_votes']
      | undefined;
    /** insert data into the table: "contributions" */
    insert_contributions?:
      | ModelTypes['contributions_mutation_response']
      | undefined;
    /** insert a single row into the table: "contributions" */
    insert_contributions_one?: ModelTypes['contributions'] | undefined;
    /** insert data into the table: "contributors" */
    insert_contributors?:
      | ModelTypes['contributors_mutation_response']
      | undefined;
    /** insert a single row into the table: "contributors" */
    insert_contributors_one?: ModelTypes['contributors'] | undefined;
    /** insert data into the table: "robot.merkle_claims" */
    insert_robot_merkle_claims?:
      | ModelTypes['robot_merkle_claims_mutation_response']
      | undefined;
    /** insert a single row into the table: "robot.merkle_claims" */
    insert_robot_merkle_claims_one?:
      | ModelTypes['robot_merkle_claims']
      | undefined;
    /** insert data into the table: "robot.merkle_roots" */
    insert_robot_merkle_roots?:
      | ModelTypes['robot_merkle_roots_mutation_response']
      | undefined;
    /** insert a single row into the table: "robot.merkle_roots" */
    insert_robot_merkle_roots_one?:
      | ModelTypes['robot_merkle_roots']
      | undefined;
    /** insert data into the table: "robot.order" */
    insert_robot_order?:
      | ModelTypes['robot_order_mutation_response']
      | undefined;
    /** insert a single row into the table: "robot.order" */
    insert_robot_order_one?: ModelTypes['robot_order'] | undefined;
    /** insert data into the table: "robot.product" */
    insert_robot_product?:
      | ModelTypes['robot_product_mutation_response']
      | undefined;
    /** insert data into the table: "robot.product_designer" */
    insert_robot_product_designer?:
      | ModelTypes['robot_product_designer_mutation_response']
      | undefined;
    /** insert a single row into the table: "robot.product_designer" */
    insert_robot_product_designer_one?:
      | ModelTypes['robot_product_designer']
      | undefined;
    /** insert a single row into the table: "robot.product" */
    insert_robot_product_one?: ModelTypes['robot_product'] | undefined;
    /** insert data into the table: "shop.api_users" */
    insert_shop_api_users?:
      | ModelTypes['shop_api_users_mutation_response']
      | undefined;
    /** insert a single row into the table: "shop.api_users" */
    insert_shop_api_users_one?: ModelTypes['shop_api_users'] | undefined;
    /** insert data into the table: "shop.product_locks" */
    insert_shop_product_locks?:
      | ModelTypes['shop_product_locks_mutation_response']
      | undefined;
    /** insert a single row into the table: "shop.product_locks" */
    insert_shop_product_locks_one?:
      | ModelTypes['shop_product_locks']
      | undefined;
    /** insert data into the table: "users" */
    insert_users?: ModelTypes['users_mutation_response'] | undefined;
    /** insert a single row into the table: "users" */
    insert_users_one?: ModelTypes['users'] | undefined;
    /** update data of the table: "contribution_votes" */
    update_contribution_votes?:
      | ModelTypes['contribution_votes_mutation_response']
      | undefined;
    /** update single row of the table: "contribution_votes" */
    update_contribution_votes_by_pk?:
      | ModelTypes['contribution_votes']
      | undefined;
    /** update multiples rows of table: "contribution_votes" */
    update_contribution_votes_many?:
      | Array<ModelTypes['contribution_votes_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "contributions" */
    update_contributions?:
      | ModelTypes['contributions_mutation_response']
      | undefined;
    /** update single row of the table: "contributions" */
    update_contributions_by_pk?: ModelTypes['contributions'] | undefined;
    /** update multiples rows of table: "contributions" */
    update_contributions_many?:
      | Array<ModelTypes['contributions_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "contributors" */
    update_contributors?:
      | ModelTypes['contributors_mutation_response']
      | undefined;
    /** update single row of the table: "contributors" */
    update_contributors_by_pk?: ModelTypes['contributors'] | undefined;
    /** update multiples rows of table: "contributors" */
    update_contributors_many?:
      | Array<ModelTypes['contributors_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "robot.merkle_claims" */
    update_robot_merkle_claims?:
      | ModelTypes['robot_merkle_claims_mutation_response']
      | undefined;
    /** update single row of the table: "robot.merkle_claims" */
    update_robot_merkle_claims_by_pk?:
      | ModelTypes['robot_merkle_claims']
      | undefined;
    /** update multiples rows of table: "robot.merkle_claims" */
    update_robot_merkle_claims_many?:
      | Array<ModelTypes['robot_merkle_claims_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "robot.merkle_roots" */
    update_robot_merkle_roots?:
      | ModelTypes['robot_merkle_roots_mutation_response']
      | undefined;
    /** update single row of the table: "robot.merkle_roots" */
    update_robot_merkle_roots_by_pk?:
      | ModelTypes['robot_merkle_roots']
      | undefined;
    /** update multiples rows of table: "robot.merkle_roots" */
    update_robot_merkle_roots_many?:
      | Array<ModelTypes['robot_merkle_roots_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "robot.order" */
    update_robot_order?:
      | ModelTypes['robot_order_mutation_response']
      | undefined;
    /** update single row of the table: "robot.order" */
    update_robot_order_by_pk?: ModelTypes['robot_order'] | undefined;
    /** update multiples rows of table: "robot.order" */
    update_robot_order_many?:
      | Array<ModelTypes['robot_order_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "robot.product" */
    update_robot_product?:
      | ModelTypes['robot_product_mutation_response']
      | undefined;
    /** update single row of the table: "robot.product" */
    update_robot_product_by_pk?: ModelTypes['robot_product'] | undefined;
    /** update data of the table: "robot.product_designer" */
    update_robot_product_designer?:
      | ModelTypes['robot_product_designer_mutation_response']
      | undefined;
    /** update single row of the table: "robot.product_designer" */
    update_robot_product_designer_by_pk?:
      | ModelTypes['robot_product_designer']
      | undefined;
    /** update multiples rows of table: "robot.product_designer" */
    update_robot_product_designer_many?:
      | Array<
          ModelTypes['robot_product_designer_mutation_response'] | undefined
        >
      | undefined;
    /** update multiples rows of table: "robot.product" */
    update_robot_product_many?:
      | Array<ModelTypes['robot_product_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "shop.api_users" */
    update_shop_api_users?:
      | ModelTypes['shop_api_users_mutation_response']
      | undefined;
    /** update single row of the table: "shop.api_users" */
    update_shop_api_users_by_pk?: ModelTypes['shop_api_users'] | undefined;
    /** update multiples rows of table: "shop.api_users" */
    update_shop_api_users_many?:
      | Array<ModelTypes['shop_api_users_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "shop.product_locks" */
    update_shop_product_locks?:
      | ModelTypes['shop_product_locks_mutation_response']
      | undefined;
    /** update single row of the table: "shop.product_locks" */
    update_shop_product_locks_by_pk?:
      | ModelTypes['shop_product_locks']
      | undefined;
    /** update multiples rows of table: "shop.product_locks" */
    update_shop_product_locks_many?:
      | Array<ModelTypes['shop_product_locks_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "users" */
    update_users?: ModelTypes['users_mutation_response'] | undefined;
    /** update single row of the table: "users" */
    update_users_by_pk?: ModelTypes['users'] | undefined;
    /** update multiples rows of table: "users" */
    update_users_many?:
      | Array<ModelTypes['users_mutation_response'] | undefined>
      | undefined;
  };
  ['numeric']: number;
  /** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
  ['numeric_comparison_exp']: {
    _eq?: ModelTypes['numeric'] | undefined;
    _gt?: ModelTypes['numeric'] | undefined;
    _gte?: ModelTypes['numeric'] | undefined;
    _in?: Array<ModelTypes['numeric']> | undefined;
    _is_null?: boolean | undefined;
    _lt?: ModelTypes['numeric'] | undefined;
    _lte?: ModelTypes['numeric'] | undefined;
    _neq?: ModelTypes['numeric'] | undefined;
    _nin?: Array<ModelTypes['numeric']> | undefined;
  };
  ['order_by']: order_by;
  ['query_root']: {
    /** fetch data from the table: "contribution_votes" */
    contribution_votes: Array<ModelTypes['contribution_votes']>;
    /** fetch aggregated fields from the table: "contribution_votes" */
    contribution_votes_aggregate: ModelTypes['contribution_votes_aggregate'];
    /** fetch data from the table: "contribution_votes" using primary key columns */
    contribution_votes_by_pk?: ModelTypes['contribution_votes'] | undefined;
    /** fetch data from the table: "contributions" */
    contributions: Array<ModelTypes['contributions']>;
    /** fetch aggregated fields from the table: "contributions" */
    contributions_aggregate: ModelTypes['contributions_aggregate'];
    /** fetch data from the table: "contributions" using primary key columns */
    contributions_by_pk?: ModelTypes['contributions'] | undefined;
    /** An array relationship */
    contributors: Array<ModelTypes['contributors']>;
    /** An aggregate relationship */
    contributors_aggregate: ModelTypes['contributors_aggregate'];
    /** fetch data from the table: "contributors" using primary key columns */
    contributors_by_pk?: ModelTypes['contributors'] | undefined;
    /** fetch data from the table: "robot.merkle_claims" */
    robot_merkle_claims: Array<ModelTypes['robot_merkle_claims']>;
    /** fetch aggregated fields from the table: "robot.merkle_claims" */
    robot_merkle_claims_aggregate: ModelTypes['robot_merkle_claims_aggregate'];
    /** fetch data from the table: "robot.merkle_claims" using primary key columns */
    robot_merkle_claims_by_pk?: ModelTypes['robot_merkle_claims'] | undefined;
    /** fetch data from the table: "robot.merkle_roots" */
    robot_merkle_roots: Array<ModelTypes['robot_merkle_roots']>;
    /** fetch aggregated fields from the table: "robot.merkle_roots" */
    robot_merkle_roots_aggregate: ModelTypes['robot_merkle_roots_aggregate'];
    /** fetch data from the table: "robot.merkle_roots" using primary key columns */
    robot_merkle_roots_by_pk?: ModelTypes['robot_merkle_roots'] | undefined;
    /** fetch data from the table: "robot.order" */
    robot_order: Array<ModelTypes['robot_order']>;
    /** fetch aggregated fields from the table: "robot.order" */
    robot_order_aggregate: ModelTypes['robot_order_aggregate'];
    /** fetch data from the table: "robot.order" using primary key columns */
    robot_order_by_pk?: ModelTypes['robot_order'] | undefined;
    /** fetch data from the table: "robot.product" */
    robot_product: Array<ModelTypes['robot_product']>;
    /** fetch aggregated fields from the table: "robot.product" */
    robot_product_aggregate: ModelTypes['robot_product_aggregate'];
    /** fetch data from the table: "robot.product" using primary key columns */
    robot_product_by_pk?: ModelTypes['robot_product'] | undefined;
    /** fetch data from the table: "robot.product_designer" */
    robot_product_designer: Array<ModelTypes['robot_product_designer']>;
    /** fetch aggregated fields from the table: "robot.product_designer" */
    robot_product_designer_aggregate: ModelTypes['robot_product_designer_aggregate'];
    /** fetch data from the table: "robot.product_designer" using primary key columns */
    robot_product_designer_by_pk?:
      | ModelTypes['robot_product_designer']
      | undefined;
    /** fetch data from the table: "shop.api_users" */
    shop_api_users: Array<ModelTypes['shop_api_users']>;
    /** fetch aggregated fields from the table: "shop.api_users" */
    shop_api_users_aggregate: ModelTypes['shop_api_users_aggregate'];
    /** fetch data from the table: "shop.api_users" using primary key columns */
    shop_api_users_by_pk?: ModelTypes['shop_api_users'] | undefined;
    /** fetch data from the table: "shop.product_locks" */
    shop_product_locks: Array<ModelTypes['shop_product_locks']>;
    /** fetch aggregated fields from the table: "shop.product_locks" */
    shop_product_locks_aggregate: ModelTypes['shop_product_locks_aggregate'];
    /** fetch data from the table: "shop.product_locks" using primary key columns */
    shop_product_locks_by_pk?: ModelTypes['shop_product_locks'] | undefined;
    /** fetch data from the table: "users" */
    users: Array<ModelTypes['users']>;
    /** fetch aggregated fields from the table: "users" */
    users_aggregate: ModelTypes['users_aggregate'];
    /** fetch data from the table: "users" using primary key columns */
    users_by_pk?: ModelTypes['users'] | undefined;
  };
  /** Claim data for recipients in a merkle giveaway */
  ['robot_merkle_claims']: {
    claim_json: ModelTypes['jsonb'];
    id: ModelTypes['uuid'];
    /** An object relationship */
    merkle_root: ModelTypes['robot_merkle_roots'];
    merkle_root_hash: string;
    recipient_eth_address: string;
  };
  /** aggregated selection of "robot.merkle_claims" */
  ['robot_merkle_claims_aggregate']: {
    aggregate?: ModelTypes['robot_merkle_claims_aggregate_fields'] | undefined;
    nodes: Array<ModelTypes['robot_merkle_claims']>;
  };
  ['robot_merkle_claims_aggregate_bool_exp']: {
    count?:
      | ModelTypes['robot_merkle_claims_aggregate_bool_exp_count']
      | undefined;
  };
  ['robot_merkle_claims_aggregate_bool_exp_count']: {
    arguments?:
      | Array<ModelTypes['robot_merkle_claims_select_column']>
      | undefined;
    distinct?: boolean | undefined;
    filter?: ModelTypes['robot_merkle_claims_bool_exp'] | undefined;
    predicate: ModelTypes['Int_comparison_exp'];
  };
  /** aggregate fields of "robot.merkle_claims" */
  ['robot_merkle_claims_aggregate_fields']: {
    count: number;
    max?: ModelTypes['robot_merkle_claims_max_fields'] | undefined;
    min?: ModelTypes['robot_merkle_claims_min_fields'] | undefined;
  };
  /** order by aggregate values of table "robot.merkle_claims" */
  ['robot_merkle_claims_aggregate_order_by']: {
    count?: ModelTypes['order_by'] | undefined;
    max?: ModelTypes['robot_merkle_claims_max_order_by'] | undefined;
    min?: ModelTypes['robot_merkle_claims_min_order_by'] | undefined;
  };
  /** append existing jsonb value of filtered columns with new jsonb value */
  ['robot_merkle_claims_append_input']: {
    claim_json?: ModelTypes['jsonb'] | undefined;
  };
  /** input type for inserting array relation for remote table "robot.merkle_claims" */
  ['robot_merkle_claims_arr_rel_insert_input']: {
    data: Array<ModelTypes['robot_merkle_claims_insert_input']>;
    /** upsert condition */
    on_conflict?: ModelTypes['robot_merkle_claims_on_conflict'] | undefined;
  };
  /** Boolean expression to filter rows from the table "robot.merkle_claims". All fields are combined with a logical 'AND'. */
  ['robot_merkle_claims_bool_exp']: {
    _and?: Array<ModelTypes['robot_merkle_claims_bool_exp']> | undefined;
    _not?: ModelTypes['robot_merkle_claims_bool_exp'] | undefined;
    _or?: Array<ModelTypes['robot_merkle_claims_bool_exp']> | undefined;
    claim_json?: ModelTypes['jsonb_comparison_exp'] | undefined;
    id?: ModelTypes['uuid_comparison_exp'] | undefined;
    merkle_root?: ModelTypes['robot_merkle_roots_bool_exp'] | undefined;
    merkle_root_hash?: ModelTypes['String_comparison_exp'] | undefined;
    recipient_eth_address?: ModelTypes['String_comparison_exp'] | undefined;
  };
  ['robot_merkle_claims_constraint']: robot_merkle_claims_constraint;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  ['robot_merkle_claims_delete_at_path_input']: {
    claim_json?: Array<string> | undefined;
  };
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  ['robot_merkle_claims_delete_elem_input']: {
    claim_json?: number | undefined;
  };
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  ['robot_merkle_claims_delete_key_input']: {
    claim_json?: string | undefined;
  };
  /** input type for inserting data into table "robot.merkle_claims" */
  ['robot_merkle_claims_insert_input']: {
    claim_json?: ModelTypes['jsonb'] | undefined;
    id?: ModelTypes['uuid'] | undefined;
    merkle_root?:
      | ModelTypes['robot_merkle_roots_obj_rel_insert_input']
      | undefined;
    merkle_root_hash?: string | undefined;
    recipient_eth_address?: string | undefined;
  };
  /** aggregate max on columns */
  ['robot_merkle_claims_max_fields']: {
    id?: ModelTypes['uuid'] | undefined;
    merkle_root_hash?: string | undefined;
    recipient_eth_address?: string | undefined;
  };
  /** order by max() on columns of table "robot.merkle_claims" */
  ['robot_merkle_claims_max_order_by']: {
    id?: ModelTypes['order_by'] | undefined;
    merkle_root_hash?: ModelTypes['order_by'] | undefined;
    recipient_eth_address?: ModelTypes['order_by'] | undefined;
  };
  /** aggregate min on columns */
  ['robot_merkle_claims_min_fields']: {
    id?: ModelTypes['uuid'] | undefined;
    merkle_root_hash?: string | undefined;
    recipient_eth_address?: string | undefined;
  };
  /** order by min() on columns of table "robot.merkle_claims" */
  ['robot_merkle_claims_min_order_by']: {
    id?: ModelTypes['order_by'] | undefined;
    merkle_root_hash?: ModelTypes['order_by'] | undefined;
    recipient_eth_address?: ModelTypes['order_by'] | undefined;
  };
  /** response of any mutation on the table "robot.merkle_claims" */
  ['robot_merkle_claims_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<ModelTypes['robot_merkle_claims']>;
  };
  /** on_conflict condition type for table "robot.merkle_claims" */
  ['robot_merkle_claims_on_conflict']: {
    constraint: ModelTypes['robot_merkle_claims_constraint'];
    update_columns: Array<ModelTypes['robot_merkle_claims_update_column']>;
    where?: ModelTypes['robot_merkle_claims_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "robot.merkle_claims". */
  ['robot_merkle_claims_order_by']: {
    claim_json?: ModelTypes['order_by'] | undefined;
    id?: ModelTypes['order_by'] | undefined;
    merkle_root?: ModelTypes['robot_merkle_roots_order_by'] | undefined;
    merkle_root_hash?: ModelTypes['order_by'] | undefined;
    recipient_eth_address?: ModelTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: robot.merkle_claims */
  ['robot_merkle_claims_pk_columns_input']: {
    id: ModelTypes['uuid'];
  };
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  ['robot_merkle_claims_prepend_input']: {
    claim_json?: ModelTypes['jsonb'] | undefined;
  };
  ['robot_merkle_claims_select_column']: robot_merkle_claims_select_column;
  /** input type for updating data in table "robot.merkle_claims" */
  ['robot_merkle_claims_set_input']: {
    claim_json?: ModelTypes['jsonb'] | undefined;
    id?: ModelTypes['uuid'] | undefined;
    merkle_root_hash?: string | undefined;
    recipient_eth_address?: string | undefined;
  };
  /** Streaming cursor of the table "robot_merkle_claims" */
  ['robot_merkle_claims_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ModelTypes['robot_merkle_claims_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ModelTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_merkle_claims_stream_cursor_value_input']: {
    claim_json?: ModelTypes['jsonb'] | undefined;
    id?: ModelTypes['uuid'] | undefined;
    merkle_root_hash?: string | undefined;
    recipient_eth_address?: string | undefined;
  };
  ['robot_merkle_claims_update_column']: robot_merkle_claims_update_column;
  ['robot_merkle_claims_updates']: {
    /** append existing jsonb value of filtered columns with new jsonb value */
    _append?: ModelTypes['robot_merkle_claims_append_input'] | undefined;
    /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
    _delete_at_path?:
      | ModelTypes['robot_merkle_claims_delete_at_path_input']
      | undefined;
    /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
    _delete_elem?:
      | ModelTypes['robot_merkle_claims_delete_elem_input']
      | undefined;
    /** delete key/value pair or string element. key/value pairs are matched based on their key value */
    _delete_key?:
      | ModelTypes['robot_merkle_claims_delete_key_input']
      | undefined;
    /** prepend existing jsonb value of filtered columns with new jsonb value */
    _prepend?: ModelTypes['robot_merkle_claims_prepend_input'] | undefined;
    /** sets the columns of the filtered rows to the given values */
    _set?: ModelTypes['robot_merkle_claims_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: ModelTypes['robot_merkle_claims_bool_exp'];
  };
  /** Each merkle root corresponds to a distribution in the giveaway contract */
  ['robot_merkle_roots']: {
    contract_address: string;
    created_at: ModelTypes['timestamptz'];
    hash: string;
    /** An array relationship */
    merkle_claims: Array<ModelTypes['robot_merkle_claims']>;
    /** An aggregate relationship */
    merkle_claims_aggregate: ModelTypes['robot_merkle_claims_aggregate'];
    network: string;
  };
  /** aggregated selection of "robot.merkle_roots" */
  ['robot_merkle_roots_aggregate']: {
    aggregate?: ModelTypes['robot_merkle_roots_aggregate_fields'] | undefined;
    nodes: Array<ModelTypes['robot_merkle_roots']>;
  };
  /** aggregate fields of "robot.merkle_roots" */
  ['robot_merkle_roots_aggregate_fields']: {
    count: number;
    max?: ModelTypes['robot_merkle_roots_max_fields'] | undefined;
    min?: ModelTypes['robot_merkle_roots_min_fields'] | undefined;
  };
  /** Boolean expression to filter rows from the table "robot.merkle_roots". All fields are combined with a logical 'AND'. */
  ['robot_merkle_roots_bool_exp']: {
    _and?: Array<ModelTypes['robot_merkle_roots_bool_exp']> | undefined;
    _not?: ModelTypes['robot_merkle_roots_bool_exp'] | undefined;
    _or?: Array<ModelTypes['robot_merkle_roots_bool_exp']> | undefined;
    contract_address?: ModelTypes['String_comparison_exp'] | undefined;
    created_at?: ModelTypes['timestamptz_comparison_exp'] | undefined;
    hash?: ModelTypes['String_comparison_exp'] | undefined;
    merkle_claims?: ModelTypes['robot_merkle_claims_bool_exp'] | undefined;
    merkle_claims_aggregate?:
      | ModelTypes['robot_merkle_claims_aggregate_bool_exp']
      | undefined;
    network?: ModelTypes['String_comparison_exp'] | undefined;
  };
  ['robot_merkle_roots_constraint']: robot_merkle_roots_constraint;
  /** input type for inserting data into table "robot.merkle_roots" */
  ['robot_merkle_roots_insert_input']: {
    contract_address?: string | undefined;
    created_at?: ModelTypes['timestamptz'] | undefined;
    hash?: string | undefined;
    merkle_claims?:
      | ModelTypes['robot_merkle_claims_arr_rel_insert_input']
      | undefined;
    network?: string | undefined;
  };
  /** aggregate max on columns */
  ['robot_merkle_roots_max_fields']: {
    contract_address?: string | undefined;
    created_at?: ModelTypes['timestamptz'] | undefined;
    hash?: string | undefined;
    network?: string | undefined;
  };
  /** aggregate min on columns */
  ['robot_merkle_roots_min_fields']: {
    contract_address?: string | undefined;
    created_at?: ModelTypes['timestamptz'] | undefined;
    hash?: string | undefined;
    network?: string | undefined;
  };
  /** response of any mutation on the table "robot.merkle_roots" */
  ['robot_merkle_roots_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<ModelTypes['robot_merkle_roots']>;
  };
  /** input type for inserting object relation for remote table "robot.merkle_roots" */
  ['robot_merkle_roots_obj_rel_insert_input']: {
    data: ModelTypes['robot_merkle_roots_insert_input'];
    /** upsert condition */
    on_conflict?: ModelTypes['robot_merkle_roots_on_conflict'] | undefined;
  };
  /** on_conflict condition type for table "robot.merkle_roots" */
  ['robot_merkle_roots_on_conflict']: {
    constraint: ModelTypes['robot_merkle_roots_constraint'];
    update_columns: Array<ModelTypes['robot_merkle_roots_update_column']>;
    where?: ModelTypes['robot_merkle_roots_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "robot.merkle_roots". */
  ['robot_merkle_roots_order_by']: {
    contract_address?: ModelTypes['order_by'] | undefined;
    created_at?: ModelTypes['order_by'] | undefined;
    hash?: ModelTypes['order_by'] | undefined;
    merkle_claims_aggregate?:
      | ModelTypes['robot_merkle_claims_aggregate_order_by']
      | undefined;
    network?: ModelTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: robot.merkle_roots */
  ['robot_merkle_roots_pk_columns_input']: {
    hash: string;
  };
  ['robot_merkle_roots_select_column']: robot_merkle_roots_select_column;
  /** input type for updating data in table "robot.merkle_roots" */
  ['robot_merkle_roots_set_input']: {
    contract_address?: string | undefined;
    created_at?: ModelTypes['timestamptz'] | undefined;
    hash?: string | undefined;
    network?: string | undefined;
  };
  /** Streaming cursor of the table "robot_merkle_roots" */
  ['robot_merkle_roots_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ModelTypes['robot_merkle_roots_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ModelTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_merkle_roots_stream_cursor_value_input']: {
    contract_address?: string | undefined;
    created_at?: ModelTypes['timestamptz'] | undefined;
    hash?: string | undefined;
    network?: string | undefined;
  };
  ['robot_merkle_roots_update_column']: robot_merkle_roots_update_column;
  ['robot_merkle_roots_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?: ModelTypes['robot_merkle_roots_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: ModelTypes['robot_merkle_roots_bool_exp'];
  };
  /** Orders for ROBOT rewards */
  ['robot_order']: {
    buyer_address: string;
    buyer_reward: ModelTypes['numeric'];
    date: ModelTypes['date'];
    dollars_spent: ModelTypes['numeric'];
    order_id: string;
    order_number?: string | undefined;
    season: ModelTypes['numeric'];
  };
  /** aggregated selection of "robot.order" */
  ['robot_order_aggregate']: {
    aggregate?: ModelTypes['robot_order_aggregate_fields'] | undefined;
    nodes: Array<ModelTypes['robot_order']>;
  };
  /** aggregate fields of "robot.order" */
  ['robot_order_aggregate_fields']: {
    avg?: ModelTypes['robot_order_avg_fields'] | undefined;
    count: number;
    max?: ModelTypes['robot_order_max_fields'] | undefined;
    min?: ModelTypes['robot_order_min_fields'] | undefined;
    stddev?: ModelTypes['robot_order_stddev_fields'] | undefined;
    stddev_pop?: ModelTypes['robot_order_stddev_pop_fields'] | undefined;
    stddev_samp?: ModelTypes['robot_order_stddev_samp_fields'] | undefined;
    sum?: ModelTypes['robot_order_sum_fields'] | undefined;
    var_pop?: ModelTypes['robot_order_var_pop_fields'] | undefined;
    var_samp?: ModelTypes['robot_order_var_samp_fields'] | undefined;
    variance?: ModelTypes['robot_order_variance_fields'] | undefined;
  };
  /** aggregate avg on columns */
  ['robot_order_avg_fields']: {
    buyer_reward?: number | undefined;
    dollars_spent?: number | undefined;
    season?: number | undefined;
  };
  /** Boolean expression to filter rows from the table "robot.order". All fields are combined with a logical 'AND'. */
  ['robot_order_bool_exp']: {
    _and?: Array<ModelTypes['robot_order_bool_exp']> | undefined;
    _not?: ModelTypes['robot_order_bool_exp'] | undefined;
    _or?: Array<ModelTypes['robot_order_bool_exp']> | undefined;
    buyer_address?: ModelTypes['String_comparison_exp'] | undefined;
    buyer_reward?: ModelTypes['numeric_comparison_exp'] | undefined;
    date?: ModelTypes['date_comparison_exp'] | undefined;
    dollars_spent?: ModelTypes['numeric_comparison_exp'] | undefined;
    order_id?: ModelTypes['String_comparison_exp'] | undefined;
    order_number?: ModelTypes['String_comparison_exp'] | undefined;
    season?: ModelTypes['numeric_comparison_exp'] | undefined;
  };
  ['robot_order_constraint']: robot_order_constraint;
  /** input type for incrementing numeric columns in table "robot.order" */
  ['robot_order_inc_input']: {
    buyer_reward?: ModelTypes['numeric'] | undefined;
    dollars_spent?: ModelTypes['numeric'] | undefined;
    season?: ModelTypes['numeric'] | undefined;
  };
  /** input type for inserting data into table "robot.order" */
  ['robot_order_insert_input']: {
    buyer_address?: string | undefined;
    buyer_reward?: ModelTypes['numeric'] | undefined;
    date?: ModelTypes['date'] | undefined;
    dollars_spent?: ModelTypes['numeric'] | undefined;
    order_id?: string | undefined;
    order_number?: string | undefined;
    season?: ModelTypes['numeric'] | undefined;
  };
  /** aggregate max on columns */
  ['robot_order_max_fields']: {
    buyer_address?: string | undefined;
    buyer_reward?: ModelTypes['numeric'] | undefined;
    date?: ModelTypes['date'] | undefined;
    dollars_spent?: ModelTypes['numeric'] | undefined;
    order_id?: string | undefined;
    order_number?: string | undefined;
    season?: ModelTypes['numeric'] | undefined;
  };
  /** aggregate min on columns */
  ['robot_order_min_fields']: {
    buyer_address?: string | undefined;
    buyer_reward?: ModelTypes['numeric'] | undefined;
    date?: ModelTypes['date'] | undefined;
    dollars_spent?: ModelTypes['numeric'] | undefined;
    order_id?: string | undefined;
    order_number?: string | undefined;
    season?: ModelTypes['numeric'] | undefined;
  };
  /** response of any mutation on the table "robot.order" */
  ['robot_order_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<ModelTypes['robot_order']>;
  };
  /** on_conflict condition type for table "robot.order" */
  ['robot_order_on_conflict']: {
    constraint: ModelTypes['robot_order_constraint'];
    update_columns: Array<ModelTypes['robot_order_update_column']>;
    where?: ModelTypes['robot_order_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "robot.order". */
  ['robot_order_order_by']: {
    buyer_address?: ModelTypes['order_by'] | undefined;
    buyer_reward?: ModelTypes['order_by'] | undefined;
    date?: ModelTypes['order_by'] | undefined;
    dollars_spent?: ModelTypes['order_by'] | undefined;
    order_id?: ModelTypes['order_by'] | undefined;
    order_number?: ModelTypes['order_by'] | undefined;
    season?: ModelTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: robot.order */
  ['robot_order_pk_columns_input']: {
    order_id: string;
  };
  ['robot_order_select_column']: robot_order_select_column;
  /** input type for updating data in table "robot.order" */
  ['robot_order_set_input']: {
    buyer_address?: string | undefined;
    buyer_reward?: ModelTypes['numeric'] | undefined;
    date?: ModelTypes['date'] | undefined;
    dollars_spent?: ModelTypes['numeric'] | undefined;
    order_id?: string | undefined;
    order_number?: string | undefined;
    season?: ModelTypes['numeric'] | undefined;
  };
  /** aggregate stddev on columns */
  ['robot_order_stddev_fields']: {
    buyer_reward?: number | undefined;
    dollars_spent?: number | undefined;
    season?: number | undefined;
  };
  /** aggregate stddev_pop on columns */
  ['robot_order_stddev_pop_fields']: {
    buyer_reward?: number | undefined;
    dollars_spent?: number | undefined;
    season?: number | undefined;
  };
  /** aggregate stddev_samp on columns */
  ['robot_order_stddev_samp_fields']: {
    buyer_reward?: number | undefined;
    dollars_spent?: number | undefined;
    season?: number | undefined;
  };
  /** Streaming cursor of the table "robot_order" */
  ['robot_order_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ModelTypes['robot_order_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ModelTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_order_stream_cursor_value_input']: {
    buyer_address?: string | undefined;
    buyer_reward?: ModelTypes['numeric'] | undefined;
    date?: ModelTypes['date'] | undefined;
    dollars_spent?: ModelTypes['numeric'] | undefined;
    order_id?: string | undefined;
    order_number?: string | undefined;
    season?: ModelTypes['numeric'] | undefined;
  };
  /** aggregate sum on columns */
  ['robot_order_sum_fields']: {
    buyer_reward?: ModelTypes['numeric'] | undefined;
    dollars_spent?: ModelTypes['numeric'] | undefined;
    season?: ModelTypes['numeric'] | undefined;
  };
  ['robot_order_update_column']: robot_order_update_column;
  ['robot_order_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?: ModelTypes['robot_order_inc_input'] | undefined;
    /** sets the columns of the filtered rows to the given values */
    _set?: ModelTypes['robot_order_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: ModelTypes['robot_order_bool_exp'];
  };
  /** aggregate var_pop on columns */
  ['robot_order_var_pop_fields']: {
    buyer_reward?: number | undefined;
    dollars_spent?: number | undefined;
    season?: number | undefined;
  };
  /** aggregate var_samp on columns */
  ['robot_order_var_samp_fields']: {
    buyer_reward?: number | undefined;
    dollars_spent?: number | undefined;
    season?: number | undefined;
  };
  /** aggregate variance on columns */
  ['robot_order_variance_fields']: {
    buyer_reward?: number | undefined;
    dollars_spent?: number | undefined;
    season?: number | undefined;
  };
  /** Products for ROBOT designer rewards */
  ['robot_product']: {
    /** An array relationship */
    designers: Array<ModelTypes['robot_product_designer']>;
    /** An aggregate relationship */
    designers_aggregate: ModelTypes['robot_product_designer_aggregate'];
    id: string;
    nft_metadata?: ModelTypes['jsonb'] | undefined;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    shopify_id?: string | undefined;
    title: string;
  };
  /** aggregated selection of "robot.product" */
  ['robot_product_aggregate']: {
    aggregate?: ModelTypes['robot_product_aggregate_fields'] | undefined;
    nodes: Array<ModelTypes['robot_product']>;
  };
  /** aggregate fields of "robot.product" */
  ['robot_product_aggregate_fields']: {
    avg?: ModelTypes['robot_product_avg_fields'] | undefined;
    count: number;
    max?: ModelTypes['robot_product_max_fields'] | undefined;
    min?: ModelTypes['robot_product_min_fields'] | undefined;
    stddev?: ModelTypes['robot_product_stddev_fields'] | undefined;
    stddev_pop?: ModelTypes['robot_product_stddev_pop_fields'] | undefined;
    stddev_samp?: ModelTypes['robot_product_stddev_samp_fields'] | undefined;
    sum?: ModelTypes['robot_product_sum_fields'] | undefined;
    var_pop?: ModelTypes['robot_product_var_pop_fields'] | undefined;
    var_samp?: ModelTypes['robot_product_var_samp_fields'] | undefined;
    variance?: ModelTypes['robot_product_variance_fields'] | undefined;
  };
  /** append existing jsonb value of filtered columns with new jsonb value */
  ['robot_product_append_input']: {
    nft_metadata?: ModelTypes['jsonb'] | undefined;
  };
  /** aggregate avg on columns */
  ['robot_product_avg_fields']: {
    nft_token_id?: number | undefined;
  };
  /** Boolean expression to filter rows from the table "robot.product". All fields are combined with a logical 'AND'. */
  ['robot_product_bool_exp']: {
    _and?: Array<ModelTypes['robot_product_bool_exp']> | undefined;
    _not?: ModelTypes['robot_product_bool_exp'] | undefined;
    _or?: Array<ModelTypes['robot_product_bool_exp']> | undefined;
    designers?: ModelTypes['robot_product_designer_bool_exp'] | undefined;
    designers_aggregate?:
      | ModelTypes['robot_product_designer_aggregate_bool_exp']
      | undefined;
    id?: ModelTypes['String_comparison_exp'] | undefined;
    nft_metadata?: ModelTypes['jsonb_comparison_exp'] | undefined;
    nft_token_id?: ModelTypes['Int_comparison_exp'] | undefined;
    notion_id?: ModelTypes['String_comparison_exp'] | undefined;
    shopify_id?: ModelTypes['String_comparison_exp'] | undefined;
    title?: ModelTypes['String_comparison_exp'] | undefined;
  };
  ['robot_product_constraint']: robot_product_constraint;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  ['robot_product_delete_at_path_input']: {
    nft_metadata?: Array<string> | undefined;
  };
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  ['robot_product_delete_elem_input']: {
    nft_metadata?: number | undefined;
  };
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  ['robot_product_delete_key_input']: {
    nft_metadata?: string | undefined;
  };
  /** Designer receiving ROBOT rewards */
  ['robot_product_designer']: {
    contribution_share: ModelTypes['numeric'];
    designer_name?: string | undefined;
    eth_address: string;
    /** An object relationship */
    product: ModelTypes['robot_product'];
    product_id: string;
    robot_reward: ModelTypes['numeric'];
  };
  /** aggregated selection of "robot.product_designer" */
  ['robot_product_designer_aggregate']: {
    aggregate?:
      | ModelTypes['robot_product_designer_aggregate_fields']
      | undefined;
    nodes: Array<ModelTypes['robot_product_designer']>;
  };
  ['robot_product_designer_aggregate_bool_exp']: {
    count?:
      | ModelTypes['robot_product_designer_aggregate_bool_exp_count']
      | undefined;
  };
  ['robot_product_designer_aggregate_bool_exp_count']: {
    arguments?:
      | Array<ModelTypes['robot_product_designer_select_column']>
      | undefined;
    distinct?: boolean | undefined;
    filter?: ModelTypes['robot_product_designer_bool_exp'] | undefined;
    predicate: ModelTypes['Int_comparison_exp'];
  };
  /** aggregate fields of "robot.product_designer" */
  ['robot_product_designer_aggregate_fields']: {
    avg?: ModelTypes['robot_product_designer_avg_fields'] | undefined;
    count: number;
    max?: ModelTypes['robot_product_designer_max_fields'] | undefined;
    min?: ModelTypes['robot_product_designer_min_fields'] | undefined;
    stddev?: ModelTypes['robot_product_designer_stddev_fields'] | undefined;
    stddev_pop?:
      | ModelTypes['robot_product_designer_stddev_pop_fields']
      | undefined;
    stddev_samp?:
      | ModelTypes['robot_product_designer_stddev_samp_fields']
      | undefined;
    sum?: ModelTypes['robot_product_designer_sum_fields'] | undefined;
    var_pop?: ModelTypes['robot_product_designer_var_pop_fields'] | undefined;
    var_samp?: ModelTypes['robot_product_designer_var_samp_fields'] | undefined;
    variance?: ModelTypes['robot_product_designer_variance_fields'] | undefined;
  };
  /** order by aggregate values of table "robot.product_designer" */
  ['robot_product_designer_aggregate_order_by']: {
    avg?: ModelTypes['robot_product_designer_avg_order_by'] | undefined;
    count?: ModelTypes['order_by'] | undefined;
    max?: ModelTypes['robot_product_designer_max_order_by'] | undefined;
    min?: ModelTypes['robot_product_designer_min_order_by'] | undefined;
    stddev?: ModelTypes['robot_product_designer_stddev_order_by'] | undefined;
    stddev_pop?:
      | ModelTypes['robot_product_designer_stddev_pop_order_by']
      | undefined;
    stddev_samp?:
      | ModelTypes['robot_product_designer_stddev_samp_order_by']
      | undefined;
    sum?: ModelTypes['robot_product_designer_sum_order_by'] | undefined;
    var_pop?: ModelTypes['robot_product_designer_var_pop_order_by'] | undefined;
    var_samp?:
      | ModelTypes['robot_product_designer_var_samp_order_by']
      | undefined;
    variance?:
      | ModelTypes['robot_product_designer_variance_order_by']
      | undefined;
  };
  /** input type for inserting array relation for remote table "robot.product_designer" */
  ['robot_product_designer_arr_rel_insert_input']: {
    data: Array<ModelTypes['robot_product_designer_insert_input']>;
    /** upsert condition */
    on_conflict?: ModelTypes['robot_product_designer_on_conflict'] | undefined;
  };
  /** aggregate avg on columns */
  ['robot_product_designer_avg_fields']: {
    contribution_share?: number | undefined;
    robot_reward?: number | undefined;
  };
  /** order by avg() on columns of table "robot.product_designer" */
  ['robot_product_designer_avg_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
    robot_reward?: ModelTypes['order_by'] | undefined;
  };
  /** Boolean expression to filter rows from the table "robot.product_designer". All fields are combined with a logical 'AND'. */
  ['robot_product_designer_bool_exp']: {
    _and?: Array<ModelTypes['robot_product_designer_bool_exp']> | undefined;
    _not?: ModelTypes['robot_product_designer_bool_exp'] | undefined;
    _or?: Array<ModelTypes['robot_product_designer_bool_exp']> | undefined;
    contribution_share?: ModelTypes['numeric_comparison_exp'] | undefined;
    designer_name?: ModelTypes['String_comparison_exp'] | undefined;
    eth_address?: ModelTypes['String_comparison_exp'] | undefined;
    product?: ModelTypes['robot_product_bool_exp'] | undefined;
    product_id?: ModelTypes['String_comparison_exp'] | undefined;
    robot_reward?: ModelTypes['numeric_comparison_exp'] | undefined;
  };
  ['robot_product_designer_constraint']: robot_product_designer_constraint;
  /** input type for incrementing numeric columns in table "robot.product_designer" */
  ['robot_product_designer_inc_input']: {
    contribution_share?: ModelTypes['numeric'] | undefined;
    robot_reward?: ModelTypes['numeric'] | undefined;
  };
  /** input type for inserting data into table "robot.product_designer" */
  ['robot_product_designer_insert_input']: {
    contribution_share?: ModelTypes['numeric'] | undefined;
    designer_name?: string | undefined;
    eth_address?: string | undefined;
    product?: ModelTypes['robot_product_obj_rel_insert_input'] | undefined;
    product_id?: string | undefined;
    robot_reward?: ModelTypes['numeric'] | undefined;
  };
  /** aggregate max on columns */
  ['robot_product_designer_max_fields']: {
    contribution_share?: ModelTypes['numeric'] | undefined;
    designer_name?: string | undefined;
    eth_address?: string | undefined;
    product_id?: string | undefined;
    robot_reward?: ModelTypes['numeric'] | undefined;
  };
  /** order by max() on columns of table "robot.product_designer" */
  ['robot_product_designer_max_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
    designer_name?: ModelTypes['order_by'] | undefined;
    eth_address?: ModelTypes['order_by'] | undefined;
    product_id?: ModelTypes['order_by'] | undefined;
    robot_reward?: ModelTypes['order_by'] | undefined;
  };
  /** aggregate min on columns */
  ['robot_product_designer_min_fields']: {
    contribution_share?: ModelTypes['numeric'] | undefined;
    designer_name?: string | undefined;
    eth_address?: string | undefined;
    product_id?: string | undefined;
    robot_reward?: ModelTypes['numeric'] | undefined;
  };
  /** order by min() on columns of table "robot.product_designer" */
  ['robot_product_designer_min_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
    designer_name?: ModelTypes['order_by'] | undefined;
    eth_address?: ModelTypes['order_by'] | undefined;
    product_id?: ModelTypes['order_by'] | undefined;
    robot_reward?: ModelTypes['order_by'] | undefined;
  };
  /** response of any mutation on the table "robot.product_designer" */
  ['robot_product_designer_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<ModelTypes['robot_product_designer']>;
  };
  /** on_conflict condition type for table "robot.product_designer" */
  ['robot_product_designer_on_conflict']: {
    constraint: ModelTypes['robot_product_designer_constraint'];
    update_columns: Array<ModelTypes['robot_product_designer_update_column']>;
    where?: ModelTypes['robot_product_designer_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "robot.product_designer". */
  ['robot_product_designer_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
    designer_name?: ModelTypes['order_by'] | undefined;
    eth_address?: ModelTypes['order_by'] | undefined;
    product?: ModelTypes['robot_product_order_by'] | undefined;
    product_id?: ModelTypes['order_by'] | undefined;
    robot_reward?: ModelTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: robot.product_designer */
  ['robot_product_designer_pk_columns_input']: {
    eth_address: string;
    product_id: string;
  };
  ['robot_product_designer_select_column']: robot_product_designer_select_column;
  /** input type for updating data in table "robot.product_designer" */
  ['robot_product_designer_set_input']: {
    contribution_share?: ModelTypes['numeric'] | undefined;
    designer_name?: string | undefined;
    eth_address?: string | undefined;
    product_id?: string | undefined;
    robot_reward?: ModelTypes['numeric'] | undefined;
  };
  /** aggregate stddev on columns */
  ['robot_product_designer_stddev_fields']: {
    contribution_share?: number | undefined;
    robot_reward?: number | undefined;
  };
  /** order by stddev() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
    robot_reward?: ModelTypes['order_by'] | undefined;
  };
  /** aggregate stddev_pop on columns */
  ['robot_product_designer_stddev_pop_fields']: {
    contribution_share?: number | undefined;
    robot_reward?: number | undefined;
  };
  /** order by stddev_pop() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_pop_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
    robot_reward?: ModelTypes['order_by'] | undefined;
  };
  /** aggregate stddev_samp on columns */
  ['robot_product_designer_stddev_samp_fields']: {
    contribution_share?: number | undefined;
    robot_reward?: number | undefined;
  };
  /** order by stddev_samp() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_samp_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
    robot_reward?: ModelTypes['order_by'] | undefined;
  };
  /** Streaming cursor of the table "robot_product_designer" */
  ['robot_product_designer_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ModelTypes['robot_product_designer_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ModelTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_product_designer_stream_cursor_value_input']: {
    contribution_share?: ModelTypes['numeric'] | undefined;
    designer_name?: string | undefined;
    eth_address?: string | undefined;
    product_id?: string | undefined;
    robot_reward?: ModelTypes['numeric'] | undefined;
  };
  /** aggregate sum on columns */
  ['robot_product_designer_sum_fields']: {
    contribution_share?: ModelTypes['numeric'] | undefined;
    robot_reward?: ModelTypes['numeric'] | undefined;
  };
  /** order by sum() on columns of table "robot.product_designer" */
  ['robot_product_designer_sum_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
    robot_reward?: ModelTypes['order_by'] | undefined;
  };
  ['robot_product_designer_update_column']: robot_product_designer_update_column;
  ['robot_product_designer_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?: ModelTypes['robot_product_designer_inc_input'] | undefined;
    /** sets the columns of the filtered rows to the given values */
    _set?: ModelTypes['robot_product_designer_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: ModelTypes['robot_product_designer_bool_exp'];
  };
  /** aggregate var_pop on columns */
  ['robot_product_designer_var_pop_fields']: {
    contribution_share?: number | undefined;
    robot_reward?: number | undefined;
  };
  /** order by var_pop() on columns of table "robot.product_designer" */
  ['robot_product_designer_var_pop_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
    robot_reward?: ModelTypes['order_by'] | undefined;
  };
  /** aggregate var_samp on columns */
  ['robot_product_designer_var_samp_fields']: {
    contribution_share?: number | undefined;
    robot_reward?: number | undefined;
  };
  /** order by var_samp() on columns of table "robot.product_designer" */
  ['robot_product_designer_var_samp_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
    robot_reward?: ModelTypes['order_by'] | undefined;
  };
  /** aggregate variance on columns */
  ['robot_product_designer_variance_fields']: {
    contribution_share?: number | undefined;
    robot_reward?: number | undefined;
  };
  /** order by variance() on columns of table "robot.product_designer" */
  ['robot_product_designer_variance_order_by']: {
    contribution_share?: ModelTypes['order_by'] | undefined;
    robot_reward?: ModelTypes['order_by'] | undefined;
  };
  /** input type for incrementing numeric columns in table "robot.product" */
  ['robot_product_inc_input']: {
    nft_token_id?: number | undefined;
  };
  /** input type for inserting data into table "robot.product" */
  ['robot_product_insert_input']: {
    designers?:
      | ModelTypes['robot_product_designer_arr_rel_insert_input']
      | undefined;
    id?: string | undefined;
    nft_metadata?: ModelTypes['jsonb'] | undefined;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    shopify_id?: string | undefined;
    title?: string | undefined;
  };
  /** aggregate max on columns */
  ['robot_product_max_fields']: {
    id?: string | undefined;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    shopify_id?: string | undefined;
    title?: string | undefined;
  };
  /** aggregate min on columns */
  ['robot_product_min_fields']: {
    id?: string | undefined;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    shopify_id?: string | undefined;
    title?: string | undefined;
  };
  /** response of any mutation on the table "robot.product" */
  ['robot_product_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<ModelTypes['robot_product']>;
  };
  /** input type for inserting object relation for remote table "robot.product" */
  ['robot_product_obj_rel_insert_input']: {
    data: ModelTypes['robot_product_insert_input'];
    /** upsert condition */
    on_conflict?: ModelTypes['robot_product_on_conflict'] | undefined;
  };
  /** on_conflict condition type for table "robot.product" */
  ['robot_product_on_conflict']: {
    constraint: ModelTypes['robot_product_constraint'];
    update_columns: Array<ModelTypes['robot_product_update_column']>;
    where?: ModelTypes['robot_product_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "robot.product". */
  ['robot_product_order_by']: {
    designers_aggregate?:
      | ModelTypes['robot_product_designer_aggregate_order_by']
      | undefined;
    id?: ModelTypes['order_by'] | undefined;
    nft_metadata?: ModelTypes['order_by'] | undefined;
    nft_token_id?: ModelTypes['order_by'] | undefined;
    notion_id?: ModelTypes['order_by'] | undefined;
    shopify_id?: ModelTypes['order_by'] | undefined;
    title?: ModelTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: robot.product */
  ['robot_product_pk_columns_input']: {
    id: string;
  };
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  ['robot_product_prepend_input']: {
    nft_metadata?: ModelTypes['jsonb'] | undefined;
  };
  ['robot_product_select_column']: robot_product_select_column;
  /** input type for updating data in table "robot.product" */
  ['robot_product_set_input']: {
    id?: string | undefined;
    nft_metadata?: ModelTypes['jsonb'] | undefined;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    shopify_id?: string | undefined;
    title?: string | undefined;
  };
  /** aggregate stddev on columns */
  ['robot_product_stddev_fields']: {
    nft_token_id?: number | undefined;
  };
  /** aggregate stddev_pop on columns */
  ['robot_product_stddev_pop_fields']: {
    nft_token_id?: number | undefined;
  };
  /** aggregate stddev_samp on columns */
  ['robot_product_stddev_samp_fields']: {
    nft_token_id?: number | undefined;
  };
  /** Streaming cursor of the table "robot_product" */
  ['robot_product_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ModelTypes['robot_product_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ModelTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_product_stream_cursor_value_input']: {
    id?: string | undefined;
    nft_metadata?: ModelTypes['jsonb'] | undefined;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    shopify_id?: string | undefined;
    title?: string | undefined;
  };
  /** aggregate sum on columns */
  ['robot_product_sum_fields']: {
    nft_token_id?: number | undefined;
  };
  ['robot_product_update_column']: robot_product_update_column;
  ['robot_product_updates']: {
    /** append existing jsonb value of filtered columns with new jsonb value */
    _append?: ModelTypes['robot_product_append_input'] | undefined;
    /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
    _delete_at_path?:
      | ModelTypes['robot_product_delete_at_path_input']
      | undefined;
    /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
    _delete_elem?: ModelTypes['robot_product_delete_elem_input'] | undefined;
    /** delete key/value pair or string element. key/value pairs are matched based on their key value */
    _delete_key?: ModelTypes['robot_product_delete_key_input'] | undefined;
    /** increments the numeric columns with given value of the filtered values */
    _inc?: ModelTypes['robot_product_inc_input'] | undefined;
    /** prepend existing jsonb value of filtered columns with new jsonb value */
    _prepend?: ModelTypes['robot_product_prepend_input'] | undefined;
    /** sets the columns of the filtered rows to the given values */
    _set?: ModelTypes['robot_product_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: ModelTypes['robot_product_bool_exp'];
  };
  /** aggregate var_pop on columns */
  ['robot_product_var_pop_fields']: {
    nft_token_id?: number | undefined;
  };
  /** aggregate var_samp on columns */
  ['robot_product_var_samp_fields']: {
    nft_token_id?: number | undefined;
  };
  /** aggregate variance on columns */
  ['robot_product_variance_fields']: {
    nft_token_id?: number | undefined;
  };
  /** columns and relationships of "shop.api_users" */
  ['shop_api_users']: {
    password_hash: string;
    username: string;
  };
  /** aggregated selection of "shop.api_users" */
  ['shop_api_users_aggregate']: {
    aggregate?: ModelTypes['shop_api_users_aggregate_fields'] | undefined;
    nodes: Array<ModelTypes['shop_api_users']>;
  };
  /** aggregate fields of "shop.api_users" */
  ['shop_api_users_aggregate_fields']: {
    count: number;
    max?: ModelTypes['shop_api_users_max_fields'] | undefined;
    min?: ModelTypes['shop_api_users_min_fields'] | undefined;
  };
  /** Boolean expression to filter rows from the table "shop.api_users". All fields are combined with a logical 'AND'. */
  ['shop_api_users_bool_exp']: {
    _and?: Array<ModelTypes['shop_api_users_bool_exp']> | undefined;
    _not?: ModelTypes['shop_api_users_bool_exp'] | undefined;
    _or?: Array<ModelTypes['shop_api_users_bool_exp']> | undefined;
    password_hash?: ModelTypes['String_comparison_exp'] | undefined;
    username?: ModelTypes['String_comparison_exp'] | undefined;
  };
  ['shop_api_users_constraint']: shop_api_users_constraint;
  /** input type for inserting data into table "shop.api_users" */
  ['shop_api_users_insert_input']: {
    password_hash?: string | undefined;
    username?: string | undefined;
  };
  /** aggregate max on columns */
  ['shop_api_users_max_fields']: {
    password_hash?: string | undefined;
    username?: string | undefined;
  };
  /** aggregate min on columns */
  ['shop_api_users_min_fields']: {
    password_hash?: string | undefined;
    username?: string | undefined;
  };
  /** response of any mutation on the table "shop.api_users" */
  ['shop_api_users_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<ModelTypes['shop_api_users']>;
  };
  /** on_conflict condition type for table "shop.api_users" */
  ['shop_api_users_on_conflict']: {
    constraint: ModelTypes['shop_api_users_constraint'];
    update_columns: Array<ModelTypes['shop_api_users_update_column']>;
    where?: ModelTypes['shop_api_users_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "shop.api_users". */
  ['shop_api_users_order_by']: {
    password_hash?: ModelTypes['order_by'] | undefined;
    username?: ModelTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: shop.api_users */
  ['shop_api_users_pk_columns_input']: {
    username: string;
  };
  ['shop_api_users_select_column']: shop_api_users_select_column;
  /** input type for updating data in table "shop.api_users" */
  ['shop_api_users_set_input']: {
    password_hash?: string | undefined;
    username?: string | undefined;
  };
  /** Streaming cursor of the table "shop_api_users" */
  ['shop_api_users_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ModelTypes['shop_api_users_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ModelTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['shop_api_users_stream_cursor_value_input']: {
    password_hash?: string | undefined;
    username?: string | undefined;
  };
  ['shop_api_users_update_column']: shop_api_users_update_column;
  ['shop_api_users_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?: ModelTypes['shop_api_users_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: ModelTypes['shop_api_users_bool_exp'];
  };
  /** columns and relationships of "shop.product_locks" */
  ['shop_product_locks']: {
    access_code: string;
    created_at?: ModelTypes['timestamptz'] | undefined;
    customer_eth_address?: string | undefined;
    lock_id: string;
  };
  /** aggregated selection of "shop.product_locks" */
  ['shop_product_locks_aggregate']: {
    aggregate?: ModelTypes['shop_product_locks_aggregate_fields'] | undefined;
    nodes: Array<ModelTypes['shop_product_locks']>;
  };
  /** aggregate fields of "shop.product_locks" */
  ['shop_product_locks_aggregate_fields']: {
    count: number;
    max?: ModelTypes['shop_product_locks_max_fields'] | undefined;
    min?: ModelTypes['shop_product_locks_min_fields'] | undefined;
  };
  /** Boolean expression to filter rows from the table "shop.product_locks". All fields are combined with a logical 'AND'. */
  ['shop_product_locks_bool_exp']: {
    _and?: Array<ModelTypes['shop_product_locks_bool_exp']> | undefined;
    _not?: ModelTypes['shop_product_locks_bool_exp'] | undefined;
    _or?: Array<ModelTypes['shop_product_locks_bool_exp']> | undefined;
    access_code?: ModelTypes['String_comparison_exp'] | undefined;
    created_at?: ModelTypes['timestamptz_comparison_exp'] | undefined;
    customer_eth_address?: ModelTypes['String_comparison_exp'] | undefined;
    lock_id?: ModelTypes['String_comparison_exp'] | undefined;
  };
  ['shop_product_locks_constraint']: shop_product_locks_constraint;
  /** input type for inserting data into table "shop.product_locks" */
  ['shop_product_locks_insert_input']: {
    access_code?: string | undefined;
    created_at?: ModelTypes['timestamptz'] | undefined;
    customer_eth_address?: string | undefined;
    lock_id?: string | undefined;
  };
  /** aggregate max on columns */
  ['shop_product_locks_max_fields']: {
    access_code?: string | undefined;
    created_at?: ModelTypes['timestamptz'] | undefined;
    customer_eth_address?: string | undefined;
    lock_id?: string | undefined;
  };
  /** aggregate min on columns */
  ['shop_product_locks_min_fields']: {
    access_code?: string | undefined;
    created_at?: ModelTypes['timestamptz'] | undefined;
    customer_eth_address?: string | undefined;
    lock_id?: string | undefined;
  };
  /** response of any mutation on the table "shop.product_locks" */
  ['shop_product_locks_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<ModelTypes['shop_product_locks']>;
  };
  /** on_conflict condition type for table "shop.product_locks" */
  ['shop_product_locks_on_conflict']: {
    constraint: ModelTypes['shop_product_locks_constraint'];
    update_columns: Array<ModelTypes['shop_product_locks_update_column']>;
    where?: ModelTypes['shop_product_locks_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "shop.product_locks". */
  ['shop_product_locks_order_by']: {
    access_code?: ModelTypes['order_by'] | undefined;
    created_at?: ModelTypes['order_by'] | undefined;
    customer_eth_address?: ModelTypes['order_by'] | undefined;
    lock_id?: ModelTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: shop.product_locks */
  ['shop_product_locks_pk_columns_input']: {
    access_code: string;
    lock_id: string;
  };
  ['shop_product_locks_select_column']: shop_product_locks_select_column;
  /** input type for updating data in table "shop.product_locks" */
  ['shop_product_locks_set_input']: {
    access_code?: string | undefined;
    created_at?: ModelTypes['timestamptz'] | undefined;
    customer_eth_address?: string | undefined;
    lock_id?: string | undefined;
  };
  /** Streaming cursor of the table "shop_product_locks" */
  ['shop_product_locks_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ModelTypes['shop_product_locks_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ModelTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['shop_product_locks_stream_cursor_value_input']: {
    access_code?: string | undefined;
    created_at?: ModelTypes['timestamptz'] | undefined;
    customer_eth_address?: string | undefined;
    lock_id?: string | undefined;
  };
  ['shop_product_locks_update_column']: shop_product_locks_update_column;
  ['shop_product_locks_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?: ModelTypes['shop_product_locks_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: ModelTypes['shop_product_locks_bool_exp'];
  };
  ['subscription_root']: {
    /** fetch data from the table: "contribution_votes" */
    contribution_votes: Array<ModelTypes['contribution_votes']>;
    /** fetch aggregated fields from the table: "contribution_votes" */
    contribution_votes_aggregate: ModelTypes['contribution_votes_aggregate'];
    /** fetch data from the table: "contribution_votes" using primary key columns */
    contribution_votes_by_pk?: ModelTypes['contribution_votes'] | undefined;
    /** fetch data from the table in a streaming manner: "contribution_votes" */
    contribution_votes_stream: Array<ModelTypes['contribution_votes']>;
    /** fetch data from the table: "contributions" */
    contributions: Array<ModelTypes['contributions']>;
    /** fetch aggregated fields from the table: "contributions" */
    contributions_aggregate: ModelTypes['contributions_aggregate'];
    /** fetch data from the table: "contributions" using primary key columns */
    contributions_by_pk?: ModelTypes['contributions'] | undefined;
    /** fetch data from the table in a streaming manner: "contributions" */
    contributions_stream: Array<ModelTypes['contributions']>;
    /** An array relationship */
    contributors: Array<ModelTypes['contributors']>;
    /** An aggregate relationship */
    contributors_aggregate: ModelTypes['contributors_aggregate'];
    /** fetch data from the table: "contributors" using primary key columns */
    contributors_by_pk?: ModelTypes['contributors'] | undefined;
    /** fetch data from the table in a streaming manner: "contributors" */
    contributors_stream: Array<ModelTypes['contributors']>;
    /** fetch data from the table: "robot.merkle_claims" */
    robot_merkle_claims: Array<ModelTypes['robot_merkle_claims']>;
    /** fetch aggregated fields from the table: "robot.merkle_claims" */
    robot_merkle_claims_aggregate: ModelTypes['robot_merkle_claims_aggregate'];
    /** fetch data from the table: "robot.merkle_claims" using primary key columns */
    robot_merkle_claims_by_pk?: ModelTypes['robot_merkle_claims'] | undefined;
    /** fetch data from the table in a streaming manner: "robot.merkle_claims" */
    robot_merkle_claims_stream: Array<ModelTypes['robot_merkle_claims']>;
    /** fetch data from the table: "robot.merkle_roots" */
    robot_merkle_roots: Array<ModelTypes['robot_merkle_roots']>;
    /** fetch aggregated fields from the table: "robot.merkle_roots" */
    robot_merkle_roots_aggregate: ModelTypes['robot_merkle_roots_aggregate'];
    /** fetch data from the table: "robot.merkle_roots" using primary key columns */
    robot_merkle_roots_by_pk?: ModelTypes['robot_merkle_roots'] | undefined;
    /** fetch data from the table in a streaming manner: "robot.merkle_roots" */
    robot_merkle_roots_stream: Array<ModelTypes['robot_merkle_roots']>;
    /** fetch data from the table: "robot.order" */
    robot_order: Array<ModelTypes['robot_order']>;
    /** fetch aggregated fields from the table: "robot.order" */
    robot_order_aggregate: ModelTypes['robot_order_aggregate'];
    /** fetch data from the table: "robot.order" using primary key columns */
    robot_order_by_pk?: ModelTypes['robot_order'] | undefined;
    /** fetch data from the table in a streaming manner: "robot.order" */
    robot_order_stream: Array<ModelTypes['robot_order']>;
    /** fetch data from the table: "robot.product" */
    robot_product: Array<ModelTypes['robot_product']>;
    /** fetch aggregated fields from the table: "robot.product" */
    robot_product_aggregate: ModelTypes['robot_product_aggregate'];
    /** fetch data from the table: "robot.product" using primary key columns */
    robot_product_by_pk?: ModelTypes['robot_product'] | undefined;
    /** fetch data from the table: "robot.product_designer" */
    robot_product_designer: Array<ModelTypes['robot_product_designer']>;
    /** fetch aggregated fields from the table: "robot.product_designer" */
    robot_product_designer_aggregate: ModelTypes['robot_product_designer_aggregate'];
    /** fetch data from the table: "robot.product_designer" using primary key columns */
    robot_product_designer_by_pk?:
      | ModelTypes['robot_product_designer']
      | undefined;
    /** fetch data from the table in a streaming manner: "robot.product_designer" */
    robot_product_designer_stream: Array<ModelTypes['robot_product_designer']>;
    /** fetch data from the table in a streaming manner: "robot.product" */
    robot_product_stream: Array<ModelTypes['robot_product']>;
    /** fetch data from the table: "shop.api_users" */
    shop_api_users: Array<ModelTypes['shop_api_users']>;
    /** fetch aggregated fields from the table: "shop.api_users" */
    shop_api_users_aggregate: ModelTypes['shop_api_users_aggregate'];
    /** fetch data from the table: "shop.api_users" using primary key columns */
    shop_api_users_by_pk?: ModelTypes['shop_api_users'] | undefined;
    /** fetch data from the table in a streaming manner: "shop.api_users" */
    shop_api_users_stream: Array<ModelTypes['shop_api_users']>;
    /** fetch data from the table: "shop.product_locks" */
    shop_product_locks: Array<ModelTypes['shop_product_locks']>;
    /** fetch aggregated fields from the table: "shop.product_locks" */
    shop_product_locks_aggregate: ModelTypes['shop_product_locks_aggregate'];
    /** fetch data from the table: "shop.product_locks" using primary key columns */
    shop_product_locks_by_pk?: ModelTypes['shop_product_locks'] | undefined;
    /** fetch data from the table in a streaming manner: "shop.product_locks" */
    shop_product_locks_stream: Array<ModelTypes['shop_product_locks']>;
    /** fetch data from the table: "users" */
    users: Array<ModelTypes['users']>;
    /** fetch aggregated fields from the table: "users" */
    users_aggregate: ModelTypes['users_aggregate'];
    /** fetch data from the table: "users" using primary key columns */
    users_by_pk?: ModelTypes['users'] | undefined;
    /** fetch data from the table in a streaming manner: "users" */
    users_stream: Array<ModelTypes['users']>;
  };
  ['timestamptz']: any;
  /** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
  ['timestamptz_comparison_exp']: {
    _eq?: ModelTypes['timestamptz'] | undefined;
    _gt?: ModelTypes['timestamptz'] | undefined;
    _gte?: ModelTypes['timestamptz'] | undefined;
    _in?: Array<ModelTypes['timestamptz']> | undefined;
    _is_null?: boolean | undefined;
    _lt?: ModelTypes['timestamptz'] | undefined;
    _lte?: ModelTypes['timestamptz'] | undefined;
    _neq?: ModelTypes['timestamptz'] | undefined;
    _nin?: Array<ModelTypes['timestamptz']> | undefined;
  };
  /** columns and relationships of "users" */
  ['users']: {
    eth_address: string;
    id: ModelTypes['uuid'];
    name: string;
  };
  /** aggregated selection of "users" */
  ['users_aggregate']: {
    aggregate?: ModelTypes['users_aggregate_fields'] | undefined;
    nodes: Array<ModelTypes['users']>;
  };
  /** aggregate fields of "users" */
  ['users_aggregate_fields']: {
    count: number;
    max?: ModelTypes['users_max_fields'] | undefined;
    min?: ModelTypes['users_min_fields'] | undefined;
  };
  /** Boolean expression to filter rows from the table "users". All fields are combined with a logical 'AND'. */
  ['users_bool_exp']: {
    _and?: Array<ModelTypes['users_bool_exp']> | undefined;
    _not?: ModelTypes['users_bool_exp'] | undefined;
    _or?: Array<ModelTypes['users_bool_exp']> | undefined;
    eth_address?: ModelTypes['String_comparison_exp'] | undefined;
    id?: ModelTypes['uuid_comparison_exp'] | undefined;
    name?: ModelTypes['String_comparison_exp'] | undefined;
  };
  ['users_constraint']: users_constraint;
  /** input type for inserting data into table "users" */
  ['users_insert_input']: {
    eth_address?: string | undefined;
    id?: ModelTypes['uuid'] | undefined;
    name?: string | undefined;
  };
  /** aggregate max on columns */
  ['users_max_fields']: {
    eth_address?: string | undefined;
    id?: ModelTypes['uuid'] | undefined;
    name?: string | undefined;
  };
  /** aggregate min on columns */
  ['users_min_fields']: {
    eth_address?: string | undefined;
    id?: ModelTypes['uuid'] | undefined;
    name?: string | undefined;
  };
  /** response of any mutation on the table "users" */
  ['users_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<ModelTypes['users']>;
  };
  /** input type for inserting object relation for remote table "users" */
  ['users_obj_rel_insert_input']: {
    data: ModelTypes['users_insert_input'];
    /** upsert condition */
    on_conflict?: ModelTypes['users_on_conflict'] | undefined;
  };
  /** on_conflict condition type for table "users" */
  ['users_on_conflict']: {
    constraint: ModelTypes['users_constraint'];
    update_columns: Array<ModelTypes['users_update_column']>;
    where?: ModelTypes['users_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "users". */
  ['users_order_by']: {
    eth_address?: ModelTypes['order_by'] | undefined;
    id?: ModelTypes['order_by'] | undefined;
    name?: ModelTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: users */
  ['users_pk_columns_input']: {
    id: ModelTypes['uuid'];
  };
  ['users_select_column']: users_select_column;
  /** input type for updating data in table "users" */
  ['users_set_input']: {
    eth_address?: string | undefined;
    id?: ModelTypes['uuid'] | undefined;
    name?: string | undefined;
  };
  /** Streaming cursor of the table "users" */
  ['users_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: ModelTypes['users_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: ModelTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['users_stream_cursor_value_input']: {
    eth_address?: string | undefined;
    id?: ModelTypes['uuid'] | undefined;
    name?: string | undefined;
  };
  ['users_update_column']: users_update_column;
  ['users_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?: ModelTypes['users_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: ModelTypes['users_bool_exp'];
  };
  ['uuid']: any;
  /** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
  ['uuid_comparison_exp']: {
    _eq?: ModelTypes['uuid'] | undefined;
    _gt?: ModelTypes['uuid'] | undefined;
    _gte?: ModelTypes['uuid'] | undefined;
    _in?: Array<ModelTypes['uuid']> | undefined;
    _is_null?: boolean | undefined;
    _lt?: ModelTypes['uuid'] | undefined;
    _lte?: ModelTypes['uuid'] | undefined;
    _neq?: ModelTypes['uuid'] | undefined;
    _nin?: Array<ModelTypes['uuid']> | undefined;
  };
};

export type GraphQLTypes = {
  /** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
  ['Int_comparison_exp']: {
    _eq?: number | undefined;
    _gt?: number | undefined;
    _gte?: number | undefined;
    _in?: Array<number> | undefined;
    _is_null?: boolean | undefined;
    _lt?: number | undefined;
    _lte?: number | undefined;
    _neq?: number | undefined;
    _nin?: Array<number> | undefined;
  };
  /** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
  ['String_comparison_exp']: {
    _eq?: string | undefined;
    _gt?: string | undefined;
    _gte?: string | undefined;
    /** does the column match the given case-insensitive pattern */
    _ilike?: string | undefined;
    _in?: Array<string> | undefined;
    /** does the column match the given POSIX regular expression, case insensitive */
    _iregex?: string | undefined;
    _is_null?: boolean | undefined;
    /** does the column match the given pattern */
    _like?: string | undefined;
    _lt?: string | undefined;
    _lte?: string | undefined;
    _neq?: string | undefined;
    /** does the column NOT match the given case-insensitive pattern */
    _nilike?: string | undefined;
    _nin?: Array<string> | undefined;
    /** does the column NOT match the given POSIX regular expression, case insensitive */
    _niregex?: string | undefined;
    /** does the column NOT match the given pattern */
    _nlike?: string | undefined;
    /** does the column NOT match the given POSIX regular expression, case sensitive */
    _nregex?: string | undefined;
    /** does the column NOT match the given SQL regular expression */
    _nsimilar?: string | undefined;
    /** does the column match the given POSIX regular expression, case sensitive */
    _regex?: string | undefined;
    /** does the column match the given SQL regular expression */
    _similar?: string | undefined;
  };
  /** columns and relationships of "contribution_votes" */
  ['contribution_votes']: {
    __typename: 'contribution_votes';
    /** An object relationship */
    contribution: GraphQLTypes['contributions'];
    contribution_id: GraphQLTypes['uuid'];
    rating: string;
    /** An object relationship */
    user: GraphQLTypes['users'];
    user_id: GraphQLTypes['uuid'];
  };
  /** aggregated selection of "contribution_votes" */
  ['contribution_votes_aggregate']: {
    __typename: 'contribution_votes_aggregate';
    aggregate?: GraphQLTypes['contribution_votes_aggregate_fields'] | undefined;
    nodes: Array<GraphQLTypes['contribution_votes']>;
  };
  ['contribution_votes_aggregate_bool_exp']: {
    count?:
      | GraphQLTypes['contribution_votes_aggregate_bool_exp_count']
      | undefined;
  };
  ['contribution_votes_aggregate_bool_exp_count']: {
    arguments?:
      | Array<GraphQLTypes['contribution_votes_select_column']>
      | undefined;
    distinct?: boolean | undefined;
    filter?: GraphQLTypes['contribution_votes_bool_exp'] | undefined;
    predicate: GraphQLTypes['Int_comparison_exp'];
  };
  /** aggregate fields of "contribution_votes" */
  ['contribution_votes_aggregate_fields']: {
    __typename: 'contribution_votes_aggregate_fields';
    count: number;
    max?: GraphQLTypes['contribution_votes_max_fields'] | undefined;
    min?: GraphQLTypes['contribution_votes_min_fields'] | undefined;
  };
  /** order by aggregate values of table "contribution_votes" */
  ['contribution_votes_aggregate_order_by']: {
    count?: GraphQLTypes['order_by'] | undefined;
    max?: GraphQLTypes['contribution_votes_max_order_by'] | undefined;
    min?: GraphQLTypes['contribution_votes_min_order_by'] | undefined;
  };
  /** input type for inserting array relation for remote table "contribution_votes" */
  ['contribution_votes_arr_rel_insert_input']: {
    data: Array<GraphQLTypes['contribution_votes_insert_input']>;
    /** upsert condition */
    on_conflict?: GraphQLTypes['contribution_votes_on_conflict'] | undefined;
  };
  /** Boolean expression to filter rows from the table "contribution_votes". All fields are combined with a logical 'AND'. */
  ['contribution_votes_bool_exp']: {
    _and?: Array<GraphQLTypes['contribution_votes_bool_exp']> | undefined;
    _not?: GraphQLTypes['contribution_votes_bool_exp'] | undefined;
    _or?: Array<GraphQLTypes['contribution_votes_bool_exp']> | undefined;
    contribution?: GraphQLTypes['contributions_bool_exp'] | undefined;
    contribution_id?: GraphQLTypes['uuid_comparison_exp'] | undefined;
    rating?: GraphQLTypes['String_comparison_exp'] | undefined;
    user?: GraphQLTypes['users_bool_exp'] | undefined;
    user_id?: GraphQLTypes['uuid_comparison_exp'] | undefined;
  };
  /** unique or primary key constraints on table "contribution_votes" */
  ['contribution_votes_constraint']: contribution_votes_constraint;
  /** input type for inserting data into table "contribution_votes" */
  ['contribution_votes_insert_input']: {
    contribution?:
      | GraphQLTypes['contributions_obj_rel_insert_input']
      | undefined;
    contribution_id?: GraphQLTypes['uuid'] | undefined;
    rating?: string | undefined;
    user?: GraphQLTypes['users_obj_rel_insert_input'] | undefined;
    user_id?: GraphQLTypes['uuid'] | undefined;
  };
  /** aggregate max on columns */
  ['contribution_votes_max_fields']: {
    __typename: 'contribution_votes_max_fields';
    contribution_id?: GraphQLTypes['uuid'] | undefined;
    rating?: string | undefined;
    user_id?: GraphQLTypes['uuid'] | undefined;
  };
  /** order by max() on columns of table "contribution_votes" */
  ['contribution_votes_max_order_by']: {
    contribution_id?: GraphQLTypes['order_by'] | undefined;
    rating?: GraphQLTypes['order_by'] | undefined;
    user_id?: GraphQLTypes['order_by'] | undefined;
  };
  /** aggregate min on columns */
  ['contribution_votes_min_fields']: {
    __typename: 'contribution_votes_min_fields';
    contribution_id?: GraphQLTypes['uuid'] | undefined;
    rating?: string | undefined;
    user_id?: GraphQLTypes['uuid'] | undefined;
  };
  /** order by min() on columns of table "contribution_votes" */
  ['contribution_votes_min_order_by']: {
    contribution_id?: GraphQLTypes['order_by'] | undefined;
    rating?: GraphQLTypes['order_by'] | undefined;
    user_id?: GraphQLTypes['order_by'] | undefined;
  };
  /** response of any mutation on the table "contribution_votes" */
  ['contribution_votes_mutation_response']: {
    __typename: 'contribution_votes_mutation_response';
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<GraphQLTypes['contribution_votes']>;
  };
  /** on_conflict condition type for table "contribution_votes" */
  ['contribution_votes_on_conflict']: {
    constraint: GraphQLTypes['contribution_votes_constraint'];
    update_columns: Array<GraphQLTypes['contribution_votes_update_column']>;
    where?: GraphQLTypes['contribution_votes_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "contribution_votes". */
  ['contribution_votes_order_by']: {
    contribution?: GraphQLTypes['contributions_order_by'] | undefined;
    contribution_id?: GraphQLTypes['order_by'] | undefined;
    rating?: GraphQLTypes['order_by'] | undefined;
    user?: GraphQLTypes['users_order_by'] | undefined;
    user_id?: GraphQLTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: contribution_votes */
  ['contribution_votes_pk_columns_input']: {
    contribution_id: GraphQLTypes['uuid'];
    user_id: GraphQLTypes['uuid'];
  };
  /** select columns of table "contribution_votes" */
  ['contribution_votes_select_column']: contribution_votes_select_column;
  /** input type for updating data in table "contribution_votes" */
  ['contribution_votes_set_input']: {
    contribution_id?: GraphQLTypes['uuid'] | undefined;
    rating?: string | undefined;
    user_id?: GraphQLTypes['uuid'] | undefined;
  };
  /** Streaming cursor of the table "contribution_votes" */
  ['contribution_votes_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: GraphQLTypes['contribution_votes_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: GraphQLTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['contribution_votes_stream_cursor_value_input']: {
    contribution_id?: GraphQLTypes['uuid'] | undefined;
    rating?: string | undefined;
    user_id?: GraphQLTypes['uuid'] | undefined;
  };
  /** update columns of table "contribution_votes" */
  ['contribution_votes_update_column']: contribution_votes_update_column;
  ['contribution_votes_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?: GraphQLTypes['contribution_votes_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: GraphQLTypes['contribution_votes_bool_exp'];
  };
  /** columns and relationships of "contributions" */
  ['contributions']: {
    __typename: 'contributions';
    artifact?: string | undefined;
    /** An object relationship */
    author: GraphQLTypes['users'];
    category?: string | undefined;
    /** An array relationship */
    contributors: Array<GraphQLTypes['contributors']>;
    /** An aggregate relationship */
    contributors_aggregate: GraphQLTypes['contributors_aggregate'];
    created_at: GraphQLTypes['timestamptz'];
    created_by: GraphQLTypes['uuid'];
    date: GraphQLTypes['date'];
    description?: string | undefined;
    effort?: string | undefined;
    id: GraphQLTypes['uuid'];
    impact?: string | undefined;
    title: string;
    /** An array relationship */
    votes: Array<GraphQLTypes['contribution_votes']>;
    /** An aggregate relationship */
    votes_aggregate: GraphQLTypes['contribution_votes_aggregate'];
    weight?: number | undefined;
  };
  /** aggregated selection of "contributions" */
  ['contributions_aggregate']: {
    __typename: 'contributions_aggregate';
    aggregate?: GraphQLTypes['contributions_aggregate_fields'] | undefined;
    nodes: Array<GraphQLTypes['contributions']>;
  };
  /** aggregate fields of "contributions" */
  ['contributions_aggregate_fields']: {
    __typename: 'contributions_aggregate_fields';
    avg?: GraphQLTypes['contributions_avg_fields'] | undefined;
    count: number;
    max?: GraphQLTypes['contributions_max_fields'] | undefined;
    min?: GraphQLTypes['contributions_min_fields'] | undefined;
    stddev?: GraphQLTypes['contributions_stddev_fields'] | undefined;
    stddev_pop?: GraphQLTypes['contributions_stddev_pop_fields'] | undefined;
    stddev_samp?: GraphQLTypes['contributions_stddev_samp_fields'] | undefined;
    sum?: GraphQLTypes['contributions_sum_fields'] | undefined;
    var_pop?: GraphQLTypes['contributions_var_pop_fields'] | undefined;
    var_samp?: GraphQLTypes['contributions_var_samp_fields'] | undefined;
    variance?: GraphQLTypes['contributions_variance_fields'] | undefined;
  };
  /** aggregate avg on columns */
  ['contributions_avg_fields']: {
    __typename: 'contributions_avg_fields';
    weight?: number | undefined;
  };
  /** Boolean expression to filter rows from the table "contributions". All fields are combined with a logical 'AND'. */
  ['contributions_bool_exp']: {
    _and?: Array<GraphQLTypes['contributions_bool_exp']> | undefined;
    _not?: GraphQLTypes['contributions_bool_exp'] | undefined;
    _or?: Array<GraphQLTypes['contributions_bool_exp']> | undefined;
    artifact?: GraphQLTypes['String_comparison_exp'] | undefined;
    author?: GraphQLTypes['users_bool_exp'] | undefined;
    category?: GraphQLTypes['String_comparison_exp'] | undefined;
    contributors?: GraphQLTypes['contributors_bool_exp'] | undefined;
    contributors_aggregate?:
      | GraphQLTypes['contributors_aggregate_bool_exp']
      | undefined;
    created_at?: GraphQLTypes['timestamptz_comparison_exp'] | undefined;
    created_by?: GraphQLTypes['uuid_comparison_exp'] | undefined;
    date?: GraphQLTypes['date_comparison_exp'] | undefined;
    description?: GraphQLTypes['String_comparison_exp'] | undefined;
    effort?: GraphQLTypes['String_comparison_exp'] | undefined;
    id?: GraphQLTypes['uuid_comparison_exp'] | undefined;
    impact?: GraphQLTypes['String_comparison_exp'] | undefined;
    title?: GraphQLTypes['String_comparison_exp'] | undefined;
    votes?: GraphQLTypes['contribution_votes_bool_exp'] | undefined;
    votes_aggregate?:
      | GraphQLTypes['contribution_votes_aggregate_bool_exp']
      | undefined;
    weight?: GraphQLTypes['Int_comparison_exp'] | undefined;
  };
  /** unique or primary key constraints on table "contributions" */
  ['contributions_constraint']: contributions_constraint;
  /** input type for incrementing numeric columns in table "contributions" */
  ['contributions_inc_input']: {
    weight?: number | undefined;
  };
  /** input type for inserting data into table "contributions" */
  ['contributions_insert_input']: {
    artifact?: string | undefined;
    author?: GraphQLTypes['users_obj_rel_insert_input'] | undefined;
    category?: string | undefined;
    contributors?:
      | GraphQLTypes['contributors_arr_rel_insert_input']
      | undefined;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    created_by?: GraphQLTypes['uuid'] | undefined;
    date?: GraphQLTypes['date'] | undefined;
    description?: string | undefined;
    effort?: string | undefined;
    id?: GraphQLTypes['uuid'] | undefined;
    impact?: string | undefined;
    title?: string | undefined;
    votes?: GraphQLTypes['contribution_votes_arr_rel_insert_input'] | undefined;
    weight?: number | undefined;
  };
  /** aggregate max on columns */
  ['contributions_max_fields']: {
    __typename: 'contributions_max_fields';
    artifact?: string | undefined;
    category?: string | undefined;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    created_by?: GraphQLTypes['uuid'] | undefined;
    date?: GraphQLTypes['date'] | undefined;
    description?: string | undefined;
    effort?: string | undefined;
    id?: GraphQLTypes['uuid'] | undefined;
    impact?: string | undefined;
    title?: string | undefined;
    weight?: number | undefined;
  };
  /** aggregate min on columns */
  ['contributions_min_fields']: {
    __typename: 'contributions_min_fields';
    artifact?: string | undefined;
    category?: string | undefined;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    created_by?: GraphQLTypes['uuid'] | undefined;
    date?: GraphQLTypes['date'] | undefined;
    description?: string | undefined;
    effort?: string | undefined;
    id?: GraphQLTypes['uuid'] | undefined;
    impact?: string | undefined;
    title?: string | undefined;
    weight?: number | undefined;
  };
  /** response of any mutation on the table "contributions" */
  ['contributions_mutation_response']: {
    __typename: 'contributions_mutation_response';
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<GraphQLTypes['contributions']>;
  };
  /** input type for inserting object relation for remote table "contributions" */
  ['contributions_obj_rel_insert_input']: {
    data: GraphQLTypes['contributions_insert_input'];
    /** upsert condition */
    on_conflict?: GraphQLTypes['contributions_on_conflict'] | undefined;
  };
  /** on_conflict condition type for table "contributions" */
  ['contributions_on_conflict']: {
    constraint: GraphQLTypes['contributions_constraint'];
    update_columns: Array<GraphQLTypes['contributions_update_column']>;
    where?: GraphQLTypes['contributions_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "contributions". */
  ['contributions_order_by']: {
    artifact?: GraphQLTypes['order_by'] | undefined;
    author?: GraphQLTypes['users_order_by'] | undefined;
    category?: GraphQLTypes['order_by'] | undefined;
    contributors_aggregate?:
      | GraphQLTypes['contributors_aggregate_order_by']
      | undefined;
    created_at?: GraphQLTypes['order_by'] | undefined;
    created_by?: GraphQLTypes['order_by'] | undefined;
    date?: GraphQLTypes['order_by'] | undefined;
    description?: GraphQLTypes['order_by'] | undefined;
    effort?: GraphQLTypes['order_by'] | undefined;
    id?: GraphQLTypes['order_by'] | undefined;
    impact?: GraphQLTypes['order_by'] | undefined;
    title?: GraphQLTypes['order_by'] | undefined;
    votes_aggregate?:
      | GraphQLTypes['contribution_votes_aggregate_order_by']
      | undefined;
    weight?: GraphQLTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: contributions */
  ['contributions_pk_columns_input']: {
    id: GraphQLTypes['uuid'];
  };
  /** select columns of table "contributions" */
  ['contributions_select_column']: contributions_select_column;
  /** input type for updating data in table "contributions" */
  ['contributions_set_input']: {
    artifact?: string | undefined;
    category?: string | undefined;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    created_by?: GraphQLTypes['uuid'] | undefined;
    date?: GraphQLTypes['date'] | undefined;
    description?: string | undefined;
    effort?: string | undefined;
    id?: GraphQLTypes['uuid'] | undefined;
    impact?: string | undefined;
    title?: string | undefined;
    weight?: number | undefined;
  };
  /** aggregate stddev on columns */
  ['contributions_stddev_fields']: {
    __typename: 'contributions_stddev_fields';
    weight?: number | undefined;
  };
  /** aggregate stddev_pop on columns */
  ['contributions_stddev_pop_fields']: {
    __typename: 'contributions_stddev_pop_fields';
    weight?: number | undefined;
  };
  /** aggregate stddev_samp on columns */
  ['contributions_stddev_samp_fields']: {
    __typename: 'contributions_stddev_samp_fields';
    weight?: number | undefined;
  };
  /** Streaming cursor of the table "contributions" */
  ['contributions_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: GraphQLTypes['contributions_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: GraphQLTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['contributions_stream_cursor_value_input']: {
    artifact?: string | undefined;
    category?: string | undefined;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    created_by?: GraphQLTypes['uuid'] | undefined;
    date?: GraphQLTypes['date'] | undefined;
    description?: string | undefined;
    effort?: string | undefined;
    id?: GraphQLTypes['uuid'] | undefined;
    impact?: string | undefined;
    title?: string | undefined;
    weight?: number | undefined;
  };
  /** aggregate sum on columns */
  ['contributions_sum_fields']: {
    __typename: 'contributions_sum_fields';
    weight?: number | undefined;
  };
  /** update columns of table "contributions" */
  ['contributions_update_column']: contributions_update_column;
  ['contributions_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?: GraphQLTypes['contributions_inc_input'] | undefined;
    /** sets the columns of the filtered rows to the given values */
    _set?: GraphQLTypes['contributions_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: GraphQLTypes['contributions_bool_exp'];
  };
  /** aggregate var_pop on columns */
  ['contributions_var_pop_fields']: {
    __typename: 'contributions_var_pop_fields';
    weight?: number | undefined;
  };
  /** aggregate var_samp on columns */
  ['contributions_var_samp_fields']: {
    __typename: 'contributions_var_samp_fields';
    weight?: number | undefined;
  };
  /** aggregate variance on columns */
  ['contributions_variance_fields']: {
    __typename: 'contributions_variance_fields';
    weight?: number | undefined;
  };
  /** columns and relationships of "contributors" */
  ['contributors']: {
    __typename: 'contributors';
    /** An object relationship */
    contribution: GraphQLTypes['contributions'];
    contribution_id: GraphQLTypes['uuid'];
    contribution_share: GraphQLTypes['numeric'];
    /** An object relationship */
    user: GraphQLTypes['users'];
    user_id: GraphQLTypes['uuid'];
  };
  /** aggregated selection of "contributors" */
  ['contributors_aggregate']: {
    __typename: 'contributors_aggregate';
    aggregate?: GraphQLTypes['contributors_aggregate_fields'] | undefined;
    nodes: Array<GraphQLTypes['contributors']>;
  };
  ['contributors_aggregate_bool_exp']: {
    count?: GraphQLTypes['contributors_aggregate_bool_exp_count'] | undefined;
  };
  ['contributors_aggregate_bool_exp_count']: {
    arguments?: Array<GraphQLTypes['contributors_select_column']> | undefined;
    distinct?: boolean | undefined;
    filter?: GraphQLTypes['contributors_bool_exp'] | undefined;
    predicate: GraphQLTypes['Int_comparison_exp'];
  };
  /** aggregate fields of "contributors" */
  ['contributors_aggregate_fields']: {
    __typename: 'contributors_aggregate_fields';
    avg?: GraphQLTypes['contributors_avg_fields'] | undefined;
    count: number;
    max?: GraphQLTypes['contributors_max_fields'] | undefined;
    min?: GraphQLTypes['contributors_min_fields'] | undefined;
    stddev?: GraphQLTypes['contributors_stddev_fields'] | undefined;
    stddev_pop?: GraphQLTypes['contributors_stddev_pop_fields'] | undefined;
    stddev_samp?: GraphQLTypes['contributors_stddev_samp_fields'] | undefined;
    sum?: GraphQLTypes['contributors_sum_fields'] | undefined;
    var_pop?: GraphQLTypes['contributors_var_pop_fields'] | undefined;
    var_samp?: GraphQLTypes['contributors_var_samp_fields'] | undefined;
    variance?: GraphQLTypes['contributors_variance_fields'] | undefined;
  };
  /** order by aggregate values of table "contributors" */
  ['contributors_aggregate_order_by']: {
    avg?: GraphQLTypes['contributors_avg_order_by'] | undefined;
    count?: GraphQLTypes['order_by'] | undefined;
    max?: GraphQLTypes['contributors_max_order_by'] | undefined;
    min?: GraphQLTypes['contributors_min_order_by'] | undefined;
    stddev?: GraphQLTypes['contributors_stddev_order_by'] | undefined;
    stddev_pop?: GraphQLTypes['contributors_stddev_pop_order_by'] | undefined;
    stddev_samp?: GraphQLTypes['contributors_stddev_samp_order_by'] | undefined;
    sum?: GraphQLTypes['contributors_sum_order_by'] | undefined;
    var_pop?: GraphQLTypes['contributors_var_pop_order_by'] | undefined;
    var_samp?: GraphQLTypes['contributors_var_samp_order_by'] | undefined;
    variance?: GraphQLTypes['contributors_variance_order_by'] | undefined;
  };
  /** input type for inserting array relation for remote table "contributors" */
  ['contributors_arr_rel_insert_input']: {
    data: Array<GraphQLTypes['contributors_insert_input']>;
    /** upsert condition */
    on_conflict?: GraphQLTypes['contributors_on_conflict'] | undefined;
  };
  /** aggregate avg on columns */
  ['contributors_avg_fields']: {
    __typename: 'contributors_avg_fields';
    contribution_share?: number | undefined;
  };
  /** order by avg() on columns of table "contributors" */
  ['contributors_avg_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
  };
  /** Boolean expression to filter rows from the table "contributors". All fields are combined with a logical 'AND'. */
  ['contributors_bool_exp']: {
    _and?: Array<GraphQLTypes['contributors_bool_exp']> | undefined;
    _not?: GraphQLTypes['contributors_bool_exp'] | undefined;
    _or?: Array<GraphQLTypes['contributors_bool_exp']> | undefined;
    contribution?: GraphQLTypes['contributions_bool_exp'] | undefined;
    contribution_id?: GraphQLTypes['uuid_comparison_exp'] | undefined;
    contribution_share?: GraphQLTypes['numeric_comparison_exp'] | undefined;
    user?: GraphQLTypes['users_bool_exp'] | undefined;
    user_id?: GraphQLTypes['uuid_comparison_exp'] | undefined;
  };
  /** unique or primary key constraints on table "contributors" */
  ['contributors_constraint']: contributors_constraint;
  /** input type for incrementing numeric columns in table "contributors" */
  ['contributors_inc_input']: {
    contribution_share?: GraphQLTypes['numeric'] | undefined;
  };
  /** input type for inserting data into table "contributors" */
  ['contributors_insert_input']: {
    contribution?:
      | GraphQLTypes['contributions_obj_rel_insert_input']
      | undefined;
    contribution_id?: GraphQLTypes['uuid'] | undefined;
    contribution_share?: GraphQLTypes['numeric'] | undefined;
    user?: GraphQLTypes['users_obj_rel_insert_input'] | undefined;
    user_id?: GraphQLTypes['uuid'] | undefined;
  };
  /** aggregate max on columns */
  ['contributors_max_fields']: {
    __typename: 'contributors_max_fields';
    contribution_id?: GraphQLTypes['uuid'] | undefined;
    contribution_share?: GraphQLTypes['numeric'] | undefined;
    user_id?: GraphQLTypes['uuid'] | undefined;
  };
  /** order by max() on columns of table "contributors" */
  ['contributors_max_order_by']: {
    contribution_id?: GraphQLTypes['order_by'] | undefined;
    contribution_share?: GraphQLTypes['order_by'] | undefined;
    user_id?: GraphQLTypes['order_by'] | undefined;
  };
  /** aggregate min on columns */
  ['contributors_min_fields']: {
    __typename: 'contributors_min_fields';
    contribution_id?: GraphQLTypes['uuid'] | undefined;
    contribution_share?: GraphQLTypes['numeric'] | undefined;
    user_id?: GraphQLTypes['uuid'] | undefined;
  };
  /** order by min() on columns of table "contributors" */
  ['contributors_min_order_by']: {
    contribution_id?: GraphQLTypes['order_by'] | undefined;
    contribution_share?: GraphQLTypes['order_by'] | undefined;
    user_id?: GraphQLTypes['order_by'] | undefined;
  };
  /** response of any mutation on the table "contributors" */
  ['contributors_mutation_response']: {
    __typename: 'contributors_mutation_response';
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<GraphQLTypes['contributors']>;
  };
  /** on_conflict condition type for table "contributors" */
  ['contributors_on_conflict']: {
    constraint: GraphQLTypes['contributors_constraint'];
    update_columns: Array<GraphQLTypes['contributors_update_column']>;
    where?: GraphQLTypes['contributors_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "contributors". */
  ['contributors_order_by']: {
    contribution?: GraphQLTypes['contributions_order_by'] | undefined;
    contribution_id?: GraphQLTypes['order_by'] | undefined;
    contribution_share?: GraphQLTypes['order_by'] | undefined;
    user?: GraphQLTypes['users_order_by'] | undefined;
    user_id?: GraphQLTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: contributors */
  ['contributors_pk_columns_input']: {
    contribution_id: GraphQLTypes['uuid'];
    user_id: GraphQLTypes['uuid'];
  };
  /** select columns of table "contributors" */
  ['contributors_select_column']: contributors_select_column;
  /** input type for updating data in table "contributors" */
  ['contributors_set_input']: {
    contribution_id?: GraphQLTypes['uuid'] | undefined;
    contribution_share?: GraphQLTypes['numeric'] | undefined;
    user_id?: GraphQLTypes['uuid'] | undefined;
  };
  /** aggregate stddev on columns */
  ['contributors_stddev_fields']: {
    __typename: 'contributors_stddev_fields';
    contribution_share?: number | undefined;
  };
  /** order by stddev() on columns of table "contributors" */
  ['contributors_stddev_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
  };
  /** aggregate stddev_pop on columns */
  ['contributors_stddev_pop_fields']: {
    __typename: 'contributors_stddev_pop_fields';
    contribution_share?: number | undefined;
  };
  /** order by stddev_pop() on columns of table "contributors" */
  ['contributors_stddev_pop_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
  };
  /** aggregate stddev_samp on columns */
  ['contributors_stddev_samp_fields']: {
    __typename: 'contributors_stddev_samp_fields';
    contribution_share?: number | undefined;
  };
  /** order by stddev_samp() on columns of table "contributors" */
  ['contributors_stddev_samp_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
  };
  /** Streaming cursor of the table "contributors" */
  ['contributors_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: GraphQLTypes['contributors_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: GraphQLTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['contributors_stream_cursor_value_input']: {
    contribution_id?: GraphQLTypes['uuid'] | undefined;
    contribution_share?: GraphQLTypes['numeric'] | undefined;
    user_id?: GraphQLTypes['uuid'] | undefined;
  };
  /** aggregate sum on columns */
  ['contributors_sum_fields']: {
    __typename: 'contributors_sum_fields';
    contribution_share?: GraphQLTypes['numeric'] | undefined;
  };
  /** order by sum() on columns of table "contributors" */
  ['contributors_sum_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
  };
  /** update columns of table "contributors" */
  ['contributors_update_column']: contributors_update_column;
  ['contributors_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?: GraphQLTypes['contributors_inc_input'] | undefined;
    /** sets the columns of the filtered rows to the given values */
    _set?: GraphQLTypes['contributors_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: GraphQLTypes['contributors_bool_exp'];
  };
  /** aggregate var_pop on columns */
  ['contributors_var_pop_fields']: {
    __typename: 'contributors_var_pop_fields';
    contribution_share?: number | undefined;
  };
  /** order by var_pop() on columns of table "contributors" */
  ['contributors_var_pop_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
  };
  /** aggregate var_samp on columns */
  ['contributors_var_samp_fields']: {
    __typename: 'contributors_var_samp_fields';
    contribution_share?: number | undefined;
  };
  /** order by var_samp() on columns of table "contributors" */
  ['contributors_var_samp_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
  };
  /** aggregate variance on columns */
  ['contributors_variance_fields']: {
    __typename: 'contributors_variance_fields';
    contribution_share?: number | undefined;
  };
  /** order by variance() on columns of table "contributors" */
  ['contributors_variance_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
  };
  /** ordering argument of a cursor */
  ['cursor_ordering']: cursor_ordering;
  ['date']: 'scalar' & { name: 'date' };
  /** Boolean expression to compare columns of type "date". All fields are combined with logical 'AND'. */
  ['date_comparison_exp']: {
    _eq?: GraphQLTypes['date'] | undefined;
    _gt?: GraphQLTypes['date'] | undefined;
    _gte?: GraphQLTypes['date'] | undefined;
    _in?: Array<GraphQLTypes['date']> | undefined;
    _is_null?: boolean | undefined;
    _lt?: GraphQLTypes['date'] | undefined;
    _lte?: GraphQLTypes['date'] | undefined;
    _neq?: GraphQLTypes['date'] | undefined;
    _nin?: Array<GraphQLTypes['date']> | undefined;
  };
  ['jsonb']: 'scalar' & { name: 'jsonb' };
  ['jsonb_cast_exp']: {
    String?: GraphQLTypes['String_comparison_exp'] | undefined;
  };
  /** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
  ['jsonb_comparison_exp']: {
    _cast?: GraphQLTypes['jsonb_cast_exp'] | undefined;
    /** is the column contained in the given json value */
    _contained_in?: GraphQLTypes['jsonb'] | undefined;
    /** does the column contain the given json value at the top level */
    _contains?: GraphQLTypes['jsonb'] | undefined;
    _eq?: GraphQLTypes['jsonb'] | undefined;
    _gt?: GraphQLTypes['jsonb'] | undefined;
    _gte?: GraphQLTypes['jsonb'] | undefined;
    /** does the string exist as a top-level key in the column */
    _has_key?: string | undefined;
    /** do all of these strings exist as top-level keys in the column */
    _has_keys_all?: Array<string> | undefined;
    /** do any of these strings exist as top-level keys in the column */
    _has_keys_any?: Array<string> | undefined;
    _in?: Array<GraphQLTypes['jsonb']> | undefined;
    _is_null?: boolean | undefined;
    _lt?: GraphQLTypes['jsonb'] | undefined;
    _lte?: GraphQLTypes['jsonb'] | undefined;
    _neq?: GraphQLTypes['jsonb'] | undefined;
    _nin?: Array<GraphQLTypes['jsonb']> | undefined;
  };
  /** mutation root */
  ['mutation_root']: {
    __typename: 'mutation_root';
    /** delete data from the table: "contribution_votes" */
    delete_contribution_votes?:
      | GraphQLTypes['contribution_votes_mutation_response']
      | undefined;
    /** delete single row from the table: "contribution_votes" */
    delete_contribution_votes_by_pk?:
      | GraphQLTypes['contribution_votes']
      | undefined;
    /** delete data from the table: "contributions" */
    delete_contributions?:
      | GraphQLTypes['contributions_mutation_response']
      | undefined;
    /** delete single row from the table: "contributions" */
    delete_contributions_by_pk?: GraphQLTypes['contributions'] | undefined;
    /** delete data from the table: "contributors" */
    delete_contributors?:
      | GraphQLTypes['contributors_mutation_response']
      | undefined;
    /** delete single row from the table: "contributors" */
    delete_contributors_by_pk?: GraphQLTypes['contributors'] | undefined;
    /** delete data from the table: "robot.merkle_claims" */
    delete_robot_merkle_claims?:
      | GraphQLTypes['robot_merkle_claims_mutation_response']
      | undefined;
    /** delete single row from the table: "robot.merkle_claims" */
    delete_robot_merkle_claims_by_pk?:
      | GraphQLTypes['robot_merkle_claims']
      | undefined;
    /** delete data from the table: "robot.merkle_roots" */
    delete_robot_merkle_roots?:
      | GraphQLTypes['robot_merkle_roots_mutation_response']
      | undefined;
    /** delete single row from the table: "robot.merkle_roots" */
    delete_robot_merkle_roots_by_pk?:
      | GraphQLTypes['robot_merkle_roots']
      | undefined;
    /** delete data from the table: "robot.order" */
    delete_robot_order?:
      | GraphQLTypes['robot_order_mutation_response']
      | undefined;
    /** delete single row from the table: "robot.order" */
    delete_robot_order_by_pk?: GraphQLTypes['robot_order'] | undefined;
    /** delete data from the table: "robot.product" */
    delete_robot_product?:
      | GraphQLTypes['robot_product_mutation_response']
      | undefined;
    /** delete single row from the table: "robot.product" */
    delete_robot_product_by_pk?: GraphQLTypes['robot_product'] | undefined;
    /** delete data from the table: "robot.product_designer" */
    delete_robot_product_designer?:
      | GraphQLTypes['robot_product_designer_mutation_response']
      | undefined;
    /** delete single row from the table: "robot.product_designer" */
    delete_robot_product_designer_by_pk?:
      | GraphQLTypes['robot_product_designer']
      | undefined;
    /** delete data from the table: "shop.api_users" */
    delete_shop_api_users?:
      | GraphQLTypes['shop_api_users_mutation_response']
      | undefined;
    /** delete single row from the table: "shop.api_users" */
    delete_shop_api_users_by_pk?: GraphQLTypes['shop_api_users'] | undefined;
    /** delete data from the table: "shop.product_locks" */
    delete_shop_product_locks?:
      | GraphQLTypes['shop_product_locks_mutation_response']
      | undefined;
    /** delete single row from the table: "shop.product_locks" */
    delete_shop_product_locks_by_pk?:
      | GraphQLTypes['shop_product_locks']
      | undefined;
    /** delete data from the table: "users" */
    delete_users?: GraphQLTypes['users_mutation_response'] | undefined;
    /** delete single row from the table: "users" */
    delete_users_by_pk?: GraphQLTypes['users'] | undefined;
    /** insert data into the table: "contribution_votes" */
    insert_contribution_votes?:
      | GraphQLTypes['contribution_votes_mutation_response']
      | undefined;
    /** insert a single row into the table: "contribution_votes" */
    insert_contribution_votes_one?:
      | GraphQLTypes['contribution_votes']
      | undefined;
    /** insert data into the table: "contributions" */
    insert_contributions?:
      | GraphQLTypes['contributions_mutation_response']
      | undefined;
    /** insert a single row into the table: "contributions" */
    insert_contributions_one?: GraphQLTypes['contributions'] | undefined;
    /** insert data into the table: "contributors" */
    insert_contributors?:
      | GraphQLTypes['contributors_mutation_response']
      | undefined;
    /** insert a single row into the table: "contributors" */
    insert_contributors_one?: GraphQLTypes['contributors'] | undefined;
    /** insert data into the table: "robot.merkle_claims" */
    insert_robot_merkle_claims?:
      | GraphQLTypes['robot_merkle_claims_mutation_response']
      | undefined;
    /** insert a single row into the table: "robot.merkle_claims" */
    insert_robot_merkle_claims_one?:
      | GraphQLTypes['robot_merkle_claims']
      | undefined;
    /** insert data into the table: "robot.merkle_roots" */
    insert_robot_merkle_roots?:
      | GraphQLTypes['robot_merkle_roots_mutation_response']
      | undefined;
    /** insert a single row into the table: "robot.merkle_roots" */
    insert_robot_merkle_roots_one?:
      | GraphQLTypes['robot_merkle_roots']
      | undefined;
    /** insert data into the table: "robot.order" */
    insert_robot_order?:
      | GraphQLTypes['robot_order_mutation_response']
      | undefined;
    /** insert a single row into the table: "robot.order" */
    insert_robot_order_one?: GraphQLTypes['robot_order'] | undefined;
    /** insert data into the table: "robot.product" */
    insert_robot_product?:
      | GraphQLTypes['robot_product_mutation_response']
      | undefined;
    /** insert data into the table: "robot.product_designer" */
    insert_robot_product_designer?:
      | GraphQLTypes['robot_product_designer_mutation_response']
      | undefined;
    /** insert a single row into the table: "robot.product_designer" */
    insert_robot_product_designer_one?:
      | GraphQLTypes['robot_product_designer']
      | undefined;
    /** insert a single row into the table: "robot.product" */
    insert_robot_product_one?: GraphQLTypes['robot_product'] | undefined;
    /** insert data into the table: "shop.api_users" */
    insert_shop_api_users?:
      | GraphQLTypes['shop_api_users_mutation_response']
      | undefined;
    /** insert a single row into the table: "shop.api_users" */
    insert_shop_api_users_one?: GraphQLTypes['shop_api_users'] | undefined;
    /** insert data into the table: "shop.product_locks" */
    insert_shop_product_locks?:
      | GraphQLTypes['shop_product_locks_mutation_response']
      | undefined;
    /** insert a single row into the table: "shop.product_locks" */
    insert_shop_product_locks_one?:
      | GraphQLTypes['shop_product_locks']
      | undefined;
    /** insert data into the table: "users" */
    insert_users?: GraphQLTypes['users_mutation_response'] | undefined;
    /** insert a single row into the table: "users" */
    insert_users_one?: GraphQLTypes['users'] | undefined;
    /** update data of the table: "contribution_votes" */
    update_contribution_votes?:
      | GraphQLTypes['contribution_votes_mutation_response']
      | undefined;
    /** update single row of the table: "contribution_votes" */
    update_contribution_votes_by_pk?:
      | GraphQLTypes['contribution_votes']
      | undefined;
    /** update multiples rows of table: "contribution_votes" */
    update_contribution_votes_many?:
      | Array<GraphQLTypes['contribution_votes_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "contributions" */
    update_contributions?:
      | GraphQLTypes['contributions_mutation_response']
      | undefined;
    /** update single row of the table: "contributions" */
    update_contributions_by_pk?: GraphQLTypes['contributions'] | undefined;
    /** update multiples rows of table: "contributions" */
    update_contributions_many?:
      | Array<GraphQLTypes['contributions_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "contributors" */
    update_contributors?:
      | GraphQLTypes['contributors_mutation_response']
      | undefined;
    /** update single row of the table: "contributors" */
    update_contributors_by_pk?: GraphQLTypes['contributors'] | undefined;
    /** update multiples rows of table: "contributors" */
    update_contributors_many?:
      | Array<GraphQLTypes['contributors_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "robot.merkle_claims" */
    update_robot_merkle_claims?:
      | GraphQLTypes['robot_merkle_claims_mutation_response']
      | undefined;
    /** update single row of the table: "robot.merkle_claims" */
    update_robot_merkle_claims_by_pk?:
      | GraphQLTypes['robot_merkle_claims']
      | undefined;
    /** update multiples rows of table: "robot.merkle_claims" */
    update_robot_merkle_claims_many?:
      | Array<GraphQLTypes['robot_merkle_claims_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "robot.merkle_roots" */
    update_robot_merkle_roots?:
      | GraphQLTypes['robot_merkle_roots_mutation_response']
      | undefined;
    /** update single row of the table: "robot.merkle_roots" */
    update_robot_merkle_roots_by_pk?:
      | GraphQLTypes['robot_merkle_roots']
      | undefined;
    /** update multiples rows of table: "robot.merkle_roots" */
    update_robot_merkle_roots_many?:
      | Array<GraphQLTypes['robot_merkle_roots_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "robot.order" */
    update_robot_order?:
      | GraphQLTypes['robot_order_mutation_response']
      | undefined;
    /** update single row of the table: "robot.order" */
    update_robot_order_by_pk?: GraphQLTypes['robot_order'] | undefined;
    /** update multiples rows of table: "robot.order" */
    update_robot_order_many?:
      | Array<GraphQLTypes['robot_order_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "robot.product" */
    update_robot_product?:
      | GraphQLTypes['robot_product_mutation_response']
      | undefined;
    /** update single row of the table: "robot.product" */
    update_robot_product_by_pk?: GraphQLTypes['robot_product'] | undefined;
    /** update data of the table: "robot.product_designer" */
    update_robot_product_designer?:
      | GraphQLTypes['robot_product_designer_mutation_response']
      | undefined;
    /** update single row of the table: "robot.product_designer" */
    update_robot_product_designer_by_pk?:
      | GraphQLTypes['robot_product_designer']
      | undefined;
    /** update multiples rows of table: "robot.product_designer" */
    update_robot_product_designer_many?:
      | Array<
          GraphQLTypes['robot_product_designer_mutation_response'] | undefined
        >
      | undefined;
    /** update multiples rows of table: "robot.product" */
    update_robot_product_many?:
      | Array<GraphQLTypes['robot_product_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "shop.api_users" */
    update_shop_api_users?:
      | GraphQLTypes['shop_api_users_mutation_response']
      | undefined;
    /** update single row of the table: "shop.api_users" */
    update_shop_api_users_by_pk?: GraphQLTypes['shop_api_users'] | undefined;
    /** update multiples rows of table: "shop.api_users" */
    update_shop_api_users_many?:
      | Array<GraphQLTypes['shop_api_users_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "shop.product_locks" */
    update_shop_product_locks?:
      | GraphQLTypes['shop_product_locks_mutation_response']
      | undefined;
    /** update single row of the table: "shop.product_locks" */
    update_shop_product_locks_by_pk?:
      | GraphQLTypes['shop_product_locks']
      | undefined;
    /** update multiples rows of table: "shop.product_locks" */
    update_shop_product_locks_many?:
      | Array<GraphQLTypes['shop_product_locks_mutation_response'] | undefined>
      | undefined;
    /** update data of the table: "users" */
    update_users?: GraphQLTypes['users_mutation_response'] | undefined;
    /** update single row of the table: "users" */
    update_users_by_pk?: GraphQLTypes['users'] | undefined;
    /** update multiples rows of table: "users" */
    update_users_many?:
      | Array<GraphQLTypes['users_mutation_response'] | undefined>
      | undefined;
  };
  ['numeric']: 'scalar' & { name: 'numeric' };
  /** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
  ['numeric_comparison_exp']: {
    _eq?: GraphQLTypes['numeric'] | undefined;
    _gt?: GraphQLTypes['numeric'] | undefined;
    _gte?: GraphQLTypes['numeric'] | undefined;
    _in?: Array<GraphQLTypes['numeric']> | undefined;
    _is_null?: boolean | undefined;
    _lt?: GraphQLTypes['numeric'] | undefined;
    _lte?: GraphQLTypes['numeric'] | undefined;
    _neq?: GraphQLTypes['numeric'] | undefined;
    _nin?: Array<GraphQLTypes['numeric']> | undefined;
  };
  /** column ordering options */
  ['order_by']: order_by;
  ['query_root']: {
    __typename: 'query_root';
    /** fetch data from the table: "contribution_votes" */
    contribution_votes: Array<GraphQLTypes['contribution_votes']>;
    /** fetch aggregated fields from the table: "contribution_votes" */
    contribution_votes_aggregate: GraphQLTypes['contribution_votes_aggregate'];
    /** fetch data from the table: "contribution_votes" using primary key columns */
    contribution_votes_by_pk?: GraphQLTypes['contribution_votes'] | undefined;
    /** fetch data from the table: "contributions" */
    contributions: Array<GraphQLTypes['contributions']>;
    /** fetch aggregated fields from the table: "contributions" */
    contributions_aggregate: GraphQLTypes['contributions_aggregate'];
    /** fetch data from the table: "contributions" using primary key columns */
    contributions_by_pk?: GraphQLTypes['contributions'] | undefined;
    /** An array relationship */
    contributors: Array<GraphQLTypes['contributors']>;
    /** An aggregate relationship */
    contributors_aggregate: GraphQLTypes['contributors_aggregate'];
    /** fetch data from the table: "contributors" using primary key columns */
    contributors_by_pk?: GraphQLTypes['contributors'] | undefined;
    /** fetch data from the table: "robot.merkle_claims" */
    robot_merkle_claims: Array<GraphQLTypes['robot_merkle_claims']>;
    /** fetch aggregated fields from the table: "robot.merkle_claims" */
    robot_merkle_claims_aggregate: GraphQLTypes['robot_merkle_claims_aggregate'];
    /** fetch data from the table: "robot.merkle_claims" using primary key columns */
    robot_merkle_claims_by_pk?: GraphQLTypes['robot_merkle_claims'] | undefined;
    /** fetch data from the table: "robot.merkle_roots" */
    robot_merkle_roots: Array<GraphQLTypes['robot_merkle_roots']>;
    /** fetch aggregated fields from the table: "robot.merkle_roots" */
    robot_merkle_roots_aggregate: GraphQLTypes['robot_merkle_roots_aggregate'];
    /** fetch data from the table: "robot.merkle_roots" using primary key columns */
    robot_merkle_roots_by_pk?: GraphQLTypes['robot_merkle_roots'] | undefined;
    /** fetch data from the table: "robot.order" */
    robot_order: Array<GraphQLTypes['robot_order']>;
    /** fetch aggregated fields from the table: "robot.order" */
    robot_order_aggregate: GraphQLTypes['robot_order_aggregate'];
    /** fetch data from the table: "robot.order" using primary key columns */
    robot_order_by_pk?: GraphQLTypes['robot_order'] | undefined;
    /** fetch data from the table: "robot.product" */
    robot_product: Array<GraphQLTypes['robot_product']>;
    /** fetch aggregated fields from the table: "robot.product" */
    robot_product_aggregate: GraphQLTypes['robot_product_aggregate'];
    /** fetch data from the table: "robot.product" using primary key columns */
    robot_product_by_pk?: GraphQLTypes['robot_product'] | undefined;
    /** fetch data from the table: "robot.product_designer" */
    robot_product_designer: Array<GraphQLTypes['robot_product_designer']>;
    /** fetch aggregated fields from the table: "robot.product_designer" */
    robot_product_designer_aggregate: GraphQLTypes['robot_product_designer_aggregate'];
    /** fetch data from the table: "robot.product_designer" using primary key columns */
    robot_product_designer_by_pk?:
      | GraphQLTypes['robot_product_designer']
      | undefined;
    /** fetch data from the table: "shop.api_users" */
    shop_api_users: Array<GraphQLTypes['shop_api_users']>;
    /** fetch aggregated fields from the table: "shop.api_users" */
    shop_api_users_aggregate: GraphQLTypes['shop_api_users_aggregate'];
    /** fetch data from the table: "shop.api_users" using primary key columns */
    shop_api_users_by_pk?: GraphQLTypes['shop_api_users'] | undefined;
    /** fetch data from the table: "shop.product_locks" */
    shop_product_locks: Array<GraphQLTypes['shop_product_locks']>;
    /** fetch aggregated fields from the table: "shop.product_locks" */
    shop_product_locks_aggregate: GraphQLTypes['shop_product_locks_aggregate'];
    /** fetch data from the table: "shop.product_locks" using primary key columns */
    shop_product_locks_by_pk?: GraphQLTypes['shop_product_locks'] | undefined;
    /** fetch data from the table: "users" */
    users: Array<GraphQLTypes['users']>;
    /** fetch aggregated fields from the table: "users" */
    users_aggregate: GraphQLTypes['users_aggregate'];
    /** fetch data from the table: "users" using primary key columns */
    users_by_pk?: GraphQLTypes['users'] | undefined;
  };
  /** Claim data for recipients in a merkle giveaway */
  ['robot_merkle_claims']: {
    __typename: 'robot_merkle_claims';
    claim_json: GraphQLTypes['jsonb'];
    id: GraphQLTypes['uuid'];
    /** An object relationship */
    merkle_root: GraphQLTypes['robot_merkle_roots'];
    merkle_root_hash: string;
    recipient_eth_address: string;
  };
  /** aggregated selection of "robot.merkle_claims" */
  ['robot_merkle_claims_aggregate']: {
    __typename: 'robot_merkle_claims_aggregate';
    aggregate?:
      | GraphQLTypes['robot_merkle_claims_aggregate_fields']
      | undefined;
    nodes: Array<GraphQLTypes['robot_merkle_claims']>;
  };
  ['robot_merkle_claims_aggregate_bool_exp']: {
    count?:
      | GraphQLTypes['robot_merkle_claims_aggregate_bool_exp_count']
      | undefined;
  };
  ['robot_merkle_claims_aggregate_bool_exp_count']: {
    arguments?:
      | Array<GraphQLTypes['robot_merkle_claims_select_column']>
      | undefined;
    distinct?: boolean | undefined;
    filter?: GraphQLTypes['robot_merkle_claims_bool_exp'] | undefined;
    predicate: GraphQLTypes['Int_comparison_exp'];
  };
  /** aggregate fields of "robot.merkle_claims" */
  ['robot_merkle_claims_aggregate_fields']: {
    __typename: 'robot_merkle_claims_aggregate_fields';
    count: number;
    max?: GraphQLTypes['robot_merkle_claims_max_fields'] | undefined;
    min?: GraphQLTypes['robot_merkle_claims_min_fields'] | undefined;
  };
  /** order by aggregate values of table "robot.merkle_claims" */
  ['robot_merkle_claims_aggregate_order_by']: {
    count?: GraphQLTypes['order_by'] | undefined;
    max?: GraphQLTypes['robot_merkle_claims_max_order_by'] | undefined;
    min?: GraphQLTypes['robot_merkle_claims_min_order_by'] | undefined;
  };
  /** append existing jsonb value of filtered columns with new jsonb value */
  ['robot_merkle_claims_append_input']: {
    claim_json?: GraphQLTypes['jsonb'] | undefined;
  };
  /** input type for inserting array relation for remote table "robot.merkle_claims" */
  ['robot_merkle_claims_arr_rel_insert_input']: {
    data: Array<GraphQLTypes['robot_merkle_claims_insert_input']>;
    /** upsert condition */
    on_conflict?: GraphQLTypes['robot_merkle_claims_on_conflict'] | undefined;
  };
  /** Boolean expression to filter rows from the table "robot.merkle_claims". All fields are combined with a logical 'AND'. */
  ['robot_merkle_claims_bool_exp']: {
    _and?: Array<GraphQLTypes['robot_merkle_claims_bool_exp']> | undefined;
    _not?: GraphQLTypes['robot_merkle_claims_bool_exp'] | undefined;
    _or?: Array<GraphQLTypes['robot_merkle_claims_bool_exp']> | undefined;
    claim_json?: GraphQLTypes['jsonb_comparison_exp'] | undefined;
    id?: GraphQLTypes['uuid_comparison_exp'] | undefined;
    merkle_root?: GraphQLTypes['robot_merkle_roots_bool_exp'] | undefined;
    merkle_root_hash?: GraphQLTypes['String_comparison_exp'] | undefined;
    recipient_eth_address?: GraphQLTypes['String_comparison_exp'] | undefined;
  };
  /** unique or primary key constraints on table "robot.merkle_claims" */
  ['robot_merkle_claims_constraint']: robot_merkle_claims_constraint;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  ['robot_merkle_claims_delete_at_path_input']: {
    claim_json?: Array<string> | undefined;
  };
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  ['robot_merkle_claims_delete_elem_input']: {
    claim_json?: number | undefined;
  };
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  ['robot_merkle_claims_delete_key_input']: {
    claim_json?: string | undefined;
  };
  /** input type for inserting data into table "robot.merkle_claims" */
  ['robot_merkle_claims_insert_input']: {
    claim_json?: GraphQLTypes['jsonb'] | undefined;
    id?: GraphQLTypes['uuid'] | undefined;
    merkle_root?:
      | GraphQLTypes['robot_merkle_roots_obj_rel_insert_input']
      | undefined;
    merkle_root_hash?: string | undefined;
    recipient_eth_address?: string | undefined;
  };
  /** aggregate max on columns */
  ['robot_merkle_claims_max_fields']: {
    __typename: 'robot_merkle_claims_max_fields';
    id?: GraphQLTypes['uuid'] | undefined;
    merkle_root_hash?: string | undefined;
    recipient_eth_address?: string | undefined;
  };
  /** order by max() on columns of table "robot.merkle_claims" */
  ['robot_merkle_claims_max_order_by']: {
    id?: GraphQLTypes['order_by'] | undefined;
    merkle_root_hash?: GraphQLTypes['order_by'] | undefined;
    recipient_eth_address?: GraphQLTypes['order_by'] | undefined;
  };
  /** aggregate min on columns */
  ['robot_merkle_claims_min_fields']: {
    __typename: 'robot_merkle_claims_min_fields';
    id?: GraphQLTypes['uuid'] | undefined;
    merkle_root_hash?: string | undefined;
    recipient_eth_address?: string | undefined;
  };
  /** order by min() on columns of table "robot.merkle_claims" */
  ['robot_merkle_claims_min_order_by']: {
    id?: GraphQLTypes['order_by'] | undefined;
    merkle_root_hash?: GraphQLTypes['order_by'] | undefined;
    recipient_eth_address?: GraphQLTypes['order_by'] | undefined;
  };
  /** response of any mutation on the table "robot.merkle_claims" */
  ['robot_merkle_claims_mutation_response']: {
    __typename: 'robot_merkle_claims_mutation_response';
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<GraphQLTypes['robot_merkle_claims']>;
  };
  /** on_conflict condition type for table "robot.merkle_claims" */
  ['robot_merkle_claims_on_conflict']: {
    constraint: GraphQLTypes['robot_merkle_claims_constraint'];
    update_columns: Array<GraphQLTypes['robot_merkle_claims_update_column']>;
    where?: GraphQLTypes['robot_merkle_claims_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "robot.merkle_claims". */
  ['robot_merkle_claims_order_by']: {
    claim_json?: GraphQLTypes['order_by'] | undefined;
    id?: GraphQLTypes['order_by'] | undefined;
    merkle_root?: GraphQLTypes['robot_merkle_roots_order_by'] | undefined;
    merkle_root_hash?: GraphQLTypes['order_by'] | undefined;
    recipient_eth_address?: GraphQLTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: robot.merkle_claims */
  ['robot_merkle_claims_pk_columns_input']: {
    id: GraphQLTypes['uuid'];
  };
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  ['robot_merkle_claims_prepend_input']: {
    claim_json?: GraphQLTypes['jsonb'] | undefined;
  };
  /** select columns of table "robot.merkle_claims" */
  ['robot_merkle_claims_select_column']: robot_merkle_claims_select_column;
  /** input type for updating data in table "robot.merkle_claims" */
  ['robot_merkle_claims_set_input']: {
    claim_json?: GraphQLTypes['jsonb'] | undefined;
    id?: GraphQLTypes['uuid'] | undefined;
    merkle_root_hash?: string | undefined;
    recipient_eth_address?: string | undefined;
  };
  /** Streaming cursor of the table "robot_merkle_claims" */
  ['robot_merkle_claims_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: GraphQLTypes['robot_merkle_claims_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: GraphQLTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_merkle_claims_stream_cursor_value_input']: {
    claim_json?: GraphQLTypes['jsonb'] | undefined;
    id?: GraphQLTypes['uuid'] | undefined;
    merkle_root_hash?: string | undefined;
    recipient_eth_address?: string | undefined;
  };
  /** update columns of table "robot.merkle_claims" */
  ['robot_merkle_claims_update_column']: robot_merkle_claims_update_column;
  ['robot_merkle_claims_updates']: {
    /** append existing jsonb value of filtered columns with new jsonb value */
    _append?: GraphQLTypes['robot_merkle_claims_append_input'] | undefined;
    /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
    _delete_at_path?:
      | GraphQLTypes['robot_merkle_claims_delete_at_path_input']
      | undefined;
    /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
    _delete_elem?:
      | GraphQLTypes['robot_merkle_claims_delete_elem_input']
      | undefined;
    /** delete key/value pair or string element. key/value pairs are matched based on their key value */
    _delete_key?:
      | GraphQLTypes['robot_merkle_claims_delete_key_input']
      | undefined;
    /** prepend existing jsonb value of filtered columns with new jsonb value */
    _prepend?: GraphQLTypes['robot_merkle_claims_prepend_input'] | undefined;
    /** sets the columns of the filtered rows to the given values */
    _set?: GraphQLTypes['robot_merkle_claims_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: GraphQLTypes['robot_merkle_claims_bool_exp'];
  };
  /** Each merkle root corresponds to a distribution in the giveaway contract */
  ['robot_merkle_roots']: {
    __typename: 'robot_merkle_roots';
    contract_address: string;
    created_at: GraphQLTypes['timestamptz'];
    hash: string;
    /** An array relationship */
    merkle_claims: Array<GraphQLTypes['robot_merkle_claims']>;
    /** An aggregate relationship */
    merkle_claims_aggregate: GraphQLTypes['robot_merkle_claims_aggregate'];
    network: string;
  };
  /** aggregated selection of "robot.merkle_roots" */
  ['robot_merkle_roots_aggregate']: {
    __typename: 'robot_merkle_roots_aggregate';
    aggregate?: GraphQLTypes['robot_merkle_roots_aggregate_fields'] | undefined;
    nodes: Array<GraphQLTypes['robot_merkle_roots']>;
  };
  /** aggregate fields of "robot.merkle_roots" */
  ['robot_merkle_roots_aggregate_fields']: {
    __typename: 'robot_merkle_roots_aggregate_fields';
    count: number;
    max?: GraphQLTypes['robot_merkle_roots_max_fields'] | undefined;
    min?: GraphQLTypes['robot_merkle_roots_min_fields'] | undefined;
  };
  /** Boolean expression to filter rows from the table "robot.merkle_roots". All fields are combined with a logical 'AND'. */
  ['robot_merkle_roots_bool_exp']: {
    _and?: Array<GraphQLTypes['robot_merkle_roots_bool_exp']> | undefined;
    _not?: GraphQLTypes['robot_merkle_roots_bool_exp'] | undefined;
    _or?: Array<GraphQLTypes['robot_merkle_roots_bool_exp']> | undefined;
    contract_address?: GraphQLTypes['String_comparison_exp'] | undefined;
    created_at?: GraphQLTypes['timestamptz_comparison_exp'] | undefined;
    hash?: GraphQLTypes['String_comparison_exp'] | undefined;
    merkle_claims?: GraphQLTypes['robot_merkle_claims_bool_exp'] | undefined;
    merkle_claims_aggregate?:
      | GraphQLTypes['robot_merkle_claims_aggregate_bool_exp']
      | undefined;
    network?: GraphQLTypes['String_comparison_exp'] | undefined;
  };
  /** unique or primary key constraints on table "robot.merkle_roots" */
  ['robot_merkle_roots_constraint']: robot_merkle_roots_constraint;
  /** input type for inserting data into table "robot.merkle_roots" */
  ['robot_merkle_roots_insert_input']: {
    contract_address?: string | undefined;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    hash?: string | undefined;
    merkle_claims?:
      | GraphQLTypes['robot_merkle_claims_arr_rel_insert_input']
      | undefined;
    network?: string | undefined;
  };
  /** aggregate max on columns */
  ['robot_merkle_roots_max_fields']: {
    __typename: 'robot_merkle_roots_max_fields';
    contract_address?: string | undefined;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    hash?: string | undefined;
    network?: string | undefined;
  };
  /** aggregate min on columns */
  ['robot_merkle_roots_min_fields']: {
    __typename: 'robot_merkle_roots_min_fields';
    contract_address?: string | undefined;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    hash?: string | undefined;
    network?: string | undefined;
  };
  /** response of any mutation on the table "robot.merkle_roots" */
  ['robot_merkle_roots_mutation_response']: {
    __typename: 'robot_merkle_roots_mutation_response';
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<GraphQLTypes['robot_merkle_roots']>;
  };
  /** input type for inserting object relation for remote table "robot.merkle_roots" */
  ['robot_merkle_roots_obj_rel_insert_input']: {
    data: GraphQLTypes['robot_merkle_roots_insert_input'];
    /** upsert condition */
    on_conflict?: GraphQLTypes['robot_merkle_roots_on_conflict'] | undefined;
  };
  /** on_conflict condition type for table "robot.merkle_roots" */
  ['robot_merkle_roots_on_conflict']: {
    constraint: GraphQLTypes['robot_merkle_roots_constraint'];
    update_columns: Array<GraphQLTypes['robot_merkle_roots_update_column']>;
    where?: GraphQLTypes['robot_merkle_roots_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "robot.merkle_roots". */
  ['robot_merkle_roots_order_by']: {
    contract_address?: GraphQLTypes['order_by'] | undefined;
    created_at?: GraphQLTypes['order_by'] | undefined;
    hash?: GraphQLTypes['order_by'] | undefined;
    merkle_claims_aggregate?:
      | GraphQLTypes['robot_merkle_claims_aggregate_order_by']
      | undefined;
    network?: GraphQLTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: robot.merkle_roots */
  ['robot_merkle_roots_pk_columns_input']: {
    hash: string;
  };
  /** select columns of table "robot.merkle_roots" */
  ['robot_merkle_roots_select_column']: robot_merkle_roots_select_column;
  /** input type for updating data in table "robot.merkle_roots" */
  ['robot_merkle_roots_set_input']: {
    contract_address?: string | undefined;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    hash?: string | undefined;
    network?: string | undefined;
  };
  /** Streaming cursor of the table "robot_merkle_roots" */
  ['robot_merkle_roots_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: GraphQLTypes['robot_merkle_roots_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: GraphQLTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_merkle_roots_stream_cursor_value_input']: {
    contract_address?: string | undefined;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    hash?: string | undefined;
    network?: string | undefined;
  };
  /** update columns of table "robot.merkle_roots" */
  ['robot_merkle_roots_update_column']: robot_merkle_roots_update_column;
  ['robot_merkle_roots_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?: GraphQLTypes['robot_merkle_roots_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: GraphQLTypes['robot_merkle_roots_bool_exp'];
  };
  /** Orders for ROBOT rewards */
  ['robot_order']: {
    __typename: 'robot_order';
    buyer_address: string;
    buyer_reward: GraphQLTypes['numeric'];
    date: GraphQLTypes['date'];
    dollars_spent: GraphQLTypes['numeric'];
    order_id: string;
    order_number?: string | undefined;
    season: GraphQLTypes['numeric'];
  };
  /** aggregated selection of "robot.order" */
  ['robot_order_aggregate']: {
    __typename: 'robot_order_aggregate';
    aggregate?: GraphQLTypes['robot_order_aggregate_fields'] | undefined;
    nodes: Array<GraphQLTypes['robot_order']>;
  };
  /** aggregate fields of "robot.order" */
  ['robot_order_aggregate_fields']: {
    __typename: 'robot_order_aggregate_fields';
    avg?: GraphQLTypes['robot_order_avg_fields'] | undefined;
    count: number;
    max?: GraphQLTypes['robot_order_max_fields'] | undefined;
    min?: GraphQLTypes['robot_order_min_fields'] | undefined;
    stddev?: GraphQLTypes['robot_order_stddev_fields'] | undefined;
    stddev_pop?: GraphQLTypes['robot_order_stddev_pop_fields'] | undefined;
    stddev_samp?: GraphQLTypes['robot_order_stddev_samp_fields'] | undefined;
    sum?: GraphQLTypes['robot_order_sum_fields'] | undefined;
    var_pop?: GraphQLTypes['robot_order_var_pop_fields'] | undefined;
    var_samp?: GraphQLTypes['robot_order_var_samp_fields'] | undefined;
    variance?: GraphQLTypes['robot_order_variance_fields'] | undefined;
  };
  /** aggregate avg on columns */
  ['robot_order_avg_fields']: {
    __typename: 'robot_order_avg_fields';
    buyer_reward?: number | undefined;
    dollars_spent?: number | undefined;
    season?: number | undefined;
  };
  /** Boolean expression to filter rows from the table "robot.order". All fields are combined with a logical 'AND'. */
  ['robot_order_bool_exp']: {
    _and?: Array<GraphQLTypes['robot_order_bool_exp']> | undefined;
    _not?: GraphQLTypes['robot_order_bool_exp'] | undefined;
    _or?: Array<GraphQLTypes['robot_order_bool_exp']> | undefined;
    buyer_address?: GraphQLTypes['String_comparison_exp'] | undefined;
    buyer_reward?: GraphQLTypes['numeric_comparison_exp'] | undefined;
    date?: GraphQLTypes['date_comparison_exp'] | undefined;
    dollars_spent?: GraphQLTypes['numeric_comparison_exp'] | undefined;
    order_id?: GraphQLTypes['String_comparison_exp'] | undefined;
    order_number?: GraphQLTypes['String_comparison_exp'] | undefined;
    season?: GraphQLTypes['numeric_comparison_exp'] | undefined;
  };
  /** unique or primary key constraints on table "robot.order" */
  ['robot_order_constraint']: robot_order_constraint;
  /** input type for incrementing numeric columns in table "robot.order" */
  ['robot_order_inc_input']: {
    buyer_reward?: GraphQLTypes['numeric'] | undefined;
    dollars_spent?: GraphQLTypes['numeric'] | undefined;
    season?: GraphQLTypes['numeric'] | undefined;
  };
  /** input type for inserting data into table "robot.order" */
  ['robot_order_insert_input']: {
    buyer_address?: string | undefined;
    buyer_reward?: GraphQLTypes['numeric'] | undefined;
    date?: GraphQLTypes['date'] | undefined;
    dollars_spent?: GraphQLTypes['numeric'] | undefined;
    order_id?: string | undefined;
    order_number?: string | undefined;
    season?: GraphQLTypes['numeric'] | undefined;
  };
  /** aggregate max on columns */
  ['robot_order_max_fields']: {
    __typename: 'robot_order_max_fields';
    buyer_address?: string | undefined;
    buyer_reward?: GraphQLTypes['numeric'] | undefined;
    date?: GraphQLTypes['date'] | undefined;
    dollars_spent?: GraphQLTypes['numeric'] | undefined;
    order_id?: string | undefined;
    order_number?: string | undefined;
    season?: GraphQLTypes['numeric'] | undefined;
  };
  /** aggregate min on columns */
  ['robot_order_min_fields']: {
    __typename: 'robot_order_min_fields';
    buyer_address?: string | undefined;
    buyer_reward?: GraphQLTypes['numeric'] | undefined;
    date?: GraphQLTypes['date'] | undefined;
    dollars_spent?: GraphQLTypes['numeric'] | undefined;
    order_id?: string | undefined;
    order_number?: string | undefined;
    season?: GraphQLTypes['numeric'] | undefined;
  };
  /** response of any mutation on the table "robot.order" */
  ['robot_order_mutation_response']: {
    __typename: 'robot_order_mutation_response';
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<GraphQLTypes['robot_order']>;
  };
  /** on_conflict condition type for table "robot.order" */
  ['robot_order_on_conflict']: {
    constraint: GraphQLTypes['robot_order_constraint'];
    update_columns: Array<GraphQLTypes['robot_order_update_column']>;
    where?: GraphQLTypes['robot_order_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "robot.order". */
  ['robot_order_order_by']: {
    buyer_address?: GraphQLTypes['order_by'] | undefined;
    buyer_reward?: GraphQLTypes['order_by'] | undefined;
    date?: GraphQLTypes['order_by'] | undefined;
    dollars_spent?: GraphQLTypes['order_by'] | undefined;
    order_id?: GraphQLTypes['order_by'] | undefined;
    order_number?: GraphQLTypes['order_by'] | undefined;
    season?: GraphQLTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: robot.order */
  ['robot_order_pk_columns_input']: {
    order_id: string;
  };
  /** select columns of table "robot.order" */
  ['robot_order_select_column']: robot_order_select_column;
  /** input type for updating data in table "robot.order" */
  ['robot_order_set_input']: {
    buyer_address?: string | undefined;
    buyer_reward?: GraphQLTypes['numeric'] | undefined;
    date?: GraphQLTypes['date'] | undefined;
    dollars_spent?: GraphQLTypes['numeric'] | undefined;
    order_id?: string | undefined;
    order_number?: string | undefined;
    season?: GraphQLTypes['numeric'] | undefined;
  };
  /** aggregate stddev on columns */
  ['robot_order_stddev_fields']: {
    __typename: 'robot_order_stddev_fields';
    buyer_reward?: number | undefined;
    dollars_spent?: number | undefined;
    season?: number | undefined;
  };
  /** aggregate stddev_pop on columns */
  ['robot_order_stddev_pop_fields']: {
    __typename: 'robot_order_stddev_pop_fields';
    buyer_reward?: number | undefined;
    dollars_spent?: number | undefined;
    season?: number | undefined;
  };
  /** aggregate stddev_samp on columns */
  ['robot_order_stddev_samp_fields']: {
    __typename: 'robot_order_stddev_samp_fields';
    buyer_reward?: number | undefined;
    dollars_spent?: number | undefined;
    season?: number | undefined;
  };
  /** Streaming cursor of the table "robot_order" */
  ['robot_order_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: GraphQLTypes['robot_order_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: GraphQLTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_order_stream_cursor_value_input']: {
    buyer_address?: string | undefined;
    buyer_reward?: GraphQLTypes['numeric'] | undefined;
    date?: GraphQLTypes['date'] | undefined;
    dollars_spent?: GraphQLTypes['numeric'] | undefined;
    order_id?: string | undefined;
    order_number?: string | undefined;
    season?: GraphQLTypes['numeric'] | undefined;
  };
  /** aggregate sum on columns */
  ['robot_order_sum_fields']: {
    __typename: 'robot_order_sum_fields';
    buyer_reward?: GraphQLTypes['numeric'] | undefined;
    dollars_spent?: GraphQLTypes['numeric'] | undefined;
    season?: GraphQLTypes['numeric'] | undefined;
  };
  /** update columns of table "robot.order" */
  ['robot_order_update_column']: robot_order_update_column;
  ['robot_order_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?: GraphQLTypes['robot_order_inc_input'] | undefined;
    /** sets the columns of the filtered rows to the given values */
    _set?: GraphQLTypes['robot_order_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: GraphQLTypes['robot_order_bool_exp'];
  };
  /** aggregate var_pop on columns */
  ['robot_order_var_pop_fields']: {
    __typename: 'robot_order_var_pop_fields';
    buyer_reward?: number | undefined;
    dollars_spent?: number | undefined;
    season?: number | undefined;
  };
  /** aggregate var_samp on columns */
  ['robot_order_var_samp_fields']: {
    __typename: 'robot_order_var_samp_fields';
    buyer_reward?: number | undefined;
    dollars_spent?: number | undefined;
    season?: number | undefined;
  };
  /** aggregate variance on columns */
  ['robot_order_variance_fields']: {
    __typename: 'robot_order_variance_fields';
    buyer_reward?: number | undefined;
    dollars_spent?: number | undefined;
    season?: number | undefined;
  };
  /** Products for ROBOT designer rewards */
  ['robot_product']: {
    __typename: 'robot_product';
    /** An array relationship */
    designers: Array<GraphQLTypes['robot_product_designer']>;
    /** An aggregate relationship */
    designers_aggregate: GraphQLTypes['robot_product_designer_aggregate'];
    id: string;
    nft_metadata?: GraphQLTypes['jsonb'] | undefined;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    shopify_id?: string | undefined;
    title: string;
  };
  /** aggregated selection of "robot.product" */
  ['robot_product_aggregate']: {
    __typename: 'robot_product_aggregate';
    aggregate?: GraphQLTypes['robot_product_aggregate_fields'] | undefined;
    nodes: Array<GraphQLTypes['robot_product']>;
  };
  /** aggregate fields of "robot.product" */
  ['robot_product_aggregate_fields']: {
    __typename: 'robot_product_aggregate_fields';
    avg?: GraphQLTypes['robot_product_avg_fields'] | undefined;
    count: number;
    max?: GraphQLTypes['robot_product_max_fields'] | undefined;
    min?: GraphQLTypes['robot_product_min_fields'] | undefined;
    stddev?: GraphQLTypes['robot_product_stddev_fields'] | undefined;
    stddev_pop?: GraphQLTypes['robot_product_stddev_pop_fields'] | undefined;
    stddev_samp?: GraphQLTypes['robot_product_stddev_samp_fields'] | undefined;
    sum?: GraphQLTypes['robot_product_sum_fields'] | undefined;
    var_pop?: GraphQLTypes['robot_product_var_pop_fields'] | undefined;
    var_samp?: GraphQLTypes['robot_product_var_samp_fields'] | undefined;
    variance?: GraphQLTypes['robot_product_variance_fields'] | undefined;
  };
  /** append existing jsonb value of filtered columns with new jsonb value */
  ['robot_product_append_input']: {
    nft_metadata?: GraphQLTypes['jsonb'] | undefined;
  };
  /** aggregate avg on columns */
  ['robot_product_avg_fields']: {
    __typename: 'robot_product_avg_fields';
    nft_token_id?: number | undefined;
  };
  /** Boolean expression to filter rows from the table "robot.product". All fields are combined with a logical 'AND'. */
  ['robot_product_bool_exp']: {
    _and?: Array<GraphQLTypes['robot_product_bool_exp']> | undefined;
    _not?: GraphQLTypes['robot_product_bool_exp'] | undefined;
    _or?: Array<GraphQLTypes['robot_product_bool_exp']> | undefined;
    designers?: GraphQLTypes['robot_product_designer_bool_exp'] | undefined;
    designers_aggregate?:
      | GraphQLTypes['robot_product_designer_aggregate_bool_exp']
      | undefined;
    id?: GraphQLTypes['String_comparison_exp'] | undefined;
    nft_metadata?: GraphQLTypes['jsonb_comparison_exp'] | undefined;
    nft_token_id?: GraphQLTypes['Int_comparison_exp'] | undefined;
    notion_id?: GraphQLTypes['String_comparison_exp'] | undefined;
    shopify_id?: GraphQLTypes['String_comparison_exp'] | undefined;
    title?: GraphQLTypes['String_comparison_exp'] | undefined;
  };
  /** unique or primary key constraints on table "robot.product" */
  ['robot_product_constraint']: robot_product_constraint;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  ['robot_product_delete_at_path_input']: {
    nft_metadata?: Array<string> | undefined;
  };
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  ['robot_product_delete_elem_input']: {
    nft_metadata?: number | undefined;
  };
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  ['robot_product_delete_key_input']: {
    nft_metadata?: string | undefined;
  };
  /** Designer receiving ROBOT rewards */
  ['robot_product_designer']: {
    __typename: 'robot_product_designer';
    contribution_share: GraphQLTypes['numeric'];
    designer_name?: string | undefined;
    eth_address: string;
    /** An object relationship */
    product: GraphQLTypes['robot_product'];
    product_id: string;
    robot_reward: GraphQLTypes['numeric'];
  };
  /** aggregated selection of "robot.product_designer" */
  ['robot_product_designer_aggregate']: {
    __typename: 'robot_product_designer_aggregate';
    aggregate?:
      | GraphQLTypes['robot_product_designer_aggregate_fields']
      | undefined;
    nodes: Array<GraphQLTypes['robot_product_designer']>;
  };
  ['robot_product_designer_aggregate_bool_exp']: {
    count?:
      | GraphQLTypes['robot_product_designer_aggregate_bool_exp_count']
      | undefined;
  };
  ['robot_product_designer_aggregate_bool_exp_count']: {
    arguments?:
      | Array<GraphQLTypes['robot_product_designer_select_column']>
      | undefined;
    distinct?: boolean | undefined;
    filter?: GraphQLTypes['robot_product_designer_bool_exp'] | undefined;
    predicate: GraphQLTypes['Int_comparison_exp'];
  };
  /** aggregate fields of "robot.product_designer" */
  ['robot_product_designer_aggregate_fields']: {
    __typename: 'robot_product_designer_aggregate_fields';
    avg?: GraphQLTypes['robot_product_designer_avg_fields'] | undefined;
    count: number;
    max?: GraphQLTypes['robot_product_designer_max_fields'] | undefined;
    min?: GraphQLTypes['robot_product_designer_min_fields'] | undefined;
    stddev?: GraphQLTypes['robot_product_designer_stddev_fields'] | undefined;
    stddev_pop?:
      | GraphQLTypes['robot_product_designer_stddev_pop_fields']
      | undefined;
    stddev_samp?:
      | GraphQLTypes['robot_product_designer_stddev_samp_fields']
      | undefined;
    sum?: GraphQLTypes['robot_product_designer_sum_fields'] | undefined;
    var_pop?: GraphQLTypes['robot_product_designer_var_pop_fields'] | undefined;
    var_samp?:
      | GraphQLTypes['robot_product_designer_var_samp_fields']
      | undefined;
    variance?:
      | GraphQLTypes['robot_product_designer_variance_fields']
      | undefined;
  };
  /** order by aggregate values of table "robot.product_designer" */
  ['robot_product_designer_aggregate_order_by']: {
    avg?: GraphQLTypes['robot_product_designer_avg_order_by'] | undefined;
    count?: GraphQLTypes['order_by'] | undefined;
    max?: GraphQLTypes['robot_product_designer_max_order_by'] | undefined;
    min?: GraphQLTypes['robot_product_designer_min_order_by'] | undefined;
    stddev?: GraphQLTypes['robot_product_designer_stddev_order_by'] | undefined;
    stddev_pop?:
      | GraphQLTypes['robot_product_designer_stddev_pop_order_by']
      | undefined;
    stddev_samp?:
      | GraphQLTypes['robot_product_designer_stddev_samp_order_by']
      | undefined;
    sum?: GraphQLTypes['robot_product_designer_sum_order_by'] | undefined;
    var_pop?:
      | GraphQLTypes['robot_product_designer_var_pop_order_by']
      | undefined;
    var_samp?:
      | GraphQLTypes['robot_product_designer_var_samp_order_by']
      | undefined;
    variance?:
      | GraphQLTypes['robot_product_designer_variance_order_by']
      | undefined;
  };
  /** input type for inserting array relation for remote table "robot.product_designer" */
  ['robot_product_designer_arr_rel_insert_input']: {
    data: Array<GraphQLTypes['robot_product_designer_insert_input']>;
    /** upsert condition */
    on_conflict?:
      | GraphQLTypes['robot_product_designer_on_conflict']
      | undefined;
  };
  /** aggregate avg on columns */
  ['robot_product_designer_avg_fields']: {
    __typename: 'robot_product_designer_avg_fields';
    contribution_share?: number | undefined;
    robot_reward?: number | undefined;
  };
  /** order by avg() on columns of table "robot.product_designer" */
  ['robot_product_designer_avg_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
    robot_reward?: GraphQLTypes['order_by'] | undefined;
  };
  /** Boolean expression to filter rows from the table "robot.product_designer". All fields are combined with a logical 'AND'. */
  ['robot_product_designer_bool_exp']: {
    _and?: Array<GraphQLTypes['robot_product_designer_bool_exp']> | undefined;
    _not?: GraphQLTypes['robot_product_designer_bool_exp'] | undefined;
    _or?: Array<GraphQLTypes['robot_product_designer_bool_exp']> | undefined;
    contribution_share?: GraphQLTypes['numeric_comparison_exp'] | undefined;
    designer_name?: GraphQLTypes['String_comparison_exp'] | undefined;
    eth_address?: GraphQLTypes['String_comparison_exp'] | undefined;
    product?: GraphQLTypes['robot_product_bool_exp'] | undefined;
    product_id?: GraphQLTypes['String_comparison_exp'] | undefined;
    robot_reward?: GraphQLTypes['numeric_comparison_exp'] | undefined;
  };
  /** unique or primary key constraints on table "robot.product_designer" */
  ['robot_product_designer_constraint']: robot_product_designer_constraint;
  /** input type for incrementing numeric columns in table "robot.product_designer" */
  ['robot_product_designer_inc_input']: {
    contribution_share?: GraphQLTypes['numeric'] | undefined;
    robot_reward?: GraphQLTypes['numeric'] | undefined;
  };
  /** input type for inserting data into table "robot.product_designer" */
  ['robot_product_designer_insert_input']: {
    contribution_share?: GraphQLTypes['numeric'] | undefined;
    designer_name?: string | undefined;
    eth_address?: string | undefined;
    product?: GraphQLTypes['robot_product_obj_rel_insert_input'] | undefined;
    product_id?: string | undefined;
    robot_reward?: GraphQLTypes['numeric'] | undefined;
  };
  /** aggregate max on columns */
  ['robot_product_designer_max_fields']: {
    __typename: 'robot_product_designer_max_fields';
    contribution_share?: GraphQLTypes['numeric'] | undefined;
    designer_name?: string | undefined;
    eth_address?: string | undefined;
    product_id?: string | undefined;
    robot_reward?: GraphQLTypes['numeric'] | undefined;
  };
  /** order by max() on columns of table "robot.product_designer" */
  ['robot_product_designer_max_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
    designer_name?: GraphQLTypes['order_by'] | undefined;
    eth_address?: GraphQLTypes['order_by'] | undefined;
    product_id?: GraphQLTypes['order_by'] | undefined;
    robot_reward?: GraphQLTypes['order_by'] | undefined;
  };
  /** aggregate min on columns */
  ['robot_product_designer_min_fields']: {
    __typename: 'robot_product_designer_min_fields';
    contribution_share?: GraphQLTypes['numeric'] | undefined;
    designer_name?: string | undefined;
    eth_address?: string | undefined;
    product_id?: string | undefined;
    robot_reward?: GraphQLTypes['numeric'] | undefined;
  };
  /** order by min() on columns of table "robot.product_designer" */
  ['robot_product_designer_min_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
    designer_name?: GraphQLTypes['order_by'] | undefined;
    eth_address?: GraphQLTypes['order_by'] | undefined;
    product_id?: GraphQLTypes['order_by'] | undefined;
    robot_reward?: GraphQLTypes['order_by'] | undefined;
  };
  /** response of any mutation on the table "robot.product_designer" */
  ['robot_product_designer_mutation_response']: {
    __typename: 'robot_product_designer_mutation_response';
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<GraphQLTypes['robot_product_designer']>;
  };
  /** on_conflict condition type for table "robot.product_designer" */
  ['robot_product_designer_on_conflict']: {
    constraint: GraphQLTypes['robot_product_designer_constraint'];
    update_columns: Array<GraphQLTypes['robot_product_designer_update_column']>;
    where?: GraphQLTypes['robot_product_designer_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "robot.product_designer". */
  ['robot_product_designer_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
    designer_name?: GraphQLTypes['order_by'] | undefined;
    eth_address?: GraphQLTypes['order_by'] | undefined;
    product?: GraphQLTypes['robot_product_order_by'] | undefined;
    product_id?: GraphQLTypes['order_by'] | undefined;
    robot_reward?: GraphQLTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: robot.product_designer */
  ['robot_product_designer_pk_columns_input']: {
    eth_address: string;
    product_id: string;
  };
  /** select columns of table "robot.product_designer" */
  ['robot_product_designer_select_column']: robot_product_designer_select_column;
  /** input type for updating data in table "robot.product_designer" */
  ['robot_product_designer_set_input']: {
    contribution_share?: GraphQLTypes['numeric'] | undefined;
    designer_name?: string | undefined;
    eth_address?: string | undefined;
    product_id?: string | undefined;
    robot_reward?: GraphQLTypes['numeric'] | undefined;
  };
  /** aggregate stddev on columns */
  ['robot_product_designer_stddev_fields']: {
    __typename: 'robot_product_designer_stddev_fields';
    contribution_share?: number | undefined;
    robot_reward?: number | undefined;
  };
  /** order by stddev() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
    robot_reward?: GraphQLTypes['order_by'] | undefined;
  };
  /** aggregate stddev_pop on columns */
  ['robot_product_designer_stddev_pop_fields']: {
    __typename: 'robot_product_designer_stddev_pop_fields';
    contribution_share?: number | undefined;
    robot_reward?: number | undefined;
  };
  /** order by stddev_pop() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_pop_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
    robot_reward?: GraphQLTypes['order_by'] | undefined;
  };
  /** aggregate stddev_samp on columns */
  ['robot_product_designer_stddev_samp_fields']: {
    __typename: 'robot_product_designer_stddev_samp_fields';
    contribution_share?: number | undefined;
    robot_reward?: number | undefined;
  };
  /** order by stddev_samp() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_samp_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
    robot_reward?: GraphQLTypes['order_by'] | undefined;
  };
  /** Streaming cursor of the table "robot_product_designer" */
  ['robot_product_designer_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: GraphQLTypes['robot_product_designer_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: GraphQLTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_product_designer_stream_cursor_value_input']: {
    contribution_share?: GraphQLTypes['numeric'] | undefined;
    designer_name?: string | undefined;
    eth_address?: string | undefined;
    product_id?: string | undefined;
    robot_reward?: GraphQLTypes['numeric'] | undefined;
  };
  /** aggregate sum on columns */
  ['robot_product_designer_sum_fields']: {
    __typename: 'robot_product_designer_sum_fields';
    contribution_share?: GraphQLTypes['numeric'] | undefined;
    robot_reward?: GraphQLTypes['numeric'] | undefined;
  };
  /** order by sum() on columns of table "robot.product_designer" */
  ['robot_product_designer_sum_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
    robot_reward?: GraphQLTypes['order_by'] | undefined;
  };
  /** update columns of table "robot.product_designer" */
  ['robot_product_designer_update_column']: robot_product_designer_update_column;
  ['robot_product_designer_updates']: {
    /** increments the numeric columns with given value of the filtered values */
    _inc?: GraphQLTypes['robot_product_designer_inc_input'] | undefined;
    /** sets the columns of the filtered rows to the given values */
    _set?: GraphQLTypes['robot_product_designer_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: GraphQLTypes['robot_product_designer_bool_exp'];
  };
  /** aggregate var_pop on columns */
  ['robot_product_designer_var_pop_fields']: {
    __typename: 'robot_product_designer_var_pop_fields';
    contribution_share?: number | undefined;
    robot_reward?: number | undefined;
  };
  /** order by var_pop() on columns of table "robot.product_designer" */
  ['robot_product_designer_var_pop_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
    robot_reward?: GraphQLTypes['order_by'] | undefined;
  };
  /** aggregate var_samp on columns */
  ['robot_product_designer_var_samp_fields']: {
    __typename: 'robot_product_designer_var_samp_fields';
    contribution_share?: number | undefined;
    robot_reward?: number | undefined;
  };
  /** order by var_samp() on columns of table "robot.product_designer" */
  ['robot_product_designer_var_samp_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
    robot_reward?: GraphQLTypes['order_by'] | undefined;
  };
  /** aggregate variance on columns */
  ['robot_product_designer_variance_fields']: {
    __typename: 'robot_product_designer_variance_fields';
    contribution_share?: number | undefined;
    robot_reward?: number | undefined;
  };
  /** order by variance() on columns of table "robot.product_designer" */
  ['robot_product_designer_variance_order_by']: {
    contribution_share?: GraphQLTypes['order_by'] | undefined;
    robot_reward?: GraphQLTypes['order_by'] | undefined;
  };
  /** input type for incrementing numeric columns in table "robot.product" */
  ['robot_product_inc_input']: {
    nft_token_id?: number | undefined;
  };
  /** input type for inserting data into table "robot.product" */
  ['robot_product_insert_input']: {
    designers?:
      | GraphQLTypes['robot_product_designer_arr_rel_insert_input']
      | undefined;
    id?: string | undefined;
    nft_metadata?: GraphQLTypes['jsonb'] | undefined;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    shopify_id?: string | undefined;
    title?: string | undefined;
  };
  /** aggregate max on columns */
  ['robot_product_max_fields']: {
    __typename: 'robot_product_max_fields';
    id?: string | undefined;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    shopify_id?: string | undefined;
    title?: string | undefined;
  };
  /** aggregate min on columns */
  ['robot_product_min_fields']: {
    __typename: 'robot_product_min_fields';
    id?: string | undefined;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    shopify_id?: string | undefined;
    title?: string | undefined;
  };
  /** response of any mutation on the table "robot.product" */
  ['robot_product_mutation_response']: {
    __typename: 'robot_product_mutation_response';
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<GraphQLTypes['robot_product']>;
  };
  /** input type for inserting object relation for remote table "robot.product" */
  ['robot_product_obj_rel_insert_input']: {
    data: GraphQLTypes['robot_product_insert_input'];
    /** upsert condition */
    on_conflict?: GraphQLTypes['robot_product_on_conflict'] | undefined;
  };
  /** on_conflict condition type for table "robot.product" */
  ['robot_product_on_conflict']: {
    constraint: GraphQLTypes['robot_product_constraint'];
    update_columns: Array<GraphQLTypes['robot_product_update_column']>;
    where?: GraphQLTypes['robot_product_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "robot.product". */
  ['robot_product_order_by']: {
    designers_aggregate?:
      | GraphQLTypes['robot_product_designer_aggregate_order_by']
      | undefined;
    id?: GraphQLTypes['order_by'] | undefined;
    nft_metadata?: GraphQLTypes['order_by'] | undefined;
    nft_token_id?: GraphQLTypes['order_by'] | undefined;
    notion_id?: GraphQLTypes['order_by'] | undefined;
    shopify_id?: GraphQLTypes['order_by'] | undefined;
    title?: GraphQLTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: robot.product */
  ['robot_product_pk_columns_input']: {
    id: string;
  };
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  ['robot_product_prepend_input']: {
    nft_metadata?: GraphQLTypes['jsonb'] | undefined;
  };
  /** select columns of table "robot.product" */
  ['robot_product_select_column']: robot_product_select_column;
  /** input type for updating data in table "robot.product" */
  ['robot_product_set_input']: {
    id?: string | undefined;
    nft_metadata?: GraphQLTypes['jsonb'] | undefined;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    shopify_id?: string | undefined;
    title?: string | undefined;
  };
  /** aggregate stddev on columns */
  ['robot_product_stddev_fields']: {
    __typename: 'robot_product_stddev_fields';
    nft_token_id?: number | undefined;
  };
  /** aggregate stddev_pop on columns */
  ['robot_product_stddev_pop_fields']: {
    __typename: 'robot_product_stddev_pop_fields';
    nft_token_id?: number | undefined;
  };
  /** aggregate stddev_samp on columns */
  ['robot_product_stddev_samp_fields']: {
    __typename: 'robot_product_stddev_samp_fields';
    nft_token_id?: number | undefined;
  };
  /** Streaming cursor of the table "robot_product" */
  ['robot_product_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: GraphQLTypes['robot_product_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: GraphQLTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['robot_product_stream_cursor_value_input']: {
    id?: string | undefined;
    nft_metadata?: GraphQLTypes['jsonb'] | undefined;
    nft_token_id?: number | undefined;
    notion_id?: string | undefined;
    shopify_id?: string | undefined;
    title?: string | undefined;
  };
  /** aggregate sum on columns */
  ['robot_product_sum_fields']: {
    __typename: 'robot_product_sum_fields';
    nft_token_id?: number | undefined;
  };
  /** update columns of table "robot.product" */
  ['robot_product_update_column']: robot_product_update_column;
  ['robot_product_updates']: {
    /** append existing jsonb value of filtered columns with new jsonb value */
    _append?: GraphQLTypes['robot_product_append_input'] | undefined;
    /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
    _delete_at_path?:
      | GraphQLTypes['robot_product_delete_at_path_input']
      | undefined;
    /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
    _delete_elem?: GraphQLTypes['robot_product_delete_elem_input'] | undefined;
    /** delete key/value pair or string element. key/value pairs are matched based on their key value */
    _delete_key?: GraphQLTypes['robot_product_delete_key_input'] | undefined;
    /** increments the numeric columns with given value of the filtered values */
    _inc?: GraphQLTypes['robot_product_inc_input'] | undefined;
    /** prepend existing jsonb value of filtered columns with new jsonb value */
    _prepend?: GraphQLTypes['robot_product_prepend_input'] | undefined;
    /** sets the columns of the filtered rows to the given values */
    _set?: GraphQLTypes['robot_product_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: GraphQLTypes['robot_product_bool_exp'];
  };
  /** aggregate var_pop on columns */
  ['robot_product_var_pop_fields']: {
    __typename: 'robot_product_var_pop_fields';
    nft_token_id?: number | undefined;
  };
  /** aggregate var_samp on columns */
  ['robot_product_var_samp_fields']: {
    __typename: 'robot_product_var_samp_fields';
    nft_token_id?: number | undefined;
  };
  /** aggregate variance on columns */
  ['robot_product_variance_fields']: {
    __typename: 'robot_product_variance_fields';
    nft_token_id?: number | undefined;
  };
  /** columns and relationships of "shop.api_users" */
  ['shop_api_users']: {
    __typename: 'shop_api_users';
    password_hash: string;
    username: string;
  };
  /** aggregated selection of "shop.api_users" */
  ['shop_api_users_aggregate']: {
    __typename: 'shop_api_users_aggregate';
    aggregate?: GraphQLTypes['shop_api_users_aggregate_fields'] | undefined;
    nodes: Array<GraphQLTypes['shop_api_users']>;
  };
  /** aggregate fields of "shop.api_users" */
  ['shop_api_users_aggregate_fields']: {
    __typename: 'shop_api_users_aggregate_fields';
    count: number;
    max?: GraphQLTypes['shop_api_users_max_fields'] | undefined;
    min?: GraphQLTypes['shop_api_users_min_fields'] | undefined;
  };
  /** Boolean expression to filter rows from the table "shop.api_users". All fields are combined with a logical 'AND'. */
  ['shop_api_users_bool_exp']: {
    _and?: Array<GraphQLTypes['shop_api_users_bool_exp']> | undefined;
    _not?: GraphQLTypes['shop_api_users_bool_exp'] | undefined;
    _or?: Array<GraphQLTypes['shop_api_users_bool_exp']> | undefined;
    password_hash?: GraphQLTypes['String_comparison_exp'] | undefined;
    username?: GraphQLTypes['String_comparison_exp'] | undefined;
  };
  /** unique or primary key constraints on table "shop.api_users" */
  ['shop_api_users_constraint']: shop_api_users_constraint;
  /** input type for inserting data into table "shop.api_users" */
  ['shop_api_users_insert_input']: {
    password_hash?: string | undefined;
    username?: string | undefined;
  };
  /** aggregate max on columns */
  ['shop_api_users_max_fields']: {
    __typename: 'shop_api_users_max_fields';
    password_hash?: string | undefined;
    username?: string | undefined;
  };
  /** aggregate min on columns */
  ['shop_api_users_min_fields']: {
    __typename: 'shop_api_users_min_fields';
    password_hash?: string | undefined;
    username?: string | undefined;
  };
  /** response of any mutation on the table "shop.api_users" */
  ['shop_api_users_mutation_response']: {
    __typename: 'shop_api_users_mutation_response';
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<GraphQLTypes['shop_api_users']>;
  };
  /** on_conflict condition type for table "shop.api_users" */
  ['shop_api_users_on_conflict']: {
    constraint: GraphQLTypes['shop_api_users_constraint'];
    update_columns: Array<GraphQLTypes['shop_api_users_update_column']>;
    where?: GraphQLTypes['shop_api_users_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "shop.api_users". */
  ['shop_api_users_order_by']: {
    password_hash?: GraphQLTypes['order_by'] | undefined;
    username?: GraphQLTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: shop.api_users */
  ['shop_api_users_pk_columns_input']: {
    username: string;
  };
  /** select columns of table "shop.api_users" */
  ['shop_api_users_select_column']: shop_api_users_select_column;
  /** input type for updating data in table "shop.api_users" */
  ['shop_api_users_set_input']: {
    password_hash?: string | undefined;
    username?: string | undefined;
  };
  /** Streaming cursor of the table "shop_api_users" */
  ['shop_api_users_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: GraphQLTypes['shop_api_users_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: GraphQLTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['shop_api_users_stream_cursor_value_input']: {
    password_hash?: string | undefined;
    username?: string | undefined;
  };
  /** update columns of table "shop.api_users" */
  ['shop_api_users_update_column']: shop_api_users_update_column;
  ['shop_api_users_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?: GraphQLTypes['shop_api_users_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: GraphQLTypes['shop_api_users_bool_exp'];
  };
  /** columns and relationships of "shop.product_locks" */
  ['shop_product_locks']: {
    __typename: 'shop_product_locks';
    access_code: string;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    customer_eth_address?: string | undefined;
    lock_id: string;
  };
  /** aggregated selection of "shop.product_locks" */
  ['shop_product_locks_aggregate']: {
    __typename: 'shop_product_locks_aggregate';
    aggregate?: GraphQLTypes['shop_product_locks_aggregate_fields'] | undefined;
    nodes: Array<GraphQLTypes['shop_product_locks']>;
  };
  /** aggregate fields of "shop.product_locks" */
  ['shop_product_locks_aggregate_fields']: {
    __typename: 'shop_product_locks_aggregate_fields';
    count: number;
    max?: GraphQLTypes['shop_product_locks_max_fields'] | undefined;
    min?: GraphQLTypes['shop_product_locks_min_fields'] | undefined;
  };
  /** Boolean expression to filter rows from the table "shop.product_locks". All fields are combined with a logical 'AND'. */
  ['shop_product_locks_bool_exp']: {
    _and?: Array<GraphQLTypes['shop_product_locks_bool_exp']> | undefined;
    _not?: GraphQLTypes['shop_product_locks_bool_exp'] | undefined;
    _or?: Array<GraphQLTypes['shop_product_locks_bool_exp']> | undefined;
    access_code?: GraphQLTypes['String_comparison_exp'] | undefined;
    created_at?: GraphQLTypes['timestamptz_comparison_exp'] | undefined;
    customer_eth_address?: GraphQLTypes['String_comparison_exp'] | undefined;
    lock_id?: GraphQLTypes['String_comparison_exp'] | undefined;
  };
  /** unique or primary key constraints on table "shop.product_locks" */
  ['shop_product_locks_constraint']: shop_product_locks_constraint;
  /** input type for inserting data into table "shop.product_locks" */
  ['shop_product_locks_insert_input']: {
    access_code?: string | undefined;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    customer_eth_address?: string | undefined;
    lock_id?: string | undefined;
  };
  /** aggregate max on columns */
  ['shop_product_locks_max_fields']: {
    __typename: 'shop_product_locks_max_fields';
    access_code?: string | undefined;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    customer_eth_address?: string | undefined;
    lock_id?: string | undefined;
  };
  /** aggregate min on columns */
  ['shop_product_locks_min_fields']: {
    __typename: 'shop_product_locks_min_fields';
    access_code?: string | undefined;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    customer_eth_address?: string | undefined;
    lock_id?: string | undefined;
  };
  /** response of any mutation on the table "shop.product_locks" */
  ['shop_product_locks_mutation_response']: {
    __typename: 'shop_product_locks_mutation_response';
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<GraphQLTypes['shop_product_locks']>;
  };
  /** on_conflict condition type for table "shop.product_locks" */
  ['shop_product_locks_on_conflict']: {
    constraint: GraphQLTypes['shop_product_locks_constraint'];
    update_columns: Array<GraphQLTypes['shop_product_locks_update_column']>;
    where?: GraphQLTypes['shop_product_locks_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "shop.product_locks". */
  ['shop_product_locks_order_by']: {
    access_code?: GraphQLTypes['order_by'] | undefined;
    created_at?: GraphQLTypes['order_by'] | undefined;
    customer_eth_address?: GraphQLTypes['order_by'] | undefined;
    lock_id?: GraphQLTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: shop.product_locks */
  ['shop_product_locks_pk_columns_input']: {
    access_code: string;
    lock_id: string;
  };
  /** select columns of table "shop.product_locks" */
  ['shop_product_locks_select_column']: shop_product_locks_select_column;
  /** input type for updating data in table "shop.product_locks" */
  ['shop_product_locks_set_input']: {
    access_code?: string | undefined;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    customer_eth_address?: string | undefined;
    lock_id?: string | undefined;
  };
  /** Streaming cursor of the table "shop_product_locks" */
  ['shop_product_locks_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: GraphQLTypes['shop_product_locks_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: GraphQLTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['shop_product_locks_stream_cursor_value_input']: {
    access_code?: string | undefined;
    created_at?: GraphQLTypes['timestamptz'] | undefined;
    customer_eth_address?: string | undefined;
    lock_id?: string | undefined;
  };
  /** update columns of table "shop.product_locks" */
  ['shop_product_locks_update_column']: shop_product_locks_update_column;
  ['shop_product_locks_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?: GraphQLTypes['shop_product_locks_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: GraphQLTypes['shop_product_locks_bool_exp'];
  };
  ['subscription_root']: {
    __typename: 'subscription_root';
    /** fetch data from the table: "contribution_votes" */
    contribution_votes: Array<GraphQLTypes['contribution_votes']>;
    /** fetch aggregated fields from the table: "contribution_votes" */
    contribution_votes_aggregate: GraphQLTypes['contribution_votes_aggregate'];
    /** fetch data from the table: "contribution_votes" using primary key columns */
    contribution_votes_by_pk?: GraphQLTypes['contribution_votes'] | undefined;
    /** fetch data from the table in a streaming manner: "contribution_votes" */
    contribution_votes_stream: Array<GraphQLTypes['contribution_votes']>;
    /** fetch data from the table: "contributions" */
    contributions: Array<GraphQLTypes['contributions']>;
    /** fetch aggregated fields from the table: "contributions" */
    contributions_aggregate: GraphQLTypes['contributions_aggregate'];
    /** fetch data from the table: "contributions" using primary key columns */
    contributions_by_pk?: GraphQLTypes['contributions'] | undefined;
    /** fetch data from the table in a streaming manner: "contributions" */
    contributions_stream: Array<GraphQLTypes['contributions']>;
    /** An array relationship */
    contributors: Array<GraphQLTypes['contributors']>;
    /** An aggregate relationship */
    contributors_aggregate: GraphQLTypes['contributors_aggregate'];
    /** fetch data from the table: "contributors" using primary key columns */
    contributors_by_pk?: GraphQLTypes['contributors'] | undefined;
    /** fetch data from the table in a streaming manner: "contributors" */
    contributors_stream: Array<GraphQLTypes['contributors']>;
    /** fetch data from the table: "robot.merkle_claims" */
    robot_merkle_claims: Array<GraphQLTypes['robot_merkle_claims']>;
    /** fetch aggregated fields from the table: "robot.merkle_claims" */
    robot_merkle_claims_aggregate: GraphQLTypes['robot_merkle_claims_aggregate'];
    /** fetch data from the table: "robot.merkle_claims" using primary key columns */
    robot_merkle_claims_by_pk?: GraphQLTypes['robot_merkle_claims'] | undefined;
    /** fetch data from the table in a streaming manner: "robot.merkle_claims" */
    robot_merkle_claims_stream: Array<GraphQLTypes['robot_merkle_claims']>;
    /** fetch data from the table: "robot.merkle_roots" */
    robot_merkle_roots: Array<GraphQLTypes['robot_merkle_roots']>;
    /** fetch aggregated fields from the table: "robot.merkle_roots" */
    robot_merkle_roots_aggregate: GraphQLTypes['robot_merkle_roots_aggregate'];
    /** fetch data from the table: "robot.merkle_roots" using primary key columns */
    robot_merkle_roots_by_pk?: GraphQLTypes['robot_merkle_roots'] | undefined;
    /** fetch data from the table in a streaming manner: "robot.merkle_roots" */
    robot_merkle_roots_stream: Array<GraphQLTypes['robot_merkle_roots']>;
    /** fetch data from the table: "robot.order" */
    robot_order: Array<GraphQLTypes['robot_order']>;
    /** fetch aggregated fields from the table: "robot.order" */
    robot_order_aggregate: GraphQLTypes['robot_order_aggregate'];
    /** fetch data from the table: "robot.order" using primary key columns */
    robot_order_by_pk?: GraphQLTypes['robot_order'] | undefined;
    /** fetch data from the table in a streaming manner: "robot.order" */
    robot_order_stream: Array<GraphQLTypes['robot_order']>;
    /** fetch data from the table: "robot.product" */
    robot_product: Array<GraphQLTypes['robot_product']>;
    /** fetch aggregated fields from the table: "robot.product" */
    robot_product_aggregate: GraphQLTypes['robot_product_aggregate'];
    /** fetch data from the table: "robot.product" using primary key columns */
    robot_product_by_pk?: GraphQLTypes['robot_product'] | undefined;
    /** fetch data from the table: "robot.product_designer" */
    robot_product_designer: Array<GraphQLTypes['robot_product_designer']>;
    /** fetch aggregated fields from the table: "robot.product_designer" */
    robot_product_designer_aggregate: GraphQLTypes['robot_product_designer_aggregate'];
    /** fetch data from the table: "robot.product_designer" using primary key columns */
    robot_product_designer_by_pk?:
      | GraphQLTypes['robot_product_designer']
      | undefined;
    /** fetch data from the table in a streaming manner: "robot.product_designer" */
    robot_product_designer_stream: Array<
      GraphQLTypes['robot_product_designer']
    >;
    /** fetch data from the table in a streaming manner: "robot.product" */
    robot_product_stream: Array<GraphQLTypes['robot_product']>;
    /** fetch data from the table: "shop.api_users" */
    shop_api_users: Array<GraphQLTypes['shop_api_users']>;
    /** fetch aggregated fields from the table: "shop.api_users" */
    shop_api_users_aggregate: GraphQLTypes['shop_api_users_aggregate'];
    /** fetch data from the table: "shop.api_users" using primary key columns */
    shop_api_users_by_pk?: GraphQLTypes['shop_api_users'] | undefined;
    /** fetch data from the table in a streaming manner: "shop.api_users" */
    shop_api_users_stream: Array<GraphQLTypes['shop_api_users']>;
    /** fetch data from the table: "shop.product_locks" */
    shop_product_locks: Array<GraphQLTypes['shop_product_locks']>;
    /** fetch aggregated fields from the table: "shop.product_locks" */
    shop_product_locks_aggregate: GraphQLTypes['shop_product_locks_aggregate'];
    /** fetch data from the table: "shop.product_locks" using primary key columns */
    shop_product_locks_by_pk?: GraphQLTypes['shop_product_locks'] | undefined;
    /** fetch data from the table in a streaming manner: "shop.product_locks" */
    shop_product_locks_stream: Array<GraphQLTypes['shop_product_locks']>;
    /** fetch data from the table: "users" */
    users: Array<GraphQLTypes['users']>;
    /** fetch aggregated fields from the table: "users" */
    users_aggregate: GraphQLTypes['users_aggregate'];
    /** fetch data from the table: "users" using primary key columns */
    users_by_pk?: GraphQLTypes['users'] | undefined;
    /** fetch data from the table in a streaming manner: "users" */
    users_stream: Array<GraphQLTypes['users']>;
  };
  ['timestamptz']: 'scalar' & { name: 'timestamptz' };
  /** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
  ['timestamptz_comparison_exp']: {
    _eq?: GraphQLTypes['timestamptz'] | undefined;
    _gt?: GraphQLTypes['timestamptz'] | undefined;
    _gte?: GraphQLTypes['timestamptz'] | undefined;
    _in?: Array<GraphQLTypes['timestamptz']> | undefined;
    _is_null?: boolean | undefined;
    _lt?: GraphQLTypes['timestamptz'] | undefined;
    _lte?: GraphQLTypes['timestamptz'] | undefined;
    _neq?: GraphQLTypes['timestamptz'] | undefined;
    _nin?: Array<GraphQLTypes['timestamptz']> | undefined;
  };
  /** columns and relationships of "users" */
  ['users']: {
    __typename: 'users';
    eth_address: string;
    id: GraphQLTypes['uuid'];
    name: string;
  };
  /** aggregated selection of "users" */
  ['users_aggregate']: {
    __typename: 'users_aggregate';
    aggregate?: GraphQLTypes['users_aggregate_fields'] | undefined;
    nodes: Array<GraphQLTypes['users']>;
  };
  /** aggregate fields of "users" */
  ['users_aggregate_fields']: {
    __typename: 'users_aggregate_fields';
    count: number;
    max?: GraphQLTypes['users_max_fields'] | undefined;
    min?: GraphQLTypes['users_min_fields'] | undefined;
  };
  /** Boolean expression to filter rows from the table "users". All fields are combined with a logical 'AND'. */
  ['users_bool_exp']: {
    _and?: Array<GraphQLTypes['users_bool_exp']> | undefined;
    _not?: GraphQLTypes['users_bool_exp'] | undefined;
    _or?: Array<GraphQLTypes['users_bool_exp']> | undefined;
    eth_address?: GraphQLTypes['String_comparison_exp'] | undefined;
    id?: GraphQLTypes['uuid_comparison_exp'] | undefined;
    name?: GraphQLTypes['String_comparison_exp'] | undefined;
  };
  /** unique or primary key constraints on table "users" */
  ['users_constraint']: users_constraint;
  /** input type for inserting data into table "users" */
  ['users_insert_input']: {
    eth_address?: string | undefined;
    id?: GraphQLTypes['uuid'] | undefined;
    name?: string | undefined;
  };
  /** aggregate max on columns */
  ['users_max_fields']: {
    __typename: 'users_max_fields';
    eth_address?: string | undefined;
    id?: GraphQLTypes['uuid'] | undefined;
    name?: string | undefined;
  };
  /** aggregate min on columns */
  ['users_min_fields']: {
    __typename: 'users_min_fields';
    eth_address?: string | undefined;
    id?: GraphQLTypes['uuid'] | undefined;
    name?: string | undefined;
  };
  /** response of any mutation on the table "users" */
  ['users_mutation_response']: {
    __typename: 'users_mutation_response';
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: Array<GraphQLTypes['users']>;
  };
  /** input type for inserting object relation for remote table "users" */
  ['users_obj_rel_insert_input']: {
    data: GraphQLTypes['users_insert_input'];
    /** upsert condition */
    on_conflict?: GraphQLTypes['users_on_conflict'] | undefined;
  };
  /** on_conflict condition type for table "users" */
  ['users_on_conflict']: {
    constraint: GraphQLTypes['users_constraint'];
    update_columns: Array<GraphQLTypes['users_update_column']>;
    where?: GraphQLTypes['users_bool_exp'] | undefined;
  };
  /** Ordering options when selecting data from "users". */
  ['users_order_by']: {
    eth_address?: GraphQLTypes['order_by'] | undefined;
    id?: GraphQLTypes['order_by'] | undefined;
    name?: GraphQLTypes['order_by'] | undefined;
  };
  /** primary key columns input for table: users */
  ['users_pk_columns_input']: {
    id: GraphQLTypes['uuid'];
  };
  /** select columns of table "users" */
  ['users_select_column']: users_select_column;
  /** input type for updating data in table "users" */
  ['users_set_input']: {
    eth_address?: string | undefined;
    id?: GraphQLTypes['uuid'] | undefined;
    name?: string | undefined;
  };
  /** Streaming cursor of the table "users" */
  ['users_stream_cursor_input']: {
    /** Stream column input with initial value */
    initial_value: GraphQLTypes['users_stream_cursor_value_input'];
    /** cursor ordering */
    ordering?: GraphQLTypes['cursor_ordering'] | undefined;
  };
  /** Initial value of the column from where the streaming should start */
  ['users_stream_cursor_value_input']: {
    eth_address?: string | undefined;
    id?: GraphQLTypes['uuid'] | undefined;
    name?: string | undefined;
  };
  /** update columns of table "users" */
  ['users_update_column']: users_update_column;
  ['users_updates']: {
    /** sets the columns of the filtered rows to the given values */
    _set?: GraphQLTypes['users_set_input'] | undefined;
    /** filter the rows which have to be updated */
    where: GraphQLTypes['users_bool_exp'];
  };
  ['uuid']: 'scalar' & { name: 'uuid' };
  /** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
  ['uuid_comparison_exp']: {
    _eq?: GraphQLTypes['uuid'] | undefined;
    _gt?: GraphQLTypes['uuid'] | undefined;
    _gte?: GraphQLTypes['uuid'] | undefined;
    _in?: Array<GraphQLTypes['uuid']> | undefined;
    _is_null?: boolean | undefined;
    _lt?: GraphQLTypes['uuid'] | undefined;
    _lte?: GraphQLTypes['uuid'] | undefined;
    _neq?: GraphQLTypes['uuid'] | undefined;
    _nin?: Array<GraphQLTypes['uuid']> | undefined;
  };
};
/** unique or primary key constraints on table "contribution_votes" */
export const enum contribution_votes_constraint {
  contribution_votes_pkey = 'contribution_votes_pkey',
}
/** select columns of table "contribution_votes" */
export const enum contribution_votes_select_column {
  contribution_id = 'contribution_id',
  rating = 'rating',
  user_id = 'user_id',
}
/** update columns of table "contribution_votes" */
export const enum contribution_votes_update_column {
  contribution_id = 'contribution_id',
  rating = 'rating',
  user_id = 'user_id',
}
/** unique or primary key constraints on table "contributions" */
export const enum contributions_constraint {
  contributions_pkey = 'contributions_pkey',
}
/** select columns of table "contributions" */
export const enum contributions_select_column {
  artifact = 'artifact',
  category = 'category',
  created_at = 'created_at',
  created_by = 'created_by',
  date = 'date',
  description = 'description',
  effort = 'effort',
  id = 'id',
  impact = 'impact',
  title = 'title',
  weight = 'weight',
}
/** update columns of table "contributions" */
export const enum contributions_update_column {
  artifact = 'artifact',
  category = 'category',
  created_at = 'created_at',
  created_by = 'created_by',
  date = 'date',
  description = 'description',
  effort = 'effort',
  id = 'id',
  impact = 'impact',
  title = 'title',
  weight = 'weight',
}
/** unique or primary key constraints on table "contributors" */
export const enum contributors_constraint {
  contributors_pkey = 'contributors_pkey',
}
/** select columns of table "contributors" */
export const enum contributors_select_column {
  contribution_id = 'contribution_id',
  contribution_share = 'contribution_share',
  user_id = 'user_id',
}
/** update columns of table "contributors" */
export const enum contributors_update_column {
  contribution_id = 'contribution_id',
  contribution_share = 'contribution_share',
  user_id = 'user_id',
}
/** ordering argument of a cursor */
export const enum cursor_ordering {
  ASC = 'ASC',
  DESC = 'DESC',
}
/** column ordering options */
export const enum order_by {
  asc = 'asc',
  asc_nulls_first = 'asc_nulls_first',
  asc_nulls_last = 'asc_nulls_last',
  desc = 'desc',
  desc_nulls_first = 'desc_nulls_first',
  desc_nulls_last = 'desc_nulls_last',
}
/** unique or primary key constraints on table "robot.merkle_claims" */
export const enum robot_merkle_claims_constraint {
  merkle_claims_pkey = 'merkle_claims_pkey',
}
/** select columns of table "robot.merkle_claims" */
export const enum robot_merkle_claims_select_column {
  claim_json = 'claim_json',
  id = 'id',
  merkle_root_hash = 'merkle_root_hash',
  recipient_eth_address = 'recipient_eth_address',
}
/** update columns of table "robot.merkle_claims" */
export const enum robot_merkle_claims_update_column {
  claim_json = 'claim_json',
  id = 'id',
  merkle_root_hash = 'merkle_root_hash',
  recipient_eth_address = 'recipient_eth_address',
}
/** unique or primary key constraints on table "robot.merkle_roots" */
export const enum robot_merkle_roots_constraint {
  merkle_roots_pkey = 'merkle_roots_pkey',
}
/** select columns of table "robot.merkle_roots" */
export const enum robot_merkle_roots_select_column {
  contract_address = 'contract_address',
  created_at = 'created_at',
  hash = 'hash',
  network = 'network',
}
/** update columns of table "robot.merkle_roots" */
export const enum robot_merkle_roots_update_column {
  contract_address = 'contract_address',
  created_at = 'created_at',
  hash = 'hash',
  network = 'network',
}
/** unique or primary key constraints on table "robot.order" */
export const enum robot_order_constraint {
  order_pkey = 'order_pkey',
}
/** select columns of table "robot.order" */
export const enum robot_order_select_column {
  buyer_address = 'buyer_address',
  buyer_reward = 'buyer_reward',
  date = 'date',
  dollars_spent = 'dollars_spent',
  order_id = 'order_id',
  order_number = 'order_number',
  season = 'season',
}
/** update columns of table "robot.order" */
export const enum robot_order_update_column {
  buyer_address = 'buyer_address',
  buyer_reward = 'buyer_reward',
  date = 'date',
  dollars_spent = 'dollars_spent',
  order_id = 'order_id',
  order_number = 'order_number',
  season = 'season',
}
/** unique or primary key constraints on table "robot.product" */
export const enum robot_product_constraint {
  product_nft_token_id_key = 'product_nft_token_id_key',
  product_notion_id_shopify_id_key = 'product_notion_id_shopify_id_key',
  product_pkey = 'product_pkey',
  product_shopify_id_key = 'product_shopify_id_key',
}
/** unique or primary key constraints on table "robot.product_designer" */
export const enum robot_product_designer_constraint {
  product_designer_pkey = 'product_designer_pkey',
}
/** select columns of table "robot.product_designer" */
export const enum robot_product_designer_select_column {
  contribution_share = 'contribution_share',
  designer_name = 'designer_name',
  eth_address = 'eth_address',
  product_id = 'product_id',
  robot_reward = 'robot_reward',
}
/** update columns of table "robot.product_designer" */
export const enum robot_product_designer_update_column {
  contribution_share = 'contribution_share',
  designer_name = 'designer_name',
  eth_address = 'eth_address',
  product_id = 'product_id',
  robot_reward = 'robot_reward',
}
/** select columns of table "robot.product" */
export const enum robot_product_select_column {
  id = 'id',
  nft_metadata = 'nft_metadata',
  nft_token_id = 'nft_token_id',
  notion_id = 'notion_id',
  shopify_id = 'shopify_id',
  title = 'title',
}
/** update columns of table "robot.product" */
export const enum robot_product_update_column {
  id = 'id',
  nft_metadata = 'nft_metadata',
  nft_token_id = 'nft_token_id',
  notion_id = 'notion_id',
  shopify_id = 'shopify_id',
  title = 'title',
}
/** unique or primary key constraints on table "shop.api_users" */
export const enum shop_api_users_constraint {
  api_users_password_hash_key = 'api_users_password_hash_key',
  api_users_pkey = 'api_users_pkey',
}
/** select columns of table "shop.api_users" */
export const enum shop_api_users_select_column {
  password_hash = 'password_hash',
  username = 'username',
}
/** update columns of table "shop.api_users" */
export const enum shop_api_users_update_column {
  password_hash = 'password_hash',
  username = 'username',
}
/** unique or primary key constraints on table "shop.product_locks" */
export const enum shop_product_locks_constraint {
  product_locks_pkey = 'product_locks_pkey',
}
/** select columns of table "shop.product_locks" */
export const enum shop_product_locks_select_column {
  access_code = 'access_code',
  created_at = 'created_at',
  customer_eth_address = 'customer_eth_address',
  lock_id = 'lock_id',
}
/** update columns of table "shop.product_locks" */
export const enum shop_product_locks_update_column {
  access_code = 'access_code',
  created_at = 'created_at',
  customer_eth_address = 'customer_eth_address',
  lock_id = 'lock_id',
}
/** unique or primary key constraints on table "users" */
export const enum users_constraint {
  users_eth_address_key = 'users_eth_address_key',
  users_pkey = 'users_pkey',
}
/** select columns of table "users" */
export const enum users_select_column {
  eth_address = 'eth_address',
  id = 'id',
  name = 'name',
}
/** update columns of table "users" */
export const enum users_update_column {
  eth_address = 'eth_address',
  id = 'id',
  name = 'name',
}

type ZEUS_VARIABLES = {
  ['Int_comparison_exp']: ValueTypes['Int_comparison_exp'];
  ['String_comparison_exp']: ValueTypes['String_comparison_exp'];
  ['contribution_votes_aggregate_bool_exp']: ValueTypes['contribution_votes_aggregate_bool_exp'];
  ['contribution_votes_aggregate_bool_exp_count']: ValueTypes['contribution_votes_aggregate_bool_exp_count'];
  ['contribution_votes_aggregate_order_by']: ValueTypes['contribution_votes_aggregate_order_by'];
  ['contribution_votes_arr_rel_insert_input']: ValueTypes['contribution_votes_arr_rel_insert_input'];
  ['contribution_votes_bool_exp']: ValueTypes['contribution_votes_bool_exp'];
  ['contribution_votes_constraint']: ValueTypes['contribution_votes_constraint'];
  ['contribution_votes_insert_input']: ValueTypes['contribution_votes_insert_input'];
  ['contribution_votes_max_order_by']: ValueTypes['contribution_votes_max_order_by'];
  ['contribution_votes_min_order_by']: ValueTypes['contribution_votes_min_order_by'];
  ['contribution_votes_on_conflict']: ValueTypes['contribution_votes_on_conflict'];
  ['contribution_votes_order_by']: ValueTypes['contribution_votes_order_by'];
  ['contribution_votes_pk_columns_input']: ValueTypes['contribution_votes_pk_columns_input'];
  ['contribution_votes_select_column']: ValueTypes['contribution_votes_select_column'];
  ['contribution_votes_set_input']: ValueTypes['contribution_votes_set_input'];
  ['contribution_votes_stream_cursor_input']: ValueTypes['contribution_votes_stream_cursor_input'];
  ['contribution_votes_stream_cursor_value_input']: ValueTypes['contribution_votes_stream_cursor_value_input'];
  ['contribution_votes_update_column']: ValueTypes['contribution_votes_update_column'];
  ['contribution_votes_updates']: ValueTypes['contribution_votes_updates'];
  ['contributions_bool_exp']: ValueTypes['contributions_bool_exp'];
  ['contributions_constraint']: ValueTypes['contributions_constraint'];
  ['contributions_inc_input']: ValueTypes['contributions_inc_input'];
  ['contributions_insert_input']: ValueTypes['contributions_insert_input'];
  ['contributions_obj_rel_insert_input']: ValueTypes['contributions_obj_rel_insert_input'];
  ['contributions_on_conflict']: ValueTypes['contributions_on_conflict'];
  ['contributions_order_by']: ValueTypes['contributions_order_by'];
  ['contributions_pk_columns_input']: ValueTypes['contributions_pk_columns_input'];
  ['contributions_select_column']: ValueTypes['contributions_select_column'];
  ['contributions_set_input']: ValueTypes['contributions_set_input'];
  ['contributions_stream_cursor_input']: ValueTypes['contributions_stream_cursor_input'];
  ['contributions_stream_cursor_value_input']: ValueTypes['contributions_stream_cursor_value_input'];
  ['contributions_update_column']: ValueTypes['contributions_update_column'];
  ['contributions_updates']: ValueTypes['contributions_updates'];
  ['contributors_aggregate_bool_exp']: ValueTypes['contributors_aggregate_bool_exp'];
  ['contributors_aggregate_bool_exp_count']: ValueTypes['contributors_aggregate_bool_exp_count'];
  ['contributors_aggregate_order_by']: ValueTypes['contributors_aggregate_order_by'];
  ['contributors_arr_rel_insert_input']: ValueTypes['contributors_arr_rel_insert_input'];
  ['contributors_avg_order_by']: ValueTypes['contributors_avg_order_by'];
  ['contributors_bool_exp']: ValueTypes['contributors_bool_exp'];
  ['contributors_constraint']: ValueTypes['contributors_constraint'];
  ['contributors_inc_input']: ValueTypes['contributors_inc_input'];
  ['contributors_insert_input']: ValueTypes['contributors_insert_input'];
  ['contributors_max_order_by']: ValueTypes['contributors_max_order_by'];
  ['contributors_min_order_by']: ValueTypes['contributors_min_order_by'];
  ['contributors_on_conflict']: ValueTypes['contributors_on_conflict'];
  ['contributors_order_by']: ValueTypes['contributors_order_by'];
  ['contributors_pk_columns_input']: ValueTypes['contributors_pk_columns_input'];
  ['contributors_select_column']: ValueTypes['contributors_select_column'];
  ['contributors_set_input']: ValueTypes['contributors_set_input'];
  ['contributors_stddev_order_by']: ValueTypes['contributors_stddev_order_by'];
  ['contributors_stddev_pop_order_by']: ValueTypes['contributors_stddev_pop_order_by'];
  ['contributors_stddev_samp_order_by']: ValueTypes['contributors_stddev_samp_order_by'];
  ['contributors_stream_cursor_input']: ValueTypes['contributors_stream_cursor_input'];
  ['contributors_stream_cursor_value_input']: ValueTypes['contributors_stream_cursor_value_input'];
  ['contributors_sum_order_by']: ValueTypes['contributors_sum_order_by'];
  ['contributors_update_column']: ValueTypes['contributors_update_column'];
  ['contributors_updates']: ValueTypes['contributors_updates'];
  ['contributors_var_pop_order_by']: ValueTypes['contributors_var_pop_order_by'];
  ['contributors_var_samp_order_by']: ValueTypes['contributors_var_samp_order_by'];
  ['contributors_variance_order_by']: ValueTypes['contributors_variance_order_by'];
  ['cursor_ordering']: ValueTypes['cursor_ordering'];
  ['date']: ValueTypes['date'];
  ['date_comparison_exp']: ValueTypes['date_comparison_exp'];
  ['jsonb']: ValueTypes['jsonb'];
  ['jsonb_cast_exp']: ValueTypes['jsonb_cast_exp'];
  ['jsonb_comparison_exp']: ValueTypes['jsonb_comparison_exp'];
  ['numeric']: ValueTypes['numeric'];
  ['numeric_comparison_exp']: ValueTypes['numeric_comparison_exp'];
  ['order_by']: ValueTypes['order_by'];
  ['robot_merkle_claims_aggregate_bool_exp']: ValueTypes['robot_merkle_claims_aggregate_bool_exp'];
  ['robot_merkle_claims_aggregate_bool_exp_count']: ValueTypes['robot_merkle_claims_aggregate_bool_exp_count'];
  ['robot_merkle_claims_aggregate_order_by']: ValueTypes['robot_merkle_claims_aggregate_order_by'];
  ['robot_merkle_claims_append_input']: ValueTypes['robot_merkle_claims_append_input'];
  ['robot_merkle_claims_arr_rel_insert_input']: ValueTypes['robot_merkle_claims_arr_rel_insert_input'];
  ['robot_merkle_claims_bool_exp']: ValueTypes['robot_merkle_claims_bool_exp'];
  ['robot_merkle_claims_constraint']: ValueTypes['robot_merkle_claims_constraint'];
  ['robot_merkle_claims_delete_at_path_input']: ValueTypes['robot_merkle_claims_delete_at_path_input'];
  ['robot_merkle_claims_delete_elem_input']: ValueTypes['robot_merkle_claims_delete_elem_input'];
  ['robot_merkle_claims_delete_key_input']: ValueTypes['robot_merkle_claims_delete_key_input'];
  ['robot_merkle_claims_insert_input']: ValueTypes['robot_merkle_claims_insert_input'];
  ['robot_merkle_claims_max_order_by']: ValueTypes['robot_merkle_claims_max_order_by'];
  ['robot_merkle_claims_min_order_by']: ValueTypes['robot_merkle_claims_min_order_by'];
  ['robot_merkle_claims_on_conflict']: ValueTypes['robot_merkle_claims_on_conflict'];
  ['robot_merkle_claims_order_by']: ValueTypes['robot_merkle_claims_order_by'];
  ['robot_merkle_claims_pk_columns_input']: ValueTypes['robot_merkle_claims_pk_columns_input'];
  ['robot_merkle_claims_prepend_input']: ValueTypes['robot_merkle_claims_prepend_input'];
  ['robot_merkle_claims_select_column']: ValueTypes['robot_merkle_claims_select_column'];
  ['robot_merkle_claims_set_input']: ValueTypes['robot_merkle_claims_set_input'];
  ['robot_merkle_claims_stream_cursor_input']: ValueTypes['robot_merkle_claims_stream_cursor_input'];
  ['robot_merkle_claims_stream_cursor_value_input']: ValueTypes['robot_merkle_claims_stream_cursor_value_input'];
  ['robot_merkle_claims_update_column']: ValueTypes['robot_merkle_claims_update_column'];
  ['robot_merkle_claims_updates']: ValueTypes['robot_merkle_claims_updates'];
  ['robot_merkle_roots_bool_exp']: ValueTypes['robot_merkle_roots_bool_exp'];
  ['robot_merkle_roots_constraint']: ValueTypes['robot_merkle_roots_constraint'];
  ['robot_merkle_roots_insert_input']: ValueTypes['robot_merkle_roots_insert_input'];
  ['robot_merkle_roots_obj_rel_insert_input']: ValueTypes['robot_merkle_roots_obj_rel_insert_input'];
  ['robot_merkle_roots_on_conflict']: ValueTypes['robot_merkle_roots_on_conflict'];
  ['robot_merkle_roots_order_by']: ValueTypes['robot_merkle_roots_order_by'];
  ['robot_merkle_roots_pk_columns_input']: ValueTypes['robot_merkle_roots_pk_columns_input'];
  ['robot_merkle_roots_select_column']: ValueTypes['robot_merkle_roots_select_column'];
  ['robot_merkle_roots_set_input']: ValueTypes['robot_merkle_roots_set_input'];
  ['robot_merkle_roots_stream_cursor_input']: ValueTypes['robot_merkle_roots_stream_cursor_input'];
  ['robot_merkle_roots_stream_cursor_value_input']: ValueTypes['robot_merkle_roots_stream_cursor_value_input'];
  ['robot_merkle_roots_update_column']: ValueTypes['robot_merkle_roots_update_column'];
  ['robot_merkle_roots_updates']: ValueTypes['robot_merkle_roots_updates'];
  ['robot_order_bool_exp']: ValueTypes['robot_order_bool_exp'];
  ['robot_order_constraint']: ValueTypes['robot_order_constraint'];
  ['robot_order_inc_input']: ValueTypes['robot_order_inc_input'];
  ['robot_order_insert_input']: ValueTypes['robot_order_insert_input'];
  ['robot_order_on_conflict']: ValueTypes['robot_order_on_conflict'];
  ['robot_order_order_by']: ValueTypes['robot_order_order_by'];
  ['robot_order_pk_columns_input']: ValueTypes['robot_order_pk_columns_input'];
  ['robot_order_select_column']: ValueTypes['robot_order_select_column'];
  ['robot_order_set_input']: ValueTypes['robot_order_set_input'];
  ['robot_order_stream_cursor_input']: ValueTypes['robot_order_stream_cursor_input'];
  ['robot_order_stream_cursor_value_input']: ValueTypes['robot_order_stream_cursor_value_input'];
  ['robot_order_update_column']: ValueTypes['robot_order_update_column'];
  ['robot_order_updates']: ValueTypes['robot_order_updates'];
  ['robot_product_append_input']: ValueTypes['robot_product_append_input'];
  ['robot_product_bool_exp']: ValueTypes['robot_product_bool_exp'];
  ['robot_product_constraint']: ValueTypes['robot_product_constraint'];
  ['robot_product_delete_at_path_input']: ValueTypes['robot_product_delete_at_path_input'];
  ['robot_product_delete_elem_input']: ValueTypes['robot_product_delete_elem_input'];
  ['robot_product_delete_key_input']: ValueTypes['robot_product_delete_key_input'];
  ['robot_product_designer_aggregate_bool_exp']: ValueTypes['robot_product_designer_aggregate_bool_exp'];
  ['robot_product_designer_aggregate_bool_exp_count']: ValueTypes['robot_product_designer_aggregate_bool_exp_count'];
  ['robot_product_designer_aggregate_order_by']: ValueTypes['robot_product_designer_aggregate_order_by'];
  ['robot_product_designer_arr_rel_insert_input']: ValueTypes['robot_product_designer_arr_rel_insert_input'];
  ['robot_product_designer_avg_order_by']: ValueTypes['robot_product_designer_avg_order_by'];
  ['robot_product_designer_bool_exp']: ValueTypes['robot_product_designer_bool_exp'];
  ['robot_product_designer_constraint']: ValueTypes['robot_product_designer_constraint'];
  ['robot_product_designer_inc_input']: ValueTypes['robot_product_designer_inc_input'];
  ['robot_product_designer_insert_input']: ValueTypes['robot_product_designer_insert_input'];
  ['robot_product_designer_max_order_by']: ValueTypes['robot_product_designer_max_order_by'];
  ['robot_product_designer_min_order_by']: ValueTypes['robot_product_designer_min_order_by'];
  ['robot_product_designer_on_conflict']: ValueTypes['robot_product_designer_on_conflict'];
  ['robot_product_designer_order_by']: ValueTypes['robot_product_designer_order_by'];
  ['robot_product_designer_pk_columns_input']: ValueTypes['robot_product_designer_pk_columns_input'];
  ['robot_product_designer_select_column']: ValueTypes['robot_product_designer_select_column'];
  ['robot_product_designer_set_input']: ValueTypes['robot_product_designer_set_input'];
  ['robot_product_designer_stddev_order_by']: ValueTypes['robot_product_designer_stddev_order_by'];
  ['robot_product_designer_stddev_pop_order_by']: ValueTypes['robot_product_designer_stddev_pop_order_by'];
  ['robot_product_designer_stddev_samp_order_by']: ValueTypes['robot_product_designer_stddev_samp_order_by'];
  ['robot_product_designer_stream_cursor_input']: ValueTypes['robot_product_designer_stream_cursor_input'];
  ['robot_product_designer_stream_cursor_value_input']: ValueTypes['robot_product_designer_stream_cursor_value_input'];
  ['robot_product_designer_sum_order_by']: ValueTypes['robot_product_designer_sum_order_by'];
  ['robot_product_designer_update_column']: ValueTypes['robot_product_designer_update_column'];
  ['robot_product_designer_updates']: ValueTypes['robot_product_designer_updates'];
  ['robot_product_designer_var_pop_order_by']: ValueTypes['robot_product_designer_var_pop_order_by'];
  ['robot_product_designer_var_samp_order_by']: ValueTypes['robot_product_designer_var_samp_order_by'];
  ['robot_product_designer_variance_order_by']: ValueTypes['robot_product_designer_variance_order_by'];
  ['robot_product_inc_input']: ValueTypes['robot_product_inc_input'];
  ['robot_product_insert_input']: ValueTypes['robot_product_insert_input'];
  ['robot_product_obj_rel_insert_input']: ValueTypes['robot_product_obj_rel_insert_input'];
  ['robot_product_on_conflict']: ValueTypes['robot_product_on_conflict'];
  ['robot_product_order_by']: ValueTypes['robot_product_order_by'];
  ['robot_product_pk_columns_input']: ValueTypes['robot_product_pk_columns_input'];
  ['robot_product_prepend_input']: ValueTypes['robot_product_prepend_input'];
  ['robot_product_select_column']: ValueTypes['robot_product_select_column'];
  ['robot_product_set_input']: ValueTypes['robot_product_set_input'];
  ['robot_product_stream_cursor_input']: ValueTypes['robot_product_stream_cursor_input'];
  ['robot_product_stream_cursor_value_input']: ValueTypes['robot_product_stream_cursor_value_input'];
  ['robot_product_update_column']: ValueTypes['robot_product_update_column'];
  ['robot_product_updates']: ValueTypes['robot_product_updates'];
  ['shop_api_users_bool_exp']: ValueTypes['shop_api_users_bool_exp'];
  ['shop_api_users_constraint']: ValueTypes['shop_api_users_constraint'];
  ['shop_api_users_insert_input']: ValueTypes['shop_api_users_insert_input'];
  ['shop_api_users_on_conflict']: ValueTypes['shop_api_users_on_conflict'];
  ['shop_api_users_order_by']: ValueTypes['shop_api_users_order_by'];
  ['shop_api_users_pk_columns_input']: ValueTypes['shop_api_users_pk_columns_input'];
  ['shop_api_users_select_column']: ValueTypes['shop_api_users_select_column'];
  ['shop_api_users_set_input']: ValueTypes['shop_api_users_set_input'];
  ['shop_api_users_stream_cursor_input']: ValueTypes['shop_api_users_stream_cursor_input'];
  ['shop_api_users_stream_cursor_value_input']: ValueTypes['shop_api_users_stream_cursor_value_input'];
  ['shop_api_users_update_column']: ValueTypes['shop_api_users_update_column'];
  ['shop_api_users_updates']: ValueTypes['shop_api_users_updates'];
  ['shop_product_locks_bool_exp']: ValueTypes['shop_product_locks_bool_exp'];
  ['shop_product_locks_constraint']: ValueTypes['shop_product_locks_constraint'];
  ['shop_product_locks_insert_input']: ValueTypes['shop_product_locks_insert_input'];
  ['shop_product_locks_on_conflict']: ValueTypes['shop_product_locks_on_conflict'];
  ['shop_product_locks_order_by']: ValueTypes['shop_product_locks_order_by'];
  ['shop_product_locks_pk_columns_input']: ValueTypes['shop_product_locks_pk_columns_input'];
  ['shop_product_locks_select_column']: ValueTypes['shop_product_locks_select_column'];
  ['shop_product_locks_set_input']: ValueTypes['shop_product_locks_set_input'];
  ['shop_product_locks_stream_cursor_input']: ValueTypes['shop_product_locks_stream_cursor_input'];
  ['shop_product_locks_stream_cursor_value_input']: ValueTypes['shop_product_locks_stream_cursor_value_input'];
  ['shop_product_locks_update_column']: ValueTypes['shop_product_locks_update_column'];
  ['shop_product_locks_updates']: ValueTypes['shop_product_locks_updates'];
  ['timestamptz']: ValueTypes['timestamptz'];
  ['timestamptz_comparison_exp']: ValueTypes['timestamptz_comparison_exp'];
  ['users_bool_exp']: ValueTypes['users_bool_exp'];
  ['users_constraint']: ValueTypes['users_constraint'];
  ['users_insert_input']: ValueTypes['users_insert_input'];
  ['users_obj_rel_insert_input']: ValueTypes['users_obj_rel_insert_input'];
  ['users_on_conflict']: ValueTypes['users_on_conflict'];
  ['users_order_by']: ValueTypes['users_order_by'];
  ['users_pk_columns_input']: ValueTypes['users_pk_columns_input'];
  ['users_select_column']: ValueTypes['users_select_column'];
  ['users_set_input']: ValueTypes['users_set_input'];
  ['users_stream_cursor_input']: ValueTypes['users_stream_cursor_input'];
  ['users_stream_cursor_value_input']: ValueTypes['users_stream_cursor_value_input'];
  ['users_update_column']: ValueTypes['users_update_column'];
  ['users_updates']: ValueTypes['users_updates'];
  ['uuid']: ValueTypes['uuid'];
  ['uuid_comparison_exp']: ValueTypes['uuid_comparison_exp'];
};
