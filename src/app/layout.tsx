import type {Metadata} from "next";

import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-950">{children}</body>
    </html>
  );
}
