import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { parseExpenseWithAI } from "@/lib/ai";
import { fail, handleError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { aiTextSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { text } = aiTextSchema.parse(await request.json());
    const categories = await prisma.category.findMany({ where: { userId }, select: { id: true, name: true } });
    const parsed = await parseExpenseWithAI(text, categories);
    if (!parsed.amount || parsed.amount <= 0) return fail("Could not detect a valid amount", 422, parsed);
    const category =
      categories.find((item) => item.name.toLowerCase() === parsed.categoryName.toLowerCase()) ||
      categories.find((item) => item.name === "Other");
    if (!category) return fail("No category found", 404);
    const expense = await prisma.expense.create({
      data: {
        userId,
        categoryId: category.id,
        amount: parsed.amount,
        date: new Date(parsed.date),
        note: parsed.note || text,
        paymentMethod: parsed.paymentMethod
      },
      include: { category: true }
    });
    await prisma.aiLog.create({ data: { userId, prompt: text, response: parsed, action: "CREATE_EXPENSE" } });
    return ok({ parsed, expense: { ...expense, amount: Number(expense.amount) } }, 201);
  } catch (error) {
    return handleError(error);
  }
}
