import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SellerHub — Sell everywhere from one place",
  description: "AI poster designer, social scheduler & multi-marketplace lister.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
