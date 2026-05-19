"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const mainLinks = [
  { href: "/", label: "首页", icon: "🏠" },
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

function NavGroup({
  links,
}: {
  links: { href: string; label: string; icon: string }[];
}) {
  const pathname = usePathname();
  return (
    <>
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
    </>
  );
}

export default function Nav() {
  return (
    <nav className="w-56 shrink-0 bg-amber-50 border-r border-amber-100 min-h-screen px-4 py-8 flex flex-col">
      <div className="mb-8 px-3">
        <h1 className="text-base font-semibold text-amber-900 leading-snug">
          声声的写作小屋
        </h1>
        <p className="text-xs text-amber-400 mt-0.5">慢慢写，慢慢养大故事</p>
      </div>

      <div className="flex flex-col gap-1">
        <NavGroup links={mainLinks} />
      </div>

      <div className="mt-6 flex flex-col gap-1">
        <p className="px-3 mb-1 text-xs text-amber-400 font-medium tracking-wide">
          工具
        </p>
        <NavGroup links={toolLinks} />
      </div>

      <div className="mt-6 flex flex-col gap-1">
        <p className="px-3 mb-1 text-xs text-amber-400 font-medium tracking-wide">
          设置
        </p>
        <NavGroup links={settingLinks} />
      </div>
    </nav>
  );
}
