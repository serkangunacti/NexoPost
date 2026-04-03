import type { Prisma } from "@prisma/client";
import { Agent } from "@atproto/api";
import {
  NodeOAuthClient,
  type NodeSavedSession,
  type NodeSavedState,
  type OAuthClientMetadataInput,
} from "@atproto/oauth-client-node";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getCallbackUrl } from "@/lib/socialAuth";

const BLUESKY_PROVIDER = "bluesky";
const BLUESKY_CLIENT_METADATA_PATH = "/api/social/bluesky/client-metadata";
const BLUESKY_STATE_TTL_MS = 15 * 60 * 1000;
const BLUESKY_SCOPE = "atproto transition:generic";

const globalForBlueskyOAuth = globalThis as typeof globalThis & {
  blueskyOAuthClient?: NodeOAuthClient;
};

function getBaseUrl() {
  return env.appBaseUrl.replace(/\/$/, "");
}

export function getBlueskyClientMetadataUrl() {
  return `${getBaseUrl()}${BLUESKY_CLIENT_METADATA_PATH}`;
}

function parseStoreValue<T>(value: unknown): T | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as T;
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export function getBlueskyClientMetadata(): OAuthClientMetadataInput {
  return {
    client_id: getBlueskyClientMetadataUrl(),
    client_name: "NexoPost",
    client_uri: getBaseUrl(),
    redirect_uris: [getCallbackUrl("bluesky")] as [string],
    grant_types: ["authorization_code", "refresh_token"] as ["authorization_code", "refresh_token"],
    scope: BLUESKY_SCOPE,
    response_types: ["code"] as ["code"],
    application_type: "web",
    token_endpoint_auth_method: "none",
    dpop_bound_access_tokens: true,
    policy_uri: `${getBaseUrl()}/privacy`,
    tos_uri: `${getBaseUrl()}/terms`,
  };
}

function getOAuthClient() {
  if (globalForBlueskyOAuth.blueskyOAuthClient) {
    return globalForBlueskyOAuth.blueskyOAuthClient;
  }

  const client = new NodeOAuthClient({
    clientMetadata: getBlueskyClientMetadata(),
    allowHttp: getBaseUrl().startsWith("http://"),
    stateStore: {
      async get(key: string) {
        await prisma.oAuthStateStore.deleteMany({
          where: {
            provider: BLUESKY_PROVIDER,
            expiresAt: { lt: new Date() },
          },
        });

        const row = await prisma.oAuthStateStore.findUnique({ where: { key } });
        if (!row || row.provider !== BLUESKY_PROVIDER || row.expiresAt < new Date()) {
          return undefined;
        }

        return parseStoreValue<NodeSavedState>(row.value);
      },
      async set(key: string, value: NodeSavedState) {
        await prisma.oAuthStateStore.upsert({
          where: { key },
          create: {
            key,
            provider: BLUESKY_PROVIDER,
            value: value as unknown as Prisma.InputJsonValue,
            expiresAt: new Date(Date.now() + BLUESKY_STATE_TTL_MS),
          },
          update: {
            provider: BLUESKY_PROVIDER,
            value: value as unknown as Prisma.InputJsonValue,
            expiresAt: new Date(Date.now() + BLUESKY_STATE_TTL_MS),
          },
        });
      },
      async del(key: string) {
        await prisma.oAuthStateStore.deleteMany({
          where: {
            key,
            provider: BLUESKY_PROVIDER,
          },
        });
      },
    },
    sessionStore: {
      async get(key: string) {
        const row = await prisma.oAuthSessionStore.findUnique({ where: { key } });
        if (!row || row.provider !== BLUESKY_PROVIDER) {
          return undefined;
        }

        return parseStoreValue<NodeSavedSession>(row.value);
      },
      async set(key: string, value: NodeSavedSession) {
        await prisma.oAuthSessionStore.upsert({
          where: { key },
          create: {
            key,
            provider: BLUESKY_PROVIDER,
            value: value as unknown as Prisma.InputJsonValue,
          },
          update: {
            provider: BLUESKY_PROVIDER,
            value: value as unknown as Prisma.InputJsonValue,
          },
        });
      },
      async del(key: string) {
        await prisma.oAuthSessionStore.deleteMany({
          where: {
            key,
            provider: BLUESKY_PROVIDER,
          },
        });
      },
    },
  });

  globalForBlueskyOAuth.blueskyOAuthClient = client;
  return client;
}

export async function getBlueskyAuthorizeUrl(handle: string, state: string) {
  return getOAuthClient().authorize(handle, { state });
}

export async function completeBlueskyOAuth(searchParams: URLSearchParams) {
  return getOAuthClient().callback(searchParams);
}

export async function restoreBlueskyOAuthAgent(did: string) {
  const session = await getOAuthClient().restore(did);
  return new Agent(session);
}

export async function deleteBlueskyOAuthSession(did: string) {
  await prisma.oAuthSessionStore.deleteMany({
    where: {
      key: did,
      provider: BLUESKY_PROVIDER,
    },
  });
}
