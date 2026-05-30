import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  /** Small caps label above the title, e.g. "MY WORKS" */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Back link destination — defaults to "/" */
  backHref?: string;
  /** Back link text — defaults to "← 回到小屋" */
  backLabel?: string;
  /** Optional right-side content (save buttons, selects, etc.) */
  actions?: ReactNode;
  /** Dark mode for deep-study-room pages */
  dark?: boolean;
};

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  backHref = "/",
  backLabel = "← 回到小屋",
  actions,
  dark = false,
}: Props) {
  const backClass = dark
    ? "inline-flex items-center gap-1 rounded-full border border-[#4a3828]/60 bg-[#2a1e14]/80 px-4 py-1.5 text-sm text-[#c0a878] shadow-sm transition hover:border-[#d4a050]/60 hover:text-[#e8dcc8]"
    : "inline-flex items-center gap-1 rounded-full border border-[#e0d4c0] bg-[#faf7f2] px-4 py-1.5 text-sm text-[#7c5038] shadow-sm transition hover:border-[#c8a87a] hover:text-[#3d2b1a]";

  const eyebrowClass = dark
    ? "mb-2 text-[10px] font-semibold tracking-[0.2em] text-[#d4a050] uppercase"
    : "mb-2 text-[10px] font-semibold tracking-[0.2em] text-[#a07840] uppercase";

  const titleClass = dark
    ? "text-3xl font-semibold text-[#f0e6d4]"
    : "text-3xl font-semibold text-[#3d2b1a]";

  const subtitleClass = dark
    ? "mt-2 text-sm text-[#b0a088] leading-relaxed"
    : "mt-2 text-sm text-[#7c5038] leading-relaxed";

  return (
    <header className="mb-8">
      {/* Top row: back link + actions */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href={backHref} className={backClass}>
          {backLabel}
        </Link>
        {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
      </div>

      {/* Eyebrow + title + subtitle */}
      {eyebrow && <p className={eyebrowClass}>{eyebrow}</p>}
      <h1 className={titleClass}>{title}</h1>
      {subtitle && <p className={subtitleClass}>{subtitle}</p>}
    </header>
  );
}
