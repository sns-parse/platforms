import type { PlatformDefinition } from '@sns-parse/core'

export const haokan: PlatformDefinition = {
  type: "haokan",
  rules: [
    new RegExp("https?:\\/\\/haokan\\.baidu\\.com\\/v\\?vid=[0-9a-zA-Z_\\/-]+", "gi"),
  ],
}

export default haokan
