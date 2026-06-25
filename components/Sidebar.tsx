"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bus, Wrench, Zap, Moon, Phone, MessageSquareWarning, Info, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Bus Tracker", icon: Bus },
  { href: "/directory", label: "Services & Shops", icon: Wrench },
  { href: "/updates", label: "Power & Water", icon: Zap },
  { href: "/namaz", label: "Namaz Timings", icon: Moon },
  { href: "/emergency", label: "Emergency", icon: Phone },
  { href: "/report", label: "Report a Bus", icon: MessageSquareWarning },
  { href: "/about", label: "About", icon: Info },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Bus className="h-6 w-6 text-accent" />
            <span>Vaniyambadi Bus</span>
          </Link>
          <div className="w-10" />
        </div>
      </header>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[75vw] max-w-[280px] bg-white shadow-xl transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <span className="font-bold text-gray-900 text-lg">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <nav className="flex flex-col py-2">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 min-h-[56px] w-full text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary border-r-2 border-primary"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
