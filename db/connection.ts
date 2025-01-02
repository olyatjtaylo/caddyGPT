// db/connection.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

// Load environment variables
const connectionString = process.env.DATABASE_URL || 
  `postgresql://[username]:[password]@caddygpt.crsoq44w6i2d.us-west-1.rds.amazonaws.com:5432/caddygpt`;

// Create connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // For development - adjust for production
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create drizzle database instance
export const db = drizzle(pool);

// Test connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to database');
    client.release();
    return true;
  } catch (err) {
    console.error('Error connecting to database:', err);
    return false;
  }
}

// Schema definitions
import { pgTable, serial, text, integer, decimal } from 'drizzle-orm/pg-core';

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location'),
  par: integer('par'),
  yardage: integer('yardage'),
  rating: decimal('rating'),
  slope: integer('slope'),
});

export const holes = pgTable('holes', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id),
  holeNumber: integer('hole_number').notNull(),
  par: integer('par').notNull(),
  yardage: integer('yardage').notNull(),
  handicap: integer('handicap'),
  teeLat: decimal('tee_lat'),
  teeLon: decimal('tee_lon'),
  pinLat: decimal('pin_lat'),
  pinLon: decimal('pin_lon'),
});

// Types
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Hole = typeof holes.$inferSelect;
export type NewHole = typeof holes.$inferInsert;