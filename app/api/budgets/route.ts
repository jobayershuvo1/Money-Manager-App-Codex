import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { budgetSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const month = request.nextUrl.searchParams.get("month");
    const budgets = await prisma.budget.findMany({
      where: { userId, ...(month ? { month } : {}) },
      include: { category: true },
      orderBy: { month: "desc" }
    });
    return ok({ budgets: budgets.map((item) => ({ ...item, amount: Number(item.amount) })) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const data = budgetSchema.parse(await request.json());
    if (data.categoryId) {
      const category = await prisma.category.findFirst({ where: { id: data.categoryId, userId } });
      if (!category) return fail("Category not found", 404);
    }
    const existing = await prisma.budget.findFirst({
      where: { userId, month: data.month, categoryId: data.categoryId || null }
    });
    const budget = existing
      ? await prisma.budget.update({ where: { id: existing.id }, data: { amount: data.amount } })
      : await prisma.budget.create({ data: { ...data, categoryId: data.categoryId || null, userId } });
    return ok({ budget: { ...budget, amount: Number(budget.amount) } });
  } catch (error) {
    return handleError(error);
  }
}
