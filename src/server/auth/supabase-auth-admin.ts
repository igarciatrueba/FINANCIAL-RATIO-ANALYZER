import { createClient } from "@supabase/supabase-js";

import { AppError } from "@/server/errors";

export class SupabaseAuthAdmin {
  private readonly client;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) throw new AppError("CONFIGURATION_ERROR", "Account deletion is not configured.");
    this.client = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async deleteUser(providerUserId: string) {
    const { error } = await this.client.auth.admin.deleteUser(providerUserId);
    if (error) throw new AppError("CONFIGURATION_ERROR", "The account identity could not be deleted safely.");
  }
}
