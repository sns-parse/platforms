import type { PlatformDefinition } from '@sns-parse/core'

export const lishi: PlatformDefinition = {
  type: "lishi",
  label: "梨视频",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.)?pearvideo\\.com\\/video_\\d+", "gi"),
    new RegExp("https?:\\/\\/video\\.li\\/[0-9a-zA-Z_\\/-]+", "gi"),
  ],
}

export default lishi
