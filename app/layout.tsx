/**
 * =====================================================================
 * ⚛️ ATOM INDEX: src/app/layout.tsx (RootLayout)
 * =====================================================================
 * 🎯 [业务逻辑]:
 * 项目的物理外壳。负责 HTML 根结构、字体加载及全局样式注入。
 * 📥 [进 (Input)]:
 * - Metadata 对象：定义标题与描述。
 * - Children：所有下级页面组件。
 * 📤 [出 (Output)]:
 * - 渲染：标准的 HTML 页面结构。
 * 🔗 [牵连与边界]:
 * - 强制引入：`./globals.css`。
 * =====================================================================
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import AuthStrip from "@/components/auth/AuthStrip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Midjourney — Explore",
  description: "Midjourney UI Clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <div className="fixed top-2 right-3 z-[200] pointer-events-auto">
            <AuthStrip />
          </div>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
