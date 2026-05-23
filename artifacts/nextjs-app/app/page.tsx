import Image from "next/image";
import Link from "next/link";
import RainWindow from "./components/RainWindow";

// Button positions tuned to desk2.png (941 × 1672)
// 我的作品 → bookshelf (top), 写作 → notebook center,
// 日历 → calendar stand, 成绩 → trophy cup,
// 灵感 → sticky notes cluster, 对话炼字 → robot, 读者来信 → envelope
const DESK_LINKS = [
  {
    label: "我的作品",
    href: "/books",
    top: "8%",
    left: "50%",
    translate: "-50%, -50%",
    wide: true,
  },
  {
    label: "写作",
    href: "/write",
    top: "62%",
    left: "46%",
    translate: "-50%, -50%",
  },
  {
    label: "日历",
    href: "/calendar",
    top: "24%",
    left: "68%",
    translate: "-50%, -50%",
  },
  {
    label: "成绩",
    href: "/stats",
    top: "48%",
    left: "83%",
    translate: "-50%, -50%",
  },
  {
    label: "灵感",
    href: "/inspirations",
    top: "75%",
    left: "16%",
    translate: "-50%, -50%",
  },
  {
    label: "对话炼字",
    href: "/transform",
    top: "83%",
    left: "43%",
    translate: "-50%, -50%",
  },
  {
    label: "读者来信",
    href: "/readers",
    top: "87%",
    left: "70%",
    translate: "-50%, -50%",
  },
];

const SETTINGS_LINKS = [
  { label: "写作 DNA", href: "/style" },
  { label: "成人设置", href: "/adult-settings" },
  { label: "模型设置", href: "/model-settings" },
];

// Shared overlay button style (works on both dark wood image and dark bg)
const btnCls = (wide?: boolean) =>
  [
    "absolute rounded-xl border border-[#c8a060]/55 bg-[#fffaf0]/22 px-4 py-1.5",
    "text-center text-sm font-semibold text-[#2a1205]",
    "backdrop-blur-[2px] transition-all duration-200",
    "hover:-translate-y-0.5 hover:border-[#c8a060] hover:bg-[#fffaf0]/80 hover:shadow-lg",
    wide ? "min-w-[150px]" : "min-w-[72px]",
  ].join(" ");

export default function Home() {
  return (
    // Mobile: dark wood bg; Desktop: rainy-night atmospheric dark
    <main className="min-h-screen bg-[#2a1608] text-[#f0e6d3] md:bg-[#141e2c]">

      {/* Rain drops — desktop only, fixed full-screen */}
      <RainWindow />

      {/* ── Desktop layout ─────────────────────────────────────────────── */}
      <div className="relative z-10 hidden md:flex md:flex-col md:items-center md:py-10">
        <header className="mb-6 text-center">
          <p className="text-xs tracking-[0.25em] text-[#6a8aa8]">
            SHENGSHENG WRITING ROOM
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#e0ccaa]">
            声声的写作小屋
          </h1>
        </header>

        {/* Desk image card — warm glow on dark rainy bg */}
        <div
          className="relative w-full max-w-[480px] overflow-hidden rounded-2xl"
          style={{ boxShadow: "0 12px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(200,160,80,0.15), 0 0 80px rgba(180,120,40,0.08)" }}
        >
          <Image
            src="/desk2.png"
            alt="书桌"
            width={941}
            height={1672}
            className="w-full select-none"
            priority
          />
          {DESK_LINKS.map(({ label, href, top, left, translate, wide }) => (
            <Link
              key={label}
              href={href}
              style={{ top, left, transform: `translate(${translate})` }}
              className={btnCls(wide)}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Settings links */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {SETTINGS_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="rounded-full border border-[#3a4e62]/80 bg-[#ffffff]/5 px-5 py-2 text-sm text-[#8aaabf] backdrop-blur-sm transition hover:border-[#6a8aa8] hover:bg-[#ffffff]/10 hover:text-[#c8d8e8]"
            >
              {label}
            </Link>
          ))}
        </div>

        <p className="mt-5 mb-2 text-center text-xs text-[#3a5068]">
          更好陪伴，更多趣味，更强动力。
        </p>
      </div>

      {/* ── Mobile layout: full-screen image with overlays ──────────────── */}
      <div className="relative z-10 md:hidden">
        <Image
          src="/desk2.png"
          alt="书桌"
          width={941}
          height={1672}
          className="w-full select-none"
          priority
        />

        {/* Title overlay at top (over the dark bookshelf) */}
        <div className="absolute inset-x-0 top-0 pt-10 text-center pointer-events-none">
          <p className="text-[10px] tracking-[0.25em] text-[#d4b070] drop-shadow">
            SHENGSHENG WRITING ROOM
          </p>
          <h1 className="mt-1 text-xl font-semibold text-[#f5e8d0] drop-shadow-sm">
            声声的写作小屋
          </h1>
        </div>

        {/* Desk link buttons */}
        {DESK_LINKS.map(({ label, href, top, left, translate, wide }) => (
          <Link
            key={label}
            href={href}
            style={{ top, left, transform: `translate(${translate})` }}
            className={[
              "absolute rounded-xl border border-[#c8a060]/55 bg-[#fffaf0]/22 px-4 py-1.5",
              "text-center text-sm font-semibold text-[#2a1205]",
              "backdrop-blur-[2px] transition-all duration-200",
              "active:border-[#c8a060] active:bg-[#fffaf0]/80",
              wide ? "min-w-[130px]" : "min-w-[64px]",
            ].join(" ")}
          >
            {label}
          </Link>
        ))}

        {/* Settings overlay at bottom */}
        <div className="absolute inset-x-0 bottom-5 flex flex-wrap justify-center gap-2 px-4">
          {SETTINGS_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="rounded-full border border-[#c8a060]/50 bg-[#fffaf0]/30 px-4 py-1.5 text-xs font-medium text-[#2a1205] backdrop-blur-[2px]"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

    </main>
  );
}
