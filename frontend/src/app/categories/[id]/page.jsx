"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProductCard from "../../../../components/home/ProductCard";
import ProductCardSkeleton from "../../../../components/skeletons/ProductCardSkeleton";
import { apiFetch } from "../../../../utils/api";
import { motion } from "framer-motion";

export default function CategoryIdPage() {
  const params = useParams();
  const catId = params?.id; // URL থেকে ক্যাটাগরি আইডি নেওয়া হচ্ছে

  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!catId) return;

    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        setError(false);

        // সব প্রোডাক্ট এবং নির্দিষ্ট ক্যাটাগরির ডিটেইলস ফেচ করা হচ্ছে
        const [pRes, cRes] = await Promise.all([
          apiFetch("/products"),
          apiFetch(`/categories/${catId}`),
        ]);

        let pArr = Array.isArray(pRes) ? pRes : [];

        // ── ফ্রন্টএন্ড ফিল্টারিং ──
        // শুধুমাত্র যে প্রোডাক্টগুলোর ক্যাটাগরি আইডি ইউআরএল-এর আইডির সাথে মিলবে, সেগুলো রাখা হবে
        pArr = pArr.filter((p) => String(p.category?._id) === String(catId));

        // আপনার আগের প্রোডাক্ট সিরিয়াল সর্ট লজিক
        pArr.sort((a, b) => {
          const ao = Number(a.order ?? 0);
          const bo = Number(b.order ?? 0);
          if (ao !== bo) return ao - bo;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        setProducts(pArr);
        setCategoryName(cRes?.name || "ক্যাটাগরি প্রোডাক্টস");
        setLoading(false);
      } catch (err) {
        console.log("Error fetching category products:", err);
        setError(true);
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [catId]);

  /* ── ERROR UI ── */
  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-gray-500 text-sm mb-4 text-center">
          ডেটা লোড করা যায়নি। ইন্টারনেট বা সার্ভার সমস্যা হতে পারে।
        </p>
        <Link
          href="/"
          className="px-4 py-2 rounded-md text-sm font-medium
            bg-gradient-to-r from-blue-600 to-purple-600
            text-white hover:opacity-90 transition"
        >
          🏠 হোম পেজে ফিরে যান
        </Link>
      </div>
    );
  }

  /* ── SKELETON ── */
  if (loading) {
    return (
      <div className="mx-auto w-full md:max-w-[920px] lg:max-w-[1080px] xl:max-w-[1280px] 2xl:max-w-[1480px] max-w-screen-xl px-4 py-10 space-y-6">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  /* ── UI ── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full md:max-w-[920px] lg:max-w-[1080px] xl:max-w-[1280px] 2xl:max-w-[1480px] max-w-screen-xl px-3 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-8"
    >
      {/* ── HEADER DIVISION ── */}
      <div className="border-b border-slate-100 pb-5">
        <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
          <Link href="/" className="hover:text-blue-600 transition">
            হোম
          </Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">{categoryName}</span>
        </div>

        <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-800">
          <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-blue-600 to-purple-600 inline-block" />
          {categoryName}
          <span className="text-xs sm:text-sm font-normal text-slate-400">
            ({products.length}টি প্রোডাক্ট)
          </span>
        </h1>
      </div>

      {/* ── PRODUCT GRID LIST ── */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-slate-400 text-sm mb-4">
            এই ক্যাটাগরিতে বর্তমানে কোনো প্রোডাক্ট নেই।
          </p>
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-purple-600 transition"
          >
            ← অন্য প্রোডাক্ট দেখুন
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6">
          {products.map((prod) => (
            <div key={prod._id} className="w-full">
              <ProductCard product={prod} priority={true} />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
