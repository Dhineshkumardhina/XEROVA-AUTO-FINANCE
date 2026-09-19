import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";

dotenv.config();

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/xerova_auto_finance";
  
  try {
    console.log(`[MongoDB] Attempting connection to primary URI: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Successfully connected to primary MongoDB server.`);
  } catch (error) {
    console.warn(`[MongoDB] Primary connection failed: ${(error as Error).message}`);
    console.log(`[MongoDB] Launching automatic in-memory MongoDB server fallback...`);
    try {
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbName: "xerova_auto_finance"
        }
      });
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[MongoDB] Successfully connected to in-memory MongoDB fallback at ${memoryUri}`);
    } catch (fallbackError) {
      console.error(`[MongoDB] Fatal error initializing in-memory fallback:`, fallbackError);
      throw fallbackError;
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
  console.log(`[MongoDB] Disconnected.`);
}
