import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIUI",
  description: "Open-source AI creative workflow builder",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
