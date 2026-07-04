"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, ChartPie, Folder, Home, LogOut, Receipt, Wallet } from "lucide-react";
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
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  return (
    <main className="min-h-screen bg-paper transition-colors">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" className="text-lg font-black tracking-normal">Money Manager</Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="btn-soft h-10 w-10 px-0" onClick={logout} title="Logout"><LogOut size={18} /></button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 md:grid-cols-[210px_1fr]">
        <nav className="grid grid-cols-3 gap-2 md:block md:space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`btn min-h-11 justify-start ${active ? "bg-ink text-white dark:bg-violet-300 dark:text-purple-950" : "border border-stone-200 bg-white text-ink hover:bg-stone-50 hover:text-ink dark:border-violet-800 dark:bg-purple-950 dark:text-violet-50 dark:hover:border-violet-400 dark:hover:bg-violet-400 dark:hover:text-purple-950"}`}>
                <Icon size={18} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <section>{children}</section>
      </div>
    </main>
  );
}
