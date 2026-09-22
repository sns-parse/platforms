import type { PlatformDefinition } from '@sns-parse/core'

export const oasis: PlatformDefinition = {
  type: "oasis",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.)?oasis\\.weibo\\.com\\/v\\/[0-9a-zA-Z_\\/-]+", "gi"),
  ],
}

export default oasis
