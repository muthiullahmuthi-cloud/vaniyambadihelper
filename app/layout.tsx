import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { MessageSquareWarning, Store } from "lucide-react";

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
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Global Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          <Link
            href="/directory/register"
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Register Your Business"
          >
            <Store className="h-5 w-5" />
            <span className="hidden sm:inline">Register</span>
          </Link>
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
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-gray-500 font-medium">
              &copy; Vaniyambadi Helper
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
