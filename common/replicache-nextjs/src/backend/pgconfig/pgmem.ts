import type { Pool } from "pg";
import { newDb } from "pg-mem";
import type { PGConfig } from "./pgconfig.js";

export class PGMemConfig implements PGConfig {
  constructor() {
    console.log("Creating PGMemConfig");
  }

  initPool(): Pool {
    return new (newDb().adapters.createPg().Pool)() as Pool;
  }

  async getSchemaVersion(): Promise<number> {
    // pg-mem lacks the system tables we normally use to introspect our
    // version. Luckily since pg-mem is in memory, we know that everytime we
    // start, we're starting fresh :).
    return 0;
  }
}
