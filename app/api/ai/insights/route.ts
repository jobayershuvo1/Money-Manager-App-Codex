import { NextRequest } from "next/server";
import OpenAI from "openai";
import { requireUserId } from "@/lib/auth";
import { handleError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getMonthlySummary } from "@/lib/queries";

function localInsights(summary: Awaited<ReturnType<typeof getMonthlySummary>>) {
  const top = [...summary.byCategory].sort((a, b) => b.amount - a.amount)[0];
  const messages = [];
  if (summary.expenses > summary.income) messages.push("Spending is higher than income this month. Freeze non-essential expenses until balance recovers.");
  if (top && summary.expenses > 0 && top.amount / summary.expenses > 0.35) messages.push(`${top.category} is over 35% of spending. Try reducing it by 10-15% next month.`);
  if (summary.budgets.length) {
    const totalBudget = summary.budgets.reduce((sum, b) => sum + b.amount, 0);
    if (summary.expenses > totalBudget) messages.push("Monthly spending crossed planned budget. Review large categories before adding new purchases.");
  }
  if (!messages.length) messages.push("Spending looks controlled. Keep savings target at least 20% of income if possible.");
  return messages;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const summary = await getMonthlySummary(userId, request.nextUrl.searchParams.get("month"));
    if (!process.env.OPENAI_API_KEY) return ok({ insights: localInsights(summary) });
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: `Give 4 concise personal finance insights and budget suggestions from this monthly data. Warn if spending exceeds income or budget. JSON array of strings only.\n${JSON.stringify(summary)}`
    });
    let insights = localInsights(summary);
    try {
      const parsed = JSON.parse(response.output_text);
      if (Array.isArray(parsed)) insights = parsed.map(String).slice(0, 5);
    } catch {}
    await prisma.aiLog.create({ data: { userId, prompt: "monthly insights", response: insights, action: "INSIGHTS" } });
    return ok({ insights });
  } catch (error) {
    return handleError(error);
  }
}
