import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { correctTextWithAI } from "@/lib/ai";
import { handleError, ok } from "@/lib/http";
import { aiTextSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    await requireUserId();
    const { text } = aiTextSchema.parse(await request.json());
    const corrected = await correctTextWithAI(text);
    return ok({ corrected });
  } catch (error) {
    return handleError(error);
  }
}
