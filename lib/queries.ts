import { Prisma, PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { monthRange, toDay } from "@/lib/date";

export async function getMonthlySummary(userId: string, month?: string | null) {
  const range = monthRange(month);
  const [incomeSum, expenseSum, categoryRows, dailyRows, budgets] = await Promise.all([
    prisma.income.aggregate({ where: { userId, date: { gte: range.start, lte: range.end } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { userId, date: { gte: range.start, lte: range.end } }, _sum: { amount: true } }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { userId, date: { gte: range.start, lte: range.end } },
      _sum: { amount: true }
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: range.start, lte: range.end } },
      select: { date: true, amount: true },
      orderBy: { date: "asc" }
    }),
    prisma.budget.findMany({ where: { userId, month: range.month }, include: { category: true } })
  ]);
  const categories = await prisma.category.findMany({ where: { userId } });
  const byCategory = categoryRows.map((row) => {
    const category = categories.find((item) => item.id === row.categoryId);
    return { categoryId: row.categoryId, category: category?.name || "Unknown", amount: Number(row._sum.amount || 0), color: category?.color };
  });
  const dailyMap = new Map<string, number>();
  for (const row of dailyRows) dailyMap.set(toDay(row.date), (dailyMap.get(toDay(row.date)) || 0) + Number(row.amount));
  const income = Number(incomeSum._sum.amount || 0);
  const expenses = Number(expenseSum._sum.amount || 0);
  const savings = byCategory.find((item) => item.category.toLowerCase() === "savings")?.amount || 0;
  return {
    month: range.month,
    income,
    expenses,
    savings,
    balance: income - expenses,
    byCategory,
    dailyTrend: Array.from(dailyMap.entries()).map(([date, amount]) => ({ date, amount })),
    budgets: budgets.map((b) => ({ id: b.id, category: b.category?.name || "Overall", amount: Number(b.amount) }))
  };
}

export function expenseWhere(userId: string, params: URLSearchParams): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = { userId };
  const month = params.get("month");
  const start = params.get("start");
  const end = params.get("end");
  const categoryId = params.get("categoryId");
  const paymentMethod = params.get("paymentMethod") as PaymentMethod | null;
  if (month) {
    const range = monthRange(month);
    where.date = { gte: range.start, lte: range.end };
  } else if (start || end) {
    where.date = {};
    if (start) where.date.gte = new Date(start);
    if (end) where.date.lte = new Date(end);
  }
  if (categoryId) where.categoryId = categoryId;
  if (paymentMethod) where.paymentMethod = paymentMethod;
  return where;
}
