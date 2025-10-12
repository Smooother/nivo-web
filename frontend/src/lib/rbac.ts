import { createAdminClient, createServerClient } from "./supabaseServer";

export type UserRole = "admin" | "analyst" | "viewer";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administratör",
  analyst: "Analytiker",
  viewer: "Visare",
};

export function hasAdminAccess(role: string | null | undefined) {
  return role === "admin";
}

export function hasAnalystAccess(role: string | null | undefined) {
  return role === "admin" || role === "analyst";
}

export async function fetchSessionRole() {
  const client = createServerClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    return "viewer" as UserRole;
  }

  return ((user.user_metadata as { role?: UserRole } | null)?.role ?? "viewer") as UserRole;
}

export async function listUsersWithRoles() {
  const adminClient = createAdminClient();

  if (!adminClient) {
    return {
      users: [],
      error: new Error("Service role key missing - cannot list users in this environment"),
    } as const;
  }

  const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 });

  if (error) {
    return { users: [], error } as const;
  }

  const users = data.users.map((user) => ({
    id: user.id,
    email: user.email ?? "", 
    createdAt: user.created_at,
    role: ((user.user_metadata as { role?: UserRole } | null)?.role ?? "viewer") as UserRole,
    approved: Boolean((user.user_metadata as { approved?: boolean } | null)?.approved ?? user.confirmed_at),
  }));

  return { users, error: null } as const;
}

export async function updateUserRole(userId: string, role: UserRole) {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return { error: new Error("Service role key missing - cannot update user role in this environment") };
  }

  const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: {
      role,
      approved: true,
    },
  });

  return { data, error };
}

