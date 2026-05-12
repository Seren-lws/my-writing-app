"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/write", label: "Write", icon: "✍️" },
  { href: "/inspirations", label: "Inspirations", icon: "💡" },
  { href: "/style", label: "Style", icon: "🎨" },
  { href: "/transform", label: "Transform", icon: "🔄" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 bg-amber-50 border-r border-amber-100 min-h-screen px-4 py-8 flex flex-col gap-1">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-amber-900 tracking-tight">Inkwell</h1>
        <p className="text-xs text-amber-500 mt-0.5">Your writing space</p>
      </div>
      {links.map(({ href, label, icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              active
                ? "bg-amber-200 text-amber-900 font-medium"
                : "text-amber-700 hover:bg-amber-100"
            }`}
          >
            <span>{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
