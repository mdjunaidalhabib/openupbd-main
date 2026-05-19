import Admin from "../models/Admin.js";
const createSuperAdmin = async () => {
  try {
    const exists = await Admin.findOne({ role: "superadmin" });

    if (!exists) {
      const admin = new Admin({
        name: process.env.SUPER_ADMIN_NAME,
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PASSWORD,
        role: "superadmin",
      });

      await admin.save();
      console.log("🟢 Super Admin created successfully!");
    } else {
      console.log("🟡 Super Admin already exists.");
    }
  } catch (err) {
    console.error("❌ Super Admin setup failed:", err.message);
  }
};

export default createSuperAdmin;
