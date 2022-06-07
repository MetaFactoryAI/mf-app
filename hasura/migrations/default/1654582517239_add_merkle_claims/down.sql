
alter table "robot"."merkle_claims" drop constraint "merkle_claims_merkle_root_hash_fkey",
  add constraint "merkle_claims_merkle_root_hash_fkey"
  foreign key ("merkle_root_hash")
  references "robot"."merkle_roots"
  ("hash") on update restrict on delete restrict;

DROP TABLE "robot"."merkle_claims";

DROP TABLE "robot"."merkle_roots";
