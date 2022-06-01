CREATE SCHEMA "omni";

CREATE TYPE "omni"."products_stage" AS ENUM (
  'submitted',
  'vote',
  'not_enough_votes',
  'design',
  'production',
  'sampling'
);

CREATE TYPE "omni"."sale_types" AS ENUM (
  'open_edition',
  'limited_run'
);

CREATE TYPE "omni"."wearable_types" AS ENUM (
  'png',
  'glb',
  'vox'
);

CREATE TYPE "omni"."collaborator_types" AS ENUM (
  'designer',
  'technician',
  'brand'
);

CREATE TYPE "omni"."brand_statuses" AS ENUM (
  'new',
  'first_drop',
  'robot'
);

CREATE TYPE "omni"."producer_statuses" AS ENUM (
  'current_partner'
);

CREATE TYPE "omni"."production_styles" AS ENUM (
  't_shirt_ss'
);

CREATE TYPE "omni"."production_genders" AS ENUM (
  'male',
  'female',
  'unisex'
);

CREATE TYPE "omni"."production_pallettes" AS ENUM (
  'bwg'
);

CREATE TYPE "omni"."print_techs" AS ENUM (
  'embroidery'
);

CREATE TYPE "omni"."production_materials_ratings" AS ENUM (
  'best',
  'good',
  'not_so_good'
);

CREATE TYPE "omni"."timezones" AS ENUM (
  'pacific_us',
  'mountain_us',
  'central_us',
  'eastern_us'
);

CREATE TYPE "omni"."user_statuses" AS ENUM (
  'active',
  'inactive'
);

CREATE TYPE "omni"."user_skill_types" AS ENUM (
  'production_supply',
  'templating',
  'art_optimization',
  'fashion_design',
  'clo3d',
  'client_relationships',
  'notion',
  'training',
  'coordination',
  'engineering'
);

CREATE TABLE "omni"."products" (
  "id" uuid PRIMARY KEY,
  "name" text,
  "shop_description" text,
  "sale_type" text,
  "price" uuid,
  "production_cost" uuid,
  "total_sales" uuid,
  "quantity" bigint,
  "stage" text,
  "asset_files" text,
  "brand_reward_share" numeric,
  "collaborator_reward_share" numeric,
  "discord_channel_id" text,
  "shopify_id" text,
  "notion_id" text,
  "brand" uuid,
  "producer" uuid,
  "fullfillment" uuid,
  "production_material" uuid,
  "created_at" timestamptz DEFAULT 'now()',
  "updated_at" timestamptz DEFAULT 'now()'
);

CREATE TABLE "omni"."users" (
  "id" uuid PRIMARY KEY,
  "name" text,
  "status" text,
  "eth_address" text,
  "timezone" text,
  "discord_handle" text,
  "discord_id" text,
  "twitter_handle" text,
  "github_handle" text,
  "created_at" timestamptz DEFAULT 'now()',
  "updated_at" timestamptz DEFAULT 'now()'
);

CREATE TABLE "omni"."producers" (
  "id" uuid PRIMARY KEY,
  "status" text,
  "name" text,
  "email" text,
  "address" text,
  "eth_address" text,
  "products" uuid,
  "created_at" timestamptz DEFAULT 'now()',
  "updated_at" timestamptz DEFAULT 'now()'
);

CREATE TABLE "omni"."fullfillers" (
  "id" uuid PRIMARY KEY,
  "name" text,
  "address" text,
  "email" text,
  "website_url" text,
  "eth_address" text,
  "created_at" timestamptz DEFAULT 'now()',
  "updated_at" timestamptz DEFAULT 'now()'
);

CREATE TABLE "omni"."brands" (
  "id" uuid PRIMARY KEY,
  "name" text,
  "logo" text,
  "description" text,
  "website_url" text,
  "discord_url" text,
  "twitter_url" text,
  "status" text,
  "eth_address" text,
  "created_at" timestamptz DEFAULT 'now()',
  "updated_at" timestamptz DEFAULT 'now()'
);

CREATE TABLE "omni"."production_methods" (
  "id" uuid PRIMARY KEY,
  "name" text,
  "description" text,
  "created_at" timestamptz DEFAULT 'now()',
  "updated_at" timestamptz DEFAULT 'now()'
);

CREATE TABLE "omni"."production_methods_products" (
  "id" uuid PRIMARY KEY,
  "product" uuid,
  "production_method" uuid
);

CREATE TABLE "omni"."production_materials" (
  "id" uuid PRIMARY KEY,
  "style_number" text,
  "style" text,
  "type" text,
  "name" text,
  "description" text,
  "composition" text,
  "base_price" numeric,
  "gender" text,
  "pallette" text,
  "print_tech" text,
  "rating" text,
  "neck_tag" boolean,
  "size_guide" text,
  "products" uuid,
  "created_at" timestamptz DEFAULT 'now()',
  "updated_at" timestamptz DEFAULT 'now()'
);

CREATE TABLE "omni"."price_currencies" (
  "id" uuid PRIMARY KEY,
  "price" numeric,
  "currency" text
);

CREATE TABLE "omni"."wearable_files" (
  "id" uuid PRIMARY KEY,
  "product" uuid,
  "type" text,
  "file" text
);

CREATE TABLE "omni"."product_types_enum" (
  "value" text PRIMARY KEY,
  "description" text DEFAULT ''
);

CREATE TABLE "omni"."production_methods_producers" (
  "id" uuid PRIMARY KEY,
  "producer" uuid,
  "production_method" uuid
);

CREATE TABLE "omni"."production_materials_producers" (
  "id" uuid PRIMARY KEY,
  "producer" uuid,
  "production_material" uuid
);

CREATE TABLE "omni"."product_collaborators" (
  "id" uuid PRIMARY KEY,
  "product" uuid,
  "collaborator" uuid,
  "type" text,
  "collaboration_share" numeric
);

CREATE TABLE "omni"."brand_users" (
  "id" uuid PRIMARY KEY,
  "brand" uuid,
  "collaborator" uuid
);

CREATE TABLE "omni"."user_skills" (
  "id" uuid PRIMARY KEY,
  "user" uuid,
  "skill" text
);

CREATE TABLE "omni"."products_stage_enum" (
  "value" text PRIMARY KEY,
  "description" text DEFAULT ''
);

INSERT INTO omni.products_stage_enum (value) (SELECT unnest(enum_range(NULL::omni.products_stage))::text);
DROP TYPE omni.products_stage;

CREATE TABLE "omni"."sale_types_enum" (
  "value" text PRIMARY KEY,
  "description" text DEFAULT ''
);

INSERT INTO omni.sale_types_enum (value) (SELECT unnest(enum_range(NULL::omni.sale_types))::text);
DROP TYPE omni.sale_types;

CREATE TABLE "omni"."wearable_types_enum" (
  "value" text PRIMARY KEY,
  "description" text DEFAULT ''
);

INSERT INTO omni.wearable_types_enum (value) (SELECT unnest(enum_range(NULL::omni.wearable_types))::text);
DROP TYPE omni.wearable_types;

CREATE TABLE "omni"."collaborator_types_enum" (
  "value" text PRIMARY KEY,
  "description" text DEFAULT ''
);

INSERT INTO omni.collaborator_types_enum (value) (SELECT unnest(enum_range(NULL::omni.collaborator_types))::text);
DROP TYPE omni.collaborator_types;

CREATE TABLE "omni"."brand_statuses_enum" (
  "value" text PRIMARY KEY,
  "description" text DEFAULT ''
);
INSERT INTO omni.brand_statuses_enum (value) (SELECT unnest(enum_range(NULL::omni.brand_statuses))::text);
DROP TYPE omni.brand_statuses;

CREATE TABLE "omni"."producer_statuses_enum" (
  "value" text PRIMARY KEY,
  "description" text DEFAULT ''
);
INSERT INTO omni.producer_statuses_enum (value) (SELECT unnest(enum_range(NULL::omni.producer_statuses))::text);
DROP TYPE omni.producer_statuses;

CREATE TABLE "omni"."production_styles_enum" (
  "value" text PRIMARY KEY,
  "description" text DEFAULT ''
);
INSERT INTO omni.production_styles_enum (value) (SELECT unnest(enum_range(NULL::omni.production_styles))::text);
DROP TYPE omni.production_styles;

CREATE TABLE "omni"."production_genders_enum" (
  "value" text PRIMARY KEY,
  "description" text DEFAULT ''
);
INSERT INTO omni.production_genders_enum (value) (SELECT unnest(enum_range(NULL::omni.production_genders))::text);
DROP TYPE omni.production_genders;

CREATE TABLE "omni"."production_pallettes_enum" (
  "value" text PRIMARY KEY,
  "description" text DEFAULT ''
);
INSERT INTO omni.production_pallettes_enum (value) (SELECT unnest(enum_range(NULL::omni.production_pallettes))::text);
DROP TYPE omni.production_pallettes;

CREATE TABLE "omni"."print_techs_enum" (
  "value" text PRIMARY KEY,
  "description" text DEFAULT ''
);
INSERT INTO omni.print_techs_enum (value) (SELECT unnest(enum_range(NULL::omni.print_techs))::text);
DROP TYPE omni.print_techs;

CREATE TABLE "omni"."production_materials_ratings_enum" (
  "value" text PRIMARY KEY,
  "description" text DEFAULT ''
);
INSERT INTO omni.production_materials_ratings_enum (value) (SELECT unnest(enum_range(NULL::omni.production_materials_ratings))::text);
DROP TYPE omni.production_materials_ratings;

CREATE TABLE "omni"."timezones_enum" (
  "value" text PRIMARY KEY,
  "description" text DEFAULT ''
);
INSERT INTO omni.timezones_enum (value) (SELECT unnest(enum_range(NULL::omni.timezones))::text);
DROP TYPE omni.timezones;

CREATE TABLE "omni"."user_statuses_enum" (
  "value" text PRIMARY KEY,
  "description" text DEFAULT ''
);
INSERT INTO omni.user_statuses_enum (value) (SELECT unnest(enum_range(NULL::omni.user_statuses))::text);
DROP TYPE omni.user_statuses;

CREATE TABLE "omni"."user_skill_types_enum" (
  "value" text PRIMARY KEY,
  "description" text DEFAULT ''
);
INSERT INTO omni.user_skill_types_enum (value) (SELECT unnest(enum_range(NULL::omni.user_skill_types))::text);
DROP TYPE omni.user_skill_types;

COMMENT ON COLUMN "omni"."products"."quantity" IS 'could be null before drop';

COMMENT ON COLUMN "omni"."products"."asset_files" IS 'link to drive of asset files related to project';

COMMENT ON COLUMN "omni"."products"."created_at" IS 'on create';

COMMENT ON COLUMN "omni"."products"."updated_at" IS 'on touch';

COMMENT ON COLUMN "omni"."users"."created_at" IS 'on create';

COMMENT ON COLUMN "omni"."users"."updated_at" IS 'on touch';

COMMENT ON COLUMN "omni"."producers"."created_at" IS 'on create';

COMMENT ON COLUMN "omni"."producers"."updated_at" IS 'on touch';

COMMENT ON COLUMN "omni"."fullfillers"."created_at" IS 'on create';

COMMENT ON COLUMN "omni"."fullfillers"."updated_at" IS 'on touch';

COMMENT ON COLUMN "omni"."brands"."logo" IS 'link to logo image';

COMMENT ON COLUMN "omni"."brands"."created_at" IS 'on create';

COMMENT ON COLUMN "omni"."brands"."updated_at" IS 'on touch';

COMMENT ON COLUMN "omni"."production_methods"."created_at" IS 'on create';

COMMENT ON COLUMN "omni"."production_methods"."updated_at" IS 'on touch';

COMMENT ON COLUMN "omni"."production_materials"."size_guide" IS 'link to guide';

COMMENT ON COLUMN "omni"."production_materials"."created_at" IS 'on create';

COMMENT ON COLUMN "omni"."production_materials"."updated_at" IS 'on touch';

COMMENT ON COLUMN "omni"."price_currencies"."currency" IS 'enum?';

ALTER TABLE "omni"."products" ADD FOREIGN KEY ("sale_type") REFERENCES "omni"."sale_types_enum" ("value");

ALTER TABLE "omni"."products" ADD FOREIGN KEY ("price") REFERENCES "omni"."price_currencies" ("id");

ALTER TABLE "omni"."products" ADD FOREIGN KEY ("production_cost") REFERENCES "omni"."price_currencies" ("id");

ALTER TABLE "omni"."products" ADD FOREIGN KEY ("total_sales") REFERENCES "omni"."price_currencies" ("id");

ALTER TABLE "omni"."products" ADD FOREIGN KEY ("stage") REFERENCES "omni"."products_stage_enum" ("value");

ALTER TABLE "omni"."products" ADD FOREIGN KEY ("brand") REFERENCES "omni"."brands" ("id");

ALTER TABLE "omni"."products" ADD FOREIGN KEY ("producer") REFERENCES "omni"."producers" ("id");

ALTER TABLE "omni"."products" ADD FOREIGN KEY ("fullfillment") REFERENCES "omni"."fullfillers" ("id");

ALTER TABLE "omni"."products" ADD FOREIGN KEY ("production_material") REFERENCES "omni"."production_materials" ("id");

ALTER TABLE "omni"."users" ADD FOREIGN KEY ("status") REFERENCES "omni"."user_statuses_enum" ("value");

ALTER TABLE "omni"."users" ADD FOREIGN KEY ("timezone") REFERENCES "omni"."timezones_enum" ("value");

ALTER TABLE "omni"."producers" ADD FOREIGN KEY ("status") REFERENCES "omni"."producer_statuses_enum" ("value");

ALTER TABLE "omni"."producers" ADD FOREIGN KEY ("products") REFERENCES "omni"."products" ("id");

ALTER TABLE "omni"."brands" ADD FOREIGN KEY ("status") REFERENCES "omni"."brand_statuses_enum" ("value");

ALTER TABLE "omni"."production_methods_products" ADD FOREIGN KEY ("product") REFERENCES "omni"."products" ("id");

ALTER TABLE "omni"."production_methods_products" ADD FOREIGN KEY ("production_method") REFERENCES "omni"."production_methods" ("id");

ALTER TABLE "omni"."production_materials" ADD FOREIGN KEY ("style") REFERENCES "omni"."production_styles_enum" ("value");

ALTER TABLE "omni"."production_materials" ADD FOREIGN KEY ("type") REFERENCES "omni"."product_types_enum" ("value");

ALTER TABLE "omni"."production_materials" ADD FOREIGN KEY ("gender") REFERENCES "omni"."production_genders_enum" ("value");

ALTER TABLE "omni"."production_materials" ADD FOREIGN KEY ("pallette") REFERENCES "omni"."production_pallettes_enum" ("value");

ALTER TABLE "omni"."production_materials" ADD FOREIGN KEY ("print_tech") REFERENCES "omni"."print_techs_enum" ("value");

ALTER TABLE "omni"."production_materials" ADD FOREIGN KEY ("rating") REFERENCES "omni"."production_materials_ratings_enum" ("value");

ALTER TABLE "omni"."production_materials" ADD FOREIGN KEY ("products") REFERENCES "omni"."products" ("id");

ALTER TABLE "omni"."wearable_files" ADD FOREIGN KEY ("product") REFERENCES "omni"."products" ("id");

ALTER TABLE "omni"."wearable_files" ADD FOREIGN KEY ("type") REFERENCES "omni"."wearable_types_enum" ("value");

ALTER TABLE "omni"."production_methods_producers" ADD FOREIGN KEY ("producer") REFERENCES "omni"."producers" ("id");

ALTER TABLE "omni"."production_methods_producers" ADD FOREIGN KEY ("production_method") REFERENCES "omni"."production_methods" ("id");

ALTER TABLE "omni"."production_materials_producers" ADD FOREIGN KEY ("producer") REFERENCES "omni"."producers" ("id");

ALTER TABLE "omni"."production_materials_producers" ADD FOREIGN KEY ("production_material") REFERENCES "omni"."production_materials" ("id");

ALTER TABLE "omni"."product_collaborators" ADD FOREIGN KEY ("product") REFERENCES "omni"."products" ("id");

ALTER TABLE "omni"."product_collaborators" ADD FOREIGN KEY ("collaborator") REFERENCES "omni"."users" ("id");

ALTER TABLE "omni"."product_collaborators" ADD FOREIGN KEY ("type") REFERENCES "omni"."collaborator_types_enum" ("value");

ALTER TABLE "omni"."brand_users" ADD FOREIGN KEY ("brand") REFERENCES "omni"."brands" ("id");

ALTER TABLE "omni"."brand_users" ADD FOREIGN KEY ("collaborator") REFERENCES "omni"."users" ("id");

ALTER TABLE "omni"."user_skills" ADD FOREIGN KEY ("user") REFERENCES "omni"."users" ("id");

ALTER TABLE "omni"."user_skills" ADD FOREIGN KEY ("skill") REFERENCES "omni"."user_skill_types_enum" ("value");
