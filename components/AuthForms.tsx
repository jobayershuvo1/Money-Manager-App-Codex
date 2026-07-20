"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Mail, UserPlus, Eye, EyeOff } from "lucide-react";
import { api } from "@/components/api";
import { ThemeToggle } from "@/components/ThemeToggle";

type Mode = "login" | "signup" | "forgot" | "reset";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === "login") await api("/api/auth/login", { method: "POST", body: JSON.stringify(form) });
      if (mode === "signup") await api("/api/auth/signup", { method: "POST", body: JSON.stringify(form) });
      if (mode === "forgot") {
        const res = await api<{ message: string }>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify(form) });
        setMessage(res.message);
        return;
      }
      if (mode === "reset") {
        await api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ ...form, token: params.get("token") }) });
        router.push("/login");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }
  const title = { login: "Login", signup: "Create account", forgot: "Reset password", reset: "Set new password" }[mode];
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-8 transition-colors">
      <section className="w-full max-w-md rounded-md border border-stone-200 bg-white p-6 shadow-sm transition-colors">
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-mint text-white">
            {mode === "signup" ? <UserPlus size={22} /> : mode === "forgot" ? <Mail size={22} /> : <LogIn size={22} />}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-stone-500">Private money management workspace</p>
          </div>
        </div>
        <form className="space-y-3" onSubmit={submit}>
          {mode === "signup" && <input name="name" placeholder="Full name" required minLength={2} />}
          {(mode === "login" || mode === "signup" || mode === "forgot") && <input name="email" type="email" placeholder="Email" required />}
          {(mode === "login" || mode === "signup" || mode === "reset") && (
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-500 hover:text-stone-700 dark:text-violet-200/55 dark:hover:text-slate-100"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
          <button
            className="btn-primary w-full shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/20 active:translate-y-0"
            disabled={loading}
          >
            {loading ? "Working..." : title}
          </button>
        </form>
        <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm text-stone-600">
          {mode !== "login" && <Link className="transition hover:text-mint hover:underline" href="/login">Login</Link>}
          {mode !== "signup" && <Link className="transition hover:text-mint hover:underline" href="/signup">Signup</Link>}
          {mode === "login" && <Link className="transition hover:text-mint hover:underline" href="/forgot-password">Forgot password?</Link>}
        </div>
      </section>
    </main>
  );
}
