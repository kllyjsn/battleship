import { MongoClient, type Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'battleship';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (cachedDb && cachedClient) {
    return cachedDb;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 0,
    maxIdleTimeMS: 10_000,
    serverSelectionTimeoutMS: 5_000,
  });

  await client.connect();
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return db;
}
