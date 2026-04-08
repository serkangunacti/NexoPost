import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/authz";
import { env } from "@/lib/env";
import { ApiError, toErrorResponse } from "@/lib/http";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

function createCloudinarySignature(timestamp: number, folder: string) {
  const signatureBase = `folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
  return createHash("sha1").update(signatureBase).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const workspaceId = formData.get("workspaceId");
    const file = formData.get("file");

    if (typeof workspaceId !== "string" || !workspaceId.trim()) {
      throw new ApiError(400, "workspaceId is required");
    }

    if (!(file instanceof File)) {
      throw new ApiError(400, "A file upload is required");
    }

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      throw new ApiError(400, "Only image and video uploads are supported");
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new ApiError(413, "Upload exceeds the 50 MB security limit");
    }

    const access = await requireWorkspaceAccess(workspaceId);

    if (!env.CLOUDINARY_CLOUD_NAME) {
      throw new ApiError(503, "Secure media upload is not configured on the server");
    }

    const rateLimit = checkRateLimit({
      key: `media:upload:${access.userId}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!rateLimit.ok) {
      throw new ApiError(429, "Too many uploads. Please slow down.");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `nexopost/${access.workspaceId}`;
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("folder", folder);

    if (env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      const signature = createCloudinarySignature(timestamp, folder);
      uploadFormData.append("api_key", env.CLOUDINARY_API_KEY);
      uploadFormData.append("signature", signature);
      uploadFormData.append("timestamp", String(timestamp));
    } else if (env.CLOUDINARY_UPLOAD_PRESET) {
      uploadFormData.append("upload_preset", env.CLOUDINARY_UPLOAD_PRESET);
    } else {
      throw new ApiError(503, "Cloud media upload credentials are incomplete");
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: uploadFormData,
      }
    );

    const payload = await response.json().catch(() => null) as
      | {
          secure_url?: string;
          public_id?: string;
          resource_type?: string;
          bytes?: number;
          error?: { message?: string };
        }
      | null;

    if (!response.ok || !payload?.secure_url) {
      throw new ApiError(502, payload?.error?.message ?? "Cloud media upload failed");
    }

    return NextResponse.json(
      {
        bytes: payload.bytes ?? file.size,
        publicId: payload.public_id ?? null,
        resourceType: payload.resource_type ?? "auto",
        secureUrl: payload.secure_url,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
