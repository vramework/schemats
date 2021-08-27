DROP SCHEMA IF EXISTS "pet_store" CASCADE;
CREATE SCHEMA "pet_store";

CREATE TYPE "pet_store"."animal" AS enum (
  'cat',
  'dog'
);

CREATE TABLE "pet_store"."user" (
  "uuid" uuid PRIMARY KEY default gen_random_uuid(),
  "name" text NOT NULL
);

CREATE TABLE "pet_store"."pet" (
  "uuid" uuid PRIMARY KEY default gen_random_uuid(),
  "owner" uuid REFERENCES "pet_store"."user",
  "type" pet_store.animal NOT NULL,
  "name" text NOT NULL,
  "birthdate" date,
  "last_seen_location" point,
  "random_facts" jsonb,
  "more_random_facts" jsonb
);
COMMENT ON COLUMN pet_store.pet.random_facts is '@type {RandomPetFacts}';