import type { PlatformDefinition } from '@sns-parse/core'
import { parseXiaohongshu } from './xhs'

export * from './xhs'

export const xiaohongshu: PlatformDefinition = {
  type: "xiaohongshu",
  label: "小红书",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.|m\\.)?xiaohongshu\\.com\\/discovery\\/item\\/[0-9a-zA-Z_\\/-]+(?:\\?[^\\s'\"“”<>]*)?", "gi"),
    new RegExp("https?:\\/\\/(?:www\\.)?xhslink\\.(?:com|cn)\\/[0-9a-zA-Z_\\/-]+", "gi"),
    new RegExp("https?:\\/\\/(?:www\\.|m\\.)?xiaohongshu\\.com\\/explore\\/[0-9a-zA-Z_\\/-]+(?:\\?[^\\s'\"“”<>]*)?", "gi"),
    new RegExp("https?:\\/\\/(?:www\\.|m\\.)?xiaohongshu\\.com\\/board\\/[0-9a-zA-Z_\\/-]+(?:\\?[^\\s'\"“”<>]*)?", "gi"),
  ],
  hints: [
    '裸链（无 xsec_token）无法过闸：请发送 App 分享链接（xhslink.com 短链）或浏览器完整链接',
  ],
  /** 原生解析（无自定义专有 API 时）：短链自展开 + 游客页 __INITIAL_STATE__ 提取 + 旧网关兜底 */
  parse(url, ctx) {
    return parseXiaohongshu(url, ctx.http, Number(ctx.config?.maxDescLength) || 200)
  },
}

export default xiaohongshu
