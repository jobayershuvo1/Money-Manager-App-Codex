import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const data = expenseSchema.parse(await request.json());
    const category = await prisma.category.findFirst({ where: { id: data.categoryId, userId } });
    if (!category) return fail("Category not found", 404);
    const result = await prisma.expense.updateMany({ where: { id, userId }, data });
    if (!result.count) return fail("Expense not found", 404);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const result = await prisma.expense.deleteMany({ where: { id, userId } });
    if (!result.count) return fail("Expense not found", 404);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
