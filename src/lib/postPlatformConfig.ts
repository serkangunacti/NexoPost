export interface PostPlatformConfig {
  textByPlatform?: Record<string, string>;
  mediaByPlatform?: Record<string, string[]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeTextByPlatform(
  value: unknown,
  selectedPlatforms: string[]
) {
  if (!isRecord(value)) return {} as Record<string, string>;

  return selectedPlatforms.reduce<Record<string, string>>((acc, platformId) => {
    const text = value[platformId];
    if (typeof text === "string") {
      acc[platformId] = text;
    }
    return acc;
  }, {});
}

function sanitizeMediaByPlatform(
  value: unknown,
  selectedPlatforms: string[],
  mediaUrls: string[]
) {
  if (!isRecord(value)) {
    return selectedPlatforms.reduce<Record<string, string[]>>((acc, platformId) => {
      acc[platformId] = [...mediaUrls];
      return acc;
    }, {});
  }

  const knownMedia = new Set(mediaUrls);

  return selectedPlatforms.reduce<Record<string, string[]>>((acc, platformId) => {
    const mediaList = value[platformId];
    if (Array.isArray(mediaList)) {
      acc[platformId] = mediaList.filter(
        (mediaUrl): mediaUrl is string =>
          typeof mediaUrl === "string" && knownMedia.has(mediaUrl)
      );
      return acc;
    }

    acc[platformId] = [...mediaUrls];
    return acc;
  }, {});
}

export function normalizePostPlatformConfig(
  rawConfig: unknown,
  selectedPlatforms: string[],
  mediaUrls: string[]
): Required<PostPlatformConfig> {
  const config = isRecord(rawConfig) ? rawConfig : {};

  return {
    textByPlatform: sanitizeTextByPlatform(config.textByPlatform, selectedPlatforms),
    mediaByPlatform: sanitizeMediaByPlatform(config.mediaByPlatform, selectedPlatforms, mediaUrls),
  };
}

export function buildPostPlatformConfig(
  selectedPlatforms: string[],
  textByPlatform: Record<string, string>,
  mediaByPlatform: Record<string, string[]>
): PostPlatformConfig {
  const filteredTexts = selectedPlatforms.reduce<Record<string, string>>((acc, platformId) => {
    if (Object.prototype.hasOwnProperty.call(textByPlatform, platformId)) {
      acc[platformId] = textByPlatform[platformId];
    }
    return acc;
  }, {});

  const filteredMedia = selectedPlatforms.reduce<Record<string, string[]>>((acc, platformId) => {
    acc[platformId] = Array.isArray(mediaByPlatform[platformId])
      ? mediaByPlatform[platformId].filter((mediaUrl) => typeof mediaUrl === "string")
      : [];
    return acc;
  }, {});

  return {
    textByPlatform: filteredTexts,
    mediaByPlatform: filteredMedia,
  };
}
