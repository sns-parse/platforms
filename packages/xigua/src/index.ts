import type { PlatformDefinition } from '@sns-parse/core'

export const xigua: PlatformDefinition = {
  type: "xigua",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.)?ixigua\\.com\\/\\d{10,}", "gi"),
  ],
}

export default xigua
