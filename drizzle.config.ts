import type { Config } from "drizzle-kit"

export default {
  dialect: "sqlite",
  schema: "electron/schema.ts",
  out: "./drizzle",
} satisfies Config
