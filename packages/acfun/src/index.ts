import type { PlatformDefinition } from '@sns-parse/core'

export const acfun: PlatformDefinition = {
  type: "acfun",
  label: "AcFun（A站）",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.)?acfun\\.cn\\/v\\/ac\\d{10,}", "gi"),
  ],
}

export default acfun
