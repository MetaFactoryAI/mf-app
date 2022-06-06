
alter table "omni"."producers"
  add constraint "producers_products_fkey"
  foreign key (products)
  references "omni"."products"
  (id) on update no action on delete no action;
alter table "omni"."producers" alter column "products" drop not null;
alter table "omni"."producers" add column "products" uuid;

alter table "omni"."product_collaborators" drop constraint "product_collaborators_product_collaborator_type_key";

ALTER TABLE "omni"."product_collaborators" ALTER COLUMN "id" drop default;

alter table "omni"."brand_users" drop constraint "brand_users_brand_collaborator_key";

ALTER TABLE "omni"."brand_users" ALTER COLUMN "id" drop default;

ALTER TABLE "omni"."fullfillers" ALTER COLUMN "id" drop default;

ALTER TABLE "omni"."users" ALTER COLUMN "id" drop default;

alter table "omni"."products" alter column "updated_at" set default '2022-06-03 01:55:48.128024+00'::timestamp with time zone;

alter table "omni"."products" alter column "created_at" set default '2022-06-03 01:55:48.128024+00'::timestamp with time zone;

alter table "omni"."brands" alter column "updated_at" set default '2022-06-03 01:55:48.128024+00'::timestamp with time zone;

alter table "omni"."brands" alter column "created_at" drop not null;
alter table "omni"."brands" alter column "created_at" set default '2022-06-03 01:55:48.128024+00'::timestamp with time zone;

alter table "omni"."products"
  add constraint "products_total_sales_fkey"
  foreign key (total_sales)
  references "omni"."price_currencies"
  (id) on update no action on delete no action;
alter table "omni"."products" alter column "total_sales" drop not null;
alter table "omni"."products" add column "total_sales" uuid;

ALTER TABLE "omni"."brands" ALTER COLUMN "id" drop default;

ALTER TABLE "omni"."price_currencies" ALTER COLUMN "id" drop default;

alter table "omni"."price_currencies" alter column "currency" drop not null;

alter table "omni"."price_currencies" alter column "price" drop not null;

ALTER TABLE "omni"."products" ALTER COLUMN "id" drop default;
