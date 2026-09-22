import type { PlatformDefinition } from '@sns-parse/core'

export const bilibili: PlatformDefinition = {
  type: "bilibili",
  label: "哔哩哔哩",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.)?bilibili\\.com\\/video\\/([ab]v[0-9a-zA-Z_-]+)(?:\\?[^\\s'\"“”‘’]*)?", "gi"),
    new RegExp("https?:\\/\\/b23\\.tv\\/[0-9a-zA-Z_\\/-]+", "gi"),
    new RegExp("https?:\\/\\/bili\\d+\\.cn\\/[0-9a-zA-Z_\\/-]+", "gi"),
    new RegExp("https?:\\/\\/b23\\.wtf\\/[0-9a-zA-Z_\\/-]+", "gi"),
    new RegExp("https?:\\/\\/bili2233\\.cn\\/[0-9a-zA-Z_\\/-]+", "gi"),
  ],
  dedicated: {
    legacy: "https://api.bugpk.com/api/bilibili",
    next: "https://api-new.ifphp.com/api/bilibili",
  },
}

export default bilibili
