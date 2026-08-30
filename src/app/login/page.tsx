import { AuthScreen } from "@/features/accounts/components/auth-screen";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <AuthScreen mode="login" />;
}
