import type { PlatformDefinition } from '@sns-parse/core'

export const xiaohongshu: PlatformDefinition = {
  type: "xiaohongshu",
  label: "小红书",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.)?xiaohongshu\\.com\\/discovery\\/item\\/[0-9a-zA-Z_\\/-]+", "gi"),
    new RegExp("https?:\\/\\/xhslink\\.com\\/[0-9a-zA-Z_\\/-]+", "gi"),
    new RegExp("https?:\\/\\/(?:www\\.)?xiaohongshu\\.com\\/explore\\/[0-9a-zA-Z_\\/-]+", "gi"),
    new RegExp("https?:\\/\\/(?:www\\.)?xiaohongshu\\.com\\/board\\/[0-9a-zA-Z_\\/-]+", "gi"),
  ],
  dedicated: {
    legacy: "https://api.bugpk.com/api/xhs",
  },
}

export default xiaohongshu
