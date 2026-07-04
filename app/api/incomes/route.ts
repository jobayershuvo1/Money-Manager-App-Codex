import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { handleError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { incomeSchema } from "@/lib/validators";
import { monthRange } from "@/lib/date";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const month = request.nextUrl.searchParams.get("month");
    const range = monthRange(month);
    const incomes = await prisma.income.findMany({
      where: { userId, date: { gte: range.start, lte: range.end } },
      orderBy: { date: "desc" }
    });
    return ok({ incomes: incomes.map((item) => ({ ...item, amount: Number(item.amount) })) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const data = incomeSchema.parse(await request.json());
    const income = await prisma.income.create({ data: { ...data, userId } });
    return ok({ income: { ...income, amount: Number(income.amount) } }, 201);
  } catch (error) {
    return handleError(error);
  }
}
