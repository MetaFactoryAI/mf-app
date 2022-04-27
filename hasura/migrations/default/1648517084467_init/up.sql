SET check_function_bodies = false;
CREATE SCHEMA robot;
CREATE SCHEMA shop;
CREATE TABLE public.contributions (
    date date NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    effort text,
    impact text,
    title text NOT NULL,
    artifact text,
    created_by uuid NOT NULL,
    category text,
    weight integer
);
CREATE FUNCTION public.contribution_voted_by_user(contrib public.contributions, hasura_session json) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
SELECT EXISTS (
    SELECT 1
    FROM contribution_votes A
    WHERE A.user_id = CAST(hasura_session ->> 'x-hasura-user-id' AS uuid) AND A.contribution_id = contrib.id
);
$$;
CREATE TABLE public.contribution_votes (
    user_id uuid NOT NULL,
    contribution_id uuid NOT NULL,
    rating text NOT NULL
);
CREATE TABLE public.contributors (
    contribution_id uuid NOT NULL,
    user_id uuid NOT NULL,
    contribution_share numeric NOT NULL
);
CREATE TABLE public.users (
    eth_address text NOT NULL,
    name text NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);
CREATE TABLE robot."order" (
    order_id text NOT NULL,
    dollars_spent numeric NOT NULL,
    buyer_address text NOT NULL,
    order_number text,
    buyer_reward numeric NOT NULL,
    season numeric NOT NULL,
    date date NOT NULL
);
COMMENT ON TABLE robot."order" IS 'Orders for ROBOT rewards';
CREATE TABLE robot.product (
    id text NOT NULL,
    shopify_id text,
    title text NOT NULL,
    nft_metadata jsonb
);
COMMENT ON TABLE robot.product IS 'Products for ROBOT designer rewards';
CREATE TABLE robot.product_designer (
    contribution_share numeric NOT NULL,
    eth_address text NOT NULL,
    product_id text NOT NULL,
    robot_reward numeric NOT NULL,
    designer_name text
);
COMMENT ON TABLE robot.product_designer IS 'Designer receiving ROBOT rewards';
CREATE TABLE shop.api_users (
    username text NOT NULL,
    password_hash text NOT NULL
);
CREATE TABLE shop.product_locks (
    customer_eth_address text,
    access_code text NOT NULL,
    lock_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.contribution_votes
    ADD CONSTRAINT contribution_votes_pkey PRIMARY KEY (user_id, contribution_id);
ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.contributors
    ADD CONSTRAINT contributors_pkey PRIMARY KEY (contribution_id, user_id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_eth_address_key UNIQUE (eth_address);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY robot."order"
    ADD CONSTRAINT order_pkey PRIMARY KEY (order_id);
ALTER TABLE ONLY robot.product_designer
    ADD CONSTRAINT product_designer_pkey PRIMARY KEY (eth_address, product_id);
ALTER TABLE ONLY robot.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);
ALTER TABLE ONLY shop.api_users
    ADD CONSTRAINT api_users_password_hash_key UNIQUE (password_hash);
ALTER TABLE ONLY shop.api_users
    ADD CONSTRAINT api_users_pkey PRIMARY KEY (username);
ALTER TABLE ONLY shop.product_locks
    ADD CONSTRAINT product_locks_pkey PRIMARY KEY (access_code, lock_id);
ALTER TABLE ONLY public.contribution_votes
    ADD CONSTRAINT contribution_votes_contribution_id_fkey FOREIGN KEY (contribution_id) REFERENCES public.contributions(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.contribution_votes
    ADD CONSTRAINT contribution_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.contributors
    ADD CONSTRAINT contributors_contribution_id_fkey FOREIGN KEY (contribution_id) REFERENCES public.contributions(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.contributors
    ADD CONSTRAINT contributors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY robot.product_designer
    ADD CONSTRAINT product_designer_product_id_fkey FOREIGN KEY (product_id) REFERENCES robot.product(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
