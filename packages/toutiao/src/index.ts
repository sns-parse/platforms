import type { PlatformDefinition } from '@sns-parse/core'

export const toutiao: PlatformDefinition = {
  type: "toutiao",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.|m\\.)?toutiao\\.com\\/video\\/\\d+", "gi"),
  ],
  dedicated: {
    legacy: "https://api.bugpk.com/api/toutiao",
  },
}

export default toutiao
