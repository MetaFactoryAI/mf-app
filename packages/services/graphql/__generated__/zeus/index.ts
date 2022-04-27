/* eslint-disable */

import { AllTypesProps, ReturnTypes } from './const';
type ZEUS_INTERFACES = never;
type ZEUS_UNIONS = never;

export type ValueTypes = {
  /** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
  ['Int_comparison_exp']: {
    _eq?: number | null;
    _gt?: number | null;
    _gte?: number | null;
    _in?: number[];
    _is_null?: boolean | null;
    _lt?: number | null;
    _lte?: number | null;
    _neq?: number | null;
    _nin?: number[];
  };
  /** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
  ['String_comparison_exp']: {
    _eq?: string | null;
    _gt?: string | null;
    _gte?: string | null;
    /** does the column match the given case-insensitive pattern */
    _ilike?: string | null;
    _in?: string[];
    /** does the column match the given POSIX regular expression, case insensitive */
    _iregex?: string | null;
    _is_null?: boolean | null;
    /** does the column match the given pattern */
    _like?: string | null;
    _lt?: string | null;
    _lte?: string | null;
    _neq?: string | null;
    /** does the column NOT match the given case-insensitive pattern */
    _nilike?: string | null;
    _nin?: string[];
    /** does the column NOT match the given POSIX regular expression, case insensitive */
    _niregex?: string | null;
    /** does the column NOT match the given pattern */
    _nlike?: string | null;
    /** does the column NOT match the given POSIX regular expression, case sensitive */
    _nregex?: string | null;
    /** does the column NOT match the given SQL regular expression */
    _nsimilar?: string | null;
    /** does the column match the given POSIX regular expression, case sensitive */
    _regex?: string | null;
    /** does the column match the given SQL regular expression */
    _similar?: string | null;
  };
  /** columns and relationships of "contribution_votes" */
  ['contribution_votes']: AliasType<{
    /** An object relationship */
    contribution?: ValueTypes['contributions'];
    contribution_id?: boolean;
    rating?: boolean;
    /** An object relationship */
    user?: ValueTypes['users'];
    user_id?: boolean;
    __typename?: boolean;
  }>;
  /** aggregated selection of "contribution_votes" */
  ['contribution_votes_aggregate']: AliasType<{
    aggregate?: ValueTypes['contribution_votes_aggregate_fields'];
    nodes?: ValueTypes['contribution_votes'];
    __typename?: boolean;
  }>;
  /** aggregate fields of "contribution_votes" */
  ['contribution_votes_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?: ValueTypes['contribution_votes_select_column'][];
        distinct?: boolean | null;
      },
      boolean,
    ];
    max?: ValueTypes['contribution_votes_max_fields'];
    min?: ValueTypes['contribution_votes_min_fields'];
    __typename?: boolean;
  }>;
  /** order by aggregate values of table "contribution_votes" */
  ['contribution_votes_aggregate_order_by']: {
    count?: ValueTypes['order_by'] | null;
    max?: ValueTypes['contribution_votes_max_order_by'] | null;
    min?: ValueTypes['contribution_votes_min_order_by'] | null;
  };
  /** input type for inserting array relation for remote table "contribution_votes" */
  ['contribution_votes_arr_rel_insert_input']: {
    data: ValueTypes['contribution_votes_insert_input'][];
    /** upsert condition */
    on_conflict?: ValueTypes['contribution_votes_on_conflict'] | null;
  };
  /** Boolean expression to filter rows from the table "contribution_votes". All fields are combined with a logical 'AND'. */
  ['contribution_votes_bool_exp']: {
    _and?: ValueTypes['contribution_votes_bool_exp'][];
    _not?: ValueTypes['contribution_votes_bool_exp'] | null;
    _or?: ValueTypes['contribution_votes_bool_exp'][];
    contribution?: ValueTypes['contributions_bool_exp'] | null;
    contribution_id?: ValueTypes['uuid_comparison_exp'] | null;
    rating?: ValueTypes['String_comparison_exp'] | null;
    user?: ValueTypes['users_bool_exp'] | null;
    user_id?: ValueTypes['uuid_comparison_exp'] | null;
  };
  /** unique or primary key constraints on table "contribution_votes" */
  ['contribution_votes_constraint']: contribution_votes_constraint;
  /** input type for inserting data into table "contribution_votes" */
  ['contribution_votes_insert_input']: {
    contribution?: ValueTypes['contributions_obj_rel_insert_input'] | null;
    contribution_id?: ValueTypes['uuid'] | null;
    rating?: string | null;
    user?: ValueTypes['users_obj_rel_insert_input'] | null;
    user_id?: ValueTypes['uuid'] | null;
  };
  /** aggregate max on columns */
  ['contribution_votes_max_fields']: AliasType<{
    contribution_id?: boolean;
    rating?: boolean;
    user_id?: boolean;
    __typename?: boolean;
  }>;
  /** order by max() on columns of table "contribution_votes" */
  ['contribution_votes_max_order_by']: {
    contribution_id?: ValueTypes['order_by'] | null;
    rating?: ValueTypes['order_by'] | null;
    user_id?: ValueTypes['order_by'] | null;
  };
  /** aggregate min on columns */
  ['contribution_votes_min_fields']: AliasType<{
    contribution_id?: boolean;
    rating?: boolean;
    user_id?: boolean;
    __typename?: boolean;
  }>;
  /** order by min() on columns of table "contribution_votes" */
  ['contribution_votes_min_order_by']: {
    contribution_id?: ValueTypes['order_by'] | null;
    rating?: ValueTypes['order_by'] | null;
    user_id?: ValueTypes['order_by'] | null;
  };
  /** response of any mutation on the table "contribution_votes" */
  ['contribution_votes_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['contribution_votes'];
    __typename?: boolean;
  }>;
  /** on_conflict condition type for table "contribution_votes" */
  ['contribution_votes_on_conflict']: {
    constraint: ValueTypes['contribution_votes_constraint'];
    update_columns: ValueTypes['contribution_votes_update_column'][];
    where?: ValueTypes['contribution_votes_bool_exp'] | null;
  };
  /** Ordering options when selecting data from "contribution_votes". */
  ['contribution_votes_order_by']: {
    contribution?: ValueTypes['contributions_order_by'] | null;
    contribution_id?: ValueTypes['order_by'] | null;
    rating?: ValueTypes['order_by'] | null;
    user?: ValueTypes['users_order_by'] | null;
    user_id?: ValueTypes['order_by'] | null;
  };
  /** primary key columns input for table: contribution_votes */
  ['contribution_votes_pk_columns_input']: {
    contribution_id: ValueTypes['uuid'];
    user_id: ValueTypes['uuid'];
  };
  /** select columns of table "contribution_votes" */
  ['contribution_votes_select_column']: contribution_votes_select_column;
  /** input type for updating data in table "contribution_votes" */
  ['contribution_votes_set_input']: {
    contribution_id?: ValueTypes['uuid'] | null;
    rating?: string | null;
    user_id?: ValueTypes['uuid'] | null;
  };
  /** update columns of table "contribution_votes" */
  ['contribution_votes_update_column']: contribution_votes_update_column;
  /** columns and relationships of "contributions" */
  ['contributions']: AliasType<{
    artifact?: boolean;
    /** An object relationship */
    author?: ValueTypes['users'];
    category?: boolean;
    contributors?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contributors_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contributors_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contributors_bool_exp'] | null;
      },
      ValueTypes['contributors'],
    ];
    contributors_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contributors_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contributors_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contributors_bool_exp'] | null;
      },
      ValueTypes['contributors_aggregate'],
    ];
    created_at?: boolean;
    created_by?: boolean;
    date?: boolean;
    description?: boolean;
    effort?: boolean;
    id?: boolean;
    impact?: boolean;
    title?: boolean;
    votes?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contribution_votes_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contribution_votes_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contribution_votes_bool_exp'] | null;
      },
      ValueTypes['contribution_votes'],
    ];
    votes_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contribution_votes_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contribution_votes_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contribution_votes_bool_exp'] | null;
      },
      ValueTypes['contribution_votes_aggregate'],
    ];
    weight?: boolean;
    __typename?: boolean;
  }>;
  /** aggregated selection of "contributions" */
  ['contributions_aggregate']: AliasType<{
    aggregate?: ValueTypes['contributions_aggregate_fields'];
    nodes?: ValueTypes['contributions'];
    __typename?: boolean;
  }>;
  /** aggregate fields of "contributions" */
  ['contributions_aggregate_fields']: AliasType<{
    avg?: ValueTypes['contributions_avg_fields'];
    count?: [
      {
        columns?: ValueTypes['contributions_select_column'][];
        distinct?: boolean | null;
      },
      boolean,
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
    __typename?: boolean;
  }>;
  /** aggregate avg on columns */
  ['contributions_avg_fields']: AliasType<{
    weight?: boolean;
    __typename?: boolean;
  }>;
  /** Boolean expression to filter rows from the table "contributions". All fields are combined with a logical 'AND'. */
  ['contributions_bool_exp']: {
    _and?: ValueTypes['contributions_bool_exp'][];
    _not?: ValueTypes['contributions_bool_exp'] | null;
    _or?: ValueTypes['contributions_bool_exp'][];
    artifact?: ValueTypes['String_comparison_exp'] | null;
    author?: ValueTypes['users_bool_exp'] | null;
    category?: ValueTypes['String_comparison_exp'] | null;
    contributors?: ValueTypes['contributors_bool_exp'] | null;
    created_at?: ValueTypes['timestamptz_comparison_exp'] | null;
    created_by?: ValueTypes['uuid_comparison_exp'] | null;
    date?: ValueTypes['date_comparison_exp'] | null;
    description?: ValueTypes['String_comparison_exp'] | null;
    effort?: ValueTypes['String_comparison_exp'] | null;
    id?: ValueTypes['uuid_comparison_exp'] | null;
    impact?: ValueTypes['String_comparison_exp'] | null;
    title?: ValueTypes['String_comparison_exp'] | null;
    votes?: ValueTypes['contribution_votes_bool_exp'] | null;
    weight?: ValueTypes['Int_comparison_exp'] | null;
  };
  /** unique or primary key constraints on table "contributions" */
  ['contributions_constraint']: contributions_constraint;
  /** input type for incrementing numeric columns in table "contributions" */
  ['contributions_inc_input']: {
    weight?: number | null;
  };
  /** input type for inserting data into table "contributions" */
  ['contributions_insert_input']: {
    artifact?: string | null;
    author?: ValueTypes['users_obj_rel_insert_input'] | null;
    category?: string | null;
    contributors?: ValueTypes['contributors_arr_rel_insert_input'] | null;
    created_at?: ValueTypes['timestamptz'] | null;
    created_by?: ValueTypes['uuid'] | null;
    date?: ValueTypes['date'] | null;
    description?: string | null;
    effort?: string | null;
    id?: ValueTypes['uuid'] | null;
    impact?: string | null;
    title?: string | null;
    votes?: ValueTypes['contribution_votes_arr_rel_insert_input'] | null;
    weight?: number | null;
  };
  /** aggregate max on columns */
  ['contributions_max_fields']: AliasType<{
    artifact?: boolean;
    category?: boolean;
    created_at?: boolean;
    created_by?: boolean;
    date?: boolean;
    description?: boolean;
    effort?: boolean;
    id?: boolean;
    impact?: boolean;
    title?: boolean;
    weight?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate min on columns */
  ['contributions_min_fields']: AliasType<{
    artifact?: boolean;
    category?: boolean;
    created_at?: boolean;
    created_by?: boolean;
    date?: boolean;
    description?: boolean;
    effort?: boolean;
    id?: boolean;
    impact?: boolean;
    title?: boolean;
    weight?: boolean;
    __typename?: boolean;
  }>;
  /** response of any mutation on the table "contributions" */
  ['contributions_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['contributions'];
    __typename?: boolean;
  }>;
  /** input type for inserting object relation for remote table "contributions" */
  ['contributions_obj_rel_insert_input']: {
    data: ValueTypes['contributions_insert_input'];
    /** upsert condition */
    on_conflict?: ValueTypes['contributions_on_conflict'] | null;
  };
  /** on_conflict condition type for table "contributions" */
  ['contributions_on_conflict']: {
    constraint: ValueTypes['contributions_constraint'];
    update_columns: ValueTypes['contributions_update_column'][];
    where?: ValueTypes['contributions_bool_exp'] | null;
  };
  /** Ordering options when selecting data from "contributions". */
  ['contributions_order_by']: {
    artifact?: ValueTypes['order_by'] | null;
    author?: ValueTypes['users_order_by'] | null;
    category?: ValueTypes['order_by'] | null;
    contributors_aggregate?:
      | ValueTypes['contributors_aggregate_order_by']
      | null;
    created_at?: ValueTypes['order_by'] | null;
    created_by?: ValueTypes['order_by'] | null;
    date?: ValueTypes['order_by'] | null;
    description?: ValueTypes['order_by'] | null;
    effort?: ValueTypes['order_by'] | null;
    id?: ValueTypes['order_by'] | null;
    impact?: ValueTypes['order_by'] | null;
    title?: ValueTypes['order_by'] | null;
    votes_aggregate?:
      | ValueTypes['contribution_votes_aggregate_order_by']
      | null;
    weight?: ValueTypes['order_by'] | null;
  };
  /** primary key columns input for table: contributions */
  ['contributions_pk_columns_input']: {
    id: ValueTypes['uuid'];
  };
  /** select columns of table "contributions" */
  ['contributions_select_column']: contributions_select_column;
  /** input type for updating data in table "contributions" */
  ['contributions_set_input']: {
    artifact?: string | null;
    category?: string | null;
    created_at?: ValueTypes['timestamptz'] | null;
    created_by?: ValueTypes['uuid'] | null;
    date?: ValueTypes['date'] | null;
    description?: string | null;
    effort?: string | null;
    id?: ValueTypes['uuid'] | null;
    impact?: string | null;
    title?: string | null;
    weight?: number | null;
  };
  /** aggregate stddev on columns */
  ['contributions_stddev_fields']: AliasType<{
    weight?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate stddev_pop on columns */
  ['contributions_stddev_pop_fields']: AliasType<{
    weight?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate stddev_samp on columns */
  ['contributions_stddev_samp_fields']: AliasType<{
    weight?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate sum on columns */
  ['contributions_sum_fields']: AliasType<{
    weight?: boolean;
    __typename?: boolean;
  }>;
  /** update columns of table "contributions" */
  ['contributions_update_column']: contributions_update_column;
  /** aggregate var_pop on columns */
  ['contributions_var_pop_fields']: AliasType<{
    weight?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate var_samp on columns */
  ['contributions_var_samp_fields']: AliasType<{
    weight?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate variance on columns */
  ['contributions_variance_fields']: AliasType<{
    weight?: boolean;
    __typename?: boolean;
  }>;
  /** columns and relationships of "contributors" */
  ['contributors']: AliasType<{
    /** An object relationship */
    contribution?: ValueTypes['contributions'];
    contribution_id?: boolean;
    contribution_share?: boolean;
    /** An object relationship */
    user?: ValueTypes['users'];
    user_id?: boolean;
    __typename?: boolean;
  }>;
  /** aggregated selection of "contributors" */
  ['contributors_aggregate']: AliasType<{
    aggregate?: ValueTypes['contributors_aggregate_fields'];
    nodes?: ValueTypes['contributors'];
    __typename?: boolean;
  }>;
  /** aggregate fields of "contributors" */
  ['contributors_aggregate_fields']: AliasType<{
    avg?: ValueTypes['contributors_avg_fields'];
    count?: [
      {
        columns?: ValueTypes['contributors_select_column'][];
        distinct?: boolean | null;
      },
      boolean,
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
    __typename?: boolean;
  }>;
  /** order by aggregate values of table "contributors" */
  ['contributors_aggregate_order_by']: {
    avg?: ValueTypes['contributors_avg_order_by'] | null;
    count?: ValueTypes['order_by'] | null;
    max?: ValueTypes['contributors_max_order_by'] | null;
    min?: ValueTypes['contributors_min_order_by'] | null;
    stddev?: ValueTypes['contributors_stddev_order_by'] | null;
    stddev_pop?: ValueTypes['contributors_stddev_pop_order_by'] | null;
    stddev_samp?: ValueTypes['contributors_stddev_samp_order_by'] | null;
    sum?: ValueTypes['contributors_sum_order_by'] | null;
    var_pop?: ValueTypes['contributors_var_pop_order_by'] | null;
    var_samp?: ValueTypes['contributors_var_samp_order_by'] | null;
    variance?: ValueTypes['contributors_variance_order_by'] | null;
  };
  /** input type for inserting array relation for remote table "contributors" */
  ['contributors_arr_rel_insert_input']: {
    data: ValueTypes['contributors_insert_input'][];
    /** upsert condition */
    on_conflict?: ValueTypes['contributors_on_conflict'] | null;
  };
  /** aggregate avg on columns */
  ['contributors_avg_fields']: AliasType<{
    contribution_share?: boolean;
    __typename?: boolean;
  }>;
  /** order by avg() on columns of table "contributors" */
  ['contributors_avg_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
  };
  /** Boolean expression to filter rows from the table "contributors". All fields are combined with a logical 'AND'. */
  ['contributors_bool_exp']: {
    _and?: ValueTypes['contributors_bool_exp'][];
    _not?: ValueTypes['contributors_bool_exp'] | null;
    _or?: ValueTypes['contributors_bool_exp'][];
    contribution?: ValueTypes['contributions_bool_exp'] | null;
    contribution_id?: ValueTypes['uuid_comparison_exp'] | null;
    contribution_share?: ValueTypes['numeric_comparison_exp'] | null;
    user?: ValueTypes['users_bool_exp'] | null;
    user_id?: ValueTypes['uuid_comparison_exp'] | null;
  };
  /** unique or primary key constraints on table "contributors" */
  ['contributors_constraint']: contributors_constraint;
  /** input type for incrementing numeric columns in table "contributors" */
  ['contributors_inc_input']: {
    contribution_share?: ValueTypes['numeric'] | null;
  };
  /** input type for inserting data into table "contributors" */
  ['contributors_insert_input']: {
    contribution?: ValueTypes['contributions_obj_rel_insert_input'] | null;
    contribution_id?: ValueTypes['uuid'] | null;
    contribution_share?: ValueTypes['numeric'] | null;
    user?: ValueTypes['users_obj_rel_insert_input'] | null;
    user_id?: ValueTypes['uuid'] | null;
  };
  /** aggregate max on columns */
  ['contributors_max_fields']: AliasType<{
    contribution_id?: boolean;
    contribution_share?: boolean;
    user_id?: boolean;
    __typename?: boolean;
  }>;
  /** order by max() on columns of table "contributors" */
  ['contributors_max_order_by']: {
    contribution_id?: ValueTypes['order_by'] | null;
    contribution_share?: ValueTypes['order_by'] | null;
    user_id?: ValueTypes['order_by'] | null;
  };
  /** aggregate min on columns */
  ['contributors_min_fields']: AliasType<{
    contribution_id?: boolean;
    contribution_share?: boolean;
    user_id?: boolean;
    __typename?: boolean;
  }>;
  /** order by min() on columns of table "contributors" */
  ['contributors_min_order_by']: {
    contribution_id?: ValueTypes['order_by'] | null;
    contribution_share?: ValueTypes['order_by'] | null;
    user_id?: ValueTypes['order_by'] | null;
  };
  /** response of any mutation on the table "contributors" */
  ['contributors_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['contributors'];
    __typename?: boolean;
  }>;
  /** on_conflict condition type for table "contributors" */
  ['contributors_on_conflict']: {
    constraint: ValueTypes['contributors_constraint'];
    update_columns: ValueTypes['contributors_update_column'][];
    where?: ValueTypes['contributors_bool_exp'] | null;
  };
  /** Ordering options when selecting data from "contributors". */
  ['contributors_order_by']: {
    contribution?: ValueTypes['contributions_order_by'] | null;
    contribution_id?: ValueTypes['order_by'] | null;
    contribution_share?: ValueTypes['order_by'] | null;
    user?: ValueTypes['users_order_by'] | null;
    user_id?: ValueTypes['order_by'] | null;
  };
  /** primary key columns input for table: contributors */
  ['contributors_pk_columns_input']: {
    contribution_id: ValueTypes['uuid'];
    user_id: ValueTypes['uuid'];
  };
  /** select columns of table "contributors" */
  ['contributors_select_column']: contributors_select_column;
  /** input type for updating data in table "contributors" */
  ['contributors_set_input']: {
    contribution_id?: ValueTypes['uuid'] | null;
    contribution_share?: ValueTypes['numeric'] | null;
    user_id?: ValueTypes['uuid'] | null;
  };
  /** aggregate stddev on columns */
  ['contributors_stddev_fields']: AliasType<{
    contribution_share?: boolean;
    __typename?: boolean;
  }>;
  /** order by stddev() on columns of table "contributors" */
  ['contributors_stddev_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
  };
  /** aggregate stddev_pop on columns */
  ['contributors_stddev_pop_fields']: AliasType<{
    contribution_share?: boolean;
    __typename?: boolean;
  }>;
  /** order by stddev_pop() on columns of table "contributors" */
  ['contributors_stddev_pop_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
  };
  /** aggregate stddev_samp on columns */
  ['contributors_stddev_samp_fields']: AliasType<{
    contribution_share?: boolean;
    __typename?: boolean;
  }>;
  /** order by stddev_samp() on columns of table "contributors" */
  ['contributors_stddev_samp_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
  };
  /** aggregate sum on columns */
  ['contributors_sum_fields']: AliasType<{
    contribution_share?: boolean;
    __typename?: boolean;
  }>;
  /** order by sum() on columns of table "contributors" */
  ['contributors_sum_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
  };
  /** update columns of table "contributors" */
  ['contributors_update_column']: contributors_update_column;
  /** aggregate var_pop on columns */
  ['contributors_var_pop_fields']: AliasType<{
    contribution_share?: boolean;
    __typename?: boolean;
  }>;
  /** order by var_pop() on columns of table "contributors" */
  ['contributors_var_pop_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
  };
  /** aggregate var_samp on columns */
  ['contributors_var_samp_fields']: AliasType<{
    contribution_share?: boolean;
    __typename?: boolean;
  }>;
  /** order by var_samp() on columns of table "contributors" */
  ['contributors_var_samp_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
  };
  /** aggregate variance on columns */
  ['contributors_variance_fields']: AliasType<{
    contribution_share?: boolean;
    __typename?: boolean;
  }>;
  /** order by variance() on columns of table "contributors" */
  ['contributors_variance_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
  };
  ['date']: unknown;
  /** Boolean expression to compare columns of type "date". All fields are combined with logical 'AND'. */
  ['date_comparison_exp']: {
    _eq?: ValueTypes['date'] | null;
    _gt?: ValueTypes['date'] | null;
    _gte?: ValueTypes['date'] | null;
    _in?: ValueTypes['date'][];
    _is_null?: boolean | null;
    _lt?: ValueTypes['date'] | null;
    _lte?: ValueTypes['date'] | null;
    _neq?: ValueTypes['date'] | null;
    _nin?: ValueTypes['date'][];
  };
  ['jsonb']: unknown;
  /** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
  ['jsonb_comparison_exp']: {
    /** is the column contained in the given json value */
    _contained_in?: ValueTypes['jsonb'] | null;
    /** does the column contain the given json value at the top level */
    _contains?: ValueTypes['jsonb'] | null;
    _eq?: ValueTypes['jsonb'] | null;
    _gt?: ValueTypes['jsonb'] | null;
    _gte?: ValueTypes['jsonb'] | null;
    /** does the string exist as a top-level key in the column */
    _has_key?: string | null;
    /** do all of these strings exist as top-level keys in the column */
    _has_keys_all?: string[];
    /** do any of these strings exist as top-level keys in the column */
    _has_keys_any?: string[];
    _in?: ValueTypes['jsonb'][];
    _is_null?: boolean | null;
    _lt?: ValueTypes['jsonb'] | null;
    _lte?: ValueTypes['jsonb'] | null;
    _neq?: ValueTypes['jsonb'] | null;
    _nin?: ValueTypes['jsonb'][];
  };
  /** mutation root */
  ['mutation_root']: AliasType<{
    delete_contribution_votes?: [
      {
        /** filter the rows which have to be deleted */
        where: ValueTypes['contribution_votes_bool_exp'];
      },
      ValueTypes['contribution_votes_mutation_response'],
    ];
    delete_contribution_votes_by_pk?: [
      { contribution_id: ValueTypes['uuid']; user_id: ValueTypes['uuid'] },
      ValueTypes['contribution_votes'],
    ];
    delete_contributions?: [
      {
        /** filter the rows which have to be deleted */
        where: ValueTypes['contributions_bool_exp'];
      },
      ValueTypes['contributions_mutation_response'],
    ];
    delete_contributions_by_pk?: [
      { id: ValueTypes['uuid'] },
      ValueTypes['contributions'],
    ];
    delete_contributors?: [
      {
        /** filter the rows which have to be deleted */
        where: ValueTypes['contributors_bool_exp'];
      },
      ValueTypes['contributors_mutation_response'],
    ];
    delete_contributors_by_pk?: [
      { contribution_id: ValueTypes['uuid']; user_id: ValueTypes['uuid'] },
      ValueTypes['contributors'],
    ];
    delete_robot_order?: [
      {
        /** filter the rows which have to be deleted */
        where: ValueTypes['robot_order_bool_exp'];
      },
      ValueTypes['robot_order_mutation_response'],
    ];
    delete_robot_order_by_pk?: [
      { order_id: string },
      ValueTypes['robot_order'],
    ];
    delete_robot_product?: [
      {
        /** filter the rows which have to be deleted */
        where: ValueTypes['robot_product_bool_exp'];
      },
      ValueTypes['robot_product_mutation_response'],
    ];
    delete_robot_product_by_pk?: [{ id: string }, ValueTypes['robot_product']];
    delete_robot_product_designer?: [
      {
        /** filter the rows which have to be deleted */
        where: ValueTypes['robot_product_designer_bool_exp'];
      },
      ValueTypes['robot_product_designer_mutation_response'],
    ];
    delete_robot_product_designer_by_pk?: [
      { eth_address: string; product_id: string },
      ValueTypes['robot_product_designer'],
    ];
    delete_shop_api_users?: [
      {
        /** filter the rows which have to be deleted */
        where: ValueTypes['shop_api_users_bool_exp'];
      },
      ValueTypes['shop_api_users_mutation_response'],
    ];
    delete_shop_api_users_by_pk?: [
      { username: string },
      ValueTypes['shop_api_users'],
    ];
    delete_shop_product_locks?: [
      {
        /** filter the rows which have to be deleted */
        where: ValueTypes['shop_product_locks_bool_exp'];
      },
      ValueTypes['shop_product_locks_mutation_response'],
    ];
    delete_shop_product_locks_by_pk?: [
      { access_code: string; lock_id: string },
      ValueTypes['shop_product_locks'],
    ];
    delete_users?: [
      {
        /** filter the rows which have to be deleted */
        where: ValueTypes['users_bool_exp'];
      },
      ValueTypes['users_mutation_response'],
    ];
    delete_users_by_pk?: [{ id: ValueTypes['uuid'] }, ValueTypes['users']];
    insert_contribution_votes?: [
      {
        /** the rows to be inserted */
        objects: ValueTypes['contribution_votes_insert_input'][] /** upsert condition */;
        on_conflict?: ValueTypes['contribution_votes_on_conflict'] | null;
      },
      ValueTypes['contribution_votes_mutation_response'],
    ];
    insert_contribution_votes_one?: [
      {
        /** the row to be inserted */
        object: ValueTypes['contribution_votes_insert_input'] /** upsert condition */;
        on_conflict?: ValueTypes['contribution_votes_on_conflict'] | null;
      },
      ValueTypes['contribution_votes'],
    ];
    insert_contributions?: [
      {
        /** the rows to be inserted */
        objects: ValueTypes['contributions_insert_input'][] /** upsert condition */;
        on_conflict?: ValueTypes['contributions_on_conflict'] | null;
      },
      ValueTypes['contributions_mutation_response'],
    ];
    insert_contributions_one?: [
      {
        /** the row to be inserted */
        object: ValueTypes['contributions_insert_input'] /** upsert condition */;
        on_conflict?: ValueTypes['contributions_on_conflict'] | null;
      },
      ValueTypes['contributions'],
    ];
    insert_contributors?: [
      {
        /** the rows to be inserted */
        objects: ValueTypes['contributors_insert_input'][] /** upsert condition */;
        on_conflict?: ValueTypes['contributors_on_conflict'] | null;
      },
      ValueTypes['contributors_mutation_response'],
    ];
    insert_contributors_one?: [
      {
        /** the row to be inserted */
        object: ValueTypes['contributors_insert_input'] /** upsert condition */;
        on_conflict?: ValueTypes['contributors_on_conflict'] | null;
      },
      ValueTypes['contributors'],
    ];
    insert_robot_order?: [
      {
        /** the rows to be inserted */
        objects: ValueTypes['robot_order_insert_input'][] /** upsert condition */;
        on_conflict?: ValueTypes['robot_order_on_conflict'] | null;
      },
      ValueTypes['robot_order_mutation_response'],
    ];
    insert_robot_order_one?: [
      {
        /** the row to be inserted */
        object: ValueTypes['robot_order_insert_input'] /** upsert condition */;
        on_conflict?: ValueTypes['robot_order_on_conflict'] | null;
      },
      ValueTypes['robot_order'],
    ];
    insert_robot_product?: [
      {
        /** the rows to be inserted */
        objects: ValueTypes['robot_product_insert_input'][] /** upsert condition */;
        on_conflict?: ValueTypes['robot_product_on_conflict'] | null;
      },
      ValueTypes['robot_product_mutation_response'],
    ];
    insert_robot_product_designer?: [
      {
        /** the rows to be inserted */
        objects: ValueTypes['robot_product_designer_insert_input'][] /** upsert condition */;
        on_conflict?: ValueTypes['robot_product_designer_on_conflict'] | null;
      },
      ValueTypes['robot_product_designer_mutation_response'],
    ];
    insert_robot_product_designer_one?: [
      {
        /** the row to be inserted */
        object: ValueTypes['robot_product_designer_insert_input'] /** upsert condition */;
        on_conflict?: ValueTypes['robot_product_designer_on_conflict'] | null;
      },
      ValueTypes['robot_product_designer'],
    ];
    insert_robot_product_one?: [
      {
        /** the row to be inserted */
        object: ValueTypes['robot_product_insert_input'] /** upsert condition */;
        on_conflict?: ValueTypes['robot_product_on_conflict'] | null;
      },
      ValueTypes['robot_product'],
    ];
    insert_shop_api_users?: [
      {
        /** the rows to be inserted */
        objects: ValueTypes['shop_api_users_insert_input'][] /** upsert condition */;
        on_conflict?: ValueTypes['shop_api_users_on_conflict'] | null;
      },
      ValueTypes['shop_api_users_mutation_response'],
    ];
    insert_shop_api_users_one?: [
      {
        /** the row to be inserted */
        object: ValueTypes['shop_api_users_insert_input'] /** upsert condition */;
        on_conflict?: ValueTypes['shop_api_users_on_conflict'] | null;
      },
      ValueTypes['shop_api_users'],
    ];
    insert_shop_product_locks?: [
      {
        /** the rows to be inserted */
        objects: ValueTypes['shop_product_locks_insert_input'][] /** upsert condition */;
        on_conflict?: ValueTypes['shop_product_locks_on_conflict'] | null;
      },
      ValueTypes['shop_product_locks_mutation_response'],
    ];
    insert_shop_product_locks_one?: [
      {
        /** the row to be inserted */
        object: ValueTypes['shop_product_locks_insert_input'] /** upsert condition */;
        on_conflict?: ValueTypes['shop_product_locks_on_conflict'] | null;
      },
      ValueTypes['shop_product_locks'],
    ];
    insert_users?: [
      {
        /** the rows to be inserted */
        objects: ValueTypes['users_insert_input'][] /** upsert condition */;
        on_conflict?: ValueTypes['users_on_conflict'] | null;
      },
      ValueTypes['users_mutation_response'],
    ];
    insert_users_one?: [
      {
        /** the row to be inserted */
        object: ValueTypes['users_insert_input'] /** upsert condition */;
        on_conflict?: ValueTypes['users_on_conflict'] | null;
      },
      ValueTypes['users'],
    ];
    update_contribution_votes?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ValueTypes['contribution_votes_set_input']
          | null /** filter the rows which have to be updated */;
        where: ValueTypes['contribution_votes_bool_exp'];
      },
      ValueTypes['contribution_votes_mutation_response'],
    ];
    update_contribution_votes_by_pk?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?: ValueTypes['contribution_votes_set_input'] | null;
        pk_columns: ValueTypes['contribution_votes_pk_columns_input'];
      },
      ValueTypes['contribution_votes'],
    ];
    update_contributions?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['contributions_inc_input']
          | null /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['contributions_set_input']
          | null /** filter the rows which have to be updated */;
        where: ValueTypes['contributions_bool_exp'];
      },
      ValueTypes['contributions_mutation_response'],
    ];
    update_contributions_by_pk?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['contributions_inc_input']
          | null /** sets the columns of the filtered rows to the given values */;
        _set?: ValueTypes['contributions_set_input'] | null;
        pk_columns: ValueTypes['contributions_pk_columns_input'];
      },
      ValueTypes['contributions'],
    ];
    update_contributors?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['contributors_inc_input']
          | null /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['contributors_set_input']
          | null /** filter the rows which have to be updated */;
        where: ValueTypes['contributors_bool_exp'];
      },
      ValueTypes['contributors_mutation_response'],
    ];
    update_contributors_by_pk?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['contributors_inc_input']
          | null /** sets the columns of the filtered rows to the given values */;
        _set?: ValueTypes['contributors_set_input'] | null;
        pk_columns: ValueTypes['contributors_pk_columns_input'];
      },
      ValueTypes['contributors'],
    ];
    update_robot_order?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['robot_order_inc_input']
          | null /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['robot_order_set_input']
          | null /** filter the rows which have to be updated */;
        where: ValueTypes['robot_order_bool_exp'];
      },
      ValueTypes['robot_order_mutation_response'],
    ];
    update_robot_order_by_pk?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['robot_order_inc_input']
          | null /** sets the columns of the filtered rows to the given values */;
        _set?: ValueTypes['robot_order_set_input'] | null;
        pk_columns: ValueTypes['robot_order_pk_columns_input'];
      },
      ValueTypes['robot_order'],
    ];
    update_robot_product?: [
      {
        /** append existing jsonb value of filtered columns with new jsonb value */
        _append?:
          | ValueTypes['robot_product_append_input']
          | null /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */;
        _delete_at_path?:
          | ValueTypes['robot_product_delete_at_path_input']
          | null /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */;
        _delete_elem?:
          | ValueTypes['robot_product_delete_elem_input']
          | null /** delete key/value pair or string element. key/value pairs are matched based on their key value */;
        _delete_key?:
          | ValueTypes['robot_product_delete_key_input']
          | null /** prepend existing jsonb value of filtered columns with new jsonb value */;
        _prepend?:
          | ValueTypes['robot_product_prepend_input']
          | null /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['robot_product_set_input']
          | null /** filter the rows which have to be updated */;
        where: ValueTypes['robot_product_bool_exp'];
      },
      ValueTypes['robot_product_mutation_response'],
    ];
    update_robot_product_by_pk?: [
      {
        /** append existing jsonb value of filtered columns with new jsonb value */
        _append?:
          | ValueTypes['robot_product_append_input']
          | null /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */;
        _delete_at_path?:
          | ValueTypes['robot_product_delete_at_path_input']
          | null /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */;
        _delete_elem?:
          | ValueTypes['robot_product_delete_elem_input']
          | null /** delete key/value pair or string element. key/value pairs are matched based on their key value */;
        _delete_key?:
          | ValueTypes['robot_product_delete_key_input']
          | null /** prepend existing jsonb value of filtered columns with new jsonb value */;
        _prepend?:
          | ValueTypes['robot_product_prepend_input']
          | null /** sets the columns of the filtered rows to the given values */;
        _set?: ValueTypes['robot_product_set_input'] | null;
        pk_columns: ValueTypes['robot_product_pk_columns_input'];
      },
      ValueTypes['robot_product'],
    ];
    update_robot_product_designer?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['robot_product_designer_inc_input']
          | null /** sets the columns of the filtered rows to the given values */;
        _set?:
          | ValueTypes['robot_product_designer_set_input']
          | null /** filter the rows which have to be updated */;
        where: ValueTypes['robot_product_designer_bool_exp'];
      },
      ValueTypes['robot_product_designer_mutation_response'],
    ];
    update_robot_product_designer_by_pk?: [
      {
        /** increments the numeric columns with given value of the filtered values */
        _inc?:
          | ValueTypes['robot_product_designer_inc_input']
          | null /** sets the columns of the filtered rows to the given values */;
        _set?: ValueTypes['robot_product_designer_set_input'] | null;
        pk_columns: ValueTypes['robot_product_designer_pk_columns_input'];
      },
      ValueTypes['robot_product_designer'],
    ];
    update_shop_api_users?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ValueTypes['shop_api_users_set_input']
          | null /** filter the rows which have to be updated */;
        where: ValueTypes['shop_api_users_bool_exp'];
      },
      ValueTypes['shop_api_users_mutation_response'],
    ];
    update_shop_api_users_by_pk?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?: ValueTypes['shop_api_users_set_input'] | null;
        pk_columns: ValueTypes['shop_api_users_pk_columns_input'];
      },
      ValueTypes['shop_api_users'],
    ];
    update_shop_product_locks?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ValueTypes['shop_product_locks_set_input']
          | null /** filter the rows which have to be updated */;
        where: ValueTypes['shop_product_locks_bool_exp'];
      },
      ValueTypes['shop_product_locks_mutation_response'],
    ];
    update_shop_product_locks_by_pk?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?: ValueTypes['shop_product_locks_set_input'] | null;
        pk_columns: ValueTypes['shop_product_locks_pk_columns_input'];
      },
      ValueTypes['shop_product_locks'],
    ];
    update_users?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?:
          | ValueTypes['users_set_input']
          | null /** filter the rows which have to be updated */;
        where: ValueTypes['users_bool_exp'];
      },
      ValueTypes['users_mutation_response'],
    ];
    update_users_by_pk?: [
      {
        /** sets the columns of the filtered rows to the given values */
        _set?: ValueTypes['users_set_input'] | null;
        pk_columns: ValueTypes['users_pk_columns_input'];
      },
      ValueTypes['users'],
    ];
    __typename?: boolean;
  }>;
  ['numeric']: unknown;
  /** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
  ['numeric_comparison_exp']: {
    _eq?: ValueTypes['numeric'] | null;
    _gt?: ValueTypes['numeric'] | null;
    _gte?: ValueTypes['numeric'] | null;
    _in?: ValueTypes['numeric'][];
    _is_null?: boolean | null;
    _lt?: ValueTypes['numeric'] | null;
    _lte?: ValueTypes['numeric'] | null;
    _neq?: ValueTypes['numeric'] | null;
    _nin?: ValueTypes['numeric'][];
  };
  /** column ordering options */
  ['order_by']: order_by;
  ['query_root']: AliasType<{
    contribution_votes?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contribution_votes_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contribution_votes_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contribution_votes_bool_exp'] | null;
      },
      ValueTypes['contribution_votes'],
    ];
    contribution_votes_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contribution_votes_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contribution_votes_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contribution_votes_bool_exp'] | null;
      },
      ValueTypes['contribution_votes_aggregate'],
    ];
    contribution_votes_by_pk?: [
      { contribution_id: ValueTypes['uuid']; user_id: ValueTypes['uuid'] },
      ValueTypes['contribution_votes'],
    ];
    contributions?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contributions_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contributions_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contributions_bool_exp'] | null;
      },
      ValueTypes['contributions'],
    ];
    contributions_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contributions_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contributions_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contributions_bool_exp'] | null;
      },
      ValueTypes['contributions_aggregate'],
    ];
    contributions_by_pk?: [
      { id: ValueTypes['uuid'] },
      ValueTypes['contributions'],
    ];
    contributors?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contributors_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contributors_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contributors_bool_exp'] | null;
      },
      ValueTypes['contributors'],
    ];
    contributors_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contributors_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contributors_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contributors_bool_exp'] | null;
      },
      ValueTypes['contributors_aggregate'],
    ];
    contributors_by_pk?: [
      { contribution_id: ValueTypes['uuid']; user_id: ValueTypes['uuid'] },
      ValueTypes['contributors'],
    ];
    robot_order?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['robot_order_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['robot_order_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['robot_order_bool_exp'] | null;
      },
      ValueTypes['robot_order'],
    ];
    robot_order_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['robot_order_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['robot_order_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['robot_order_bool_exp'] | null;
      },
      ValueTypes['robot_order_aggregate'],
    ];
    robot_order_by_pk?: [{ order_id: string }, ValueTypes['robot_order']];
    robot_product?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['robot_product_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['robot_product_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['robot_product_bool_exp'] | null;
      },
      ValueTypes['robot_product'],
    ];
    robot_product_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['robot_product_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['robot_product_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['robot_product_bool_exp'] | null;
      },
      ValueTypes['robot_product_aggregate'],
    ];
    robot_product_by_pk?: [{ id: string }, ValueTypes['robot_product']];
    robot_product_designer?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['robot_product_designer_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['robot_product_designer_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['robot_product_designer_bool_exp'] | null;
      },
      ValueTypes['robot_product_designer'],
    ];
    robot_product_designer_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['robot_product_designer_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['robot_product_designer_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['robot_product_designer_bool_exp'] | null;
      },
      ValueTypes['robot_product_designer_aggregate'],
    ];
    robot_product_designer_by_pk?: [
      { eth_address: string; product_id: string },
      ValueTypes['robot_product_designer'],
    ];
    shop_api_users?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['shop_api_users_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['shop_api_users_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['shop_api_users_bool_exp'] | null;
      },
      ValueTypes['shop_api_users'],
    ];
    shop_api_users_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['shop_api_users_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['shop_api_users_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['shop_api_users_bool_exp'] | null;
      },
      ValueTypes['shop_api_users_aggregate'],
    ];
    shop_api_users_by_pk?: [{ username: string }, ValueTypes['shop_api_users']];
    shop_product_locks?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['shop_product_locks_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['shop_product_locks_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['shop_product_locks_bool_exp'] | null;
      },
      ValueTypes['shop_product_locks'],
    ];
    shop_product_locks_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['shop_product_locks_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['shop_product_locks_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['shop_product_locks_bool_exp'] | null;
      },
      ValueTypes['shop_product_locks_aggregate'],
    ];
    shop_product_locks_by_pk?: [
      { access_code: string; lock_id: string },
      ValueTypes['shop_product_locks'],
    ];
    users?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['users_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['users_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['users_bool_exp'] | null;
      },
      ValueTypes['users'],
    ];
    users_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['users_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['users_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['users_bool_exp'] | null;
      },
      ValueTypes['users_aggregate'],
    ];
    users_by_pk?: [{ id: ValueTypes['uuid'] }, ValueTypes['users']];
    __typename?: boolean;
  }>;
  /** Orders for ROBOT rewards


columns and relationships of "robot.order" */
  ['robot_order']: AliasType<{
    buyer_address?: boolean;
    buyer_reward?: boolean;
    date?: boolean;
    dollars_spent?: boolean;
    order_id?: boolean;
    order_number?: boolean;
    season?: boolean;
    __typename?: boolean;
  }>;
  /** aggregated selection of "robot.order" */
  ['robot_order_aggregate']: AliasType<{
    aggregate?: ValueTypes['robot_order_aggregate_fields'];
    nodes?: ValueTypes['robot_order'];
    __typename?: boolean;
  }>;
  /** aggregate fields of "robot.order" */
  ['robot_order_aggregate_fields']: AliasType<{
    avg?: ValueTypes['robot_order_avg_fields'];
    count?: [
      {
        columns?: ValueTypes['robot_order_select_column'][];
        distinct?: boolean | null;
      },
      boolean,
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
    __typename?: boolean;
  }>;
  /** aggregate avg on columns */
  ['robot_order_avg_fields']: AliasType<{
    buyer_reward?: boolean;
    dollars_spent?: boolean;
    season?: boolean;
    __typename?: boolean;
  }>;
  /** Boolean expression to filter rows from the table "robot.order". All fields are combined with a logical 'AND'. */
  ['robot_order_bool_exp']: {
    _and?: ValueTypes['robot_order_bool_exp'][];
    _not?: ValueTypes['robot_order_bool_exp'] | null;
    _or?: ValueTypes['robot_order_bool_exp'][];
    buyer_address?: ValueTypes['String_comparison_exp'] | null;
    buyer_reward?: ValueTypes['numeric_comparison_exp'] | null;
    date?: ValueTypes['date_comparison_exp'] | null;
    dollars_spent?: ValueTypes['numeric_comparison_exp'] | null;
    order_id?: ValueTypes['String_comparison_exp'] | null;
    order_number?: ValueTypes['String_comparison_exp'] | null;
    season?: ValueTypes['numeric_comparison_exp'] | null;
  };
  /** unique or primary key constraints on table "robot.order" */
  ['robot_order_constraint']: robot_order_constraint;
  /** input type for incrementing numeric columns in table "robot.order" */
  ['robot_order_inc_input']: {
    buyer_reward?: ValueTypes['numeric'] | null;
    dollars_spent?: ValueTypes['numeric'] | null;
    season?: ValueTypes['numeric'] | null;
  };
  /** input type for inserting data into table "robot.order" */
  ['robot_order_insert_input']: {
    buyer_address?: string | null;
    buyer_reward?: ValueTypes['numeric'] | null;
    date?: ValueTypes['date'] | null;
    dollars_spent?: ValueTypes['numeric'] | null;
    order_id?: string | null;
    order_number?: string | null;
    season?: ValueTypes['numeric'] | null;
  };
  /** aggregate max on columns */
  ['robot_order_max_fields']: AliasType<{
    buyer_address?: boolean;
    buyer_reward?: boolean;
    date?: boolean;
    dollars_spent?: boolean;
    order_id?: boolean;
    order_number?: boolean;
    season?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate min on columns */
  ['robot_order_min_fields']: AliasType<{
    buyer_address?: boolean;
    buyer_reward?: boolean;
    date?: boolean;
    dollars_spent?: boolean;
    order_id?: boolean;
    order_number?: boolean;
    season?: boolean;
    __typename?: boolean;
  }>;
  /** response of any mutation on the table "robot.order" */
  ['robot_order_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['robot_order'];
    __typename?: boolean;
  }>;
  /** on_conflict condition type for table "robot.order" */
  ['robot_order_on_conflict']: {
    constraint: ValueTypes['robot_order_constraint'];
    update_columns: ValueTypes['robot_order_update_column'][];
    where?: ValueTypes['robot_order_bool_exp'] | null;
  };
  /** Ordering options when selecting data from "robot.order". */
  ['robot_order_order_by']: {
    buyer_address?: ValueTypes['order_by'] | null;
    buyer_reward?: ValueTypes['order_by'] | null;
    date?: ValueTypes['order_by'] | null;
    dollars_spent?: ValueTypes['order_by'] | null;
    order_id?: ValueTypes['order_by'] | null;
    order_number?: ValueTypes['order_by'] | null;
    season?: ValueTypes['order_by'] | null;
  };
  /** primary key columns input for table: robot_order */
  ['robot_order_pk_columns_input']: {
    order_id: string;
  };
  /** select columns of table "robot.order" */
  ['robot_order_select_column']: robot_order_select_column;
  /** input type for updating data in table "robot.order" */
  ['robot_order_set_input']: {
    buyer_address?: string | null;
    buyer_reward?: ValueTypes['numeric'] | null;
    date?: ValueTypes['date'] | null;
    dollars_spent?: ValueTypes['numeric'] | null;
    order_id?: string | null;
    order_number?: string | null;
    season?: ValueTypes['numeric'] | null;
  };
  /** aggregate stddev on columns */
  ['robot_order_stddev_fields']: AliasType<{
    buyer_reward?: boolean;
    dollars_spent?: boolean;
    season?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate stddev_pop on columns */
  ['robot_order_stddev_pop_fields']: AliasType<{
    buyer_reward?: boolean;
    dollars_spent?: boolean;
    season?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate stddev_samp on columns */
  ['robot_order_stddev_samp_fields']: AliasType<{
    buyer_reward?: boolean;
    dollars_spent?: boolean;
    season?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate sum on columns */
  ['robot_order_sum_fields']: AliasType<{
    buyer_reward?: boolean;
    dollars_spent?: boolean;
    season?: boolean;
    __typename?: boolean;
  }>;
  /** update columns of table "robot.order" */
  ['robot_order_update_column']: robot_order_update_column;
  /** aggregate var_pop on columns */
  ['robot_order_var_pop_fields']: AliasType<{
    buyer_reward?: boolean;
    dollars_spent?: boolean;
    season?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate var_samp on columns */
  ['robot_order_var_samp_fields']: AliasType<{
    buyer_reward?: boolean;
    dollars_spent?: boolean;
    season?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate variance on columns */
  ['robot_order_variance_fields']: AliasType<{
    buyer_reward?: boolean;
    dollars_spent?: boolean;
    season?: boolean;
    __typename?: boolean;
  }>;
  /** Products for ROBOT designer rewards


columns and relationships of "robot.product" */
  ['robot_product']: AliasType<{
    designers?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['robot_product_designer_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['robot_product_designer_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['robot_product_designer_bool_exp'] | null;
      },
      ValueTypes['robot_product_designer'],
    ];
    designers_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['robot_product_designer_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['robot_product_designer_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['robot_product_designer_bool_exp'] | null;
      },
      ValueTypes['robot_product_designer_aggregate'],
    ];
    id?: boolean;
    nft_metadata?: [
      {
        /** JSON select path */ path?: string | null;
      },
      boolean,
    ];
    notion_id?: boolean;
    shopify_id?: boolean;
    title?: boolean;
    __typename?: boolean;
  }>;
  /** aggregated selection of "robot.product" */
  ['robot_product_aggregate']: AliasType<{
    aggregate?: ValueTypes['robot_product_aggregate_fields'];
    nodes?: ValueTypes['robot_product'];
    __typename?: boolean;
  }>;
  /** aggregate fields of "robot.product" */
  ['robot_product_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?: ValueTypes['robot_product_select_column'][];
        distinct?: boolean | null;
      },
      boolean,
    ];
    max?: ValueTypes['robot_product_max_fields'];
    min?: ValueTypes['robot_product_min_fields'];
    __typename?: boolean;
  }>;
  /** append existing jsonb value of filtered columns with new jsonb value */
  ['robot_product_append_input']: {
    nft_metadata?: ValueTypes['jsonb'] | null;
  };
  /** Boolean expression to filter rows from the table "robot.product". All fields are combined with a logical 'AND'. */
  ['robot_product_bool_exp']: {
    _and?: ValueTypes['robot_product_bool_exp'][];
    _not?: ValueTypes['robot_product_bool_exp'] | null;
    _or?: ValueTypes['robot_product_bool_exp'][];
    designers?: ValueTypes['robot_product_designer_bool_exp'] | null;
    id?: ValueTypes['String_comparison_exp'] | null;
    nft_metadata?: ValueTypes['jsonb_comparison_exp'] | null;
    notion_id?: ValueTypes['String_comparison_exp'] | null;
    shopify_id?: ValueTypes['String_comparison_exp'] | null;
    title?: ValueTypes['String_comparison_exp'] | null;
  };
  /** unique or primary key constraints on table "robot.product" */
  ['robot_product_constraint']: robot_product_constraint;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  ['robot_product_delete_at_path_input']: {
    nft_metadata?: string[];
  };
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  ['robot_product_delete_elem_input']: {
    nft_metadata?: number | null;
  };
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  ['robot_product_delete_key_input']: {
    nft_metadata?: string | null;
  };
  /** Designer receiving ROBOT rewards


columns and relationships of "robot.product_designer" */
  ['robot_product_designer']: AliasType<{
    contribution_share?: boolean;
    designer_name?: boolean;
    eth_address?: boolean;
    /** An object relationship */
    product?: ValueTypes['robot_product'];
    product_id?: boolean;
    robot_reward?: boolean;
    __typename?: boolean;
  }>;
  /** aggregated selection of "robot.product_designer" */
  ['robot_product_designer_aggregate']: AliasType<{
    aggregate?: ValueTypes['robot_product_designer_aggregate_fields'];
    nodes?: ValueTypes['robot_product_designer'];
    __typename?: boolean;
  }>;
  /** aggregate fields of "robot.product_designer" */
  ['robot_product_designer_aggregate_fields']: AliasType<{
    avg?: ValueTypes['robot_product_designer_avg_fields'];
    count?: [
      {
        columns?: ValueTypes['robot_product_designer_select_column'][];
        distinct?: boolean | null;
      },
      boolean,
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
    __typename?: boolean;
  }>;
  /** order by aggregate values of table "robot.product_designer" */
  ['robot_product_designer_aggregate_order_by']: {
    avg?: ValueTypes['robot_product_designer_avg_order_by'] | null;
    count?: ValueTypes['order_by'] | null;
    max?: ValueTypes['robot_product_designer_max_order_by'] | null;
    min?: ValueTypes['robot_product_designer_min_order_by'] | null;
    stddev?: ValueTypes['robot_product_designer_stddev_order_by'] | null;
    stddev_pop?:
      | ValueTypes['robot_product_designer_stddev_pop_order_by']
      | null;
    stddev_samp?:
      | ValueTypes['robot_product_designer_stddev_samp_order_by']
      | null;
    sum?: ValueTypes['robot_product_designer_sum_order_by'] | null;
    var_pop?: ValueTypes['robot_product_designer_var_pop_order_by'] | null;
    var_samp?: ValueTypes['robot_product_designer_var_samp_order_by'] | null;
    variance?: ValueTypes['robot_product_designer_variance_order_by'] | null;
  };
  /** input type for inserting array relation for remote table "robot.product_designer" */
  ['robot_product_designer_arr_rel_insert_input']: {
    data: ValueTypes['robot_product_designer_insert_input'][];
    /** upsert condition */
    on_conflict?: ValueTypes['robot_product_designer_on_conflict'] | null;
  };
  /** aggregate avg on columns */
  ['robot_product_designer_avg_fields']: AliasType<{
    contribution_share?: boolean;
    robot_reward?: boolean;
    __typename?: boolean;
  }>;
  /** order by avg() on columns of table "robot.product_designer" */
  ['robot_product_designer_avg_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
    robot_reward?: ValueTypes['order_by'] | null;
  };
  /** Boolean expression to filter rows from the table "robot.product_designer". All fields are combined with a logical 'AND'. */
  ['robot_product_designer_bool_exp']: {
    _and?: ValueTypes['robot_product_designer_bool_exp'][];
    _not?: ValueTypes['robot_product_designer_bool_exp'] | null;
    _or?: ValueTypes['robot_product_designer_bool_exp'][];
    contribution_share?: ValueTypes['numeric_comparison_exp'] | null;
    designer_name?: ValueTypes['String_comparison_exp'] | null;
    eth_address?: ValueTypes['String_comparison_exp'] | null;
    product?: ValueTypes['robot_product_bool_exp'] | null;
    product_id?: ValueTypes['String_comparison_exp'] | null;
    robot_reward?: ValueTypes['numeric_comparison_exp'] | null;
  };
  /** unique or primary key constraints on table "robot.product_designer" */
  ['robot_product_designer_constraint']: robot_product_designer_constraint;
  /** input type for incrementing numeric columns in table "robot.product_designer" */
  ['robot_product_designer_inc_input']: {
    contribution_share?: ValueTypes['numeric'] | null;
    robot_reward?: ValueTypes['numeric'] | null;
  };
  /** input type for inserting data into table "robot.product_designer" */
  ['robot_product_designer_insert_input']: {
    contribution_share?: ValueTypes['numeric'] | null;
    designer_name?: string | null;
    eth_address?: string | null;
    product?: ValueTypes['robot_product_obj_rel_insert_input'] | null;
    product_id?: string | null;
    robot_reward?: ValueTypes['numeric'] | null;
  };
  /** aggregate max on columns */
  ['robot_product_designer_max_fields']: AliasType<{
    contribution_share?: boolean;
    designer_name?: boolean;
    eth_address?: boolean;
    product_id?: boolean;
    robot_reward?: boolean;
    __typename?: boolean;
  }>;
  /** order by max() on columns of table "robot.product_designer" */
  ['robot_product_designer_max_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
    designer_name?: ValueTypes['order_by'] | null;
    eth_address?: ValueTypes['order_by'] | null;
    product_id?: ValueTypes['order_by'] | null;
    robot_reward?: ValueTypes['order_by'] | null;
  };
  /** aggregate min on columns */
  ['robot_product_designer_min_fields']: AliasType<{
    contribution_share?: boolean;
    designer_name?: boolean;
    eth_address?: boolean;
    product_id?: boolean;
    robot_reward?: boolean;
    __typename?: boolean;
  }>;
  /** order by min() on columns of table "robot.product_designer" */
  ['robot_product_designer_min_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
    designer_name?: ValueTypes['order_by'] | null;
    eth_address?: ValueTypes['order_by'] | null;
    product_id?: ValueTypes['order_by'] | null;
    robot_reward?: ValueTypes['order_by'] | null;
  };
  /** response of any mutation on the table "robot.product_designer" */
  ['robot_product_designer_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['robot_product_designer'];
    __typename?: boolean;
  }>;
  /** on_conflict condition type for table "robot.product_designer" */
  ['robot_product_designer_on_conflict']: {
    constraint: ValueTypes['robot_product_designer_constraint'];
    update_columns: ValueTypes['robot_product_designer_update_column'][];
    where?: ValueTypes['robot_product_designer_bool_exp'] | null;
  };
  /** Ordering options when selecting data from "robot.product_designer". */
  ['robot_product_designer_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
    designer_name?: ValueTypes['order_by'] | null;
    eth_address?: ValueTypes['order_by'] | null;
    product?: ValueTypes['robot_product_order_by'] | null;
    product_id?: ValueTypes['order_by'] | null;
    robot_reward?: ValueTypes['order_by'] | null;
  };
  /** primary key columns input for table: robot_product_designer */
  ['robot_product_designer_pk_columns_input']: {
    eth_address: string;
    product_id: string;
  };
  /** select columns of table "robot.product_designer" */
  ['robot_product_designer_select_column']: robot_product_designer_select_column;
  /** input type for updating data in table "robot.product_designer" */
  ['robot_product_designer_set_input']: {
    contribution_share?: ValueTypes['numeric'] | null;
    designer_name?: string | null;
    eth_address?: string | null;
    product_id?: string | null;
    robot_reward?: ValueTypes['numeric'] | null;
  };
  /** aggregate stddev on columns */
  ['robot_product_designer_stddev_fields']: AliasType<{
    contribution_share?: boolean;
    robot_reward?: boolean;
    __typename?: boolean;
  }>;
  /** order by stddev() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
    robot_reward?: ValueTypes['order_by'] | null;
  };
  /** aggregate stddev_pop on columns */
  ['robot_product_designer_stddev_pop_fields']: AliasType<{
    contribution_share?: boolean;
    robot_reward?: boolean;
    __typename?: boolean;
  }>;
  /** order by stddev_pop() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_pop_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
    robot_reward?: ValueTypes['order_by'] | null;
  };
  /** aggregate stddev_samp on columns */
  ['robot_product_designer_stddev_samp_fields']: AliasType<{
    contribution_share?: boolean;
    robot_reward?: boolean;
    __typename?: boolean;
  }>;
  /** order by stddev_samp() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_samp_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
    robot_reward?: ValueTypes['order_by'] | null;
  };
  /** aggregate sum on columns */
  ['robot_product_designer_sum_fields']: AliasType<{
    contribution_share?: boolean;
    robot_reward?: boolean;
    __typename?: boolean;
  }>;
  /** order by sum() on columns of table "robot.product_designer" */
  ['robot_product_designer_sum_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
    robot_reward?: ValueTypes['order_by'] | null;
  };
  /** update columns of table "robot.product_designer" */
  ['robot_product_designer_update_column']: robot_product_designer_update_column;
  /** aggregate var_pop on columns */
  ['robot_product_designer_var_pop_fields']: AliasType<{
    contribution_share?: boolean;
    robot_reward?: boolean;
    __typename?: boolean;
  }>;
  /** order by var_pop() on columns of table "robot.product_designer" */
  ['robot_product_designer_var_pop_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
    robot_reward?: ValueTypes['order_by'] | null;
  };
  /** aggregate var_samp on columns */
  ['robot_product_designer_var_samp_fields']: AliasType<{
    contribution_share?: boolean;
    robot_reward?: boolean;
    __typename?: boolean;
  }>;
  /** order by var_samp() on columns of table "robot.product_designer" */
  ['robot_product_designer_var_samp_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
    robot_reward?: ValueTypes['order_by'] | null;
  };
  /** aggregate variance on columns */
  ['robot_product_designer_variance_fields']: AliasType<{
    contribution_share?: boolean;
    robot_reward?: boolean;
    __typename?: boolean;
  }>;
  /** order by variance() on columns of table "robot.product_designer" */
  ['robot_product_designer_variance_order_by']: {
    contribution_share?: ValueTypes['order_by'] | null;
    robot_reward?: ValueTypes['order_by'] | null;
  };
  /** input type for inserting data into table "robot.product" */
  ['robot_product_insert_input']: {
    designers?:
      | ValueTypes['robot_product_designer_arr_rel_insert_input']
      | null;
    id?: string | null;
    nft_metadata?: ValueTypes['jsonb'] | null;
    notion_id?: string | null;
    shopify_id?: string | null;
    title?: string | null;
  };
  /** aggregate max on columns */
  ['robot_product_max_fields']: AliasType<{
    id?: boolean;
    notion_id?: boolean;
    shopify_id?: boolean;
    title?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate min on columns */
  ['robot_product_min_fields']: AliasType<{
    id?: boolean;
    notion_id?: boolean;
    shopify_id?: boolean;
    title?: boolean;
    __typename?: boolean;
  }>;
  /** response of any mutation on the table "robot.product" */
  ['robot_product_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['robot_product'];
    __typename?: boolean;
  }>;
  /** input type for inserting object relation for remote table "robot.product" */
  ['robot_product_obj_rel_insert_input']: {
    data: ValueTypes['robot_product_insert_input'];
    /** upsert condition */
    on_conflict?: ValueTypes['robot_product_on_conflict'] | null;
  };
  /** on_conflict condition type for table "robot.product" */
  ['robot_product_on_conflict']: {
    constraint: ValueTypes['robot_product_constraint'];
    update_columns: ValueTypes['robot_product_update_column'][];
    where?: ValueTypes['robot_product_bool_exp'] | null;
  };
  /** Ordering options when selecting data from "robot.product". */
  ['robot_product_order_by']: {
    designers_aggregate?:
      | ValueTypes['robot_product_designer_aggregate_order_by']
      | null;
    id?: ValueTypes['order_by'] | null;
    nft_metadata?: ValueTypes['order_by'] | null;
    notion_id?: ValueTypes['order_by'] | null;
    shopify_id?: ValueTypes['order_by'] | null;
    title?: ValueTypes['order_by'] | null;
  };
  /** primary key columns input for table: robot_product */
  ['robot_product_pk_columns_input']: {
    id: string;
  };
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  ['robot_product_prepend_input']: {
    nft_metadata?: ValueTypes['jsonb'] | null;
  };
  /** select columns of table "robot.product" */
  ['robot_product_select_column']: robot_product_select_column;
  /** input type for updating data in table "robot.product" */
  ['robot_product_set_input']: {
    id?: string | null;
    nft_metadata?: ValueTypes['jsonb'] | null;
    notion_id?: string | null;
    shopify_id?: string | null;
    title?: string | null;
  };
  /** update columns of table "robot.product" */
  ['robot_product_update_column']: robot_product_update_column;
  /** columns and relationships of "shop.api_users" */
  ['shop_api_users']: AliasType<{
    password_hash?: boolean;
    username?: boolean;
    __typename?: boolean;
  }>;
  /** aggregated selection of "shop.api_users" */
  ['shop_api_users_aggregate']: AliasType<{
    aggregate?: ValueTypes['shop_api_users_aggregate_fields'];
    nodes?: ValueTypes['shop_api_users'];
    __typename?: boolean;
  }>;
  /** aggregate fields of "shop.api_users" */
  ['shop_api_users_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?: ValueTypes['shop_api_users_select_column'][];
        distinct?: boolean | null;
      },
      boolean,
    ];
    max?: ValueTypes['shop_api_users_max_fields'];
    min?: ValueTypes['shop_api_users_min_fields'];
    __typename?: boolean;
  }>;
  /** Boolean expression to filter rows from the table "shop.api_users". All fields are combined with a logical 'AND'. */
  ['shop_api_users_bool_exp']: {
    _and?: ValueTypes['shop_api_users_bool_exp'][];
    _not?: ValueTypes['shop_api_users_bool_exp'] | null;
    _or?: ValueTypes['shop_api_users_bool_exp'][];
    password_hash?: ValueTypes['String_comparison_exp'] | null;
    username?: ValueTypes['String_comparison_exp'] | null;
  };
  /** unique or primary key constraints on table "shop.api_users" */
  ['shop_api_users_constraint']: shop_api_users_constraint;
  /** input type for inserting data into table "shop.api_users" */
  ['shop_api_users_insert_input']: {
    password_hash?: string | null;
    username?: string | null;
  };
  /** aggregate max on columns */
  ['shop_api_users_max_fields']: AliasType<{
    password_hash?: boolean;
    username?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate min on columns */
  ['shop_api_users_min_fields']: AliasType<{
    password_hash?: boolean;
    username?: boolean;
    __typename?: boolean;
  }>;
  /** response of any mutation on the table "shop.api_users" */
  ['shop_api_users_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['shop_api_users'];
    __typename?: boolean;
  }>;
  /** on_conflict condition type for table "shop.api_users" */
  ['shop_api_users_on_conflict']: {
    constraint: ValueTypes['shop_api_users_constraint'];
    update_columns: ValueTypes['shop_api_users_update_column'][];
    where?: ValueTypes['shop_api_users_bool_exp'] | null;
  };
  /** Ordering options when selecting data from "shop.api_users". */
  ['shop_api_users_order_by']: {
    password_hash?: ValueTypes['order_by'] | null;
    username?: ValueTypes['order_by'] | null;
  };
  /** primary key columns input for table: shop_api_users */
  ['shop_api_users_pk_columns_input']: {
    username: string;
  };
  /** select columns of table "shop.api_users" */
  ['shop_api_users_select_column']: shop_api_users_select_column;
  /** input type for updating data in table "shop.api_users" */
  ['shop_api_users_set_input']: {
    password_hash?: string | null;
    username?: string | null;
  };
  /** update columns of table "shop.api_users" */
  ['shop_api_users_update_column']: shop_api_users_update_column;
  /** columns and relationships of "shop.product_locks" */
  ['shop_product_locks']: AliasType<{
    access_code?: boolean;
    created_at?: boolean;
    customer_eth_address?: boolean;
    lock_id?: boolean;
    __typename?: boolean;
  }>;
  /** aggregated selection of "shop.product_locks" */
  ['shop_product_locks_aggregate']: AliasType<{
    aggregate?: ValueTypes['shop_product_locks_aggregate_fields'];
    nodes?: ValueTypes['shop_product_locks'];
    __typename?: boolean;
  }>;
  /** aggregate fields of "shop.product_locks" */
  ['shop_product_locks_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?: ValueTypes['shop_product_locks_select_column'][];
        distinct?: boolean | null;
      },
      boolean,
    ];
    max?: ValueTypes['shop_product_locks_max_fields'];
    min?: ValueTypes['shop_product_locks_min_fields'];
    __typename?: boolean;
  }>;
  /** Boolean expression to filter rows from the table "shop.product_locks". All fields are combined with a logical 'AND'. */
  ['shop_product_locks_bool_exp']: {
    _and?: ValueTypes['shop_product_locks_bool_exp'][];
    _not?: ValueTypes['shop_product_locks_bool_exp'] | null;
    _or?: ValueTypes['shop_product_locks_bool_exp'][];
    access_code?: ValueTypes['String_comparison_exp'] | null;
    created_at?: ValueTypes['timestamptz_comparison_exp'] | null;
    customer_eth_address?: ValueTypes['String_comparison_exp'] | null;
    lock_id?: ValueTypes['String_comparison_exp'] | null;
  };
  /** unique or primary key constraints on table "shop.product_locks" */
  ['shop_product_locks_constraint']: shop_product_locks_constraint;
  /** input type for inserting data into table "shop.product_locks" */
  ['shop_product_locks_insert_input']: {
    access_code?: string | null;
    created_at?: ValueTypes['timestamptz'] | null;
    customer_eth_address?: string | null;
    lock_id?: string | null;
  };
  /** aggregate max on columns */
  ['shop_product_locks_max_fields']: AliasType<{
    access_code?: boolean;
    created_at?: boolean;
    customer_eth_address?: boolean;
    lock_id?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate min on columns */
  ['shop_product_locks_min_fields']: AliasType<{
    access_code?: boolean;
    created_at?: boolean;
    customer_eth_address?: boolean;
    lock_id?: boolean;
    __typename?: boolean;
  }>;
  /** response of any mutation on the table "shop.product_locks" */
  ['shop_product_locks_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['shop_product_locks'];
    __typename?: boolean;
  }>;
  /** on_conflict condition type for table "shop.product_locks" */
  ['shop_product_locks_on_conflict']: {
    constraint: ValueTypes['shop_product_locks_constraint'];
    update_columns: ValueTypes['shop_product_locks_update_column'][];
    where?: ValueTypes['shop_product_locks_bool_exp'] | null;
  };
  /** Ordering options when selecting data from "shop.product_locks". */
  ['shop_product_locks_order_by']: {
    access_code?: ValueTypes['order_by'] | null;
    created_at?: ValueTypes['order_by'] | null;
    customer_eth_address?: ValueTypes['order_by'] | null;
    lock_id?: ValueTypes['order_by'] | null;
  };
  /** primary key columns input for table: shop_product_locks */
  ['shop_product_locks_pk_columns_input']: {
    access_code: string;
    lock_id: string;
  };
  /** select columns of table "shop.product_locks" */
  ['shop_product_locks_select_column']: shop_product_locks_select_column;
  /** input type for updating data in table "shop.product_locks" */
  ['shop_product_locks_set_input']: {
    access_code?: string | null;
    created_at?: ValueTypes['timestamptz'] | null;
    customer_eth_address?: string | null;
    lock_id?: string | null;
  };
  /** update columns of table "shop.product_locks" */
  ['shop_product_locks_update_column']: shop_product_locks_update_column;
  ['subscription_root']: AliasType<{
    contribution_votes?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contribution_votes_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contribution_votes_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contribution_votes_bool_exp'] | null;
      },
      ValueTypes['contribution_votes'],
    ];
    contribution_votes_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contribution_votes_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contribution_votes_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contribution_votes_bool_exp'] | null;
      },
      ValueTypes['contribution_votes_aggregate'],
    ];
    contribution_votes_by_pk?: [
      { contribution_id: ValueTypes['uuid']; user_id: ValueTypes['uuid'] },
      ValueTypes['contribution_votes'],
    ];
    contributions?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contributions_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contributions_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contributions_bool_exp'] | null;
      },
      ValueTypes['contributions'],
    ];
    contributions_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contributions_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contributions_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contributions_bool_exp'] | null;
      },
      ValueTypes['contributions_aggregate'],
    ];
    contributions_by_pk?: [
      { id: ValueTypes['uuid'] },
      ValueTypes['contributions'],
    ];
    contributors?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contributors_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contributors_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contributors_bool_exp'] | null;
      },
      ValueTypes['contributors'],
    ];
    contributors_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['contributors_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['contributors_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['contributors_bool_exp'] | null;
      },
      ValueTypes['contributors_aggregate'],
    ];
    contributors_by_pk?: [
      { contribution_id: ValueTypes['uuid']; user_id: ValueTypes['uuid'] },
      ValueTypes['contributors'],
    ];
    robot_order?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['robot_order_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['robot_order_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['robot_order_bool_exp'] | null;
      },
      ValueTypes['robot_order'],
    ];
    robot_order_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['robot_order_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['robot_order_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['robot_order_bool_exp'] | null;
      },
      ValueTypes['robot_order_aggregate'],
    ];
    robot_order_by_pk?: [{ order_id: string }, ValueTypes['robot_order']];
    robot_product?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['robot_product_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['robot_product_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['robot_product_bool_exp'] | null;
      },
      ValueTypes['robot_product'],
    ];
    robot_product_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['robot_product_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['robot_product_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['robot_product_bool_exp'] | null;
      },
      ValueTypes['robot_product_aggregate'],
    ];
    robot_product_by_pk?: [{ id: string }, ValueTypes['robot_product']];
    robot_product_designer?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['robot_product_designer_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['robot_product_designer_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['robot_product_designer_bool_exp'] | null;
      },
      ValueTypes['robot_product_designer'],
    ];
    robot_product_designer_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['robot_product_designer_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['robot_product_designer_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['robot_product_designer_bool_exp'] | null;
      },
      ValueTypes['robot_product_designer_aggregate'],
    ];
    robot_product_designer_by_pk?: [
      { eth_address: string; product_id: string },
      ValueTypes['robot_product_designer'],
    ];
    shop_api_users?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['shop_api_users_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['shop_api_users_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['shop_api_users_bool_exp'] | null;
      },
      ValueTypes['shop_api_users'],
    ];
    shop_api_users_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['shop_api_users_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['shop_api_users_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['shop_api_users_bool_exp'] | null;
      },
      ValueTypes['shop_api_users_aggregate'],
    ];
    shop_api_users_by_pk?: [{ username: string }, ValueTypes['shop_api_users']];
    shop_product_locks?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['shop_product_locks_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['shop_product_locks_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['shop_product_locks_bool_exp'] | null;
      },
      ValueTypes['shop_product_locks'],
    ];
    shop_product_locks_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['shop_product_locks_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['shop_product_locks_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['shop_product_locks_bool_exp'] | null;
      },
      ValueTypes['shop_product_locks_aggregate'],
    ];
    shop_product_locks_by_pk?: [
      { access_code: string; lock_id: string },
      ValueTypes['shop_product_locks'],
    ];
    users?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['users_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['users_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['users_bool_exp'] | null;
      },
      ValueTypes['users'],
    ];
    users_aggregate?: [
      {
        /** distinct select on columns */
        distinct_on?: ValueTypes['users_select_column'][] /** limit the number of rows returned */;
        limit?:
          | number
          | null /** skip the first n rows. Use only with order_by */;
        offset?: number | null /** sort the rows by one or more columns */;
        order_by?: ValueTypes['users_order_by'][] /** filter the rows returned */;
        where?: ValueTypes['users_bool_exp'] | null;
      },
      ValueTypes['users_aggregate'],
    ];
    users_by_pk?: [{ id: ValueTypes['uuid'] }, ValueTypes['users']];
    __typename?: boolean;
  }>;
  ['timestamptz']: unknown;
  /** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
  ['timestamptz_comparison_exp']: {
    _eq?: ValueTypes['timestamptz'] | null;
    _gt?: ValueTypes['timestamptz'] | null;
    _gte?: ValueTypes['timestamptz'] | null;
    _in?: ValueTypes['timestamptz'][];
    _is_null?: boolean | null;
    _lt?: ValueTypes['timestamptz'] | null;
    _lte?: ValueTypes['timestamptz'] | null;
    _neq?: ValueTypes['timestamptz'] | null;
    _nin?: ValueTypes['timestamptz'][];
  };
  /** columns and relationships of "users" */
  ['users']: AliasType<{
    eth_address?: boolean;
    id?: boolean;
    name?: boolean;
    __typename?: boolean;
  }>;
  /** aggregated selection of "users" */
  ['users_aggregate']: AliasType<{
    aggregate?: ValueTypes['users_aggregate_fields'];
    nodes?: ValueTypes['users'];
    __typename?: boolean;
  }>;
  /** aggregate fields of "users" */
  ['users_aggregate_fields']: AliasType<{
    count?: [
      {
        columns?: ValueTypes['users_select_column'][];
        distinct?: boolean | null;
      },
      boolean,
    ];
    max?: ValueTypes['users_max_fields'];
    min?: ValueTypes['users_min_fields'];
    __typename?: boolean;
  }>;
  /** Boolean expression to filter rows from the table "users". All fields are combined with a logical 'AND'. */
  ['users_bool_exp']: {
    _and?: ValueTypes['users_bool_exp'][];
    _not?: ValueTypes['users_bool_exp'] | null;
    _or?: ValueTypes['users_bool_exp'][];
    eth_address?: ValueTypes['String_comparison_exp'] | null;
    id?: ValueTypes['uuid_comparison_exp'] | null;
    name?: ValueTypes['String_comparison_exp'] | null;
  };
  /** unique or primary key constraints on table "users" */
  ['users_constraint']: users_constraint;
  /** input type for inserting data into table "users" */
  ['users_insert_input']: {
    eth_address?: string | null;
    id?: ValueTypes['uuid'] | null;
    name?: string | null;
  };
  /** aggregate max on columns */
  ['users_max_fields']: AliasType<{
    eth_address?: boolean;
    id?: boolean;
    name?: boolean;
    __typename?: boolean;
  }>;
  /** aggregate min on columns */
  ['users_min_fields']: AliasType<{
    eth_address?: boolean;
    id?: boolean;
    name?: boolean;
    __typename?: boolean;
  }>;
  /** response of any mutation on the table "users" */
  ['users_mutation_response']: AliasType<{
    /** number of rows affected by the mutation */
    affected_rows?: boolean;
    /** data from the rows affected by the mutation */
    returning?: ValueTypes['users'];
    __typename?: boolean;
  }>;
  /** input type for inserting object relation for remote table "users" */
  ['users_obj_rel_insert_input']: {
    data: ValueTypes['users_insert_input'];
    /** upsert condition */
    on_conflict?: ValueTypes['users_on_conflict'] | null;
  };
  /** on_conflict condition type for table "users" */
  ['users_on_conflict']: {
    constraint: ValueTypes['users_constraint'];
    update_columns: ValueTypes['users_update_column'][];
    where?: ValueTypes['users_bool_exp'] | null;
  };
  /** Ordering options when selecting data from "users". */
  ['users_order_by']: {
    eth_address?: ValueTypes['order_by'] | null;
    id?: ValueTypes['order_by'] | null;
    name?: ValueTypes['order_by'] | null;
  };
  /** primary key columns input for table: users */
  ['users_pk_columns_input']: {
    id: ValueTypes['uuid'];
  };
  /** select columns of table "users" */
  ['users_select_column']: users_select_column;
  /** input type for updating data in table "users" */
  ['users_set_input']: {
    eth_address?: string | null;
    id?: ValueTypes['uuid'] | null;
    name?: string | null;
  };
  /** update columns of table "users" */
  ['users_update_column']: users_update_column;
  ['uuid']: unknown;
  /** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
  ['uuid_comparison_exp']: {
    _eq?: ValueTypes['uuid'] | null;
    _gt?: ValueTypes['uuid'] | null;
    _gte?: ValueTypes['uuid'] | null;
    _in?: ValueTypes['uuid'][];
    _is_null?: boolean | null;
    _lt?: ValueTypes['uuid'] | null;
    _lte?: ValueTypes['uuid'] | null;
    _neq?: ValueTypes['uuid'] | null;
    _nin?: ValueTypes['uuid'][];
  };
};

export type ModelTypes = {
  /** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
  ['Int_comparison_exp']: GraphQLTypes['Int_comparison_exp'];
  /** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
  ['String_comparison_exp']: GraphQLTypes['String_comparison_exp'];
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
    aggregate?: ModelTypes['contribution_votes_aggregate_fields'];
    nodes: ModelTypes['contribution_votes'][];
  };
  /** aggregate fields of "contribution_votes" */
  ['contribution_votes_aggregate_fields']: {
    count: number;
    max?: ModelTypes['contribution_votes_max_fields'];
    min?: ModelTypes['contribution_votes_min_fields'];
  };
  /** order by aggregate values of table "contribution_votes" */
  ['contribution_votes_aggregate_order_by']: GraphQLTypes['contribution_votes_aggregate_order_by'];
  /** input type for inserting array relation for remote table "contribution_votes" */
  ['contribution_votes_arr_rel_insert_input']: GraphQLTypes['contribution_votes_arr_rel_insert_input'];
  /** Boolean expression to filter rows from the table "contribution_votes". All fields are combined with a logical 'AND'. */
  ['contribution_votes_bool_exp']: GraphQLTypes['contribution_votes_bool_exp'];
  /** unique or primary key constraints on table "contribution_votes" */
  ['contribution_votes_constraint']: GraphQLTypes['contribution_votes_constraint'];
  /** input type for inserting data into table "contribution_votes" */
  ['contribution_votes_insert_input']: GraphQLTypes['contribution_votes_insert_input'];
  /** aggregate max on columns */
  ['contribution_votes_max_fields']: {
    contribution_id?: ModelTypes['uuid'];
    rating?: string;
    user_id?: ModelTypes['uuid'];
  };
  /** order by max() on columns of table "contribution_votes" */
  ['contribution_votes_max_order_by']: GraphQLTypes['contribution_votes_max_order_by'];
  /** aggregate min on columns */
  ['contribution_votes_min_fields']: {
    contribution_id?: ModelTypes['uuid'];
    rating?: string;
    user_id?: ModelTypes['uuid'];
  };
  /** order by min() on columns of table "contribution_votes" */
  ['contribution_votes_min_order_by']: GraphQLTypes['contribution_votes_min_order_by'];
  /** response of any mutation on the table "contribution_votes" */
  ['contribution_votes_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: ModelTypes['contribution_votes'][];
  };
  /** on_conflict condition type for table "contribution_votes" */
  ['contribution_votes_on_conflict']: GraphQLTypes['contribution_votes_on_conflict'];
  /** Ordering options when selecting data from "contribution_votes". */
  ['contribution_votes_order_by']: GraphQLTypes['contribution_votes_order_by'];
  /** primary key columns input for table: contribution_votes */
  ['contribution_votes_pk_columns_input']: GraphQLTypes['contribution_votes_pk_columns_input'];
  /** select columns of table "contribution_votes" */
  ['contribution_votes_select_column']: GraphQLTypes['contribution_votes_select_column'];
  /** input type for updating data in table "contribution_votes" */
  ['contribution_votes_set_input']: GraphQLTypes['contribution_votes_set_input'];
  /** update columns of table "contribution_votes" */
  ['contribution_votes_update_column']: GraphQLTypes['contribution_votes_update_column'];
  /** columns and relationships of "contributions" */
  ['contributions']: {
    artifact?: string;
    /** An object relationship */
    author: ModelTypes['users'];
    category?: string;
    /** fetch data from the table: "contributors" */
    contributors: ModelTypes['contributors'][];
    /** An aggregate relationship */
    contributors_aggregate: ModelTypes['contributors_aggregate'];
    created_at: ModelTypes['timestamptz'];
    created_by: ModelTypes['uuid'];
    date: ModelTypes['date'];
    description?: string;
    effort?: string;
    id: ModelTypes['uuid'];
    impact?: string;
    title: string;
    /** An array relationship */
    votes: ModelTypes['contribution_votes'][];
    /** An aggregate relationship */
    votes_aggregate: ModelTypes['contribution_votes_aggregate'];
    weight?: number;
  };
  /** aggregated selection of "contributions" */
  ['contributions_aggregate']: {
    aggregate?: ModelTypes['contributions_aggregate_fields'];
    nodes: ModelTypes['contributions'][];
  };
  /** aggregate fields of "contributions" */
  ['contributions_aggregate_fields']: {
    avg?: ModelTypes['contributions_avg_fields'];
    count: number;
    max?: ModelTypes['contributions_max_fields'];
    min?: ModelTypes['contributions_min_fields'];
    stddev?: ModelTypes['contributions_stddev_fields'];
    stddev_pop?: ModelTypes['contributions_stddev_pop_fields'];
    stddev_samp?: ModelTypes['contributions_stddev_samp_fields'];
    sum?: ModelTypes['contributions_sum_fields'];
    var_pop?: ModelTypes['contributions_var_pop_fields'];
    var_samp?: ModelTypes['contributions_var_samp_fields'];
    variance?: ModelTypes['contributions_variance_fields'];
  };
  /** aggregate avg on columns */
  ['contributions_avg_fields']: {
    weight?: number;
  };
  /** Boolean expression to filter rows from the table "contributions". All fields are combined with a logical 'AND'. */
  ['contributions_bool_exp']: GraphQLTypes['contributions_bool_exp'];
  /** unique or primary key constraints on table "contributions" */
  ['contributions_constraint']: GraphQLTypes['contributions_constraint'];
  /** input type for incrementing numeric columns in table "contributions" */
  ['contributions_inc_input']: GraphQLTypes['contributions_inc_input'];
  /** input type for inserting data into table "contributions" */
  ['contributions_insert_input']: GraphQLTypes['contributions_insert_input'];
  /** aggregate max on columns */
  ['contributions_max_fields']: {
    artifact?: string;
    category?: string;
    created_at?: ModelTypes['timestamptz'];
    created_by?: ModelTypes['uuid'];
    date?: ModelTypes['date'];
    description?: string;
    effort?: string;
    id?: ModelTypes['uuid'];
    impact?: string;
    title?: string;
    weight?: number;
  };
  /** aggregate min on columns */
  ['contributions_min_fields']: {
    artifact?: string;
    category?: string;
    created_at?: ModelTypes['timestamptz'];
    created_by?: ModelTypes['uuid'];
    date?: ModelTypes['date'];
    description?: string;
    effort?: string;
    id?: ModelTypes['uuid'];
    impact?: string;
    title?: string;
    weight?: number;
  };
  /** response of any mutation on the table "contributions" */
  ['contributions_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: ModelTypes['contributions'][];
  };
  /** input type for inserting object relation for remote table "contributions" */
  ['contributions_obj_rel_insert_input']: GraphQLTypes['contributions_obj_rel_insert_input'];
  /** on_conflict condition type for table "contributions" */
  ['contributions_on_conflict']: GraphQLTypes['contributions_on_conflict'];
  /** Ordering options when selecting data from "contributions". */
  ['contributions_order_by']: GraphQLTypes['contributions_order_by'];
  /** primary key columns input for table: contributions */
  ['contributions_pk_columns_input']: GraphQLTypes['contributions_pk_columns_input'];
  /** select columns of table "contributions" */
  ['contributions_select_column']: GraphQLTypes['contributions_select_column'];
  /** input type for updating data in table "contributions" */
  ['contributions_set_input']: GraphQLTypes['contributions_set_input'];
  /** aggregate stddev on columns */
  ['contributions_stddev_fields']: {
    weight?: number;
  };
  /** aggregate stddev_pop on columns */
  ['contributions_stddev_pop_fields']: {
    weight?: number;
  };
  /** aggregate stddev_samp on columns */
  ['contributions_stddev_samp_fields']: {
    weight?: number;
  };
  /** aggregate sum on columns */
  ['contributions_sum_fields']: {
    weight?: number;
  };
  /** update columns of table "contributions" */
  ['contributions_update_column']: GraphQLTypes['contributions_update_column'];
  /** aggregate var_pop on columns */
  ['contributions_var_pop_fields']: {
    weight?: number;
  };
  /** aggregate var_samp on columns */
  ['contributions_var_samp_fields']: {
    weight?: number;
  };
  /** aggregate variance on columns */
  ['contributions_variance_fields']: {
    weight?: number;
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
    aggregate?: ModelTypes['contributors_aggregate_fields'];
    nodes: ModelTypes['contributors'][];
  };
  /** aggregate fields of "contributors" */
  ['contributors_aggregate_fields']: {
    avg?: ModelTypes['contributors_avg_fields'];
    count: number;
    max?: ModelTypes['contributors_max_fields'];
    min?: ModelTypes['contributors_min_fields'];
    stddev?: ModelTypes['contributors_stddev_fields'];
    stddev_pop?: ModelTypes['contributors_stddev_pop_fields'];
    stddev_samp?: ModelTypes['contributors_stddev_samp_fields'];
    sum?: ModelTypes['contributors_sum_fields'];
    var_pop?: ModelTypes['contributors_var_pop_fields'];
    var_samp?: ModelTypes['contributors_var_samp_fields'];
    variance?: ModelTypes['contributors_variance_fields'];
  };
  /** order by aggregate values of table "contributors" */
  ['contributors_aggregate_order_by']: GraphQLTypes['contributors_aggregate_order_by'];
  /** input type for inserting array relation for remote table "contributors" */
  ['contributors_arr_rel_insert_input']: GraphQLTypes['contributors_arr_rel_insert_input'];
  /** aggregate avg on columns */
  ['contributors_avg_fields']: {
    contribution_share?: number;
  };
  /** order by avg() on columns of table "contributors" */
  ['contributors_avg_order_by']: GraphQLTypes['contributors_avg_order_by'];
  /** Boolean expression to filter rows from the table "contributors". All fields are combined with a logical 'AND'. */
  ['contributors_bool_exp']: GraphQLTypes['contributors_bool_exp'];
  /** unique or primary key constraints on table "contributors" */
  ['contributors_constraint']: GraphQLTypes['contributors_constraint'];
  /** input type for incrementing numeric columns in table "contributors" */
  ['contributors_inc_input']: GraphQLTypes['contributors_inc_input'];
  /** input type for inserting data into table "contributors" */
  ['contributors_insert_input']: GraphQLTypes['contributors_insert_input'];
  /** aggregate max on columns */
  ['contributors_max_fields']: {
    contribution_id?: ModelTypes['uuid'];
    contribution_share?: ModelTypes['numeric'];
    user_id?: ModelTypes['uuid'];
  };
  /** order by max() on columns of table "contributors" */
  ['contributors_max_order_by']: GraphQLTypes['contributors_max_order_by'];
  /** aggregate min on columns */
  ['contributors_min_fields']: {
    contribution_id?: ModelTypes['uuid'];
    contribution_share?: ModelTypes['numeric'];
    user_id?: ModelTypes['uuid'];
  };
  /** order by min() on columns of table "contributors" */
  ['contributors_min_order_by']: GraphQLTypes['contributors_min_order_by'];
  /** response of any mutation on the table "contributors" */
  ['contributors_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: ModelTypes['contributors'][];
  };
  /** on_conflict condition type for table "contributors" */
  ['contributors_on_conflict']: GraphQLTypes['contributors_on_conflict'];
  /** Ordering options when selecting data from "contributors". */
  ['contributors_order_by']: GraphQLTypes['contributors_order_by'];
  /** primary key columns input for table: contributors */
  ['contributors_pk_columns_input']: GraphQLTypes['contributors_pk_columns_input'];
  /** select columns of table "contributors" */
  ['contributors_select_column']: GraphQLTypes['contributors_select_column'];
  /** input type for updating data in table "contributors" */
  ['contributors_set_input']: GraphQLTypes['contributors_set_input'];
  /** aggregate stddev on columns */
  ['contributors_stddev_fields']: {
    contribution_share?: number;
  };
  /** order by stddev() on columns of table "contributors" */
  ['contributors_stddev_order_by']: GraphQLTypes['contributors_stddev_order_by'];
  /** aggregate stddev_pop on columns */
  ['contributors_stddev_pop_fields']: {
    contribution_share?: number;
  };
  /** order by stddev_pop() on columns of table "contributors" */
  ['contributors_stddev_pop_order_by']: GraphQLTypes['contributors_stddev_pop_order_by'];
  /** aggregate stddev_samp on columns */
  ['contributors_stddev_samp_fields']: {
    contribution_share?: number;
  };
  /** order by stddev_samp() on columns of table "contributors" */
  ['contributors_stddev_samp_order_by']: GraphQLTypes['contributors_stddev_samp_order_by'];
  /** aggregate sum on columns */
  ['contributors_sum_fields']: {
    contribution_share?: ModelTypes['numeric'];
  };
  /** order by sum() on columns of table "contributors" */
  ['contributors_sum_order_by']: GraphQLTypes['contributors_sum_order_by'];
  /** update columns of table "contributors" */
  ['contributors_update_column']: GraphQLTypes['contributors_update_column'];
  /** aggregate var_pop on columns */
  ['contributors_var_pop_fields']: {
    contribution_share?: number;
  };
  /** order by var_pop() on columns of table "contributors" */
  ['contributors_var_pop_order_by']: GraphQLTypes['contributors_var_pop_order_by'];
  /** aggregate var_samp on columns */
  ['contributors_var_samp_fields']: {
    contribution_share?: number;
  };
  /** order by var_samp() on columns of table "contributors" */
  ['contributors_var_samp_order_by']: GraphQLTypes['contributors_var_samp_order_by'];
  /** aggregate variance on columns */
  ['contributors_variance_fields']: {
    contribution_share?: number;
  };
  /** order by variance() on columns of table "contributors" */
  ['contributors_variance_order_by']: GraphQLTypes['contributors_variance_order_by'];
  ['date']: any;
  /** Boolean expression to compare columns of type "date". All fields are combined with logical 'AND'. */
  ['date_comparison_exp']: GraphQLTypes['date_comparison_exp'];
  ['jsonb']: any;
  /** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
  ['jsonb_comparison_exp']: GraphQLTypes['jsonb_comparison_exp'];
  /** mutation root */
  ['mutation_root']: {
    /** delete data from the table: "contribution_votes" */
    delete_contribution_votes?: ModelTypes['contribution_votes_mutation_response'];
    /** delete single row from the table: "contribution_votes" */
    delete_contribution_votes_by_pk?: ModelTypes['contribution_votes'];
    /** delete data from the table: "contributions" */
    delete_contributions?: ModelTypes['contributions_mutation_response'];
    /** delete single row from the table: "contributions" */
    delete_contributions_by_pk?: ModelTypes['contributions'];
    /** delete data from the table: "contributors" */
    delete_contributors?: ModelTypes['contributors_mutation_response'];
    /** delete single row from the table: "contributors" */
    delete_contributors_by_pk?: ModelTypes['contributors'];
    /** delete data from the table: "robot.order" */
    delete_robot_order?: ModelTypes['robot_order_mutation_response'];
    /** delete single row from the table: "robot.order" */
    delete_robot_order_by_pk?: ModelTypes['robot_order'];
    /** delete data from the table: "robot.product" */
    delete_robot_product?: ModelTypes['robot_product_mutation_response'];
    /** delete single row from the table: "robot.product" */
    delete_robot_product_by_pk?: ModelTypes['robot_product'];
    /** delete data from the table: "robot.product_designer" */
    delete_robot_product_designer?: ModelTypes['robot_product_designer_mutation_response'];
    /** delete single row from the table: "robot.product_designer" */
    delete_robot_product_designer_by_pk?: ModelTypes['robot_product_designer'];
    /** delete data from the table: "shop.api_users" */
    delete_shop_api_users?: ModelTypes['shop_api_users_mutation_response'];
    /** delete single row from the table: "shop.api_users" */
    delete_shop_api_users_by_pk?: ModelTypes['shop_api_users'];
    /** delete data from the table: "shop.product_locks" */
    delete_shop_product_locks?: ModelTypes['shop_product_locks_mutation_response'];
    /** delete single row from the table: "shop.product_locks" */
    delete_shop_product_locks_by_pk?: ModelTypes['shop_product_locks'];
    /** delete data from the table: "users" */
    delete_users?: ModelTypes['users_mutation_response'];
    /** delete single row from the table: "users" */
    delete_users_by_pk?: ModelTypes['users'];
    /** insert data into the table: "contribution_votes" */
    insert_contribution_votes?: ModelTypes['contribution_votes_mutation_response'];
    /** insert a single row into the table: "contribution_votes" */
    insert_contribution_votes_one?: ModelTypes['contribution_votes'];
    /** insert data into the table: "contributions" */
    insert_contributions?: ModelTypes['contributions_mutation_response'];
    /** insert a single row into the table: "contributions" */
    insert_contributions_one?: ModelTypes['contributions'];
    /** insert data into the table: "contributors" */
    insert_contributors?: ModelTypes['contributors_mutation_response'];
    /** insert a single row into the table: "contributors" */
    insert_contributors_one?: ModelTypes['contributors'];
    /** insert data into the table: "robot.order" */
    insert_robot_order?: ModelTypes['robot_order_mutation_response'];
    /** insert a single row into the table: "robot.order" */
    insert_robot_order_one?: ModelTypes['robot_order'];
    /** insert data into the table: "robot.product" */
    insert_robot_product?: ModelTypes['robot_product_mutation_response'];
    /** insert data into the table: "robot.product_designer" */
    insert_robot_product_designer?: ModelTypes['robot_product_designer_mutation_response'];
    /** insert a single row into the table: "robot.product_designer" */
    insert_robot_product_designer_one?: ModelTypes['robot_product_designer'];
    /** insert a single row into the table: "robot.product" */
    insert_robot_product_one?: ModelTypes['robot_product'];
    /** insert data into the table: "shop.api_users" */
    insert_shop_api_users?: ModelTypes['shop_api_users_mutation_response'];
    /** insert a single row into the table: "shop.api_users" */
    insert_shop_api_users_one?: ModelTypes['shop_api_users'];
    /** insert data into the table: "shop.product_locks" */
    insert_shop_product_locks?: ModelTypes['shop_product_locks_mutation_response'];
    /** insert a single row into the table: "shop.product_locks" */
    insert_shop_product_locks_one?: ModelTypes['shop_product_locks'];
    /** insert data into the table: "users" */
    insert_users?: ModelTypes['users_mutation_response'];
    /** insert a single row into the table: "users" */
    insert_users_one?: ModelTypes['users'];
    /** update data of the table: "contribution_votes" */
    update_contribution_votes?: ModelTypes['contribution_votes_mutation_response'];
    /** update single row of the table: "contribution_votes" */
    update_contribution_votes_by_pk?: ModelTypes['contribution_votes'];
    /** update data of the table: "contributions" */
    update_contributions?: ModelTypes['contributions_mutation_response'];
    /** update single row of the table: "contributions" */
    update_contributions_by_pk?: ModelTypes['contributions'];
    /** update data of the table: "contributors" */
    update_contributors?: ModelTypes['contributors_mutation_response'];
    /** update single row of the table: "contributors" */
    update_contributors_by_pk?: ModelTypes['contributors'];
    /** update data of the table: "robot.order" */
    update_robot_order?: ModelTypes['robot_order_mutation_response'];
    /** update single row of the table: "robot.order" */
    update_robot_order_by_pk?: ModelTypes['robot_order'];
    /** update data of the table: "robot.product" */
    update_robot_product?: ModelTypes['robot_product_mutation_response'];
    /** update single row of the table: "robot.product" */
    update_robot_product_by_pk?: ModelTypes['robot_product'];
    /** update data of the table: "robot.product_designer" */
    update_robot_product_designer?: ModelTypes['robot_product_designer_mutation_response'];
    /** update single row of the table: "robot.product_designer" */
    update_robot_product_designer_by_pk?: ModelTypes['robot_product_designer'];
    /** update data of the table: "shop.api_users" */
    update_shop_api_users?: ModelTypes['shop_api_users_mutation_response'];
    /** update single row of the table: "shop.api_users" */
    update_shop_api_users_by_pk?: ModelTypes['shop_api_users'];
    /** update data of the table: "shop.product_locks" */
    update_shop_product_locks?: ModelTypes['shop_product_locks_mutation_response'];
    /** update single row of the table: "shop.product_locks" */
    update_shop_product_locks_by_pk?: ModelTypes['shop_product_locks'];
    /** update data of the table: "users" */
    update_users?: ModelTypes['users_mutation_response'];
    /** update single row of the table: "users" */
    update_users_by_pk?: ModelTypes['users'];
  };
  ['numeric']: any;
  /** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
  ['numeric_comparison_exp']: GraphQLTypes['numeric_comparison_exp'];
  /** column ordering options */
  ['order_by']: GraphQLTypes['order_by'];
  ['query_root']: {
    /** fetch data from the table: "contribution_votes" */
    contribution_votes: ModelTypes['contribution_votes'][];
    /** fetch aggregated fields from the table: "contribution_votes" */
    contribution_votes_aggregate: ModelTypes['contribution_votes_aggregate'];
    /** fetch data from the table: "contribution_votes" using primary key columns */
    contribution_votes_by_pk?: ModelTypes['contribution_votes'];
    /** fetch data from the table: "contributions" */
    contributions: ModelTypes['contributions'][];
    /** fetch aggregated fields from the table: "contributions" */
    contributions_aggregate: ModelTypes['contributions_aggregate'];
    /** fetch data from the table: "contributions" using primary key columns */
    contributions_by_pk?: ModelTypes['contributions'];
    /** fetch data from the table: "contributors" */
    contributors: ModelTypes['contributors'][];
    /** An aggregate relationship */
    contributors_aggregate: ModelTypes['contributors_aggregate'];
    /** fetch data from the table: "contributors" using primary key columns */
    contributors_by_pk?: ModelTypes['contributors'];
    /** fetch data from the table: "robot.order" */
    robot_order: ModelTypes['robot_order'][];
    /** fetch aggregated fields from the table: "robot.order" */
    robot_order_aggregate: ModelTypes['robot_order_aggregate'];
    /** fetch data from the table: "robot.order" using primary key columns */
    robot_order_by_pk?: ModelTypes['robot_order'];
    /** fetch data from the table: "robot.product" */
    robot_product: ModelTypes['robot_product'][];
    /** fetch aggregated fields from the table: "robot.product" */
    robot_product_aggregate: ModelTypes['robot_product_aggregate'];
    /** fetch data from the table: "robot.product" using primary key columns */
    robot_product_by_pk?: ModelTypes['robot_product'];
    /** fetch data from the table: "robot.product_designer" */
    robot_product_designer: ModelTypes['robot_product_designer'][];
    /** fetch aggregated fields from the table: "robot.product_designer" */
    robot_product_designer_aggregate: ModelTypes['robot_product_designer_aggregate'];
    /** fetch data from the table: "robot.product_designer" using primary key columns */
    robot_product_designer_by_pk?: ModelTypes['robot_product_designer'];
    /** fetch data from the table: "shop.api_users" */
    shop_api_users: ModelTypes['shop_api_users'][];
    /** fetch aggregated fields from the table: "shop.api_users" */
    shop_api_users_aggregate: ModelTypes['shop_api_users_aggregate'];
    /** fetch data from the table: "shop.api_users" using primary key columns */
    shop_api_users_by_pk?: ModelTypes['shop_api_users'];
    /** fetch data from the table: "shop.product_locks" */
    shop_product_locks: ModelTypes['shop_product_locks'][];
    /** fetch aggregated fields from the table: "shop.product_locks" */
    shop_product_locks_aggregate: ModelTypes['shop_product_locks_aggregate'];
    /** fetch data from the table: "shop.product_locks" using primary key columns */
    shop_product_locks_by_pk?: ModelTypes['shop_product_locks'];
    /** fetch data from the table: "users" */
    users: ModelTypes['users'][];
    /** fetch aggregated fields from the table: "users" */
    users_aggregate: ModelTypes['users_aggregate'];
    /** fetch data from the table: "users" using primary key columns */
    users_by_pk?: ModelTypes['users'];
  };
  /** Orders for ROBOT rewards


columns and relationships of "robot.order" */
  ['robot_order']: {
    buyer_address: string;
    buyer_reward: ModelTypes['numeric'];
    date: ModelTypes['date'];
    dollars_spent: ModelTypes['numeric'];
    order_id: string;
    order_number?: string;
    season: ModelTypes['numeric'];
  };
  /** aggregated selection of "robot.order" */
  ['robot_order_aggregate']: {
    aggregate?: ModelTypes['robot_order_aggregate_fields'];
    nodes: ModelTypes['robot_order'][];
  };
  /** aggregate fields of "robot.order" */
  ['robot_order_aggregate_fields']: {
    avg?: ModelTypes['robot_order_avg_fields'];
    count: number;
    max?: ModelTypes['robot_order_max_fields'];
    min?: ModelTypes['robot_order_min_fields'];
    stddev?: ModelTypes['robot_order_stddev_fields'];
    stddev_pop?: ModelTypes['robot_order_stddev_pop_fields'];
    stddev_samp?: ModelTypes['robot_order_stddev_samp_fields'];
    sum?: ModelTypes['robot_order_sum_fields'];
    var_pop?: ModelTypes['robot_order_var_pop_fields'];
    var_samp?: ModelTypes['robot_order_var_samp_fields'];
    variance?: ModelTypes['robot_order_variance_fields'];
  };
  /** aggregate avg on columns */
  ['robot_order_avg_fields']: {
    buyer_reward?: number;
    dollars_spent?: number;
    season?: number;
  };
  /** Boolean expression to filter rows from the table "robot.order". All fields are combined with a logical 'AND'. */
  ['robot_order_bool_exp']: GraphQLTypes['robot_order_bool_exp'];
  /** unique or primary key constraints on table "robot.order" */
  ['robot_order_constraint']: GraphQLTypes['robot_order_constraint'];
  /** input type for incrementing numeric columns in table "robot.order" */
  ['robot_order_inc_input']: GraphQLTypes['robot_order_inc_input'];
  /** input type for inserting data into table "robot.order" */
  ['robot_order_insert_input']: GraphQLTypes['robot_order_insert_input'];
  /** aggregate max on columns */
  ['robot_order_max_fields']: {
    buyer_address?: string;
    buyer_reward?: ModelTypes['numeric'];
    date?: ModelTypes['date'];
    dollars_spent?: ModelTypes['numeric'];
    order_id?: string;
    order_number?: string;
    season?: ModelTypes['numeric'];
  };
  /** aggregate min on columns */
  ['robot_order_min_fields']: {
    buyer_address?: string;
    buyer_reward?: ModelTypes['numeric'];
    date?: ModelTypes['date'];
    dollars_spent?: ModelTypes['numeric'];
    order_id?: string;
    order_number?: string;
    season?: ModelTypes['numeric'];
  };
  /** response of any mutation on the table "robot.order" */
  ['robot_order_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: ModelTypes['robot_order'][];
  };
  /** on_conflict condition type for table "robot.order" */
  ['robot_order_on_conflict']: GraphQLTypes['robot_order_on_conflict'];
  /** Ordering options when selecting data from "robot.order". */
  ['robot_order_order_by']: GraphQLTypes['robot_order_order_by'];
  /** primary key columns input for table: robot_order */
  ['robot_order_pk_columns_input']: GraphQLTypes['robot_order_pk_columns_input'];
  /** select columns of table "robot.order" */
  ['robot_order_select_column']: GraphQLTypes['robot_order_select_column'];
  /** input type for updating data in table "robot.order" */
  ['robot_order_set_input']: GraphQLTypes['robot_order_set_input'];
  /** aggregate stddev on columns */
  ['robot_order_stddev_fields']: {
    buyer_reward?: number;
    dollars_spent?: number;
    season?: number;
  };
  /** aggregate stddev_pop on columns */
  ['robot_order_stddev_pop_fields']: {
    buyer_reward?: number;
    dollars_spent?: number;
    season?: number;
  };
  /** aggregate stddev_samp on columns */
  ['robot_order_stddev_samp_fields']: {
    buyer_reward?: number;
    dollars_spent?: number;
    season?: number;
  };
  /** aggregate sum on columns */
  ['robot_order_sum_fields']: {
    buyer_reward?: ModelTypes['numeric'];
    dollars_spent?: ModelTypes['numeric'];
    season?: ModelTypes['numeric'];
  };
  /** update columns of table "robot.order" */
  ['robot_order_update_column']: GraphQLTypes['robot_order_update_column'];
  /** aggregate var_pop on columns */
  ['robot_order_var_pop_fields']: {
    buyer_reward?: number;
    dollars_spent?: number;
    season?: number;
  };
  /** aggregate var_samp on columns */
  ['robot_order_var_samp_fields']: {
    buyer_reward?: number;
    dollars_spent?: number;
    season?: number;
  };
  /** aggregate variance on columns */
  ['robot_order_variance_fields']: {
    buyer_reward?: number;
    dollars_spent?: number;
    season?: number;
  };
  /** Products for ROBOT designer rewards


columns and relationships of "robot.product" */
  ['robot_product']: {
    /** An array relationship */
    designers: ModelTypes['robot_product_designer'][];
    /** An aggregate relationship */
    designers_aggregate: ModelTypes['robot_product_designer_aggregate'];
    id: string;
    nft_metadata?: ModelTypes['jsonb'];
    notion_id?: string;
    shopify_id?: string;
    title: string;
  };
  /** aggregated selection of "robot.product" */
  ['robot_product_aggregate']: {
    aggregate?: ModelTypes['robot_product_aggregate_fields'];
    nodes: ModelTypes['robot_product'][];
  };
  /** aggregate fields of "robot.product" */
  ['robot_product_aggregate_fields']: {
    count: number;
    max?: ModelTypes['robot_product_max_fields'];
    min?: ModelTypes['robot_product_min_fields'];
  };
  /** append existing jsonb value of filtered columns with new jsonb value */
  ['robot_product_append_input']: GraphQLTypes['robot_product_append_input'];
  /** Boolean expression to filter rows from the table "robot.product". All fields are combined with a logical 'AND'. */
  ['robot_product_bool_exp']: GraphQLTypes['robot_product_bool_exp'];
  /** unique or primary key constraints on table "robot.product" */
  ['robot_product_constraint']: GraphQLTypes['robot_product_constraint'];
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  ['robot_product_delete_at_path_input']: GraphQLTypes['robot_product_delete_at_path_input'];
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  ['robot_product_delete_elem_input']: GraphQLTypes['robot_product_delete_elem_input'];
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  ['robot_product_delete_key_input']: GraphQLTypes['robot_product_delete_key_input'];
  /** Designer receiving ROBOT rewards


columns and relationships of "robot.product_designer" */
  ['robot_product_designer']: {
    contribution_share: ModelTypes['numeric'];
    designer_name?: string;
    eth_address: string;
    /** An object relationship */
    product: ModelTypes['robot_product'];
    product_id: string;
    robot_reward: ModelTypes['numeric'];
  };
  /** aggregated selection of "robot.product_designer" */
  ['robot_product_designer_aggregate']: {
    aggregate?: ModelTypes['robot_product_designer_aggregate_fields'];
    nodes: ModelTypes['robot_product_designer'][];
  };
  /** aggregate fields of "robot.product_designer" */
  ['robot_product_designer_aggregate_fields']: {
    avg?: ModelTypes['robot_product_designer_avg_fields'];
    count: number;
    max?: ModelTypes['robot_product_designer_max_fields'];
    min?: ModelTypes['robot_product_designer_min_fields'];
    stddev?: ModelTypes['robot_product_designer_stddev_fields'];
    stddev_pop?: ModelTypes['robot_product_designer_stddev_pop_fields'];
    stddev_samp?: ModelTypes['robot_product_designer_stddev_samp_fields'];
    sum?: ModelTypes['robot_product_designer_sum_fields'];
    var_pop?: ModelTypes['robot_product_designer_var_pop_fields'];
    var_samp?: ModelTypes['robot_product_designer_var_samp_fields'];
    variance?: ModelTypes['robot_product_designer_variance_fields'];
  };
  /** order by aggregate values of table "robot.product_designer" */
  ['robot_product_designer_aggregate_order_by']: GraphQLTypes['robot_product_designer_aggregate_order_by'];
  /** input type for inserting array relation for remote table "robot.product_designer" */
  ['robot_product_designer_arr_rel_insert_input']: GraphQLTypes['robot_product_designer_arr_rel_insert_input'];
  /** aggregate avg on columns */
  ['robot_product_designer_avg_fields']: {
    contribution_share?: number;
    robot_reward?: number;
  };
  /** order by avg() on columns of table "robot.product_designer" */
  ['robot_product_designer_avg_order_by']: GraphQLTypes['robot_product_designer_avg_order_by'];
  /** Boolean expression to filter rows from the table "robot.product_designer". All fields are combined with a logical 'AND'. */
  ['robot_product_designer_bool_exp']: GraphQLTypes['robot_product_designer_bool_exp'];
  /** unique or primary key constraints on table "robot.product_designer" */
  ['robot_product_designer_constraint']: GraphQLTypes['robot_product_designer_constraint'];
  /** input type for incrementing numeric columns in table "robot.product_designer" */
  ['robot_product_designer_inc_input']: GraphQLTypes['robot_product_designer_inc_input'];
  /** input type for inserting data into table "robot.product_designer" */
  ['robot_product_designer_insert_input']: GraphQLTypes['robot_product_designer_insert_input'];
  /** aggregate max on columns */
  ['robot_product_designer_max_fields']: {
    contribution_share?: ModelTypes['numeric'];
    designer_name?: string;
    eth_address?: string;
    product_id?: string;
    robot_reward?: ModelTypes['numeric'];
  };
  /** order by max() on columns of table "robot.product_designer" */
  ['robot_product_designer_max_order_by']: GraphQLTypes['robot_product_designer_max_order_by'];
  /** aggregate min on columns */
  ['robot_product_designer_min_fields']: {
    contribution_share?: ModelTypes['numeric'];
    designer_name?: string;
    eth_address?: string;
    product_id?: string;
    robot_reward?: ModelTypes['numeric'];
  };
  /** order by min() on columns of table "robot.product_designer" */
  ['robot_product_designer_min_order_by']: GraphQLTypes['robot_product_designer_min_order_by'];
  /** response of any mutation on the table "robot.product_designer" */
  ['robot_product_designer_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: ModelTypes['robot_product_designer'][];
  };
  /** on_conflict condition type for table "robot.product_designer" */
  ['robot_product_designer_on_conflict']: GraphQLTypes['robot_product_designer_on_conflict'];
  /** Ordering options when selecting data from "robot.product_designer". */
  ['robot_product_designer_order_by']: GraphQLTypes['robot_product_designer_order_by'];
  /** primary key columns input for table: robot_product_designer */
  ['robot_product_designer_pk_columns_input']: GraphQLTypes['robot_product_designer_pk_columns_input'];
  /** select columns of table "robot.product_designer" */
  ['robot_product_designer_select_column']: GraphQLTypes['robot_product_designer_select_column'];
  /** input type for updating data in table "robot.product_designer" */
  ['robot_product_designer_set_input']: GraphQLTypes['robot_product_designer_set_input'];
  /** aggregate stddev on columns */
  ['robot_product_designer_stddev_fields']: {
    contribution_share?: number;
    robot_reward?: number;
  };
  /** order by stddev() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_order_by']: GraphQLTypes['robot_product_designer_stddev_order_by'];
  /** aggregate stddev_pop on columns */
  ['robot_product_designer_stddev_pop_fields']: {
    contribution_share?: number;
    robot_reward?: number;
  };
  /** order by stddev_pop() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_pop_order_by']: GraphQLTypes['robot_product_designer_stddev_pop_order_by'];
  /** aggregate stddev_samp on columns */
  ['robot_product_designer_stddev_samp_fields']: {
    contribution_share?: number;
    robot_reward?: number;
  };
  /** order by stddev_samp() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_samp_order_by']: GraphQLTypes['robot_product_designer_stddev_samp_order_by'];
  /** aggregate sum on columns */
  ['robot_product_designer_sum_fields']: {
    contribution_share?: ModelTypes['numeric'];
    robot_reward?: ModelTypes['numeric'];
  };
  /** order by sum() on columns of table "robot.product_designer" */
  ['robot_product_designer_sum_order_by']: GraphQLTypes['robot_product_designer_sum_order_by'];
  /** update columns of table "robot.product_designer" */
  ['robot_product_designer_update_column']: GraphQLTypes['robot_product_designer_update_column'];
  /** aggregate var_pop on columns */
  ['robot_product_designer_var_pop_fields']: {
    contribution_share?: number;
    robot_reward?: number;
  };
  /** order by var_pop() on columns of table "robot.product_designer" */
  ['robot_product_designer_var_pop_order_by']: GraphQLTypes['robot_product_designer_var_pop_order_by'];
  /** aggregate var_samp on columns */
  ['robot_product_designer_var_samp_fields']: {
    contribution_share?: number;
    robot_reward?: number;
  };
  /** order by var_samp() on columns of table "robot.product_designer" */
  ['robot_product_designer_var_samp_order_by']: GraphQLTypes['robot_product_designer_var_samp_order_by'];
  /** aggregate variance on columns */
  ['robot_product_designer_variance_fields']: {
    contribution_share?: number;
    robot_reward?: number;
  };
  /** order by variance() on columns of table "robot.product_designer" */
  ['robot_product_designer_variance_order_by']: GraphQLTypes['robot_product_designer_variance_order_by'];
  /** input type for inserting data into table "robot.product" */
  ['robot_product_insert_input']: GraphQLTypes['robot_product_insert_input'];
  /** aggregate max on columns */
  ['robot_product_max_fields']: {
    id?: string;
    notion_id?: string;
    shopify_id?: string;
    title?: string;
  };
  /** aggregate min on columns */
  ['robot_product_min_fields']: {
    id?: string;
    notion_id?: string;
    shopify_id?: string;
    title?: string;
  };
  /** response of any mutation on the table "robot.product" */
  ['robot_product_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: ModelTypes['robot_product'][];
  };
  /** input type for inserting object relation for remote table "robot.product" */
  ['robot_product_obj_rel_insert_input']: GraphQLTypes['robot_product_obj_rel_insert_input'];
  /** on_conflict condition type for table "robot.product" */
  ['robot_product_on_conflict']: GraphQLTypes['robot_product_on_conflict'];
  /** Ordering options when selecting data from "robot.product". */
  ['robot_product_order_by']: GraphQLTypes['robot_product_order_by'];
  /** primary key columns input for table: robot_product */
  ['robot_product_pk_columns_input']: GraphQLTypes['robot_product_pk_columns_input'];
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  ['robot_product_prepend_input']: GraphQLTypes['robot_product_prepend_input'];
  /** select columns of table "robot.product" */
  ['robot_product_select_column']: GraphQLTypes['robot_product_select_column'];
  /** input type for updating data in table "robot.product" */
  ['robot_product_set_input']: GraphQLTypes['robot_product_set_input'];
  /** update columns of table "robot.product" */
  ['robot_product_update_column']: GraphQLTypes['robot_product_update_column'];
  /** columns and relationships of "shop.api_users" */
  ['shop_api_users']: {
    password_hash: string;
    username: string;
  };
  /** aggregated selection of "shop.api_users" */
  ['shop_api_users_aggregate']: {
    aggregate?: ModelTypes['shop_api_users_aggregate_fields'];
    nodes: ModelTypes['shop_api_users'][];
  };
  /** aggregate fields of "shop.api_users" */
  ['shop_api_users_aggregate_fields']: {
    count: number;
    max?: ModelTypes['shop_api_users_max_fields'];
    min?: ModelTypes['shop_api_users_min_fields'];
  };
  /** Boolean expression to filter rows from the table "shop.api_users". All fields are combined with a logical 'AND'. */
  ['shop_api_users_bool_exp']: GraphQLTypes['shop_api_users_bool_exp'];
  /** unique or primary key constraints on table "shop.api_users" */
  ['shop_api_users_constraint']: GraphQLTypes['shop_api_users_constraint'];
  /** input type for inserting data into table "shop.api_users" */
  ['shop_api_users_insert_input']: GraphQLTypes['shop_api_users_insert_input'];
  /** aggregate max on columns */
  ['shop_api_users_max_fields']: {
    password_hash?: string;
    username?: string;
  };
  /** aggregate min on columns */
  ['shop_api_users_min_fields']: {
    password_hash?: string;
    username?: string;
  };
  /** response of any mutation on the table "shop.api_users" */
  ['shop_api_users_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: ModelTypes['shop_api_users'][];
  };
  /** on_conflict condition type for table "shop.api_users" */
  ['shop_api_users_on_conflict']: GraphQLTypes['shop_api_users_on_conflict'];
  /** Ordering options when selecting data from "shop.api_users". */
  ['shop_api_users_order_by']: GraphQLTypes['shop_api_users_order_by'];
  /** primary key columns input for table: shop_api_users */
  ['shop_api_users_pk_columns_input']: GraphQLTypes['shop_api_users_pk_columns_input'];
  /** select columns of table "shop.api_users" */
  ['shop_api_users_select_column']: GraphQLTypes['shop_api_users_select_column'];
  /** input type for updating data in table "shop.api_users" */
  ['shop_api_users_set_input']: GraphQLTypes['shop_api_users_set_input'];
  /** update columns of table "shop.api_users" */
  ['shop_api_users_update_column']: GraphQLTypes['shop_api_users_update_column'];
  /** columns and relationships of "shop.product_locks" */
  ['shop_product_locks']: {
    access_code: string;
    created_at?: ModelTypes['timestamptz'];
    customer_eth_address?: string;
    lock_id: string;
  };
  /** aggregated selection of "shop.product_locks" */
  ['shop_product_locks_aggregate']: {
    aggregate?: ModelTypes['shop_product_locks_aggregate_fields'];
    nodes: ModelTypes['shop_product_locks'][];
  };
  /** aggregate fields of "shop.product_locks" */
  ['shop_product_locks_aggregate_fields']: {
    count: number;
    max?: ModelTypes['shop_product_locks_max_fields'];
    min?: ModelTypes['shop_product_locks_min_fields'];
  };
  /** Boolean expression to filter rows from the table "shop.product_locks". All fields are combined with a logical 'AND'. */
  ['shop_product_locks_bool_exp']: GraphQLTypes['shop_product_locks_bool_exp'];
  /** unique or primary key constraints on table "shop.product_locks" */
  ['shop_product_locks_constraint']: GraphQLTypes['shop_product_locks_constraint'];
  /** input type for inserting data into table "shop.product_locks" */
  ['shop_product_locks_insert_input']: GraphQLTypes['shop_product_locks_insert_input'];
  /** aggregate max on columns */
  ['shop_product_locks_max_fields']: {
    access_code?: string;
    created_at?: ModelTypes['timestamptz'];
    customer_eth_address?: string;
    lock_id?: string;
  };
  /** aggregate min on columns */
  ['shop_product_locks_min_fields']: {
    access_code?: string;
    created_at?: ModelTypes['timestamptz'];
    customer_eth_address?: string;
    lock_id?: string;
  };
  /** response of any mutation on the table "shop.product_locks" */
  ['shop_product_locks_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: ModelTypes['shop_product_locks'][];
  };
  /** on_conflict condition type for table "shop.product_locks" */
  ['shop_product_locks_on_conflict']: GraphQLTypes['shop_product_locks_on_conflict'];
  /** Ordering options when selecting data from "shop.product_locks". */
  ['shop_product_locks_order_by']: GraphQLTypes['shop_product_locks_order_by'];
  /** primary key columns input for table: shop_product_locks */
  ['shop_product_locks_pk_columns_input']: GraphQLTypes['shop_product_locks_pk_columns_input'];
  /** select columns of table "shop.product_locks" */
  ['shop_product_locks_select_column']: GraphQLTypes['shop_product_locks_select_column'];
  /** input type for updating data in table "shop.product_locks" */
  ['shop_product_locks_set_input']: GraphQLTypes['shop_product_locks_set_input'];
  /** update columns of table "shop.product_locks" */
  ['shop_product_locks_update_column']: GraphQLTypes['shop_product_locks_update_column'];
  ['subscription_root']: {
    /** fetch data from the table: "contribution_votes" */
    contribution_votes: ModelTypes['contribution_votes'][];
    /** fetch aggregated fields from the table: "contribution_votes" */
    contribution_votes_aggregate: ModelTypes['contribution_votes_aggregate'];
    /** fetch data from the table: "contribution_votes" using primary key columns */
    contribution_votes_by_pk?: ModelTypes['contribution_votes'];
    /** fetch data from the table: "contributions" */
    contributions: ModelTypes['contributions'][];
    /** fetch aggregated fields from the table: "contributions" */
    contributions_aggregate: ModelTypes['contributions_aggregate'];
    /** fetch data from the table: "contributions" using primary key columns */
    contributions_by_pk?: ModelTypes['contributions'];
    /** fetch data from the table: "contributors" */
    contributors: ModelTypes['contributors'][];
    /** An aggregate relationship */
    contributors_aggregate: ModelTypes['contributors_aggregate'];
    /** fetch data from the table: "contributors" using primary key columns */
    contributors_by_pk?: ModelTypes['contributors'];
    /** fetch data from the table: "robot.order" */
    robot_order: ModelTypes['robot_order'][];
    /** fetch aggregated fields from the table: "robot.order" */
    robot_order_aggregate: ModelTypes['robot_order_aggregate'];
    /** fetch data from the table: "robot.order" using primary key columns */
    robot_order_by_pk?: ModelTypes['robot_order'];
    /** fetch data from the table: "robot.product" */
    robot_product: ModelTypes['robot_product'][];
    /** fetch aggregated fields from the table: "robot.product" */
    robot_product_aggregate: ModelTypes['robot_product_aggregate'];
    /** fetch data from the table: "robot.product" using primary key columns */
    robot_product_by_pk?: ModelTypes['robot_product'];
    /** fetch data from the table: "robot.product_designer" */
    robot_product_designer: ModelTypes['robot_product_designer'][];
    /** fetch aggregated fields from the table: "robot.product_designer" */
    robot_product_designer_aggregate: ModelTypes['robot_product_designer_aggregate'];
    /** fetch data from the table: "robot.product_designer" using primary key columns */
    robot_product_designer_by_pk?: ModelTypes['robot_product_designer'];
    /** fetch data from the table: "shop.api_users" */
    shop_api_users: ModelTypes['shop_api_users'][];
    /** fetch aggregated fields from the table: "shop.api_users" */
    shop_api_users_aggregate: ModelTypes['shop_api_users_aggregate'];
    /** fetch data from the table: "shop.api_users" using primary key columns */
    shop_api_users_by_pk?: ModelTypes['shop_api_users'];
    /** fetch data from the table: "shop.product_locks" */
    shop_product_locks: ModelTypes['shop_product_locks'][];
    /** fetch aggregated fields from the table: "shop.product_locks" */
    shop_product_locks_aggregate: ModelTypes['shop_product_locks_aggregate'];
    /** fetch data from the table: "shop.product_locks" using primary key columns */
    shop_product_locks_by_pk?: ModelTypes['shop_product_locks'];
    /** fetch data from the table: "users" */
    users: ModelTypes['users'][];
    /** fetch aggregated fields from the table: "users" */
    users_aggregate: ModelTypes['users_aggregate'];
    /** fetch data from the table: "users" using primary key columns */
    users_by_pk?: ModelTypes['users'];
  };
  ['timestamptz']: any;
  /** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
  ['timestamptz_comparison_exp']: GraphQLTypes['timestamptz_comparison_exp'];
  /** columns and relationships of "users" */
  ['users']: {
    eth_address: string;
    id: ModelTypes['uuid'];
    name: string;
  };
  /** aggregated selection of "users" */
  ['users_aggregate']: {
    aggregate?: ModelTypes['users_aggregate_fields'];
    nodes: ModelTypes['users'][];
  };
  /** aggregate fields of "users" */
  ['users_aggregate_fields']: {
    count: number;
    max?: ModelTypes['users_max_fields'];
    min?: ModelTypes['users_min_fields'];
  };
  /** Boolean expression to filter rows from the table "users". All fields are combined with a logical 'AND'. */
  ['users_bool_exp']: GraphQLTypes['users_bool_exp'];
  /** unique or primary key constraints on table "users" */
  ['users_constraint']: GraphQLTypes['users_constraint'];
  /** input type for inserting data into table "users" */
  ['users_insert_input']: GraphQLTypes['users_insert_input'];
  /** aggregate max on columns */
  ['users_max_fields']: {
    eth_address?: string;
    id?: ModelTypes['uuid'];
    name?: string;
  };
  /** aggregate min on columns */
  ['users_min_fields']: {
    eth_address?: string;
    id?: ModelTypes['uuid'];
    name?: string;
  };
  /** response of any mutation on the table "users" */
  ['users_mutation_response']: {
    /** number of rows affected by the mutation */
    affected_rows: number;
    /** data from the rows affected by the mutation */
    returning: ModelTypes['users'][];
  };
  /** input type for inserting object relation for remote table "users" */
  ['users_obj_rel_insert_input']: GraphQLTypes['users_obj_rel_insert_input'];
  /** on_conflict condition type for table "users" */
  ['users_on_conflict']: GraphQLTypes['users_on_conflict'];
  /** Ordering options when selecting data from "users". */
  ['users_order_by']: GraphQLTypes['users_order_by'];
  /** primary key columns input for table: users */
  ['users_pk_columns_input']: GraphQLTypes['users_pk_columns_input'];
  /** select columns of table "users" */
  ['users_select_column']: GraphQLTypes['users_select_column'];
  /** input type for updating data in table "users" */
  ['users_set_input']: GraphQLTypes['users_set_input'];
  /** update columns of table "users" */
  ['users_update_column']: GraphQLTypes['users_update_column'];
  ['uuid']: any;
  /** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
  ['uuid_comparison_exp']: GraphQLTypes['uuid_comparison_exp'];
};

export type GraphQLTypes = {
  /** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
  ['Int_comparison_exp']: {
    _eq?: number;
    _gt?: number;
    _gte?: number;
    _in?: Array<number>;
    _is_null?: boolean;
    _lt?: number;
    _lte?: number;
    _neq?: number;
    _nin?: Array<number>;
  };
  /** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
  ['String_comparison_exp']: {
    _eq?: string;
    _gt?: string;
    _gte?: string;
    /** does the column match the given case-insensitive pattern */
    _ilike?: string;
    _in?: Array<string>;
    /** does the column match the given POSIX regular expression, case insensitive */
    _iregex?: string;
    _is_null?: boolean;
    /** does the column match the given pattern */
    _like?: string;
    _lt?: string;
    _lte?: string;
    _neq?: string;
    /** does the column NOT match the given case-insensitive pattern */
    _nilike?: string;
    _nin?: Array<string>;
    /** does the column NOT match the given POSIX regular expression, case insensitive */
    _niregex?: string;
    /** does the column NOT match the given pattern */
    _nlike?: string;
    /** does the column NOT match the given POSIX regular expression, case sensitive */
    _nregex?: string;
    /** does the column NOT match the given SQL regular expression */
    _nsimilar?: string;
    /** does the column match the given POSIX regular expression, case sensitive */
    _regex?: string;
    /** does the column match the given SQL regular expression */
    _similar?: string;
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
    aggregate?: GraphQLTypes['contribution_votes_aggregate_fields'];
    nodes: Array<GraphQLTypes['contribution_votes']>;
  };
  /** aggregate fields of "contribution_votes" */
  ['contribution_votes_aggregate_fields']: {
    __typename: 'contribution_votes_aggregate_fields';
    count: number;
    max?: GraphQLTypes['contribution_votes_max_fields'];
    min?: GraphQLTypes['contribution_votes_min_fields'];
  };
  /** order by aggregate values of table "contribution_votes" */
  ['contribution_votes_aggregate_order_by']: {
    count?: GraphQLTypes['order_by'];
    max?: GraphQLTypes['contribution_votes_max_order_by'];
    min?: GraphQLTypes['contribution_votes_min_order_by'];
  };
  /** input type for inserting array relation for remote table "contribution_votes" */
  ['contribution_votes_arr_rel_insert_input']: {
    data: Array<GraphQLTypes['contribution_votes_insert_input']>;
    /** upsert condition */
    on_conflict?: GraphQLTypes['contribution_votes_on_conflict'];
  };
  /** Boolean expression to filter rows from the table "contribution_votes". All fields are combined with a logical 'AND'. */
  ['contribution_votes_bool_exp']: {
    _and?: Array<GraphQLTypes['contribution_votes_bool_exp']>;
    _not?: GraphQLTypes['contribution_votes_bool_exp'];
    _or?: Array<GraphQLTypes['contribution_votes_bool_exp']>;
    contribution?: GraphQLTypes['contributions_bool_exp'];
    contribution_id?: GraphQLTypes['uuid_comparison_exp'];
    rating?: GraphQLTypes['String_comparison_exp'];
    user?: GraphQLTypes['users_bool_exp'];
    user_id?: GraphQLTypes['uuid_comparison_exp'];
  };
  /** unique or primary key constraints on table "contribution_votes" */
  ['contribution_votes_constraint']: contribution_votes_constraint;
  /** input type for inserting data into table "contribution_votes" */
  ['contribution_votes_insert_input']: {
    contribution?: GraphQLTypes['contributions_obj_rel_insert_input'];
    contribution_id?: GraphQLTypes['uuid'];
    rating?: string;
    user?: GraphQLTypes['users_obj_rel_insert_input'];
    user_id?: GraphQLTypes['uuid'];
  };
  /** aggregate max on columns */
  ['contribution_votes_max_fields']: {
    __typename: 'contribution_votes_max_fields';
    contribution_id?: GraphQLTypes['uuid'];
    rating?: string;
    user_id?: GraphQLTypes['uuid'];
  };
  /** order by max() on columns of table "contribution_votes" */
  ['contribution_votes_max_order_by']: {
    contribution_id?: GraphQLTypes['order_by'];
    rating?: GraphQLTypes['order_by'];
    user_id?: GraphQLTypes['order_by'];
  };
  /** aggregate min on columns */
  ['contribution_votes_min_fields']: {
    __typename: 'contribution_votes_min_fields';
    contribution_id?: GraphQLTypes['uuid'];
    rating?: string;
    user_id?: GraphQLTypes['uuid'];
  };
  /** order by min() on columns of table "contribution_votes" */
  ['contribution_votes_min_order_by']: {
    contribution_id?: GraphQLTypes['order_by'];
    rating?: GraphQLTypes['order_by'];
    user_id?: GraphQLTypes['order_by'];
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
    where?: GraphQLTypes['contribution_votes_bool_exp'];
  };
  /** Ordering options when selecting data from "contribution_votes". */
  ['contribution_votes_order_by']: {
    contribution?: GraphQLTypes['contributions_order_by'];
    contribution_id?: GraphQLTypes['order_by'];
    rating?: GraphQLTypes['order_by'];
    user?: GraphQLTypes['users_order_by'];
    user_id?: GraphQLTypes['order_by'];
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
    contribution_id?: GraphQLTypes['uuid'];
    rating?: string;
    user_id?: GraphQLTypes['uuid'];
  };
  /** update columns of table "contribution_votes" */
  ['contribution_votes_update_column']: contribution_votes_update_column;
  /** columns and relationships of "contributions" */
  ['contributions']: {
    __typename: 'contributions';
    artifact?: string;
    /** An object relationship */
    author: GraphQLTypes['users'];
    category?: string;
    /** fetch data from the table: "contributors" */
    contributors: Array<GraphQLTypes['contributors']>;
    /** An aggregate relationship */
    contributors_aggregate: GraphQLTypes['contributors_aggregate'];
    created_at: GraphQLTypes['timestamptz'];
    created_by: GraphQLTypes['uuid'];
    date: GraphQLTypes['date'];
    description?: string;
    effort?: string;
    id: GraphQLTypes['uuid'];
    impact?: string;
    title: string;
    /** An array relationship */
    votes: Array<GraphQLTypes['contribution_votes']>;
    /** An aggregate relationship */
    votes_aggregate: GraphQLTypes['contribution_votes_aggregate'];
    weight?: number;
  };
  /** aggregated selection of "contributions" */
  ['contributions_aggregate']: {
    __typename: 'contributions_aggregate';
    aggregate?: GraphQLTypes['contributions_aggregate_fields'];
    nodes: Array<GraphQLTypes['contributions']>;
  };
  /** aggregate fields of "contributions" */
  ['contributions_aggregate_fields']: {
    __typename: 'contributions_aggregate_fields';
    avg?: GraphQLTypes['contributions_avg_fields'];
    count: number;
    max?: GraphQLTypes['contributions_max_fields'];
    min?: GraphQLTypes['contributions_min_fields'];
    stddev?: GraphQLTypes['contributions_stddev_fields'];
    stddev_pop?: GraphQLTypes['contributions_stddev_pop_fields'];
    stddev_samp?: GraphQLTypes['contributions_stddev_samp_fields'];
    sum?: GraphQLTypes['contributions_sum_fields'];
    var_pop?: GraphQLTypes['contributions_var_pop_fields'];
    var_samp?: GraphQLTypes['contributions_var_samp_fields'];
    variance?: GraphQLTypes['contributions_variance_fields'];
  };
  /** aggregate avg on columns */
  ['contributions_avg_fields']: {
    __typename: 'contributions_avg_fields';
    weight?: number;
  };
  /** Boolean expression to filter rows from the table "contributions". All fields are combined with a logical 'AND'. */
  ['contributions_bool_exp']: {
    _and?: Array<GraphQLTypes['contributions_bool_exp']>;
    _not?: GraphQLTypes['contributions_bool_exp'];
    _or?: Array<GraphQLTypes['contributions_bool_exp']>;
    artifact?: GraphQLTypes['String_comparison_exp'];
    author?: GraphQLTypes['users_bool_exp'];
    category?: GraphQLTypes['String_comparison_exp'];
    contributors?: GraphQLTypes['contributors_bool_exp'];
    created_at?: GraphQLTypes['timestamptz_comparison_exp'];
    created_by?: GraphQLTypes['uuid_comparison_exp'];
    date?: GraphQLTypes['date_comparison_exp'];
    description?: GraphQLTypes['String_comparison_exp'];
    effort?: GraphQLTypes['String_comparison_exp'];
    id?: GraphQLTypes['uuid_comparison_exp'];
    impact?: GraphQLTypes['String_comparison_exp'];
    title?: GraphQLTypes['String_comparison_exp'];
    votes?: GraphQLTypes['contribution_votes_bool_exp'];
    weight?: GraphQLTypes['Int_comparison_exp'];
  };
  /** unique or primary key constraints on table "contributions" */
  ['contributions_constraint']: contributions_constraint;
  /** input type for incrementing numeric columns in table "contributions" */
  ['contributions_inc_input']: {
    weight?: number;
  };
  /** input type for inserting data into table "contributions" */
  ['contributions_insert_input']: {
    artifact?: string;
    author?: GraphQLTypes['users_obj_rel_insert_input'];
    category?: string;
    contributors?: GraphQLTypes['contributors_arr_rel_insert_input'];
    created_at?: GraphQLTypes['timestamptz'];
    created_by?: GraphQLTypes['uuid'];
    date?: GraphQLTypes['date'];
    description?: string;
    effort?: string;
    id?: GraphQLTypes['uuid'];
    impact?: string;
    title?: string;
    votes?: GraphQLTypes['contribution_votes_arr_rel_insert_input'];
    weight?: number;
  };
  /** aggregate max on columns */
  ['contributions_max_fields']: {
    __typename: 'contributions_max_fields';
    artifact?: string;
    category?: string;
    created_at?: GraphQLTypes['timestamptz'];
    created_by?: GraphQLTypes['uuid'];
    date?: GraphQLTypes['date'];
    description?: string;
    effort?: string;
    id?: GraphQLTypes['uuid'];
    impact?: string;
    title?: string;
    weight?: number;
  };
  /** aggregate min on columns */
  ['contributions_min_fields']: {
    __typename: 'contributions_min_fields';
    artifact?: string;
    category?: string;
    created_at?: GraphQLTypes['timestamptz'];
    created_by?: GraphQLTypes['uuid'];
    date?: GraphQLTypes['date'];
    description?: string;
    effort?: string;
    id?: GraphQLTypes['uuid'];
    impact?: string;
    title?: string;
    weight?: number;
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
    on_conflict?: GraphQLTypes['contributions_on_conflict'];
  };
  /** on_conflict condition type for table "contributions" */
  ['contributions_on_conflict']: {
    constraint: GraphQLTypes['contributions_constraint'];
    update_columns: Array<GraphQLTypes['contributions_update_column']>;
    where?: GraphQLTypes['contributions_bool_exp'];
  };
  /** Ordering options when selecting data from "contributions". */
  ['contributions_order_by']: {
    artifact?: GraphQLTypes['order_by'];
    author?: GraphQLTypes['users_order_by'];
    category?: GraphQLTypes['order_by'];
    contributors_aggregate?: GraphQLTypes['contributors_aggregate_order_by'];
    created_at?: GraphQLTypes['order_by'];
    created_by?: GraphQLTypes['order_by'];
    date?: GraphQLTypes['order_by'];
    description?: GraphQLTypes['order_by'];
    effort?: GraphQLTypes['order_by'];
    id?: GraphQLTypes['order_by'];
    impact?: GraphQLTypes['order_by'];
    title?: GraphQLTypes['order_by'];
    votes_aggregate?: GraphQLTypes['contribution_votes_aggregate_order_by'];
    weight?: GraphQLTypes['order_by'];
  };
  /** primary key columns input for table: contributions */
  ['contributions_pk_columns_input']: {
    id: GraphQLTypes['uuid'];
  };
  /** select columns of table "contributions" */
  ['contributions_select_column']: contributions_select_column;
  /** input type for updating data in table "contributions" */
  ['contributions_set_input']: {
    artifact?: string;
    category?: string;
    created_at?: GraphQLTypes['timestamptz'];
    created_by?: GraphQLTypes['uuid'];
    date?: GraphQLTypes['date'];
    description?: string;
    effort?: string;
    id?: GraphQLTypes['uuid'];
    impact?: string;
    title?: string;
    weight?: number;
  };
  /** aggregate stddev on columns */
  ['contributions_stddev_fields']: {
    __typename: 'contributions_stddev_fields';
    weight?: number;
  };
  /** aggregate stddev_pop on columns */
  ['contributions_stddev_pop_fields']: {
    __typename: 'contributions_stddev_pop_fields';
    weight?: number;
  };
  /** aggregate stddev_samp on columns */
  ['contributions_stddev_samp_fields']: {
    __typename: 'contributions_stddev_samp_fields';
    weight?: number;
  };
  /** aggregate sum on columns */
  ['contributions_sum_fields']: {
    __typename: 'contributions_sum_fields';
    weight?: number;
  };
  /** update columns of table "contributions" */
  ['contributions_update_column']: contributions_update_column;
  /** aggregate var_pop on columns */
  ['contributions_var_pop_fields']: {
    __typename: 'contributions_var_pop_fields';
    weight?: number;
  };
  /** aggregate var_samp on columns */
  ['contributions_var_samp_fields']: {
    __typename: 'contributions_var_samp_fields';
    weight?: number;
  };
  /** aggregate variance on columns */
  ['contributions_variance_fields']: {
    __typename: 'contributions_variance_fields';
    weight?: number;
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
    aggregate?: GraphQLTypes['contributors_aggregate_fields'];
    nodes: Array<GraphQLTypes['contributors']>;
  };
  /** aggregate fields of "contributors" */
  ['contributors_aggregate_fields']: {
    __typename: 'contributors_aggregate_fields';
    avg?: GraphQLTypes['contributors_avg_fields'];
    count: number;
    max?: GraphQLTypes['contributors_max_fields'];
    min?: GraphQLTypes['contributors_min_fields'];
    stddev?: GraphQLTypes['contributors_stddev_fields'];
    stddev_pop?: GraphQLTypes['contributors_stddev_pop_fields'];
    stddev_samp?: GraphQLTypes['contributors_stddev_samp_fields'];
    sum?: GraphQLTypes['contributors_sum_fields'];
    var_pop?: GraphQLTypes['contributors_var_pop_fields'];
    var_samp?: GraphQLTypes['contributors_var_samp_fields'];
    variance?: GraphQLTypes['contributors_variance_fields'];
  };
  /** order by aggregate values of table "contributors" */
  ['contributors_aggregate_order_by']: {
    avg?: GraphQLTypes['contributors_avg_order_by'];
    count?: GraphQLTypes['order_by'];
    max?: GraphQLTypes['contributors_max_order_by'];
    min?: GraphQLTypes['contributors_min_order_by'];
    stddev?: GraphQLTypes['contributors_stddev_order_by'];
    stddev_pop?: GraphQLTypes['contributors_stddev_pop_order_by'];
    stddev_samp?: GraphQLTypes['contributors_stddev_samp_order_by'];
    sum?: GraphQLTypes['contributors_sum_order_by'];
    var_pop?: GraphQLTypes['contributors_var_pop_order_by'];
    var_samp?: GraphQLTypes['contributors_var_samp_order_by'];
    variance?: GraphQLTypes['contributors_variance_order_by'];
  };
  /** input type for inserting array relation for remote table "contributors" */
  ['contributors_arr_rel_insert_input']: {
    data: Array<GraphQLTypes['contributors_insert_input']>;
    /** upsert condition */
    on_conflict?: GraphQLTypes['contributors_on_conflict'];
  };
  /** aggregate avg on columns */
  ['contributors_avg_fields']: {
    __typename: 'contributors_avg_fields';
    contribution_share?: number;
  };
  /** order by avg() on columns of table "contributors" */
  ['contributors_avg_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
  };
  /** Boolean expression to filter rows from the table "contributors". All fields are combined with a logical 'AND'. */
  ['contributors_bool_exp']: {
    _and?: Array<GraphQLTypes['contributors_bool_exp']>;
    _not?: GraphQLTypes['contributors_bool_exp'];
    _or?: Array<GraphQLTypes['contributors_bool_exp']>;
    contribution?: GraphQLTypes['contributions_bool_exp'];
    contribution_id?: GraphQLTypes['uuid_comparison_exp'];
    contribution_share?: GraphQLTypes['numeric_comparison_exp'];
    user?: GraphQLTypes['users_bool_exp'];
    user_id?: GraphQLTypes['uuid_comparison_exp'];
  };
  /** unique or primary key constraints on table "contributors" */
  ['contributors_constraint']: contributors_constraint;
  /** input type for incrementing numeric columns in table "contributors" */
  ['contributors_inc_input']: {
    contribution_share?: GraphQLTypes['numeric'];
  };
  /** input type for inserting data into table "contributors" */
  ['contributors_insert_input']: {
    contribution?: GraphQLTypes['contributions_obj_rel_insert_input'];
    contribution_id?: GraphQLTypes['uuid'];
    contribution_share?: GraphQLTypes['numeric'];
    user?: GraphQLTypes['users_obj_rel_insert_input'];
    user_id?: GraphQLTypes['uuid'];
  };
  /** aggregate max on columns */
  ['contributors_max_fields']: {
    __typename: 'contributors_max_fields';
    contribution_id?: GraphQLTypes['uuid'];
    contribution_share?: GraphQLTypes['numeric'];
    user_id?: GraphQLTypes['uuid'];
  };
  /** order by max() on columns of table "contributors" */
  ['contributors_max_order_by']: {
    contribution_id?: GraphQLTypes['order_by'];
    contribution_share?: GraphQLTypes['order_by'];
    user_id?: GraphQLTypes['order_by'];
  };
  /** aggregate min on columns */
  ['contributors_min_fields']: {
    __typename: 'contributors_min_fields';
    contribution_id?: GraphQLTypes['uuid'];
    contribution_share?: GraphQLTypes['numeric'];
    user_id?: GraphQLTypes['uuid'];
  };
  /** order by min() on columns of table "contributors" */
  ['contributors_min_order_by']: {
    contribution_id?: GraphQLTypes['order_by'];
    contribution_share?: GraphQLTypes['order_by'];
    user_id?: GraphQLTypes['order_by'];
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
    where?: GraphQLTypes['contributors_bool_exp'];
  };
  /** Ordering options when selecting data from "contributors". */
  ['contributors_order_by']: {
    contribution?: GraphQLTypes['contributions_order_by'];
    contribution_id?: GraphQLTypes['order_by'];
    contribution_share?: GraphQLTypes['order_by'];
    user?: GraphQLTypes['users_order_by'];
    user_id?: GraphQLTypes['order_by'];
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
    contribution_id?: GraphQLTypes['uuid'];
    contribution_share?: GraphQLTypes['numeric'];
    user_id?: GraphQLTypes['uuid'];
  };
  /** aggregate stddev on columns */
  ['contributors_stddev_fields']: {
    __typename: 'contributors_stddev_fields';
    contribution_share?: number;
  };
  /** order by stddev() on columns of table "contributors" */
  ['contributors_stddev_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
  };
  /** aggregate stddev_pop on columns */
  ['contributors_stddev_pop_fields']: {
    __typename: 'contributors_stddev_pop_fields';
    contribution_share?: number;
  };
  /** order by stddev_pop() on columns of table "contributors" */
  ['contributors_stddev_pop_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
  };
  /** aggregate stddev_samp on columns */
  ['contributors_stddev_samp_fields']: {
    __typename: 'contributors_stddev_samp_fields';
    contribution_share?: number;
  };
  /** order by stddev_samp() on columns of table "contributors" */
  ['contributors_stddev_samp_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
  };
  /** aggregate sum on columns */
  ['contributors_sum_fields']: {
    __typename: 'contributors_sum_fields';
    contribution_share?: GraphQLTypes['numeric'];
  };
  /** order by sum() on columns of table "contributors" */
  ['contributors_sum_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
  };
  /** update columns of table "contributors" */
  ['contributors_update_column']: contributors_update_column;
  /** aggregate var_pop on columns */
  ['contributors_var_pop_fields']: {
    __typename: 'contributors_var_pop_fields';
    contribution_share?: number;
  };
  /** order by var_pop() on columns of table "contributors" */
  ['contributors_var_pop_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
  };
  /** aggregate var_samp on columns */
  ['contributors_var_samp_fields']: {
    __typename: 'contributors_var_samp_fields';
    contribution_share?: number;
  };
  /** order by var_samp() on columns of table "contributors" */
  ['contributors_var_samp_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
  };
  /** aggregate variance on columns */
  ['contributors_variance_fields']: {
    __typename: 'contributors_variance_fields';
    contribution_share?: number;
  };
  /** order by variance() on columns of table "contributors" */
  ['contributors_variance_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
  };
  ['date']: any;
  /** Boolean expression to compare columns of type "date". All fields are combined with logical 'AND'. */
  ['date_comparison_exp']: {
    _eq?: GraphQLTypes['date'];
    _gt?: GraphQLTypes['date'];
    _gte?: GraphQLTypes['date'];
    _in?: Array<GraphQLTypes['date']>;
    _is_null?: boolean;
    _lt?: GraphQLTypes['date'];
    _lte?: GraphQLTypes['date'];
    _neq?: GraphQLTypes['date'];
    _nin?: Array<GraphQLTypes['date']>;
  };
  ['jsonb']: any;
  /** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
  ['jsonb_comparison_exp']: {
    /** is the column contained in the given json value */
    _contained_in?: GraphQLTypes['jsonb'];
    /** does the column contain the given json value at the top level */
    _contains?: GraphQLTypes['jsonb'];
    _eq?: GraphQLTypes['jsonb'];
    _gt?: GraphQLTypes['jsonb'];
    _gte?: GraphQLTypes['jsonb'];
    /** does the string exist as a top-level key in the column */
    _has_key?: string;
    /** do all of these strings exist as top-level keys in the column */
    _has_keys_all?: Array<string>;
    /** do any of these strings exist as top-level keys in the column */
    _has_keys_any?: Array<string>;
    _in?: Array<GraphQLTypes['jsonb']>;
    _is_null?: boolean;
    _lt?: GraphQLTypes['jsonb'];
    _lte?: GraphQLTypes['jsonb'];
    _neq?: GraphQLTypes['jsonb'];
    _nin?: Array<GraphQLTypes['jsonb']>;
  };
  /** mutation root */
  ['mutation_root']: {
    __typename: 'mutation_root';
    /** delete data from the table: "contribution_votes" */
    delete_contribution_votes?: GraphQLTypes['contribution_votes_mutation_response'];
    /** delete single row from the table: "contribution_votes" */
    delete_contribution_votes_by_pk?: GraphQLTypes['contribution_votes'];
    /** delete data from the table: "contributions" */
    delete_contributions?: GraphQLTypes['contributions_mutation_response'];
    /** delete single row from the table: "contributions" */
    delete_contributions_by_pk?: GraphQLTypes['contributions'];
    /** delete data from the table: "contributors" */
    delete_contributors?: GraphQLTypes['contributors_mutation_response'];
    /** delete single row from the table: "contributors" */
    delete_contributors_by_pk?: GraphQLTypes['contributors'];
    /** delete data from the table: "robot.order" */
    delete_robot_order?: GraphQLTypes['robot_order_mutation_response'];
    /** delete single row from the table: "robot.order" */
    delete_robot_order_by_pk?: GraphQLTypes['robot_order'];
    /** delete data from the table: "robot.product" */
    delete_robot_product?: GraphQLTypes['robot_product_mutation_response'];
    /** delete single row from the table: "robot.product" */
    delete_robot_product_by_pk?: GraphQLTypes['robot_product'];
    /** delete data from the table: "robot.product_designer" */
    delete_robot_product_designer?: GraphQLTypes['robot_product_designer_mutation_response'];
    /** delete single row from the table: "robot.product_designer" */
    delete_robot_product_designer_by_pk?: GraphQLTypes['robot_product_designer'];
    /** delete data from the table: "shop.api_users" */
    delete_shop_api_users?: GraphQLTypes['shop_api_users_mutation_response'];
    /** delete single row from the table: "shop.api_users" */
    delete_shop_api_users_by_pk?: GraphQLTypes['shop_api_users'];
    /** delete data from the table: "shop.product_locks" */
    delete_shop_product_locks?: GraphQLTypes['shop_product_locks_mutation_response'];
    /** delete single row from the table: "shop.product_locks" */
    delete_shop_product_locks_by_pk?: GraphQLTypes['shop_product_locks'];
    /** delete data from the table: "users" */
    delete_users?: GraphQLTypes['users_mutation_response'];
    /** delete single row from the table: "users" */
    delete_users_by_pk?: GraphQLTypes['users'];
    /** insert data into the table: "contribution_votes" */
    insert_contribution_votes?: GraphQLTypes['contribution_votes_mutation_response'];
    /** insert a single row into the table: "contribution_votes" */
    insert_contribution_votes_one?: GraphQLTypes['contribution_votes'];
    /** insert data into the table: "contributions" */
    insert_contributions?: GraphQLTypes['contributions_mutation_response'];
    /** insert a single row into the table: "contributions" */
    insert_contributions_one?: GraphQLTypes['contributions'];
    /** insert data into the table: "contributors" */
    insert_contributors?: GraphQLTypes['contributors_mutation_response'];
    /** insert a single row into the table: "contributors" */
    insert_contributors_one?: GraphQLTypes['contributors'];
    /** insert data into the table: "robot.order" */
    insert_robot_order?: GraphQLTypes['robot_order_mutation_response'];
    /** insert a single row into the table: "robot.order" */
    insert_robot_order_one?: GraphQLTypes['robot_order'];
    /** insert data into the table: "robot.product" */
    insert_robot_product?: GraphQLTypes['robot_product_mutation_response'];
    /** insert data into the table: "robot.product_designer" */
    insert_robot_product_designer?: GraphQLTypes['robot_product_designer_mutation_response'];
    /** insert a single row into the table: "robot.product_designer" */
    insert_robot_product_designer_one?: GraphQLTypes['robot_product_designer'];
    /** insert a single row into the table: "robot.product" */
    insert_robot_product_one?: GraphQLTypes['robot_product'];
    /** insert data into the table: "shop.api_users" */
    insert_shop_api_users?: GraphQLTypes['shop_api_users_mutation_response'];
    /** insert a single row into the table: "shop.api_users" */
    insert_shop_api_users_one?: GraphQLTypes['shop_api_users'];
    /** insert data into the table: "shop.product_locks" */
    insert_shop_product_locks?: GraphQLTypes['shop_product_locks_mutation_response'];
    /** insert a single row into the table: "shop.product_locks" */
    insert_shop_product_locks_one?: GraphQLTypes['shop_product_locks'];
    /** insert data into the table: "users" */
    insert_users?: GraphQLTypes['users_mutation_response'];
    /** insert a single row into the table: "users" */
    insert_users_one?: GraphQLTypes['users'];
    /** update data of the table: "contribution_votes" */
    update_contribution_votes?: GraphQLTypes['contribution_votes_mutation_response'];
    /** update single row of the table: "contribution_votes" */
    update_contribution_votes_by_pk?: GraphQLTypes['contribution_votes'];
    /** update data of the table: "contributions" */
    update_contributions?: GraphQLTypes['contributions_mutation_response'];
    /** update single row of the table: "contributions" */
    update_contributions_by_pk?: GraphQLTypes['contributions'];
    /** update data of the table: "contributors" */
    update_contributors?: GraphQLTypes['contributors_mutation_response'];
    /** update single row of the table: "contributors" */
    update_contributors_by_pk?: GraphQLTypes['contributors'];
    /** update data of the table: "robot.order" */
    update_robot_order?: GraphQLTypes['robot_order_mutation_response'];
    /** update single row of the table: "robot.order" */
    update_robot_order_by_pk?: GraphQLTypes['robot_order'];
    /** update data of the table: "robot.product" */
    update_robot_product?: GraphQLTypes['robot_product_mutation_response'];
    /** update single row of the table: "robot.product" */
    update_robot_product_by_pk?: GraphQLTypes['robot_product'];
    /** update data of the table: "robot.product_designer" */
    update_robot_product_designer?: GraphQLTypes['robot_product_designer_mutation_response'];
    /** update single row of the table: "robot.product_designer" */
    update_robot_product_designer_by_pk?: GraphQLTypes['robot_product_designer'];
    /** update data of the table: "shop.api_users" */
    update_shop_api_users?: GraphQLTypes['shop_api_users_mutation_response'];
    /** update single row of the table: "shop.api_users" */
    update_shop_api_users_by_pk?: GraphQLTypes['shop_api_users'];
    /** update data of the table: "shop.product_locks" */
    update_shop_product_locks?: GraphQLTypes['shop_product_locks_mutation_response'];
    /** update single row of the table: "shop.product_locks" */
    update_shop_product_locks_by_pk?: GraphQLTypes['shop_product_locks'];
    /** update data of the table: "users" */
    update_users?: GraphQLTypes['users_mutation_response'];
    /** update single row of the table: "users" */
    update_users_by_pk?: GraphQLTypes['users'];
  };
  ['numeric']: any;
  /** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
  ['numeric_comparison_exp']: {
    _eq?: GraphQLTypes['numeric'];
    _gt?: GraphQLTypes['numeric'];
    _gte?: GraphQLTypes['numeric'];
    _in?: Array<GraphQLTypes['numeric']>;
    _is_null?: boolean;
    _lt?: GraphQLTypes['numeric'];
    _lte?: GraphQLTypes['numeric'];
    _neq?: GraphQLTypes['numeric'];
    _nin?: Array<GraphQLTypes['numeric']>;
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
    contribution_votes_by_pk?: GraphQLTypes['contribution_votes'];
    /** fetch data from the table: "contributions" */
    contributions: Array<GraphQLTypes['contributions']>;
    /** fetch aggregated fields from the table: "contributions" */
    contributions_aggregate: GraphQLTypes['contributions_aggregate'];
    /** fetch data from the table: "contributions" using primary key columns */
    contributions_by_pk?: GraphQLTypes['contributions'];
    /** fetch data from the table: "contributors" */
    contributors: Array<GraphQLTypes['contributors']>;
    /** An aggregate relationship */
    contributors_aggregate: GraphQLTypes['contributors_aggregate'];
    /** fetch data from the table: "contributors" using primary key columns */
    contributors_by_pk?: GraphQLTypes['contributors'];
    /** fetch data from the table: "robot.order" */
    robot_order: Array<GraphQLTypes['robot_order']>;
    /** fetch aggregated fields from the table: "robot.order" */
    robot_order_aggregate: GraphQLTypes['robot_order_aggregate'];
    /** fetch data from the table: "robot.order" using primary key columns */
    robot_order_by_pk?: GraphQLTypes['robot_order'];
    /** fetch data from the table: "robot.product" */
    robot_product: Array<GraphQLTypes['robot_product']>;
    /** fetch aggregated fields from the table: "robot.product" */
    robot_product_aggregate: GraphQLTypes['robot_product_aggregate'];
    /** fetch data from the table: "robot.product" using primary key columns */
    robot_product_by_pk?: GraphQLTypes['robot_product'];
    /** fetch data from the table: "robot.product_designer" */
    robot_product_designer: Array<GraphQLTypes['robot_product_designer']>;
    /** fetch aggregated fields from the table: "robot.product_designer" */
    robot_product_designer_aggregate: GraphQLTypes['robot_product_designer_aggregate'];
    /** fetch data from the table: "robot.product_designer" using primary key columns */
    robot_product_designer_by_pk?: GraphQLTypes['robot_product_designer'];
    /** fetch data from the table: "shop.api_users" */
    shop_api_users: Array<GraphQLTypes['shop_api_users']>;
    /** fetch aggregated fields from the table: "shop.api_users" */
    shop_api_users_aggregate: GraphQLTypes['shop_api_users_aggregate'];
    /** fetch data from the table: "shop.api_users" using primary key columns */
    shop_api_users_by_pk?: GraphQLTypes['shop_api_users'];
    /** fetch data from the table: "shop.product_locks" */
    shop_product_locks: Array<GraphQLTypes['shop_product_locks']>;
    /** fetch aggregated fields from the table: "shop.product_locks" */
    shop_product_locks_aggregate: GraphQLTypes['shop_product_locks_aggregate'];
    /** fetch data from the table: "shop.product_locks" using primary key columns */
    shop_product_locks_by_pk?: GraphQLTypes['shop_product_locks'];
    /** fetch data from the table: "users" */
    users: Array<GraphQLTypes['users']>;
    /** fetch aggregated fields from the table: "users" */
    users_aggregate: GraphQLTypes['users_aggregate'];
    /** fetch data from the table: "users" using primary key columns */
    users_by_pk?: GraphQLTypes['users'];
  };
  /** Orders for ROBOT rewards


columns and relationships of "robot.order" */
  ['robot_order']: {
    __typename: 'robot_order';
    buyer_address: string;
    buyer_reward: GraphQLTypes['numeric'];
    date: GraphQLTypes['date'];
    dollars_spent: GraphQLTypes['numeric'];
    order_id: string;
    order_number?: string;
    season: GraphQLTypes['numeric'];
  };
  /** aggregated selection of "robot.order" */
  ['robot_order_aggregate']: {
    __typename: 'robot_order_aggregate';
    aggregate?: GraphQLTypes['robot_order_aggregate_fields'];
    nodes: Array<GraphQLTypes['robot_order']>;
  };
  /** aggregate fields of "robot.order" */
  ['robot_order_aggregate_fields']: {
    __typename: 'robot_order_aggregate_fields';
    avg?: GraphQLTypes['robot_order_avg_fields'];
    count: number;
    max?: GraphQLTypes['robot_order_max_fields'];
    min?: GraphQLTypes['robot_order_min_fields'];
    stddev?: GraphQLTypes['robot_order_stddev_fields'];
    stddev_pop?: GraphQLTypes['robot_order_stddev_pop_fields'];
    stddev_samp?: GraphQLTypes['robot_order_stddev_samp_fields'];
    sum?: GraphQLTypes['robot_order_sum_fields'];
    var_pop?: GraphQLTypes['robot_order_var_pop_fields'];
    var_samp?: GraphQLTypes['robot_order_var_samp_fields'];
    variance?: GraphQLTypes['robot_order_variance_fields'];
  };
  /** aggregate avg on columns */
  ['robot_order_avg_fields']: {
    __typename: 'robot_order_avg_fields';
    buyer_reward?: number;
    dollars_spent?: number;
    season?: number;
  };
  /** Boolean expression to filter rows from the table "robot.order". All fields are combined with a logical 'AND'. */
  ['robot_order_bool_exp']: {
    _and?: Array<GraphQLTypes['robot_order_bool_exp']>;
    _not?: GraphQLTypes['robot_order_bool_exp'];
    _or?: Array<GraphQLTypes['robot_order_bool_exp']>;
    buyer_address?: GraphQLTypes['String_comparison_exp'];
    buyer_reward?: GraphQLTypes['numeric_comparison_exp'];
    date?: GraphQLTypes['date_comparison_exp'];
    dollars_spent?: GraphQLTypes['numeric_comparison_exp'];
    order_id?: GraphQLTypes['String_comparison_exp'];
    order_number?: GraphQLTypes['String_comparison_exp'];
    season?: GraphQLTypes['numeric_comparison_exp'];
  };
  /** unique or primary key constraints on table "robot.order" */
  ['robot_order_constraint']: robot_order_constraint;
  /** input type for incrementing numeric columns in table "robot.order" */
  ['robot_order_inc_input']: {
    buyer_reward?: GraphQLTypes['numeric'];
    dollars_spent?: GraphQLTypes['numeric'];
    season?: GraphQLTypes['numeric'];
  };
  /** input type for inserting data into table "robot.order" */
  ['robot_order_insert_input']: {
    buyer_address?: string;
    buyer_reward?: GraphQLTypes['numeric'];
    date?: GraphQLTypes['date'];
    dollars_spent?: GraphQLTypes['numeric'];
    order_id?: string;
    order_number?: string;
    season?: GraphQLTypes['numeric'];
  };
  /** aggregate max on columns */
  ['robot_order_max_fields']: {
    __typename: 'robot_order_max_fields';
    buyer_address?: string;
    buyer_reward?: GraphQLTypes['numeric'];
    date?: GraphQLTypes['date'];
    dollars_spent?: GraphQLTypes['numeric'];
    order_id?: string;
    order_number?: string;
    season?: GraphQLTypes['numeric'];
  };
  /** aggregate min on columns */
  ['robot_order_min_fields']: {
    __typename: 'robot_order_min_fields';
    buyer_address?: string;
    buyer_reward?: GraphQLTypes['numeric'];
    date?: GraphQLTypes['date'];
    dollars_spent?: GraphQLTypes['numeric'];
    order_id?: string;
    order_number?: string;
    season?: GraphQLTypes['numeric'];
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
    where?: GraphQLTypes['robot_order_bool_exp'];
  };
  /** Ordering options when selecting data from "robot.order". */
  ['robot_order_order_by']: {
    buyer_address?: GraphQLTypes['order_by'];
    buyer_reward?: GraphQLTypes['order_by'];
    date?: GraphQLTypes['order_by'];
    dollars_spent?: GraphQLTypes['order_by'];
    order_id?: GraphQLTypes['order_by'];
    order_number?: GraphQLTypes['order_by'];
    season?: GraphQLTypes['order_by'];
  };
  /** primary key columns input for table: robot_order */
  ['robot_order_pk_columns_input']: {
    order_id: string;
  };
  /** select columns of table "robot.order" */
  ['robot_order_select_column']: robot_order_select_column;
  /** input type for updating data in table "robot.order" */
  ['robot_order_set_input']: {
    buyer_address?: string;
    buyer_reward?: GraphQLTypes['numeric'];
    date?: GraphQLTypes['date'];
    dollars_spent?: GraphQLTypes['numeric'];
    order_id?: string;
    order_number?: string;
    season?: GraphQLTypes['numeric'];
  };
  /** aggregate stddev on columns */
  ['robot_order_stddev_fields']: {
    __typename: 'robot_order_stddev_fields';
    buyer_reward?: number;
    dollars_spent?: number;
    season?: number;
  };
  /** aggregate stddev_pop on columns */
  ['robot_order_stddev_pop_fields']: {
    __typename: 'robot_order_stddev_pop_fields';
    buyer_reward?: number;
    dollars_spent?: number;
    season?: number;
  };
  /** aggregate stddev_samp on columns */
  ['robot_order_stddev_samp_fields']: {
    __typename: 'robot_order_stddev_samp_fields';
    buyer_reward?: number;
    dollars_spent?: number;
    season?: number;
  };
  /** aggregate sum on columns */
  ['robot_order_sum_fields']: {
    __typename: 'robot_order_sum_fields';
    buyer_reward?: GraphQLTypes['numeric'];
    dollars_spent?: GraphQLTypes['numeric'];
    season?: GraphQLTypes['numeric'];
  };
  /** update columns of table "robot.order" */
  ['robot_order_update_column']: robot_order_update_column;
  /** aggregate var_pop on columns */
  ['robot_order_var_pop_fields']: {
    __typename: 'robot_order_var_pop_fields';
    buyer_reward?: number;
    dollars_spent?: number;
    season?: number;
  };
  /** aggregate var_samp on columns */
  ['robot_order_var_samp_fields']: {
    __typename: 'robot_order_var_samp_fields';
    buyer_reward?: number;
    dollars_spent?: number;
    season?: number;
  };
  /** aggregate variance on columns */
  ['robot_order_variance_fields']: {
    __typename: 'robot_order_variance_fields';
    buyer_reward?: number;
    dollars_spent?: number;
    season?: number;
  };
  /** Products for ROBOT designer rewards


columns and relationships of "robot.product" */
  ['robot_product']: {
    __typename: 'robot_product';
    /** An array relationship */
    designers: Array<GraphQLTypes['robot_product_designer']>;
    /** An aggregate relationship */
    designers_aggregate: GraphQLTypes['robot_product_designer_aggregate'];
    id: string;
    nft_metadata?: GraphQLTypes['jsonb'];
    notion_id?: string;
    shopify_id?: string;
    title: string;
  };
  /** aggregated selection of "robot.product" */
  ['robot_product_aggregate']: {
    __typename: 'robot_product_aggregate';
    aggregate?: GraphQLTypes['robot_product_aggregate_fields'];
    nodes: Array<GraphQLTypes['robot_product']>;
  };
  /** aggregate fields of "robot.product" */
  ['robot_product_aggregate_fields']: {
    __typename: 'robot_product_aggregate_fields';
    count: number;
    max?: GraphQLTypes['robot_product_max_fields'];
    min?: GraphQLTypes['robot_product_min_fields'];
  };
  /** append existing jsonb value of filtered columns with new jsonb value */
  ['robot_product_append_input']: {
    nft_metadata?: GraphQLTypes['jsonb'];
  };
  /** Boolean expression to filter rows from the table "robot.product". All fields are combined with a logical 'AND'. */
  ['robot_product_bool_exp']: {
    _and?: Array<GraphQLTypes['robot_product_bool_exp']>;
    _not?: GraphQLTypes['robot_product_bool_exp'];
    _or?: Array<GraphQLTypes['robot_product_bool_exp']>;
    designers?: GraphQLTypes['robot_product_designer_bool_exp'];
    id?: GraphQLTypes['String_comparison_exp'];
    nft_metadata?: GraphQLTypes['jsonb_comparison_exp'];
    notion_id?: GraphQLTypes['String_comparison_exp'];
    shopify_id?: GraphQLTypes['String_comparison_exp'];
    title?: GraphQLTypes['String_comparison_exp'];
  };
  /** unique or primary key constraints on table "robot.product" */
  ['robot_product_constraint']: robot_product_constraint;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  ['robot_product_delete_at_path_input']: {
    nft_metadata?: Array<string>;
  };
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  ['robot_product_delete_elem_input']: {
    nft_metadata?: number;
  };
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  ['robot_product_delete_key_input']: {
    nft_metadata?: string;
  };
  /** Designer receiving ROBOT rewards


columns and relationships of "robot.product_designer" */
  ['robot_product_designer']: {
    __typename: 'robot_product_designer';
    contribution_share: GraphQLTypes['numeric'];
    designer_name?: string;
    eth_address: string;
    /** An object relationship */
    product: GraphQLTypes['robot_product'];
    product_id: string;
    robot_reward: GraphQLTypes['numeric'];
  };
  /** aggregated selection of "robot.product_designer" */
  ['robot_product_designer_aggregate']: {
    __typename: 'robot_product_designer_aggregate';
    aggregate?: GraphQLTypes['robot_product_designer_aggregate_fields'];
    nodes: Array<GraphQLTypes['robot_product_designer']>;
  };
  /** aggregate fields of "robot.product_designer" */
  ['robot_product_designer_aggregate_fields']: {
    __typename: 'robot_product_designer_aggregate_fields';
    avg?: GraphQLTypes['robot_product_designer_avg_fields'];
    count: number;
    max?: GraphQLTypes['robot_product_designer_max_fields'];
    min?: GraphQLTypes['robot_product_designer_min_fields'];
    stddev?: GraphQLTypes['robot_product_designer_stddev_fields'];
    stddev_pop?: GraphQLTypes['robot_product_designer_stddev_pop_fields'];
    stddev_samp?: GraphQLTypes['robot_product_designer_stddev_samp_fields'];
    sum?: GraphQLTypes['robot_product_designer_sum_fields'];
    var_pop?: GraphQLTypes['robot_product_designer_var_pop_fields'];
    var_samp?: GraphQLTypes['robot_product_designer_var_samp_fields'];
    variance?: GraphQLTypes['robot_product_designer_variance_fields'];
  };
  /** order by aggregate values of table "robot.product_designer" */
  ['robot_product_designer_aggregate_order_by']: {
    avg?: GraphQLTypes['robot_product_designer_avg_order_by'];
    count?: GraphQLTypes['order_by'];
    max?: GraphQLTypes['robot_product_designer_max_order_by'];
    min?: GraphQLTypes['robot_product_designer_min_order_by'];
    stddev?: GraphQLTypes['robot_product_designer_stddev_order_by'];
    stddev_pop?: GraphQLTypes['robot_product_designer_stddev_pop_order_by'];
    stddev_samp?: GraphQLTypes['robot_product_designer_stddev_samp_order_by'];
    sum?: GraphQLTypes['robot_product_designer_sum_order_by'];
    var_pop?: GraphQLTypes['robot_product_designer_var_pop_order_by'];
    var_samp?: GraphQLTypes['robot_product_designer_var_samp_order_by'];
    variance?: GraphQLTypes['robot_product_designer_variance_order_by'];
  };
  /** input type for inserting array relation for remote table "robot.product_designer" */
  ['robot_product_designer_arr_rel_insert_input']: {
    data: Array<GraphQLTypes['robot_product_designer_insert_input']>;
    /** upsert condition */
    on_conflict?: GraphQLTypes['robot_product_designer_on_conflict'];
  };
  /** aggregate avg on columns */
  ['robot_product_designer_avg_fields']: {
    __typename: 'robot_product_designer_avg_fields';
    contribution_share?: number;
    robot_reward?: number;
  };
  /** order by avg() on columns of table "robot.product_designer" */
  ['robot_product_designer_avg_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
    robot_reward?: GraphQLTypes['order_by'];
  };
  /** Boolean expression to filter rows from the table "robot.product_designer". All fields are combined with a logical 'AND'. */
  ['robot_product_designer_bool_exp']: {
    _and?: Array<GraphQLTypes['robot_product_designer_bool_exp']>;
    _not?: GraphQLTypes['robot_product_designer_bool_exp'];
    _or?: Array<GraphQLTypes['robot_product_designer_bool_exp']>;
    contribution_share?: GraphQLTypes['numeric_comparison_exp'];
    designer_name?: GraphQLTypes['String_comparison_exp'];
    eth_address?: GraphQLTypes['String_comparison_exp'];
    product?: GraphQLTypes['robot_product_bool_exp'];
    product_id?: GraphQLTypes['String_comparison_exp'];
    robot_reward?: GraphQLTypes['numeric_comparison_exp'];
  };
  /** unique or primary key constraints on table "robot.product_designer" */
  ['robot_product_designer_constraint']: robot_product_designer_constraint;
  /** input type for incrementing numeric columns in table "robot.product_designer" */
  ['robot_product_designer_inc_input']: {
    contribution_share?: GraphQLTypes['numeric'];
    robot_reward?: GraphQLTypes['numeric'];
  };
  /** input type for inserting data into table "robot.product_designer" */
  ['robot_product_designer_insert_input']: {
    contribution_share?: GraphQLTypes['numeric'];
    designer_name?: string;
    eth_address?: string;
    product?: GraphQLTypes['robot_product_obj_rel_insert_input'];
    product_id?: string;
    robot_reward?: GraphQLTypes['numeric'];
  };
  /** aggregate max on columns */
  ['robot_product_designer_max_fields']: {
    __typename: 'robot_product_designer_max_fields';
    contribution_share?: GraphQLTypes['numeric'];
    designer_name?: string;
    eth_address?: string;
    product_id?: string;
    robot_reward?: GraphQLTypes['numeric'];
  };
  /** order by max() on columns of table "robot.product_designer" */
  ['robot_product_designer_max_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
    designer_name?: GraphQLTypes['order_by'];
    eth_address?: GraphQLTypes['order_by'];
    product_id?: GraphQLTypes['order_by'];
    robot_reward?: GraphQLTypes['order_by'];
  };
  /** aggregate min on columns */
  ['robot_product_designer_min_fields']: {
    __typename: 'robot_product_designer_min_fields';
    contribution_share?: GraphQLTypes['numeric'];
    designer_name?: string;
    eth_address?: string;
    product_id?: string;
    robot_reward?: GraphQLTypes['numeric'];
  };
  /** order by min() on columns of table "robot.product_designer" */
  ['robot_product_designer_min_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
    designer_name?: GraphQLTypes['order_by'];
    eth_address?: GraphQLTypes['order_by'];
    product_id?: GraphQLTypes['order_by'];
    robot_reward?: GraphQLTypes['order_by'];
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
    where?: GraphQLTypes['robot_product_designer_bool_exp'];
  };
  /** Ordering options when selecting data from "robot.product_designer". */
  ['robot_product_designer_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
    designer_name?: GraphQLTypes['order_by'];
    eth_address?: GraphQLTypes['order_by'];
    product?: GraphQLTypes['robot_product_order_by'];
    product_id?: GraphQLTypes['order_by'];
    robot_reward?: GraphQLTypes['order_by'];
  };
  /** primary key columns input for table: robot_product_designer */
  ['robot_product_designer_pk_columns_input']: {
    eth_address: string;
    product_id: string;
  };
  /** select columns of table "robot.product_designer" */
  ['robot_product_designer_select_column']: robot_product_designer_select_column;
  /** input type for updating data in table "robot.product_designer" */
  ['robot_product_designer_set_input']: {
    contribution_share?: GraphQLTypes['numeric'];
    designer_name?: string;
    eth_address?: string;
    product_id?: string;
    robot_reward?: GraphQLTypes['numeric'];
  };
  /** aggregate stddev on columns */
  ['robot_product_designer_stddev_fields']: {
    __typename: 'robot_product_designer_stddev_fields';
    contribution_share?: number;
    robot_reward?: number;
  };
  /** order by stddev() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
    robot_reward?: GraphQLTypes['order_by'];
  };
  /** aggregate stddev_pop on columns */
  ['robot_product_designer_stddev_pop_fields']: {
    __typename: 'robot_product_designer_stddev_pop_fields';
    contribution_share?: number;
    robot_reward?: number;
  };
  /** order by stddev_pop() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_pop_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
    robot_reward?: GraphQLTypes['order_by'];
  };
  /** aggregate stddev_samp on columns */
  ['robot_product_designer_stddev_samp_fields']: {
    __typename: 'robot_product_designer_stddev_samp_fields';
    contribution_share?: number;
    robot_reward?: number;
  };
  /** order by stddev_samp() on columns of table "robot.product_designer" */
  ['robot_product_designer_stddev_samp_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
    robot_reward?: GraphQLTypes['order_by'];
  };
  /** aggregate sum on columns */
  ['robot_product_designer_sum_fields']: {
    __typename: 'robot_product_designer_sum_fields';
    contribution_share?: GraphQLTypes['numeric'];
    robot_reward?: GraphQLTypes['numeric'];
  };
  /** order by sum() on columns of table "robot.product_designer" */
  ['robot_product_designer_sum_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
    robot_reward?: GraphQLTypes['order_by'];
  };
  /** update columns of table "robot.product_designer" */
  ['robot_product_designer_update_column']: robot_product_designer_update_column;
  /** aggregate var_pop on columns */
  ['robot_product_designer_var_pop_fields']: {
    __typename: 'robot_product_designer_var_pop_fields';
    contribution_share?: number;
    robot_reward?: number;
  };
  /** order by var_pop() on columns of table "robot.product_designer" */
  ['robot_product_designer_var_pop_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
    robot_reward?: GraphQLTypes['order_by'];
  };
  /** aggregate var_samp on columns */
  ['robot_product_designer_var_samp_fields']: {
    __typename: 'robot_product_designer_var_samp_fields';
    contribution_share?: number;
    robot_reward?: number;
  };
  /** order by var_samp() on columns of table "robot.product_designer" */
  ['robot_product_designer_var_samp_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
    robot_reward?: GraphQLTypes['order_by'];
  };
  /** aggregate variance on columns */
  ['robot_product_designer_variance_fields']: {
    __typename: 'robot_product_designer_variance_fields';
    contribution_share?: number;
    robot_reward?: number;
  };
  /** order by variance() on columns of table "robot.product_designer" */
  ['robot_product_designer_variance_order_by']: {
    contribution_share?: GraphQLTypes['order_by'];
    robot_reward?: GraphQLTypes['order_by'];
  };
  /** input type for inserting data into table "robot.product" */
  ['robot_product_insert_input']: {
    designers?: GraphQLTypes['robot_product_designer_arr_rel_insert_input'];
    id?: string;
    nft_metadata?: GraphQLTypes['jsonb'];
    notion_id?: string;
    shopify_id?: string;
    title?: string;
  };
  /** aggregate max on columns */
  ['robot_product_max_fields']: {
    __typename: 'robot_product_max_fields';
    id?: string;
    notion_id?: string;
    shopify_id?: string;
    title?: string;
  };
  /** aggregate min on columns */
  ['robot_product_min_fields']: {
    __typename: 'robot_product_min_fields';
    id?: string;
    notion_id?: string;
    shopify_id?: string;
    title?: string;
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
    on_conflict?: GraphQLTypes['robot_product_on_conflict'];
  };
  /** on_conflict condition type for table "robot.product" */
  ['robot_product_on_conflict']: {
    constraint: GraphQLTypes['robot_product_constraint'];
    update_columns: Array<GraphQLTypes['robot_product_update_column']>;
    where?: GraphQLTypes['robot_product_bool_exp'];
  };
  /** Ordering options when selecting data from "robot.product". */
  ['robot_product_order_by']: {
    designers_aggregate?: GraphQLTypes['robot_product_designer_aggregate_order_by'];
    id?: GraphQLTypes['order_by'];
    nft_metadata?: GraphQLTypes['order_by'];
    notion_id?: GraphQLTypes['order_by'];
    shopify_id?: GraphQLTypes['order_by'];
    title?: GraphQLTypes['order_by'];
  };
  /** primary key columns input for table: robot_product */
  ['robot_product_pk_columns_input']: {
    id: string;
  };
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  ['robot_product_prepend_input']: {
    nft_metadata?: GraphQLTypes['jsonb'];
  };
  /** select columns of table "robot.product" */
  ['robot_product_select_column']: robot_product_select_column;
  /** input type for updating data in table "robot.product" */
  ['robot_product_set_input']: {
    id?: string;
    nft_metadata?: GraphQLTypes['jsonb'];
    notion_id?: string;
    shopify_id?: string;
    title?: string;
  };
  /** update columns of table "robot.product" */
  ['robot_product_update_column']: robot_product_update_column;
  /** columns and relationships of "shop.api_users" */
  ['shop_api_users']: {
    __typename: 'shop_api_users';
    password_hash: string;
    username: string;
  };
  /** aggregated selection of "shop.api_users" */
  ['shop_api_users_aggregate']: {
    __typename: 'shop_api_users_aggregate';
    aggregate?: GraphQLTypes['shop_api_users_aggregate_fields'];
    nodes: Array<GraphQLTypes['shop_api_users']>;
  };
  /** aggregate fields of "shop.api_users" */
  ['shop_api_users_aggregate_fields']: {
    __typename: 'shop_api_users_aggregate_fields';
    count: number;
    max?: GraphQLTypes['shop_api_users_max_fields'];
    min?: GraphQLTypes['shop_api_users_min_fields'];
  };
  /** Boolean expression to filter rows from the table "shop.api_users". All fields are combined with a logical 'AND'. */
  ['shop_api_users_bool_exp']: {
    _and?: Array<GraphQLTypes['shop_api_users_bool_exp']>;
    _not?: GraphQLTypes['shop_api_users_bool_exp'];
    _or?: Array<GraphQLTypes['shop_api_users_bool_exp']>;
    password_hash?: GraphQLTypes['String_comparison_exp'];
    username?: GraphQLTypes['String_comparison_exp'];
  };
  /** unique or primary key constraints on table "shop.api_users" */
  ['shop_api_users_constraint']: shop_api_users_constraint;
  /** input type for inserting data into table "shop.api_users" */
  ['shop_api_users_insert_input']: {
    password_hash?: string;
    username?: string;
  };
  /** aggregate max on columns */
  ['shop_api_users_max_fields']: {
    __typename: 'shop_api_users_max_fields';
    password_hash?: string;
    username?: string;
  };
  /** aggregate min on columns */
  ['shop_api_users_min_fields']: {
    __typename: 'shop_api_users_min_fields';
    password_hash?: string;
    username?: string;
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
    where?: GraphQLTypes['shop_api_users_bool_exp'];
  };
  /** Ordering options when selecting data from "shop.api_users". */
  ['shop_api_users_order_by']: {
    password_hash?: GraphQLTypes['order_by'];
    username?: GraphQLTypes['order_by'];
  };
  /** primary key columns input for table: shop_api_users */
  ['shop_api_users_pk_columns_input']: {
    username: string;
  };
  /** select columns of table "shop.api_users" */
  ['shop_api_users_select_column']: shop_api_users_select_column;
  /** input type for updating data in table "shop.api_users" */
  ['shop_api_users_set_input']: {
    password_hash?: string;
    username?: string;
  };
  /** update columns of table "shop.api_users" */
  ['shop_api_users_update_column']: shop_api_users_update_column;
  /** columns and relationships of "shop.product_locks" */
  ['shop_product_locks']: {
    __typename: 'shop_product_locks';
    access_code: string;
    created_at?: GraphQLTypes['timestamptz'];
    customer_eth_address?: string;
    lock_id: string;
  };
  /** aggregated selection of "shop.product_locks" */
  ['shop_product_locks_aggregate']: {
    __typename: 'shop_product_locks_aggregate';
    aggregate?: GraphQLTypes['shop_product_locks_aggregate_fields'];
    nodes: Array<GraphQLTypes['shop_product_locks']>;
  };
  /** aggregate fields of "shop.product_locks" */
  ['shop_product_locks_aggregate_fields']: {
    __typename: 'shop_product_locks_aggregate_fields';
    count: number;
    max?: GraphQLTypes['shop_product_locks_max_fields'];
    min?: GraphQLTypes['shop_product_locks_min_fields'];
  };
  /** Boolean expression to filter rows from the table "shop.product_locks". All fields are combined with a logical 'AND'. */
  ['shop_product_locks_bool_exp']: {
    _and?: Array<GraphQLTypes['shop_product_locks_bool_exp']>;
    _not?: GraphQLTypes['shop_product_locks_bool_exp'];
    _or?: Array<GraphQLTypes['shop_product_locks_bool_exp']>;
    access_code?: GraphQLTypes['String_comparison_exp'];
    created_at?: GraphQLTypes['timestamptz_comparison_exp'];
    customer_eth_address?: GraphQLTypes['String_comparison_exp'];
    lock_id?: GraphQLTypes['String_comparison_exp'];
  };
  /** unique or primary key constraints on table "shop.product_locks" */
  ['shop_product_locks_constraint']: shop_product_locks_constraint;
  /** input type for inserting data into table "shop.product_locks" */
  ['shop_product_locks_insert_input']: {
    access_code?: string;
    created_at?: GraphQLTypes['timestamptz'];
    customer_eth_address?: string;
    lock_id?: string;
  };
  /** aggregate max on columns */
  ['shop_product_locks_max_fields']: {
    __typename: 'shop_product_locks_max_fields';
    access_code?: string;
    created_at?: GraphQLTypes['timestamptz'];
    customer_eth_address?: string;
    lock_id?: string;
  };
  /** aggregate min on columns */
  ['shop_product_locks_min_fields']: {
    __typename: 'shop_product_locks_min_fields';
    access_code?: string;
    created_at?: GraphQLTypes['timestamptz'];
    customer_eth_address?: string;
    lock_id?: string;
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
    where?: GraphQLTypes['shop_product_locks_bool_exp'];
  };
  /** Ordering options when selecting data from "shop.product_locks". */
  ['shop_product_locks_order_by']: {
    access_code?: GraphQLTypes['order_by'];
    created_at?: GraphQLTypes['order_by'];
    customer_eth_address?: GraphQLTypes['order_by'];
    lock_id?: GraphQLTypes['order_by'];
  };
  /** primary key columns input for table: shop_product_locks */
  ['shop_product_locks_pk_columns_input']: {
    access_code: string;
    lock_id: string;
  };
  /** select columns of table "shop.product_locks" */
  ['shop_product_locks_select_column']: shop_product_locks_select_column;
  /** input type for updating data in table "shop.product_locks" */
  ['shop_product_locks_set_input']: {
    access_code?: string;
    created_at?: GraphQLTypes['timestamptz'];
    customer_eth_address?: string;
    lock_id?: string;
  };
  /** update columns of table "shop.product_locks" */
  ['shop_product_locks_update_column']: shop_product_locks_update_column;
  ['subscription_root']: {
    __typename: 'subscription_root';
    /** fetch data from the table: "contribution_votes" */
    contribution_votes: Array<GraphQLTypes['contribution_votes']>;
    /** fetch aggregated fields from the table: "contribution_votes" */
    contribution_votes_aggregate: GraphQLTypes['contribution_votes_aggregate'];
    /** fetch data from the table: "contribution_votes" using primary key columns */
    contribution_votes_by_pk?: GraphQLTypes['contribution_votes'];
    /** fetch data from the table: "contributions" */
    contributions: Array<GraphQLTypes['contributions']>;
    /** fetch aggregated fields from the table: "contributions" */
    contributions_aggregate: GraphQLTypes['contributions_aggregate'];
    /** fetch data from the table: "contributions" using primary key columns */
    contributions_by_pk?: GraphQLTypes['contributions'];
    /** fetch data from the table: "contributors" */
    contributors: Array<GraphQLTypes['contributors']>;
    /** An aggregate relationship */
    contributors_aggregate: GraphQLTypes['contributors_aggregate'];
    /** fetch data from the table: "contributors" using primary key columns */
    contributors_by_pk?: GraphQLTypes['contributors'];
    /** fetch data from the table: "robot.order" */
    robot_order: Array<GraphQLTypes['robot_order']>;
    /** fetch aggregated fields from the table: "robot.order" */
    robot_order_aggregate: GraphQLTypes['robot_order_aggregate'];
    /** fetch data from the table: "robot.order" using primary key columns */
    robot_order_by_pk?: GraphQLTypes['robot_order'];
    /** fetch data from the table: "robot.product" */
    robot_product: Array<GraphQLTypes['robot_product']>;
    /** fetch aggregated fields from the table: "robot.product" */
    robot_product_aggregate: GraphQLTypes['robot_product_aggregate'];
    /** fetch data from the table: "robot.product" using primary key columns */
    robot_product_by_pk?: GraphQLTypes['robot_product'];
    /** fetch data from the table: "robot.product_designer" */
    robot_product_designer: Array<GraphQLTypes['robot_product_designer']>;
    /** fetch aggregated fields from the table: "robot.product_designer" */
    robot_product_designer_aggregate: GraphQLTypes['robot_product_designer_aggregate'];
    /** fetch data from the table: "robot.product_designer" using primary key columns */
    robot_product_designer_by_pk?: GraphQLTypes['robot_product_designer'];
    /** fetch data from the table: "shop.api_users" */
    shop_api_users: Array<GraphQLTypes['shop_api_users']>;
    /** fetch aggregated fields from the table: "shop.api_users" */
    shop_api_users_aggregate: GraphQLTypes['shop_api_users_aggregate'];
    /** fetch data from the table: "shop.api_users" using primary key columns */
    shop_api_users_by_pk?: GraphQLTypes['shop_api_users'];
    /** fetch data from the table: "shop.product_locks" */
    shop_product_locks: Array<GraphQLTypes['shop_product_locks']>;
    /** fetch aggregated fields from the table: "shop.product_locks" */
    shop_product_locks_aggregate: GraphQLTypes['shop_product_locks_aggregate'];
    /** fetch data from the table: "shop.product_locks" using primary key columns */
    shop_product_locks_by_pk?: GraphQLTypes['shop_product_locks'];
    /** fetch data from the table: "users" */
    users: Array<GraphQLTypes['users']>;
    /** fetch aggregated fields from the table: "users" */
    users_aggregate: GraphQLTypes['users_aggregate'];
    /** fetch data from the table: "users" using primary key columns */
    users_by_pk?: GraphQLTypes['users'];
  };
  ['timestamptz']: any;
  /** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
  ['timestamptz_comparison_exp']: {
    _eq?: GraphQLTypes['timestamptz'];
    _gt?: GraphQLTypes['timestamptz'];
    _gte?: GraphQLTypes['timestamptz'];
    _in?: Array<GraphQLTypes['timestamptz']>;
    _is_null?: boolean;
    _lt?: GraphQLTypes['timestamptz'];
    _lte?: GraphQLTypes['timestamptz'];
    _neq?: GraphQLTypes['timestamptz'];
    _nin?: Array<GraphQLTypes['timestamptz']>;
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
    aggregate?: GraphQLTypes['users_aggregate_fields'];
    nodes: Array<GraphQLTypes['users']>;
  };
  /** aggregate fields of "users" */
  ['users_aggregate_fields']: {
    __typename: 'users_aggregate_fields';
    count: number;
    max?: GraphQLTypes['users_max_fields'];
    min?: GraphQLTypes['users_min_fields'];
  };
  /** Boolean expression to filter rows from the table "users". All fields are combined with a logical 'AND'. */
  ['users_bool_exp']: {
    _and?: Array<GraphQLTypes['users_bool_exp']>;
    _not?: GraphQLTypes['users_bool_exp'];
    _or?: Array<GraphQLTypes['users_bool_exp']>;
    eth_address?: GraphQLTypes['String_comparison_exp'];
    id?: GraphQLTypes['uuid_comparison_exp'];
    name?: GraphQLTypes['String_comparison_exp'];
  };
  /** unique or primary key constraints on table "users" */
  ['users_constraint']: users_constraint;
  /** input type for inserting data into table "users" */
  ['users_insert_input']: {
    eth_address?: string;
    id?: GraphQLTypes['uuid'];
    name?: string;
  };
  /** aggregate max on columns */
  ['users_max_fields']: {
    __typename: 'users_max_fields';
    eth_address?: string;
    id?: GraphQLTypes['uuid'];
    name?: string;
  };
  /** aggregate min on columns */
  ['users_min_fields']: {
    __typename: 'users_min_fields';
    eth_address?: string;
    id?: GraphQLTypes['uuid'];
    name?: string;
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
    on_conflict?: GraphQLTypes['users_on_conflict'];
  };
  /** on_conflict condition type for table "users" */
  ['users_on_conflict']: {
    constraint: GraphQLTypes['users_constraint'];
    update_columns: Array<GraphQLTypes['users_update_column']>;
    where?: GraphQLTypes['users_bool_exp'];
  };
  /** Ordering options when selecting data from "users". */
  ['users_order_by']: {
    eth_address?: GraphQLTypes['order_by'];
    id?: GraphQLTypes['order_by'];
    name?: GraphQLTypes['order_by'];
  };
  /** primary key columns input for table: users */
  ['users_pk_columns_input']: {
    id: GraphQLTypes['uuid'];
  };
  /** select columns of table "users" */
  ['users_select_column']: users_select_column;
  /** input type for updating data in table "users" */
  ['users_set_input']: {
    eth_address?: string;
    id?: GraphQLTypes['uuid'];
    name?: string;
  };
  /** update columns of table "users" */
  ['users_update_column']: users_update_column;
  ['uuid']: any;
  /** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
  ['uuid_comparison_exp']: {
    _eq?: GraphQLTypes['uuid'];
    _gt?: GraphQLTypes['uuid'];
    _gte?: GraphQLTypes['uuid'];
    _in?: Array<GraphQLTypes['uuid']>;
    _is_null?: boolean;
    _lt?: GraphQLTypes['uuid'];
    _lte?: GraphQLTypes['uuid'];
    _neq?: GraphQLTypes['uuid'];
    _nin?: Array<GraphQLTypes['uuid']>;
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
/** column ordering options */
export const enum order_by {
  asc = 'asc',
  asc_nulls_first = 'asc_nulls_first',
  asc_nulls_last = 'asc_nulls_last',
  desc = 'desc',
  desc_nulls_first = 'desc_nulls_first',
  desc_nulls_last = 'desc_nulls_last',
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
  product_notion_id_key = 'product_notion_id_key',
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
  notion_id = 'notion_id',
  shopify_id = 'shopify_id',
  title = 'title',
}
/** update columns of table "robot.product" */
export const enum robot_product_update_column {
  id = 'id',
  nft_metadata = 'nft_metadata',
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
export class GraphQLError extends Error {
  constructor(public response: GraphQLResponse) {
    super('');
    console.error(response);
  }
  toString() {
    return 'GraphQL Response Error';
  }
}

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

type WithTypeNameValue<T> = T & {
  __typename?: boolean;
};
type AliasType<T> = WithTypeNameValue<T> & {
  __alias?: Record<string, WithTypeNameValue<T>>;
};
export interface GraphQLResponse {
  data?: Record<string, any>;
  errors?: Array<{
    message: string;
  }>;
}
type DeepAnify<T> = {
  [P in keyof T]?: any;
};
type IsPayLoad<T> = T extends [any, infer PayLoad] ? PayLoad : T;
type IsArray<T, U> = T extends Array<infer R>
  ? InputType<R, U>[]
  : InputType<T, U>;
type FlattenArray<T> = T extends Array<infer R> ? R : T;

type IsInterfaced<SRC extends DeepAnify<DST>, DST> = FlattenArray<SRC> extends
  | ZEUS_INTERFACES
  | ZEUS_UNIONS
  ? {
      [P in keyof SRC]: SRC[P] extends '__union' & infer R
        ? P extends keyof DST
          ? IsArray<
              R,
              '__typename' extends keyof DST
                ? DST[P] & { __typename: true }
                : DST[P]
            >
          : {}
        : never;
    }[keyof DST] &
      {
        [P in keyof Omit<
          Pick<
            SRC,
            {
              [P in keyof DST]: SRC[P] extends '__union' & infer R ? never : P;
            }[keyof DST]
          >,
          '__typename'
        >]: IsPayLoad<DST[P]> extends boolean
          ? SRC[P]
          : IsArray<SRC[P], DST[P]>;
      }
  : {
      [P in keyof Pick<SRC, keyof DST>]: IsPayLoad<DST[P]> extends boolean
        ? SRC[P]
        : IsArray<SRC[P], DST[P]>;
    };

export type MapType<SRC, DST> = SRC extends DeepAnify<DST>
  ? IsInterfaced<SRC, DST>
  : never;
export type InputType<SRC, DST> = IsPayLoad<DST> extends { __alias: infer R }
  ? {
      [P in keyof R]: MapType<SRC, R[P]>;
    } &
      MapType<SRC, Omit<IsPayLoad<DST>, '__alias'>>
  : MapType<SRC, IsPayLoad<DST>>;
type Func<P extends any[], R> = (...args: P) => R;
type AnyFunc = Func<any, any>;
export type ArgsType<F extends AnyFunc> = F extends Func<infer P, any>
  ? P
  : never;
export type OperationOptions = {
  variables?: Record<string, any>;
  operationName?: string;
};
export type SubscriptionToGraphQL<Z, T> = {
  ws: WebSocket;
  on: (fn: (args: InputType<T, Z>) => void) => void;
  off: (
    fn: (e: {
      data?: InputType<T, Z>;
      code?: number;
      reason?: string;
      message?: string;
    }) => void,
  ) => void;
  error: (
    fn: (e: { data?: InputType<T, Z>; errors?: string[] }) => void,
  ) => void;
  open: () => void;
};
export type SelectionFunction<V> = <T>(t: T | V) => T;
export type fetchOptions = ArgsType<typeof fetch>;
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

export const ZeusSelect = <T>() => ((t: any) => t) as SelectionFunction<T>;

export const ScalarResolver = (scalar: string, value: any) => {
  switch (scalar) {
    case 'String':
      return `${JSON.stringify(value)}`;
    case 'Int':
      return `${value}`;
    case 'Float':
      return `${value}`;
    case 'Boolean':
      return `${value}`;
    case 'ID':
      return `"${value}"`;
    case 'enum':
      return `${value}`;
    case 'scalar':
      return `${value}`;
    default:
      return false;
  }
};

export const TypesPropsResolver = ({
  value,
  type,
  name,
  key,
  blockArrays,
}: {
  value: any;
  type: string;
  name: string;
  key?: string;
  blockArrays?: boolean;
}): string => {
  if (value === null) {
    return `null`;
  }
  let resolvedValue = AllTypesProps[type][name];
  if (key) {
    resolvedValue = resolvedValue[key];
  }
  if (!resolvedValue) {
    throw new Error(`Cannot resolve ${type} ${name}${key ? ` ${key}` : ''}`);
  }
  const typeResolved = resolvedValue.type;
  const isArray = resolvedValue.array;
  const isArrayRequired = resolvedValue.arrayRequired;
  if (typeof value === 'string' && value.startsWith(`ZEUS_VAR$`)) {
    const isRequired = resolvedValue.required ? '!' : '';
    let t = `${typeResolved}`;
    if (isArray) {
      if (isRequired) {
        t = `${t}!`;
      }
      t = `[${t}]`;
      if (isArrayRequired) {
        t = `${t}!`;
      }
    } else {
      if (isRequired) {
        t = `${t}!`;
      }
    }
    return `\$${value.split(`ZEUS_VAR$`)[1]}__ZEUS_VAR__${t}`;
  }
  if (isArray && !blockArrays) {
    return `[${value
      .map((v: any) =>
        TypesPropsResolver({ value: v, type, name, key, blockArrays: true }),
      )
      .join(',')}]`;
  }
  const reslovedScalar = ScalarResolver(typeResolved, value);
  if (!reslovedScalar) {
    const resolvedType = AllTypesProps[typeResolved];
    if (typeof resolvedType === 'object') {
      const argsKeys = Object.keys(resolvedType);
      return `{${argsKeys
        .filter((ak) => value[ak] !== undefined)
        .map(
          (ak) =>
            `${ak}:${TypesPropsResolver({
              value: value[ak],
              type: typeResolved,
              name: ak,
            })}`,
        )}}`;
    }
    return ScalarResolver(AllTypesProps[typeResolved], value) as string;
  }
  return reslovedScalar;
};

const isArrayFunction = (parent: string[], a: any[]) => {
  const [values, r] = a;
  const [mainKey, key, ...keys] = parent;
  const keyValues = Object.keys(values).filter(
    (k) => typeof values[k] !== 'undefined',
  );

  if (!keys.length) {
    return keyValues.length > 0
      ? `(${keyValues
          .map(
            (v) =>
              `${v}:${TypesPropsResolver({
                value: values[v],
                type: mainKey,
                name: key,
                key: v,
              })}`,
          )
          .join(',')})${r ? traverseToSeekArrays(parent, r) : ''}`
      : traverseToSeekArrays(parent, r);
  }

  const [typeResolverKey] = keys.splice(keys.length - 1, 1);
  let valueToResolve = ReturnTypes[mainKey][key];
  for (const k of keys) {
    valueToResolve = ReturnTypes[valueToResolve][k];
  }

  const argumentString =
    keyValues.length > 0
      ? `(${keyValues
          .map(
            (v) =>
              `${v}:${TypesPropsResolver({
                value: values[v],
                type: valueToResolve,
                name: typeResolverKey,
                key: v,
              })}`,
          )
          .join(',')})${r ? traverseToSeekArrays(parent, r) : ''}`
      : traverseToSeekArrays(parent, r);
  return argumentString;
};

const resolveKV = (
  k: string,
  v: boolean | string | { [x: string]: boolean | string },
) =>
  typeof v === 'boolean'
    ? k
    : typeof v === 'object'
    ? `${k}{${objectToTree(v)}}`
    : `${k}${v}`;

const objectToTree = (o: { [x: string]: boolean | string }): string =>
  `{${Object.keys(o)
    .map((k) => `${resolveKV(k, o[k])}`)
    .join(' ')}}`;

const traverseToSeekArrays = (parent: string[], a?: any): string => {
  if (!a) return '';
  if (Object.keys(a).length === 0) {
    return '';
  }
  let b: Record<string, any> = {};
  if (Array.isArray(a)) {
    return isArrayFunction([...parent], a);
  } else {
    if (typeof a === 'object') {
      Object.keys(a)
        .filter((k) => typeof a[k] !== 'undefined')
        .forEach((k) => {
          if (k === '__alias') {
            Object.keys(a[k]).forEach((aliasKey) => {
              const aliasOperations = a[k][aliasKey];
              const aliasOperationName = Object.keys(aliasOperations)[0];
              const aliasOperation = aliasOperations[aliasOperationName];
              b[
                `${aliasOperationName}__alias__${aliasKey}: ${aliasOperationName}`
              ] = traverseToSeekArrays(
                [...parent, aliasOperationName],
                aliasOperation,
              );
            });
          } else {
            b[k] = traverseToSeekArrays([...parent, k], a[k]);
          }
        });
    } else {
      return '';
    }
  }
  return objectToTree(b);
};

const buildQuery = (type: string, a?: Record<any, any>) =>
  traverseToSeekArrays([type], a);

const inspectVariables = (query: string) => {
  const regex = /\$\b\w*__ZEUS_VAR__\[?[^!^\]^\s^,^\)^\}]*[!]?[\]]?[!]?/g;
  let result;
  const AllVariables: string[] = [];
  while ((result = regex.exec(query))) {
    if (AllVariables.includes(result[0])) {
      continue;
    }
    AllVariables.push(result[0]);
  }
  if (!AllVariables.length) {
    return query;
  }
  let filteredQuery = query;
  AllVariables.forEach((variable) => {
    while (filteredQuery.includes(variable)) {
      filteredQuery = filteredQuery.replace(
        variable,
        variable.split('__ZEUS_VAR__')[0],
      );
    }
  });
  return `(${AllVariables.map((a) => a.split('__ZEUS_VAR__'))
    .map(([variableName, variableType]) => `${variableName}:${variableType}`)
    .join(', ')})${filteredQuery}`;
};

export const queryConstruct =
  (
    t: 'query' | 'mutation' | 'subscription',
    tName: string,
    operationName?: string,
  ) =>
  (o: Record<any, any>) =>
    `${t.toLowerCase()}${
      operationName ? ' ' + operationName : ''
    }${inspectVariables(buildQuery(tName, o))}`;

export const fullChainConstruct =
  (fn: FetchFunction) =>
  (t: 'query' | 'mutation' | 'subscription', tName: string) =>
  (o: Record<any, any>, options?: OperationOptions) =>
    fn(
      queryConstruct(t, tName, options?.operationName)(o),
      options?.variables,
    ).then((r: any) => {
      seekForAliases(r);
      return r;
    });

export const fullSubscriptionConstruct =
  (fn: SubscriptionFunction) =>
  (t: 'query' | 'mutation' | 'subscription', tName: string) =>
  (o: Record<any, any>, options?: OperationOptions) =>
    fn(queryConstruct(t, tName, options?.operationName)(o));

const seekForAliases = (response: any) => {
  const traverseAlias = (value: any) => {
    if (Array.isArray(value)) {
      value.forEach(seekForAliases);
    } else {
      if (typeof value === 'object') {
        seekForAliases(value);
      }
    }
  };
  if (typeof response === 'object' && response) {
    const keys = Object.keys(response);
    if (keys.length < 1) {
      return;
    }
    keys.forEach((k) => {
      const value = response[k];
      if (k.indexOf('__alias__') !== -1) {
        const [operation, alias] = k.split('__alias__');
        response[alias] = {
          [operation]: value,
        };
        delete response[k];
      }
      traverseAlias(value);
    });
  }
};

export const $ = (t: TemplateStringsArray): any => `ZEUS_VAR$${t.join('')}`;

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

const handleFetchResponse = (
  response: Parameters<
    Extract<Parameters<ReturnType<typeof fetch>['then']>[0], Function>
  >[0],
): Promise<GraphQLResponse> => {
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
  (query: string, variables: Record<string, any> = {}) => {
    let fetchFunction;
    let queryString = query;
    let fetchOptions = options[1] || {};
    try {
      fetchFunction = require('node-fetch');
    } catch (error) {
      throw new Error(
        "Please install 'node-fetch' to use zeus in nodejs environment",
      );
    }
    if (fetchOptions.method && fetchOptions.method === 'GET') {
      try {
        queryString = require('querystring').stringify(query);
      } catch (error) {
        throw new Error(
          "Something gone wrong 'querystring' is a part of nodejs environment",
        );
      }
      return fetchFunction(`${options[0]}?query=${queryString}`, fetchOptions)
        .then(handleFetchResponse)
        .then((response: GraphQLResponse) => {
          if (response.errors) {
            throw new GraphQLError(response);
          }
          return response.data;
        });
    }
    return fetchFunction(`${options[0]}`, {
      body: JSON.stringify({ query: queryString, variables }),
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
    const WebSocket = require('ws');
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
            if (data) {
              seekForAliases(data);
            }
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
    throw new Error('No websockets implemented. Please install ws');
  }
};

const allOperations = {
  query: 'query_root',
  mutation: 'mutation_root',
  subscription: 'subscription_root',
};

export type GenericOperation<O> = O extends 'query'
  ? 'query_root'
  : O extends 'mutation'
  ? 'mutation_root'
  : 'subscription_root';

export const Thunder =
  (fn: FetchFunction) =>
  <
    O extends 'query' | 'mutation' | 'subscription',
    R extends keyof ValueTypes = GenericOperation<O>,
  >(
    operation: O,
  ) =>
  <Z extends ValueTypes[R]>(o: Z | ValueTypes[R], ops?: OperationOptions) =>
    fullChainConstruct(fn)(operation, allOperations[operation])(
      o as any,
      ops,
    ) as Promise<InputType<GraphQLTypes[R], Z>>;

export const Chain = (...options: chainOptions) => Thunder(apiFetch(options));

export const SubscriptionThunder =
  (fn: SubscriptionFunction) =>
  <
    O extends 'query' | 'mutation' | 'subscription',
    R extends keyof ValueTypes = GenericOperation<O>,
  >(
    operation: O,
  ) =>
  <Z extends ValueTypes[R]>(o: Z | ValueTypes[R], ops?: OperationOptions) =>
    fullSubscriptionConstruct(fn)(operation, allOperations[operation])(
      o as any,
      ops,
    ) as SubscriptionToGraphQL<Z, GraphQLTypes[R]>;

export const Subscription = (...options: chainOptions) =>
  SubscriptionThunder(apiSubscription(options));
export const Zeus = <
  Z extends ValueTypes[R],
  O extends 'query' | 'mutation' | 'subscription',
  R extends keyof ValueTypes = GenericOperation<O>,
>(
  operation: O,
  o: Z | ValueTypes[R],
  operationName?: string,
) =>
  queryConstruct(operation, allOperations[operation], operationName)(o as any);
export const Selector = <T extends keyof ValueTypes>(key: T) =>
  ZeusSelect<ValueTypes[T]>();

export const Gql = Chain('http://localhost:8080/v1/graphql');
