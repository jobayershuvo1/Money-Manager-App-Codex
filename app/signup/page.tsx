import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForms";

export default function SignupPage() {
  return <Suspense><AuthForm mode="signup" /></Suspense>;
}
