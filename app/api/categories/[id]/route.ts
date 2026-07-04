import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const data = categorySchema.parse(await request.json());
    const result = await prisma.category.updateMany({ where: { id, userId }, data });
    if (!result.count) return fail("Category not found", 404);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const used = await prisma.expense.count({ where: { userId, categoryId: id } });
    if (used) return fail("Category is used by expenses", 409);
    const result = await prisma.category.deleteMany({ where: { id, userId, isDefault: false } });
    if (!result.count) return fail("Category not found or default category cannot be deleted", 404);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
