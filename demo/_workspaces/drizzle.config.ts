import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./utils/db/schema/index.ts",
  out: "./public/migrations",
  dialect: "postgresql",
  driver: "pglite",
  // For pglite, credentials are not needed as it runs in the browser
})

