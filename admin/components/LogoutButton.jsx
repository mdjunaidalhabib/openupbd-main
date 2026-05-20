"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Logout failed:", data?.message);
        alert(data?.message || "Logout failed");
        return;
      }

      console.log("✅ Logout successful");

      // ✅ Browser cookie force remove
      document.cookie =
        "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // ✅ Clear storage/cache
      localStorage.clear();
      sessionStorage.clear();

      // ✅ Clear browser cache if supported
      if ("caches" in window) {
        const cacheNames = await caches.keys();

        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName)),
        );
      }

      // ✅ Hard reload + redirect
      window.location.replace("/login");
    } catch (error) {
      console.error("❌ Logout Error:", error);
      alert("Something went wrong during logout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`px-3 py-2 rounded-lg text-white transition-all ${
        loading
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-red-500 hover:bg-red-600"
      }`}
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
