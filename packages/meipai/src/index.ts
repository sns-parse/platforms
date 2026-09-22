import type { PlatformDefinition } from '@sns-parse/core'

export const meipai: PlatformDefinition = {
  type: "meipai",
  label: "美拍",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.)?meipai\\.com\\/media\\/\\d{10,}", "gi"),
  ],
}

export default meipai
