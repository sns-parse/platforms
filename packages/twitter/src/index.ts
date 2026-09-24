/**
 * @sns-parse/platform-twitter — Twitter/X 平台定义与原生解析实现。
 *
 * 实现（syndication 游客路径 / 登录态 GraphQL / 推文树 / 用户维度查询 /
 * Grok 翻译）全部在本包；core 只经 PlatformDefinition.parse / translate 钩子调度。
 */
import type { PlatformDefinition } from '@sns-parse/core'
import { parseTwitter, fetchGrokTranslation, twCredsFromConfig } from './twitter'

export * from './twitter'
export * from './twitter-user'

export const twitter: PlatformDefinition = {
  type: 'twitter',
  label: 'Twitter/X',
  rules: [
    new RegExp('https?:\\/\\/twitter\\.com\\/\\w+\\/status\\/\\d{10,}', 'gi'),
    new RegExp('https?:\\/\\/x\\.com\\/\\w+\\/status\\/\\d{10,}', 'gi'),
  ],
  /** 原生解析：不经网关（除非用户自定义专属 API） */
  parse(url, ctx) {
    return parseTwitter(url, ctx.http, twCredsFromConfig(ctx.config), ctx.getGraphql)
  },
  /** 网页同源 Grok 翻译（需登录态；失败回落 ext-translate 通用翻译） */
  translate(ctx, url, _text, target) {
    const creds = twCredsFromConfig(ctx.config)
    if (!creds) return Promise.resolve(null)
    return fetchGrokTranslation(url, target, creds, ctx.getGraphql)
  },
}

export default twitter
