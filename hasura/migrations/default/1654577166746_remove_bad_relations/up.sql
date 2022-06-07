
alter table "omni"."production_materials" drop column "products" cascade;

alter table "omni"."products" drop column "production_material" cascade;

alter table "omni"."wearable_files" drop constraint "wearable_files_type_fkey";

alter table "omni"."wearable_files" drop constraint "wearable_files_product_fkey";

DROP table "omni"."wearable_files";

DROP table "omni"."wearable_types_enum";
