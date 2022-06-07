
CREATE TABLE "robot"."merkle_roots" ("created_at" timestamptz NOT NULL DEFAULT now(), "hash" text NOT NULL, "network" text NOT NULL, "contract_address" text NOT NULL, PRIMARY KEY ("hash") , UNIQUE ("hash"));COMMENT ON TABLE "robot"."merkle_roots" IS E'Each merkle root corresponds to a distribution in the giveaway contract';

CREATE TABLE "robot"."merkle_claims" ("recipient_eth_address" text NOT NULL, "claim_json" jsonb NOT NULL, "merkle_root_hash" text NOT NULL, "id" uuid NOT NULL DEFAULT gen_random_uuid(), PRIMARY KEY ("id") , FOREIGN KEY ("merkle_root_hash") REFERENCES "robot"."merkle_roots"("hash") ON UPDATE restrict ON DELETE restrict);COMMENT ON TABLE "robot"."merkle_claims" IS E'Claim data for recipients in a merkle giveaway';
CREATE EXTENSION IF NOT EXISTS pgcrypto;

alter table "robot"."merkle_claims" drop constraint "merkle_claims_merkle_root_hash_fkey",
  add constraint "merkle_claims_merkle_root_hash_fkey"
  foreign key ("merkle_root_hash")
  references "robot"."merkle_roots"
  ("hash") on update restrict on delete cascade;
