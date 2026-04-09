"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isEmbedRoute = pathname.startsWith("/embed/");

  if (isEmbedRoute) {
    return <main id="main-content">{children}</main>;
  }

  return (
    <div className="shell">
      <Header />
      <main className="shell__main" id="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}
