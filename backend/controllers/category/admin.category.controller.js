import Category from "../../src/models/Category.js";
import { deleteFromCloudinary } from "../../utils/cloudinary/cloudinaryHelpers.js";
import cloudinary from "../../utils/cloudinary/cloudinary.js";
import fs from "fs";
import sharp from "sharp";
import { toBool, normalizeCategoryOrders } from "../../utils/category/index.js";

/* ================== ✅ CATEGORY IMAGE RULE ==================
   ✅ UPDATED RULE (SAME AS FRONTEND)
   INPUT : jpeg/png/webp allowed
   OUTPUT: 300×300 WEBP under 100KB
================================================== */
const CATEGORY_IMAGE_RULE = {
  mime: "image/webp",
  width: 300,
  height: 300,
  maxBytes: 100 * 1024, // ✅ 100KB
  allowedInputTypes: ["image/webp", "image/jpeg", "image/png"],
};

/* ================== ✅ HELPERS ================== */
const safeUnlink = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {}
};

/**
 * ✅ Convert ANY image -> 300×300 WEBP under 100KB
 * Returns new temp output file path
 */
const convertToCategoryWebp = async (inputPath) => {
  const outputPath = inputPath.replace(/\.\w+$/, "") + `__300x300.webp`;

  let quality = 90;

  // ✅ cover crop + resize + webp
  let buffer = await sharp(inputPath)
    .resize(CATEGORY_IMAGE_RULE.width, CATEGORY_IMAGE_RULE.height, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality })
    .toBuffer();

  // ✅ quality loop until under 100KB
  while (buffer.length > CATEGORY_IMAGE_RULE.maxBytes && quality > 30) {
    quality -= 8;
    buffer = await sharp(inputPath)
      .resize(CATEGORY_IMAGE_RULE.width, CATEGORY_IMAGE_RULE.height, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality })
      .toBuffer();
  }

  if (buffer.length > CATEGORY_IMAGE_RULE.maxBytes) {
    throw new Error(
      `Could not compress under ${Math.floor(
        CATEGORY_IMAGE_RULE.maxBytes / 1024
      )}KB`
    );
  }

  fs.writeFileSync(outputPath, buffer);
  return outputPath;
};

/**
 * ✅ Validate input file (jpeg/png/webp)
 */
const validateCategoryInputFile = async (file) => {
  if (!file) return "";

  if (!CATEGORY_IMAGE_RULE.allowedInputTypes.includes(file.mimetype)) {
    return "Only jpeg/png/webp allowed (Auto convert to 300×300 WEBP)";
  }

  // ✅ multer already limited, but safe check
  if (file.size > 5 * 1024 * 1024) {
    return "File too large";
  }

  return "";
};

/* ================== ✅ CREATE CATEGORY ================== */
export const createCategory = async (req, res) => {
  try {
    let imageUrl = "";
    let imagePublicId = "";

    // ✅ IMAGE UPLOAD + AUTO CONVERT
    if (req.file) {
      const err = await validateCategoryInputFile(req.file);
      if (err) {
        safeUnlink(req.file.path);
        return res.status(400).json({
          error: err,
          code: "INVALID_CATEGORY_IMAGE",
          rule: {
            input: "jpeg/png/webp",
            output: "WEBP",
            width: 300,
            height: 300,
            maxKB: 100,
          },
        });
      }

      // ✅ Convert to 300×300 WEBP under 100KB
      const convertedPath = await convertToCategoryWebp(req.file.path);

      // ✅ upload converted
      const result = await cloudinary.uploader.upload(convertedPath, {
        folder: "categories",
        resource_type: "image",
      });

      // ✅ cleanup temp files
      safeUnlink(req.file.path);
      safeUnlink(convertedPath);

      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ error: "Name is required" });

    const total = await Category.countDocuments();

    let desiredOrder = Number(req.body.order || total + 1);
    if (desiredOrder < 1) desiredOrder = 1;
    if (desiredOrder > total + 1) desiredOrder = total + 1;

    const isActive =
      req.body.isActive === undefined ? true : toBool(req.body.isActive);

    // ✅ shift orders
    await Category.updateMany(
      { order: { $gte: desiredOrder } },
      { $inc: { order: 1 } }
    );

    const category = new Category({
      name,
      image: imageUrl,
      imagePublicId,
      order: desiredOrder,
      isActive,
    });

    await category.save();
    await normalizeCategoryOrders();

    res.status(201).json(category);
  } catch (err) {
    console.error("❌ Error creating category:", err);
    safeUnlink(req.file?.path);
    res.status(400).json({ error: err.message });
  }
};

/* ================== ✅ UPDATE CATEGORY ================== */
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      safeUnlink(req.file?.path);
      return res.status(404).json({ error: "Category not found" });
    }

    // ✅ handle new image upload
    if (req.file) {
      const err = await validateCategoryInputFile(req.file);
      if (err) {
        safeUnlink(req.file.path);
        return res.status(400).json({
          error: err,
          code: "INVALID_CATEGORY_IMAGE",
          rule: {
            input: "jpeg/png/webp",
            output: "WEBP",
            width: 300,
            height: 300,
            maxKB: 100,
          },
        });
      }

      // ✅ Convert to 300×300 WEBP under 100KB
      const convertedPath = await convertToCategoryWebp(req.file.path);

      // ✅ delete old image
      if (category.image) {
        await deleteFromCloudinary(category.image, "categories");
      }

      // ✅ upload converted
      const result = await cloudinary.uploader.upload(convertedPath, {
        folder: "categories",
        resource_type: "image",
      });

      // ✅ cleanup temp
      safeUnlink(req.file.path);
      safeUnlink(convertedPath);

      category.image = result.secure_url;
      category.imagePublicId = result.public_id;
    }

    if (req.body.name) category.name = req.body.name.trim();

    if (req.body.isActive !== undefined) {
      category.isActive = toBool(req.body.isActive);
    }

    // ✅ ORDER UPDATE
    if (req.body.order !== undefined) {
      const total = await Category.countDocuments();
      let desiredOrder = Number(req.body.order || category.order);

      if (desiredOrder < 1) desiredOrder = 1;
      if (desiredOrder > total) desiredOrder = total;

      const oldOrder = category.order;

      if (desiredOrder !== oldOrder) {
        if (desiredOrder > oldOrder) {
          await Category.updateMany(
            { order: { $gt: oldOrder, $lte: desiredOrder } },
            { $inc: { order: -1 } }
          );
        } else {
          await Category.updateMany(
            { order: { $gte: desiredOrder, $lt: oldOrder } },
            { $inc: { order: 1 } }
          );
        }

        category.order = desiredOrder;
      }
    }

    await category.save();
    await normalizeCategoryOrders();

    res.json(category);
  } catch (err) {
    console.error("❌ Error updating category:", err);
    safeUnlink(req.file?.path);
    res.status(400).json({ error: err.message });
  }
};

/* ================== ✅ DELETE CATEGORY ================== */
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    const deletedOrder = category.order;

    // ✅ delete image from cloudinary
    if (category.image) {
      await deleteFromCloudinary(category.image, "categories");
    }

    await category.deleteOne();

    // ✅ shift orders after delete
    await Category.updateMany(
      { order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );

    await normalizeCategoryOrders();

    res.json({
      message: "🗑️ Category deleted successfully (serial updated)",
    });
  } catch (err) {
    console.error("❌ Error deleting category:", err);
    res.status(400).json({ error: err.message });
  }
};

/* ================== ✅ ADMIN READ ================== */
export const getCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, createdAt: 1 });
    res.json(categories);
  } catch (err) {
    console.error("❌ Admin getCategories error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getCategoryByIdAdmin = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    res.json(category);
  } catch (err) {
    console.error("❌ Admin getCategoryById error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
