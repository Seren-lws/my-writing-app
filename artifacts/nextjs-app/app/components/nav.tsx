"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const mainLinks = [
  { href: "/", label: "首页", icon: "🏠" },
  { href: "/books", label: "作品库", icon: "📚" },
  { href: "/write", label: "写作", icon: "✍️" },
  { href: "/inspirations", label: "灵感收集", icon: "💡" },
  { href: "/calendar", label: "日历打卡", icon: "📅" },
  { href: "/readers", label: "读者来信", icon: "✉️" },
  { href: "/stats", label: "成绩看板", icon: "🏆" },
];

const toolLinks = [
  { href: "/style", label: "写作 DNA", icon: "🎨" },
  { href: "/transform", label: "对话炼字", icon: "🔄" },
];

const settingLinks = [
  { href: "/adult-settings", label: "成人创作设置", icon: "🔞" },
  { href: "/model-settings", label: "模型设置", icon: "⚙️" },
];

const allGroups = [
  { title: null, links: mainLinks },
  { title: "工具", links: toolLinks },
  { title: "设置", links: settingLinks },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname === "/" || pathname === "/write") return null;

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="打开菜单"
        className="fixed left-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 bg-[#fff8eb]/95 text-base text-amber-800 shadow-sm backdrop-blur md:hidden"
      >
        ☰
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={[
          "flex flex-col overflow-y-auto px-4 py-8",
          "bg-amber-50 border-r border-amber-100",
          // Mobile: fixed drawer
          "fixed left-0 top-0 z-50 h-full w-64 transition-transform duration-200 ease-in-out",
          open ? "translate-x-0 shadow-xl" : "-translate-x-full",
          // Desktop: static sidebar
          "md:static md:z-auto md:h-auto md:w-56 md:min-h-screen md:translate-x-0 md:shadow-none md:shrink-0",
        ].join(" ")}
      >
        {/* Brand */}
        <div className="mb-8 flex items-start justify-between px-3">
          <div>
            <h1 className="text-base font-semibold leading-snug text-amber-900">
              声声的写作小屋
            </h1>
            <p className="mt-0.5 text-xs text-amber-400">慢慢写，慢慢养大故事</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-lg leading-none text-amber-400 hover:text-amber-600 md:hidden"
          >
            ✕
          </button>
        </div>

        {/* Links */}
        {allGroups.map(({ title, links }) => (
          <div key={title ?? "main"} className={title ? "mt-6" : ""}>
            {title && (
              <p className="mb-1 px-3 text-xs font-medium tracking-wide text-amber-400">
                {title}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {links.map(({ href, label, icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-amber-200 font-medium text-amber-900"
                        : "text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    <span>{icon}</span>
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}
