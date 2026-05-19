// frontend/utils/api.js

export async function apiFetch(path, options = {}) {
  const baseUrl = "/api";
  const url = `${baseUrl}${path}`;

  try {
    const res = await fetch(url, {
      credentials: "include", // ✅ কুকি সবসময় পাঠাবে
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    // ✅ যদি 401 হয় → auto logout + redirect
    if (res.status === 401) {
      try {
        // backend logout কল (cookie clear করার জন্য)
        await fetch(`${baseUrl}/admin/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // ignore
      }

      // client-side clean + redirect
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("admin");
        } catch {}

        window.location.href = "/login";
      }

      // error throw যাতে caller বুঝতে পারে
      throw new Error("Session expired. Redirecting to login.");
    }

    if (!res.ok) {
      let errorText = "";
      try {
        errorText = await res.text();
      } catch {
        errorText = "Unknown error";
      }

      throw new Error(
        `API error: ${res.status} ${res.statusText} → ${errorText}`
      );
    }

    // ✅ সবসময় JSON ফেরত দেবে
    return await res.json();
  } catch (err) {
    throw err;
  }
}
