import type { PlatformDefinition } from '@sns-parse/core'

export const doubao: PlatformDefinition = {
  type: "doubao",
  label: "豆包",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.)?doubao\\.com\\/video\\/\\d{10,}", "gi"),
    new RegExp("https?:\\/\\/(?:www\\.)?doubao\\.com\\/video-sharing\\?[^\\s'\"“”‘’]*", "gi"),
  ],
  dedicated: {
    legacy: "https://api.bugpk.com/api/dbvideos",
    next: "https://api-new.ifphp.com/api/doubao",
  },
}

export default doubao
