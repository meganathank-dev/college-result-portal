import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../modules/users/user.model.js";
import { connectDB } from "../config/db.js";
import { ROLES } from "../config/constants.js";
import { env } from "../config/env.js";

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ email: "admin@kavery.edu.in" });

    if (existingAdmin) {
      console.log("Super admin already exists");
      await mongoose.connection.close();
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash("Admin@123", 10);

    await User.create({
      fullName: "Super Admin",
      email: "admin@kavery.edu.in",
      mobileNo: "9999999999",
      passwordHash,
      role: ROLES.SUPER_ADMIN,
      isActive: true
    });

    console.log("Super admin created successfully");
    console.log("Email: admin@kavery.edu.in");
    console.log("Password: Admin@123");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seed admin failed:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedAdmin();