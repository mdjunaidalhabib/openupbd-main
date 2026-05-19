import express from "express";
import Admin from "../../models/Admin.js";
import fs from "fs";

import upload from "../../../utils/cloudinary/upload.js";
import cloudinary from "../../../utils/cloudinary/cloudinary.js";
import { deleteByPublicId } from "../../../utils/cloudinary/cloudinaryHelpers.js";

import {
  protect,
  superAdminOnly,
} from "../../middlewares/adminAuthMiddleware.js";

import { loginAdmin, logoutAdmin } from "../../../controllers/auth/index.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/logout", protect, logoutAdmin);

router.get("/verify", protect, async (req, res) => {
  try {
    const freshAdmin = await Admin.findById(req.admin._id).select("-password");

    if (!freshAdmin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    res.json({
      message: "✅ Auth verified",
      admin: freshAdmin,
    });
  } catch (error) {
    console.error("Verify Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", protect, async (req, res) => {
  try {
    res.json(req.admin);
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/me", protect, upload.single("avatar"), async (req, res) => {
  try {
    let data = { ...req.body };

    if (data.profile && typeof data.profile === "string") {
      try {
        data = JSON.parse(data.profile);
      } catch {
        data = {};
      }
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const removeAvatar = data.removeAvatar === "true";
    if (removeAvatar && admin.avatarPublicId) {
      await deleteByPublicId(admin.avatarPublicId);

      admin.avatar = "";
      admin.avatarPublicId = "";
      delete data.removeAvatar;
    }

    if (req.file) {
      if (admin.avatarPublicId) {
        await deleteByPublicId(admin.avatarPublicId);
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "admin_avatars",
      });

      fs.unlinkSync(req.file.path);

      admin.avatar = result.secure_url;
      admin.avatarPublicId = result.public_id;
    }

    if (data.name) admin.name = data.name;
    if (data.username) admin.username = data.username;
    if (data.phone) admin.phone = data.phone;
    if (data.address) admin.address = data.address;

    await admin.save();

    res.json({
      message: "✅ Profile updated",
      admin,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/me/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current & new password required" });
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const ok = await admin.matchPassword(currentPassword);
    if (!ok) {
      return res.status(400).json({ message: "❌ Current password incorrect" });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: "✅ Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
