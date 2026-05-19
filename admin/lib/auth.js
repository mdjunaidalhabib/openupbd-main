// lib/auth.js
export async function getAdmin() {
  try {
    const API_BASE = "/api";

    const res = await fetch(`${API_BASE}/admin/verify`, {
      method: "GET",
      credentials: "include", // ✅ কুকি পাঠাবে
      cache: "no-store", // 🔄 সবসময় fresh ডেটা আনবে
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.admin || null; // backend থেকে পাওয়া admin তথ্য
  } catch (error) {
    console.error("⚠️ Auth check failed:", error);
    return null;
  }
}

// 🔹 লগআউট করার ফাংশন
export async function logoutAdmin() {
  try {
    const API_BASE = "/api";

    const res = await fetch(`${API_BASE}/admin/logout`, {
      method: "POST",
      credentials: "include", // ✅ কুকি সহ পাঠাবে
    });

    if (res.ok) {
      console.log("✅ Logged out successfully");
      return true;
    } else {
      console.warn("❌ Logout failed");
      return false;
    }
  } catch (error) {
    console.error("⚠️ Logout error:", error);
    return false;
  }
}
