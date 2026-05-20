/**
 * POST /admin/logout
 */
export const logoutAdmin = async (req, res) => {
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    };

    res.clearCookie("admin_token", cookieOptions);

    res.cookie("admin_token", "", {
      ...cookieOptions,
      expires: new Date(0),
      maxAge: 0,
    });

    return res.status(200).json({
      success: true,
      message: "✅ Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};
