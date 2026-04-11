import { env } from "@/lib/env";
import { ApiError } from "@/lib/http";

type GraphMessage = {
  id: string;
  internetMessageId?: string | null;
  subject?: string | null;
  body?: {
    contentType?: string;
    content?: string;
  };
  createdDateTime?: string;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getGraphAccessToken() {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.value;
  }

  if (
    !env.MICROSOFT_TENANT_ID ||
    !env.MICROSOFT_CLIENT_ID ||
    !env.MICROSOFT_CLIENT_SECRET
  ) {
    throw new ApiError(503, "Microsoft mail transport is not configured.");
  }

  const body = new URLSearchParams({
    client_id: env.MICROSOFT_CLIENT_ID,
    client_secret: env.MICROSOFT_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }
  );

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new ApiError(502, payload.error_description || "Graph token request failed.");
  }

  cachedToken = {
    value: payload.access_token,
    expiresAt: now + (payload.expires_in ?? 3600) * 1000,
  };

  return payload.access_token;
}

async function graphFetch(path: string, init?: RequestInit) {
  const token = await getGraphAccessToken();
  const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ApiError(502, text || `Graph request failed for ${path}`);
  }

  return response;
}

export async function sendSupportMail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!env.MICROSOFT_MAIL_SENDER) {
    throw new ApiError(503, "Support sender mailbox is not configured.");
  }

  await graphFetch(`/users/${encodeURIComponent(env.MICROSOFT_MAIL_SENDER)}/sendMail`, {
    method: "POST",
    body: JSON.stringify({
      message: {
        subject: input.subject,
        body: {
          contentType: "HTML",
          content: input.html,
        },
        toRecipients: [
          {
            emailAddress: {
              address: input.to,
            },
          },
        ],
      },
      saveToSentItems: true,
    }),
  });
}

export async function listRecentSupportSentMessages(limit = 25) {
  if (!env.MICROSOFT_MAIL_SENDER) return [] as GraphMessage[];

  const response = await graphFetch(
    `/users/${encodeURIComponent(
      env.MICROSOFT_MAIL_SENDER
    )}/mailFolders/SentItems/messages?$top=${limit}&$orderby=createdDateTime desc&$select=id,internetMessageId,subject,body,createdDateTime`
  );

  const payload = (await response.json()) as { value?: GraphMessage[] };
  return payload.value ?? [];
}
