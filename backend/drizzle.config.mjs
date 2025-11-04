import { defineConfig } from "drizzle-kit";
import 'dotenv/config';

const Dburl = process.env.DATABASE_URL

export default defineConfig({
dialect: "postgresql",
schema: "./src/models/schema.mjs",
out: "./drizzle",
dbCredentials: {
url: Dburl}
});