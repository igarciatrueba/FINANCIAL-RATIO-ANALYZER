import { AuthScreen } from "@/features/accounts/components/auth-screen";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return <AuthScreen mode="reset-password" />;
}
