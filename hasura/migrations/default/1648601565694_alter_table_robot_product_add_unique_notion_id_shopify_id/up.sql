alter table "robot"."product" drop constraint "product_notion_id_key";
alter table "robot"."product" add constraint "product_notion_id_shopify_id_key" unique ("notion_id", "shopify_id");
