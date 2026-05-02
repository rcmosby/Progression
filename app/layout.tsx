import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "PROGRESSION",
  description: "Track your workouts and progress",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PROGRESSION",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <ThemeProvider>
          <main className="pb-20">{children}</main>
          <Navigation />
        </ThemeProvider>
      </body>
    </html>
  );
}
