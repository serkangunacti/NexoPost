import { auth } from "@/auth";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/http";

function parseEmailList(raw: string | undefined, fallback: string[] = []) {
  return (raw ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
    .concat(fallback)
    .filter((value, index, arr) => arr.indexOf(value) === index);
}

export function getStaffEmails() {
  return new Set(parseEmailList(process.env.ADMIN_EMAILS, ["admin@nexopost.com"]));
}

export function getSuperadminEmails() {
  return new Set(parseEmailList(env.SUPERADMIN_EMAILS));
}

export function isStaffEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const staffEmails = getStaffEmails();
  return staffEmails.has(normalized) || normalized.endsWith("@nexopost.com");
}

export function isSuperadminEmail(email: string) {
  return getSuperadminEmails().has(email.trim().toLowerCase());
}

export async function requireStaffUser() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase() ?? "";

  if (!session?.user?.id || !email) {
    throw new ApiError(401, "Authentication required");
  }

  if (!isStaffEmail(email)) {
    throw new ApiError(403, "Staff access required");
  }

  return {
    userId: session.user.id,
    email,
  };
}

export async function requireSuperadminUser() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase() ?? "";

  if (!session?.user?.id || !email) {
    throw new ApiError(401, "Authentication required");
  }

  if (!isSuperadminEmail(email)) {
    throw new ApiError(403, "Superadmin access required");
  }

  return {
    userId: session.user.id,
    email,
  };
}
