import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { MessageSquareWarning } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: "#1E3A8A",
};

export const metadata: Metadata = {
  title: "Vaniyambadi Bus Tracker",
  description: "Vaniyambadi bus timings live tracking, schedules, and crowd-reported bus locations.",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "VNB Bus",
    statusBarStyle: "default",
    capable: true,
  },
  icons: {
    icon: "/icons/favicon-32.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "Vaniyambadi Bus Tracker",
    description: "Vaniyambadi bus timings live tracking, schedules, and crowd-reported bus locations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 text-gray-900 flex flex-col min-h-screen`}>
        <Navbar />
        
        {/* Main Content */}
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Global Floating Action Button for Reporting */}
        <div className="fixed bottom-6 right-6 z-50">
          <Link
            href="/report"
            className="flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            aria-label="Report a Bus"
          >
            <MessageSquareWarning className="h-5 w-5" />
            <span className="hidden sm:inline">Report Bus</span>
          </Link>
        </div>

        {/* Footer */}
        <footer className="w-full border-t bg-white py-6 mt-auto">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
            <p className="text-sm text-gray-500 font-medium">
              Built for Vaniyambadi
            </p>
            <nav className="flex gap-6 text-sm text-gray-600">
              <Link href="/about" className="hover:text-primary transition-colors">
                About
              </Link>
              <Link href="/about#feedback" className="hover:text-primary transition-colors">
                Feedback
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
