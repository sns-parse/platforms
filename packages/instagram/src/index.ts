import type { PlatformDefinition } from '@sns-parse/core'

export const instagram: PlatformDefinition = {
  type: "instagram",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.)?instagram\\.com\\/p\\/[0-9a-zA-Z_\\/-]+", "gi"),
    new RegExp("https?:\\/\\/(?:www\\.)?instagram\\.com\\/reel\\/[0-9a-zA-Z_\\/-]+", "gi"),
    new RegExp("https?:\\/\\/(?:www\\.)?instagram\\.com\\/share\\/(?:reel|p)\\/[0-9a-zA-Z_\\/-]+", "gi"),
  ],
}

export default instagram
