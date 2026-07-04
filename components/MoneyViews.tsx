"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, money, todayMonth } from "@/components/api";
import { CategoryPie, DailyTrend, IncomeExpenseChart } from "@/components/Charts";

type Category = { id: string; name: string; color: string; isDefault?: boolean };
type Expense = { id: string; amount: number; date: string; note?: string; paymentMethod: string; category: Category };
type Income = { id: string; amount: number; date: string; source: string; note?: string };
type Budget = { id: string; month: string; amount: number; category?: Category | null };
type AiPreview = {
  original: string;
  corrected: string;
  parsed: {
    transactionType: "INCOME" | "EXPENSE";
    amount: number;
    categoryName: string;
    source: string;
    date: string;
    note: string;
    paymentMethod: string;
  };
  category?: { id: string; name: string } | null;
};
type Summary = {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  balance: number;
  byCategory: { categoryId: string; category: string; amount: number; color?: string }[];
  dailyTrend: { date: string; amount: number }[];
  budgets: { id: string; category: string; amount: number }[];
  incomeVsExpense?: { name: string; value: number }[];
};

function MonthPicker({ month, setMonth }: { month: string; setMonth: (month: string) => void }) {
  return <input className="max-w-48" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />;
}

function currentLocalDateTime() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function useAutoDateTime() {
  const [value, setValue] = useState(currentLocalDateTime);
  const [isUserEdited, setIsUserEdited] = useState(false);

  useEffect(() => {
    if (isUserEdited) return;
    const interval = window.setInterval(() => setValue(currentLocalDateTime()), 30000);
    return () => window.clearInterval(interval);
  }, [isUserEdited]);

  return {
    value,
    onChange: (next: string) => {
      setIsUserEdited(true);
      setValue(next);
    },
    reset: () => {
      setIsUserEdited(false);
      setValue(currentLocalDateTime());
    }
  };
}

function shortDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" });
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="panel min-h-28">
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone || ""}`}>{money(value)}</p>
    </div>
  );
}

function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const load = () => api<{ categories: Category[] }>("/api/categories").then((r) => setCategories(r.categories)).catch(() => {});
  useEffect(() => {
    load();
  }, []);
  return { categories, loadCategories: load };
}

export function DashboardView() {
  const [month, setMonth] = useState(todayMonth());
  const [summary, setSummary] = useState<Summary | null>(null);
  useEffect(() => { api<Summary>(`/api/dashboard?month=${month}`).then(setSummary).catch(() => location.href = "/login"); }, [month]);
  if (!summary) return <AppShell><div className="panel">Loading...</div></AppShell>;
  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Dashboard</h1>
        <MonthPicker month={month} setMonth={setMonth} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Monthly income" value={summary.income} tone="text-mint" />
        <Stat label="Expenses" value={summary.expenses} tone="text-coral" />
        <Stat label="Savings" value={summary.savings} tone="text-gold" />
        <Stat label="Balance" value={summary.balance} tone={summary.balance < 0 ? "text-coral" : "text-ink"} />
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="panel"><h2 className="mb-3 font-bold">Category spending</h2><CategoryPie data={summary.byCategory} /></div>
        <BudgetBox month={month} />
      </div>
    </AppShell>
  );
}

function BudgetBox({ month }: { month: string }) {
  const { categories } = useCategories();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [message, setMessage] = useState("");
  const loadBudgets = () => api<{ budgets: Budget[] }>(`/api/budgets?month=${month}`).then((r) => setBudgets(r.budgets));
  useEffect(() => {
    loadBudgets().catch(() => {});
  }, [month]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = Object.fromEntries(new FormData(formElement));
    await api("/api/budgets", { method: "POST", body: JSON.stringify({ ...form, month, categoryId: form.categoryId || null }) });
    formElement.reset();
    await loadBudgets();
    setMessage("Budget saved");
    window.setTimeout(() => setMessage(""), 3000);
  }
  return (
    <div className="panel">
      <h2 className="mb-3 font-bold">Monthly budget</h2>
      <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={save}>
        <select name="categoryId"><option value="">Overall</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <input name="amount" type="number" min="1" step="0.01" placeholder="Amount" required />
        <button className="btn-primary"><Plus size={18} />Save</button>
      </form>
      {message && <SuccessMessage text={message} />}
      <div className="mt-4 space-y-2">
        {budgets.map((budget) => (
          <div className="flex items-center justify-between rounded-md bg-stone-50 px-3 py-2 text-sm dark:bg-purple-950" key={budget.id}>
            <span>{budget.category?.name || "Overall"}</span>
            <strong>{money(budget.amount)}</strong>
          </div>
        ))}
        {!budgets.length && <p className="text-sm text-stone-500">No budget saved for this month.</p>}
      </div>
    </div>
  );
}

export function ExpensesView() {
  const { categories } = useCategories();
  const dateTime = useAutoDateTime();
  const [month, setMonth] = useState(todayMonth());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({ categoryId: "", paymentMethod: "", start: "", end: "" });
  const query = useMemo(() => new URLSearchParams({ month, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }).toString(), [month, filters]);
  const load = () => api<{ expenses: Expense[] }>(`/api/expenses?${query}`).then((r) => setExpenses(r.expenses));
  useEffect(() => { load().catch(() => location.href = "/login"); }, [query]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = Object.fromEntries(new FormData(formElement));
    await api("/api/expenses", { method: "POST", body: JSON.stringify(form) });
    formElement.reset();
    dateTime.reset();
    setSuccess("Expense added");
    window.setTimeout(() => setSuccess(""), 3000);
    load();
  }
  async function remove(id: string) {
    await api(`/api/expenses/${id}`, { method: "DELETE" });
    load();
  }
  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-black">Expenses</h1><MonthPicker month={month} setMonth={setMonth} /></div>
      <div className="panel mb-4">
        <form className="grid gap-3 md:grid-cols-5" onSubmit={submit}>
          <input name="amount" type="number" min="1" step="0.01" placeholder="Amount" required />
          <input name="date" type="datetime-local" value={dateTime.value} onChange={(e) => dateTime.onChange(e.target.value)} required />
          <select name="categoryId" required><option value="">Category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select name="paymentMethod"><option value="CASH">Cash</option><option value="CARD">Card</option><option value="BANK">Bank</option><option value="MOBILE_BANKING">Mobile banking</option><option value="OTHER">Other</option></select>
          <button className="btn-primary"><Plus size={18} />Add</button>
          <input className="md:col-span-5" name="note" placeholder="Note" />
        </form>
        {success && <SuccessMessage text={success} />}
      </div>
      <div className="panel mb-4 grid gap-3 md:grid-cols-4">
        <select value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}><option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={filters.paymentMethod} onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}><option value="">All payments</option><option value="CASH">Cash</option><option value="CARD">Card</option><option value="BANK">Bank</option><option value="MOBILE_BANKING">Mobile banking</option><option value="OTHER">Other</option></select>
        <input type="date" value={filters.start} onChange={(e) => setFilters({ ...filters, start: e.target.value })} />
        <input type="date" value={filters.end} onChange={(e) => setFilters({ ...filters, end: e.target.value })} />
      </div>
      <Rows items={expenses.map((e) => ({ id: e.id, left: `${e.category?.name || "Category"} - ${e.note || ""}`, right: money(e.amount), sub: `${shortDateTime(e.date)} - ${e.paymentMethod}` }))} onRemove={remove} />
    </AppShell>
  );
}

export function IncomesView() {
  const dateTime = useAutoDateTime();
  const [month, setMonth] = useState(todayMonth());
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [success, setSuccess] = useState("");
  const load = () => api<{ incomes: Income[] }>(`/api/incomes?month=${month}`).then((r) => setIncomes(r.incomes));
  useEffect(() => { load().catch(() => location.href = "/login"); }, [month]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = Object.fromEntries(new FormData(formElement));
    await api("/api/incomes", { method: "POST", body: JSON.stringify(form) });
    formElement.reset();
    dateTime.reset();
    setSuccess("Income added");
    window.setTimeout(() => setSuccess(""), 3000);
    load();
  }
  async function remove(id: string) {
    await api(`/api/incomes/${id}`, { method: "DELETE" });
    load();
  }
  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-black">Income</h1><MonthPicker month={month} setMonth={setMonth} /></div>
      <div className="panel mb-4">
        <form className="grid gap-3 md:grid-cols-5" onSubmit={submit}>
          <input name="amount" type="number" min="1" step="0.01" placeholder="Amount" required />
          <input name="date" type="datetime-local" value={dateTime.value} onChange={(e) => dateTime.onChange(e.target.value)} required />
          <input name="source" placeholder="Source" required />
          <input name="note" placeholder="Note" />
          <button className="btn-primary"><Plus size={18} />Add</button>
        </form>
        {success && <SuccessMessage text={success} />}
      </div>
      <Rows items={incomes.map((i) => ({ id: i.id, left: i.source, right: money(i.amount), sub: `${shortDateTime(i.date)} ${i.note || ""}` }))} onRemove={remove} />
    </AppShell>
  );
}

export function CategoriesView() {
  const { categories, loadCategories } = useCategories();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = Object.fromEntries(new FormData(formElement));
    await api("/api/categories", { method: "POST", body: JSON.stringify(form) });
    formElement.reset();
    loadCategories();
  }
  async function remove(id: string) {
    await api(`/api/categories/${id}`, { method: "DELETE" });
    loadCategories();
  }
  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-black">Categories</h1>
      <div className="panel mb-4">
        <form className="grid gap-3 sm:grid-cols-[1fr_100px_auto]" onSubmit={submit}>
          <input name="name" placeholder="Custom category" required />
          <input name="color" type="color" defaultValue="#2EA871" title="Color" />
          <button className="btn-primary"><Plus size={18} />Add</button>
        </form>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div className="panel flex items-center justify-between gap-3" key={c.id}>
            <span className="flex min-w-0 items-center gap-2"><i className="h-4 w-4 rounded-full" style={{ background: c.color }} /> <span className="truncate">{c.name}</span></span>
            <button className="btn-soft h-10 w-10 px-0" disabled={c.isDefault} onClick={() => remove(c.id)} title="Delete"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export function ReportsView() {
  const [month, setMonth] = useState(todayMonth());
  const [summary, setSummary] = useState<Summary | null>(null);
  useEffect(() => { api<Summary>(`/api/reports?month=${month}`).then(setSummary).catch(() => location.href = "/login"); }, [month]);
  if (!summary) return <AppShell><div className="panel">Loading...</div></AppShell>;
  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-black">Monthly report</h1><MonthPicker month={month} setMonth={setMonth} /></div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="panel"><h2 className="mb-3 font-bold">Income vs expense</h2><IncomeExpenseChart data={summary.incomeVsExpense || []} /></div>
        <div className="panel"><h2 className="mb-3 font-bold">Category breakdown</h2><CategoryPie data={summary.byCategory} /></div>
        <div className="panel"><h2 className="mb-3 font-bold">Daily spending trend</h2><DailyTrend data={summary.dailyTrend} /></div>
      </div>
    </AppShell>
  );
}

export function AiView() {
  const expenseExample = "\u0986\u099c\u0995\u09c7 \u0996\u09be\u09ac\u09be\u09b0\u09c7 300 \u099f\u09be\u0995\u09be \u0996\u09b0\u099a \u09b9\u09df\u09c7\u099b\u09c7";
  const incomeExample = "\u0986\u099c\u0995\u09c7 \u09ac\u09c7\u09a4\u09a8 50000 \u099f\u09be\u0995\u09be \u09aa\u09c7\u09df\u09c7\u099b\u09bf";
  const [text, setText] = useState(expenseExample);
  const [result, setResult] = useState("");
  const [correction, setCorrection] = useState("");
  const [preview, setPreview] = useState<AiPreview | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  async function fixTypo() {
    setLoading(true);
    setResult("");
    setCorrection("");
    setPreview(null);
    try {
      const data = await api<{ corrected: string }>("/api/ai/correct", { method: "POST", body: JSON.stringify({ text }) });
      setText(data.corrected);
      setCorrection(data.corrected === text ? "No typo found" : "Typo fixed");
    } catch (err) {
      setCorrection(err instanceof Error ? err.message : "Typo fix failed");
    } finally {
      setLoading(false);
    }
  }
  async function previewTransaction() {
    setLoading(true);
    setResult("");
    setCorrection("");
    setPreview(null);
    try {
      const data = await api<AiPreview>("/api/ai/preview", { method: "POST", body: JSON.stringify({ text }) });
      setPreview(data);
      if (data.corrected !== text) setText(data.corrected);
    } catch (err) {
      setResult(err instanceof Error ? err.message : "AI preview failed");
    } finally {
      setLoading(false);
    }
  }
  async function savePreview() {
    if (!preview) return;
    setLoading(true);
    setResult("");
    try {
      if (preview.parsed.transactionType === "INCOME") {
        await api("/api/incomes", {
          method: "POST",
          body: JSON.stringify({
            amount: preview.parsed.amount,
            date: preview.parsed.date,
            source: preview.parsed.source || "AI entry",
            note: preview.corrected
          })
        });
      } else {
        if (!preview.category?.id) throw new Error("Category missing");
        await api("/api/expenses", {
          method: "POST",
          body: JSON.stringify({
            amount: preview.parsed.amount,
            date: preview.parsed.date,
            categoryId: preview.category.id,
            note: preview.corrected,
            paymentMethod: preview.parsed.paymentMethod || "CASH"
          })
        });
      }
      const label = preview.parsed.transactionType === "INCOME" ? preview.parsed.source : preview.category?.name || preview.parsed.categoryName;
      setResult(`${preview.parsed.transactionType.toLowerCase()} saved: ${money(preview.parsed.amount)} - ${label} - ${preview.parsed.date}`);
      setPreview(null);
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }
  async function loadInsights() {
    setLoading(true);
    try {
      const data = await api<{ insights: string[] }>(`/api/ai/insights?month=${todayMonth()}`);
      setInsights(data.insights);
    } finally {
      setLoading(false);
    }
  }
  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-black">AI assistant</h1>
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="panel">
          <textarea rows={6} value={text} onChange={(e) => { setText(e.target.value); setPreview(null); setCorrection(""); setResult(""); }} placeholder={expenseExample} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-soft" onClick={() => setText(expenseExample)} type="button">Expense example</button>
            <button className="btn-soft" onClick={() => setText(incomeExample)} type="button">Income example</button>
            <button className="btn-soft" onClick={fixTypo} disabled={loading} type="button"><Sparkles size={18} />Fix typo</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={previewTransaction} disabled={loading}><Bot size={18} />Check with AI</button>
            <button className="btn-soft" onClick={loadInsights} disabled={loading}><RefreshCw size={18} />Monthly suggestions</button>
          </div>
          {correction && <p className="mt-3 rounded-md bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-800 dark:bg-violet-300/15 dark:text-violet-100">{correction}</p>}
          {preview && (
            <div className="mt-4 rounded-md border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950 dark:border-violet-700 dark:bg-purple-950 dark:text-violet-50">
              <div className="grid gap-2 sm:grid-cols-2">
                <p><strong>Type:</strong> {preview.parsed.transactionType}</p>
                <p><strong>Amount:</strong> {money(preview.parsed.amount)}</p>
                <p><strong>Date:</strong> {preview.parsed.date}</p>
                <p><strong>{preview.parsed.transactionType === "INCOME" ? "Source" : "Category"}:</strong> {preview.parsed.transactionType === "INCOME" ? preview.parsed.source : preview.category?.name || preview.parsed.categoryName}</p>
                {preview.parsed.transactionType === "EXPENSE" && <p><strong>Payment:</strong> {preview.parsed.paymentMethod}</p>}
                {preview.corrected !== preview.original && <p className="sm:col-span-2"><strong>Fixed text:</strong> {preview.corrected}</p>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn-primary" onClick={savePreview} disabled={loading}><CheckCircle2 size={18} />Save</button>
                <button className="btn-soft" onClick={() => setPreview(null)} disabled={loading}>Cancel</button>
              </div>
            </div>
          )}
          {result && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{result}</p>}
        </div>
        <div className="panel">
          <h2 className="mb-3 font-bold">Suggestions</h2>
          <div className="space-y-2">
            {insights.map((item, index) => <p className="rounded-md bg-stone-50 p-3 text-sm" key={index}>{item}</p>)}
            {!insights.length && <p className="text-sm text-stone-500">Run monthly suggestions to see spending warnings and budget ideas.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SuccessMessage({ text }: { text: string }) {
  return (
    <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
      <CheckCircle2 size={18} />
      {text}
    </p>
  );
}

function Rows({ items, onRemove }: { items: { id: string; left: string; right: string; sub: string }[]; onRemove: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div className="panel flex items-center justify-between gap-3" key={item.id}>
          <div className="min-w-0">
            <p className="truncate font-semibold">{item.left}</p>
            <p className="truncate text-sm text-stone-500">{item.sub}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <strong>{item.right}</strong>
            <button className="btn-soft h-10 w-10 px-0" onClick={() => onRemove(item.id)} title="Delete"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
      {!items.length && <div className="panel text-sm text-stone-500">No records found.</div>}
    </div>
  );
}
