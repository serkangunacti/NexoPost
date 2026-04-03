export type MediaKind = "image" | "video";

export type PreparedMediaAsset = {
  originalUrl: string;
  preparedUrl: string;
  kind: MediaKind;
  targetAspectRatio: string;
  transformMode: "cloudinary" | "original";
};

type PlatformMediaProfile = {
  maxMediaCount: number;
  targetAspectRatio: string;
  targetWidth: number;
  targetHeight: number;
  allowImages: boolean;
  allowVideos: boolean;
};

const PLATFORM_MEDIA_PROFILES: Record<string, PlatformMediaProfile> = {
  twitter: { maxMediaCount: 4, targetAspectRatio: "16:9", targetWidth: 1200, targetHeight: 675, allowImages: true, allowVideos: true },
  linkedin: { maxMediaCount: 1, targetAspectRatio: "1.91:1", targetWidth: 1200, targetHeight: 627, allowImages: true, allowVideos: true },
  facebook: { maxMediaCount: 10, targetAspectRatio: "1.91:1", targetWidth: 1200, targetHeight: 630, allowImages: true, allowVideos: true },
  instagram: { maxMediaCount: 10, targetAspectRatio: "4:5", targetWidth: 1080, targetHeight: 1350, allowImages: true, allowVideos: true },
  tiktok: { maxMediaCount: 1, targetAspectRatio: "9:16", targetWidth: 1080, targetHeight: 1920, allowImages: false, allowVideos: true },
  youtube: { maxMediaCount: 1, targetAspectRatio: "9:16", targetWidth: 1080, targetHeight: 1920, allowImages: false, allowVideos: true },
  pinterest: { maxMediaCount: 1, targetAspectRatio: "2:3", targetWidth: 1000, targetHeight: 1500, allowImages: true, allowVideos: true },
  threads: { maxMediaCount: 10, targetAspectRatio: "4:5", targetWidth: 1080, targetHeight: 1350, allowImages: true, allowVideos: true },
  bluesky: { maxMediaCount: 4, targetAspectRatio: "1.91:1", targetWidth: 1200, targetHeight: 627, allowImages: true, allowVideos: false },
};

function isVideoUrl(url: string) {
  return /\.(mp4|mov|webm|avi|m4v)(\?.*)?$/i.test(url);
}

function buildCloudinaryUrl(url: string, width: number, height: number) {
  if (!url.includes("res.cloudinary.com") || url.includes("/upload/c_fill")) {
    return null;
  }

  return url.replace("/upload/", `/upload/c_fill,g_auto,w_${width},h_${height},q_auto,f_auto/`);
}

export function getPlatformMediaProfile(platform: string) {
  return PLATFORM_MEDIA_PROFILES[platform] ?? PLATFORM_MEDIA_PROFILES.facebook;
}

export function preparePlatformMedia(platform: string, mediaUrls: string[]) {
  const profile = getPlatformMediaProfile(platform);
  const assets = mediaUrls.map<PreparedMediaAsset>((url) => {
    const kind: MediaKind = isVideoUrl(url) ? "video" : "image";
    const cloudinaryUrl = kind === "image" ? buildCloudinaryUrl(url, profile.targetWidth, profile.targetHeight) : null;
    return {
      originalUrl: url,
      preparedUrl: cloudinaryUrl ?? url,
      kind,
      targetAspectRatio: profile.targetAspectRatio,
      transformMode: cloudinaryUrl ? "cloudinary" : "original",
    };
  });

  const issues: string[] = [];

  if (assets.length > profile.maxMediaCount) {
    issues.push(`${platform} supports up to ${profile.maxMediaCount} media item${profile.maxMediaCount === 1 ? "" : "s"} in this workflow.`);
  }

  if (!profile.allowImages && assets.some((asset) => asset.kind === "image")) {
    issues.push(`${platform} requires video-first publishing in the current release.`);
  }

  if (!profile.allowVideos && assets.some((asset) => asset.kind === "video")) {
    issues.push(`${platform} does not support video publishing in the current release.`);
  }

  return {
    assets,
    issues,
    summary: {
      autoPrepare: true,
      mediaCount: assets.length,
      targetAspectRatio: profile.targetAspectRatio,
      transformableCount: assets.filter((asset) => asset.transformMode === "cloudinary").length,
    },
  };
}
