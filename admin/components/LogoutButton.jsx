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

      // browser cache + middleware refresh
      window.location.href = "/login";
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
