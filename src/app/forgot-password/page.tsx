import { AuthScreen } from "@/features/accounts/components/auth-screen";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return <AuthScreen mode="forgot-password" />;
}
