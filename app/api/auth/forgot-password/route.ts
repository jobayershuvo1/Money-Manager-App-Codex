import crypto from "crypto";
import { addHours } from "date-fns";
import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/http";
import { sendPasswordReset } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators";

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const data = forgotPasswordSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: sha256(token), expiresAt: addHours(new Date(), 1) }
      });
      await sendPasswordReset(user.email, token);
    }
    return ok({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    return handleError(error);
  }
}
