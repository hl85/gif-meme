import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Shell({ children }: { children: ReactNode }) {
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
