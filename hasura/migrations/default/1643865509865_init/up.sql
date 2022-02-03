SET check_function_bodies = false;
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
