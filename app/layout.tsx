import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pitchd.",
  description: "The Melody Memory Game",
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎵</text></svg>',
  },
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
