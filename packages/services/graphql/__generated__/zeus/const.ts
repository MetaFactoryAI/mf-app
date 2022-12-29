/* eslint-disable */

export const AllTypesProps: Record<string, any> = {
  Boolean_comparison_exp: {},
  Int_comparison_exp: {},
  String_comparison_exp: {},
  bigint: `scalar.bigint` as const,
  bigint_comparison_exp: {
    _eq: 'bigint',
    _gt: 'bigint',
    _gte: 'bigint',
    _in: 'bigint',
    _lt: 'bigint',
    _lte: 'bigint',
    _neq: 'bigint',
    _nin: 'bigint',
  },
  contribution_votes_aggregate_bool_exp: {
    count: 'contribution_votes_aggregate_bool_exp_count',
  },
  contribution_votes_aggregate_bool_exp_count: {
    arguments: 'contribution_votes_select_column',
    filter: 'contribution_votes_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  contribution_votes_aggregate_fields: {
    count: {
      columns: 'contribution_votes_select_column',
    },
  },
  contribution_votes_aggregate_order_by: {
    count: 'order_by',
    max: 'contribution_votes_max_order_by',
    min: 'contribution_votes_min_order_by',
  },
  contribution_votes_arr_rel_insert_input: {
    data: 'contribution_votes_insert_input',
    on_conflict: 'contribution_votes_on_conflict',
  },
  contribution_votes_bool_exp: {
    _and: 'contribution_votes_bool_exp',
    _not: 'contribution_votes_bool_exp',
    _or: 'contribution_votes_bool_exp',
    contribution: 'contributions_bool_exp',
    contribution_id: 'uuid_comparison_exp',
    created_at: 'timestamptz_comparison_exp',
    rating: 'String_comparison_exp',
    user: 'users_bool_exp',
    user_id: 'uuid_comparison_exp',
  },
  contribution_votes_constraint: 'enum' as const,
  contribution_votes_insert_input: {
    contribution: 'contributions_obj_rel_insert_input',
    contribution_id: 'uuid',
    created_at: 'timestamptz',
    user: 'users_obj_rel_insert_input',
    user_id: 'uuid',
  },
  contribution_votes_max_order_by: {
    contribution_id: 'order_by',
    created_at: 'order_by',
    rating: 'order_by',
    user_id: 'order_by',
  },
  contribution_votes_min_order_by: {
    contribution_id: 'order_by',
    created_at: 'order_by',
    rating: 'order_by',
    user_id: 'order_by',
  },
  contribution_votes_on_conflict: {
    constraint: 'contribution_votes_constraint',
    update_columns: 'contribution_votes_update_column',
    where: 'contribution_votes_bool_exp',
  },
  contribution_votes_order_by: {
    contribution: 'contributions_order_by',
    contribution_id: 'order_by',
    created_at: 'order_by',
    rating: 'order_by',
    user: 'users_order_by',
    user_id: 'order_by',
  },
  contribution_votes_pk_columns_input: {
    contribution_id: 'uuid',
    user_id: 'uuid',
  },
  contribution_votes_select_column: 'enum' as const,
  contribution_votes_set_input: {
    contribution_id: 'uuid',
    created_at: 'timestamptz',
    user_id: 'uuid',
  },
  contribution_votes_stream_cursor_input: {
    initial_value: 'contribution_votes_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  contribution_votes_stream_cursor_value_input: {
    contribution_id: 'uuid',
    created_at: 'timestamptz',
    user_id: 'uuid',
  },
  contribution_votes_update_column: 'enum' as const,
  contribution_votes_updates: {
    _set: 'contribution_votes_set_input',
    where: 'contribution_votes_bool_exp',
  },
  contributions: {
    contributors: {
      distinct_on: 'contributors_select_column',
      order_by: 'contributors_order_by',
      where: 'contributors_bool_exp',
    },
    contributors_aggregate: {
      distinct_on: 'contributors_select_column',
      order_by: 'contributors_order_by',
      where: 'contributors_bool_exp',
    },
    votes: {
      distinct_on: 'contribution_votes_select_column',
      order_by: 'contribution_votes_order_by',
      where: 'contribution_votes_bool_exp',
    },
    votes_aggregate: {
      distinct_on: 'contribution_votes_select_column',
      order_by: 'contribution_votes_order_by',
      where: 'contribution_votes_bool_exp',
    },
  },
  contributions_aggregate_fields: {
    count: {
      columns: 'contributions_select_column',
    },
  },
  contributions_bool_exp: {
    _and: 'contributions_bool_exp',
    _not: 'contributions_bool_exp',
    _or: 'contributions_bool_exp',
    artifact: 'String_comparison_exp',
    author: 'users_bool_exp',
    category: 'String_comparison_exp',
    contributors: 'contributors_bool_exp',
    contributors_aggregate: 'contributors_aggregate_bool_exp',
    created_at: 'timestamptz_comparison_exp',
    created_by: 'uuid_comparison_exp',
    date: 'date_comparison_exp',
    description: 'String_comparison_exp',
    effort: 'String_comparison_exp',
    id: 'uuid_comparison_exp',
    impact: 'String_comparison_exp',
    title: 'String_comparison_exp',
    votes: 'contribution_votes_bool_exp',
    votes_aggregate: 'contribution_votes_aggregate_bool_exp',
    weight: 'Int_comparison_exp',
  },
  contributions_constraint: 'enum' as const,
  contributions_inc_input: {},
  contributions_insert_input: {
    author: 'users_obj_rel_insert_input',
    contributors: 'contributors_arr_rel_insert_input',
    created_at: 'timestamptz',
    created_by: 'uuid',
    date: 'date',
    id: 'uuid',
    votes: 'contribution_votes_arr_rel_insert_input',
  },
  contributions_obj_rel_insert_input: {
    data: 'contributions_insert_input',
    on_conflict: 'contributions_on_conflict',
  },
  contributions_on_conflict: {
    constraint: 'contributions_constraint',
    update_columns: 'contributions_update_column',
    where: 'contributions_bool_exp',
  },
  contributions_order_by: {
    artifact: 'order_by',
    author: 'users_order_by',
    category: 'order_by',
    contributors_aggregate: 'contributors_aggregate_order_by',
    created_at: 'order_by',
    created_by: 'order_by',
    date: 'order_by',
    description: 'order_by',
    effort: 'order_by',
    id: 'order_by',
    impact: 'order_by',
    title: 'order_by',
    votes_aggregate: 'contribution_votes_aggregate_order_by',
    weight: 'order_by',
  },
  contributions_pk_columns_input: {
    id: 'uuid',
  },
  contributions_select_column: 'enum' as const,
  contributions_set_input: {
    created_at: 'timestamptz',
    created_by: 'uuid',
    date: 'date',
    id: 'uuid',
  },
  contributions_stream_cursor_input: {
    initial_value: 'contributions_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  contributions_stream_cursor_value_input: {
    created_at: 'timestamptz',
    created_by: 'uuid',
    date: 'date',
    id: 'uuid',
  },
  contributions_update_column: 'enum' as const,
  contributions_updates: {
    _inc: 'contributions_inc_input',
    _set: 'contributions_set_input',
    where: 'contributions_bool_exp',
  },
  contributors_aggregate_bool_exp: {
    count: 'contributors_aggregate_bool_exp_count',
  },
  contributors_aggregate_bool_exp_count: {
    arguments: 'contributors_select_column',
    filter: 'contributors_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  contributors_aggregate_fields: {
    count: {
      columns: 'contributors_select_column',
    },
  },
  contributors_aggregate_order_by: {
    avg: 'contributors_avg_order_by',
    count: 'order_by',
    max: 'contributors_max_order_by',
    min: 'contributors_min_order_by',
    stddev: 'contributors_stddev_order_by',
    stddev_pop: 'contributors_stddev_pop_order_by',
    stddev_samp: 'contributors_stddev_samp_order_by',
    sum: 'contributors_sum_order_by',
    var_pop: 'contributors_var_pop_order_by',
    var_samp: 'contributors_var_samp_order_by',
    variance: 'contributors_variance_order_by',
  },
  contributors_arr_rel_insert_input: {
    data: 'contributors_insert_input',
    on_conflict: 'contributors_on_conflict',
  },
  contributors_avg_order_by: {
    contribution_share: 'order_by',
  },
  contributors_bool_exp: {
    _and: 'contributors_bool_exp',
    _not: 'contributors_bool_exp',
    _or: 'contributors_bool_exp',
    contribution: 'contributions_bool_exp',
    contribution_id: 'uuid_comparison_exp',
    contribution_share: 'numeric_comparison_exp',
    user: 'users_bool_exp',
    user_id: 'uuid_comparison_exp',
  },
  contributors_constraint: 'enum' as const,
  contributors_inc_input: {
    contribution_share: 'numeric',
  },
  contributors_insert_input: {
    contribution: 'contributions_obj_rel_insert_input',
    contribution_id: 'uuid',
    contribution_share: 'numeric',
    user: 'users_obj_rel_insert_input',
    user_id: 'uuid',
  },
  contributors_max_order_by: {
    contribution_id: 'order_by',
    contribution_share: 'order_by',
    user_id: 'order_by',
  },
  contributors_min_order_by: {
    contribution_id: 'order_by',
    contribution_share: 'order_by',
    user_id: 'order_by',
  },
  contributors_on_conflict: {
    constraint: 'contributors_constraint',
    update_columns: 'contributors_update_column',
    where: 'contributors_bool_exp',
  },
  contributors_order_by: {
    contribution: 'contributions_order_by',
    contribution_id: 'order_by',
    contribution_share: 'order_by',
    user: 'users_order_by',
    user_id: 'order_by',
  },
  contributors_pk_columns_input: {
    contribution_id: 'uuid',
    user_id: 'uuid',
  },
  contributors_select_column: 'enum' as const,
  contributors_set_input: {
    contribution_id: 'uuid',
    contribution_share: 'numeric',
    user_id: 'uuid',
  },
  contributors_stddev_order_by: {
    contribution_share: 'order_by',
  },
  contributors_stddev_pop_order_by: {
    contribution_share: 'order_by',
  },
  contributors_stddev_samp_order_by: {
    contribution_share: 'order_by',
  },
  contributors_stream_cursor_input: {
    initial_value: 'contributors_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  contributors_stream_cursor_value_input: {
    contribution_id: 'uuid',
    contribution_share: 'numeric',
    user_id: 'uuid',
  },
  contributors_sum_order_by: {
    contribution_share: 'order_by',
  },
  contributors_update_column: 'enum' as const,
  contributors_updates: {
    _inc: 'contributors_inc_input',
    _set: 'contributors_set_input',
    where: 'contributors_bool_exp',
  },
  contributors_var_pop_order_by: {
    contribution_share: 'order_by',
  },
  contributors_var_samp_order_by: {
    contribution_share: 'order_by',
  },
  contributors_variance_order_by: {
    contribution_share: 'order_by',
  },
  cursor_ordering: 'enum' as const,
  date: `scalar.date` as const,
  date_comparison_exp: {
    _eq: 'date',
    _gt: 'date',
    _gte: 'date',
    _in: 'date',
    _lt: 'date',
    _lte: 'date',
    _neq: 'date',
    _nin: 'date',
  },
  jsonb: `scalar.jsonb` as const,
  jsonb_cast_exp: {
    String: 'String_comparison_exp',
  },
  jsonb_comparison_exp: {
    _cast: 'jsonb_cast_exp',
    _contained_in: 'jsonb',
    _contains: 'jsonb',
    _eq: 'jsonb',
    _gt: 'jsonb',
    _gte: 'jsonb',
    _in: 'jsonb',
    _lt: 'jsonb',
    _lte: 'jsonb',
    _neq: 'jsonb',
    _nin: 'jsonb',
  },
  mutation_root: {
    delete_contribution_votes: {
      where: 'contribution_votes_bool_exp',
    },
    delete_contribution_votes_by_pk: {
      contribution_id: 'uuid',
      user_id: 'uuid',
    },
    delete_contributions: {
      where: 'contributions_bool_exp',
    },
    delete_contributions_by_pk: {
      id: 'uuid',
    },
    delete_contributors: {
      where: 'contributors_bool_exp',
    },
    delete_contributors_by_pk: {
      contribution_id: 'uuid',
      user_id: 'uuid',
    },
    delete_omni_brand_statuses_enum: {
      where: 'omni_brand_statuses_enum_bool_exp',
    },
    delete_omni_brand_statuses_enum_by_pk: {},
    delete_omni_brand_users: {
      where: 'omni_brand_users_bool_exp',
    },
    delete_omni_brand_users_by_pk: {
      id: 'uuid',
    },
    delete_omni_brands: {
      where: 'omni_brands_bool_exp',
    },
    delete_omni_brands_by_pk: {
      id: 'uuid',
    },
    delete_omni_collaborator_types_enum: {
      where: 'omni_collaborator_types_enum_bool_exp',
    },
    delete_omni_collaborator_types_enum_by_pk: {},
    delete_omni_directus_files: {
      where: 'omni_directus_files_bool_exp',
    },
    delete_omni_directus_files_by_pk: {},
    delete_omni_fullfillers: {
      where: 'omni_fullfillers_bool_exp',
    },
    delete_omni_fullfillers_by_pk: {
      id: 'uuid',
    },
    delete_omni_price_currencies: {
      where: 'omni_price_currencies_bool_exp',
    },
    delete_omni_price_currencies_by_pk: {
      id: 'uuid',
    },
    delete_omni_print_techs_enum: {
      where: 'omni_print_techs_enum_bool_exp',
    },
    delete_omni_print_techs_enum_by_pk: {},
    delete_omni_producer_statuses_enum: {
      where: 'omni_producer_statuses_enum_bool_exp',
    },
    delete_omni_producer_statuses_enum_by_pk: {},
    delete_omni_producers: {
      where: 'omni_producers_bool_exp',
    },
    delete_omni_producers_by_pk: {
      id: 'uuid',
    },
    delete_omni_product_collaborators: {
      where: 'omni_product_collaborators_bool_exp',
    },
    delete_omni_product_collaborators_by_pk: {
      id: 'uuid',
    },
    delete_omni_product_types_enum: {
      where: 'omni_product_types_enum_bool_exp',
    },
    delete_omni_product_types_enum_by_pk: {},
    delete_omni_production_genders_enum: {
      where: 'omni_production_genders_enum_bool_exp',
    },
    delete_omni_production_genders_enum_by_pk: {},
    delete_omni_production_materials: {
      where: 'omni_production_materials_bool_exp',
    },
    delete_omni_production_materials_by_pk: {
      id: 'uuid',
    },
    delete_omni_production_materials_producers: {
      where: 'omni_production_materials_producers_bool_exp',
    },
    delete_omni_production_materials_producers_by_pk: {
      id: 'uuid',
    },
    delete_omni_production_materials_ratings_enum: {
      where: 'omni_production_materials_ratings_enum_bool_exp',
    },
    delete_omni_production_materials_ratings_enum_by_pk: {},
    delete_omni_production_methods: {
      where: 'omni_production_methods_bool_exp',
    },
    delete_omni_production_methods_by_pk: {
      id: 'uuid',
    },
    delete_omni_production_methods_producers: {
      where: 'omni_production_methods_producers_bool_exp',
    },
    delete_omni_production_methods_producers_by_pk: {
      id: 'uuid',
    },
    delete_omni_production_methods_products: {
      where: 'omni_production_methods_products_bool_exp',
    },
    delete_omni_production_methods_products_by_pk: {
      id: 'uuid',
    },
    delete_omni_production_pallettes_enum: {
      where: 'omni_production_pallettes_enum_bool_exp',
    },
    delete_omni_production_pallettes_enum_by_pk: {},
    delete_omni_production_styles_enum: {
      where: 'omni_production_styles_enum_bool_exp',
    },
    delete_omni_production_styles_enum_by_pk: {},
    delete_omni_products: {
      where: 'omni_products_bool_exp',
    },
    delete_omni_products_by_pk: {
      id: 'uuid',
    },
    delete_omni_products_files: {
      where: 'omni_products_files_bool_exp',
    },
    delete_omni_products_files_by_pk: {},
    delete_omni_products_production_materials: {
      where: 'omni_products_production_materials_bool_exp',
    },
    delete_omni_products_production_materials_by_pk: {},
    delete_omni_products_stage_enum: {
      where: 'omni_products_stage_enum_bool_exp',
    },
    delete_omni_products_stage_enum_by_pk: {},
    delete_omni_sale_types_enum: {
      where: 'omni_sale_types_enum_bool_exp',
    },
    delete_omni_sale_types_enum_by_pk: {},
    delete_omni_timezones_enum: {
      where: 'omni_timezones_enum_bool_exp',
    },
    delete_omni_timezones_enum_by_pk: {},
    delete_omni_user_skill_types_enum: {
      where: 'omni_user_skill_types_enum_bool_exp',
    },
    delete_omni_user_skill_types_enum_by_pk: {},
    delete_omni_user_skills: {
      where: 'omni_user_skills_bool_exp',
    },
    delete_omni_user_skills_by_pk: {
      id: 'uuid',
    },
    delete_omni_user_statuses_enum: {
      where: 'omni_user_statuses_enum_bool_exp',
    },
    delete_omni_user_statuses_enum_by_pk: {},
    delete_omni_users: {
      where: 'omni_users_bool_exp',
    },
    delete_omni_users_by_pk: {
      id: 'uuid',
    },
    delete_robot_merkle_claims: {
      where: 'robot_merkle_claims_bool_exp',
    },
    delete_robot_merkle_claims_by_pk: {
      id: 'uuid',
    },
    delete_robot_merkle_roots: {
      where: 'robot_merkle_roots_bool_exp',
    },
    delete_robot_merkle_roots_by_pk: {},
    delete_robot_order: {
      where: 'robot_order_bool_exp',
    },
    delete_robot_order_by_pk: {},
    delete_robot_product: {
      where: 'robot_product_bool_exp',
    },
    delete_robot_product_by_pk: {},
    delete_robot_product_designer: {
      where: 'robot_product_designer_bool_exp',
    },
    delete_robot_product_designer_by_pk: {},
    delete_shop_api_users: {
      where: 'shop_api_users_bool_exp',
    },
    delete_shop_api_users_by_pk: {},
    delete_shop_product_locks: {
      where: 'shop_product_locks_bool_exp',
    },
    delete_shop_product_locks_by_pk: {},
    delete_users: {
      where: 'users_bool_exp',
    },
    delete_users_by_pk: {
      id: 'uuid',
    },
    insert_contribution_votes: {
      objects: 'contribution_votes_insert_input',
      on_conflict: 'contribution_votes_on_conflict',
    },
    insert_contribution_votes_one: {
      object: 'contribution_votes_insert_input',
      on_conflict: 'contribution_votes_on_conflict',
    },
    insert_contributions: {
      objects: 'contributions_insert_input',
      on_conflict: 'contributions_on_conflict',
    },
    insert_contributions_one: {
      object: 'contributions_insert_input',
      on_conflict: 'contributions_on_conflict',
    },
    insert_contributors: {
      objects: 'contributors_insert_input',
      on_conflict: 'contributors_on_conflict',
    },
    insert_contributors_one: {
      object: 'contributors_insert_input',
      on_conflict: 'contributors_on_conflict',
    },
    insert_omni_brand_statuses_enum: {
      objects: 'omni_brand_statuses_enum_insert_input',
      on_conflict: 'omni_brand_statuses_enum_on_conflict',
    },
    insert_omni_brand_statuses_enum_one: {
      object: 'omni_brand_statuses_enum_insert_input',
      on_conflict: 'omni_brand_statuses_enum_on_conflict',
    },
    insert_omni_brand_users: {
      objects: 'omni_brand_users_insert_input',
      on_conflict: 'omni_brand_users_on_conflict',
    },
    insert_omni_brand_users_one: {
      object: 'omni_brand_users_insert_input',
      on_conflict: 'omni_brand_users_on_conflict',
    },
    insert_omni_brands: {
      objects: 'omni_brands_insert_input',
      on_conflict: 'omni_brands_on_conflict',
    },
    insert_omni_brands_one: {
      object: 'omni_brands_insert_input',
      on_conflict: 'omni_brands_on_conflict',
    },
    insert_omni_collaborator_types_enum: {
      objects: 'omni_collaborator_types_enum_insert_input',
      on_conflict: 'omni_collaborator_types_enum_on_conflict',
    },
    insert_omni_collaborator_types_enum_one: {
      object: 'omni_collaborator_types_enum_insert_input',
      on_conflict: 'omni_collaborator_types_enum_on_conflict',
    },
    insert_omni_directus_files: {
      objects: 'omni_directus_files_insert_input',
      on_conflict: 'omni_directus_files_on_conflict',
    },
    insert_omni_directus_files_one: {
      object: 'omni_directus_files_insert_input',
      on_conflict: 'omni_directus_files_on_conflict',
    },
    insert_omni_fullfillers: {
      objects: 'omni_fullfillers_insert_input',
      on_conflict: 'omni_fullfillers_on_conflict',
    },
    insert_omni_fullfillers_one: {
      object: 'omni_fullfillers_insert_input',
      on_conflict: 'omni_fullfillers_on_conflict',
    },
    insert_omni_price_currencies: {
      objects: 'omni_price_currencies_insert_input',
      on_conflict: 'omni_price_currencies_on_conflict',
    },
    insert_omni_price_currencies_one: {
      object: 'omni_price_currencies_insert_input',
      on_conflict: 'omni_price_currencies_on_conflict',
    },
    insert_omni_print_techs_enum: {
      objects: 'omni_print_techs_enum_insert_input',
      on_conflict: 'omni_print_techs_enum_on_conflict',
    },
    insert_omni_print_techs_enum_one: {
      object: 'omni_print_techs_enum_insert_input',
      on_conflict: 'omni_print_techs_enum_on_conflict',
    },
    insert_omni_producer_statuses_enum: {
      objects: 'omni_producer_statuses_enum_insert_input',
      on_conflict: 'omni_producer_statuses_enum_on_conflict',
    },
    insert_omni_producer_statuses_enum_one: {
      object: 'omni_producer_statuses_enum_insert_input',
      on_conflict: 'omni_producer_statuses_enum_on_conflict',
    },
    insert_omni_producers: {
      objects: 'omni_producers_insert_input',
      on_conflict: 'omni_producers_on_conflict',
    },
    insert_omni_producers_one: {
      object: 'omni_producers_insert_input',
      on_conflict: 'omni_producers_on_conflict',
    },
    insert_omni_product_collaborators: {
      objects: 'omni_product_collaborators_insert_input',
      on_conflict: 'omni_product_collaborators_on_conflict',
    },
    insert_omni_product_collaborators_one: {
      object: 'omni_product_collaborators_insert_input',
      on_conflict: 'omni_product_collaborators_on_conflict',
    },
    insert_omni_product_types_enum: {
      objects: 'omni_product_types_enum_insert_input',
      on_conflict: 'omni_product_types_enum_on_conflict',
    },
    insert_omni_product_types_enum_one: {
      object: 'omni_product_types_enum_insert_input',
      on_conflict: 'omni_product_types_enum_on_conflict',
    },
    insert_omni_production_genders_enum: {
      objects: 'omni_production_genders_enum_insert_input',
      on_conflict: 'omni_production_genders_enum_on_conflict',
    },
    insert_omni_production_genders_enum_one: {
      object: 'omni_production_genders_enum_insert_input',
      on_conflict: 'omni_production_genders_enum_on_conflict',
    },
    insert_omni_production_materials: {
      objects: 'omni_production_materials_insert_input',
      on_conflict: 'omni_production_materials_on_conflict',
    },
    insert_omni_production_materials_one: {
      object: 'omni_production_materials_insert_input',
      on_conflict: 'omni_production_materials_on_conflict',
    },
    insert_omni_production_materials_producers: {
      objects: 'omni_production_materials_producers_insert_input',
      on_conflict: 'omni_production_materials_producers_on_conflict',
    },
    insert_omni_production_materials_producers_one: {
      object: 'omni_production_materials_producers_insert_input',
      on_conflict: 'omni_production_materials_producers_on_conflict',
    },
    insert_omni_production_materials_ratings_enum: {
      objects: 'omni_production_materials_ratings_enum_insert_input',
      on_conflict: 'omni_production_materials_ratings_enum_on_conflict',
    },
    insert_omni_production_materials_ratings_enum_one: {
      object: 'omni_production_materials_ratings_enum_insert_input',
      on_conflict: 'omni_production_materials_ratings_enum_on_conflict',
    },
    insert_omni_production_methods: {
      objects: 'omni_production_methods_insert_input',
      on_conflict: 'omni_production_methods_on_conflict',
    },
    insert_omni_production_methods_one: {
      object: 'omni_production_methods_insert_input',
      on_conflict: 'omni_production_methods_on_conflict',
    },
    insert_omni_production_methods_producers: {
      objects: 'omni_production_methods_producers_insert_input',
      on_conflict: 'omni_production_methods_producers_on_conflict',
    },
    insert_omni_production_methods_producers_one: {
      object: 'omni_production_methods_producers_insert_input',
      on_conflict: 'omni_production_methods_producers_on_conflict',
    },
    insert_omni_production_methods_products: {
      objects: 'omni_production_methods_products_insert_input',
      on_conflict: 'omni_production_methods_products_on_conflict',
    },
    insert_omni_production_methods_products_one: {
      object: 'omni_production_methods_products_insert_input',
      on_conflict: 'omni_production_methods_products_on_conflict',
    },
    insert_omni_production_pallettes_enum: {
      objects: 'omni_production_pallettes_enum_insert_input',
      on_conflict: 'omni_production_pallettes_enum_on_conflict',
    },
    insert_omni_production_pallettes_enum_one: {
      object: 'omni_production_pallettes_enum_insert_input',
      on_conflict: 'omni_production_pallettes_enum_on_conflict',
    },
    insert_omni_production_styles_enum: {
      objects: 'omni_production_styles_enum_insert_input',
      on_conflict: 'omni_production_styles_enum_on_conflict',
    },
    insert_omni_production_styles_enum_one: {
      object: 'omni_production_styles_enum_insert_input',
      on_conflict: 'omni_production_styles_enum_on_conflict',
    },
    insert_omni_products: {
      objects: 'omni_products_insert_input',
      on_conflict: 'omni_products_on_conflict',
    },
    insert_omni_products_files: {
      objects: 'omni_products_files_insert_input',
      on_conflict: 'omni_products_files_on_conflict',
    },
    insert_omni_products_files_one: {
      object: 'omni_products_files_insert_input',
      on_conflict: 'omni_products_files_on_conflict',
    },
    insert_omni_products_one: {
      object: 'omni_products_insert_input',
      on_conflict: 'omni_products_on_conflict',
    },
    insert_omni_products_production_materials: {
      objects: 'omni_products_production_materials_insert_input',
      on_conflict: 'omni_products_production_materials_on_conflict',
    },
    insert_omni_products_production_materials_one: {
      object: 'omni_products_production_materials_insert_input',
      on_conflict: 'omni_products_production_materials_on_conflict',
    },
    insert_omni_products_stage_enum: {
      objects: 'omni_products_stage_enum_insert_input',
      on_conflict: 'omni_products_stage_enum_on_conflict',
    },
    insert_omni_products_stage_enum_one: {
      object: 'omni_products_stage_enum_insert_input',
      on_conflict: 'omni_products_stage_enum_on_conflict',
    },
    insert_omni_sale_types_enum: {
      objects: 'omni_sale_types_enum_insert_input',
      on_conflict: 'omni_sale_types_enum_on_conflict',
    },
    insert_omni_sale_types_enum_one: {
      object: 'omni_sale_types_enum_insert_input',
      on_conflict: 'omni_sale_types_enum_on_conflict',
    },
    insert_omni_timezones_enum: {
      objects: 'omni_timezones_enum_insert_input',
      on_conflict: 'omni_timezones_enum_on_conflict',
    },
    insert_omni_timezones_enum_one: {
      object: 'omni_timezones_enum_insert_input',
      on_conflict: 'omni_timezones_enum_on_conflict',
    },
    insert_omni_user_skill_types_enum: {
      objects: 'omni_user_skill_types_enum_insert_input',
      on_conflict: 'omni_user_skill_types_enum_on_conflict',
    },
    insert_omni_user_skill_types_enum_one: {
      object: 'omni_user_skill_types_enum_insert_input',
      on_conflict: 'omni_user_skill_types_enum_on_conflict',
    },
    insert_omni_user_skills: {
      objects: 'omni_user_skills_insert_input',
      on_conflict: 'omni_user_skills_on_conflict',
    },
    insert_omni_user_skills_one: {
      object: 'omni_user_skills_insert_input',
      on_conflict: 'omni_user_skills_on_conflict',
    },
    insert_omni_user_statuses_enum: {
      objects: 'omni_user_statuses_enum_insert_input',
      on_conflict: 'omni_user_statuses_enum_on_conflict',
    },
    insert_omni_user_statuses_enum_one: {
      object: 'omni_user_statuses_enum_insert_input',
      on_conflict: 'omni_user_statuses_enum_on_conflict',
    },
    insert_omni_users: {
      objects: 'omni_users_insert_input',
      on_conflict: 'omni_users_on_conflict',
    },
    insert_omni_users_one: {
      object: 'omni_users_insert_input',
      on_conflict: 'omni_users_on_conflict',
    },
    insert_robot_merkle_claims: {
      objects: 'robot_merkle_claims_insert_input',
      on_conflict: 'robot_merkle_claims_on_conflict',
    },
    insert_robot_merkle_claims_one: {
      object: 'robot_merkle_claims_insert_input',
      on_conflict: 'robot_merkle_claims_on_conflict',
    },
    insert_robot_merkle_roots: {
      objects: 'robot_merkle_roots_insert_input',
      on_conflict: 'robot_merkle_roots_on_conflict',
    },
    insert_robot_merkle_roots_one: {
      object: 'robot_merkle_roots_insert_input',
      on_conflict: 'robot_merkle_roots_on_conflict',
    },
    insert_robot_order: {
      objects: 'robot_order_insert_input',
      on_conflict: 'robot_order_on_conflict',
    },
    insert_robot_order_one: {
      object: 'robot_order_insert_input',
      on_conflict: 'robot_order_on_conflict',
    },
    insert_robot_product: {
      objects: 'robot_product_insert_input',
      on_conflict: 'robot_product_on_conflict',
    },
    insert_robot_product_designer: {
      objects: 'robot_product_designer_insert_input',
      on_conflict: 'robot_product_designer_on_conflict',
    },
    insert_robot_product_designer_one: {
      object: 'robot_product_designer_insert_input',
      on_conflict: 'robot_product_designer_on_conflict',
    },
    insert_robot_product_one: {
      object: 'robot_product_insert_input',
      on_conflict: 'robot_product_on_conflict',
    },
    insert_shop_api_users: {
      objects: 'shop_api_users_insert_input',
      on_conflict: 'shop_api_users_on_conflict',
    },
    insert_shop_api_users_one: {
      object: 'shop_api_users_insert_input',
      on_conflict: 'shop_api_users_on_conflict',
    },
    insert_shop_product_locks: {
      objects: 'shop_product_locks_insert_input',
      on_conflict: 'shop_product_locks_on_conflict',
    },
    insert_shop_product_locks_one: {
      object: 'shop_product_locks_insert_input',
      on_conflict: 'shop_product_locks_on_conflict',
    },
    insert_users: {
      objects: 'users_insert_input',
      on_conflict: 'users_on_conflict',
    },
    insert_users_one: {
      object: 'users_insert_input',
      on_conflict: 'users_on_conflict',
    },
    update_contribution_votes: {
      _set: 'contribution_votes_set_input',
      where: 'contribution_votes_bool_exp',
    },
    update_contribution_votes_by_pk: {
      _set: 'contribution_votes_set_input',
      pk_columns: 'contribution_votes_pk_columns_input',
    },
    update_contribution_votes_many: {
      updates: 'contribution_votes_updates',
    },
    update_contributions: {
      _inc: 'contributions_inc_input',
      _set: 'contributions_set_input',
      where: 'contributions_bool_exp',
    },
    update_contributions_by_pk: {
      _inc: 'contributions_inc_input',
      _set: 'contributions_set_input',
      pk_columns: 'contributions_pk_columns_input',
    },
    update_contributions_many: {
      updates: 'contributions_updates',
    },
    update_contributors: {
      _inc: 'contributors_inc_input',
      _set: 'contributors_set_input',
      where: 'contributors_bool_exp',
    },
    update_contributors_by_pk: {
      _inc: 'contributors_inc_input',
      _set: 'contributors_set_input',
      pk_columns: 'contributors_pk_columns_input',
    },
    update_contributors_many: {
      updates: 'contributors_updates',
    },
    update_omni_brand_statuses_enum: {
      _set: 'omni_brand_statuses_enum_set_input',
      where: 'omni_brand_statuses_enum_bool_exp',
    },
    update_omni_brand_statuses_enum_by_pk: {
      _set: 'omni_brand_statuses_enum_set_input',
      pk_columns: 'omni_brand_statuses_enum_pk_columns_input',
    },
    update_omni_brand_statuses_enum_many: {
      updates: 'omni_brand_statuses_enum_updates',
    },
    update_omni_brand_users: {
      _set: 'omni_brand_users_set_input',
      where: 'omni_brand_users_bool_exp',
    },
    update_omni_brand_users_by_pk: {
      _set: 'omni_brand_users_set_input',
      pk_columns: 'omni_brand_users_pk_columns_input',
    },
    update_omni_brand_users_many: {
      updates: 'omni_brand_users_updates',
    },
    update_omni_brands: {
      _set: 'omni_brands_set_input',
      where: 'omni_brands_bool_exp',
    },
    update_omni_brands_by_pk: {
      _set: 'omni_brands_set_input',
      pk_columns: 'omni_brands_pk_columns_input',
    },
    update_omni_brands_many: {
      updates: 'omni_brands_updates',
    },
    update_omni_collaborator_types_enum: {
      _set: 'omni_collaborator_types_enum_set_input',
      where: 'omni_collaborator_types_enum_bool_exp',
    },
    update_omni_collaborator_types_enum_by_pk: {
      _set: 'omni_collaborator_types_enum_set_input',
      pk_columns: 'omni_collaborator_types_enum_pk_columns_input',
    },
    update_omni_collaborator_types_enum_many: {
      updates: 'omni_collaborator_types_enum_updates',
    },
    update_omni_directus_files: {
      where: 'omni_directus_files_bool_exp',
    },
    update_omni_directus_files_by_pk: {
      pk_columns: 'omni_directus_files_pk_columns_input',
    },
    update_omni_directus_files_many: {
      updates: 'omni_directus_files_updates',
    },
    update_omni_fullfillers: {
      _set: 'omni_fullfillers_set_input',
      where: 'omni_fullfillers_bool_exp',
    },
    update_omni_fullfillers_by_pk: {
      _set: 'omni_fullfillers_set_input',
      pk_columns: 'omni_fullfillers_pk_columns_input',
    },
    update_omni_fullfillers_many: {
      updates: 'omni_fullfillers_updates',
    },
    update_omni_price_currencies: {
      _inc: 'omni_price_currencies_inc_input',
      _set: 'omni_price_currencies_set_input',
      where: 'omni_price_currencies_bool_exp',
    },
    update_omni_price_currencies_by_pk: {
      _inc: 'omni_price_currencies_inc_input',
      _set: 'omni_price_currencies_set_input',
      pk_columns: 'omni_price_currencies_pk_columns_input',
    },
    update_omni_price_currencies_many: {
      updates: 'omni_price_currencies_updates',
    },
    update_omni_print_techs_enum: {
      _set: 'omni_print_techs_enum_set_input',
      where: 'omni_print_techs_enum_bool_exp',
    },
    update_omni_print_techs_enum_by_pk: {
      _set: 'omni_print_techs_enum_set_input',
      pk_columns: 'omni_print_techs_enum_pk_columns_input',
    },
    update_omni_print_techs_enum_many: {
      updates: 'omni_print_techs_enum_updates',
    },
    update_omni_producer_statuses_enum: {
      _set: 'omni_producer_statuses_enum_set_input',
      where: 'omni_producer_statuses_enum_bool_exp',
    },
    update_omni_producer_statuses_enum_by_pk: {
      _set: 'omni_producer_statuses_enum_set_input',
      pk_columns: 'omni_producer_statuses_enum_pk_columns_input',
    },
    update_omni_producer_statuses_enum_many: {
      updates: 'omni_producer_statuses_enum_updates',
    },
    update_omni_producers: {
      _set: 'omni_producers_set_input',
      where: 'omni_producers_bool_exp',
    },
    update_omni_producers_by_pk: {
      _set: 'omni_producers_set_input',
      pk_columns: 'omni_producers_pk_columns_input',
    },
    update_omni_producers_many: {
      updates: 'omni_producers_updates',
    },
    update_omni_product_collaborators: {
      _inc: 'omni_product_collaborators_inc_input',
      _set: 'omni_product_collaborators_set_input',
      where: 'omni_product_collaborators_bool_exp',
    },
    update_omni_product_collaborators_by_pk: {
      _inc: 'omni_product_collaborators_inc_input',
      _set: 'omni_product_collaborators_set_input',
      pk_columns: 'omni_product_collaborators_pk_columns_input',
    },
    update_omni_product_collaborators_many: {
      updates: 'omni_product_collaborators_updates',
    },
    update_omni_product_types_enum: {
      _set: 'omni_product_types_enum_set_input',
      where: 'omni_product_types_enum_bool_exp',
    },
    update_omni_product_types_enum_by_pk: {
      _set: 'omni_product_types_enum_set_input',
      pk_columns: 'omni_product_types_enum_pk_columns_input',
    },
    update_omni_product_types_enum_many: {
      updates: 'omni_product_types_enum_updates',
    },
    update_omni_production_genders_enum: {
      _set: 'omni_production_genders_enum_set_input',
      where: 'omni_production_genders_enum_bool_exp',
    },
    update_omni_production_genders_enum_by_pk: {
      _set: 'omni_production_genders_enum_set_input',
      pk_columns: 'omni_production_genders_enum_pk_columns_input',
    },
    update_omni_production_genders_enum_many: {
      updates: 'omni_production_genders_enum_updates',
    },
    update_omni_production_materials: {
      _inc: 'omni_production_materials_inc_input',
      _set: 'omni_production_materials_set_input',
      where: 'omni_production_materials_bool_exp',
    },
    update_omni_production_materials_by_pk: {
      _inc: 'omni_production_materials_inc_input',
      _set: 'omni_production_materials_set_input',
      pk_columns: 'omni_production_materials_pk_columns_input',
    },
    update_omni_production_materials_many: {
      updates: 'omni_production_materials_updates',
    },
    update_omni_production_materials_producers: {
      _set: 'omni_production_materials_producers_set_input',
      where: 'omni_production_materials_producers_bool_exp',
    },
    update_omni_production_materials_producers_by_pk: {
      _set: 'omni_production_materials_producers_set_input',
      pk_columns: 'omni_production_materials_producers_pk_columns_input',
    },
    update_omni_production_materials_producers_many: {
      updates: 'omni_production_materials_producers_updates',
    },
    update_omni_production_materials_ratings_enum: {
      _set: 'omni_production_materials_ratings_enum_set_input',
      where: 'omni_production_materials_ratings_enum_bool_exp',
    },
    update_omni_production_materials_ratings_enum_by_pk: {
      _set: 'omni_production_materials_ratings_enum_set_input',
      pk_columns: 'omni_production_materials_ratings_enum_pk_columns_input',
    },
    update_omni_production_materials_ratings_enum_many: {
      updates: 'omni_production_materials_ratings_enum_updates',
    },
    update_omni_production_methods: {
      _set: 'omni_production_methods_set_input',
      where: 'omni_production_methods_bool_exp',
    },
    update_omni_production_methods_by_pk: {
      _set: 'omni_production_methods_set_input',
      pk_columns: 'omni_production_methods_pk_columns_input',
    },
    update_omni_production_methods_many: {
      updates: 'omni_production_methods_updates',
    },
    update_omni_production_methods_producers: {
      _set: 'omni_production_methods_producers_set_input',
      where: 'omni_production_methods_producers_bool_exp',
    },
    update_omni_production_methods_producers_by_pk: {
      _set: 'omni_production_methods_producers_set_input',
      pk_columns: 'omni_production_methods_producers_pk_columns_input',
    },
    update_omni_production_methods_producers_many: {
      updates: 'omni_production_methods_producers_updates',
    },
    update_omni_production_methods_products: {
      _set: 'omni_production_methods_products_set_input',
      where: 'omni_production_methods_products_bool_exp',
    },
    update_omni_production_methods_products_by_pk: {
      _set: 'omni_production_methods_products_set_input',
      pk_columns: 'omni_production_methods_products_pk_columns_input',
    },
    update_omni_production_methods_products_many: {
      updates: 'omni_production_methods_products_updates',
    },
    update_omni_production_pallettes_enum: {
      _set: 'omni_production_pallettes_enum_set_input',
      where: 'omni_production_pallettes_enum_bool_exp',
    },
    update_omni_production_pallettes_enum_by_pk: {
      _set: 'omni_production_pallettes_enum_set_input',
      pk_columns: 'omni_production_pallettes_enum_pk_columns_input',
    },
    update_omni_production_pallettes_enum_many: {
      updates: 'omni_production_pallettes_enum_updates',
    },
    update_omni_production_styles_enum: {
      _set: 'omni_production_styles_enum_set_input',
      where: 'omni_production_styles_enum_bool_exp',
    },
    update_omni_production_styles_enum_by_pk: {
      _set: 'omni_production_styles_enum_set_input',
      pk_columns: 'omni_production_styles_enum_pk_columns_input',
    },
    update_omni_production_styles_enum_many: {
      updates: 'omni_production_styles_enum_updates',
    },
    update_omni_products: {
      _inc: 'omni_products_inc_input',
      _set: 'omni_products_set_input',
      where: 'omni_products_bool_exp',
    },
    update_omni_products_by_pk: {
      _inc: 'omni_products_inc_input',
      _set: 'omni_products_set_input',
      pk_columns: 'omni_products_pk_columns_input',
    },
    update_omni_products_files: {
      _inc: 'omni_products_files_inc_input',
      _set: 'omni_products_files_set_input',
      where: 'omni_products_files_bool_exp',
    },
    update_omni_products_files_by_pk: {
      _inc: 'omni_products_files_inc_input',
      _set: 'omni_products_files_set_input',
      pk_columns: 'omni_products_files_pk_columns_input',
    },
    update_omni_products_files_many: {
      updates: 'omni_products_files_updates',
    },
    update_omni_products_many: {
      updates: 'omni_products_updates',
    },
    update_omni_products_production_materials: {
      _set: 'omni_products_production_materials_set_input',
      where: 'omni_products_production_materials_bool_exp',
    },
    update_omni_products_production_materials_by_pk: {
      _set: 'omni_products_production_materials_set_input',
      pk_columns: 'omni_products_production_materials_pk_columns_input',
    },
    update_omni_products_production_materials_many: {
      updates: 'omni_products_production_materials_updates',
    },
    update_omni_products_stage_enum: {
      _set: 'omni_products_stage_enum_set_input',
      where: 'omni_products_stage_enum_bool_exp',
    },
    update_omni_products_stage_enum_by_pk: {
      _set: 'omni_products_stage_enum_set_input',
      pk_columns: 'omni_products_stage_enum_pk_columns_input',
    },
    update_omni_products_stage_enum_many: {
      updates: 'omni_products_stage_enum_updates',
    },
    update_omni_sale_types_enum: {
      _set: 'omni_sale_types_enum_set_input',
      where: 'omni_sale_types_enum_bool_exp',
    },
    update_omni_sale_types_enum_by_pk: {
      _set: 'omni_sale_types_enum_set_input',
      pk_columns: 'omni_sale_types_enum_pk_columns_input',
    },
    update_omni_sale_types_enum_many: {
      updates: 'omni_sale_types_enum_updates',
    },
    update_omni_timezones_enum: {
      _set: 'omni_timezones_enum_set_input',
      where: 'omni_timezones_enum_bool_exp',
    },
    update_omni_timezones_enum_by_pk: {
      _set: 'omni_timezones_enum_set_input',
      pk_columns: 'omni_timezones_enum_pk_columns_input',
    },
    update_omni_timezones_enum_many: {
      updates: 'omni_timezones_enum_updates',
    },
    update_omni_user_skill_types_enum: {
      _set: 'omni_user_skill_types_enum_set_input',
      where: 'omni_user_skill_types_enum_bool_exp',
    },
    update_omni_user_skill_types_enum_by_pk: {
      _set: 'omni_user_skill_types_enum_set_input',
      pk_columns: 'omni_user_skill_types_enum_pk_columns_input',
    },
    update_omni_user_skill_types_enum_many: {
      updates: 'omni_user_skill_types_enum_updates',
    },
    update_omni_user_skills: {
      _set: 'omni_user_skills_set_input',
      where: 'omni_user_skills_bool_exp',
    },
    update_omni_user_skills_by_pk: {
      _set: 'omni_user_skills_set_input',
      pk_columns: 'omni_user_skills_pk_columns_input',
    },
    update_omni_user_skills_many: {
      updates: 'omni_user_skills_updates',
    },
    update_omni_user_statuses_enum: {
      _set: 'omni_user_statuses_enum_set_input',
      where: 'omni_user_statuses_enum_bool_exp',
    },
    update_omni_user_statuses_enum_by_pk: {
      _set: 'omni_user_statuses_enum_set_input',
      pk_columns: 'omni_user_statuses_enum_pk_columns_input',
    },
    update_omni_user_statuses_enum_many: {
      updates: 'omni_user_statuses_enum_updates',
    },
    update_omni_users: {
      _set: 'omni_users_set_input',
      where: 'omni_users_bool_exp',
    },
    update_omni_users_by_pk: {
      _set: 'omni_users_set_input',
      pk_columns: 'omni_users_pk_columns_input',
    },
    update_omni_users_many: {
      updates: 'omni_users_updates',
    },
    update_robot_merkle_claims: {
      _append: 'robot_merkle_claims_append_input',
      _delete_at_path: 'robot_merkle_claims_delete_at_path_input',
      _delete_elem: 'robot_merkle_claims_delete_elem_input',
      _delete_key: 'robot_merkle_claims_delete_key_input',
      _prepend: 'robot_merkle_claims_prepend_input',
      _set: 'robot_merkle_claims_set_input',
      where: 'robot_merkle_claims_bool_exp',
    },
    update_robot_merkle_claims_by_pk: {
      _append: 'robot_merkle_claims_append_input',
      _delete_at_path: 'robot_merkle_claims_delete_at_path_input',
      _delete_elem: 'robot_merkle_claims_delete_elem_input',
      _delete_key: 'robot_merkle_claims_delete_key_input',
      _prepend: 'robot_merkle_claims_prepend_input',
      _set: 'robot_merkle_claims_set_input',
      pk_columns: 'robot_merkle_claims_pk_columns_input',
    },
    update_robot_merkle_claims_many: {
      updates: 'robot_merkle_claims_updates',
    },
    update_robot_merkle_roots: {
      _set: 'robot_merkle_roots_set_input',
      where: 'robot_merkle_roots_bool_exp',
    },
    update_robot_merkle_roots_by_pk: {
      _set: 'robot_merkle_roots_set_input',
      pk_columns: 'robot_merkle_roots_pk_columns_input',
    },
    update_robot_merkle_roots_many: {
      updates: 'robot_merkle_roots_updates',
    },
    update_robot_order: {
      _inc: 'robot_order_inc_input',
      _set: 'robot_order_set_input',
      where: 'robot_order_bool_exp',
    },
    update_robot_order_by_pk: {
      _inc: 'robot_order_inc_input',
      _set: 'robot_order_set_input',
      pk_columns: 'robot_order_pk_columns_input',
    },
    update_robot_order_many: {
      updates: 'robot_order_updates',
    },
    update_robot_product: {
      _append: 'robot_product_append_input',
      _delete_at_path: 'robot_product_delete_at_path_input',
      _delete_elem: 'robot_product_delete_elem_input',
      _delete_key: 'robot_product_delete_key_input',
      _inc: 'robot_product_inc_input',
      _prepend: 'robot_product_prepend_input',
      _set: 'robot_product_set_input',
      where: 'robot_product_bool_exp',
    },
    update_robot_product_by_pk: {
      _append: 'robot_product_append_input',
      _delete_at_path: 'robot_product_delete_at_path_input',
      _delete_elem: 'robot_product_delete_elem_input',
      _delete_key: 'robot_product_delete_key_input',
      _inc: 'robot_product_inc_input',
      _prepend: 'robot_product_prepend_input',
      _set: 'robot_product_set_input',
      pk_columns: 'robot_product_pk_columns_input',
    },
    update_robot_product_designer: {
      _inc: 'robot_product_designer_inc_input',
      _set: 'robot_product_designer_set_input',
      where: 'robot_product_designer_bool_exp',
    },
    update_robot_product_designer_by_pk: {
      _inc: 'robot_product_designer_inc_input',
      _set: 'robot_product_designer_set_input',
      pk_columns: 'robot_product_designer_pk_columns_input',
    },
    update_robot_product_designer_many: {
      updates: 'robot_product_designer_updates',
    },
    update_robot_product_many: {
      updates: 'robot_product_updates',
    },
    update_shop_api_users: {
      _set: 'shop_api_users_set_input',
      where: 'shop_api_users_bool_exp',
    },
    update_shop_api_users_by_pk: {
      _set: 'shop_api_users_set_input',
      pk_columns: 'shop_api_users_pk_columns_input',
    },
    update_shop_api_users_many: {
      updates: 'shop_api_users_updates',
    },
    update_shop_product_locks: {
      _set: 'shop_product_locks_set_input',
      where: 'shop_product_locks_bool_exp',
    },
    update_shop_product_locks_by_pk: {
      _set: 'shop_product_locks_set_input',
      pk_columns: 'shop_product_locks_pk_columns_input',
    },
    update_shop_product_locks_many: {
      updates: 'shop_product_locks_updates',
    },
    update_users: {
      _set: 'users_set_input',
      where: 'users_bool_exp',
    },
    update_users_by_pk: {
      _set: 'users_set_input',
      pk_columns: 'users_pk_columns_input',
    },
    update_users_many: {
      updates: 'users_updates',
    },
  },
  numeric: `scalar.numeric` as const,
  numeric_comparison_exp: {
    _eq: 'numeric',
    _gt: 'numeric',
    _gte: 'numeric',
    _in: 'numeric',
    _lt: 'numeric',
    _lte: 'numeric',
    _neq: 'numeric',
    _nin: 'numeric',
  },
  omni_brand_statuses_enum: {
    brands: {
      distinct_on: 'omni_brands_select_column',
      order_by: 'omni_brands_order_by',
      where: 'omni_brands_bool_exp',
    },
    brands_aggregate: {
      distinct_on: 'omni_brands_select_column',
      order_by: 'omni_brands_order_by',
      where: 'omni_brands_bool_exp',
    },
  },
  omni_brand_statuses_enum_aggregate_fields: {
    count: {
      columns: 'omni_brand_statuses_enum_select_column',
    },
  },
  omni_brand_statuses_enum_bool_exp: {
    _and: 'omni_brand_statuses_enum_bool_exp',
    _not: 'omni_brand_statuses_enum_bool_exp',
    _or: 'omni_brand_statuses_enum_bool_exp',
    brands: 'omni_brands_bool_exp',
    brands_aggregate: 'omni_brands_aggregate_bool_exp',
    description: 'String_comparison_exp',
    value: 'String_comparison_exp',
  },
  omni_brand_statuses_enum_constraint: 'enum' as const,
  omni_brand_statuses_enum_enum: 'enum' as const,
  omni_brand_statuses_enum_enum_comparison_exp: {
    _eq: 'omni_brand_statuses_enum_enum',
    _in: 'omni_brand_statuses_enum_enum',
    _neq: 'omni_brand_statuses_enum_enum',
    _nin: 'omni_brand_statuses_enum_enum',
  },
  omni_brand_statuses_enum_insert_input: {
    brands: 'omni_brands_arr_rel_insert_input',
  },
  omni_brand_statuses_enum_obj_rel_insert_input: {
    data: 'omni_brand_statuses_enum_insert_input',
    on_conflict: 'omni_brand_statuses_enum_on_conflict',
  },
  omni_brand_statuses_enum_on_conflict: {
    constraint: 'omni_brand_statuses_enum_constraint',
    update_columns: 'omni_brand_statuses_enum_update_column',
    where: 'omni_brand_statuses_enum_bool_exp',
  },
  omni_brand_statuses_enum_order_by: {
    brands_aggregate: 'omni_brands_aggregate_order_by',
    description: 'order_by',
    value: 'order_by',
  },
  omni_brand_statuses_enum_pk_columns_input: {},
  omni_brand_statuses_enum_select_column: 'enum' as const,
  omni_brand_statuses_enum_set_input: {},
  omni_brand_statuses_enum_stream_cursor_input: {
    initial_value: 'omni_brand_statuses_enum_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_brand_statuses_enum_stream_cursor_value_input: {},
  omni_brand_statuses_enum_update_column: 'enum' as const,
  omni_brand_statuses_enum_updates: {
    _set: 'omni_brand_statuses_enum_set_input',
    where: 'omni_brand_statuses_enum_bool_exp',
  },
  omni_brand_users_aggregate_bool_exp: {
    count: 'omni_brand_users_aggregate_bool_exp_count',
  },
  omni_brand_users_aggregate_bool_exp_count: {
    arguments: 'omni_brand_users_select_column',
    filter: 'omni_brand_users_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  omni_brand_users_aggregate_fields: {
    count: {
      columns: 'omni_brand_users_select_column',
    },
  },
  omni_brand_users_aggregate_order_by: {
    count: 'order_by',
    max: 'omni_brand_users_max_order_by',
    min: 'omni_brand_users_min_order_by',
  },
  omni_brand_users_arr_rel_insert_input: {
    data: 'omni_brand_users_insert_input',
    on_conflict: 'omni_brand_users_on_conflict',
  },
  omni_brand_users_bool_exp: {
    _and: 'omni_brand_users_bool_exp',
    _not: 'omni_brand_users_bool_exp',
    _or: 'omni_brand_users_bool_exp',
    brand: 'uuid_comparison_exp',
    brandByBrand: 'omni_brands_bool_exp',
    collaborator: 'uuid_comparison_exp',
    id: 'uuid_comparison_exp',
    user: 'omni_users_bool_exp',
  },
  omni_brand_users_constraint: 'enum' as const,
  omni_brand_users_insert_input: {
    brand: 'uuid',
    brandByBrand: 'omni_brands_obj_rel_insert_input',
    collaborator: 'uuid',
    id: 'uuid',
    user: 'omni_users_obj_rel_insert_input',
  },
  omni_brand_users_max_order_by: {
    brand: 'order_by',
    collaborator: 'order_by',
    id: 'order_by',
  },
  omni_brand_users_min_order_by: {
    brand: 'order_by',
    collaborator: 'order_by',
    id: 'order_by',
  },
  omni_brand_users_on_conflict: {
    constraint: 'omni_brand_users_constraint',
    update_columns: 'omni_brand_users_update_column',
    where: 'omni_brand_users_bool_exp',
  },
  omni_brand_users_order_by: {
    brand: 'order_by',
    brandByBrand: 'omni_brands_order_by',
    collaborator: 'order_by',
    id: 'order_by',
    user: 'omni_users_order_by',
  },
  omni_brand_users_pk_columns_input: {
    id: 'uuid',
  },
  omni_brand_users_select_column: 'enum' as const,
  omni_brand_users_set_input: {
    brand: 'uuid',
    collaborator: 'uuid',
    id: 'uuid',
  },
  omni_brand_users_stream_cursor_input: {
    initial_value: 'omni_brand_users_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_brand_users_stream_cursor_value_input: {
    brand: 'uuid',
    collaborator: 'uuid',
    id: 'uuid',
  },
  omni_brand_users_update_column: 'enum' as const,
  omni_brand_users_updates: {
    _set: 'omni_brand_users_set_input',
    where: 'omni_brand_users_bool_exp',
  },
  omni_brands: {
    brand_users: {
      distinct_on: 'omni_brand_users_select_column',
      order_by: 'omni_brand_users_order_by',
      where: 'omni_brand_users_bool_exp',
    },
    brand_users_aggregate: {
      distinct_on: 'omni_brand_users_select_column',
      order_by: 'omni_brand_users_order_by',
      where: 'omni_brand_users_bool_exp',
    },
    products: {
      distinct_on: 'omni_products_select_column',
      order_by: 'omni_products_order_by',
      where: 'omni_products_bool_exp',
    },
    products_aggregate: {
      distinct_on: 'omni_products_select_column',
      order_by: 'omni_products_order_by',
      where: 'omni_products_bool_exp',
    },
  },
  omni_brands_aggregate_bool_exp: {
    count: 'omni_brands_aggregate_bool_exp_count',
  },
  omni_brands_aggregate_bool_exp_count: {
    arguments: 'omni_brands_select_column',
    filter: 'omni_brands_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  omni_brands_aggregate_fields: {
    count: {
      columns: 'omni_brands_select_column',
    },
  },
  omni_brands_aggregate_order_by: {
    count: 'order_by',
    max: 'omni_brands_max_order_by',
    min: 'omni_brands_min_order_by',
  },
  omni_brands_arr_rel_insert_input: {
    data: 'omni_brands_insert_input',
    on_conflict: 'omni_brands_on_conflict',
  },
  omni_brands_bool_exp: {
    _and: 'omni_brands_bool_exp',
    _not: 'omni_brands_bool_exp',
    _or: 'omni_brands_bool_exp',
    brand_statuses_enum: 'omni_brand_statuses_enum_bool_exp',
    brand_users: 'omni_brand_users_bool_exp',
    brand_users_aggregate: 'omni_brand_users_aggregate_bool_exp',
    created_at: 'timestamptz_comparison_exp',
    description: 'String_comparison_exp',
    discord_url: 'String_comparison_exp',
    eth_address: 'String_comparison_exp',
    id: 'uuid_comparison_exp',
    logo: 'String_comparison_exp',
    name: 'String_comparison_exp',
    products: 'omni_products_bool_exp',
    products_aggregate: 'omni_products_aggregate_bool_exp',
    status: 'omni_brand_statuses_enum_enum_comparison_exp',
    twitter_url: 'String_comparison_exp',
    updated_at: 'timestamptz_comparison_exp',
    website_url: 'String_comparison_exp',
  },
  omni_brands_constraint: 'enum' as const,
  omni_brands_insert_input: {
    brand_statuses_enum: 'omni_brand_statuses_enum_obj_rel_insert_input',
    brand_users: 'omni_brand_users_arr_rel_insert_input',
    created_at: 'timestamptz',
    id: 'uuid',
    products: 'omni_products_arr_rel_insert_input',
    status: 'omni_brand_statuses_enum_enum',
    updated_at: 'timestamptz',
  },
  omni_brands_max_order_by: {
    created_at: 'order_by',
    description: 'order_by',
    discord_url: 'order_by',
    eth_address: 'order_by',
    id: 'order_by',
    logo: 'order_by',
    name: 'order_by',
    twitter_url: 'order_by',
    updated_at: 'order_by',
    website_url: 'order_by',
  },
  omni_brands_min_order_by: {
    created_at: 'order_by',
    description: 'order_by',
    discord_url: 'order_by',
    eth_address: 'order_by',
    id: 'order_by',
    logo: 'order_by',
    name: 'order_by',
    twitter_url: 'order_by',
    updated_at: 'order_by',
    website_url: 'order_by',
  },
  omni_brands_obj_rel_insert_input: {
    data: 'omni_brands_insert_input',
    on_conflict: 'omni_brands_on_conflict',
  },
  omni_brands_on_conflict: {
    constraint: 'omni_brands_constraint',
    update_columns: 'omni_brands_update_column',
    where: 'omni_brands_bool_exp',
  },
  omni_brands_order_by: {
    brand_statuses_enum: 'omni_brand_statuses_enum_order_by',
    brand_users_aggregate: 'omni_brand_users_aggregate_order_by',
    created_at: 'order_by',
    description: 'order_by',
    discord_url: 'order_by',
    eth_address: 'order_by',
    id: 'order_by',
    logo: 'order_by',
    name: 'order_by',
    products_aggregate: 'omni_products_aggregate_order_by',
    status: 'order_by',
    twitter_url: 'order_by',
    updated_at: 'order_by',
    website_url: 'order_by',
  },
  omni_brands_pk_columns_input: {
    id: 'uuid',
  },
  omni_brands_select_column: 'enum' as const,
  omni_brands_set_input: {
    created_at: 'timestamptz',
    id: 'uuid',
    status: 'omni_brand_statuses_enum_enum',
    updated_at: 'timestamptz',
  },
  omni_brands_stream_cursor_input: {
    initial_value: 'omni_brands_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_brands_stream_cursor_value_input: {
    created_at: 'timestamptz',
    id: 'uuid',
    status: 'omni_brand_statuses_enum_enum',
    updated_at: 'timestamptz',
  },
  omni_brands_update_column: 'enum' as const,
  omni_brands_updates: {
    _set: 'omni_brands_set_input',
    where: 'omni_brands_bool_exp',
  },
  omni_collaborator_types_enum: {
    product_collaborators: {
      distinct_on: 'omni_product_collaborators_select_column',
      order_by: 'omni_product_collaborators_order_by',
      where: 'omni_product_collaborators_bool_exp',
    },
    product_collaborators_aggregate: {
      distinct_on: 'omni_product_collaborators_select_column',
      order_by: 'omni_product_collaborators_order_by',
      where: 'omni_product_collaborators_bool_exp',
    },
  },
  omni_collaborator_types_enum_aggregate_fields: {
    count: {
      columns: 'omni_collaborator_types_enum_select_column',
    },
  },
  omni_collaborator_types_enum_bool_exp: {
    _and: 'omni_collaborator_types_enum_bool_exp',
    _not: 'omni_collaborator_types_enum_bool_exp',
    _or: 'omni_collaborator_types_enum_bool_exp',
    description: 'String_comparison_exp',
    product_collaborators: 'omni_product_collaborators_bool_exp',
    product_collaborators_aggregate:
      'omni_product_collaborators_aggregate_bool_exp',
    value: 'String_comparison_exp',
  },
  omni_collaborator_types_enum_constraint: 'enum' as const,
  omni_collaborator_types_enum_enum: 'enum' as const,
  omni_collaborator_types_enum_enum_comparison_exp: {
    _eq: 'omni_collaborator_types_enum_enum',
    _in: 'omni_collaborator_types_enum_enum',
    _neq: 'omni_collaborator_types_enum_enum',
    _nin: 'omni_collaborator_types_enum_enum',
  },
  omni_collaborator_types_enum_insert_input: {
    product_collaborators: 'omni_product_collaborators_arr_rel_insert_input',
  },
  omni_collaborator_types_enum_obj_rel_insert_input: {
    data: 'omni_collaborator_types_enum_insert_input',
    on_conflict: 'omni_collaborator_types_enum_on_conflict',
  },
  omni_collaborator_types_enum_on_conflict: {
    constraint: 'omni_collaborator_types_enum_constraint',
    update_columns: 'omni_collaborator_types_enum_update_column',
    where: 'omni_collaborator_types_enum_bool_exp',
  },
  omni_collaborator_types_enum_order_by: {
    description: 'order_by',
    product_collaborators_aggregate:
      'omni_product_collaborators_aggregate_order_by',
    value: 'order_by',
  },
  omni_collaborator_types_enum_pk_columns_input: {},
  omni_collaborator_types_enum_select_column: 'enum' as const,
  omni_collaborator_types_enum_set_input: {},
  omni_collaborator_types_enum_stream_cursor_input: {
    initial_value: 'omni_collaborator_types_enum_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_collaborator_types_enum_stream_cursor_value_input: {},
  omni_collaborator_types_enum_update_column: 'enum' as const,
  omni_collaborator_types_enum_updates: {
    _set: 'omni_collaborator_types_enum_set_input',
    where: 'omni_collaborator_types_enum_bool_exp',
  },
  omni_directus_files_aggregate_fields: {
    count: {
      columns: 'omni_directus_files_select_column',
    },
  },
  omni_directus_files_bool_exp: {
    _and: 'omni_directus_files_bool_exp',
    _not: 'omni_directus_files_bool_exp',
    _or: 'omni_directus_files_bool_exp',
    id: 'Int_comparison_exp',
  },
  omni_directus_files_constraint: 'enum' as const,
  omni_directus_files_insert_input: {},
  omni_directus_files_on_conflict: {
    constraint: 'omni_directus_files_constraint',
    update_columns: 'omni_directus_files_update_column',
    where: 'omni_directus_files_bool_exp',
  },
  omni_directus_files_order_by: {
    id: 'order_by',
  },
  omni_directus_files_pk_columns_input: {},
  omni_directus_files_select_column: 'enum' as const,
  omni_directus_files_stream_cursor_input: {
    initial_value: 'omni_directus_files_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_directus_files_stream_cursor_value_input: {},
  omni_directus_files_update_column: 'enum' as const,
  omni_directus_files_updates: {
    where: 'omni_directus_files_bool_exp',
  },
  omni_fullfillers: {
    products: {
      distinct_on: 'omni_products_select_column',
      order_by: 'omni_products_order_by',
      where: 'omni_products_bool_exp',
    },
    products_aggregate: {
      distinct_on: 'omni_products_select_column',
      order_by: 'omni_products_order_by',
      where: 'omni_products_bool_exp',
    },
  },
  omni_fullfillers_aggregate_fields: {
    count: {
      columns: 'omni_fullfillers_select_column',
    },
  },
  omni_fullfillers_bool_exp: {
    _and: 'omni_fullfillers_bool_exp',
    _not: 'omni_fullfillers_bool_exp',
    _or: 'omni_fullfillers_bool_exp',
    address: 'String_comparison_exp',
    created_at: 'timestamptz_comparison_exp',
    email: 'String_comparison_exp',
    eth_address: 'String_comparison_exp',
    id: 'uuid_comparison_exp',
    name: 'String_comparison_exp',
    products: 'omni_products_bool_exp',
    products_aggregate: 'omni_products_aggregate_bool_exp',
    updated_at: 'timestamptz_comparison_exp',
    website_url: 'String_comparison_exp',
  },
  omni_fullfillers_constraint: 'enum' as const,
  omni_fullfillers_insert_input: {
    created_at: 'timestamptz',
    id: 'uuid',
    products: 'omni_products_arr_rel_insert_input',
    updated_at: 'timestamptz',
  },
  omni_fullfillers_obj_rel_insert_input: {
    data: 'omni_fullfillers_insert_input',
    on_conflict: 'omni_fullfillers_on_conflict',
  },
  omni_fullfillers_on_conflict: {
    constraint: 'omni_fullfillers_constraint',
    update_columns: 'omni_fullfillers_update_column',
    where: 'omni_fullfillers_bool_exp',
  },
  omni_fullfillers_order_by: {
    address: 'order_by',
    created_at: 'order_by',
    email: 'order_by',
    eth_address: 'order_by',
    id: 'order_by',
    name: 'order_by',
    products_aggregate: 'omni_products_aggregate_order_by',
    updated_at: 'order_by',
    website_url: 'order_by',
  },
  omni_fullfillers_pk_columns_input: {
    id: 'uuid',
  },
  omni_fullfillers_select_column: 'enum' as const,
  omni_fullfillers_set_input: {
    created_at: 'timestamptz',
    id: 'uuid',
    updated_at: 'timestamptz',
  },
  omni_fullfillers_stream_cursor_input: {
    initial_value: 'omni_fullfillers_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_fullfillers_stream_cursor_value_input: {
    created_at: 'timestamptz',
    id: 'uuid',
    updated_at: 'timestamptz',
  },
  omni_fullfillers_update_column: 'enum' as const,
  omni_fullfillers_updates: {
    _set: 'omni_fullfillers_set_input',
    where: 'omni_fullfillers_bool_exp',
  },
  omni_price_currencies_aggregate_fields: {
    count: {
      columns: 'omni_price_currencies_select_column',
    },
  },
  omni_price_currencies_bool_exp: {
    _and: 'omni_price_currencies_bool_exp',
    _not: 'omni_price_currencies_bool_exp',
    _or: 'omni_price_currencies_bool_exp',
    currency: 'String_comparison_exp',
    id: 'uuid_comparison_exp',
    price: 'numeric_comparison_exp',
  },
  omni_price_currencies_constraint: 'enum' as const,
  omni_price_currencies_inc_input: {
    price: 'numeric',
  },
  omni_price_currencies_insert_input: {
    id: 'uuid',
    price: 'numeric',
  },
  omni_price_currencies_obj_rel_insert_input: {
    data: 'omni_price_currencies_insert_input',
    on_conflict: 'omni_price_currencies_on_conflict',
  },
  omni_price_currencies_on_conflict: {
    constraint: 'omni_price_currencies_constraint',
    update_columns: 'omni_price_currencies_update_column',
    where: 'omni_price_currencies_bool_exp',
  },
  omni_price_currencies_order_by: {
    currency: 'order_by',
    id: 'order_by',
    price: 'order_by',
  },
  omni_price_currencies_pk_columns_input: {
    id: 'uuid',
  },
  omni_price_currencies_select_column: 'enum' as const,
  omni_price_currencies_set_input: {
    id: 'uuid',
    price: 'numeric',
  },
  omni_price_currencies_stream_cursor_input: {
    initial_value: 'omni_price_currencies_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_price_currencies_stream_cursor_value_input: {
    id: 'uuid',
    price: 'numeric',
  },
  omni_price_currencies_update_column: 'enum' as const,
  omni_price_currencies_updates: {
    _inc: 'omni_price_currencies_inc_input',
    _set: 'omni_price_currencies_set_input',
    where: 'omni_price_currencies_bool_exp',
  },
  omni_print_techs_enum: {
    production_materials: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
    production_materials_aggregate: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
  },
  omni_print_techs_enum_aggregate_fields: {
    count: {
      columns: 'omni_print_techs_enum_select_column',
    },
  },
  omni_print_techs_enum_bool_exp: {
    _and: 'omni_print_techs_enum_bool_exp',
    _not: 'omni_print_techs_enum_bool_exp',
    _or: 'omni_print_techs_enum_bool_exp',
    description: 'String_comparison_exp',
    production_materials: 'omni_production_materials_bool_exp',
    production_materials_aggregate:
      'omni_production_materials_aggregate_bool_exp',
    value: 'String_comparison_exp',
  },
  omni_print_techs_enum_constraint: 'enum' as const,
  omni_print_techs_enum_enum: 'enum' as const,
  omni_print_techs_enum_enum_comparison_exp: {
    _eq: 'omni_print_techs_enum_enum',
    _in: 'omni_print_techs_enum_enum',
    _neq: 'omni_print_techs_enum_enum',
    _nin: 'omni_print_techs_enum_enum',
  },
  omni_print_techs_enum_insert_input: {
    production_materials: 'omni_production_materials_arr_rel_insert_input',
  },
  omni_print_techs_enum_obj_rel_insert_input: {
    data: 'omni_print_techs_enum_insert_input',
    on_conflict: 'omni_print_techs_enum_on_conflict',
  },
  omni_print_techs_enum_on_conflict: {
    constraint: 'omni_print_techs_enum_constraint',
    update_columns: 'omni_print_techs_enum_update_column',
    where: 'omni_print_techs_enum_bool_exp',
  },
  omni_print_techs_enum_order_by: {
    description: 'order_by',
    production_materials_aggregate:
      'omni_production_materials_aggregate_order_by',
    value: 'order_by',
  },
  omni_print_techs_enum_pk_columns_input: {},
  omni_print_techs_enum_select_column: 'enum' as const,
  omni_print_techs_enum_set_input: {},
  omni_print_techs_enum_stream_cursor_input: {
    initial_value: 'omni_print_techs_enum_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_print_techs_enum_stream_cursor_value_input: {},
  omni_print_techs_enum_update_column: 'enum' as const,
  omni_print_techs_enum_updates: {
    _set: 'omni_print_techs_enum_set_input',
    where: 'omni_print_techs_enum_bool_exp',
  },
  omni_producer_statuses_enum: {
    producers: {
      distinct_on: 'omni_producers_select_column',
      order_by: 'omni_producers_order_by',
      where: 'omni_producers_bool_exp',
    },
    producers_aggregate: {
      distinct_on: 'omni_producers_select_column',
      order_by: 'omni_producers_order_by',
      where: 'omni_producers_bool_exp',
    },
  },
  omni_producer_statuses_enum_aggregate_fields: {
    count: {
      columns: 'omni_producer_statuses_enum_select_column',
    },
  },
  omni_producer_statuses_enum_bool_exp: {
    _and: 'omni_producer_statuses_enum_bool_exp',
    _not: 'omni_producer_statuses_enum_bool_exp',
    _or: 'omni_producer_statuses_enum_bool_exp',
    description: 'String_comparison_exp',
    producers: 'omni_producers_bool_exp',
    producers_aggregate: 'omni_producers_aggregate_bool_exp',
    value: 'String_comparison_exp',
  },
  omni_producer_statuses_enum_constraint: 'enum' as const,
  omni_producer_statuses_enum_enum: 'enum' as const,
  omni_producer_statuses_enum_enum_comparison_exp: {
    _eq: 'omni_producer_statuses_enum_enum',
    _in: 'omni_producer_statuses_enum_enum',
    _neq: 'omni_producer_statuses_enum_enum',
    _nin: 'omni_producer_statuses_enum_enum',
  },
  omni_producer_statuses_enum_insert_input: {
    producers: 'omni_producers_arr_rel_insert_input',
  },
  omni_producer_statuses_enum_obj_rel_insert_input: {
    data: 'omni_producer_statuses_enum_insert_input',
    on_conflict: 'omni_producer_statuses_enum_on_conflict',
  },
  omni_producer_statuses_enum_on_conflict: {
    constraint: 'omni_producer_statuses_enum_constraint',
    update_columns: 'omni_producer_statuses_enum_update_column',
    where: 'omni_producer_statuses_enum_bool_exp',
  },
  omni_producer_statuses_enum_order_by: {
    description: 'order_by',
    producers_aggregate: 'omni_producers_aggregate_order_by',
    value: 'order_by',
  },
  omni_producer_statuses_enum_pk_columns_input: {},
  omni_producer_statuses_enum_select_column: 'enum' as const,
  omni_producer_statuses_enum_set_input: {},
  omni_producer_statuses_enum_stream_cursor_input: {
    initial_value: 'omni_producer_statuses_enum_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_producer_statuses_enum_stream_cursor_value_input: {},
  omni_producer_statuses_enum_update_column: 'enum' as const,
  omni_producer_statuses_enum_updates: {
    _set: 'omni_producer_statuses_enum_set_input',
    where: 'omni_producer_statuses_enum_bool_exp',
  },
  omni_producers: {
    production_materials_producers: {
      distinct_on: 'omni_production_materials_producers_select_column',
      order_by: 'omni_production_materials_producers_order_by',
      where: 'omni_production_materials_producers_bool_exp',
    },
    production_materials_producers_aggregate: {
      distinct_on: 'omni_production_materials_producers_select_column',
      order_by: 'omni_production_materials_producers_order_by',
      where: 'omni_production_materials_producers_bool_exp',
    },
    production_methods_producers: {
      distinct_on: 'omni_production_methods_producers_select_column',
      order_by: 'omni_production_methods_producers_order_by',
      where: 'omni_production_methods_producers_bool_exp',
    },
    production_methods_producers_aggregate: {
      distinct_on: 'omni_production_methods_producers_select_column',
      order_by: 'omni_production_methods_producers_order_by',
      where: 'omni_production_methods_producers_bool_exp',
    },
    productsByProducer: {
      distinct_on: 'omni_products_select_column',
      order_by: 'omni_products_order_by',
      where: 'omni_products_bool_exp',
    },
    productsByProducer_aggregate: {
      distinct_on: 'omni_products_select_column',
      order_by: 'omni_products_order_by',
      where: 'omni_products_bool_exp',
    },
  },
  omni_producers_aggregate_bool_exp: {
    count: 'omni_producers_aggregate_bool_exp_count',
  },
  omni_producers_aggregate_bool_exp_count: {
    arguments: 'omni_producers_select_column',
    filter: 'omni_producers_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  omni_producers_aggregate_fields: {
    count: {
      columns: 'omni_producers_select_column',
    },
  },
  omni_producers_aggregate_order_by: {
    count: 'order_by',
    max: 'omni_producers_max_order_by',
    min: 'omni_producers_min_order_by',
  },
  omni_producers_arr_rel_insert_input: {
    data: 'omni_producers_insert_input',
    on_conflict: 'omni_producers_on_conflict',
  },
  omni_producers_bool_exp: {
    _and: 'omni_producers_bool_exp',
    _not: 'omni_producers_bool_exp',
    _or: 'omni_producers_bool_exp',
    address: 'String_comparison_exp',
    created_at: 'timestamptz_comparison_exp',
    email: 'String_comparison_exp',
    eth_address: 'String_comparison_exp',
    id: 'uuid_comparison_exp',
    name: 'String_comparison_exp',
    producer_statuses_enum: 'omni_producer_statuses_enum_bool_exp',
    production_materials_producers:
      'omni_production_materials_producers_bool_exp',
    production_materials_producers_aggregate:
      'omni_production_materials_producers_aggregate_bool_exp',
    production_methods_producers: 'omni_production_methods_producers_bool_exp',
    production_methods_producers_aggregate:
      'omni_production_methods_producers_aggregate_bool_exp',
    productsByProducer: 'omni_products_bool_exp',
    productsByProducer_aggregate: 'omni_products_aggregate_bool_exp',
    status: 'omni_producer_statuses_enum_enum_comparison_exp',
    updated_at: 'timestamptz_comparison_exp',
  },
  omni_producers_constraint: 'enum' as const,
  omni_producers_insert_input: {
    created_at: 'timestamptz',
    id: 'uuid',
    producer_statuses_enum: 'omni_producer_statuses_enum_obj_rel_insert_input',
    production_materials_producers:
      'omni_production_materials_producers_arr_rel_insert_input',
    production_methods_producers:
      'omni_production_methods_producers_arr_rel_insert_input',
    productsByProducer: 'omni_products_arr_rel_insert_input',
    status: 'omni_producer_statuses_enum_enum',
    updated_at: 'timestamptz',
  },
  omni_producers_max_order_by: {
    address: 'order_by',
    created_at: 'order_by',
    email: 'order_by',
    eth_address: 'order_by',
    id: 'order_by',
    name: 'order_by',
    updated_at: 'order_by',
  },
  omni_producers_min_order_by: {
    address: 'order_by',
    created_at: 'order_by',
    email: 'order_by',
    eth_address: 'order_by',
    id: 'order_by',
    name: 'order_by',
    updated_at: 'order_by',
  },
  omni_producers_obj_rel_insert_input: {
    data: 'omni_producers_insert_input',
    on_conflict: 'omni_producers_on_conflict',
  },
  omni_producers_on_conflict: {
    constraint: 'omni_producers_constraint',
    update_columns: 'omni_producers_update_column',
    where: 'omni_producers_bool_exp',
  },
  omni_producers_order_by: {
    address: 'order_by',
    created_at: 'order_by',
    email: 'order_by',
    eth_address: 'order_by',
    id: 'order_by',
    name: 'order_by',
    producer_statuses_enum: 'omni_producer_statuses_enum_order_by',
    production_materials_producers_aggregate:
      'omni_production_materials_producers_aggregate_order_by',
    production_methods_producers_aggregate:
      'omni_production_methods_producers_aggregate_order_by',
    productsByProducer_aggregate: 'omni_products_aggregate_order_by',
    status: 'order_by',
    updated_at: 'order_by',
  },
  omni_producers_pk_columns_input: {
    id: 'uuid',
  },
  omni_producers_select_column: 'enum' as const,
  omni_producers_set_input: {
    created_at: 'timestamptz',
    id: 'uuid',
    status: 'omni_producer_statuses_enum_enum',
    updated_at: 'timestamptz',
  },
  omni_producers_stream_cursor_input: {
    initial_value: 'omni_producers_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_producers_stream_cursor_value_input: {
    created_at: 'timestamptz',
    id: 'uuid',
    status: 'omni_producer_statuses_enum_enum',
    updated_at: 'timestamptz',
  },
  omni_producers_update_column: 'enum' as const,
  omni_producers_updates: {
    _set: 'omni_producers_set_input',
    where: 'omni_producers_bool_exp',
  },
  omni_product_collaborators_aggregate_bool_exp: {
    count: 'omni_product_collaborators_aggregate_bool_exp_count',
  },
  omni_product_collaborators_aggregate_bool_exp_count: {
    arguments: 'omni_product_collaborators_select_column',
    filter: 'omni_product_collaborators_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  omni_product_collaborators_aggregate_fields: {
    count: {
      columns: 'omni_product_collaborators_select_column',
    },
  },
  omni_product_collaborators_aggregate_order_by: {
    avg: 'omni_product_collaborators_avg_order_by',
    count: 'order_by',
    max: 'omni_product_collaborators_max_order_by',
    min: 'omni_product_collaborators_min_order_by',
    stddev: 'omni_product_collaborators_stddev_order_by',
    stddev_pop: 'omni_product_collaborators_stddev_pop_order_by',
    stddev_samp: 'omni_product_collaborators_stddev_samp_order_by',
    sum: 'omni_product_collaborators_sum_order_by',
    var_pop: 'omni_product_collaborators_var_pop_order_by',
    var_samp: 'omni_product_collaborators_var_samp_order_by',
    variance: 'omni_product_collaborators_variance_order_by',
  },
  omni_product_collaborators_arr_rel_insert_input: {
    data: 'omni_product_collaborators_insert_input',
    on_conflict: 'omni_product_collaborators_on_conflict',
  },
  omni_product_collaborators_avg_order_by: {
    collaboration_share: 'order_by',
  },
  omni_product_collaborators_bool_exp: {
    _and: 'omni_product_collaborators_bool_exp',
    _not: 'omni_product_collaborators_bool_exp',
    _or: 'omni_product_collaborators_bool_exp',
    collaboration_share: 'numeric_comparison_exp',
    collaborator: 'uuid_comparison_exp',
    collaborator_types_enum: 'omni_collaborator_types_enum_bool_exp',
    id: 'uuid_comparison_exp',
    product: 'uuid_comparison_exp',
    productByProduct: 'omni_products_bool_exp',
    type: 'omni_collaborator_types_enum_enum_comparison_exp',
    user: 'omni_users_bool_exp',
  },
  omni_product_collaborators_constraint: 'enum' as const,
  omni_product_collaborators_inc_input: {
    collaboration_share: 'numeric',
  },
  omni_product_collaborators_insert_input: {
    collaboration_share: 'numeric',
    collaborator: 'uuid',
    collaborator_types_enum:
      'omni_collaborator_types_enum_obj_rel_insert_input',
    id: 'uuid',
    product: 'uuid',
    productByProduct: 'omni_products_obj_rel_insert_input',
    type: 'omni_collaborator_types_enum_enum',
    user: 'omni_users_obj_rel_insert_input',
  },
  omni_product_collaborators_max_order_by: {
    collaboration_share: 'order_by',
    collaborator: 'order_by',
    id: 'order_by',
    product: 'order_by',
  },
  omni_product_collaborators_min_order_by: {
    collaboration_share: 'order_by',
    collaborator: 'order_by',
    id: 'order_by',
    product: 'order_by',
  },
  omni_product_collaborators_on_conflict: {
    constraint: 'omni_product_collaborators_constraint',
    update_columns: 'omni_product_collaborators_update_column',
    where: 'omni_product_collaborators_bool_exp',
  },
  omni_product_collaborators_order_by: {
    collaboration_share: 'order_by',
    collaborator: 'order_by',
    collaborator_types_enum: 'omni_collaborator_types_enum_order_by',
    id: 'order_by',
    product: 'order_by',
    productByProduct: 'omni_products_order_by',
    type: 'order_by',
    user: 'omni_users_order_by',
  },
  omni_product_collaborators_pk_columns_input: {
    id: 'uuid',
  },
  omni_product_collaborators_select_column: 'enum' as const,
  omni_product_collaborators_set_input: {
    collaboration_share: 'numeric',
    collaborator: 'uuid',
    id: 'uuid',
    product: 'uuid',
    type: 'omni_collaborator_types_enum_enum',
  },
  omni_product_collaborators_stddev_order_by: {
    collaboration_share: 'order_by',
  },
  omni_product_collaborators_stddev_pop_order_by: {
    collaboration_share: 'order_by',
  },
  omni_product_collaborators_stddev_samp_order_by: {
    collaboration_share: 'order_by',
  },
  omni_product_collaborators_stream_cursor_input: {
    initial_value: 'omni_product_collaborators_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_product_collaborators_stream_cursor_value_input: {
    collaboration_share: 'numeric',
    collaborator: 'uuid',
    id: 'uuid',
    product: 'uuid',
    type: 'omni_collaborator_types_enum_enum',
  },
  omni_product_collaborators_sum_order_by: {
    collaboration_share: 'order_by',
  },
  omni_product_collaborators_update_column: 'enum' as const,
  omni_product_collaborators_updates: {
    _inc: 'omni_product_collaborators_inc_input',
    _set: 'omni_product_collaborators_set_input',
    where: 'omni_product_collaborators_bool_exp',
  },
  omni_product_collaborators_var_pop_order_by: {
    collaboration_share: 'order_by',
  },
  omni_product_collaborators_var_samp_order_by: {
    collaboration_share: 'order_by',
  },
  omni_product_collaborators_variance_order_by: {
    collaboration_share: 'order_by',
  },
  omni_product_types_enum: {
    production_materials: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
    production_materials_aggregate: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
  },
  omni_product_types_enum_aggregate_fields: {
    count: {
      columns: 'omni_product_types_enum_select_column',
    },
  },
  omni_product_types_enum_bool_exp: {
    _and: 'omni_product_types_enum_bool_exp',
    _not: 'omni_product_types_enum_bool_exp',
    _or: 'omni_product_types_enum_bool_exp',
    description: 'String_comparison_exp',
    production_materials: 'omni_production_materials_bool_exp',
    production_materials_aggregate:
      'omni_production_materials_aggregate_bool_exp',
    value: 'String_comparison_exp',
  },
  omni_product_types_enum_constraint: 'enum' as const,
  omni_product_types_enum_insert_input: {
    production_materials: 'omni_production_materials_arr_rel_insert_input',
  },
  omni_product_types_enum_obj_rel_insert_input: {
    data: 'omni_product_types_enum_insert_input',
    on_conflict: 'omni_product_types_enum_on_conflict',
  },
  omni_product_types_enum_on_conflict: {
    constraint: 'omni_product_types_enum_constraint',
    update_columns: 'omni_product_types_enum_update_column',
    where: 'omni_product_types_enum_bool_exp',
  },
  omni_product_types_enum_order_by: {
    description: 'order_by',
    production_materials_aggregate:
      'omni_production_materials_aggregate_order_by',
    value: 'order_by',
  },
  omni_product_types_enum_pk_columns_input: {},
  omni_product_types_enum_select_column: 'enum' as const,
  omni_product_types_enum_set_input: {},
  omni_product_types_enum_stream_cursor_input: {
    initial_value: 'omni_product_types_enum_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_product_types_enum_stream_cursor_value_input: {},
  omni_product_types_enum_update_column: 'enum' as const,
  omni_product_types_enum_updates: {
    _set: 'omni_product_types_enum_set_input',
    where: 'omni_product_types_enum_bool_exp',
  },
  omni_production_genders_enum: {
    production_materials: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
    production_materials_aggregate: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
  },
  omni_production_genders_enum_aggregate_fields: {
    count: {
      columns: 'omni_production_genders_enum_select_column',
    },
  },
  omni_production_genders_enum_bool_exp: {
    _and: 'omni_production_genders_enum_bool_exp',
    _not: 'omni_production_genders_enum_bool_exp',
    _or: 'omni_production_genders_enum_bool_exp',
    description: 'String_comparison_exp',
    production_materials: 'omni_production_materials_bool_exp',
    production_materials_aggregate:
      'omni_production_materials_aggregate_bool_exp',
    value: 'String_comparison_exp',
  },
  omni_production_genders_enum_constraint: 'enum' as const,
  omni_production_genders_enum_enum: 'enum' as const,
  omni_production_genders_enum_enum_comparison_exp: {
    _eq: 'omni_production_genders_enum_enum',
    _in: 'omni_production_genders_enum_enum',
    _neq: 'omni_production_genders_enum_enum',
    _nin: 'omni_production_genders_enum_enum',
  },
  omni_production_genders_enum_insert_input: {
    production_materials: 'omni_production_materials_arr_rel_insert_input',
  },
  omni_production_genders_enum_obj_rel_insert_input: {
    data: 'omni_production_genders_enum_insert_input',
    on_conflict: 'omni_production_genders_enum_on_conflict',
  },
  omni_production_genders_enum_on_conflict: {
    constraint: 'omni_production_genders_enum_constraint',
    update_columns: 'omni_production_genders_enum_update_column',
    where: 'omni_production_genders_enum_bool_exp',
  },
  omni_production_genders_enum_order_by: {
    description: 'order_by',
    production_materials_aggregate:
      'omni_production_materials_aggregate_order_by',
    value: 'order_by',
  },
  omni_production_genders_enum_pk_columns_input: {},
  omni_production_genders_enum_select_column: 'enum' as const,
  omni_production_genders_enum_set_input: {},
  omni_production_genders_enum_stream_cursor_input: {
    initial_value: 'omni_production_genders_enum_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_production_genders_enum_stream_cursor_value_input: {},
  omni_production_genders_enum_update_column: 'enum' as const,
  omni_production_genders_enum_updates: {
    _set: 'omni_production_genders_enum_set_input',
    where: 'omni_production_genders_enum_bool_exp',
  },
  omni_production_materials: {
    production_materials_producers: {
      distinct_on: 'omni_production_materials_producers_select_column',
      order_by: 'omni_production_materials_producers_order_by',
      where: 'omni_production_materials_producers_bool_exp',
    },
    production_materials_producers_aggregate: {
      distinct_on: 'omni_production_materials_producers_select_column',
      order_by: 'omni_production_materials_producers_order_by',
      where: 'omni_production_materials_producers_bool_exp',
    },
    used_in_products: {
      distinct_on: 'omni_products_production_materials_select_column',
      order_by: 'omni_products_production_materials_order_by',
      where: 'omni_products_production_materials_bool_exp',
    },
    used_in_products_aggregate: {
      distinct_on: 'omni_products_production_materials_select_column',
      order_by: 'omni_products_production_materials_order_by',
      where: 'omni_products_production_materials_bool_exp',
    },
  },
  omni_production_materials_aggregate_bool_exp: {
    bool_and: 'omni_production_materials_aggregate_bool_exp_bool_and',
    bool_or: 'omni_production_materials_aggregate_bool_exp_bool_or',
    count: 'omni_production_materials_aggregate_bool_exp_count',
  },
  omni_production_materials_aggregate_bool_exp_bool_and: {
    arguments:
      'omni_production_materials_select_column_omni_production_materials_aggregate_bool_exp_bool_and_arguments_columns',
    filter: 'omni_production_materials_bool_exp',
    predicate: 'Boolean_comparison_exp',
  },
  omni_production_materials_aggregate_bool_exp_bool_or: {
    arguments:
      'omni_production_materials_select_column_omni_production_materials_aggregate_bool_exp_bool_or_arguments_columns',
    filter: 'omni_production_materials_bool_exp',
    predicate: 'Boolean_comparison_exp',
  },
  omni_production_materials_aggregate_bool_exp_count: {
    arguments: 'omni_production_materials_select_column',
    filter: 'omni_production_materials_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  omni_production_materials_aggregate_fields: {
    count: {
      columns: 'omni_production_materials_select_column',
    },
  },
  omni_production_materials_aggregate_order_by: {
    avg: 'omni_production_materials_avg_order_by',
    count: 'order_by',
    max: 'omni_production_materials_max_order_by',
    min: 'omni_production_materials_min_order_by',
    stddev: 'omni_production_materials_stddev_order_by',
    stddev_pop: 'omni_production_materials_stddev_pop_order_by',
    stddev_samp: 'omni_production_materials_stddev_samp_order_by',
    sum: 'omni_production_materials_sum_order_by',
    var_pop: 'omni_production_materials_var_pop_order_by',
    var_samp: 'omni_production_materials_var_samp_order_by',
    variance: 'omni_production_materials_variance_order_by',
  },
  omni_production_materials_arr_rel_insert_input: {
    data: 'omni_production_materials_insert_input',
    on_conflict: 'omni_production_materials_on_conflict',
  },
  omni_production_materials_avg_order_by: {
    base_price: 'order_by',
  },
  omni_production_materials_bool_exp: {
    _and: 'omni_production_materials_bool_exp',
    _not: 'omni_production_materials_bool_exp',
    _or: 'omni_production_materials_bool_exp',
    base_price: 'numeric_comparison_exp',
    composition: 'String_comparison_exp',
    created_at: 'timestamptz_comparison_exp',
    description: 'String_comparison_exp',
    gender: 'omni_production_genders_enum_enum_comparison_exp',
    id: 'uuid_comparison_exp',
    name: 'String_comparison_exp',
    neck_tag: 'Boolean_comparison_exp',
    pallette: 'omni_production_pallettes_enum_enum_comparison_exp',
    print_tech: 'omni_print_techs_enum_enum_comparison_exp',
    print_techs_enum: 'omni_print_techs_enum_bool_exp',
    product_types_enum: 'omni_product_types_enum_bool_exp',
    production_genders_enum: 'omni_production_genders_enum_bool_exp',
    production_materials_producers:
      'omni_production_materials_producers_bool_exp',
    production_materials_producers_aggregate:
      'omni_production_materials_producers_aggregate_bool_exp',
    production_materials_ratings_enum:
      'omni_production_materials_ratings_enum_bool_exp',
    production_pallettes_enum: 'omni_production_pallettes_enum_bool_exp',
    production_styles_enum: 'omni_production_styles_enum_bool_exp',
    rating: 'omni_production_materials_ratings_enum_enum_comparison_exp',
    size_guide: 'String_comparison_exp',
    style: 'omni_production_styles_enum_enum_comparison_exp',
    style_number: 'String_comparison_exp',
    type: 'String_comparison_exp',
    updated_at: 'timestamptz_comparison_exp',
    used_in_products: 'omni_products_production_materials_bool_exp',
    used_in_products_aggregate:
      'omni_products_production_materials_aggregate_bool_exp',
  },
  omni_production_materials_constraint: 'enum' as const,
  omni_production_materials_inc_input: {
    base_price: 'numeric',
  },
  omni_production_materials_insert_input: {
    base_price: 'numeric',
    created_at: 'timestamptz',
    gender: 'omni_production_genders_enum_enum',
    id: 'uuid',
    pallette: 'omni_production_pallettes_enum_enum',
    print_tech: 'omni_print_techs_enum_enum',
    print_techs_enum: 'omni_print_techs_enum_obj_rel_insert_input',
    product_types_enum: 'omni_product_types_enum_obj_rel_insert_input',
    production_genders_enum:
      'omni_production_genders_enum_obj_rel_insert_input',
    production_materials_producers:
      'omni_production_materials_producers_arr_rel_insert_input',
    production_materials_ratings_enum:
      'omni_production_materials_ratings_enum_obj_rel_insert_input',
    production_pallettes_enum:
      'omni_production_pallettes_enum_obj_rel_insert_input',
    production_styles_enum: 'omni_production_styles_enum_obj_rel_insert_input',
    rating: 'omni_production_materials_ratings_enum_enum',
    style: 'omni_production_styles_enum_enum',
    updated_at: 'timestamptz',
    used_in_products: 'omni_products_production_materials_arr_rel_insert_input',
  },
  omni_production_materials_max_order_by: {
    base_price: 'order_by',
    composition: 'order_by',
    created_at: 'order_by',
    description: 'order_by',
    id: 'order_by',
    name: 'order_by',
    size_guide: 'order_by',
    style_number: 'order_by',
    type: 'order_by',
    updated_at: 'order_by',
  },
  omni_production_materials_min_order_by: {
    base_price: 'order_by',
    composition: 'order_by',
    created_at: 'order_by',
    description: 'order_by',
    id: 'order_by',
    name: 'order_by',
    size_guide: 'order_by',
    style_number: 'order_by',
    type: 'order_by',
    updated_at: 'order_by',
  },
  omni_production_materials_obj_rel_insert_input: {
    data: 'omni_production_materials_insert_input',
    on_conflict: 'omni_production_materials_on_conflict',
  },
  omni_production_materials_on_conflict: {
    constraint: 'omni_production_materials_constraint',
    update_columns: 'omni_production_materials_update_column',
    where: 'omni_production_materials_bool_exp',
  },
  omni_production_materials_order_by: {
    base_price: 'order_by',
    composition: 'order_by',
    created_at: 'order_by',
    description: 'order_by',
    gender: 'order_by',
    id: 'order_by',
    name: 'order_by',
    neck_tag: 'order_by',
    pallette: 'order_by',
    print_tech: 'order_by',
    print_techs_enum: 'omni_print_techs_enum_order_by',
    product_types_enum: 'omni_product_types_enum_order_by',
    production_genders_enum: 'omni_production_genders_enum_order_by',
    production_materials_producers_aggregate:
      'omni_production_materials_producers_aggregate_order_by',
    production_materials_ratings_enum:
      'omni_production_materials_ratings_enum_order_by',
    production_pallettes_enum: 'omni_production_pallettes_enum_order_by',
    production_styles_enum: 'omni_production_styles_enum_order_by',
    rating: 'order_by',
    size_guide: 'order_by',
    style: 'order_by',
    style_number: 'order_by',
    type: 'order_by',
    updated_at: 'order_by',
    used_in_products_aggregate:
      'omni_products_production_materials_aggregate_order_by',
  },
  omni_production_materials_pk_columns_input: {
    id: 'uuid',
  },
  omni_production_materials_producers_aggregate_bool_exp: {
    count: 'omni_production_materials_producers_aggregate_bool_exp_count',
  },
  omni_production_materials_producers_aggregate_bool_exp_count: {
    arguments: 'omni_production_materials_producers_select_column',
    filter: 'omni_production_materials_producers_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  omni_production_materials_producers_aggregate_fields: {
    count: {
      columns: 'omni_production_materials_producers_select_column',
    },
  },
  omni_production_materials_producers_aggregate_order_by: {
    count: 'order_by',
    max: 'omni_production_materials_producers_max_order_by',
    min: 'omni_production_materials_producers_min_order_by',
  },
  omni_production_materials_producers_arr_rel_insert_input: {
    data: 'omni_production_materials_producers_insert_input',
    on_conflict: 'omni_production_materials_producers_on_conflict',
  },
  omni_production_materials_producers_bool_exp: {
    _and: 'omni_production_materials_producers_bool_exp',
    _not: 'omni_production_materials_producers_bool_exp',
    _or: 'omni_production_materials_producers_bool_exp',
    id: 'uuid_comparison_exp',
    producer: 'uuid_comparison_exp',
    producerByProducer: 'omni_producers_bool_exp',
    productionMaterialByProductionMaterial:
      'omni_production_materials_bool_exp',
    production_material: 'uuid_comparison_exp',
  },
  omni_production_materials_producers_constraint: 'enum' as const,
  omni_production_materials_producers_insert_input: {
    id: 'uuid',
    producer: 'uuid',
    producerByProducer: 'omni_producers_obj_rel_insert_input',
    productionMaterialByProductionMaterial:
      'omni_production_materials_obj_rel_insert_input',
    production_material: 'uuid',
  },
  omni_production_materials_producers_max_order_by: {
    id: 'order_by',
    producer: 'order_by',
    production_material: 'order_by',
  },
  omni_production_materials_producers_min_order_by: {
    id: 'order_by',
    producer: 'order_by',
    production_material: 'order_by',
  },
  omni_production_materials_producers_on_conflict: {
    constraint: 'omni_production_materials_producers_constraint',
    update_columns: 'omni_production_materials_producers_update_column',
    where: 'omni_production_materials_producers_bool_exp',
  },
  omni_production_materials_producers_order_by: {
    id: 'order_by',
    producer: 'order_by',
    producerByProducer: 'omni_producers_order_by',
    productionMaterialByProductionMaterial:
      'omni_production_materials_order_by',
    production_material: 'order_by',
  },
  omni_production_materials_producers_pk_columns_input: {
    id: 'uuid',
  },
  omni_production_materials_producers_select_column: 'enum' as const,
  omni_production_materials_producers_set_input: {
    id: 'uuid',
    producer: 'uuid',
    production_material: 'uuid',
  },
  omni_production_materials_producers_stream_cursor_input: {
    initial_value:
      'omni_production_materials_producers_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_production_materials_producers_stream_cursor_value_input: {
    id: 'uuid',
    producer: 'uuid',
    production_material: 'uuid',
  },
  omni_production_materials_producers_update_column: 'enum' as const,
  omni_production_materials_producers_updates: {
    _set: 'omni_production_materials_producers_set_input',
    where: 'omni_production_materials_producers_bool_exp',
  },
  omni_production_materials_ratings_enum: {
    production_materials: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
    production_materials_aggregate: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
  },
  omni_production_materials_ratings_enum_aggregate_fields: {
    count: {
      columns: 'omni_production_materials_ratings_enum_select_column',
    },
  },
  omni_production_materials_ratings_enum_bool_exp: {
    _and: 'omni_production_materials_ratings_enum_bool_exp',
    _not: 'omni_production_materials_ratings_enum_bool_exp',
    _or: 'omni_production_materials_ratings_enum_bool_exp',
    description: 'String_comparison_exp',
    production_materials: 'omni_production_materials_bool_exp',
    production_materials_aggregate:
      'omni_production_materials_aggregate_bool_exp',
    value: 'String_comparison_exp',
  },
  omni_production_materials_ratings_enum_constraint: 'enum' as const,
  omni_production_materials_ratings_enum_enum: 'enum' as const,
  omni_production_materials_ratings_enum_enum_comparison_exp: {
    _eq: 'omni_production_materials_ratings_enum_enum',
    _in: 'omni_production_materials_ratings_enum_enum',
    _neq: 'omni_production_materials_ratings_enum_enum',
    _nin: 'omni_production_materials_ratings_enum_enum',
  },
  omni_production_materials_ratings_enum_insert_input: {
    production_materials: 'omni_production_materials_arr_rel_insert_input',
  },
  omni_production_materials_ratings_enum_obj_rel_insert_input: {
    data: 'omni_production_materials_ratings_enum_insert_input',
    on_conflict: 'omni_production_materials_ratings_enum_on_conflict',
  },
  omni_production_materials_ratings_enum_on_conflict: {
    constraint: 'omni_production_materials_ratings_enum_constraint',
    update_columns: 'omni_production_materials_ratings_enum_update_column',
    where: 'omni_production_materials_ratings_enum_bool_exp',
  },
  omni_production_materials_ratings_enum_order_by: {
    description: 'order_by',
    production_materials_aggregate:
      'omni_production_materials_aggregate_order_by',
    value: 'order_by',
  },
  omni_production_materials_ratings_enum_pk_columns_input: {},
  omni_production_materials_ratings_enum_select_column: 'enum' as const,
  omni_production_materials_ratings_enum_set_input: {},
  omni_production_materials_ratings_enum_stream_cursor_input: {
    initial_value:
      'omni_production_materials_ratings_enum_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_production_materials_ratings_enum_stream_cursor_value_input: {},
  omni_production_materials_ratings_enum_update_column: 'enum' as const,
  omni_production_materials_ratings_enum_updates: {
    _set: 'omni_production_materials_ratings_enum_set_input',
    where: 'omni_production_materials_ratings_enum_bool_exp',
  },
  omni_production_materials_select_column: 'enum' as const,
  omni_production_materials_select_column_omni_production_materials_aggregate_bool_exp_bool_and_arguments_columns:
    'enum' as const,
  omni_production_materials_select_column_omni_production_materials_aggregate_bool_exp_bool_or_arguments_columns:
    'enum' as const,
  omni_production_materials_set_input: {
    base_price: 'numeric',
    created_at: 'timestamptz',
    gender: 'omni_production_genders_enum_enum',
    id: 'uuid',
    pallette: 'omni_production_pallettes_enum_enum',
    print_tech: 'omni_print_techs_enum_enum',
    rating: 'omni_production_materials_ratings_enum_enum',
    style: 'omni_production_styles_enum_enum',
    updated_at: 'timestamptz',
  },
  omni_production_materials_stddev_order_by: {
    base_price: 'order_by',
  },
  omni_production_materials_stddev_pop_order_by: {
    base_price: 'order_by',
  },
  omni_production_materials_stddev_samp_order_by: {
    base_price: 'order_by',
  },
  omni_production_materials_stream_cursor_input: {
    initial_value: 'omni_production_materials_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_production_materials_stream_cursor_value_input: {
    base_price: 'numeric',
    created_at: 'timestamptz',
    gender: 'omni_production_genders_enum_enum',
    id: 'uuid',
    pallette: 'omni_production_pallettes_enum_enum',
    print_tech: 'omni_print_techs_enum_enum',
    rating: 'omni_production_materials_ratings_enum_enum',
    style: 'omni_production_styles_enum_enum',
    updated_at: 'timestamptz',
  },
  omni_production_materials_sum_order_by: {
    base_price: 'order_by',
  },
  omni_production_materials_update_column: 'enum' as const,
  omni_production_materials_updates: {
    _inc: 'omni_production_materials_inc_input',
    _set: 'omni_production_materials_set_input',
    where: 'omni_production_materials_bool_exp',
  },
  omni_production_materials_var_pop_order_by: {
    base_price: 'order_by',
  },
  omni_production_materials_var_samp_order_by: {
    base_price: 'order_by',
  },
  omni_production_materials_variance_order_by: {
    base_price: 'order_by',
  },
  omni_production_methods: {
    production_methods_producers: {
      distinct_on: 'omni_production_methods_producers_select_column',
      order_by: 'omni_production_methods_producers_order_by',
      where: 'omni_production_methods_producers_bool_exp',
    },
    production_methods_producers_aggregate: {
      distinct_on: 'omni_production_methods_producers_select_column',
      order_by: 'omni_production_methods_producers_order_by',
      where: 'omni_production_methods_producers_bool_exp',
    },
    production_methods_products: {
      distinct_on: 'omni_production_methods_products_select_column',
      order_by: 'omni_production_methods_products_order_by',
      where: 'omni_production_methods_products_bool_exp',
    },
    production_methods_products_aggregate: {
      distinct_on: 'omni_production_methods_products_select_column',
      order_by: 'omni_production_methods_products_order_by',
      where: 'omni_production_methods_products_bool_exp',
    },
  },
  omni_production_methods_aggregate_fields: {
    count: {
      columns: 'omni_production_methods_select_column',
    },
  },
  omni_production_methods_bool_exp: {
    _and: 'omni_production_methods_bool_exp',
    _not: 'omni_production_methods_bool_exp',
    _or: 'omni_production_methods_bool_exp',
    created_at: 'timestamptz_comparison_exp',
    description: 'String_comparison_exp',
    id: 'uuid_comparison_exp',
    name: 'String_comparison_exp',
    production_methods_producers: 'omni_production_methods_producers_bool_exp',
    production_methods_producers_aggregate:
      'omni_production_methods_producers_aggregate_bool_exp',
    production_methods_products: 'omni_production_methods_products_bool_exp',
    production_methods_products_aggregate:
      'omni_production_methods_products_aggregate_bool_exp',
    updated_at: 'timestamptz_comparison_exp',
  },
  omni_production_methods_constraint: 'enum' as const,
  omni_production_methods_insert_input: {
    created_at: 'timestamptz',
    id: 'uuid',
    production_methods_producers:
      'omni_production_methods_producers_arr_rel_insert_input',
    production_methods_products:
      'omni_production_methods_products_arr_rel_insert_input',
    updated_at: 'timestamptz',
  },
  omni_production_methods_obj_rel_insert_input: {
    data: 'omni_production_methods_insert_input',
    on_conflict: 'omni_production_methods_on_conflict',
  },
  omni_production_methods_on_conflict: {
    constraint: 'omni_production_methods_constraint',
    update_columns: 'omni_production_methods_update_column',
    where: 'omni_production_methods_bool_exp',
  },
  omni_production_methods_order_by: {
    created_at: 'order_by',
    description: 'order_by',
    id: 'order_by',
    name: 'order_by',
    production_methods_producers_aggregate:
      'omni_production_methods_producers_aggregate_order_by',
    production_methods_products_aggregate:
      'omni_production_methods_products_aggregate_order_by',
    updated_at: 'order_by',
  },
  omni_production_methods_pk_columns_input: {
    id: 'uuid',
  },
  omni_production_methods_producers_aggregate_bool_exp: {
    count: 'omni_production_methods_producers_aggregate_bool_exp_count',
  },
  omni_production_methods_producers_aggregate_bool_exp_count: {
    arguments: 'omni_production_methods_producers_select_column',
    filter: 'omni_production_methods_producers_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  omni_production_methods_producers_aggregate_fields: {
    count: {
      columns: 'omni_production_methods_producers_select_column',
    },
  },
  omni_production_methods_producers_aggregate_order_by: {
    count: 'order_by',
    max: 'omni_production_methods_producers_max_order_by',
    min: 'omni_production_methods_producers_min_order_by',
  },
  omni_production_methods_producers_arr_rel_insert_input: {
    data: 'omni_production_methods_producers_insert_input',
    on_conflict: 'omni_production_methods_producers_on_conflict',
  },
  omni_production_methods_producers_bool_exp: {
    _and: 'omni_production_methods_producers_bool_exp',
    _not: 'omni_production_methods_producers_bool_exp',
    _or: 'omni_production_methods_producers_bool_exp',
    id: 'uuid_comparison_exp',
    producer: 'uuid_comparison_exp',
    producerByProducer: 'omni_producers_bool_exp',
    productionMethodByProductionMethod: 'omni_production_methods_bool_exp',
    production_method: 'uuid_comparison_exp',
  },
  omni_production_methods_producers_constraint: 'enum' as const,
  omni_production_methods_producers_insert_input: {
    id: 'uuid',
    producer: 'uuid',
    producerByProducer: 'omni_producers_obj_rel_insert_input',
    productionMethodByProductionMethod:
      'omni_production_methods_obj_rel_insert_input',
    production_method: 'uuid',
  },
  omni_production_methods_producers_max_order_by: {
    id: 'order_by',
    producer: 'order_by',
    production_method: 'order_by',
  },
  omni_production_methods_producers_min_order_by: {
    id: 'order_by',
    producer: 'order_by',
    production_method: 'order_by',
  },
  omni_production_methods_producers_on_conflict: {
    constraint: 'omni_production_methods_producers_constraint',
    update_columns: 'omni_production_methods_producers_update_column',
    where: 'omni_production_methods_producers_bool_exp',
  },
  omni_production_methods_producers_order_by: {
    id: 'order_by',
    producer: 'order_by',
    producerByProducer: 'omni_producers_order_by',
    productionMethodByProductionMethod: 'omni_production_methods_order_by',
    production_method: 'order_by',
  },
  omni_production_methods_producers_pk_columns_input: {
    id: 'uuid',
  },
  omni_production_methods_producers_select_column: 'enum' as const,
  omni_production_methods_producers_set_input: {
    id: 'uuid',
    producer: 'uuid',
    production_method: 'uuid',
  },
  omni_production_methods_producers_stream_cursor_input: {
    initial_value:
      'omni_production_methods_producers_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_production_methods_producers_stream_cursor_value_input: {
    id: 'uuid',
    producer: 'uuid',
    production_method: 'uuid',
  },
  omni_production_methods_producers_update_column: 'enum' as const,
  omni_production_methods_producers_updates: {
    _set: 'omni_production_methods_producers_set_input',
    where: 'omni_production_methods_producers_bool_exp',
  },
  omni_production_methods_products_aggregate_bool_exp: {
    count: 'omni_production_methods_products_aggregate_bool_exp_count',
  },
  omni_production_methods_products_aggregate_bool_exp_count: {
    arguments: 'omni_production_methods_products_select_column',
    filter: 'omni_production_methods_products_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  omni_production_methods_products_aggregate_fields: {
    count: {
      columns: 'omni_production_methods_products_select_column',
    },
  },
  omni_production_methods_products_aggregate_order_by: {
    count: 'order_by',
    max: 'omni_production_methods_products_max_order_by',
    min: 'omni_production_methods_products_min_order_by',
  },
  omni_production_methods_products_arr_rel_insert_input: {
    data: 'omni_production_methods_products_insert_input',
    on_conflict: 'omni_production_methods_products_on_conflict',
  },
  omni_production_methods_products_bool_exp: {
    _and: 'omni_production_methods_products_bool_exp',
    _not: 'omni_production_methods_products_bool_exp',
    _or: 'omni_production_methods_products_bool_exp',
    id: 'uuid_comparison_exp',
    product: 'uuid_comparison_exp',
    productByProduct: 'omni_products_bool_exp',
    productionMethodByProductionMethod: 'omni_production_methods_bool_exp',
    production_method: 'uuid_comparison_exp',
  },
  omni_production_methods_products_constraint: 'enum' as const,
  omni_production_methods_products_insert_input: {
    id: 'uuid',
    product: 'uuid',
    productByProduct: 'omni_products_obj_rel_insert_input',
    productionMethodByProductionMethod:
      'omni_production_methods_obj_rel_insert_input',
    production_method: 'uuid',
  },
  omni_production_methods_products_max_order_by: {
    id: 'order_by',
    product: 'order_by',
    production_method: 'order_by',
  },
  omni_production_methods_products_min_order_by: {
    id: 'order_by',
    product: 'order_by',
    production_method: 'order_by',
  },
  omni_production_methods_products_on_conflict: {
    constraint: 'omni_production_methods_products_constraint',
    update_columns: 'omni_production_methods_products_update_column',
    where: 'omni_production_methods_products_bool_exp',
  },
  omni_production_methods_products_order_by: {
    id: 'order_by',
    product: 'order_by',
    productByProduct: 'omni_products_order_by',
    productionMethodByProductionMethod: 'omni_production_methods_order_by',
    production_method: 'order_by',
  },
  omni_production_methods_products_pk_columns_input: {
    id: 'uuid',
  },
  omni_production_methods_products_select_column: 'enum' as const,
  omni_production_methods_products_set_input: {
    id: 'uuid',
    product: 'uuid',
    production_method: 'uuid',
  },
  omni_production_methods_products_stream_cursor_input: {
    initial_value: 'omni_production_methods_products_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_production_methods_products_stream_cursor_value_input: {
    id: 'uuid',
    product: 'uuid',
    production_method: 'uuid',
  },
  omni_production_methods_products_update_column: 'enum' as const,
  omni_production_methods_products_updates: {
    _set: 'omni_production_methods_products_set_input',
    where: 'omni_production_methods_products_bool_exp',
  },
  omni_production_methods_select_column: 'enum' as const,
  omni_production_methods_set_input: {
    created_at: 'timestamptz',
    id: 'uuid',
    updated_at: 'timestamptz',
  },
  omni_production_methods_stream_cursor_input: {
    initial_value: 'omni_production_methods_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_production_methods_stream_cursor_value_input: {
    created_at: 'timestamptz',
    id: 'uuid',
    updated_at: 'timestamptz',
  },
  omni_production_methods_update_column: 'enum' as const,
  omni_production_methods_updates: {
    _set: 'omni_production_methods_set_input',
    where: 'omni_production_methods_bool_exp',
  },
  omni_production_pallettes_enum: {
    production_materials: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
    production_materials_aggregate: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
  },
  omni_production_pallettes_enum_aggregate_fields: {
    count: {
      columns: 'omni_production_pallettes_enum_select_column',
    },
  },
  omni_production_pallettes_enum_bool_exp: {
    _and: 'omni_production_pallettes_enum_bool_exp',
    _not: 'omni_production_pallettes_enum_bool_exp',
    _or: 'omni_production_pallettes_enum_bool_exp',
    description: 'String_comparison_exp',
    production_materials: 'omni_production_materials_bool_exp',
    production_materials_aggregate:
      'omni_production_materials_aggregate_bool_exp',
    value: 'String_comparison_exp',
  },
  omni_production_pallettes_enum_constraint: 'enum' as const,
  omni_production_pallettes_enum_enum: 'enum' as const,
  omni_production_pallettes_enum_enum_comparison_exp: {
    _eq: 'omni_production_pallettes_enum_enum',
    _in: 'omni_production_pallettes_enum_enum',
    _neq: 'omni_production_pallettes_enum_enum',
    _nin: 'omni_production_pallettes_enum_enum',
  },
  omni_production_pallettes_enum_insert_input: {
    production_materials: 'omni_production_materials_arr_rel_insert_input',
  },
  omni_production_pallettes_enum_obj_rel_insert_input: {
    data: 'omni_production_pallettes_enum_insert_input',
    on_conflict: 'omni_production_pallettes_enum_on_conflict',
  },
  omni_production_pallettes_enum_on_conflict: {
    constraint: 'omni_production_pallettes_enum_constraint',
    update_columns: 'omni_production_pallettes_enum_update_column',
    where: 'omni_production_pallettes_enum_bool_exp',
  },
  omni_production_pallettes_enum_order_by: {
    description: 'order_by',
    production_materials_aggregate:
      'omni_production_materials_aggregate_order_by',
    value: 'order_by',
  },
  omni_production_pallettes_enum_pk_columns_input: {},
  omni_production_pallettes_enum_select_column: 'enum' as const,
  omni_production_pallettes_enum_set_input: {},
  omni_production_pallettes_enum_stream_cursor_input: {
    initial_value: 'omni_production_pallettes_enum_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_production_pallettes_enum_stream_cursor_value_input: {},
  omni_production_pallettes_enum_update_column: 'enum' as const,
  omni_production_pallettes_enum_updates: {
    _set: 'omni_production_pallettes_enum_set_input',
    where: 'omni_production_pallettes_enum_bool_exp',
  },
  omni_production_styles_enum: {
    production_materials: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
    production_materials_aggregate: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
  },
  omni_production_styles_enum_aggregate_fields: {
    count: {
      columns: 'omni_production_styles_enum_select_column',
    },
  },
  omni_production_styles_enum_bool_exp: {
    _and: 'omni_production_styles_enum_bool_exp',
    _not: 'omni_production_styles_enum_bool_exp',
    _or: 'omni_production_styles_enum_bool_exp',
    description: 'String_comparison_exp',
    production_materials: 'omni_production_materials_bool_exp',
    production_materials_aggregate:
      'omni_production_materials_aggregate_bool_exp',
    value: 'String_comparison_exp',
  },
  omni_production_styles_enum_constraint: 'enum' as const,
  omni_production_styles_enum_enum: 'enum' as const,
  omni_production_styles_enum_enum_comparison_exp: {
    _eq: 'omni_production_styles_enum_enum',
    _in: 'omni_production_styles_enum_enum',
    _neq: 'omni_production_styles_enum_enum',
    _nin: 'omni_production_styles_enum_enum',
  },
  omni_production_styles_enum_insert_input: {
    production_materials: 'omni_production_materials_arr_rel_insert_input',
  },
  omni_production_styles_enum_obj_rel_insert_input: {
    data: 'omni_production_styles_enum_insert_input',
    on_conflict: 'omni_production_styles_enum_on_conflict',
  },
  omni_production_styles_enum_on_conflict: {
    constraint: 'omni_production_styles_enum_constraint',
    update_columns: 'omni_production_styles_enum_update_column',
    where: 'omni_production_styles_enum_bool_exp',
  },
  omni_production_styles_enum_order_by: {
    description: 'order_by',
    production_materials_aggregate:
      'omni_production_materials_aggregate_order_by',
    value: 'order_by',
  },
  omni_production_styles_enum_pk_columns_input: {},
  omni_production_styles_enum_select_column: 'enum' as const,
  omni_production_styles_enum_set_input: {},
  omni_production_styles_enum_stream_cursor_input: {
    initial_value: 'omni_production_styles_enum_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_production_styles_enum_stream_cursor_value_input: {},
  omni_production_styles_enum_update_column: 'enum' as const,
  omni_production_styles_enum_updates: {
    _set: 'omni_production_styles_enum_set_input',
    where: 'omni_production_styles_enum_bool_exp',
  },
  omni_products: {
    files: {
      distinct_on: 'omni_products_files_select_column',
      order_by: 'omni_products_files_order_by',
      where: 'omni_products_files_bool_exp',
    },
    files_aggregate: {
      distinct_on: 'omni_products_files_select_column',
      order_by: 'omni_products_files_order_by',
      where: 'omni_products_files_bool_exp',
    },
    product_collaborators: {
      distinct_on: 'omni_product_collaborators_select_column',
      order_by: 'omni_product_collaborators_order_by',
      where: 'omni_product_collaborators_bool_exp',
    },
    product_collaborators_aggregate: {
      distinct_on: 'omni_product_collaborators_select_column',
      order_by: 'omni_product_collaborators_order_by',
      where: 'omni_product_collaborators_bool_exp',
    },
    production_materials: {
      distinct_on: 'omni_products_production_materials_select_column',
      order_by: 'omni_products_production_materials_order_by',
      where: 'omni_products_production_materials_bool_exp',
    },
    production_materials_aggregate: {
      distinct_on: 'omni_products_production_materials_select_column',
      order_by: 'omni_products_production_materials_order_by',
      where: 'omni_products_production_materials_bool_exp',
    },
    production_methods_products: {
      distinct_on: 'omni_production_methods_products_select_column',
      order_by: 'omni_production_methods_products_order_by',
      where: 'omni_production_methods_products_bool_exp',
    },
    production_methods_products_aggregate: {
      distinct_on: 'omni_production_methods_products_select_column',
      order_by: 'omni_production_methods_products_order_by',
      where: 'omni_production_methods_products_bool_exp',
    },
  },
  omni_products_aggregate_bool_exp: {
    count: 'omni_products_aggregate_bool_exp_count',
  },
  omni_products_aggregate_bool_exp_count: {
    arguments: 'omni_products_select_column',
    filter: 'omni_products_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  omni_products_aggregate_fields: {
    count: {
      columns: 'omni_products_select_column',
    },
  },
  omni_products_aggregate_order_by: {
    avg: 'omni_products_avg_order_by',
    count: 'order_by',
    max: 'omni_products_max_order_by',
    min: 'omni_products_min_order_by',
    stddev: 'omni_products_stddev_order_by',
    stddev_pop: 'omni_products_stddev_pop_order_by',
    stddev_samp: 'omni_products_stddev_samp_order_by',
    sum: 'omni_products_sum_order_by',
    var_pop: 'omni_products_var_pop_order_by',
    var_samp: 'omni_products_var_samp_order_by',
    variance: 'omni_products_variance_order_by',
  },
  omni_products_arr_rel_insert_input: {
    data: 'omni_products_insert_input',
    on_conflict: 'omni_products_on_conflict',
  },
  omni_products_avg_order_by: {
    brand_reward_share: 'order_by',
    collaborator_reward_share: 'order_by',
    quantity: 'order_by',
  },
  omni_products_bool_exp: {
    _and: 'omni_products_bool_exp',
    _not: 'omni_products_bool_exp',
    _or: 'omni_products_bool_exp',
    brand: 'uuid_comparison_exp',
    brandByBrand: 'omni_brands_bool_exp',
    brand_reward_share: 'numeric_comparison_exp',
    collaborator_reward_share: 'numeric_comparison_exp',
    created_at: 'timestamptz_comparison_exp',
    discord_channel_id: 'String_comparison_exp',
    files: 'omni_products_files_bool_exp',
    files_aggregate: 'omni_products_files_aggregate_bool_exp',
    fullfiller: 'omni_fullfillers_bool_exp',
    fullfillment: 'uuid_comparison_exp',
    id: 'uuid_comparison_exp',
    name: 'String_comparison_exp',
    notion_id: 'String_comparison_exp',
    price: 'uuid_comparison_exp',
    priceCurrencyByProductionCost: 'omni_price_currencies_bool_exp',
    price_currency: 'omni_price_currencies_bool_exp',
    producer: 'uuid_comparison_exp',
    producerByProducer: 'omni_producers_bool_exp',
    product_collaborators: 'omni_product_collaborators_bool_exp',
    product_collaborators_aggregate:
      'omni_product_collaborators_aggregate_bool_exp',
    production_cost: 'uuid_comparison_exp',
    production_materials: 'omni_products_production_materials_bool_exp',
    production_materials_aggregate:
      'omni_products_production_materials_aggregate_bool_exp',
    production_methods_products: 'omni_production_methods_products_bool_exp',
    production_methods_products_aggregate:
      'omni_production_methods_products_aggregate_bool_exp',
    products_stage_enum: 'omni_products_stage_enum_bool_exp',
    quantity: 'bigint_comparison_exp',
    sale_type: 'omni_sale_types_enum_enum_comparison_exp',
    sale_types_enum: 'omni_sale_types_enum_bool_exp',
    shop_description: 'String_comparison_exp',
    shopify_id: 'String_comparison_exp',
    stage: 'omni_products_stage_enum_enum_comparison_exp',
    updated_at: 'timestamptz_comparison_exp',
  },
  omni_products_constraint: 'enum' as const,
  omni_products_files_aggregate_bool_exp: {
    count: 'omni_products_files_aggregate_bool_exp_count',
  },
  omni_products_files_aggregate_bool_exp_count: {
    arguments: 'omni_products_files_select_column',
    filter: 'omni_products_files_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  omni_products_files_aggregate_fields: {
    count: {
      columns: 'omni_products_files_select_column',
    },
  },
  omni_products_files_aggregate_order_by: {
    avg: 'omni_products_files_avg_order_by',
    count: 'order_by',
    max: 'omni_products_files_max_order_by',
    min: 'omni_products_files_min_order_by',
    stddev: 'omni_products_files_stddev_order_by',
    stddev_pop: 'omni_products_files_stddev_pop_order_by',
    stddev_samp: 'omni_products_files_stddev_samp_order_by',
    sum: 'omni_products_files_sum_order_by',
    var_pop: 'omni_products_files_var_pop_order_by',
    var_samp: 'omni_products_files_var_samp_order_by',
    variance: 'omni_products_files_variance_order_by',
  },
  omni_products_files_arr_rel_insert_input: {
    data: 'omni_products_files_insert_input',
    on_conflict: 'omni_products_files_on_conflict',
  },
  omni_products_files_avg_order_by: {
    directus_files_id: 'order_by',
    id: 'order_by',
  },
  omni_products_files_bool_exp: {
    _and: 'omni_products_files_bool_exp',
    _not: 'omni_products_files_bool_exp',
    _or: 'omni_products_files_bool_exp',
    directus_files_id: 'Int_comparison_exp',
    id: 'Int_comparison_exp',
    products_id: 'uuid_comparison_exp',
  },
  omni_products_files_constraint: 'enum' as const,
  omni_products_files_inc_input: {},
  omni_products_files_insert_input: {
    products_id: 'uuid',
  },
  omni_products_files_max_order_by: {
    directus_files_id: 'order_by',
    id: 'order_by',
    products_id: 'order_by',
  },
  omni_products_files_min_order_by: {
    directus_files_id: 'order_by',
    id: 'order_by',
    products_id: 'order_by',
  },
  omni_products_files_on_conflict: {
    constraint: 'omni_products_files_constraint',
    update_columns: 'omni_products_files_update_column',
    where: 'omni_products_files_bool_exp',
  },
  omni_products_files_order_by: {
    directus_files_id: 'order_by',
    id: 'order_by',
    products_id: 'order_by',
  },
  omni_products_files_pk_columns_input: {},
  omni_products_files_select_column: 'enum' as const,
  omni_products_files_set_input: {
    products_id: 'uuid',
  },
  omni_products_files_stddev_order_by: {
    directus_files_id: 'order_by',
    id: 'order_by',
  },
  omni_products_files_stddev_pop_order_by: {
    directus_files_id: 'order_by',
    id: 'order_by',
  },
  omni_products_files_stddev_samp_order_by: {
    directus_files_id: 'order_by',
    id: 'order_by',
  },
  omni_products_files_stream_cursor_input: {
    initial_value: 'omni_products_files_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_products_files_stream_cursor_value_input: {
    products_id: 'uuid',
  },
  omni_products_files_sum_order_by: {
    directus_files_id: 'order_by',
    id: 'order_by',
  },
  omni_products_files_update_column: 'enum' as const,
  omni_products_files_updates: {
    _inc: 'omni_products_files_inc_input',
    _set: 'omni_products_files_set_input',
    where: 'omni_products_files_bool_exp',
  },
  omni_products_files_var_pop_order_by: {
    directus_files_id: 'order_by',
    id: 'order_by',
  },
  omni_products_files_var_samp_order_by: {
    directus_files_id: 'order_by',
    id: 'order_by',
  },
  omni_products_files_variance_order_by: {
    directus_files_id: 'order_by',
    id: 'order_by',
  },
  omni_products_inc_input: {
    brand_reward_share: 'numeric',
    collaborator_reward_share: 'numeric',
    quantity: 'bigint',
  },
  omni_products_insert_input: {
    brand: 'uuid',
    brandByBrand: 'omni_brands_obj_rel_insert_input',
    brand_reward_share: 'numeric',
    collaborator_reward_share: 'numeric',
    created_at: 'timestamptz',
    files: 'omni_products_files_arr_rel_insert_input',
    fullfiller: 'omni_fullfillers_obj_rel_insert_input',
    fullfillment: 'uuid',
    id: 'uuid',
    price: 'uuid',
    priceCurrencyByProductionCost: 'omni_price_currencies_obj_rel_insert_input',
    price_currency: 'omni_price_currencies_obj_rel_insert_input',
    producer: 'uuid',
    producerByProducer: 'omni_producers_obj_rel_insert_input',
    product_collaborators: 'omni_product_collaborators_arr_rel_insert_input',
    production_cost: 'uuid',
    production_materials:
      'omni_products_production_materials_arr_rel_insert_input',
    production_methods_products:
      'omni_production_methods_products_arr_rel_insert_input',
    products_stage_enum: 'omni_products_stage_enum_obj_rel_insert_input',
    quantity: 'bigint',
    sale_type: 'omni_sale_types_enum_enum',
    sale_types_enum: 'omni_sale_types_enum_obj_rel_insert_input',
    stage: 'omni_products_stage_enum_enum',
    updated_at: 'timestamptz',
  },
  omni_products_max_order_by: {
    brand: 'order_by',
    brand_reward_share: 'order_by',
    collaborator_reward_share: 'order_by',
    created_at: 'order_by',
    discord_channel_id: 'order_by',
    fullfillment: 'order_by',
    id: 'order_by',
    name: 'order_by',
    notion_id: 'order_by',
    price: 'order_by',
    producer: 'order_by',
    production_cost: 'order_by',
    quantity: 'order_by',
    shop_description: 'order_by',
    shopify_id: 'order_by',
    updated_at: 'order_by',
  },
  omni_products_min_order_by: {
    brand: 'order_by',
    brand_reward_share: 'order_by',
    collaborator_reward_share: 'order_by',
    created_at: 'order_by',
    discord_channel_id: 'order_by',
    fullfillment: 'order_by',
    id: 'order_by',
    name: 'order_by',
    notion_id: 'order_by',
    price: 'order_by',
    producer: 'order_by',
    production_cost: 'order_by',
    quantity: 'order_by',
    shop_description: 'order_by',
    shopify_id: 'order_by',
    updated_at: 'order_by',
  },
  omni_products_obj_rel_insert_input: {
    data: 'omni_products_insert_input',
    on_conflict: 'omni_products_on_conflict',
  },
  omni_products_on_conflict: {
    constraint: 'omni_products_constraint',
    update_columns: 'omni_products_update_column',
    where: 'omni_products_bool_exp',
  },
  omni_products_order_by: {
    brand: 'order_by',
    brandByBrand: 'omni_brands_order_by',
    brand_reward_share: 'order_by',
    collaborator_reward_share: 'order_by',
    created_at: 'order_by',
    discord_channel_id: 'order_by',
    files_aggregate: 'omni_products_files_aggregate_order_by',
    fullfiller: 'omni_fullfillers_order_by',
    fullfillment: 'order_by',
    id: 'order_by',
    name: 'order_by',
    notion_id: 'order_by',
    price: 'order_by',
    priceCurrencyByProductionCost: 'omni_price_currencies_order_by',
    price_currency: 'omni_price_currencies_order_by',
    producer: 'order_by',
    producerByProducer: 'omni_producers_order_by',
    product_collaborators_aggregate:
      'omni_product_collaborators_aggregate_order_by',
    production_cost: 'order_by',
    production_materials_aggregate:
      'omni_products_production_materials_aggregate_order_by',
    production_methods_products_aggregate:
      'omni_production_methods_products_aggregate_order_by',
    products_stage_enum: 'omni_products_stage_enum_order_by',
    quantity: 'order_by',
    sale_type: 'order_by',
    sale_types_enum: 'omni_sale_types_enum_order_by',
    shop_description: 'order_by',
    shopify_id: 'order_by',
    stage: 'order_by',
    updated_at: 'order_by',
  },
  omni_products_pk_columns_input: {
    id: 'uuid',
  },
  omni_products_production_materials_aggregate_bool_exp: {
    count: 'omni_products_production_materials_aggregate_bool_exp_count',
  },
  omni_products_production_materials_aggregate_bool_exp_count: {
    arguments: 'omni_products_production_materials_select_column',
    filter: 'omni_products_production_materials_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  omni_products_production_materials_aggregate_fields: {
    count: {
      columns: 'omni_products_production_materials_select_column',
    },
  },
  omni_products_production_materials_aggregate_order_by: {
    avg: 'omni_products_production_materials_avg_order_by',
    count: 'order_by',
    max: 'omni_products_production_materials_max_order_by',
    min: 'omni_products_production_materials_min_order_by',
    stddev: 'omni_products_production_materials_stddev_order_by',
    stddev_pop: 'omni_products_production_materials_stddev_pop_order_by',
    stddev_samp: 'omni_products_production_materials_stddev_samp_order_by',
    sum: 'omni_products_production_materials_sum_order_by',
    var_pop: 'omni_products_production_materials_var_pop_order_by',
    var_samp: 'omni_products_production_materials_var_samp_order_by',
    variance: 'omni_products_production_materials_variance_order_by',
  },
  omni_products_production_materials_arr_rel_insert_input: {
    data: 'omni_products_production_materials_insert_input',
    on_conflict: 'omni_products_production_materials_on_conflict',
  },
  omni_products_production_materials_avg_order_by: {
    products_production_materials: 'order_by',
  },
  omni_products_production_materials_bool_exp: {
    _and: 'omni_products_production_materials_bool_exp',
    _not: 'omni_products_production_materials_bool_exp',
    _or: 'omni_products_production_materials_bool_exp',
    product_id: 'uuid_comparison_exp',
    production_material_id: 'uuid_comparison_exp',
    products_production_materials: 'Int_comparison_exp',
  },
  omni_products_production_materials_constraint: 'enum' as const,
  omni_products_production_materials_insert_input: {
    product_id: 'uuid',
    production_material_id: 'uuid',
  },
  omni_products_production_materials_max_order_by: {
    product_id: 'order_by',
    production_material_id: 'order_by',
    products_production_materials: 'order_by',
  },
  omni_products_production_materials_min_order_by: {
    product_id: 'order_by',
    production_material_id: 'order_by',
    products_production_materials: 'order_by',
  },
  omni_products_production_materials_on_conflict: {
    constraint: 'omni_products_production_materials_constraint',
    update_columns: 'omni_products_production_materials_update_column',
    where: 'omni_products_production_materials_bool_exp',
  },
  omni_products_production_materials_order_by: {
    product_id: 'order_by',
    production_material_id: 'order_by',
    products_production_materials: 'order_by',
  },
  omni_products_production_materials_pk_columns_input: {},
  omni_products_production_materials_select_column: 'enum' as const,
  omni_products_production_materials_set_input: {
    product_id: 'uuid',
    production_material_id: 'uuid',
  },
  omni_products_production_materials_stddev_order_by: {
    products_production_materials: 'order_by',
  },
  omni_products_production_materials_stddev_pop_order_by: {
    products_production_materials: 'order_by',
  },
  omni_products_production_materials_stddev_samp_order_by: {
    products_production_materials: 'order_by',
  },
  omni_products_production_materials_stream_cursor_input: {
    initial_value:
      'omni_products_production_materials_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_products_production_materials_stream_cursor_value_input: {
    product_id: 'uuid',
    production_material_id: 'uuid',
  },
  omni_products_production_materials_sum_order_by: {
    products_production_materials: 'order_by',
  },
  omni_products_production_materials_update_column: 'enum' as const,
  omni_products_production_materials_updates: {
    _set: 'omni_products_production_materials_set_input',
    where: 'omni_products_production_materials_bool_exp',
  },
  omni_products_production_materials_var_pop_order_by: {
    products_production_materials: 'order_by',
  },
  omni_products_production_materials_var_samp_order_by: {
    products_production_materials: 'order_by',
  },
  omni_products_production_materials_variance_order_by: {
    products_production_materials: 'order_by',
  },
  omni_products_select_column: 'enum' as const,
  omni_products_set_input: {
    brand: 'uuid',
    brand_reward_share: 'numeric',
    collaborator_reward_share: 'numeric',
    created_at: 'timestamptz',
    fullfillment: 'uuid',
    id: 'uuid',
    price: 'uuid',
    producer: 'uuid',
    production_cost: 'uuid',
    quantity: 'bigint',
    sale_type: 'omni_sale_types_enum_enum',
    stage: 'omni_products_stage_enum_enum',
    updated_at: 'timestamptz',
  },
  omni_products_stage_enum: {
    products: {
      distinct_on: 'omni_products_select_column',
      order_by: 'omni_products_order_by',
      where: 'omni_products_bool_exp',
    },
    products_aggregate: {
      distinct_on: 'omni_products_select_column',
      order_by: 'omni_products_order_by',
      where: 'omni_products_bool_exp',
    },
  },
  omni_products_stage_enum_aggregate_fields: {
    count: {
      columns: 'omni_products_stage_enum_select_column',
    },
  },
  omni_products_stage_enum_bool_exp: {
    _and: 'omni_products_stage_enum_bool_exp',
    _not: 'omni_products_stage_enum_bool_exp',
    _or: 'omni_products_stage_enum_bool_exp',
    description: 'String_comparison_exp',
    products: 'omni_products_bool_exp',
    products_aggregate: 'omni_products_aggregate_bool_exp',
    value: 'String_comparison_exp',
  },
  omni_products_stage_enum_constraint: 'enum' as const,
  omni_products_stage_enum_enum: 'enum' as const,
  omni_products_stage_enum_enum_comparison_exp: {
    _eq: 'omni_products_stage_enum_enum',
    _in: 'omni_products_stage_enum_enum',
    _neq: 'omni_products_stage_enum_enum',
    _nin: 'omni_products_stage_enum_enum',
  },
  omni_products_stage_enum_insert_input: {
    products: 'omni_products_arr_rel_insert_input',
  },
  omni_products_stage_enum_obj_rel_insert_input: {
    data: 'omni_products_stage_enum_insert_input',
    on_conflict: 'omni_products_stage_enum_on_conflict',
  },
  omni_products_stage_enum_on_conflict: {
    constraint: 'omni_products_stage_enum_constraint',
    update_columns: 'omni_products_stage_enum_update_column',
    where: 'omni_products_stage_enum_bool_exp',
  },
  omni_products_stage_enum_order_by: {
    description: 'order_by',
    products_aggregate: 'omni_products_aggregate_order_by',
    value: 'order_by',
  },
  omni_products_stage_enum_pk_columns_input: {},
  omni_products_stage_enum_select_column: 'enum' as const,
  omni_products_stage_enum_set_input: {},
  omni_products_stage_enum_stream_cursor_input: {
    initial_value: 'omni_products_stage_enum_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_products_stage_enum_stream_cursor_value_input: {},
  omni_products_stage_enum_update_column: 'enum' as const,
  omni_products_stage_enum_updates: {
    _set: 'omni_products_stage_enum_set_input',
    where: 'omni_products_stage_enum_bool_exp',
  },
  omni_products_stddev_order_by: {
    brand_reward_share: 'order_by',
    collaborator_reward_share: 'order_by',
    quantity: 'order_by',
  },
  omni_products_stddev_pop_order_by: {
    brand_reward_share: 'order_by',
    collaborator_reward_share: 'order_by',
    quantity: 'order_by',
  },
  omni_products_stddev_samp_order_by: {
    brand_reward_share: 'order_by',
    collaborator_reward_share: 'order_by',
    quantity: 'order_by',
  },
  omni_products_stream_cursor_input: {
    initial_value: 'omni_products_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_products_stream_cursor_value_input: {
    brand: 'uuid',
    brand_reward_share: 'numeric',
    collaborator_reward_share: 'numeric',
    created_at: 'timestamptz',
    fullfillment: 'uuid',
    id: 'uuid',
    price: 'uuid',
    producer: 'uuid',
    production_cost: 'uuid',
    quantity: 'bigint',
    sale_type: 'omni_sale_types_enum_enum',
    stage: 'omni_products_stage_enum_enum',
    updated_at: 'timestamptz',
  },
  omni_products_sum_order_by: {
    brand_reward_share: 'order_by',
    collaborator_reward_share: 'order_by',
    quantity: 'order_by',
  },
  omni_products_update_column: 'enum' as const,
  omni_products_updates: {
    _inc: 'omni_products_inc_input',
    _set: 'omni_products_set_input',
    where: 'omni_products_bool_exp',
  },
  omni_products_var_pop_order_by: {
    brand_reward_share: 'order_by',
    collaborator_reward_share: 'order_by',
    quantity: 'order_by',
  },
  omni_products_var_samp_order_by: {
    brand_reward_share: 'order_by',
    collaborator_reward_share: 'order_by',
    quantity: 'order_by',
  },
  omni_products_variance_order_by: {
    brand_reward_share: 'order_by',
    collaborator_reward_share: 'order_by',
    quantity: 'order_by',
  },
  omni_sale_types_enum: {
    products: {
      distinct_on: 'omni_products_select_column',
      order_by: 'omni_products_order_by',
      where: 'omni_products_bool_exp',
    },
    products_aggregate: {
      distinct_on: 'omni_products_select_column',
      order_by: 'omni_products_order_by',
      where: 'omni_products_bool_exp',
    },
  },
  omni_sale_types_enum_aggregate_fields: {
    count: {
      columns: 'omni_sale_types_enum_select_column',
    },
  },
  omni_sale_types_enum_bool_exp: {
    _and: 'omni_sale_types_enum_bool_exp',
    _not: 'omni_sale_types_enum_bool_exp',
    _or: 'omni_sale_types_enum_bool_exp',
    description: 'String_comparison_exp',
    products: 'omni_products_bool_exp',
    products_aggregate: 'omni_products_aggregate_bool_exp',
    value: 'String_comparison_exp',
  },
  omni_sale_types_enum_constraint: 'enum' as const,
  omni_sale_types_enum_enum: 'enum' as const,
  omni_sale_types_enum_enum_comparison_exp: {
    _eq: 'omni_sale_types_enum_enum',
    _in: 'omni_sale_types_enum_enum',
    _neq: 'omni_sale_types_enum_enum',
    _nin: 'omni_sale_types_enum_enum',
  },
  omni_sale_types_enum_insert_input: {
    products: 'omni_products_arr_rel_insert_input',
  },
  omni_sale_types_enum_obj_rel_insert_input: {
    data: 'omni_sale_types_enum_insert_input',
    on_conflict: 'omni_sale_types_enum_on_conflict',
  },
  omni_sale_types_enum_on_conflict: {
    constraint: 'omni_sale_types_enum_constraint',
    update_columns: 'omni_sale_types_enum_update_column',
    where: 'omni_sale_types_enum_bool_exp',
  },
  omni_sale_types_enum_order_by: {
    description: 'order_by',
    products_aggregate: 'omni_products_aggregate_order_by',
    value: 'order_by',
  },
  omni_sale_types_enum_pk_columns_input: {},
  omni_sale_types_enum_select_column: 'enum' as const,
  omni_sale_types_enum_set_input: {},
  omni_sale_types_enum_stream_cursor_input: {
    initial_value: 'omni_sale_types_enum_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_sale_types_enum_stream_cursor_value_input: {},
  omni_sale_types_enum_update_column: 'enum' as const,
  omni_sale_types_enum_updates: {
    _set: 'omni_sale_types_enum_set_input',
    where: 'omni_sale_types_enum_bool_exp',
  },
  omni_timezones_enum: {
    users: {
      distinct_on: 'omni_users_select_column',
      order_by: 'omni_users_order_by',
      where: 'omni_users_bool_exp',
    },
    users_aggregate: {
      distinct_on: 'omni_users_select_column',
      order_by: 'omni_users_order_by',
      where: 'omni_users_bool_exp',
    },
  },
  omni_timezones_enum_aggregate_fields: {
    count: {
      columns: 'omni_timezones_enum_select_column',
    },
  },
  omni_timezones_enum_bool_exp: {
    _and: 'omni_timezones_enum_bool_exp',
    _not: 'omni_timezones_enum_bool_exp',
    _or: 'omni_timezones_enum_bool_exp',
    description: 'String_comparison_exp',
    users: 'omni_users_bool_exp',
    users_aggregate: 'omni_users_aggregate_bool_exp',
    value: 'String_comparison_exp',
  },
  omni_timezones_enum_constraint: 'enum' as const,
  omni_timezones_enum_enum: 'enum' as const,
  omni_timezones_enum_enum_comparison_exp: {
    _eq: 'omni_timezones_enum_enum',
    _in: 'omni_timezones_enum_enum',
    _neq: 'omni_timezones_enum_enum',
    _nin: 'omni_timezones_enum_enum',
  },
  omni_timezones_enum_insert_input: {
    users: 'omni_users_arr_rel_insert_input',
  },
  omni_timezones_enum_obj_rel_insert_input: {
    data: 'omni_timezones_enum_insert_input',
    on_conflict: 'omni_timezones_enum_on_conflict',
  },
  omni_timezones_enum_on_conflict: {
    constraint: 'omni_timezones_enum_constraint',
    update_columns: 'omni_timezones_enum_update_column',
    where: 'omni_timezones_enum_bool_exp',
  },
  omni_timezones_enum_order_by: {
    description: 'order_by',
    users_aggregate: 'omni_users_aggregate_order_by',
    value: 'order_by',
  },
  omni_timezones_enum_pk_columns_input: {},
  omni_timezones_enum_select_column: 'enum' as const,
  omni_timezones_enum_set_input: {},
  omni_timezones_enum_stream_cursor_input: {
    initial_value: 'omni_timezones_enum_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_timezones_enum_stream_cursor_value_input: {},
  omni_timezones_enum_update_column: 'enum' as const,
  omni_timezones_enum_updates: {
    _set: 'omni_timezones_enum_set_input',
    where: 'omni_timezones_enum_bool_exp',
  },
  omni_user_skill_types_enum: {
    user_skills: {
      distinct_on: 'omni_user_skills_select_column',
      order_by: 'omni_user_skills_order_by',
      where: 'omni_user_skills_bool_exp',
    },
    user_skills_aggregate: {
      distinct_on: 'omni_user_skills_select_column',
      order_by: 'omni_user_skills_order_by',
      where: 'omni_user_skills_bool_exp',
    },
  },
  omni_user_skill_types_enum_aggregate_fields: {
    count: {
      columns: 'omni_user_skill_types_enum_select_column',
    },
  },
  omni_user_skill_types_enum_bool_exp: {
    _and: 'omni_user_skill_types_enum_bool_exp',
    _not: 'omni_user_skill_types_enum_bool_exp',
    _or: 'omni_user_skill_types_enum_bool_exp',
    description: 'String_comparison_exp',
    user_skills: 'omni_user_skills_bool_exp',
    user_skills_aggregate: 'omni_user_skills_aggregate_bool_exp',
    value: 'String_comparison_exp',
  },
  omni_user_skill_types_enum_constraint: 'enum' as const,
  omni_user_skill_types_enum_enum: 'enum' as const,
  omni_user_skill_types_enum_enum_comparison_exp: {
    _eq: 'omni_user_skill_types_enum_enum',
    _in: 'omni_user_skill_types_enum_enum',
    _neq: 'omni_user_skill_types_enum_enum',
    _nin: 'omni_user_skill_types_enum_enum',
  },
  omni_user_skill_types_enum_insert_input: {
    user_skills: 'omni_user_skills_arr_rel_insert_input',
  },
  omni_user_skill_types_enum_obj_rel_insert_input: {
    data: 'omni_user_skill_types_enum_insert_input',
    on_conflict: 'omni_user_skill_types_enum_on_conflict',
  },
  omni_user_skill_types_enum_on_conflict: {
    constraint: 'omni_user_skill_types_enum_constraint',
    update_columns: 'omni_user_skill_types_enum_update_column',
    where: 'omni_user_skill_types_enum_bool_exp',
  },
  omni_user_skill_types_enum_order_by: {
    description: 'order_by',
    user_skills_aggregate: 'omni_user_skills_aggregate_order_by',
    value: 'order_by',
  },
  omni_user_skill_types_enum_pk_columns_input: {},
  omni_user_skill_types_enum_select_column: 'enum' as const,
  omni_user_skill_types_enum_set_input: {},
  omni_user_skill_types_enum_stream_cursor_input: {
    initial_value: 'omni_user_skill_types_enum_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_user_skill_types_enum_stream_cursor_value_input: {},
  omni_user_skill_types_enum_update_column: 'enum' as const,
  omni_user_skill_types_enum_updates: {
    _set: 'omni_user_skill_types_enum_set_input',
    where: 'omni_user_skill_types_enum_bool_exp',
  },
  omni_user_skills_aggregate_bool_exp: {
    count: 'omni_user_skills_aggregate_bool_exp_count',
  },
  omni_user_skills_aggregate_bool_exp_count: {
    arguments: 'omni_user_skills_select_column',
    filter: 'omni_user_skills_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  omni_user_skills_aggregate_fields: {
    count: {
      columns: 'omni_user_skills_select_column',
    },
  },
  omni_user_skills_aggregate_order_by: {
    count: 'order_by',
    max: 'omni_user_skills_max_order_by',
    min: 'omni_user_skills_min_order_by',
  },
  omni_user_skills_arr_rel_insert_input: {
    data: 'omni_user_skills_insert_input',
    on_conflict: 'omni_user_skills_on_conflict',
  },
  omni_user_skills_bool_exp: {
    _and: 'omni_user_skills_bool_exp',
    _not: 'omni_user_skills_bool_exp',
    _or: 'omni_user_skills_bool_exp',
    id: 'uuid_comparison_exp',
    skill: 'omni_user_skill_types_enum_enum_comparison_exp',
    user: 'uuid_comparison_exp',
    userByUser: 'omni_users_bool_exp',
    user_skill_types_enum: 'omni_user_skill_types_enum_bool_exp',
  },
  omni_user_skills_constraint: 'enum' as const,
  omni_user_skills_insert_input: {
    id: 'uuid',
    skill: 'omni_user_skill_types_enum_enum',
    user: 'uuid',
    userByUser: 'omni_users_obj_rel_insert_input',
    user_skill_types_enum: 'omni_user_skill_types_enum_obj_rel_insert_input',
  },
  omni_user_skills_max_order_by: {
    id: 'order_by',
    user: 'order_by',
  },
  omni_user_skills_min_order_by: {
    id: 'order_by',
    user: 'order_by',
  },
  omni_user_skills_on_conflict: {
    constraint: 'omni_user_skills_constraint',
    update_columns: 'omni_user_skills_update_column',
    where: 'omni_user_skills_bool_exp',
  },
  omni_user_skills_order_by: {
    id: 'order_by',
    skill: 'order_by',
    user: 'order_by',
    userByUser: 'omni_users_order_by',
    user_skill_types_enum: 'omni_user_skill_types_enum_order_by',
  },
  omni_user_skills_pk_columns_input: {
    id: 'uuid',
  },
  omni_user_skills_select_column: 'enum' as const,
  omni_user_skills_set_input: {
    id: 'uuid',
    skill: 'omni_user_skill_types_enum_enum',
    user: 'uuid',
  },
  omni_user_skills_stream_cursor_input: {
    initial_value: 'omni_user_skills_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_user_skills_stream_cursor_value_input: {
    id: 'uuid',
    skill: 'omni_user_skill_types_enum_enum',
    user: 'uuid',
  },
  omni_user_skills_update_column: 'enum' as const,
  omni_user_skills_updates: {
    _set: 'omni_user_skills_set_input',
    where: 'omni_user_skills_bool_exp',
  },
  omni_user_statuses_enum: {
    users: {
      distinct_on: 'omni_users_select_column',
      order_by: 'omni_users_order_by',
      where: 'omni_users_bool_exp',
    },
    users_aggregate: {
      distinct_on: 'omni_users_select_column',
      order_by: 'omni_users_order_by',
      where: 'omni_users_bool_exp',
    },
  },
  omni_user_statuses_enum_aggregate_fields: {
    count: {
      columns: 'omni_user_statuses_enum_select_column',
    },
  },
  omni_user_statuses_enum_bool_exp: {
    _and: 'omni_user_statuses_enum_bool_exp',
    _not: 'omni_user_statuses_enum_bool_exp',
    _or: 'omni_user_statuses_enum_bool_exp',
    description: 'String_comparison_exp',
    users: 'omni_users_bool_exp',
    users_aggregate: 'omni_users_aggregate_bool_exp',
    value: 'String_comparison_exp',
  },
  omni_user_statuses_enum_constraint: 'enum' as const,
  omni_user_statuses_enum_enum: 'enum' as const,
  omni_user_statuses_enum_enum_comparison_exp: {
    _eq: 'omni_user_statuses_enum_enum',
    _in: 'omni_user_statuses_enum_enum',
    _neq: 'omni_user_statuses_enum_enum',
    _nin: 'omni_user_statuses_enum_enum',
  },
  omni_user_statuses_enum_insert_input: {
    users: 'omni_users_arr_rel_insert_input',
  },
  omni_user_statuses_enum_obj_rel_insert_input: {
    data: 'omni_user_statuses_enum_insert_input',
    on_conflict: 'omni_user_statuses_enum_on_conflict',
  },
  omni_user_statuses_enum_on_conflict: {
    constraint: 'omni_user_statuses_enum_constraint',
    update_columns: 'omni_user_statuses_enum_update_column',
    where: 'omni_user_statuses_enum_bool_exp',
  },
  omni_user_statuses_enum_order_by: {
    description: 'order_by',
    users_aggregate: 'omni_users_aggregate_order_by',
    value: 'order_by',
  },
  omni_user_statuses_enum_pk_columns_input: {},
  omni_user_statuses_enum_select_column: 'enum' as const,
  omni_user_statuses_enum_set_input: {},
  omni_user_statuses_enum_stream_cursor_input: {
    initial_value: 'omni_user_statuses_enum_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_user_statuses_enum_stream_cursor_value_input: {},
  omni_user_statuses_enum_update_column: 'enum' as const,
  omni_user_statuses_enum_updates: {
    _set: 'omni_user_statuses_enum_set_input',
    where: 'omni_user_statuses_enum_bool_exp',
  },
  omni_users: {
    brand_users: {
      distinct_on: 'omni_brand_users_select_column',
      order_by: 'omni_brand_users_order_by',
      where: 'omni_brand_users_bool_exp',
    },
    brand_users_aggregate: {
      distinct_on: 'omni_brand_users_select_column',
      order_by: 'omni_brand_users_order_by',
      where: 'omni_brand_users_bool_exp',
    },
    product_collaborators: {
      distinct_on: 'omni_product_collaborators_select_column',
      order_by: 'omni_product_collaborators_order_by',
      where: 'omni_product_collaborators_bool_exp',
    },
    product_collaborators_aggregate: {
      distinct_on: 'omni_product_collaborators_select_column',
      order_by: 'omni_product_collaborators_order_by',
      where: 'omni_product_collaborators_bool_exp',
    },
    user_skills: {
      distinct_on: 'omni_user_skills_select_column',
      order_by: 'omni_user_skills_order_by',
      where: 'omni_user_skills_bool_exp',
    },
    user_skills_aggregate: {
      distinct_on: 'omni_user_skills_select_column',
      order_by: 'omni_user_skills_order_by',
      where: 'omni_user_skills_bool_exp',
    },
  },
  omni_users_aggregate_bool_exp: {
    count: 'omni_users_aggregate_bool_exp_count',
  },
  omni_users_aggregate_bool_exp_count: {
    arguments: 'omni_users_select_column',
    filter: 'omni_users_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  omni_users_aggregate_fields: {
    count: {
      columns: 'omni_users_select_column',
    },
  },
  omni_users_aggregate_order_by: {
    count: 'order_by',
    max: 'omni_users_max_order_by',
    min: 'omni_users_min_order_by',
  },
  omni_users_arr_rel_insert_input: {
    data: 'omni_users_insert_input',
    on_conflict: 'omni_users_on_conflict',
  },
  omni_users_bool_exp: {
    _and: 'omni_users_bool_exp',
    _not: 'omni_users_bool_exp',
    _or: 'omni_users_bool_exp',
    brand_users: 'omni_brand_users_bool_exp',
    brand_users_aggregate: 'omni_brand_users_aggregate_bool_exp',
    created_at: 'timestamptz_comparison_exp',
    discord_handle: 'String_comparison_exp',
    discord_id: 'String_comparison_exp',
    eth_address: 'String_comparison_exp',
    github_handle: 'String_comparison_exp',
    id: 'uuid_comparison_exp',
    name: 'String_comparison_exp',
    product_collaborators: 'omni_product_collaborators_bool_exp',
    product_collaborators_aggregate:
      'omni_product_collaborators_aggregate_bool_exp',
    status: 'omni_user_statuses_enum_enum_comparison_exp',
    timezone: 'omni_timezones_enum_enum_comparison_exp',
    timezones_enum: 'omni_timezones_enum_bool_exp',
    twitter_handle: 'String_comparison_exp',
    updated_at: 'timestamptz_comparison_exp',
    user_skills: 'omni_user_skills_bool_exp',
    user_skills_aggregate: 'omni_user_skills_aggregate_bool_exp',
    user_statuses_enum: 'omni_user_statuses_enum_bool_exp',
  },
  omni_users_constraint: 'enum' as const,
  omni_users_insert_input: {
    brand_users: 'omni_brand_users_arr_rel_insert_input',
    created_at: 'timestamptz',
    id: 'uuid',
    product_collaborators: 'omni_product_collaborators_arr_rel_insert_input',
    status: 'omni_user_statuses_enum_enum',
    timezone: 'omni_timezones_enum_enum',
    timezones_enum: 'omni_timezones_enum_obj_rel_insert_input',
    updated_at: 'timestamptz',
    user_skills: 'omni_user_skills_arr_rel_insert_input',
    user_statuses_enum: 'omni_user_statuses_enum_obj_rel_insert_input',
  },
  omni_users_max_order_by: {
    created_at: 'order_by',
    discord_handle: 'order_by',
    discord_id: 'order_by',
    eth_address: 'order_by',
    github_handle: 'order_by',
    id: 'order_by',
    name: 'order_by',
    twitter_handle: 'order_by',
    updated_at: 'order_by',
  },
  omni_users_min_order_by: {
    created_at: 'order_by',
    discord_handle: 'order_by',
    discord_id: 'order_by',
    eth_address: 'order_by',
    github_handle: 'order_by',
    id: 'order_by',
    name: 'order_by',
    twitter_handle: 'order_by',
    updated_at: 'order_by',
  },
  omni_users_obj_rel_insert_input: {
    data: 'omni_users_insert_input',
    on_conflict: 'omni_users_on_conflict',
  },
  omni_users_on_conflict: {
    constraint: 'omni_users_constraint',
    update_columns: 'omni_users_update_column',
    where: 'omni_users_bool_exp',
  },
  omni_users_order_by: {
    brand_users_aggregate: 'omni_brand_users_aggregate_order_by',
    created_at: 'order_by',
    discord_handle: 'order_by',
    discord_id: 'order_by',
    eth_address: 'order_by',
    github_handle: 'order_by',
    id: 'order_by',
    name: 'order_by',
    product_collaborators_aggregate:
      'omni_product_collaborators_aggregate_order_by',
    status: 'order_by',
    timezone: 'order_by',
    timezones_enum: 'omni_timezones_enum_order_by',
    twitter_handle: 'order_by',
    updated_at: 'order_by',
    user_skills_aggregate: 'omni_user_skills_aggregate_order_by',
    user_statuses_enum: 'omni_user_statuses_enum_order_by',
  },
  omni_users_pk_columns_input: {
    id: 'uuid',
  },
  omni_users_select_column: 'enum' as const,
  omni_users_set_input: {
    created_at: 'timestamptz',
    id: 'uuid',
    status: 'omni_user_statuses_enum_enum',
    timezone: 'omni_timezones_enum_enum',
    updated_at: 'timestamptz',
  },
  omni_users_stream_cursor_input: {
    initial_value: 'omni_users_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  omni_users_stream_cursor_value_input: {
    created_at: 'timestamptz',
    id: 'uuid',
    status: 'omni_user_statuses_enum_enum',
    timezone: 'omni_timezones_enum_enum',
    updated_at: 'timestamptz',
  },
  omni_users_update_column: 'enum' as const,
  omni_users_updates: {
    _set: 'omni_users_set_input',
    where: 'omni_users_bool_exp',
  },
  order_by: 'enum' as const,
  query_root: {
    contribution_votes: {
      distinct_on: 'contribution_votes_select_column',
      order_by: 'contribution_votes_order_by',
      where: 'contribution_votes_bool_exp',
    },
    contribution_votes_aggregate: {
      distinct_on: 'contribution_votes_select_column',
      order_by: 'contribution_votes_order_by',
      where: 'contribution_votes_bool_exp',
    },
    contribution_votes_by_pk: {
      contribution_id: 'uuid',
      user_id: 'uuid',
    },
    contributions: {
      distinct_on: 'contributions_select_column',
      order_by: 'contributions_order_by',
      where: 'contributions_bool_exp',
    },
    contributions_aggregate: {
      distinct_on: 'contributions_select_column',
      order_by: 'contributions_order_by',
      where: 'contributions_bool_exp',
    },
    contributions_by_pk: {
      id: 'uuid',
    },
    contributors: {
      distinct_on: 'contributors_select_column',
      order_by: 'contributors_order_by',
      where: 'contributors_bool_exp',
    },
    contributors_aggregate: {
      distinct_on: 'contributors_select_column',
      order_by: 'contributors_order_by',
      where: 'contributors_bool_exp',
    },
    contributors_by_pk: {
      contribution_id: 'uuid',
      user_id: 'uuid',
    },
    omni_brand_statuses_enum: {
      distinct_on: 'omni_brand_statuses_enum_select_column',
      order_by: 'omni_brand_statuses_enum_order_by',
      where: 'omni_brand_statuses_enum_bool_exp',
    },
    omni_brand_statuses_enum_aggregate: {
      distinct_on: 'omni_brand_statuses_enum_select_column',
      order_by: 'omni_brand_statuses_enum_order_by',
      where: 'omni_brand_statuses_enum_bool_exp',
    },
    omni_brand_statuses_enum_by_pk: {},
    omni_brand_users: {
      distinct_on: 'omni_brand_users_select_column',
      order_by: 'omni_brand_users_order_by',
      where: 'omni_brand_users_bool_exp',
    },
    omni_brand_users_aggregate: {
      distinct_on: 'omni_brand_users_select_column',
      order_by: 'omni_brand_users_order_by',
      where: 'omni_brand_users_bool_exp',
    },
    omni_brand_users_by_pk: {
      id: 'uuid',
    },
    omni_brands: {
      distinct_on: 'omni_brands_select_column',
      order_by: 'omni_brands_order_by',
      where: 'omni_brands_bool_exp',
    },
    omni_brands_aggregate: {
      distinct_on: 'omni_brands_select_column',
      order_by: 'omni_brands_order_by',
      where: 'omni_brands_bool_exp',
    },
    omni_brands_by_pk: {
      id: 'uuid',
    },
    omni_collaborator_types_enum: {
      distinct_on: 'omni_collaborator_types_enum_select_column',
      order_by: 'omni_collaborator_types_enum_order_by',
      where: 'omni_collaborator_types_enum_bool_exp',
    },
    omni_collaborator_types_enum_aggregate: {
      distinct_on: 'omni_collaborator_types_enum_select_column',
      order_by: 'omni_collaborator_types_enum_order_by',
      where: 'omni_collaborator_types_enum_bool_exp',
    },
    omni_collaborator_types_enum_by_pk: {},
    omni_directus_files: {
      distinct_on: 'omni_directus_files_select_column',
      order_by: 'omni_directus_files_order_by',
      where: 'omni_directus_files_bool_exp',
    },
    omni_directus_files_aggregate: {
      distinct_on: 'omni_directus_files_select_column',
      order_by: 'omni_directus_files_order_by',
      where: 'omni_directus_files_bool_exp',
    },
    omni_directus_files_by_pk: {},
    omni_fullfillers: {
      distinct_on: 'omni_fullfillers_select_column',
      order_by: 'omni_fullfillers_order_by',
      where: 'omni_fullfillers_bool_exp',
    },
    omni_fullfillers_aggregate: {
      distinct_on: 'omni_fullfillers_select_column',
      order_by: 'omni_fullfillers_order_by',
      where: 'omni_fullfillers_bool_exp',
    },
    omni_fullfillers_by_pk: {
      id: 'uuid',
    },
    omni_price_currencies: {
      distinct_on: 'omni_price_currencies_select_column',
      order_by: 'omni_price_currencies_order_by',
      where: 'omni_price_currencies_bool_exp',
    },
    omni_price_currencies_aggregate: {
      distinct_on: 'omni_price_currencies_select_column',
      order_by: 'omni_price_currencies_order_by',
      where: 'omni_price_currencies_bool_exp',
    },
    omni_price_currencies_by_pk: {
      id: 'uuid',
    },
    omni_print_techs_enum: {
      distinct_on: 'omni_print_techs_enum_select_column',
      order_by: 'omni_print_techs_enum_order_by',
      where: 'omni_print_techs_enum_bool_exp',
    },
    omni_print_techs_enum_aggregate: {
      distinct_on: 'omni_print_techs_enum_select_column',
      order_by: 'omni_print_techs_enum_order_by',
      where: 'omni_print_techs_enum_bool_exp',
    },
    omni_print_techs_enum_by_pk: {},
    omni_producer_statuses_enum: {
      distinct_on: 'omni_producer_statuses_enum_select_column',
      order_by: 'omni_producer_statuses_enum_order_by',
      where: 'omni_producer_statuses_enum_bool_exp',
    },
    omni_producer_statuses_enum_aggregate: {
      distinct_on: 'omni_producer_statuses_enum_select_column',
      order_by: 'omni_producer_statuses_enum_order_by',
      where: 'omni_producer_statuses_enum_bool_exp',
    },
    omni_producer_statuses_enum_by_pk: {},
    omni_producers: {
      distinct_on: 'omni_producers_select_column',
      order_by: 'omni_producers_order_by',
      where: 'omni_producers_bool_exp',
    },
    omni_producers_aggregate: {
      distinct_on: 'omni_producers_select_column',
      order_by: 'omni_producers_order_by',
      where: 'omni_producers_bool_exp',
    },
    omni_producers_by_pk: {
      id: 'uuid',
    },
    omni_product_collaborators: {
      distinct_on: 'omni_product_collaborators_select_column',
      order_by: 'omni_product_collaborators_order_by',
      where: 'omni_product_collaborators_bool_exp',
    },
    omni_product_collaborators_aggregate: {
      distinct_on: 'omni_product_collaborators_select_column',
      order_by: 'omni_product_collaborators_order_by',
      where: 'omni_product_collaborators_bool_exp',
    },
    omni_product_collaborators_by_pk: {
      id: 'uuid',
    },
    omni_product_types_enum: {
      distinct_on: 'omni_product_types_enum_select_column',
      order_by: 'omni_product_types_enum_order_by',
      where: 'omni_product_types_enum_bool_exp',
    },
    omni_product_types_enum_aggregate: {
      distinct_on: 'omni_product_types_enum_select_column',
      order_by: 'omni_product_types_enum_order_by',
      where: 'omni_product_types_enum_bool_exp',
    },
    omni_product_types_enum_by_pk: {},
    omni_production_genders_enum: {
      distinct_on: 'omni_production_genders_enum_select_column',
      order_by: 'omni_production_genders_enum_order_by',
      where: 'omni_production_genders_enum_bool_exp',
    },
    omni_production_genders_enum_aggregate: {
      distinct_on: 'omni_production_genders_enum_select_column',
      order_by: 'omni_production_genders_enum_order_by',
      where: 'omni_production_genders_enum_bool_exp',
    },
    omni_production_genders_enum_by_pk: {},
    omni_production_materials: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
    omni_production_materials_aggregate: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
    omni_production_materials_by_pk: {
      id: 'uuid',
    },
    omni_production_materials_producers: {
      distinct_on: 'omni_production_materials_producers_select_column',
      order_by: 'omni_production_materials_producers_order_by',
      where: 'omni_production_materials_producers_bool_exp',
    },
    omni_production_materials_producers_aggregate: {
      distinct_on: 'omni_production_materials_producers_select_column',
      order_by: 'omni_production_materials_producers_order_by',
      where: 'omni_production_materials_producers_bool_exp',
    },
    omni_production_materials_producers_by_pk: {
      id: 'uuid',
    },
    omni_production_materials_ratings_enum: {
      distinct_on: 'omni_production_materials_ratings_enum_select_column',
      order_by: 'omni_production_materials_ratings_enum_order_by',
      where: 'omni_production_materials_ratings_enum_bool_exp',
    },
    omni_production_materials_ratings_enum_aggregate: {
      distinct_on: 'omni_production_materials_ratings_enum_select_column',
      order_by: 'omni_production_materials_ratings_enum_order_by',
      where: 'omni_production_materials_ratings_enum_bool_exp',
    },
    omni_production_materials_ratings_enum_by_pk: {},
    omni_production_methods: {
      distinct_on: 'omni_production_methods_select_column',
      order_by: 'omni_production_methods_order_by',
      where: 'omni_production_methods_bool_exp',
    },
    omni_production_methods_aggregate: {
      distinct_on: 'omni_production_methods_select_column',
      order_by: 'omni_production_methods_order_by',
      where: 'omni_production_methods_bool_exp',
    },
    omni_production_methods_by_pk: {
      id: 'uuid',
    },
    omni_production_methods_producers: {
      distinct_on: 'omni_production_methods_producers_select_column',
      order_by: 'omni_production_methods_producers_order_by',
      where: 'omni_production_methods_producers_bool_exp',
    },
    omni_production_methods_producers_aggregate: {
      distinct_on: 'omni_production_methods_producers_select_column',
      order_by: 'omni_production_methods_producers_order_by',
      where: 'omni_production_methods_producers_bool_exp',
    },
    omni_production_methods_producers_by_pk: {
      id: 'uuid',
    },
    omni_production_methods_products: {
      distinct_on: 'omni_production_methods_products_select_column',
      order_by: 'omni_production_methods_products_order_by',
      where: 'omni_production_methods_products_bool_exp',
    },
    omni_production_methods_products_aggregate: {
      distinct_on: 'omni_production_methods_products_select_column',
      order_by: 'omni_production_methods_products_order_by',
      where: 'omni_production_methods_products_bool_exp',
    },
    omni_production_methods_products_by_pk: {
      id: 'uuid',
    },
    omni_production_pallettes_enum: {
      distinct_on: 'omni_production_pallettes_enum_select_column',
      order_by: 'omni_production_pallettes_enum_order_by',
      where: 'omni_production_pallettes_enum_bool_exp',
    },
    omni_production_pallettes_enum_aggregate: {
      distinct_on: 'omni_production_pallettes_enum_select_column',
      order_by: 'omni_production_pallettes_enum_order_by',
      where: 'omni_production_pallettes_enum_bool_exp',
    },
    omni_production_pallettes_enum_by_pk: {},
    omni_production_styles_enum: {
      distinct_on: 'omni_production_styles_enum_select_column',
      order_by: 'omni_production_styles_enum_order_by',
      where: 'omni_production_styles_enum_bool_exp',
    },
    omni_production_styles_enum_aggregate: {
      distinct_on: 'omni_production_styles_enum_select_column',
      order_by: 'omni_production_styles_enum_order_by',
      where: 'omni_production_styles_enum_bool_exp',
    },
    omni_production_styles_enum_by_pk: {},
    omni_products: {
      distinct_on: 'omni_products_select_column',
      order_by: 'omni_products_order_by',
      where: 'omni_products_bool_exp',
    },
    omni_products_aggregate: {
      distinct_on: 'omni_products_select_column',
      order_by: 'omni_products_order_by',
      where: 'omni_products_bool_exp',
    },
    omni_products_by_pk: {
      id: 'uuid',
    },
    omni_products_files: {
      distinct_on: 'omni_products_files_select_column',
      order_by: 'omni_products_files_order_by',
      where: 'omni_products_files_bool_exp',
    },
    omni_products_files_aggregate: {
      distinct_on: 'omni_products_files_select_column',
      order_by: 'omni_products_files_order_by',
      where: 'omni_products_files_bool_exp',
    },
    omni_products_files_by_pk: {},
    omni_products_production_materials: {
      distinct_on: 'omni_products_production_materials_select_column',
      order_by: 'omni_products_production_materials_order_by',
      where: 'omni_products_production_materials_bool_exp',
    },
    omni_products_production_materials_aggregate: {
      distinct_on: 'omni_products_production_materials_select_column',
      order_by: 'omni_products_production_materials_order_by',
      where: 'omni_products_production_materials_bool_exp',
    },
    omni_products_production_materials_by_pk: {},
    omni_products_stage_enum: {
      distinct_on: 'omni_products_stage_enum_select_column',
      order_by: 'omni_products_stage_enum_order_by',
      where: 'omni_products_stage_enum_bool_exp',
    },
    omni_products_stage_enum_aggregate: {
      distinct_on: 'omni_products_stage_enum_select_column',
      order_by: 'omni_products_stage_enum_order_by',
      where: 'omni_products_stage_enum_bool_exp',
    },
    omni_products_stage_enum_by_pk: {},
    omni_sale_types_enum: {
      distinct_on: 'omni_sale_types_enum_select_column',
      order_by: 'omni_sale_types_enum_order_by',
      where: 'omni_sale_types_enum_bool_exp',
    },
    omni_sale_types_enum_aggregate: {
      distinct_on: 'omni_sale_types_enum_select_column',
      order_by: 'omni_sale_types_enum_order_by',
      where: 'omni_sale_types_enum_bool_exp',
    },
    omni_sale_types_enum_by_pk: {},
    omni_timezones_enum: {
      distinct_on: 'omni_timezones_enum_select_column',
      order_by: 'omni_timezones_enum_order_by',
      where: 'omni_timezones_enum_bool_exp',
    },
    omni_timezones_enum_aggregate: {
      distinct_on: 'omni_timezones_enum_select_column',
      order_by: 'omni_timezones_enum_order_by',
      where: 'omni_timezones_enum_bool_exp',
    },
    omni_timezones_enum_by_pk: {},
    omni_user_skill_types_enum: {
      distinct_on: 'omni_user_skill_types_enum_select_column',
      order_by: 'omni_user_skill_types_enum_order_by',
      where: 'omni_user_skill_types_enum_bool_exp',
    },
    omni_user_skill_types_enum_aggregate: {
      distinct_on: 'omni_user_skill_types_enum_select_column',
      order_by: 'omni_user_skill_types_enum_order_by',
      where: 'omni_user_skill_types_enum_bool_exp',
    },
    omni_user_skill_types_enum_by_pk: {},
    omni_user_skills: {
      distinct_on: 'omni_user_skills_select_column',
      order_by: 'omni_user_skills_order_by',
      where: 'omni_user_skills_bool_exp',
    },
    omni_user_skills_aggregate: {
      distinct_on: 'omni_user_skills_select_column',
      order_by: 'omni_user_skills_order_by',
      where: 'omni_user_skills_bool_exp',
    },
    omni_user_skills_by_pk: {
      id: 'uuid',
    },
    omni_user_statuses_enum: {
      distinct_on: 'omni_user_statuses_enum_select_column',
      order_by: 'omni_user_statuses_enum_order_by',
      where: 'omni_user_statuses_enum_bool_exp',
    },
    omni_user_statuses_enum_aggregate: {
      distinct_on: 'omni_user_statuses_enum_select_column',
      order_by: 'omni_user_statuses_enum_order_by',
      where: 'omni_user_statuses_enum_bool_exp',
    },
    omni_user_statuses_enum_by_pk: {},
    omni_users: {
      distinct_on: 'omni_users_select_column',
      order_by: 'omni_users_order_by',
      where: 'omni_users_bool_exp',
    },
    omni_users_aggregate: {
      distinct_on: 'omni_users_select_column',
      order_by: 'omni_users_order_by',
      where: 'omni_users_bool_exp',
    },
    omni_users_by_pk: {
      id: 'uuid',
    },
    robot_merkle_claims: {
      distinct_on: 'robot_merkle_claims_select_column',
      order_by: 'robot_merkle_claims_order_by',
      where: 'robot_merkle_claims_bool_exp',
    },
    robot_merkle_claims_aggregate: {
      distinct_on: 'robot_merkle_claims_select_column',
      order_by: 'robot_merkle_claims_order_by',
      where: 'robot_merkle_claims_bool_exp',
    },
    robot_merkle_claims_by_pk: {
      id: 'uuid',
    },
    robot_merkle_roots: {
      distinct_on: 'robot_merkle_roots_select_column',
      order_by: 'robot_merkle_roots_order_by',
      where: 'robot_merkle_roots_bool_exp',
    },
    robot_merkle_roots_aggregate: {
      distinct_on: 'robot_merkle_roots_select_column',
      order_by: 'robot_merkle_roots_order_by',
      where: 'robot_merkle_roots_bool_exp',
    },
    robot_merkle_roots_by_pk: {},
    robot_order: {
      distinct_on: 'robot_order_select_column',
      order_by: 'robot_order_order_by',
      where: 'robot_order_bool_exp',
    },
    robot_order_aggregate: {
      distinct_on: 'robot_order_select_column',
      order_by: 'robot_order_order_by',
      where: 'robot_order_bool_exp',
    },
    robot_order_by_pk: {},
    robot_product: {
      distinct_on: 'robot_product_select_column',
      order_by: 'robot_product_order_by',
      where: 'robot_product_bool_exp',
    },
    robot_product_aggregate: {
      distinct_on: 'robot_product_select_column',
      order_by: 'robot_product_order_by',
      where: 'robot_product_bool_exp',
    },
    robot_product_by_pk: {},
    robot_product_designer: {
      distinct_on: 'robot_product_designer_select_column',
      order_by: 'robot_product_designer_order_by',
      where: 'robot_product_designer_bool_exp',
    },
    robot_product_designer_aggregate: {
      distinct_on: 'robot_product_designer_select_column',
      order_by: 'robot_product_designer_order_by',
      where: 'robot_product_designer_bool_exp',
    },
    robot_product_designer_by_pk: {},
    shop_api_users: {
      distinct_on: 'shop_api_users_select_column',
      order_by: 'shop_api_users_order_by',
      where: 'shop_api_users_bool_exp',
    },
    shop_api_users_aggregate: {
      distinct_on: 'shop_api_users_select_column',
      order_by: 'shop_api_users_order_by',
      where: 'shop_api_users_bool_exp',
    },
    shop_api_users_by_pk: {},
    shop_product_locks: {
      distinct_on: 'shop_product_locks_select_column',
      order_by: 'shop_product_locks_order_by',
      where: 'shop_product_locks_bool_exp',
    },
    shop_product_locks_aggregate: {
      distinct_on: 'shop_product_locks_select_column',
      order_by: 'shop_product_locks_order_by',
      where: 'shop_product_locks_bool_exp',
    },
    shop_product_locks_by_pk: {},
    users: {
      distinct_on: 'users_select_column',
      order_by: 'users_order_by',
      where: 'users_bool_exp',
    },
    users_aggregate: {
      distinct_on: 'users_select_column',
      order_by: 'users_order_by',
      where: 'users_bool_exp',
    },
    users_by_pk: {
      id: 'uuid',
    },
  },
  robot_merkle_claims: {
    claim_json: {},
  },
  robot_merkle_claims_aggregate_bool_exp: {
    count: 'robot_merkle_claims_aggregate_bool_exp_count',
  },
  robot_merkle_claims_aggregate_bool_exp_count: {
    arguments: 'robot_merkle_claims_select_column',
    filter: 'robot_merkle_claims_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  robot_merkle_claims_aggregate_fields: {
    count: {
      columns: 'robot_merkle_claims_select_column',
    },
  },
  robot_merkle_claims_aggregate_order_by: {
    count: 'order_by',
    max: 'robot_merkle_claims_max_order_by',
    min: 'robot_merkle_claims_min_order_by',
  },
  robot_merkle_claims_append_input: {
    claim_json: 'jsonb',
  },
  robot_merkle_claims_arr_rel_insert_input: {
    data: 'robot_merkle_claims_insert_input',
    on_conflict: 'robot_merkle_claims_on_conflict',
  },
  robot_merkle_claims_bool_exp: {
    _and: 'robot_merkle_claims_bool_exp',
    _not: 'robot_merkle_claims_bool_exp',
    _or: 'robot_merkle_claims_bool_exp',
    claim_json: 'jsonb_comparison_exp',
    id: 'uuid_comparison_exp',
    merkle_root: 'robot_merkle_roots_bool_exp',
    merkle_root_hash: 'String_comparison_exp',
    recipient_eth_address: 'String_comparison_exp',
  },
  robot_merkle_claims_constraint: 'enum' as const,
  robot_merkle_claims_delete_at_path_input: {},
  robot_merkle_claims_delete_elem_input: {},
  robot_merkle_claims_delete_key_input: {},
  robot_merkle_claims_insert_input: {
    claim_json: 'jsonb',
    id: 'uuid',
    merkle_root: 'robot_merkle_roots_obj_rel_insert_input',
  },
  robot_merkle_claims_max_order_by: {
    id: 'order_by',
    merkle_root_hash: 'order_by',
    recipient_eth_address: 'order_by',
  },
  robot_merkle_claims_min_order_by: {
    id: 'order_by',
    merkle_root_hash: 'order_by',
    recipient_eth_address: 'order_by',
  },
  robot_merkle_claims_on_conflict: {
    constraint: 'robot_merkle_claims_constraint',
    update_columns: 'robot_merkle_claims_update_column',
    where: 'robot_merkle_claims_bool_exp',
  },
  robot_merkle_claims_order_by: {
    claim_json: 'order_by',
    id: 'order_by',
    merkle_root: 'robot_merkle_roots_order_by',
    merkle_root_hash: 'order_by',
    recipient_eth_address: 'order_by',
  },
  robot_merkle_claims_pk_columns_input: {
    id: 'uuid',
  },
  robot_merkle_claims_prepend_input: {
    claim_json: 'jsonb',
  },
  robot_merkle_claims_select_column: 'enum' as const,
  robot_merkle_claims_set_input: {
    claim_json: 'jsonb',
    id: 'uuid',
  },
  robot_merkle_claims_stream_cursor_input: {
    initial_value: 'robot_merkle_claims_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  robot_merkle_claims_stream_cursor_value_input: {
    claim_json: 'jsonb',
    id: 'uuid',
  },
  robot_merkle_claims_update_column: 'enum' as const,
  robot_merkle_claims_updates: {
    _append: 'robot_merkle_claims_append_input',
    _delete_at_path: 'robot_merkle_claims_delete_at_path_input',
    _delete_elem: 'robot_merkle_claims_delete_elem_input',
    _delete_key: 'robot_merkle_claims_delete_key_input',
    _prepend: 'robot_merkle_claims_prepend_input',
    _set: 'robot_merkle_claims_set_input',
    where: 'robot_merkle_claims_bool_exp',
  },
  robot_merkle_roots: {
    merkle_claims: {
      distinct_on: 'robot_merkle_claims_select_column',
      order_by: 'robot_merkle_claims_order_by',
      where: 'robot_merkle_claims_bool_exp',
    },
    merkle_claims_aggregate: {
      distinct_on: 'robot_merkle_claims_select_column',
      order_by: 'robot_merkle_claims_order_by',
      where: 'robot_merkle_claims_bool_exp',
    },
  },
  robot_merkle_roots_aggregate_fields: {
    count: {
      columns: 'robot_merkle_roots_select_column',
    },
  },
  robot_merkle_roots_bool_exp: {
    _and: 'robot_merkle_roots_bool_exp',
    _not: 'robot_merkle_roots_bool_exp',
    _or: 'robot_merkle_roots_bool_exp',
    contract_address: 'String_comparison_exp',
    created_at: 'timestamptz_comparison_exp',
    hash: 'String_comparison_exp',
    merkle_claims: 'robot_merkle_claims_bool_exp',
    merkle_claims_aggregate: 'robot_merkle_claims_aggregate_bool_exp',
    network: 'String_comparison_exp',
  },
  robot_merkle_roots_constraint: 'enum' as const,
  robot_merkle_roots_insert_input: {
    created_at: 'timestamptz',
    merkle_claims: 'robot_merkle_claims_arr_rel_insert_input',
  },
  robot_merkle_roots_obj_rel_insert_input: {
    data: 'robot_merkle_roots_insert_input',
    on_conflict: 'robot_merkle_roots_on_conflict',
  },
  robot_merkle_roots_on_conflict: {
    constraint: 'robot_merkle_roots_constraint',
    update_columns: 'robot_merkle_roots_update_column',
    where: 'robot_merkle_roots_bool_exp',
  },
  robot_merkle_roots_order_by: {
    contract_address: 'order_by',
    created_at: 'order_by',
    hash: 'order_by',
    merkle_claims_aggregate: 'robot_merkle_claims_aggregate_order_by',
    network: 'order_by',
  },
  robot_merkle_roots_pk_columns_input: {},
  robot_merkle_roots_select_column: 'enum' as const,
  robot_merkle_roots_set_input: {
    created_at: 'timestamptz',
  },
  robot_merkle_roots_stream_cursor_input: {
    initial_value: 'robot_merkle_roots_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  robot_merkle_roots_stream_cursor_value_input: {
    created_at: 'timestamptz',
  },
  robot_merkle_roots_update_column: 'enum' as const,
  robot_merkle_roots_updates: {
    _set: 'robot_merkle_roots_set_input',
    where: 'robot_merkle_roots_bool_exp',
  },
  robot_order_aggregate_fields: {
    count: {
      columns: 'robot_order_select_column',
    },
  },
  robot_order_bool_exp: {
    _and: 'robot_order_bool_exp',
    _not: 'robot_order_bool_exp',
    _or: 'robot_order_bool_exp',
    buyer_address: 'String_comparison_exp',
    buyer_reward: 'numeric_comparison_exp',
    date: 'date_comparison_exp',
    dollars_spent: 'numeric_comparison_exp',
    order_id: 'String_comparison_exp',
    order_number: 'String_comparison_exp',
    season: 'numeric_comparison_exp',
  },
  robot_order_constraint: 'enum' as const,
  robot_order_inc_input: {
    buyer_reward: 'numeric',
    dollars_spent: 'numeric',
    season: 'numeric',
  },
  robot_order_insert_input: {
    buyer_reward: 'numeric',
    date: 'date',
    dollars_spent: 'numeric',
    season: 'numeric',
  },
  robot_order_on_conflict: {
    constraint: 'robot_order_constraint',
    update_columns: 'robot_order_update_column',
    where: 'robot_order_bool_exp',
  },
  robot_order_order_by: {
    buyer_address: 'order_by',
    buyer_reward: 'order_by',
    date: 'order_by',
    dollars_spent: 'order_by',
    order_id: 'order_by',
    order_number: 'order_by',
    season: 'order_by',
  },
  robot_order_pk_columns_input: {},
  robot_order_select_column: 'enum' as const,
  robot_order_set_input: {
    buyer_reward: 'numeric',
    date: 'date',
    dollars_spent: 'numeric',
    season: 'numeric',
  },
  robot_order_stream_cursor_input: {
    initial_value: 'robot_order_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  robot_order_stream_cursor_value_input: {
    buyer_reward: 'numeric',
    date: 'date',
    dollars_spent: 'numeric',
    season: 'numeric',
  },
  robot_order_update_column: 'enum' as const,
  robot_order_updates: {
    _inc: 'robot_order_inc_input',
    _set: 'robot_order_set_input',
    where: 'robot_order_bool_exp',
  },
  robot_product: {
    designers: {
      distinct_on: 'robot_product_designer_select_column',
      order_by: 'robot_product_designer_order_by',
      where: 'robot_product_designer_bool_exp',
    },
    designers_aggregate: {
      distinct_on: 'robot_product_designer_select_column',
      order_by: 'robot_product_designer_order_by',
      where: 'robot_product_designer_bool_exp',
    },
    nft_metadata: {},
  },
  robot_product_aggregate_fields: {
    count: {
      columns: 'robot_product_select_column',
    },
  },
  robot_product_append_input: {
    nft_metadata: 'jsonb',
  },
  robot_product_bool_exp: {
    _and: 'robot_product_bool_exp',
    _not: 'robot_product_bool_exp',
    _or: 'robot_product_bool_exp',
    created_at: 'timestamptz_comparison_exp',
    designers: 'robot_product_designer_bool_exp',
    designers_aggregate: 'robot_product_designer_aggregate_bool_exp',
    id: 'String_comparison_exp',
    nft_metadata: 'jsonb_comparison_exp',
    nft_token_id: 'Int_comparison_exp',
    notion_id: 'String_comparison_exp',
    shopify_id: 'String_comparison_exp',
    title: 'String_comparison_exp',
    updated_at: 'timestamptz_comparison_exp',
  },
  robot_product_constraint: 'enum' as const,
  robot_product_delete_at_path_input: {},
  robot_product_delete_elem_input: {},
  robot_product_delete_key_input: {},
  robot_product_designer_aggregate_bool_exp: {
    count: 'robot_product_designer_aggregate_bool_exp_count',
  },
  robot_product_designer_aggregate_bool_exp_count: {
    arguments: 'robot_product_designer_select_column',
    filter: 'robot_product_designer_bool_exp',
    predicate: 'Int_comparison_exp',
  },
  robot_product_designer_aggregate_fields: {
    count: {
      columns: 'robot_product_designer_select_column',
    },
  },
  robot_product_designer_aggregate_order_by: {
    avg: 'robot_product_designer_avg_order_by',
    count: 'order_by',
    max: 'robot_product_designer_max_order_by',
    min: 'robot_product_designer_min_order_by',
    stddev: 'robot_product_designer_stddev_order_by',
    stddev_pop: 'robot_product_designer_stddev_pop_order_by',
    stddev_samp: 'robot_product_designer_stddev_samp_order_by',
    sum: 'robot_product_designer_sum_order_by',
    var_pop: 'robot_product_designer_var_pop_order_by',
    var_samp: 'robot_product_designer_var_samp_order_by',
    variance: 'robot_product_designer_variance_order_by',
  },
  robot_product_designer_arr_rel_insert_input: {
    data: 'robot_product_designer_insert_input',
    on_conflict: 'robot_product_designer_on_conflict',
  },
  robot_product_designer_avg_order_by: {
    contribution_share: 'order_by',
    robot_reward: 'order_by',
  },
  robot_product_designer_bool_exp: {
    _and: 'robot_product_designer_bool_exp',
    _not: 'robot_product_designer_bool_exp',
    _or: 'robot_product_designer_bool_exp',
    contribution_share: 'numeric_comparison_exp',
    designer_name: 'String_comparison_exp',
    eth_address: 'String_comparison_exp',
    product: 'robot_product_bool_exp',
    product_id: 'String_comparison_exp',
    robot_reward: 'numeric_comparison_exp',
  },
  robot_product_designer_constraint: 'enum' as const,
  robot_product_designer_inc_input: {
    contribution_share: 'numeric',
    robot_reward: 'numeric',
  },
  robot_product_designer_insert_input: {
    contribution_share: 'numeric',
    product: 'robot_product_obj_rel_insert_input',
    robot_reward: 'numeric',
  },
  robot_product_designer_max_order_by: {
    contribution_share: 'order_by',
    designer_name: 'order_by',
    eth_address: 'order_by',
    product_id: 'order_by',
    robot_reward: 'order_by',
  },
  robot_product_designer_min_order_by: {
    contribution_share: 'order_by',
    designer_name: 'order_by',
    eth_address: 'order_by',
    product_id: 'order_by',
    robot_reward: 'order_by',
  },
  robot_product_designer_on_conflict: {
    constraint: 'robot_product_designer_constraint',
    update_columns: 'robot_product_designer_update_column',
    where: 'robot_product_designer_bool_exp',
  },
  robot_product_designer_order_by: {
    contribution_share: 'order_by',
    designer_name: 'order_by',
    eth_address: 'order_by',
    product: 'robot_product_order_by',
    product_id: 'order_by',
    robot_reward: 'order_by',
  },
  robot_product_designer_pk_columns_input: {},
  robot_product_designer_select_column: 'enum' as const,
  robot_product_designer_set_input: {
    contribution_share: 'numeric',
    robot_reward: 'numeric',
  },
  robot_product_designer_stddev_order_by: {
    contribution_share: 'order_by',
    robot_reward: 'order_by',
  },
  robot_product_designer_stddev_pop_order_by: {
    contribution_share: 'order_by',
    robot_reward: 'order_by',
  },
  robot_product_designer_stddev_samp_order_by: {
    contribution_share: 'order_by',
    robot_reward: 'order_by',
  },
  robot_product_designer_stream_cursor_input: {
    initial_value: 'robot_product_designer_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  robot_product_designer_stream_cursor_value_input: {
    contribution_share: 'numeric',
    robot_reward: 'numeric',
  },
  robot_product_designer_sum_order_by: {
    contribution_share: 'order_by',
    robot_reward: 'order_by',
  },
  robot_product_designer_update_column: 'enum' as const,
  robot_product_designer_updates: {
    _inc: 'robot_product_designer_inc_input',
    _set: 'robot_product_designer_set_input',
    where: 'robot_product_designer_bool_exp',
  },
  robot_product_designer_var_pop_order_by: {
    contribution_share: 'order_by',
    robot_reward: 'order_by',
  },
  robot_product_designer_var_samp_order_by: {
    contribution_share: 'order_by',
    robot_reward: 'order_by',
  },
  robot_product_designer_variance_order_by: {
    contribution_share: 'order_by',
    robot_reward: 'order_by',
  },
  robot_product_inc_input: {},
  robot_product_insert_input: {
    created_at: 'timestamptz',
    designers: 'robot_product_designer_arr_rel_insert_input',
    nft_metadata: 'jsonb',
    updated_at: 'timestamptz',
  },
  robot_product_obj_rel_insert_input: {
    data: 'robot_product_insert_input',
    on_conflict: 'robot_product_on_conflict',
  },
  robot_product_on_conflict: {
    constraint: 'robot_product_constraint',
    update_columns: 'robot_product_update_column',
    where: 'robot_product_bool_exp',
  },
  robot_product_order_by: {
    created_at: 'order_by',
    designers_aggregate: 'robot_product_designer_aggregate_order_by',
    id: 'order_by',
    nft_metadata: 'order_by',
    nft_token_id: 'order_by',
    notion_id: 'order_by',
    shopify_id: 'order_by',
    title: 'order_by',
    updated_at: 'order_by',
  },
  robot_product_pk_columns_input: {},
  robot_product_prepend_input: {
    nft_metadata: 'jsonb',
  },
  robot_product_select_column: 'enum' as const,
  robot_product_set_input: {
    created_at: 'timestamptz',
    nft_metadata: 'jsonb',
    updated_at: 'timestamptz',
  },
  robot_product_stream_cursor_input: {
    initial_value: 'robot_product_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  robot_product_stream_cursor_value_input: {
    created_at: 'timestamptz',
    nft_metadata: 'jsonb',
    updated_at: 'timestamptz',
  },
  robot_product_update_column: 'enum' as const,
  robot_product_updates: {
    _append: 'robot_product_append_input',
    _delete_at_path: 'robot_product_delete_at_path_input',
    _delete_elem: 'robot_product_delete_elem_input',
    _delete_key: 'robot_product_delete_key_input',
    _inc: 'robot_product_inc_input',
    _prepend: 'robot_product_prepend_input',
    _set: 'robot_product_set_input',
    where: 'robot_product_bool_exp',
  },
  shop_api_users_aggregate_fields: {
    count: {
      columns: 'shop_api_users_select_column',
    },
  },
  shop_api_users_bool_exp: {
    _and: 'shop_api_users_bool_exp',
    _not: 'shop_api_users_bool_exp',
    _or: 'shop_api_users_bool_exp',
    password_hash: 'String_comparison_exp',
    username: 'String_comparison_exp',
  },
  shop_api_users_constraint: 'enum' as const,
  shop_api_users_insert_input: {},
  shop_api_users_on_conflict: {
    constraint: 'shop_api_users_constraint',
    update_columns: 'shop_api_users_update_column',
    where: 'shop_api_users_bool_exp',
  },
  shop_api_users_order_by: {
    password_hash: 'order_by',
    username: 'order_by',
  },
  shop_api_users_pk_columns_input: {},
  shop_api_users_select_column: 'enum' as const,
  shop_api_users_set_input: {},
  shop_api_users_stream_cursor_input: {
    initial_value: 'shop_api_users_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  shop_api_users_stream_cursor_value_input: {},
  shop_api_users_update_column: 'enum' as const,
  shop_api_users_updates: {
    _set: 'shop_api_users_set_input',
    where: 'shop_api_users_bool_exp',
  },
  shop_product_locks_aggregate_fields: {
    count: {
      columns: 'shop_product_locks_select_column',
    },
  },
  shop_product_locks_bool_exp: {
    _and: 'shop_product_locks_bool_exp',
    _not: 'shop_product_locks_bool_exp',
    _or: 'shop_product_locks_bool_exp',
    access_code: 'String_comparison_exp',
    created_at: 'timestamptz_comparison_exp',
    customer_eth_address: 'String_comparison_exp',
    lock_id: 'String_comparison_exp',
  },
  shop_product_locks_constraint: 'enum' as const,
  shop_product_locks_insert_input: {
    created_at: 'timestamptz',
  },
  shop_product_locks_on_conflict: {
    constraint: 'shop_product_locks_constraint',
    update_columns: 'shop_product_locks_update_column',
    where: 'shop_product_locks_bool_exp',
  },
  shop_product_locks_order_by: {
    access_code: 'order_by',
    created_at: 'order_by',
    customer_eth_address: 'order_by',
    lock_id: 'order_by',
  },
  shop_product_locks_pk_columns_input: {},
  shop_product_locks_select_column: 'enum' as const,
  shop_product_locks_set_input: {
    created_at: 'timestamptz',
  },
  shop_product_locks_stream_cursor_input: {
    initial_value: 'shop_product_locks_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  shop_product_locks_stream_cursor_value_input: {
    created_at: 'timestamptz',
  },
  shop_product_locks_update_column: 'enum' as const,
  shop_product_locks_updates: {
    _set: 'shop_product_locks_set_input',
    where: 'shop_product_locks_bool_exp',
  },
  subscription_root: {
    contribution_votes: {
      distinct_on: 'contribution_votes_select_column',
      order_by: 'contribution_votes_order_by',
      where: 'contribution_votes_bool_exp',
    },
    contribution_votes_aggregate: {
      distinct_on: 'contribution_votes_select_column',
      order_by: 'contribution_votes_order_by',
      where: 'contribution_votes_bool_exp',
    },
    contribution_votes_by_pk: {
      contribution_id: 'uuid',
      user_id: 'uuid',
    },
    contribution_votes_stream: {
      cursor: 'contribution_votes_stream_cursor_input',
      where: 'contribution_votes_bool_exp',
    },
    contributions: {
      distinct_on: 'contributions_select_column',
      order_by: 'contributions_order_by',
      where: 'contributions_bool_exp',
    },
    contributions_aggregate: {
      distinct_on: 'contributions_select_column',
      order_by: 'contributions_order_by',
      where: 'contributions_bool_exp',
    },
    contributions_by_pk: {
      id: 'uuid',
    },
    contributions_stream: {
      cursor: 'contributions_stream_cursor_input',
      where: 'contributions_bool_exp',
    },
    contributors: {
      distinct_on: 'contributors_select_column',
      order_by: 'contributors_order_by',
      where: 'contributors_bool_exp',
    },
    contributors_aggregate: {
      distinct_on: 'contributors_select_column',
      order_by: 'contributors_order_by',
      where: 'contributors_bool_exp',
    },
    contributors_by_pk: {
      contribution_id: 'uuid',
      user_id: 'uuid',
    },
    contributors_stream: {
      cursor: 'contributors_stream_cursor_input',
      where: 'contributors_bool_exp',
    },
    omni_brand_statuses_enum: {
      distinct_on: 'omni_brand_statuses_enum_select_column',
      order_by: 'omni_brand_statuses_enum_order_by',
      where: 'omni_brand_statuses_enum_bool_exp',
    },
    omni_brand_statuses_enum_aggregate: {
      distinct_on: 'omni_brand_statuses_enum_select_column',
      order_by: 'omni_brand_statuses_enum_order_by',
      where: 'omni_brand_statuses_enum_bool_exp',
    },
    omni_brand_statuses_enum_by_pk: {},
    omni_brand_statuses_enum_stream: {
      cursor: 'omni_brand_statuses_enum_stream_cursor_input',
      where: 'omni_brand_statuses_enum_bool_exp',
    },
    omni_brand_users: {
      distinct_on: 'omni_brand_users_select_column',
      order_by: 'omni_brand_users_order_by',
      where: 'omni_brand_users_bool_exp',
    },
    omni_brand_users_aggregate: {
      distinct_on: 'omni_brand_users_select_column',
      order_by: 'omni_brand_users_order_by',
      where: 'omni_brand_users_bool_exp',
    },
    omni_brand_users_by_pk: {
      id: 'uuid',
    },
    omni_brand_users_stream: {
      cursor: 'omni_brand_users_stream_cursor_input',
      where: 'omni_brand_users_bool_exp',
    },
    omni_brands: {
      distinct_on: 'omni_brands_select_column',
      order_by: 'omni_brands_order_by',
      where: 'omni_brands_bool_exp',
    },
    omni_brands_aggregate: {
      distinct_on: 'omni_brands_select_column',
      order_by: 'omni_brands_order_by',
      where: 'omni_brands_bool_exp',
    },
    omni_brands_by_pk: {
      id: 'uuid',
    },
    omni_brands_stream: {
      cursor: 'omni_brands_stream_cursor_input',
      where: 'omni_brands_bool_exp',
    },
    omni_collaborator_types_enum: {
      distinct_on: 'omni_collaborator_types_enum_select_column',
      order_by: 'omni_collaborator_types_enum_order_by',
      where: 'omni_collaborator_types_enum_bool_exp',
    },
    omni_collaborator_types_enum_aggregate: {
      distinct_on: 'omni_collaborator_types_enum_select_column',
      order_by: 'omni_collaborator_types_enum_order_by',
      where: 'omni_collaborator_types_enum_bool_exp',
    },
    omni_collaborator_types_enum_by_pk: {},
    omni_collaborator_types_enum_stream: {
      cursor: 'omni_collaborator_types_enum_stream_cursor_input',
      where: 'omni_collaborator_types_enum_bool_exp',
    },
    omni_directus_files: {
      distinct_on: 'omni_directus_files_select_column',
      order_by: 'omni_directus_files_order_by',
      where: 'omni_directus_files_bool_exp',
    },
    omni_directus_files_aggregate: {
      distinct_on: 'omni_directus_files_select_column',
      order_by: 'omni_directus_files_order_by',
      where: 'omni_directus_files_bool_exp',
    },
    omni_directus_files_by_pk: {},
    omni_directus_files_stream: {
      cursor: 'omni_directus_files_stream_cursor_input',
      where: 'omni_directus_files_bool_exp',
    },
    omni_fullfillers: {
      distinct_on: 'omni_fullfillers_select_column',
      order_by: 'omni_fullfillers_order_by',
      where: 'omni_fullfillers_bool_exp',
    },
    omni_fullfillers_aggregate: {
      distinct_on: 'omni_fullfillers_select_column',
      order_by: 'omni_fullfillers_order_by',
      where: 'omni_fullfillers_bool_exp',
    },
    omni_fullfillers_by_pk: {
      id: 'uuid',
    },
    omni_fullfillers_stream: {
      cursor: 'omni_fullfillers_stream_cursor_input',
      where: 'omni_fullfillers_bool_exp',
    },
    omni_price_currencies: {
      distinct_on: 'omni_price_currencies_select_column',
      order_by: 'omni_price_currencies_order_by',
      where: 'omni_price_currencies_bool_exp',
    },
    omni_price_currencies_aggregate: {
      distinct_on: 'omni_price_currencies_select_column',
      order_by: 'omni_price_currencies_order_by',
      where: 'omni_price_currencies_bool_exp',
    },
    omni_price_currencies_by_pk: {
      id: 'uuid',
    },
    omni_price_currencies_stream: {
      cursor: 'omni_price_currencies_stream_cursor_input',
      where: 'omni_price_currencies_bool_exp',
    },
    omni_print_techs_enum: {
      distinct_on: 'omni_print_techs_enum_select_column',
      order_by: 'omni_print_techs_enum_order_by',
      where: 'omni_print_techs_enum_bool_exp',
    },
    omni_print_techs_enum_aggregate: {
      distinct_on: 'omni_print_techs_enum_select_column',
      order_by: 'omni_print_techs_enum_order_by',
      where: 'omni_print_techs_enum_bool_exp',
    },
    omni_print_techs_enum_by_pk: {},
    omni_print_techs_enum_stream: {
      cursor: 'omni_print_techs_enum_stream_cursor_input',
      where: 'omni_print_techs_enum_bool_exp',
    },
    omni_producer_statuses_enum: {
      distinct_on: 'omni_producer_statuses_enum_select_column',
      order_by: 'omni_producer_statuses_enum_order_by',
      where: 'omni_producer_statuses_enum_bool_exp',
    },
    omni_producer_statuses_enum_aggregate: {
      distinct_on: 'omni_producer_statuses_enum_select_column',
      order_by: 'omni_producer_statuses_enum_order_by',
      where: 'omni_producer_statuses_enum_bool_exp',
    },
    omni_producer_statuses_enum_by_pk: {},
    omni_producer_statuses_enum_stream: {
      cursor: 'omni_producer_statuses_enum_stream_cursor_input',
      where: 'omni_producer_statuses_enum_bool_exp',
    },
    omni_producers: {
      distinct_on: 'omni_producers_select_column',
      order_by: 'omni_producers_order_by',
      where: 'omni_producers_bool_exp',
    },
    omni_producers_aggregate: {
      distinct_on: 'omni_producers_select_column',
      order_by: 'omni_producers_order_by',
      where: 'omni_producers_bool_exp',
    },
    omni_producers_by_pk: {
      id: 'uuid',
    },
    omni_producers_stream: {
      cursor: 'omni_producers_stream_cursor_input',
      where: 'omni_producers_bool_exp',
    },
    omni_product_collaborators: {
      distinct_on: 'omni_product_collaborators_select_column',
      order_by: 'omni_product_collaborators_order_by',
      where: 'omni_product_collaborators_bool_exp',
    },
    omni_product_collaborators_aggregate: {
      distinct_on: 'omni_product_collaborators_select_column',
      order_by: 'omni_product_collaborators_order_by',
      where: 'omni_product_collaborators_bool_exp',
    },
    omni_product_collaborators_by_pk: {
      id: 'uuid',
    },
    omni_product_collaborators_stream: {
      cursor: 'omni_product_collaborators_stream_cursor_input',
      where: 'omni_product_collaborators_bool_exp',
    },
    omni_product_types_enum: {
      distinct_on: 'omni_product_types_enum_select_column',
      order_by: 'omni_product_types_enum_order_by',
      where: 'omni_product_types_enum_bool_exp',
    },
    omni_product_types_enum_aggregate: {
      distinct_on: 'omni_product_types_enum_select_column',
      order_by: 'omni_product_types_enum_order_by',
      where: 'omni_product_types_enum_bool_exp',
    },
    omni_product_types_enum_by_pk: {},
    omni_product_types_enum_stream: {
      cursor: 'omni_product_types_enum_stream_cursor_input',
      where: 'omni_product_types_enum_bool_exp',
    },
    omni_production_genders_enum: {
      distinct_on: 'omni_production_genders_enum_select_column',
      order_by: 'omni_production_genders_enum_order_by',
      where: 'omni_production_genders_enum_bool_exp',
    },
    omni_production_genders_enum_aggregate: {
      distinct_on: 'omni_production_genders_enum_select_column',
      order_by: 'omni_production_genders_enum_order_by',
      where: 'omni_production_genders_enum_bool_exp',
    },
    omni_production_genders_enum_by_pk: {},
    omni_production_genders_enum_stream: {
      cursor: 'omni_production_genders_enum_stream_cursor_input',
      where: 'omni_production_genders_enum_bool_exp',
    },
    omni_production_materials: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
    omni_production_materials_aggregate: {
      distinct_on: 'omni_production_materials_select_column',
      order_by: 'omni_production_materials_order_by',
      where: 'omni_production_materials_bool_exp',
    },
    omni_production_materials_by_pk: {
      id: 'uuid',
    },
    omni_production_materials_producers: {
      distinct_on: 'omni_production_materials_producers_select_column',
      order_by: 'omni_production_materials_producers_order_by',
      where: 'omni_production_materials_producers_bool_exp',
    },
    omni_production_materials_producers_aggregate: {
      distinct_on: 'omni_production_materials_producers_select_column',
      order_by: 'omni_production_materials_producers_order_by',
      where: 'omni_production_materials_producers_bool_exp',
    },
    omni_production_materials_producers_by_pk: {
      id: 'uuid',
    },
    omni_production_materials_producers_stream: {
      cursor: 'omni_production_materials_producers_stream_cursor_input',
      where: 'omni_production_materials_producers_bool_exp',
    },
    omni_production_materials_ratings_enum: {
      distinct_on: 'omni_production_materials_ratings_enum_select_column',
      order_by: 'omni_production_materials_ratings_enum_order_by',
      where: 'omni_production_materials_ratings_enum_bool_exp',
    },
    omni_production_materials_ratings_enum_aggregate: {
      distinct_on: 'omni_production_materials_ratings_enum_select_column',
      order_by: 'omni_production_materials_ratings_enum_order_by',
      where: 'omni_production_materials_ratings_enum_bool_exp',
    },
    omni_production_materials_ratings_enum_by_pk: {},
    omni_production_materials_ratings_enum_stream: {
      cursor: 'omni_production_materials_ratings_enum_stream_cursor_input',
      where: 'omni_production_materials_ratings_enum_bool_exp',
    },
    omni_production_materials_stream: {
      cursor: 'omni_production_materials_stream_cursor_input',
      where: 'omni_production_materials_bool_exp',
    },
    omni_production_methods: {
      distinct_on: 'omni_production_methods_select_column',
      order_by: 'omni_production_methods_order_by',
      where: 'omni_production_methods_bool_exp',
    },
    omni_production_methods_aggregate: {
      distinct_on: 'omni_production_methods_select_column',
      order_by: 'omni_production_methods_order_by',
      where: 'omni_production_methods_bool_exp',
    },
    omni_production_methods_by_pk: {
      id: 'uuid',
    },
    omni_production_methods_producers: {
      distinct_on: 'omni_production_methods_producers_select_column',
      order_by: 'omni_production_methods_producers_order_by',
      where: 'omni_production_methods_producers_bool_exp',
    },
    omni_production_methods_producers_aggregate: {
      distinct_on: 'omni_production_methods_producers_select_column',
      order_by: 'omni_production_methods_producers_order_by',
      where: 'omni_production_methods_producers_bool_exp',
    },
    omni_production_methods_producers_by_pk: {
      id: 'uuid',
    },
    omni_production_methods_producers_stream: {
      cursor: 'omni_production_methods_producers_stream_cursor_input',
      where: 'omni_production_methods_producers_bool_exp',
    },
    omni_production_methods_products: {
      distinct_on: 'omni_production_methods_products_select_column',
      order_by: 'omni_production_methods_products_order_by',
      where: 'omni_production_methods_products_bool_exp',
    },
    omni_production_methods_products_aggregate: {
      distinct_on: 'omni_production_methods_products_select_column',
      order_by: 'omni_production_methods_products_order_by',
      where: 'omni_production_methods_products_bool_exp',
    },
    omni_production_methods_products_by_pk: {
      id: 'uuid',
    },
    omni_production_methods_products_stream: {
      cursor: 'omni_production_methods_products_stream_cursor_input',
      where: 'omni_production_methods_products_bool_exp',
    },
    omni_production_methods_stream: {
      cursor: 'omni_production_methods_stream_cursor_input',
      where: 'omni_production_methods_bool_exp',
    },
    omni_production_pallettes_enum: {
      distinct_on: 'omni_production_pallettes_enum_select_column',
      order_by: 'omni_production_pallettes_enum_order_by',
      where: 'omni_production_pallettes_enum_bool_exp',
    },
    omni_production_pallettes_enum_aggregate: {
      distinct_on: 'omni_production_pallettes_enum_select_column',
      order_by: 'omni_production_pallettes_enum_order_by',
      where: 'omni_production_pallettes_enum_bool_exp',
    },
    omni_production_pallettes_enum_by_pk: {},
    omni_production_pallettes_enum_stream: {
      cursor: 'omni_production_pallettes_enum_stream_cursor_input',
      where: 'omni_production_pallettes_enum_bool_exp',
    },
    omni_production_styles_enum: {
      distinct_on: 'omni_production_styles_enum_select_column',
      order_by: 'omni_production_styles_enum_order_by',
      where: 'omni_production_styles_enum_bool_exp',
    },
    omni_production_styles_enum_aggregate: {
      distinct_on: 'omni_production_styles_enum_select_column',
      order_by: 'omni_production_styles_enum_order_by',
      where: 'omni_production_styles_enum_bool_exp',
    },
    omni_production_styles_enum_by_pk: {},
    omni_production_styles_enum_stream: {
      cursor: 'omni_production_styles_enum_stream_cursor_input',
      where: 'omni_production_styles_enum_bool_exp',
    },
    omni_products: {
      distinct_on: 'omni_products_select_column',
      order_by: 'omni_products_order_by',
      where: 'omni_products_bool_exp',
    },
    omni_products_aggregate: {
      distinct_on: 'omni_products_select_column',
      order_by: 'omni_products_order_by',
      where: 'omni_products_bool_exp',
    },
    omni_products_by_pk: {
      id: 'uuid',
    },
    omni_products_files: {
      distinct_on: 'omni_products_files_select_column',
      order_by: 'omni_products_files_order_by',
      where: 'omni_products_files_bool_exp',
    },
    omni_products_files_aggregate: {
      distinct_on: 'omni_products_files_select_column',
      order_by: 'omni_products_files_order_by',
      where: 'omni_products_files_bool_exp',
    },
    omni_products_files_by_pk: {},
    omni_products_files_stream: {
      cursor: 'omni_products_files_stream_cursor_input',
      where: 'omni_products_files_bool_exp',
    },
    omni_products_production_materials: {
      distinct_on: 'omni_products_production_materials_select_column',
      order_by: 'omni_products_production_materials_order_by',
      where: 'omni_products_production_materials_bool_exp',
    },
    omni_products_production_materials_aggregate: {
      distinct_on: 'omni_products_production_materials_select_column',
      order_by: 'omni_products_production_materials_order_by',
      where: 'omni_products_production_materials_bool_exp',
    },
    omni_products_production_materials_by_pk: {},
    omni_products_production_materials_stream: {
      cursor: 'omni_products_production_materials_stream_cursor_input',
      where: 'omni_products_production_materials_bool_exp',
    },
    omni_products_stage_enum: {
      distinct_on: 'omni_products_stage_enum_select_column',
      order_by: 'omni_products_stage_enum_order_by',
      where: 'omni_products_stage_enum_bool_exp',
    },
    omni_products_stage_enum_aggregate: {
      distinct_on: 'omni_products_stage_enum_select_column',
      order_by: 'omni_products_stage_enum_order_by',
      where: 'omni_products_stage_enum_bool_exp',
    },
    omni_products_stage_enum_by_pk: {},
    omni_products_stage_enum_stream: {
      cursor: 'omni_products_stage_enum_stream_cursor_input',
      where: 'omni_products_stage_enum_bool_exp',
    },
    omni_products_stream: {
      cursor: 'omni_products_stream_cursor_input',
      where: 'omni_products_bool_exp',
    },
    omni_sale_types_enum: {
      distinct_on: 'omni_sale_types_enum_select_column',
      order_by: 'omni_sale_types_enum_order_by',
      where: 'omni_sale_types_enum_bool_exp',
    },
    omni_sale_types_enum_aggregate: {
      distinct_on: 'omni_sale_types_enum_select_column',
      order_by: 'omni_sale_types_enum_order_by',
      where: 'omni_sale_types_enum_bool_exp',
    },
    omni_sale_types_enum_by_pk: {},
    omni_sale_types_enum_stream: {
      cursor: 'omni_sale_types_enum_stream_cursor_input',
      where: 'omni_sale_types_enum_bool_exp',
    },
    omni_timezones_enum: {
      distinct_on: 'omni_timezones_enum_select_column',
      order_by: 'omni_timezones_enum_order_by',
      where: 'omni_timezones_enum_bool_exp',
    },
    omni_timezones_enum_aggregate: {
      distinct_on: 'omni_timezones_enum_select_column',
      order_by: 'omni_timezones_enum_order_by',
      where: 'omni_timezones_enum_bool_exp',
    },
    omni_timezones_enum_by_pk: {},
    omni_timezones_enum_stream: {
      cursor: 'omni_timezones_enum_stream_cursor_input',
      where: 'omni_timezones_enum_bool_exp',
    },
    omni_user_skill_types_enum: {
      distinct_on: 'omni_user_skill_types_enum_select_column',
      order_by: 'omni_user_skill_types_enum_order_by',
      where: 'omni_user_skill_types_enum_bool_exp',
    },
    omni_user_skill_types_enum_aggregate: {
      distinct_on: 'omni_user_skill_types_enum_select_column',
      order_by: 'omni_user_skill_types_enum_order_by',
      where: 'omni_user_skill_types_enum_bool_exp',
    },
    omni_user_skill_types_enum_by_pk: {},
    omni_user_skill_types_enum_stream: {
      cursor: 'omni_user_skill_types_enum_stream_cursor_input',
      where: 'omni_user_skill_types_enum_bool_exp',
    },
    omni_user_skills: {
      distinct_on: 'omni_user_skills_select_column',
      order_by: 'omni_user_skills_order_by',
      where: 'omni_user_skills_bool_exp',
    },
    omni_user_skills_aggregate: {
      distinct_on: 'omni_user_skills_select_column',
      order_by: 'omni_user_skills_order_by',
      where: 'omni_user_skills_bool_exp',
    },
    omni_user_skills_by_pk: {
      id: 'uuid',
    },
    omni_user_skills_stream: {
      cursor: 'omni_user_skills_stream_cursor_input',
      where: 'omni_user_skills_bool_exp',
    },
    omni_user_statuses_enum: {
      distinct_on: 'omni_user_statuses_enum_select_column',
      order_by: 'omni_user_statuses_enum_order_by',
      where: 'omni_user_statuses_enum_bool_exp',
    },
    omni_user_statuses_enum_aggregate: {
      distinct_on: 'omni_user_statuses_enum_select_column',
      order_by: 'omni_user_statuses_enum_order_by',
      where: 'omni_user_statuses_enum_bool_exp',
    },
    omni_user_statuses_enum_by_pk: {},
    omni_user_statuses_enum_stream: {
      cursor: 'omni_user_statuses_enum_stream_cursor_input',
      where: 'omni_user_statuses_enum_bool_exp',
    },
    omni_users: {
      distinct_on: 'omni_users_select_column',
      order_by: 'omni_users_order_by',
      where: 'omni_users_bool_exp',
    },
    omni_users_aggregate: {
      distinct_on: 'omni_users_select_column',
      order_by: 'omni_users_order_by',
      where: 'omni_users_bool_exp',
    },
    omni_users_by_pk: {
      id: 'uuid',
    },
    omni_users_stream: {
      cursor: 'omni_users_stream_cursor_input',
      where: 'omni_users_bool_exp',
    },
    robot_merkle_claims: {
      distinct_on: 'robot_merkle_claims_select_column',
      order_by: 'robot_merkle_claims_order_by',
      where: 'robot_merkle_claims_bool_exp',
    },
    robot_merkle_claims_aggregate: {
      distinct_on: 'robot_merkle_claims_select_column',
      order_by: 'robot_merkle_claims_order_by',
      where: 'robot_merkle_claims_bool_exp',
    },
    robot_merkle_claims_by_pk: {
      id: 'uuid',
    },
    robot_merkle_claims_stream: {
      cursor: 'robot_merkle_claims_stream_cursor_input',
      where: 'robot_merkle_claims_bool_exp',
    },
    robot_merkle_roots: {
      distinct_on: 'robot_merkle_roots_select_column',
      order_by: 'robot_merkle_roots_order_by',
      where: 'robot_merkle_roots_bool_exp',
    },
    robot_merkle_roots_aggregate: {
      distinct_on: 'robot_merkle_roots_select_column',
      order_by: 'robot_merkle_roots_order_by',
      where: 'robot_merkle_roots_bool_exp',
    },
    robot_merkle_roots_by_pk: {},
    robot_merkle_roots_stream: {
      cursor: 'robot_merkle_roots_stream_cursor_input',
      where: 'robot_merkle_roots_bool_exp',
    },
    robot_order: {
      distinct_on: 'robot_order_select_column',
      order_by: 'robot_order_order_by',
      where: 'robot_order_bool_exp',
    },
    robot_order_aggregate: {
      distinct_on: 'robot_order_select_column',
      order_by: 'robot_order_order_by',
      where: 'robot_order_bool_exp',
    },
    robot_order_by_pk: {},
    robot_order_stream: {
      cursor: 'robot_order_stream_cursor_input',
      where: 'robot_order_bool_exp',
    },
    robot_product: {
      distinct_on: 'robot_product_select_column',
      order_by: 'robot_product_order_by',
      where: 'robot_product_bool_exp',
    },
    robot_product_aggregate: {
      distinct_on: 'robot_product_select_column',
      order_by: 'robot_product_order_by',
      where: 'robot_product_bool_exp',
    },
    robot_product_by_pk: {},
    robot_product_designer: {
      distinct_on: 'robot_product_designer_select_column',
      order_by: 'robot_product_designer_order_by',
      where: 'robot_product_designer_bool_exp',
    },
    robot_product_designer_aggregate: {
      distinct_on: 'robot_product_designer_select_column',
      order_by: 'robot_product_designer_order_by',
      where: 'robot_product_designer_bool_exp',
    },
    robot_product_designer_by_pk: {},
    robot_product_designer_stream: {
      cursor: 'robot_product_designer_stream_cursor_input',
      where: 'robot_product_designer_bool_exp',
    },
    robot_product_stream: {
      cursor: 'robot_product_stream_cursor_input',
      where: 'robot_product_bool_exp',
    },
    shop_api_users: {
      distinct_on: 'shop_api_users_select_column',
      order_by: 'shop_api_users_order_by',
      where: 'shop_api_users_bool_exp',
    },
    shop_api_users_aggregate: {
      distinct_on: 'shop_api_users_select_column',
      order_by: 'shop_api_users_order_by',
      where: 'shop_api_users_bool_exp',
    },
    shop_api_users_by_pk: {},
    shop_api_users_stream: {
      cursor: 'shop_api_users_stream_cursor_input',
      where: 'shop_api_users_bool_exp',
    },
    shop_product_locks: {
      distinct_on: 'shop_product_locks_select_column',
      order_by: 'shop_product_locks_order_by',
      where: 'shop_product_locks_bool_exp',
    },
    shop_product_locks_aggregate: {
      distinct_on: 'shop_product_locks_select_column',
      order_by: 'shop_product_locks_order_by',
      where: 'shop_product_locks_bool_exp',
    },
    shop_product_locks_by_pk: {},
    shop_product_locks_stream: {
      cursor: 'shop_product_locks_stream_cursor_input',
      where: 'shop_product_locks_bool_exp',
    },
    users: {
      distinct_on: 'users_select_column',
      order_by: 'users_order_by',
      where: 'users_bool_exp',
    },
    users_aggregate: {
      distinct_on: 'users_select_column',
      order_by: 'users_order_by',
      where: 'users_bool_exp',
    },
    users_by_pk: {
      id: 'uuid',
    },
    users_stream: {
      cursor: 'users_stream_cursor_input',
      where: 'users_bool_exp',
    },
  },
  timestamptz: `scalar.timestamptz` as const,
  timestamptz_comparison_exp: {
    _eq: 'timestamptz',
    _gt: 'timestamptz',
    _gte: 'timestamptz',
    _in: 'timestamptz',
    _lt: 'timestamptz',
    _lte: 'timestamptz',
    _neq: 'timestamptz',
    _nin: 'timestamptz',
  },
  users_aggregate_fields: {
    count: {
      columns: 'users_select_column',
    },
  },
  users_bool_exp: {
    _and: 'users_bool_exp',
    _not: 'users_bool_exp',
    _or: 'users_bool_exp',
    eth_address: 'String_comparison_exp',
    id: 'uuid_comparison_exp',
    name: 'String_comparison_exp',
  },
  users_constraint: 'enum' as const,
  users_insert_input: {
    id: 'uuid',
  },
  users_obj_rel_insert_input: {
    data: 'users_insert_input',
    on_conflict: 'users_on_conflict',
  },
  users_on_conflict: {
    constraint: 'users_constraint',
    update_columns: 'users_update_column',
    where: 'users_bool_exp',
  },
  users_order_by: {
    eth_address: 'order_by',
    id: 'order_by',
    name: 'order_by',
  },
  users_pk_columns_input: {
    id: 'uuid',
  },
  users_select_column: 'enum' as const,
  users_set_input: {
    id: 'uuid',
  },
  users_stream_cursor_input: {
    initial_value: 'users_stream_cursor_value_input',
    ordering: 'cursor_ordering',
  },
  users_stream_cursor_value_input: {
    id: 'uuid',
  },
  users_update_column: 'enum' as const,
  users_updates: {
    _set: 'users_set_input',
    where: 'users_bool_exp',
  },
  uuid: `scalar.uuid` as const,
  uuid_comparison_exp: {
    _eq: 'uuid',
    _gt: 'uuid',
    _gte: 'uuid',
    _in: 'uuid',
    _lt: 'uuid',
    _lte: 'uuid',
    _neq: 'uuid',
    _nin: 'uuid',
  },
};

export const ReturnTypes: Record<string, any> = {
  cached: {
    ttl: 'Int',
    refresh: 'Boolean',
  },
  bigint: `scalar.bigint` as const,
  contribution_votes: {
    contribution: 'contributions',
    contribution_id: 'uuid',
    created_at: 'timestamptz',
    rating: 'String',
    user: 'users',
    user_id: 'uuid',
  },
  contribution_votes_aggregate: {
    aggregate: 'contribution_votes_aggregate_fields',
    nodes: 'contribution_votes',
  },
  contribution_votes_aggregate_fields: {
    count: 'Int',
    max: 'contribution_votes_max_fields',
    min: 'contribution_votes_min_fields',
  },
  contribution_votes_max_fields: {
    contribution_id: 'uuid',
    created_at: 'timestamptz',
    rating: 'String',
    user_id: 'uuid',
  },
  contribution_votes_min_fields: {
    contribution_id: 'uuid',
    created_at: 'timestamptz',
    rating: 'String',
    user_id: 'uuid',
  },
  contribution_votes_mutation_response: {
    affected_rows: 'Int',
    returning: 'contribution_votes',
  },
  contributions: {
    artifact: 'String',
    author: 'users',
    category: 'String',
    contributors: 'contributors',
    contributors_aggregate: 'contributors_aggregate',
    created_at: 'timestamptz',
    created_by: 'uuid',
    date: 'date',
    description: 'String',
    effort: 'String',
    id: 'uuid',
    impact: 'String',
    title: 'String',
    votes: 'contribution_votes',
    votes_aggregate: 'contribution_votes_aggregate',
    weight: 'Int',
  },
  contributions_aggregate: {
    aggregate: 'contributions_aggregate_fields',
    nodes: 'contributions',
  },
  contributions_aggregate_fields: {
    avg: 'contributions_avg_fields',
    count: 'Int',
    max: 'contributions_max_fields',
    min: 'contributions_min_fields',
    stddev: 'contributions_stddev_fields',
    stddev_pop: 'contributions_stddev_pop_fields',
    stddev_samp: 'contributions_stddev_samp_fields',
    sum: 'contributions_sum_fields',
    var_pop: 'contributions_var_pop_fields',
    var_samp: 'contributions_var_samp_fields',
    variance: 'contributions_variance_fields',
  },
  contributions_avg_fields: {
    weight: 'Float',
  },
  contributions_max_fields: {
    artifact: 'String',
    category: 'String',
    created_at: 'timestamptz',
    created_by: 'uuid',
    date: 'date',
    description: 'String',
    effort: 'String',
    id: 'uuid',
    impact: 'String',
    title: 'String',
    weight: 'Int',
  },
  contributions_min_fields: {
    artifact: 'String',
    category: 'String',
    created_at: 'timestamptz',
    created_by: 'uuid',
    date: 'date',
    description: 'String',
    effort: 'String',
    id: 'uuid',
    impact: 'String',
    title: 'String',
    weight: 'Int',
  },
  contributions_mutation_response: {
    affected_rows: 'Int',
    returning: 'contributions',
  },
  contributions_stddev_fields: {
    weight: 'Float',
  },
  contributions_stddev_pop_fields: {
    weight: 'Float',
  },
  contributions_stddev_samp_fields: {
    weight: 'Float',
  },
  contributions_sum_fields: {
    weight: 'Int',
  },
  contributions_var_pop_fields: {
    weight: 'Float',
  },
  contributions_var_samp_fields: {
    weight: 'Float',
  },
  contributions_variance_fields: {
    weight: 'Float',
  },
  contributors: {
    contribution: 'contributions',
    contribution_id: 'uuid',
    contribution_share: 'numeric',
    user: 'users',
    user_id: 'uuid',
  },
  contributors_aggregate: {
    aggregate: 'contributors_aggregate_fields',
    nodes: 'contributors',
  },
  contributors_aggregate_fields: {
    avg: 'contributors_avg_fields',
    count: 'Int',
    max: 'contributors_max_fields',
    min: 'contributors_min_fields',
    stddev: 'contributors_stddev_fields',
    stddev_pop: 'contributors_stddev_pop_fields',
    stddev_samp: 'contributors_stddev_samp_fields',
    sum: 'contributors_sum_fields',
    var_pop: 'contributors_var_pop_fields',
    var_samp: 'contributors_var_samp_fields',
    variance: 'contributors_variance_fields',
  },
  contributors_avg_fields: {
    contribution_share: 'Float',
  },
  contributors_max_fields: {
    contribution_id: 'uuid',
    contribution_share: 'numeric',
    user_id: 'uuid',
  },
  contributors_min_fields: {
    contribution_id: 'uuid',
    contribution_share: 'numeric',
    user_id: 'uuid',
  },
  contributors_mutation_response: {
    affected_rows: 'Int',
    returning: 'contributors',
  },
  contributors_stddev_fields: {
    contribution_share: 'Float',
  },
  contributors_stddev_pop_fields: {
    contribution_share: 'Float',
  },
  contributors_stddev_samp_fields: {
    contribution_share: 'Float',
  },
  contributors_sum_fields: {
    contribution_share: 'numeric',
  },
  contributors_var_pop_fields: {
    contribution_share: 'Float',
  },
  contributors_var_samp_fields: {
    contribution_share: 'Float',
  },
  contributors_variance_fields: {
    contribution_share: 'Float',
  },
  date: `scalar.date` as const,
  jsonb: `scalar.jsonb` as const,
  mutation_root: {
    delete_contribution_votes: 'contribution_votes_mutation_response',
    delete_contribution_votes_by_pk: 'contribution_votes',
    delete_contributions: 'contributions_mutation_response',
    delete_contributions_by_pk: 'contributions',
    delete_contributors: 'contributors_mutation_response',
    delete_contributors_by_pk: 'contributors',
    delete_omni_brand_statuses_enum:
      'omni_brand_statuses_enum_mutation_response',
    delete_omni_brand_statuses_enum_by_pk: 'omni_brand_statuses_enum',
    delete_omni_brand_users: 'omni_brand_users_mutation_response',
    delete_omni_brand_users_by_pk: 'omni_brand_users',
    delete_omni_brands: 'omni_brands_mutation_response',
    delete_omni_brands_by_pk: 'omni_brands',
    delete_omni_collaborator_types_enum:
      'omni_collaborator_types_enum_mutation_response',
    delete_omni_collaborator_types_enum_by_pk: 'omni_collaborator_types_enum',
    delete_omni_directus_files: 'omni_directus_files_mutation_response',
    delete_omni_directus_files_by_pk: 'omni_directus_files',
    delete_omni_fullfillers: 'omni_fullfillers_mutation_response',
    delete_omni_fullfillers_by_pk: 'omni_fullfillers',
    delete_omni_price_currencies: 'omni_price_currencies_mutation_response',
    delete_omni_price_currencies_by_pk: 'omni_price_currencies',
    delete_omni_print_techs_enum: 'omni_print_techs_enum_mutation_response',
    delete_omni_print_techs_enum_by_pk: 'omni_print_techs_enum',
    delete_omni_producer_statuses_enum:
      'omni_producer_statuses_enum_mutation_response',
    delete_omni_producer_statuses_enum_by_pk: 'omni_producer_statuses_enum',
    delete_omni_producers: 'omni_producers_mutation_response',
    delete_omni_producers_by_pk: 'omni_producers',
    delete_omni_product_collaborators:
      'omni_product_collaborators_mutation_response',
    delete_omni_product_collaborators_by_pk: 'omni_product_collaborators',
    delete_omni_product_types_enum: 'omni_product_types_enum_mutation_response',
    delete_omni_product_types_enum_by_pk: 'omni_product_types_enum',
    delete_omni_production_genders_enum:
      'omni_production_genders_enum_mutation_response',
    delete_omni_production_genders_enum_by_pk: 'omni_production_genders_enum',
    delete_omni_production_materials:
      'omni_production_materials_mutation_response',
    delete_omni_production_materials_by_pk: 'omni_production_materials',
    delete_omni_production_materials_producers:
      'omni_production_materials_producers_mutation_response',
    delete_omni_production_materials_producers_by_pk:
      'omni_production_materials_producers',
    delete_omni_production_materials_ratings_enum:
      'omni_production_materials_ratings_enum_mutation_response',
    delete_omni_production_materials_ratings_enum_by_pk:
      'omni_production_materials_ratings_enum',
    delete_omni_production_methods: 'omni_production_methods_mutation_response',
    delete_omni_production_methods_by_pk: 'omni_production_methods',
    delete_omni_production_methods_producers:
      'omni_production_methods_producers_mutation_response',
    delete_omni_production_methods_producers_by_pk:
      'omni_production_methods_producers',
    delete_omni_production_methods_products:
      'omni_production_methods_products_mutation_response',
    delete_omni_production_methods_products_by_pk:
      'omni_production_methods_products',
    delete_omni_production_pallettes_enum:
      'omni_production_pallettes_enum_mutation_response',
    delete_omni_production_pallettes_enum_by_pk:
      'omni_production_pallettes_enum',
    delete_omni_production_styles_enum:
      'omni_production_styles_enum_mutation_response',
    delete_omni_production_styles_enum_by_pk: 'omni_production_styles_enum',
    delete_omni_products: 'omni_products_mutation_response',
    delete_omni_products_by_pk: 'omni_products',
    delete_omni_products_files: 'omni_products_files_mutation_response',
    delete_omni_products_files_by_pk: 'omni_products_files',
    delete_omni_products_production_materials:
      'omni_products_production_materials_mutation_response',
    delete_omni_products_production_materials_by_pk:
      'omni_products_production_materials',
    delete_omni_products_stage_enum:
      'omni_products_stage_enum_mutation_response',
    delete_omni_products_stage_enum_by_pk: 'omni_products_stage_enum',
    delete_omni_sale_types_enum: 'omni_sale_types_enum_mutation_response',
    delete_omni_sale_types_enum_by_pk: 'omni_sale_types_enum',
    delete_omni_timezones_enum: 'omni_timezones_enum_mutation_response',
    delete_omni_timezones_enum_by_pk: 'omni_timezones_enum',
    delete_omni_user_skill_types_enum:
      'omni_user_skill_types_enum_mutation_response',
    delete_omni_user_skill_types_enum_by_pk: 'omni_user_skill_types_enum',
    delete_omni_user_skills: 'omni_user_skills_mutation_response',
    delete_omni_user_skills_by_pk: 'omni_user_skills',
    delete_omni_user_statuses_enum: 'omni_user_statuses_enum_mutation_response',
    delete_omni_user_statuses_enum_by_pk: 'omni_user_statuses_enum',
    delete_omni_users: 'omni_users_mutation_response',
    delete_omni_users_by_pk: 'omni_users',
    delete_robot_merkle_claims: 'robot_merkle_claims_mutation_response',
    delete_robot_merkle_claims_by_pk: 'robot_merkle_claims',
    delete_robot_merkle_roots: 'robot_merkle_roots_mutation_response',
    delete_robot_merkle_roots_by_pk: 'robot_merkle_roots',
    delete_robot_order: 'robot_order_mutation_response',
    delete_robot_order_by_pk: 'robot_order',
    delete_robot_product: 'robot_product_mutation_response',
    delete_robot_product_by_pk: 'robot_product',
    delete_robot_product_designer: 'robot_product_designer_mutation_response',
    delete_robot_product_designer_by_pk: 'robot_product_designer',
    delete_shop_api_users: 'shop_api_users_mutation_response',
    delete_shop_api_users_by_pk: 'shop_api_users',
    delete_shop_product_locks: 'shop_product_locks_mutation_response',
    delete_shop_product_locks_by_pk: 'shop_product_locks',
    delete_users: 'users_mutation_response',
    delete_users_by_pk: 'users',
    insert_contribution_votes: 'contribution_votes_mutation_response',
    insert_contribution_votes_one: 'contribution_votes',
    insert_contributions: 'contributions_mutation_response',
    insert_contributions_one: 'contributions',
    insert_contributors: 'contributors_mutation_response',
    insert_contributors_one: 'contributors',
    insert_omni_brand_statuses_enum:
      'omni_brand_statuses_enum_mutation_response',
    insert_omni_brand_statuses_enum_one: 'omni_brand_statuses_enum',
    insert_omni_brand_users: 'omni_brand_users_mutation_response',
    insert_omni_brand_users_one: 'omni_brand_users',
    insert_omni_brands: 'omni_brands_mutation_response',
    insert_omni_brands_one: 'omni_brands',
    insert_omni_collaborator_types_enum:
      'omni_collaborator_types_enum_mutation_response',
    insert_omni_collaborator_types_enum_one: 'omni_collaborator_types_enum',
    insert_omni_directus_files: 'omni_directus_files_mutation_response',
    insert_omni_directus_files_one: 'omni_directus_files',
    insert_omni_fullfillers: 'omni_fullfillers_mutation_response',
    insert_omni_fullfillers_one: 'omni_fullfillers',
    insert_omni_price_currencies: 'omni_price_currencies_mutation_response',
    insert_omni_price_currencies_one: 'omni_price_currencies',
    insert_omni_print_techs_enum: 'omni_print_techs_enum_mutation_response',
    insert_omni_print_techs_enum_one: 'omni_print_techs_enum',
    insert_omni_producer_statuses_enum:
      'omni_producer_statuses_enum_mutation_response',
    insert_omni_producer_statuses_enum_one: 'omni_producer_statuses_enum',
    insert_omni_producers: 'omni_producers_mutation_response',
    insert_omni_producers_one: 'omni_producers',
    insert_omni_product_collaborators:
      'omni_product_collaborators_mutation_response',
    insert_omni_product_collaborators_one: 'omni_product_collaborators',
    insert_omni_product_types_enum: 'omni_product_types_enum_mutation_response',
    insert_omni_product_types_enum_one: 'omni_product_types_enum',
    insert_omni_production_genders_enum:
      'omni_production_genders_enum_mutation_response',
    insert_omni_production_genders_enum_one: 'omni_production_genders_enum',
    insert_omni_production_materials:
      'omni_production_materials_mutation_response',
    insert_omni_production_materials_one: 'omni_production_materials',
    insert_omni_production_materials_producers:
      'omni_production_materials_producers_mutation_response',
    insert_omni_production_materials_producers_one:
      'omni_production_materials_producers',
    insert_omni_production_materials_ratings_enum:
      'omni_production_materials_ratings_enum_mutation_response',
    insert_omni_production_materials_ratings_enum_one:
      'omni_production_materials_ratings_enum',
    insert_omni_production_methods: 'omni_production_methods_mutation_response',
    insert_omni_production_methods_one: 'omni_production_methods',
    insert_omni_production_methods_producers:
      'omni_production_methods_producers_mutation_response',
    insert_omni_production_methods_producers_one:
      'omni_production_methods_producers',
    insert_omni_production_methods_products:
      'omni_production_methods_products_mutation_response',
    insert_omni_production_methods_products_one:
      'omni_production_methods_products',
    insert_omni_production_pallettes_enum:
      'omni_production_pallettes_enum_mutation_response',
    insert_omni_production_pallettes_enum_one: 'omni_production_pallettes_enum',
    insert_omni_production_styles_enum:
      'omni_production_styles_enum_mutation_response',
    insert_omni_production_styles_enum_one: 'omni_production_styles_enum',
    insert_omni_products: 'omni_products_mutation_response',
    insert_omni_products_files: 'omni_products_files_mutation_response',
    insert_omni_products_files_one: 'omni_products_files',
    insert_omni_products_one: 'omni_products',
    insert_omni_products_production_materials:
      'omni_products_production_materials_mutation_response',
    insert_omni_products_production_materials_one:
      'omni_products_production_materials',
    insert_omni_products_stage_enum:
      'omni_products_stage_enum_mutation_response',
    insert_omni_products_stage_enum_one: 'omni_products_stage_enum',
    insert_omni_sale_types_enum: 'omni_sale_types_enum_mutation_response',
    insert_omni_sale_types_enum_one: 'omni_sale_types_enum',
    insert_omni_timezones_enum: 'omni_timezones_enum_mutation_response',
    insert_omni_timezones_enum_one: 'omni_timezones_enum',
    insert_omni_user_skill_types_enum:
      'omni_user_skill_types_enum_mutation_response',
    insert_omni_user_skill_types_enum_one: 'omni_user_skill_types_enum',
    insert_omni_user_skills: 'omni_user_skills_mutation_response',
    insert_omni_user_skills_one: 'omni_user_skills',
    insert_omni_user_statuses_enum: 'omni_user_statuses_enum_mutation_response',
    insert_omni_user_statuses_enum_one: 'omni_user_statuses_enum',
    insert_omni_users: 'omni_users_mutation_response',
    insert_omni_users_one: 'omni_users',
    insert_robot_merkle_claims: 'robot_merkle_claims_mutation_response',
    insert_robot_merkle_claims_one: 'robot_merkle_claims',
    insert_robot_merkle_roots: 'robot_merkle_roots_mutation_response',
    insert_robot_merkle_roots_one: 'robot_merkle_roots',
    insert_robot_order: 'robot_order_mutation_response',
    insert_robot_order_one: 'robot_order',
    insert_robot_product: 'robot_product_mutation_response',
    insert_robot_product_designer: 'robot_product_designer_mutation_response',
    insert_robot_product_designer_one: 'robot_product_designer',
    insert_robot_product_one: 'robot_product',
    insert_shop_api_users: 'shop_api_users_mutation_response',
    insert_shop_api_users_one: 'shop_api_users',
    insert_shop_product_locks: 'shop_product_locks_mutation_response',
    insert_shop_product_locks_one: 'shop_product_locks',
    insert_users: 'users_mutation_response',
    insert_users_one: 'users',
    update_contribution_votes: 'contribution_votes_mutation_response',
    update_contribution_votes_by_pk: 'contribution_votes',
    update_contribution_votes_many: 'contribution_votes_mutation_response',
    update_contributions: 'contributions_mutation_response',
    update_contributions_by_pk: 'contributions',
    update_contributions_many: 'contributions_mutation_response',
    update_contributors: 'contributors_mutation_response',
    update_contributors_by_pk: 'contributors',
    update_contributors_many: 'contributors_mutation_response',
    update_omni_brand_statuses_enum:
      'omni_brand_statuses_enum_mutation_response',
    update_omni_brand_statuses_enum_by_pk: 'omni_brand_statuses_enum',
    update_omni_brand_statuses_enum_many:
      'omni_brand_statuses_enum_mutation_response',
    update_omni_brand_users: 'omni_brand_users_mutation_response',
    update_omni_brand_users_by_pk: 'omni_brand_users',
    update_omni_brand_users_many: 'omni_brand_users_mutation_response',
    update_omni_brands: 'omni_brands_mutation_response',
    update_omni_brands_by_pk: 'omni_brands',
    update_omni_brands_many: 'omni_brands_mutation_response',
    update_omni_collaborator_types_enum:
      'omni_collaborator_types_enum_mutation_response',
    update_omni_collaborator_types_enum_by_pk: 'omni_collaborator_types_enum',
    update_omni_collaborator_types_enum_many:
      'omni_collaborator_types_enum_mutation_response',
    update_omni_directus_files: 'omni_directus_files_mutation_response',
    update_omni_directus_files_by_pk: 'omni_directus_files',
    update_omni_directus_files_many: 'omni_directus_files_mutation_response',
    update_omni_fullfillers: 'omni_fullfillers_mutation_response',
    update_omni_fullfillers_by_pk: 'omni_fullfillers',
    update_omni_fullfillers_many: 'omni_fullfillers_mutation_response',
    update_omni_price_currencies: 'omni_price_currencies_mutation_response',
    update_omni_price_currencies_by_pk: 'omni_price_currencies',
    update_omni_price_currencies_many:
      'omni_price_currencies_mutation_response',
    update_omni_print_techs_enum: 'omni_print_techs_enum_mutation_response',
    update_omni_print_techs_enum_by_pk: 'omni_print_techs_enum',
    update_omni_print_techs_enum_many:
      'omni_print_techs_enum_mutation_response',
    update_omni_producer_statuses_enum:
      'omni_producer_statuses_enum_mutation_response',
    update_omni_producer_statuses_enum_by_pk: 'omni_producer_statuses_enum',
    update_omni_producer_statuses_enum_many:
      'omni_producer_statuses_enum_mutation_response',
    update_omni_producers: 'omni_producers_mutation_response',
    update_omni_producers_by_pk: 'omni_producers',
    update_omni_producers_many: 'omni_producers_mutation_response',
    update_omni_product_collaborators:
      'omni_product_collaborators_mutation_response',
    update_omni_product_collaborators_by_pk: 'omni_product_collaborators',
    update_omni_product_collaborators_many:
      'omni_product_collaborators_mutation_response',
    update_omni_product_types_enum: 'omni_product_types_enum_mutation_response',
    update_omni_product_types_enum_by_pk: 'omni_product_types_enum',
    update_omni_product_types_enum_many:
      'omni_product_types_enum_mutation_response',
    update_omni_production_genders_enum:
      'omni_production_genders_enum_mutation_response',
    update_omni_production_genders_enum_by_pk: 'omni_production_genders_enum',
    update_omni_production_genders_enum_many:
      'omni_production_genders_enum_mutation_response',
    update_omni_production_materials:
      'omni_production_materials_mutation_response',
    update_omni_production_materials_by_pk: 'omni_production_materials',
    update_omni_production_materials_many:
      'omni_production_materials_mutation_response',
    update_omni_production_materials_producers:
      'omni_production_materials_producers_mutation_response',
    update_omni_production_materials_producers_by_pk:
      'omni_production_materials_producers',
    update_omni_production_materials_producers_many:
      'omni_production_materials_producers_mutation_response',
    update_omni_production_materials_ratings_enum:
      'omni_production_materials_ratings_enum_mutation_response',
    update_omni_production_materials_ratings_enum_by_pk:
      'omni_production_materials_ratings_enum',
    update_omni_production_materials_ratings_enum_many:
      'omni_production_materials_ratings_enum_mutation_response',
    update_omni_production_methods: 'omni_production_methods_mutation_response',
    update_omni_production_methods_by_pk: 'omni_production_methods',
    update_omni_production_methods_many:
      'omni_production_methods_mutation_response',
    update_omni_production_methods_producers:
      'omni_production_methods_producers_mutation_response',
    update_omni_production_methods_producers_by_pk:
      'omni_production_methods_producers',
    update_omni_production_methods_producers_many:
      'omni_production_methods_producers_mutation_response',
    update_omni_production_methods_products:
      'omni_production_methods_products_mutation_response',
    update_omni_production_methods_products_by_pk:
      'omni_production_methods_products',
    update_omni_production_methods_products_many:
      'omni_production_methods_products_mutation_response',
    update_omni_production_pallettes_enum:
      'omni_production_pallettes_enum_mutation_response',
    update_omni_production_pallettes_enum_by_pk:
      'omni_production_pallettes_enum',
    update_omni_production_pallettes_enum_many:
      'omni_production_pallettes_enum_mutation_response',
    update_omni_production_styles_enum:
      'omni_production_styles_enum_mutation_response',
    update_omni_production_styles_enum_by_pk: 'omni_production_styles_enum',
    update_omni_production_styles_enum_many:
      'omni_production_styles_enum_mutation_response',
    update_omni_products: 'omni_products_mutation_response',
    update_omni_products_by_pk: 'omni_products',
    update_omni_products_files: 'omni_products_files_mutation_response',
    update_omni_products_files_by_pk: 'omni_products_files',
    update_omni_products_files_many: 'omni_products_files_mutation_response',
    update_omni_products_many: 'omni_products_mutation_response',
    update_omni_products_production_materials:
      'omni_products_production_materials_mutation_response',
    update_omni_products_production_materials_by_pk:
      'omni_products_production_materials',
    update_omni_products_production_materials_many:
      'omni_products_production_materials_mutation_response',
    update_omni_products_stage_enum:
      'omni_products_stage_enum_mutation_response',
    update_omni_products_stage_enum_by_pk: 'omni_products_stage_enum',
    update_omni_products_stage_enum_many:
      'omni_products_stage_enum_mutation_response',
    update_omni_sale_types_enum: 'omni_sale_types_enum_mutation_response',
    update_omni_sale_types_enum_by_pk: 'omni_sale_types_enum',
    update_omni_sale_types_enum_many: 'omni_sale_types_enum_mutation_response',
    update_omni_timezones_enum: 'omni_timezones_enum_mutation_response',
    update_omni_timezones_enum_by_pk: 'omni_timezones_enum',
    update_omni_timezones_enum_many: 'omni_timezones_enum_mutation_response',
    update_omni_user_skill_types_enum:
      'omni_user_skill_types_enum_mutation_response',
    update_omni_user_skill_types_enum_by_pk: 'omni_user_skill_types_enum',
    update_omni_user_skill_types_enum_many:
      'omni_user_skill_types_enum_mutation_response',
    update_omni_user_skills: 'omni_user_skills_mutation_response',
    update_omni_user_skills_by_pk: 'omni_user_skills',
    update_omni_user_skills_many: 'omni_user_skills_mutation_response',
    update_omni_user_statuses_enum: 'omni_user_statuses_enum_mutation_response',
    update_omni_user_statuses_enum_by_pk: 'omni_user_statuses_enum',
    update_omni_user_statuses_enum_many:
      'omni_user_statuses_enum_mutation_response',
    update_omni_users: 'omni_users_mutation_response',
    update_omni_users_by_pk: 'omni_users',
    update_omni_users_many: 'omni_users_mutation_response',
    update_robot_merkle_claims: 'robot_merkle_claims_mutation_response',
    update_robot_merkle_claims_by_pk: 'robot_merkle_claims',
    update_robot_merkle_claims_many: 'robot_merkle_claims_mutation_response',
    update_robot_merkle_roots: 'robot_merkle_roots_mutation_response',
    update_robot_merkle_roots_by_pk: 'robot_merkle_roots',
    update_robot_merkle_roots_many: 'robot_merkle_roots_mutation_response',
    update_robot_order: 'robot_order_mutation_response',
    update_robot_order_by_pk: 'robot_order',
    update_robot_order_many: 'robot_order_mutation_response',
    update_robot_product: 'robot_product_mutation_response',
    update_robot_product_by_pk: 'robot_product',
    update_robot_product_designer: 'robot_product_designer_mutation_response',
    update_robot_product_designer_by_pk: 'robot_product_designer',
    update_robot_product_designer_many:
      'robot_product_designer_mutation_response',
    update_robot_product_many: 'robot_product_mutation_response',
    update_shop_api_users: 'shop_api_users_mutation_response',
    update_shop_api_users_by_pk: 'shop_api_users',
    update_shop_api_users_many: 'shop_api_users_mutation_response',
    update_shop_product_locks: 'shop_product_locks_mutation_response',
    update_shop_product_locks_by_pk: 'shop_product_locks',
    update_shop_product_locks_many: 'shop_product_locks_mutation_response',
    update_users: 'users_mutation_response',
    update_users_by_pk: 'users',
    update_users_many: 'users_mutation_response',
  },
  numeric: `scalar.numeric` as const,
  omni_brand_statuses_enum: {
    brands: 'omni_brands',
    brands_aggregate: 'omni_brands_aggregate',
    description: 'String',
    value: 'String',
  },
  omni_brand_statuses_enum_aggregate: {
    aggregate: 'omni_brand_statuses_enum_aggregate_fields',
    nodes: 'omni_brand_statuses_enum',
  },
  omni_brand_statuses_enum_aggregate_fields: {
    count: 'Int',
    max: 'omni_brand_statuses_enum_max_fields',
    min: 'omni_brand_statuses_enum_min_fields',
  },
  omni_brand_statuses_enum_max_fields: {
    description: 'String',
    value: 'String',
  },
  omni_brand_statuses_enum_min_fields: {
    description: 'String',
    value: 'String',
  },
  omni_brand_statuses_enum_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_brand_statuses_enum',
  },
  omni_brand_users: {
    brand: 'uuid',
    brandByBrand: 'omni_brands',
    collaborator: 'uuid',
    id: 'uuid',
    user: 'omni_users',
  },
  omni_brand_users_aggregate: {
    aggregate: 'omni_brand_users_aggregate_fields',
    nodes: 'omni_brand_users',
  },
  omni_brand_users_aggregate_fields: {
    count: 'Int',
    max: 'omni_brand_users_max_fields',
    min: 'omni_brand_users_min_fields',
  },
  omni_brand_users_max_fields: {
    brand: 'uuid',
    collaborator: 'uuid',
    id: 'uuid',
  },
  omni_brand_users_min_fields: {
    brand: 'uuid',
    collaborator: 'uuid',
    id: 'uuid',
  },
  omni_brand_users_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_brand_users',
  },
  omni_brands: {
    brand_statuses_enum: 'omni_brand_statuses_enum',
    brand_users: 'omni_brand_users',
    brand_users_aggregate: 'omni_brand_users_aggregate',
    created_at: 'timestamptz',
    description: 'String',
    discord_url: 'String',
    eth_address: 'String',
    id: 'uuid',
    logo: 'String',
    name: 'String',
    products: 'omni_products',
    products_aggregate: 'omni_products_aggregate',
    status: 'omni_brand_statuses_enum_enum',
    twitter_url: 'String',
    updated_at: 'timestamptz',
    website_url: 'String',
  },
  omni_brands_aggregate: {
    aggregate: 'omni_brands_aggregate_fields',
    nodes: 'omni_brands',
  },
  omni_brands_aggregate_fields: {
    count: 'Int',
    max: 'omni_brands_max_fields',
    min: 'omni_brands_min_fields',
  },
  omni_brands_max_fields: {
    created_at: 'timestamptz',
    description: 'String',
    discord_url: 'String',
    eth_address: 'String',
    id: 'uuid',
    logo: 'String',
    name: 'String',
    twitter_url: 'String',
    updated_at: 'timestamptz',
    website_url: 'String',
  },
  omni_brands_min_fields: {
    created_at: 'timestamptz',
    description: 'String',
    discord_url: 'String',
    eth_address: 'String',
    id: 'uuid',
    logo: 'String',
    name: 'String',
    twitter_url: 'String',
    updated_at: 'timestamptz',
    website_url: 'String',
  },
  omni_brands_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_brands',
  },
  omni_collaborator_types_enum: {
    description: 'String',
    product_collaborators: 'omni_product_collaborators',
    product_collaborators_aggregate: 'omni_product_collaborators_aggregate',
    value: 'String',
  },
  omni_collaborator_types_enum_aggregate: {
    aggregate: 'omni_collaborator_types_enum_aggregate_fields',
    nodes: 'omni_collaborator_types_enum',
  },
  omni_collaborator_types_enum_aggregate_fields: {
    count: 'Int',
    max: 'omni_collaborator_types_enum_max_fields',
    min: 'omni_collaborator_types_enum_min_fields',
  },
  omni_collaborator_types_enum_max_fields: {
    description: 'String',
    value: 'String',
  },
  omni_collaborator_types_enum_min_fields: {
    description: 'String',
    value: 'String',
  },
  omni_collaborator_types_enum_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_collaborator_types_enum',
  },
  omni_directus_files: {
    id: 'Int',
  },
  omni_directus_files_aggregate: {
    aggregate: 'omni_directus_files_aggregate_fields',
    nodes: 'omni_directus_files',
  },
  omni_directus_files_aggregate_fields: {
    avg: 'omni_directus_files_avg_fields',
    count: 'Int',
    max: 'omni_directus_files_max_fields',
    min: 'omni_directus_files_min_fields',
    stddev: 'omni_directus_files_stddev_fields',
    stddev_pop: 'omni_directus_files_stddev_pop_fields',
    stddev_samp: 'omni_directus_files_stddev_samp_fields',
    sum: 'omni_directus_files_sum_fields',
    var_pop: 'omni_directus_files_var_pop_fields',
    var_samp: 'omni_directus_files_var_samp_fields',
    variance: 'omni_directus_files_variance_fields',
  },
  omni_directus_files_avg_fields: {
    id: 'Float',
  },
  omni_directus_files_max_fields: {
    id: 'Int',
  },
  omni_directus_files_min_fields: {
    id: 'Int',
  },
  omni_directus_files_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_directus_files',
  },
  omni_directus_files_stddev_fields: {
    id: 'Float',
  },
  omni_directus_files_stddev_pop_fields: {
    id: 'Float',
  },
  omni_directus_files_stddev_samp_fields: {
    id: 'Float',
  },
  omni_directus_files_sum_fields: {
    id: 'Int',
  },
  omni_directus_files_var_pop_fields: {
    id: 'Float',
  },
  omni_directus_files_var_samp_fields: {
    id: 'Float',
  },
  omni_directus_files_variance_fields: {
    id: 'Float',
  },
  omni_fullfillers: {
    address: 'String',
    created_at: 'timestamptz',
    email: 'String',
    eth_address: 'String',
    id: 'uuid',
    name: 'String',
    products: 'omni_products',
    products_aggregate: 'omni_products_aggregate',
    updated_at: 'timestamptz',
    website_url: 'String',
  },
  omni_fullfillers_aggregate: {
    aggregate: 'omni_fullfillers_aggregate_fields',
    nodes: 'omni_fullfillers',
  },
  omni_fullfillers_aggregate_fields: {
    count: 'Int',
    max: 'omni_fullfillers_max_fields',
    min: 'omni_fullfillers_min_fields',
  },
  omni_fullfillers_max_fields: {
    address: 'String',
    created_at: 'timestamptz',
    email: 'String',
    eth_address: 'String',
    id: 'uuid',
    name: 'String',
    updated_at: 'timestamptz',
    website_url: 'String',
  },
  omni_fullfillers_min_fields: {
    address: 'String',
    created_at: 'timestamptz',
    email: 'String',
    eth_address: 'String',
    id: 'uuid',
    name: 'String',
    updated_at: 'timestamptz',
    website_url: 'String',
  },
  omni_fullfillers_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_fullfillers',
  },
  omni_price_currencies: {
    currency: 'String',
    id: 'uuid',
    price: 'numeric',
  },
  omni_price_currencies_aggregate: {
    aggregate: 'omni_price_currencies_aggregate_fields',
    nodes: 'omni_price_currencies',
  },
  omni_price_currencies_aggregate_fields: {
    avg: 'omni_price_currencies_avg_fields',
    count: 'Int',
    max: 'omni_price_currencies_max_fields',
    min: 'omni_price_currencies_min_fields',
    stddev: 'omni_price_currencies_stddev_fields',
    stddev_pop: 'omni_price_currencies_stddev_pop_fields',
    stddev_samp: 'omni_price_currencies_stddev_samp_fields',
    sum: 'omni_price_currencies_sum_fields',
    var_pop: 'omni_price_currencies_var_pop_fields',
    var_samp: 'omni_price_currencies_var_samp_fields',
    variance: 'omni_price_currencies_variance_fields',
  },
  omni_price_currencies_avg_fields: {
    price: 'Float',
  },
  omni_price_currencies_max_fields: {
    currency: 'String',
    id: 'uuid',
    price: 'numeric',
  },
  omni_price_currencies_min_fields: {
    currency: 'String',
    id: 'uuid',
    price: 'numeric',
  },
  omni_price_currencies_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_price_currencies',
  },
  omni_price_currencies_stddev_fields: {
    price: 'Float',
  },
  omni_price_currencies_stddev_pop_fields: {
    price: 'Float',
  },
  omni_price_currencies_stddev_samp_fields: {
    price: 'Float',
  },
  omni_price_currencies_sum_fields: {
    price: 'numeric',
  },
  omni_price_currencies_var_pop_fields: {
    price: 'Float',
  },
  omni_price_currencies_var_samp_fields: {
    price: 'Float',
  },
  omni_price_currencies_variance_fields: {
    price: 'Float',
  },
  omni_print_techs_enum: {
    description: 'String',
    production_materials: 'omni_production_materials',
    production_materials_aggregate: 'omni_production_materials_aggregate',
    value: 'String',
  },
  omni_print_techs_enum_aggregate: {
    aggregate: 'omni_print_techs_enum_aggregate_fields',
    nodes: 'omni_print_techs_enum',
  },
  omni_print_techs_enum_aggregate_fields: {
    count: 'Int',
    max: 'omni_print_techs_enum_max_fields',
    min: 'omni_print_techs_enum_min_fields',
  },
  omni_print_techs_enum_max_fields: {
    description: 'String',
    value: 'String',
  },
  omni_print_techs_enum_min_fields: {
    description: 'String',
    value: 'String',
  },
  omni_print_techs_enum_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_print_techs_enum',
  },
  omni_producer_statuses_enum: {
    description: 'String',
    producers: 'omni_producers',
    producers_aggregate: 'omni_producers_aggregate',
    value: 'String',
  },
  omni_producer_statuses_enum_aggregate: {
    aggregate: 'omni_producer_statuses_enum_aggregate_fields',
    nodes: 'omni_producer_statuses_enum',
  },
  omni_producer_statuses_enum_aggregate_fields: {
    count: 'Int',
    max: 'omni_producer_statuses_enum_max_fields',
    min: 'omni_producer_statuses_enum_min_fields',
  },
  omni_producer_statuses_enum_max_fields: {
    description: 'String',
    value: 'String',
  },
  omni_producer_statuses_enum_min_fields: {
    description: 'String',
    value: 'String',
  },
  omni_producer_statuses_enum_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_producer_statuses_enum',
  },
  omni_producers: {
    address: 'String',
    created_at: 'timestamptz',
    email: 'String',
    eth_address: 'String',
    id: 'uuid',
    name: 'String',
    producer_statuses_enum: 'omni_producer_statuses_enum',
    production_materials_producers: 'omni_production_materials_producers',
    production_materials_producers_aggregate:
      'omni_production_materials_producers_aggregate',
    production_methods_producers: 'omni_production_methods_producers',
    production_methods_producers_aggregate:
      'omni_production_methods_producers_aggregate',
    productsByProducer: 'omni_products',
    productsByProducer_aggregate: 'omni_products_aggregate',
    status: 'omni_producer_statuses_enum_enum',
    updated_at: 'timestamptz',
  },
  omni_producers_aggregate: {
    aggregate: 'omni_producers_aggregate_fields',
    nodes: 'omni_producers',
  },
  omni_producers_aggregate_fields: {
    count: 'Int',
    max: 'omni_producers_max_fields',
    min: 'omni_producers_min_fields',
  },
  omni_producers_max_fields: {
    address: 'String',
    created_at: 'timestamptz',
    email: 'String',
    eth_address: 'String',
    id: 'uuid',
    name: 'String',
    updated_at: 'timestamptz',
  },
  omni_producers_min_fields: {
    address: 'String',
    created_at: 'timestamptz',
    email: 'String',
    eth_address: 'String',
    id: 'uuid',
    name: 'String',
    updated_at: 'timestamptz',
  },
  omni_producers_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_producers',
  },
  omni_product_collaborators: {
    collaboration_share: 'numeric',
    collaborator: 'uuid',
    collaborator_types_enum: 'omni_collaborator_types_enum',
    id: 'uuid',
    product: 'uuid',
    productByProduct: 'omni_products',
    type: 'omni_collaborator_types_enum_enum',
    user: 'omni_users',
  },
  omni_product_collaborators_aggregate: {
    aggregate: 'omni_product_collaborators_aggregate_fields',
    nodes: 'omni_product_collaborators',
  },
  omni_product_collaborators_aggregate_fields: {
    avg: 'omni_product_collaborators_avg_fields',
    count: 'Int',
    max: 'omni_product_collaborators_max_fields',
    min: 'omni_product_collaborators_min_fields',
    stddev: 'omni_product_collaborators_stddev_fields',
    stddev_pop: 'omni_product_collaborators_stddev_pop_fields',
    stddev_samp: 'omni_product_collaborators_stddev_samp_fields',
    sum: 'omni_product_collaborators_sum_fields',
    var_pop: 'omni_product_collaborators_var_pop_fields',
    var_samp: 'omni_product_collaborators_var_samp_fields',
    variance: 'omni_product_collaborators_variance_fields',
  },
  omni_product_collaborators_avg_fields: {
    collaboration_share: 'Float',
  },
  omni_product_collaborators_max_fields: {
    collaboration_share: 'numeric',
    collaborator: 'uuid',
    id: 'uuid',
    product: 'uuid',
  },
  omni_product_collaborators_min_fields: {
    collaboration_share: 'numeric',
    collaborator: 'uuid',
    id: 'uuid',
    product: 'uuid',
  },
  omni_product_collaborators_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_product_collaborators',
  },
  omni_product_collaborators_stddev_fields: {
    collaboration_share: 'Float',
  },
  omni_product_collaborators_stddev_pop_fields: {
    collaboration_share: 'Float',
  },
  omni_product_collaborators_stddev_samp_fields: {
    collaboration_share: 'Float',
  },
  omni_product_collaborators_sum_fields: {
    collaboration_share: 'numeric',
  },
  omni_product_collaborators_var_pop_fields: {
    collaboration_share: 'Float',
  },
  omni_product_collaborators_var_samp_fields: {
    collaboration_share: 'Float',
  },
  omni_product_collaborators_variance_fields: {
    collaboration_share: 'Float',
  },
  omni_product_types_enum: {
    description: 'String',
    production_materials: 'omni_production_materials',
    production_materials_aggregate: 'omni_production_materials_aggregate',
    value: 'String',
  },
  omni_product_types_enum_aggregate: {
    aggregate: 'omni_product_types_enum_aggregate_fields',
    nodes: 'omni_product_types_enum',
  },
  omni_product_types_enum_aggregate_fields: {
    count: 'Int',
    max: 'omni_product_types_enum_max_fields',
    min: 'omni_product_types_enum_min_fields',
  },
  omni_product_types_enum_max_fields: {
    description: 'String',
    value: 'String',
  },
  omni_product_types_enum_min_fields: {
    description: 'String',
    value: 'String',
  },
  omni_product_types_enum_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_product_types_enum',
  },
  omni_production_genders_enum: {
    description: 'String',
    production_materials: 'omni_production_materials',
    production_materials_aggregate: 'omni_production_materials_aggregate',
    value: 'String',
  },
  omni_production_genders_enum_aggregate: {
    aggregate: 'omni_production_genders_enum_aggregate_fields',
    nodes: 'omni_production_genders_enum',
  },
  omni_production_genders_enum_aggregate_fields: {
    count: 'Int',
    max: 'omni_production_genders_enum_max_fields',
    min: 'omni_production_genders_enum_min_fields',
  },
  omni_production_genders_enum_max_fields: {
    description: 'String',
    value: 'String',
  },
  omni_production_genders_enum_min_fields: {
    description: 'String',
    value: 'String',
  },
  omni_production_genders_enum_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_production_genders_enum',
  },
  omni_production_materials: {
    base_price: 'numeric',
    composition: 'String',
    created_at: 'timestamptz',
    description: 'String',
    gender: 'omni_production_genders_enum_enum',
    id: 'uuid',
    name: 'String',
    neck_tag: 'Boolean',
    pallette: 'omni_production_pallettes_enum_enum',
    print_tech: 'omni_print_techs_enum_enum',
    print_techs_enum: 'omni_print_techs_enum',
    product_types_enum: 'omni_product_types_enum',
    production_genders_enum: 'omni_production_genders_enum',
    production_materials_producers: 'omni_production_materials_producers',
    production_materials_producers_aggregate:
      'omni_production_materials_producers_aggregate',
    production_materials_ratings_enum: 'omni_production_materials_ratings_enum',
    production_pallettes_enum: 'omni_production_pallettes_enum',
    production_styles_enum: 'omni_production_styles_enum',
    rating: 'omni_production_materials_ratings_enum_enum',
    size_guide: 'String',
    style: 'omni_production_styles_enum_enum',
    style_number: 'String',
    type: 'String',
    updated_at: 'timestamptz',
    used_in_products: 'omni_products_production_materials',
    used_in_products_aggregate: 'omni_products_production_materials_aggregate',
  },
  omni_production_materials_aggregate: {
    aggregate: 'omni_production_materials_aggregate_fields',
    nodes: 'omni_production_materials',
  },
  omni_production_materials_aggregate_fields: {
    avg: 'omni_production_materials_avg_fields',
    count: 'Int',
    max: 'omni_production_materials_max_fields',
    min: 'omni_production_materials_min_fields',
    stddev: 'omni_production_materials_stddev_fields',
    stddev_pop: 'omni_production_materials_stddev_pop_fields',
    stddev_samp: 'omni_production_materials_stddev_samp_fields',
    sum: 'omni_production_materials_sum_fields',
    var_pop: 'omni_production_materials_var_pop_fields',
    var_samp: 'omni_production_materials_var_samp_fields',
    variance: 'omni_production_materials_variance_fields',
  },
  omni_production_materials_avg_fields: {
    base_price: 'Float',
  },
  omni_production_materials_max_fields: {
    base_price: 'numeric',
    composition: 'String',
    created_at: 'timestamptz',
    description: 'String',
    id: 'uuid',
    name: 'String',
    size_guide: 'String',
    style_number: 'String',
    type: 'String',
    updated_at: 'timestamptz',
  },
  omni_production_materials_min_fields: {
    base_price: 'numeric',
    composition: 'String',
    created_at: 'timestamptz',
    description: 'String',
    id: 'uuid',
    name: 'String',
    size_guide: 'String',
    style_number: 'String',
    type: 'String',
    updated_at: 'timestamptz',
  },
  omni_production_materials_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_production_materials',
  },
  omni_production_materials_producers: {
    id: 'uuid',
    producer: 'uuid',
    producerByProducer: 'omni_producers',
    productionMaterialByProductionMaterial: 'omni_production_materials',
    production_material: 'uuid',
  },
  omni_production_materials_producers_aggregate: {
    aggregate: 'omni_production_materials_producers_aggregate_fields',
    nodes: 'omni_production_materials_producers',
  },
  omni_production_materials_producers_aggregate_fields: {
    count: 'Int',
    max: 'omni_production_materials_producers_max_fields',
    min: 'omni_production_materials_producers_min_fields',
  },
  omni_production_materials_producers_max_fields: {
    id: 'uuid',
    producer: 'uuid',
    production_material: 'uuid',
  },
  omni_production_materials_producers_min_fields: {
    id: 'uuid',
    producer: 'uuid',
    production_material: 'uuid',
  },
  omni_production_materials_producers_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_production_materials_producers',
  },
  omni_production_materials_ratings_enum: {
    description: 'String',
    production_materials: 'omni_production_materials',
    production_materials_aggregate: 'omni_production_materials_aggregate',
    value: 'String',
  },
  omni_production_materials_ratings_enum_aggregate: {
    aggregate: 'omni_production_materials_ratings_enum_aggregate_fields',
    nodes: 'omni_production_materials_ratings_enum',
  },
  omni_production_materials_ratings_enum_aggregate_fields: {
    count: 'Int',
    max: 'omni_production_materials_ratings_enum_max_fields',
    min: 'omni_production_materials_ratings_enum_min_fields',
  },
  omni_production_materials_ratings_enum_max_fields: {
    description: 'String',
    value: 'String',
  },
  omni_production_materials_ratings_enum_min_fields: {
    description: 'String',
    value: 'String',
  },
  omni_production_materials_ratings_enum_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_production_materials_ratings_enum',
  },
  omni_production_materials_stddev_fields: {
    base_price: 'Float',
  },
  omni_production_materials_stddev_pop_fields: {
    base_price: 'Float',
  },
  omni_production_materials_stddev_samp_fields: {
    base_price: 'Float',
  },
  omni_production_materials_sum_fields: {
    base_price: 'numeric',
  },
  omni_production_materials_var_pop_fields: {
    base_price: 'Float',
  },
  omni_production_materials_var_samp_fields: {
    base_price: 'Float',
  },
  omni_production_materials_variance_fields: {
    base_price: 'Float',
  },
  omni_production_methods: {
    created_at: 'timestamptz',
    description: 'String',
    id: 'uuid',
    name: 'String',
    production_methods_producers: 'omni_production_methods_producers',
    production_methods_producers_aggregate:
      'omni_production_methods_producers_aggregate',
    production_methods_products: 'omni_production_methods_products',
    production_methods_products_aggregate:
      'omni_production_methods_products_aggregate',
    updated_at: 'timestamptz',
  },
  omni_production_methods_aggregate: {
    aggregate: 'omni_production_methods_aggregate_fields',
    nodes: 'omni_production_methods',
  },
  omni_production_methods_aggregate_fields: {
    count: 'Int',
    max: 'omni_production_methods_max_fields',
    min: 'omni_production_methods_min_fields',
  },
  omni_production_methods_max_fields: {
    created_at: 'timestamptz',
    description: 'String',
    id: 'uuid',
    name: 'String',
    updated_at: 'timestamptz',
  },
  omni_production_methods_min_fields: {
    created_at: 'timestamptz',
    description: 'String',
    id: 'uuid',
    name: 'String',
    updated_at: 'timestamptz',
  },
  omni_production_methods_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_production_methods',
  },
  omni_production_methods_producers: {
    id: 'uuid',
    producer: 'uuid',
    producerByProducer: 'omni_producers',
    productionMethodByProductionMethod: 'omni_production_methods',
    production_method: 'uuid',
  },
  omni_production_methods_producers_aggregate: {
    aggregate: 'omni_production_methods_producers_aggregate_fields',
    nodes: 'omni_production_methods_producers',
  },
  omni_production_methods_producers_aggregate_fields: {
    count: 'Int',
    max: 'omni_production_methods_producers_max_fields',
    min: 'omni_production_methods_producers_min_fields',
  },
  omni_production_methods_producers_max_fields: {
    id: 'uuid',
    producer: 'uuid',
    production_method: 'uuid',
  },
  omni_production_methods_producers_min_fields: {
    id: 'uuid',
    producer: 'uuid',
    production_method: 'uuid',
  },
  omni_production_methods_producers_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_production_methods_producers',
  },
  omni_production_methods_products: {
    id: 'uuid',
    product: 'uuid',
    productByProduct: 'omni_products',
    productionMethodByProductionMethod: 'omni_production_methods',
    production_method: 'uuid',
  },
  omni_production_methods_products_aggregate: {
    aggregate: 'omni_production_methods_products_aggregate_fields',
    nodes: 'omni_production_methods_products',
  },
  omni_production_methods_products_aggregate_fields: {
    count: 'Int',
    max: 'omni_production_methods_products_max_fields',
    min: 'omni_production_methods_products_min_fields',
  },
  omni_production_methods_products_max_fields: {
    id: 'uuid',
    product: 'uuid',
    production_method: 'uuid',
  },
  omni_production_methods_products_min_fields: {
    id: 'uuid',
    product: 'uuid',
    production_method: 'uuid',
  },
  omni_production_methods_products_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_production_methods_products',
  },
  omni_production_pallettes_enum: {
    description: 'String',
    production_materials: 'omni_production_materials',
    production_materials_aggregate: 'omni_production_materials_aggregate',
    value: 'String',
  },
  omni_production_pallettes_enum_aggregate: {
    aggregate: 'omni_production_pallettes_enum_aggregate_fields',
    nodes: 'omni_production_pallettes_enum',
  },
  omni_production_pallettes_enum_aggregate_fields: {
    count: 'Int',
    max: 'omni_production_pallettes_enum_max_fields',
    min: 'omni_production_pallettes_enum_min_fields',
  },
  omni_production_pallettes_enum_max_fields: {
    description: 'String',
    value: 'String',
  },
  omni_production_pallettes_enum_min_fields: {
    description: 'String',
    value: 'String',
  },
  omni_production_pallettes_enum_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_production_pallettes_enum',
  },
  omni_production_styles_enum: {
    description: 'String',
    production_materials: 'omni_production_materials',
    production_materials_aggregate: 'omni_production_materials_aggregate',
    value: 'String',
  },
  omni_production_styles_enum_aggregate: {
    aggregate: 'omni_production_styles_enum_aggregate_fields',
    nodes: 'omni_production_styles_enum',
  },
  omni_production_styles_enum_aggregate_fields: {
    count: 'Int',
    max: 'omni_production_styles_enum_max_fields',
    min: 'omni_production_styles_enum_min_fields',
  },
  omni_production_styles_enum_max_fields: {
    description: 'String',
    value: 'String',
  },
  omni_production_styles_enum_min_fields: {
    description: 'String',
    value: 'String',
  },
  omni_production_styles_enum_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_production_styles_enum',
  },
  omni_products: {
    brand: 'uuid',
    brandByBrand: 'omni_brands',
    brand_reward_share: 'numeric',
    collaborator_reward_share: 'numeric',
    created_at: 'timestamptz',
    discord_channel_id: 'String',
    files: 'omni_products_files',
    files_aggregate: 'omni_products_files_aggregate',
    fullfiller: 'omni_fullfillers',
    fullfillment: 'uuid',
    id: 'uuid',
    name: 'String',
    notion_id: 'String',
    price: 'uuid',
    priceCurrencyByProductionCost: 'omni_price_currencies',
    price_currency: 'omni_price_currencies',
    producer: 'uuid',
    producerByProducer: 'omni_producers',
    product_collaborators: 'omni_product_collaborators',
    product_collaborators_aggregate: 'omni_product_collaborators_aggregate',
    production_cost: 'uuid',
    production_materials: 'omni_products_production_materials',
    production_materials_aggregate:
      'omni_products_production_materials_aggregate',
    production_methods_products: 'omni_production_methods_products',
    production_methods_products_aggregate:
      'omni_production_methods_products_aggregate',
    products_stage_enum: 'omni_products_stage_enum',
    quantity: 'bigint',
    sale_type: 'omni_sale_types_enum_enum',
    sale_types_enum: 'omni_sale_types_enum',
    shop_description: 'String',
    shopify_id: 'String',
    stage: 'omni_products_stage_enum_enum',
    updated_at: 'timestamptz',
  },
  omni_products_aggregate: {
    aggregate: 'omni_products_aggregate_fields',
    nodes: 'omni_products',
  },
  omni_products_aggregate_fields: {
    avg: 'omni_products_avg_fields',
    count: 'Int',
    max: 'omni_products_max_fields',
    min: 'omni_products_min_fields',
    stddev: 'omni_products_stddev_fields',
    stddev_pop: 'omni_products_stddev_pop_fields',
    stddev_samp: 'omni_products_stddev_samp_fields',
    sum: 'omni_products_sum_fields',
    var_pop: 'omni_products_var_pop_fields',
    var_samp: 'omni_products_var_samp_fields',
    variance: 'omni_products_variance_fields',
  },
  omni_products_avg_fields: {
    brand_reward_share: 'Float',
    collaborator_reward_share: 'Float',
    quantity: 'Float',
  },
  omni_products_files: {
    directus_files_id: 'Int',
    id: 'Int',
    products_id: 'uuid',
  },
  omni_products_files_aggregate: {
    aggregate: 'omni_products_files_aggregate_fields',
    nodes: 'omni_products_files',
  },
  omni_products_files_aggregate_fields: {
    avg: 'omni_products_files_avg_fields',
    count: 'Int',
    max: 'omni_products_files_max_fields',
    min: 'omni_products_files_min_fields',
    stddev: 'omni_products_files_stddev_fields',
    stddev_pop: 'omni_products_files_stddev_pop_fields',
    stddev_samp: 'omni_products_files_stddev_samp_fields',
    sum: 'omni_products_files_sum_fields',
    var_pop: 'omni_products_files_var_pop_fields',
    var_samp: 'omni_products_files_var_samp_fields',
    variance: 'omni_products_files_variance_fields',
  },
  omni_products_files_avg_fields: {
    directus_files_id: 'Float',
    id: 'Float',
  },
  omni_products_files_max_fields: {
    directus_files_id: 'Int',
    id: 'Int',
    products_id: 'uuid',
  },
  omni_products_files_min_fields: {
    directus_files_id: 'Int',
    id: 'Int',
    products_id: 'uuid',
  },
  omni_products_files_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_products_files',
  },
  omni_products_files_stddev_fields: {
    directus_files_id: 'Float',
    id: 'Float',
  },
  omni_products_files_stddev_pop_fields: {
    directus_files_id: 'Float',
    id: 'Float',
  },
  omni_products_files_stddev_samp_fields: {
    directus_files_id: 'Float',
    id: 'Float',
  },
  omni_products_files_sum_fields: {
    directus_files_id: 'Int',
    id: 'Int',
  },
  omni_products_files_var_pop_fields: {
    directus_files_id: 'Float',
    id: 'Float',
  },
  omni_products_files_var_samp_fields: {
    directus_files_id: 'Float',
    id: 'Float',
  },
  omni_products_files_variance_fields: {
    directus_files_id: 'Float',
    id: 'Float',
  },
  omni_products_max_fields: {
    brand: 'uuid',
    brand_reward_share: 'numeric',
    collaborator_reward_share: 'numeric',
    created_at: 'timestamptz',
    discord_channel_id: 'String',
    fullfillment: 'uuid',
    id: 'uuid',
    name: 'String',
    notion_id: 'String',
    price: 'uuid',
    producer: 'uuid',
    production_cost: 'uuid',
    quantity: 'bigint',
    shop_description: 'String',
    shopify_id: 'String',
    updated_at: 'timestamptz',
  },
  omni_products_min_fields: {
    brand: 'uuid',
    brand_reward_share: 'numeric',
    collaborator_reward_share: 'numeric',
    created_at: 'timestamptz',
    discord_channel_id: 'String',
    fullfillment: 'uuid',
    id: 'uuid',
    name: 'String',
    notion_id: 'String',
    price: 'uuid',
    producer: 'uuid',
    production_cost: 'uuid',
    quantity: 'bigint',
    shop_description: 'String',
    shopify_id: 'String',
    updated_at: 'timestamptz',
  },
  omni_products_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_products',
  },
  omni_products_production_materials: {
    product_id: 'uuid',
    production_material_id: 'uuid',
    products_production_materials: 'Int',
  },
  omni_products_production_materials_aggregate: {
    aggregate: 'omni_products_production_materials_aggregate_fields',
    nodes: 'omni_products_production_materials',
  },
  omni_products_production_materials_aggregate_fields: {
    avg: 'omni_products_production_materials_avg_fields',
    count: 'Int',
    max: 'omni_products_production_materials_max_fields',
    min: 'omni_products_production_materials_min_fields',
    stddev: 'omni_products_production_materials_stddev_fields',
    stddev_pop: 'omni_products_production_materials_stddev_pop_fields',
    stddev_samp: 'omni_products_production_materials_stddev_samp_fields',
    sum: 'omni_products_production_materials_sum_fields',
    var_pop: 'omni_products_production_materials_var_pop_fields',
    var_samp: 'omni_products_production_materials_var_samp_fields',
    variance: 'omni_products_production_materials_variance_fields',
  },
  omni_products_production_materials_avg_fields: {
    products_production_materials: 'Float',
  },
  omni_products_production_materials_max_fields: {
    product_id: 'uuid',
    production_material_id: 'uuid',
    products_production_materials: 'Int',
  },
  omni_products_production_materials_min_fields: {
    product_id: 'uuid',
    production_material_id: 'uuid',
    products_production_materials: 'Int',
  },
  omni_products_production_materials_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_products_production_materials',
  },
  omni_products_production_materials_stddev_fields: {
    products_production_materials: 'Float',
  },
  omni_products_production_materials_stddev_pop_fields: {
    products_production_materials: 'Float',
  },
  omni_products_production_materials_stddev_samp_fields: {
    products_production_materials: 'Float',
  },
  omni_products_production_materials_sum_fields: {
    products_production_materials: 'Int',
  },
  omni_products_production_materials_var_pop_fields: {
    products_production_materials: 'Float',
  },
  omni_products_production_materials_var_samp_fields: {
    products_production_materials: 'Float',
  },
  omni_products_production_materials_variance_fields: {
    products_production_materials: 'Float',
  },
  omni_products_stage_enum: {
    description: 'String',
    products: 'omni_products',
    products_aggregate: 'omni_products_aggregate',
    value: 'String',
  },
  omni_products_stage_enum_aggregate: {
    aggregate: 'omni_products_stage_enum_aggregate_fields',
    nodes: 'omni_products_stage_enum',
  },
  omni_products_stage_enum_aggregate_fields: {
    count: 'Int',
    max: 'omni_products_stage_enum_max_fields',
    min: 'omni_products_stage_enum_min_fields',
  },
  omni_products_stage_enum_max_fields: {
    description: 'String',
    value: 'String',
  },
  omni_products_stage_enum_min_fields: {
    description: 'String',
    value: 'String',
  },
  omni_products_stage_enum_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_products_stage_enum',
  },
  omni_products_stddev_fields: {
    brand_reward_share: 'Float',
    collaborator_reward_share: 'Float',
    quantity: 'Float',
  },
  omni_products_stddev_pop_fields: {
    brand_reward_share: 'Float',
    collaborator_reward_share: 'Float',
    quantity: 'Float',
  },
  omni_products_stddev_samp_fields: {
    brand_reward_share: 'Float',
    collaborator_reward_share: 'Float',
    quantity: 'Float',
  },
  omni_products_sum_fields: {
    brand_reward_share: 'numeric',
    collaborator_reward_share: 'numeric',
    quantity: 'bigint',
  },
  omni_products_var_pop_fields: {
    brand_reward_share: 'Float',
    collaborator_reward_share: 'Float',
    quantity: 'Float',
  },
  omni_products_var_samp_fields: {
    brand_reward_share: 'Float',
    collaborator_reward_share: 'Float',
    quantity: 'Float',
  },
  omni_products_variance_fields: {
    brand_reward_share: 'Float',
    collaborator_reward_share: 'Float',
    quantity: 'Float',
  },
  omni_sale_types_enum: {
    description: 'String',
    products: 'omni_products',
    products_aggregate: 'omni_products_aggregate',
    value: 'String',
  },
  omni_sale_types_enum_aggregate: {
    aggregate: 'omni_sale_types_enum_aggregate_fields',
    nodes: 'omni_sale_types_enum',
  },
  omni_sale_types_enum_aggregate_fields: {
    count: 'Int',
    max: 'omni_sale_types_enum_max_fields',
    min: 'omni_sale_types_enum_min_fields',
  },
  omni_sale_types_enum_max_fields: {
    description: 'String',
    value: 'String',
  },
  omni_sale_types_enum_min_fields: {
    description: 'String',
    value: 'String',
  },
  omni_sale_types_enum_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_sale_types_enum',
  },
  omni_timezones_enum: {
    description: 'String',
    users: 'omni_users',
    users_aggregate: 'omni_users_aggregate',
    value: 'String',
  },
  omni_timezones_enum_aggregate: {
    aggregate: 'omni_timezones_enum_aggregate_fields',
    nodes: 'omni_timezones_enum',
  },
  omni_timezones_enum_aggregate_fields: {
    count: 'Int',
    max: 'omni_timezones_enum_max_fields',
    min: 'omni_timezones_enum_min_fields',
  },
  omni_timezones_enum_max_fields: {
    description: 'String',
    value: 'String',
  },
  omni_timezones_enum_min_fields: {
    description: 'String',
    value: 'String',
  },
  omni_timezones_enum_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_timezones_enum',
  },
  omni_user_skill_types_enum: {
    description: 'String',
    user_skills: 'omni_user_skills',
    user_skills_aggregate: 'omni_user_skills_aggregate',
    value: 'String',
  },
  omni_user_skill_types_enum_aggregate: {
    aggregate: 'omni_user_skill_types_enum_aggregate_fields',
    nodes: 'omni_user_skill_types_enum',
  },
  omni_user_skill_types_enum_aggregate_fields: {
    count: 'Int',
    max: 'omni_user_skill_types_enum_max_fields',
    min: 'omni_user_skill_types_enum_min_fields',
  },
  omni_user_skill_types_enum_max_fields: {
    description: 'String',
    value: 'String',
  },
  omni_user_skill_types_enum_min_fields: {
    description: 'String',
    value: 'String',
  },
  omni_user_skill_types_enum_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_user_skill_types_enum',
  },
  omni_user_skills: {
    id: 'uuid',
    skill: 'omni_user_skill_types_enum_enum',
    user: 'uuid',
    userByUser: 'omni_users',
    user_skill_types_enum: 'omni_user_skill_types_enum',
  },
  omni_user_skills_aggregate: {
    aggregate: 'omni_user_skills_aggregate_fields',
    nodes: 'omni_user_skills',
  },
  omni_user_skills_aggregate_fields: {
    count: 'Int',
    max: 'omni_user_skills_max_fields',
    min: 'omni_user_skills_min_fields',
  },
  omni_user_skills_max_fields: {
    id: 'uuid',
    user: 'uuid',
  },
  omni_user_skills_min_fields: {
    id: 'uuid',
    user: 'uuid',
  },
  omni_user_skills_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_user_skills',
  },
  omni_user_statuses_enum: {
    description: 'String',
    users: 'omni_users',
    users_aggregate: 'omni_users_aggregate',
    value: 'String',
  },
  omni_user_statuses_enum_aggregate: {
    aggregate: 'omni_user_statuses_enum_aggregate_fields',
    nodes: 'omni_user_statuses_enum',
  },
  omni_user_statuses_enum_aggregate_fields: {
    count: 'Int',
    max: 'omni_user_statuses_enum_max_fields',
    min: 'omni_user_statuses_enum_min_fields',
  },
  omni_user_statuses_enum_max_fields: {
    description: 'String',
    value: 'String',
  },
  omni_user_statuses_enum_min_fields: {
    description: 'String',
    value: 'String',
  },
  omni_user_statuses_enum_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_user_statuses_enum',
  },
  omni_users: {
    brand_users: 'omni_brand_users',
    brand_users_aggregate: 'omni_brand_users_aggregate',
    created_at: 'timestamptz',
    discord_handle: 'String',
    discord_id: 'String',
    eth_address: 'String',
    github_handle: 'String',
    id: 'uuid',
    name: 'String',
    product_collaborators: 'omni_product_collaborators',
    product_collaborators_aggregate: 'omni_product_collaborators_aggregate',
    status: 'omni_user_statuses_enum_enum',
    timezone: 'omni_timezones_enum_enum',
    timezones_enum: 'omni_timezones_enum',
    twitter_handle: 'String',
    updated_at: 'timestamptz',
    user_skills: 'omni_user_skills',
    user_skills_aggregate: 'omni_user_skills_aggregate',
    user_statuses_enum: 'omni_user_statuses_enum',
  },
  omni_users_aggregate: {
    aggregate: 'omni_users_aggregate_fields',
    nodes: 'omni_users',
  },
  omni_users_aggregate_fields: {
    count: 'Int',
    max: 'omni_users_max_fields',
    min: 'omni_users_min_fields',
  },
  omni_users_max_fields: {
    created_at: 'timestamptz',
    discord_handle: 'String',
    discord_id: 'String',
    eth_address: 'String',
    github_handle: 'String',
    id: 'uuid',
    name: 'String',
    twitter_handle: 'String',
    updated_at: 'timestamptz',
  },
  omni_users_min_fields: {
    created_at: 'timestamptz',
    discord_handle: 'String',
    discord_id: 'String',
    eth_address: 'String',
    github_handle: 'String',
    id: 'uuid',
    name: 'String',
    twitter_handle: 'String',
    updated_at: 'timestamptz',
  },
  omni_users_mutation_response: {
    affected_rows: 'Int',
    returning: 'omni_users',
  },
  query_root: {
    contribution_votes: 'contribution_votes',
    contribution_votes_aggregate: 'contribution_votes_aggregate',
    contribution_votes_by_pk: 'contribution_votes',
    contributions: 'contributions',
    contributions_aggregate: 'contributions_aggregate',
    contributions_by_pk: 'contributions',
    contributors: 'contributors',
    contributors_aggregate: 'contributors_aggregate',
    contributors_by_pk: 'contributors',
    omni_brand_statuses_enum: 'omni_brand_statuses_enum',
    omni_brand_statuses_enum_aggregate: 'omni_brand_statuses_enum_aggregate',
    omni_brand_statuses_enum_by_pk: 'omni_brand_statuses_enum',
    omni_brand_users: 'omni_brand_users',
    omni_brand_users_aggregate: 'omni_brand_users_aggregate',
    omni_brand_users_by_pk: 'omni_brand_users',
    omni_brands: 'omni_brands',
    omni_brands_aggregate: 'omni_brands_aggregate',
    omni_brands_by_pk: 'omni_brands',
    omni_collaborator_types_enum: 'omni_collaborator_types_enum',
    omni_collaborator_types_enum_aggregate:
      'omni_collaborator_types_enum_aggregate',
    omni_collaborator_types_enum_by_pk: 'omni_collaborator_types_enum',
    omni_directus_files: 'omni_directus_files',
    omni_directus_files_aggregate: 'omni_directus_files_aggregate',
    omni_directus_files_by_pk: 'omni_directus_files',
    omni_fullfillers: 'omni_fullfillers',
    omni_fullfillers_aggregate: 'omni_fullfillers_aggregate',
    omni_fullfillers_by_pk: 'omni_fullfillers',
    omni_price_currencies: 'omni_price_currencies',
    omni_price_currencies_aggregate: 'omni_price_currencies_aggregate',
    omni_price_currencies_by_pk: 'omni_price_currencies',
    omni_print_techs_enum: 'omni_print_techs_enum',
    omni_print_techs_enum_aggregate: 'omni_print_techs_enum_aggregate',
    omni_print_techs_enum_by_pk: 'omni_print_techs_enum',
    omni_producer_statuses_enum: 'omni_producer_statuses_enum',
    omni_producer_statuses_enum_aggregate:
      'omni_producer_statuses_enum_aggregate',
    omni_producer_statuses_enum_by_pk: 'omni_producer_statuses_enum',
    omni_producers: 'omni_producers',
    omni_producers_aggregate: 'omni_producers_aggregate',
    omni_producers_by_pk: 'omni_producers',
    omni_product_collaborators: 'omni_product_collaborators',
    omni_product_collaborators_aggregate:
      'omni_product_collaborators_aggregate',
    omni_product_collaborators_by_pk: 'omni_product_collaborators',
    omni_product_types_enum: 'omni_product_types_enum',
    omni_product_types_enum_aggregate: 'omni_product_types_enum_aggregate',
    omni_product_types_enum_by_pk: 'omni_product_types_enum',
    omni_production_genders_enum: 'omni_production_genders_enum',
    omni_production_genders_enum_aggregate:
      'omni_production_genders_enum_aggregate',
    omni_production_genders_enum_by_pk: 'omni_production_genders_enum',
    omni_production_materials: 'omni_production_materials',
    omni_production_materials_aggregate: 'omni_production_materials_aggregate',
    omni_production_materials_by_pk: 'omni_production_materials',
    omni_production_materials_producers: 'omni_production_materials_producers',
    omni_production_materials_producers_aggregate:
      'omni_production_materials_producers_aggregate',
    omni_production_materials_producers_by_pk:
      'omni_production_materials_producers',
    omni_production_materials_ratings_enum:
      'omni_production_materials_ratings_enum',
    omni_production_materials_ratings_enum_aggregate:
      'omni_production_materials_ratings_enum_aggregate',
    omni_production_materials_ratings_enum_by_pk:
      'omni_production_materials_ratings_enum',
    omni_production_methods: 'omni_production_methods',
    omni_production_methods_aggregate: 'omni_production_methods_aggregate',
    omni_production_methods_by_pk: 'omni_production_methods',
    omni_production_methods_producers: 'omni_production_methods_producers',
    omni_production_methods_producers_aggregate:
      'omni_production_methods_producers_aggregate',
    omni_production_methods_producers_by_pk:
      'omni_production_methods_producers',
    omni_production_methods_products: 'omni_production_methods_products',
    omni_production_methods_products_aggregate:
      'omni_production_methods_products_aggregate',
    omni_production_methods_products_by_pk: 'omni_production_methods_products',
    omni_production_pallettes_enum: 'omni_production_pallettes_enum',
    omni_production_pallettes_enum_aggregate:
      'omni_production_pallettes_enum_aggregate',
    omni_production_pallettes_enum_by_pk: 'omni_production_pallettes_enum',
    omni_production_styles_enum: 'omni_production_styles_enum',
    omni_production_styles_enum_aggregate:
      'omni_production_styles_enum_aggregate',
    omni_production_styles_enum_by_pk: 'omni_production_styles_enum',
    omni_products: 'omni_products',
    omni_products_aggregate: 'omni_products_aggregate',
    omni_products_by_pk: 'omni_products',
    omni_products_files: 'omni_products_files',
    omni_products_files_aggregate: 'omni_products_files_aggregate',
    omni_products_files_by_pk: 'omni_products_files',
    omni_products_production_materials: 'omni_products_production_materials',
    omni_products_production_materials_aggregate:
      'omni_products_production_materials_aggregate',
    omni_products_production_materials_by_pk:
      'omni_products_production_materials',
    omni_products_stage_enum: 'omni_products_stage_enum',
    omni_products_stage_enum_aggregate: 'omni_products_stage_enum_aggregate',
    omni_products_stage_enum_by_pk: 'omni_products_stage_enum',
    omni_sale_types_enum: 'omni_sale_types_enum',
    omni_sale_types_enum_aggregate: 'omni_sale_types_enum_aggregate',
    omni_sale_types_enum_by_pk: 'omni_sale_types_enum',
    omni_timezones_enum: 'omni_timezones_enum',
    omni_timezones_enum_aggregate: 'omni_timezones_enum_aggregate',
    omni_timezones_enum_by_pk: 'omni_timezones_enum',
    omni_user_skill_types_enum: 'omni_user_skill_types_enum',
    omni_user_skill_types_enum_aggregate:
      'omni_user_skill_types_enum_aggregate',
    omni_user_skill_types_enum_by_pk: 'omni_user_skill_types_enum',
    omni_user_skills: 'omni_user_skills',
    omni_user_skills_aggregate: 'omni_user_skills_aggregate',
    omni_user_skills_by_pk: 'omni_user_skills',
    omni_user_statuses_enum: 'omni_user_statuses_enum',
    omni_user_statuses_enum_aggregate: 'omni_user_statuses_enum_aggregate',
    omni_user_statuses_enum_by_pk: 'omni_user_statuses_enum',
    omni_users: 'omni_users',
    omni_users_aggregate: 'omni_users_aggregate',
    omni_users_by_pk: 'omni_users',
    robot_merkle_claims: 'robot_merkle_claims',
    robot_merkle_claims_aggregate: 'robot_merkle_claims_aggregate',
    robot_merkle_claims_by_pk: 'robot_merkle_claims',
    robot_merkle_roots: 'robot_merkle_roots',
    robot_merkle_roots_aggregate: 'robot_merkle_roots_aggregate',
    robot_merkle_roots_by_pk: 'robot_merkle_roots',
    robot_order: 'robot_order',
    robot_order_aggregate: 'robot_order_aggregate',
    robot_order_by_pk: 'robot_order',
    robot_product: 'robot_product',
    robot_product_aggregate: 'robot_product_aggregate',
    robot_product_by_pk: 'robot_product',
    robot_product_designer: 'robot_product_designer',
    robot_product_designer_aggregate: 'robot_product_designer_aggregate',
    robot_product_designer_by_pk: 'robot_product_designer',
    shop_api_users: 'shop_api_users',
    shop_api_users_aggregate: 'shop_api_users_aggregate',
    shop_api_users_by_pk: 'shop_api_users',
    shop_product_locks: 'shop_product_locks',
    shop_product_locks_aggregate: 'shop_product_locks_aggregate',
    shop_product_locks_by_pk: 'shop_product_locks',
    users: 'users',
    users_aggregate: 'users_aggregate',
    users_by_pk: 'users',
  },
  robot_merkle_claims: {
    claim_json: 'jsonb',
    id: 'uuid',
    merkle_root: 'robot_merkle_roots',
    merkle_root_hash: 'String',
    recipient_eth_address: 'String',
  },
  robot_merkle_claims_aggregate: {
    aggregate: 'robot_merkle_claims_aggregate_fields',
    nodes: 'robot_merkle_claims',
  },
  robot_merkle_claims_aggregate_fields: {
    count: 'Int',
    max: 'robot_merkle_claims_max_fields',
    min: 'robot_merkle_claims_min_fields',
  },
  robot_merkle_claims_max_fields: {
    id: 'uuid',
    merkle_root_hash: 'String',
    recipient_eth_address: 'String',
  },
  robot_merkle_claims_min_fields: {
    id: 'uuid',
    merkle_root_hash: 'String',
    recipient_eth_address: 'String',
  },
  robot_merkle_claims_mutation_response: {
    affected_rows: 'Int',
    returning: 'robot_merkle_claims',
  },
  robot_merkle_roots: {
    contract_address: 'String',
    created_at: 'timestamptz',
    hash: 'String',
    merkle_claims: 'robot_merkle_claims',
    merkle_claims_aggregate: 'robot_merkle_claims_aggregate',
    network: 'String',
  },
  robot_merkle_roots_aggregate: {
    aggregate: 'robot_merkle_roots_aggregate_fields',
    nodes: 'robot_merkle_roots',
  },
  robot_merkle_roots_aggregate_fields: {
    count: 'Int',
    max: 'robot_merkle_roots_max_fields',
    min: 'robot_merkle_roots_min_fields',
  },
  robot_merkle_roots_max_fields: {
    contract_address: 'String',
    created_at: 'timestamptz',
    hash: 'String',
    network: 'String',
  },
  robot_merkle_roots_min_fields: {
    contract_address: 'String',
    created_at: 'timestamptz',
    hash: 'String',
    network: 'String',
  },
  robot_merkle_roots_mutation_response: {
    affected_rows: 'Int',
    returning: 'robot_merkle_roots',
  },
  robot_order: {
    buyer_address: 'String',
    buyer_reward: 'numeric',
    date: 'date',
    dollars_spent: 'numeric',
    order_id: 'String',
    order_number: 'String',
    season: 'numeric',
  },
  robot_order_aggregate: {
    aggregate: 'robot_order_aggregate_fields',
    nodes: 'robot_order',
  },
  robot_order_aggregate_fields: {
    avg: 'robot_order_avg_fields',
    count: 'Int',
    max: 'robot_order_max_fields',
    min: 'robot_order_min_fields',
    stddev: 'robot_order_stddev_fields',
    stddev_pop: 'robot_order_stddev_pop_fields',
    stddev_samp: 'robot_order_stddev_samp_fields',
    sum: 'robot_order_sum_fields',
    var_pop: 'robot_order_var_pop_fields',
    var_samp: 'robot_order_var_samp_fields',
    variance: 'robot_order_variance_fields',
  },
  robot_order_avg_fields: {
    buyer_reward: 'Float',
    dollars_spent: 'Float',
    season: 'Float',
  },
  robot_order_max_fields: {
    buyer_address: 'String',
    buyer_reward: 'numeric',
    date: 'date',
    dollars_spent: 'numeric',
    order_id: 'String',
    order_number: 'String',
    season: 'numeric',
  },
  robot_order_min_fields: {
    buyer_address: 'String',
    buyer_reward: 'numeric',
    date: 'date',
    dollars_spent: 'numeric',
    order_id: 'String',
    order_number: 'String',
    season: 'numeric',
  },
  robot_order_mutation_response: {
    affected_rows: 'Int',
    returning: 'robot_order',
  },
  robot_order_stddev_fields: {
    buyer_reward: 'Float',
    dollars_spent: 'Float',
    season: 'Float',
  },
  robot_order_stddev_pop_fields: {
    buyer_reward: 'Float',
    dollars_spent: 'Float',
    season: 'Float',
  },
  robot_order_stddev_samp_fields: {
    buyer_reward: 'Float',
    dollars_spent: 'Float',
    season: 'Float',
  },
  robot_order_sum_fields: {
    buyer_reward: 'numeric',
    dollars_spent: 'numeric',
    season: 'numeric',
  },
  robot_order_var_pop_fields: {
    buyer_reward: 'Float',
    dollars_spent: 'Float',
    season: 'Float',
  },
  robot_order_var_samp_fields: {
    buyer_reward: 'Float',
    dollars_spent: 'Float',
    season: 'Float',
  },
  robot_order_variance_fields: {
    buyer_reward: 'Float',
    dollars_spent: 'Float',
    season: 'Float',
  },
  robot_product: {
    created_at: 'timestamptz',
    designers: 'robot_product_designer',
    designers_aggregate: 'robot_product_designer_aggregate',
    id: 'String',
    nft_metadata: 'jsonb',
    nft_token_id: 'Int',
    notion_id: 'String',
    shopify_id: 'String',
    title: 'String',
    updated_at: 'timestamptz',
  },
  robot_product_aggregate: {
    aggregate: 'robot_product_aggregate_fields',
    nodes: 'robot_product',
  },
  robot_product_aggregate_fields: {
    avg: 'robot_product_avg_fields',
    count: 'Int',
    max: 'robot_product_max_fields',
    min: 'robot_product_min_fields',
    stddev: 'robot_product_stddev_fields',
    stddev_pop: 'robot_product_stddev_pop_fields',
    stddev_samp: 'robot_product_stddev_samp_fields',
    sum: 'robot_product_sum_fields',
    var_pop: 'robot_product_var_pop_fields',
    var_samp: 'robot_product_var_samp_fields',
    variance: 'robot_product_variance_fields',
  },
  robot_product_avg_fields: {
    nft_token_id: 'Float',
  },
  robot_product_designer: {
    contribution_share: 'numeric',
    designer_name: 'String',
    eth_address: 'String',
    product: 'robot_product',
    product_id: 'String',
    robot_reward: 'numeric',
  },
  robot_product_designer_aggregate: {
    aggregate: 'robot_product_designer_aggregate_fields',
    nodes: 'robot_product_designer',
  },
  robot_product_designer_aggregate_fields: {
    avg: 'robot_product_designer_avg_fields',
    count: 'Int',
    max: 'robot_product_designer_max_fields',
    min: 'robot_product_designer_min_fields',
    stddev: 'robot_product_designer_stddev_fields',
    stddev_pop: 'robot_product_designer_stddev_pop_fields',
    stddev_samp: 'robot_product_designer_stddev_samp_fields',
    sum: 'robot_product_designer_sum_fields',
    var_pop: 'robot_product_designer_var_pop_fields',
    var_samp: 'robot_product_designer_var_samp_fields',
    variance: 'robot_product_designer_variance_fields',
  },
  robot_product_designer_avg_fields: {
    contribution_share: 'Float',
    robot_reward: 'Float',
  },
  robot_product_designer_max_fields: {
    contribution_share: 'numeric',
    designer_name: 'String',
    eth_address: 'String',
    product_id: 'String',
    robot_reward: 'numeric',
  },
  robot_product_designer_min_fields: {
    contribution_share: 'numeric',
    designer_name: 'String',
    eth_address: 'String',
    product_id: 'String',
    robot_reward: 'numeric',
  },
  robot_product_designer_mutation_response: {
    affected_rows: 'Int',
    returning: 'robot_product_designer',
  },
  robot_product_designer_stddev_fields: {
    contribution_share: 'Float',
    robot_reward: 'Float',
  },
  robot_product_designer_stddev_pop_fields: {
    contribution_share: 'Float',
    robot_reward: 'Float',
  },
  robot_product_designer_stddev_samp_fields: {
    contribution_share: 'Float',
    robot_reward: 'Float',
  },
  robot_product_designer_sum_fields: {
    contribution_share: 'numeric',
    robot_reward: 'numeric',
  },
  robot_product_designer_var_pop_fields: {
    contribution_share: 'Float',
    robot_reward: 'Float',
  },
  robot_product_designer_var_samp_fields: {
    contribution_share: 'Float',
    robot_reward: 'Float',
  },
  robot_product_designer_variance_fields: {
    contribution_share: 'Float',
    robot_reward: 'Float',
  },
  robot_product_max_fields: {
    created_at: 'timestamptz',
    id: 'String',
    nft_token_id: 'Int',
    notion_id: 'String',
    shopify_id: 'String',
    title: 'String',
    updated_at: 'timestamptz',
  },
  robot_product_min_fields: {
    created_at: 'timestamptz',
    id: 'String',
    nft_token_id: 'Int',
    notion_id: 'String',
    shopify_id: 'String',
    title: 'String',
    updated_at: 'timestamptz',
  },
  robot_product_mutation_response: {
    affected_rows: 'Int',
    returning: 'robot_product',
  },
  robot_product_stddev_fields: {
    nft_token_id: 'Float',
  },
  robot_product_stddev_pop_fields: {
    nft_token_id: 'Float',
  },
  robot_product_stddev_samp_fields: {
    nft_token_id: 'Float',
  },
  robot_product_sum_fields: {
    nft_token_id: 'Int',
  },
  robot_product_var_pop_fields: {
    nft_token_id: 'Float',
  },
  robot_product_var_samp_fields: {
    nft_token_id: 'Float',
  },
  robot_product_variance_fields: {
    nft_token_id: 'Float',
  },
  shop_api_users: {
    password_hash: 'String',
    username: 'String',
  },
  shop_api_users_aggregate: {
    aggregate: 'shop_api_users_aggregate_fields',
    nodes: 'shop_api_users',
  },
  shop_api_users_aggregate_fields: {
    count: 'Int',
    max: 'shop_api_users_max_fields',
    min: 'shop_api_users_min_fields',
  },
  shop_api_users_max_fields: {
    password_hash: 'String',
    username: 'String',
  },
  shop_api_users_min_fields: {
    password_hash: 'String',
    username: 'String',
  },
  shop_api_users_mutation_response: {
    affected_rows: 'Int',
    returning: 'shop_api_users',
  },
  shop_product_locks: {
    access_code: 'String',
    created_at: 'timestamptz',
    customer_eth_address: 'String',
    lock_id: 'String',
  },
  shop_product_locks_aggregate: {
    aggregate: 'shop_product_locks_aggregate_fields',
    nodes: 'shop_product_locks',
  },
  shop_product_locks_aggregate_fields: {
    count: 'Int',
    max: 'shop_product_locks_max_fields',
    min: 'shop_product_locks_min_fields',
  },
  shop_product_locks_max_fields: {
    access_code: 'String',
    created_at: 'timestamptz',
    customer_eth_address: 'String',
    lock_id: 'String',
  },
  shop_product_locks_min_fields: {
    access_code: 'String',
    created_at: 'timestamptz',
    customer_eth_address: 'String',
    lock_id: 'String',
  },
  shop_product_locks_mutation_response: {
    affected_rows: 'Int',
    returning: 'shop_product_locks',
  },
  subscription_root: {
    contribution_votes: 'contribution_votes',
    contribution_votes_aggregate: 'contribution_votes_aggregate',
    contribution_votes_by_pk: 'contribution_votes',
    contribution_votes_stream: 'contribution_votes',
    contributions: 'contributions',
    contributions_aggregate: 'contributions_aggregate',
    contributions_by_pk: 'contributions',
    contributions_stream: 'contributions',
    contributors: 'contributors',
    contributors_aggregate: 'contributors_aggregate',
    contributors_by_pk: 'contributors',
    contributors_stream: 'contributors',
    omni_brand_statuses_enum: 'omni_brand_statuses_enum',
    omni_brand_statuses_enum_aggregate: 'omni_brand_statuses_enum_aggregate',
    omni_brand_statuses_enum_by_pk: 'omni_brand_statuses_enum',
    omni_brand_statuses_enum_stream: 'omni_brand_statuses_enum',
    omni_brand_users: 'omni_brand_users',
    omni_brand_users_aggregate: 'omni_brand_users_aggregate',
    omni_brand_users_by_pk: 'omni_brand_users',
    omni_brand_users_stream: 'omni_brand_users',
    omni_brands: 'omni_brands',
    omni_brands_aggregate: 'omni_brands_aggregate',
    omni_brands_by_pk: 'omni_brands',
    omni_brands_stream: 'omni_brands',
    omni_collaborator_types_enum: 'omni_collaborator_types_enum',
    omni_collaborator_types_enum_aggregate:
      'omni_collaborator_types_enum_aggregate',
    omni_collaborator_types_enum_by_pk: 'omni_collaborator_types_enum',
    omni_collaborator_types_enum_stream: 'omni_collaborator_types_enum',
    omni_directus_files: 'omni_directus_files',
    omni_directus_files_aggregate: 'omni_directus_files_aggregate',
    omni_directus_files_by_pk: 'omni_directus_files',
    omni_directus_files_stream: 'omni_directus_files',
    omni_fullfillers: 'omni_fullfillers',
    omni_fullfillers_aggregate: 'omni_fullfillers_aggregate',
    omni_fullfillers_by_pk: 'omni_fullfillers',
    omni_fullfillers_stream: 'omni_fullfillers',
    omni_price_currencies: 'omni_price_currencies',
    omni_price_currencies_aggregate: 'omni_price_currencies_aggregate',
    omni_price_currencies_by_pk: 'omni_price_currencies',
    omni_price_currencies_stream: 'omni_price_currencies',
    omni_print_techs_enum: 'omni_print_techs_enum',
    omni_print_techs_enum_aggregate: 'omni_print_techs_enum_aggregate',
    omni_print_techs_enum_by_pk: 'omni_print_techs_enum',
    omni_print_techs_enum_stream: 'omni_print_techs_enum',
    omni_producer_statuses_enum: 'omni_producer_statuses_enum',
    omni_producer_statuses_enum_aggregate:
      'omni_producer_statuses_enum_aggregate',
    omni_producer_statuses_enum_by_pk: 'omni_producer_statuses_enum',
    omni_producer_statuses_enum_stream: 'omni_producer_statuses_enum',
    omni_producers: 'omni_producers',
    omni_producers_aggregate: 'omni_producers_aggregate',
    omni_producers_by_pk: 'omni_producers',
    omni_producers_stream: 'omni_producers',
    omni_product_collaborators: 'omni_product_collaborators',
    omni_product_collaborators_aggregate:
      'omni_product_collaborators_aggregate',
    omni_product_collaborators_by_pk: 'omni_product_collaborators',
    omni_product_collaborators_stream: 'omni_product_collaborators',
    omni_product_types_enum: 'omni_product_types_enum',
    omni_product_types_enum_aggregate: 'omni_product_types_enum_aggregate',
    omni_product_types_enum_by_pk: 'omni_product_types_enum',
    omni_product_types_enum_stream: 'omni_product_types_enum',
    omni_production_genders_enum: 'omni_production_genders_enum',
    omni_production_genders_enum_aggregate:
      'omni_production_genders_enum_aggregate',
    omni_production_genders_enum_by_pk: 'omni_production_genders_enum',
    omni_production_genders_enum_stream: 'omni_production_genders_enum',
    omni_production_materials: 'omni_production_materials',
    omni_production_materials_aggregate: 'omni_production_materials_aggregate',
    omni_production_materials_by_pk: 'omni_production_materials',
    omni_production_materials_producers: 'omni_production_materials_producers',
    omni_production_materials_producers_aggregate:
      'omni_production_materials_producers_aggregate',
    omni_production_materials_producers_by_pk:
      'omni_production_materials_producers',
    omni_production_materials_producers_stream:
      'omni_production_materials_producers',
    omni_production_materials_ratings_enum:
      'omni_production_materials_ratings_enum',
    omni_production_materials_ratings_enum_aggregate:
      'omni_production_materials_ratings_enum_aggregate',
    omni_production_materials_ratings_enum_by_pk:
      'omni_production_materials_ratings_enum',
    omni_production_materials_ratings_enum_stream:
      'omni_production_materials_ratings_enum',
    omni_production_materials_stream: 'omni_production_materials',
    omni_production_methods: 'omni_production_methods',
    omni_production_methods_aggregate: 'omni_production_methods_aggregate',
    omni_production_methods_by_pk: 'omni_production_methods',
    omni_production_methods_producers: 'omni_production_methods_producers',
    omni_production_methods_producers_aggregate:
      'omni_production_methods_producers_aggregate',
    omni_production_methods_producers_by_pk:
      'omni_production_methods_producers',
    omni_production_methods_producers_stream:
      'omni_production_methods_producers',
    omni_production_methods_products: 'omni_production_methods_products',
    omni_production_methods_products_aggregate:
      'omni_production_methods_products_aggregate',
    omni_production_methods_products_by_pk: 'omni_production_methods_products',
    omni_production_methods_products_stream: 'omni_production_methods_products',
    omni_production_methods_stream: 'omni_production_methods',
    omni_production_pallettes_enum: 'omni_production_pallettes_enum',
    omni_production_pallettes_enum_aggregate:
      'omni_production_pallettes_enum_aggregate',
    omni_production_pallettes_enum_by_pk: 'omni_production_pallettes_enum',
    omni_production_pallettes_enum_stream: 'omni_production_pallettes_enum',
    omni_production_styles_enum: 'omni_production_styles_enum',
    omni_production_styles_enum_aggregate:
      'omni_production_styles_enum_aggregate',
    omni_production_styles_enum_by_pk: 'omni_production_styles_enum',
    omni_production_styles_enum_stream: 'omni_production_styles_enum',
    omni_products: 'omni_products',
    omni_products_aggregate: 'omni_products_aggregate',
    omni_products_by_pk: 'omni_products',
    omni_products_files: 'omni_products_files',
    omni_products_files_aggregate: 'omni_products_files_aggregate',
    omni_products_files_by_pk: 'omni_products_files',
    omni_products_files_stream: 'omni_products_files',
    omni_products_production_materials: 'omni_products_production_materials',
    omni_products_production_materials_aggregate:
      'omni_products_production_materials_aggregate',
    omni_products_production_materials_by_pk:
      'omni_products_production_materials',
    omni_products_production_materials_stream:
      'omni_products_production_materials',
    omni_products_stage_enum: 'omni_products_stage_enum',
    omni_products_stage_enum_aggregate: 'omni_products_stage_enum_aggregate',
    omni_products_stage_enum_by_pk: 'omni_products_stage_enum',
    omni_products_stage_enum_stream: 'omni_products_stage_enum',
    omni_products_stream: 'omni_products',
    omni_sale_types_enum: 'omni_sale_types_enum',
    omni_sale_types_enum_aggregate: 'omni_sale_types_enum_aggregate',
    omni_sale_types_enum_by_pk: 'omni_sale_types_enum',
    omni_sale_types_enum_stream: 'omni_sale_types_enum',
    omni_timezones_enum: 'omni_timezones_enum',
    omni_timezones_enum_aggregate: 'omni_timezones_enum_aggregate',
    omni_timezones_enum_by_pk: 'omni_timezones_enum',
    omni_timezones_enum_stream: 'omni_timezones_enum',
    omni_user_skill_types_enum: 'omni_user_skill_types_enum',
    omni_user_skill_types_enum_aggregate:
      'omni_user_skill_types_enum_aggregate',
    omni_user_skill_types_enum_by_pk: 'omni_user_skill_types_enum',
    omni_user_skill_types_enum_stream: 'omni_user_skill_types_enum',
    omni_user_skills: 'omni_user_skills',
    omni_user_skills_aggregate: 'omni_user_skills_aggregate',
    omni_user_skills_by_pk: 'omni_user_skills',
    omni_user_skills_stream: 'omni_user_skills',
    omni_user_statuses_enum: 'omni_user_statuses_enum',
    omni_user_statuses_enum_aggregate: 'omni_user_statuses_enum_aggregate',
    omni_user_statuses_enum_by_pk: 'omni_user_statuses_enum',
    omni_user_statuses_enum_stream: 'omni_user_statuses_enum',
    omni_users: 'omni_users',
    omni_users_aggregate: 'omni_users_aggregate',
    omni_users_by_pk: 'omni_users',
    omni_users_stream: 'omni_users',
    robot_merkle_claims: 'robot_merkle_claims',
    robot_merkle_claims_aggregate: 'robot_merkle_claims_aggregate',
    robot_merkle_claims_by_pk: 'robot_merkle_claims',
    robot_merkle_claims_stream: 'robot_merkle_claims',
    robot_merkle_roots: 'robot_merkle_roots',
    robot_merkle_roots_aggregate: 'robot_merkle_roots_aggregate',
    robot_merkle_roots_by_pk: 'robot_merkle_roots',
    robot_merkle_roots_stream: 'robot_merkle_roots',
    robot_order: 'robot_order',
    robot_order_aggregate: 'robot_order_aggregate',
    robot_order_by_pk: 'robot_order',
    robot_order_stream: 'robot_order',
    robot_product: 'robot_product',
    robot_product_aggregate: 'robot_product_aggregate',
    robot_product_by_pk: 'robot_product',
    robot_product_designer: 'robot_product_designer',
    robot_product_designer_aggregate: 'robot_product_designer_aggregate',
    robot_product_designer_by_pk: 'robot_product_designer',
    robot_product_designer_stream: 'robot_product_designer',
    robot_product_stream: 'robot_product',
    shop_api_users: 'shop_api_users',
    shop_api_users_aggregate: 'shop_api_users_aggregate',
    shop_api_users_by_pk: 'shop_api_users',
    shop_api_users_stream: 'shop_api_users',
    shop_product_locks: 'shop_product_locks',
    shop_product_locks_aggregate: 'shop_product_locks_aggregate',
    shop_product_locks_by_pk: 'shop_product_locks',
    shop_product_locks_stream: 'shop_product_locks',
    users: 'users',
    users_aggregate: 'users_aggregate',
    users_by_pk: 'users',
    users_stream: 'users',
  },
  timestamptz: `scalar.timestamptz` as const,
  users: {
    eth_address: 'String',
    id: 'uuid',
    name: 'String',
  },
  users_aggregate: {
    aggregate: 'users_aggregate_fields',
    nodes: 'users',
  },
  users_aggregate_fields: {
    count: 'Int',
    max: 'users_max_fields',
    min: 'users_min_fields',
  },
  users_max_fields: {
    eth_address: 'String',
    id: 'uuid',
    name: 'String',
  },
  users_min_fields: {
    eth_address: 'String',
    id: 'uuid',
    name: 'String',
  },
  users_mutation_response: {
    affected_rows: 'Int',
    returning: 'users',
  },
  uuid: `scalar.uuid` as const,
};

export const Ops = {
  mutation: 'mutation_root' as const,
  query: 'query_root' as const,
  subscription: 'subscription_root' as const,
};
