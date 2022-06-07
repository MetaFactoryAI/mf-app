
-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- DROP table "omni"."wearable_types_enum";

-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- DROP table "omni"."wearable_files";

alter table "omni"."wearable_files"
  add constraint "wearable_files_product_fkey"
  foreign key ("product")
  references "omni"."products"
  ("id") on update no action on delete no action;

alter table "omni"."wearable_files"
  add constraint "wearable_files_type_fkey"
  foreign key ("type")
  references "omni"."wearable_types_enum"
  ("value") on update no action on delete no action;

alter table "omni"."products"
  add constraint "products_production_material_fkey"
  foreign key (production_material)
  references "omni"."production_materials"
  (id) on update no action on delete no action;
alter table "omni"."products" alter column "production_material" drop not null;
alter table "omni"."products" add column "production_material" uuid;

alter table "omni"."production_materials"
  add constraint "production_materials_products_fkey"
  foreign key (products)
  references "omni"."products"
  (id) on update no action on delete no action;
alter table "omni"."production_materials" alter column "products" drop not null;
alter table "omni"."production_materials" add column "products" uuid;
