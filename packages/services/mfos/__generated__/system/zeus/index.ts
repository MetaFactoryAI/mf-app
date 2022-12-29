/* eslint-disable */

import { AllTypesProps, ReturnTypes, Ops } from './const';
import fetch, { Response } from 'node-fetch';
import WebSocket from 'ws';
export const HOST = 'http://localhost:8055/graphql/system';

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
  return response.json();
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
    : any,
) => fn as (args?: any, source?: any) => any;

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
  JSON?: ScalarResolver;
  Hash?: ScalarResolver;
  GraphQLStringOrFloat?: ScalarResolver;
  Date?: ScalarResolver;
  GraphQLBigInt?: ScalarResolver;
  Void?: ScalarResolver;
};
type ZEUS_UNIONS = never;

export type ValueTypes = {
  ['Query']: AliasType<{
    extensions?: ValueTypes['extensions'];
    server_specs_oas?: boolean | `@${string}`;
    server_specs_graphql?: [
      {
        scope?:
          | ValueTypes['graphql_sdl_scope']
          | undefined
          | null
          | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    server_ping?: boolean | `@${string}`;
    server_info?: ValueTypes['server_info'];
    server_health?: boolean | `@${string}`;
    collections?: ValueTypes['directus_collections'];
    collections_by_name?: [
      { name: string | Variable<any, string> },
      ValueTypes['directus_collections'],
    ];
    fields?: ValueTypes['directus_fields'];
    fields_in_collection?: [
      { collection: string | Variable<any, string> },
      ValueTypes['directus_fields'],
    ];
    fields_by_name?: [
      {
        collection: string | Variable<any, string>;
        field: string | Variable<any, string>;
      },
      ValueTypes['directus_fields'],
    ];
    relations?: ValueTypes['directus_relations'];
    relations_in_collection?: [
      { collection: string | Variable<any, string> },
      ValueTypes['directus_relations'],
    ];
    relations_by_name?: [
      {
        collection: string | Variable<any, string>;
        field: string | Variable<any, string>;
      },
      ValueTypes['directus_relations'],
    ];
    users_me?: ValueTypes['directus_users'];
    roles?: [
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
    roles_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['directus_roles'],
    ];
    roles_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['directus_roles_filter']
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
      ValueTypes['directus_roles_aggregated'],
    ];
    folders?: [
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
    folders_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['directus_folders'],
    ];
    folders_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['directus_folders_filter']
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
      ValueTypes['directus_folders_aggregated'],
    ];
    activity?: [
      {
        filter?:
          | ValueTypes['directus_activity_filter']
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
      ValueTypes['directus_activity'],
    ];
    activity_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['directus_activity'],
    ];
    activity_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['directus_activity_filter']
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
      ValueTypes['directus_activity_aggregated'],
    ];
    permissions?: [
      {
        filter?:
          | ValueTypes['directus_permissions_filter']
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
      ValueTypes['directus_permissions'],
    ];
    permissions_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['directus_permissions'],
    ];
    permissions_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['directus_permissions_filter']
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
      ValueTypes['directus_permissions_aggregated'],
    ];
    files?: [
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
    files_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['directus_files'],
    ];
    files_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['directus_files_filter']
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
      ValueTypes['directus_files_aggregated'],
    ];
    revisions?: [
      {
        filter?:
          | ValueTypes['directus_revisions_filter']
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
      ValueTypes['directus_revisions'],
    ];
    revisions_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['directus_revisions'],
    ];
    revisions_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['directus_revisions_filter']
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
      ValueTypes['directus_revisions_aggregated'],
    ];
    presets?: [
      {
        filter?:
          | ValueTypes['directus_presets_filter']
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
      ValueTypes['directus_presets'],
    ];
    presets_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['directus_presets'],
    ];
    presets_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['directus_presets_filter']
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
      ValueTypes['directus_presets_aggregated'],
    ];
    panels?: [
      {
        filter?:
          | ValueTypes['directus_panels_filter']
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
      ValueTypes['directus_panels'],
    ];
    panels_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['directus_panels'],
    ];
    panels_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['directus_panels_filter']
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
      ValueTypes['directus_panels_aggregated'],
    ];
    webhooks?: [
      {
        filter?:
          | ValueTypes['directus_webhooks_filter']
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
      ValueTypes['directus_webhooks'],
    ];
    webhooks_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['directus_webhooks'],
    ];
    webhooks_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['directus_webhooks_filter']
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
      ValueTypes['directus_webhooks_aggregated'],
    ];
    dashboards?: [
      {
        filter?:
          | ValueTypes['directus_dashboards_filter']
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
      ValueTypes['directus_dashboards'],
    ];
    dashboards_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['directus_dashboards'],
    ];
    dashboards_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['directus_dashboards_filter']
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
      ValueTypes['directus_dashboards_aggregated'],
    ];
    notifications?: [
      {
        filter?:
          | ValueTypes['directus_notifications_filter']
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
      ValueTypes['directus_notifications'],
    ];
    notifications_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['directus_notifications'],
    ];
    notifications_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['directus_notifications_filter']
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
      ValueTypes['directus_notifications_aggregated'],
    ];
    shares?: [
      {
        filter?:
          | ValueTypes['directus_shares_filter']
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
      ValueTypes['directus_shares'],
    ];
    shares_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['directus_shares'],
    ];
    shares_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['directus_shares_filter']
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
      ValueTypes['directus_shares_aggregated'],
    ];
    flows?: [
      {
        filter?:
          | ValueTypes['directus_flows_filter']
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
      ValueTypes['directus_flows'],
    ];
    flows_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['directus_flows'],
    ];
    flows_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['directus_flows_filter']
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
      ValueTypes['directus_flows_aggregated'],
    ];
    operations?: [
      {
        filter?:
          | ValueTypes['directus_operations_filter']
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
      ValueTypes['directus_operations'],
    ];
    operations_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['directus_operations'],
    ];
    operations_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['directus_operations_filter']
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
      ValueTypes['directus_operations_aggregated'],
    ];
    settings?: ValueTypes['directus_settings'];
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
    users_by_id?: [
      { id: string | Variable<any, string> },
      ValueTypes['directus_users'],
    ];
    users_aggregated?: [
      {
        groupBy?:
          | Array<string | undefined | null>
          | undefined
          | null
          | Variable<any, string>;
        filter?:
          | ValueTypes['directus_users_filter']
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
      ValueTypes['directus_users_aggregated'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['extensions']: AliasType<{
    interfaces?: boolean | `@${string}`;
    displays?: boolean | `@${string}`;
    layouts?: boolean | `@${string}`;
    modules?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  ['JSON']: unknown;
  ['graphql_sdl_scope']: graphql_sdl_scope;
  ['server_info']: AliasType<{
    project_name?: boolean | `@${string}`;
    project_logo?: boolean | `@${string}`;
    project_color?: boolean | `@${string}`;
    project_foreground?: boolean | `@${string}`;
    project_background?: boolean | `@${string}`;
    project_note?: boolean | `@${string}`;
    custom_css?: boolean | `@${string}`;
    directus?: ValueTypes['server_info_directus'];
    node?: ValueTypes['server_info_node'];
    os?: ValueTypes['server_info_os'];
    __typename?: boolean | `@${string}`;
  }>;
  ['server_info_directus']: AliasType<{
    version?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['server_info_node']: AliasType<{
    version?: boolean | `@${string}`;
    uptime?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['server_info_os']: AliasType<{
    type?: boolean | `@${string}`;
    version?: boolean | `@${string}`;
    uptime?: boolean | `@${string}`;
    totalmem?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_collections']: AliasType<{
    collection?: boolean | `@${string}`;
    meta?: ValueTypes['directus_collections_meta'];
    schema?: ValueTypes['directus_collections_schema'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_collections_meta']: AliasType<{
    collection?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    display_template?: boolean | `@${string}`;
    hidden?: boolean | `@${string}`;
    singleton?: boolean | `@${string}`;
    translations?: boolean | `@${string}`;
    archive_field?: boolean | `@${string}`;
    archive_app_filter?: boolean | `@${string}`;
    archive_value?: boolean | `@${string}`;
    unarchive_value?: boolean | `@${string}`;
    sort_field?: boolean | `@${string}`;
    accountability?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    item_duplication_fields?: boolean | `@${string}`;
    sort?: boolean | `@${string}`;
    group?: boolean | `@${string}`;
    collapse?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_collections_schema']: AliasType<{
    name?: boolean | `@${string}`;
    comment?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_fields']: AliasType<{
    collection?: boolean | `@${string}`;
    field?: boolean | `@${string}`;
    type?: boolean | `@${string}`;
    meta?: ValueTypes['directus_fields_meta'];
    schema?: ValueTypes['directus_fields_schema'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_fields_meta']: AliasType<{
    id?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    field?: boolean | `@${string}`;
    special?: boolean | `@${string}`;
    interface?: boolean | `@${string}`;
    options?: boolean | `@${string}`;
    display?: boolean | `@${string}`;
    display_options?: boolean | `@${string}`;
    readonly?: boolean | `@${string}`;
    hidden?: boolean | `@${string}`;
    sort?: boolean | `@${string}`;
    width?: boolean | `@${string}`;
    translations?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    conditions?: boolean | `@${string}`;
    required?: boolean | `@${string}`;
    group?: boolean | `@${string}`;
    validation?: boolean | `@${string}`;
    validation_message?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_fields_schema']: AliasType<{
    name?: boolean | `@${string}`;
    table?: boolean | `@${string}`;
    data_type?: boolean | `@${string}`;
    default_value?: boolean | `@${string}`;
    max_length?: boolean | `@${string}`;
    numeric_precision?: boolean | `@${string}`;
    numeric_scale?: boolean | `@${string}`;
    is_nullable?: boolean | `@${string}`;
    is_unique?: boolean | `@${string}`;
    is_primary_key?: boolean | `@${string}`;
    has_auto_increment?: boolean | `@${string}`;
    foreign_key_column?: boolean | `@${string}`;
    foreign_key_table?: boolean | `@${string}`;
    comment?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_relations']: AliasType<{
    collection?: boolean | `@${string}`;
    field?: boolean | `@${string}`;
    related_collection?: boolean | `@${string}`;
    schema?: ValueTypes['directus_relations_schema'];
    meta?: ValueTypes['directus_relations_meta'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_relations_schema']: AliasType<{
    table?: boolean | `@${string}`;
    column?: boolean | `@${string}`;
    foreign_key_table?: boolean | `@${string}`;
    foreign_key_column?: boolean | `@${string}`;
    constraint_name?: boolean | `@${string}`;
    on_update?: boolean | `@${string}`;
    on_delete?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_relations_meta']: AliasType<{
    id?: boolean | `@${string}`;
    many_collection?: boolean | `@${string}`;
    many_field?: boolean | `@${string}`;
    one_collection?: boolean | `@${string}`;
    one_field?: boolean | `@${string}`;
    one_collection_field?: boolean | `@${string}`;
    one_allowed_collections?: boolean | `@${string}`;
    junction_field?: boolean | `@${string}`;
    sort_field?: boolean | `@${string}`;
    one_deselect_action?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
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
  ['count_functions']: AliasType<{
    count?: boolean | `@${string}`;
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
  /** BigInt value */
  ['GraphQLBigInt']: unknown;
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
  ['directus_roles_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_roles_aggregated_count'];
    countDistinct?: ValueTypes['directus_roles_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_roles_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    ip_access?: boolean | `@${string}`;
    enforce_tfa?: boolean | `@${string}`;
    admin_access?: boolean | `@${string}`;
    app_access?: boolean | `@${string}`;
    users?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_folders_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_folders_aggregated_count'];
    countDistinct?: ValueTypes['directus_folders_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_folders_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    parent?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_activity']: AliasType<{
    id?: boolean | `@${string}`;
    action?: boolean | `@${string}`;
    user?: [
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
    timestamp?: boolean | `@${string}`;
    timestamp_func?: ValueTypes['datetime_functions'];
    ip?: boolean | `@${string}`;
    user_agent?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    comment?: boolean | `@${string}`;
    origin?: boolean | `@${string}`;
    revisions?: [
      {
        filter?:
          | ValueTypes['directus_revisions_filter']
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
      ValueTypes['directus_revisions'],
    ];
    revisions_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_revisions']: AliasType<{
    id?: boolean | `@${string}`;
    activity?: [
      {
        filter?:
          | ValueTypes['directus_activity_filter']
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
      ValueTypes['directus_activity'],
    ];
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    data?: boolean | `@${string}`;
    data_func?: ValueTypes['count_functions'];
    delta?: boolean | `@${string}`;
    delta_func?: ValueTypes['count_functions'];
    parent?: [
      {
        filter?:
          | ValueTypes['directus_revisions_filter']
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
      ValueTypes['directus_revisions'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_activity_filter']: {
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    action?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    user?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    timestamp?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    timestamp_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    ip?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    user_agent?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    collection?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    item?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    comment?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    origin?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    revisions?:
      | ValueTypes['directus_revisions_filter']
      | undefined
      | null
      | Variable<any, string>;
    revisions_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['directus_activity_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['directus_activity_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_revisions_filter']: {
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    activity?:
      | ValueTypes['directus_activity_filter']
      | undefined
      | null
      | Variable<any, string>;
    collection?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    item?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    data?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    data_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    delta?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    delta_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    parent?:
      | ValueTypes['directus_revisions_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['directus_revisions_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['directus_revisions_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_activity_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_activity_aggregated_count'];
    countDistinct?: ValueTypes['directus_activity_aggregated_count'];
    avg?: ValueTypes['directus_activity_aggregated_fields'];
    sum?: ValueTypes['directus_activity_aggregated_fields'];
    avgDistinct?: ValueTypes['directus_activity_aggregated_fields'];
    sumDistinct?: ValueTypes['directus_activity_aggregated_fields'];
    min?: ValueTypes['directus_activity_aggregated_fields'];
    max?: ValueTypes['directus_activity_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_activity_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    action?: boolean | `@${string}`;
    user?: boolean | `@${string}`;
    timestamp?: boolean | `@${string}`;
    ip?: boolean | `@${string}`;
    user_agent?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    comment?: boolean | `@${string}`;
    origin?: boolean | `@${string}`;
    revisions?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_activity_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_permissions']: AliasType<{
    id?: boolean | `@${string}`;
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
    collection?: boolean | `@${string}`;
    action?: boolean | `@${string}`;
    permissions?: boolean | `@${string}`;
    permissions_func?: ValueTypes['count_functions'];
    validation?: boolean | `@${string}`;
    validation_func?: ValueTypes['count_functions'];
    presets?: boolean | `@${string}`;
    presets_func?: ValueTypes['count_functions'];
    fields?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_permissions_filter']: {
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    role?:
      | ValueTypes['directus_roles_filter']
      | undefined
      | null
      | Variable<any, string>;
    collection?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    action?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    permissions?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    permissions_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    validation?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    validation_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    presets?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    presets_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    fields?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['directus_permissions_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['directus_permissions_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_permissions_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_permissions_aggregated_count'];
    countDistinct?: ValueTypes['directus_permissions_aggregated_count'];
    avg?: ValueTypes['directus_permissions_aggregated_fields'];
    sum?: ValueTypes['directus_permissions_aggregated_fields'];
    avgDistinct?: ValueTypes['directus_permissions_aggregated_fields'];
    sumDistinct?: ValueTypes['directus_permissions_aggregated_fields'];
    min?: ValueTypes['directus_permissions_aggregated_fields'];
    max?: ValueTypes['directus_permissions_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_permissions_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    role?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    action?: boolean | `@${string}`;
    permissions?: boolean | `@${string}`;
    validation?: boolean | `@${string}`;
    presets?: boolean | `@${string}`;
    fields?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_permissions_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_files_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_files_aggregated_count'];
    countDistinct?: ValueTypes['directus_files_aggregated_count'];
    avg?: ValueTypes['directus_files_aggregated_fields'];
    sum?: ValueTypes['directus_files_aggregated_fields'];
    avgDistinct?: ValueTypes['directus_files_aggregated_fields'];
    sumDistinct?: ValueTypes['directus_files_aggregated_fields'];
    min?: ValueTypes['directus_files_aggregated_fields'];
    max?: ValueTypes['directus_files_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_files_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    storage?: boolean | `@${string}`;
    filename_disk?: boolean | `@${string}`;
    filename_download?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    type?: boolean | `@${string}`;
    folder?: boolean | `@${string}`;
    uploaded_by?: boolean | `@${string}`;
    uploaded_on?: boolean | `@${string}`;
    modified_by?: boolean | `@${string}`;
    modified_on?: boolean | `@${string}`;
    charset?: boolean | `@${string}`;
    filesize?: boolean | `@${string}`;
    width?: boolean | `@${string}`;
    height?: boolean | `@${string}`;
    duration?: boolean | `@${string}`;
    embed?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    location?: boolean | `@${string}`;
    tags?: boolean | `@${string}`;
    metadata?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_files_aggregated_fields']: AliasType<{
    filesize?: boolean | `@${string}`;
    width?: boolean | `@${string}`;
    height?: boolean | `@${string}`;
    duration?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_revisions_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_revisions_aggregated_count'];
    countDistinct?: ValueTypes['directus_revisions_aggregated_count'];
    avg?: ValueTypes['directus_revisions_aggregated_fields'];
    sum?: ValueTypes['directus_revisions_aggregated_fields'];
    avgDistinct?: ValueTypes['directus_revisions_aggregated_fields'];
    sumDistinct?: ValueTypes['directus_revisions_aggregated_fields'];
    min?: ValueTypes['directus_revisions_aggregated_fields'];
    max?: ValueTypes['directus_revisions_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_revisions_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    activity?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    data?: boolean | `@${string}`;
    delta?: boolean | `@${string}`;
    parent?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_revisions_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    activity?: boolean | `@${string}`;
    parent?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_presets']: AliasType<{
    id?: boolean | `@${string}`;
    bookmark?: boolean | `@${string}`;
    user?: [
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
    collection?: boolean | `@${string}`;
    search?: boolean | `@${string}`;
    layout?: boolean | `@${string}`;
    layout_query?: boolean | `@${string}`;
    layout_query_func?: ValueTypes['count_functions'];
    layout_options?: boolean | `@${string}`;
    layout_options_func?: ValueTypes['count_functions'];
    refresh_interval?: boolean | `@${string}`;
    filter?: boolean | `@${string}`;
    filter_func?: ValueTypes['count_functions'];
    icon?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_presets_filter']: {
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    bookmark?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    user?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    role?:
      | ValueTypes['directus_roles_filter']
      | undefined
      | null
      | Variable<any, string>;
    collection?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    search?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    layout?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    layout_query?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    layout_query_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    layout_options?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    layout_options_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    refresh_interval?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    filter?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    filter_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    icon?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    color?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['directus_presets_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['directus_presets_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_presets_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_presets_aggregated_count'];
    countDistinct?: ValueTypes['directus_presets_aggregated_count'];
    avg?: ValueTypes['directus_presets_aggregated_fields'];
    sum?: ValueTypes['directus_presets_aggregated_fields'];
    avgDistinct?: ValueTypes['directus_presets_aggregated_fields'];
    sumDistinct?: ValueTypes['directus_presets_aggregated_fields'];
    min?: ValueTypes['directus_presets_aggregated_fields'];
    max?: ValueTypes['directus_presets_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_presets_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    bookmark?: boolean | `@${string}`;
    user?: boolean | `@${string}`;
    role?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    search?: boolean | `@${string}`;
    layout?: boolean | `@${string}`;
    layout_query?: boolean | `@${string}`;
    layout_options?: boolean | `@${string}`;
    refresh_interval?: boolean | `@${string}`;
    filter?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_presets_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    refresh_interval?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_panels']: AliasType<{
    id?: boolean | `@${string}`;
    dashboard?: [
      {
        filter?:
          | ValueTypes['directus_dashboards_filter']
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
      ValueTypes['directus_dashboards'],
    ];
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    show_header?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    type?: boolean | `@${string}`;
    position_x?: boolean | `@${string}`;
    position_y?: boolean | `@${string}`;
    width?: boolean | `@${string}`;
    height?: boolean | `@${string}`;
    options?: boolean | `@${string}`;
    options_func?: ValueTypes['count_functions'];
    date_created?: boolean | `@${string}`;
    date_created_func?: ValueTypes['datetime_functions'];
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
  ['directus_dashboards']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    date_created_func?: ValueTypes['datetime_functions'];
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
    color?: boolean | `@${string}`;
    panels?: [
      {
        filter?:
          | ValueTypes['directus_panels_filter']
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
      ValueTypes['directus_panels'],
    ];
    panels_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_panels_filter']: {
    id?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    dashboard?:
      | ValueTypes['directus_dashboards_filter']
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
    color?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    show_header?:
      | ValueTypes['boolean_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    note?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    type?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    position_x?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    position_y?:
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
    options?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    options_func?:
      | ValueTypes['count_function_filter_operators']
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
    user_created?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['directus_panels_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['directus_panels_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_dashboards_filter']: {
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
    note?:
      | ValueTypes['string_filter_operators']
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
    user_created?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    color?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    panels?:
      | ValueTypes['directus_panels_filter']
      | undefined
      | null
      | Variable<any, string>;
    panels_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['directus_dashboards_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['directus_dashboards_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_panels_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_panels_aggregated_count'];
    countDistinct?: ValueTypes['directus_panels_aggregated_count'];
    avg?: ValueTypes['directus_panels_aggregated_fields'];
    sum?: ValueTypes['directus_panels_aggregated_fields'];
    avgDistinct?: ValueTypes['directus_panels_aggregated_fields'];
    sumDistinct?: ValueTypes['directus_panels_aggregated_fields'];
    min?: ValueTypes['directus_panels_aggregated_fields'];
    max?: ValueTypes['directus_panels_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_panels_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    dashboard?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    show_header?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    type?: boolean | `@${string}`;
    position_x?: boolean | `@${string}`;
    position_y?: boolean | `@${string}`;
    width?: boolean | `@${string}`;
    height?: boolean | `@${string}`;
    options?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    user_created?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_panels_aggregated_fields']: AliasType<{
    position_x?: boolean | `@${string}`;
    position_y?: boolean | `@${string}`;
    width?: boolean | `@${string}`;
    height?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_webhooks']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    method?: boolean | `@${string}`;
    url?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    data?: boolean | `@${string}`;
    actions?: boolean | `@${string}`;
    collections?: boolean | `@${string}`;
    headers?: boolean | `@${string}`;
    headers_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_webhooks_filter']: {
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
    method?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    url?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    status?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    data?:
      | ValueTypes['boolean_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    actions?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    collections?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    headers?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    headers_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['directus_webhooks_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['directus_webhooks_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_webhooks_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_webhooks_aggregated_count'];
    countDistinct?: ValueTypes['directus_webhooks_aggregated_count'];
    avg?: ValueTypes['directus_webhooks_aggregated_fields'];
    sum?: ValueTypes['directus_webhooks_aggregated_fields'];
    avgDistinct?: ValueTypes['directus_webhooks_aggregated_fields'];
    sumDistinct?: ValueTypes['directus_webhooks_aggregated_fields'];
    min?: ValueTypes['directus_webhooks_aggregated_fields'];
    max?: ValueTypes['directus_webhooks_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_webhooks_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    method?: boolean | `@${string}`;
    url?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    data?: boolean | `@${string}`;
    actions?: boolean | `@${string}`;
    collections?: boolean | `@${string}`;
    headers?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_webhooks_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_dashboards_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_dashboards_aggregated_count'];
    countDistinct?: ValueTypes['directus_dashboards_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_dashboards_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    user_created?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    panels?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_notifications']: AliasType<{
    id?: boolean | `@${string}`;
    timestamp?: boolean | `@${string}`;
    timestamp_func?: ValueTypes['datetime_functions'];
    status?: boolean | `@${string}`;
    recipient?: [
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
    sender?: [
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
    subject?: boolean | `@${string}`;
    message?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_notifications_filter']: {
    id?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    timestamp?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    timestamp_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    status?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    recipient?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    sender?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    subject?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    message?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    collection?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    item?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['directus_notifications_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['directus_notifications_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_notifications_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_notifications_aggregated_count'];
    countDistinct?: ValueTypes['directus_notifications_aggregated_count'];
    avg?: ValueTypes['directus_notifications_aggregated_fields'];
    sum?: ValueTypes['directus_notifications_aggregated_fields'];
    avgDistinct?: ValueTypes['directus_notifications_aggregated_fields'];
    sumDistinct?: ValueTypes['directus_notifications_aggregated_fields'];
    min?: ValueTypes['directus_notifications_aggregated_fields'];
    max?: ValueTypes['directus_notifications_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_notifications_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    timestamp?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    recipient?: boolean | `@${string}`;
    sender?: boolean | `@${string}`;
    subject?: boolean | `@${string}`;
    message?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_notifications_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_shares']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
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
    /** $t:shared_leave_blank_for_unlimited */
    password?: boolean | `@${string}`;
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
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: boolean | `@${string}`;
    date_start_func?: ValueTypes['datetime_functions'];
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: boolean | `@${string}`;
    date_end_func?: ValueTypes['datetime_functions'];
    times_used?: boolean | `@${string}`;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_shares_filter']: {
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
    collection?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    item?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    role?:
      | ValueTypes['directus_roles_filter']
      | undefined
      | null
      | Variable<any, string>;
    password?:
      | ValueTypes['hash_filter_operators']
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
    date_start?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    date_start_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    date_end?:
      | ValueTypes['date_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    date_end_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    times_used?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    max_uses?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['directus_shares_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['directus_shares_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_shares_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_shares_aggregated_count'];
    countDistinct?: ValueTypes['directus_shares_aggregated_count'];
    avg?: ValueTypes['directus_shares_aggregated_fields'];
    sum?: ValueTypes['directus_shares_aggregated_fields'];
    avgDistinct?: ValueTypes['directus_shares_aggregated_fields'];
    sumDistinct?: ValueTypes['directus_shares_aggregated_fields'];
    min?: ValueTypes['directus_shares_aggregated_fields'];
    max?: ValueTypes['directus_shares_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_shares_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    role?: boolean | `@${string}`;
    /** $t:shared_leave_blank_for_unlimited */
    password?: boolean | `@${string}`;
    user_created?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: boolean | `@${string}`;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: boolean | `@${string}`;
    times_used?: boolean | `@${string}`;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_shares_aggregated_fields']: AliasType<{
    times_used?: boolean | `@${string}`;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_flows']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    trigger?: boolean | `@${string}`;
    accountability?: boolean | `@${string}`;
    options?: boolean | `@${string}`;
    options_func?: ValueTypes['count_functions'];
    operation?: [
      {
        filter?:
          | ValueTypes['directus_operations_filter']
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
      ValueTypes['directus_operations'],
    ];
    date_created?: boolean | `@${string}`;
    date_created_func?: ValueTypes['datetime_functions'];
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
    operations?: [
      {
        filter?:
          | ValueTypes['directus_operations_filter']
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
      ValueTypes['directus_operations'],
    ];
    operations_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_operations']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    key?: boolean | `@${string}`;
    type?: boolean | `@${string}`;
    position_x?: boolean | `@${string}`;
    position_y?: boolean | `@${string}`;
    options?: boolean | `@${string}`;
    options_func?: ValueTypes['count_functions'];
    resolve?: [
      {
        filter?:
          | ValueTypes['directus_operations_filter']
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
      ValueTypes['directus_operations'],
    ];
    reject?: [
      {
        filter?:
          | ValueTypes['directus_operations_filter']
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
      ValueTypes['directus_operations'],
    ];
    flow?: [
      {
        filter?:
          | ValueTypes['directus_flows_filter']
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
      ValueTypes['directus_flows'],
    ];
    date_created?: boolean | `@${string}`;
    date_created_func?: ValueTypes['datetime_functions'];
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
  ['directus_operations_filter']: {
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
    key?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    type?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    position_x?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    position_y?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    options?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    options_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    resolve?:
      | ValueTypes['directus_operations_filter']
      | undefined
      | null
      | Variable<any, string>;
    reject?:
      | ValueTypes['directus_operations_filter']
      | undefined
      | null
      | Variable<any, string>;
    flow?:
      | ValueTypes['directus_flows_filter']
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
    user_created?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['directus_operations_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['directus_operations_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_flows_filter']: {
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
    color?:
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
    trigger?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    accountability?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    options?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    options_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    operation?:
      | ValueTypes['directus_operations_filter']
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
    user_created?:
      | ValueTypes['directus_users_filter']
      | undefined
      | null
      | Variable<any, string>;
    operations?:
      | ValueTypes['directus_operations_filter']
      | undefined
      | null
      | Variable<any, string>;
    operations_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null
      | Variable<any, string>;
    _and?:
      | Array<ValueTypes['directus_flows_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    _or?:
      | Array<ValueTypes['directus_flows_filter'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_flows_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_flows_aggregated_count'];
    countDistinct?: ValueTypes['directus_flows_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_flows_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    trigger?: boolean | `@${string}`;
    accountability?: boolean | `@${string}`;
    options?: boolean | `@${string}`;
    operation?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    user_created?: boolean | `@${string}`;
    operations?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_operations_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_operations_aggregated_count'];
    countDistinct?: ValueTypes['directus_operations_aggregated_count'];
    avg?: ValueTypes['directus_operations_aggregated_fields'];
    sum?: ValueTypes['directus_operations_aggregated_fields'];
    avgDistinct?: ValueTypes['directus_operations_aggregated_fields'];
    sumDistinct?: ValueTypes['directus_operations_aggregated_fields'];
    min?: ValueTypes['directus_operations_aggregated_fields'];
    max?: ValueTypes['directus_operations_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_operations_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    key?: boolean | `@${string}`;
    type?: boolean | `@${string}`;
    position_x?: boolean | `@${string}`;
    position_y?: boolean | `@${string}`;
    options?: boolean | `@${string}`;
    resolve?: boolean | `@${string}`;
    reject?: boolean | `@${string}`;
    flow?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    user_created?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_operations_aggregated_fields']: AliasType<{
    position_x?: boolean | `@${string}`;
    position_y?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_settings']: AliasType<{
    id?: boolean | `@${string}`;
    project_name?: boolean | `@${string}`;
    project_url?: boolean | `@${string}`;
    /** $t:field_options.directus_settings.project_color_note */
    project_color?: boolean | `@${string}`;
    project_logo?: [
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
    public_foreground?: [
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
    public_background?: [
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
    public_note?: boolean | `@${string}`;
    auth_login_attempts?: boolean | `@${string}`;
    auth_password_policy?: boolean | `@${string}`;
    storage_asset_transform?: boolean | `@${string}`;
    storage_asset_presets?: boolean | `@${string}`;
    storage_asset_presets_func?: ValueTypes['count_functions'];
    custom_css?: boolean | `@${string}`;
    storage_default_folder?: [
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
    basemaps?: boolean | `@${string}`;
    basemaps_func?: ValueTypes['count_functions'];
    mapbox_key?: boolean | `@${string}`;
    module_bar?: boolean | `@${string}`;
    module_bar_func?: ValueTypes['count_functions'];
    project_descriptor?: boolean | `@${string}`;
    translation_strings?: boolean | `@${string}`;
    translation_strings_func?: ValueTypes['count_functions'];
    default_language?: boolean | `@${string}`;
    custom_aspect_ratios?: boolean | `@${string}`;
    custom_aspect_ratios_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_users_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_users_aggregated_count'];
    countDistinct?: ValueTypes['directus_users_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_users_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    first_name?: boolean | `@${string}`;
    last_name?: boolean | `@${string}`;
    email?: boolean | `@${string}`;
    password?: boolean | `@${string}`;
    location?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    tags?: boolean | `@${string}`;
    avatar?: boolean | `@${string}`;
    language?: boolean | `@${string}`;
    theme?: boolean | `@${string}`;
    tfa_secret?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    role?: boolean | `@${string}`;
    token?: boolean | `@${string}`;
    last_access?: boolean | `@${string}`;
    last_page?: boolean | `@${string}`;
    provider?: boolean | `@${string}`;
    external_identifier?: boolean | `@${string}`;
    auth_data?: boolean | `@${string}`;
    email_notifications?: boolean | `@${string}`;
    discord_handle?: boolean | `@${string}`;
    discord_id?: boolean | `@${string}`;
    timezone?: boolean | `@${string}`;
    twitter_handle?: boolean | `@${string}`;
    collaborators?: boolean | `@${string}`;
    skills?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['Mutation']: AliasType<{
    auth_login?: [
      {
        email: string | Variable<any, string>;
        password: string | Variable<any, string>;
        mode?:
          | ValueTypes['auth_mode']
          | undefined
          | null
          | Variable<any, string>;
        otp?: string | undefined | null | Variable<any, string>;
      },
      ValueTypes['auth_tokens'],
    ];
    auth_refresh?: [
      {
        refresh_token?: string | undefined | null | Variable<any, string>;
        mode?:
          | ValueTypes['auth_mode']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['auth_tokens'],
    ];
    auth_logout?: [
      { refresh_token?: string | undefined | null | Variable<any, string> },
      boolean | `@${string}`,
    ];
    auth_password_request?: [
      {
        email: string | Variable<any, string>;
        reset_url?: string | undefined | null | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    auth_password_reset?: [
      {
        token: string | Variable<any, string>;
        password: string | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    users_me_tfa_generate?: [
      { password: string | Variable<any, string> },
      ValueTypes['users_me_tfa_generate_data'],
    ];
    users_me_tfa_enable?: [
      {
        otp: string | Variable<any, string>;
        secret: string | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    users_me_tfa_disable?: [
      { otp: string | Variable<any, string> },
      boolean | `@${string}`,
    ];
    utils_hash_generate?: [
      { string: string | Variable<any, string> },
      boolean | `@${string}`,
    ];
    utils_hash_verify?: [
      {
        string: string | Variable<any, string>;
        hash: string | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    utils_sort?: [
      {
        collection: string | Variable<any, string>;
        item: string | Variable<any, string>;
        to: string | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    utils_revert?: [
      { revision: string | Variable<any, string> },
      boolean | `@${string}`,
    ];
    utils_cache_clear?: boolean | `@${string}`;
    users_invite_accept?: [
      {
        token: string | Variable<any, string>;
        password: string | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    create_collections_item?: [
      {
        data:
          | ValueTypes['create_directus_collections_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_collections'],
    ];
    update_collections_item?: [
      {
        collection: string | Variable<any, string>;
        data:
          | ValueTypes['update_directus_collections_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_collections'],
    ];
    delete_collections_item?: [
      { collection: string | Variable<any, string> },
      ValueTypes['delete_collection'],
    ];
    create_fields_item?: [
      {
        collection: string | Variable<any, string>;
        data:
          | ValueTypes['create_directus_fields_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_fields'],
    ];
    update_fields_item?: [
      {
        collection: string | Variable<any, string>;
        field: string | Variable<any, string>;
        data:
          | ValueTypes['update_directus_fields_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_fields'],
    ];
    delete_fields_item?: [
      {
        collection: string | Variable<any, string>;
        field: string | Variable<any, string>;
      },
      ValueTypes['delete_field'],
    ];
    create_relations_item?: [
      {
        data:
          | ValueTypes['create_directus_relations_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_relations'],
    ];
    update_relations_item?: [
      {
        collection: string | Variable<any, string>;
        field: string | Variable<any, string>;
        data:
          | ValueTypes['update_directus_relations_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_relations'],
    ];
    delete_relations_item?: [
      {
        collection: string | Variable<any, string>;
        field: string | Variable<any, string>;
      },
      ValueTypes['delete_relation'],
    ];
    update_users_me?: [
      {
        data?:
          | ValueTypes['update_directus_users_input']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    create_comment?: [
      {
        collection: string | Variable<any, string>;
        item: string | Variable<any, string>;
        comment: string | Variable<any, string>;
      },
      ValueTypes['directus_activity'],
    ];
    update_comment?: [
      {
        id: string | Variable<any, string>;
        comment: string | Variable<any, string>;
      },
      ValueTypes['directus_activity'],
    ];
    delete_comment?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    import_file?: [
      {
        url: string | Variable<any, string>;
        data?:
          | ValueTypes['create_directus_files_input']
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    users_invite?: [
      {
        email: string | Variable<any, string>;
        role: string | Variable<any, string>;
        invite_url?: string | undefined | null | Variable<any, string>;
      },
      boolean | `@${string}`,
    ];
    create_roles_items?: [
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
        data?:
          | Array<ValueTypes['create_directus_roles_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_roles'],
    ];
    create_roles_item?: [
      {
        data: ValueTypes['create_directus_roles_input'] | Variable<any, string>;
      },
      ValueTypes['directus_roles'],
    ];
    create_folders_items?: [
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
        data?:
          | Array<ValueTypes['create_directus_folders_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_folders'],
    ];
    create_folders_item?: [
      {
        data:
          | ValueTypes['create_directus_folders_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_folders'],
    ];
    create_permissions_items?: [
      {
        filter?:
          | ValueTypes['directus_permissions_filter']
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
          | Array<ValueTypes['create_directus_permissions_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_permissions'],
    ];
    create_permissions_item?: [
      {
        data:
          | ValueTypes['create_directus_permissions_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_permissions'],
    ];
    create_files_items?: [
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
        data?:
          | Array<ValueTypes['create_directus_files_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    create_files_item?: [
      {
        data: ValueTypes['create_directus_files_input'] | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    create_presets_items?: [
      {
        filter?:
          | ValueTypes['directus_presets_filter']
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
          | Array<ValueTypes['create_directus_presets_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_presets'],
    ];
    create_presets_item?: [
      {
        data:
          | ValueTypes['create_directus_presets_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_presets'],
    ];
    create_panels_items?: [
      {
        filter?:
          | ValueTypes['directus_panels_filter']
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
          | Array<ValueTypes['create_directus_panels_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_panels'],
    ];
    create_panels_item?: [
      {
        data:
          | ValueTypes['create_directus_panels_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_panels'],
    ];
    create_webhooks_items?: [
      {
        filter?:
          | ValueTypes['directus_webhooks_filter']
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
          | Array<ValueTypes['create_directus_webhooks_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_webhooks'],
    ];
    create_webhooks_item?: [
      {
        data:
          | ValueTypes['create_directus_webhooks_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_webhooks'],
    ];
    create_dashboards_items?: [
      {
        filter?:
          | ValueTypes['directus_dashboards_filter']
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
          | Array<ValueTypes['create_directus_dashboards_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_dashboards'],
    ];
    create_dashboards_item?: [
      {
        data:
          | ValueTypes['create_directus_dashboards_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_dashboards'],
    ];
    create_notifications_items?: [
      {
        filter?:
          | ValueTypes['directus_notifications_filter']
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
          | Array<ValueTypes['create_directus_notifications_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_notifications'],
    ];
    create_notifications_item?: [
      {
        data:
          | ValueTypes['create_directus_notifications_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_notifications'],
    ];
    create_shares_items?: [
      {
        filter?:
          | ValueTypes['directus_shares_filter']
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
          | Array<ValueTypes['create_directus_shares_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_shares'],
    ];
    create_shares_item?: [
      {
        data:
          | ValueTypes['create_directus_shares_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_shares'],
    ];
    create_flows_items?: [
      {
        filter?:
          | ValueTypes['directus_flows_filter']
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
          | Array<ValueTypes['create_directus_flows_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_flows'],
    ];
    create_flows_item?: [
      {
        data: ValueTypes['create_directus_flows_input'] | Variable<any, string>;
      },
      ValueTypes['directus_flows'],
    ];
    create_operations_items?: [
      {
        filter?:
          | ValueTypes['directus_operations_filter']
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
          | Array<ValueTypes['create_directus_operations_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_operations'],
    ];
    create_operations_item?: [
      {
        data:
          | ValueTypes['create_directus_operations_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_operations'],
    ];
    create_users_items?: [
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
        data?:
          | Array<ValueTypes['create_directus_users_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    create_users_item?: [
      {
        data: ValueTypes['create_directus_users_input'] | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    update_roles_items?: [
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
        ids: Array<string | undefined | null> | Variable<any, string>;
        data: ValueTypes['update_directus_roles_input'] | Variable<any, string>;
      },
      ValueTypes['directus_roles'],
    ];
    update_roles_batch?: [
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
        data?:
          | Array<ValueTypes['update_directus_roles_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_roles'],
    ];
    update_roles_item?: [
      {
        id: string | Variable<any, string>;
        data: ValueTypes['update_directus_roles_input'] | Variable<any, string>;
      },
      ValueTypes['directus_roles'],
    ];
    update_folders_items?: [
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
        ids: Array<string | undefined | null> | Variable<any, string>;
        data:
          | ValueTypes['update_directus_folders_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_folders'],
    ];
    update_folders_batch?: [
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
        data?:
          | Array<ValueTypes['update_directus_folders_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_folders'],
    ];
    update_folders_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_directus_folders_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_folders'],
    ];
    update_permissions_items?: [
      {
        filter?:
          | ValueTypes['directus_permissions_filter']
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
          | ValueTypes['update_directus_permissions_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_permissions'],
    ];
    update_permissions_batch?: [
      {
        filter?:
          | ValueTypes['directus_permissions_filter']
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
          | Array<ValueTypes['update_directus_permissions_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_permissions'],
    ];
    update_permissions_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_directus_permissions_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_permissions'],
    ];
    update_files_items?: [
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
        ids: Array<string | undefined | null> | Variable<any, string>;
        data: ValueTypes['update_directus_files_input'] | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    update_files_batch?: [
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
        data?:
          | Array<ValueTypes['update_directus_files_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    update_files_item?: [
      {
        id: string | Variable<any, string>;
        data: ValueTypes['update_directus_files_input'] | Variable<any, string>;
      },
      ValueTypes['directus_files'],
    ];
    update_presets_items?: [
      {
        filter?:
          | ValueTypes['directus_presets_filter']
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
          | ValueTypes['update_directus_presets_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_presets'],
    ];
    update_presets_batch?: [
      {
        filter?:
          | ValueTypes['directus_presets_filter']
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
          | Array<ValueTypes['update_directus_presets_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_presets'],
    ];
    update_presets_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_directus_presets_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_presets'],
    ];
    update_panels_items?: [
      {
        filter?:
          | ValueTypes['directus_panels_filter']
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
          | ValueTypes['update_directus_panels_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_panels'],
    ];
    update_panels_batch?: [
      {
        filter?:
          | ValueTypes['directus_panels_filter']
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
          | Array<ValueTypes['update_directus_panels_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_panels'],
    ];
    update_panels_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_directus_panels_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_panels'],
    ];
    update_webhooks_items?: [
      {
        filter?:
          | ValueTypes['directus_webhooks_filter']
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
          | ValueTypes['update_directus_webhooks_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_webhooks'],
    ];
    update_webhooks_batch?: [
      {
        filter?:
          | ValueTypes['directus_webhooks_filter']
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
          | Array<ValueTypes['update_directus_webhooks_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_webhooks'],
    ];
    update_webhooks_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_directus_webhooks_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_webhooks'],
    ];
    update_dashboards_items?: [
      {
        filter?:
          | ValueTypes['directus_dashboards_filter']
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
          | ValueTypes['update_directus_dashboards_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_dashboards'],
    ];
    update_dashboards_batch?: [
      {
        filter?:
          | ValueTypes['directus_dashboards_filter']
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
          | Array<ValueTypes['update_directus_dashboards_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_dashboards'],
    ];
    update_dashboards_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_directus_dashboards_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_dashboards'],
    ];
    update_notifications_items?: [
      {
        filter?:
          | ValueTypes['directus_notifications_filter']
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
          | ValueTypes['update_directus_notifications_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_notifications'],
    ];
    update_notifications_batch?: [
      {
        filter?:
          | ValueTypes['directus_notifications_filter']
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
          | Array<ValueTypes['update_directus_notifications_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_notifications'],
    ];
    update_notifications_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_directus_notifications_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_notifications'],
    ];
    update_shares_items?: [
      {
        filter?:
          | ValueTypes['directus_shares_filter']
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
          | ValueTypes['update_directus_shares_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_shares'],
    ];
    update_shares_batch?: [
      {
        filter?:
          | ValueTypes['directus_shares_filter']
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
          | Array<ValueTypes['update_directus_shares_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_shares'],
    ];
    update_shares_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_directus_shares_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_shares'],
    ];
    update_flows_items?: [
      {
        filter?:
          | ValueTypes['directus_flows_filter']
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
        data: ValueTypes['update_directus_flows_input'] | Variable<any, string>;
      },
      ValueTypes['directus_flows'],
    ];
    update_flows_batch?: [
      {
        filter?:
          | ValueTypes['directus_flows_filter']
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
          | Array<ValueTypes['update_directus_flows_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_flows'],
    ];
    update_flows_item?: [
      {
        id: string | Variable<any, string>;
        data: ValueTypes['update_directus_flows_input'] | Variable<any, string>;
      },
      ValueTypes['directus_flows'],
    ];
    update_operations_items?: [
      {
        filter?:
          | ValueTypes['directus_operations_filter']
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
          | ValueTypes['update_directus_operations_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_operations'],
    ];
    update_operations_batch?: [
      {
        filter?:
          | ValueTypes['directus_operations_filter']
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
          | Array<ValueTypes['update_directus_operations_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_operations'],
    ];
    update_operations_item?: [
      {
        id: string | Variable<any, string>;
        data:
          | ValueTypes['update_directus_operations_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_operations'],
    ];
    update_settings?: [
      {
        data:
          | ValueTypes['update_directus_settings_input']
          | Variable<any, string>;
      },
      ValueTypes['directus_settings'],
    ];
    update_users_items?: [
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
        ids: Array<string | undefined | null> | Variable<any, string>;
        data: ValueTypes['update_directus_users_input'] | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    update_users_batch?: [
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
        data?:
          | Array<ValueTypes['update_directus_users_input']>
          | undefined
          | null
          | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    update_users_item?: [
      {
        id: string | Variable<any, string>;
        data: ValueTypes['update_directus_users_input'] | Variable<any, string>;
      },
      ValueTypes['directus_users'],
    ];
    delete_roles_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_roles_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_folders_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_folders_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_permissions_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_permissions_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_files_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_files_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_presets_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_presets_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_panels_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_panels_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_webhooks_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_webhooks_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_dashboards_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_dashboards_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_notifications_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_notifications_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_shares_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_shares_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_flows_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_flows_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_operations_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_operations_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    delete_users_items?: [
      { ids: Array<string | undefined | null> | Variable<any, string> },
      ValueTypes['delete_many'],
    ];
    delete_users_item?: [
      { id: string | Variable<any, string> },
      ValueTypes['delete_one'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['auth_tokens']: AliasType<{
    access_token?: boolean | `@${string}`;
    expires?: boolean | `@${string}`;
    refresh_token?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['auth_mode']: auth_mode;
  ['users_me_tfa_generate_data']: AliasType<{
    secret?: boolean | `@${string}`;
    otpauth_url?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Represents NULL values */
  ['Void']: unknown;
  ['create_directus_collections_input']: {
    collection?: string | undefined | null | Variable<any, string>;
    meta?:
      | ValueTypes['directus_collections_meta_input']
      | undefined
      | null
      | Variable<any, string>;
    schema?:
      | ValueTypes['directus_collections_schema_input']
      | undefined
      | null
      | Variable<any, string>;
    fields?:
      | Array<ValueTypes['create_directus_collections_fields_input']>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_collections_meta_input']: {
    collection: string | Variable<any, string>;
    icon?: string | undefined | null | Variable<any, string>;
    note?: string | undefined | null | Variable<any, string>;
    display_template?: string | undefined | null | Variable<any, string>;
    hidden: boolean | Variable<any, string>;
    singleton: boolean | Variable<any, string>;
    translations?:
      | ValueTypes['JSON']
      | undefined
      | null
      | Variable<any, string>;
    archive_field?: string | undefined | null | Variable<any, string>;
    archive_app_filter: boolean | Variable<any, string>;
    archive_value?: string | undefined | null | Variable<any, string>;
    unarchive_value?: string | undefined | null | Variable<any, string>;
    sort_field?: string | undefined | null | Variable<any, string>;
    accountability?: string | undefined | null | Variable<any, string>;
    color?: string | undefined | null | Variable<any, string>;
    item_duplication_fields?:
      | ValueTypes['JSON']
      | undefined
      | null
      | Variable<any, string>;
    sort?: number | undefined | null | Variable<any, string>;
    group?: string | undefined | null | Variable<any, string>;
    collapse: string | Variable<any, string>;
  };
  ['directus_collections_schema_input']: {
    name?: string | undefined | null | Variable<any, string>;
    comment?: string | undefined | null | Variable<any, string>;
  };
  ['create_directus_collections_fields_input']: {
    collection?: string | undefined | null | Variable<any, string>;
    field?: string | undefined | null | Variable<any, string>;
    type?: string | undefined | null | Variable<any, string>;
    meta?:
      | ValueTypes['directus_fields_meta_input']
      | undefined
      | null
      | Variable<any, string>;
    schema?:
      | ValueTypes['directus_fields_schema_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_fields_meta_input']: {
    id: number | Variable<any, string>;
    collection: string | Variable<any, string>;
    field: string | Variable<any, string>;
    special?:
      | Array<string | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    interface?: string | undefined | null | Variable<any, string>;
    options?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    display?: string | undefined | null | Variable<any, string>;
    display_options?:
      | ValueTypes['JSON']
      | undefined
      | null
      | Variable<any, string>;
    readonly: boolean | Variable<any, string>;
    hidden: boolean | Variable<any, string>;
    sort?: number | undefined | null | Variable<any, string>;
    width?: string | undefined | null | Variable<any, string>;
    translations?:
      | ValueTypes['JSON']
      | undefined
      | null
      | Variable<any, string>;
    note?: string | undefined | null | Variable<any, string>;
    conditions?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    required?: boolean | undefined | null | Variable<any, string>;
    group?: string | undefined | null | Variable<any, string>;
    validation?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    validation_message?: string | undefined | null | Variable<any, string>;
  };
  ['directus_fields_schema_input']: {
    name?: string | undefined | null | Variable<any, string>;
    table?: string | undefined | null | Variable<any, string>;
    data_type?: string | undefined | null | Variable<any, string>;
    default_value?: string | undefined | null | Variable<any, string>;
    max_length?: number | undefined | null | Variable<any, string>;
    numeric_precision?: number | undefined | null | Variable<any, string>;
    numeric_scale?: number | undefined | null | Variable<any, string>;
    is_nullable?: boolean | undefined | null | Variable<any, string>;
    is_unique?: boolean | undefined | null | Variable<any, string>;
    is_primary_key?: boolean | undefined | null | Variable<any, string>;
    has_auto_increment?: boolean | undefined | null | Variable<any, string>;
    foreign_key_column?: string | undefined | null | Variable<any, string>;
    foreign_key_table?: string | undefined | null | Variable<any, string>;
    comment?: string | undefined | null | Variable<any, string>;
  };
  ['update_directus_collections_input']: {
    meta?:
      | ValueTypes['directus_collections_meta_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['delete_collection']: AliasType<{
    collection?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['create_directus_fields_input']: {
    collection?: string | undefined | null | Variable<any, string>;
    field?: string | undefined | null | Variable<any, string>;
    type?: string | undefined | null | Variable<any, string>;
    meta?:
      | ValueTypes['directus_fields_meta_input']
      | undefined
      | null
      | Variable<any, string>;
    schema?:
      | ValueTypes['directus_fields_schema_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_directus_fields_input']: {
    collection?: string | undefined | null | Variable<any, string>;
    field?: string | undefined | null | Variable<any, string>;
    type?: string | undefined | null | Variable<any, string>;
    meta?:
      | ValueTypes['directus_fields_meta_input']
      | undefined
      | null
      | Variable<any, string>;
    schema?:
      | ValueTypes['directus_fields_schema_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['delete_field']: AliasType<{
    collection?: boolean | `@${string}`;
    field?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['create_directus_relations_input']: {
    collection?: string | undefined | null | Variable<any, string>;
    field?: string | undefined | null | Variable<any, string>;
    related_collection?: string | undefined | null | Variable<any, string>;
    schema?:
      | ValueTypes['directus_relations_schema_input']
      | undefined
      | null
      | Variable<any, string>;
    meta?:
      | ValueTypes['directus_relations_meta_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['directus_relations_schema_input']: {
    table: string | Variable<any, string>;
    column: string | Variable<any, string>;
    foreign_key_table: string | Variable<any, string>;
    foreign_key_column: string | Variable<any, string>;
    constraint_name?: string | undefined | null | Variable<any, string>;
    on_update: string | Variable<any, string>;
    on_delete: string | Variable<any, string>;
  };
  ['directus_relations_meta_input']: {
    id?: number | undefined | null | Variable<any, string>;
    many_collection?: string | undefined | null | Variable<any, string>;
    many_field?: string | undefined | null | Variable<any, string>;
    one_collection?: string | undefined | null | Variable<any, string>;
    one_field?: string | undefined | null | Variable<any, string>;
    one_collection_field?: string | undefined | null | Variable<any, string>;
    one_allowed_collections?:
      | Array<string | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    junction_field?: string | undefined | null | Variable<any, string>;
    sort_field?: string | undefined | null | Variable<any, string>;
    one_deselect_action?: string | undefined | null | Variable<any, string>;
  };
  ['update_directus_relations_input']: {
    collection?: string | undefined | null | Variable<any, string>;
    field?: string | undefined | null | Variable<any, string>;
    related_collection?: string | undefined | null | Variable<any, string>;
    schema?:
      | ValueTypes['directus_relations_schema_input']
      | undefined
      | null
      | Variable<any, string>;
    meta?:
      | ValueTypes['directus_relations_meta_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['delete_relation']: AliasType<{
    collection?: boolean | `@${string}`;
    field?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
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
  ['delete_one']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
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
  ['create_directus_permissions_input']: {
    id?: string | undefined | null | Variable<any, string>;
    role?:
      | ValueTypes['create_directus_roles_input']
      | undefined
      | null
      | Variable<any, string>;
    collection: string | Variable<any, string>;
    action: string | Variable<any, string>;
    permissions?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    validation?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    presets?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    fields?:
      | Array<string | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_directus_presets_input']: {
    id?: string | undefined | null | Variable<any, string>;
    bookmark?: string | undefined | null | Variable<any, string>;
    user?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    role?:
      | ValueTypes['create_directus_roles_input']
      | undefined
      | null
      | Variable<any, string>;
    collection?: string | undefined | null | Variable<any, string>;
    search?: string | undefined | null | Variable<any, string>;
    layout?: string | undefined | null | Variable<any, string>;
    layout_query?:
      | ValueTypes['JSON']
      | undefined
      | null
      | Variable<any, string>;
    layout_options?:
      | ValueTypes['JSON']
      | undefined
      | null
      | Variable<any, string>;
    refresh_interval?: number | undefined | null | Variable<any, string>;
    filter?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    icon?: string | undefined | null | Variable<any, string>;
    color?: string | undefined | null | Variable<any, string>;
  };
  ['create_directus_panels_input']: {
    id?: string | undefined | null | Variable<any, string>;
    dashboard?:
      | ValueTypes['create_directus_dashboards_input']
      | undefined
      | null
      | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    icon?: string | undefined | null | Variable<any, string>;
    color?: string | undefined | null | Variable<any, string>;
    show_header: boolean | Variable<any, string>;
    note?: string | undefined | null | Variable<any, string>;
    type: string | Variable<any, string>;
    position_x: number | Variable<any, string>;
    position_y: number | Variable<any, string>;
    width: number | Variable<any, string>;
    height: number | Variable<any, string>;
    options?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    date_created?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    user_created?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_directus_dashboards_input']: {
    id?: string | undefined | null | Variable<any, string>;
    name: string | Variable<any, string>;
    icon?: string | undefined | null | Variable<any, string>;
    note?: string | undefined | null | Variable<any, string>;
    date_created?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    user_created?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    color?: string | undefined | null | Variable<any, string>;
    panels?:
      | Array<ValueTypes['create_directus_panels_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_directus_webhooks_input']: {
    id?: string | undefined | null | Variable<any, string>;
    name: string | Variable<any, string>;
    method?: string | undefined | null | Variable<any, string>;
    url: string | Variable<any, string>;
    status?: string | undefined | null | Variable<any, string>;
    data?: boolean | undefined | null | Variable<any, string>;
    actions: Array<string | undefined | null> | Variable<any, string>;
    collections: Array<string | undefined | null> | Variable<any, string>;
    headers?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
  };
  ['create_directus_notifications_input']: {
    id?: string | undefined | null | Variable<any, string>;
    timestamp?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    status?: string | undefined | null | Variable<any, string>;
    recipient?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    sender?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    subject: string | Variable<any, string>;
    message?: string | undefined | null | Variable<any, string>;
    collection?: string | undefined | null | Variable<any, string>;
    item?: string | undefined | null | Variable<any, string>;
  };
  ['create_directus_shares_input']: {
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    collection?: string | undefined | null | Variable<any, string>;
    item?: string | undefined | null | Variable<any, string>;
    role?:
      | ValueTypes['create_directus_roles_input']
      | undefined
      | null
      | Variable<any, string>;
    /** $t:shared_leave_blank_for_unlimited */
    password?: ValueTypes['Hash'] | undefined | null | Variable<any, string>;
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
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    times_used?: number | undefined | null | Variable<any, string>;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: number | undefined | null | Variable<any, string>;
  };
  ['create_directus_flows_input']: {
    id?: string | undefined | null | Variable<any, string>;
    name: string | Variable<any, string>;
    icon?: string | undefined | null | Variable<any, string>;
    color?: string | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    status?: string | undefined | null | Variable<any, string>;
    trigger?: string | undefined | null | Variable<any, string>;
    accountability?: string | undefined | null | Variable<any, string>;
    options?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    operation?:
      | ValueTypes['create_directus_operations_input']
      | undefined
      | null
      | Variable<any, string>;
    date_created?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    user_created?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    operations?:
      | Array<ValueTypes['create_directus_operations_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['create_directus_operations_input']: {
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    key: string | Variable<any, string>;
    type: string | Variable<any, string>;
    position_x: number | Variable<any, string>;
    position_y: number | Variable<any, string>;
    options?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    resolve?:
      | ValueTypes['create_directus_operations_input']
      | undefined
      | null
      | Variable<any, string>;
    reject?:
      | ValueTypes['create_directus_operations_input']
      | undefined
      | null
      | Variable<any, string>;
    flow?:
      | ValueTypes['create_directus_flows_input']
      | undefined
      | null
      | Variable<any, string>;
    date_created?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    user_created?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_directus_permissions_input']: {
    id?: string | undefined | null | Variable<any, string>;
    role?:
      | ValueTypes['update_directus_roles_input']
      | undefined
      | null
      | Variable<any, string>;
    collection?: string | undefined | null | Variable<any, string>;
    action?: string | undefined | null | Variable<any, string>;
    permissions?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    validation?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    presets?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    fields?:
      | Array<string | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_directus_presets_input']: {
    id?: string | undefined | null | Variable<any, string>;
    bookmark?: string | undefined | null | Variable<any, string>;
    user?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    role?:
      | ValueTypes['update_directus_roles_input']
      | undefined
      | null
      | Variable<any, string>;
    collection?: string | undefined | null | Variable<any, string>;
    search?: string | undefined | null | Variable<any, string>;
    layout?: string | undefined | null | Variable<any, string>;
    layout_query?:
      | ValueTypes['JSON']
      | undefined
      | null
      | Variable<any, string>;
    layout_options?:
      | ValueTypes['JSON']
      | undefined
      | null
      | Variable<any, string>;
    refresh_interval?: number | undefined | null | Variable<any, string>;
    filter?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    icon?: string | undefined | null | Variable<any, string>;
    color?: string | undefined | null | Variable<any, string>;
  };
  ['update_directus_panels_input']: {
    id?: string | undefined | null | Variable<any, string>;
    dashboard?:
      | ValueTypes['update_directus_dashboards_input']
      | undefined
      | null
      | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    icon?: string | undefined | null | Variable<any, string>;
    color?: string | undefined | null | Variable<any, string>;
    show_header?: boolean | undefined | null | Variable<any, string>;
    note?: string | undefined | null | Variable<any, string>;
    type?: string | undefined | null | Variable<any, string>;
    position_x?: number | undefined | null | Variable<any, string>;
    position_y?: number | undefined | null | Variable<any, string>;
    width?: number | undefined | null | Variable<any, string>;
    height?: number | undefined | null | Variable<any, string>;
    options?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    date_created?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    user_created?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_directus_dashboards_input']: {
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    icon?: string | undefined | null | Variable<any, string>;
    note?: string | undefined | null | Variable<any, string>;
    date_created?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    user_created?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    color?: string | undefined | null | Variable<any, string>;
    panels?:
      | Array<ValueTypes['update_directus_panels_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_directus_webhooks_input']: {
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    method?: string | undefined | null | Variable<any, string>;
    url?: string | undefined | null | Variable<any, string>;
    status?: string | undefined | null | Variable<any, string>;
    data?: boolean | undefined | null | Variable<any, string>;
    actions?:
      | Array<string | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    collections?:
      | Array<string | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
    headers?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
  };
  ['update_directus_notifications_input']: {
    id?: string | undefined | null | Variable<any, string>;
    timestamp?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    status?: string | undefined | null | Variable<any, string>;
    recipient?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    sender?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    subject?: string | undefined | null | Variable<any, string>;
    message?: string | undefined | null | Variable<any, string>;
    collection?: string | undefined | null | Variable<any, string>;
    item?: string | undefined | null | Variable<any, string>;
  };
  ['update_directus_shares_input']: {
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    collection?: string | undefined | null | Variable<any, string>;
    item?: string | undefined | null | Variable<any, string>;
    role?:
      | ValueTypes['update_directus_roles_input']
      | undefined
      | null
      | Variable<any, string>;
    /** $t:shared_leave_blank_for_unlimited */
    password?: ValueTypes['Hash'] | undefined | null | Variable<any, string>;
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
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: ValueTypes['Date'] | undefined | null | Variable<any, string>;
    times_used?: number | undefined | null | Variable<any, string>;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: number | undefined | null | Variable<any, string>;
  };
  ['update_directus_flows_input']: {
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    icon?: string | undefined | null | Variable<any, string>;
    color?: string | undefined | null | Variable<any, string>;
    description?: string | undefined | null | Variable<any, string>;
    status?: string | undefined | null | Variable<any, string>;
    trigger?: string | undefined | null | Variable<any, string>;
    accountability?: string | undefined | null | Variable<any, string>;
    options?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    operation?:
      | ValueTypes['update_directus_operations_input']
      | undefined
      | null
      | Variable<any, string>;
    date_created?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    user_created?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
    operations?:
      | Array<ValueTypes['update_directus_operations_input'] | undefined | null>
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_directus_operations_input']: {
    id?: string | undefined | null | Variable<any, string>;
    name?: string | undefined | null | Variable<any, string>;
    key?: string | undefined | null | Variable<any, string>;
    type?: string | undefined | null | Variable<any, string>;
    position_x?: number | undefined | null | Variable<any, string>;
    position_y?: number | undefined | null | Variable<any, string>;
    options?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    resolve?:
      | ValueTypes['update_directus_operations_input']
      | undefined
      | null
      | Variable<any, string>;
    reject?:
      | ValueTypes['update_directus_operations_input']
      | undefined
      | null
      | Variable<any, string>;
    flow?:
      | ValueTypes['update_directus_flows_input']
      | undefined
      | null
      | Variable<any, string>;
    date_created?:
      | ValueTypes['Date']
      | undefined
      | null
      | Variable<any, string>;
    user_created?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['update_directus_settings_input']: {
    id?: string | undefined | null | Variable<any, string>;
    project_name?: string | undefined | null | Variable<any, string>;
    project_url?: string | undefined | null | Variable<any, string>;
    /** $t:field_options.directus_settings.project_color_note */
    project_color?: string | undefined | null | Variable<any, string>;
    project_logo?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    public_foreground?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    public_background?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null
      | Variable<any, string>;
    public_note?: string | undefined | null | Variable<any, string>;
    auth_login_attempts?: number | undefined | null | Variable<any, string>;
    auth_password_policy?: string | undefined | null | Variable<any, string>;
    storage_asset_transform?: string | undefined | null | Variable<any, string>;
    storage_asset_presets?:
      | ValueTypes['JSON']
      | undefined
      | null
      | Variable<any, string>;
    custom_css?: string | undefined | null | Variable<any, string>;
    storage_default_folder?:
      | ValueTypes['update_directus_folders_input']
      | undefined
      | null
      | Variable<any, string>;
    basemaps?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    mapbox_key?: string | undefined | null | Variable<any, string>;
    module_bar?: ValueTypes['JSON'] | undefined | null | Variable<any, string>;
    project_descriptor?: string | undefined | null | Variable<any, string>;
    translation_strings?:
      | ValueTypes['JSON']
      | undefined
      | null
      | Variable<any, string>;
    default_language?: string | undefined | null | Variable<any, string>;
    custom_aspect_ratios?:
      | ValueTypes['JSON']
      | undefined
      | null
      | Variable<any, string>;
  };
  ['delete_many']: AliasType<{
    ids?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
};

export type ResolverInputTypes = {
  ['Query']: AliasType<{
    extensions?: ResolverInputTypes['extensions'];
    server_specs_oas?: boolean | `@${string}`;
    server_specs_graphql?: [
      { scope?: ResolverInputTypes['graphql_sdl_scope'] | undefined | null },
      boolean | `@${string}`,
    ];
    server_ping?: boolean | `@${string}`;
    server_info?: ResolverInputTypes['server_info'];
    server_health?: boolean | `@${string}`;
    collections?: ResolverInputTypes['directus_collections'];
    collections_by_name?: [
      { name: string },
      ResolverInputTypes['directus_collections'],
    ];
    fields?: ResolverInputTypes['directus_fields'];
    fields_in_collection?: [
      { collection: string },
      ResolverInputTypes['directus_fields'],
    ];
    fields_by_name?: [
      { collection: string; field: string },
      ResolverInputTypes['directus_fields'],
    ];
    relations?: ResolverInputTypes['directus_relations'];
    relations_in_collection?: [
      { collection: string },
      ResolverInputTypes['directus_relations'],
    ];
    relations_by_name?: [
      { collection: string; field: string },
      ResolverInputTypes['directus_relations'],
    ];
    users_me?: ResolverInputTypes['directus_users'];
    roles?: [
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
    roles_by_id?: [{ id: string }, ResolverInputTypes['directus_roles']];
    roles_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ResolverInputTypes['directus_roles_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['directus_roles_aggregated'],
    ];
    folders?: [
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
    folders_by_id?: [{ id: string }, ResolverInputTypes['directus_folders']];
    folders_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['directus_folders_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['directus_folders_aggregated'],
    ];
    activity?: [
      {
        filter?:
          | ResolverInputTypes['directus_activity_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_activity'],
    ];
    activity_by_id?: [{ id: string }, ResolverInputTypes['directus_activity']];
    activity_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['directus_activity_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['directus_activity_aggregated'],
    ];
    permissions?: [
      {
        filter?:
          | ResolverInputTypes['directus_permissions_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_permissions'],
    ];
    permissions_by_id?: [
      { id: string },
      ResolverInputTypes['directus_permissions'],
    ];
    permissions_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['directus_permissions_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['directus_permissions_aggregated'],
    ];
    files?: [
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
    files_by_id?: [{ id: string }, ResolverInputTypes['directus_files']];
    files_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['directus_files_aggregated'],
    ];
    revisions?: [
      {
        filter?:
          | ResolverInputTypes['directus_revisions_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_revisions'],
    ];
    revisions_by_id?: [
      { id: string },
      ResolverInputTypes['directus_revisions'],
    ];
    revisions_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['directus_revisions_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['directus_revisions_aggregated'],
    ];
    presets?: [
      {
        filter?:
          | ResolverInputTypes['directus_presets_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_presets'],
    ];
    presets_by_id?: [{ id: string }, ResolverInputTypes['directus_presets']];
    presets_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['directus_presets_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['directus_presets_aggregated'],
    ];
    panels?: [
      {
        filter?:
          | ResolverInputTypes['directus_panels_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_panels'],
    ];
    panels_by_id?: [{ id: string }, ResolverInputTypes['directus_panels']];
    panels_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['directus_panels_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['directus_panels_aggregated'],
    ];
    webhooks?: [
      {
        filter?:
          | ResolverInputTypes['directus_webhooks_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_webhooks'],
    ];
    webhooks_by_id?: [{ id: string }, ResolverInputTypes['directus_webhooks']];
    webhooks_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['directus_webhooks_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['directus_webhooks_aggregated'],
    ];
    dashboards?: [
      {
        filter?:
          | ResolverInputTypes['directus_dashboards_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_dashboards'],
    ];
    dashboards_by_id?: [
      { id: string },
      ResolverInputTypes['directus_dashboards'],
    ];
    dashboards_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['directus_dashboards_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['directus_dashboards_aggregated'],
    ];
    notifications?: [
      {
        filter?:
          | ResolverInputTypes['directus_notifications_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_notifications'],
    ];
    notifications_by_id?: [
      { id: string },
      ResolverInputTypes['directus_notifications'],
    ];
    notifications_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['directus_notifications_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['directus_notifications_aggregated'],
    ];
    shares?: [
      {
        filter?:
          | ResolverInputTypes['directus_shares_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_shares'],
    ];
    shares_by_id?: [{ id: string }, ResolverInputTypes['directus_shares']];
    shares_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['directus_shares_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['directus_shares_aggregated'],
    ];
    flows?: [
      {
        filter?: ResolverInputTypes['directus_flows_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_flows'],
    ];
    flows_by_id?: [{ id: string }, ResolverInputTypes['directus_flows']];
    flows_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ResolverInputTypes['directus_flows_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['directus_flows_aggregated'],
    ];
    operations?: [
      {
        filter?:
          | ResolverInputTypes['directus_operations_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_operations'],
    ];
    operations_by_id?: [
      { id: string },
      ResolverInputTypes['directus_operations'],
    ];
    operations_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ResolverInputTypes['directus_operations_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['directus_operations_aggregated'],
    ];
    settings?: ResolverInputTypes['directus_settings'];
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
    users_by_id?: [{ id: string }, ResolverInputTypes['directus_users']];
    users_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ResolverInputTypes['directus_users_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ResolverInputTypes['directus_users_aggregated'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['extensions']: AliasType<{
    interfaces?: boolean | `@${string}`;
    displays?: boolean | `@${string}`;
    layouts?: boolean | `@${string}`;
    modules?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  ['JSON']: unknown;
  ['graphql_sdl_scope']: graphql_sdl_scope;
  ['server_info']: AliasType<{
    project_name?: boolean | `@${string}`;
    project_logo?: boolean | `@${string}`;
    project_color?: boolean | `@${string}`;
    project_foreground?: boolean | `@${string}`;
    project_background?: boolean | `@${string}`;
    project_note?: boolean | `@${string}`;
    custom_css?: boolean | `@${string}`;
    directus?: ResolverInputTypes['server_info_directus'];
    node?: ResolverInputTypes['server_info_node'];
    os?: ResolverInputTypes['server_info_os'];
    __typename?: boolean | `@${string}`;
  }>;
  ['server_info_directus']: AliasType<{
    version?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['server_info_node']: AliasType<{
    version?: boolean | `@${string}`;
    uptime?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['server_info_os']: AliasType<{
    type?: boolean | `@${string}`;
    version?: boolean | `@${string}`;
    uptime?: boolean | `@${string}`;
    totalmem?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_collections']: AliasType<{
    collection?: boolean | `@${string}`;
    meta?: ResolverInputTypes['directus_collections_meta'];
    schema?: ResolverInputTypes['directus_collections_schema'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_collections_meta']: AliasType<{
    collection?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    display_template?: boolean | `@${string}`;
    hidden?: boolean | `@${string}`;
    singleton?: boolean | `@${string}`;
    translations?: boolean | `@${string}`;
    archive_field?: boolean | `@${string}`;
    archive_app_filter?: boolean | `@${string}`;
    archive_value?: boolean | `@${string}`;
    unarchive_value?: boolean | `@${string}`;
    sort_field?: boolean | `@${string}`;
    accountability?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    item_duplication_fields?: boolean | `@${string}`;
    sort?: boolean | `@${string}`;
    group?: boolean | `@${string}`;
    collapse?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_collections_schema']: AliasType<{
    name?: boolean | `@${string}`;
    comment?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_fields']: AliasType<{
    collection?: boolean | `@${string}`;
    field?: boolean | `@${string}`;
    type?: boolean | `@${string}`;
    meta?: ResolverInputTypes['directus_fields_meta'];
    schema?: ResolverInputTypes['directus_fields_schema'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_fields_meta']: AliasType<{
    id?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    field?: boolean | `@${string}`;
    special?: boolean | `@${string}`;
    interface?: boolean | `@${string}`;
    options?: boolean | `@${string}`;
    display?: boolean | `@${string}`;
    display_options?: boolean | `@${string}`;
    readonly?: boolean | `@${string}`;
    hidden?: boolean | `@${string}`;
    sort?: boolean | `@${string}`;
    width?: boolean | `@${string}`;
    translations?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    conditions?: boolean | `@${string}`;
    required?: boolean | `@${string}`;
    group?: boolean | `@${string}`;
    validation?: boolean | `@${string}`;
    validation_message?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_fields_schema']: AliasType<{
    name?: boolean | `@${string}`;
    table?: boolean | `@${string}`;
    data_type?: boolean | `@${string}`;
    default_value?: boolean | `@${string}`;
    max_length?: boolean | `@${string}`;
    numeric_precision?: boolean | `@${string}`;
    numeric_scale?: boolean | `@${string}`;
    is_nullable?: boolean | `@${string}`;
    is_unique?: boolean | `@${string}`;
    is_primary_key?: boolean | `@${string}`;
    has_auto_increment?: boolean | `@${string}`;
    foreign_key_column?: boolean | `@${string}`;
    foreign_key_table?: boolean | `@${string}`;
    comment?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_relations']: AliasType<{
    collection?: boolean | `@${string}`;
    field?: boolean | `@${string}`;
    related_collection?: boolean | `@${string}`;
    schema?: ResolverInputTypes['directus_relations_schema'];
    meta?: ResolverInputTypes['directus_relations_meta'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_relations_schema']: AliasType<{
    table?: boolean | `@${string}`;
    column?: boolean | `@${string}`;
    foreign_key_table?: boolean | `@${string}`;
    foreign_key_column?: boolean | `@${string}`;
    constraint_name?: boolean | `@${string}`;
    on_update?: boolean | `@${string}`;
    on_delete?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_relations_meta']: AliasType<{
    id?: boolean | `@${string}`;
    many_collection?: boolean | `@${string}`;
    many_field?: boolean | `@${string}`;
    one_collection?: boolean | `@${string}`;
    one_field?: boolean | `@${string}`;
    one_collection_field?: boolean | `@${string}`;
    one_allowed_collections?: boolean | `@${string}`;
    junction_field?: boolean | `@${string}`;
    sort_field?: boolean | `@${string}`;
    one_deselect_action?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
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
  ['count_functions']: AliasType<{
    count?: boolean | `@${string}`;
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
  /** BigInt value */
  ['GraphQLBigInt']: unknown;
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
  ['directus_roles_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['directus_roles_aggregated_count'];
    countDistinct?: ResolverInputTypes['directus_roles_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_roles_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    ip_access?: boolean | `@${string}`;
    enforce_tfa?: boolean | `@${string}`;
    admin_access?: boolean | `@${string}`;
    app_access?: boolean | `@${string}`;
    users?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_folders_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['directus_folders_aggregated_count'];
    countDistinct?: ResolverInputTypes['directus_folders_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_folders_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    parent?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_activity']: AliasType<{
    id?: boolean | `@${string}`;
    action?: boolean | `@${string}`;
    user?: [
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
    timestamp?: boolean | `@${string}`;
    timestamp_func?: ResolverInputTypes['datetime_functions'];
    ip?: boolean | `@${string}`;
    user_agent?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    comment?: boolean | `@${string}`;
    origin?: boolean | `@${string}`;
    revisions?: [
      {
        filter?:
          | ResolverInputTypes['directus_revisions_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_revisions'],
    ];
    revisions_func?: ResolverInputTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_revisions']: AliasType<{
    id?: boolean | `@${string}`;
    activity?: [
      {
        filter?:
          | ResolverInputTypes['directus_activity_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_activity'],
    ];
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    data?: boolean | `@${string}`;
    data_func?: ResolverInputTypes['count_functions'];
    delta?: boolean | `@${string}`;
    delta_func?: ResolverInputTypes['count_functions'];
    parent?: [
      {
        filter?:
          | ResolverInputTypes['directus_revisions_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_revisions'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_activity_filter']: {
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    action?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    user?: ResolverInputTypes['directus_users_filter'] | undefined | null;
    timestamp?: ResolverInputTypes['date_filter_operators'] | undefined | null;
    timestamp_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    ip?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    user_agent?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    collection?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    item?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    comment?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    origin?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    revisions?:
      | ResolverInputTypes['directus_revisions_filter']
      | undefined
      | null;
    revisions_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ResolverInputTypes['directus_activity_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['directus_activity_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_revisions_filter']: {
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    activity?:
      | ResolverInputTypes['directus_activity_filter']
      | undefined
      | null;
    collection?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    item?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    data?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    data_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    delta?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    delta_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    parent?: ResolverInputTypes['directus_revisions_filter'] | undefined | null;
    _and?:
      | Array<
          ResolverInputTypes['directus_revisions_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ResolverInputTypes['directus_revisions_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['directus_activity_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['directus_activity_aggregated_count'];
    countDistinct?: ResolverInputTypes['directus_activity_aggregated_count'];
    avg?: ResolverInputTypes['directus_activity_aggregated_fields'];
    sum?: ResolverInputTypes['directus_activity_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['directus_activity_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['directus_activity_aggregated_fields'];
    min?: ResolverInputTypes['directus_activity_aggregated_fields'];
    max?: ResolverInputTypes['directus_activity_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_activity_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    action?: boolean | `@${string}`;
    user?: boolean | `@${string}`;
    timestamp?: boolean | `@${string}`;
    ip?: boolean | `@${string}`;
    user_agent?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    comment?: boolean | `@${string}`;
    origin?: boolean | `@${string}`;
    revisions?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_activity_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_permissions']: AliasType<{
    id?: boolean | `@${string}`;
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
    collection?: boolean | `@${string}`;
    action?: boolean | `@${string}`;
    permissions?: boolean | `@${string}`;
    permissions_func?: ResolverInputTypes['count_functions'];
    validation?: boolean | `@${string}`;
    validation_func?: ResolverInputTypes['count_functions'];
    presets?: boolean | `@${string}`;
    presets_func?: ResolverInputTypes['count_functions'];
    fields?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_permissions_filter']: {
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    role?: ResolverInputTypes['directus_roles_filter'] | undefined | null;
    collection?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    action?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    permissions?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    permissions_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    validation?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    validation_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    presets?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    presets_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    fields?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    _and?:
      | Array<
          ResolverInputTypes['directus_permissions_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ResolverInputTypes['directus_permissions_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['directus_permissions_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['directus_permissions_aggregated_count'];
    countDistinct?: ResolverInputTypes['directus_permissions_aggregated_count'];
    avg?: ResolverInputTypes['directus_permissions_aggregated_fields'];
    sum?: ResolverInputTypes['directus_permissions_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['directus_permissions_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['directus_permissions_aggregated_fields'];
    min?: ResolverInputTypes['directus_permissions_aggregated_fields'];
    max?: ResolverInputTypes['directus_permissions_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_permissions_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    role?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    action?: boolean | `@${string}`;
    permissions?: boolean | `@${string}`;
    validation?: boolean | `@${string}`;
    presets?: boolean | `@${string}`;
    fields?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_permissions_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_files_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['directus_files_aggregated_count'];
    countDistinct?: ResolverInputTypes['directus_files_aggregated_count'];
    avg?: ResolverInputTypes['directus_files_aggregated_fields'];
    sum?: ResolverInputTypes['directus_files_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['directus_files_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['directus_files_aggregated_fields'];
    min?: ResolverInputTypes['directus_files_aggregated_fields'];
    max?: ResolverInputTypes['directus_files_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_files_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    storage?: boolean | `@${string}`;
    filename_disk?: boolean | `@${string}`;
    filename_download?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    type?: boolean | `@${string}`;
    folder?: boolean | `@${string}`;
    uploaded_by?: boolean | `@${string}`;
    uploaded_on?: boolean | `@${string}`;
    modified_by?: boolean | `@${string}`;
    modified_on?: boolean | `@${string}`;
    charset?: boolean | `@${string}`;
    filesize?: boolean | `@${string}`;
    width?: boolean | `@${string}`;
    height?: boolean | `@${string}`;
    duration?: boolean | `@${string}`;
    embed?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    location?: boolean | `@${string}`;
    tags?: boolean | `@${string}`;
    metadata?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_files_aggregated_fields']: AliasType<{
    filesize?: boolean | `@${string}`;
    width?: boolean | `@${string}`;
    height?: boolean | `@${string}`;
    duration?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_revisions_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['directus_revisions_aggregated_count'];
    countDistinct?: ResolverInputTypes['directus_revisions_aggregated_count'];
    avg?: ResolverInputTypes['directus_revisions_aggregated_fields'];
    sum?: ResolverInputTypes['directus_revisions_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['directus_revisions_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['directus_revisions_aggregated_fields'];
    min?: ResolverInputTypes['directus_revisions_aggregated_fields'];
    max?: ResolverInputTypes['directus_revisions_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_revisions_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    activity?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    data?: boolean | `@${string}`;
    delta?: boolean | `@${string}`;
    parent?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_revisions_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    activity?: boolean | `@${string}`;
    parent?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_presets']: AliasType<{
    id?: boolean | `@${string}`;
    bookmark?: boolean | `@${string}`;
    user?: [
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
    collection?: boolean | `@${string}`;
    search?: boolean | `@${string}`;
    layout?: boolean | `@${string}`;
    layout_query?: boolean | `@${string}`;
    layout_query_func?: ResolverInputTypes['count_functions'];
    layout_options?: boolean | `@${string}`;
    layout_options_func?: ResolverInputTypes['count_functions'];
    refresh_interval?: boolean | `@${string}`;
    filter?: boolean | `@${string}`;
    filter_func?: ResolverInputTypes['count_functions'];
    icon?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_presets_filter']: {
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    bookmark?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    user?: ResolverInputTypes['directus_users_filter'] | undefined | null;
    role?: ResolverInputTypes['directus_roles_filter'] | undefined | null;
    collection?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    search?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    layout?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    layout_query?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    layout_query_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    layout_options?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    layout_options_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    refresh_interval?:
      | ResolverInputTypes['number_filter_operators']
      | undefined
      | null;
    filter?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    filter_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    icon?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    color?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    _and?:
      | Array<ResolverInputTypes['directus_presets_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['directus_presets_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_presets_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['directus_presets_aggregated_count'];
    countDistinct?: ResolverInputTypes['directus_presets_aggregated_count'];
    avg?: ResolverInputTypes['directus_presets_aggregated_fields'];
    sum?: ResolverInputTypes['directus_presets_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['directus_presets_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['directus_presets_aggregated_fields'];
    min?: ResolverInputTypes['directus_presets_aggregated_fields'];
    max?: ResolverInputTypes['directus_presets_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_presets_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    bookmark?: boolean | `@${string}`;
    user?: boolean | `@${string}`;
    role?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    search?: boolean | `@${string}`;
    layout?: boolean | `@${string}`;
    layout_query?: boolean | `@${string}`;
    layout_options?: boolean | `@${string}`;
    refresh_interval?: boolean | `@${string}`;
    filter?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_presets_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    refresh_interval?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_panels']: AliasType<{
    id?: boolean | `@${string}`;
    dashboard?: [
      {
        filter?:
          | ResolverInputTypes['directus_dashboards_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_dashboards'],
    ];
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    show_header?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    type?: boolean | `@${string}`;
    position_x?: boolean | `@${string}`;
    position_y?: boolean | `@${string}`;
    width?: boolean | `@${string}`;
    height?: boolean | `@${string}`;
    options?: boolean | `@${string}`;
    options_func?: ResolverInputTypes['count_functions'];
    date_created?: boolean | `@${string}`;
    date_created_func?: ResolverInputTypes['datetime_functions'];
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
  ['directus_dashboards']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    date_created_func?: ResolverInputTypes['datetime_functions'];
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
    color?: boolean | `@${string}`;
    panels?: [
      {
        filter?:
          | ResolverInputTypes['directus_panels_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_panels'],
    ];
    panels_func?: ResolverInputTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_panels_filter']: {
    id?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    dashboard?:
      | ResolverInputTypes['directus_dashboards_filter']
      | undefined
      | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    icon?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    color?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    show_header?:
      | ResolverInputTypes['boolean_filter_operators']
      | undefined
      | null;
    note?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    type?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    position_x?:
      | ResolverInputTypes['number_filter_operators']
      | undefined
      | null;
    position_y?:
      | ResolverInputTypes['number_filter_operators']
      | undefined
      | null;
    width?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    height?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    options?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    options_func?:
      | ResolverInputTypes['count_function_filter_operators']
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
    user_created?:
      | ResolverInputTypes['directus_users_filter']
      | undefined
      | null;
    _and?:
      | Array<ResolverInputTypes['directus_panels_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['directus_panels_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_dashboards_filter']: {
    id?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    icon?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    note?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    date_created?:
      | ResolverInputTypes['date_filter_operators']
      | undefined
      | null;
    date_created_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    user_created?:
      | ResolverInputTypes['directus_users_filter']
      | undefined
      | null;
    color?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    panels?: ResolverInputTypes['directus_panels_filter'] | undefined | null;
    panels_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<
          ResolverInputTypes['directus_dashboards_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ResolverInputTypes['directus_dashboards_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['directus_panels_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['directus_panels_aggregated_count'];
    countDistinct?: ResolverInputTypes['directus_panels_aggregated_count'];
    avg?: ResolverInputTypes['directus_panels_aggregated_fields'];
    sum?: ResolverInputTypes['directus_panels_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['directus_panels_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['directus_panels_aggregated_fields'];
    min?: ResolverInputTypes['directus_panels_aggregated_fields'];
    max?: ResolverInputTypes['directus_panels_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_panels_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    dashboard?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    show_header?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    type?: boolean | `@${string}`;
    position_x?: boolean | `@${string}`;
    position_y?: boolean | `@${string}`;
    width?: boolean | `@${string}`;
    height?: boolean | `@${string}`;
    options?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    user_created?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_panels_aggregated_fields']: AliasType<{
    position_x?: boolean | `@${string}`;
    position_y?: boolean | `@${string}`;
    width?: boolean | `@${string}`;
    height?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_webhooks']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    method?: boolean | `@${string}`;
    url?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    data?: boolean | `@${string}`;
    actions?: boolean | `@${string}`;
    collections?: boolean | `@${string}`;
    headers?: boolean | `@${string}`;
    headers_func?: ResolverInputTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_webhooks_filter']: {
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    method?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    url?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    status?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    data?: ResolverInputTypes['boolean_filter_operators'] | undefined | null;
    actions?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    collections?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    headers?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    headers_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ResolverInputTypes['directus_webhooks_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['directus_webhooks_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_webhooks_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['directus_webhooks_aggregated_count'];
    countDistinct?: ResolverInputTypes['directus_webhooks_aggregated_count'];
    avg?: ResolverInputTypes['directus_webhooks_aggregated_fields'];
    sum?: ResolverInputTypes['directus_webhooks_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['directus_webhooks_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['directus_webhooks_aggregated_fields'];
    min?: ResolverInputTypes['directus_webhooks_aggregated_fields'];
    max?: ResolverInputTypes['directus_webhooks_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_webhooks_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    method?: boolean | `@${string}`;
    url?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    data?: boolean | `@${string}`;
    actions?: boolean | `@${string}`;
    collections?: boolean | `@${string}`;
    headers?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_webhooks_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_dashboards_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['directus_dashboards_aggregated_count'];
    countDistinct?: ResolverInputTypes['directus_dashboards_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_dashboards_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    user_created?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    panels?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_notifications']: AliasType<{
    id?: boolean | `@${string}`;
    timestamp?: boolean | `@${string}`;
    timestamp_func?: ResolverInputTypes['datetime_functions'];
    status?: boolean | `@${string}`;
    recipient?: [
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
    sender?: [
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
    subject?: boolean | `@${string}`;
    message?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_notifications_filter']: {
    id?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    timestamp?: ResolverInputTypes['date_filter_operators'] | undefined | null;
    timestamp_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    status?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    recipient?: ResolverInputTypes['directus_users_filter'] | undefined | null;
    sender?: ResolverInputTypes['directus_users_filter'] | undefined | null;
    subject?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    message?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    collection?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    item?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    _and?:
      | Array<
          ResolverInputTypes['directus_notifications_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ResolverInputTypes['directus_notifications_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['directus_notifications_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['directus_notifications_aggregated_count'];
    countDistinct?: ResolverInputTypes['directus_notifications_aggregated_count'];
    avg?: ResolverInputTypes['directus_notifications_aggregated_fields'];
    sum?: ResolverInputTypes['directus_notifications_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['directus_notifications_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['directus_notifications_aggregated_fields'];
    min?: ResolverInputTypes['directus_notifications_aggregated_fields'];
    max?: ResolverInputTypes['directus_notifications_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_notifications_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    timestamp?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    recipient?: boolean | `@${string}`;
    sender?: boolean | `@${string}`;
    subject?: boolean | `@${string}`;
    message?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_notifications_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_shares']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
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
    /** $t:shared_leave_blank_for_unlimited */
    password?: boolean | `@${string}`;
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
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: boolean | `@${string}`;
    date_start_func?: ResolverInputTypes['datetime_functions'];
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: boolean | `@${string}`;
    date_end_func?: ResolverInputTypes['datetime_functions'];
    times_used?: boolean | `@${string}`;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_shares_filter']: {
    id?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    collection?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    item?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    role?: ResolverInputTypes['directus_roles_filter'] | undefined | null;
    password?: ResolverInputTypes['hash_filter_operators'] | undefined | null;
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
    date_start?: ResolverInputTypes['date_filter_operators'] | undefined | null;
    date_start_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    date_end?: ResolverInputTypes['date_filter_operators'] | undefined | null;
    date_end_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    times_used?:
      | ResolverInputTypes['number_filter_operators']
      | undefined
      | null;
    max_uses?: ResolverInputTypes['number_filter_operators'] | undefined | null;
    _and?:
      | Array<ResolverInputTypes['directus_shares_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['directus_shares_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_shares_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['directus_shares_aggregated_count'];
    countDistinct?: ResolverInputTypes['directus_shares_aggregated_count'];
    avg?: ResolverInputTypes['directus_shares_aggregated_fields'];
    sum?: ResolverInputTypes['directus_shares_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['directus_shares_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['directus_shares_aggregated_fields'];
    min?: ResolverInputTypes['directus_shares_aggregated_fields'];
    max?: ResolverInputTypes['directus_shares_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_shares_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    role?: boolean | `@${string}`;
    /** $t:shared_leave_blank_for_unlimited */
    password?: boolean | `@${string}`;
    user_created?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: boolean | `@${string}`;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: boolean | `@${string}`;
    times_used?: boolean | `@${string}`;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_shares_aggregated_fields']: AliasType<{
    times_used?: boolean | `@${string}`;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_flows']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    trigger?: boolean | `@${string}`;
    accountability?: boolean | `@${string}`;
    options?: boolean | `@${string}`;
    options_func?: ResolverInputTypes['count_functions'];
    operation?: [
      {
        filter?:
          | ResolverInputTypes['directus_operations_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_operations'],
    ];
    date_created?: boolean | `@${string}`;
    date_created_func?: ResolverInputTypes['datetime_functions'];
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
    operations?: [
      {
        filter?:
          | ResolverInputTypes['directus_operations_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_operations'],
    ];
    operations_func?: ResolverInputTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_operations']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    key?: boolean | `@${string}`;
    type?: boolean | `@${string}`;
    position_x?: boolean | `@${string}`;
    position_y?: boolean | `@${string}`;
    options?: boolean | `@${string}`;
    options_func?: ResolverInputTypes['count_functions'];
    resolve?: [
      {
        filter?:
          | ResolverInputTypes['directus_operations_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_operations'],
    ];
    reject?: [
      {
        filter?:
          | ResolverInputTypes['directus_operations_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_operations'],
    ];
    flow?: [
      {
        filter?: ResolverInputTypes['directus_flows_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ResolverInputTypes['directus_flows'],
    ];
    date_created?: boolean | `@${string}`;
    date_created_func?: ResolverInputTypes['datetime_functions'];
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
  ['directus_operations_filter']: {
    id?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    key?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    type?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    position_x?:
      | ResolverInputTypes['number_filter_operators']
      | undefined
      | null;
    position_y?:
      | ResolverInputTypes['number_filter_operators']
      | undefined
      | null;
    options?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    options_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    resolve?:
      | ResolverInputTypes['directus_operations_filter']
      | undefined
      | null;
    reject?:
      | ResolverInputTypes['directus_operations_filter']
      | undefined
      | null;
    flow?: ResolverInputTypes['directus_flows_filter'] | undefined | null;
    date_created?:
      | ResolverInputTypes['date_filter_operators']
      | undefined
      | null;
    date_created_func?:
      | ResolverInputTypes['datetime_function_filter_operators']
      | undefined
      | null;
    user_created?:
      | ResolverInputTypes['directus_users_filter']
      | undefined
      | null;
    _and?:
      | Array<
          ResolverInputTypes['directus_operations_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ResolverInputTypes['directus_operations_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['directus_flows_filter']: {
    id?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    name?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    icon?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    color?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    description?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    status?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    trigger?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    accountability?:
      | ResolverInputTypes['string_filter_operators']
      | undefined
      | null;
    options?: ResolverInputTypes['string_filter_operators'] | undefined | null;
    options_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    operation?:
      | ResolverInputTypes['directus_operations_filter']
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
    user_created?:
      | ResolverInputTypes['directus_users_filter']
      | undefined
      | null;
    operations?:
      | ResolverInputTypes['directus_operations_filter']
      | undefined
      | null;
    operations_func?:
      | ResolverInputTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ResolverInputTypes['directus_flows_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ResolverInputTypes['directus_flows_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_flows_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['directus_flows_aggregated_count'];
    countDistinct?: ResolverInputTypes['directus_flows_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_flows_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    color?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    trigger?: boolean | `@${string}`;
    accountability?: boolean | `@${string}`;
    options?: boolean | `@${string}`;
    operation?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    user_created?: boolean | `@${string}`;
    operations?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_operations_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['directus_operations_aggregated_count'];
    countDistinct?: ResolverInputTypes['directus_operations_aggregated_count'];
    avg?: ResolverInputTypes['directus_operations_aggregated_fields'];
    sum?: ResolverInputTypes['directus_operations_aggregated_fields'];
    avgDistinct?: ResolverInputTypes['directus_operations_aggregated_fields'];
    sumDistinct?: ResolverInputTypes['directus_operations_aggregated_fields'];
    min?: ResolverInputTypes['directus_operations_aggregated_fields'];
    max?: ResolverInputTypes['directus_operations_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_operations_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    key?: boolean | `@${string}`;
    type?: boolean | `@${string}`;
    position_x?: boolean | `@${string}`;
    position_y?: boolean | `@${string}`;
    options?: boolean | `@${string}`;
    resolve?: boolean | `@${string}`;
    reject?: boolean | `@${string}`;
    flow?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    user_created?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_operations_aggregated_fields']: AliasType<{
    position_x?: boolean | `@${string}`;
    position_y?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_settings']: AliasType<{
    id?: boolean | `@${string}`;
    project_name?: boolean | `@${string}`;
    project_url?: boolean | `@${string}`;
    /** $t:field_options.directus_settings.project_color_note */
    project_color?: boolean | `@${string}`;
    project_logo?: [
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
    public_foreground?: [
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
    public_background?: [
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
    public_note?: boolean | `@${string}`;
    auth_login_attempts?: boolean | `@${string}`;
    auth_password_policy?: boolean | `@${string}`;
    storage_asset_transform?: boolean | `@${string}`;
    storage_asset_presets?: boolean | `@${string}`;
    storage_asset_presets_func?: ResolverInputTypes['count_functions'];
    custom_css?: boolean | `@${string}`;
    storage_default_folder?: [
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
    basemaps?: boolean | `@${string}`;
    basemaps_func?: ResolverInputTypes['count_functions'];
    mapbox_key?: boolean | `@${string}`;
    module_bar?: boolean | `@${string}`;
    module_bar_func?: ResolverInputTypes['count_functions'];
    project_descriptor?: boolean | `@${string}`;
    translation_strings?: boolean | `@${string}`;
    translation_strings_func?: ResolverInputTypes['count_functions'];
    default_language?: boolean | `@${string}`;
    custom_aspect_ratios?: boolean | `@${string}`;
    custom_aspect_ratios_func?: ResolverInputTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_users_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ResolverInputTypes['directus_users_aggregated_count'];
    countDistinct?: ResolverInputTypes['directus_users_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_users_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    first_name?: boolean | `@${string}`;
    last_name?: boolean | `@${string}`;
    email?: boolean | `@${string}`;
    password?: boolean | `@${string}`;
    location?: boolean | `@${string}`;
    title?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    tags?: boolean | `@${string}`;
    avatar?: boolean | `@${string}`;
    language?: boolean | `@${string}`;
    theme?: boolean | `@${string}`;
    tfa_secret?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    role?: boolean | `@${string}`;
    token?: boolean | `@${string}`;
    last_access?: boolean | `@${string}`;
    last_page?: boolean | `@${string}`;
    provider?: boolean | `@${string}`;
    external_identifier?: boolean | `@${string}`;
    auth_data?: boolean | `@${string}`;
    email_notifications?: boolean | `@${string}`;
    discord_handle?: boolean | `@${string}`;
    discord_id?: boolean | `@${string}`;
    timezone?: boolean | `@${string}`;
    twitter_handle?: boolean | `@${string}`;
    collaborators?: boolean | `@${string}`;
    skills?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['Mutation']: AliasType<{
    auth_login?: [
      {
        email: string;
        password: string;
        mode?: ResolverInputTypes['auth_mode'] | undefined | null;
        otp?: string | undefined | null;
      },
      ResolverInputTypes['auth_tokens'],
    ];
    auth_refresh?: [
      {
        refresh_token?: string | undefined | null;
        mode?: ResolverInputTypes['auth_mode'] | undefined | null;
      },
      ResolverInputTypes['auth_tokens'],
    ];
    auth_logout?: [
      { refresh_token?: string | undefined | null },
      boolean | `@${string}`,
    ];
    auth_password_request?: [
      { email: string; reset_url?: string | undefined | null },
      boolean | `@${string}`,
    ];
    auth_password_reset?: [
      { token: string; password: string },
      boolean | `@${string}`,
    ];
    users_me_tfa_generate?: [
      { password: string },
      ResolverInputTypes['users_me_tfa_generate_data'],
    ];
    users_me_tfa_enable?: [
      { otp: string; secret: string },
      boolean | `@${string}`,
    ];
    users_me_tfa_disable?: [{ otp: string }, boolean | `@${string}`];
    utils_hash_generate?: [{ string: string }, boolean | `@${string}`];
    utils_hash_verify?: [
      { string: string; hash: string },
      boolean | `@${string}`,
    ];
    utils_sort?: [
      { collection: string; item: string; to: string },
      boolean | `@${string}`,
    ];
    utils_revert?: [{ revision: string }, boolean | `@${string}`];
    utils_cache_clear?: boolean | `@${string}`;
    users_invite_accept?: [
      { token: string; password: string },
      boolean | `@${string}`,
    ];
    create_collections_item?: [
      { data: ResolverInputTypes['create_directus_collections_input'] },
      ResolverInputTypes['directus_collections'],
    ];
    update_collections_item?: [
      {
        collection: string;
        data: ResolverInputTypes['update_directus_collections_input'];
      },
      ResolverInputTypes['directus_collections'],
    ];
    delete_collections_item?: [
      { collection: string },
      ResolverInputTypes['delete_collection'],
    ];
    create_fields_item?: [
      {
        collection: string;
        data: ResolverInputTypes['create_directus_fields_input'];
      },
      ResolverInputTypes['directus_fields'],
    ];
    update_fields_item?: [
      {
        collection: string;
        field: string;
        data: ResolverInputTypes['update_directus_fields_input'];
      },
      ResolverInputTypes['directus_fields'],
    ];
    delete_fields_item?: [
      { collection: string; field: string },
      ResolverInputTypes['delete_field'],
    ];
    create_relations_item?: [
      { data: ResolverInputTypes['create_directus_relations_input'] },
      ResolverInputTypes['directus_relations'],
    ];
    update_relations_item?: [
      {
        collection: string;
        field: string;
        data: ResolverInputTypes['update_directus_relations_input'];
      },
      ResolverInputTypes['directus_relations'],
    ];
    delete_relations_item?: [
      { collection: string; field: string },
      ResolverInputTypes['delete_relation'],
    ];
    update_users_me?: [
      {
        data?:
          | ResolverInputTypes['update_directus_users_input']
          | undefined
          | null;
      },
      ResolverInputTypes['directus_users'],
    ];
    create_comment?: [
      { collection: string; item: string; comment: string },
      ResolverInputTypes['directus_activity'],
    ];
    update_comment?: [
      { id: string; comment: string },
      ResolverInputTypes['directus_activity'],
    ];
    delete_comment?: [{ id: string }, ResolverInputTypes['delete_one']];
    import_file?: [
      {
        url: string;
        data?:
          | ResolverInputTypes['create_directus_files_input']
          | undefined
          | null;
      },
      ResolverInputTypes['directus_files'],
    ];
    users_invite?: [
      { email: string; role: string; invite_url?: string | undefined | null },
      boolean | `@${string}`,
    ];
    create_roles_items?: [
      {
        filter?: ResolverInputTypes['directus_roles_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_directus_roles_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_roles'],
    ];
    create_roles_item?: [
      { data: ResolverInputTypes['create_directus_roles_input'] },
      ResolverInputTypes['directus_roles'],
    ];
    create_folders_items?: [
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
        data?:
          | Array<ResolverInputTypes['create_directus_folders_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_folders'],
    ];
    create_folders_item?: [
      { data: ResolverInputTypes['create_directus_folders_input'] },
      ResolverInputTypes['directus_folders'],
    ];
    create_permissions_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_permissions_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_directus_permissions_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_permissions'],
    ];
    create_permissions_item?: [
      { data: ResolverInputTypes['create_directus_permissions_input'] },
      ResolverInputTypes['directus_permissions'],
    ];
    create_files_items?: [
      {
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_directus_files_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_files'],
    ];
    create_files_item?: [
      { data: ResolverInputTypes['create_directus_files_input'] },
      ResolverInputTypes['directus_files'],
    ];
    create_presets_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_presets_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_directus_presets_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_presets'],
    ];
    create_presets_item?: [
      { data: ResolverInputTypes['create_directus_presets_input'] },
      ResolverInputTypes['directus_presets'],
    ];
    create_panels_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_panels_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_directus_panels_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_panels'],
    ];
    create_panels_item?: [
      { data: ResolverInputTypes['create_directus_panels_input'] },
      ResolverInputTypes['directus_panels'],
    ];
    create_webhooks_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_webhooks_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_directus_webhooks_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_webhooks'],
    ];
    create_webhooks_item?: [
      { data: ResolverInputTypes['create_directus_webhooks_input'] },
      ResolverInputTypes['directus_webhooks'],
    ];
    create_dashboards_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_dashboards_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_directus_dashboards_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_dashboards'],
    ];
    create_dashboards_item?: [
      { data: ResolverInputTypes['create_directus_dashboards_input'] },
      ResolverInputTypes['directus_dashboards'],
    ];
    create_notifications_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_notifications_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_directus_notifications_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_notifications'],
    ];
    create_notifications_item?: [
      { data: ResolverInputTypes['create_directus_notifications_input'] },
      ResolverInputTypes['directus_notifications'],
    ];
    create_shares_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_shares_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_directus_shares_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_shares'],
    ];
    create_shares_item?: [
      { data: ResolverInputTypes['create_directus_shares_input'] },
      ResolverInputTypes['directus_shares'],
    ];
    create_flows_items?: [
      {
        filter?: ResolverInputTypes['directus_flows_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_directus_flows_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_flows'],
    ];
    create_flows_item?: [
      { data: ResolverInputTypes['create_directus_flows_input'] },
      ResolverInputTypes['directus_flows'],
    ];
    create_operations_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_operations_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_directus_operations_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_operations'],
    ];
    create_operations_item?: [
      { data: ResolverInputTypes['create_directus_operations_input'] },
      ResolverInputTypes['directus_operations'],
    ];
    create_users_items?: [
      {
        filter?: ResolverInputTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['create_directus_users_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_users'],
    ];
    create_users_item?: [
      { data: ResolverInputTypes['create_directus_users_input'] },
      ResolverInputTypes['directus_users'],
    ];
    update_roles_items?: [
      {
        filter?: ResolverInputTypes['directus_roles_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_directus_roles_input'];
      },
      ResolverInputTypes['directus_roles'],
    ];
    update_roles_batch?: [
      {
        filter?: ResolverInputTypes['directus_roles_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_directus_roles_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_roles'],
    ];
    update_roles_item?: [
      { id: string; data: ResolverInputTypes['update_directus_roles_input'] },
      ResolverInputTypes['directus_roles'],
    ];
    update_folders_items?: [
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
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_directus_folders_input'];
      },
      ResolverInputTypes['directus_folders'],
    ];
    update_folders_batch?: [
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
        data?:
          | Array<ResolverInputTypes['update_directus_folders_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_folders'],
    ];
    update_folders_item?: [
      { id: string; data: ResolverInputTypes['update_directus_folders_input'] },
      ResolverInputTypes['directus_folders'],
    ];
    update_permissions_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_permissions_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_directus_permissions_input'];
      },
      ResolverInputTypes['directus_permissions'],
    ];
    update_permissions_batch?: [
      {
        filter?:
          | ResolverInputTypes['directus_permissions_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_directus_permissions_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_permissions'],
    ];
    update_permissions_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_directus_permissions_input'];
      },
      ResolverInputTypes['directus_permissions'],
    ];
    update_files_items?: [
      {
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_directus_files_input'];
      },
      ResolverInputTypes['directus_files'],
    ];
    update_files_batch?: [
      {
        filter?: ResolverInputTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_directus_files_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_files'],
    ];
    update_files_item?: [
      { id: string; data: ResolverInputTypes['update_directus_files_input'] },
      ResolverInputTypes['directus_files'],
    ];
    update_presets_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_presets_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_directus_presets_input'];
      },
      ResolverInputTypes['directus_presets'],
    ];
    update_presets_batch?: [
      {
        filter?:
          | ResolverInputTypes['directus_presets_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_directus_presets_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_presets'],
    ];
    update_presets_item?: [
      { id: string; data: ResolverInputTypes['update_directus_presets_input'] },
      ResolverInputTypes['directus_presets'],
    ];
    update_panels_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_panels_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_directus_panels_input'];
      },
      ResolverInputTypes['directus_panels'],
    ];
    update_panels_batch?: [
      {
        filter?:
          | ResolverInputTypes['directus_panels_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_directus_panels_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_panels'],
    ];
    update_panels_item?: [
      { id: string; data: ResolverInputTypes['update_directus_panels_input'] },
      ResolverInputTypes['directus_panels'],
    ];
    update_webhooks_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_webhooks_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_directus_webhooks_input'];
      },
      ResolverInputTypes['directus_webhooks'],
    ];
    update_webhooks_batch?: [
      {
        filter?:
          | ResolverInputTypes['directus_webhooks_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_directus_webhooks_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_webhooks'],
    ];
    update_webhooks_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_directus_webhooks_input'];
      },
      ResolverInputTypes['directus_webhooks'],
    ];
    update_dashboards_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_dashboards_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_directus_dashboards_input'];
      },
      ResolverInputTypes['directus_dashboards'],
    ];
    update_dashboards_batch?: [
      {
        filter?:
          | ResolverInputTypes['directus_dashboards_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_directus_dashboards_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_dashboards'],
    ];
    update_dashboards_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_directus_dashboards_input'];
      },
      ResolverInputTypes['directus_dashboards'],
    ];
    update_notifications_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_notifications_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_directus_notifications_input'];
      },
      ResolverInputTypes['directus_notifications'],
    ];
    update_notifications_batch?: [
      {
        filter?:
          | ResolverInputTypes['directus_notifications_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_directus_notifications_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_notifications'],
    ];
    update_notifications_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_directus_notifications_input'];
      },
      ResolverInputTypes['directus_notifications'],
    ];
    update_shares_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_shares_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_directus_shares_input'];
      },
      ResolverInputTypes['directus_shares'],
    ];
    update_shares_batch?: [
      {
        filter?:
          | ResolverInputTypes['directus_shares_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_directus_shares_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_shares'],
    ];
    update_shares_item?: [
      { id: string; data: ResolverInputTypes['update_directus_shares_input'] },
      ResolverInputTypes['directus_shares'],
    ];
    update_flows_items?: [
      {
        filter?: ResolverInputTypes['directus_flows_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_directus_flows_input'];
      },
      ResolverInputTypes['directus_flows'],
    ];
    update_flows_batch?: [
      {
        filter?: ResolverInputTypes['directus_flows_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_directus_flows_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_flows'],
    ];
    update_flows_item?: [
      { id: string; data: ResolverInputTypes['update_directus_flows_input'] },
      ResolverInputTypes['directus_flows'],
    ];
    update_operations_items?: [
      {
        filter?:
          | ResolverInputTypes['directus_operations_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_directus_operations_input'];
      },
      ResolverInputTypes['directus_operations'],
    ];
    update_operations_batch?: [
      {
        filter?:
          | ResolverInputTypes['directus_operations_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_directus_operations_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_operations'],
    ];
    update_operations_item?: [
      {
        id: string;
        data: ResolverInputTypes['update_directus_operations_input'];
      },
      ResolverInputTypes['directus_operations'],
    ];
    update_settings?: [
      { data: ResolverInputTypes['update_directus_settings_input'] },
      ResolverInputTypes['directus_settings'],
    ];
    update_users_items?: [
      {
        filter?: ResolverInputTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ResolverInputTypes['update_directus_users_input'];
      },
      ResolverInputTypes['directus_users'],
    ];
    update_users_batch?: [
      {
        filter?: ResolverInputTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ResolverInputTypes['update_directus_users_input']>
          | undefined
          | null;
      },
      ResolverInputTypes['directus_users'],
    ];
    update_users_item?: [
      { id: string; data: ResolverInputTypes['update_directus_users_input'] },
      ResolverInputTypes['directus_users'],
    ];
    delete_roles_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_roles_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_folders_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_folders_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_permissions_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_permissions_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_files_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_files_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_presets_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_presets_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_panels_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_panels_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_webhooks_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_webhooks_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_dashboards_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_dashboards_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_notifications_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_notifications_item?: [
      { id: string },
      ResolverInputTypes['delete_one'],
    ];
    delete_shares_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_shares_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_flows_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_flows_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_operations_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_operations_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    delete_users_items?: [
      { ids: Array<string | undefined | null> },
      ResolverInputTypes['delete_many'],
    ];
    delete_users_item?: [{ id: string }, ResolverInputTypes['delete_one']];
    __typename?: boolean | `@${string}`;
  }>;
  ['auth_tokens']: AliasType<{
    access_token?: boolean | `@${string}`;
    expires?: boolean | `@${string}`;
    refresh_token?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['auth_mode']: auth_mode;
  ['users_me_tfa_generate_data']: AliasType<{
    secret?: boolean | `@${string}`;
    otpauth_url?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  /** Represents NULL values */
  ['Void']: unknown;
  ['create_directus_collections_input']: {
    collection?: string | undefined | null;
    meta?:
      | ResolverInputTypes['directus_collections_meta_input']
      | undefined
      | null;
    schema?:
      | ResolverInputTypes['directus_collections_schema_input']
      | undefined
      | null;
    fields?:
      | Array<ResolverInputTypes['create_directus_collections_fields_input']>
      | undefined
      | null;
  };
  ['directus_collections_meta_input']: {
    collection: string;
    icon?: string | undefined | null;
    note?: string | undefined | null;
    display_template?: string | undefined | null;
    hidden: boolean;
    singleton: boolean;
    translations?: ResolverInputTypes['JSON'] | undefined | null;
    archive_field?: string | undefined | null;
    archive_app_filter: boolean;
    archive_value?: string | undefined | null;
    unarchive_value?: string | undefined | null;
    sort_field?: string | undefined | null;
    accountability?: string | undefined | null;
    color?: string | undefined | null;
    item_duplication_fields?: ResolverInputTypes['JSON'] | undefined | null;
    sort?: number | undefined | null;
    group?: string | undefined | null;
    collapse: string;
  };
  ['directus_collections_schema_input']: {
    name?: string | undefined | null;
    comment?: string | undefined | null;
  };
  ['create_directus_collections_fields_input']: {
    collection?: string | undefined | null;
    field?: string | undefined | null;
    type?: string | undefined | null;
    meta?: ResolverInputTypes['directus_fields_meta_input'] | undefined | null;
    schema?:
      | ResolverInputTypes['directus_fields_schema_input']
      | undefined
      | null;
  };
  ['directus_fields_meta_input']: {
    id: number;
    collection: string;
    field: string;
    special?: Array<string | undefined | null> | undefined | null;
    interface?: string | undefined | null;
    options?: ResolverInputTypes['JSON'] | undefined | null;
    display?: string | undefined | null;
    display_options?: ResolverInputTypes['JSON'] | undefined | null;
    readonly: boolean;
    hidden: boolean;
    sort?: number | undefined | null;
    width?: string | undefined | null;
    translations?: ResolverInputTypes['JSON'] | undefined | null;
    note?: string | undefined | null;
    conditions?: ResolverInputTypes['JSON'] | undefined | null;
    required?: boolean | undefined | null;
    group?: string | undefined | null;
    validation?: ResolverInputTypes['JSON'] | undefined | null;
    validation_message?: string | undefined | null;
  };
  ['directus_fields_schema_input']: {
    name?: string | undefined | null;
    table?: string | undefined | null;
    data_type?: string | undefined | null;
    default_value?: string | undefined | null;
    max_length?: number | undefined | null;
    numeric_precision?: number | undefined | null;
    numeric_scale?: number | undefined | null;
    is_nullable?: boolean | undefined | null;
    is_unique?: boolean | undefined | null;
    is_primary_key?: boolean | undefined | null;
    has_auto_increment?: boolean | undefined | null;
    foreign_key_column?: string | undefined | null;
    foreign_key_table?: string | undefined | null;
    comment?: string | undefined | null;
  };
  ['update_directus_collections_input']: {
    meta?:
      | ResolverInputTypes['directus_collections_meta_input']
      | undefined
      | null;
  };
  ['delete_collection']: AliasType<{
    collection?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['create_directus_fields_input']: {
    collection?: string | undefined | null;
    field?: string | undefined | null;
    type?: string | undefined | null;
    meta?: ResolverInputTypes['directus_fields_meta_input'] | undefined | null;
    schema?:
      | ResolverInputTypes['directus_fields_schema_input']
      | undefined
      | null;
  };
  ['update_directus_fields_input']: {
    collection?: string | undefined | null;
    field?: string | undefined | null;
    type?: string | undefined | null;
    meta?: ResolverInputTypes['directus_fields_meta_input'] | undefined | null;
    schema?:
      | ResolverInputTypes['directus_fields_schema_input']
      | undefined
      | null;
  };
  ['delete_field']: AliasType<{
    collection?: boolean | `@${string}`;
    field?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['create_directus_relations_input']: {
    collection?: string | undefined | null;
    field?: string | undefined | null;
    related_collection?: string | undefined | null;
    schema?:
      | ResolverInputTypes['directus_relations_schema_input']
      | undefined
      | null;
    meta?:
      | ResolverInputTypes['directus_relations_meta_input']
      | undefined
      | null;
  };
  ['directus_relations_schema_input']: {
    table: string;
    column: string;
    foreign_key_table: string;
    foreign_key_column: string;
    constraint_name?: string | undefined | null;
    on_update: string;
    on_delete: string;
  };
  ['directus_relations_meta_input']: {
    id?: number | undefined | null;
    many_collection?: string | undefined | null;
    many_field?: string | undefined | null;
    one_collection?: string | undefined | null;
    one_field?: string | undefined | null;
    one_collection_field?: string | undefined | null;
    one_allowed_collections?:
      | Array<string | undefined | null>
      | undefined
      | null;
    junction_field?: string | undefined | null;
    sort_field?: string | undefined | null;
    one_deselect_action?: string | undefined | null;
  };
  ['update_directus_relations_input']: {
    collection?: string | undefined | null;
    field?: string | undefined | null;
    related_collection?: string | undefined | null;
    schema?:
      | ResolverInputTypes['directus_relations_schema_input']
      | undefined
      | null;
    meta?:
      | ResolverInputTypes['directus_relations_meta_input']
      | undefined
      | null;
  };
  ['delete_relation']: AliasType<{
    collection?: boolean | `@${string}`;
    field?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
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
  ['delete_one']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
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
  ['create_directus_permissions_input']: {
    id?: string | undefined | null;
    role?: ResolverInputTypes['create_directus_roles_input'] | undefined | null;
    collection: string;
    action: string;
    permissions?: ResolverInputTypes['JSON'] | undefined | null;
    validation?: ResolverInputTypes['JSON'] | undefined | null;
    presets?: ResolverInputTypes['JSON'] | undefined | null;
    fields?: Array<string | undefined | null> | undefined | null;
  };
  ['create_directus_presets_input']: {
    id?: string | undefined | null;
    bookmark?: string | undefined | null;
    user?: ResolverInputTypes['create_directus_users_input'] | undefined | null;
    role?: ResolverInputTypes['create_directus_roles_input'] | undefined | null;
    collection?: string | undefined | null;
    search?: string | undefined | null;
    layout?: string | undefined | null;
    layout_query?: ResolverInputTypes['JSON'] | undefined | null;
    layout_options?: ResolverInputTypes['JSON'] | undefined | null;
    refresh_interval?: number | undefined | null;
    filter?: ResolverInputTypes['JSON'] | undefined | null;
    icon?: string | undefined | null;
    color?: string | undefined | null;
  };
  ['create_directus_panels_input']: {
    id?: string | undefined | null;
    dashboard?:
      | ResolverInputTypes['create_directus_dashboards_input']
      | undefined
      | null;
    name?: string | undefined | null;
    icon?: string | undefined | null;
    color?: string | undefined | null;
    show_header: boolean;
    note?: string | undefined | null;
    type: string;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    options?: ResolverInputTypes['JSON'] | undefined | null;
    date_created?: ResolverInputTypes['Date'] | undefined | null;
    user_created?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
  };
  ['create_directus_dashboards_input']: {
    id?: string | undefined | null;
    name: string;
    icon?: string | undefined | null;
    note?: string | undefined | null;
    date_created?: ResolverInputTypes['Date'] | undefined | null;
    user_created?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
    color?: string | undefined | null;
    panels?:
      | Array<
          ResolverInputTypes['create_directus_panels_input'] | undefined | null
        >
      | undefined
      | null;
  };
  ['create_directus_webhooks_input']: {
    id?: string | undefined | null;
    name: string;
    method?: string | undefined | null;
    url: string;
    status?: string | undefined | null;
    data?: boolean | undefined | null;
    actions: Array<string | undefined | null>;
    collections: Array<string | undefined | null>;
    headers?: ResolverInputTypes['JSON'] | undefined | null;
  };
  ['create_directus_notifications_input']: {
    id?: string | undefined | null;
    timestamp?: ResolverInputTypes['Date'] | undefined | null;
    status?: string | undefined | null;
    recipient?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
    sender?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
    subject: string;
    message?: string | undefined | null;
    collection?: string | undefined | null;
    item?: string | undefined | null;
  };
  ['create_directus_shares_input']: {
    id?: string | undefined | null;
    name?: string | undefined | null;
    collection?: string | undefined | null;
    item?: string | undefined | null;
    role?: ResolverInputTypes['create_directus_roles_input'] | undefined | null;
    /** $t:shared_leave_blank_for_unlimited */
    password?: ResolverInputTypes['Hash'] | undefined | null;
    user_created?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
    date_created?: ResolverInputTypes['Date'] | undefined | null;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: ResolverInputTypes['Date'] | undefined | null;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: ResolverInputTypes['Date'] | undefined | null;
    times_used?: number | undefined | null;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: number | undefined | null;
  };
  ['create_directus_flows_input']: {
    id?: string | undefined | null;
    name: string;
    icon?: string | undefined | null;
    color?: string | undefined | null;
    description?: string | undefined | null;
    status?: string | undefined | null;
    trigger?: string | undefined | null;
    accountability?: string | undefined | null;
    options?: ResolverInputTypes['JSON'] | undefined | null;
    operation?:
      | ResolverInputTypes['create_directus_operations_input']
      | undefined
      | null;
    date_created?: ResolverInputTypes['Date'] | undefined | null;
    user_created?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
    operations?:
      | Array<
          | ResolverInputTypes['create_directus_operations_input']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['create_directus_operations_input']: {
    id?: string | undefined | null;
    name?: string | undefined | null;
    key: string;
    type: string;
    position_x: number;
    position_y: number;
    options?: ResolverInputTypes['JSON'] | undefined | null;
    resolve?:
      | ResolverInputTypes['create_directus_operations_input']
      | undefined
      | null;
    reject?:
      | ResolverInputTypes['create_directus_operations_input']
      | undefined
      | null;
    flow?: ResolverInputTypes['create_directus_flows_input'] | undefined | null;
    date_created?: ResolverInputTypes['Date'] | undefined | null;
    user_created?:
      | ResolverInputTypes['create_directus_users_input']
      | undefined
      | null;
  };
  ['update_directus_permissions_input']: {
    id?: string | undefined | null;
    role?: ResolverInputTypes['update_directus_roles_input'] | undefined | null;
    collection?: string | undefined | null;
    action?: string | undefined | null;
    permissions?: ResolverInputTypes['JSON'] | undefined | null;
    validation?: ResolverInputTypes['JSON'] | undefined | null;
    presets?: ResolverInputTypes['JSON'] | undefined | null;
    fields?: Array<string | undefined | null> | undefined | null;
  };
  ['update_directus_presets_input']: {
    id?: string | undefined | null;
    bookmark?: string | undefined | null;
    user?: ResolverInputTypes['update_directus_users_input'] | undefined | null;
    role?: ResolverInputTypes['update_directus_roles_input'] | undefined | null;
    collection?: string | undefined | null;
    search?: string | undefined | null;
    layout?: string | undefined | null;
    layout_query?: ResolverInputTypes['JSON'] | undefined | null;
    layout_options?: ResolverInputTypes['JSON'] | undefined | null;
    refresh_interval?: number | undefined | null;
    filter?: ResolverInputTypes['JSON'] | undefined | null;
    icon?: string | undefined | null;
    color?: string | undefined | null;
  };
  ['update_directus_panels_input']: {
    id?: string | undefined | null;
    dashboard?:
      | ResolverInputTypes['update_directus_dashboards_input']
      | undefined
      | null;
    name?: string | undefined | null;
    icon?: string | undefined | null;
    color?: string | undefined | null;
    show_header?: boolean | undefined | null;
    note?: string | undefined | null;
    type?: string | undefined | null;
    position_x?: number | undefined | null;
    position_y?: number | undefined | null;
    width?: number | undefined | null;
    height?: number | undefined | null;
    options?: ResolverInputTypes['JSON'] | undefined | null;
    date_created?: ResolverInputTypes['Date'] | undefined | null;
    user_created?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
  };
  ['update_directus_dashboards_input']: {
    id?: string | undefined | null;
    name?: string | undefined | null;
    icon?: string | undefined | null;
    note?: string | undefined | null;
    date_created?: ResolverInputTypes['Date'] | undefined | null;
    user_created?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
    color?: string | undefined | null;
    panels?:
      | Array<
          ResolverInputTypes['update_directus_panels_input'] | undefined | null
        >
      | undefined
      | null;
  };
  ['update_directus_webhooks_input']: {
    id?: string | undefined | null;
    name?: string | undefined | null;
    method?: string | undefined | null;
    url?: string | undefined | null;
    status?: string | undefined | null;
    data?: boolean | undefined | null;
    actions?: Array<string | undefined | null> | undefined | null;
    collections?: Array<string | undefined | null> | undefined | null;
    headers?: ResolverInputTypes['JSON'] | undefined | null;
  };
  ['update_directus_notifications_input']: {
    id?: string | undefined | null;
    timestamp?: ResolverInputTypes['Date'] | undefined | null;
    status?: string | undefined | null;
    recipient?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
    sender?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
    subject?: string | undefined | null;
    message?: string | undefined | null;
    collection?: string | undefined | null;
    item?: string | undefined | null;
  };
  ['update_directus_shares_input']: {
    id?: string | undefined | null;
    name?: string | undefined | null;
    collection?: string | undefined | null;
    item?: string | undefined | null;
    role?: ResolverInputTypes['update_directus_roles_input'] | undefined | null;
    /** $t:shared_leave_blank_for_unlimited */
    password?: ResolverInputTypes['Hash'] | undefined | null;
    user_created?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
    date_created?: ResolverInputTypes['Date'] | undefined | null;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: ResolverInputTypes['Date'] | undefined | null;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: ResolverInputTypes['Date'] | undefined | null;
    times_used?: number | undefined | null;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: number | undefined | null;
  };
  ['update_directus_flows_input']: {
    id?: string | undefined | null;
    name?: string | undefined | null;
    icon?: string | undefined | null;
    color?: string | undefined | null;
    description?: string | undefined | null;
    status?: string | undefined | null;
    trigger?: string | undefined | null;
    accountability?: string | undefined | null;
    options?: ResolverInputTypes['JSON'] | undefined | null;
    operation?:
      | ResolverInputTypes['update_directus_operations_input']
      | undefined
      | null;
    date_created?: ResolverInputTypes['Date'] | undefined | null;
    user_created?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
    operations?:
      | Array<
          | ResolverInputTypes['update_directus_operations_input']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['update_directus_operations_input']: {
    id?: string | undefined | null;
    name?: string | undefined | null;
    key?: string | undefined | null;
    type?: string | undefined | null;
    position_x?: number | undefined | null;
    position_y?: number | undefined | null;
    options?: ResolverInputTypes['JSON'] | undefined | null;
    resolve?:
      | ResolverInputTypes['update_directus_operations_input']
      | undefined
      | null;
    reject?:
      | ResolverInputTypes['update_directus_operations_input']
      | undefined
      | null;
    flow?: ResolverInputTypes['update_directus_flows_input'] | undefined | null;
    date_created?: ResolverInputTypes['Date'] | undefined | null;
    user_created?:
      | ResolverInputTypes['update_directus_users_input']
      | undefined
      | null;
  };
  ['update_directus_settings_input']: {
    id?: string | undefined | null;
    project_name?: string | undefined | null;
    project_url?: string | undefined | null;
    /** $t:field_options.directus_settings.project_color_note */
    project_color?: string | undefined | null;
    project_logo?:
      | ResolverInputTypes['update_directus_files_input']
      | undefined
      | null;
    public_foreground?:
      | ResolverInputTypes['update_directus_files_input']
      | undefined
      | null;
    public_background?:
      | ResolverInputTypes['update_directus_files_input']
      | undefined
      | null;
    public_note?: string | undefined | null;
    auth_login_attempts?: number | undefined | null;
    auth_password_policy?: string | undefined | null;
    storage_asset_transform?: string | undefined | null;
    storage_asset_presets?: ResolverInputTypes['JSON'] | undefined | null;
    custom_css?: string | undefined | null;
    storage_default_folder?:
      | ResolverInputTypes['update_directus_folders_input']
      | undefined
      | null;
    basemaps?: ResolverInputTypes['JSON'] | undefined | null;
    mapbox_key?: string | undefined | null;
    module_bar?: ResolverInputTypes['JSON'] | undefined | null;
    project_descriptor?: string | undefined | null;
    translation_strings?: ResolverInputTypes['JSON'] | undefined | null;
    default_language?: string | undefined | null;
    custom_aspect_ratios?: ResolverInputTypes['JSON'] | undefined | null;
  };
  ['delete_many']: AliasType<{
    ids?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
};

export type ModelTypes = {
  ['Query']: {
    extensions?: ModelTypes['extensions'] | undefined;
    server_specs_oas?: ModelTypes['JSON'] | undefined;
    server_specs_graphql?: string | undefined;
    server_ping?: string | undefined;
    server_info?: ModelTypes['server_info'] | undefined;
    server_health?: ModelTypes['JSON'] | undefined;
    collections: Array<ModelTypes['directus_collections']>;
    collections_by_name?: ModelTypes['directus_collections'] | undefined;
    fields: Array<ModelTypes['directus_fields']>;
    fields_in_collection: Array<ModelTypes['directus_fields']>;
    fields_by_name?: ModelTypes['directus_fields'] | undefined;
    relations: Array<ModelTypes['directus_relations']>;
    relations_in_collection: Array<ModelTypes['directus_relations']>;
    relations_by_name?: ModelTypes['directus_relations'] | undefined;
    users_me?: ModelTypes['directus_users'] | undefined;
    roles: Array<ModelTypes['directus_roles']>;
    roles_by_id?: ModelTypes['directus_roles'] | undefined;
    roles_aggregated: Array<ModelTypes['directus_roles_aggregated']>;
    folders: Array<ModelTypes['directus_folders']>;
    folders_by_id?: ModelTypes['directus_folders'] | undefined;
    folders_aggregated: Array<ModelTypes['directus_folders_aggregated']>;
    activity: Array<ModelTypes['directus_activity']>;
    activity_by_id?: ModelTypes['directus_activity'] | undefined;
    activity_aggregated: Array<ModelTypes['directus_activity_aggregated']>;
    permissions: Array<ModelTypes['directus_permissions']>;
    permissions_by_id?: ModelTypes['directus_permissions'] | undefined;
    permissions_aggregated: Array<
      ModelTypes['directus_permissions_aggregated']
    >;
    files: Array<ModelTypes['directus_files']>;
    files_by_id?: ModelTypes['directus_files'] | undefined;
    files_aggregated: Array<ModelTypes['directus_files_aggregated']>;
    revisions: Array<ModelTypes['directus_revisions']>;
    revisions_by_id?: ModelTypes['directus_revisions'] | undefined;
    revisions_aggregated: Array<ModelTypes['directus_revisions_aggregated']>;
    presets: Array<ModelTypes['directus_presets']>;
    presets_by_id?: ModelTypes['directus_presets'] | undefined;
    presets_aggregated: Array<ModelTypes['directus_presets_aggregated']>;
    panels: Array<ModelTypes['directus_panels']>;
    panels_by_id?: ModelTypes['directus_panels'] | undefined;
    panels_aggregated: Array<ModelTypes['directus_panels_aggregated']>;
    webhooks: Array<ModelTypes['directus_webhooks']>;
    webhooks_by_id?: ModelTypes['directus_webhooks'] | undefined;
    webhooks_aggregated: Array<ModelTypes['directus_webhooks_aggregated']>;
    dashboards: Array<ModelTypes['directus_dashboards']>;
    dashboards_by_id?: ModelTypes['directus_dashboards'] | undefined;
    dashboards_aggregated: Array<ModelTypes['directus_dashboards_aggregated']>;
    notifications: Array<ModelTypes['directus_notifications']>;
    notifications_by_id?: ModelTypes['directus_notifications'] | undefined;
    notifications_aggregated: Array<
      ModelTypes['directus_notifications_aggregated']
    >;
    shares: Array<ModelTypes['directus_shares']>;
    shares_by_id?: ModelTypes['directus_shares'] | undefined;
    shares_aggregated: Array<ModelTypes['directus_shares_aggregated']>;
    flows: Array<ModelTypes['directus_flows']>;
    flows_by_id?: ModelTypes['directus_flows'] | undefined;
    flows_aggregated: Array<ModelTypes['directus_flows_aggregated']>;
    operations: Array<ModelTypes['directus_operations']>;
    operations_by_id?: ModelTypes['directus_operations'] | undefined;
    operations_aggregated: Array<ModelTypes['directus_operations_aggregated']>;
    settings?: ModelTypes['directus_settings'] | undefined;
    users: Array<ModelTypes['directus_users']>;
    users_by_id?: ModelTypes['directus_users'] | undefined;
    users_aggregated: Array<ModelTypes['directus_users_aggregated']>;
  };
  ['extensions']: {
    interfaces?: Array<string | undefined> | undefined;
    displays?: Array<string | undefined> | undefined;
    layouts?: Array<string | undefined> | undefined;
    modules?: Array<string | undefined> | undefined;
  };
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  ['JSON']: any;
  ['graphql_sdl_scope']: graphql_sdl_scope;
  ['server_info']: {
    project_name?: string | undefined;
    project_logo?: string | undefined;
    project_color?: string | undefined;
    project_foreground?: string | undefined;
    project_background?: string | undefined;
    project_note?: string | undefined;
    custom_css?: string | undefined;
    directus?: ModelTypes['server_info_directus'] | undefined;
    node?: ModelTypes['server_info_node'] | undefined;
    os?: ModelTypes['server_info_os'] | undefined;
  };
  ['server_info_directus']: {
    version?: string | undefined;
  };
  ['server_info_node']: {
    version?: string | undefined;
    uptime?: number | undefined;
  };
  ['server_info_os']: {
    type?: string | undefined;
    version?: string | undefined;
    uptime?: number | undefined;
    totalmem?: number | undefined;
  };
  ['directus_collections']: {
    collection?: string | undefined;
    meta?: ModelTypes['directus_collections_meta'] | undefined;
    schema?: ModelTypes['directus_collections_schema'] | undefined;
  };
  ['directus_collections_meta']: {
    collection: string;
    icon?: string | undefined;
    note?: string | undefined;
    display_template?: string | undefined;
    hidden: boolean;
    singleton: boolean;
    translations?: ModelTypes['JSON'] | undefined;
    archive_field?: string | undefined;
    archive_app_filter: boolean;
    archive_value?: string | undefined;
    unarchive_value?: string | undefined;
    sort_field?: string | undefined;
    accountability?: string | undefined;
    color?: string | undefined;
    item_duplication_fields?: ModelTypes['JSON'] | undefined;
    sort?: number | undefined;
    group?: string | undefined;
    collapse: string;
  };
  ['directus_collections_schema']: {
    name?: string | undefined;
    comment?: string | undefined;
  };
  ['directus_fields']: {
    collection?: string | undefined;
    field?: string | undefined;
    type?: string | undefined;
    meta?: ModelTypes['directus_fields_meta'] | undefined;
    schema?: ModelTypes['directus_fields_schema'] | undefined;
  };
  ['directus_fields_meta']: {
    id: number;
    collection: string;
    field: string;
    special?: Array<string | undefined> | undefined;
    interface?: string | undefined;
    options?: ModelTypes['JSON'] | undefined;
    display?: string | undefined;
    display_options?: ModelTypes['JSON'] | undefined;
    readonly: boolean;
    hidden: boolean;
    sort?: number | undefined;
    width?: string | undefined;
    translations?: ModelTypes['JSON'] | undefined;
    note?: string | undefined;
    conditions?: ModelTypes['JSON'] | undefined;
    required?: boolean | undefined;
    group?: string | undefined;
    validation?: ModelTypes['JSON'] | undefined;
    validation_message?: string | undefined;
  };
  ['directus_fields_schema']: {
    name?: string | undefined;
    table?: string | undefined;
    data_type?: string | undefined;
    default_value?: string | undefined;
    max_length?: number | undefined;
    numeric_precision?: number | undefined;
    numeric_scale?: number | undefined;
    is_nullable?: boolean | undefined;
    is_unique?: boolean | undefined;
    is_primary_key?: boolean | undefined;
    has_auto_increment?: boolean | undefined;
    foreign_key_column?: string | undefined;
    foreign_key_table?: string | undefined;
    comment?: string | undefined;
  };
  ['directus_relations']: {
    collection?: string | undefined;
    field?: string | undefined;
    related_collection?: string | undefined;
    schema?: ModelTypes['directus_relations_schema'] | undefined;
    meta?: ModelTypes['directus_relations_meta'] | undefined;
  };
  ['directus_relations_schema']: {
    table: string;
    column: string;
    foreign_key_table: string;
    foreign_key_column: string;
    constraint_name?: string | undefined;
    on_update: string;
    on_delete: string;
  };
  ['directus_relations_meta']: {
    id?: number | undefined;
    many_collection?: string | undefined;
    many_field?: string | undefined;
    one_collection?: string | undefined;
    one_field?: string | undefined;
    one_collection_field?: string | undefined;
    one_allowed_collections?: Array<string | undefined> | undefined;
    junction_field?: string | undefined;
    sort_field?: string | undefined;
    one_deselect_action?: string | undefined;
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
  ['count_functions']: {
    count?: number | undefined;
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
  /** BigInt value */
  ['GraphQLBigInt']: any;
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
  ['directus_roles_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['directus_roles_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['directus_roles_aggregated_count'] | undefined;
  };
  ['directus_roles_aggregated_count']: {
    id?: number | undefined;
    name?: number | undefined;
    icon?: number | undefined;
    description?: number | undefined;
    ip_access?: number | undefined;
    enforce_tfa?: number | undefined;
    admin_access?: number | undefined;
    app_access?: number | undefined;
    users?: number | undefined;
  };
  ['directus_folders_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['directus_folders_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['directus_folders_aggregated_count'] | undefined;
  };
  ['directus_folders_aggregated_count']: {
    id?: number | undefined;
    name?: number | undefined;
    parent?: number | undefined;
  };
  ['directus_activity']: {
    id: string;
    action: string;
    user?: ModelTypes['directus_users'] | undefined;
    timestamp?: ModelTypes['Date'] | undefined;
    timestamp_func?: ModelTypes['datetime_functions'] | undefined;
    ip?: string | undefined;
    user_agent?: string | undefined;
    collection: string;
    item: string;
    comment?: string | undefined;
    origin?: string | undefined;
    revisions?: Array<ModelTypes['directus_revisions'] | undefined> | undefined;
    revisions_func?: ModelTypes['count_functions'] | undefined;
  };
  ['directus_revisions']: {
    id: string;
    activity?: ModelTypes['directus_activity'] | undefined;
    collection: string;
    item: string;
    data?: ModelTypes['JSON'] | undefined;
    data_func?: ModelTypes['count_functions'] | undefined;
    delta?: ModelTypes['JSON'] | undefined;
    delta_func?: ModelTypes['count_functions'] | undefined;
    parent?: ModelTypes['directus_revisions'] | undefined;
  };
  ['directus_activity_filter']: {
    id?: ModelTypes['number_filter_operators'] | undefined;
    action?: ModelTypes['string_filter_operators'] | undefined;
    user?: ModelTypes['directus_users_filter'] | undefined;
    timestamp?: ModelTypes['date_filter_operators'] | undefined;
    timestamp_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    ip?: ModelTypes['string_filter_operators'] | undefined;
    user_agent?: ModelTypes['string_filter_operators'] | undefined;
    collection?: ModelTypes['string_filter_operators'] | undefined;
    item?: ModelTypes['string_filter_operators'] | undefined;
    comment?: ModelTypes['string_filter_operators'] | undefined;
    origin?: ModelTypes['string_filter_operators'] | undefined;
    revisions?: ModelTypes['directus_revisions_filter'] | undefined;
    revisions_func?: ModelTypes['count_function_filter_operators'] | undefined;
    _and?:
      | Array<ModelTypes['directus_activity_filter'] | undefined>
      | undefined;
    _or?: Array<ModelTypes['directus_activity_filter'] | undefined> | undefined;
  };
  ['directus_revisions_filter']: {
    id?: ModelTypes['number_filter_operators'] | undefined;
    activity?: ModelTypes['directus_activity_filter'] | undefined;
    collection?: ModelTypes['string_filter_operators'] | undefined;
    item?: ModelTypes['string_filter_operators'] | undefined;
    data?: ModelTypes['string_filter_operators'] | undefined;
    data_func?: ModelTypes['count_function_filter_operators'] | undefined;
    delta?: ModelTypes['string_filter_operators'] | undefined;
    delta_func?: ModelTypes['count_function_filter_operators'] | undefined;
    parent?: ModelTypes['directus_revisions_filter'] | undefined;
    _and?:
      | Array<ModelTypes['directus_revisions_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['directus_revisions_filter'] | undefined>
      | undefined;
  };
  ['directus_activity_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['directus_activity_aggregated_count'] | undefined;
    countDistinct?:
      | ModelTypes['directus_activity_aggregated_count']
      | undefined;
    avg?: ModelTypes['directus_activity_aggregated_fields'] | undefined;
    sum?: ModelTypes['directus_activity_aggregated_fields'] | undefined;
    avgDistinct?: ModelTypes['directus_activity_aggregated_fields'] | undefined;
    sumDistinct?: ModelTypes['directus_activity_aggregated_fields'] | undefined;
    min?: ModelTypes['directus_activity_aggregated_fields'] | undefined;
    max?: ModelTypes['directus_activity_aggregated_fields'] | undefined;
  };
  ['directus_activity_aggregated_count']: {
    id?: number | undefined;
    action?: number | undefined;
    user?: number | undefined;
    timestamp?: number | undefined;
    ip?: number | undefined;
    user_agent?: number | undefined;
    collection?: number | undefined;
    item?: number | undefined;
    comment?: number | undefined;
    origin?: number | undefined;
    revisions?: number | undefined;
  };
  ['directus_activity_aggregated_fields']: {
    id?: number | undefined;
  };
  ['directus_permissions']: {
    id: string;
    role?: ModelTypes['directus_roles'] | undefined;
    collection: string;
    action: string;
    permissions?: ModelTypes['JSON'] | undefined;
    permissions_func?: ModelTypes['count_functions'] | undefined;
    validation?: ModelTypes['JSON'] | undefined;
    validation_func?: ModelTypes['count_functions'] | undefined;
    presets?: ModelTypes['JSON'] | undefined;
    presets_func?: ModelTypes['count_functions'] | undefined;
    fields?: Array<string | undefined> | undefined;
  };
  ['directus_permissions_filter']: {
    id?: ModelTypes['number_filter_operators'] | undefined;
    role?: ModelTypes['directus_roles_filter'] | undefined;
    collection?: ModelTypes['string_filter_operators'] | undefined;
    action?: ModelTypes['string_filter_operators'] | undefined;
    permissions?: ModelTypes['string_filter_operators'] | undefined;
    permissions_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    validation?: ModelTypes['string_filter_operators'] | undefined;
    validation_func?: ModelTypes['count_function_filter_operators'] | undefined;
    presets?: ModelTypes['string_filter_operators'] | undefined;
    presets_func?: ModelTypes['count_function_filter_operators'] | undefined;
    fields?: ModelTypes['string_filter_operators'] | undefined;
    _and?:
      | Array<ModelTypes['directus_permissions_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['directus_permissions_filter'] | undefined>
      | undefined;
  };
  ['directus_permissions_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['directus_permissions_aggregated_count'] | undefined;
    countDistinct?:
      | ModelTypes['directus_permissions_aggregated_count']
      | undefined;
    avg?: ModelTypes['directus_permissions_aggregated_fields'] | undefined;
    sum?: ModelTypes['directus_permissions_aggregated_fields'] | undefined;
    avgDistinct?:
      | ModelTypes['directus_permissions_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['directus_permissions_aggregated_fields']
      | undefined;
    min?: ModelTypes['directus_permissions_aggregated_fields'] | undefined;
    max?: ModelTypes['directus_permissions_aggregated_fields'] | undefined;
  };
  ['directus_permissions_aggregated_count']: {
    id?: number | undefined;
    role?: number | undefined;
    collection?: number | undefined;
    action?: number | undefined;
    permissions?: number | undefined;
    validation?: number | undefined;
    presets?: number | undefined;
    fields?: number | undefined;
  };
  ['directus_permissions_aggregated_fields']: {
    id?: number | undefined;
  };
  ['directus_files_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['directus_files_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['directus_files_aggregated_count'] | undefined;
    avg?: ModelTypes['directus_files_aggregated_fields'] | undefined;
    sum?: ModelTypes['directus_files_aggregated_fields'] | undefined;
    avgDistinct?: ModelTypes['directus_files_aggregated_fields'] | undefined;
    sumDistinct?: ModelTypes['directus_files_aggregated_fields'] | undefined;
    min?: ModelTypes['directus_files_aggregated_fields'] | undefined;
    max?: ModelTypes['directus_files_aggregated_fields'] | undefined;
  };
  ['directus_files_aggregated_count']: {
    id?: number | undefined;
    storage?: number | undefined;
    filename_disk?: number | undefined;
    filename_download?: number | undefined;
    title?: number | undefined;
    type?: number | undefined;
    folder?: number | undefined;
    uploaded_by?: number | undefined;
    uploaded_on?: number | undefined;
    modified_by?: number | undefined;
    modified_on?: number | undefined;
    charset?: number | undefined;
    filesize?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    duration?: number | undefined;
    embed?: number | undefined;
    description?: number | undefined;
    location?: number | undefined;
    tags?: number | undefined;
    metadata?: number | undefined;
  };
  ['directus_files_aggregated_fields']: {
    filesize?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    duration?: number | undefined;
  };
  ['directus_revisions_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['directus_revisions_aggregated_count'] | undefined;
    countDistinct?:
      | ModelTypes['directus_revisions_aggregated_count']
      | undefined;
    avg?: ModelTypes['directus_revisions_aggregated_fields'] | undefined;
    sum?: ModelTypes['directus_revisions_aggregated_fields'] | undefined;
    avgDistinct?:
      | ModelTypes['directus_revisions_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['directus_revisions_aggregated_fields']
      | undefined;
    min?: ModelTypes['directus_revisions_aggregated_fields'] | undefined;
    max?: ModelTypes['directus_revisions_aggregated_fields'] | undefined;
  };
  ['directus_revisions_aggregated_count']: {
    id?: number | undefined;
    activity?: number | undefined;
    collection?: number | undefined;
    item?: number | undefined;
    data?: number | undefined;
    delta?: number | undefined;
    parent?: number | undefined;
  };
  ['directus_revisions_aggregated_fields']: {
    id?: number | undefined;
    activity?: number | undefined;
    parent?: number | undefined;
  };
  ['directus_presets']: {
    id: string;
    bookmark?: string | undefined;
    user?: ModelTypes['directus_users'] | undefined;
    role?: ModelTypes['directus_roles'] | undefined;
    collection?: string | undefined;
    search?: string | undefined;
    layout?: string | undefined;
    layout_query?: ModelTypes['JSON'] | undefined;
    layout_query_func?: ModelTypes['count_functions'] | undefined;
    layout_options?: ModelTypes['JSON'] | undefined;
    layout_options_func?: ModelTypes['count_functions'] | undefined;
    refresh_interval?: number | undefined;
    filter?: ModelTypes['JSON'] | undefined;
    filter_func?: ModelTypes['count_functions'] | undefined;
    icon?: string | undefined;
    color?: string | undefined;
  };
  ['directus_presets_filter']: {
    id?: ModelTypes['number_filter_operators'] | undefined;
    bookmark?: ModelTypes['string_filter_operators'] | undefined;
    user?: ModelTypes['directus_users_filter'] | undefined;
    role?: ModelTypes['directus_roles_filter'] | undefined;
    collection?: ModelTypes['string_filter_operators'] | undefined;
    search?: ModelTypes['string_filter_operators'] | undefined;
    layout?: ModelTypes['string_filter_operators'] | undefined;
    layout_query?: ModelTypes['string_filter_operators'] | undefined;
    layout_query_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    layout_options?: ModelTypes['string_filter_operators'] | undefined;
    layout_options_func?:
      | ModelTypes['count_function_filter_operators']
      | undefined;
    refresh_interval?: ModelTypes['number_filter_operators'] | undefined;
    filter?: ModelTypes['string_filter_operators'] | undefined;
    filter_func?: ModelTypes['count_function_filter_operators'] | undefined;
    icon?: ModelTypes['string_filter_operators'] | undefined;
    color?: ModelTypes['string_filter_operators'] | undefined;
    _and?: Array<ModelTypes['directus_presets_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['directus_presets_filter'] | undefined> | undefined;
  };
  ['directus_presets_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['directus_presets_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['directus_presets_aggregated_count'] | undefined;
    avg?: ModelTypes['directus_presets_aggregated_fields'] | undefined;
    sum?: ModelTypes['directus_presets_aggregated_fields'] | undefined;
    avgDistinct?: ModelTypes['directus_presets_aggregated_fields'] | undefined;
    sumDistinct?: ModelTypes['directus_presets_aggregated_fields'] | undefined;
    min?: ModelTypes['directus_presets_aggregated_fields'] | undefined;
    max?: ModelTypes['directus_presets_aggregated_fields'] | undefined;
  };
  ['directus_presets_aggregated_count']: {
    id?: number | undefined;
    bookmark?: number | undefined;
    user?: number | undefined;
    role?: number | undefined;
    collection?: number | undefined;
    search?: number | undefined;
    layout?: number | undefined;
    layout_query?: number | undefined;
    layout_options?: number | undefined;
    refresh_interval?: number | undefined;
    filter?: number | undefined;
    icon?: number | undefined;
    color?: number | undefined;
  };
  ['directus_presets_aggregated_fields']: {
    id?: number | undefined;
    refresh_interval?: number | undefined;
  };
  ['directus_panels']: {
    id: string;
    dashboard?: ModelTypes['directus_dashboards'] | undefined;
    name?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    show_header: boolean;
    note?: string | undefined;
    type: string;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    options?: ModelTypes['JSON'] | undefined;
    options_func?: ModelTypes['count_functions'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    date_created_func?: ModelTypes['datetime_functions'] | undefined;
    user_created?: ModelTypes['directus_users'] | undefined;
  };
  ['directus_dashboards']: {
    id: string;
    name: string;
    icon?: string | undefined;
    note?: string | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    date_created_func?: ModelTypes['datetime_functions'] | undefined;
    user_created?: ModelTypes['directus_users'] | undefined;
    color?: string | undefined;
    panels?: Array<ModelTypes['directus_panels'] | undefined> | undefined;
    panels_func?: ModelTypes['count_functions'] | undefined;
  };
  ['directus_panels_filter']: {
    id?: ModelTypes['string_filter_operators'] | undefined;
    dashboard?: ModelTypes['directus_dashboards_filter'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    icon?: ModelTypes['string_filter_operators'] | undefined;
    color?: ModelTypes['string_filter_operators'] | undefined;
    show_header?: ModelTypes['boolean_filter_operators'] | undefined;
    note?: ModelTypes['string_filter_operators'] | undefined;
    type?: ModelTypes['string_filter_operators'] | undefined;
    position_x?: ModelTypes['number_filter_operators'] | undefined;
    position_y?: ModelTypes['number_filter_operators'] | undefined;
    width?: ModelTypes['number_filter_operators'] | undefined;
    height?: ModelTypes['number_filter_operators'] | undefined;
    options?: ModelTypes['string_filter_operators'] | undefined;
    options_func?: ModelTypes['count_function_filter_operators'] | undefined;
    date_created?: ModelTypes['date_filter_operators'] | undefined;
    date_created_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    user_created?: ModelTypes['directus_users_filter'] | undefined;
    _and?: Array<ModelTypes['directus_panels_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['directus_panels_filter'] | undefined> | undefined;
  };
  ['directus_dashboards_filter']: {
    id?: ModelTypes['string_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    icon?: ModelTypes['string_filter_operators'] | undefined;
    note?: ModelTypes['string_filter_operators'] | undefined;
    date_created?: ModelTypes['date_filter_operators'] | undefined;
    date_created_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    user_created?: ModelTypes['directus_users_filter'] | undefined;
    color?: ModelTypes['string_filter_operators'] | undefined;
    panels?: ModelTypes['directus_panels_filter'] | undefined;
    panels_func?: ModelTypes['count_function_filter_operators'] | undefined;
    _and?:
      | Array<ModelTypes['directus_dashboards_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['directus_dashboards_filter'] | undefined>
      | undefined;
  };
  ['directus_panels_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['directus_panels_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['directus_panels_aggregated_count'] | undefined;
    avg?: ModelTypes['directus_panels_aggregated_fields'] | undefined;
    sum?: ModelTypes['directus_panels_aggregated_fields'] | undefined;
    avgDistinct?: ModelTypes['directus_panels_aggregated_fields'] | undefined;
    sumDistinct?: ModelTypes['directus_panels_aggregated_fields'] | undefined;
    min?: ModelTypes['directus_panels_aggregated_fields'] | undefined;
    max?: ModelTypes['directus_panels_aggregated_fields'] | undefined;
  };
  ['directus_panels_aggregated_count']: {
    id?: number | undefined;
    dashboard?: number | undefined;
    name?: number | undefined;
    icon?: number | undefined;
    color?: number | undefined;
    show_header?: number | undefined;
    note?: number | undefined;
    type?: number | undefined;
    position_x?: number | undefined;
    position_y?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    options?: number | undefined;
    date_created?: number | undefined;
    user_created?: number | undefined;
  };
  ['directus_panels_aggregated_fields']: {
    position_x?: number | undefined;
    position_y?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
  };
  ['directus_webhooks']: {
    id: string;
    name: string;
    method?: string | undefined;
    url: string;
    status?: string | undefined;
    data?: boolean | undefined;
    actions: Array<string | undefined>;
    collections: Array<string | undefined>;
    headers?: ModelTypes['JSON'] | undefined;
    headers_func?: ModelTypes['count_functions'] | undefined;
  };
  ['directus_webhooks_filter']: {
    id?: ModelTypes['number_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    method?: ModelTypes['string_filter_operators'] | undefined;
    url?: ModelTypes['string_filter_operators'] | undefined;
    status?: ModelTypes['string_filter_operators'] | undefined;
    data?: ModelTypes['boolean_filter_operators'] | undefined;
    actions?: ModelTypes['string_filter_operators'] | undefined;
    collections?: ModelTypes['string_filter_operators'] | undefined;
    headers?: ModelTypes['string_filter_operators'] | undefined;
    headers_func?: ModelTypes['count_function_filter_operators'] | undefined;
    _and?:
      | Array<ModelTypes['directus_webhooks_filter'] | undefined>
      | undefined;
    _or?: Array<ModelTypes['directus_webhooks_filter'] | undefined> | undefined;
  };
  ['directus_webhooks_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['directus_webhooks_aggregated_count'] | undefined;
    countDistinct?:
      | ModelTypes['directus_webhooks_aggregated_count']
      | undefined;
    avg?: ModelTypes['directus_webhooks_aggregated_fields'] | undefined;
    sum?: ModelTypes['directus_webhooks_aggregated_fields'] | undefined;
    avgDistinct?: ModelTypes['directus_webhooks_aggregated_fields'] | undefined;
    sumDistinct?: ModelTypes['directus_webhooks_aggregated_fields'] | undefined;
    min?: ModelTypes['directus_webhooks_aggregated_fields'] | undefined;
    max?: ModelTypes['directus_webhooks_aggregated_fields'] | undefined;
  };
  ['directus_webhooks_aggregated_count']: {
    id?: number | undefined;
    name?: number | undefined;
    method?: number | undefined;
    url?: number | undefined;
    status?: number | undefined;
    data?: number | undefined;
    actions?: number | undefined;
    collections?: number | undefined;
    headers?: number | undefined;
  };
  ['directus_webhooks_aggregated_fields']: {
    id?: number | undefined;
  };
  ['directus_dashboards_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['directus_dashboards_aggregated_count'] | undefined;
    countDistinct?:
      | ModelTypes['directus_dashboards_aggregated_count']
      | undefined;
  };
  ['directus_dashboards_aggregated_count']: {
    id?: number | undefined;
    name?: number | undefined;
    icon?: number | undefined;
    note?: number | undefined;
    date_created?: number | undefined;
    user_created?: number | undefined;
    color?: number | undefined;
    panels?: number | undefined;
  };
  ['directus_notifications']: {
    id: string;
    timestamp?: ModelTypes['Date'] | undefined;
    timestamp_func?: ModelTypes['datetime_functions'] | undefined;
    status?: string | undefined;
    recipient?: ModelTypes['directus_users'] | undefined;
    sender?: ModelTypes['directus_users'] | undefined;
    subject: string;
    message?: string | undefined;
    collection?: string | undefined;
    item?: string | undefined;
  };
  ['directus_notifications_filter']: {
    id?: ModelTypes['number_filter_operators'] | undefined;
    timestamp?: ModelTypes['date_filter_operators'] | undefined;
    timestamp_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    status?: ModelTypes['string_filter_operators'] | undefined;
    recipient?: ModelTypes['directus_users_filter'] | undefined;
    sender?: ModelTypes['directus_users_filter'] | undefined;
    subject?: ModelTypes['string_filter_operators'] | undefined;
    message?: ModelTypes['string_filter_operators'] | undefined;
    collection?: ModelTypes['string_filter_operators'] | undefined;
    item?: ModelTypes['string_filter_operators'] | undefined;
    _and?:
      | Array<ModelTypes['directus_notifications_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['directus_notifications_filter'] | undefined>
      | undefined;
  };
  ['directus_notifications_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['directus_notifications_aggregated_count'] | undefined;
    countDistinct?:
      | ModelTypes['directus_notifications_aggregated_count']
      | undefined;
    avg?: ModelTypes['directus_notifications_aggregated_fields'] | undefined;
    sum?: ModelTypes['directus_notifications_aggregated_fields'] | undefined;
    avgDistinct?:
      | ModelTypes['directus_notifications_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['directus_notifications_aggregated_fields']
      | undefined;
    min?: ModelTypes['directus_notifications_aggregated_fields'] | undefined;
    max?: ModelTypes['directus_notifications_aggregated_fields'] | undefined;
  };
  ['directus_notifications_aggregated_count']: {
    id?: number | undefined;
    timestamp?: number | undefined;
    status?: number | undefined;
    recipient?: number | undefined;
    sender?: number | undefined;
    subject?: number | undefined;
    message?: number | undefined;
    collection?: number | undefined;
    item?: number | undefined;
  };
  ['directus_notifications_aggregated_fields']: {
    id?: number | undefined;
  };
  ['directus_shares']: {
    id: string;
    name?: string | undefined;
    collection?: string | undefined;
    item?: string | undefined;
    role?: ModelTypes['directus_roles'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    password?: ModelTypes['Hash'] | undefined;
    user_created?: ModelTypes['directus_users'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    date_created_func?: ModelTypes['datetime_functions'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: ModelTypes['Date'] | undefined;
    date_start_func?: ModelTypes['datetime_functions'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: ModelTypes['Date'] | undefined;
    date_end_func?: ModelTypes['datetime_functions'] | undefined;
    times_used?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: number | undefined;
  };
  ['directus_shares_filter']: {
    id?: ModelTypes['string_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    collection?: ModelTypes['string_filter_operators'] | undefined;
    item?: ModelTypes['string_filter_operators'] | undefined;
    role?: ModelTypes['directus_roles_filter'] | undefined;
    password?: ModelTypes['hash_filter_operators'] | undefined;
    user_created?: ModelTypes['directus_users_filter'] | undefined;
    date_created?: ModelTypes['date_filter_operators'] | undefined;
    date_created_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    date_start?: ModelTypes['date_filter_operators'] | undefined;
    date_start_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    date_end?: ModelTypes['date_filter_operators'] | undefined;
    date_end_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    times_used?: ModelTypes['number_filter_operators'] | undefined;
    max_uses?: ModelTypes['number_filter_operators'] | undefined;
    _and?: Array<ModelTypes['directus_shares_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['directus_shares_filter'] | undefined> | undefined;
  };
  ['directus_shares_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['directus_shares_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['directus_shares_aggregated_count'] | undefined;
    avg?: ModelTypes['directus_shares_aggregated_fields'] | undefined;
    sum?: ModelTypes['directus_shares_aggregated_fields'] | undefined;
    avgDistinct?: ModelTypes['directus_shares_aggregated_fields'] | undefined;
    sumDistinct?: ModelTypes['directus_shares_aggregated_fields'] | undefined;
    min?: ModelTypes['directus_shares_aggregated_fields'] | undefined;
    max?: ModelTypes['directus_shares_aggregated_fields'] | undefined;
  };
  ['directus_shares_aggregated_count']: {
    id?: number | undefined;
    name?: number | undefined;
    collection?: number | undefined;
    item?: number | undefined;
    role?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    password?: number | undefined;
    user_created?: number | undefined;
    date_created?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: number | undefined;
    times_used?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: number | undefined;
  };
  ['directus_shares_aggregated_fields']: {
    times_used?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: number | undefined;
  };
  ['directus_flows']: {
    id: string;
    name: string;
    icon?: string | undefined;
    color?: string | undefined;
    description?: string | undefined;
    status?: string | undefined;
    trigger?: string | undefined;
    accountability?: string | undefined;
    options?: ModelTypes['JSON'] | undefined;
    options_func?: ModelTypes['count_functions'] | undefined;
    operation?: ModelTypes['directus_operations'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    date_created_func?: ModelTypes['datetime_functions'] | undefined;
    user_created?: ModelTypes['directus_users'] | undefined;
    operations?:
      | Array<ModelTypes['directus_operations'] | undefined>
      | undefined;
    operations_func?: ModelTypes['count_functions'] | undefined;
  };
  ['directus_operations']: {
    id: string;
    name?: string | undefined;
    key: string;
    type: string;
    position_x: number;
    position_y: number;
    options?: ModelTypes['JSON'] | undefined;
    options_func?: ModelTypes['count_functions'] | undefined;
    resolve?: ModelTypes['directus_operations'] | undefined;
    reject?: ModelTypes['directus_operations'] | undefined;
    flow?: ModelTypes['directus_flows'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    date_created_func?: ModelTypes['datetime_functions'] | undefined;
    user_created?: ModelTypes['directus_users'] | undefined;
  };
  ['directus_operations_filter']: {
    id?: ModelTypes['string_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    key?: ModelTypes['string_filter_operators'] | undefined;
    type?: ModelTypes['string_filter_operators'] | undefined;
    position_x?: ModelTypes['number_filter_operators'] | undefined;
    position_y?: ModelTypes['number_filter_operators'] | undefined;
    options?: ModelTypes['string_filter_operators'] | undefined;
    options_func?: ModelTypes['count_function_filter_operators'] | undefined;
    resolve?: ModelTypes['directus_operations_filter'] | undefined;
    reject?: ModelTypes['directus_operations_filter'] | undefined;
    flow?: ModelTypes['directus_flows_filter'] | undefined;
    date_created?: ModelTypes['date_filter_operators'] | undefined;
    date_created_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    user_created?: ModelTypes['directus_users_filter'] | undefined;
    _and?:
      | Array<ModelTypes['directus_operations_filter'] | undefined>
      | undefined;
    _or?:
      | Array<ModelTypes['directus_operations_filter'] | undefined>
      | undefined;
  };
  ['directus_flows_filter']: {
    id?: ModelTypes['string_filter_operators'] | undefined;
    name?: ModelTypes['string_filter_operators'] | undefined;
    icon?: ModelTypes['string_filter_operators'] | undefined;
    color?: ModelTypes['string_filter_operators'] | undefined;
    description?: ModelTypes['string_filter_operators'] | undefined;
    status?: ModelTypes['string_filter_operators'] | undefined;
    trigger?: ModelTypes['string_filter_operators'] | undefined;
    accountability?: ModelTypes['string_filter_operators'] | undefined;
    options?: ModelTypes['string_filter_operators'] | undefined;
    options_func?: ModelTypes['count_function_filter_operators'] | undefined;
    operation?: ModelTypes['directus_operations_filter'] | undefined;
    date_created?: ModelTypes['date_filter_operators'] | undefined;
    date_created_func?:
      | ModelTypes['datetime_function_filter_operators']
      | undefined;
    user_created?: ModelTypes['directus_users_filter'] | undefined;
    operations?: ModelTypes['directus_operations_filter'] | undefined;
    operations_func?: ModelTypes['count_function_filter_operators'] | undefined;
    _and?: Array<ModelTypes['directus_flows_filter'] | undefined> | undefined;
    _or?: Array<ModelTypes['directus_flows_filter'] | undefined> | undefined;
  };
  ['directus_flows_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['directus_flows_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['directus_flows_aggregated_count'] | undefined;
  };
  ['directus_flows_aggregated_count']: {
    id?: number | undefined;
    name?: number | undefined;
    icon?: number | undefined;
    color?: number | undefined;
    description?: number | undefined;
    status?: number | undefined;
    trigger?: number | undefined;
    accountability?: number | undefined;
    options?: number | undefined;
    operation?: number | undefined;
    date_created?: number | undefined;
    user_created?: number | undefined;
    operations?: number | undefined;
  };
  ['directus_operations_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['directus_operations_aggregated_count'] | undefined;
    countDistinct?:
      | ModelTypes['directus_operations_aggregated_count']
      | undefined;
    avg?: ModelTypes['directus_operations_aggregated_fields'] | undefined;
    sum?: ModelTypes['directus_operations_aggregated_fields'] | undefined;
    avgDistinct?:
      | ModelTypes['directus_operations_aggregated_fields']
      | undefined;
    sumDistinct?:
      | ModelTypes['directus_operations_aggregated_fields']
      | undefined;
    min?: ModelTypes['directus_operations_aggregated_fields'] | undefined;
    max?: ModelTypes['directus_operations_aggregated_fields'] | undefined;
  };
  ['directus_operations_aggregated_count']: {
    id?: number | undefined;
    name?: number | undefined;
    key?: number | undefined;
    type?: number | undefined;
    position_x?: number | undefined;
    position_y?: number | undefined;
    options?: number | undefined;
    resolve?: number | undefined;
    reject?: number | undefined;
    flow?: number | undefined;
    date_created?: number | undefined;
    user_created?: number | undefined;
  };
  ['directus_operations_aggregated_fields']: {
    position_x?: number | undefined;
    position_y?: number | undefined;
  };
  ['directus_settings']: {
    id: string;
    project_name?: string | undefined;
    project_url?: string | undefined;
    /** $t:field_options.directus_settings.project_color_note */
    project_color?: string | undefined;
    project_logo?: ModelTypes['directus_files'] | undefined;
    public_foreground?: ModelTypes['directus_files'] | undefined;
    public_background?: ModelTypes['directus_files'] | undefined;
    public_note?: string | undefined;
    auth_login_attempts?: number | undefined;
    auth_password_policy?: string | undefined;
    storage_asset_transform?: string | undefined;
    storage_asset_presets?: ModelTypes['JSON'] | undefined;
    storage_asset_presets_func?: ModelTypes['count_functions'] | undefined;
    custom_css?: string | undefined;
    storage_default_folder?: ModelTypes['directus_folders'] | undefined;
    basemaps?: ModelTypes['JSON'] | undefined;
    basemaps_func?: ModelTypes['count_functions'] | undefined;
    mapbox_key?: string | undefined;
    module_bar?: ModelTypes['JSON'] | undefined;
    module_bar_func?: ModelTypes['count_functions'] | undefined;
    project_descriptor?: string | undefined;
    translation_strings?: ModelTypes['JSON'] | undefined;
    translation_strings_func?: ModelTypes['count_functions'] | undefined;
    default_language?: string | undefined;
    custom_aspect_ratios?: ModelTypes['JSON'] | undefined;
    custom_aspect_ratios_func?: ModelTypes['count_functions'] | undefined;
  };
  ['directus_users_aggregated']: {
    group?: ModelTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: ModelTypes['directus_users_aggregated_count'] | undefined;
    countDistinct?: ModelTypes['directus_users_aggregated_count'] | undefined;
  };
  ['directus_users_aggregated_count']: {
    id?: number | undefined;
    first_name?: number | undefined;
    last_name?: number | undefined;
    email?: number | undefined;
    password?: number | undefined;
    location?: number | undefined;
    title?: number | undefined;
    description?: number | undefined;
    tags?: number | undefined;
    avatar?: number | undefined;
    language?: number | undefined;
    theme?: number | undefined;
    tfa_secret?: number | undefined;
    status?: number | undefined;
    role?: number | undefined;
    token?: number | undefined;
    last_access?: number | undefined;
    last_page?: number | undefined;
    provider?: number | undefined;
    external_identifier?: number | undefined;
    auth_data?: number | undefined;
    email_notifications?: number | undefined;
    discord_handle?: number | undefined;
    discord_id?: number | undefined;
    timezone?: number | undefined;
    twitter_handle?: number | undefined;
    collaborators?: number | undefined;
    skills?: number | undefined;
  };
  ['Mutation']: {
    auth_login?: ModelTypes['auth_tokens'] | undefined;
    auth_refresh?: ModelTypes['auth_tokens'] | undefined;
    auth_logout?: boolean | undefined;
    auth_password_request?: boolean | undefined;
    auth_password_reset?: boolean | undefined;
    users_me_tfa_generate?:
      | ModelTypes['users_me_tfa_generate_data']
      | undefined;
    users_me_tfa_enable?: boolean | undefined;
    users_me_tfa_disable?: boolean | undefined;
    utils_hash_generate?: string | undefined;
    utils_hash_verify?: boolean | undefined;
    utils_sort?: boolean | undefined;
    utils_revert?: boolean | undefined;
    utils_cache_clear?: ModelTypes['Void'] | undefined;
    users_invite_accept?: boolean | undefined;
    create_collections_item?: ModelTypes['directus_collections'] | undefined;
    update_collections_item?: ModelTypes['directus_collections'] | undefined;
    delete_collections_item?: ModelTypes['delete_collection'] | undefined;
    create_fields_item?: ModelTypes['directus_fields'] | undefined;
    update_fields_item?: ModelTypes['directus_fields'] | undefined;
    delete_fields_item?: ModelTypes['delete_field'] | undefined;
    create_relations_item?: ModelTypes['directus_relations'] | undefined;
    update_relations_item?: ModelTypes['directus_relations'] | undefined;
    delete_relations_item?: ModelTypes['delete_relation'] | undefined;
    update_users_me?: ModelTypes['directus_users'] | undefined;
    create_comment?: ModelTypes['directus_activity'] | undefined;
    update_comment?: ModelTypes['directus_activity'] | undefined;
    delete_comment?: ModelTypes['delete_one'] | undefined;
    import_file?: ModelTypes['directus_files'] | undefined;
    users_invite?: boolean | undefined;
    create_roles_items: Array<ModelTypes['directus_roles']>;
    create_roles_item?: ModelTypes['directus_roles'] | undefined;
    create_folders_items: Array<ModelTypes['directus_folders']>;
    create_folders_item?: ModelTypes['directus_folders'] | undefined;
    create_permissions_items: Array<ModelTypes['directus_permissions']>;
    create_permissions_item?: ModelTypes['directus_permissions'] | undefined;
    create_files_items: Array<ModelTypes['directus_files']>;
    create_files_item?: ModelTypes['directus_files'] | undefined;
    create_presets_items: Array<ModelTypes['directus_presets']>;
    create_presets_item?: ModelTypes['directus_presets'] | undefined;
    create_panels_items: Array<ModelTypes['directus_panels']>;
    create_panels_item?: ModelTypes['directus_panels'] | undefined;
    create_webhooks_items: Array<ModelTypes['directus_webhooks']>;
    create_webhooks_item?: ModelTypes['directus_webhooks'] | undefined;
    create_dashboards_items: Array<ModelTypes['directus_dashboards']>;
    create_dashboards_item?: ModelTypes['directus_dashboards'] | undefined;
    create_notifications_items: Array<ModelTypes['directus_notifications']>;
    create_notifications_item?:
      | ModelTypes['directus_notifications']
      | undefined;
    create_shares_items: Array<ModelTypes['directus_shares']>;
    create_shares_item?: ModelTypes['directus_shares'] | undefined;
    create_flows_items: Array<ModelTypes['directus_flows']>;
    create_flows_item?: ModelTypes['directus_flows'] | undefined;
    create_operations_items: Array<ModelTypes['directus_operations']>;
    create_operations_item?: ModelTypes['directus_operations'] | undefined;
    create_users_items: Array<ModelTypes['directus_users']>;
    create_users_item?: ModelTypes['directus_users'] | undefined;
    update_roles_items: Array<ModelTypes['directus_roles']>;
    update_roles_batch: Array<ModelTypes['directus_roles']>;
    update_roles_item?: ModelTypes['directus_roles'] | undefined;
    update_folders_items: Array<ModelTypes['directus_folders']>;
    update_folders_batch: Array<ModelTypes['directus_folders']>;
    update_folders_item?: ModelTypes['directus_folders'] | undefined;
    update_permissions_items: Array<ModelTypes['directus_permissions']>;
    update_permissions_batch: Array<ModelTypes['directus_permissions']>;
    update_permissions_item?: ModelTypes['directus_permissions'] | undefined;
    update_files_items: Array<ModelTypes['directus_files']>;
    update_files_batch: Array<ModelTypes['directus_files']>;
    update_files_item?: ModelTypes['directus_files'] | undefined;
    update_presets_items: Array<ModelTypes['directus_presets']>;
    update_presets_batch: Array<ModelTypes['directus_presets']>;
    update_presets_item?: ModelTypes['directus_presets'] | undefined;
    update_panels_items: Array<ModelTypes['directus_panels']>;
    update_panels_batch: Array<ModelTypes['directus_panels']>;
    update_panels_item?: ModelTypes['directus_panels'] | undefined;
    update_webhooks_items: Array<ModelTypes['directus_webhooks']>;
    update_webhooks_batch: Array<ModelTypes['directus_webhooks']>;
    update_webhooks_item?: ModelTypes['directus_webhooks'] | undefined;
    update_dashboards_items: Array<ModelTypes['directus_dashboards']>;
    update_dashboards_batch: Array<ModelTypes['directus_dashboards']>;
    update_dashboards_item?: ModelTypes['directus_dashboards'] | undefined;
    update_notifications_items: Array<ModelTypes['directus_notifications']>;
    update_notifications_batch: Array<ModelTypes['directus_notifications']>;
    update_notifications_item?:
      | ModelTypes['directus_notifications']
      | undefined;
    update_shares_items: Array<ModelTypes['directus_shares']>;
    update_shares_batch: Array<ModelTypes['directus_shares']>;
    update_shares_item?: ModelTypes['directus_shares'] | undefined;
    update_flows_items: Array<ModelTypes['directus_flows']>;
    update_flows_batch: Array<ModelTypes['directus_flows']>;
    update_flows_item?: ModelTypes['directus_flows'] | undefined;
    update_operations_items: Array<ModelTypes['directus_operations']>;
    update_operations_batch: Array<ModelTypes['directus_operations']>;
    update_operations_item?: ModelTypes['directus_operations'] | undefined;
    update_settings?: ModelTypes['directus_settings'] | undefined;
    update_users_items: Array<ModelTypes['directus_users']>;
    update_users_batch: Array<ModelTypes['directus_users']>;
    update_users_item?: ModelTypes['directus_users'] | undefined;
    delete_roles_items?: ModelTypes['delete_many'] | undefined;
    delete_roles_item?: ModelTypes['delete_one'] | undefined;
    delete_folders_items?: ModelTypes['delete_many'] | undefined;
    delete_folders_item?: ModelTypes['delete_one'] | undefined;
    delete_permissions_items?: ModelTypes['delete_many'] | undefined;
    delete_permissions_item?: ModelTypes['delete_one'] | undefined;
    delete_files_items?: ModelTypes['delete_many'] | undefined;
    delete_files_item?: ModelTypes['delete_one'] | undefined;
    delete_presets_items?: ModelTypes['delete_many'] | undefined;
    delete_presets_item?: ModelTypes['delete_one'] | undefined;
    delete_panels_items?: ModelTypes['delete_many'] | undefined;
    delete_panels_item?: ModelTypes['delete_one'] | undefined;
    delete_webhooks_items?: ModelTypes['delete_many'] | undefined;
    delete_webhooks_item?: ModelTypes['delete_one'] | undefined;
    delete_dashboards_items?: ModelTypes['delete_many'] | undefined;
    delete_dashboards_item?: ModelTypes['delete_one'] | undefined;
    delete_notifications_items?: ModelTypes['delete_many'] | undefined;
    delete_notifications_item?: ModelTypes['delete_one'] | undefined;
    delete_shares_items?: ModelTypes['delete_many'] | undefined;
    delete_shares_item?: ModelTypes['delete_one'] | undefined;
    delete_flows_items?: ModelTypes['delete_many'] | undefined;
    delete_flows_item?: ModelTypes['delete_one'] | undefined;
    delete_operations_items?: ModelTypes['delete_many'] | undefined;
    delete_operations_item?: ModelTypes['delete_one'] | undefined;
    delete_users_items?: ModelTypes['delete_many'] | undefined;
    delete_users_item?: ModelTypes['delete_one'] | undefined;
  };
  ['auth_tokens']: {
    access_token?: string | undefined;
    expires?: number | undefined;
    refresh_token?: string | undefined;
  };
  ['auth_mode']: auth_mode;
  ['users_me_tfa_generate_data']: {
    secret?: string | undefined;
    otpauth_url?: string | undefined;
  };
  /** Represents NULL values */
  ['Void']: any;
  ['create_directus_collections_input']: {
    collection?: string | undefined;
    meta?: ModelTypes['directus_collections_meta_input'] | undefined;
    schema?: ModelTypes['directus_collections_schema_input'] | undefined;
    fields?:
      | Array<ModelTypes['create_directus_collections_fields_input']>
      | undefined;
  };
  ['directus_collections_meta_input']: {
    collection: string;
    icon?: string | undefined;
    note?: string | undefined;
    display_template?: string | undefined;
    hidden: boolean;
    singleton: boolean;
    translations?: ModelTypes['JSON'] | undefined;
    archive_field?: string | undefined;
    archive_app_filter: boolean;
    archive_value?: string | undefined;
    unarchive_value?: string | undefined;
    sort_field?: string | undefined;
    accountability?: string | undefined;
    color?: string | undefined;
    item_duplication_fields?: ModelTypes['JSON'] | undefined;
    sort?: number | undefined;
    group?: string | undefined;
    collapse: string;
  };
  ['directus_collections_schema_input']: {
    name?: string | undefined;
    comment?: string | undefined;
  };
  ['create_directus_collections_fields_input']: {
    collection?: string | undefined;
    field?: string | undefined;
    type?: string | undefined;
    meta?: ModelTypes['directus_fields_meta_input'] | undefined;
    schema?: ModelTypes['directus_fields_schema_input'] | undefined;
  };
  ['directus_fields_meta_input']: {
    id: number;
    collection: string;
    field: string;
    special?: Array<string | undefined> | undefined;
    interface?: string | undefined;
    options?: ModelTypes['JSON'] | undefined;
    display?: string | undefined;
    display_options?: ModelTypes['JSON'] | undefined;
    readonly: boolean;
    hidden: boolean;
    sort?: number | undefined;
    width?: string | undefined;
    translations?: ModelTypes['JSON'] | undefined;
    note?: string | undefined;
    conditions?: ModelTypes['JSON'] | undefined;
    required?: boolean | undefined;
    group?: string | undefined;
    validation?: ModelTypes['JSON'] | undefined;
    validation_message?: string | undefined;
  };
  ['directus_fields_schema_input']: {
    name?: string | undefined;
    table?: string | undefined;
    data_type?: string | undefined;
    default_value?: string | undefined;
    max_length?: number | undefined;
    numeric_precision?: number | undefined;
    numeric_scale?: number | undefined;
    is_nullable?: boolean | undefined;
    is_unique?: boolean | undefined;
    is_primary_key?: boolean | undefined;
    has_auto_increment?: boolean | undefined;
    foreign_key_column?: string | undefined;
    foreign_key_table?: string | undefined;
    comment?: string | undefined;
  };
  ['update_directus_collections_input']: {
    meta?: ModelTypes['directus_collections_meta_input'] | undefined;
  };
  ['delete_collection']: {
    collection?: string | undefined;
  };
  ['create_directus_fields_input']: {
    collection?: string | undefined;
    field?: string | undefined;
    type?: string | undefined;
    meta?: ModelTypes['directus_fields_meta_input'] | undefined;
    schema?: ModelTypes['directus_fields_schema_input'] | undefined;
  };
  ['update_directus_fields_input']: {
    collection?: string | undefined;
    field?: string | undefined;
    type?: string | undefined;
    meta?: ModelTypes['directus_fields_meta_input'] | undefined;
    schema?: ModelTypes['directus_fields_schema_input'] | undefined;
  };
  ['delete_field']: {
    collection?: string | undefined;
    field?: string | undefined;
  };
  ['create_directus_relations_input']: {
    collection?: string | undefined;
    field?: string | undefined;
    related_collection?: string | undefined;
    schema?: ModelTypes['directus_relations_schema_input'] | undefined;
    meta?: ModelTypes['directus_relations_meta_input'] | undefined;
  };
  ['directus_relations_schema_input']: {
    table: string;
    column: string;
    foreign_key_table: string;
    foreign_key_column: string;
    constraint_name?: string | undefined;
    on_update: string;
    on_delete: string;
  };
  ['directus_relations_meta_input']: {
    id?: number | undefined;
    many_collection?: string | undefined;
    many_field?: string | undefined;
    one_collection?: string | undefined;
    one_field?: string | undefined;
    one_collection_field?: string | undefined;
    one_allowed_collections?: Array<string | undefined> | undefined;
    junction_field?: string | undefined;
    sort_field?: string | undefined;
    one_deselect_action?: string | undefined;
  };
  ['update_directus_relations_input']: {
    collection?: string | undefined;
    field?: string | undefined;
    related_collection?: string | undefined;
    schema?: ModelTypes['directus_relations_schema_input'] | undefined;
    meta?: ModelTypes['directus_relations_meta_input'] | undefined;
  };
  ['delete_relation']: {
    collection?: string | undefined;
    field?: string | undefined;
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
  ['delete_one']: {
    id: string;
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
  ['create_directus_permissions_input']: {
    id?: string | undefined;
    role?: ModelTypes['create_directus_roles_input'] | undefined;
    collection: string;
    action: string;
    permissions?: ModelTypes['JSON'] | undefined;
    validation?: ModelTypes['JSON'] | undefined;
    presets?: ModelTypes['JSON'] | undefined;
    fields?: Array<string | undefined> | undefined;
  };
  ['create_directus_presets_input']: {
    id?: string | undefined;
    bookmark?: string | undefined;
    user?: ModelTypes['create_directus_users_input'] | undefined;
    role?: ModelTypes['create_directus_roles_input'] | undefined;
    collection?: string | undefined;
    search?: string | undefined;
    layout?: string | undefined;
    layout_query?: ModelTypes['JSON'] | undefined;
    layout_options?: ModelTypes['JSON'] | undefined;
    refresh_interval?: number | undefined;
    filter?: ModelTypes['JSON'] | undefined;
    icon?: string | undefined;
    color?: string | undefined;
  };
  ['create_directus_panels_input']: {
    id?: string | undefined;
    dashboard?: ModelTypes['create_directus_dashboards_input'] | undefined;
    name?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    show_header: boolean;
    note?: string | undefined;
    type: string;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    options?: ModelTypes['JSON'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    user_created?: ModelTypes['create_directus_users_input'] | undefined;
  };
  ['create_directus_dashboards_input']: {
    id?: string | undefined;
    name: string;
    icon?: string | undefined;
    note?: string | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    user_created?: ModelTypes['create_directus_users_input'] | undefined;
    color?: string | undefined;
    panels?:
      | Array<ModelTypes['create_directus_panels_input'] | undefined>
      | undefined;
  };
  ['create_directus_webhooks_input']: {
    id?: string | undefined;
    name: string;
    method?: string | undefined;
    url: string;
    status?: string | undefined;
    data?: boolean | undefined;
    actions: Array<string | undefined>;
    collections: Array<string | undefined>;
    headers?: ModelTypes['JSON'] | undefined;
  };
  ['create_directus_notifications_input']: {
    id?: string | undefined;
    timestamp?: ModelTypes['Date'] | undefined;
    status?: string | undefined;
    recipient?: ModelTypes['create_directus_users_input'] | undefined;
    sender?: ModelTypes['create_directus_users_input'] | undefined;
    subject: string;
    message?: string | undefined;
    collection?: string | undefined;
    item?: string | undefined;
  };
  ['create_directus_shares_input']: {
    id?: string | undefined;
    name?: string | undefined;
    collection?: string | undefined;
    item?: string | undefined;
    role?: ModelTypes['create_directus_roles_input'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    password?: ModelTypes['Hash'] | undefined;
    user_created?: ModelTypes['create_directus_users_input'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: ModelTypes['Date'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: ModelTypes['Date'] | undefined;
    times_used?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: number | undefined;
  };
  ['create_directus_flows_input']: {
    id?: string | undefined;
    name: string;
    icon?: string | undefined;
    color?: string | undefined;
    description?: string | undefined;
    status?: string | undefined;
    trigger?: string | undefined;
    accountability?: string | undefined;
    options?: ModelTypes['JSON'] | undefined;
    operation?: ModelTypes['create_directus_operations_input'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    user_created?: ModelTypes['create_directus_users_input'] | undefined;
    operations?:
      | Array<ModelTypes['create_directus_operations_input'] | undefined>
      | undefined;
  };
  ['create_directus_operations_input']: {
    id?: string | undefined;
    name?: string | undefined;
    key: string;
    type: string;
    position_x: number;
    position_y: number;
    options?: ModelTypes['JSON'] | undefined;
    resolve?: ModelTypes['create_directus_operations_input'] | undefined;
    reject?: ModelTypes['create_directus_operations_input'] | undefined;
    flow?: ModelTypes['create_directus_flows_input'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    user_created?: ModelTypes['create_directus_users_input'] | undefined;
  };
  ['update_directus_permissions_input']: {
    id?: string | undefined;
    role?: ModelTypes['update_directus_roles_input'] | undefined;
    collection?: string | undefined;
    action?: string | undefined;
    permissions?: ModelTypes['JSON'] | undefined;
    validation?: ModelTypes['JSON'] | undefined;
    presets?: ModelTypes['JSON'] | undefined;
    fields?: Array<string | undefined> | undefined;
  };
  ['update_directus_presets_input']: {
    id?: string | undefined;
    bookmark?: string | undefined;
    user?: ModelTypes['update_directus_users_input'] | undefined;
    role?: ModelTypes['update_directus_roles_input'] | undefined;
    collection?: string | undefined;
    search?: string | undefined;
    layout?: string | undefined;
    layout_query?: ModelTypes['JSON'] | undefined;
    layout_options?: ModelTypes['JSON'] | undefined;
    refresh_interval?: number | undefined;
    filter?: ModelTypes['JSON'] | undefined;
    icon?: string | undefined;
    color?: string | undefined;
  };
  ['update_directus_panels_input']: {
    id?: string | undefined;
    dashboard?: ModelTypes['update_directus_dashboards_input'] | undefined;
    name?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    show_header?: boolean | undefined;
    note?: string | undefined;
    type?: string | undefined;
    position_x?: number | undefined;
    position_y?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    options?: ModelTypes['JSON'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    user_created?: ModelTypes['update_directus_users_input'] | undefined;
  };
  ['update_directus_dashboards_input']: {
    id?: string | undefined;
    name?: string | undefined;
    icon?: string | undefined;
    note?: string | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    user_created?: ModelTypes['update_directus_users_input'] | undefined;
    color?: string | undefined;
    panels?:
      | Array<ModelTypes['update_directus_panels_input'] | undefined>
      | undefined;
  };
  ['update_directus_webhooks_input']: {
    id?: string | undefined;
    name?: string | undefined;
    method?: string | undefined;
    url?: string | undefined;
    status?: string | undefined;
    data?: boolean | undefined;
    actions?: Array<string | undefined> | undefined;
    collections?: Array<string | undefined> | undefined;
    headers?: ModelTypes['JSON'] | undefined;
  };
  ['update_directus_notifications_input']: {
    id?: string | undefined;
    timestamp?: ModelTypes['Date'] | undefined;
    status?: string | undefined;
    recipient?: ModelTypes['update_directus_users_input'] | undefined;
    sender?: ModelTypes['update_directus_users_input'] | undefined;
    subject?: string | undefined;
    message?: string | undefined;
    collection?: string | undefined;
    item?: string | undefined;
  };
  ['update_directus_shares_input']: {
    id?: string | undefined;
    name?: string | undefined;
    collection?: string | undefined;
    item?: string | undefined;
    role?: ModelTypes['update_directus_roles_input'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    password?: ModelTypes['Hash'] | undefined;
    user_created?: ModelTypes['update_directus_users_input'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: ModelTypes['Date'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: ModelTypes['Date'] | undefined;
    times_used?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: number | undefined;
  };
  ['update_directus_flows_input']: {
    id?: string | undefined;
    name?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    description?: string | undefined;
    status?: string | undefined;
    trigger?: string | undefined;
    accountability?: string | undefined;
    options?: ModelTypes['JSON'] | undefined;
    operation?: ModelTypes['update_directus_operations_input'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    user_created?: ModelTypes['update_directus_users_input'] | undefined;
    operations?:
      | Array<ModelTypes['update_directus_operations_input'] | undefined>
      | undefined;
  };
  ['update_directus_operations_input']: {
    id?: string | undefined;
    name?: string | undefined;
    key?: string | undefined;
    type?: string | undefined;
    position_x?: number | undefined;
    position_y?: number | undefined;
    options?: ModelTypes['JSON'] | undefined;
    resolve?: ModelTypes['update_directus_operations_input'] | undefined;
    reject?: ModelTypes['update_directus_operations_input'] | undefined;
    flow?: ModelTypes['update_directus_flows_input'] | undefined;
    date_created?: ModelTypes['Date'] | undefined;
    user_created?: ModelTypes['update_directus_users_input'] | undefined;
  };
  ['update_directus_settings_input']: {
    id?: string | undefined;
    project_name?: string | undefined;
    project_url?: string | undefined;
    /** $t:field_options.directus_settings.project_color_note */
    project_color?: string | undefined;
    project_logo?: ModelTypes['update_directus_files_input'] | undefined;
    public_foreground?: ModelTypes['update_directus_files_input'] | undefined;
    public_background?: ModelTypes['update_directus_files_input'] | undefined;
    public_note?: string | undefined;
    auth_login_attempts?: number | undefined;
    auth_password_policy?: string | undefined;
    storage_asset_transform?: string | undefined;
    storage_asset_presets?: ModelTypes['JSON'] | undefined;
    custom_css?: string | undefined;
    storage_default_folder?:
      | ModelTypes['update_directus_folders_input']
      | undefined;
    basemaps?: ModelTypes['JSON'] | undefined;
    mapbox_key?: string | undefined;
    module_bar?: ModelTypes['JSON'] | undefined;
    project_descriptor?: string | undefined;
    translation_strings?: ModelTypes['JSON'] | undefined;
    default_language?: string | undefined;
    custom_aspect_ratios?: ModelTypes['JSON'] | undefined;
  };
  ['delete_many']: {
    ids: Array<string | undefined>;
  };
};

export type GraphQLTypes = {
  ['Query']: {
    __typename: 'Query';
    extensions?: GraphQLTypes['extensions'] | undefined;
    server_specs_oas?: GraphQLTypes['JSON'] | undefined;
    server_specs_graphql?: string | undefined;
    server_ping?: string | undefined;
    server_info?: GraphQLTypes['server_info'] | undefined;
    server_health?: GraphQLTypes['JSON'] | undefined;
    collections: Array<GraphQLTypes['directus_collections']>;
    collections_by_name?: GraphQLTypes['directus_collections'] | undefined;
    fields: Array<GraphQLTypes['directus_fields']>;
    fields_in_collection: Array<GraphQLTypes['directus_fields']>;
    fields_by_name?: GraphQLTypes['directus_fields'] | undefined;
    relations: Array<GraphQLTypes['directus_relations']>;
    relations_in_collection: Array<GraphQLTypes['directus_relations']>;
    relations_by_name?: GraphQLTypes['directus_relations'] | undefined;
    users_me?: GraphQLTypes['directus_users'] | undefined;
    roles: Array<GraphQLTypes['directus_roles']>;
    roles_by_id?: GraphQLTypes['directus_roles'] | undefined;
    roles_aggregated: Array<GraphQLTypes['directus_roles_aggregated']>;
    folders: Array<GraphQLTypes['directus_folders']>;
    folders_by_id?: GraphQLTypes['directus_folders'] | undefined;
    folders_aggregated: Array<GraphQLTypes['directus_folders_aggregated']>;
    activity: Array<GraphQLTypes['directus_activity']>;
    activity_by_id?: GraphQLTypes['directus_activity'] | undefined;
    activity_aggregated: Array<GraphQLTypes['directus_activity_aggregated']>;
    permissions: Array<GraphQLTypes['directus_permissions']>;
    permissions_by_id?: GraphQLTypes['directus_permissions'] | undefined;
    permissions_aggregated: Array<
      GraphQLTypes['directus_permissions_aggregated']
    >;
    files: Array<GraphQLTypes['directus_files']>;
    files_by_id?: GraphQLTypes['directus_files'] | undefined;
    files_aggregated: Array<GraphQLTypes['directus_files_aggregated']>;
    revisions: Array<GraphQLTypes['directus_revisions']>;
    revisions_by_id?: GraphQLTypes['directus_revisions'] | undefined;
    revisions_aggregated: Array<GraphQLTypes['directus_revisions_aggregated']>;
    presets: Array<GraphQLTypes['directus_presets']>;
    presets_by_id?: GraphQLTypes['directus_presets'] | undefined;
    presets_aggregated: Array<GraphQLTypes['directus_presets_aggregated']>;
    panels: Array<GraphQLTypes['directus_panels']>;
    panels_by_id?: GraphQLTypes['directus_panels'] | undefined;
    panels_aggregated: Array<GraphQLTypes['directus_panels_aggregated']>;
    webhooks: Array<GraphQLTypes['directus_webhooks']>;
    webhooks_by_id?: GraphQLTypes['directus_webhooks'] | undefined;
    webhooks_aggregated: Array<GraphQLTypes['directus_webhooks_aggregated']>;
    dashboards: Array<GraphQLTypes['directus_dashboards']>;
    dashboards_by_id?: GraphQLTypes['directus_dashboards'] | undefined;
    dashboards_aggregated: Array<
      GraphQLTypes['directus_dashboards_aggregated']
    >;
    notifications: Array<GraphQLTypes['directus_notifications']>;
    notifications_by_id?: GraphQLTypes['directus_notifications'] | undefined;
    notifications_aggregated: Array<
      GraphQLTypes['directus_notifications_aggregated']
    >;
    shares: Array<GraphQLTypes['directus_shares']>;
    shares_by_id?: GraphQLTypes['directus_shares'] | undefined;
    shares_aggregated: Array<GraphQLTypes['directus_shares_aggregated']>;
    flows: Array<GraphQLTypes['directus_flows']>;
    flows_by_id?: GraphQLTypes['directus_flows'] | undefined;
    flows_aggregated: Array<GraphQLTypes['directus_flows_aggregated']>;
    operations: Array<GraphQLTypes['directus_operations']>;
    operations_by_id?: GraphQLTypes['directus_operations'] | undefined;
    operations_aggregated: Array<
      GraphQLTypes['directus_operations_aggregated']
    >;
    settings?: GraphQLTypes['directus_settings'] | undefined;
    users: Array<GraphQLTypes['directus_users']>;
    users_by_id?: GraphQLTypes['directus_users'] | undefined;
    users_aggregated: Array<GraphQLTypes['directus_users_aggregated']>;
  };
  ['extensions']: {
    __typename: 'extensions';
    interfaces?: Array<string | undefined> | undefined;
    displays?: Array<string | undefined> | undefined;
    layouts?: Array<string | undefined> | undefined;
    modules?: Array<string | undefined> | undefined;
  };
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  ['JSON']: 'scalar' & { name: 'JSON' };
  ['graphql_sdl_scope']: graphql_sdl_scope;
  ['server_info']: {
    __typename: 'server_info';
    project_name?: string | undefined;
    project_logo?: string | undefined;
    project_color?: string | undefined;
    project_foreground?: string | undefined;
    project_background?: string | undefined;
    project_note?: string | undefined;
    custom_css?: string | undefined;
    directus?: GraphQLTypes['server_info_directus'] | undefined;
    node?: GraphQLTypes['server_info_node'] | undefined;
    os?: GraphQLTypes['server_info_os'] | undefined;
  };
  ['server_info_directus']: {
    __typename: 'server_info_directus';
    version?: string | undefined;
  };
  ['server_info_node']: {
    __typename: 'server_info_node';
    version?: string | undefined;
    uptime?: number | undefined;
  };
  ['server_info_os']: {
    __typename: 'server_info_os';
    type?: string | undefined;
    version?: string | undefined;
    uptime?: number | undefined;
    totalmem?: number | undefined;
  };
  ['directus_collections']: {
    __typename: 'directus_collections';
    collection?: string | undefined;
    meta?: GraphQLTypes['directus_collections_meta'] | undefined;
    schema?: GraphQLTypes['directus_collections_schema'] | undefined;
  };
  ['directus_collections_meta']: {
    __typename: 'directus_collections_meta';
    collection: string;
    icon?: string | undefined;
    note?: string | undefined;
    display_template?: string | undefined;
    hidden: boolean;
    singleton: boolean;
    translations?: GraphQLTypes['JSON'] | undefined;
    archive_field?: string | undefined;
    archive_app_filter: boolean;
    archive_value?: string | undefined;
    unarchive_value?: string | undefined;
    sort_field?: string | undefined;
    accountability?: string | undefined;
    color?: string | undefined;
    item_duplication_fields?: GraphQLTypes['JSON'] | undefined;
    sort?: number | undefined;
    group?: string | undefined;
    collapse: string;
  };
  ['directus_collections_schema']: {
    __typename: 'directus_collections_schema';
    name?: string | undefined;
    comment?: string | undefined;
  };
  ['directus_fields']: {
    __typename: 'directus_fields';
    collection?: string | undefined;
    field?: string | undefined;
    type?: string | undefined;
    meta?: GraphQLTypes['directus_fields_meta'] | undefined;
    schema?: GraphQLTypes['directus_fields_schema'] | undefined;
  };
  ['directus_fields_meta']: {
    __typename: 'directus_fields_meta';
    id: number;
    collection: string;
    field: string;
    special?: Array<string | undefined> | undefined;
    interface?: string | undefined;
    options?: GraphQLTypes['JSON'] | undefined;
    display?: string | undefined;
    display_options?: GraphQLTypes['JSON'] | undefined;
    readonly: boolean;
    hidden: boolean;
    sort?: number | undefined;
    width?: string | undefined;
    translations?: GraphQLTypes['JSON'] | undefined;
    note?: string | undefined;
    conditions?: GraphQLTypes['JSON'] | undefined;
    required?: boolean | undefined;
    group?: string | undefined;
    validation?: GraphQLTypes['JSON'] | undefined;
    validation_message?: string | undefined;
  };
  ['directus_fields_schema']: {
    __typename: 'directus_fields_schema';
    name?: string | undefined;
    table?: string | undefined;
    data_type?: string | undefined;
    default_value?: string | undefined;
    max_length?: number | undefined;
    numeric_precision?: number | undefined;
    numeric_scale?: number | undefined;
    is_nullable?: boolean | undefined;
    is_unique?: boolean | undefined;
    is_primary_key?: boolean | undefined;
    has_auto_increment?: boolean | undefined;
    foreign_key_column?: string | undefined;
    foreign_key_table?: string | undefined;
    comment?: string | undefined;
  };
  ['directus_relations']: {
    __typename: 'directus_relations';
    collection?: string | undefined;
    field?: string | undefined;
    related_collection?: string | undefined;
    schema?: GraphQLTypes['directus_relations_schema'] | undefined;
    meta?: GraphQLTypes['directus_relations_meta'] | undefined;
  };
  ['directus_relations_schema']: {
    __typename: 'directus_relations_schema';
    table: string;
    column: string;
    foreign_key_table: string;
    foreign_key_column: string;
    constraint_name?: string | undefined;
    on_update: string;
    on_delete: string;
  };
  ['directus_relations_meta']: {
    __typename: 'directus_relations_meta';
    id?: number | undefined;
    many_collection?: string | undefined;
    many_field?: string | undefined;
    one_collection?: string | undefined;
    one_field?: string | undefined;
    one_collection_field?: string | undefined;
    one_allowed_collections?: Array<string | undefined> | undefined;
    junction_field?: string | undefined;
    sort_field?: string | undefined;
    one_deselect_action?: string | undefined;
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
  ['count_functions']: {
    __typename: 'count_functions';
    count?: number | undefined;
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
  /** BigInt value */
  ['GraphQLBigInt']: 'scalar' & { name: 'GraphQLBigInt' };
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
  ['directus_roles_aggregated']: {
    __typename: 'directus_roles_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_roles_aggregated_count'] | undefined;
    countDistinct?: GraphQLTypes['directus_roles_aggregated_count'] | undefined;
  };
  ['directus_roles_aggregated_count']: {
    __typename: 'directus_roles_aggregated_count';
    id?: number | undefined;
    name?: number | undefined;
    icon?: number | undefined;
    description?: number | undefined;
    ip_access?: number | undefined;
    enforce_tfa?: number | undefined;
    admin_access?: number | undefined;
    app_access?: number | undefined;
    users?: number | undefined;
  };
  ['directus_folders_aggregated']: {
    __typename: 'directus_folders_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_folders_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_folders_aggregated_count']
      | undefined;
  };
  ['directus_folders_aggregated_count']: {
    __typename: 'directus_folders_aggregated_count';
    id?: number | undefined;
    name?: number | undefined;
    parent?: number | undefined;
  };
  ['directus_activity']: {
    __typename: 'directus_activity';
    id: string;
    action: string;
    user?: GraphQLTypes['directus_users'] | undefined;
    timestamp?: GraphQLTypes['Date'] | undefined;
    timestamp_func?: GraphQLTypes['datetime_functions'] | undefined;
    ip?: string | undefined;
    user_agent?: string | undefined;
    collection: string;
    item: string;
    comment?: string | undefined;
    origin?: string | undefined;
    revisions?:
      | Array<GraphQLTypes['directus_revisions'] | undefined>
      | undefined;
    revisions_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['directus_revisions']: {
    __typename: 'directus_revisions';
    id: string;
    activity?: GraphQLTypes['directus_activity'] | undefined;
    collection: string;
    item: string;
    data?: GraphQLTypes['JSON'] | undefined;
    data_func?: GraphQLTypes['count_functions'] | undefined;
    delta?: GraphQLTypes['JSON'] | undefined;
    delta_func?: GraphQLTypes['count_functions'] | undefined;
    parent?: GraphQLTypes['directus_revisions'] | undefined;
  };
  ['directus_activity_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    action?: GraphQLTypes['string_filter_operators'] | undefined;
    user?: GraphQLTypes['directus_users_filter'] | undefined;
    timestamp?: GraphQLTypes['date_filter_operators'] | undefined;
    timestamp_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    ip?: GraphQLTypes['string_filter_operators'] | undefined;
    user_agent?: GraphQLTypes['string_filter_operators'] | undefined;
    collection?: GraphQLTypes['string_filter_operators'] | undefined;
    item?: GraphQLTypes['string_filter_operators'] | undefined;
    comment?: GraphQLTypes['string_filter_operators'] | undefined;
    origin?: GraphQLTypes['string_filter_operators'] | undefined;
    revisions?: GraphQLTypes['directus_revisions_filter'] | undefined;
    revisions_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    _and?:
      | Array<GraphQLTypes['directus_activity_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['directus_activity_filter'] | undefined>
      | undefined;
  };
  ['directus_revisions_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    activity?: GraphQLTypes['directus_activity_filter'] | undefined;
    collection?: GraphQLTypes['string_filter_operators'] | undefined;
    item?: GraphQLTypes['string_filter_operators'] | undefined;
    data?: GraphQLTypes['string_filter_operators'] | undefined;
    data_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    delta?: GraphQLTypes['string_filter_operators'] | undefined;
    delta_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    parent?: GraphQLTypes['directus_revisions_filter'] | undefined;
    _and?:
      | Array<GraphQLTypes['directus_revisions_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['directus_revisions_filter'] | undefined>
      | undefined;
  };
  ['directus_activity_aggregated']: {
    __typename: 'directus_activity_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_activity_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_activity_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['directus_activity_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_activity_aggregated_fields'] | undefined;
    avgDistinct?:
      | GraphQLTypes['directus_activity_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['directus_activity_aggregated_fields']
      | undefined;
    min?: GraphQLTypes['directus_activity_aggregated_fields'] | undefined;
    max?: GraphQLTypes['directus_activity_aggregated_fields'] | undefined;
  };
  ['directus_activity_aggregated_count']: {
    __typename: 'directus_activity_aggregated_count';
    id?: number | undefined;
    action?: number | undefined;
    user?: number | undefined;
    timestamp?: number | undefined;
    ip?: number | undefined;
    user_agent?: number | undefined;
    collection?: number | undefined;
    item?: number | undefined;
    comment?: number | undefined;
    origin?: number | undefined;
    revisions?: number | undefined;
  };
  ['directus_activity_aggregated_fields']: {
    __typename: 'directus_activity_aggregated_fields';
    id?: number | undefined;
  };
  ['directus_permissions']: {
    __typename: 'directus_permissions';
    id: string;
    role?: GraphQLTypes['directus_roles'] | undefined;
    collection: string;
    action: string;
    permissions?: GraphQLTypes['JSON'] | undefined;
    permissions_func?: GraphQLTypes['count_functions'] | undefined;
    validation?: GraphQLTypes['JSON'] | undefined;
    validation_func?: GraphQLTypes['count_functions'] | undefined;
    presets?: GraphQLTypes['JSON'] | undefined;
    presets_func?: GraphQLTypes['count_functions'] | undefined;
    fields?: Array<string | undefined> | undefined;
  };
  ['directus_permissions_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    role?: GraphQLTypes['directus_roles_filter'] | undefined;
    collection?: GraphQLTypes['string_filter_operators'] | undefined;
    action?: GraphQLTypes['string_filter_operators'] | undefined;
    permissions?: GraphQLTypes['string_filter_operators'] | undefined;
    permissions_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    validation?: GraphQLTypes['string_filter_operators'] | undefined;
    validation_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    presets?: GraphQLTypes['string_filter_operators'] | undefined;
    presets_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    fields?: GraphQLTypes['string_filter_operators'] | undefined;
    _and?:
      | Array<GraphQLTypes['directus_permissions_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['directus_permissions_filter'] | undefined>
      | undefined;
  };
  ['directus_permissions_aggregated']: {
    __typename: 'directus_permissions_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_permissions_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_permissions_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['directus_permissions_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_permissions_aggregated_fields'] | undefined;
    avgDistinct?:
      | GraphQLTypes['directus_permissions_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['directus_permissions_aggregated_fields']
      | undefined;
    min?: GraphQLTypes['directus_permissions_aggregated_fields'] | undefined;
    max?: GraphQLTypes['directus_permissions_aggregated_fields'] | undefined;
  };
  ['directus_permissions_aggregated_count']: {
    __typename: 'directus_permissions_aggregated_count';
    id?: number | undefined;
    role?: number | undefined;
    collection?: number | undefined;
    action?: number | undefined;
    permissions?: number | undefined;
    validation?: number | undefined;
    presets?: number | undefined;
    fields?: number | undefined;
  };
  ['directus_permissions_aggregated_fields']: {
    __typename: 'directus_permissions_aggregated_fields';
    id?: number | undefined;
  };
  ['directus_files_aggregated']: {
    __typename: 'directus_files_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_files_aggregated_count'] | undefined;
    countDistinct?: GraphQLTypes['directus_files_aggregated_count'] | undefined;
    avg?: GraphQLTypes['directus_files_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_files_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['directus_files_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['directus_files_aggregated_fields'] | undefined;
    min?: GraphQLTypes['directus_files_aggregated_fields'] | undefined;
    max?: GraphQLTypes['directus_files_aggregated_fields'] | undefined;
  };
  ['directus_files_aggregated_count']: {
    __typename: 'directus_files_aggregated_count';
    id?: number | undefined;
    storage?: number | undefined;
    filename_disk?: number | undefined;
    filename_download?: number | undefined;
    title?: number | undefined;
    type?: number | undefined;
    folder?: number | undefined;
    uploaded_by?: number | undefined;
    uploaded_on?: number | undefined;
    modified_by?: number | undefined;
    modified_on?: number | undefined;
    charset?: number | undefined;
    filesize?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    duration?: number | undefined;
    embed?: number | undefined;
    description?: number | undefined;
    location?: number | undefined;
    tags?: number | undefined;
    metadata?: number | undefined;
  };
  ['directus_files_aggregated_fields']: {
    __typename: 'directus_files_aggregated_fields';
    filesize?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    duration?: number | undefined;
  };
  ['directus_revisions_aggregated']: {
    __typename: 'directus_revisions_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_revisions_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_revisions_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['directus_revisions_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_revisions_aggregated_fields'] | undefined;
    avgDistinct?:
      | GraphQLTypes['directus_revisions_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['directus_revisions_aggregated_fields']
      | undefined;
    min?: GraphQLTypes['directus_revisions_aggregated_fields'] | undefined;
    max?: GraphQLTypes['directus_revisions_aggregated_fields'] | undefined;
  };
  ['directus_revisions_aggregated_count']: {
    __typename: 'directus_revisions_aggregated_count';
    id?: number | undefined;
    activity?: number | undefined;
    collection?: number | undefined;
    item?: number | undefined;
    data?: number | undefined;
    delta?: number | undefined;
    parent?: number | undefined;
  };
  ['directus_revisions_aggregated_fields']: {
    __typename: 'directus_revisions_aggregated_fields';
    id?: number | undefined;
    activity?: number | undefined;
    parent?: number | undefined;
  };
  ['directus_presets']: {
    __typename: 'directus_presets';
    id: string;
    bookmark?: string | undefined;
    user?: GraphQLTypes['directus_users'] | undefined;
    role?: GraphQLTypes['directus_roles'] | undefined;
    collection?: string | undefined;
    search?: string | undefined;
    layout?: string | undefined;
    layout_query?: GraphQLTypes['JSON'] | undefined;
    layout_query_func?: GraphQLTypes['count_functions'] | undefined;
    layout_options?: GraphQLTypes['JSON'] | undefined;
    layout_options_func?: GraphQLTypes['count_functions'] | undefined;
    refresh_interval?: number | undefined;
    filter?: GraphQLTypes['JSON'] | undefined;
    filter_func?: GraphQLTypes['count_functions'] | undefined;
    icon?: string | undefined;
    color?: string | undefined;
  };
  ['directus_presets_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    bookmark?: GraphQLTypes['string_filter_operators'] | undefined;
    user?: GraphQLTypes['directus_users_filter'] | undefined;
    role?: GraphQLTypes['directus_roles_filter'] | undefined;
    collection?: GraphQLTypes['string_filter_operators'] | undefined;
    search?: GraphQLTypes['string_filter_operators'] | undefined;
    layout?: GraphQLTypes['string_filter_operators'] | undefined;
    layout_query?: GraphQLTypes['string_filter_operators'] | undefined;
    layout_query_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    layout_options?: GraphQLTypes['string_filter_operators'] | undefined;
    layout_options_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    refresh_interval?: GraphQLTypes['number_filter_operators'] | undefined;
    filter?: GraphQLTypes['string_filter_operators'] | undefined;
    filter_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    icon?: GraphQLTypes['string_filter_operators'] | undefined;
    color?: GraphQLTypes['string_filter_operators'] | undefined;
    _and?:
      | Array<GraphQLTypes['directus_presets_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['directus_presets_filter'] | undefined>
      | undefined;
  };
  ['directus_presets_aggregated']: {
    __typename: 'directus_presets_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_presets_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_presets_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['directus_presets_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_presets_aggregated_fields'] | undefined;
    avgDistinct?:
      | GraphQLTypes['directus_presets_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['directus_presets_aggregated_fields']
      | undefined;
    min?: GraphQLTypes['directus_presets_aggregated_fields'] | undefined;
    max?: GraphQLTypes['directus_presets_aggregated_fields'] | undefined;
  };
  ['directus_presets_aggregated_count']: {
    __typename: 'directus_presets_aggregated_count';
    id?: number | undefined;
    bookmark?: number | undefined;
    user?: number | undefined;
    role?: number | undefined;
    collection?: number | undefined;
    search?: number | undefined;
    layout?: number | undefined;
    layout_query?: number | undefined;
    layout_options?: number | undefined;
    refresh_interval?: number | undefined;
    filter?: number | undefined;
    icon?: number | undefined;
    color?: number | undefined;
  };
  ['directus_presets_aggregated_fields']: {
    __typename: 'directus_presets_aggregated_fields';
    id?: number | undefined;
    refresh_interval?: number | undefined;
  };
  ['directus_panels']: {
    __typename: 'directus_panels';
    id: string;
    dashboard?: GraphQLTypes['directus_dashboards'] | undefined;
    name?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    show_header: boolean;
    note?: string | undefined;
    type: string;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    options?: GraphQLTypes['JSON'] | undefined;
    options_func?: GraphQLTypes['count_functions'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functions'] | undefined;
    user_created?: GraphQLTypes['directus_users'] | undefined;
  };
  ['directus_dashboards']: {
    __typename: 'directus_dashboards';
    id: string;
    name: string;
    icon?: string | undefined;
    note?: string | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functions'] | undefined;
    user_created?: GraphQLTypes['directus_users'] | undefined;
    color?: string | undefined;
    panels?: Array<GraphQLTypes['directus_panels'] | undefined> | undefined;
    panels_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['directus_panels_filter']: {
    id?: GraphQLTypes['string_filter_operators'] | undefined;
    dashboard?: GraphQLTypes['directus_dashboards_filter'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    icon?: GraphQLTypes['string_filter_operators'] | undefined;
    color?: GraphQLTypes['string_filter_operators'] | undefined;
    show_header?: GraphQLTypes['boolean_filter_operators'] | undefined;
    note?: GraphQLTypes['string_filter_operators'] | undefined;
    type?: GraphQLTypes['string_filter_operators'] | undefined;
    position_x?: GraphQLTypes['number_filter_operators'] | undefined;
    position_y?: GraphQLTypes['number_filter_operators'] | undefined;
    width?: GraphQLTypes['number_filter_operators'] | undefined;
    height?: GraphQLTypes['number_filter_operators'] | undefined;
    options?: GraphQLTypes['string_filter_operators'] | undefined;
    options_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    date_created?: GraphQLTypes['date_filter_operators'] | undefined;
    date_created_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    user_created?: GraphQLTypes['directus_users_filter'] | undefined;
    _and?:
      | Array<GraphQLTypes['directus_panels_filter'] | undefined>
      | undefined;
    _or?: Array<GraphQLTypes['directus_panels_filter'] | undefined> | undefined;
  };
  ['directus_dashboards_filter']: {
    id?: GraphQLTypes['string_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    icon?: GraphQLTypes['string_filter_operators'] | undefined;
    note?: GraphQLTypes['string_filter_operators'] | undefined;
    date_created?: GraphQLTypes['date_filter_operators'] | undefined;
    date_created_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    user_created?: GraphQLTypes['directus_users_filter'] | undefined;
    color?: GraphQLTypes['string_filter_operators'] | undefined;
    panels?: GraphQLTypes['directus_panels_filter'] | undefined;
    panels_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    _and?:
      | Array<GraphQLTypes['directus_dashboards_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['directus_dashboards_filter'] | undefined>
      | undefined;
  };
  ['directus_panels_aggregated']: {
    __typename: 'directus_panels_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_panels_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_panels_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['directus_panels_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_panels_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['directus_panels_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['directus_panels_aggregated_fields'] | undefined;
    min?: GraphQLTypes['directus_panels_aggregated_fields'] | undefined;
    max?: GraphQLTypes['directus_panels_aggregated_fields'] | undefined;
  };
  ['directus_panels_aggregated_count']: {
    __typename: 'directus_panels_aggregated_count';
    id?: number | undefined;
    dashboard?: number | undefined;
    name?: number | undefined;
    icon?: number | undefined;
    color?: number | undefined;
    show_header?: number | undefined;
    note?: number | undefined;
    type?: number | undefined;
    position_x?: number | undefined;
    position_y?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    options?: number | undefined;
    date_created?: number | undefined;
    user_created?: number | undefined;
  };
  ['directus_panels_aggregated_fields']: {
    __typename: 'directus_panels_aggregated_fields';
    position_x?: number | undefined;
    position_y?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
  };
  ['directus_webhooks']: {
    __typename: 'directus_webhooks';
    id: string;
    name: string;
    method?: string | undefined;
    url: string;
    status?: string | undefined;
    data?: boolean | undefined;
    actions: Array<string | undefined>;
    collections: Array<string | undefined>;
    headers?: GraphQLTypes['JSON'] | undefined;
    headers_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['directus_webhooks_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    method?: GraphQLTypes['string_filter_operators'] | undefined;
    url?: GraphQLTypes['string_filter_operators'] | undefined;
    status?: GraphQLTypes['string_filter_operators'] | undefined;
    data?: GraphQLTypes['boolean_filter_operators'] | undefined;
    actions?: GraphQLTypes['string_filter_operators'] | undefined;
    collections?: GraphQLTypes['string_filter_operators'] | undefined;
    headers?: GraphQLTypes['string_filter_operators'] | undefined;
    headers_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    _and?:
      | Array<GraphQLTypes['directus_webhooks_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['directus_webhooks_filter'] | undefined>
      | undefined;
  };
  ['directus_webhooks_aggregated']: {
    __typename: 'directus_webhooks_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_webhooks_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_webhooks_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['directus_webhooks_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_webhooks_aggregated_fields'] | undefined;
    avgDistinct?:
      | GraphQLTypes['directus_webhooks_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['directus_webhooks_aggregated_fields']
      | undefined;
    min?: GraphQLTypes['directus_webhooks_aggregated_fields'] | undefined;
    max?: GraphQLTypes['directus_webhooks_aggregated_fields'] | undefined;
  };
  ['directus_webhooks_aggregated_count']: {
    __typename: 'directus_webhooks_aggregated_count';
    id?: number | undefined;
    name?: number | undefined;
    method?: number | undefined;
    url?: number | undefined;
    status?: number | undefined;
    data?: number | undefined;
    actions?: number | undefined;
    collections?: number | undefined;
    headers?: number | undefined;
  };
  ['directus_webhooks_aggregated_fields']: {
    __typename: 'directus_webhooks_aggregated_fields';
    id?: number | undefined;
  };
  ['directus_dashboards_aggregated']: {
    __typename: 'directus_dashboards_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_dashboards_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_dashboards_aggregated_count']
      | undefined;
  };
  ['directus_dashboards_aggregated_count']: {
    __typename: 'directus_dashboards_aggregated_count';
    id?: number | undefined;
    name?: number | undefined;
    icon?: number | undefined;
    note?: number | undefined;
    date_created?: number | undefined;
    user_created?: number | undefined;
    color?: number | undefined;
    panels?: number | undefined;
  };
  ['directus_notifications']: {
    __typename: 'directus_notifications';
    id: string;
    timestamp?: GraphQLTypes['Date'] | undefined;
    timestamp_func?: GraphQLTypes['datetime_functions'] | undefined;
    status?: string | undefined;
    recipient?: GraphQLTypes['directus_users'] | undefined;
    sender?: GraphQLTypes['directus_users'] | undefined;
    subject: string;
    message?: string | undefined;
    collection?: string | undefined;
    item?: string | undefined;
  };
  ['directus_notifications_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    timestamp?: GraphQLTypes['date_filter_operators'] | undefined;
    timestamp_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    status?: GraphQLTypes['string_filter_operators'] | undefined;
    recipient?: GraphQLTypes['directus_users_filter'] | undefined;
    sender?: GraphQLTypes['directus_users_filter'] | undefined;
    subject?: GraphQLTypes['string_filter_operators'] | undefined;
    message?: GraphQLTypes['string_filter_operators'] | undefined;
    collection?: GraphQLTypes['string_filter_operators'] | undefined;
    item?: GraphQLTypes['string_filter_operators'] | undefined;
    _and?:
      | Array<GraphQLTypes['directus_notifications_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['directus_notifications_filter'] | undefined>
      | undefined;
  };
  ['directus_notifications_aggregated']: {
    __typename: 'directus_notifications_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_notifications_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_notifications_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['directus_notifications_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_notifications_aggregated_fields'] | undefined;
    avgDistinct?:
      | GraphQLTypes['directus_notifications_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['directus_notifications_aggregated_fields']
      | undefined;
    min?: GraphQLTypes['directus_notifications_aggregated_fields'] | undefined;
    max?: GraphQLTypes['directus_notifications_aggregated_fields'] | undefined;
  };
  ['directus_notifications_aggregated_count']: {
    __typename: 'directus_notifications_aggregated_count';
    id?: number | undefined;
    timestamp?: number | undefined;
    status?: number | undefined;
    recipient?: number | undefined;
    sender?: number | undefined;
    subject?: number | undefined;
    message?: number | undefined;
    collection?: number | undefined;
    item?: number | undefined;
  };
  ['directus_notifications_aggregated_fields']: {
    __typename: 'directus_notifications_aggregated_fields';
    id?: number | undefined;
  };
  ['directus_shares']: {
    __typename: 'directus_shares';
    id: string;
    name?: string | undefined;
    collection?: string | undefined;
    item?: string | undefined;
    role?: GraphQLTypes['directus_roles'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    password?: GraphQLTypes['Hash'] | undefined;
    user_created?: GraphQLTypes['directus_users'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functions'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: GraphQLTypes['Date'] | undefined;
    date_start_func?: GraphQLTypes['datetime_functions'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: GraphQLTypes['Date'] | undefined;
    date_end_func?: GraphQLTypes['datetime_functions'] | undefined;
    times_used?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: number | undefined;
  };
  ['directus_shares_filter']: {
    id?: GraphQLTypes['string_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    collection?: GraphQLTypes['string_filter_operators'] | undefined;
    item?: GraphQLTypes['string_filter_operators'] | undefined;
    role?: GraphQLTypes['directus_roles_filter'] | undefined;
    password?: GraphQLTypes['hash_filter_operators'] | undefined;
    user_created?: GraphQLTypes['directus_users_filter'] | undefined;
    date_created?: GraphQLTypes['date_filter_operators'] | undefined;
    date_created_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    date_start?: GraphQLTypes['date_filter_operators'] | undefined;
    date_start_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    date_end?: GraphQLTypes['date_filter_operators'] | undefined;
    date_end_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    times_used?: GraphQLTypes['number_filter_operators'] | undefined;
    max_uses?: GraphQLTypes['number_filter_operators'] | undefined;
    _and?:
      | Array<GraphQLTypes['directus_shares_filter'] | undefined>
      | undefined;
    _or?: Array<GraphQLTypes['directus_shares_filter'] | undefined> | undefined;
  };
  ['directus_shares_aggregated']: {
    __typename: 'directus_shares_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_shares_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_shares_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['directus_shares_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_shares_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['directus_shares_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['directus_shares_aggregated_fields'] | undefined;
    min?: GraphQLTypes['directus_shares_aggregated_fields'] | undefined;
    max?: GraphQLTypes['directus_shares_aggregated_fields'] | undefined;
  };
  ['directus_shares_aggregated_count']: {
    __typename: 'directus_shares_aggregated_count';
    id?: number | undefined;
    name?: number | undefined;
    collection?: number | undefined;
    item?: number | undefined;
    role?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    password?: number | undefined;
    user_created?: number | undefined;
    date_created?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: number | undefined;
    times_used?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: number | undefined;
  };
  ['directus_shares_aggregated_fields']: {
    __typename: 'directus_shares_aggregated_fields';
    times_used?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: number | undefined;
  };
  ['directus_flows']: {
    __typename: 'directus_flows';
    id: string;
    name: string;
    icon?: string | undefined;
    color?: string | undefined;
    description?: string | undefined;
    status?: string | undefined;
    trigger?: string | undefined;
    accountability?: string | undefined;
    options?: GraphQLTypes['JSON'] | undefined;
    options_func?: GraphQLTypes['count_functions'] | undefined;
    operation?: GraphQLTypes['directus_operations'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functions'] | undefined;
    user_created?: GraphQLTypes['directus_users'] | undefined;
    operations?:
      | Array<GraphQLTypes['directus_operations'] | undefined>
      | undefined;
    operations_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['directus_operations']: {
    __typename: 'directus_operations';
    id: string;
    name?: string | undefined;
    key: string;
    type: string;
    position_x: number;
    position_y: number;
    options?: GraphQLTypes['JSON'] | undefined;
    options_func?: GraphQLTypes['count_functions'] | undefined;
    resolve?: GraphQLTypes['directus_operations'] | undefined;
    reject?: GraphQLTypes['directus_operations'] | undefined;
    flow?: GraphQLTypes['directus_flows'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functions'] | undefined;
    user_created?: GraphQLTypes['directus_users'] | undefined;
  };
  ['directus_operations_filter']: {
    id?: GraphQLTypes['string_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    key?: GraphQLTypes['string_filter_operators'] | undefined;
    type?: GraphQLTypes['string_filter_operators'] | undefined;
    position_x?: GraphQLTypes['number_filter_operators'] | undefined;
    position_y?: GraphQLTypes['number_filter_operators'] | undefined;
    options?: GraphQLTypes['string_filter_operators'] | undefined;
    options_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    resolve?: GraphQLTypes['directus_operations_filter'] | undefined;
    reject?: GraphQLTypes['directus_operations_filter'] | undefined;
    flow?: GraphQLTypes['directus_flows_filter'] | undefined;
    date_created?: GraphQLTypes['date_filter_operators'] | undefined;
    date_created_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    user_created?: GraphQLTypes['directus_users_filter'] | undefined;
    _and?:
      | Array<GraphQLTypes['directus_operations_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['directus_operations_filter'] | undefined>
      | undefined;
  };
  ['directus_flows_filter']: {
    id?: GraphQLTypes['string_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    icon?: GraphQLTypes['string_filter_operators'] | undefined;
    color?: GraphQLTypes['string_filter_operators'] | undefined;
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    status?: GraphQLTypes['string_filter_operators'] | undefined;
    trigger?: GraphQLTypes['string_filter_operators'] | undefined;
    accountability?: GraphQLTypes['string_filter_operators'] | undefined;
    options?: GraphQLTypes['string_filter_operators'] | undefined;
    options_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    operation?: GraphQLTypes['directus_operations_filter'] | undefined;
    date_created?: GraphQLTypes['date_filter_operators'] | undefined;
    date_created_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    user_created?: GraphQLTypes['directus_users_filter'] | undefined;
    operations?: GraphQLTypes['directus_operations_filter'] | undefined;
    operations_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    _and?: Array<GraphQLTypes['directus_flows_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['directus_flows_filter'] | undefined> | undefined;
  };
  ['directus_flows_aggregated']: {
    __typename: 'directus_flows_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_flows_aggregated_count'] | undefined;
    countDistinct?: GraphQLTypes['directus_flows_aggregated_count'] | undefined;
  };
  ['directus_flows_aggregated_count']: {
    __typename: 'directus_flows_aggregated_count';
    id?: number | undefined;
    name?: number | undefined;
    icon?: number | undefined;
    color?: number | undefined;
    description?: number | undefined;
    status?: number | undefined;
    trigger?: number | undefined;
    accountability?: number | undefined;
    options?: number | undefined;
    operation?: number | undefined;
    date_created?: number | undefined;
    user_created?: number | undefined;
    operations?: number | undefined;
  };
  ['directus_operations_aggregated']: {
    __typename: 'directus_operations_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_operations_aggregated_count'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_operations_aggregated_count']
      | undefined;
    avg?: GraphQLTypes['directus_operations_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_operations_aggregated_fields'] | undefined;
    avgDistinct?:
      | GraphQLTypes['directus_operations_aggregated_fields']
      | undefined;
    sumDistinct?:
      | GraphQLTypes['directus_operations_aggregated_fields']
      | undefined;
    min?: GraphQLTypes['directus_operations_aggregated_fields'] | undefined;
    max?: GraphQLTypes['directus_operations_aggregated_fields'] | undefined;
  };
  ['directus_operations_aggregated_count']: {
    __typename: 'directus_operations_aggregated_count';
    id?: number | undefined;
    name?: number | undefined;
    key?: number | undefined;
    type?: number | undefined;
    position_x?: number | undefined;
    position_y?: number | undefined;
    options?: number | undefined;
    resolve?: number | undefined;
    reject?: number | undefined;
    flow?: number | undefined;
    date_created?: number | undefined;
    user_created?: number | undefined;
  };
  ['directus_operations_aggregated_fields']: {
    __typename: 'directus_operations_aggregated_fields';
    position_x?: number | undefined;
    position_y?: number | undefined;
  };
  ['directus_settings']: {
    __typename: 'directus_settings';
    id: string;
    project_name?: string | undefined;
    project_url?: string | undefined;
    /** $t:field_options.directus_settings.project_color_note */
    project_color?: string | undefined;
    project_logo?: GraphQLTypes['directus_files'] | undefined;
    public_foreground?: GraphQLTypes['directus_files'] | undefined;
    public_background?: GraphQLTypes['directus_files'] | undefined;
    public_note?: string | undefined;
    auth_login_attempts?: number | undefined;
    auth_password_policy?: string | undefined;
    storage_asset_transform?: string | undefined;
    storage_asset_presets?: GraphQLTypes['JSON'] | undefined;
    storage_asset_presets_func?: GraphQLTypes['count_functions'] | undefined;
    custom_css?: string | undefined;
    storage_default_folder?: GraphQLTypes['directus_folders'] | undefined;
    basemaps?: GraphQLTypes['JSON'] | undefined;
    basemaps_func?: GraphQLTypes['count_functions'] | undefined;
    mapbox_key?: string | undefined;
    module_bar?: GraphQLTypes['JSON'] | undefined;
    module_bar_func?: GraphQLTypes['count_functions'] | undefined;
    project_descriptor?: string | undefined;
    translation_strings?: GraphQLTypes['JSON'] | undefined;
    translation_strings_func?: GraphQLTypes['count_functions'] | undefined;
    default_language?: string | undefined;
    custom_aspect_ratios?: GraphQLTypes['JSON'] | undefined;
    custom_aspect_ratios_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['directus_users_aggregated']: {
    __typename: 'directus_users_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_users_aggregated_count'] | undefined;
    countDistinct?: GraphQLTypes['directus_users_aggregated_count'] | undefined;
  };
  ['directus_users_aggregated_count']: {
    __typename: 'directus_users_aggregated_count';
    id?: number | undefined;
    first_name?: number | undefined;
    last_name?: number | undefined;
    email?: number | undefined;
    password?: number | undefined;
    location?: number | undefined;
    title?: number | undefined;
    description?: number | undefined;
    tags?: number | undefined;
    avatar?: number | undefined;
    language?: number | undefined;
    theme?: number | undefined;
    tfa_secret?: number | undefined;
    status?: number | undefined;
    role?: number | undefined;
    token?: number | undefined;
    last_access?: number | undefined;
    last_page?: number | undefined;
    provider?: number | undefined;
    external_identifier?: number | undefined;
    auth_data?: number | undefined;
    email_notifications?: number | undefined;
    discord_handle?: number | undefined;
    discord_id?: number | undefined;
    timezone?: number | undefined;
    twitter_handle?: number | undefined;
    collaborators?: number | undefined;
    skills?: number | undefined;
  };
  ['Mutation']: {
    __typename: 'Mutation';
    auth_login?: GraphQLTypes['auth_tokens'] | undefined;
    auth_refresh?: GraphQLTypes['auth_tokens'] | undefined;
    auth_logout?: boolean | undefined;
    auth_password_request?: boolean | undefined;
    auth_password_reset?: boolean | undefined;
    users_me_tfa_generate?:
      | GraphQLTypes['users_me_tfa_generate_data']
      | undefined;
    users_me_tfa_enable?: boolean | undefined;
    users_me_tfa_disable?: boolean | undefined;
    utils_hash_generate?: string | undefined;
    utils_hash_verify?: boolean | undefined;
    utils_sort?: boolean | undefined;
    utils_revert?: boolean | undefined;
    utils_cache_clear?: GraphQLTypes['Void'] | undefined;
    users_invite_accept?: boolean | undefined;
    create_collections_item?: GraphQLTypes['directus_collections'] | undefined;
    update_collections_item?: GraphQLTypes['directus_collections'] | undefined;
    delete_collections_item?: GraphQLTypes['delete_collection'] | undefined;
    create_fields_item?: GraphQLTypes['directus_fields'] | undefined;
    update_fields_item?: GraphQLTypes['directus_fields'] | undefined;
    delete_fields_item?: GraphQLTypes['delete_field'] | undefined;
    create_relations_item?: GraphQLTypes['directus_relations'] | undefined;
    update_relations_item?: GraphQLTypes['directus_relations'] | undefined;
    delete_relations_item?: GraphQLTypes['delete_relation'] | undefined;
    update_users_me?: GraphQLTypes['directus_users'] | undefined;
    create_comment?: GraphQLTypes['directus_activity'] | undefined;
    update_comment?: GraphQLTypes['directus_activity'] | undefined;
    delete_comment?: GraphQLTypes['delete_one'] | undefined;
    import_file?: GraphQLTypes['directus_files'] | undefined;
    users_invite?: boolean | undefined;
    create_roles_items: Array<GraphQLTypes['directus_roles']>;
    create_roles_item?: GraphQLTypes['directus_roles'] | undefined;
    create_folders_items: Array<GraphQLTypes['directus_folders']>;
    create_folders_item?: GraphQLTypes['directus_folders'] | undefined;
    create_permissions_items: Array<GraphQLTypes['directus_permissions']>;
    create_permissions_item?: GraphQLTypes['directus_permissions'] | undefined;
    create_files_items: Array<GraphQLTypes['directus_files']>;
    create_files_item?: GraphQLTypes['directus_files'] | undefined;
    create_presets_items: Array<GraphQLTypes['directus_presets']>;
    create_presets_item?: GraphQLTypes['directus_presets'] | undefined;
    create_panels_items: Array<GraphQLTypes['directus_panels']>;
    create_panels_item?: GraphQLTypes['directus_panels'] | undefined;
    create_webhooks_items: Array<GraphQLTypes['directus_webhooks']>;
    create_webhooks_item?: GraphQLTypes['directus_webhooks'] | undefined;
    create_dashboards_items: Array<GraphQLTypes['directus_dashboards']>;
    create_dashboards_item?: GraphQLTypes['directus_dashboards'] | undefined;
    create_notifications_items: Array<GraphQLTypes['directus_notifications']>;
    create_notifications_item?:
      | GraphQLTypes['directus_notifications']
      | undefined;
    create_shares_items: Array<GraphQLTypes['directus_shares']>;
    create_shares_item?: GraphQLTypes['directus_shares'] | undefined;
    create_flows_items: Array<GraphQLTypes['directus_flows']>;
    create_flows_item?: GraphQLTypes['directus_flows'] | undefined;
    create_operations_items: Array<GraphQLTypes['directus_operations']>;
    create_operations_item?: GraphQLTypes['directus_operations'] | undefined;
    create_users_items: Array<GraphQLTypes['directus_users']>;
    create_users_item?: GraphQLTypes['directus_users'] | undefined;
    update_roles_items: Array<GraphQLTypes['directus_roles']>;
    update_roles_batch: Array<GraphQLTypes['directus_roles']>;
    update_roles_item?: GraphQLTypes['directus_roles'] | undefined;
    update_folders_items: Array<GraphQLTypes['directus_folders']>;
    update_folders_batch: Array<GraphQLTypes['directus_folders']>;
    update_folders_item?: GraphQLTypes['directus_folders'] | undefined;
    update_permissions_items: Array<GraphQLTypes['directus_permissions']>;
    update_permissions_batch: Array<GraphQLTypes['directus_permissions']>;
    update_permissions_item?: GraphQLTypes['directus_permissions'] | undefined;
    update_files_items: Array<GraphQLTypes['directus_files']>;
    update_files_batch: Array<GraphQLTypes['directus_files']>;
    update_files_item?: GraphQLTypes['directus_files'] | undefined;
    update_presets_items: Array<GraphQLTypes['directus_presets']>;
    update_presets_batch: Array<GraphQLTypes['directus_presets']>;
    update_presets_item?: GraphQLTypes['directus_presets'] | undefined;
    update_panels_items: Array<GraphQLTypes['directus_panels']>;
    update_panels_batch: Array<GraphQLTypes['directus_panels']>;
    update_panels_item?: GraphQLTypes['directus_panels'] | undefined;
    update_webhooks_items: Array<GraphQLTypes['directus_webhooks']>;
    update_webhooks_batch: Array<GraphQLTypes['directus_webhooks']>;
    update_webhooks_item?: GraphQLTypes['directus_webhooks'] | undefined;
    update_dashboards_items: Array<GraphQLTypes['directus_dashboards']>;
    update_dashboards_batch: Array<GraphQLTypes['directus_dashboards']>;
    update_dashboards_item?: GraphQLTypes['directus_dashboards'] | undefined;
    update_notifications_items: Array<GraphQLTypes['directus_notifications']>;
    update_notifications_batch: Array<GraphQLTypes['directus_notifications']>;
    update_notifications_item?:
      | GraphQLTypes['directus_notifications']
      | undefined;
    update_shares_items: Array<GraphQLTypes['directus_shares']>;
    update_shares_batch: Array<GraphQLTypes['directus_shares']>;
    update_shares_item?: GraphQLTypes['directus_shares'] | undefined;
    update_flows_items: Array<GraphQLTypes['directus_flows']>;
    update_flows_batch: Array<GraphQLTypes['directus_flows']>;
    update_flows_item?: GraphQLTypes['directus_flows'] | undefined;
    update_operations_items: Array<GraphQLTypes['directus_operations']>;
    update_operations_batch: Array<GraphQLTypes['directus_operations']>;
    update_operations_item?: GraphQLTypes['directus_operations'] | undefined;
    update_settings?: GraphQLTypes['directus_settings'] | undefined;
    update_users_items: Array<GraphQLTypes['directus_users']>;
    update_users_batch: Array<GraphQLTypes['directus_users']>;
    update_users_item?: GraphQLTypes['directus_users'] | undefined;
    delete_roles_items?: GraphQLTypes['delete_many'] | undefined;
    delete_roles_item?: GraphQLTypes['delete_one'] | undefined;
    delete_folders_items?: GraphQLTypes['delete_many'] | undefined;
    delete_folders_item?: GraphQLTypes['delete_one'] | undefined;
    delete_permissions_items?: GraphQLTypes['delete_many'] | undefined;
    delete_permissions_item?: GraphQLTypes['delete_one'] | undefined;
    delete_files_items?: GraphQLTypes['delete_many'] | undefined;
    delete_files_item?: GraphQLTypes['delete_one'] | undefined;
    delete_presets_items?: GraphQLTypes['delete_many'] | undefined;
    delete_presets_item?: GraphQLTypes['delete_one'] | undefined;
    delete_panels_items?: GraphQLTypes['delete_many'] | undefined;
    delete_panels_item?: GraphQLTypes['delete_one'] | undefined;
    delete_webhooks_items?: GraphQLTypes['delete_many'] | undefined;
    delete_webhooks_item?: GraphQLTypes['delete_one'] | undefined;
    delete_dashboards_items?: GraphQLTypes['delete_many'] | undefined;
    delete_dashboards_item?: GraphQLTypes['delete_one'] | undefined;
    delete_notifications_items?: GraphQLTypes['delete_many'] | undefined;
    delete_notifications_item?: GraphQLTypes['delete_one'] | undefined;
    delete_shares_items?: GraphQLTypes['delete_many'] | undefined;
    delete_shares_item?: GraphQLTypes['delete_one'] | undefined;
    delete_flows_items?: GraphQLTypes['delete_many'] | undefined;
    delete_flows_item?: GraphQLTypes['delete_one'] | undefined;
    delete_operations_items?: GraphQLTypes['delete_many'] | undefined;
    delete_operations_item?: GraphQLTypes['delete_one'] | undefined;
    delete_users_items?: GraphQLTypes['delete_many'] | undefined;
    delete_users_item?: GraphQLTypes['delete_one'] | undefined;
  };
  ['auth_tokens']: {
    __typename: 'auth_tokens';
    access_token?: string | undefined;
    expires?: number | undefined;
    refresh_token?: string | undefined;
  };
  ['auth_mode']: auth_mode;
  ['users_me_tfa_generate_data']: {
    __typename: 'users_me_tfa_generate_data';
    secret?: string | undefined;
    otpauth_url?: string | undefined;
  };
  /** Represents NULL values */
  ['Void']: 'scalar' & { name: 'Void' };
  ['create_directus_collections_input']: {
    collection?: string | undefined;
    meta?: GraphQLTypes['directus_collections_meta_input'] | undefined;
    schema?: GraphQLTypes['directus_collections_schema_input'] | undefined;
    fields?:
      | Array<GraphQLTypes['create_directus_collections_fields_input']>
      | undefined;
  };
  ['directus_collections_meta_input']: {
    collection: string;
    icon?: string | undefined;
    note?: string | undefined;
    display_template?: string | undefined;
    hidden: boolean;
    singleton: boolean;
    translations?: GraphQLTypes['JSON'] | undefined;
    archive_field?: string | undefined;
    archive_app_filter: boolean;
    archive_value?: string | undefined;
    unarchive_value?: string | undefined;
    sort_field?: string | undefined;
    accountability?: string | undefined;
    color?: string | undefined;
    item_duplication_fields?: GraphQLTypes['JSON'] | undefined;
    sort?: number | undefined;
    group?: string | undefined;
    collapse: string;
  };
  ['directus_collections_schema_input']: {
    name?: string | undefined;
    comment?: string | undefined;
  };
  ['create_directus_collections_fields_input']: {
    collection?: string | undefined;
    field?: string | undefined;
    type?: string | undefined;
    meta?: GraphQLTypes['directus_fields_meta_input'] | undefined;
    schema?: GraphQLTypes['directus_fields_schema_input'] | undefined;
  };
  ['directus_fields_meta_input']: {
    id: number;
    collection: string;
    field: string;
    special?: Array<string | undefined> | undefined;
    interface?: string | undefined;
    options?: GraphQLTypes['JSON'] | undefined;
    display?: string | undefined;
    display_options?: GraphQLTypes['JSON'] | undefined;
    readonly: boolean;
    hidden: boolean;
    sort?: number | undefined;
    width?: string | undefined;
    translations?: GraphQLTypes['JSON'] | undefined;
    note?: string | undefined;
    conditions?: GraphQLTypes['JSON'] | undefined;
    required?: boolean | undefined;
    group?: string | undefined;
    validation?: GraphQLTypes['JSON'] | undefined;
    validation_message?: string | undefined;
  };
  ['directus_fields_schema_input']: {
    name?: string | undefined;
    table?: string | undefined;
    data_type?: string | undefined;
    default_value?: string | undefined;
    max_length?: number | undefined;
    numeric_precision?: number | undefined;
    numeric_scale?: number | undefined;
    is_nullable?: boolean | undefined;
    is_unique?: boolean | undefined;
    is_primary_key?: boolean | undefined;
    has_auto_increment?: boolean | undefined;
    foreign_key_column?: string | undefined;
    foreign_key_table?: string | undefined;
    comment?: string | undefined;
  };
  ['update_directus_collections_input']: {
    meta?: GraphQLTypes['directus_collections_meta_input'] | undefined;
  };
  ['delete_collection']: {
    __typename: 'delete_collection';
    collection?: string | undefined;
  };
  ['create_directus_fields_input']: {
    collection?: string | undefined;
    field?: string | undefined;
    type?: string | undefined;
    meta?: GraphQLTypes['directus_fields_meta_input'] | undefined;
    schema?: GraphQLTypes['directus_fields_schema_input'] | undefined;
  };
  ['update_directus_fields_input']: {
    collection?: string | undefined;
    field?: string | undefined;
    type?: string | undefined;
    meta?: GraphQLTypes['directus_fields_meta_input'] | undefined;
    schema?: GraphQLTypes['directus_fields_schema_input'] | undefined;
  };
  ['delete_field']: {
    __typename: 'delete_field';
    collection?: string | undefined;
    field?: string | undefined;
  };
  ['create_directus_relations_input']: {
    collection?: string | undefined;
    field?: string | undefined;
    related_collection?: string | undefined;
    schema?: GraphQLTypes['directus_relations_schema_input'] | undefined;
    meta?: GraphQLTypes['directus_relations_meta_input'] | undefined;
  };
  ['directus_relations_schema_input']: {
    table: string;
    column: string;
    foreign_key_table: string;
    foreign_key_column: string;
    constraint_name?: string | undefined;
    on_update: string;
    on_delete: string;
  };
  ['directus_relations_meta_input']: {
    id?: number | undefined;
    many_collection?: string | undefined;
    many_field?: string | undefined;
    one_collection?: string | undefined;
    one_field?: string | undefined;
    one_collection_field?: string | undefined;
    one_allowed_collections?: Array<string | undefined> | undefined;
    junction_field?: string | undefined;
    sort_field?: string | undefined;
    one_deselect_action?: string | undefined;
  };
  ['update_directus_relations_input']: {
    collection?: string | undefined;
    field?: string | undefined;
    related_collection?: string | undefined;
    schema?: GraphQLTypes['directus_relations_schema_input'] | undefined;
    meta?: GraphQLTypes['directus_relations_meta_input'] | undefined;
  };
  ['delete_relation']: {
    __typename: 'delete_relation';
    collection?: string | undefined;
    field?: string | undefined;
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
  ['delete_one']: {
    __typename: 'delete_one';
    id: string;
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
  ['create_directus_permissions_input']: {
    id?: string | undefined;
    role?: GraphQLTypes['create_directus_roles_input'] | undefined;
    collection: string;
    action: string;
    permissions?: GraphQLTypes['JSON'] | undefined;
    validation?: GraphQLTypes['JSON'] | undefined;
    presets?: GraphQLTypes['JSON'] | undefined;
    fields?: Array<string | undefined> | undefined;
  };
  ['create_directus_presets_input']: {
    id?: string | undefined;
    bookmark?: string | undefined;
    user?: GraphQLTypes['create_directus_users_input'] | undefined;
    role?: GraphQLTypes['create_directus_roles_input'] | undefined;
    collection?: string | undefined;
    search?: string | undefined;
    layout?: string | undefined;
    layout_query?: GraphQLTypes['JSON'] | undefined;
    layout_options?: GraphQLTypes['JSON'] | undefined;
    refresh_interval?: number | undefined;
    filter?: GraphQLTypes['JSON'] | undefined;
    icon?: string | undefined;
    color?: string | undefined;
  };
  ['create_directus_panels_input']: {
    id?: string | undefined;
    dashboard?: GraphQLTypes['create_directus_dashboards_input'] | undefined;
    name?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    show_header: boolean;
    note?: string | undefined;
    type: string;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    options?: GraphQLTypes['JSON'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    user_created?: GraphQLTypes['create_directus_users_input'] | undefined;
  };
  ['create_directus_dashboards_input']: {
    id?: string | undefined;
    name: string;
    icon?: string | undefined;
    note?: string | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    user_created?: GraphQLTypes['create_directus_users_input'] | undefined;
    color?: string | undefined;
    panels?:
      | Array<GraphQLTypes['create_directus_panels_input'] | undefined>
      | undefined;
  };
  ['create_directus_webhooks_input']: {
    id?: string | undefined;
    name: string;
    method?: string | undefined;
    url: string;
    status?: string | undefined;
    data?: boolean | undefined;
    actions: Array<string | undefined>;
    collections: Array<string | undefined>;
    headers?: GraphQLTypes['JSON'] | undefined;
  };
  ['create_directus_notifications_input']: {
    id?: string | undefined;
    timestamp?: GraphQLTypes['Date'] | undefined;
    status?: string | undefined;
    recipient?: GraphQLTypes['create_directus_users_input'] | undefined;
    sender?: GraphQLTypes['create_directus_users_input'] | undefined;
    subject: string;
    message?: string | undefined;
    collection?: string | undefined;
    item?: string | undefined;
  };
  ['create_directus_shares_input']: {
    id?: string | undefined;
    name?: string | undefined;
    collection?: string | undefined;
    item?: string | undefined;
    role?: GraphQLTypes['create_directus_roles_input'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    password?: GraphQLTypes['Hash'] | undefined;
    user_created?: GraphQLTypes['create_directus_users_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: GraphQLTypes['Date'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: GraphQLTypes['Date'] | undefined;
    times_used?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: number | undefined;
  };
  ['create_directus_flows_input']: {
    id?: string | undefined;
    name: string;
    icon?: string | undefined;
    color?: string | undefined;
    description?: string | undefined;
    status?: string | undefined;
    trigger?: string | undefined;
    accountability?: string | undefined;
    options?: GraphQLTypes['JSON'] | undefined;
    operation?: GraphQLTypes['create_directus_operations_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    user_created?: GraphQLTypes['create_directus_users_input'] | undefined;
    operations?:
      | Array<GraphQLTypes['create_directus_operations_input'] | undefined>
      | undefined;
  };
  ['create_directus_operations_input']: {
    id?: string | undefined;
    name?: string | undefined;
    key: string;
    type: string;
    position_x: number;
    position_y: number;
    options?: GraphQLTypes['JSON'] | undefined;
    resolve?: GraphQLTypes['create_directus_operations_input'] | undefined;
    reject?: GraphQLTypes['create_directus_operations_input'] | undefined;
    flow?: GraphQLTypes['create_directus_flows_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    user_created?: GraphQLTypes['create_directus_users_input'] | undefined;
  };
  ['update_directus_permissions_input']: {
    id?: string | undefined;
    role?: GraphQLTypes['update_directus_roles_input'] | undefined;
    collection?: string | undefined;
    action?: string | undefined;
    permissions?: GraphQLTypes['JSON'] | undefined;
    validation?: GraphQLTypes['JSON'] | undefined;
    presets?: GraphQLTypes['JSON'] | undefined;
    fields?: Array<string | undefined> | undefined;
  };
  ['update_directus_presets_input']: {
    id?: string | undefined;
    bookmark?: string | undefined;
    user?: GraphQLTypes['update_directus_users_input'] | undefined;
    role?: GraphQLTypes['update_directus_roles_input'] | undefined;
    collection?: string | undefined;
    search?: string | undefined;
    layout?: string | undefined;
    layout_query?: GraphQLTypes['JSON'] | undefined;
    layout_options?: GraphQLTypes['JSON'] | undefined;
    refresh_interval?: number | undefined;
    filter?: GraphQLTypes['JSON'] | undefined;
    icon?: string | undefined;
    color?: string | undefined;
  };
  ['update_directus_panels_input']: {
    id?: string | undefined;
    dashboard?: GraphQLTypes['update_directus_dashboards_input'] | undefined;
    name?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    show_header?: boolean | undefined;
    note?: string | undefined;
    type?: string | undefined;
    position_x?: number | undefined;
    position_y?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    options?: GraphQLTypes['JSON'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    user_created?: GraphQLTypes['update_directus_users_input'] | undefined;
  };
  ['update_directus_dashboards_input']: {
    id?: string | undefined;
    name?: string | undefined;
    icon?: string | undefined;
    note?: string | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    user_created?: GraphQLTypes['update_directus_users_input'] | undefined;
    color?: string | undefined;
    panels?:
      | Array<GraphQLTypes['update_directus_panels_input'] | undefined>
      | undefined;
  };
  ['update_directus_webhooks_input']: {
    id?: string | undefined;
    name?: string | undefined;
    method?: string | undefined;
    url?: string | undefined;
    status?: string | undefined;
    data?: boolean | undefined;
    actions?: Array<string | undefined> | undefined;
    collections?: Array<string | undefined> | undefined;
    headers?: GraphQLTypes['JSON'] | undefined;
  };
  ['update_directus_notifications_input']: {
    id?: string | undefined;
    timestamp?: GraphQLTypes['Date'] | undefined;
    status?: string | undefined;
    recipient?: GraphQLTypes['update_directus_users_input'] | undefined;
    sender?: GraphQLTypes['update_directus_users_input'] | undefined;
    subject?: string | undefined;
    message?: string | undefined;
    collection?: string | undefined;
    item?: string | undefined;
  };
  ['update_directus_shares_input']: {
    id?: string | undefined;
    name?: string | undefined;
    collection?: string | undefined;
    item?: string | undefined;
    role?: GraphQLTypes['update_directus_roles_input'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    password?: GraphQLTypes['Hash'] | undefined;
    user_created?: GraphQLTypes['update_directus_users_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: GraphQLTypes['Date'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: GraphQLTypes['Date'] | undefined;
    times_used?: number | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    max_uses?: number | undefined;
  };
  ['update_directus_flows_input']: {
    id?: string | undefined;
    name?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    description?: string | undefined;
    status?: string | undefined;
    trigger?: string | undefined;
    accountability?: string | undefined;
    options?: GraphQLTypes['JSON'] | undefined;
    operation?: GraphQLTypes['update_directus_operations_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    user_created?: GraphQLTypes['update_directus_users_input'] | undefined;
    operations?:
      | Array<GraphQLTypes['update_directus_operations_input'] | undefined>
      | undefined;
  };
  ['update_directus_operations_input']: {
    id?: string | undefined;
    name?: string | undefined;
    key?: string | undefined;
    type?: string | undefined;
    position_x?: number | undefined;
    position_y?: number | undefined;
    options?: GraphQLTypes['JSON'] | undefined;
    resolve?: GraphQLTypes['update_directus_operations_input'] | undefined;
    reject?: GraphQLTypes['update_directus_operations_input'] | undefined;
    flow?: GraphQLTypes['update_directus_flows_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    user_created?: GraphQLTypes['update_directus_users_input'] | undefined;
  };
  ['update_directus_settings_input']: {
    id?: string | undefined;
    project_name?: string | undefined;
    project_url?: string | undefined;
    /** $t:field_options.directus_settings.project_color_note */
    project_color?: string | undefined;
    project_logo?: GraphQLTypes['update_directus_files_input'] | undefined;
    public_foreground?: GraphQLTypes['update_directus_files_input'] | undefined;
    public_background?: GraphQLTypes['update_directus_files_input'] | undefined;
    public_note?: string | undefined;
    auth_login_attempts?: number | undefined;
    auth_password_policy?: string | undefined;
    storage_asset_transform?: string | undefined;
    storage_asset_presets?: GraphQLTypes['JSON'] | undefined;
    custom_css?: string | undefined;
    storage_default_folder?:
      | GraphQLTypes['update_directus_folders_input']
      | undefined;
    basemaps?: GraphQLTypes['JSON'] | undefined;
    mapbox_key?: string | undefined;
    module_bar?: GraphQLTypes['JSON'] | undefined;
    project_descriptor?: string | undefined;
    translation_strings?: GraphQLTypes['JSON'] | undefined;
    default_language?: string | undefined;
    custom_aspect_ratios?: GraphQLTypes['JSON'] | undefined;
  };
  ['delete_many']: {
    __typename: 'delete_many';
    ids: Array<string | undefined>;
  };
};
export const enum graphql_sdl_scope {
  items = 'items',
  system = 'system',
}
export const enum auth_mode {
  json = 'json',
  cookie = 'cookie',
}

type ZEUS_VARIABLES = {
  ['JSON']: ValueTypes['JSON'];
  ['graphql_sdl_scope']: ValueTypes['graphql_sdl_scope'];
  ['Hash']: ValueTypes['Hash'];
  ['directus_folders_filter']: ValueTypes['directus_folders_filter'];
  ['string_filter_operators']: ValueTypes['string_filter_operators'];
  ['directus_users_filter']: ValueTypes['directus_users_filter'];
  ['hash_filter_operators']: ValueTypes['hash_filter_operators'];
  ['count_function_filter_operators']: ValueTypes['count_function_filter_operators'];
  ['number_filter_operators']: ValueTypes['number_filter_operators'];
  ['GraphQLStringOrFloat']: ValueTypes['GraphQLStringOrFloat'];
  ['directus_files_filter']: ValueTypes['directus_files_filter'];
  ['date_filter_operators']: ValueTypes['date_filter_operators'];
  ['datetime_function_filter_operators']: ValueTypes['datetime_function_filter_operators'];
  ['directus_roles_filter']: ValueTypes['directus_roles_filter'];
  ['boolean_filter_operators']: ValueTypes['boolean_filter_operators'];
  ['collaborators_filter']: ValueTypes['collaborators_filter'];
  ['collaborator_roles_filter']: ValueTypes['collaborator_roles_filter'];
  ['junction_directus_users_skills_filter']: ValueTypes['junction_directus_users_skills_filter'];
  ['skills_filter']: ValueTypes['skills_filter'];
  ['Date']: ValueTypes['Date'];
  ['GraphQLBigInt']: ValueTypes['GraphQLBigInt'];
  ['directus_activity_filter']: ValueTypes['directus_activity_filter'];
  ['directus_revisions_filter']: ValueTypes['directus_revisions_filter'];
  ['directus_permissions_filter']: ValueTypes['directus_permissions_filter'];
  ['directus_presets_filter']: ValueTypes['directus_presets_filter'];
  ['directus_panels_filter']: ValueTypes['directus_panels_filter'];
  ['directus_dashboards_filter']: ValueTypes['directus_dashboards_filter'];
  ['directus_webhooks_filter']: ValueTypes['directus_webhooks_filter'];
  ['directus_notifications_filter']: ValueTypes['directus_notifications_filter'];
  ['directus_shares_filter']: ValueTypes['directus_shares_filter'];
  ['directus_operations_filter']: ValueTypes['directus_operations_filter'];
  ['directus_flows_filter']: ValueTypes['directus_flows_filter'];
  ['auth_mode']: ValueTypes['auth_mode'];
  ['Void']: ValueTypes['Void'];
  ['create_directus_collections_input']: ValueTypes['create_directus_collections_input'];
  ['directus_collections_meta_input']: ValueTypes['directus_collections_meta_input'];
  ['directus_collections_schema_input']: ValueTypes['directus_collections_schema_input'];
  ['create_directus_collections_fields_input']: ValueTypes['create_directus_collections_fields_input'];
  ['directus_fields_meta_input']: ValueTypes['directus_fields_meta_input'];
  ['directus_fields_schema_input']: ValueTypes['directus_fields_schema_input'];
  ['update_directus_collections_input']: ValueTypes['update_directus_collections_input'];
  ['create_directus_fields_input']: ValueTypes['create_directus_fields_input'];
  ['update_directus_fields_input']: ValueTypes['update_directus_fields_input'];
  ['create_directus_relations_input']: ValueTypes['create_directus_relations_input'];
  ['directus_relations_schema_input']: ValueTypes['directus_relations_schema_input'];
  ['directus_relations_meta_input']: ValueTypes['directus_relations_meta_input'];
  ['update_directus_relations_input']: ValueTypes['update_directus_relations_input'];
  ['update_directus_users_input']: ValueTypes['update_directus_users_input'];
  ['update_directus_files_input']: ValueTypes['update_directus_files_input'];
  ['update_directus_folders_input']: ValueTypes['update_directus_folders_input'];
  ['update_directus_roles_input']: ValueTypes['update_directus_roles_input'];
  ['update_collaborators_input']: ValueTypes['update_collaborators_input'];
  ['update_collaborator_roles_input']: ValueTypes['update_collaborator_roles_input'];
  ['update_junction_directus_users_skills_input']: ValueTypes['update_junction_directus_users_skills_input'];
  ['update_skills_input']: ValueTypes['update_skills_input'];
  ['create_directus_files_input']: ValueTypes['create_directus_files_input'];
  ['create_directus_folders_input']: ValueTypes['create_directus_folders_input'];
  ['create_directus_users_input']: ValueTypes['create_directus_users_input'];
  ['create_directus_roles_input']: ValueTypes['create_directus_roles_input'];
  ['create_collaborators_input']: ValueTypes['create_collaborators_input'];
  ['create_collaborator_roles_input']: ValueTypes['create_collaborator_roles_input'];
  ['create_junction_directus_users_skills_input']: ValueTypes['create_junction_directus_users_skills_input'];
  ['create_skills_input']: ValueTypes['create_skills_input'];
  ['create_directus_permissions_input']: ValueTypes['create_directus_permissions_input'];
  ['create_directus_presets_input']: ValueTypes['create_directus_presets_input'];
  ['create_directus_panels_input']: ValueTypes['create_directus_panels_input'];
  ['create_directus_dashboards_input']: ValueTypes['create_directus_dashboards_input'];
  ['create_directus_webhooks_input']: ValueTypes['create_directus_webhooks_input'];
  ['create_directus_notifications_input']: ValueTypes['create_directus_notifications_input'];
  ['create_directus_shares_input']: ValueTypes['create_directus_shares_input'];
  ['create_directus_flows_input']: ValueTypes['create_directus_flows_input'];
  ['create_directus_operations_input']: ValueTypes['create_directus_operations_input'];
  ['update_directus_permissions_input']: ValueTypes['update_directus_permissions_input'];
  ['update_directus_presets_input']: ValueTypes['update_directus_presets_input'];
  ['update_directus_panels_input']: ValueTypes['update_directus_panels_input'];
  ['update_directus_dashboards_input']: ValueTypes['update_directus_dashboards_input'];
  ['update_directus_webhooks_input']: ValueTypes['update_directus_webhooks_input'];
  ['update_directus_notifications_input']: ValueTypes['update_directus_notifications_input'];
  ['update_directus_shares_input']: ValueTypes['update_directus_shares_input'];
  ['update_directus_flows_input']: ValueTypes['update_directus_flows_input'];
  ['update_directus_operations_input']: ValueTypes['update_directus_operations_input'];
  ['update_directus_settings_input']: ValueTypes['update_directus_settings_input'];
};
