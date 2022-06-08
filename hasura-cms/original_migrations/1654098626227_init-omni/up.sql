-- CREATE TYPE "public"."products_stage" AS ENUM (
--     'submitted',
--     'vote',
--     'not_enough_votes',
--     'design',
--     'production',
--     'sampling'
--     );
--
-- CREATE TYPE "public"."sale_types" AS ENUM (
--     'open_edition',
--     'limited_run'
--     );
--
-- CREATE TYPE "public"."collaborator_types" AS ENUM (
--     'designer',
--     'technician',
--     'brand'
--     );
--
-- CREATE TYPE "public"."production_styles" AS ENUM (
--     't_shirt_ss'
--     );
--
-- CREATE TYPE "public"."production_pallettes" AS ENUM (
--     'bwg'
--     );
--
-- CREATE TYPE "public"."print_techs" AS ENUM (
--     'embroidery'
--     );
--
--
-- CREATE TYPE "public"."timezones" AS ENUM (
--     'pacific_us',
--     'mountain_us',
--     'central_us',
--     'eastern_us'
--     );


-- CREATE TYPE "public"."user_skill_types" AS ENUM (
--     'production_supply',
--     'templating',
--     'art_optimization',
--     'fashion_design',
--     'clo3d',
--     'client_relationships',
--     'notion',
--     'training',
--     'coordination',
--     'engineering'
--     );

CREATE TABLE "public"."products"
(
    "id" BIGSERIAL PRIMARY KEY,
    "name"                      text,
    "shop_description"          text,
    "sale_type"                 text,
    "price"                     bigint,
    "production_cost"           bigint,
    "quantity"                  bigint,
    "stage"                     text,
    "brand_reward_share"        numeric,
    "collaborator_reward_share" numeric,
    "discord_channel_id"        text,
    "shopify_id"                text,
    "notion_id"                 text,
    "brand_id"                     bigint,
    "producer_id"                  bigint,
    "fulfiller_id"              bigint,
    "created_at"                timestamptz
);


-- CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
-- RETURNS TRIGGER AS $$
-- DECLARE
-- _new record;
-- BEGIN
-- _new := NEW;
-- _new."updated_at" = NOW();
--   RETURN _new;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- DO $$
-- BEGIN
-- CREATE TRIGGER "set_public_burns_updated_at"
--     BEFORE UPDATE ON "public"."burns"
--     FOR EACH ROW
--     EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
-- COMMENT ON TRIGGER "set_public_burns_updated_at" ON "public"."burns"
--     IS 'trigger to set value of column "updated_at" to current timestamp on row update';
-- EXCEPTION
--     WHEN duplicate_object THEN
--         RAISE NOTICE 'updated_at trigger already exists. Ignoring...';
-- END$$;


CREATE TABLE "public"."users"
(
    "id"             BIGSERIAL PRIMARY KEY,
    "name"           text,
    "eth_address"    text,
    "timezone"       text,
    "discord_handle" text,
    "discord_id"     text,
    "twitter_handle" text,
    "github_handle"  text,
    "created_at"     timestamptz
);

CREATE TABLE "public"."producers"
(
    "id"          BIGSERIAL PRIMARY KEY,
    "name"        text,
    "email"       text,
    "address"     text,
    "eth_address" text,
    "created_at"  timestamptz
);

CREATE TABLE "public"."fulfillers"
(
    "id"          BIGSERIAL PRIMARY KEY,
    "name"        text,
    "address"     text,
    "email"       text,
    "website_url" text,
    "eth_address" text,
    "created_at"  timestamptz
);

CREATE TABLE "public"."brands"
(
    "id"          BIGSERIAL PRIMARY KEY,
    "name"        text,
    "description" text,
    "website_url" text,
    "discord_url" text,
    "twitter_url" text,
    "eth_address" text,
    "created_at"  timestamptz
);

CREATE TABLE "public"."production_methods"
(
    "id"          BIGSERIAL PRIMARY KEY,
    "name"        text,
    "description" text,
    "created_at"  timestamptz
);

CREATE TABLE "public"."production_methods_products"
(
    "id"                   BIGSERIAL PRIMARY KEY,
    "product_id"           bigint,
    "production_method_id" bigint
);

CREATE TABLE "public"."production_materials"
(
    "id"           BIGSERIAL PRIMARY KEY,
    "style_number" text,
    "style"        text,
    "type"         text,
    "name"         text,
    "description"  text,
    "composition"  text,
    "base_price"   numeric,
    "gender"       text,
    "palette"      text,
    "print_tech"   text,
    "rating"       text,
    "neck_tag"     boolean,
    "size_guide"   text,
    "created_at"   timestamptz
);

CREATE TABLE "public"."price_currencies"
(
    "id"       BIGSERIAL PRIMARY KEY,
    "amount"    numeric NOT NULL,
    "currency" text    NOT NULL
);

CREATE TABLE "public"."production_methods_producers"
(
    "id"                   BIGSERIAL PRIMARY KEY,
    "producer_id"          bigint,
    "production_method_id" bigint
);

CREATE TABLE "public"."production_materials_producers"
(
    "id"                     BIGSERIAL PRIMARY KEY,
    "producer_id"            bigint,
    "production_material_id" bigint
);

CREATE TABLE "public"."product_collaborators"
(
    "id"                  BIGSERIAL PRIMARY KEY,
    "product_id"          bigint,
    "collaborator_id"     bigint,
    "type"                text,
    "collaboration_share" numeric
);

CREATE TABLE "public"."brand_users"
(
    "id"       BIGSERIAL PRIMARY KEY,
    "brand_id" bigint,
    "user_id"  bigint
);

CREATE TABLE "public"."skills"
(
    "id"          BIGSERIAL PRIMARY KEY,
    "name"        text NOT NULL,
    "description" text
);

CREATE TABLE "public"."user_skills"
(
    "id"    BIGSERIAL PRIMARY KEY,
    "user_id"  bigint,
    "skill_id" bigint
);

ALTER TABLE "public"."products"
    ADD FOREIGN KEY ("price") REFERENCES "public"."price_currencies" ("id");

ALTER TABLE "public"."products"
    ADD FOREIGN KEY ("production_cost") REFERENCES "public"."price_currencies" ("id");

ALTER TABLE "public"."products"
    ADD FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");

ALTER TABLE "public"."products"
    ADD FOREIGN KEY ("producer_id") REFERENCES "public"."producers" ("id");

ALTER TABLE "public"."products"
    ADD FOREIGN KEY ("fulfiller_id") REFERENCES "public"."fulfillers" ("id");

ALTER TABLE "public"."production_methods_products"
    ADD FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");

ALTER TABLE "public"."production_methods_products"
    ADD FOREIGN KEY ("production_method_id") REFERENCES "public"."production_methods" ("id");

ALTER TABLE "public"."production_methods_producers"
    ADD FOREIGN KEY ("producer_id") REFERENCES "public"."producers" ("id");

ALTER TABLE "public"."production_methods_producers"
    ADD FOREIGN KEY ("production_method_id") REFERENCES "public"."production_methods" ("id");

ALTER TABLE "public"."production_materials_producers"
    ADD FOREIGN KEY ("producer_id") REFERENCES "public"."producers" ("id");

ALTER TABLE "public"."production_materials_producers"
    ADD FOREIGN KEY ("production_material_id") REFERENCES "public"."production_materials" ("id");

ALTER TABLE "public"."product_collaborators"
    ADD FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id");

ALTER TABLE "public"."product_collaborators"
    ADD FOREIGN KEY ("collaborator_id") REFERENCES "public"."users" ("id");

ALTER TABLE "public"."brand_users"
    ADD FOREIGN KEY ("brand_id") REFERENCES "public"."brands" ("id");

ALTER TABLE "public"."brand_users"
    ADD FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id");

ALTER TABLE "public"."brand_users"
    add constraint "brand_users_brand_collaborator_key" unique ("brand_id", "user_id");

ALTER TABLE "public"."user_skills"
    ADD FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id");

ALTER TABLE "public"."user_skills"
    ADD FOREIGN KEY ("skill_id") REFERENCES "public"."skills" ("id");
