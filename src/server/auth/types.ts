export type AuthenticatedIdentity = {
  provider: string;
  providerUserId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
};
