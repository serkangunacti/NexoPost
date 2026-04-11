import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { requireWorkspaceAccess } from "@/lib/authz";
import { ApiError, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_UPLOAD_PRESET) {
      throw new ApiError(503, "Media uploads are not configured.");
    }

    const formData = await request.formData();
    const workspaceIdValue = formData.get("workspaceId");
    const file = formData.get("file");

    if (typeof workspaceIdValue !== "string" || !workspaceIdValue.trim()) {
      throw new ApiError(400, "workspaceId is required.");
    }

    if (!(file instanceof File)) {
      throw new ApiError(400, "A file is required.");
    }

    if (file.size <= 0) {
      throw new ApiError(400, "Uploaded file is empty.");
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new ApiError(400, "Files larger than 100MB are not supported.");
    }

    if (!file.type || (!file.type.startsWith("image/") && !file.type.startsWith("video/"))) {
      throw new ApiError(400, "Only image and video uploads are supported.");
    }

    const { workspaceId } = await requireWorkspaceAccess(workspaceIdValue.trim());
    const uploadFolder = `nexopost/${workspaceId}`;

    const cloudinaryBody = new FormData();
    cloudinaryBody.append("file", file);
    cloudinaryBody.append("folder", uploadFolder);
    cloudinaryBody.append("upload_preset", env.CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: cloudinaryBody,
      }
    );

    const payload = await response.json().catch(() => ({})) as {
      error?: { message?: string };
      public_id?: string;
      resource_type?: string;
      secure_url?: string;
    };

    if (!response.ok || !payload.secure_url) {
      throw new ApiError(502, payload.error?.message || "Media upload failed.");
    }

    return NextResponse.json(
      {
        publicId: payload.public_id ?? null,
        resourceType: payload.resource_type ?? null,
        url: payload.secure_url,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
