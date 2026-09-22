import type { PlatformDefinition } from '@sns-parse/core'

export const twitter: PlatformDefinition = {
  type: "twitter",
  label: "Twitter/X",
  rules: [
    new RegExp("https?:\\/\\/twitter\\.com\\/\\w+\\/status\\/\\d{10,}", "gi"),
    new RegExp("https?:\\/\\/x\\.com\\/\\w+\\/status\\/\\d{10,}", "gi"),
  ],
}

export default twitter
