import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { correctTextWithAI, parseTransactionWithAI } from "@/lib/ai";
import { fail, handleError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { aiTextSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { text } = aiTextSchema.parse(await request.json());
    const categories = await prisma.category.findMany({ where: { userId }, select: { id: true, name: true } });
    const corrected = await correctTextWithAI(text);
    const parsed = await parseTransactionWithAI(corrected, categories);
    if (!parsed.amount || parsed.amount <= 0) return fail("Could not detect a valid amount", 422, parsed);

    const category =
      parsed.transactionType === "EXPENSE"
        ? categories.find((item) => item.name.toLowerCase() === parsed.categoryName.toLowerCase()) ||
          categories.find((item) => item.name === "Other")
        : null;

    if (parsed.transactionType === "EXPENSE" && !category) return fail("No category found", 404);

    return ok({
      original: text,
      corrected,
      parsed,
      category
    });
  } catch (error) {
    return handleError(error);
  }
}
