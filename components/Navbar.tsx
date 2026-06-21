"use client";

import Link from "next/link";
import { Bus } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Bus className="h-6 w-6 text-accent" />
          <span>Vaniyambadi Bus</span>
        </Link>
      </div>
    </header>
  );
}
