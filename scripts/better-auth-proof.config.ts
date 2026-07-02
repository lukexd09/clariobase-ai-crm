import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createProofAuth } from "./better-auth-proof-auth";

const connectionString = process.env.BETTER_AUTH_PROOF_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("BETTER_AUTH_PROOF_DATABASE_URL or DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

export const auth = createProofAuth(prisma, true);

