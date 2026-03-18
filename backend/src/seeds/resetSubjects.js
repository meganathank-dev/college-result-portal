import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

const resetSubjects = async () => {
  try {
    await connectDB();

    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: "subjects" }).toArray();

    if (collections.length > 0) {
      await db.collection("subjects").drop();
      console.log("Old subjects collection dropped successfully.");
    } else {
      console.log("Subjects collection does not exist. Nothing to drop.");
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Reset subjects failed:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

resetSubjects();