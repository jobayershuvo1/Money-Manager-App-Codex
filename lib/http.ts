import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) return fail("Invalid input", 422, error.flatten());
  if (error instanceof Error) return fail(error.message || "Request failed", 400);
  return fail("Request failed", 400);
}
