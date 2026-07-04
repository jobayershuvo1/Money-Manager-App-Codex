import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { handleError, ok } from "@/lib/http";
import { getMonthlySummary } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    return ok(await getMonthlySummary(userId, request.nextUrl.searchParams.get("month")));
  } catch (error) {
    return handleError(error);
  }
}
