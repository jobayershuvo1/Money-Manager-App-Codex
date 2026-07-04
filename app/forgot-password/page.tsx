import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForms";

export default function ForgotPasswordPage() {
  return <Suspense><AuthForm mode="forgot" /></Suspense>;
}
