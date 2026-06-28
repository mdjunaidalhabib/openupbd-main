"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import ProductCard from "./ProductCard";
import ProductCardSkeleton from "../skeletons/ProductCardSkeleton";
import OfferBadges from "./OfferBadges";

/* ══════════════════════════════════════════════════════════════
   DRAG-SCROLL WRAPPER
   ══════════════════════════════════════════════════════════════ */
function DragScroll({ children, className = "" }) {
  const elRef = useRef(null);
  const state = useRef({
    down: false,
    moved: false,
    startX: 0,
    startScroll: 0,
    lastX: 0,
    lastT: 0,
    vel: 0,
    raf: null,
  });

  useEffect(() => {
    const s = state.current;

    const momentum = () => {
      const el = elRef.current;
      if (!el) return;
      s.vel *= 0.92;
      if (Math.abs(s.vel) < 0.4) {
        s.vel = 0;
        return;
      }
      el.scrollLeft += s.vel;
      s.raf = requestAnimationFrame(momentum);
    };

    const onDown = (e) => {
      e.preventDefault();
      const el = elRef.current;
      if (!el || !el.contains(e.target)) return;
      cancelAnimationFrame(s.raf);
      s.down = true;
      s.moved = false;
      s.startX = e.pageX;
      s.startScroll = el.scrollLeft;
      s.lastX = e.pageX;
      s.lastT = performance.now();
      s.vel = 0;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
    };

    const onMove = (e) => {
      if (!s.down) return;
      const el = elRef.current;
      if (!el) return;
      const dx = e.pageX - s.startX;
      if (Math.abs(dx) > 4) s.moved = true;
      const now = performance.now();
      const dt = now - s.lastT;
      if (dt > 0) s.vel = ((s.lastX - e.pageX) / dt) * 14;
      s.lastX = e.pageX;
      s.lastT = now;
      el.scrollLeft = s.startScroll - dx;
      e.preventDefault();
    };

    const onUp = () => {
      if (!s.down) return;
      s.down = false;
      const el = elRef.current;
      if (el) {
        el.style.cursor = "grab";
        el.style.userSelect = "";
      }
      if (s.moved && Math.abs(s.vel) > 1) {
        s.raf = requestAnimationFrame(momentum);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    elRef.current?.addEventListener("mousedown", onDown, { passive: false });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      elRef.current?.removeEventListener("mousedown", onDown);
      cancelAnimationFrame(s.raf);
    };
  }, []);

  const onClickCapture = (e) => {
    if (state.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      state.current.moved = false;
    }
  };

  const onWheel = (e) => {
    const el = elRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      cancelAnimationFrame(state.current.raf);
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  return (
    <div
      ref={elRef}
      onClickCapture={onClickCapture}
      onWheel={onWheel}
      style={{
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        cursor: "grab",
        WebkitUserDrag: "none",
      }}
      className={`no-scrollbar select-none ${className}`}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SHARED CARD-ITEM WIDTH STYLES
   ══════════════════════════════════════════════════════════════ */
function CardItemStyles() {
  return (
    <style jsx global>{`
      .product-card-item {
        width: calc(50vw - 24px);
      }
      @media (min-width: 640px) {
        .product-card-item {
          width: 200px;
        }
      }
      @media (min-width: 1024px) {
        .product-card-item {
          width: 196px;
        }
      }
      @media (min-width: 1280px) {
        .product-card-item {
          width: 224px;
        }
      }
      @media (min-width: 1536px) {
        .product-card-item {
          width: 260px;
        }
      }
      .no-scrollbar img,
      .no-scrollbar [draggable] {
        -webkit-user-drag: none;
        user-drag: none;
      }
      .no-scrollbar * {
        -webkit-user-drag: none;
      }
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `}</style>
  );
}

/* ══════════════════════════════════════════════════════════════
   CATEGORY ROW
   ══════════════════════════════════════════════════════════════ */
function CategoryRow({ cat, items, index = 0 }) {
  const categoryHref = `/categories/${cat.slug || cat._id}`;

  return (
    <motion.section
      id={`cat-${cat._id}`}
      className="scroll-mt-20"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.06 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-800">
          <span className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-600 to-purple-600 inline-block" />
          {cat.image && (
            <span className="relative w-6 h-6 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="24px"
                className="object-cover"
                draggable={false}
              />
            </span>
          )}
          {cat.name}
          <span className="text-xs sm:text-sm font-normal text-slate-400">
            ({items.length}টি)
          </span>
        </h2>

        <Link
          href={categoryHref}
          className="flex items-center gap-1 text-xs sm:text-sm font-semibold
            text-blue-600 hover:text-purple-600 transition-colors whitespace-nowrap"
        >
          সব দেখুন <span aria-hidden="true">→</span>
        </Link>
      </div>

      <DragScroll className="-mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="flex w-max" style={{ gap: "12px" }}>
          {items.map((prod, i) => (
            <div
              key={prod._id}
              className="product-card-item flex-shrink-0"
              style={{ flexShrink: 0 }}
            >
              <ProductCard product={prod} priority={i < 5} />
            </div>
          ))}
        </div>
      </DragScroll>

      <CardItemStyles />
    </motion.section>
  );
}

/* ══════════════════════════════════════════════════════════════
   HOME LOADING SKELETON
   ══════════════════════════════════════════════════════════════ */
function HomeLoadingSkeleton() {
  const pulse = "animate-pulse bg-slate-200 rounded-md";

  return (
    <div className="mx-auto w-full md:max-w-[920px] lg:max-w-[1080px] xl:max-w-[1280px] 2xl:max-w-[1480px] px-3 sm:px-6 lg:px-8 py-4 lg:py-8 space-y-8">
      <div className="mb-4 flex flex-nowrap justify-center items-center gap-1 md:gap-8 lg:gap-14 w-full px-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${pulse} h-[26px] sm:h-[34px] lg:h-[38px] w-[92px] sm:w-[140px] lg:w-[160px] rounded-md`}
          />
        ))}
      </div>

      <div className="-mx-3 sm:-mx-6 lg:-mx-8 mb-6 px-3 sm:px-6 lg:px-8 pb-2.5 pt-2 flex gap-2 w-max">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`${pulse} h-[34px] sm:h-[40px] w-[90px] sm:w-[110px] rounded-full flex-shrink-0`}
          />
        ))}
      </div>

      <div className="space-y-8">
        {[0, 1].map((row) => (
          <div key={row}>
            <div className="flex items-center justify-between mb-3">
              <div className={`${pulse} h-5 w-40`} />
              <div className={`${pulse} h-4 w-16`} />
            </div>
            <div className="flex w-max overflow-hidden" style={{ gap: "12px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="product-card-item flex-shrink-0">
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <CardItemStyles />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HASH ↔ FILTER MAPS
   ══════════════════════════════════════════════════════════════ */
const HASH_FILTER_MAP = {
  "#openup-box": "openupBox",
  "#free-delivery": "freeDelivery",
  "#best-discount": "bestDiscount",
};

const FILTER_HASH_MAP = {
  openupBox: "openup-box",
  freeDelivery: "free-delivery",
  bestDiscount: "best-discount",
};

/* ══════════════════════════════════════════════════════════════
   FILTER LABEL HELPER
   ══════════════════════════════════════════════════════════════ */
function filterLabel(activeFilter) {
  if (activeFilter === "freeDelivery") return "🚚 Free Delivery Products";
  if (activeFilter === "bestDiscount") return "🛍️ Best Discount Products";
  if (activeFilter === "openupBox") return "🎁 Openup Box Products";
  return "";
}

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════════════ */
export default function CategoryTabsSection() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [justActivated, setJustActivated] = useState(null);

  const handleFilterChange = (filter, fromExternal = false) => {
    setActiveFilter(filter);

    if (filter && fromExternal) {
      setJustActivated(filter);
      setTimeout(() => setJustActivated(null), 500);
    }

    if (filter) {
      const hash = FILTER_HASH_MAP[filter];
      if (hash && window.location.hash !== `#${hash}`) {
        history.replaceState(null, "", `#${hash}`);
      }
    } else if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname);
    }
  };

  /* ── Hash → filter (page load + back/forward) ── */
  useEffect(() => {
    const applyHashFilter = () => {
      const hash = window.location.hash.toLowerCase();
      const filter = HASH_FILTER_MAP[hash] ?? null;
      setActiveFilter(filter);
      if (filter) {
        setJustActivated(filter);
        setTimeout(() => setJustActivated(null), 500);
        setTimeout(() => {
          const el = document.getElementById("offer-section");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
    };

    applyHashFilter();
    window.addEventListener("hashchange", applyHashFilter);
    return () => window.removeEventListener("hashchange", applyHashFilter);
  }, []);

  /* ── Custom event (navbar থেকে) ── */
  useEffect(() => {
    const onOfferFilterChange = (e) => {
      const filter = e.detail ?? null;
      handleFilterChange(filter, true);
      if (filter) {
        setTimeout(() => {
          const el = document.getElementById("offer-section");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
    };
    window.addEventListener("offerFilterChange", onOfferFilterChange);
    return () =>
      window.removeEventListener("offerFilterChange", onOfferFilterChange);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(false);
      const [pRes, cRes] = await Promise.all([
        apiFetch("/products"),
        apiFetch("/categories"),
      ]);
      let pArr = Array.isArray(pRes) ? pRes : [];
      let cArr = Array.isArray(cRes) ? cRes : [];
      cArr = cArr.filter((c) => c.isActive !== false);
      cArr.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
      setProducts(pArr);
      setCategories(cArr);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ── Filter active হলে flat product list ── */
  const filteredProducts = useMemo(() => {
    if (!activeFilter) return [];
    return products
      .filter((p) => {
        if (activeFilter === "freeDelivery") return p.freeDelivery === true;
        if (activeFilter === "bestDiscount") return p.bestDiscount === true;
        if (activeFilter === "openupBox") return p.openupBox === true;
        return false;
      })
      .sort((a, b) => {
        const ao = Number(a.order ?? 0),
          bo = Number(b.order ?? 0);
        if (ao !== bo) return ao - bo;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [products, activeFilter]);

  /* ── Filter নেই → category groups ── */
  const groups = useMemo(() => {
    if (activeFilter) return [];
    return categories
      .map((cat) => {
        const items = products
          .filter((p) => String(p.category?._id) === String(cat._id))
          .sort((a, b) => {
            const ao = Number(a.order ?? 0),
              bo = Number(b.order ?? 0);
            if (ao !== bo) return ao - bo;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
        return { cat, items };
      })
      .filter((g) => g.items.length > 0);
  }, [categories, products, activeFilter]);

  const handleCatChipClick = (id) => {
    const el = document.getElementById(`cat-${id}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: "smooth" });
  };

  /* ── ERROR ── */
  if (error && !loading)
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col items-center justify-center py-20 px-4"
        >
          <p className="text-gray-500 text-sm mb-4 text-center">
            ডেটা লোড করা যায়নি। ইন্টারনেট বা সার্ভার সমস্যা হতে পারে।
          </p>
          <button
            type="button"
            onClick={fetchData}
            className="px-4 py-2 rounded-md text-sm font-medium
              bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition"
          >
            🔄 আবার চেষ্টা করুন
          </button>
        </motion.div>
      </AnimatePresence>
    );

  /* ── SKELETON ── */
  if (loading || products.length === 0)
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <HomeLoadingSkeleton />
        </motion.div>
      </AnimatePresence>
    );

  /* ── MAIN UI ── */
  return (
    <motion.div
      key="content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto w-full md:max-w-[920px] lg:max-w-[1080px] xl:max-w-[1280px] 2xl:max-w-[1480px] px-3 sm:px-6 lg:px-8 py-4 lg:py-8 space-y-8"
    >
      {/* ── FILTER BADGES ── */}
      <motion.div
        id="offer-section"
        className="mb-4"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
      >
        <OfferBadges
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          justActivated={justActivated}
        />
      </motion.div>

      {/* ── CATEGORY CHIP BAR ── */}
      <AnimatePresence>
        {!activeFilter && groups.length > 0 && (
          <motion.div
            key="chip-bar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="sticky top-16 z-10 -mx-3 sm:-mx-6 lg:-mx-8 mb-6 bg-pink-50 backdrop-blur-sm border-b border-pink-200"
          >
            <DragScroll className="px-3 sm:px-6 lg:px-8 pb-2.5 pt-2">
              <div className="flex gap-2 w-max">
                {groups.map(({ cat }) => (
                  <button
                    type="button"
                    key={cat._id}
                    onClick={() => handleCatChipClick(cat._id)}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-full
                      text-xs sm:text-sm font-semibold border border-pink-300 bg-pink-100
                      text-slate-600 whitespace-nowrap transition-all duration-200
                      hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:text-white hover:border-transparent"
                  >
                    {cat.image && (
                      <span className="relative w-4 h-4 rounded-sm overflow-hidden flex-shrink-0">
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          fill
                          sizes="16px"
                          className="object-cover"
                          draggable={false}
                        />
                      </span>
                    )}
                    {cat.name}
                  </button>
                ))}
              </div>
            </DragScroll>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          FILTER ACTIVE → FLAT PRODUCT GRID
          ══════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {activeFilter ? (
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm sm:text-lg font-bold text-gray-800">
                {filterLabel(activeFilter)}
              </h2>
              <span className="text-xs sm:text-sm font-normal text-slate-400">
                ({filteredProducts.length}টি)
              </span>
              <div className="flex-1 h-px bg-gray-200" />
              <button
                onClick={() => handleFilterChange(null)}
                className="text-xs text-red-500 flex items-center gap-1 hover:text-red-600 transition-colors whitespace-nowrap"
              >
                ✕ Clear Filter
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center text-gray-400 py-10 text-sm"
              >
                কোনো প্রোডাক্ট নেই
              </motion.p>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3"
              >
                {filteredProducts.map((prod, i) => (
                  <motion.div
                    key={prod._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                  >
                    <ProductCard product={prod} priority={i < 6} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        ) : groups.length > 0 ? (
          /* ══════════════════════════════════════════════════
             FILTER নেই → NORMAL CATEGORY ROWS
             ══════════════════════════════════════════════════ */
          <motion.div
            key="has-products"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {groups.map(({ cat, items }, index) => (
              <CategoryRow
                key={cat._id}
                cat={cat}
                items={items}
                index={index}
              />
            ))}
          </motion.div>
        ) : (
          /* ══════════════════════════════════════════════════
             কোনো ডেটা নেই
             ══════════════════════════════════════════════════ */
          <motion.div
            key="no-data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200"
          >
            <p className="text-slate-500 font-medium text-sm sm:text-base">
              কোনো প্রোডাক্ট পাওয়া যায়নি।
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
