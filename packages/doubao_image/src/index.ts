import type { PlatformDefinition } from '@sns-parse/core'

export const doubao_image: PlatformDefinition = {
  type: "doubao_image",
  label: "豆包图片",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.)?doubao\\.com\\/thread\\/[^\\s'\"“”‘’]+", "gi"),
  ],
  dedicated: {
    legacy: "https://api.bugpk.com/api/dbduihua",
  },
}

export default doubao_image
