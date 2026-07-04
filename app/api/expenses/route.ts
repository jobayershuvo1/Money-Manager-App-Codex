import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { expenseWhere } from "@/lib/queries";
import { fail, handleError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const expenses = await prisma.expense.findMany({
      where: expenseWhere(userId, request.nextUrl.searchParams),
      include: { category: true },
      orderBy: { date: "desc" }
    });
    return ok({ expenses: expenses.map((item) => ({ ...item, amount: Number(item.amount) })) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const data = expenseSchema.parse(await request.json());
    const category = await prisma.category.findFirst({ where: { id: data.categoryId, userId } });
    if (!category) return fail("Category not found", 404);
    const expense = await prisma.expense.create({ data: { ...data, userId } });
    return ok({ expense: { ...expense, amount: Number(expense.amount) } }, 201);
  } catch (error) {
    return handleError(error);
  }
}
