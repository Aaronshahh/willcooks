import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Will Cooks",
  description:
    "Recipes from around the world by Will – a cooking blog with a world map of flavors.",
  openGraph: {
    title: "Will Cooks",
    description: "Recipes from around the world by Will.",
    siteName: "Will Cooks",
  },
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
