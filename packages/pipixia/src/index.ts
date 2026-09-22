import type { PlatformDefinition } from '@sns-parse/core'

export const pipixia: PlatformDefinition = {
  type: "pipixia",
  label: "皮皮虾",
  rules: [
    new RegExp("https?:\\/\\/(?:h5|www)\\.pipix\\.com\\/[0-9a-zA-Z_\\/-]+", "gi"),
    new RegExp("https?:\\/\\/(?:www\\.)?pipixia\\.com\\/[0-9a-zA-Z_\\/-]+", "gi"),
  ],
  dedicated: {
    legacy: "https://api.bugpk.com/api/pipixia",
  },
}

export default pipixia
