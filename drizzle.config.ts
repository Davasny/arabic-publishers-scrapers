import type { Config } from "drizzle-kit";

const config: Config = {
  dialect: "sqlite",
  schema: "src/storage/schema.ts",
  dbCredentials: {
    url: "file:storage.db",
  },
};

export default config;
