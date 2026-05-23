import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/nav";

export const metadata: Metadata = {
  title: "声声的写作小屋",
  description: "更多陪伴的专属写作空间",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="flex bg-[#f5f0e8] text-[#3d2b1a] min-h-screen font-sans antialiased">
        <Nav />
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
