"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const mainLinks = [
  { href: "/books",        label: "作品库",   icon: "📚" },
  { href: "/write",        label: "写作",     icon: "✍️" },
  { href: "/inspirations", label: "灵感收集", icon: "💡" },
  { href: "/calendar",     label: "日历打卡", icon: "📅" },
  { href: "/readers",      label: "读者来信", icon: "✉️" },
  { href: "/stats",        label: "成绩看板", icon: "🏆" },
];

const toolLinks = [
  { href: "/style",     label: "写作 DNA", icon: "🎨" },
  { href: "/transform", label: "对话炼字", icon: "🔄" },
];

const settingLinks = [
  { href: "/adult-settings", label: "成人设置", icon: "🔞" },
  { href: "/model-settings", label: "模型设置", icon: "⚙️" },
];

const allGroups = [
  { title: null,   links: mainLinks    },
  { title: "工具", links: toolLinks    },
  { title: "设置", links: settingLinks },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  if (pathname === "/" || pathname === "/write") return null;

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="打开菜单"
        className="fixed left-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-[#d8c8a8] bg-[#fdf9f4]/95 text-sm text-[#7c5038] shadow-sm backdrop-blur md:hidden"
      >
        ☰
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/10 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={[
          "flex flex-col overflow-y-auto",
          "bg-[#fdf9f4] border-r border-[#ece3d8]",
          // Mobile: fixed drawer
          "fixed left-0 top-0 z-50 h-full w-60 transition-transform duration-200 ease-in-out",
          open ? "translate-x-0 shadow-xl" : "-translate-x-full",
          // Desktop: static sidebar
          "md:static md:z-auto md:h-auto md:w-52 md:min-h-screen md:translate-x-0 md:shadow-none md:shrink-0",
        ].join(" ")}
      >
        {/* Brand */}
        <div className="flex items-start justify-between px-5 py-6">
          <Link href="/" className="group">
            <p className="text-[10px] font-medium tracking-[0.2em] text-[#b8956a] uppercase">
              Writing Room
            </p>
            <h1 className="mt-1 text-sm font-semibold leading-snug text-[#3d2b1a] group-hover:text-[#7c4f2a] transition-colors">
              声声的写作小屋
            </h1>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="text-lg leading-none text-[#c0a078] hover:text-[#7c5038] transition-colors md:hidden"
          >
            ✕
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-[#ece3d8]" />

        {/* Links */}
        <div className="flex-1 px-3 py-4 space-y-5">
          {allGroups.map(({ title, links }) => (
            <div key={title ?? "main"}>
              {title && (
                <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-widest text-[#b8956a] uppercase">
                  {title}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {links.map(({ href, label, icon }) => {
                  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={[
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-[#f0e6d4] font-medium text-[#7c4f2a]"
                          : "text-[#7c5038] hover:bg-[#f5ede0] hover:text-[#3d2b1a]",
                      ].join(" ")}
                    >
                      <span className="text-base leading-none">{icon}</span>
                      <span>{label}</span>
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#a07030]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom hint */}
        <div className="px-5 pb-6 pt-2">
          <p className="text-[10px] text-[#c0a078] leading-relaxed">慢慢写，慢慢养大故事</p>
        </div>
      </nav>
    </>
  );
}
