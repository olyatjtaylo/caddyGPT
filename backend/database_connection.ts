
// db/connection.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

// Load environment variables
const connectionString = process.env.DATABASE_URL || 
  `postgresql://[username]:[password]@caddygpt.crsoq44w6i2d.us-west-1.rds.amazonaws.com:5432/caddygpt`;

// Create connection pool with retries
const createPoolWithRetries = (retries = 5) => {
  let attempts = 0;

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false // For development - adjust for production
    },
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000 // Close idle clients after 30 seconds
  });

  const connectWithRetry = async () => {
    try {
      await pool.connect();
      console.log('Database connection established successfully');
    } catch (error) {
      attempts += 1;
      console.error(`Database connection failed (Attempt ${attempts}/${retries}):`, error);
      if (attempts < retries) {
        console.log('Retrying database connection...');
        setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
      } else {
        console.error('Max retries reached. Exiting...');
        process.exit(1);
      }
    }
  };

  connectWithRetry();
  return pool;
};

// Export the pool
const db = drizzle(createPoolWithRetries());
export default db;
