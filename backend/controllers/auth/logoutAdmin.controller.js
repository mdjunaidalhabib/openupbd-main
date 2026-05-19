/**
 * POST /admin/logout
 */
export const logoutAdmin = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === "production";
    const cookieDomain = process.env.COOKIE_DOMAIN || ".habibsfashion.com";

    const clearOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      ...(isProd ? { domain: cookieDomain } : {}),
    };

    res.clearCookie("admin_token", clearOptions);

    return res.status(200).json({ message: "✅ Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
