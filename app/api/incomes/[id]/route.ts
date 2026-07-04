import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { incomeSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const data = incomeSchema.parse(await request.json());
    const result = await prisma.income.updateMany({ where: { id, userId }, data });
    if (!result.count) return fail("Income not found", 404);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const result = await prisma.income.deleteMany({ where: { id, userId } });
    if (!result.count) return fail("Income not found", 404);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
