import type { PlatformDefinition } from '@sns-parse/core'

export const meipai: PlatformDefinition = {
  type: "meipai",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.)?meipai\\.com\\/media\\/\\d{10,}", "gi"),
  ],
}

export default meipai
