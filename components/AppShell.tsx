"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, ChartPie, Folder, Home, LogOut, Menu, Receipt, Wallet, X } from "lucide-react";
import { useState } from "react";
import { api } from "@/components/api";
import { ThemeToggle } from "@/components/ThemeToggle";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/incomes", label: "Income", icon: Wallet },
  { href: "/categories", label: "Categories", icon: Folder },
  { href: "/reports", label: "Reports", icon: ChartPie },
  { href: "/ai", label: "AI", icon: Bot }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  const navItems = (
    <>
      {nav.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            onClick={() => setMenuOpen(false)}
            className={`btn min-h-11 justify-start ${active ? "bg-ink text-white dark:bg-violet-300 dark:text-purple-950" : "border border-stone-200 bg-white text-ink hover:bg-stone-50 hover:text-ink dark:border-violet-800 dark:bg-purple-950 dark:text-violet-50 dark:hover:border-violet-400 dark:hover:bg-violet-400 dark:hover:text-purple-950"}`}
          >
            <Icon className="shrink-0" size={18} />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
  const desktopNavItems = nav.map((item) => {
    const Icon = item.icon;
    const active = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        title={item.label}
        className={`btn min-h-10 px-2 text-sm xl:px-3 ${active ? "bg-ink text-white dark:bg-violet-300 dark:text-purple-950" : "border border-stone-200 bg-white text-ink hover:bg-stone-50 hover:text-ink dark:border-violet-800 dark:bg-purple-950 dark:text-violet-50 dark:hover:border-violet-400 dark:hover:bg-violet-400 dark:hover:text-purple-950"}`}
      >
        <Icon className="shrink-0" size={17} />
        <span className="hidden xl:inline">{item.label}</span>
      </Link>
    );
  });
  return (
    <main className="min-h-screen bg-paper transition-colors">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button className="btn-soft h-10 w-10 px-0 lg:hidden" onClick={() => setMenuOpen((open) => !open)} title={menuOpen ? "Close menu" : "Open menu"} type="button">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link href="/dashboard" className="min-w-0 truncate text-base font-black tracking-normal sm:text-lg">Money Manager</Link>
          </div>
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2 lg:flex">
            {desktopNavItems}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="btn-soft h-10 w-10 px-0" onClick={logout} title="Logout"><LogOut size={18} /></button>
          </div>
        </div>
        {menuOpen && (
          <nav className="grid gap-2 border-t border-stone-200 bg-white/95 px-3 py-3 shadow-lg dark:border-violet-800 dark:bg-purple-950/95 sm:grid-cols-2 lg:hidden">
            {navItems}
          </nav>
        )}
      </header>
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 lg:py-5">
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}
