import "dotenv/config";
import { connectDB } from "../src/config/db.js";
import { AdminUser } from "../src/models/AdminUser.js";
import mongoose from "mongoose";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Administrador";

  if (!email || !password) {
    console.error("Define ADMIN_EMAIL y ADMIN_PASSWORD en backend/.env antes de ejecutar este script.");
    process.exit(1);
  }

  await connectDB();

  const passwordHash = await AdminUser.hashPassword(password);
  const admin = await AdminUser.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { name, email: email.toLowerCase().trim(), passwordHash },
    { upsert: true, new: true }
  );

  console.log(`[seed] Usuario administrador listo: ${admin.email}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] Error:", err);
  process.exit(1);
});
