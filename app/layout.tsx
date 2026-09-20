import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Digital Heroes — Play. Give. Win.",
  description: "Golf performance tracking, monthly draws, and charity giving — all in one platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0b1220] text-slate-100 min-h-screen font-sans">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
