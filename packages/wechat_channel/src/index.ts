import type { PlatformDefinition } from '@sns-parse/core'

export const wechat_channel: PlatformDefinition = {
  type: "wechat_channel",
  label: "视频号",
  rules: [
    new RegExp("https?:\\/\\/channels\\.weixin\\.qq\\.com\\/[0-9a-zA-Z_\\/-]+", "gi"),
    new RegExp("https?:\\/\\/weixin\\.qq\\.com\\/sph\\/[0-9a-zA-Z_\\/-]+", "gi"),
  ],
  dedicated: {
    legacy: "https://api.bugpk.com/api/wxsph",
    next: "https://api-new.ifphp.com/api/wxsph",
  },
}

export default wechat_channel
