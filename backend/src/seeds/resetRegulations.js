import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

const resetRegulations = async () => {
  try {
    await connectDB();

    const db = mongoose.connection.db;

    const collections = await db.listCollections({ name: "regulations" }).toArray();

    if (collections.length > 0) {
      await db.collection("regulations").drop();
      console.log("Old regulations collection dropped successfully.");
    } else {
      console.log("Regulations collection does not exist. Nothing to drop.");
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Reset regulations failed:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

resetRegulations();