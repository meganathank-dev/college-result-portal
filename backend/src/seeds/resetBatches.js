import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

const resetBatches = async () => {
  try {
    await connectDB();

    const db = mongoose.connection.db;

    const collections = await db.listCollections({ name: "batches" }).toArray();

    if (collections.length > 0) {
      await db.collection("batches").drop();
      console.log("Old batches collection dropped successfully.");
    } else {
      console.log("Batches collection does not exist. Nothing to drop.");
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Reset batches failed:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

resetBatches();