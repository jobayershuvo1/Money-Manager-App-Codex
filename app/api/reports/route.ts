import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { handleError, ok } from "@/lib/http";
import { getMonthlySummary } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const summary = await getMonthlySummary(userId, request.nextUrl.searchParams.get("month"));
    return ok({
      ...summary,
      incomeVsExpense: [
        { name: "Income", value: summary.income },
        { name: "Expense", value: summary.expenses }
      ]
    });
  } catch (error) {
    return handleError(error);
  }
}
