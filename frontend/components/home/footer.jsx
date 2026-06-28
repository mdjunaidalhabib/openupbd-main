"use client";

import Link from "next/link";
import Image from "next/image";
import FooterSkeleton from "../skeletons/FooterSkeleton";
import { useEffect, useState } from "react";
import {
  FaFacebookF,
  FaUsers,
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaPhoneAlt,
  FaEnvelope,
  FaGlobe,
  FaMapMarkerAlt,
  FaUserCircle,
  FaTwitter,
  FaLinkedinIn,
  FaPinterest,
  FaSnapchatGhost,
  FaWhatsapp,
  FaTelegram,
} from "react-icons/fa";

const quickLinksData = [
  { label: "Home", href: "/" },
  { label: "All Products", href: "/products" },
  { label: "All Categories", href: "/categories" },
  { label: "About Us", href: "/about" },
];

const SOCIAL_ICON_MAP = {
  facebook: FaFacebookF,
  facebook_group: FaUsers,
  youtube: FaYoutube,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  twitter: FaTwitter,
  linkedin: FaLinkedinIn,
  pinterest: FaPinterest,
  snapchat: FaSnapchatGhost,
  whatsapp: FaWhatsapp,
  telegram: FaTelegram,
};

export default function Footer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const res = await fetch("/api/footer", {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Failed");

        const json = await res.json();
        setData(json);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, []);

  if (loading) return <FooterSkeleton />;
  if (!data) return null;

  const { brand = {}, contact = {}, socialLinks = [] } = data;

  return (
    <footer className="bg-gray-950 text-gray-300 pt-14 pb-6 px-4 md:px-12 mb-14 md:mb-0">
      <div className="mx-auto max-w-7xl">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              {brand.logo && !imgError ? (
                <Image
                  src={brand.logo}
                  alt={brand?.title || "Brand"}
                  width={55}
                  height={55}
                  className="rounded-xl object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center">
                  <FaUserCircle className="text-3xl text-gray-500" />
                </div>
              )}

              <h2 className="text-2xl font-bold text-white">{brand.title}</h2>
            </div>

            <p className="text-sm leading-7 text-gray-400 max-w-md">
              {brand.about || "Your trusted online shopping destination."}
            </p>

            {/* Social */}
            <div className="flex flex-wrap gap-3 mt-6">
              {socialLinks
                .filter((s) => s.url)
                .map((social, idx) => {
                  const Icon = SOCIAL_ICON_MAP[social.platform];
                  if (!Icon) return null;

                  return (
                    <Link
                      key={idx}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-pink-600 hover:bg-pink-700 transition flex items-center justify-center"
                    >
                      <Icon />
                    </Link>
                  );
                })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-gray-900 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>

            <ul className="space-y-3">
              {quickLinksData.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="hover:text-pink-600 transition"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="bg-gray-900 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Contact</h3>

            <ul className="space-y-3 text-sm">
              {contact.phone && (
                <li className="flex gap-3">
                  <FaPhoneAlt className="mt-1 text-pink-600" />
                  <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                </li>
              )}
              {contact.website && (
                <li className="flex gap-3">
                  <FaGlobe className="mt-1 text-pink-600" />
                  <a
                    href={
                      contact.website.startsWith("http")
                        ? contact.website
                        : `https://${contact.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {contact.website}
                  </a>
                </li>
              )}
              {contact.email && (
                <li className="flex gap-3">
                  <FaEnvelope className="mt-1 text-pink-600" />
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </li>
              )}
              {contact.address && (
                <li className="flex gap-3">
                  <FaMapMarkerAlt className="mt-1 text-pink-600" />
                  <span>{contact.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-4" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-1">
          {/* Copyright */}
          <p className="text-sm text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()} {brand.title}. All Rights Reserved.
          </p>

          {/* Developer */}
          <p className="text-sm text-gray-500 text-center md:text-right">
            Developed by{" "}
            <a
              href="https://hikmahit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600 hover:underline"
            >
              Hikmah IT
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
