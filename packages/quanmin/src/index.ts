import type { PlatformDefinition } from '@sns-parse/core'

export const quanmin: PlatformDefinition = {
  type: "quanmin",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.)?quanmin\\.tv\\/[0-9a-zA-Z_\\/-]+", "gi"),
    new RegExp("https?:\\/\\/(?:www\\.)?quanmintv\\.cn\\/[0-9a-zA-Z_\\/-]+", "gi"),
  ],
}

export default quanmin
