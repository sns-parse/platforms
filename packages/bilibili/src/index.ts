import type { PlatformDefinition } from '@sns-parse/core'
import { parseBilibili } from './bili'

export * from './bili'

export const bilibili: PlatformDefinition = {
  type: "bilibili",
  label: "哔哩哔哩",
  rules: [
    new RegExp("https?:\\/\\/(?:www\\.)?bilibili\\.com\\/video\\/([ab]v[0-9a-zA-Z_-]+)(?:\\?[^\\s'\"“”<>]*)?", "gi"),
    new RegExp("https?:\\/\\/b23\\.tv\\/[0-9a-zA-Z_\\/-]+", "gi"),
    new RegExp("https?:\\/\\/bili\\d+\\.cn\\/[0-9a-zA-Z_\\/-]+", "gi"),
    new RegExp("https?:\\/\\/b23\\.wtf\\/[0-9a-zA-Z_\\/-]+", "gi"),
    new RegExp("https?:\\/\\/bili2233\\.cn\\/[0-9a-zA-Z_\\/-]+", "gi"),
  ],
  hints: [
    '支持 bilibili.com/video 与 b23.tv 短链；番剧/直播/动态暂不支持',
  ],
  /** 原生解析：短链展开 → buvid 过 WAF → view 元数据 + playurl(html5) 单文件 mp4 直链 */
  parse(url, ctx) {
    return parseBilibili(url, ctx.http, Number(ctx.config?.maxDescLength) || 200)
  },
}

export default bilibili
