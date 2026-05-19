"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      const apiUrl = "/api";

      const res = await fetch(`${apiUrl}/admin/logout`, {
        method: "POST",
        credentials: "include", // ✅ cookie delete হবে
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Logout failed:", err.message);
        return;
      }

      console.log("✅ Logout successful");
      router.push("/login"); // ❌ router.refresh() দরকার নেই
    } catch (error) {
      console.error("Logout Error:", error);
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
