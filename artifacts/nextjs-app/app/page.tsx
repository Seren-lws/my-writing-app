import Image from "next/image";
import Link from "next/link";

const DESK_LINKS = [
  {
    label: "我的作品",
    href: "/books",
    top: "7%",
    left: "50%",
    translate: "-50%, 0",
    wide: true,
  },
  {
    label: "日历",
    href: "/calendar",
    top: "24%",
    left: "60%",
    translate: "-50%, -50%",
  },
  {
    label: "成绩",
    href: "/stats",
    top: "33%",
    left: "87%",
    translate: "-50%, -50%",
  },
  {
    label: "写作",
    href: "/write",
    top: "62%",
    left: "50%",
    translate: "-50%, -50%",
  },
  {
    label: "对话炼字",
    href: "/transform",
    top: "63%",
    left: "84%",
    translate: "-50%, -50%",
  },
  {
    label: "灵感",
    href: "/inspirations",
    top: "76%",
    left: "17%",
    translate: "-50%, -50%",
  },
  {
    label: "读者来信",
    href: "/readers",
    top: "83%",
    left: "83%",
    translate: "-50%, -50%",
  },
];

const SETTINGS_LINKS = [
  { label: "写作 DNA", href: "/style" },
  { label: "成人设置", href: "/adult-settings" },
  { label: "模型设置", href: "/model-settings" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#1a0f08] text-[#f0e6d3]">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-8">

        <header className="mb-6 text-center">
          <p className="text-xs tracking-[0.25em] text-[#9b744d]">
            SHENGSHENG WRITING ROOM
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#f0e6d3]">
            声声的写作小屋
          </h1>
        </header>

        <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl">
          <Image
            src="/desk.png"
            alt="书桌"
            width={1090}
            height={1090}
            className="w-full select-none"
            priority
          />

          {DESK_LINKS.map(({ label, href, top, left, translate, wide }) => (
            <Link
              key={label}
              href={href}
              style={{ top, left, transform: `translate(${translate})` }}
              className={[
                "absolute rounded-xl border border-[#c8a060]/50 bg-[#fffaf0]/25 px-4 py-1.5",
                "text-center text-sm font-semibold text-[#2a1205]",
                "backdrop-blur-[2px] transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-[#c8a060] hover:bg-[#fffaf0]/80 hover:shadow-lg",
                wide ? "min-w-[150px]" : "min-w-[72px]",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {SETTINGS_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="rounded-full border border-[#6e4b2d]/60 bg-[#2d1a0a] px-5 py-2 text-sm text-[#c7a984] transition hover:border-[#9b744d] hover:text-[#f0e6d3]"
            >
              {label}
            </Link>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-[#6e4b2d]">
          更好陪伴，更多趣味，更强动力。
        </p>
      </div>
    </main>
  );
}
