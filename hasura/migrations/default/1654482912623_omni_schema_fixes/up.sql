
alter table "omni"."products" alter column "id" set default gen_random_uuid();

alter table "omni"."price_currencies" alter column "price" set not null;

alter table "omni"."price_currencies" alter column "currency" set not null;

alter table "omni"."price_currencies" alter column "id" set default gen_random_uuid();

alter table "omni"."brands" alter column "id" set default gen_random_uuid();

alter table "omni"."products" drop column "total_sales" cascade;

alter table "omni"."brands" alter column "created_at" set default now();
alter table "omni"."brands" alter column "created_at" set not null;

alter table "omni"."brands" alter column "updated_at" set default now();

alter table "omni"."products" alter column "created_at" set default now();

alter table "omni"."products" alter column "updated_at" set default now();

alter table "omni"."users" alter column "id" set default gen_random_uuid();

alter table "omni"."fullfillers" alter column "id" set default gen_random_uuid();

alter table "omni"."brand_users" alter column "id" set default gen_random_uuid();

alter table "omni"."brand_users" add constraint "brand_users_brand_collaborator_key" unique ("brand", "collaborator");

alter table "omni"."product_collaborators" alter column "id" set default gen_random_uuid();

alter table "omni"."product_collaborators" add constraint "product_collaborators_product_collaborator_type_key" unique ("product", "collaborator", "type");

alter table "omni"."producers" drop column "products" cascade;
