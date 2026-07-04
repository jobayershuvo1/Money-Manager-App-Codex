import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/constants";

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120).transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase())
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(128)
});

export const incomeSchema = z.object({
  amount: z.coerce.number().positive().max(999999999),
  date: z.coerce.date(),
  source: z.string().trim().min(1).max(80),
  note: z.string().trim().max(240).optional().nullable()
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(40),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#2EA871")
});

export const expenseSchema = z.object({
  amount: z.coerce.number().positive().max(999999999),
  date: z.coerce.date(),
  categoryId: z.string().min(1),
  note: z.string().trim().max(240).optional().nullable(),
  paymentMethod: z.enum(PAYMENT_METHODS).default("CASH")
});

export const budgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  categoryId: z.string().optional().nullable(),
  amount: z.coerce.number().positive().max(999999999)
});

export const aiTextSchema = z.object({
  text: z.string().trim().min(2).max(500)
});
