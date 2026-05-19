import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

// Protect API route
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.admin_token;

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const message =
        err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
      return res.status(401).json({ message });
    }

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    console.error("Protect middleware error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Super admin role check
export const superAdminOnly = (req, res, next) => {
  if (req.admin?.role === "superadmin") return next();
  return res.status(403).json({ message: "Super admin only" });
};
