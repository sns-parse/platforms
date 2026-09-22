import type { PlatformDefinition } from '@sns-parse/core'

export const weishi: PlatformDefinition = {
  type: "weishi",
  rules: [
    new RegExp("https?:\\/\\/weishi\\.qq\\.com\\/weishi\\/feed\\/[0-9a-zA-Z_\\/-]+", "gi"),
  ],
}

export default weishi
