/* eslint-disable */

import { AllTypesProps, ReturnTypes, Ops } from './const';
import fetch, { Response } from 'node-fetch';
import WebSocket from 'ws';
export const HOST = 'http://localhost:8055/graphql';

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

export const InternalsBuildQuery = ({
  ops,
  props,
  returns,
  options,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  options?: OperationOptions & {
    scalars?: ScalarDefinition;
  };
}) => {
  const ibb = (
    k: string,
    o: InputValueType | VType,
    p = '',
    root = true,
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
        variables: options?.variables?.values,
        scalars: options?.scalars,
      })(o[0], newPath);
      return `${ibb(args ? `${k}(${args})` : k, o[1], p, false)}`;
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
          return ibb(`${alias}:${operationName}`, operation, p, false);
        })
        .join('\n');
    }
    const hasOperationName =
      root && options?.operationName ? ' ' + options.operationName : '';
    const hasVariables =
      root && options?.variables?.$params
        ? `(${options.variables?.$params})`
        : '';
    const keyForDirectives = o.__directives ?? '';
    return `${k} ${keyForDirectives}${hasOperationName}${hasVariables}{${Object.entries(
      o,
    )
      .filter(([k]) => k !== '__directives')
      .map((e) => ibb(...e, [p, `field<>${keyForPath}`].join(SEPARATOR), false))
      .join('\n')}}`;
  };
  return ibb;
};

export const Thunder =
  (fn: FetchFunction) =>
  <
    O extends keyof typeof Ops,
    R extends keyof ValueTypes = GenericOperation<O>,
  >(
    operation: O,
  ) =>
  <Z extends ValueTypes[R], SCLR extends ScalarDefinition>(
    o: Z | ValueTypes[R],
    ops?: OperationOptions & {
      scalars?: SCLR;
    },
  ) =>
    fullChainConstruct(fn)(operation)(o as any, ops) as Promise<
      InputType<GraphQLTypes[R], Z, SCLR>
    >;

export const Chain = (...options: chainOptions) => Thunder(apiFetch(options));

export const SubscriptionThunder =
  (fn: SubscriptionFunction) =>
  <
    O extends keyof typeof Ops,
    R extends keyof ValueTypes = GenericOperation<O>,
  >(
    operation: O,
  ) =>
  <Z extends ValueTypes[R], SCLR extends ScalarDefinition>(
    o: Z | ValueTypes[R],
    ops?: OperationOptions,
  ) =>
    fullSubscriptionConstruct(fn)(operation)(
      o as any,
      ops,
    ) as SubscriptionToGraphQL<Z, GraphQLTypes[R], SCLR>;

export const Subscription = (...options: chainOptions) =>
  SubscriptionThunder(apiSubscription(options));
export const Zeus = <
  Z extends ValueTypes[R],
  O extends keyof typeof Ops,
  R extends keyof ValueTypes = GenericOperation<O>,
>(
  operation: O,
  o: Z | ValueTypes[R],
  ops?: OperationOptions,
) =>
  InternalsBuildQuery({
    props: AllTypesProps,
    returns: ReturnTypes,
    ops: Ops,
    options: ops,
  })(operation, o as any);
export const Selector = <T extends keyof ValueTypes>(key: T) =>
  ZeusSelect<ValueTypes[T]>();

export const Gql = Chain(HOST);

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
      'Query',
      response,
      ['Query'],
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
    return Object.fromEntries(
      Object.entries(o).map(([k, v]) => [
        k,
        ibb(k, v, [...p, purifyGraphQLKey(k)]),
      ]),
    );
  };
  return ibb;
};

export const fullChainConstruct =
  (fn: FetchFunction) =>
  (t: keyof typeof Ops) =>
  (
    o: Record<any, any>,
    options?: OperationOptions & { scalars?: ScalarDefinition },
  ) => {
    const builder = InternalsBuildQuery({
      props: AllTypesProps,
      returns: ReturnTypes,
      ops: Ops,
      options,
    });
    return fn(builder(t, o), options?.variables?.values).then((data) => {
      if (options?.scalars) {
        return decodeScalarsInResponse({
          response: data,
          initialOp: t,
          initialZeusQuery: o,
          returns: ReturnTypes,
          scalars: options.scalars,
          ops: Ops,
        });
      }
      return data;
    });
  };

export const fullSubscriptionConstruct =
  (fn: SubscriptionFunction) =>
  (t: keyof typeof Ops) =>
  (
    o: Record<any, any>,
    options?: OperationOptions & { scalars?: ScalarDefinition },
  ) => {
    const builder = InternalsBuildQuery({
      props: AllTypesProps,
      returns: ReturnTypes,
      ops: Ops,
      options,
    });
    const returnedFunction = fn(builder(t, o));
    if (returnedFunction?.on) {
      returnedFunction.on = (fnToCall: (v: any) => void) =>
        returnedFunction.on((data: any) => {
          if (options?.scalars) {
            return fnToCall(
              decodeScalarsInResponse({
                response: data,
                initialOp: t,
                initialZeusQuery: o,
                returns: ReturnTypes,
                scalars: options.scalars,
                ops: Ops,
              }),
            );
          }
          return fnToCall(data);
        });
    }
    return returnedFunction;
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
  variables?: Record<string, any>,
) => Promise<any>;
export type SubscriptionFunction = (query: string) => any;
type NotUndefined<T> = T extends undefined ? never : T;
export type ResolverType<F> = NotUndefined<
  F extends [infer ARGS, any] ? ARGS : undefined
>;

export type OperationOptions<
  Z extends Record<string, unknown> = Record<string, unknown>,
> = {
  variables?: VariableInput<Z>;
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
      .map(([k, v]) =>
        ibb(
          k,
          k,
          v,
          [...p, purifyGraphQLKey(keyName || k)],
          [...pOriginals, purifyGraphQLKey(originalKey)],
          false,
        ),
      )
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
  variables,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  variables?: Record<string, unknown>;
  scalars?: ScalarDefinition;
}) => {
  const arb = (a: ZeusArgsType, p = '', root = true): string => {
    const checkType = ResolveFromPath(props, returns, ops)(p);
    if (checkType.startsWith('scalar.')) {
      const [_, ...splittedScalar] = checkType.split('.');
      const scalarKey = splittedScalar.join('.');
      return (scalars?.[scalarKey]?.encode?.(a) as string) || (a as string);
    }
    if (Array.isArray(a)) {
      return `[${a.map((arr) => arb(arr, p, false)).join(', ')}]`;
    }
    if (typeof a === 'string') {
      if (a.startsWith('$') && variables?.[a.slice(1)]) {
        return a;
      }
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
  T extends keyof ValueTypes,
  Z extends keyof ValueTypes[T],
>(
  type: T,
  field: Z,
  fn: (
    args: Required<ValueTypes[T]>[Z] extends [infer Input, any] ? Input : any,
    source: any,
  ) => Z extends keyof ModelTypes[T]
    ? ModelTypes[T][Z] | Promise<ModelTypes[T][Z]> | X
    : any,
) => fn as (args?: any, source?: any) => any;

export type SelectionFunction<V> = <T>(t: T | V) => T;
export const ZeusSelect = <T>() => ((t: unknown) => t) as SelectionFunction<T>;

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
type BaseZeusResolver = boolean | 1 | string;

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
          : Record<string, unknown>
        : never;
    }[keyof DST] & {
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

export type ScalarResolver = {
  encode?: (s: unknown) => string;
  decode?: (s: unknown) => unknown;
};

export const useZeusVariables =
  <T>(variables: T) =>
  <
    Z extends {
      [P in keyof T]: unknown;
    },
  >(
    values: Z,
  ) => {
    return {
      $params: Object.keys(variables)
        .map((k) => `$${k}: ${variables[k as keyof T]}`)
        .join(', '),
      $: <U extends keyof Z>(variable: U) => {
        return `$${variable}` as unknown as Z[U];
      },
      values,
    };
  };

export type VariableInput<Z extends Record<string, unknown>> = {
  $params: ReturnType<ReturnType<typeof useZeusVariables>>['$params'];
  values: Z;
};

type ZEUS_INTERFACES = never;
type ZEUS_UNIONS = never;

export type ValueTypes = {
  ['Query']: AliasType<{
    brands?: [
      {
        filter?: ValueTypes['brands_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['brands'],
    ];
    brands_by_id?: [{ id: string }, ValueTypes['brands']];
    brands_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['brands_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['brands_aggregated'],
    ];
    producers?: [
      {
        filter?: ValueTypes['producers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['producers'],
    ];
    producers_by_id?: [{ id: string }, ValueTypes['producers']];
    producers_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['producers_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['producers_aggregated'],
    ];
    producers_production_materials?: [
      {
        filter?:
          | ValueTypes['producers_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['producers_production_materials'],
    ];
    producers_production_materials_by_id?: [
      { id: string },
      ValueTypes['producers_production_materials'],
    ];
    producers_production_materials_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ValueTypes['producers_production_materials_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['producers_production_materials_aggregated'],
    ];
    producers_production_methods?: [
      {
        filter?:
          | ValueTypes['producers_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['producers_production_methods'],
    ];
    producers_production_methods_by_id?: [
      { id: string },
      ValueTypes['producers_production_methods'],
    ];
    producers_production_methods_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ValueTypes['producers_production_methods_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['producers_production_methods_aggregated'],
    ];
    production_methods?: [
      {
        filter?: ValueTypes['production_methods_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['production_methods'],
    ];
    production_methods_by_id?: [
      { id: string },
      ValueTypes['production_methods'],
    ];
    production_methods_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['production_methods_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['production_methods_aggregated'],
    ];
    collaborator_roles?: [
      {
        filter?: ValueTypes['collaborator_roles_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['collaborator_roles'],
    ];
    collaborator_roles_by_id?: [
      { id: string },
      ValueTypes['collaborator_roles'],
    ];
    collaborator_roles_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['collaborator_roles_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['collaborator_roles_aggregated'],
    ];
    production_materials_production_methods?: [
      {
        filter?:
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['production_materials_production_methods'],
    ];
    production_materials_production_methods_by_id?: [
      { id: string },
      ValueTypes['production_materials_production_methods'],
    ];
    production_materials_production_methods_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['production_materials_production_methods_aggregated'],
    ];
    fulfillers?: [
      {
        filter?: ValueTypes['fulfillers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['fulfillers'],
    ];
    fulfillers_by_id?: [{ id: string }, ValueTypes['fulfillers']];
    fulfillers_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['fulfillers_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['fulfillers_aggregated'],
    ];
    price_currencies?: [
      {
        filter?: ValueTypes['price_currencies_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['price_currencies'],
    ];
    price_currencies_by_id?: [{ id: string }, ValueTypes['price_currencies']];
    price_currencies_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['price_currencies_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['price_currencies_aggregated'],
    ];
    products_files?: [
      {
        filter?: ValueTypes['products_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products_files'],
    ];
    products_files_by_id?: [{ id: string }, ValueTypes['products_files']];
    products_files_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['products_files_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['products_files_aggregated'],
    ];
    products_production_methods?: [
      {
        filter?:
          | ValueTypes['products_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products_production_methods'],
    ];
    products_production_methods_by_id?: [
      { id: string },
      ValueTypes['products_production_methods'],
    ];
    products_production_methods_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ValueTypes['products_production_methods_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['products_production_methods_aggregated'],
    ];
    skills?: [
      {
        filter?: ValueTypes['skills_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['skills'],
    ];
    skills_by_id?: [{ id: string }, ValueTypes['skills']];
    skills_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['skills_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['skills_aggregated'],
    ];
    production_materials?: [
      {
        filter?: ValueTypes['production_materials_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['production_materials'],
    ];
    production_materials_by_id?: [
      { id: string },
      ValueTypes['production_materials'],
    ];
    production_materials_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['production_materials_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['production_materials_aggregated'],
    ];
    products?: [
      {
        filter?: ValueTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products'],
    ];
    products_by_id?: [{ id: string }, ValueTypes['products']];
    products_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['products_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['products_aggregated'],
    ];
    products_production_materials?: [
      {
        filter?:
          | ValueTypes['products_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products_production_materials'],
    ];
    products_production_materials_by_id?: [
      { id: string },
      ValueTypes['products_production_materials'],
    ];
    products_production_materials_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ValueTypes['products_production_materials_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['products_production_materials_aggregated'],
    ];
    products_wearables?: [
      {
        filter?: ValueTypes['products_wearables_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products_wearables'],
    ];
    products_wearables_by_id?: [
      { id: string },
      ValueTypes['products_wearables'],
    ];
    products_wearables_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['products_wearables_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['products_wearables_aggregated'],
    ];
    file_formats?: [
      {
        filter?: ValueTypes['file_formats_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['file_formats'],
    ];
    file_formats_by_id?: [{ id: string }, ValueTypes['file_formats']];
    file_formats_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['file_formats_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['file_formats_aggregated'],
    ];
    products_design_files?: [
      {
        filter?: ValueTypes['products_design_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products_design_files'],
    ];
    products_design_files_by_id?: [
      { id: string },
      ValueTypes['products_design_files'],
    ];
    products_design_files_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['products_design_files_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['products_design_files_aggregated'],
    ];
    products_content?: [
      {
        filter?: ValueTypes['products_content_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products_content'],
    ];
    products_content_by_id?: [{ id: string }, ValueTypes['products_content']];
    products_content_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['products_content_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['products_content_aggregated'],
    ];
    stages?: [
      {
        filter?: ValueTypes['stages_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['stages'],
    ];
    stages_by_id?: [{ id: string }, ValueTypes['stages']];
    stages_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['stages_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['stages_aggregated'],
    ];
    junction_directus_users_skills?: [
      {
        filter?:
          | ValueTypes['junction_directus_users_skills_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['junction_directus_users_skills'],
    ];
    junction_directus_users_skills_by_id?: [
      { id: string },
      ValueTypes['junction_directus_users_skills'],
    ];
    junction_directus_users_skills_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?:
          | ValueTypes['junction_directus_users_skills_filter']
          | undefined
          | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['junction_directus_users_skills_aggregated'],
    ];
    collaborators?: [
      {
        filter?: ValueTypes['collaborators_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['collaborators'],
    ];
    collaborators_by_id?: [{ id: string }, ValueTypes['collaborators']];
    collaborators_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['collaborators_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['collaborators_aggregated'],
    ];
    brands_directus_users?: [
      {
        filter?: ValueTypes['brands_directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['brands_directus_users'],
    ];
    brands_directus_users_by_id?: [
      { id: string },
      ValueTypes['brands_directus_users'],
    ];
    brands_directus_users_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['brands_directus_users_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['brands_directus_users_aggregated'],
    ];
    products_contributors?: [
      {
        filter?: ValueTypes['products_contributors_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products_contributors'],
    ];
    products_contributors_by_id?: [
      { id: string },
      ValueTypes['products_contributors'],
    ];
    products_contributors_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['products_contributors_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['products_contributors_aggregated'],
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
        filter?: ValueTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_files'],
    ];
    name?: boolean | `@${string}`;
    twitter_url?: boolean | `@${string}`;
    website_url?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    products?: [
      {
        filter?: ValueTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products'],
    ];
    products_func?: ValueTypes['count_functions'];
    users?: [
      {
        filter?: ValueTypes['brands_directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
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
        filter?: ValueTypes['directus_folders_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_folders'],
    ];
    uploaded_by?: [
      {
        filter?: ValueTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_users'],
    ];
    uploaded_on?: boolean | `@${string}`;
    uploaded_on_func?: ValueTypes['datetime_functions'];
    modified_by?: [
      {
        filter?: ValueTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
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
        filter?: ValueTypes['directus_folders_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_folders'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_folders_filter']: {
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    parent?: ValueTypes['directus_folders_filter'] | undefined | null;
    _and?:
      | Array<ValueTypes['directus_folders_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['directus_folders_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['string_filter_operators']: {
    _eq?: string | undefined | null;
    _neq?: string | undefined | null;
    _contains?: string | undefined | null;
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
    tags_func?: ValueTypes['count_functions'];
    avatar?: [
      {
        filter?: ValueTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_files'],
    ];
    language?: boolean | `@${string}`;
    theme?: boolean | `@${string}`;
    tfa_secret?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    role?: [
      {
        filter?: ValueTypes['directus_roles_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
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
    timezone?: boolean | `@${string}`;
    discord_handle?: boolean | `@${string}`;
    twitter_handle?: boolean | `@${string}`;
    discord_id?: boolean | `@${string}`;
    collaborators?: [
      {
        filter?: ValueTypes['collaborators_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['collaborators'],
    ];
    collaborators_func?: ValueTypes['count_functions'];
    skills?: [
      {
        filter?:
          | ValueTypes['junction_directus_users_skills_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['junction_directus_users_skills'],
    ];
    skills_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  ['JSON']: unknown;
  ['count_functions']: AliasType<{
    count?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_files_filter']: {
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    storage?: ValueTypes['string_filter_operators'] | undefined | null;
    filename_disk?: ValueTypes['string_filter_operators'] | undefined | null;
    filename_download?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null;
    title?: ValueTypes['string_filter_operators'] | undefined | null;
    type?: ValueTypes['string_filter_operators'] | undefined | null;
    folder?: ValueTypes['directus_folders_filter'] | undefined | null;
    uploaded_by?: ValueTypes['directus_users_filter'] | undefined | null;
    uploaded_on?: ValueTypes['date_filter_operators'] | undefined | null;
    uploaded_on_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    modified_by?: ValueTypes['directus_users_filter'] | undefined | null;
    modified_on?: ValueTypes['date_filter_operators'] | undefined | null;
    modified_on_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    charset?: ValueTypes['string_filter_operators'] | undefined | null;
    filesize?: ValueTypes['string_filter_operators'] | undefined | null;
    width?: ValueTypes['number_filter_operators'] | undefined | null;
    height?: ValueTypes['number_filter_operators'] | undefined | null;
    duration?: ValueTypes['number_filter_operators'] | undefined | null;
    embed?: ValueTypes['string_filter_operators'] | undefined | null;
    description?: ValueTypes['string_filter_operators'] | undefined | null;
    location?: ValueTypes['string_filter_operators'] | undefined | null;
    tags?: ValueTypes['string_filter_operators'] | undefined | null;
    tags_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    metadata?: ValueTypes['string_filter_operators'] | undefined | null;
    metadata_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ValueTypes['directus_files_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['directus_files_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_users_filter']: {
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    first_name?: ValueTypes['string_filter_operators'] | undefined | null;
    last_name?: ValueTypes['string_filter_operators'] | undefined | null;
    email?: ValueTypes['string_filter_operators'] | undefined | null;
    password?: ValueTypes['string_filter_operators'] | undefined | null;
    location?: ValueTypes['string_filter_operators'] | undefined | null;
    title?: ValueTypes['string_filter_operators'] | undefined | null;
    description?: ValueTypes['string_filter_operators'] | undefined | null;
    tags?: ValueTypes['string_filter_operators'] | undefined | null;
    tags_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    avatar?: ValueTypes['directus_files_filter'] | undefined | null;
    language?: ValueTypes['string_filter_operators'] | undefined | null;
    theme?: ValueTypes['string_filter_operators'] | undefined | null;
    tfa_secret?: ValueTypes['string_filter_operators'] | undefined | null;
    status?: ValueTypes['string_filter_operators'] | undefined | null;
    role?: ValueTypes['directus_roles_filter'] | undefined | null;
    token?: ValueTypes['string_filter_operators'] | undefined | null;
    last_access?: ValueTypes['date_filter_operators'] | undefined | null;
    last_access_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    last_page?: ValueTypes['string_filter_operators'] | undefined | null;
    provider?: ValueTypes['string_filter_operators'] | undefined | null;
    external_identifier?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null;
    auth_data?: ValueTypes['string_filter_operators'] | undefined | null;
    auth_data_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    email_notifications?:
      | ValueTypes['boolean_filter_operators']
      | undefined
      | null;
    timezone?: ValueTypes['string_filter_operators'] | undefined | null;
    discord_handle?: ValueTypes['string_filter_operators'] | undefined | null;
    twitter_handle?: ValueTypes['string_filter_operators'] | undefined | null;
    discord_id?: ValueTypes['string_filter_operators'] | undefined | null;
    collaborators?: ValueTypes['collaborators_filter'] | undefined | null;
    collaborators_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    skills?:
      | ValueTypes['junction_directus_users_skills_filter']
      | undefined
      | null;
    skills_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ValueTypes['directus_users_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['directus_users_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['count_function_filter_operators']: {
    count?: ValueTypes['number_filter_operators'] | undefined | null;
  };
  ['number_filter_operators']: {
    _eq?: number | undefined | null;
    _neq?: number | undefined | null;
    _in?: Array<number | undefined | null> | undefined | null;
    _nin?: Array<number | undefined | null> | undefined | null;
    _gt?: number | undefined | null;
    _gte?: number | undefined | null;
    _lt?: number | undefined | null;
    _lte?: number | undefined | null;
    _null?: boolean | undefined | null;
    _nnull?: boolean | undefined | null;
  };
  ['directus_roles_filter']: {
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    icon?: ValueTypes['string_filter_operators'] | undefined | null;
    description?: ValueTypes['string_filter_operators'] | undefined | null;
    ip_access?: ValueTypes['string_filter_operators'] | undefined | null;
    enforce_tfa?: ValueTypes['boolean_filter_operators'] | undefined | null;
    admin_access?: ValueTypes['boolean_filter_operators'] | undefined | null;
    app_access?: ValueTypes['boolean_filter_operators'] | undefined | null;
    users?: ValueTypes['directus_users_filter'] | undefined | null;
    users_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ValueTypes['directus_roles_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['directus_roles_filter'] | undefined | null>
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
  };
  ['datetime_function_filter_operators']: {
    year?: ValueTypes['number_filter_operators'] | undefined | null;
    month?: ValueTypes['number_filter_operators'] | undefined | null;
    week?: ValueTypes['number_filter_operators'] | undefined | null;
    day?: ValueTypes['number_filter_operators'] | undefined | null;
    weekday?: ValueTypes['number_filter_operators'] | undefined | null;
    hour?: ValueTypes['number_filter_operators'] | undefined | null;
    minute?: ValueTypes['number_filter_operators'] | undefined | null;
    second?: ValueTypes['number_filter_operators'] | undefined | null;
  };
  ['collaborators_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    user_created?: ValueTypes['directus_users_filter'] | undefined | null;
    date_created?: ValueTypes['date_filter_operators'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    date_updated?: ValueTypes['date_filter_operators'] | undefined | null;
    date_updated_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    account?: ValueTypes['directus_users_filter'] | undefined | null;
    display_name?: ValueTypes['string_filter_operators'] | undefined | null;
    payment_eth_address?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null;
    role?: ValueTypes['collaborator_roles_filter'] | undefined | null;
    _and?:
      | Array<ValueTypes['collaborators_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['collaborators_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['collaborator_roles_filter']: {
    description?: ValueTypes['string_filter_operators'] | undefined | null;
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    _and?:
      | Array<ValueTypes['collaborator_roles_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['collaborator_roles_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['junction_directus_users_skills_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    directus_users_id?: ValueTypes['directus_users_filter'] | undefined | null;
    skills_id?: ValueTypes['skills_filter'] | undefined | null;
    _and?:
      | Array<
          ValueTypes['junction_directus_users_skills_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ValueTypes['junction_directus_users_skills_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['skills_filter']: {
    description?: ValueTypes['string_filter_operators'] | undefined | null;
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    _and?:
      | Array<ValueTypes['skills_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['skills_filter'] | undefined | null>
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
        filter?: ValueTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_users'],
    ];
    users_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborators']: AliasType<{
    id?: boolean | `@${string}`;
    user_created?: [
      {
        filter?: ValueTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_users'],
    ];
    date_created?: boolean | `@${string}`;
    date_created_func?: ValueTypes['datetime_functions'];
    date_updated?: boolean | `@${string}`;
    date_updated_func?: ValueTypes['datetime_functions'];
    account?: [
      {
        filter?: ValueTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_users'],
    ];
    display_name?: boolean | `@${string}`;
    payment_eth_address?: boolean | `@${string}`;
    role?: [
      {
        filter?: ValueTypes['collaborator_roles_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['collaborator_roles'],
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
    id?: boolean | `@${string}`;
    directus_users_id?: [
      {
        filter?: ValueTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_users'],
    ];
    skills_id?: [
      {
        filter?: ValueTypes['skills_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
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
  ['products']: AliasType<{
    brand_id?: [
      {
        filter?: ValueTypes['brands_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['brands'],
    ];
    brand_reward_share?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    created_at_func?: ValueTypes['datetime_functions'];
    description?: boolean | `@${string}`;
    discord_channel_id?: boolean | `@${string}`;
    fulfiller_id?: [
      {
        filter?: ValueTypes['fulfillers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['fulfillers'],
    ];
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    price?: [
      {
        filter?: ValueTypes['price_currencies_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['price_currencies'],
    ];
    producer_id?: [
      {
        filter?: ValueTypes['producers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['producers'],
    ];
    production_cost?: boolean | `@${string}`;
    quantity?: boolean | `@${string}`;
    sale_type?: boolean | `@${string}`;
    shopify_id?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    release_date?: boolean | `@${string}`;
    release_date_func?: ValueTypes['datetime_functions'];
    clo3d_file?: [
      {
        filter?: ValueTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_files'],
    ];
    product_stage?: [
      {
        filter?: ValueTypes['stages_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['stages'],
    ];
    nft_token_id?: boolean | `@${string}`;
    contributor_reward_share?: boolean | `@${string}`;
    production_methods?: [
      {
        filter?:
          | ValueTypes['products_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products_production_methods'],
    ];
    production_methods_func?: ValueTypes['count_functions'];
    images?: [
      {
        filter?: ValueTypes['products_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products_files'],
    ];
    images_func?: ValueTypes['count_functions'];
    materials?: [
      {
        filter?:
          | ValueTypes['products_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products_production_materials'],
    ];
    materials_func?: ValueTypes['count_functions'];
    wearable_files?: [
      {
        filter?: ValueTypes['products_wearables_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products_wearables'],
    ];
    wearable_files_func?: ValueTypes['count_functions'];
    content?: [
      {
        filter?: ValueTypes['products_content_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products_content'],
    ];
    content_func?: ValueTypes['count_functions'];
    design_files?: [
      {
        filter?: ValueTypes['products_design_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products_design_files'],
    ];
    design_files_func?: ValueTypes['count_functions'];
    contributors?: [
      {
        filter?: ValueTypes['products_contributors_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products_contributors'],
    ];
    contributors_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_filter']: {
    created_at?: ValueTypes['date_filter_operators'] | undefined | null;
    created_at_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    description?: ValueTypes['string_filter_operators'] | undefined | null;
    discord_url?: ValueTypes['string_filter_operators'] | undefined | null;
    eth_address?: ValueTypes['string_filter_operators'] | undefined | null;
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    logo?: ValueTypes['directus_files_filter'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    twitter_url?: ValueTypes['string_filter_operators'] | undefined | null;
    website_url?: ValueTypes['string_filter_operators'] | undefined | null;
    notion_id?: ValueTypes['string_filter_operators'] | undefined | null;
    products?: ValueTypes['products_filter'] | undefined | null;
    products_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    users?: ValueTypes['brands_directus_users_filter'] | undefined | null;
    users_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ValueTypes['brands_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['brands_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['products_filter']: {
    brand_id?: ValueTypes['brands_filter'] | undefined | null;
    brand_reward_share?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null;
    created_at?: ValueTypes['date_filter_operators'] | undefined | null;
    created_at_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    description?: ValueTypes['string_filter_operators'] | undefined | null;
    discord_channel_id?:
      | ValueTypes['string_filter_operators']
      | undefined
      | null;
    fulfiller_id?: ValueTypes['fulfillers_filter'] | undefined | null;
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    notion_id?: ValueTypes['string_filter_operators'] | undefined | null;
    price?: ValueTypes['price_currencies_filter'] | undefined | null;
    producer_id?: ValueTypes['producers_filter'] | undefined | null;
    production_cost?: ValueTypes['number_filter_operators'] | undefined | null;
    quantity?: ValueTypes['string_filter_operators'] | undefined | null;
    sale_type?: ValueTypes['string_filter_operators'] | undefined | null;
    shopify_id?: ValueTypes['string_filter_operators'] | undefined | null;
    status?: ValueTypes['string_filter_operators'] | undefined | null;
    season?: ValueTypes['number_filter_operators'] | undefined | null;
    release_date?: ValueTypes['date_filter_operators'] | undefined | null;
    release_date_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    clo3d_file?: ValueTypes['directus_files_filter'] | undefined | null;
    product_stage?: ValueTypes['stages_filter'] | undefined | null;
    nft_token_id?: ValueTypes['number_filter_operators'] | undefined | null;
    contributor_reward_share?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null;
    production_methods?:
      | ValueTypes['products_production_methods_filter']
      | undefined
      | null;
    production_methods_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    images?: ValueTypes['products_files_filter'] | undefined | null;
    images_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    materials?:
      | ValueTypes['products_production_materials_filter']
      | undefined
      | null;
    materials_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    wearable_files?: ValueTypes['products_wearables_filter'] | undefined | null;
    wearable_files_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    content?: ValueTypes['products_content_filter'] | undefined | null;
    content_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    design_files?:
      | ValueTypes['products_design_files_filter']
      | undefined
      | null;
    design_files_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    contributors?:
      | ValueTypes['products_contributors_filter']
      | undefined
      | null;
    contributors_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ValueTypes['products_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['products_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['fulfillers_filter']: {
    address?: ValueTypes['string_filter_operators'] | undefined | null;
    created_at?: ValueTypes['date_filter_operators'] | undefined | null;
    created_at_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    email?: ValueTypes['string_filter_operators'] | undefined | null;
    eth_address?: ValueTypes['string_filter_operators'] | undefined | null;
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    website_url?: ValueTypes['string_filter_operators'] | undefined | null;
    _and?:
      | Array<ValueTypes['fulfillers_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['fulfillers_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['price_currencies_filter']: {
    amount?: ValueTypes['number_filter_operators'] | undefined | null;
    currency?: ValueTypes['string_filter_operators'] | undefined | null;
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    _and?:
      | Array<ValueTypes['price_currencies_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['price_currencies_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['producers_filter']: {
    created_at?: ValueTypes['date_filter_operators'] | undefined | null;
    created_at_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    email?: ValueTypes['string_filter_operators'] | undefined | null;
    eth_address?: ValueTypes['string_filter_operators'] | undefined | null;
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    shipping_address?: ValueTypes['string_filter_operators'] | undefined | null;
    production_materials_stocked?:
      | ValueTypes['producers_production_materials_filter']
      | undefined
      | null;
    production_materials_stocked_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    production_methods?:
      | ValueTypes['producers_production_methods_filter']
      | undefined
      | null;
    production_methods_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    supplied_materials?:
      | ValueTypes['production_materials_filter']
      | undefined
      | null;
    supplied_materials_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ValueTypes['producers_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['producers_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['producers_production_materials_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    producers_id?: ValueTypes['producers_filter'] | undefined | null;
    production_materials_id?:
      | ValueTypes['production_materials_filter']
      | undefined
      | null;
    quantity?: ValueTypes['number_filter_operators'] | undefined | null;
    _and?:
      | Array<
          ValueTypes['producers_production_materials_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ValueTypes['producers_production_materials_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['production_materials_filter']: {
    base_price?: ValueTypes['number_filter_operators'] | undefined | null;
    color_palette?: ValueTypes['string_filter_operators'] | undefined | null;
    color_palette_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    composition?: ValueTypes['string_filter_operators'] | undefined | null;
    created_at?: ValueTypes['date_filter_operators'] | undefined | null;
    created_at_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    created_by?: ValueTypes['directus_users_filter'] | undefined | null;
    description?: ValueTypes['string_filter_operators'] | undefined | null;
    gender?: ValueTypes['string_filter_operators'] | undefined | null;
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    neck_tag?: ValueTypes['boolean_filter_operators'] | undefined | null;
    rating?: ValueTypes['string_filter_operators'] | undefined | null;
    size_guide?: ValueTypes['directus_files_filter'] | undefined | null;
    supplier?: ValueTypes['producers_filter'] | undefined | null;
    tags?: ValueTypes['string_filter_operators'] | undefined | null;
    tags_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    made_in?: ValueTypes['string_filter_operators'] | undefined | null;
    production_methods?:
      | ValueTypes['production_materials_production_methods_filter']
      | undefined
      | null;
    production_methods_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    stocked_at?:
      | ValueTypes['producers_production_materials_filter']
      | undefined
      | null;
    stocked_at_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ValueTypes['production_materials_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['production_materials_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['production_materials_production_methods_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    production_materials_id?:
      | ValueTypes['production_materials_filter']
      | undefined
      | null;
    production_methods_id?:
      | ValueTypes['production_methods_filter']
      | undefined
      | null;
    _and?:
      | Array<
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null
        >
      | undefined
      | null;
  };
  ['production_methods_filter']: {
    created_at?: ValueTypes['date_filter_operators'] | undefined | null;
    created_at_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    description?: ValueTypes['string_filter_operators'] | undefined | null;
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    producers?:
      | ValueTypes['producers_production_methods_filter']
      | undefined
      | null;
    producers_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    production_materials?:
      | ValueTypes['production_materials_production_methods_filter']
      | undefined
      | null;
    production_materials_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ValueTypes['production_methods_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['production_methods_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['producers_production_methods_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    producers_id?: ValueTypes['producers_filter'] | undefined | null;
    production_methods_id?:
      | ValueTypes['production_methods_filter']
      | undefined
      | null;
    _and?:
      | Array<
          ValueTypes['producers_production_methods_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ValueTypes['producers_production_methods_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['stages_filter']: {
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    sort?: ValueTypes['number_filter_operators'] | undefined | null;
    description?: ValueTypes['string_filter_operators'] | undefined | null;
    _and?:
      | Array<ValueTypes['stages_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['stages_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['products_production_methods_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    production_methods_id?:
      | ValueTypes['production_methods_filter']
      | undefined
      | null;
    products_id?: ValueTypes['products_filter'] | undefined | null;
    _and?:
      | Array<
          ValueTypes['products_production_methods_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ValueTypes['products_production_methods_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['products_files_filter']: {
    directus_files_id?: ValueTypes['directus_files_filter'] | undefined | null;
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    products_id?: ValueTypes['products_filter'] | undefined | null;
    _and?:
      | Array<ValueTypes['products_files_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['products_files_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['products_production_materials_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    products_id?: ValueTypes['products_filter'] | undefined | null;
    production_materials_id?:
      | ValueTypes['production_materials_filter']
      | undefined
      | null;
    _and?:
      | Array<
          ValueTypes['products_production_materials_filter'] | undefined | null
        >
      | undefined
      | null;
    _or?:
      | Array<
          ValueTypes['products_production_materials_filter'] | undefined | null
        >
      | undefined
      | null;
  };
  ['products_wearables_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    products_id?: ValueTypes['products_filter'] | undefined | null;
    directus_files_id?: ValueTypes['directus_files_filter'] | undefined | null;
    file_format?: ValueTypes['file_formats_filter'] | undefined | null;
    primary?: ValueTypes['boolean_filter_operators'] | undefined | null;
    _and?:
      | Array<ValueTypes['products_wearables_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['products_wearables_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['file_formats_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    mime_type?: ValueTypes['string_filter_operators'] | undefined | null;
    extension?: ValueTypes['string_filter_operators'] | undefined | null;
    description?: ValueTypes['string_filter_operators'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    _and?:
      | Array<ValueTypes['file_formats_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['file_formats_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['products_content_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    products_id?: ValueTypes['products_filter'] | undefined | null;
    directus_files_id?: ValueTypes['directus_files_filter'] | undefined | null;
    _and?:
      | Array<ValueTypes['products_content_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['products_content_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['products_design_files_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    products_id?: ValueTypes['products_filter'] | undefined | null;
    directus_files_id?: ValueTypes['directus_files_filter'] | undefined | null;
    _and?:
      | Array<ValueTypes['products_design_files_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['products_design_files_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['products_contributors_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    products_id?: ValueTypes['products_filter'] | undefined | null;
    collaborators_id?: ValueTypes['collaborators_filter'] | undefined | null;
    contribution_share?:
      | ValueTypes['number_filter_operators']
      | undefined
      | null;
    robot_earned?: ValueTypes['number_filter_operators'] | undefined | null;
    _and?:
      | Array<ValueTypes['products_contributors_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['products_contributors_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['brands_directus_users_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    brands_id?: ValueTypes['brands_filter'] | undefined | null;
    directus_users_id?: ValueTypes['directus_users_filter'] | undefined | null;
    _and?:
      | Array<ValueTypes['brands_directus_users_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['brands_directus_users_filter'] | undefined | null>
      | undefined
      | null;
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
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['producers_production_materials'],
    ];
    production_materials_stocked_func?: ValueTypes['count_functions'];
    production_methods?: [
      {
        filter?:
          | ValueTypes['producers_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['producers_production_methods'],
    ];
    production_methods_func?: ValueTypes['count_functions'];
    supplied_materials?: [
      {
        filter?: ValueTypes['production_materials_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
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
        filter?: ValueTypes['producers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['producers'],
    ];
    production_materials_id?: [
      {
        filter?: ValueTypes['production_materials_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
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
        filter?: ValueTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_users'],
    ];
    description?: boolean | `@${string}`;
    gender?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    neck_tag?: boolean | `@${string}`;
    rating?: boolean | `@${string}`;
    size_guide?: [
      {
        filter?: ValueTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_files'],
    ];
    supplier?: [
      {
        filter?: ValueTypes['producers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['producers'],
    ];
    tags?: boolean | `@${string}`;
    tags_func?: ValueTypes['count_functions'];
    made_in?: boolean | `@${string}`;
    production_methods?: [
      {
        filter?:
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['production_materials_production_methods'],
    ];
    production_methods_func?: ValueTypes['count_functions'];
    stocked_at?: [
      {
        filter?:
          | ValueTypes['producers_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['producers_production_materials'],
    ];
    stocked_at_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_production_methods']: AliasType<{
    id?: boolean | `@${string}`;
    production_materials_id?: [
      {
        filter?: ValueTypes['production_materials_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['production_materials'],
    ];
    production_methods_id?: [
      {
        filter?: ValueTypes['production_methods_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
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
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['producers_production_methods'],
    ];
    producers_func?: ValueTypes['count_functions'];
    production_materials?: [
      {
        filter?:
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
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
        filter?: ValueTypes['producers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['producers'],
    ];
    production_methods_id?: [
      {
        filter?: ValueTypes['production_methods_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['production_methods'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['stages']: AliasType<{
    name?: boolean | `@${string}`;
    sort?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_methods']: AliasType<{
    id?: boolean | `@${string}`;
    production_methods_id?: [
      {
        filter?: ValueTypes['production_methods_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['production_methods'],
    ];
    products_id?: [
      {
        filter?: ValueTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_files']: AliasType<{
    directus_files_id?: [
      {
        filter?: ValueTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_files'],
    ];
    id?: boolean | `@${string}`;
    products_id?: [
      {
        filter?: ValueTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_materials']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: [
      {
        filter?: ValueTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products'],
    ];
    production_materials_id?: [
      {
        filter?: ValueTypes['production_materials_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['production_materials'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_wearables']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: [
      {
        filter?: ValueTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products'],
    ];
    directus_files_id?: [
      {
        filter?: ValueTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_files'],
    ];
    file_format?: [
      {
        filter?: ValueTypes['file_formats_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['file_formats'],
    ];
    primary?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['file_formats']: AliasType<{
    id?: boolean | `@${string}`;
    mime_type?: boolean | `@${string}`;
    extension?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_content']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: [
      {
        filter?: ValueTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products'],
    ];
    directus_files_id?: [
      {
        filter?: ValueTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_files'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_design_files']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: [
      {
        filter?: ValueTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products'],
    ];
    directus_files_id?: [
      {
        filter?: ValueTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_files'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_contributors']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: [
      {
        filter?: ValueTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['products'],
    ];
    collaborators_id?: [
      {
        filter?: ValueTypes['collaborators_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['collaborators'],
    ];
    contribution_share?: boolean | `@${string}`;
    robot_earned?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_directus_users']: AliasType<{
    id?: boolean | `@${string}`;
    brands_id?: [
      {
        filter?: ValueTypes['brands_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['brands'],
    ];
    directus_users_id?: [
      {
        filter?: ValueTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_users'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['brands_aggregated_count'];
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
    twitter_url?: boolean | `@${string}`;
    website_url?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    products?: boolean | `@${string}`;
    users?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['producers_aggregated_count'];
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
    avg?: ValueTypes['producers_production_materials_aggregated_fields'];
    sum?: ValueTypes['producers_production_materials_aggregated_fields'];
    countDistinct?: ValueTypes['producers_production_materials_aggregated_fields'];
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
    quantity?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['producers_production_methods_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['producers_production_methods_aggregated_count'];
    avg?: ValueTypes['producers_production_methods_aggregated_fields'];
    sum?: ValueTypes['producers_production_methods_aggregated_fields'];
    countDistinct?: ValueTypes['producers_production_methods_aggregated_fields'];
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
    __typename?: boolean | `@${string}`;
  }>;
  ['production_methods_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['production_methods_aggregated_count'];
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
  ['collaborator_roles_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['collaborator_roles_aggregated_count'];
    avg?: ValueTypes['collaborator_roles_aggregated_fields'];
    sum?: ValueTypes['collaborator_roles_aggregated_fields'];
    countDistinct?: ValueTypes['collaborator_roles_aggregated_fields'];
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
  ['production_materials_production_methods_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['production_materials_production_methods_aggregated_count'];
    avg?: ValueTypes['production_materials_production_methods_aggregated_fields'];
    sum?: ValueTypes['production_materials_production_methods_aggregated_fields'];
    countDistinct?: ValueTypes['production_materials_production_methods_aggregated_fields'];
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
    __typename?: boolean | `@${string}`;
  }>;
  ['fulfillers_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['fulfillers_aggregated_count'];
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
    avg?: ValueTypes['price_currencies_aggregated_fields'];
    sum?: ValueTypes['price_currencies_aggregated_fields'];
    countDistinct?: ValueTypes['price_currencies_aggregated_fields'];
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
    __typename?: boolean | `@${string}`;
  }>;
  ['products_files_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_files_aggregated_count'];
    avg?: ValueTypes['products_files_aggregated_fields'];
    sum?: ValueTypes['products_files_aggregated_fields'];
    countDistinct?: ValueTypes['products_files_aggregated_fields'];
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
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_methods_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_production_methods_aggregated_count'];
    avg?: ValueTypes['products_production_methods_aggregated_fields'];
    sum?: ValueTypes['products_production_methods_aggregated_fields'];
    countDistinct?: ValueTypes['products_production_methods_aggregated_fields'];
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
    __typename?: boolean | `@${string}`;
  }>;
  ['skills_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['skills_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['skills_aggregated_count']: AliasType<{
    description?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['production_materials_aggregated_count'];
    avg?: ValueTypes['production_materials_aggregated_fields'];
    sum?: ValueTypes['production_materials_aggregated_fields'];
    countDistinct?: ValueTypes['production_materials_aggregated_fields'];
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
    name?: boolean | `@${string}`;
    neck_tag?: boolean | `@${string}`;
    rating?: boolean | `@${string}`;
    size_guide?: boolean | `@${string}`;
    supplier?: boolean | `@${string}`;
    tags?: boolean | `@${string}`;
    made_in?: boolean | `@${string}`;
    production_methods?: boolean | `@${string}`;
    stocked_at?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['production_materials_aggregated_fields']: AliasType<{
    base_price?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_aggregated_count'];
    avg?: ValueTypes['products_aggregated_fields'];
    sum?: ValueTypes['products_aggregated_fields'];
    countDistinct?: ValueTypes['products_aggregated_fields'];
    avgDistinct?: ValueTypes['products_aggregated_fields'];
    sumDistinct?: ValueTypes['products_aggregated_fields'];
    min?: ValueTypes['products_aggregated_fields'];
    max?: ValueTypes['products_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_aggregated_count']: AliasType<{
    brand_id?: boolean | `@${string}`;
    brand_reward_share?: boolean | `@${string}`;
    created_at?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    discord_channel_id?: boolean | `@${string}`;
    fulfiller_id?: boolean | `@${string}`;
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    notion_id?: boolean | `@${string}`;
    price?: boolean | `@${string}`;
    producer_id?: boolean | `@${string}`;
    production_cost?: boolean | `@${string}`;
    quantity?: boolean | `@${string}`;
    sale_type?: boolean | `@${string}`;
    shopify_id?: boolean | `@${string}`;
    status?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    release_date?: boolean | `@${string}`;
    clo3d_file?: boolean | `@${string}`;
    product_stage?: boolean | `@${string}`;
    nft_token_id?: boolean | `@${string}`;
    contributor_reward_share?: boolean | `@${string}`;
    production_methods?: boolean | `@${string}`;
    images?: boolean | `@${string}`;
    materials?: boolean | `@${string}`;
    wearable_files?: boolean | `@${string}`;
    content?: boolean | `@${string}`;
    design_files?: boolean | `@${string}`;
    contributors?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_aggregated_fields']: AliasType<{
    brand_reward_share?: boolean | `@${string}`;
    production_cost?: boolean | `@${string}`;
    season?: boolean | `@${string}`;
    nft_token_id?: boolean | `@${string}`;
    contributor_reward_share?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_materials_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_production_materials_aggregated_count'];
    avg?: ValueTypes['products_production_materials_aggregated_fields'];
    sum?: ValueTypes['products_production_materials_aggregated_fields'];
    countDistinct?: ValueTypes['products_production_materials_aggregated_fields'];
    avgDistinct?: ValueTypes['products_production_materials_aggregated_fields'];
    sumDistinct?: ValueTypes['products_production_materials_aggregated_fields'];
    min?: ValueTypes['products_production_materials_aggregated_fields'];
    max?: ValueTypes['products_production_materials_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_materials_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    production_materials_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_production_materials_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_wearables_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_wearables_aggregated_count'];
    avg?: ValueTypes['products_wearables_aggregated_fields'];
    sum?: ValueTypes['products_wearables_aggregated_fields'];
    countDistinct?: ValueTypes['products_wearables_aggregated_fields'];
    avgDistinct?: ValueTypes['products_wearables_aggregated_fields'];
    sumDistinct?: ValueTypes['products_wearables_aggregated_fields'];
    min?: ValueTypes['products_wearables_aggregated_fields'];
    max?: ValueTypes['products_wearables_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_wearables_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    directus_files_id?: boolean | `@${string}`;
    file_format?: boolean | `@${string}`;
    primary?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_wearables_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    file_format?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['file_formats_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['file_formats_aggregated_count'];
    avg?: ValueTypes['file_formats_aggregated_fields'];
    sum?: ValueTypes['file_formats_aggregated_fields'];
    countDistinct?: ValueTypes['file_formats_aggregated_fields'];
    avgDistinct?: ValueTypes['file_formats_aggregated_fields'];
    sumDistinct?: ValueTypes['file_formats_aggregated_fields'];
    min?: ValueTypes['file_formats_aggregated_fields'];
    max?: ValueTypes['file_formats_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['file_formats_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    mime_type?: boolean | `@${string}`;
    extension?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['file_formats_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_design_files_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_design_files_aggregated_count'];
    avg?: ValueTypes['products_design_files_aggregated_fields'];
    sum?: ValueTypes['products_design_files_aggregated_fields'];
    countDistinct?: ValueTypes['products_design_files_aggregated_fields'];
    avgDistinct?: ValueTypes['products_design_files_aggregated_fields'];
    sumDistinct?: ValueTypes['products_design_files_aggregated_fields'];
    min?: ValueTypes['products_design_files_aggregated_fields'];
    max?: ValueTypes['products_design_files_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_design_files_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    directus_files_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_design_files_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_content_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_content_aggregated_count'];
    avg?: ValueTypes['products_content_aggregated_fields'];
    sum?: ValueTypes['products_content_aggregated_fields'];
    countDistinct?: ValueTypes['products_content_aggregated_fields'];
    avgDistinct?: ValueTypes['products_content_aggregated_fields'];
    sumDistinct?: ValueTypes['products_content_aggregated_fields'];
    min?: ValueTypes['products_content_aggregated_fields'];
    max?: ValueTypes['products_content_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_content_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    directus_files_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_content_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['stages_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['stages_aggregated_count'];
    avg?: ValueTypes['stages_aggregated_fields'];
    sum?: ValueTypes['stages_aggregated_fields'];
    countDistinct?: ValueTypes['stages_aggregated_fields'];
    avgDistinct?: ValueTypes['stages_aggregated_fields'];
    sumDistinct?: ValueTypes['stages_aggregated_fields'];
    min?: ValueTypes['stages_aggregated_fields'];
    max?: ValueTypes['stages_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['stages_aggregated_count']: AliasType<{
    name?: boolean | `@${string}`;
    sort?: boolean | `@${string}`;
    description?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['stages_aggregated_fields']: AliasType<{
    sort?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['junction_directus_users_skills_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['junction_directus_users_skills_aggregated_count'];
    avg?: ValueTypes['junction_directus_users_skills_aggregated_fields'];
    sum?: ValueTypes['junction_directus_users_skills_aggregated_fields'];
    countDistinct?: ValueTypes['junction_directus_users_skills_aggregated_fields'];
    avgDistinct?: ValueTypes['junction_directus_users_skills_aggregated_fields'];
    sumDistinct?: ValueTypes['junction_directus_users_skills_aggregated_fields'];
    min?: ValueTypes['junction_directus_users_skills_aggregated_fields'];
    max?: ValueTypes['junction_directus_users_skills_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['junction_directus_users_skills_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    directus_users_id?: boolean | `@${string}`;
    skills_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['junction_directus_users_skills_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborators_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['collaborators_aggregated_count'];
    avg?: ValueTypes['collaborators_aggregated_fields'];
    sum?: ValueTypes['collaborators_aggregated_fields'];
    countDistinct?: ValueTypes['collaborators_aggregated_fields'];
    avgDistinct?: ValueTypes['collaborators_aggregated_fields'];
    sumDistinct?: ValueTypes['collaborators_aggregated_fields'];
    min?: ValueTypes['collaborators_aggregated_fields'];
    max?: ValueTypes['collaborators_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborators_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    user_created?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    date_updated?: boolean | `@${string}`;
    account?: boolean | `@${string}`;
    display_name?: boolean | `@${string}`;
    payment_eth_address?: boolean | `@${string}`;
    role?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['collaborators_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    role?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_directus_users_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['brands_directus_users_aggregated_count'];
    avg?: ValueTypes['brands_directus_users_aggregated_fields'];
    sum?: ValueTypes['brands_directus_users_aggregated_fields'];
    countDistinct?: ValueTypes['brands_directus_users_aggregated_fields'];
    avgDistinct?: ValueTypes['brands_directus_users_aggregated_fields'];
    sumDistinct?: ValueTypes['brands_directus_users_aggregated_fields'];
    min?: ValueTypes['brands_directus_users_aggregated_fields'];
    max?: ValueTypes['brands_directus_users_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_directus_users_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    brands_id?: boolean | `@${string}`;
    directus_users_id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['brands_directus_users_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_contributors_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['products_contributors_aggregated_count'];
    avg?: ValueTypes['products_contributors_aggregated_fields'];
    sum?: ValueTypes['products_contributors_aggregated_fields'];
    countDistinct?: ValueTypes['products_contributors_aggregated_fields'];
    avgDistinct?: ValueTypes['products_contributors_aggregated_fields'];
    sumDistinct?: ValueTypes['products_contributors_aggregated_fields'];
    min?: ValueTypes['products_contributors_aggregated_fields'];
    max?: ValueTypes['products_contributors_aggregated_fields'];
    __typename?: boolean | `@${string}`;
  }>;
  ['products_contributors_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    products_id?: boolean | `@${string}`;
    collaborators_id?: boolean | `@${string}`;
    contribution_share?: boolean | `@${string}`;
    robot_earned?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['products_contributors_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    collaborators_id?: boolean | `@${string}`;
    contribution_share?: boolean | `@${string}`;
    robot_earned?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['Mutation']: AliasType<{
    create_brands_items?: [
      {
        filter?: ValueTypes['brands_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?: Array<ValueTypes['create_brands_input']> | undefined | null;
      },
      ValueTypes['brands'],
    ];
    create_brands_item?: [
      { data: ValueTypes['create_brands_input'] },
      ValueTypes['brands'],
    ];
    create_producers_items?: [
      {
        filter?: ValueTypes['producers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?: Array<ValueTypes['create_producers_input']> | undefined | null;
      },
      ValueTypes['producers'],
    ];
    create_producers_item?: [
      { data: ValueTypes['create_producers_input'] },
      ValueTypes['producers'],
    ];
    create_producers_production_materials_items?: [
      {
        filter?:
          | ValueTypes['producers_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_producers_production_materials_input']>
          | undefined
          | null;
      },
      ValueTypes['producers_production_materials'],
    ];
    create_producers_production_materials_item?: [
      { data: ValueTypes['create_producers_production_materials_input'] },
      ValueTypes['producers_production_materials'],
    ];
    create_producers_production_methods_items?: [
      {
        filter?:
          | ValueTypes['producers_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_producers_production_methods_input']>
          | undefined
          | null;
      },
      ValueTypes['producers_production_methods'],
    ];
    create_producers_production_methods_item?: [
      { data: ValueTypes['create_producers_production_methods_input'] },
      ValueTypes['producers_production_methods'],
    ];
    create_production_methods_items?: [
      {
        filter?: ValueTypes['production_methods_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_production_methods_input']>
          | undefined
          | null;
      },
      ValueTypes['production_methods'],
    ];
    create_production_methods_item?: [
      { data: ValueTypes['create_production_methods_input'] },
      ValueTypes['production_methods'],
    ];
    create_collaborator_roles_items?: [
      {
        filter?: ValueTypes['collaborator_roles_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_collaborator_roles_input']>
          | undefined
          | null;
      },
      ValueTypes['collaborator_roles'],
    ];
    create_collaborator_roles_item?: [
      { data: ValueTypes['create_collaborator_roles_input'] },
      ValueTypes['collaborator_roles'],
    ];
    create_production_materials_production_methods_items?: [
      {
        filter?:
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<
              ValueTypes['create_production_materials_production_methods_input']
            >
          | undefined
          | null;
      },
      ValueTypes['production_materials_production_methods'],
    ];
    create_production_materials_production_methods_item?: [
      {
        data: ValueTypes['create_production_materials_production_methods_input'];
      },
      ValueTypes['production_materials_production_methods'],
    ];
    create_fulfillers_items?: [
      {
        filter?: ValueTypes['fulfillers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?: Array<ValueTypes['create_fulfillers_input']> | undefined | null;
      },
      ValueTypes['fulfillers'],
    ];
    create_fulfillers_item?: [
      { data: ValueTypes['create_fulfillers_input'] },
      ValueTypes['fulfillers'],
    ];
    create_price_currencies_items?: [
      {
        filter?: ValueTypes['price_currencies_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_price_currencies_input']>
          | undefined
          | null;
      },
      ValueTypes['price_currencies'],
    ];
    create_price_currencies_item?: [
      { data: ValueTypes['create_price_currencies_input'] },
      ValueTypes['price_currencies'],
    ];
    create_products_files_items?: [
      {
        filter?: ValueTypes['products_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_products_files_input']>
          | undefined
          | null;
      },
      ValueTypes['products_files'],
    ];
    create_products_files_item?: [
      { data: ValueTypes['create_products_files_input'] },
      ValueTypes['products_files'],
    ];
    create_products_production_methods_items?: [
      {
        filter?:
          | ValueTypes['products_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_products_production_methods_input']>
          | undefined
          | null;
      },
      ValueTypes['products_production_methods'],
    ];
    create_products_production_methods_item?: [
      { data: ValueTypes['create_products_production_methods_input'] },
      ValueTypes['products_production_methods'],
    ];
    create_skills_items?: [
      {
        filter?: ValueTypes['skills_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?: Array<ValueTypes['create_skills_input']> | undefined | null;
      },
      ValueTypes['skills'],
    ];
    create_skills_item?: [
      { data: ValueTypes['create_skills_input'] },
      ValueTypes['skills'],
    ];
    create_production_materials_items?: [
      {
        filter?: ValueTypes['production_materials_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_production_materials_input']>
          | undefined
          | null;
      },
      ValueTypes['production_materials'],
    ];
    create_production_materials_item?: [
      { data: ValueTypes['create_production_materials_input'] },
      ValueTypes['production_materials'],
    ];
    create_products_items?: [
      {
        filter?: ValueTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?: Array<ValueTypes['create_products_input']> | undefined | null;
      },
      ValueTypes['products'],
    ];
    create_products_item?: [
      { data: ValueTypes['create_products_input'] },
      ValueTypes['products'],
    ];
    create_products_production_materials_items?: [
      {
        filter?:
          | ValueTypes['products_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_products_production_materials_input']>
          | undefined
          | null;
      },
      ValueTypes['products_production_materials'],
    ];
    create_products_production_materials_item?: [
      { data: ValueTypes['create_products_production_materials_input'] },
      ValueTypes['products_production_materials'],
    ];
    create_products_wearables_items?: [
      {
        filter?: ValueTypes['products_wearables_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_products_wearables_input']>
          | undefined
          | null;
      },
      ValueTypes['products_wearables'],
    ];
    create_products_wearables_item?: [
      { data: ValueTypes['create_products_wearables_input'] },
      ValueTypes['products_wearables'],
    ];
    create_file_formats_items?: [
      {
        filter?: ValueTypes['file_formats_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_file_formats_input']>
          | undefined
          | null;
      },
      ValueTypes['file_formats'],
    ];
    create_file_formats_item?: [
      { data: ValueTypes['create_file_formats_input'] },
      ValueTypes['file_formats'],
    ];
    create_products_design_files_items?: [
      {
        filter?: ValueTypes['products_design_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_products_design_files_input']>
          | undefined
          | null;
      },
      ValueTypes['products_design_files'],
    ];
    create_products_design_files_item?: [
      { data: ValueTypes['create_products_design_files_input'] },
      ValueTypes['products_design_files'],
    ];
    create_products_content_items?: [
      {
        filter?: ValueTypes['products_content_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_products_content_input']>
          | undefined
          | null;
      },
      ValueTypes['products_content'],
    ];
    create_products_content_item?: [
      { data: ValueTypes['create_products_content_input'] },
      ValueTypes['products_content'],
    ];
    create_stages_items?: [
      {
        filter?: ValueTypes['stages_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?: Array<ValueTypes['create_stages_input']> | undefined | null;
      },
      ValueTypes['stages'],
    ];
    create_stages_item?: [
      { data: ValueTypes['create_stages_input'] },
      ValueTypes['stages'],
    ];
    create_junction_directus_users_skills_items?: [
      {
        filter?:
          | ValueTypes['junction_directus_users_skills_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_junction_directus_users_skills_input']>
          | undefined
          | null;
      },
      ValueTypes['junction_directus_users_skills'],
    ];
    create_junction_directus_users_skills_item?: [
      { data: ValueTypes['create_junction_directus_users_skills_input'] },
      ValueTypes['junction_directus_users_skills'],
    ];
    create_collaborators_items?: [
      {
        filter?: ValueTypes['collaborators_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_collaborators_input']>
          | undefined
          | null;
      },
      ValueTypes['collaborators'],
    ];
    create_collaborators_item?: [
      { data: ValueTypes['create_collaborators_input'] },
      ValueTypes['collaborators'],
    ];
    create_brands_directus_users_items?: [
      {
        filter?: ValueTypes['brands_directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_brands_directus_users_input']>
          | undefined
          | null;
      },
      ValueTypes['brands_directus_users'],
    ];
    create_brands_directus_users_item?: [
      { data: ValueTypes['create_brands_directus_users_input'] },
      ValueTypes['brands_directus_users'],
    ];
    create_products_contributors_items?: [
      {
        filter?: ValueTypes['products_contributors_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_products_contributors_input']>
          | undefined
          | null;
      },
      ValueTypes['products_contributors'],
    ];
    create_products_contributors_item?: [
      { data: ValueTypes['create_products_contributors_input'] },
      ValueTypes['products_contributors'],
    ];
    update_brands_items?: [
      {
        filter?: ValueTypes['brands_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_brands_input'];
      },
      ValueTypes['brands'],
    ];
    update_brands_item?: [
      { id: string; data: ValueTypes['update_brands_input'] },
      ValueTypes['brands'],
    ];
    update_producers_items?: [
      {
        filter?: ValueTypes['producers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_producers_input'];
      },
      ValueTypes['producers'],
    ];
    update_producers_item?: [
      { id: string; data: ValueTypes['update_producers_input'] },
      ValueTypes['producers'],
    ];
    update_producers_production_materials_items?: [
      {
        filter?:
          | ValueTypes['producers_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_producers_production_materials_input'];
      },
      ValueTypes['producers_production_materials'],
    ];
    update_producers_production_materials_item?: [
      {
        id: string;
        data: ValueTypes['update_producers_production_materials_input'];
      },
      ValueTypes['producers_production_materials'],
    ];
    update_producers_production_methods_items?: [
      {
        filter?:
          | ValueTypes['producers_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_producers_production_methods_input'];
      },
      ValueTypes['producers_production_methods'],
    ];
    update_producers_production_methods_item?: [
      {
        id: string;
        data: ValueTypes['update_producers_production_methods_input'];
      },
      ValueTypes['producers_production_methods'],
    ];
    update_production_methods_items?: [
      {
        filter?: ValueTypes['production_methods_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_production_methods_input'];
      },
      ValueTypes['production_methods'],
    ];
    update_production_methods_item?: [
      { id: string; data: ValueTypes['update_production_methods_input'] },
      ValueTypes['production_methods'],
    ];
    update_collaborator_roles_items?: [
      {
        filter?: ValueTypes['collaborator_roles_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_collaborator_roles_input'];
      },
      ValueTypes['collaborator_roles'],
    ];
    update_collaborator_roles_item?: [
      { id: string; data: ValueTypes['update_collaborator_roles_input'] },
      ValueTypes['collaborator_roles'],
    ];
    update_production_materials_production_methods_items?: [
      {
        filter?:
          | ValueTypes['production_materials_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_production_materials_production_methods_input'];
      },
      ValueTypes['production_materials_production_methods'],
    ];
    update_production_materials_production_methods_item?: [
      {
        id: string;
        data: ValueTypes['update_production_materials_production_methods_input'];
      },
      ValueTypes['production_materials_production_methods'],
    ];
    update_fulfillers_items?: [
      {
        filter?: ValueTypes['fulfillers_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_fulfillers_input'];
      },
      ValueTypes['fulfillers'],
    ];
    update_fulfillers_item?: [
      { id: string; data: ValueTypes['update_fulfillers_input'] },
      ValueTypes['fulfillers'],
    ];
    update_price_currencies_items?: [
      {
        filter?: ValueTypes['price_currencies_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_price_currencies_input'];
      },
      ValueTypes['price_currencies'],
    ];
    update_price_currencies_item?: [
      { id: string; data: ValueTypes['update_price_currencies_input'] },
      ValueTypes['price_currencies'],
    ];
    update_products_files_items?: [
      {
        filter?: ValueTypes['products_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_products_files_input'];
      },
      ValueTypes['products_files'],
    ];
    update_products_files_item?: [
      { id: string; data: ValueTypes['update_products_files_input'] },
      ValueTypes['products_files'],
    ];
    update_products_production_methods_items?: [
      {
        filter?:
          | ValueTypes['products_production_methods_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_products_production_methods_input'];
      },
      ValueTypes['products_production_methods'],
    ];
    update_products_production_methods_item?: [
      {
        id: string;
        data: ValueTypes['update_products_production_methods_input'];
      },
      ValueTypes['products_production_methods'],
    ];
    update_skills_items?: [
      {
        filter?: ValueTypes['skills_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_skills_input'];
      },
      ValueTypes['skills'],
    ];
    update_skills_item?: [
      { id: string; data: ValueTypes['update_skills_input'] },
      ValueTypes['skills'],
    ];
    update_production_materials_items?: [
      {
        filter?: ValueTypes['production_materials_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_production_materials_input'];
      },
      ValueTypes['production_materials'],
    ];
    update_production_materials_item?: [
      { id: string; data: ValueTypes['update_production_materials_input'] },
      ValueTypes['production_materials'],
    ];
    update_products_items?: [
      {
        filter?: ValueTypes['products_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_products_input'];
      },
      ValueTypes['products'],
    ];
    update_products_item?: [
      { id: string; data: ValueTypes['update_products_input'] },
      ValueTypes['products'],
    ];
    update_products_production_materials_items?: [
      {
        filter?:
          | ValueTypes['products_production_materials_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_products_production_materials_input'];
      },
      ValueTypes['products_production_materials'],
    ];
    update_products_production_materials_item?: [
      {
        id: string;
        data: ValueTypes['update_products_production_materials_input'];
      },
      ValueTypes['products_production_materials'],
    ];
    update_products_wearables_items?: [
      {
        filter?: ValueTypes['products_wearables_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_products_wearables_input'];
      },
      ValueTypes['products_wearables'],
    ];
    update_products_wearables_item?: [
      { id: string; data: ValueTypes['update_products_wearables_input'] },
      ValueTypes['products_wearables'],
    ];
    update_file_formats_items?: [
      {
        filter?: ValueTypes['file_formats_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_file_formats_input'];
      },
      ValueTypes['file_formats'],
    ];
    update_file_formats_item?: [
      { id: string; data: ValueTypes['update_file_formats_input'] },
      ValueTypes['file_formats'],
    ];
    update_products_design_files_items?: [
      {
        filter?: ValueTypes['products_design_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_products_design_files_input'];
      },
      ValueTypes['products_design_files'],
    ];
    update_products_design_files_item?: [
      { id: string; data: ValueTypes['update_products_design_files_input'] },
      ValueTypes['products_design_files'],
    ];
    update_products_content_items?: [
      {
        filter?: ValueTypes['products_content_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_products_content_input'];
      },
      ValueTypes['products_content'],
    ];
    update_products_content_item?: [
      { id: string; data: ValueTypes['update_products_content_input'] },
      ValueTypes['products_content'],
    ];
    update_stages_items?: [
      {
        filter?: ValueTypes['stages_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_stages_input'];
      },
      ValueTypes['stages'],
    ];
    update_stages_item?: [
      { id: string; data: ValueTypes['update_stages_input'] },
      ValueTypes['stages'],
    ];
    update_junction_directus_users_skills_items?: [
      {
        filter?:
          | ValueTypes['junction_directus_users_skills_filter']
          | undefined
          | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_junction_directus_users_skills_input'];
      },
      ValueTypes['junction_directus_users_skills'],
    ];
    update_junction_directus_users_skills_item?: [
      {
        id: string;
        data: ValueTypes['update_junction_directus_users_skills_input'];
      },
      ValueTypes['junction_directus_users_skills'],
    ];
    update_collaborators_items?: [
      {
        filter?: ValueTypes['collaborators_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_collaborators_input'];
      },
      ValueTypes['collaborators'],
    ];
    update_collaborators_item?: [
      { id: string; data: ValueTypes['update_collaborators_input'] },
      ValueTypes['collaborators'],
    ];
    update_brands_directus_users_items?: [
      {
        filter?: ValueTypes['brands_directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_brands_directus_users_input'];
      },
      ValueTypes['brands_directus_users'],
    ];
    update_brands_directus_users_item?: [
      { id: string; data: ValueTypes['update_brands_directus_users_input'] },
      ValueTypes['brands_directus_users'],
    ];
    update_products_contributors_items?: [
      {
        filter?: ValueTypes['products_contributors_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_products_contributors_input'];
      },
      ValueTypes['products_contributors'],
    ];
    update_products_contributors_item?: [
      { id: string; data: ValueTypes['update_products_contributors_input'] },
      ValueTypes['products_contributors'],
    ];
    delete_brands_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_brands_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_producers_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_producers_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_producers_production_materials_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_producers_production_materials_item?: [
      { id: string },
      ValueTypes['delete_one'],
    ];
    delete_producers_production_methods_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_producers_production_methods_item?: [
      { id: string },
      ValueTypes['delete_one'],
    ];
    delete_production_methods_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_production_methods_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_collaborator_roles_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_collaborator_roles_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_production_materials_production_methods_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_production_materials_production_methods_item?: [
      { id: string },
      ValueTypes['delete_one'],
    ];
    delete_fulfillers_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_fulfillers_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_price_currencies_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_price_currencies_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_products_files_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_products_files_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_products_production_methods_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_products_production_methods_item?: [
      { id: string },
      ValueTypes['delete_one'],
    ];
    delete_skills_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_skills_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_production_materials_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_production_materials_item?: [
      { id: string },
      ValueTypes['delete_one'],
    ];
    delete_products_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_products_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_products_production_materials_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_products_production_materials_item?: [
      { id: string },
      ValueTypes['delete_one'],
    ];
    delete_products_wearables_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_products_wearables_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_file_formats_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_file_formats_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_products_design_files_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_products_design_files_item?: [
      { id: string },
      ValueTypes['delete_one'],
    ];
    delete_products_content_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_products_content_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_stages_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_stages_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_junction_directus_users_skills_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_junction_directus_users_skills_item?: [
      { id: string },
      ValueTypes['delete_one'],
    ];
    delete_collaborators_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_collaborators_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_brands_directus_users_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_brands_directus_users_item?: [
      { id: string },
      ValueTypes['delete_one'],
    ];
    delete_products_contributors_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_products_contributors_item?: [
      { id: string },
      ValueTypes['delete_one'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['create_brands_input']: {
    created_at?: ValueTypes['Date'] | undefined | null;
    created_at_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    description?: string | undefined | null;
    discord_url?: string | undefined | null;
    eth_address?: string | undefined | null;
    id?: string | undefined | null;
    logo?: ValueTypes['create_directus_files_input'] | undefined | null;
    name: string;
    twitter_url?: string | undefined | null;
    website_url?: string | undefined | null;
    notion_id?: string | undefined | null;
    products?:
      | Array<ValueTypes['create_products_input'] | undefined | null>
      | undefined
      | null;
    products_func?: ValueTypes['count_functionsInput'] | undefined | null;
    users?:
      | Array<
          ValueTypes['create_brands_directus_users_input'] | undefined | null
        >
      | undefined
      | null;
    users_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['datetime_functionsInput']: {
    year?: number | undefined | null;
    month?: number | undefined | null;
    week?: number | undefined | null;
    day?: number | undefined | null;
    weekday?: number | undefined | null;
    hour?: number | undefined | null;
    minute?: number | undefined | null;
    second?: number | undefined | null;
  };
  ['create_directus_files_input']: {
    id?: string | undefined | null;
    storage: string;
    filename_disk?: string | undefined | null;
    filename_download: string;
    title?: string | undefined | null;
    type?: string | undefined | null;
    folder?: ValueTypes['create_directus_folders_input'] | undefined | null;
    uploaded_by?: ValueTypes['create_directus_users_input'] | undefined | null;
    uploaded_on: ValueTypes['Date'];
    uploaded_on_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    modified_by?: ValueTypes['create_directus_users_input'] | undefined | null;
    modified_on: ValueTypes['Date'];
    modified_on_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    charset?: string | undefined | null;
    filesize?: string | undefined | null;
    width?: number | undefined | null;
    height?: number | undefined | null;
    duration?: number | undefined | null;
    embed?: string | undefined | null;
    description?: string | undefined | null;
    location?: string | undefined | null;
    tags?: ValueTypes['JSON'] | undefined | null;
    tags_func?: ValueTypes['count_functionsInput'] | undefined | null;
    metadata?: ValueTypes['JSON'] | undefined | null;
    metadata_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['create_directus_folders_input']: {
    id?: string | undefined | null;
    name: string;
    parent?: ValueTypes['create_directus_folders_input'] | undefined | null;
  };
  ['create_directus_users_input']: {
    id?: string | undefined | null;
    first_name?: string | undefined | null;
    last_name?: string | undefined | null;
    email?: string | undefined | null;
    password?: string | undefined | null;
    location?: string | undefined | null;
    title?: string | undefined | null;
    description?: string | undefined | null;
    tags?: ValueTypes['JSON'] | undefined | null;
    tags_func?: ValueTypes['count_functionsInput'] | undefined | null;
    avatar?: ValueTypes['create_directus_files_input'] | undefined | null;
    language?: string | undefined | null;
    theme?: string | undefined | null;
    tfa_secret?: string | undefined | null;
    status: string;
    role?: ValueTypes['create_directus_roles_input'] | undefined | null;
    token?: string | undefined | null;
    last_access?: ValueTypes['Date'] | undefined | null;
    last_access_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    last_page?: string | undefined | null;
    provider: string;
    external_identifier?: string | undefined | null;
    auth_data?: ValueTypes['JSON'] | undefined | null;
    auth_data_func?: ValueTypes['count_functionsInput'] | undefined | null;
    email_notifications?: boolean | undefined | null;
    timezone?: string | undefined | null;
    discord_handle?: string | undefined | null;
    twitter_handle?: string | undefined | null;
    discord_id?: string | undefined | null;
    collaborators?:
      | Array<ValueTypes['create_collaborators_input'] | undefined | null>
      | undefined
      | null;
    collaborators_func?: ValueTypes['count_functionsInput'] | undefined | null;
    skills?:
      | Array<
          | ValueTypes['create_junction_directus_users_skills_input']
          | undefined
          | null
        >
      | undefined
      | null;
    skills_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['count_functionsInput']: {
    count?: number | undefined | null;
  };
  ['create_directus_roles_input']: {
    id?: string | undefined | null;
    name: string;
    icon: string;
    description?: string | undefined | null;
    ip_access?: Array<string | undefined | null> | undefined | null;
    enforce_tfa: boolean;
    admin_access: boolean;
    app_access: boolean;
    users?:
      | Array<ValueTypes['create_directus_users_input'] | undefined | null>
      | undefined
      | null;
    users_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['create_collaborators_input']: {
    id?: string | undefined | null;
    user_created?: ValueTypes['create_directus_users_input'] | undefined | null;
    date_created?: ValueTypes['Date'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    date_updated?: ValueTypes['Date'] | undefined | null;
    date_updated_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    account?: ValueTypes['create_directus_users_input'] | undefined | null;
    display_name?: string | undefined | null;
    payment_eth_address?: string | undefined | null;
    role?: ValueTypes['create_collaborator_roles_input'] | undefined | null;
  };
  ['create_collaborator_roles_input']: {
    description?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
  };
  ['create_junction_directus_users_skills_input']: {
    id?: string | undefined | null;
    directus_users_id?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null;
    skills_id?: ValueTypes['create_skills_input'] | undefined | null;
  };
  ['create_skills_input']: {
    description?: string | undefined | null;
    id?: string | undefined | null;
    name: string;
  };
  ['create_products_input']: {
    brand_id?: ValueTypes['create_brands_input'] | undefined | null;
    brand_reward_share?: number | undefined | null;
    created_at?: ValueTypes['Date'] | undefined | null;
    created_at_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    description?: string | undefined | null;
    discord_channel_id?: string | undefined | null;
    fulfiller_id?: ValueTypes['create_fulfillers_input'] | undefined | null;
    id?: string | undefined | null;
    name: string;
    notion_id?: string | undefined | null;
    price?: ValueTypes['create_price_currencies_input'] | undefined | null;
    producer_id?: ValueTypes['create_producers_input'] | undefined | null;
    production_cost?: number | undefined | null;
    quantity?: string | undefined | null;
    sale_type?: string | undefined | null;
    shopify_id?: string | undefined | null;
    status?: string | undefined | null;
    season?: number | undefined | null;
    release_date?: ValueTypes['Date'] | undefined | null;
    release_date_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    clo3d_file?: ValueTypes['create_directus_files_input'] | undefined | null;
    product_stage?: ValueTypes['create_stages_input'] | undefined | null;
    nft_token_id?: number | undefined | null;
    contributor_reward_share?: number | undefined | null;
    production_methods?:
      | Array<
          | ValueTypes['create_products_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_methods_func?:
      | ValueTypes['count_functionsInput']
      | undefined
      | null;
    images?:
      | Array<ValueTypes['create_products_files_input'] | undefined | null>
      | undefined
      | null;
    images_func?: ValueTypes['count_functionsInput'] | undefined | null;
    materials?:
      | Array<
          | ValueTypes['create_products_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null;
    materials_func?: ValueTypes['count_functionsInput'] | undefined | null;
    wearable_files?:
      | Array<ValueTypes['create_products_wearables_input'] | undefined | null>
      | undefined
      | null;
    wearable_files_func?: ValueTypes['count_functionsInput'] | undefined | null;
    content?:
      | Array<ValueTypes['create_products_content_input'] | undefined | null>
      | undefined
      | null;
    content_func?: ValueTypes['count_functionsInput'] | undefined | null;
    design_files?:
      | Array<
          ValueTypes['create_products_design_files_input'] | undefined | null
        >
      | undefined
      | null;
    design_files_func?: ValueTypes['count_functionsInput'] | undefined | null;
    contributors?:
      | Array<
          ValueTypes['create_products_contributors_input'] | undefined | null
        >
      | undefined
      | null;
    contributors_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['create_fulfillers_input']: {
    address?: string | undefined | null;
    created_at?: ValueTypes['Date'] | undefined | null;
    created_at_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
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
    created_at: ValueTypes['Date'];
    created_at_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    email?: string | undefined | null;
    eth_address?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
    shipping_address?: string | undefined | null;
    production_materials_stocked?:
      | Array<
          | ValueTypes['create_producers_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_materials_stocked_func?:
      | ValueTypes['count_functionsInput']
      | undefined
      | null;
    production_methods?:
      | Array<
          | ValueTypes['create_producers_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_methods_func?:
      | ValueTypes['count_functionsInput']
      | undefined
      | null;
    supplied_materials?:
      | Array<
          ValueTypes['create_production_materials_input'] | undefined | null
        >
      | undefined
      | null;
    supplied_materials_func?:
      | ValueTypes['count_functionsInput']
      | undefined
      | null;
  };
  ['create_producers_production_materials_input']: {
    id?: string | undefined | null;
    producers_id?: ValueTypes['create_producers_input'] | undefined | null;
    production_materials_id?:
      | ValueTypes['create_production_materials_input']
      | undefined
      | null;
    quantity?: number | undefined | null;
  };
  ['create_production_materials_input']: {
    base_price?: number | undefined | null;
    color_palette?: ValueTypes['JSON'] | undefined | null;
    color_palette_func?: ValueTypes['count_functionsInput'] | undefined | null;
    composition?: string | undefined | null;
    created_at: ValueTypes['Date'];
    created_at_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    created_by?: ValueTypes['create_directus_users_input'] | undefined | null;
    description?: string | undefined | null;
    gender?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
    neck_tag?: boolean | undefined | null;
    rating?: string | undefined | null;
    size_guide?: ValueTypes['create_directus_files_input'] | undefined | null;
    supplier?: ValueTypes['create_producers_input'] | undefined | null;
    tags?: ValueTypes['JSON'] | undefined | null;
    tags_func?: ValueTypes['count_functionsInput'] | undefined | null;
    made_in?: string | undefined | null;
    production_methods?:
      | Array<
          | ValueTypes['create_production_materials_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_methods_func?:
      | ValueTypes['count_functionsInput']
      | undefined
      | null;
    stocked_at?:
      | Array<
          | ValueTypes['create_producers_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null;
    stocked_at_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['create_production_materials_production_methods_input']: {
    id?: string | undefined | null;
    production_materials_id?:
      | ValueTypes['create_production_materials_input']
      | undefined
      | null;
    production_methods_id?:
      | ValueTypes['create_production_methods_input']
      | undefined
      | null;
  };
  ['create_production_methods_input']: {
    created_at: ValueTypes['Date'];
    created_at_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    description?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
    producers?:
      | Array<
          | ValueTypes['create_producers_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    producers_func?: ValueTypes['count_functionsInput'] | undefined | null;
    production_materials?:
      | Array<
          | ValueTypes['create_production_materials_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_materials_func?:
      | ValueTypes['count_functionsInput']
      | undefined
      | null;
  };
  ['create_producers_production_methods_input']: {
    id?: string | undefined | null;
    producers_id?: ValueTypes['create_producers_input'] | undefined | null;
    production_methods_id?:
      | ValueTypes['create_production_methods_input']
      | undefined
      | null;
  };
  ['create_stages_input']: {
    name?: string | undefined | null;
    sort?: number | undefined | null;
    description?: string | undefined | null;
  };
  ['create_products_production_methods_input']: {
    id?: string | undefined | null;
    production_methods_id?:
      | ValueTypes['create_production_methods_input']
      | undefined
      | null;
    products_id?: ValueTypes['create_products_input'] | undefined | null;
  };
  ['create_products_files_input']: {
    directus_files_id?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null;
    id?: string | undefined | null;
    products_id?: ValueTypes['create_products_input'] | undefined | null;
  };
  ['create_products_production_materials_input']: {
    id?: string | undefined | null;
    products_id?: ValueTypes['create_products_input'] | undefined | null;
    production_materials_id?:
      | ValueTypes['create_production_materials_input']
      | undefined
      | null;
  };
  ['create_products_wearables_input']: {
    id?: string | undefined | null;
    products_id?: ValueTypes['create_products_input'] | undefined | null;
    directus_files_id?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null;
    file_format?: ValueTypes['create_file_formats_input'] | undefined | null;
    primary?: boolean | undefined | null;
  };
  ['create_file_formats_input']: {
    id?: string | undefined | null;
    mime_type?: string | undefined | null;
    extension?: string | undefined | null;
    description?: string | undefined | null;
    name: string;
  };
  ['create_products_content_input']: {
    id?: string | undefined | null;
    products_id?: ValueTypes['create_products_input'] | undefined | null;
    directus_files_id?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null;
  };
  ['create_products_design_files_input']: {
    id?: string | undefined | null;
    products_id?: ValueTypes['create_products_input'] | undefined | null;
    directus_files_id?:
      | ValueTypes['create_directus_files_input']
      | undefined
      | null;
  };
  ['create_products_contributors_input']: {
    id?: string | undefined | null;
    products_id?: ValueTypes['create_products_input'] | undefined | null;
    collaborators_id?:
      | ValueTypes['create_collaborators_input']
      | undefined
      | null;
    contribution_share?: number | undefined | null;
    robot_earned?: number | undefined | null;
  };
  ['create_brands_directus_users_input']: {
    id?: string | undefined | null;
    brands_id?: ValueTypes['create_brands_input'] | undefined | null;
    directus_users_id?:
      | ValueTypes['create_directus_users_input']
      | undefined
      | null;
  };
  ['update_brands_input']: {
    created_at?: ValueTypes['Date'] | undefined | null;
    created_at_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    description?: string | undefined | null;
    discord_url?: string | undefined | null;
    eth_address?: string | undefined | null;
    id?: string | undefined | null;
    logo?: ValueTypes['update_directus_files_input'] | undefined | null;
    name?: string | undefined | null;
    twitter_url?: string | undefined | null;
    website_url?: string | undefined | null;
    notion_id?: string | undefined | null;
    products?:
      | Array<ValueTypes['update_products_input'] | undefined | null>
      | undefined
      | null;
    products_func?: ValueTypes['count_functionsInput'] | undefined | null;
    users?:
      | Array<
          ValueTypes['update_brands_directus_users_input'] | undefined | null
        >
      | undefined
      | null;
    users_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['update_directus_files_input']: {
    id?: string | undefined | null;
    storage?: string | undefined | null;
    filename_disk?: string | undefined | null;
    filename_download?: string | undefined | null;
    title?: string | undefined | null;
    type?: string | undefined | null;
    folder?: ValueTypes['update_directus_folders_input'] | undefined | null;
    uploaded_by?: ValueTypes['update_directus_users_input'] | undefined | null;
    uploaded_on?: ValueTypes['Date'] | undefined | null;
    uploaded_on_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    modified_by?: ValueTypes['update_directus_users_input'] | undefined | null;
    modified_on?: ValueTypes['Date'] | undefined | null;
    modified_on_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    charset?: string | undefined | null;
    filesize?: string | undefined | null;
    width?: number | undefined | null;
    height?: number | undefined | null;
    duration?: number | undefined | null;
    embed?: string | undefined | null;
    description?: string | undefined | null;
    location?: string | undefined | null;
    tags?: ValueTypes['JSON'] | undefined | null;
    tags_func?: ValueTypes['count_functionsInput'] | undefined | null;
    metadata?: ValueTypes['JSON'] | undefined | null;
    metadata_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['update_directus_folders_input']: {
    id?: string | undefined | null;
    name?: string | undefined | null;
    parent?: ValueTypes['update_directus_folders_input'] | undefined | null;
  };
  ['update_directus_users_input']: {
    id?: string | undefined | null;
    first_name?: string | undefined | null;
    last_name?: string | undefined | null;
    email?: string | undefined | null;
    password?: string | undefined | null;
    location?: string | undefined | null;
    title?: string | undefined | null;
    description?: string | undefined | null;
    tags?: ValueTypes['JSON'] | undefined | null;
    tags_func?: ValueTypes['count_functionsInput'] | undefined | null;
    avatar?: ValueTypes['update_directus_files_input'] | undefined | null;
    language?: string | undefined | null;
    theme?: string | undefined | null;
    tfa_secret?: string | undefined | null;
    status?: string | undefined | null;
    role?: ValueTypes['update_directus_roles_input'] | undefined | null;
    token?: string | undefined | null;
    last_access?: ValueTypes['Date'] | undefined | null;
    last_access_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    last_page?: string | undefined | null;
    provider?: string | undefined | null;
    external_identifier?: string | undefined | null;
    auth_data?: ValueTypes['JSON'] | undefined | null;
    auth_data_func?: ValueTypes['count_functionsInput'] | undefined | null;
    email_notifications?: boolean | undefined | null;
    timezone?: string | undefined | null;
    discord_handle?: string | undefined | null;
    twitter_handle?: string | undefined | null;
    discord_id?: string | undefined | null;
    collaborators?:
      | Array<ValueTypes['update_collaborators_input'] | undefined | null>
      | undefined
      | null;
    collaborators_func?: ValueTypes['count_functionsInput'] | undefined | null;
    skills?:
      | Array<
          | ValueTypes['update_junction_directus_users_skills_input']
          | undefined
          | null
        >
      | undefined
      | null;
    skills_func?: ValueTypes['count_functionsInput'] | undefined | null;
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
      | Array<ValueTypes['update_directus_users_input'] | undefined | null>
      | undefined
      | null;
    users_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['update_collaborators_input']: {
    id?: string | undefined | null;
    user_created?: ValueTypes['update_directus_users_input'] | undefined | null;
    date_created?: ValueTypes['Date'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    date_updated?: ValueTypes['Date'] | undefined | null;
    date_updated_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    account?: ValueTypes['update_directus_users_input'] | undefined | null;
    display_name?: string | undefined | null;
    payment_eth_address?: string | undefined | null;
    role?: ValueTypes['update_collaborator_roles_input'] | undefined | null;
  };
  ['update_collaborator_roles_input']: {
    description?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
  };
  ['update_junction_directus_users_skills_input']: {
    id?: string | undefined | null;
    directus_users_id?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null;
    skills_id?: ValueTypes['update_skills_input'] | undefined | null;
  };
  ['update_skills_input']: {
    description?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
  };
  ['update_products_input']: {
    brand_id?: ValueTypes['update_brands_input'] | undefined | null;
    brand_reward_share?: number | undefined | null;
    created_at?: ValueTypes['Date'] | undefined | null;
    created_at_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    description?: string | undefined | null;
    discord_channel_id?: string | undefined | null;
    fulfiller_id?: ValueTypes['update_fulfillers_input'] | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
    notion_id?: string | undefined | null;
    price?: ValueTypes['update_price_currencies_input'] | undefined | null;
    producer_id?: ValueTypes['update_producers_input'] | undefined | null;
    production_cost?: number | undefined | null;
    quantity?: string | undefined | null;
    sale_type?: string | undefined | null;
    shopify_id?: string | undefined | null;
    status?: string | undefined | null;
    season?: number | undefined | null;
    release_date?: ValueTypes['Date'] | undefined | null;
    release_date_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    clo3d_file?: ValueTypes['update_directus_files_input'] | undefined | null;
    product_stage?: ValueTypes['update_stages_input'] | undefined | null;
    nft_token_id?: number | undefined | null;
    contributor_reward_share?: number | undefined | null;
    production_methods?:
      | Array<
          | ValueTypes['update_products_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_methods_func?:
      | ValueTypes['count_functionsInput']
      | undefined
      | null;
    images?:
      | Array<ValueTypes['update_products_files_input'] | undefined | null>
      | undefined
      | null;
    images_func?: ValueTypes['count_functionsInput'] | undefined | null;
    materials?:
      | Array<
          | ValueTypes['update_products_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null;
    materials_func?: ValueTypes['count_functionsInput'] | undefined | null;
    wearable_files?:
      | Array<ValueTypes['update_products_wearables_input'] | undefined | null>
      | undefined
      | null;
    wearable_files_func?: ValueTypes['count_functionsInput'] | undefined | null;
    content?:
      | Array<ValueTypes['update_products_content_input'] | undefined | null>
      | undefined
      | null;
    content_func?: ValueTypes['count_functionsInput'] | undefined | null;
    design_files?:
      | Array<
          ValueTypes['update_products_design_files_input'] | undefined | null
        >
      | undefined
      | null;
    design_files_func?: ValueTypes['count_functionsInput'] | undefined | null;
    contributors?:
      | Array<
          ValueTypes['update_products_contributors_input'] | undefined | null
        >
      | undefined
      | null;
    contributors_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['update_fulfillers_input']: {
    address?: string | undefined | null;
    created_at?: ValueTypes['Date'] | undefined | null;
    created_at_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
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
    created_at?: ValueTypes['Date'] | undefined | null;
    created_at_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    email?: string | undefined | null;
    eth_address?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
    shipping_address?: string | undefined | null;
    production_materials_stocked?:
      | Array<
          | ValueTypes['update_producers_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_materials_stocked_func?:
      | ValueTypes['count_functionsInput']
      | undefined
      | null;
    production_methods?:
      | Array<
          | ValueTypes['update_producers_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_methods_func?:
      | ValueTypes['count_functionsInput']
      | undefined
      | null;
    supplied_materials?:
      | Array<
          ValueTypes['update_production_materials_input'] | undefined | null
        >
      | undefined
      | null;
    supplied_materials_func?:
      | ValueTypes['count_functionsInput']
      | undefined
      | null;
  };
  ['update_producers_production_materials_input']: {
    id?: string | undefined | null;
    producers_id?: ValueTypes['update_producers_input'] | undefined | null;
    production_materials_id?:
      | ValueTypes['update_production_materials_input']
      | undefined
      | null;
    quantity?: number | undefined | null;
  };
  ['update_production_materials_input']: {
    base_price?: number | undefined | null;
    color_palette?: ValueTypes['JSON'] | undefined | null;
    color_palette_func?: ValueTypes['count_functionsInput'] | undefined | null;
    composition?: string | undefined | null;
    created_at?: ValueTypes['Date'] | undefined | null;
    created_at_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    created_by?: ValueTypes['update_directus_users_input'] | undefined | null;
    description?: string | undefined | null;
    gender?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
    neck_tag?: boolean | undefined | null;
    rating?: string | undefined | null;
    size_guide?: ValueTypes['update_directus_files_input'] | undefined | null;
    supplier?: ValueTypes['update_producers_input'] | undefined | null;
    tags?: ValueTypes['JSON'] | undefined | null;
    tags_func?: ValueTypes['count_functionsInput'] | undefined | null;
    made_in?: string | undefined | null;
    production_methods?:
      | Array<
          | ValueTypes['update_production_materials_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_methods_func?:
      | ValueTypes['count_functionsInput']
      | undefined
      | null;
    stocked_at?:
      | Array<
          | ValueTypes['update_producers_production_materials_input']
          | undefined
          | null
        >
      | undefined
      | null;
    stocked_at_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['update_production_materials_production_methods_input']: {
    id?: string | undefined | null;
    production_materials_id?:
      | ValueTypes['update_production_materials_input']
      | undefined
      | null;
    production_methods_id?:
      | ValueTypes['update_production_methods_input']
      | undefined
      | null;
  };
  ['update_production_methods_input']: {
    created_at?: ValueTypes['Date'] | undefined | null;
    created_at_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    description?: string | undefined | null;
    id?: string | undefined | null;
    name?: string | undefined | null;
    producers?:
      | Array<
          | ValueTypes['update_producers_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    producers_func?: ValueTypes['count_functionsInput'] | undefined | null;
    production_materials?:
      | Array<
          | ValueTypes['update_production_materials_production_methods_input']
          | undefined
          | null
        >
      | undefined
      | null;
    production_materials_func?:
      | ValueTypes['count_functionsInput']
      | undefined
      | null;
  };
  ['update_producers_production_methods_input']: {
    id?: string | undefined | null;
    producers_id?: ValueTypes['update_producers_input'] | undefined | null;
    production_methods_id?:
      | ValueTypes['update_production_methods_input']
      | undefined
      | null;
  };
  ['update_stages_input']: {
    name?: string | undefined | null;
    sort?: number | undefined | null;
    description?: string | undefined | null;
  };
  ['update_products_production_methods_input']: {
    id?: string | undefined | null;
    production_methods_id?:
      | ValueTypes['update_production_methods_input']
      | undefined
      | null;
    products_id?: ValueTypes['update_products_input'] | undefined | null;
  };
  ['update_products_files_input']: {
    directus_files_id?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null;
    id?: string | undefined | null;
    products_id?: ValueTypes['update_products_input'] | undefined | null;
  };
  ['update_products_production_materials_input']: {
    id?: string | undefined | null;
    products_id?: ValueTypes['update_products_input'] | undefined | null;
    production_materials_id?:
      | ValueTypes['update_production_materials_input']
      | undefined
      | null;
  };
  ['update_products_wearables_input']: {
    id?: string | undefined | null;
    products_id?: ValueTypes['update_products_input'] | undefined | null;
    directus_files_id?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null;
    file_format?: ValueTypes['update_file_formats_input'] | undefined | null;
    primary?: boolean | undefined | null;
  };
  ['update_file_formats_input']: {
    id?: string | undefined | null;
    mime_type?: string | undefined | null;
    extension?: string | undefined | null;
    description?: string | undefined | null;
    name?: string | undefined | null;
  };
  ['update_products_content_input']: {
    id?: string | undefined | null;
    products_id?: ValueTypes['update_products_input'] | undefined | null;
    directus_files_id?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null;
  };
  ['update_products_design_files_input']: {
    id?: string | undefined | null;
    products_id?: ValueTypes['update_products_input'] | undefined | null;
    directus_files_id?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null;
  };
  ['update_products_contributors_input']: {
    id?: string | undefined | null;
    products_id?: ValueTypes['update_products_input'] | undefined | null;
    collaborators_id?:
      | ValueTypes['update_collaborators_input']
      | undefined
      | null;
    contribution_share?: number | undefined | null;
    robot_earned?: number | undefined | null;
  };
  ['update_brands_directus_users_input']: {
    id?: string | undefined | null;
    brands_id?: ValueTypes['update_brands_input'] | undefined | null;
    directus_users_id?:
      | ValueTypes['update_directus_users_input']
      | undefined
      | null;
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
    brands?: Array<GraphQLTypes['brands'] | undefined> | undefined;
    brands_by_id?: GraphQLTypes['brands'] | undefined;
    brands_aggregated?:
      | Array<GraphQLTypes['brands_aggregated'] | undefined>
      | undefined;
    producers?: Array<GraphQLTypes['producers'] | undefined> | undefined;
    producers_by_id?: GraphQLTypes['producers'] | undefined;
    producers_aggregated?:
      | Array<GraphQLTypes['producers_aggregated'] | undefined>
      | undefined;
    producers_production_materials?:
      | Array<GraphQLTypes['producers_production_materials'] | undefined>
      | undefined;
    producers_production_materials_by_id?:
      | GraphQLTypes['producers_production_materials']
      | undefined;
    producers_production_materials_aggregated?:
      | Array<
          GraphQLTypes['producers_production_materials_aggregated'] | undefined
        >
      | undefined;
    producers_production_methods?:
      | Array<GraphQLTypes['producers_production_methods'] | undefined>
      | undefined;
    producers_production_methods_by_id?:
      | GraphQLTypes['producers_production_methods']
      | undefined;
    producers_production_methods_aggregated?:
      | Array<
          GraphQLTypes['producers_production_methods_aggregated'] | undefined
        >
      | undefined;
    production_methods?:
      | Array<GraphQLTypes['production_methods'] | undefined>
      | undefined;
    production_methods_by_id?: GraphQLTypes['production_methods'] | undefined;
    production_methods_aggregated?:
      | Array<GraphQLTypes['production_methods_aggregated'] | undefined>
      | undefined;
    collaborator_roles?:
      | Array<GraphQLTypes['collaborator_roles'] | undefined>
      | undefined;
    collaborator_roles_by_id?: GraphQLTypes['collaborator_roles'] | undefined;
    collaborator_roles_aggregated?:
      | Array<GraphQLTypes['collaborator_roles_aggregated'] | undefined>
      | undefined;
    production_materials_production_methods?:
      | Array<
          GraphQLTypes['production_materials_production_methods'] | undefined
        >
      | undefined;
    production_materials_production_methods_by_id?:
      | GraphQLTypes['production_materials_production_methods']
      | undefined;
    production_materials_production_methods_aggregated?:
      | Array<
          | GraphQLTypes['production_materials_production_methods_aggregated']
          | undefined
        >
      | undefined;
    fulfillers?: Array<GraphQLTypes['fulfillers'] | undefined> | undefined;
    fulfillers_by_id?: GraphQLTypes['fulfillers'] | undefined;
    fulfillers_aggregated?:
      | Array<GraphQLTypes['fulfillers_aggregated'] | undefined>
      | undefined;
    price_currencies?:
      | Array<GraphQLTypes['price_currencies'] | undefined>
      | undefined;
    price_currencies_by_id?: GraphQLTypes['price_currencies'] | undefined;
    price_currencies_aggregated?:
      | Array<GraphQLTypes['price_currencies_aggregated'] | undefined>
      | undefined;
    products_files?:
      | Array<GraphQLTypes['products_files'] | undefined>
      | undefined;
    products_files_by_id?: GraphQLTypes['products_files'] | undefined;
    products_files_aggregated?:
      | Array<GraphQLTypes['products_files_aggregated'] | undefined>
      | undefined;
    products_production_methods?:
      | Array<GraphQLTypes['products_production_methods'] | undefined>
      | undefined;
    products_production_methods_by_id?:
      | GraphQLTypes['products_production_methods']
      | undefined;
    products_production_methods_aggregated?:
      | Array<
          GraphQLTypes['products_production_methods_aggregated'] | undefined
        >
      | undefined;
    skills?: Array<GraphQLTypes['skills'] | undefined> | undefined;
    skills_by_id?: GraphQLTypes['skills'] | undefined;
    skills_aggregated?:
      | Array<GraphQLTypes['skills_aggregated'] | undefined>
      | undefined;
    production_materials?:
      | Array<GraphQLTypes['production_materials'] | undefined>
      | undefined;
    production_materials_by_id?:
      | GraphQLTypes['production_materials']
      | undefined;
    production_materials_aggregated?:
      | Array<GraphQLTypes['production_materials_aggregated'] | undefined>
      | undefined;
    products?: Array<GraphQLTypes['products'] | undefined> | undefined;
    products_by_id?: GraphQLTypes['products'] | undefined;
    products_aggregated?:
      | Array<GraphQLTypes['products_aggregated'] | undefined>
      | undefined;
    products_production_materials?:
      | Array<GraphQLTypes['products_production_materials'] | undefined>
      | undefined;
    products_production_materials_by_id?:
      | GraphQLTypes['products_production_materials']
      | undefined;
    products_production_materials_aggregated?:
      | Array<
          GraphQLTypes['products_production_materials_aggregated'] | undefined
        >
      | undefined;
    products_wearables?:
      | Array<GraphQLTypes['products_wearables'] | undefined>
      | undefined;
    products_wearables_by_id?: GraphQLTypes['products_wearables'] | undefined;
    products_wearables_aggregated?:
      | Array<GraphQLTypes['products_wearables_aggregated'] | undefined>
      | undefined;
    file_formats?: Array<GraphQLTypes['file_formats'] | undefined> | undefined;
    file_formats_by_id?: GraphQLTypes['file_formats'] | undefined;
    file_formats_aggregated?:
      | Array<GraphQLTypes['file_formats_aggregated'] | undefined>
      | undefined;
    products_design_files?:
      | Array<GraphQLTypes['products_design_files'] | undefined>
      | undefined;
    products_design_files_by_id?:
      | GraphQLTypes['products_design_files']
      | undefined;
    products_design_files_aggregated?:
      | Array<GraphQLTypes['products_design_files_aggregated'] | undefined>
      | undefined;
    products_content?:
      | Array<GraphQLTypes['products_content'] | undefined>
      | undefined;
    products_content_by_id?: GraphQLTypes['products_content'] | undefined;
    products_content_aggregated?:
      | Array<GraphQLTypes['products_content_aggregated'] | undefined>
      | undefined;
    stages?: Array<GraphQLTypes['stages'] | undefined> | undefined;
    stages_by_id?: GraphQLTypes['stages'] | undefined;
    stages_aggregated?:
      | Array<GraphQLTypes['stages_aggregated'] | undefined>
      | undefined;
    junction_directus_users_skills?:
      | Array<GraphQLTypes['junction_directus_users_skills'] | undefined>
      | undefined;
    junction_directus_users_skills_by_id?:
      | GraphQLTypes['junction_directus_users_skills']
      | undefined;
    junction_directus_users_skills_aggregated?:
      | Array<
          GraphQLTypes['junction_directus_users_skills_aggregated'] | undefined
        >
      | undefined;
    collaborators?:
      | Array<GraphQLTypes['collaborators'] | undefined>
      | undefined;
    collaborators_by_id?: GraphQLTypes['collaborators'] | undefined;
    collaborators_aggregated?:
      | Array<GraphQLTypes['collaborators_aggregated'] | undefined>
      | undefined;
    brands_directus_users?:
      | Array<GraphQLTypes['brands_directus_users'] | undefined>
      | undefined;
    brands_directus_users_by_id?:
      | GraphQLTypes['brands_directus_users']
      | undefined;
    brands_directus_users_aggregated?:
      | Array<GraphQLTypes['brands_directus_users_aggregated'] | undefined>
      | undefined;
    products_contributors?:
      | Array<GraphQLTypes['products_contributors'] | undefined>
      | undefined;
    products_contributors_by_id?:
      | GraphQLTypes['products_contributors']
      | undefined;
    products_contributors_aggregated?:
      | Array<GraphQLTypes['products_contributors_aggregated'] | undefined>
      | undefined;
  };
  ['brands']: {
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    description?: string | undefined;
    discord_url?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    logo?: GraphQLTypes['directus_files'] | undefined;
    name: string;
    twitter_url?: string | undefined;
    website_url?: string | undefined;
    notion_id?: string | undefined;
    products?: Array<GraphQLTypes['products'] | undefined> | undefined;
    products_func?: GraphQLTypes['count_functions'] | undefined;
    users?:
      | Array<GraphQLTypes['brands_directus_users'] | undefined>
      | undefined;
    users_func?: GraphQLTypes['count_functions'] | undefined;
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
    id?: string | undefined;
    storage: string;
    filename_disk?: string | undefined;
    filename_download: string;
    title?: string | undefined;
    type?: string | undefined;
    folder?: GraphQLTypes['directus_folders'] | undefined;
    uploaded_by?: GraphQLTypes['directus_users'] | undefined;
    uploaded_on: GraphQLTypes['Date'];
    uploaded_on_func?: GraphQLTypes['datetime_functions'] | undefined;
    modified_by?: GraphQLTypes['directus_users'] | undefined;
    modified_on: GraphQLTypes['Date'];
    modified_on_func?: GraphQLTypes['datetime_functions'] | undefined;
    charset?: string | undefined;
    filesize?: string | undefined;
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
    id?: string | undefined;
    name: string;
    parent?: GraphQLTypes['directus_folders'] | undefined;
  };
  ['directus_folders_filter']: GraphQLTypes['directus_folders_filter'];
  ['string_filter_operators']: GraphQLTypes['string_filter_operators'];
  ['directus_users']: {
    id?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    email?: string | undefined;
    password?: string | undefined;
    location?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    tags_func?: GraphQLTypes['count_functions'] | undefined;
    avatar?: GraphQLTypes['directus_files'] | undefined;
    language?: string | undefined;
    theme?: string | undefined;
    tfa_secret?: string | undefined;
    status: string;
    role?: GraphQLTypes['directus_roles'] | undefined;
    token?: string | undefined;
    last_access?: GraphQLTypes['Date'] | undefined;
    last_access_func?: GraphQLTypes['datetime_functions'] | undefined;
    last_page?: string | undefined;
    provider: string;
    external_identifier?: string | undefined;
    auth_data?: GraphQLTypes['JSON'] | undefined;
    auth_data_func?: GraphQLTypes['count_functions'] | undefined;
    email_notifications?: boolean | undefined;
    timezone?: string | undefined;
    discord_handle?: string | undefined;
    twitter_handle?: string | undefined;
    discord_id?: string | undefined;
    collaborators?:
      | Array<GraphQLTypes['collaborators'] | undefined>
      | undefined;
    collaborators_func?: GraphQLTypes['count_functions'] | undefined;
    skills?:
      | Array<GraphQLTypes['junction_directus_users_skills'] | undefined>
      | undefined;
    skills_func?: GraphQLTypes['count_functions'] | undefined;
  };
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  ['JSON']: any;
  ['count_functions']: {
    count?: number | undefined;
  };
  ['directus_files_filter']: GraphQLTypes['directus_files_filter'];
  ['directus_users_filter']: GraphQLTypes['directus_users_filter'];
  ['count_function_filter_operators']: GraphQLTypes['count_function_filter_operators'];
  ['number_filter_operators']: GraphQLTypes['number_filter_operators'];
  ['directus_roles_filter']: GraphQLTypes['directus_roles_filter'];
  ['boolean_filter_operators']: GraphQLTypes['boolean_filter_operators'];
  ['date_filter_operators']: GraphQLTypes['date_filter_operators'];
  ['datetime_function_filter_operators']: GraphQLTypes['datetime_function_filter_operators'];
  ['collaborators_filter']: GraphQLTypes['collaborators_filter'];
  ['collaborator_roles_filter']: GraphQLTypes['collaborator_roles_filter'];
  ['junction_directus_users_skills_filter']: GraphQLTypes['junction_directus_users_skills_filter'];
  ['skills_filter']: GraphQLTypes['skills_filter'];
  ['directus_roles']: {
    id?: string | undefined;
    name: string;
    icon: string;
    description?: string | undefined;
    ip_access?: Array<string | undefined> | undefined;
    enforce_tfa: boolean;
    admin_access: boolean;
    app_access: boolean;
    users?: Array<GraphQLTypes['directus_users'] | undefined> | undefined;
    users_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['collaborators']: {
    id?: string | undefined;
    user_created?: GraphQLTypes['directus_users'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functions'] | undefined;
    date_updated?: GraphQLTypes['Date'] | undefined;
    date_updated_func?: GraphQLTypes['datetime_functions'] | undefined;
    account?: GraphQLTypes['directus_users'] | undefined;
    display_name?: string | undefined;
    payment_eth_address?: string | undefined;
    role?: GraphQLTypes['collaborator_roles'] | undefined;
  };
  ['collaborator_roles']: {
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
  };
  ['junction_directus_users_skills']: {
    id?: string | undefined;
    directus_users_id?: GraphQLTypes['directus_users'] | undefined;
    skills_id?: GraphQLTypes['skills'] | undefined;
  };
  ['skills']: {
    description?: string | undefined;
    id?: string | undefined;
    name: string;
  };
  ['products']: {
    brand_id?: GraphQLTypes['brands'] | undefined;
    brand_reward_share?: number | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    description?: string | undefined;
    discord_channel_id?: string | undefined;
    fulfiller_id?: GraphQLTypes['fulfillers'] | undefined;
    id?: string | undefined;
    name: string;
    notion_id?: string | undefined;
    price?: GraphQLTypes['price_currencies'] | undefined;
    producer_id?: GraphQLTypes['producers'] | undefined;
    production_cost?: number | undefined;
    quantity?: string | undefined;
    sale_type?: string | undefined;
    shopify_id?: string | undefined;
    status?: string | undefined;
    season?: number | undefined;
    release_date?: GraphQLTypes['Date'] | undefined;
    release_date_func?: GraphQLTypes['datetime_functions'] | undefined;
    clo3d_file?: GraphQLTypes['directus_files'] | undefined;
    product_stage?: GraphQLTypes['stages'] | undefined;
    nft_token_id?: number | undefined;
    contributor_reward_share?: number | undefined;
    production_methods?:
      | Array<GraphQLTypes['products_production_methods'] | undefined>
      | undefined;
    production_methods_func?: GraphQLTypes['count_functions'] | undefined;
    images?: Array<GraphQLTypes['products_files'] | undefined> | undefined;
    images_func?: GraphQLTypes['count_functions'] | undefined;
    materials?:
      | Array<GraphQLTypes['products_production_materials'] | undefined>
      | undefined;
    materials_func?: GraphQLTypes['count_functions'] | undefined;
    wearable_files?:
      | Array<GraphQLTypes['products_wearables'] | undefined>
      | undefined;
    wearable_files_func?: GraphQLTypes['count_functions'] | undefined;
    content?: Array<GraphQLTypes['products_content'] | undefined> | undefined;
    content_func?: GraphQLTypes['count_functions'] | undefined;
    design_files?:
      | Array<GraphQLTypes['products_design_files'] | undefined>
      | undefined;
    design_files_func?: GraphQLTypes['count_functions'] | undefined;
    contributors?:
      | Array<GraphQLTypes['products_contributors'] | undefined>
      | undefined;
    contributors_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['brands_filter']: GraphQLTypes['brands_filter'];
  ['products_filter']: GraphQLTypes['products_filter'];
  ['fulfillers_filter']: GraphQLTypes['fulfillers_filter'];
  ['price_currencies_filter']: GraphQLTypes['price_currencies_filter'];
  ['producers_filter']: GraphQLTypes['producers_filter'];
  ['producers_production_materials_filter']: GraphQLTypes['producers_production_materials_filter'];
  ['production_materials_filter']: GraphQLTypes['production_materials_filter'];
  ['production_materials_production_methods_filter']: GraphQLTypes['production_materials_production_methods_filter'];
  ['production_methods_filter']: GraphQLTypes['production_methods_filter'];
  ['producers_production_methods_filter']: GraphQLTypes['producers_production_methods_filter'];
  ['stages_filter']: GraphQLTypes['stages_filter'];
  ['products_production_methods_filter']: GraphQLTypes['products_production_methods_filter'];
  ['products_files_filter']: GraphQLTypes['products_files_filter'];
  ['products_production_materials_filter']: GraphQLTypes['products_production_materials_filter'];
  ['products_wearables_filter']: GraphQLTypes['products_wearables_filter'];
  ['file_formats_filter']: GraphQLTypes['file_formats_filter'];
  ['products_content_filter']: GraphQLTypes['products_content_filter'];
  ['products_design_files_filter']: GraphQLTypes['products_design_files_filter'];
  ['products_contributors_filter']: GraphQLTypes['products_contributors_filter'];
  ['brands_directus_users_filter']: GraphQLTypes['brands_directus_users_filter'];
  ['fulfillers']: {
    address?: string | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    email?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    website_url?: string | undefined;
  };
  ['price_currencies']: {
    amount: number;
    currency?: string | undefined;
    id?: string | undefined;
  };
  ['producers']: {
    created_at: GraphQLTypes['Date'];
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    email?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
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
    id?: string | undefined;
    producers_id?: GraphQLTypes['producers'] | undefined;
    production_materials_id?: GraphQLTypes['production_materials'] | undefined;
    quantity?: number | undefined;
  };
  ['production_materials']: {
    base_price?: number | undefined;
    color_palette?: GraphQLTypes['JSON'] | undefined;
    color_palette_func?: GraphQLTypes['count_functions'] | undefined;
    composition?: string | undefined;
    created_at: GraphQLTypes['Date'];
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    created_by?: GraphQLTypes['directus_users'] | undefined;
    description?: string | undefined;
    gender?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    neck_tag?: boolean | undefined;
    rating?: string | undefined;
    size_guide?: GraphQLTypes['directus_files'] | undefined;
    supplier?: GraphQLTypes['producers'] | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    tags_func?: GraphQLTypes['count_functions'] | undefined;
    made_in?: string | undefined;
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
  };
  ['production_materials_production_methods']: {
    id?: string | undefined;
    production_materials_id?: GraphQLTypes['production_materials'] | undefined;
    production_methods_id?: GraphQLTypes['production_methods'] | undefined;
  };
  ['production_methods']: {
    created_at: GraphQLTypes['Date'];
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    description?: string | undefined;
    id?: string | undefined;
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
    id?: string | undefined;
    producers_id?: GraphQLTypes['producers'] | undefined;
    production_methods_id?: GraphQLTypes['production_methods'] | undefined;
  };
  ['stages']: {
    name?: string | undefined;
    sort?: number | undefined;
    description?: string | undefined;
  };
  ['products_production_methods']: {
    id?: string | undefined;
    production_methods_id?: GraphQLTypes['production_methods'] | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
  };
  ['products_files']: {
    directus_files_id?: GraphQLTypes['directus_files'] | undefined;
    id?: string | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
  };
  ['products_production_materials']: {
    id?: string | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
    production_materials_id?: GraphQLTypes['production_materials'] | undefined;
  };
  ['products_wearables']: {
    id?: string | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
    directus_files_id?: GraphQLTypes['directus_files'] | undefined;
    file_format?: GraphQLTypes['file_formats'] | undefined;
    primary?: boolean | undefined;
  };
  ['file_formats']: {
    id?: string | undefined;
    mime_type?: string | undefined;
    extension?: string | undefined;
    description?: string | undefined;
    name: string;
  };
  ['products_content']: {
    id?: string | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
    directus_files_id?: GraphQLTypes['directus_files'] | undefined;
  };
  ['products_design_files']: {
    id?: string | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
    directus_files_id?: GraphQLTypes['directus_files'] | undefined;
  };
  ['products_contributors']: {
    id?: string | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
    collaborators_id?: GraphQLTypes['collaborators'] | undefined;
    contribution_share?: number | undefined;
    robot_earned?: number | undefined;
  };
  ['brands_directus_users']: {
    id?: string | undefined;
    brands_id?: GraphQLTypes['brands'] | undefined;
    directus_users_id?: GraphQLTypes['directus_users'] | undefined;
  };
  ['brands_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['brands_aggregated_count'] | undefined;
  };
  ['brands_aggregated_count']: {
    created_at?: number | undefined;
    description?: number | undefined;
    discord_url?: number | undefined;
    eth_address?: number | undefined;
    id?: number | undefined;
    logo?: number | undefined;
    name?: number | undefined;
    twitter_url?: number | undefined;
    website_url?: number | undefined;
    notion_id?: number | undefined;
    products?: number | undefined;
    users?: number | undefined;
  };
  ['producers_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['producers_aggregated_count'] | undefined;
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
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['producers_production_materials_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['producers_production_materials_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['producers_production_materials_aggregated_fields']
      | undefined;
    countDistinct?:
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
    id?: number | undefined;
    producers_id?: number | undefined;
    production_materials_id?: number | undefined;
    quantity?: number | undefined;
  };
  ['producers_production_materials_aggregated_fields']: {
    id?: number | undefined;
    quantity?: number | undefined;
  };
  ['producers_production_methods_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['producers_production_methods_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['producers_production_methods_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['producers_production_methods_aggregated_fields']
      | undefined;
    countDistinct?:
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
    id?: number | undefined;
    producers_id?: number | undefined;
    production_methods_id?: number | undefined;
  };
  ['producers_production_methods_aggregated_fields']: {
    id?: number | undefined;
  };
  ['production_methods_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['production_methods_aggregated_count'] | undefined;
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
  ['collaborator_roles_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['collaborator_roles_aggregated_count'] | undefined;
    avg?: GraphQLTypes['collaborator_roles_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['collaborator_roles_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['collaborator_roles_aggregated_fields']
      | undefined;
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
    description?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
  };
  ['collaborator_roles_aggregated_fields']: {
    id?: number | undefined;
  };
  ['production_materials_production_methods_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['production_materials_production_methods_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
    countDistinct?:
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
    id?: number | undefined;
    production_materials_id?: number | undefined;
    production_methods_id?: number | undefined;
  };
  ['production_materials_production_methods_aggregated_fields']: {
    id?: number | undefined;
  };
  ['fulfillers_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['fulfillers_aggregated_count'] | undefined;
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
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['price_currencies_aggregated_count'] | undefined;
    avg?: GraphQLTypes['price_currencies_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['price_currencies_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['price_currencies_aggregated_fields']
      | undefined;
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
    amount?: number | undefined;
    currency?: number | undefined;
    id?: number | undefined;
  };
  ['price_currencies_aggregated_fields']: {
    amount?: number | undefined;
  };
  ['products_files_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_files_aggregated_count'] | undefined;
    avg?: GraphQLTypes['products_files_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_files_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['products_files_aggregated_fields']
      | undefined;
    avgDistinct?: GraphQLTypes['products_files_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['products_files_aggregated_fields'] | undefined;
    min?: GraphQLTypes['products_files_aggregated_fields'] | undefined;
    max?: GraphQLTypes['products_files_aggregated_fields'] | undefined;
  };
  ['products_files_aggregated_count']: {
    directus_files_id?: number | undefined;
    id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_files_aggregated_fields']: {
    id?: number | undefined;
  };
  ['products_production_methods_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['products_production_methods_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['products_production_methods_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['products_production_methods_aggregated_fields']
      | undefined;
    countDistinct?:
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
    id?: number | undefined;
    production_methods_id?: number | undefined;
    products_id?: number | undefined;
  };
  ['products_production_methods_aggregated_fields']: {
    id?: number | undefined;
  };
  ['skills_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['skills_aggregated_count'] | undefined;
  };
  ['skills_aggregated_count']: {
    description?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
  };
  ['production_materials_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['production_materials_aggregated_count'] | undefined;
    avg?: GraphQLTypes['production_materials_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['production_materials_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['production_materials_aggregated_fields']
      | undefined;
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
    base_price?: number | undefined;
    color_palette?: number | undefined;
    composition?: number | undefined;
    created_at?: number | undefined;
    created_by?: number | undefined;
    description?: number | undefined;
    gender?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
    neck_tag?: number | undefined;
    rating?: number | undefined;
    size_guide?: number | undefined;
    supplier?: number | undefined;
    tags?: number | undefined;
    made_in?: number | undefined;
    production_methods?: number | undefined;
    stocked_at?: number | undefined;
  };
  ['production_materials_aggregated_fields']: {
    base_price?: number | undefined;
  };
  ['products_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_aggregated_count'] | undefined;
    avg?: GraphQLTypes['products_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_aggregated_fields'] | undefined;
    countDistinct?: GraphQLTypes['products_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['products_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['products_aggregated_fields'] | undefined;
    min?: GraphQLTypes['products_aggregated_fields'] | undefined;
    max?: GraphQLTypes['products_aggregated_fields'] | undefined;
  };
  ['products_aggregated_count']: {
    brand_id?: number | undefined;
    brand_reward_share?: number | undefined;
    created_at?: number | undefined;
    description?: number | undefined;
    discord_channel_id?: number | undefined;
    fulfiller_id?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
    notion_id?: number | undefined;
    price?: number | undefined;
    producer_id?: number | undefined;
    production_cost?: number | undefined;
    quantity?: number | undefined;
    sale_type?: number | undefined;
    shopify_id?: number | undefined;
    status?: number | undefined;
    season?: number | undefined;
    release_date?: number | undefined;
    clo3d_file?: number | undefined;
    product_stage?: number | undefined;
    nft_token_id?: number | undefined;
    contributor_reward_share?: number | undefined;
    production_methods?: number | undefined;
    images?: number | undefined;
    materials?: number | undefined;
    wearable_files?: number | undefined;
    content?: number | undefined;
    design_files?: number | undefined;
    contributors?: number | undefined;
  };
  ['products_aggregated_fields']: {
    brand_reward_share?: number | undefined;
    production_cost?: number | undefined;
    season?: number | undefined;
    nft_token_id?: number | undefined;
    contributor_reward_share?: number | undefined;
  };
  ['products_production_materials_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['products_production_materials_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['products_production_materials_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['products_production_materials_aggregated_fields']
      | undefined;
    countDistinct?:
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
    id?: number | undefined;
    products_id?: number | undefined;
    production_materials_id?: number | undefined;
  };
  ['products_production_materials_aggregated_fields']: {
    id?: number | undefined;
  };
  ['products_wearables_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_wearables_aggregated_count'] | undefined;
    avg?: GraphQLTypes['products_wearables_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_wearables_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['products_wearables_aggregated_fields']
      | undefined;
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
    id?: number | undefined;
    products_id?: number | undefined;
    directus_files_id?: number | undefined;
    file_format?: number | undefined;
    primary?: number | undefined;
  };
  ['products_wearables_aggregated_fields']: {
    id?: number | undefined;
    file_format?: number | undefined;
  };
  ['file_formats_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['file_formats_aggregated_count'] | undefined;
    avg?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    countDistinct?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    min?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    max?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
  };
  ['file_formats_aggregated_count']: {
    id?: number | undefined;
    mime_type?: number | undefined;
    extension?: number | undefined;
    description?: number | undefined;
    name?: number | undefined;
  };
  ['file_formats_aggregated_fields']: {
    id?: number | undefined;
  };
  ['products_design_files_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_design_files_aggregated_count'] | undefined;
    avg?: GraphQLTypes['products_design_files_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_design_files_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['products_design_files_aggregated_fields']
      | undefined;
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
    id?: number | undefined;
    products_id?: number | undefined;
    directus_files_id?: number | undefined;
  };
  ['products_design_files_aggregated_fields']: {
    id?: number | undefined;
  };
  ['products_content_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_content_aggregated_count'] | undefined;
    avg?: GraphQLTypes['products_content_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_content_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['products_content_aggregated_fields']
      | undefined;
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
    id?: number | undefined;
    products_id?: number | undefined;
    directus_files_id?: number | undefined;
  };
  ['products_content_aggregated_fields']: {
    id?: number | undefined;
  };
  ['stages_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['stages_aggregated_count'] | undefined;
    avg?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    countDistinct?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    min?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    max?: GraphQLTypes['stages_aggregated_fields'] | undefined;
  };
  ['stages_aggregated_count']: {
    name?: number | undefined;
    sort?: number | undefined;
    description?: number | undefined;
  };
  ['stages_aggregated_fields']: {
    sort?: number | undefined;
  };
  ['junction_directus_users_skills_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['junction_directus_users_skills_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
    countDistinct?:
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
    id?: number | undefined;
    directus_users_id?: number | undefined;
    skills_id?: number | undefined;
  };
  ['junction_directus_users_skills_aggregated_fields']: {
    id?: number | undefined;
  };
  ['collaborators_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['collaborators_aggregated_count'] | undefined;
    avg?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    countDistinct?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    min?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    max?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
  };
  ['collaborators_aggregated_count']: {
    id?: number | undefined;
    user_created?: number | undefined;
    date_created?: number | undefined;
    date_updated?: number | undefined;
    account?: number | undefined;
    display_name?: number | undefined;
    payment_eth_address?: number | undefined;
    role?: number | undefined;
  };
  ['collaborators_aggregated_fields']: {
    id?: number | undefined;
    role?: number | undefined;
  };
  ['brands_directus_users_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['brands_directus_users_aggregated_count'] | undefined;
    avg?: GraphQLTypes['brands_directus_users_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['brands_directus_users_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['brands_directus_users_aggregated_fields']
      | undefined;
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
    id?: number | undefined;
    brands_id?: number | undefined;
    directus_users_id?: number | undefined;
  };
  ['brands_directus_users_aggregated_fields']: {
    id?: number | undefined;
  };
  ['products_contributors_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_contributors_aggregated_count'] | undefined;
    avg?: GraphQLTypes['products_contributors_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_contributors_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['products_contributors_aggregated_fields']
      | undefined;
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
    id?: number | undefined;
    products_id?: number | undefined;
    collaborators_id?: number | undefined;
    contribution_share?: number | undefined;
    robot_earned?: number | undefined;
  };
  ['products_contributors_aggregated_fields']: {
    id?: number | undefined;
    collaborators_id?: number | undefined;
    contribution_share?: number | undefined;
    robot_earned?: number | undefined;
  };
  ['Mutation']: {
    create_brands_items?: Array<GraphQLTypes['brands'] | undefined> | undefined;
    create_brands_item?: GraphQLTypes['brands'] | undefined;
    create_producers_items?:
      | Array<GraphQLTypes['producers'] | undefined>
      | undefined;
    create_producers_item?: GraphQLTypes['producers'] | undefined;
    create_producers_production_materials_items?:
      | Array<GraphQLTypes['producers_production_materials'] | undefined>
      | undefined;
    create_producers_production_materials_item?:
      | GraphQLTypes['producers_production_materials']
      | undefined;
    create_producers_production_methods_items?:
      | Array<GraphQLTypes['producers_production_methods'] | undefined>
      | undefined;
    create_producers_production_methods_item?:
      | GraphQLTypes['producers_production_methods']
      | undefined;
    create_production_methods_items?:
      | Array<GraphQLTypes['production_methods'] | undefined>
      | undefined;
    create_production_methods_item?:
      | GraphQLTypes['production_methods']
      | undefined;
    create_collaborator_roles_items?:
      | Array<GraphQLTypes['collaborator_roles'] | undefined>
      | undefined;
    create_collaborator_roles_item?:
      | GraphQLTypes['collaborator_roles']
      | undefined;
    create_production_materials_production_methods_items?:
      | Array<
          GraphQLTypes['production_materials_production_methods'] | undefined
        >
      | undefined;
    create_production_materials_production_methods_item?:
      | GraphQLTypes['production_materials_production_methods']
      | undefined;
    create_fulfillers_items?:
      | Array<GraphQLTypes['fulfillers'] | undefined>
      | undefined;
    create_fulfillers_item?: GraphQLTypes['fulfillers'] | undefined;
    create_price_currencies_items?:
      | Array<GraphQLTypes['price_currencies'] | undefined>
      | undefined;
    create_price_currencies_item?: GraphQLTypes['price_currencies'] | undefined;
    create_products_files_items?:
      | Array<GraphQLTypes['products_files'] | undefined>
      | undefined;
    create_products_files_item?: GraphQLTypes['products_files'] | undefined;
    create_products_production_methods_items?:
      | Array<GraphQLTypes['products_production_methods'] | undefined>
      | undefined;
    create_products_production_methods_item?:
      | GraphQLTypes['products_production_methods']
      | undefined;
    create_skills_items?: Array<GraphQLTypes['skills'] | undefined> | undefined;
    create_skills_item?: GraphQLTypes['skills'] | undefined;
    create_production_materials_items?:
      | Array<GraphQLTypes['production_materials'] | undefined>
      | undefined;
    create_production_materials_item?:
      | GraphQLTypes['production_materials']
      | undefined;
    create_products_items?:
      | Array<GraphQLTypes['products'] | undefined>
      | undefined;
    create_products_item?: GraphQLTypes['products'] | undefined;
    create_products_production_materials_items?:
      | Array<GraphQLTypes['products_production_materials'] | undefined>
      | undefined;
    create_products_production_materials_item?:
      | GraphQLTypes['products_production_materials']
      | undefined;
    create_products_wearables_items?:
      | Array<GraphQLTypes['products_wearables'] | undefined>
      | undefined;
    create_products_wearables_item?:
      | GraphQLTypes['products_wearables']
      | undefined;
    create_file_formats_items?:
      | Array<GraphQLTypes['file_formats'] | undefined>
      | undefined;
    create_file_formats_item?: GraphQLTypes['file_formats'] | undefined;
    create_products_design_files_items?:
      | Array<GraphQLTypes['products_design_files'] | undefined>
      | undefined;
    create_products_design_files_item?:
      | GraphQLTypes['products_design_files']
      | undefined;
    create_products_content_items?:
      | Array<GraphQLTypes['products_content'] | undefined>
      | undefined;
    create_products_content_item?: GraphQLTypes['products_content'] | undefined;
    create_stages_items?: Array<GraphQLTypes['stages'] | undefined> | undefined;
    create_stages_item?: GraphQLTypes['stages'] | undefined;
    create_junction_directus_users_skills_items?:
      | Array<GraphQLTypes['junction_directus_users_skills'] | undefined>
      | undefined;
    create_junction_directus_users_skills_item?:
      | GraphQLTypes['junction_directus_users_skills']
      | undefined;
    create_collaborators_items?:
      | Array<GraphQLTypes['collaborators'] | undefined>
      | undefined;
    create_collaborators_item?: GraphQLTypes['collaborators'] | undefined;
    create_brands_directus_users_items?:
      | Array<GraphQLTypes['brands_directus_users'] | undefined>
      | undefined;
    create_brands_directus_users_item?:
      | GraphQLTypes['brands_directus_users']
      | undefined;
    create_products_contributors_items?:
      | Array<GraphQLTypes['products_contributors'] | undefined>
      | undefined;
    create_products_contributors_item?:
      | GraphQLTypes['products_contributors']
      | undefined;
    update_brands_items?: Array<GraphQLTypes['brands'] | undefined> | undefined;
    update_brands_item?: GraphQLTypes['brands'] | undefined;
    update_producers_items?:
      | Array<GraphQLTypes['producers'] | undefined>
      | undefined;
    update_producers_item?: GraphQLTypes['producers'] | undefined;
    update_producers_production_materials_items?:
      | Array<GraphQLTypes['producers_production_materials'] | undefined>
      | undefined;
    update_producers_production_materials_item?:
      | GraphQLTypes['producers_production_materials']
      | undefined;
    update_producers_production_methods_items?:
      | Array<GraphQLTypes['producers_production_methods'] | undefined>
      | undefined;
    update_producers_production_methods_item?:
      | GraphQLTypes['producers_production_methods']
      | undefined;
    update_production_methods_items?:
      | Array<GraphQLTypes['production_methods'] | undefined>
      | undefined;
    update_production_methods_item?:
      | GraphQLTypes['production_methods']
      | undefined;
    update_collaborator_roles_items?:
      | Array<GraphQLTypes['collaborator_roles'] | undefined>
      | undefined;
    update_collaborator_roles_item?:
      | GraphQLTypes['collaborator_roles']
      | undefined;
    update_production_materials_production_methods_items?:
      | Array<
          GraphQLTypes['production_materials_production_methods'] | undefined
        >
      | undefined;
    update_production_materials_production_methods_item?:
      | GraphQLTypes['production_materials_production_methods']
      | undefined;
    update_fulfillers_items?:
      | Array<GraphQLTypes['fulfillers'] | undefined>
      | undefined;
    update_fulfillers_item?: GraphQLTypes['fulfillers'] | undefined;
    update_price_currencies_items?:
      | Array<GraphQLTypes['price_currencies'] | undefined>
      | undefined;
    update_price_currencies_item?: GraphQLTypes['price_currencies'] | undefined;
    update_products_files_items?:
      | Array<GraphQLTypes['products_files'] | undefined>
      | undefined;
    update_products_files_item?: GraphQLTypes['products_files'] | undefined;
    update_products_production_methods_items?:
      | Array<GraphQLTypes['products_production_methods'] | undefined>
      | undefined;
    update_products_production_methods_item?:
      | GraphQLTypes['products_production_methods']
      | undefined;
    update_skills_items?: Array<GraphQLTypes['skills'] | undefined> | undefined;
    update_skills_item?: GraphQLTypes['skills'] | undefined;
    update_production_materials_items?:
      | Array<GraphQLTypes['production_materials'] | undefined>
      | undefined;
    update_production_materials_item?:
      | GraphQLTypes['production_materials']
      | undefined;
    update_products_items?:
      | Array<GraphQLTypes['products'] | undefined>
      | undefined;
    update_products_item?: GraphQLTypes['products'] | undefined;
    update_products_production_materials_items?:
      | Array<GraphQLTypes['products_production_materials'] | undefined>
      | undefined;
    update_products_production_materials_item?:
      | GraphQLTypes['products_production_materials']
      | undefined;
    update_products_wearables_items?:
      | Array<GraphQLTypes['products_wearables'] | undefined>
      | undefined;
    update_products_wearables_item?:
      | GraphQLTypes['products_wearables']
      | undefined;
    update_file_formats_items?:
      | Array<GraphQLTypes['file_formats'] | undefined>
      | undefined;
    update_file_formats_item?: GraphQLTypes['file_formats'] | undefined;
    update_products_design_files_items?:
      | Array<GraphQLTypes['products_design_files'] | undefined>
      | undefined;
    update_products_design_files_item?:
      | GraphQLTypes['products_design_files']
      | undefined;
    update_products_content_items?:
      | Array<GraphQLTypes['products_content'] | undefined>
      | undefined;
    update_products_content_item?: GraphQLTypes['products_content'] | undefined;
    update_stages_items?: Array<GraphQLTypes['stages'] | undefined> | undefined;
    update_stages_item?: GraphQLTypes['stages'] | undefined;
    update_junction_directus_users_skills_items?:
      | Array<GraphQLTypes['junction_directus_users_skills'] | undefined>
      | undefined;
    update_junction_directus_users_skills_item?:
      | GraphQLTypes['junction_directus_users_skills']
      | undefined;
    update_collaborators_items?:
      | Array<GraphQLTypes['collaborators'] | undefined>
      | undefined;
    update_collaborators_item?: GraphQLTypes['collaborators'] | undefined;
    update_brands_directus_users_items?:
      | Array<GraphQLTypes['brands_directus_users'] | undefined>
      | undefined;
    update_brands_directus_users_item?:
      | GraphQLTypes['brands_directus_users']
      | undefined;
    update_products_contributors_items?:
      | Array<GraphQLTypes['products_contributors'] | undefined>
      | undefined;
    update_products_contributors_item?:
      | GraphQLTypes['products_contributors']
      | undefined;
    delete_brands_items?: GraphQLTypes['delete_many'] | undefined;
    delete_brands_item?: GraphQLTypes['delete_one'] | undefined;
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
    delete_collaborator_roles_items?: GraphQLTypes['delete_many'] | undefined;
    delete_collaborator_roles_item?: GraphQLTypes['delete_one'] | undefined;
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
    delete_products_files_items?: GraphQLTypes['delete_many'] | undefined;
    delete_products_files_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_production_methods_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_products_production_methods_item?:
      | GraphQLTypes['delete_one']
      | undefined;
    delete_skills_items?: GraphQLTypes['delete_many'] | undefined;
    delete_skills_item?: GraphQLTypes['delete_one'] | undefined;
    delete_production_materials_items?: GraphQLTypes['delete_many'] | undefined;
    delete_production_materials_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_items?: GraphQLTypes['delete_many'] | undefined;
    delete_products_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_production_materials_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_products_production_materials_item?:
      | GraphQLTypes['delete_one']
      | undefined;
    delete_products_wearables_items?: GraphQLTypes['delete_many'] | undefined;
    delete_products_wearables_item?: GraphQLTypes['delete_one'] | undefined;
    delete_file_formats_items?: GraphQLTypes['delete_many'] | undefined;
    delete_file_formats_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_design_files_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_products_design_files_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_content_items?: GraphQLTypes['delete_many'] | undefined;
    delete_products_content_item?: GraphQLTypes['delete_one'] | undefined;
    delete_stages_items?: GraphQLTypes['delete_many'] | undefined;
    delete_stages_item?: GraphQLTypes['delete_one'] | undefined;
    delete_junction_directus_users_skills_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_junction_directus_users_skills_item?:
      | GraphQLTypes['delete_one']
      | undefined;
    delete_collaborators_items?: GraphQLTypes['delete_many'] | undefined;
    delete_collaborators_item?: GraphQLTypes['delete_one'] | undefined;
    delete_brands_directus_users_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_brands_directus_users_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_contributors_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_products_contributors_item?: GraphQLTypes['delete_one'] | undefined;
  };
  ['create_brands_input']: GraphQLTypes['create_brands_input'];
  ['datetime_functionsInput']: GraphQLTypes['datetime_functionsInput'];
  ['create_directus_files_input']: GraphQLTypes['create_directus_files_input'];
  ['create_directus_folders_input']: GraphQLTypes['create_directus_folders_input'];
  ['create_directus_users_input']: GraphQLTypes['create_directus_users_input'];
  ['count_functionsInput']: GraphQLTypes['count_functionsInput'];
  ['create_directus_roles_input']: GraphQLTypes['create_directus_roles_input'];
  ['create_collaborators_input']: GraphQLTypes['create_collaborators_input'];
  ['create_collaborator_roles_input']: GraphQLTypes['create_collaborator_roles_input'];
  ['create_junction_directus_users_skills_input']: GraphQLTypes['create_junction_directus_users_skills_input'];
  ['create_skills_input']: GraphQLTypes['create_skills_input'];
  ['create_products_input']: GraphQLTypes['create_products_input'];
  ['create_fulfillers_input']: GraphQLTypes['create_fulfillers_input'];
  ['create_price_currencies_input']: GraphQLTypes['create_price_currencies_input'];
  ['create_producers_input']: GraphQLTypes['create_producers_input'];
  ['create_producers_production_materials_input']: GraphQLTypes['create_producers_production_materials_input'];
  ['create_production_materials_input']: GraphQLTypes['create_production_materials_input'];
  ['create_production_materials_production_methods_input']: GraphQLTypes['create_production_materials_production_methods_input'];
  ['create_production_methods_input']: GraphQLTypes['create_production_methods_input'];
  ['create_producers_production_methods_input']: GraphQLTypes['create_producers_production_methods_input'];
  ['create_stages_input']: GraphQLTypes['create_stages_input'];
  ['create_products_production_methods_input']: GraphQLTypes['create_products_production_methods_input'];
  ['create_products_files_input']: GraphQLTypes['create_products_files_input'];
  ['create_products_production_materials_input']: GraphQLTypes['create_products_production_materials_input'];
  ['create_products_wearables_input']: GraphQLTypes['create_products_wearables_input'];
  ['create_file_formats_input']: GraphQLTypes['create_file_formats_input'];
  ['create_products_content_input']: GraphQLTypes['create_products_content_input'];
  ['create_products_design_files_input']: GraphQLTypes['create_products_design_files_input'];
  ['create_products_contributors_input']: GraphQLTypes['create_products_contributors_input'];
  ['create_brands_directus_users_input']: GraphQLTypes['create_brands_directus_users_input'];
  ['update_brands_input']: GraphQLTypes['update_brands_input'];
  ['update_directus_files_input']: GraphQLTypes['update_directus_files_input'];
  ['update_directus_folders_input']: GraphQLTypes['update_directus_folders_input'];
  ['update_directus_users_input']: GraphQLTypes['update_directus_users_input'];
  ['update_directus_roles_input']: GraphQLTypes['update_directus_roles_input'];
  ['update_collaborators_input']: GraphQLTypes['update_collaborators_input'];
  ['update_collaborator_roles_input']: GraphQLTypes['update_collaborator_roles_input'];
  ['update_junction_directus_users_skills_input']: GraphQLTypes['update_junction_directus_users_skills_input'];
  ['update_skills_input']: GraphQLTypes['update_skills_input'];
  ['update_products_input']: GraphQLTypes['update_products_input'];
  ['update_fulfillers_input']: GraphQLTypes['update_fulfillers_input'];
  ['update_price_currencies_input']: GraphQLTypes['update_price_currencies_input'];
  ['update_producers_input']: GraphQLTypes['update_producers_input'];
  ['update_producers_production_materials_input']: GraphQLTypes['update_producers_production_materials_input'];
  ['update_production_materials_input']: GraphQLTypes['update_production_materials_input'];
  ['update_production_materials_production_methods_input']: GraphQLTypes['update_production_materials_production_methods_input'];
  ['update_production_methods_input']: GraphQLTypes['update_production_methods_input'];
  ['update_producers_production_methods_input']: GraphQLTypes['update_producers_production_methods_input'];
  ['update_stages_input']: GraphQLTypes['update_stages_input'];
  ['update_products_production_methods_input']: GraphQLTypes['update_products_production_methods_input'];
  ['update_products_files_input']: GraphQLTypes['update_products_files_input'];
  ['update_products_production_materials_input']: GraphQLTypes['update_products_production_materials_input'];
  ['update_products_wearables_input']: GraphQLTypes['update_products_wearables_input'];
  ['update_file_formats_input']: GraphQLTypes['update_file_formats_input'];
  ['update_products_content_input']: GraphQLTypes['update_products_content_input'];
  ['update_products_design_files_input']: GraphQLTypes['update_products_design_files_input'];
  ['update_products_contributors_input']: GraphQLTypes['update_products_contributors_input'];
  ['update_brands_directus_users_input']: GraphQLTypes['update_brands_directus_users_input'];
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
    brands?: Array<GraphQLTypes['brands'] | undefined> | undefined;
    brands_by_id?: GraphQLTypes['brands'] | undefined;
    brands_aggregated?:
      | Array<GraphQLTypes['brands_aggregated'] | undefined>
      | undefined;
    producers?: Array<GraphQLTypes['producers'] | undefined> | undefined;
    producers_by_id?: GraphQLTypes['producers'] | undefined;
    producers_aggregated?:
      | Array<GraphQLTypes['producers_aggregated'] | undefined>
      | undefined;
    producers_production_materials?:
      | Array<GraphQLTypes['producers_production_materials'] | undefined>
      | undefined;
    producers_production_materials_by_id?:
      | GraphQLTypes['producers_production_materials']
      | undefined;
    producers_production_materials_aggregated?:
      | Array<
          GraphQLTypes['producers_production_materials_aggregated'] | undefined
        >
      | undefined;
    producers_production_methods?:
      | Array<GraphQLTypes['producers_production_methods'] | undefined>
      | undefined;
    producers_production_methods_by_id?:
      | GraphQLTypes['producers_production_methods']
      | undefined;
    producers_production_methods_aggregated?:
      | Array<
          GraphQLTypes['producers_production_methods_aggregated'] | undefined
        >
      | undefined;
    production_methods?:
      | Array<GraphQLTypes['production_methods'] | undefined>
      | undefined;
    production_methods_by_id?: GraphQLTypes['production_methods'] | undefined;
    production_methods_aggregated?:
      | Array<GraphQLTypes['production_methods_aggregated'] | undefined>
      | undefined;
    collaborator_roles?:
      | Array<GraphQLTypes['collaborator_roles'] | undefined>
      | undefined;
    collaborator_roles_by_id?: GraphQLTypes['collaborator_roles'] | undefined;
    collaborator_roles_aggregated?:
      | Array<GraphQLTypes['collaborator_roles_aggregated'] | undefined>
      | undefined;
    production_materials_production_methods?:
      | Array<
          GraphQLTypes['production_materials_production_methods'] | undefined
        >
      | undefined;
    production_materials_production_methods_by_id?:
      | GraphQLTypes['production_materials_production_methods']
      | undefined;
    production_materials_production_methods_aggregated?:
      | Array<
          | GraphQLTypes['production_materials_production_methods_aggregated']
          | undefined
        >
      | undefined;
    fulfillers?: Array<GraphQLTypes['fulfillers'] | undefined> | undefined;
    fulfillers_by_id?: GraphQLTypes['fulfillers'] | undefined;
    fulfillers_aggregated?:
      | Array<GraphQLTypes['fulfillers_aggregated'] | undefined>
      | undefined;
    price_currencies?:
      | Array<GraphQLTypes['price_currencies'] | undefined>
      | undefined;
    price_currencies_by_id?: GraphQLTypes['price_currencies'] | undefined;
    price_currencies_aggregated?:
      | Array<GraphQLTypes['price_currencies_aggregated'] | undefined>
      | undefined;
    products_files?:
      | Array<GraphQLTypes['products_files'] | undefined>
      | undefined;
    products_files_by_id?: GraphQLTypes['products_files'] | undefined;
    products_files_aggregated?:
      | Array<GraphQLTypes['products_files_aggregated'] | undefined>
      | undefined;
    products_production_methods?:
      | Array<GraphQLTypes['products_production_methods'] | undefined>
      | undefined;
    products_production_methods_by_id?:
      | GraphQLTypes['products_production_methods']
      | undefined;
    products_production_methods_aggregated?:
      | Array<
          GraphQLTypes['products_production_methods_aggregated'] | undefined
        >
      | undefined;
    skills?: Array<GraphQLTypes['skills'] | undefined> | undefined;
    skills_by_id?: GraphQLTypes['skills'] | undefined;
    skills_aggregated?:
      | Array<GraphQLTypes['skills_aggregated'] | undefined>
      | undefined;
    production_materials?:
      | Array<GraphQLTypes['production_materials'] | undefined>
      | undefined;
    production_materials_by_id?:
      | GraphQLTypes['production_materials']
      | undefined;
    production_materials_aggregated?:
      | Array<GraphQLTypes['production_materials_aggregated'] | undefined>
      | undefined;
    products?: Array<GraphQLTypes['products'] | undefined> | undefined;
    products_by_id?: GraphQLTypes['products'] | undefined;
    products_aggregated?:
      | Array<GraphQLTypes['products_aggregated'] | undefined>
      | undefined;
    products_production_materials?:
      | Array<GraphQLTypes['products_production_materials'] | undefined>
      | undefined;
    products_production_materials_by_id?:
      | GraphQLTypes['products_production_materials']
      | undefined;
    products_production_materials_aggregated?:
      | Array<
          GraphQLTypes['products_production_materials_aggregated'] | undefined
        >
      | undefined;
    products_wearables?:
      | Array<GraphQLTypes['products_wearables'] | undefined>
      | undefined;
    products_wearables_by_id?: GraphQLTypes['products_wearables'] | undefined;
    products_wearables_aggregated?:
      | Array<GraphQLTypes['products_wearables_aggregated'] | undefined>
      | undefined;
    file_formats?: Array<GraphQLTypes['file_formats'] | undefined> | undefined;
    file_formats_by_id?: GraphQLTypes['file_formats'] | undefined;
    file_formats_aggregated?:
      | Array<GraphQLTypes['file_formats_aggregated'] | undefined>
      | undefined;
    products_design_files?:
      | Array<GraphQLTypes['products_design_files'] | undefined>
      | undefined;
    products_design_files_by_id?:
      | GraphQLTypes['products_design_files']
      | undefined;
    products_design_files_aggregated?:
      | Array<GraphQLTypes['products_design_files_aggregated'] | undefined>
      | undefined;
    products_content?:
      | Array<GraphQLTypes['products_content'] | undefined>
      | undefined;
    products_content_by_id?: GraphQLTypes['products_content'] | undefined;
    products_content_aggregated?:
      | Array<GraphQLTypes['products_content_aggregated'] | undefined>
      | undefined;
    stages?: Array<GraphQLTypes['stages'] | undefined> | undefined;
    stages_by_id?: GraphQLTypes['stages'] | undefined;
    stages_aggregated?:
      | Array<GraphQLTypes['stages_aggregated'] | undefined>
      | undefined;
    junction_directus_users_skills?:
      | Array<GraphQLTypes['junction_directus_users_skills'] | undefined>
      | undefined;
    junction_directus_users_skills_by_id?:
      | GraphQLTypes['junction_directus_users_skills']
      | undefined;
    junction_directus_users_skills_aggregated?:
      | Array<
          GraphQLTypes['junction_directus_users_skills_aggregated'] | undefined
        >
      | undefined;
    collaborators?:
      | Array<GraphQLTypes['collaborators'] | undefined>
      | undefined;
    collaborators_by_id?: GraphQLTypes['collaborators'] | undefined;
    collaborators_aggregated?:
      | Array<GraphQLTypes['collaborators_aggregated'] | undefined>
      | undefined;
    brands_directus_users?:
      | Array<GraphQLTypes['brands_directus_users'] | undefined>
      | undefined;
    brands_directus_users_by_id?:
      | GraphQLTypes['brands_directus_users']
      | undefined;
    brands_directus_users_aggregated?:
      | Array<GraphQLTypes['brands_directus_users_aggregated'] | undefined>
      | undefined;
    products_contributors?:
      | Array<GraphQLTypes['products_contributors'] | undefined>
      | undefined;
    products_contributors_by_id?:
      | GraphQLTypes['products_contributors']
      | undefined;
    products_contributors_aggregated?:
      | Array<GraphQLTypes['products_contributors_aggregated'] | undefined>
      | undefined;
  };
  ['brands']: {
    __typename: 'brands';
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    description?: string | undefined;
    discord_url?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    logo?: GraphQLTypes['directus_files'] | undefined;
    name: string;
    twitter_url?: string | undefined;
    website_url?: string | undefined;
    notion_id?: string | undefined;
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
    id?: string | undefined;
    storage: string;
    filename_disk?: string | undefined;
    filename_download: string;
    title?: string | undefined;
    type?: string | undefined;
    folder?: GraphQLTypes['directus_folders'] | undefined;
    uploaded_by?: GraphQLTypes['directus_users'] | undefined;
    uploaded_on: GraphQLTypes['Date'];
    uploaded_on_func?: GraphQLTypes['datetime_functions'] | undefined;
    modified_by?: GraphQLTypes['directus_users'] | undefined;
    modified_on: GraphQLTypes['Date'];
    modified_on_func?: GraphQLTypes['datetime_functions'] | undefined;
    charset?: string | undefined;
    filesize?: string | undefined;
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
    id?: string | undefined;
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
    id?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    email?: string | undefined;
    password?: string | undefined;
    location?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    tags_func?: GraphQLTypes['count_functions'] | undefined;
    avatar?: GraphQLTypes['directus_files'] | undefined;
    language?: string | undefined;
    theme?: string | undefined;
    tfa_secret?: string | undefined;
    status: string;
    role?: GraphQLTypes['directus_roles'] | undefined;
    token?: string | undefined;
    last_access?: GraphQLTypes['Date'] | undefined;
    last_access_func?: GraphQLTypes['datetime_functions'] | undefined;
    last_page?: string | undefined;
    provider: string;
    external_identifier?: string | undefined;
    auth_data?: GraphQLTypes['JSON'] | undefined;
    auth_data_func?: GraphQLTypes['count_functions'] | undefined;
    email_notifications?: boolean | undefined;
    timezone?: string | undefined;
    discord_handle?: string | undefined;
    twitter_handle?: string | undefined;
    discord_id?: string | undefined;
    collaborators?:
      | Array<GraphQLTypes['collaborators'] | undefined>
      | undefined;
    collaborators_func?: GraphQLTypes['count_functions'] | undefined;
    skills?:
      | Array<GraphQLTypes['junction_directus_users_skills'] | undefined>
      | undefined;
    skills_func?: GraphQLTypes['count_functions'] | undefined;
  };
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
    filesize?: GraphQLTypes['string_filter_operators'] | undefined;
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
    password?: GraphQLTypes['string_filter_operators'] | undefined;
    location?: GraphQLTypes['string_filter_operators'] | undefined;
    title?: GraphQLTypes['string_filter_operators'] | undefined;
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    tags?: GraphQLTypes['string_filter_operators'] | undefined;
    tags_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    avatar?: GraphQLTypes['directus_files_filter'] | undefined;
    language?: GraphQLTypes['string_filter_operators'] | undefined;
    theme?: GraphQLTypes['string_filter_operators'] | undefined;
    tfa_secret?: GraphQLTypes['string_filter_operators'] | undefined;
    status?: GraphQLTypes['string_filter_operators'] | undefined;
    role?: GraphQLTypes['directus_roles_filter'] | undefined;
    token?: GraphQLTypes['string_filter_operators'] | undefined;
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
    timezone?: GraphQLTypes['string_filter_operators'] | undefined;
    discord_handle?: GraphQLTypes['string_filter_operators'] | undefined;
    twitter_handle?: GraphQLTypes['string_filter_operators'] | undefined;
    discord_id?: GraphQLTypes['string_filter_operators'] | undefined;
    collaborators?: GraphQLTypes['collaborators_filter'] | undefined;
    collaborators_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    skills?: GraphQLTypes['junction_directus_users_skills_filter'] | undefined;
    skills_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    _and?: Array<GraphQLTypes['directus_users_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['directus_users_filter'] | undefined> | undefined;
  };
  ['count_function_filter_operators']: {
    count?: GraphQLTypes['number_filter_operators'] | undefined;
  };
  ['number_filter_operators']: {
    _eq?: number | undefined;
    _neq?: number | undefined;
    _in?: Array<number | undefined> | undefined;
    _nin?: Array<number | undefined> | undefined;
    _gt?: number | undefined;
    _gte?: number | undefined;
    _lt?: number | undefined;
    _lte?: number | undefined;
    _null?: boolean | undefined;
    _nnull?: boolean | undefined;
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
  ['date_filter_operators']: {
    _eq?: string | undefined;
    _neq?: string | undefined;
    _gt?: string | undefined;
    _gte?: string | undefined;
    _lt?: string | undefined;
    _lte?: string | undefined;
    _null?: boolean | undefined;
    _nnull?: boolean | undefined;
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
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    user_created?: GraphQLTypes['directus_users_filter'] | undefined;
    date_created?: GraphQLTypes['date_filter_operators'] | undefined;
    date_created_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    date_updated?: GraphQLTypes['date_filter_operators'] | undefined;
    date_updated_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    account?: GraphQLTypes['directus_users_filter'] | undefined;
    display_name?: GraphQLTypes['string_filter_operators'] | undefined;
    payment_eth_address?: GraphQLTypes['string_filter_operators'] | undefined;
    role?: GraphQLTypes['collaborator_roles_filter'] | undefined;
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
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    directus_users_id?: GraphQLTypes['directus_users_filter'] | undefined;
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
    id?: GraphQLTypes['string_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    _and?: Array<GraphQLTypes['skills_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['skills_filter'] | undefined> | undefined;
  };
  ['directus_roles']: {
    __typename: 'directus_roles';
    id?: string | undefined;
    name: string;
    icon: string;
    description?: string | undefined;
    ip_access?: Array<string | undefined> | undefined;
    enforce_tfa: boolean;
    admin_access: boolean;
    app_access: boolean;
    users?: Array<GraphQLTypes['directus_users'] | undefined> | undefined;
    users_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['collaborators']: {
    __typename: 'collaborators';
    id?: string | undefined;
    user_created?: GraphQLTypes['directus_users'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functions'] | undefined;
    date_updated?: GraphQLTypes['Date'] | undefined;
    date_updated_func?: GraphQLTypes['datetime_functions'] | undefined;
    account?: GraphQLTypes['directus_users'] | undefined;
    display_name?: string | undefined;
    payment_eth_address?: string | undefined;
    role?: GraphQLTypes['collaborator_roles'] | undefined;
  };
  ['collaborator_roles']: {
    __typename: 'collaborator_roles';
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
  };
  ['junction_directus_users_skills']: {
    __typename: 'junction_directus_users_skills';
    id?: string | undefined;
    directus_users_id?: GraphQLTypes['directus_users'] | undefined;
    skills_id?: GraphQLTypes['skills'] | undefined;
  };
  ['skills']: {
    __typename: 'skills';
    description?: string | undefined;
    id?: string | undefined;
    name: string;
  };
  ['products']: {
    __typename: 'products';
    brand_id?: GraphQLTypes['brands'] | undefined;
    brand_reward_share?: number | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    description?: string | undefined;
    discord_channel_id?: string | undefined;
    fulfiller_id?: GraphQLTypes['fulfillers'] | undefined;
    id?: string | undefined;
    name: string;
    notion_id?: string | undefined;
    price?: GraphQLTypes['price_currencies'] | undefined;
    producer_id?: GraphQLTypes['producers'] | undefined;
    production_cost?: number | undefined;
    quantity?: string | undefined;
    sale_type?: string | undefined;
    shopify_id?: string | undefined;
    status?: string | undefined;
    season?: number | undefined;
    release_date?: GraphQLTypes['Date'] | undefined;
    release_date_func?: GraphQLTypes['datetime_functions'] | undefined;
    clo3d_file?: GraphQLTypes['directus_files'] | undefined;
    product_stage?: GraphQLTypes['stages'] | undefined;
    nft_token_id?: number | undefined;
    contributor_reward_share?: number | undefined;
    production_methods?:
      | Array<GraphQLTypes['products_production_methods'] | undefined>
      | undefined;
    production_methods_func?: GraphQLTypes['count_functions'] | undefined;
    images?: Array<GraphQLTypes['products_files'] | undefined> | undefined;
    images_func?: GraphQLTypes['count_functions'] | undefined;
    materials?:
      | Array<GraphQLTypes['products_production_materials'] | undefined>
      | undefined;
    materials_func?: GraphQLTypes['count_functions'] | undefined;
    wearable_files?:
      | Array<GraphQLTypes['products_wearables'] | undefined>
      | undefined;
    wearable_files_func?: GraphQLTypes['count_functions'] | undefined;
    content?: Array<GraphQLTypes['products_content'] | undefined> | undefined;
    content_func?: GraphQLTypes['count_functions'] | undefined;
    design_files?:
      | Array<GraphQLTypes['products_design_files'] | undefined>
      | undefined;
    design_files_func?: GraphQLTypes['count_functions'] | undefined;
    contributors?:
      | Array<GraphQLTypes['products_contributors'] | undefined>
      | undefined;
    contributors_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['brands_filter']: {
    created_at?: GraphQLTypes['date_filter_operators'] | undefined;
    created_at_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    discord_url?: GraphQLTypes['string_filter_operators'] | undefined;
    eth_address?: GraphQLTypes['string_filter_operators'] | undefined;
    id?: GraphQLTypes['string_filter_operators'] | undefined;
    logo?: GraphQLTypes['directus_files_filter'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    twitter_url?: GraphQLTypes['string_filter_operators'] | undefined;
    website_url?: GraphQLTypes['string_filter_operators'] | undefined;
    notion_id?: GraphQLTypes['string_filter_operators'] | undefined;
    products?: GraphQLTypes['products_filter'] | undefined;
    products_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    users?: GraphQLTypes['brands_directus_users_filter'] | undefined;
    users_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    _and?: Array<GraphQLTypes['brands_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['brands_filter'] | undefined> | undefined;
  };
  ['products_filter']: {
    brand_id?: GraphQLTypes['brands_filter'] | undefined;
    brand_reward_share?: GraphQLTypes['number_filter_operators'] | undefined;
    created_at?: GraphQLTypes['date_filter_operators'] | undefined;
    created_at_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    discord_channel_id?: GraphQLTypes['string_filter_operators'] | undefined;
    fulfiller_id?: GraphQLTypes['fulfillers_filter'] | undefined;
    id?: GraphQLTypes['string_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    notion_id?: GraphQLTypes['string_filter_operators'] | undefined;
    price?: GraphQLTypes['price_currencies_filter'] | undefined;
    producer_id?: GraphQLTypes['producers_filter'] | undefined;
    production_cost?: GraphQLTypes['number_filter_operators'] | undefined;
    quantity?: GraphQLTypes['string_filter_operators'] | undefined;
    sale_type?: GraphQLTypes['string_filter_operators'] | undefined;
    shopify_id?: GraphQLTypes['string_filter_operators'] | undefined;
    status?: GraphQLTypes['string_filter_operators'] | undefined;
    season?: GraphQLTypes['number_filter_operators'] | undefined;
    release_date?: GraphQLTypes['date_filter_operators'] | undefined;
    release_date_func?:
      | GraphQLTypes['datetime_function_filter_operators']
      | undefined;
    clo3d_file?: GraphQLTypes['directus_files_filter'] | undefined;
    product_stage?: GraphQLTypes['stages_filter'] | undefined;
    nft_token_id?: GraphQLTypes['number_filter_operators'] | undefined;
    contributor_reward_share?:
      | GraphQLTypes['number_filter_operators']
      | undefined;
    production_methods?:
      | GraphQLTypes['products_production_methods_filter']
      | undefined;
    production_methods_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    images?: GraphQLTypes['products_files_filter'] | undefined;
    images_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    materials?:
      | GraphQLTypes['products_production_materials_filter']
      | undefined;
    materials_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    wearable_files?: GraphQLTypes['products_wearables_filter'] | undefined;
    wearable_files_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    content?: GraphQLTypes['products_content_filter'] | undefined;
    content_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    design_files?: GraphQLTypes['products_design_files_filter'] | undefined;
    design_files_func?:
      | GraphQLTypes['count_function_filter_operators']
      | undefined;
    contributors?: GraphQLTypes['products_contributors_filter'] | undefined;
    contributors_func?:
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
    id?: GraphQLTypes['string_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    website_url?: GraphQLTypes['string_filter_operators'] | undefined;
    _and?: Array<GraphQLTypes['fulfillers_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['fulfillers_filter'] | undefined> | undefined;
  };
  ['price_currencies_filter']: {
    amount?: GraphQLTypes['number_filter_operators'] | undefined;
    currency?: GraphQLTypes['string_filter_operators'] | undefined;
    id?: GraphQLTypes['string_filter_operators'] | undefined;
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
    id?: GraphQLTypes['string_filter_operators'] | undefined;
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
    id?: GraphQLTypes['string_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    neck_tag?: GraphQLTypes['boolean_filter_operators'] | undefined;
    rating?: GraphQLTypes['string_filter_operators'] | undefined;
    size_guide?: GraphQLTypes['directus_files_filter'] | undefined;
    supplier?: GraphQLTypes['producers_filter'] | undefined;
    tags?: GraphQLTypes['string_filter_operators'] | undefined;
    tags_func?: GraphQLTypes['count_function_filter_operators'] | undefined;
    made_in?: GraphQLTypes['string_filter_operators'] | undefined;
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
    id?: GraphQLTypes['string_filter_operators'] | undefined;
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
  ['stages_filter']: {
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    sort?: GraphQLTypes['number_filter_operators'] | undefined;
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    _and?: Array<GraphQLTypes['stages_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['stages_filter'] | undefined> | undefined;
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
  ['products_files_filter']: {
    directus_files_id?: GraphQLTypes['directus_files_filter'] | undefined;
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    products_id?: GraphQLTypes['products_filter'] | undefined;
    _and?: Array<GraphQLTypes['products_files_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['products_files_filter'] | undefined> | undefined;
  };
  ['products_production_materials_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    products_id?: GraphQLTypes['products_filter'] | undefined;
    production_materials_id?:
      | GraphQLTypes['production_materials_filter']
      | undefined;
    _and?:
      | Array<GraphQLTypes['products_production_materials_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['products_production_materials_filter'] | undefined>
      | undefined;
  };
  ['products_wearables_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    products_id?: GraphQLTypes['products_filter'] | undefined;
    directus_files_id?: GraphQLTypes['directus_files_filter'] | undefined;
    file_format?: GraphQLTypes['file_formats_filter'] | undefined;
    primary?: GraphQLTypes['boolean_filter_operators'] | undefined;
    _and?:
      | Array<GraphQLTypes['products_wearables_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['products_wearables_filter'] | undefined>
      | undefined;
  };
  ['file_formats_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    mime_type?: GraphQLTypes['string_filter_operators'] | undefined;
    extension?: GraphQLTypes['string_filter_operators'] | undefined;
    description?: GraphQLTypes['string_filter_operators'] | undefined;
    name?: GraphQLTypes['string_filter_operators'] | undefined;
    _and?: Array<GraphQLTypes['file_formats_filter'] | undefined> | undefined;
    _or?: Array<GraphQLTypes['file_formats_filter'] | undefined> | undefined;
  };
  ['products_content_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    products_id?: GraphQLTypes['products_filter'] | undefined;
    directus_files_id?: GraphQLTypes['directus_files_filter'] | undefined;
    _and?:
      | Array<GraphQLTypes['products_content_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['products_content_filter'] | undefined>
      | undefined;
  };
  ['products_design_files_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    products_id?: GraphQLTypes['products_filter'] | undefined;
    directus_files_id?: GraphQLTypes['directus_files_filter'] | undefined;
    _and?:
      | Array<GraphQLTypes['products_design_files_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['products_design_files_filter'] | undefined>
      | undefined;
  };
  ['products_contributors_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    products_id?: GraphQLTypes['products_filter'] | undefined;
    collaborators_id?: GraphQLTypes['collaborators_filter'] | undefined;
    contribution_share?: GraphQLTypes['number_filter_operators'] | undefined;
    robot_earned?: GraphQLTypes['number_filter_operators'] | undefined;
    _and?:
      | Array<GraphQLTypes['products_contributors_filter'] | undefined>
      | undefined;
    _or?:
      | Array<GraphQLTypes['products_contributors_filter'] | undefined>
      | undefined;
  };
  ['brands_directus_users_filter']: {
    id?: GraphQLTypes['number_filter_operators'] | undefined;
    brands_id?: GraphQLTypes['brands_filter'] | undefined;
    directus_users_id?: GraphQLTypes['directus_users_filter'] | undefined;
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
    id?: string | undefined;
    name?: string | undefined;
    website_url?: string | undefined;
  };
  ['price_currencies']: {
    __typename: 'price_currencies';
    amount: number;
    currency?: string | undefined;
    id?: string | undefined;
  };
  ['producers']: {
    __typename: 'producers';
    created_at: GraphQLTypes['Date'];
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    email?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
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
    id?: string | undefined;
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
    created_at: GraphQLTypes['Date'];
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    created_by?: GraphQLTypes['directus_users'] | undefined;
    description?: string | undefined;
    gender?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    neck_tag?: boolean | undefined;
    rating?: string | undefined;
    size_guide?: GraphQLTypes['directus_files'] | undefined;
    supplier?: GraphQLTypes['producers'] | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    tags_func?: GraphQLTypes['count_functions'] | undefined;
    made_in?: string | undefined;
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
  };
  ['production_materials_production_methods']: {
    __typename: 'production_materials_production_methods';
    id?: string | undefined;
    production_materials_id?: GraphQLTypes['production_materials'] | undefined;
    production_methods_id?: GraphQLTypes['production_methods'] | undefined;
  };
  ['production_methods']: {
    __typename: 'production_methods';
    created_at: GraphQLTypes['Date'];
    created_at_func?: GraphQLTypes['datetime_functions'] | undefined;
    description?: string | undefined;
    id?: string | undefined;
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
    id?: string | undefined;
    producers_id?: GraphQLTypes['producers'] | undefined;
    production_methods_id?: GraphQLTypes['production_methods'] | undefined;
  };
  ['stages']: {
    __typename: 'stages';
    name?: string | undefined;
    sort?: number | undefined;
    description?: string | undefined;
  };
  ['products_production_methods']: {
    __typename: 'products_production_methods';
    id?: string | undefined;
    production_methods_id?: GraphQLTypes['production_methods'] | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
  };
  ['products_files']: {
    __typename: 'products_files';
    directus_files_id?: GraphQLTypes['directus_files'] | undefined;
    id?: string | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
  };
  ['products_production_materials']: {
    __typename: 'products_production_materials';
    id?: string | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
    production_materials_id?: GraphQLTypes['production_materials'] | undefined;
  };
  ['products_wearables']: {
    __typename: 'products_wearables';
    id?: string | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
    directus_files_id?: GraphQLTypes['directus_files'] | undefined;
    file_format?: GraphQLTypes['file_formats'] | undefined;
    primary?: boolean | undefined;
  };
  ['file_formats']: {
    __typename: 'file_formats';
    id?: string | undefined;
    mime_type?: string | undefined;
    extension?: string | undefined;
    description?: string | undefined;
    name: string;
  };
  ['products_content']: {
    __typename: 'products_content';
    id?: string | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
    directus_files_id?: GraphQLTypes['directus_files'] | undefined;
  };
  ['products_design_files']: {
    __typename: 'products_design_files';
    id?: string | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
    directus_files_id?: GraphQLTypes['directus_files'] | undefined;
  };
  ['products_contributors']: {
    __typename: 'products_contributors';
    id?: string | undefined;
    products_id?: GraphQLTypes['products'] | undefined;
    collaborators_id?: GraphQLTypes['collaborators'] | undefined;
    contribution_share?: number | undefined;
    robot_earned?: number | undefined;
  };
  ['brands_directus_users']: {
    __typename: 'brands_directus_users';
    id?: string | undefined;
    brands_id?: GraphQLTypes['brands'] | undefined;
    directus_users_id?: GraphQLTypes['directus_users'] | undefined;
  };
  ['brands_aggregated']: {
    __typename: 'brands_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['brands_aggregated_count'] | undefined;
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
    twitter_url?: number | undefined;
    website_url?: number | undefined;
    notion_id?: number | undefined;
    products?: number | undefined;
    users?: number | undefined;
  };
  ['producers_aggregated']: {
    __typename: 'producers_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['producers_aggregated_count'] | undefined;
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
    avg?:
      | GraphQLTypes['producers_production_materials_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['producers_production_materials_aggregated_fields']
      | undefined;
    countDistinct?:
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
    quantity?: number | undefined;
  };
  ['producers_production_methods_aggregated']: {
    __typename: 'producers_production_methods_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['producers_production_methods_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['producers_production_methods_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['producers_production_methods_aggregated_fields']
      | undefined;
    countDistinct?:
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
  };
  ['production_methods_aggregated']: {
    __typename: 'production_methods_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['production_methods_aggregated_count'] | undefined;
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
  ['collaborator_roles_aggregated']: {
    __typename: 'collaborator_roles_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['collaborator_roles_aggregated_count'] | undefined;
    avg?: GraphQLTypes['collaborator_roles_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['collaborator_roles_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['collaborator_roles_aggregated_fields']
      | undefined;
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
  ['production_materials_production_methods_aggregated']: {
    __typename: 'production_materials_production_methods_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['production_materials_production_methods_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['production_materials_production_methods_aggregated_fields']
      | undefined;
    countDistinct?:
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
  };
  ['fulfillers_aggregated']: {
    __typename: 'fulfillers_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['fulfillers_aggregated_count'] | undefined;
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
    avg?: GraphQLTypes['price_currencies_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['price_currencies_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['price_currencies_aggregated_fields']
      | undefined;
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
  };
  ['products_files_aggregated']: {
    __typename: 'products_files_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_files_aggregated_count'] | undefined;
    avg?: GraphQLTypes['products_files_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_files_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['products_files_aggregated_fields']
      | undefined;
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
  };
  ['products_production_methods_aggregated']: {
    __typename: 'products_production_methods_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['products_production_methods_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['products_production_methods_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['products_production_methods_aggregated_fields']
      | undefined;
    countDistinct?:
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
  };
  ['skills_aggregated']: {
    __typename: 'skills_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['skills_aggregated_count'] | undefined;
  };
  ['skills_aggregated_count']: {
    __typename: 'skills_aggregated_count';
    description?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
  };
  ['production_materials_aggregated']: {
    __typename: 'production_materials_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['production_materials_aggregated_count'] | undefined;
    avg?: GraphQLTypes['production_materials_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['production_materials_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['production_materials_aggregated_fields']
      | undefined;
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
    name?: number | undefined;
    neck_tag?: number | undefined;
    rating?: number | undefined;
    size_guide?: number | undefined;
    supplier?: number | undefined;
    tags?: number | undefined;
    made_in?: number | undefined;
    production_methods?: number | undefined;
    stocked_at?: number | undefined;
  };
  ['production_materials_aggregated_fields']: {
    __typename: 'production_materials_aggregated_fields';
    base_price?: number | undefined;
  };
  ['products_aggregated']: {
    __typename: 'products_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_aggregated_count'] | undefined;
    avg?: GraphQLTypes['products_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_aggregated_fields'] | undefined;
    countDistinct?: GraphQLTypes['products_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['products_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['products_aggregated_fields'] | undefined;
    min?: GraphQLTypes['products_aggregated_fields'] | undefined;
    max?: GraphQLTypes['products_aggregated_fields'] | undefined;
  };
  ['products_aggregated_count']: {
    __typename: 'products_aggregated_count';
    brand_id?: number | undefined;
    brand_reward_share?: number | undefined;
    created_at?: number | undefined;
    description?: number | undefined;
    discord_channel_id?: number | undefined;
    fulfiller_id?: number | undefined;
    id?: number | undefined;
    name?: number | undefined;
    notion_id?: number | undefined;
    price?: number | undefined;
    producer_id?: number | undefined;
    production_cost?: number | undefined;
    quantity?: number | undefined;
    sale_type?: number | undefined;
    shopify_id?: number | undefined;
    status?: number | undefined;
    season?: number | undefined;
    release_date?: number | undefined;
    clo3d_file?: number | undefined;
    product_stage?: number | undefined;
    nft_token_id?: number | undefined;
    contributor_reward_share?: number | undefined;
    production_methods?: number | undefined;
    images?: number | undefined;
    materials?: number | undefined;
    wearable_files?: number | undefined;
    content?: number | undefined;
    design_files?: number | undefined;
    contributors?: number | undefined;
  };
  ['products_aggregated_fields']: {
    __typename: 'products_aggregated_fields';
    brand_reward_share?: number | undefined;
    production_cost?: number | undefined;
    season?: number | undefined;
    nft_token_id?: number | undefined;
    contributor_reward_share?: number | undefined;
  };
  ['products_production_materials_aggregated']: {
    __typename: 'products_production_materials_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['products_production_materials_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['products_production_materials_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['products_production_materials_aggregated_fields']
      | undefined;
    countDistinct?:
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
    products_id?: number | undefined;
    production_materials_id?: number | undefined;
  };
  ['products_production_materials_aggregated_fields']: {
    __typename: 'products_production_materials_aggregated_fields';
    id?: number | undefined;
  };
  ['products_wearables_aggregated']: {
    __typename: 'products_wearables_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_wearables_aggregated_count'] | undefined;
    avg?: GraphQLTypes['products_wearables_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_wearables_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['products_wearables_aggregated_fields']
      | undefined;
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
    id?: number | undefined;
    products_id?: number | undefined;
    directus_files_id?: number | undefined;
    file_format?: number | undefined;
    primary?: number | undefined;
  };
  ['products_wearables_aggregated_fields']: {
    __typename: 'products_wearables_aggregated_fields';
    id?: number | undefined;
    file_format?: number | undefined;
  };
  ['file_formats_aggregated']: {
    __typename: 'file_formats_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['file_formats_aggregated_count'] | undefined;
    avg?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    countDistinct?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    min?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
    max?: GraphQLTypes['file_formats_aggregated_fields'] | undefined;
  };
  ['file_formats_aggregated_count']: {
    __typename: 'file_formats_aggregated_count';
    id?: number | undefined;
    mime_type?: number | undefined;
    extension?: number | undefined;
    description?: number | undefined;
    name?: number | undefined;
  };
  ['file_formats_aggregated_fields']: {
    __typename: 'file_formats_aggregated_fields';
    id?: number | undefined;
  };
  ['products_design_files_aggregated']: {
    __typename: 'products_design_files_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_design_files_aggregated_count'] | undefined;
    avg?: GraphQLTypes['products_design_files_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_design_files_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['products_design_files_aggregated_fields']
      | undefined;
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
    id?: number | undefined;
    products_id?: number | undefined;
    directus_files_id?: number | undefined;
  };
  ['products_design_files_aggregated_fields']: {
    __typename: 'products_design_files_aggregated_fields';
    id?: number | undefined;
  };
  ['products_content_aggregated']: {
    __typename: 'products_content_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_content_aggregated_count'] | undefined;
    avg?: GraphQLTypes['products_content_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_content_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['products_content_aggregated_fields']
      | undefined;
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
    id?: number | undefined;
    products_id?: number | undefined;
    directus_files_id?: number | undefined;
  };
  ['products_content_aggregated_fields']: {
    __typename: 'products_content_aggregated_fields';
    id?: number | undefined;
  };
  ['stages_aggregated']: {
    __typename: 'stages_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['stages_aggregated_count'] | undefined;
    avg?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    countDistinct?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    min?: GraphQLTypes['stages_aggregated_fields'] | undefined;
    max?: GraphQLTypes['stages_aggregated_fields'] | undefined;
  };
  ['stages_aggregated_count']: {
    __typename: 'stages_aggregated_count';
    name?: number | undefined;
    sort?: number | undefined;
    description?: number | undefined;
  };
  ['stages_aggregated_fields']: {
    __typename: 'stages_aggregated_fields';
    sort?: number | undefined;
  };
  ['junction_directus_users_skills_aggregated']: {
    __typename: 'junction_directus_users_skills_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?:
      | GraphQLTypes['junction_directus_users_skills_aggregated_count']
      | undefined;
    avg?:
      | GraphQLTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
    sum?:
      | GraphQLTypes['junction_directus_users_skills_aggregated_fields']
      | undefined;
    countDistinct?:
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
    id?: number | undefined;
    directus_users_id?: number | undefined;
    skills_id?: number | undefined;
  };
  ['junction_directus_users_skills_aggregated_fields']: {
    __typename: 'junction_directus_users_skills_aggregated_fields';
    id?: number | undefined;
  };
  ['collaborators_aggregated']: {
    __typename: 'collaborators_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['collaborators_aggregated_count'] | undefined;
    avg?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    countDistinct?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    avgDistinct?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    min?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
    max?: GraphQLTypes['collaborators_aggregated_fields'] | undefined;
  };
  ['collaborators_aggregated_count']: {
    __typename: 'collaborators_aggregated_count';
    id?: number | undefined;
    user_created?: number | undefined;
    date_created?: number | undefined;
    date_updated?: number | undefined;
    account?: number | undefined;
    display_name?: number | undefined;
    payment_eth_address?: number | undefined;
    role?: number | undefined;
  };
  ['collaborators_aggregated_fields']: {
    __typename: 'collaborators_aggregated_fields';
    id?: number | undefined;
    role?: number | undefined;
  };
  ['brands_directus_users_aggregated']: {
    __typename: 'brands_directus_users_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['brands_directus_users_aggregated_count'] | undefined;
    avg?: GraphQLTypes['brands_directus_users_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['brands_directus_users_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['brands_directus_users_aggregated_fields']
      | undefined;
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
    id?: number | undefined;
    brands_id?: number | undefined;
    directus_users_id?: number | undefined;
  };
  ['brands_directus_users_aggregated_fields']: {
    __typename: 'brands_directus_users_aggregated_fields';
    id?: number | undefined;
  };
  ['products_contributors_aggregated']: {
    __typename: 'products_contributors_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['products_contributors_aggregated_count'] | undefined;
    avg?: GraphQLTypes['products_contributors_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['products_contributors_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['products_contributors_aggregated_fields']
      | undefined;
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
    id?: number | undefined;
    products_id?: number | undefined;
    collaborators_id?: number | undefined;
    contribution_share?: number | undefined;
    robot_earned?: number | undefined;
  };
  ['products_contributors_aggregated_fields']: {
    __typename: 'products_contributors_aggregated_fields';
    id?: number | undefined;
    collaborators_id?: number | undefined;
    contribution_share?: number | undefined;
    robot_earned?: number | undefined;
  };
  ['Mutation']: {
    __typename: 'Mutation';
    create_brands_items?: Array<GraphQLTypes['brands'] | undefined> | undefined;
    create_brands_item?: GraphQLTypes['brands'] | undefined;
    create_producers_items?:
      | Array<GraphQLTypes['producers'] | undefined>
      | undefined;
    create_producers_item?: GraphQLTypes['producers'] | undefined;
    create_producers_production_materials_items?:
      | Array<GraphQLTypes['producers_production_materials'] | undefined>
      | undefined;
    create_producers_production_materials_item?:
      | GraphQLTypes['producers_production_materials']
      | undefined;
    create_producers_production_methods_items?:
      | Array<GraphQLTypes['producers_production_methods'] | undefined>
      | undefined;
    create_producers_production_methods_item?:
      | GraphQLTypes['producers_production_methods']
      | undefined;
    create_production_methods_items?:
      | Array<GraphQLTypes['production_methods'] | undefined>
      | undefined;
    create_production_methods_item?:
      | GraphQLTypes['production_methods']
      | undefined;
    create_collaborator_roles_items?:
      | Array<GraphQLTypes['collaborator_roles'] | undefined>
      | undefined;
    create_collaborator_roles_item?:
      | GraphQLTypes['collaborator_roles']
      | undefined;
    create_production_materials_production_methods_items?:
      | Array<
          GraphQLTypes['production_materials_production_methods'] | undefined
        >
      | undefined;
    create_production_materials_production_methods_item?:
      | GraphQLTypes['production_materials_production_methods']
      | undefined;
    create_fulfillers_items?:
      | Array<GraphQLTypes['fulfillers'] | undefined>
      | undefined;
    create_fulfillers_item?: GraphQLTypes['fulfillers'] | undefined;
    create_price_currencies_items?:
      | Array<GraphQLTypes['price_currencies'] | undefined>
      | undefined;
    create_price_currencies_item?: GraphQLTypes['price_currencies'] | undefined;
    create_products_files_items?:
      | Array<GraphQLTypes['products_files'] | undefined>
      | undefined;
    create_products_files_item?: GraphQLTypes['products_files'] | undefined;
    create_products_production_methods_items?:
      | Array<GraphQLTypes['products_production_methods'] | undefined>
      | undefined;
    create_products_production_methods_item?:
      | GraphQLTypes['products_production_methods']
      | undefined;
    create_skills_items?: Array<GraphQLTypes['skills'] | undefined> | undefined;
    create_skills_item?: GraphQLTypes['skills'] | undefined;
    create_production_materials_items?:
      | Array<GraphQLTypes['production_materials'] | undefined>
      | undefined;
    create_production_materials_item?:
      | GraphQLTypes['production_materials']
      | undefined;
    create_products_items?:
      | Array<GraphQLTypes['products'] | undefined>
      | undefined;
    create_products_item?: GraphQLTypes['products'] | undefined;
    create_products_production_materials_items?:
      | Array<GraphQLTypes['products_production_materials'] | undefined>
      | undefined;
    create_products_production_materials_item?:
      | GraphQLTypes['products_production_materials']
      | undefined;
    create_products_wearables_items?:
      | Array<GraphQLTypes['products_wearables'] | undefined>
      | undefined;
    create_products_wearables_item?:
      | GraphQLTypes['products_wearables']
      | undefined;
    create_file_formats_items?:
      | Array<GraphQLTypes['file_formats'] | undefined>
      | undefined;
    create_file_formats_item?: GraphQLTypes['file_formats'] | undefined;
    create_products_design_files_items?:
      | Array<GraphQLTypes['products_design_files'] | undefined>
      | undefined;
    create_products_design_files_item?:
      | GraphQLTypes['products_design_files']
      | undefined;
    create_products_content_items?:
      | Array<GraphQLTypes['products_content'] | undefined>
      | undefined;
    create_products_content_item?: GraphQLTypes['products_content'] | undefined;
    create_stages_items?: Array<GraphQLTypes['stages'] | undefined> | undefined;
    create_stages_item?: GraphQLTypes['stages'] | undefined;
    create_junction_directus_users_skills_items?:
      | Array<GraphQLTypes['junction_directus_users_skills'] | undefined>
      | undefined;
    create_junction_directus_users_skills_item?:
      | GraphQLTypes['junction_directus_users_skills']
      | undefined;
    create_collaborators_items?:
      | Array<GraphQLTypes['collaborators'] | undefined>
      | undefined;
    create_collaborators_item?: GraphQLTypes['collaborators'] | undefined;
    create_brands_directus_users_items?:
      | Array<GraphQLTypes['brands_directus_users'] | undefined>
      | undefined;
    create_brands_directus_users_item?:
      | GraphQLTypes['brands_directus_users']
      | undefined;
    create_products_contributors_items?:
      | Array<GraphQLTypes['products_contributors'] | undefined>
      | undefined;
    create_products_contributors_item?:
      | GraphQLTypes['products_contributors']
      | undefined;
    update_brands_items?: Array<GraphQLTypes['brands'] | undefined> | undefined;
    update_brands_item?: GraphQLTypes['brands'] | undefined;
    update_producers_items?:
      | Array<GraphQLTypes['producers'] | undefined>
      | undefined;
    update_producers_item?: GraphQLTypes['producers'] | undefined;
    update_producers_production_materials_items?:
      | Array<GraphQLTypes['producers_production_materials'] | undefined>
      | undefined;
    update_producers_production_materials_item?:
      | GraphQLTypes['producers_production_materials']
      | undefined;
    update_producers_production_methods_items?:
      | Array<GraphQLTypes['producers_production_methods'] | undefined>
      | undefined;
    update_producers_production_methods_item?:
      | GraphQLTypes['producers_production_methods']
      | undefined;
    update_production_methods_items?:
      | Array<GraphQLTypes['production_methods'] | undefined>
      | undefined;
    update_production_methods_item?:
      | GraphQLTypes['production_methods']
      | undefined;
    update_collaborator_roles_items?:
      | Array<GraphQLTypes['collaborator_roles'] | undefined>
      | undefined;
    update_collaborator_roles_item?:
      | GraphQLTypes['collaborator_roles']
      | undefined;
    update_production_materials_production_methods_items?:
      | Array<
          GraphQLTypes['production_materials_production_methods'] | undefined
        >
      | undefined;
    update_production_materials_production_methods_item?:
      | GraphQLTypes['production_materials_production_methods']
      | undefined;
    update_fulfillers_items?:
      | Array<GraphQLTypes['fulfillers'] | undefined>
      | undefined;
    update_fulfillers_item?: GraphQLTypes['fulfillers'] | undefined;
    update_price_currencies_items?:
      | Array<GraphQLTypes['price_currencies'] | undefined>
      | undefined;
    update_price_currencies_item?: GraphQLTypes['price_currencies'] | undefined;
    update_products_files_items?:
      | Array<GraphQLTypes['products_files'] | undefined>
      | undefined;
    update_products_files_item?: GraphQLTypes['products_files'] | undefined;
    update_products_production_methods_items?:
      | Array<GraphQLTypes['products_production_methods'] | undefined>
      | undefined;
    update_products_production_methods_item?:
      | GraphQLTypes['products_production_methods']
      | undefined;
    update_skills_items?: Array<GraphQLTypes['skills'] | undefined> | undefined;
    update_skills_item?: GraphQLTypes['skills'] | undefined;
    update_production_materials_items?:
      | Array<GraphQLTypes['production_materials'] | undefined>
      | undefined;
    update_production_materials_item?:
      | GraphQLTypes['production_materials']
      | undefined;
    update_products_items?:
      | Array<GraphQLTypes['products'] | undefined>
      | undefined;
    update_products_item?: GraphQLTypes['products'] | undefined;
    update_products_production_materials_items?:
      | Array<GraphQLTypes['products_production_materials'] | undefined>
      | undefined;
    update_products_production_materials_item?:
      | GraphQLTypes['products_production_materials']
      | undefined;
    update_products_wearables_items?:
      | Array<GraphQLTypes['products_wearables'] | undefined>
      | undefined;
    update_products_wearables_item?:
      | GraphQLTypes['products_wearables']
      | undefined;
    update_file_formats_items?:
      | Array<GraphQLTypes['file_formats'] | undefined>
      | undefined;
    update_file_formats_item?: GraphQLTypes['file_formats'] | undefined;
    update_products_design_files_items?:
      | Array<GraphQLTypes['products_design_files'] | undefined>
      | undefined;
    update_products_design_files_item?:
      | GraphQLTypes['products_design_files']
      | undefined;
    update_products_content_items?:
      | Array<GraphQLTypes['products_content'] | undefined>
      | undefined;
    update_products_content_item?: GraphQLTypes['products_content'] | undefined;
    update_stages_items?: Array<GraphQLTypes['stages'] | undefined> | undefined;
    update_stages_item?: GraphQLTypes['stages'] | undefined;
    update_junction_directus_users_skills_items?:
      | Array<GraphQLTypes['junction_directus_users_skills'] | undefined>
      | undefined;
    update_junction_directus_users_skills_item?:
      | GraphQLTypes['junction_directus_users_skills']
      | undefined;
    update_collaborators_items?:
      | Array<GraphQLTypes['collaborators'] | undefined>
      | undefined;
    update_collaborators_item?: GraphQLTypes['collaborators'] | undefined;
    update_brands_directus_users_items?:
      | Array<GraphQLTypes['brands_directus_users'] | undefined>
      | undefined;
    update_brands_directus_users_item?:
      | GraphQLTypes['brands_directus_users']
      | undefined;
    update_products_contributors_items?:
      | Array<GraphQLTypes['products_contributors'] | undefined>
      | undefined;
    update_products_contributors_item?:
      | GraphQLTypes['products_contributors']
      | undefined;
    delete_brands_items?: GraphQLTypes['delete_many'] | undefined;
    delete_brands_item?: GraphQLTypes['delete_one'] | undefined;
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
    delete_collaborator_roles_items?: GraphQLTypes['delete_many'] | undefined;
    delete_collaborator_roles_item?: GraphQLTypes['delete_one'] | undefined;
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
    delete_products_files_items?: GraphQLTypes['delete_many'] | undefined;
    delete_products_files_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_production_methods_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_products_production_methods_item?:
      | GraphQLTypes['delete_one']
      | undefined;
    delete_skills_items?: GraphQLTypes['delete_many'] | undefined;
    delete_skills_item?: GraphQLTypes['delete_one'] | undefined;
    delete_production_materials_items?: GraphQLTypes['delete_many'] | undefined;
    delete_production_materials_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_items?: GraphQLTypes['delete_many'] | undefined;
    delete_products_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_production_materials_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_products_production_materials_item?:
      | GraphQLTypes['delete_one']
      | undefined;
    delete_products_wearables_items?: GraphQLTypes['delete_many'] | undefined;
    delete_products_wearables_item?: GraphQLTypes['delete_one'] | undefined;
    delete_file_formats_items?: GraphQLTypes['delete_many'] | undefined;
    delete_file_formats_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_design_files_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_products_design_files_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_content_items?: GraphQLTypes['delete_many'] | undefined;
    delete_products_content_item?: GraphQLTypes['delete_one'] | undefined;
    delete_stages_items?: GraphQLTypes['delete_many'] | undefined;
    delete_stages_item?: GraphQLTypes['delete_one'] | undefined;
    delete_junction_directus_users_skills_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_junction_directus_users_skills_item?:
      | GraphQLTypes['delete_one']
      | undefined;
    delete_collaborators_items?: GraphQLTypes['delete_many'] | undefined;
    delete_collaborators_item?: GraphQLTypes['delete_one'] | undefined;
    delete_brands_directus_users_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_brands_directus_users_item?: GraphQLTypes['delete_one'] | undefined;
    delete_products_contributors_items?:
      | GraphQLTypes['delete_many']
      | undefined;
    delete_products_contributors_item?: GraphQLTypes['delete_one'] | undefined;
  };
  ['create_brands_input']: {
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    description?: string | undefined;
    discord_url?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    logo?: GraphQLTypes['create_directus_files_input'] | undefined;
    name: string;
    twitter_url?: string | undefined;
    website_url?: string | undefined;
    notion_id?: string | undefined;
    products?:
      | Array<GraphQLTypes['create_products_input'] | undefined>
      | undefined;
    products_func?: GraphQLTypes['count_functionsInput'] | undefined;
    users?:
      | Array<GraphQLTypes['create_brands_directus_users_input'] | undefined>
      | undefined;
    users_func?: GraphQLTypes['count_functionsInput'] | undefined;
  };
  ['datetime_functionsInput']: {
    year?: number | undefined;
    month?: number | undefined;
    week?: number | undefined;
    day?: number | undefined;
    weekday?: number | undefined;
    hour?: number | undefined;
    minute?: number | undefined;
    second?: number | undefined;
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
    uploaded_on: GraphQLTypes['Date'];
    uploaded_on_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    modified_by?: GraphQLTypes['create_directus_users_input'] | undefined;
    modified_on: GraphQLTypes['Date'];
    modified_on_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    charset?: string | undefined;
    filesize?: string | undefined;
    width?: number | undefined;
    height?: number | undefined;
    duration?: number | undefined;
    embed?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    tags_func?: GraphQLTypes['count_functionsInput'] | undefined;
    metadata?: GraphQLTypes['JSON'] | undefined;
    metadata_func?: GraphQLTypes['count_functionsInput'] | undefined;
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
    password?: string | undefined;
    location?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    tags_func?: GraphQLTypes['count_functionsInput'] | undefined;
    avatar?: GraphQLTypes['create_directus_files_input'] | undefined;
    language?: string | undefined;
    theme?: string | undefined;
    tfa_secret?: string | undefined;
    status: string;
    role?: GraphQLTypes['create_directus_roles_input'] | undefined;
    token?: string | undefined;
    last_access?: GraphQLTypes['Date'] | undefined;
    last_access_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    last_page?: string | undefined;
    provider: string;
    external_identifier?: string | undefined;
    auth_data?: GraphQLTypes['JSON'] | undefined;
    auth_data_func?: GraphQLTypes['count_functionsInput'] | undefined;
    email_notifications?: boolean | undefined;
    timezone?: string | undefined;
    discord_handle?: string | undefined;
    twitter_handle?: string | undefined;
    discord_id?: string | undefined;
    collaborators?:
      | Array<GraphQLTypes['create_collaborators_input'] | undefined>
      | undefined;
    collaborators_func?: GraphQLTypes['count_functionsInput'] | undefined;
    skills?:
      | Array<
          | GraphQLTypes['create_junction_directus_users_skills_input']
          | undefined
        >
      | undefined;
    skills_func?: GraphQLTypes['count_functionsInput'] | undefined;
  };
  ['count_functionsInput']: {
    count?: number | undefined;
  };
  ['create_directus_roles_input']: {
    id?: string | undefined;
    name: string;
    icon: string;
    description?: string | undefined;
    ip_access?: Array<string | undefined> | undefined;
    enforce_tfa: boolean;
    admin_access: boolean;
    app_access: boolean;
    users?:
      | Array<GraphQLTypes['create_directus_users_input'] | undefined>
      | undefined;
    users_func?: GraphQLTypes['count_functionsInput'] | undefined;
  };
  ['create_collaborators_input']: {
    id?: string | undefined;
    user_created?: GraphQLTypes['create_directus_users_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    date_updated?: GraphQLTypes['Date'] | undefined;
    date_updated_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    account?: GraphQLTypes['create_directus_users_input'] | undefined;
    display_name?: string | undefined;
    payment_eth_address?: string | undefined;
    role?: GraphQLTypes['create_collaborator_roles_input'] | undefined;
  };
  ['create_collaborator_roles_input']: {
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
  };
  ['create_junction_directus_users_skills_input']: {
    id?: string | undefined;
    directus_users_id?: GraphQLTypes['create_directus_users_input'] | undefined;
    skills_id?: GraphQLTypes['create_skills_input'] | undefined;
  };
  ['create_skills_input']: {
    description?: string | undefined;
    id?: string | undefined;
    name: string;
  };
  ['create_products_input']: {
    brand_id?: GraphQLTypes['create_brands_input'] | undefined;
    brand_reward_share?: number | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    description?: string | undefined;
    discord_channel_id?: string | undefined;
    fulfiller_id?: GraphQLTypes['create_fulfillers_input'] | undefined;
    id?: string | undefined;
    name: string;
    notion_id?: string | undefined;
    price?: GraphQLTypes['create_price_currencies_input'] | undefined;
    producer_id?: GraphQLTypes['create_producers_input'] | undefined;
    production_cost?: number | undefined;
    quantity?: string | undefined;
    sale_type?: string | undefined;
    shopify_id?: string | undefined;
    status?: string | undefined;
    season?: number | undefined;
    release_date?: GraphQLTypes['Date'] | undefined;
    release_date_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    clo3d_file?: GraphQLTypes['create_directus_files_input'] | undefined;
    product_stage?: GraphQLTypes['create_stages_input'] | undefined;
    nft_token_id?: number | undefined;
    contributor_reward_share?: number | undefined;
    production_methods?:
      | Array<
          GraphQLTypes['create_products_production_methods_input'] | undefined
        >
      | undefined;
    production_methods_func?: GraphQLTypes['count_functionsInput'] | undefined;
    images?:
      | Array<GraphQLTypes['create_products_files_input'] | undefined>
      | undefined;
    images_func?: GraphQLTypes['count_functionsInput'] | undefined;
    materials?:
      | Array<
          GraphQLTypes['create_products_production_materials_input'] | undefined
        >
      | undefined;
    materials_func?: GraphQLTypes['count_functionsInput'] | undefined;
    wearable_files?:
      | Array<GraphQLTypes['create_products_wearables_input'] | undefined>
      | undefined;
    wearable_files_func?: GraphQLTypes['count_functionsInput'] | undefined;
    content?:
      | Array<GraphQLTypes['create_products_content_input'] | undefined>
      | undefined;
    content_func?: GraphQLTypes['count_functionsInput'] | undefined;
    design_files?:
      | Array<GraphQLTypes['create_products_design_files_input'] | undefined>
      | undefined;
    design_files_func?: GraphQLTypes['count_functionsInput'] | undefined;
    contributors?:
      | Array<GraphQLTypes['create_products_contributors_input'] | undefined>
      | undefined;
    contributors_func?: GraphQLTypes['count_functionsInput'] | undefined;
  };
  ['create_fulfillers_input']: {
    address?: string | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
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
    created_at: GraphQLTypes['Date'];
    created_at_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
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
    production_materials_stocked_func?:
      | GraphQLTypes['count_functionsInput']
      | undefined;
    production_methods?:
      | Array<
          GraphQLTypes['create_producers_production_methods_input'] | undefined
        >
      | undefined;
    production_methods_func?: GraphQLTypes['count_functionsInput'] | undefined;
    supplied_materials?:
      | Array<GraphQLTypes['create_production_materials_input'] | undefined>
      | undefined;
    supplied_materials_func?: GraphQLTypes['count_functionsInput'] | undefined;
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
    color_palette_func?: GraphQLTypes['count_functionsInput'] | undefined;
    composition?: string | undefined;
    created_at: GraphQLTypes['Date'];
    created_at_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    created_by?: GraphQLTypes['create_directus_users_input'] | undefined;
    description?: string | undefined;
    gender?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    neck_tag?: boolean | undefined;
    rating?: string | undefined;
    size_guide?: GraphQLTypes['create_directus_files_input'] | undefined;
    supplier?: GraphQLTypes['create_producers_input'] | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    tags_func?: GraphQLTypes['count_functionsInput'] | undefined;
    made_in?: string | undefined;
    production_methods?:
      | Array<
          | GraphQLTypes['create_production_materials_production_methods_input']
          | undefined
        >
      | undefined;
    production_methods_func?: GraphQLTypes['count_functionsInput'] | undefined;
    stocked_at?:
      | Array<
          | GraphQLTypes['create_producers_production_materials_input']
          | undefined
        >
      | undefined;
    stocked_at_func?: GraphQLTypes['count_functionsInput'] | undefined;
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
    created_at: GraphQLTypes['Date'];
    created_at_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    producers?:
      | Array<
          GraphQLTypes['create_producers_production_methods_input'] | undefined
        >
      | undefined;
    producers_func?: GraphQLTypes['count_functionsInput'] | undefined;
    production_materials?:
      | Array<
          | GraphQLTypes['create_production_materials_production_methods_input']
          | undefined
        >
      | undefined;
    production_materials_func?:
      | GraphQLTypes['count_functionsInput']
      | undefined;
  };
  ['create_producers_production_methods_input']: {
    id?: string | undefined;
    producers_id?: GraphQLTypes['create_producers_input'] | undefined;
    production_methods_id?:
      | GraphQLTypes['create_production_methods_input']
      | undefined;
  };
  ['create_stages_input']: {
    name?: string | undefined;
    sort?: number | undefined;
    description?: string | undefined;
  };
  ['create_products_production_methods_input']: {
    id?: string | undefined;
    production_methods_id?:
      | GraphQLTypes['create_production_methods_input']
      | undefined;
    products_id?: GraphQLTypes['create_products_input'] | undefined;
  };
  ['create_products_files_input']: {
    directus_files_id?: GraphQLTypes['create_directus_files_input'] | undefined;
    id?: string | undefined;
    products_id?: GraphQLTypes['create_products_input'] | undefined;
  };
  ['create_products_production_materials_input']: {
    id?: string | undefined;
    products_id?: GraphQLTypes['create_products_input'] | undefined;
    production_materials_id?:
      | GraphQLTypes['create_production_materials_input']
      | undefined;
  };
  ['create_products_wearables_input']: {
    id?: string | undefined;
    products_id?: GraphQLTypes['create_products_input'] | undefined;
    directus_files_id?: GraphQLTypes['create_directus_files_input'] | undefined;
    file_format?: GraphQLTypes['create_file_formats_input'] | undefined;
    primary?: boolean | undefined;
  };
  ['create_file_formats_input']: {
    id?: string | undefined;
    mime_type?: string | undefined;
    extension?: string | undefined;
    description?: string | undefined;
    name: string;
  };
  ['create_products_content_input']: {
    id?: string | undefined;
    products_id?: GraphQLTypes['create_products_input'] | undefined;
    directus_files_id?: GraphQLTypes['create_directus_files_input'] | undefined;
  };
  ['create_products_design_files_input']: {
    id?: string | undefined;
    products_id?: GraphQLTypes['create_products_input'] | undefined;
    directus_files_id?: GraphQLTypes['create_directus_files_input'] | undefined;
  };
  ['create_products_contributors_input']: {
    id?: string | undefined;
    products_id?: GraphQLTypes['create_products_input'] | undefined;
    collaborators_id?: GraphQLTypes['create_collaborators_input'] | undefined;
    contribution_share?: number | undefined;
    robot_earned?: number | undefined;
  };
  ['create_brands_directus_users_input']: {
    id?: string | undefined;
    brands_id?: GraphQLTypes['create_brands_input'] | undefined;
    directus_users_id?: GraphQLTypes['create_directus_users_input'] | undefined;
  };
  ['update_brands_input']: {
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    description?: string | undefined;
    discord_url?: string | undefined;
    eth_address?: string | undefined;
    id?: string | undefined;
    logo?: GraphQLTypes['update_directus_files_input'] | undefined;
    name?: string | undefined;
    twitter_url?: string | undefined;
    website_url?: string | undefined;
    notion_id?: string | undefined;
    products?:
      | Array<GraphQLTypes['update_products_input'] | undefined>
      | undefined;
    products_func?: GraphQLTypes['count_functionsInput'] | undefined;
    users?:
      | Array<GraphQLTypes['update_brands_directus_users_input'] | undefined>
      | undefined;
    users_func?: GraphQLTypes['count_functionsInput'] | undefined;
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
    uploaded_on_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    modified_by?: GraphQLTypes['update_directus_users_input'] | undefined;
    modified_on?: GraphQLTypes['Date'] | undefined;
    modified_on_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    charset?: string | undefined;
    filesize?: string | undefined;
    width?: number | undefined;
    height?: number | undefined;
    duration?: number | undefined;
    embed?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    tags_func?: GraphQLTypes['count_functionsInput'] | undefined;
    metadata?: GraphQLTypes['JSON'] | undefined;
    metadata_func?: GraphQLTypes['count_functionsInput'] | undefined;
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
    password?: string | undefined;
    location?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    tags_func?: GraphQLTypes['count_functionsInput'] | undefined;
    avatar?: GraphQLTypes['update_directus_files_input'] | undefined;
    language?: string | undefined;
    theme?: string | undefined;
    tfa_secret?: string | undefined;
    status?: string | undefined;
    role?: GraphQLTypes['update_directus_roles_input'] | undefined;
    token?: string | undefined;
    last_access?: GraphQLTypes['Date'] | undefined;
    last_access_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    last_page?: string | undefined;
    provider?: string | undefined;
    external_identifier?: string | undefined;
    auth_data?: GraphQLTypes['JSON'] | undefined;
    auth_data_func?: GraphQLTypes['count_functionsInput'] | undefined;
    email_notifications?: boolean | undefined;
    timezone?: string | undefined;
    discord_handle?: string | undefined;
    twitter_handle?: string | undefined;
    discord_id?: string | undefined;
    collaborators?:
      | Array<GraphQLTypes['update_collaborators_input'] | undefined>
      | undefined;
    collaborators_func?: GraphQLTypes['count_functionsInput'] | undefined;
    skills?:
      | Array<
          | GraphQLTypes['update_junction_directus_users_skills_input']
          | undefined
        >
      | undefined;
    skills_func?: GraphQLTypes['count_functionsInput'] | undefined;
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
    users_func?: GraphQLTypes['count_functionsInput'] | undefined;
  };
  ['update_collaborators_input']: {
    id?: string | undefined;
    user_created?: GraphQLTypes['update_directus_users_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    date_updated?: GraphQLTypes['Date'] | undefined;
    date_updated_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    account?: GraphQLTypes['update_directus_users_input'] | undefined;
    display_name?: string | undefined;
    payment_eth_address?: string | undefined;
    role?: GraphQLTypes['update_collaborator_roles_input'] | undefined;
  };
  ['update_collaborator_roles_input']: {
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
  };
  ['update_junction_directus_users_skills_input']: {
    id?: string | undefined;
    directus_users_id?: GraphQLTypes['update_directus_users_input'] | undefined;
    skills_id?: GraphQLTypes['update_skills_input'] | undefined;
  };
  ['update_skills_input']: {
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
  };
  ['update_products_input']: {
    brand_id?: GraphQLTypes['update_brands_input'] | undefined;
    brand_reward_share?: number | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    description?: string | undefined;
    discord_channel_id?: string | undefined;
    fulfiller_id?: GraphQLTypes['update_fulfillers_input'] | undefined;
    id?: string | undefined;
    name?: string | undefined;
    notion_id?: string | undefined;
    price?: GraphQLTypes['update_price_currencies_input'] | undefined;
    producer_id?: GraphQLTypes['update_producers_input'] | undefined;
    production_cost?: number | undefined;
    quantity?: string | undefined;
    sale_type?: string | undefined;
    shopify_id?: string | undefined;
    status?: string | undefined;
    season?: number | undefined;
    release_date?: GraphQLTypes['Date'] | undefined;
    release_date_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    clo3d_file?: GraphQLTypes['update_directus_files_input'] | undefined;
    product_stage?: GraphQLTypes['update_stages_input'] | undefined;
    nft_token_id?: number | undefined;
    contributor_reward_share?: number | undefined;
    production_methods?:
      | Array<
          GraphQLTypes['update_products_production_methods_input'] | undefined
        >
      | undefined;
    production_methods_func?: GraphQLTypes['count_functionsInput'] | undefined;
    images?:
      | Array<GraphQLTypes['update_products_files_input'] | undefined>
      | undefined;
    images_func?: GraphQLTypes['count_functionsInput'] | undefined;
    materials?:
      | Array<
          GraphQLTypes['update_products_production_materials_input'] | undefined
        >
      | undefined;
    materials_func?: GraphQLTypes['count_functionsInput'] | undefined;
    wearable_files?:
      | Array<GraphQLTypes['update_products_wearables_input'] | undefined>
      | undefined;
    wearable_files_func?: GraphQLTypes['count_functionsInput'] | undefined;
    content?:
      | Array<GraphQLTypes['update_products_content_input'] | undefined>
      | undefined;
    content_func?: GraphQLTypes['count_functionsInput'] | undefined;
    design_files?:
      | Array<GraphQLTypes['update_products_design_files_input'] | undefined>
      | undefined;
    design_files_func?: GraphQLTypes['count_functionsInput'] | undefined;
    contributors?:
      | Array<GraphQLTypes['update_products_contributors_input'] | undefined>
      | undefined;
    contributors_func?: GraphQLTypes['count_functionsInput'] | undefined;
  };
  ['update_fulfillers_input']: {
    address?: string | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
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
    created_at_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
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
    production_materials_stocked_func?:
      | GraphQLTypes['count_functionsInput']
      | undefined;
    production_methods?:
      | Array<
          GraphQLTypes['update_producers_production_methods_input'] | undefined
        >
      | undefined;
    production_methods_func?: GraphQLTypes['count_functionsInput'] | undefined;
    supplied_materials?:
      | Array<GraphQLTypes['update_production_materials_input'] | undefined>
      | undefined;
    supplied_materials_func?: GraphQLTypes['count_functionsInput'] | undefined;
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
    color_palette_func?: GraphQLTypes['count_functionsInput'] | undefined;
    composition?: string | undefined;
    created_at?: GraphQLTypes['Date'] | undefined;
    created_at_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    created_by?: GraphQLTypes['update_directus_users_input'] | undefined;
    description?: string | undefined;
    gender?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    neck_tag?: boolean | undefined;
    rating?: string | undefined;
    size_guide?: GraphQLTypes['update_directus_files_input'] | undefined;
    supplier?: GraphQLTypes['update_producers_input'] | undefined;
    tags?: GraphQLTypes['JSON'] | undefined;
    tags_func?: GraphQLTypes['count_functionsInput'] | undefined;
    made_in?: string | undefined;
    production_methods?:
      | Array<
          | GraphQLTypes['update_production_materials_production_methods_input']
          | undefined
        >
      | undefined;
    production_methods_func?: GraphQLTypes['count_functionsInput'] | undefined;
    stocked_at?:
      | Array<
          | GraphQLTypes['update_producers_production_materials_input']
          | undefined
        >
      | undefined;
    stocked_at_func?: GraphQLTypes['count_functionsInput'] | undefined;
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
    created_at_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    description?: string | undefined;
    id?: string | undefined;
    name?: string | undefined;
    producers?:
      | Array<
          GraphQLTypes['update_producers_production_methods_input'] | undefined
        >
      | undefined;
    producers_func?: GraphQLTypes['count_functionsInput'] | undefined;
    production_materials?:
      | Array<
          | GraphQLTypes['update_production_materials_production_methods_input']
          | undefined
        >
      | undefined;
    production_materials_func?:
      | GraphQLTypes['count_functionsInput']
      | undefined;
  };
  ['update_producers_production_methods_input']: {
    id?: string | undefined;
    producers_id?: GraphQLTypes['update_producers_input'] | undefined;
    production_methods_id?:
      | GraphQLTypes['update_production_methods_input']
      | undefined;
  };
  ['update_stages_input']: {
    name?: string | undefined;
    sort?: number | undefined;
    description?: string | undefined;
  };
  ['update_products_production_methods_input']: {
    id?: string | undefined;
    production_methods_id?:
      | GraphQLTypes['update_production_methods_input']
      | undefined;
    products_id?: GraphQLTypes['update_products_input'] | undefined;
  };
  ['update_products_files_input']: {
    directus_files_id?: GraphQLTypes['update_directus_files_input'] | undefined;
    id?: string | undefined;
    products_id?: GraphQLTypes['update_products_input'] | undefined;
  };
  ['update_products_production_materials_input']: {
    id?: string | undefined;
    products_id?: GraphQLTypes['update_products_input'] | undefined;
    production_materials_id?:
      | GraphQLTypes['update_production_materials_input']
      | undefined;
  };
  ['update_products_wearables_input']: {
    id?: string | undefined;
    products_id?: GraphQLTypes['update_products_input'] | undefined;
    directus_files_id?: GraphQLTypes['update_directus_files_input'] | undefined;
    file_format?: GraphQLTypes['update_file_formats_input'] | undefined;
    primary?: boolean | undefined;
  };
  ['update_file_formats_input']: {
    id?: string | undefined;
    mime_type?: string | undefined;
    extension?: string | undefined;
    description?: string | undefined;
    name?: string | undefined;
  };
  ['update_products_content_input']: {
    id?: string | undefined;
    products_id?: GraphQLTypes['update_products_input'] | undefined;
    directus_files_id?: GraphQLTypes['update_directus_files_input'] | undefined;
  };
  ['update_products_design_files_input']: {
    id?: string | undefined;
    products_id?: GraphQLTypes['update_products_input'] | undefined;
    directus_files_id?: GraphQLTypes['update_directus_files_input'] | undefined;
  };
  ['update_products_contributors_input']: {
    id?: string | undefined;
    products_id?: GraphQLTypes['update_products_input'] | undefined;
    collaborators_id?: GraphQLTypes['update_collaborators_input'] | undefined;
    contribution_share?: number | undefined;
    robot_earned?: number | undefined;
  };
  ['update_brands_directus_users_input']: {
    id?: string | undefined;
    brands_id?: GraphQLTypes['update_brands_input'] | undefined;
    directus_users_id?: GraphQLTypes['update_directus_users_input'] | undefined;
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
