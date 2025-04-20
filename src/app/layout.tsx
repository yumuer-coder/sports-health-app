import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import React from "react";
import "./globals.css";


export const metadata: Metadata = {
  title: "AI健身App",
  description: "AI驱动的健身和营养管理应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
