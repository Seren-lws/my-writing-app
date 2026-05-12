import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/nav";

export const metadata: Metadata = {
  title: "Inkwell",
  description: "Your cozy writing space",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex bg-stone-50 text-stone-800 min-h-screen font-sans antialiased">
        <Nav />
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
