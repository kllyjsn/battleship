import { MongoClient, type Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'battleship';

let cachedPromise: Promise<{ client: MongoClient; db: Db }> | null = null;

export async function getDb(): Promise<Db> {
  if (cachedPromise) {
    const { db } = await cachedPromise;
    return db;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  cachedPromise = (async () => {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 10_000,
      serverSelectionTimeoutMS: 5_000,
    });

    await client.connect();
    return { client, db: client.db(DB_NAME) };
  })();

  try {
    const { db } = await cachedPromise;
    return db;
  } catch (err) {
    cachedPromise = null;
    throw err;
  }
}
