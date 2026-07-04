import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { handleError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validators";

export async function GET() {
  try {
    const userId = await requireUserId();
    const categories = await prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } });
    return ok({ categories });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const data = categorySchema.parse(await request.json());
    const category = await prisma.category.create({ data: { ...data, userId } });
    return ok({ category }, 201);
  } catch (error) {
    return handleError(error);
  }
}
