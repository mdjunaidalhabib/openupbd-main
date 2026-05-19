import express from "express";
import Footer from "../../models/Footer.js";
import upload from "../../../utils/upload.js";
import { deleteByPublicId } from "../../../utils/cloudinaryHelpers.js";
import cloudinary from "../../../utils/cloudinary.js";
import fs from "fs";

const router = express.Router();

// ✅ GET Footer (Public)
// FINAL path: GET /api/v1/footer
router.get("/", async (req, res) => {
  try {
    const footer = await Footer.findOne();
    res.json(footer || {});
  } catch (err) {
    console.error("❌ Error fetching footer:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST Footer + optional logo (Admin only)
// FINAL path: POST /api/v1/admin/footer
router.post("/", upload.single("logo"), async (req, res) => {
  try {
    let data = { ...req.body };

    // Parse brand/contact JSON if sent as string
    if (data.brand && typeof data.brand === "string") {
      data.brand = JSON.parse(data.brand);
    }
    if (data.contact && typeof data.contact === "string") {
      data.contact = JSON.parse(data.contact);
    }

    const footer = await Footer.findOne();

    // removeLogo request
    const removeLogo = data.removeLogo === "true";
    if (removeLogo && footer?.brand?.logoPublicId) {
      await deleteByPublicId(footer.brand.logoPublicId);

      data.brand = data.brand || {};
      data.brand.logo = "";
      data.brand.logoPublicId = "";
      delete data.removeLogo;
    }

    // Upload new logo if exists
    if (req.file) {
      // delete old logo by public id
      if (footer?.brand?.logoPublicId) {
        await deleteByPublicId(footer.brand.logoPublicId);
      }

      // upload new logo to FOOTER folder
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "footer_logos",
      });

      fs.unlinkSync(req.file.path);

      data.brand = data.brand || {};
      data.brand.logo = result.secure_url;
      data.brand.logoPublicId = result.public_id;
    } else if (footer?.brand) {
      // file না এলে আগের logo/publicId রেখে দাও
      data.brand = {
        ...footer.brand,
        ...(data.brand || {}),
      };
    }

    // Update or create
    let updatedFooter;
    if (!footer) {
      updatedFooter = await Footer.create(data);
    } else {
      Object.assign(footer, data);
      footer.updatedAt = new Date();
      updatedFooter = await footer.save();
    }

    res.json({
      message: "✅ Footer updated successfully",
      footer: updatedFooter,
    });
  } catch (err) {
    console.error("❌ Error updating footer:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ DELETE Footer (Admin only)
// FINAL path: DELETE /api/v1/admin/footer
router.delete("/", async (req, res) => {
  try {
    const footer = await Footer.findOne();

    if (footer?.brand?.logoPublicId) {
      await deleteByPublicId(footer.brand.logoPublicId);
    }

    await Footer.deleteMany({});
    res.json({ message: "🗑️ Footer deleted" });
  } catch (err) {
    console.error("❌ Error deleting footer:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
