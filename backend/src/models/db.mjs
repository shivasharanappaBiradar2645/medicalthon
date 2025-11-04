import {Pool} from "pg";
import {drizzle} from "drizzle-orm/node-postgres";
import * as schema from "./schema.mjs";
import { DATABASE_URL } from "../config.mjs";

const pool = new Pool({
    connectionString: DATABASE_URL,
});

export const db = drizzle(pool,{
    schema
});