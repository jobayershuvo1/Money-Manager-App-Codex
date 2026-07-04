import { NextRequest } from "next/server";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { hashPassword, setAuthCookie } from "@/lib/auth";
import { handleError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const data = signupSchema.parse(await request.json());
    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        categories: {
          create: DEFAULT_CATEGORIES.map(([name, color]) => ({ name, color, isDefault: true }))
        }
      },
      select: { id: true, name: true, email: true }
    });
    await setAuthCookie(user.id);
    return ok({ user }, 201);
  } catch (error) {
    return handleError(error);
  }
}
