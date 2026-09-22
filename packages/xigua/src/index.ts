import type { PlatformDefinition } from '@sns-parse/core'

export const xigua: PlatformDefinition = {
  type: "xigua",
  label: "西瓜视频",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.)?ixigua\\.com\\/\\d{10,}", "gi"),
  ],
}

export default xigua
