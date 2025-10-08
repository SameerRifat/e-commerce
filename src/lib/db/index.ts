// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema/index';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Create connection pool for transaction support
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL!,
  ssl: true
});

export const db = drizzle(pool, { schema });

// Export the pool for direct usage if needed
export { pool };

// // src/lib/db/index.ts
// import { drizzle } from 'drizzle-orm/neon-http';
// import { neon } from '@neondatabase/serverless';
// import * as schema from './schema/index';

// import * as dotenv from 'dotenv';

// dotenv.config({ path: '.env.local' })

// const sql = neon(process.env.DATABASE_URL!);
// export const db = drizzle(sql, { schema });
