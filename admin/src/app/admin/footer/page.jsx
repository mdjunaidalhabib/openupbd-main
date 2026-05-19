"use client";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function FooterAdminPanel() {
  const [footer, setFooter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [tempItem, setTempItem] = useState(null);

  const API_URL = "/api";

  // ✅ Contact fields fixed list (facebook/twitter বাদ, website যোগ)
  const CONTACT_FIELDS = ["email", "phone", "address", "website"];

  useEffect(() => {
    fetch(`${API_URL}/admin/footer`)
      .then((res) => res.json())
      .then((data) => {
        const brand = data.brand || {};
        const contact = data.contact || {};

        // ✅ Missing contact fields auto add (empty string)
        CONTACT_FIELDS.forEach((key) => {
          if (!(key in contact)) contact[key] = "";
        });

        setFooter({
          ...data,
          brand,
          contact,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load footer.");
        setLoading(false);
      });
  }, [API_URL]);

  const handleSave = async (nextFooter) => {
    setSaving(true);
    try {
      const payload = structuredClone(nextFooter);
      const formData = new FormData();

      if (payload.brand?.logoFile) {
        formData.append("logo", payload.brand.logoFile);
        delete payload.brand.logoFile;
      }

      if (payload.removeLogo) {
        formData.append("removeLogo", "true");
        delete payload.removeLogo;
      }

      formData.append("brand", JSON.stringify(payload.brand || {}));
      formData.append("contact", JSON.stringify(payload.contact || {}));

      const res = await fetch(`${API_URL}/admin/footer`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      if (data.footer) {
        // ✅ server থেকে আসা footer তেও missing fields add
        const newFooter = data.footer;
        newFooter.contact = newFooter.contact || {};
        CONTACT_FIELDS.forEach((key) => {
          if (!(key in newFooter.contact)) newFooter.contact[key] = "";
        });

        setFooter(newFooter);
        toast.success("✅ Changes saved!");
      } else {
        toast.error("❌ Failed to save footer.");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to save footer.");
    } finally {
      setSaving(false);
    }
  };

  const toastOptions = {
    duration: 3000,
    style: {
      background: "#0f172a",
      color: "#fff",
      padding: "12px 14px",
      borderRadius: "10px",
      fontSize: "14px",
      fontWeight: 600,
      boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    },
    success: {
      style: { background: "#16a34a" },
      iconTheme: { primary: "#fff", secondary: "#16a34a" },
    },
    error: {
      style: { background: "#dc2626" },
      iconTheme: { primary: "#fff", secondary: "#dc2626" },
    },
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!footer) return <p>No footer data found.</p>;

  const renderFieldEditor = (section, field, value) =>
    editing === `${section}-${field}` ? (
      <>
        <input
          type="text"
          value={tempItem ?? ""}
          onChange={(e) => setTempItem(e.target.value)}
          placeholder="Set value..."
          className="flex-1 p-2 border rounded"
          disabled={saving}
        />
        <div className="flex gap-2">
          <button
            disabled={saving}
            onClick={() => {
              const updated = {
                ...footer,
                [section]: {
                  ...footer[section],
                  [field]: tempItem,
                },
              };
              setFooter(updated);
              setEditing(null);
              setTempItem(null);
              handleSave(updated);
            }}
            className="bg-green-500 text-white px-2 py-1 rounded disabled:opacity-60"
          >
            Save
          </button>
          <button
            disabled={saving}
            onClick={() => {
              setEditing(null);
              setTempItem(null);
            }}
            className="bg-gray-400 text-white px-2 py-1 rounded disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </>
    ) : (
      <>
        <p className="flex-1">
          <strong>{field}:</strong> {value || "Not set"}
        </p>
        <div className="flex gap-2">
          <button
            disabled={saving}
            onClick={() => {
              setEditing(`${section}-${field}`);
              setTempItem(value || "");
            }}
            className="bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-60"
          >
            Edit
          </button>

          {/* ✅ Delete = value clear only (field stays always) */}
          <button
            disabled={saving}
            onClick={() => {
              const updated = {
                ...footer,
                [section]: {
                  ...footer[section],
                  [field]: "",
                },
              };
              setFooter(updated);
              handleSave(updated);
              toast.success(`🗑 Cleared ${section} field: ${field}`);
            }}
            className="bg-red-500 text-white px-2 py-1 rounded disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </>
    );

  return (
    <div className="max-w-4xl mx-auto bg-white shadow p-6 rounded-lg space-y-6">
      <Toaster position="top-right" toastOptions={toastOptions} />
      <h2 className="text-2xl font-bold mb-4">🛠 Footer Admin Panel</h2>

      {/* BRAND INFO */}
      <div className="space-y-2 border p-3 rounded">
        <h3 className="font-semibold">Brand Info</h3>

        <div className="flex justify-between items-center gap-4 border-b py-1">
          {renderFieldEditor("brand", "title", footer.brand?.title || "")}
        </div>

        <div className="flex justify-between items-center gap-4 border-b py-1">
          {renderFieldEditor("brand", "about", footer.brand?.about || "")}
        </div>

        {/* Logo */}
        <div className="flex flex-col gap-2 border-b py-1">
          <label className="text-sm font-medium">Logo</label>

          {footer.brand?.logo ? (
            <div className="flex items-center gap-3">
              <img
                src={footer.brand.logo}
                alt="Brand Logo"
                className="h-12 w-auto border rounded"
              />

              <button
                disabled={saving}
                onClick={() => {
                  const updated = {
                    ...footer,
                    brand: {
                      ...footer.brand,
                      logo: "",
                      logoPublicId: "",
                    },
                    removeLogo: true,
                  };
                  setFooter(updated);
                  handleSave(updated);
                  toast.error("❌ Logo removed");
                }}
                className="bg-red-600 text-white px-2 py-1 rounded disabled:opacity-60"
              >
                🗑 Remove
              </button>
            </div>
          ) : (
            <>
              <input
                type="file"
                id="logoUpload"
                accept="image/*"
                className="hidden"
                disabled={saving}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const updated = {
                    ...footer,
                    brand: {
                      ...footer.brand,
                      logoFile: file,
                    },
                  };

                  setFooter(updated);
                  handleSave(updated);

                  e.target.value = "";
                }}
              />

              <button
                type="button"
                disabled={saving}
                onClick={() => document.getElementById("logoUpload")?.click()}
                className="w-full flex items-center justify-center gap-2 
                           border border-dashed border-gray-300 
                           hover:border-blue-400 hover:bg-blue-50 
                           text-gray-700 px-3 py-2 rounded-md transition 
                           text-sm disabled:opacity-60"
              >
                <span className="text-base">🖼️</span>
                <span className="font-medium">Upload Logo</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* CONTACT INFO */}
      <div className="space-y-2 border p-3 rounded">
        <h3 className="font-semibold flex justify-between items-center">
          Contact Info
        </h3>

        {/* ✅ Fixed fields show always */}
        {CONTACT_FIELDS.map((field) => (
          <div
            key={field}
            className="flex justify-between items-center gap-4 border-b py-1"
          >
            {renderFieldEditor("contact", field, footer.contact?.[field] || "")}
          </div>
        ))}
      </div>

      {saving && (
        <p className="text-sm text-gray-500 italic">Saving changes...</p>
      )}
    </div>
  );
}
