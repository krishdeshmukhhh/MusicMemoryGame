import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pitchd",
  description: "The Melody Memory Game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-[100dvh] antialiased">
      <body className="h-full flex flex-col overflow-hidden select-none">{children}</body>
    </html>
  );
}
