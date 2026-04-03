import { auth } from "@/auth";
import { ApiError } from "@/lib/http";

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? "admin@nexopost.com";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireStaffUser() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase() ?? "";

  if (!session?.user?.id || !email) {
    throw new ApiError(401, "Authentication required");
  }

  const allowed = new Set(parseAdminEmails());
  if (!allowed.has(email) && !email.endsWith("@nexopost.com")) {
    throw new ApiError(403, "Staff access required");
  }

  return {
    userId: session.user.id,
    email,
  };
}
