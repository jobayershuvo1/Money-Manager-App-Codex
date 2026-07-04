import crypto from "crypto";
import { NextRequest } from "next/server";
import { hashPassword } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validators";

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const data = resetPasswordSchema.parse(await request.json());
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(data.token) } });
    if (!record || record.usedAt || record.expiresAt < new Date()) return fail("Invalid or expired reset token", 400);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(data.password) } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })
    ]);
    return ok({ message: "Password updated" });
  } catch (error) {
    return handleError(error);
  }
}
