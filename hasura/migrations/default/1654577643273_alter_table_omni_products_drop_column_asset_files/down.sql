alter table "omni"."products" alter column "asset_files" drop not null;
alter table "omni"."products" add column "asset_files" text;
