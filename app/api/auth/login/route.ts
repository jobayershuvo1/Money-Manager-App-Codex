import { NextRequest } from "next/server";
import { setAuthCookie, verifyPassword } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const data = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await verifyPassword(data.password, user.passwordHash))) return fail("Invalid email or password", 401);
    await setAuthCookie(user.id);
    return ok({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    return handleError(error);
  }
}
