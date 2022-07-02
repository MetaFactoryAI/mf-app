/* eslint-disable */

import { AllTypesProps, ReturnTypes, Ops } from './const';
import fetch, { Response } from 'node-fetch';
import WebSocket from 'ws';
export const HOST = 'http://localhost:8055/graphql/system';

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
    extensions?: ValueTypes['extensions'];
    server_specs_oas?: boolean | `@${string}`;
    server_specs_graphql?: [
      { scope?: ValueTypes['graphql_sdl_scope'] | undefined | null },
      boolean | `@${string}`,
    ];
    server_ping?: boolean | `@${string}`;
    server_info?: ValueTypes['server_info'];
    server_health?: boolean | `@${string}`;
    collections?: ValueTypes['directus_collections'];
    collections_by_name?: [
      { name: string },
      ValueTypes['directus_collections'],
    ];
    fields?: ValueTypes['directus_fields'];
    fields_in_collection?: [
      { collection: string },
      ValueTypes['directus_fields'],
    ];
    fields_by_name?: [
      { collection: string; field: string },
      ValueTypes['directus_fields'],
    ];
    relations?: ValueTypes['directus_relations'];
    relations_in_collection?: [
      { collection: string },
      ValueTypes['directus_relations'],
    ];
    relations_by_name?: [
      { collection: string; field: string },
      ValueTypes['directus_relations'],
    ];
    users_me?: ValueTypes['directus_users'];
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
    users_by_id?: [{ id: string }, ValueTypes['directus_users']];
    users_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['directus_users_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['directus_users_aggregated'],
    ];
    roles?: [
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
    roles_by_id?: [{ id: string }, ValueTypes['directus_roles']];
    roles_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['directus_roles_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['directus_roles_aggregated'],
    ];
    files?: [
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
    files_by_id?: [{ id: string }, ValueTypes['directus_files']];
    files_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['directus_files_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['directus_files_aggregated'],
    ];
    activity?: [
      {
        filter?: ValueTypes['directus_activity_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_activity'],
    ];
    activity_by_id?: [{ id: string }, ValueTypes['directus_activity']];
    activity_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['directus_activity_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['directus_activity_aggregated'],
    ];
    folders?: [
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
    folders_by_id?: [{ id: string }, ValueTypes['directus_folders']];
    folders_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['directus_folders_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['directus_folders_aggregated'],
    ];
    permissions?: [
      {
        filter?: ValueTypes['directus_permissions_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_permissions'],
    ];
    permissions_by_id?: [{ id: string }, ValueTypes['directus_permissions']];
    permissions_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['directus_permissions_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['directus_permissions_aggregated'],
    ];
    presets?: [
      {
        filter?: ValueTypes['directus_presets_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_presets'],
    ];
    presets_by_id?: [{ id: string }, ValueTypes['directus_presets']];
    presets_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['directus_presets_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['directus_presets_aggregated'],
    ];
    revisions?: [
      {
        filter?: ValueTypes['directus_revisions_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_revisions'],
    ];
    revisions_by_id?: [{ id: string }, ValueTypes['directus_revisions']];
    revisions_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['directus_revisions_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['directus_revisions_aggregated'],
    ];
    webhooks?: [
      {
        filter?: ValueTypes['directus_webhooks_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_webhooks'],
    ];
    webhooks_by_id?: [{ id: string }, ValueTypes['directus_webhooks']];
    webhooks_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['directus_webhooks_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['directus_webhooks_aggregated'],
    ];
    settings?: ValueTypes['directus_settings'];
    panels?: [
      {
        filter?: ValueTypes['directus_panels_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_panels'],
    ];
    panels_by_id?: [{ id: string }, ValueTypes['directus_panels']];
    panels_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['directus_panels_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['directus_panels_aggregated'],
    ];
    notifications?: [
      {
        filter?: ValueTypes['directus_notifications_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_notifications'],
    ];
    notifications_by_id?: [
      { id: string },
      ValueTypes['directus_notifications'],
    ];
    notifications_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['directus_notifications_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['directus_notifications_aggregated'],
    ];
    shares?: [
      {
        filter?: ValueTypes['directus_shares_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_shares'],
    ];
    shares_by_id?: [{ id: string }, ValueTypes['directus_shares']];
    shares_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['directus_shares_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['directus_shares_aggregated'],
    ];
    flows?: [
      {
        filter?: ValueTypes['directus_flows_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_flows'],
    ];
    flows_by_id?: [{ id: string }, ValueTypes['directus_flows']];
    flows_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['directus_flows_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['directus_flows_aggregated'],
    ];
    operations?: [
      {
        filter?: ValueTypes['directus_operations_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_operations'],
    ];
    operations_by_id?: [{ id: string }, ValueTypes['directus_operations']];
    operations_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['directus_operations_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['directus_operations_aggregated'],
    ];
    dashboards?: [
      {
        filter?: ValueTypes['directus_dashboards_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_dashboards'],
    ];
    dashboards_by_id?: [{ id: string }, ValueTypes['directus_dashboards']];
    dashboards_aggregated?: [
      {
        groupBy?: Array<string | undefined | null> | undefined | null;
        filter?: ValueTypes['directus_dashboards_filter'] | undefined | null;
        limit?: number | undefined | null;
        search?: string | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
      },
      ValueTypes['directus_dashboards_aggregated'],
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
  ['directus_users_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_users_aggregated_count'];
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
    timezone?: boolean | `@${string}`;
    discord_handle?: boolean | `@${string}`;
    twitter_handle?: boolean | `@${string}`;
    discord_id?: boolean | `@${string}`;
    collaborators?: boolean | `@${string}`;
    skills?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_roles_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_roles_aggregated_count'];
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
  ['directus_files_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_files_aggregated_count'];
    avg?: ValueTypes['directus_files_aggregated_fields'];
    sum?: ValueTypes['directus_files_aggregated_fields'];
    countDistinct?: ValueTypes['directus_files_aggregated_fields'];
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
    width?: boolean | `@${string}`;
    height?: boolean | `@${string}`;
    duration?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_activity']: AliasType<{
    id?: boolean | `@${string}`;
    action?: boolean | `@${string}`;
    user?: [
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
    timestamp?: boolean | `@${string}`;
    timestamp_func?: ValueTypes['datetime_functions'];
    ip?: boolean | `@${string}`;
    user_agent?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    comment?: boolean | `@${string}`;
    revisions?: [
      {
        filter?: ValueTypes['directus_revisions_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
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
        filter?: ValueTypes['directus_activity_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
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
        filter?: ValueTypes['directus_revisions_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_revisions'],
    ];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_activity_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    action?: ValueTypes['string_filter_operators'] | undefined | null;
    user?: ValueTypes['directus_users_filter'] | undefined | null;
    timestamp?: ValueTypes['date_filter_operators'] | undefined | null;
    timestamp_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    ip?: ValueTypes['string_filter_operators'] | undefined | null;
    user_agent?: ValueTypes['string_filter_operators'] | undefined | null;
    collection?: ValueTypes['string_filter_operators'] | undefined | null;
    item?: ValueTypes['string_filter_operators'] | undefined | null;
    comment?: ValueTypes['string_filter_operators'] | undefined | null;
    revisions?: ValueTypes['directus_revisions_filter'] | undefined | null;
    revisions_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ValueTypes['directus_activity_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['directus_activity_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_revisions_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    activity?: ValueTypes['directus_activity_filter'] | undefined | null;
    collection?: ValueTypes['string_filter_operators'] | undefined | null;
    item?: ValueTypes['string_filter_operators'] | undefined | null;
    data?: ValueTypes['string_filter_operators'] | undefined | null;
    data_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    delta?: ValueTypes['string_filter_operators'] | undefined | null;
    delta_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    parent?: ValueTypes['directus_revisions_filter'] | undefined | null;
    _and?:
      | Array<ValueTypes['directus_revisions_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['directus_revisions_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_activity_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_activity_aggregated_count'];
    avg?: ValueTypes['directus_activity_aggregated_fields'];
    sum?: ValueTypes['directus_activity_aggregated_fields'];
    countDistinct?: ValueTypes['directus_activity_aggregated_fields'];
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
    revisions?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_activity_aggregated_fields']: AliasType<{
    id?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_folders_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_folders_aggregated_count'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_folders_aggregated_count']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    parent?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_permissions']: AliasType<{
    id?: boolean | `@${string}`;
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
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    role?: ValueTypes['directus_roles_filter'] | undefined | null;
    collection?: ValueTypes['string_filter_operators'] | undefined | null;
    action?: ValueTypes['string_filter_operators'] | undefined | null;
    permissions?: ValueTypes['string_filter_operators'] | undefined | null;
    permissions_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    validation?: ValueTypes['string_filter_operators'] | undefined | null;
    validation_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    presets?: ValueTypes['string_filter_operators'] | undefined | null;
    presets_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    fields?: ValueTypes['string_filter_operators'] | undefined | null;
    _and?:
      | Array<ValueTypes['directus_permissions_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['directus_permissions_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_permissions_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_permissions_aggregated_count'];
    avg?: ValueTypes['directus_permissions_aggregated_fields'];
    sum?: ValueTypes['directus_permissions_aggregated_fields'];
    countDistinct?: ValueTypes['directus_permissions_aggregated_fields'];
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
  ['directus_presets']: AliasType<{
    id?: boolean | `@${string}`;
    bookmark?: boolean | `@${string}`;
    user?: [
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
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    bookmark?: ValueTypes['string_filter_operators'] | undefined | null;
    user?: ValueTypes['directus_users_filter'] | undefined | null;
    role?: ValueTypes['directus_roles_filter'] | undefined | null;
    collection?: ValueTypes['string_filter_operators'] | undefined | null;
    search?: ValueTypes['string_filter_operators'] | undefined | null;
    layout?: ValueTypes['string_filter_operators'] | undefined | null;
    layout_query?: ValueTypes['string_filter_operators'] | undefined | null;
    layout_query_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    layout_options?: ValueTypes['string_filter_operators'] | undefined | null;
    layout_options_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    refresh_interval?: ValueTypes['number_filter_operators'] | undefined | null;
    filter?: ValueTypes['string_filter_operators'] | undefined | null;
    filter_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    icon?: ValueTypes['string_filter_operators'] | undefined | null;
    color?: ValueTypes['string_filter_operators'] | undefined | null;
    _and?:
      | Array<ValueTypes['directus_presets_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['directus_presets_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_presets_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_presets_aggregated_count'];
    avg?: ValueTypes['directus_presets_aggregated_fields'];
    sum?: ValueTypes['directus_presets_aggregated_fields'];
    countDistinct?: ValueTypes['directus_presets_aggregated_fields'];
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
  ['directus_revisions_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_revisions_aggregated_count'];
    avg?: ValueTypes['directus_revisions_aggregated_fields'];
    sum?: ValueTypes['directus_revisions_aggregated_fields'];
    countDistinct?: ValueTypes['directus_revisions_aggregated_fields'];
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
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    method?: ValueTypes['string_filter_operators'] | undefined | null;
    url?: ValueTypes['string_filter_operators'] | undefined | null;
    status?: ValueTypes['string_filter_operators'] | undefined | null;
    data?: ValueTypes['boolean_filter_operators'] | undefined | null;
    actions?: ValueTypes['string_filter_operators'] | undefined | null;
    collections?: ValueTypes['string_filter_operators'] | undefined | null;
    headers?: ValueTypes['string_filter_operators'] | undefined | null;
    headers_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ValueTypes['directus_webhooks_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['directus_webhooks_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_webhooks_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_webhooks_aggregated_count'];
    avg?: ValueTypes['directus_webhooks_aggregated_fields'];
    sum?: ValueTypes['directus_webhooks_aggregated_fields'];
    countDistinct?: ValueTypes['directus_webhooks_aggregated_fields'];
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
  ['directus_settings']: AliasType<{
    id?: boolean | `@${string}`;
    project_name?: boolean | `@${string}`;
    project_url?: boolean | `@${string}`;
    /** $t:field_options.directus_settings.project_color_note */
    project_color?: boolean | `@${string}`;
    project_logo?: [
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
    public_foreground?: [
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
    public_background?: [
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
    public_note?: boolean | `@${string}`;
    auth_login_attempts?: boolean | `@${string}`;
    auth_password_policy?: boolean | `@${string}`;
    storage_asset_transform?: boolean | `@${string}`;
    storage_asset_presets?: boolean | `@${string}`;
    storage_asset_presets_func?: ValueTypes['count_functions'];
    custom_css?: boolean | `@${string}`;
    storage_default_folder?: [
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
    basemaps?: boolean | `@${string}`;
    basemaps_func?: ValueTypes['count_functions'];
    mapbox_key?: boolean | `@${string}`;
    module_bar?: boolean | `@${string}`;
    module_bar_func?: ValueTypes['count_functions'];
    project_descriptor?: boolean | `@${string}`;
    translation_strings?: boolean | `@${string}`;
    translation_strings_func?: ValueTypes['count_functions'];
    default_language?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_panels']: AliasType<{
    id?: boolean | `@${string}`;
    dashboard?: [
      {
        filter?: ValueTypes['directus_dashboards_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
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
  ['directus_dashboards']: AliasType<{
    id?: boolean | `@${string}`;
    name?: boolean | `@${string}`;
    icon?: boolean | `@${string}`;
    note?: boolean | `@${string}`;
    date_created?: boolean | `@${string}`;
    date_created_func?: ValueTypes['datetime_functions'];
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
    color?: boolean | `@${string}`;
    panels?: [
      {
        filter?: ValueTypes['directus_panels_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_panels'],
    ];
    panels_func?: ValueTypes['count_functions'];
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_panels_filter']: {
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    dashboard?: ValueTypes['directus_dashboards_filter'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    icon?: ValueTypes['string_filter_operators'] | undefined | null;
    color?: ValueTypes['string_filter_operators'] | undefined | null;
    show_header?: ValueTypes['boolean_filter_operators'] | undefined | null;
    note?: ValueTypes['string_filter_operators'] | undefined | null;
    type?: ValueTypes['string_filter_operators'] | undefined | null;
    position_x?: ValueTypes['number_filter_operators'] | undefined | null;
    position_y?: ValueTypes['number_filter_operators'] | undefined | null;
    width?: ValueTypes['number_filter_operators'] | undefined | null;
    height?: ValueTypes['number_filter_operators'] | undefined | null;
    options?: ValueTypes['string_filter_operators'] | undefined | null;
    options_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    date_created?: ValueTypes['date_filter_operators'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    user_created?: ValueTypes['directus_users_filter'] | undefined | null;
    _and?:
      | Array<ValueTypes['directus_panels_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['directus_panels_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_dashboards_filter']: {
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    icon?: ValueTypes['string_filter_operators'] | undefined | null;
    note?: ValueTypes['string_filter_operators'] | undefined | null;
    date_created?: ValueTypes['date_filter_operators'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    user_created?: ValueTypes['directus_users_filter'] | undefined | null;
    color?: ValueTypes['string_filter_operators'] | undefined | null;
    panels?: ValueTypes['directus_panels_filter'] | undefined | null;
    panels_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ValueTypes['directus_dashboards_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['directus_dashboards_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_panels_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_panels_aggregated_count'];
    avg?: ValueTypes['directus_panels_aggregated_fields'];
    sum?: ValueTypes['directus_panels_aggregated_fields'];
    countDistinct?: ValueTypes['directus_panels_aggregated_fields'];
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
  ['directus_notifications']: AliasType<{
    id?: boolean | `@${string}`;
    timestamp?: boolean | `@${string}`;
    timestamp_func?: ValueTypes['datetime_functions'];
    status?: boolean | `@${string}`;
    recipient?: [
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
    sender?: [
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
    subject?: boolean | `@${string}`;
    message?: boolean | `@${string}`;
    collection?: boolean | `@${string}`;
    item?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_notifications_filter']: {
    id?: ValueTypes['number_filter_operators'] | undefined | null;
    timestamp?: ValueTypes['date_filter_operators'] | undefined | null;
    timestamp_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    status?: ValueTypes['string_filter_operators'] | undefined | null;
    recipient?: ValueTypes['directus_users_filter'] | undefined | null;
    sender?: ValueTypes['directus_users_filter'] | undefined | null;
    subject?: ValueTypes['string_filter_operators'] | undefined | null;
    message?: ValueTypes['string_filter_operators'] | undefined | null;
    collection?: ValueTypes['string_filter_operators'] | undefined | null;
    item?: ValueTypes['string_filter_operators'] | undefined | null;
    _and?:
      | Array<ValueTypes['directus_notifications_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['directus_notifications_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_notifications_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_notifications_aggregated_count'];
    avg?: ValueTypes['directus_notifications_aggregated_fields'];
    sum?: ValueTypes['directus_notifications_aggregated_fields'];
    countDistinct?: ValueTypes['directus_notifications_aggregated_fields'];
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
        filter?: ValueTypes['directus_roles_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_roles'],
    ];
    /** $t:shared_leave_blank_for_unlimited */
    password?: boolean | `@${string}`;
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
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    collection?: ValueTypes['string_filter_operators'] | undefined | null;
    item?: ValueTypes['string_filter_operators'] | undefined | null;
    role?: ValueTypes['directus_roles_filter'] | undefined | null;
    password?: ValueTypes['string_filter_operators'] | undefined | null;
    user_created?: ValueTypes['directus_users_filter'] | undefined | null;
    date_created?: ValueTypes['date_filter_operators'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    date_start?: ValueTypes['date_filter_operators'] | undefined | null;
    date_start_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    date_end?: ValueTypes['date_filter_operators'] | undefined | null;
    date_end_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    times_used?: ValueTypes['number_filter_operators'] | undefined | null;
    max_uses?: ValueTypes['number_filter_operators'] | undefined | null;
    _and?:
      | Array<ValueTypes['directus_shares_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['directus_shares_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_shares_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_shares_aggregated_count'];
    avg?: ValueTypes['directus_shares_aggregated_fields'];
    sum?: ValueTypes['directus_shares_aggregated_fields'];
    countDistinct?: ValueTypes['directus_shares_aggregated_fields'];
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
        filter?: ValueTypes['directus_operations_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_operations'],
    ];
    date_created?: boolean | `@${string}`;
    date_created_func?: ValueTypes['datetime_functions'];
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
    operations?: [
      {
        filter?: ValueTypes['directus_operations_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
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
        filter?: ValueTypes['directus_operations_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_operations'],
    ];
    reject?: [
      {
        filter?: ValueTypes['directus_operations_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_operations'],
    ];
    flow?: [
      {
        filter?: ValueTypes['directus_flows_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
      },
      ValueTypes['directus_flows'],
    ];
    date_created?: boolean | `@${string}`;
    date_created_func?: ValueTypes['datetime_functions'];
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
    __typename?: boolean | `@${string}`;
  }>;
  ['directus_operations_filter']: {
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    key?: ValueTypes['string_filter_operators'] | undefined | null;
    type?: ValueTypes['string_filter_operators'] | undefined | null;
    position_x?: ValueTypes['number_filter_operators'] | undefined | null;
    position_y?: ValueTypes['number_filter_operators'] | undefined | null;
    options?: ValueTypes['string_filter_operators'] | undefined | null;
    options_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    resolve?: ValueTypes['directus_operations_filter'] | undefined | null;
    reject?: ValueTypes['directus_operations_filter'] | undefined | null;
    flow?: ValueTypes['directus_flows_filter'] | undefined | null;
    date_created?: ValueTypes['date_filter_operators'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    user_created?: ValueTypes['directus_users_filter'] | undefined | null;
    _and?:
      | Array<ValueTypes['directus_operations_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['directus_operations_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_flows_filter']: {
    id?: ValueTypes['string_filter_operators'] | undefined | null;
    name?: ValueTypes['string_filter_operators'] | undefined | null;
    icon?: ValueTypes['string_filter_operators'] | undefined | null;
    color?: ValueTypes['string_filter_operators'] | undefined | null;
    description?: ValueTypes['string_filter_operators'] | undefined | null;
    status?: ValueTypes['string_filter_operators'] | undefined | null;
    trigger?: ValueTypes['string_filter_operators'] | undefined | null;
    accountability?: ValueTypes['string_filter_operators'] | undefined | null;
    options?: ValueTypes['string_filter_operators'] | undefined | null;
    options_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    operation?: ValueTypes['directus_operations_filter'] | undefined | null;
    date_created?: ValueTypes['date_filter_operators'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_function_filter_operators']
      | undefined
      | null;
    user_created?: ValueTypes['directus_users_filter'] | undefined | null;
    operations?: ValueTypes['directus_operations_filter'] | undefined | null;
    operations_func?:
      | ValueTypes['count_function_filter_operators']
      | undefined
      | null;
    _and?:
      | Array<ValueTypes['directus_flows_filter'] | undefined | null>
      | undefined
      | null;
    _or?:
      | Array<ValueTypes['directus_flows_filter'] | undefined | null>
      | undefined
      | null;
  };
  ['directus_flows_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_flows_aggregated_count'];
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
    avg?: ValueTypes['directus_operations_aggregated_fields'];
    sum?: ValueTypes['directus_operations_aggregated_fields'];
    countDistinct?: ValueTypes['directus_operations_aggregated_fields'];
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
  ['directus_dashboards_aggregated']: AliasType<{
    group?: boolean | `@${string}`;
    countAll?: boolean | `@${string}`;
    count?: ValueTypes['directus_dashboards_aggregated_count'];
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
  ['Mutation']: AliasType<{
    auth_login?: [
      {
        email: string;
        password: string;
        mode?: ValueTypes['auth_mode'] | undefined | null;
        otp?: string | undefined | null;
      },
      ValueTypes['auth_tokens'],
    ];
    auth_refresh?: [
      {
        refresh_token?: string | undefined | null;
        mode?: ValueTypes['auth_mode'] | undefined | null;
      },
      ValueTypes['auth_tokens'],
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
      ValueTypes['users_me_tfa_generate_data'],
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
      { data: ValueTypes['create_directus_collections_input'] },
      ValueTypes['directus_collections'],
    ];
    update_collections_item?: [
      {
        collection: string;
        data: ValueTypes['update_directus_collections_input'];
      },
      ValueTypes['directus_collections'],
    ];
    delete_collections_item?: [
      { collection: string },
      ValueTypes['delete_collection'],
    ];
    create_fields_item?: [
      { collection: string; data: ValueTypes['create_directus_fields_input'] },
      ValueTypes['directus_fields'],
    ];
    update_fields_item?: [
      {
        collection: string;
        field: string;
        data: ValueTypes['update_directus_fields_input'];
      },
      ValueTypes['directus_fields'],
    ];
    delete_fields_item?: [
      { collection: string; field: string },
      ValueTypes['delete_field'],
    ];
    create_relations_item?: [
      { data: ValueTypes['create_directus_relations_input'] },
      ValueTypes['directus_relations'],
    ];
    update_relations_item?: [
      {
        collection: string;
        field: string;
        data: ValueTypes['update_directus_relations_input'];
      },
      ValueTypes['directus_relations'],
    ];
    delete_relations_item?: [
      { collection: string; field: string },
      ValueTypes['delete_relation'],
    ];
    update_users_me?: [
      { data?: ValueTypes['update_directus_users_input'] | undefined | null },
      ValueTypes['directus_users'],
    ];
    create_comment?: [
      { collection: string; item: string; comment: string },
      ValueTypes['directus_activity'],
    ];
    update_comment?: [
      { id: string; comment: string },
      ValueTypes['directus_activity'],
    ];
    delete_comment?: [{ id: string }, ValueTypes['delete_one']];
    import_file?: [
      {
        url: string;
        data?: ValueTypes['create_directus_files_input'] | undefined | null;
      },
      ValueTypes['directus_files'],
    ];
    users_invite?: [
      { email: string; role: string; invite_url?: string | undefined | null },
      boolean | `@${string}`,
    ];
    create_users_items?: [
      {
        filter?: ValueTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_directus_users_input']>
          | undefined
          | null;
      },
      ValueTypes['directus_users'],
    ];
    create_users_item?: [
      { data: ValueTypes['create_directus_users_input'] },
      ValueTypes['directus_users'],
    ];
    create_roles_items?: [
      {
        filter?: ValueTypes['directus_roles_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_directus_roles_input']>
          | undefined
          | null;
      },
      ValueTypes['directus_roles'],
    ];
    create_roles_item?: [
      { data: ValueTypes['create_directus_roles_input'] },
      ValueTypes['directus_roles'],
    ];
    create_files_items?: [
      {
        filter?: ValueTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_directus_files_input']>
          | undefined
          | null;
      },
      ValueTypes['directus_files'],
    ];
    create_files_item?: [
      { data: ValueTypes['create_directus_files_input'] },
      ValueTypes['directus_files'],
    ];
    create_folders_items?: [
      {
        filter?: ValueTypes['directus_folders_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_directus_folders_input']>
          | undefined
          | null;
      },
      ValueTypes['directus_folders'],
    ];
    create_folders_item?: [
      { data: ValueTypes['create_directus_folders_input'] },
      ValueTypes['directus_folders'],
    ];
    create_permissions_items?: [
      {
        filter?: ValueTypes['directus_permissions_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_directus_permissions_input']>
          | undefined
          | null;
      },
      ValueTypes['directus_permissions'],
    ];
    create_permissions_item?: [
      { data: ValueTypes['create_directus_permissions_input'] },
      ValueTypes['directus_permissions'],
    ];
    create_presets_items?: [
      {
        filter?: ValueTypes['directus_presets_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_directus_presets_input']>
          | undefined
          | null;
      },
      ValueTypes['directus_presets'],
    ];
    create_presets_item?: [
      { data: ValueTypes['create_directus_presets_input'] },
      ValueTypes['directus_presets'],
    ];
    create_webhooks_items?: [
      {
        filter?: ValueTypes['directus_webhooks_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_directus_webhooks_input']>
          | undefined
          | null;
      },
      ValueTypes['directus_webhooks'],
    ];
    create_webhooks_item?: [
      { data: ValueTypes['create_directus_webhooks_input'] },
      ValueTypes['directus_webhooks'],
    ];
    create_panels_items?: [
      {
        filter?: ValueTypes['directus_panels_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_directus_panels_input']>
          | undefined
          | null;
      },
      ValueTypes['directus_panels'],
    ];
    create_panels_item?: [
      { data: ValueTypes['create_directus_panels_input'] },
      ValueTypes['directus_panels'],
    ];
    create_notifications_items?: [
      {
        filter?: ValueTypes['directus_notifications_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_directus_notifications_input']>
          | undefined
          | null;
      },
      ValueTypes['directus_notifications'],
    ];
    create_notifications_item?: [
      { data: ValueTypes['create_directus_notifications_input'] },
      ValueTypes['directus_notifications'],
    ];
    create_shares_items?: [
      {
        filter?: ValueTypes['directus_shares_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_directus_shares_input']>
          | undefined
          | null;
      },
      ValueTypes['directus_shares'],
    ];
    create_shares_item?: [
      { data: ValueTypes['create_directus_shares_input'] },
      ValueTypes['directus_shares'],
    ];
    create_flows_items?: [
      {
        filter?: ValueTypes['directus_flows_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_directus_flows_input']>
          | undefined
          | null;
      },
      ValueTypes['directus_flows'],
    ];
    create_flows_item?: [
      { data: ValueTypes['create_directus_flows_input'] },
      ValueTypes['directus_flows'],
    ];
    create_operations_items?: [
      {
        filter?: ValueTypes['directus_operations_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_directus_operations_input']>
          | undefined
          | null;
      },
      ValueTypes['directus_operations'],
    ];
    create_operations_item?: [
      { data: ValueTypes['create_directus_operations_input'] },
      ValueTypes['directus_operations'],
    ];
    create_dashboards_items?: [
      {
        filter?: ValueTypes['directus_dashboards_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        data?:
          | Array<ValueTypes['create_directus_dashboards_input']>
          | undefined
          | null;
      },
      ValueTypes['directus_dashboards'],
    ];
    create_dashboards_item?: [
      { data: ValueTypes['create_directus_dashboards_input'] },
      ValueTypes['directus_dashboards'],
    ];
    update_users_items?: [
      {
        filter?: ValueTypes['directus_users_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_directus_users_input'];
      },
      ValueTypes['directus_users'],
    ];
    update_users_item?: [
      { id: string; data: ValueTypes['update_directus_users_input'] },
      ValueTypes['directus_users'],
    ];
    update_roles_items?: [
      {
        filter?: ValueTypes['directus_roles_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_directus_roles_input'];
      },
      ValueTypes['directus_roles'],
    ];
    update_roles_item?: [
      { id: string; data: ValueTypes['update_directus_roles_input'] },
      ValueTypes['directus_roles'],
    ];
    update_files_items?: [
      {
        filter?: ValueTypes['directus_files_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_directus_files_input'];
      },
      ValueTypes['directus_files'],
    ];
    update_files_item?: [
      { id: string; data: ValueTypes['update_directus_files_input'] },
      ValueTypes['directus_files'],
    ];
    update_folders_items?: [
      {
        filter?: ValueTypes['directus_folders_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_directus_folders_input'];
      },
      ValueTypes['directus_folders'],
    ];
    update_folders_item?: [
      { id: string; data: ValueTypes['update_directus_folders_input'] },
      ValueTypes['directus_folders'],
    ];
    update_permissions_items?: [
      {
        filter?: ValueTypes['directus_permissions_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_directus_permissions_input'];
      },
      ValueTypes['directus_permissions'],
    ];
    update_permissions_item?: [
      { id: string; data: ValueTypes['update_directus_permissions_input'] },
      ValueTypes['directus_permissions'],
    ];
    update_presets_items?: [
      {
        filter?: ValueTypes['directus_presets_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_directus_presets_input'];
      },
      ValueTypes['directus_presets'],
    ];
    update_presets_item?: [
      { id: string; data: ValueTypes['update_directus_presets_input'] },
      ValueTypes['directus_presets'],
    ];
    update_webhooks_items?: [
      {
        filter?: ValueTypes['directus_webhooks_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_directus_webhooks_input'];
      },
      ValueTypes['directus_webhooks'],
    ];
    update_webhooks_item?: [
      { id: string; data: ValueTypes['update_directus_webhooks_input'] },
      ValueTypes['directus_webhooks'],
    ];
    update_settings?: [
      { data: ValueTypes['update_directus_settings_input'] },
      ValueTypes['directus_settings'],
    ];
    update_panels_items?: [
      {
        filter?: ValueTypes['directus_panels_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_directus_panels_input'];
      },
      ValueTypes['directus_panels'],
    ];
    update_panels_item?: [
      { id: string; data: ValueTypes['update_directus_panels_input'] },
      ValueTypes['directus_panels'],
    ];
    update_notifications_items?: [
      {
        filter?: ValueTypes['directus_notifications_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_directus_notifications_input'];
      },
      ValueTypes['directus_notifications'],
    ];
    update_notifications_item?: [
      { id: string; data: ValueTypes['update_directus_notifications_input'] },
      ValueTypes['directus_notifications'],
    ];
    update_shares_items?: [
      {
        filter?: ValueTypes['directus_shares_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_directus_shares_input'];
      },
      ValueTypes['directus_shares'],
    ];
    update_shares_item?: [
      { id: string; data: ValueTypes['update_directus_shares_input'] },
      ValueTypes['directus_shares'],
    ];
    update_flows_items?: [
      {
        filter?: ValueTypes['directus_flows_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_directus_flows_input'];
      },
      ValueTypes['directus_flows'],
    ];
    update_flows_item?: [
      { id: string; data: ValueTypes['update_directus_flows_input'] },
      ValueTypes['directus_flows'],
    ];
    update_operations_items?: [
      {
        filter?: ValueTypes['directus_operations_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_directus_operations_input'];
      },
      ValueTypes['directus_operations'],
    ];
    update_operations_item?: [
      { id: string; data: ValueTypes['update_directus_operations_input'] },
      ValueTypes['directus_operations'],
    ];
    update_dashboards_items?: [
      {
        filter?: ValueTypes['directus_dashboards_filter'] | undefined | null;
        sort?: Array<string | undefined | null> | undefined | null;
        limit?: number | undefined | null;
        offset?: number | undefined | null;
        page?: number | undefined | null;
        search?: string | undefined | null;
        ids: Array<string | undefined | null>;
        data: ValueTypes['update_directus_dashboards_input'];
      },
      ValueTypes['directus_dashboards'],
    ];
    update_dashboards_item?: [
      { id: string; data: ValueTypes['update_directus_dashboards_input'] },
      ValueTypes['directus_dashboards'],
    ];
    delete_users_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_users_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_roles_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_roles_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_files_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_files_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_folders_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_folders_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_permissions_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_permissions_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_presets_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_presets_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_webhooks_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_webhooks_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_panels_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_panels_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_notifications_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_notifications_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_shares_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_shares_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_flows_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_flows_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_operations_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_operations_item?: [{ id: string }, ValueTypes['delete_one']];
    delete_dashboards_items?: [
      { ids: Array<string | undefined | null> },
      ValueTypes['delete_many'],
    ];
    delete_dashboards_item?: [{ id: string }, ValueTypes['delete_one']];
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
    meta?: ValueTypes['directus_collections_meta_input'] | undefined | null;
    schema?: ValueTypes['directus_collections_schema_input'] | undefined | null;
    fields?:
      | Array<ValueTypes['create_directus_collections_fields_input']>
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
    translations?: ValueTypes['JSON'] | undefined | null;
    archive_field?: string | undefined | null;
    archive_app_filter: boolean;
    archive_value?: string | undefined | null;
    unarchive_value?: string | undefined | null;
    sort_field?: string | undefined | null;
    accountability?: string | undefined | null;
    color?: string | undefined | null;
    item_duplication_fields?: ValueTypes['JSON'] | undefined | null;
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
    meta?: ValueTypes['directus_fields_meta_input'] | undefined | null;
    schema?: ValueTypes['directus_fields_schema_input'] | undefined | null;
  };
  ['directus_fields_meta_input']: {
    id: number;
    collection: string;
    field: string;
    special?: Array<string | undefined | null> | undefined | null;
    interface?: string | undefined | null;
    options?: ValueTypes['JSON'] | undefined | null;
    display?: string | undefined | null;
    display_options?: ValueTypes['JSON'] | undefined | null;
    readonly: boolean;
    hidden: boolean;
    sort?: number | undefined | null;
    width?: string | undefined | null;
    translations?: ValueTypes['JSON'] | undefined | null;
    note?: string | undefined | null;
    conditions?: ValueTypes['JSON'] | undefined | null;
    required?: boolean | undefined | null;
    group?: string | undefined | null;
    validation?: ValueTypes['JSON'] | undefined | null;
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
    meta?: ValueTypes['directus_collections_meta_input'] | undefined | null;
  };
  ['delete_collection']: AliasType<{
    collection?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
  ['create_directus_fields_input']: {
    collection?: string | undefined | null;
    field?: string | undefined | null;
    type?: string | undefined | null;
    meta?: ValueTypes['directus_fields_meta_input'] | undefined | null;
    schema?: ValueTypes['directus_fields_schema_input'] | undefined | null;
  };
  ['update_directus_fields_input']: {
    collection?: string | undefined | null;
    field?: string | undefined | null;
    type?: string | undefined | null;
    meta?: ValueTypes['directus_fields_meta_input'] | undefined | null;
    schema?: ValueTypes['directus_fields_schema_input'] | undefined | null;
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
    schema?: ValueTypes['directus_relations_schema_input'] | undefined | null;
    meta?: ValueTypes['directus_relations_meta_input'] | undefined | null;
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
    schema?: ValueTypes['directus_relations_schema_input'] | undefined | null;
    meta?: ValueTypes['directus_relations_meta_input'] | undefined | null;
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
  ['count_functionsInput']: {
    count?: number | undefined | null;
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
  ['create_directus_permissions_input']: {
    id?: string | undefined | null;
    role?: ValueTypes['create_directus_roles_input'] | undefined | null;
    collection: string;
    action: string;
    permissions?: ValueTypes['JSON'] | undefined | null;
    permissions_func?: ValueTypes['count_functionsInput'] | undefined | null;
    validation?: ValueTypes['JSON'] | undefined | null;
    validation_func?: ValueTypes['count_functionsInput'] | undefined | null;
    presets?: ValueTypes['JSON'] | undefined | null;
    presets_func?: ValueTypes['count_functionsInput'] | undefined | null;
    fields?: Array<string | undefined | null> | undefined | null;
  };
  ['create_directus_presets_input']: {
    id?: string | undefined | null;
    bookmark?: string | undefined | null;
    user?: ValueTypes['create_directus_users_input'] | undefined | null;
    role?: ValueTypes['create_directus_roles_input'] | undefined | null;
    collection?: string | undefined | null;
    search?: string | undefined | null;
    layout?: string | undefined | null;
    layout_query?: ValueTypes['JSON'] | undefined | null;
    layout_query_func?: ValueTypes['count_functionsInput'] | undefined | null;
    layout_options?: ValueTypes['JSON'] | undefined | null;
    layout_options_func?: ValueTypes['count_functionsInput'] | undefined | null;
    refresh_interval?: number | undefined | null;
    filter?: ValueTypes['JSON'] | undefined | null;
    filter_func?: ValueTypes['count_functionsInput'] | undefined | null;
    icon: string;
    color?: string | undefined | null;
  };
  ['create_directus_webhooks_input']: {
    id?: string | undefined | null;
    name: string;
    method: string;
    url: string;
    status: string;
    data: boolean;
    actions: Array<string | undefined | null>;
    collections: Array<string | undefined | null>;
    headers?: ValueTypes['JSON'] | undefined | null;
    headers_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['create_directus_panels_input']: {
    id?: string | undefined | null;
    dashboard?:
      | ValueTypes['create_directus_dashboards_input']
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
    options?: ValueTypes['JSON'] | undefined | null;
    options_func?: ValueTypes['count_functionsInput'] | undefined | null;
    date_created?: ValueTypes['Date'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    user_created?: ValueTypes['create_directus_users_input'] | undefined | null;
  };
  ['create_directus_dashboards_input']: {
    id?: string | undefined | null;
    name: string;
    icon: string;
    note?: string | undefined | null;
    date_created?: ValueTypes['Date'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    user_created?: ValueTypes['create_directus_users_input'] | undefined | null;
    color?: string | undefined | null;
    panels?:
      | Array<ValueTypes['create_directus_panels_input'] | undefined | null>
      | undefined
      | null;
    panels_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['create_directus_notifications_input']: {
    id?: string | undefined | null;
    timestamp: ValueTypes['Date'];
    timestamp_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    status?: string | undefined | null;
    recipient?: ValueTypes['create_directus_users_input'] | undefined | null;
    sender?: ValueTypes['create_directus_users_input'] | undefined | null;
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
    role?: ValueTypes['create_directus_roles_input'] | undefined | null;
    /** $t:shared_leave_blank_for_unlimited */
    password?: string | undefined | null;
    user_created?: ValueTypes['create_directus_users_input'] | undefined | null;
    date_created?: ValueTypes['Date'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: ValueTypes['Date'] | undefined | null;
    date_start_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: ValueTypes['Date'] | undefined | null;
    date_end_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
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
    status: string;
    trigger?: string | undefined | null;
    accountability?: string | undefined | null;
    options?: ValueTypes['JSON'] | undefined | null;
    options_func?: ValueTypes['count_functionsInput'] | undefined | null;
    operation?:
      | ValueTypes['create_directus_operations_input']
      | undefined
      | null;
    date_created?: ValueTypes['Date'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    user_created?: ValueTypes['create_directus_users_input'] | undefined | null;
    operations?:
      | Array<ValueTypes['create_directus_operations_input'] | undefined | null>
      | undefined
      | null;
    operations_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['create_directus_operations_input']: {
    id?: string | undefined | null;
    name?: string | undefined | null;
    key: string;
    type: string;
    position_x: number;
    position_y: number;
    options?: ValueTypes['JSON'] | undefined | null;
    options_func?: ValueTypes['count_functionsInput'] | undefined | null;
    resolve?: ValueTypes['create_directus_operations_input'] | undefined | null;
    reject?: ValueTypes['create_directus_operations_input'] | undefined | null;
    flow?: ValueTypes['create_directus_flows_input'] | undefined | null;
    date_created?: ValueTypes['Date'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    user_created?: ValueTypes['create_directus_users_input'] | undefined | null;
  };
  ['update_directus_permissions_input']: {
    id?: string | undefined | null;
    role?: ValueTypes['update_directus_roles_input'] | undefined | null;
    collection?: string | undefined | null;
    action?: string | undefined | null;
    permissions?: ValueTypes['JSON'] | undefined | null;
    permissions_func?: ValueTypes['count_functionsInput'] | undefined | null;
    validation?: ValueTypes['JSON'] | undefined | null;
    validation_func?: ValueTypes['count_functionsInput'] | undefined | null;
    presets?: ValueTypes['JSON'] | undefined | null;
    presets_func?: ValueTypes['count_functionsInput'] | undefined | null;
    fields?: Array<string | undefined | null> | undefined | null;
  };
  ['update_directus_presets_input']: {
    id?: string | undefined | null;
    bookmark?: string | undefined | null;
    user?: ValueTypes['update_directus_users_input'] | undefined | null;
    role?: ValueTypes['update_directus_roles_input'] | undefined | null;
    collection?: string | undefined | null;
    search?: string | undefined | null;
    layout?: string | undefined | null;
    layout_query?: ValueTypes['JSON'] | undefined | null;
    layout_query_func?: ValueTypes['count_functionsInput'] | undefined | null;
    layout_options?: ValueTypes['JSON'] | undefined | null;
    layout_options_func?: ValueTypes['count_functionsInput'] | undefined | null;
    refresh_interval?: number | undefined | null;
    filter?: ValueTypes['JSON'] | undefined | null;
    filter_func?: ValueTypes['count_functionsInput'] | undefined | null;
    icon?: string | undefined | null;
    color?: string | undefined | null;
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
    headers?: ValueTypes['JSON'] | undefined | null;
    headers_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['update_directus_settings_input']: {
    id?: string | undefined | null;
    project_name?: string | undefined | null;
    project_url?: string | undefined | null;
    /** $t:field_options.directus_settings.project_color_note */
    project_color?: string | undefined | null;
    project_logo?: ValueTypes['update_directus_files_input'] | undefined | null;
    public_foreground?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null;
    public_background?:
      | ValueTypes['update_directus_files_input']
      | undefined
      | null;
    public_note?: string | undefined | null;
    auth_login_attempts?: number | undefined | null;
    auth_password_policy?: string | undefined | null;
    storage_asset_transform?: string | undefined | null;
    storage_asset_presets?: ValueTypes['JSON'] | undefined | null;
    storage_asset_presets_func?:
      | ValueTypes['count_functionsInput']
      | undefined
      | null;
    custom_css?: string | undefined | null;
    storage_default_folder?:
      | ValueTypes['update_directus_folders_input']
      | undefined
      | null;
    basemaps?: ValueTypes['JSON'] | undefined | null;
    basemaps_func?: ValueTypes['count_functionsInput'] | undefined | null;
    mapbox_key?: string | undefined | null;
    module_bar?: ValueTypes['JSON'] | undefined | null;
    module_bar_func?: ValueTypes['count_functionsInput'] | undefined | null;
    project_descriptor?: string | undefined | null;
    translation_strings?: ValueTypes['JSON'] | undefined | null;
    translation_strings_func?:
      | ValueTypes['count_functionsInput']
      | undefined
      | null;
    default_language?: string | undefined | null;
  };
  ['update_directus_panels_input']: {
    id?: string | undefined | null;
    dashboard?:
      | ValueTypes['update_directus_dashboards_input']
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
    options?: ValueTypes['JSON'] | undefined | null;
    options_func?: ValueTypes['count_functionsInput'] | undefined | null;
    date_created?: ValueTypes['Date'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    user_created?: ValueTypes['update_directus_users_input'] | undefined | null;
  };
  ['update_directus_dashboards_input']: {
    id?: string | undefined | null;
    name?: string | undefined | null;
    icon?: string | undefined | null;
    note?: string | undefined | null;
    date_created?: ValueTypes['Date'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    user_created?: ValueTypes['update_directus_users_input'] | undefined | null;
    color?: string | undefined | null;
    panels?:
      | Array<ValueTypes['update_directus_panels_input'] | undefined | null>
      | undefined
      | null;
    panels_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['update_directus_notifications_input']: {
    id?: string | undefined | null;
    timestamp?: ValueTypes['Date'] | undefined | null;
    timestamp_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    status?: string | undefined | null;
    recipient?: ValueTypes['update_directus_users_input'] | undefined | null;
    sender?: ValueTypes['update_directus_users_input'] | undefined | null;
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
    role?: ValueTypes['update_directus_roles_input'] | undefined | null;
    /** $t:shared_leave_blank_for_unlimited */
    password?: string | undefined | null;
    user_created?: ValueTypes['update_directus_users_input'] | undefined | null;
    date_created?: ValueTypes['Date'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: ValueTypes['Date'] | undefined | null;
    date_start_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: ValueTypes['Date'] | undefined | null;
    date_end_func?: ValueTypes['datetime_functionsInput'] | undefined | null;
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
    options?: ValueTypes['JSON'] | undefined | null;
    options_func?: ValueTypes['count_functionsInput'] | undefined | null;
    operation?:
      | ValueTypes['update_directus_operations_input']
      | undefined
      | null;
    date_created?: ValueTypes['Date'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    user_created?: ValueTypes['update_directus_users_input'] | undefined | null;
    operations?:
      | Array<ValueTypes['update_directus_operations_input'] | undefined | null>
      | undefined
      | null;
    operations_func?: ValueTypes['count_functionsInput'] | undefined | null;
  };
  ['update_directus_operations_input']: {
    id?: string | undefined | null;
    name?: string | undefined | null;
    key?: string | undefined | null;
    type?: string | undefined | null;
    position_x?: number | undefined | null;
    position_y?: number | undefined | null;
    options?: ValueTypes['JSON'] | undefined | null;
    options_func?: ValueTypes['count_functionsInput'] | undefined | null;
    resolve?: ValueTypes['update_directus_operations_input'] | undefined | null;
    reject?: ValueTypes['update_directus_operations_input'] | undefined | null;
    flow?: ValueTypes['update_directus_flows_input'] | undefined | null;
    date_created?: ValueTypes['Date'] | undefined | null;
    date_created_func?:
      | ValueTypes['datetime_functionsInput']
      | undefined
      | null;
    user_created?: ValueTypes['update_directus_users_input'] | undefined | null;
  };
  ['delete_many']: AliasType<{
    ids?: boolean | `@${string}`;
    __typename?: boolean | `@${string}`;
  }>;
};

export type ModelTypes = {
  ['Query']: {
    extensions?: GraphQLTypes['extensions'] | undefined;
    server_specs_oas?: GraphQLTypes['JSON'] | undefined;
    server_specs_graphql?: string | undefined;
    server_ping?: string | undefined;
    server_info?: GraphQLTypes['server_info'] | undefined;
    server_health?: GraphQLTypes['JSON'] | undefined;
    collections?:
      | Array<GraphQLTypes['directus_collections'] | undefined>
      | undefined;
    collections_by_name?: GraphQLTypes['directus_collections'] | undefined;
    fields?: Array<GraphQLTypes['directus_fields'] | undefined> | undefined;
    fields_in_collection?:
      | Array<GraphQLTypes['directus_fields'] | undefined>
      | undefined;
    fields_by_name?: GraphQLTypes['directus_fields'] | undefined;
    relations?:
      | Array<GraphQLTypes['directus_relations'] | undefined>
      | undefined;
    relations_in_collection?:
      | Array<GraphQLTypes['directus_relations'] | undefined>
      | undefined;
    relations_by_name?: GraphQLTypes['directus_relations'] | undefined;
    users_me?: GraphQLTypes['directus_users'] | undefined;
    users?: Array<GraphQLTypes['directus_users'] | undefined> | undefined;
    users_by_id?: GraphQLTypes['directus_users'] | undefined;
    users_aggregated?:
      | Array<GraphQLTypes['directus_users_aggregated'] | undefined>
      | undefined;
    roles?: Array<GraphQLTypes['directus_roles'] | undefined> | undefined;
    roles_by_id?: GraphQLTypes['directus_roles'] | undefined;
    roles_aggregated?:
      | Array<GraphQLTypes['directus_roles_aggregated'] | undefined>
      | undefined;
    files?: Array<GraphQLTypes['directus_files'] | undefined> | undefined;
    files_by_id?: GraphQLTypes['directus_files'] | undefined;
    files_aggregated?:
      | Array<GraphQLTypes['directus_files_aggregated'] | undefined>
      | undefined;
    activity?: Array<GraphQLTypes['directus_activity'] | undefined> | undefined;
    activity_by_id?: GraphQLTypes['directus_activity'] | undefined;
    activity_aggregated?:
      | Array<GraphQLTypes['directus_activity_aggregated'] | undefined>
      | undefined;
    folders?: Array<GraphQLTypes['directus_folders'] | undefined> | undefined;
    folders_by_id?: GraphQLTypes['directus_folders'] | undefined;
    folders_aggregated?:
      | Array<GraphQLTypes['directus_folders_aggregated'] | undefined>
      | undefined;
    permissions?:
      | Array<GraphQLTypes['directus_permissions'] | undefined>
      | undefined;
    permissions_by_id?: GraphQLTypes['directus_permissions'] | undefined;
    permissions_aggregated?:
      | Array<GraphQLTypes['directus_permissions_aggregated'] | undefined>
      | undefined;
    presets?: Array<GraphQLTypes['directus_presets'] | undefined> | undefined;
    presets_by_id?: GraphQLTypes['directus_presets'] | undefined;
    presets_aggregated?:
      | Array<GraphQLTypes['directus_presets_aggregated'] | undefined>
      | undefined;
    revisions?:
      | Array<GraphQLTypes['directus_revisions'] | undefined>
      | undefined;
    revisions_by_id?: GraphQLTypes['directus_revisions'] | undefined;
    revisions_aggregated?:
      | Array<GraphQLTypes['directus_revisions_aggregated'] | undefined>
      | undefined;
    webhooks?: Array<GraphQLTypes['directus_webhooks'] | undefined> | undefined;
    webhooks_by_id?: GraphQLTypes['directus_webhooks'] | undefined;
    webhooks_aggregated?:
      | Array<GraphQLTypes['directus_webhooks_aggregated'] | undefined>
      | undefined;
    settings?: GraphQLTypes['directus_settings'] | undefined;
    panels?: Array<GraphQLTypes['directus_panels'] | undefined> | undefined;
    panels_by_id?: GraphQLTypes['directus_panels'] | undefined;
    panels_aggregated?:
      | Array<GraphQLTypes['directus_panels_aggregated'] | undefined>
      | undefined;
    notifications?:
      | Array<GraphQLTypes['directus_notifications'] | undefined>
      | undefined;
    notifications_by_id?: GraphQLTypes['directus_notifications'] | undefined;
    notifications_aggregated?:
      | Array<GraphQLTypes['directus_notifications_aggregated'] | undefined>
      | undefined;
    shares?: Array<GraphQLTypes['directus_shares'] | undefined> | undefined;
    shares_by_id?: GraphQLTypes['directus_shares'] | undefined;
    shares_aggregated?:
      | Array<GraphQLTypes['directus_shares_aggregated'] | undefined>
      | undefined;
    flows?: Array<GraphQLTypes['directus_flows'] | undefined> | undefined;
    flows_by_id?: GraphQLTypes['directus_flows'] | undefined;
    flows_aggregated?:
      | Array<GraphQLTypes['directus_flows_aggregated'] | undefined>
      | undefined;
    operations?:
      | Array<GraphQLTypes['directus_operations'] | undefined>
      | undefined;
    operations_by_id?: GraphQLTypes['directus_operations'] | undefined;
    operations_aggregated?:
      | Array<GraphQLTypes['directus_operations_aggregated'] | undefined>
      | undefined;
    dashboards?:
      | Array<GraphQLTypes['directus_dashboards'] | undefined>
      | undefined;
    dashboards_by_id?: GraphQLTypes['directus_dashboards'] | undefined;
    dashboards_aggregated?:
      | Array<GraphQLTypes['directus_dashboards_aggregated'] | undefined>
      | undefined;
  };
  ['extensions']: {
    interfaces?: Array<string | undefined> | undefined;
    displays?: Array<string | undefined> | undefined;
    layouts?: Array<string | undefined> | undefined;
    modules?: Array<string | undefined> | undefined;
  };
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  ['JSON']: any;
  ['graphql_sdl_scope']: GraphQLTypes['graphql_sdl_scope'];
  ['server_info']: {
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
    meta?: GraphQLTypes['directus_collections_meta'] | undefined;
    schema?: GraphQLTypes['directus_collections_schema'] | undefined;
  };
  ['directus_collections_meta']: {
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
    name?: string | undefined;
    comment?: string | undefined;
  };
  ['directus_fields']: {
    collection?: string | undefined;
    field?: string | undefined;
    type?: string | undefined;
    meta?: GraphQLTypes['directus_fields_meta'] | undefined;
    schema?: GraphQLTypes['directus_fields_schema'] | undefined;
  };
  ['directus_fields_meta']: {
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
    schema?: GraphQLTypes['directus_relations_schema'] | undefined;
    meta?: GraphQLTypes['directus_relations_meta'] | undefined;
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
  ['count_functions']: {
    count?: number | undefined;
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
  ['directus_users_filter']: GraphQLTypes['directus_users_filter'];
  ['count_function_filter_operators']: GraphQLTypes['count_function_filter_operators'];
  ['number_filter_operators']: GraphQLTypes['number_filter_operators'];
  ['directus_files_filter']: GraphQLTypes['directus_files_filter'];
  ['date_filter_operators']: GraphQLTypes['date_filter_operators'];
  ['datetime_function_filter_operators']: GraphQLTypes['datetime_function_filter_operators'];
  ['directus_roles_filter']: GraphQLTypes['directus_roles_filter'];
  ['boolean_filter_operators']: GraphQLTypes['boolean_filter_operators'];
  ['collaborators_filter']: GraphQLTypes['collaborators_filter'];
  ['collaborator_roles_filter']: GraphQLTypes['collaborator_roles_filter'];
  ['junction_directus_users_skills_filter']: GraphQLTypes['junction_directus_users_skills_filter'];
  ['skills_filter']: GraphQLTypes['skills_filter'];
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
  ['directus_users_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_users_aggregated_count'] | undefined;
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
    timezone?: number | undefined;
    discord_handle?: number | undefined;
    twitter_handle?: number | undefined;
    discord_id?: number | undefined;
    collaborators?: number | undefined;
    skills?: number | undefined;
  };
  ['directus_roles_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_roles_aggregated_count'] | undefined;
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
  ['directus_files_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_files_aggregated_count'] | undefined;
    avg?: GraphQLTypes['directus_files_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_files_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_files_aggregated_fields']
      | undefined;
    avgDistinct?: GraphQLTypes['directus_files_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['directus_files_aggregated_fields'] | undefined;
    min?: GraphQLTypes['directus_files_aggregated_fields'] | undefined;
    max?: GraphQLTypes['directus_files_aggregated_fields'] | undefined;
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
    width?: number | undefined;
    height?: number | undefined;
    duration?: number | undefined;
  };
  ['directus_activity']: {
    id?: string | undefined;
    action: string;
    user?: GraphQLTypes['directus_users'] | undefined;
    timestamp: GraphQLTypes['Date'];
    timestamp_func?: GraphQLTypes['datetime_functions'] | undefined;
    ip?: string | undefined;
    user_agent?: string | undefined;
    collection: string;
    item: string;
    comment?: string | undefined;
    revisions?:
      | Array<GraphQLTypes['directus_revisions'] | undefined>
      | undefined;
    revisions_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['directus_revisions']: {
    id?: string | undefined;
    activity?: GraphQLTypes['directus_activity'] | undefined;
    collection: string;
    item: string;
    data?: GraphQLTypes['JSON'] | undefined;
    data_func?: GraphQLTypes['count_functions'] | undefined;
    delta?: GraphQLTypes['JSON'] | undefined;
    delta_func?: GraphQLTypes['count_functions'] | undefined;
    parent?: GraphQLTypes['directus_revisions'] | undefined;
  };
  ['directus_activity_filter']: GraphQLTypes['directus_activity_filter'];
  ['directus_revisions_filter']: GraphQLTypes['directus_revisions_filter'];
  ['directus_activity_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_activity_aggregated_count'] | undefined;
    avg?: GraphQLTypes['directus_activity_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_activity_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_activity_aggregated_fields']
      | undefined;
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
    id?: number | undefined;
    action?: number | undefined;
    user?: number | undefined;
    timestamp?: number | undefined;
    ip?: number | undefined;
    user_agent?: number | undefined;
    collection?: number | undefined;
    item?: number | undefined;
    comment?: number | undefined;
    revisions?: number | undefined;
  };
  ['directus_activity_aggregated_fields']: {
    id?: number | undefined;
  };
  ['directus_folders_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_folders_aggregated_count'] | undefined;
  };
  ['directus_folders_aggregated_count']: {
    id?: number | undefined;
    name?: number | undefined;
    parent?: number | undefined;
  };
  ['directus_permissions']: {
    id?: string | undefined;
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
  ['directus_permissions_filter']: GraphQLTypes['directus_permissions_filter'];
  ['directus_permissions_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_permissions_aggregated_count'] | undefined;
    avg?: GraphQLTypes['directus_permissions_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_permissions_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_permissions_aggregated_fields']
      | undefined;
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
  ['directus_presets']: {
    id?: string | undefined;
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
    icon: string;
    color?: string | undefined;
  };
  ['directus_presets_filter']: GraphQLTypes['directus_presets_filter'];
  ['directus_presets_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_presets_aggregated_count'] | undefined;
    avg?: GraphQLTypes['directus_presets_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_presets_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_presets_aggregated_fields']
      | undefined;
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
  ['directus_revisions_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_revisions_aggregated_count'] | undefined;
    avg?: GraphQLTypes['directus_revisions_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_revisions_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_revisions_aggregated_fields']
      | undefined;
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
  ['directus_webhooks']: {
    id?: string | undefined;
    name: string;
    method: string;
    url: string;
    status: string;
    data: boolean;
    actions: Array<string | undefined>;
    collections: Array<string | undefined>;
    headers?: GraphQLTypes['JSON'] | undefined;
    headers_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['directus_webhooks_filter']: GraphQLTypes['directus_webhooks_filter'];
  ['directus_webhooks_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_webhooks_aggregated_count'] | undefined;
    avg?: GraphQLTypes['directus_webhooks_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_webhooks_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_webhooks_aggregated_fields']
      | undefined;
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
  ['directus_settings']: {
    id?: string | undefined;
    project_name: string;
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
    default_language: string;
  };
  ['directus_panels']: {
    id?: string | undefined;
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
    id?: string | undefined;
    name: string;
    icon: string;
    note?: string | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functions'] | undefined;
    user_created?: GraphQLTypes['directus_users'] | undefined;
    color?: string | undefined;
    panels?: Array<GraphQLTypes['directus_panels'] | undefined> | undefined;
    panels_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['directus_panels_filter']: GraphQLTypes['directus_panels_filter'];
  ['directus_dashboards_filter']: GraphQLTypes['directus_dashboards_filter'];
  ['directus_panels_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_panels_aggregated_count'] | undefined;
    avg?: GraphQLTypes['directus_panels_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_panels_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_panels_aggregated_fields']
      | undefined;
    avgDistinct?: GraphQLTypes['directus_panels_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['directus_panels_aggregated_fields'] | undefined;
    min?: GraphQLTypes['directus_panels_aggregated_fields'] | undefined;
    max?: GraphQLTypes['directus_panels_aggregated_fields'] | undefined;
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
  ['directus_notifications']: {
    id?: string | undefined;
    timestamp: GraphQLTypes['Date'];
    timestamp_func?: GraphQLTypes['datetime_functions'] | undefined;
    status?: string | undefined;
    recipient?: GraphQLTypes['directus_users'] | undefined;
    sender?: GraphQLTypes['directus_users'] | undefined;
    subject: string;
    message?: string | undefined;
    collection?: string | undefined;
    item?: string | undefined;
  };
  ['directus_notifications_filter']: GraphQLTypes['directus_notifications_filter'];
  ['directus_notifications_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_notifications_aggregated_count'] | undefined;
    avg?: GraphQLTypes['directus_notifications_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_notifications_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_notifications_aggregated_fields']
      | undefined;
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
    id?: string | undefined;
    name?: string | undefined;
    collection?: string | undefined;
    item?: string | undefined;
    role?: GraphQLTypes['directus_roles'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    password?: string | undefined;
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
  ['directus_shares_filter']: GraphQLTypes['directus_shares_filter'];
  ['directus_shares_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_shares_aggregated_count'] | undefined;
    avg?: GraphQLTypes['directus_shares_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_shares_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_shares_aggregated_fields']
      | undefined;
    avgDistinct?: GraphQLTypes['directus_shares_aggregated_fields'] | undefined;
    sumDistinct?: GraphQLTypes['directus_shares_aggregated_fields'] | undefined;
    min?: GraphQLTypes['directus_shares_aggregated_fields'] | undefined;
    max?: GraphQLTypes['directus_shares_aggregated_fields'] | undefined;
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
    id?: string | undefined;
    name: string;
    icon?: string | undefined;
    color?: string | undefined;
    description?: string | undefined;
    status: string;
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
    id?: string | undefined;
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
  ['directus_operations_filter']: GraphQLTypes['directus_operations_filter'];
  ['directus_flows_filter']: GraphQLTypes['directus_flows_filter'];
  ['directus_flows_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_flows_aggregated_count'] | undefined;
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
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_operations_aggregated_count'] | undefined;
    avg?: GraphQLTypes['directus_operations_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_operations_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_operations_aggregated_fields']
      | undefined;
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
  ['directus_dashboards_aggregated']: {
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_dashboards_aggregated_count'] | undefined;
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
  ['Mutation']: {
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
    create_users_items?:
      | Array<GraphQLTypes['directus_users'] | undefined>
      | undefined;
    create_users_item?: GraphQLTypes['directus_users'] | undefined;
    create_roles_items?:
      | Array<GraphQLTypes['directus_roles'] | undefined>
      | undefined;
    create_roles_item?: GraphQLTypes['directus_roles'] | undefined;
    create_files_items?:
      | Array<GraphQLTypes['directus_files'] | undefined>
      | undefined;
    create_files_item?: GraphQLTypes['directus_files'] | undefined;
    create_folders_items?:
      | Array<GraphQLTypes['directus_folders'] | undefined>
      | undefined;
    create_folders_item?: GraphQLTypes['directus_folders'] | undefined;
    create_permissions_items?:
      | Array<GraphQLTypes['directus_permissions'] | undefined>
      | undefined;
    create_permissions_item?: GraphQLTypes['directus_permissions'] | undefined;
    create_presets_items?:
      | Array<GraphQLTypes['directus_presets'] | undefined>
      | undefined;
    create_presets_item?: GraphQLTypes['directus_presets'] | undefined;
    create_webhooks_items?:
      | Array<GraphQLTypes['directus_webhooks'] | undefined>
      | undefined;
    create_webhooks_item?: GraphQLTypes['directus_webhooks'] | undefined;
    create_panels_items?:
      | Array<GraphQLTypes['directus_panels'] | undefined>
      | undefined;
    create_panels_item?: GraphQLTypes['directus_panels'] | undefined;
    create_notifications_items?:
      | Array<GraphQLTypes['directus_notifications'] | undefined>
      | undefined;
    create_notifications_item?:
      | GraphQLTypes['directus_notifications']
      | undefined;
    create_shares_items?:
      | Array<GraphQLTypes['directus_shares'] | undefined>
      | undefined;
    create_shares_item?: GraphQLTypes['directus_shares'] | undefined;
    create_flows_items?:
      | Array<GraphQLTypes['directus_flows'] | undefined>
      | undefined;
    create_flows_item?: GraphQLTypes['directus_flows'] | undefined;
    create_operations_items?:
      | Array<GraphQLTypes['directus_operations'] | undefined>
      | undefined;
    create_operations_item?: GraphQLTypes['directus_operations'] | undefined;
    create_dashboards_items?:
      | Array<GraphQLTypes['directus_dashboards'] | undefined>
      | undefined;
    create_dashboards_item?: GraphQLTypes['directus_dashboards'] | undefined;
    update_users_items?:
      | Array<GraphQLTypes['directus_users'] | undefined>
      | undefined;
    update_users_item?: GraphQLTypes['directus_users'] | undefined;
    update_roles_items?:
      | Array<GraphQLTypes['directus_roles'] | undefined>
      | undefined;
    update_roles_item?: GraphQLTypes['directus_roles'] | undefined;
    update_files_items?:
      | Array<GraphQLTypes['directus_files'] | undefined>
      | undefined;
    update_files_item?: GraphQLTypes['directus_files'] | undefined;
    update_folders_items?:
      | Array<GraphQLTypes['directus_folders'] | undefined>
      | undefined;
    update_folders_item?: GraphQLTypes['directus_folders'] | undefined;
    update_permissions_items?:
      | Array<GraphQLTypes['directus_permissions'] | undefined>
      | undefined;
    update_permissions_item?: GraphQLTypes['directus_permissions'] | undefined;
    update_presets_items?:
      | Array<GraphQLTypes['directus_presets'] | undefined>
      | undefined;
    update_presets_item?: GraphQLTypes['directus_presets'] | undefined;
    update_webhooks_items?:
      | Array<GraphQLTypes['directus_webhooks'] | undefined>
      | undefined;
    update_webhooks_item?: GraphQLTypes['directus_webhooks'] | undefined;
    update_settings?: GraphQLTypes['directus_settings'] | undefined;
    update_panels_items?:
      | Array<GraphQLTypes['directus_panels'] | undefined>
      | undefined;
    update_panels_item?: GraphQLTypes['directus_panels'] | undefined;
    update_notifications_items?:
      | Array<GraphQLTypes['directus_notifications'] | undefined>
      | undefined;
    update_notifications_item?:
      | GraphQLTypes['directus_notifications']
      | undefined;
    update_shares_items?:
      | Array<GraphQLTypes['directus_shares'] | undefined>
      | undefined;
    update_shares_item?: GraphQLTypes['directus_shares'] | undefined;
    update_flows_items?:
      | Array<GraphQLTypes['directus_flows'] | undefined>
      | undefined;
    update_flows_item?: GraphQLTypes['directus_flows'] | undefined;
    update_operations_items?:
      | Array<GraphQLTypes['directus_operations'] | undefined>
      | undefined;
    update_operations_item?: GraphQLTypes['directus_operations'] | undefined;
    update_dashboards_items?:
      | Array<GraphQLTypes['directus_dashboards'] | undefined>
      | undefined;
    update_dashboards_item?: GraphQLTypes['directus_dashboards'] | undefined;
    delete_users_items?: GraphQLTypes['delete_many'] | undefined;
    delete_users_item?: GraphQLTypes['delete_one'] | undefined;
    delete_roles_items?: GraphQLTypes['delete_many'] | undefined;
    delete_roles_item?: GraphQLTypes['delete_one'] | undefined;
    delete_files_items?: GraphQLTypes['delete_many'] | undefined;
    delete_files_item?: GraphQLTypes['delete_one'] | undefined;
    delete_folders_items?: GraphQLTypes['delete_many'] | undefined;
    delete_folders_item?: GraphQLTypes['delete_one'] | undefined;
    delete_permissions_items?: GraphQLTypes['delete_many'] | undefined;
    delete_permissions_item?: GraphQLTypes['delete_one'] | undefined;
    delete_presets_items?: GraphQLTypes['delete_many'] | undefined;
    delete_presets_item?: GraphQLTypes['delete_one'] | undefined;
    delete_webhooks_items?: GraphQLTypes['delete_many'] | undefined;
    delete_webhooks_item?: GraphQLTypes['delete_one'] | undefined;
    delete_panels_items?: GraphQLTypes['delete_many'] | undefined;
    delete_panels_item?: GraphQLTypes['delete_one'] | undefined;
    delete_notifications_items?: GraphQLTypes['delete_many'] | undefined;
    delete_notifications_item?: GraphQLTypes['delete_one'] | undefined;
    delete_shares_items?: GraphQLTypes['delete_many'] | undefined;
    delete_shares_item?: GraphQLTypes['delete_one'] | undefined;
    delete_flows_items?: GraphQLTypes['delete_many'] | undefined;
    delete_flows_item?: GraphQLTypes['delete_one'] | undefined;
    delete_operations_items?: GraphQLTypes['delete_many'] | undefined;
    delete_operations_item?: GraphQLTypes['delete_one'] | undefined;
    delete_dashboards_items?: GraphQLTypes['delete_many'] | undefined;
    delete_dashboards_item?: GraphQLTypes['delete_one'] | undefined;
  };
  ['auth_tokens']: {
    access_token?: string | undefined;
    expires?: number | undefined;
    refresh_token?: string | undefined;
  };
  ['auth_mode']: GraphQLTypes['auth_mode'];
  ['users_me_tfa_generate_data']: {
    secret?: string | undefined;
    otpauth_url?: string | undefined;
  };
  /** Represents NULL values */
  ['Void']: any;
  ['create_directus_collections_input']: GraphQLTypes['create_directus_collections_input'];
  ['directus_collections_meta_input']: GraphQLTypes['directus_collections_meta_input'];
  ['directus_collections_schema_input']: GraphQLTypes['directus_collections_schema_input'];
  ['create_directus_collections_fields_input']: GraphQLTypes['create_directus_collections_fields_input'];
  ['directus_fields_meta_input']: GraphQLTypes['directus_fields_meta_input'];
  ['directus_fields_schema_input']: GraphQLTypes['directus_fields_schema_input'];
  ['update_directus_collections_input']: GraphQLTypes['update_directus_collections_input'];
  ['delete_collection']: {
    collection?: string | undefined;
  };
  ['create_directus_fields_input']: GraphQLTypes['create_directus_fields_input'];
  ['update_directus_fields_input']: GraphQLTypes['update_directus_fields_input'];
  ['delete_field']: {
    collection?: string | undefined;
    field?: string | undefined;
  };
  ['create_directus_relations_input']: GraphQLTypes['create_directus_relations_input'];
  ['directus_relations_schema_input']: GraphQLTypes['directus_relations_schema_input'];
  ['directus_relations_meta_input']: GraphQLTypes['directus_relations_meta_input'];
  ['update_directus_relations_input']: GraphQLTypes['update_directus_relations_input'];
  ['delete_relation']: {
    collection?: string | undefined;
    field?: string | undefined;
  };
  ['update_directus_users_input']: GraphQLTypes['update_directus_users_input'];
  ['count_functionsInput']: GraphQLTypes['count_functionsInput'];
  ['update_directus_files_input']: GraphQLTypes['update_directus_files_input'];
  ['update_directus_folders_input']: GraphQLTypes['update_directus_folders_input'];
  ['datetime_functionsInput']: GraphQLTypes['datetime_functionsInput'];
  ['update_directus_roles_input']: GraphQLTypes['update_directus_roles_input'];
  ['update_collaborators_input']: GraphQLTypes['update_collaborators_input'];
  ['update_collaborator_roles_input']: GraphQLTypes['update_collaborator_roles_input'];
  ['update_junction_directus_users_skills_input']: GraphQLTypes['update_junction_directus_users_skills_input'];
  ['update_skills_input']: GraphQLTypes['update_skills_input'];
  ['delete_one']: {
    id: string;
  };
  ['create_directus_files_input']: GraphQLTypes['create_directus_files_input'];
  ['create_directus_folders_input']: GraphQLTypes['create_directus_folders_input'];
  ['create_directus_users_input']: GraphQLTypes['create_directus_users_input'];
  ['create_directus_roles_input']: GraphQLTypes['create_directus_roles_input'];
  ['create_collaborators_input']: GraphQLTypes['create_collaborators_input'];
  ['create_collaborator_roles_input']: GraphQLTypes['create_collaborator_roles_input'];
  ['create_junction_directus_users_skills_input']: GraphQLTypes['create_junction_directus_users_skills_input'];
  ['create_skills_input']: GraphQLTypes['create_skills_input'];
  ['create_directus_permissions_input']: GraphQLTypes['create_directus_permissions_input'];
  ['create_directus_presets_input']: GraphQLTypes['create_directus_presets_input'];
  ['create_directus_webhooks_input']: GraphQLTypes['create_directus_webhooks_input'];
  ['create_directus_panels_input']: GraphQLTypes['create_directus_panels_input'];
  ['create_directus_dashboards_input']: GraphQLTypes['create_directus_dashboards_input'];
  ['create_directus_notifications_input']: GraphQLTypes['create_directus_notifications_input'];
  ['create_directus_shares_input']: GraphQLTypes['create_directus_shares_input'];
  ['create_directus_flows_input']: GraphQLTypes['create_directus_flows_input'];
  ['create_directus_operations_input']: GraphQLTypes['create_directus_operations_input'];
  ['update_directus_permissions_input']: GraphQLTypes['update_directus_permissions_input'];
  ['update_directus_presets_input']: GraphQLTypes['update_directus_presets_input'];
  ['update_directus_webhooks_input']: GraphQLTypes['update_directus_webhooks_input'];
  ['update_directus_settings_input']: GraphQLTypes['update_directus_settings_input'];
  ['update_directus_panels_input']: GraphQLTypes['update_directus_panels_input'];
  ['update_directus_dashboards_input']: GraphQLTypes['update_directus_dashboards_input'];
  ['update_directus_notifications_input']: GraphQLTypes['update_directus_notifications_input'];
  ['update_directus_shares_input']: GraphQLTypes['update_directus_shares_input'];
  ['update_directus_flows_input']: GraphQLTypes['update_directus_flows_input'];
  ['update_directus_operations_input']: GraphQLTypes['update_directus_operations_input'];
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
    collections?:
      | Array<GraphQLTypes['directus_collections'] | undefined>
      | undefined;
    collections_by_name?: GraphQLTypes['directus_collections'] | undefined;
    fields?: Array<GraphQLTypes['directus_fields'] | undefined> | undefined;
    fields_in_collection?:
      | Array<GraphQLTypes['directus_fields'] | undefined>
      | undefined;
    fields_by_name?: GraphQLTypes['directus_fields'] | undefined;
    relations?:
      | Array<GraphQLTypes['directus_relations'] | undefined>
      | undefined;
    relations_in_collection?:
      | Array<GraphQLTypes['directus_relations'] | undefined>
      | undefined;
    relations_by_name?: GraphQLTypes['directus_relations'] | undefined;
    users_me?: GraphQLTypes['directus_users'] | undefined;
    users?: Array<GraphQLTypes['directus_users'] | undefined> | undefined;
    users_by_id?: GraphQLTypes['directus_users'] | undefined;
    users_aggregated?:
      | Array<GraphQLTypes['directus_users_aggregated'] | undefined>
      | undefined;
    roles?: Array<GraphQLTypes['directus_roles'] | undefined> | undefined;
    roles_by_id?: GraphQLTypes['directus_roles'] | undefined;
    roles_aggregated?:
      | Array<GraphQLTypes['directus_roles_aggregated'] | undefined>
      | undefined;
    files?: Array<GraphQLTypes['directus_files'] | undefined> | undefined;
    files_by_id?: GraphQLTypes['directus_files'] | undefined;
    files_aggregated?:
      | Array<GraphQLTypes['directus_files_aggregated'] | undefined>
      | undefined;
    activity?: Array<GraphQLTypes['directus_activity'] | undefined> | undefined;
    activity_by_id?: GraphQLTypes['directus_activity'] | undefined;
    activity_aggregated?:
      | Array<GraphQLTypes['directus_activity_aggregated'] | undefined>
      | undefined;
    folders?: Array<GraphQLTypes['directus_folders'] | undefined> | undefined;
    folders_by_id?: GraphQLTypes['directus_folders'] | undefined;
    folders_aggregated?:
      | Array<GraphQLTypes['directus_folders_aggregated'] | undefined>
      | undefined;
    permissions?:
      | Array<GraphQLTypes['directus_permissions'] | undefined>
      | undefined;
    permissions_by_id?: GraphQLTypes['directus_permissions'] | undefined;
    permissions_aggregated?:
      | Array<GraphQLTypes['directus_permissions_aggregated'] | undefined>
      | undefined;
    presets?: Array<GraphQLTypes['directus_presets'] | undefined> | undefined;
    presets_by_id?: GraphQLTypes['directus_presets'] | undefined;
    presets_aggregated?:
      | Array<GraphQLTypes['directus_presets_aggregated'] | undefined>
      | undefined;
    revisions?:
      | Array<GraphQLTypes['directus_revisions'] | undefined>
      | undefined;
    revisions_by_id?: GraphQLTypes['directus_revisions'] | undefined;
    revisions_aggregated?:
      | Array<GraphQLTypes['directus_revisions_aggregated'] | undefined>
      | undefined;
    webhooks?: Array<GraphQLTypes['directus_webhooks'] | undefined> | undefined;
    webhooks_by_id?: GraphQLTypes['directus_webhooks'] | undefined;
    webhooks_aggregated?:
      | Array<GraphQLTypes['directus_webhooks_aggregated'] | undefined>
      | undefined;
    settings?: GraphQLTypes['directus_settings'] | undefined;
    panels?: Array<GraphQLTypes['directus_panels'] | undefined> | undefined;
    panels_by_id?: GraphQLTypes['directus_panels'] | undefined;
    panels_aggregated?:
      | Array<GraphQLTypes['directus_panels_aggregated'] | undefined>
      | undefined;
    notifications?:
      | Array<GraphQLTypes['directus_notifications'] | undefined>
      | undefined;
    notifications_by_id?: GraphQLTypes['directus_notifications'] | undefined;
    notifications_aggregated?:
      | Array<GraphQLTypes['directus_notifications_aggregated'] | undefined>
      | undefined;
    shares?: Array<GraphQLTypes['directus_shares'] | undefined> | undefined;
    shares_by_id?: GraphQLTypes['directus_shares'] | undefined;
    shares_aggregated?:
      | Array<GraphQLTypes['directus_shares_aggregated'] | undefined>
      | undefined;
    flows?: Array<GraphQLTypes['directus_flows'] | undefined> | undefined;
    flows_by_id?: GraphQLTypes['directus_flows'] | undefined;
    flows_aggregated?:
      | Array<GraphQLTypes['directus_flows_aggregated'] | undefined>
      | undefined;
    operations?:
      | Array<GraphQLTypes['directus_operations'] | undefined>
      | undefined;
    operations_by_id?: GraphQLTypes['directus_operations'] | undefined;
    operations_aggregated?:
      | Array<GraphQLTypes['directus_operations_aggregated'] | undefined>
      | undefined;
    dashboards?:
      | Array<GraphQLTypes['directus_dashboards'] | undefined>
      | undefined;
    dashboards_by_id?: GraphQLTypes['directus_dashboards'] | undefined;
    dashboards_aggregated?:
      | Array<GraphQLTypes['directus_dashboards_aggregated'] | undefined>
      | undefined;
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
  ['count_functions']: {
    __typename: 'count_functions';
    count?: number | undefined;
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
  ['directus_users_aggregated']: {
    __typename: 'directus_users_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_users_aggregated_count'] | undefined;
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
    timezone?: number | undefined;
    discord_handle?: number | undefined;
    twitter_handle?: number | undefined;
    discord_id?: number | undefined;
    collaborators?: number | undefined;
    skills?: number | undefined;
  };
  ['directus_roles_aggregated']: {
    __typename: 'directus_roles_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_roles_aggregated_count'] | undefined;
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
  ['directus_files_aggregated']: {
    __typename: 'directus_files_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_files_aggregated_count'] | undefined;
    avg?: GraphQLTypes['directus_files_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_files_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_files_aggregated_fields']
      | undefined;
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
    width?: number | undefined;
    height?: number | undefined;
    duration?: number | undefined;
  };
  ['directus_activity']: {
    __typename: 'directus_activity';
    id?: string | undefined;
    action: string;
    user?: GraphQLTypes['directus_users'] | undefined;
    timestamp: GraphQLTypes['Date'];
    timestamp_func?: GraphQLTypes['datetime_functions'] | undefined;
    ip?: string | undefined;
    user_agent?: string | undefined;
    collection: string;
    item: string;
    comment?: string | undefined;
    revisions?:
      | Array<GraphQLTypes['directus_revisions'] | undefined>
      | undefined;
    revisions_func?: GraphQLTypes['count_functions'] | undefined;
  };
  ['directus_revisions']: {
    __typename: 'directus_revisions';
    id?: string | undefined;
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
    avg?: GraphQLTypes['directus_activity_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_activity_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_activity_aggregated_fields']
      | undefined;
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
    revisions?: number | undefined;
  };
  ['directus_activity_aggregated_fields']: {
    __typename: 'directus_activity_aggregated_fields';
    id?: number | undefined;
  };
  ['directus_folders_aggregated']: {
    __typename: 'directus_folders_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_folders_aggregated_count'] | undefined;
  };
  ['directus_folders_aggregated_count']: {
    __typename: 'directus_folders_aggregated_count';
    id?: number | undefined;
    name?: number | undefined;
    parent?: number | undefined;
  };
  ['directus_permissions']: {
    __typename: 'directus_permissions';
    id?: string | undefined;
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
    avg?: GraphQLTypes['directus_permissions_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_permissions_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_permissions_aggregated_fields']
      | undefined;
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
  ['directus_presets']: {
    __typename: 'directus_presets';
    id?: string | undefined;
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
    icon: string;
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
    avg?: GraphQLTypes['directus_presets_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_presets_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_presets_aggregated_fields']
      | undefined;
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
  ['directus_revisions_aggregated']: {
    __typename: 'directus_revisions_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_revisions_aggregated_count'] | undefined;
    avg?: GraphQLTypes['directus_revisions_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_revisions_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_revisions_aggregated_fields']
      | undefined;
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
  ['directus_webhooks']: {
    __typename: 'directus_webhooks';
    id?: string | undefined;
    name: string;
    method: string;
    url: string;
    status: string;
    data: boolean;
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
    avg?: GraphQLTypes['directus_webhooks_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_webhooks_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_webhooks_aggregated_fields']
      | undefined;
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
  ['directus_settings']: {
    __typename: 'directus_settings';
    id?: string | undefined;
    project_name: string;
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
    default_language: string;
  };
  ['directus_panels']: {
    __typename: 'directus_panels';
    id?: string | undefined;
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
    id?: string | undefined;
    name: string;
    icon: string;
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
    avg?: GraphQLTypes['directus_panels_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_panels_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_panels_aggregated_fields']
      | undefined;
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
  ['directus_notifications']: {
    __typename: 'directus_notifications';
    id?: string | undefined;
    timestamp: GraphQLTypes['Date'];
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
    avg?: GraphQLTypes['directus_notifications_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_notifications_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_notifications_aggregated_fields']
      | undefined;
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
    id?: string | undefined;
    name?: string | undefined;
    collection?: string | undefined;
    item?: string | undefined;
    role?: GraphQLTypes['directus_roles'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    password?: string | undefined;
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
    password?: GraphQLTypes['string_filter_operators'] | undefined;
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
    avg?: GraphQLTypes['directus_shares_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_shares_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_shares_aggregated_fields']
      | undefined;
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
    id?: string | undefined;
    name: string;
    icon?: string | undefined;
    color?: string | undefined;
    description?: string | undefined;
    status: string;
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
    id?: string | undefined;
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
    avg?: GraphQLTypes['directus_operations_aggregated_fields'] | undefined;
    sum?: GraphQLTypes['directus_operations_aggregated_fields'] | undefined;
    countDistinct?:
      | GraphQLTypes['directus_operations_aggregated_fields']
      | undefined;
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
  ['directus_dashboards_aggregated']: {
    __typename: 'directus_dashboards_aggregated';
    group?: GraphQLTypes['JSON'] | undefined;
    countAll?: number | undefined;
    count?: GraphQLTypes['directus_dashboards_aggregated_count'] | undefined;
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
    create_users_items?:
      | Array<GraphQLTypes['directus_users'] | undefined>
      | undefined;
    create_users_item?: GraphQLTypes['directus_users'] | undefined;
    create_roles_items?:
      | Array<GraphQLTypes['directus_roles'] | undefined>
      | undefined;
    create_roles_item?: GraphQLTypes['directus_roles'] | undefined;
    create_files_items?:
      | Array<GraphQLTypes['directus_files'] | undefined>
      | undefined;
    create_files_item?: GraphQLTypes['directus_files'] | undefined;
    create_folders_items?:
      | Array<GraphQLTypes['directus_folders'] | undefined>
      | undefined;
    create_folders_item?: GraphQLTypes['directus_folders'] | undefined;
    create_permissions_items?:
      | Array<GraphQLTypes['directus_permissions'] | undefined>
      | undefined;
    create_permissions_item?: GraphQLTypes['directus_permissions'] | undefined;
    create_presets_items?:
      | Array<GraphQLTypes['directus_presets'] | undefined>
      | undefined;
    create_presets_item?: GraphQLTypes['directus_presets'] | undefined;
    create_webhooks_items?:
      | Array<GraphQLTypes['directus_webhooks'] | undefined>
      | undefined;
    create_webhooks_item?: GraphQLTypes['directus_webhooks'] | undefined;
    create_panels_items?:
      | Array<GraphQLTypes['directus_panels'] | undefined>
      | undefined;
    create_panels_item?: GraphQLTypes['directus_panels'] | undefined;
    create_notifications_items?:
      | Array<GraphQLTypes['directus_notifications'] | undefined>
      | undefined;
    create_notifications_item?:
      | GraphQLTypes['directus_notifications']
      | undefined;
    create_shares_items?:
      | Array<GraphQLTypes['directus_shares'] | undefined>
      | undefined;
    create_shares_item?: GraphQLTypes['directus_shares'] | undefined;
    create_flows_items?:
      | Array<GraphQLTypes['directus_flows'] | undefined>
      | undefined;
    create_flows_item?: GraphQLTypes['directus_flows'] | undefined;
    create_operations_items?:
      | Array<GraphQLTypes['directus_operations'] | undefined>
      | undefined;
    create_operations_item?: GraphQLTypes['directus_operations'] | undefined;
    create_dashboards_items?:
      | Array<GraphQLTypes['directus_dashboards'] | undefined>
      | undefined;
    create_dashboards_item?: GraphQLTypes['directus_dashboards'] | undefined;
    update_users_items?:
      | Array<GraphQLTypes['directus_users'] | undefined>
      | undefined;
    update_users_item?: GraphQLTypes['directus_users'] | undefined;
    update_roles_items?:
      | Array<GraphQLTypes['directus_roles'] | undefined>
      | undefined;
    update_roles_item?: GraphQLTypes['directus_roles'] | undefined;
    update_files_items?:
      | Array<GraphQLTypes['directus_files'] | undefined>
      | undefined;
    update_files_item?: GraphQLTypes['directus_files'] | undefined;
    update_folders_items?:
      | Array<GraphQLTypes['directus_folders'] | undefined>
      | undefined;
    update_folders_item?: GraphQLTypes['directus_folders'] | undefined;
    update_permissions_items?:
      | Array<GraphQLTypes['directus_permissions'] | undefined>
      | undefined;
    update_permissions_item?: GraphQLTypes['directus_permissions'] | undefined;
    update_presets_items?:
      | Array<GraphQLTypes['directus_presets'] | undefined>
      | undefined;
    update_presets_item?: GraphQLTypes['directus_presets'] | undefined;
    update_webhooks_items?:
      | Array<GraphQLTypes['directus_webhooks'] | undefined>
      | undefined;
    update_webhooks_item?: GraphQLTypes['directus_webhooks'] | undefined;
    update_settings?: GraphQLTypes['directus_settings'] | undefined;
    update_panels_items?:
      | Array<GraphQLTypes['directus_panels'] | undefined>
      | undefined;
    update_panels_item?: GraphQLTypes['directus_panels'] | undefined;
    update_notifications_items?:
      | Array<GraphQLTypes['directus_notifications'] | undefined>
      | undefined;
    update_notifications_item?:
      | GraphQLTypes['directus_notifications']
      | undefined;
    update_shares_items?:
      | Array<GraphQLTypes['directus_shares'] | undefined>
      | undefined;
    update_shares_item?: GraphQLTypes['directus_shares'] | undefined;
    update_flows_items?:
      | Array<GraphQLTypes['directus_flows'] | undefined>
      | undefined;
    update_flows_item?: GraphQLTypes['directus_flows'] | undefined;
    update_operations_items?:
      | Array<GraphQLTypes['directus_operations'] | undefined>
      | undefined;
    update_operations_item?: GraphQLTypes['directus_operations'] | undefined;
    update_dashboards_items?:
      | Array<GraphQLTypes['directus_dashboards'] | undefined>
      | undefined;
    update_dashboards_item?: GraphQLTypes['directus_dashboards'] | undefined;
    delete_users_items?: GraphQLTypes['delete_many'] | undefined;
    delete_users_item?: GraphQLTypes['delete_one'] | undefined;
    delete_roles_items?: GraphQLTypes['delete_many'] | undefined;
    delete_roles_item?: GraphQLTypes['delete_one'] | undefined;
    delete_files_items?: GraphQLTypes['delete_many'] | undefined;
    delete_files_item?: GraphQLTypes['delete_one'] | undefined;
    delete_folders_items?: GraphQLTypes['delete_many'] | undefined;
    delete_folders_item?: GraphQLTypes['delete_one'] | undefined;
    delete_permissions_items?: GraphQLTypes['delete_many'] | undefined;
    delete_permissions_item?: GraphQLTypes['delete_one'] | undefined;
    delete_presets_items?: GraphQLTypes['delete_many'] | undefined;
    delete_presets_item?: GraphQLTypes['delete_one'] | undefined;
    delete_webhooks_items?: GraphQLTypes['delete_many'] | undefined;
    delete_webhooks_item?: GraphQLTypes['delete_one'] | undefined;
    delete_panels_items?: GraphQLTypes['delete_many'] | undefined;
    delete_panels_item?: GraphQLTypes['delete_one'] | undefined;
    delete_notifications_items?: GraphQLTypes['delete_many'] | undefined;
    delete_notifications_item?: GraphQLTypes['delete_one'] | undefined;
    delete_shares_items?: GraphQLTypes['delete_many'] | undefined;
    delete_shares_item?: GraphQLTypes['delete_one'] | undefined;
    delete_flows_items?: GraphQLTypes['delete_many'] | undefined;
    delete_flows_item?: GraphQLTypes['delete_one'] | undefined;
    delete_operations_items?: GraphQLTypes['delete_many'] | undefined;
    delete_operations_item?: GraphQLTypes['delete_one'] | undefined;
    delete_dashboards_items?: GraphQLTypes['delete_many'] | undefined;
    delete_dashboards_item?: GraphQLTypes['delete_one'] | undefined;
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
  ['count_functionsInput']: {
    count?: number | undefined;
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
  ['create_directus_permissions_input']: {
    id?: string | undefined;
    role?: GraphQLTypes['create_directus_roles_input'] | undefined;
    collection: string;
    action: string;
    permissions?: GraphQLTypes['JSON'] | undefined;
    permissions_func?: GraphQLTypes['count_functionsInput'] | undefined;
    validation?: GraphQLTypes['JSON'] | undefined;
    validation_func?: GraphQLTypes['count_functionsInput'] | undefined;
    presets?: GraphQLTypes['JSON'] | undefined;
    presets_func?: GraphQLTypes['count_functionsInput'] | undefined;
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
    layout_query_func?: GraphQLTypes['count_functionsInput'] | undefined;
    layout_options?: GraphQLTypes['JSON'] | undefined;
    layout_options_func?: GraphQLTypes['count_functionsInput'] | undefined;
    refresh_interval?: number | undefined;
    filter?: GraphQLTypes['JSON'] | undefined;
    filter_func?: GraphQLTypes['count_functionsInput'] | undefined;
    icon: string;
    color?: string | undefined;
  };
  ['create_directus_webhooks_input']: {
    id?: string | undefined;
    name: string;
    method: string;
    url: string;
    status: string;
    data: boolean;
    actions: Array<string | undefined>;
    collections: Array<string | undefined>;
    headers?: GraphQLTypes['JSON'] | undefined;
    headers_func?: GraphQLTypes['count_functionsInput'] | undefined;
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
    options_func?: GraphQLTypes['count_functionsInput'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    user_created?: GraphQLTypes['create_directus_users_input'] | undefined;
  };
  ['create_directus_dashboards_input']: {
    id?: string | undefined;
    name: string;
    icon: string;
    note?: string | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    user_created?: GraphQLTypes['create_directus_users_input'] | undefined;
    color?: string | undefined;
    panels?:
      | Array<GraphQLTypes['create_directus_panels_input'] | undefined>
      | undefined;
    panels_func?: GraphQLTypes['count_functionsInput'] | undefined;
  };
  ['create_directus_notifications_input']: {
    id?: string | undefined;
    timestamp: GraphQLTypes['Date'];
    timestamp_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
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
    password?: string | undefined;
    user_created?: GraphQLTypes['create_directus_users_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: GraphQLTypes['Date'] | undefined;
    date_start_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: GraphQLTypes['Date'] | undefined;
    date_end_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
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
    status: string;
    trigger?: string | undefined;
    accountability?: string | undefined;
    options?: GraphQLTypes['JSON'] | undefined;
    options_func?: GraphQLTypes['count_functionsInput'] | undefined;
    operation?: GraphQLTypes['create_directus_operations_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    user_created?: GraphQLTypes['create_directus_users_input'] | undefined;
    operations?:
      | Array<GraphQLTypes['create_directus_operations_input'] | undefined>
      | undefined;
    operations_func?: GraphQLTypes['count_functionsInput'] | undefined;
  };
  ['create_directus_operations_input']: {
    id?: string | undefined;
    name?: string | undefined;
    key: string;
    type: string;
    position_x: number;
    position_y: number;
    options?: GraphQLTypes['JSON'] | undefined;
    options_func?: GraphQLTypes['count_functionsInput'] | undefined;
    resolve?: GraphQLTypes['create_directus_operations_input'] | undefined;
    reject?: GraphQLTypes['create_directus_operations_input'] | undefined;
    flow?: GraphQLTypes['create_directus_flows_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    user_created?: GraphQLTypes['create_directus_users_input'] | undefined;
  };
  ['update_directus_permissions_input']: {
    id?: string | undefined;
    role?: GraphQLTypes['update_directus_roles_input'] | undefined;
    collection?: string | undefined;
    action?: string | undefined;
    permissions?: GraphQLTypes['JSON'] | undefined;
    permissions_func?: GraphQLTypes['count_functionsInput'] | undefined;
    validation?: GraphQLTypes['JSON'] | undefined;
    validation_func?: GraphQLTypes['count_functionsInput'] | undefined;
    presets?: GraphQLTypes['JSON'] | undefined;
    presets_func?: GraphQLTypes['count_functionsInput'] | undefined;
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
    layout_query_func?: GraphQLTypes['count_functionsInput'] | undefined;
    layout_options?: GraphQLTypes['JSON'] | undefined;
    layout_options_func?: GraphQLTypes['count_functionsInput'] | undefined;
    refresh_interval?: number | undefined;
    filter?: GraphQLTypes['JSON'] | undefined;
    filter_func?: GraphQLTypes['count_functionsInput'] | undefined;
    icon?: string | undefined;
    color?: string | undefined;
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
    headers_func?: GraphQLTypes['count_functionsInput'] | undefined;
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
    storage_asset_presets_func?:
      | GraphQLTypes['count_functionsInput']
      | undefined;
    custom_css?: string | undefined;
    storage_default_folder?:
      | GraphQLTypes['update_directus_folders_input']
      | undefined;
    basemaps?: GraphQLTypes['JSON'] | undefined;
    basemaps_func?: GraphQLTypes['count_functionsInput'] | undefined;
    mapbox_key?: string | undefined;
    module_bar?: GraphQLTypes['JSON'] | undefined;
    module_bar_func?: GraphQLTypes['count_functionsInput'] | undefined;
    project_descriptor?: string | undefined;
    translation_strings?: GraphQLTypes['JSON'] | undefined;
    translation_strings_func?: GraphQLTypes['count_functionsInput'] | undefined;
    default_language?: string | undefined;
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
    options_func?: GraphQLTypes['count_functionsInput'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    user_created?: GraphQLTypes['update_directus_users_input'] | undefined;
  };
  ['update_directus_dashboards_input']: {
    id?: string | undefined;
    name?: string | undefined;
    icon?: string | undefined;
    note?: string | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    user_created?: GraphQLTypes['update_directus_users_input'] | undefined;
    color?: string | undefined;
    panels?:
      | Array<GraphQLTypes['update_directus_panels_input'] | undefined>
      | undefined;
    panels_func?: GraphQLTypes['count_functionsInput'] | undefined;
  };
  ['update_directus_notifications_input']: {
    id?: string | undefined;
    timestamp?: GraphQLTypes['Date'] | undefined;
    timestamp_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
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
    password?: string | undefined;
    user_created?: GraphQLTypes['update_directus_users_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_start?: GraphQLTypes['Date'] | undefined;
    date_start_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    /** $t:shared_leave_blank_for_unlimited */
    date_end?: GraphQLTypes['Date'] | undefined;
    date_end_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
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
    options_func?: GraphQLTypes['count_functionsInput'] | undefined;
    operation?: GraphQLTypes['update_directus_operations_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    user_created?: GraphQLTypes['update_directus_users_input'] | undefined;
    operations?:
      | Array<GraphQLTypes['update_directus_operations_input'] | undefined>
      | undefined;
    operations_func?: GraphQLTypes['count_functionsInput'] | undefined;
  };
  ['update_directus_operations_input']: {
    id?: string | undefined;
    name?: string | undefined;
    key?: string | undefined;
    type?: string | undefined;
    position_x?: number | undefined;
    position_y?: number | undefined;
    options?: GraphQLTypes['JSON'] | undefined;
    options_func?: GraphQLTypes['count_functionsInput'] | undefined;
    resolve?: GraphQLTypes['update_directus_operations_input'] | undefined;
    reject?: GraphQLTypes['update_directus_operations_input'] | undefined;
    flow?: GraphQLTypes['update_directus_flows_input'] | undefined;
    date_created?: GraphQLTypes['Date'] | undefined;
    date_created_func?: GraphQLTypes['datetime_functionsInput'] | undefined;
    user_created?: GraphQLTypes['update_directus_users_input'] | undefined;
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
