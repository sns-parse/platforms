import type { PlatformDefinition } from '@sns-parse/core'
import { acfun } from '@sns-parse/platform-acfun'
import { bilibili } from '@sns-parse/platform-bilibili'
import { doubao } from '@sns-parse/platform-doubao'
import { doubao_image } from '@sns-parse/platform-doubao_image'
import { douyin } from '@sns-parse/platform-douyin'
import { haokan } from '@sns-parse/platform-haokan'
import { huya } from '@sns-parse/platform-huya'
import { instagram } from '@sns-parse/platform-instagram'
import { jimeng } from '@sns-parse/platform-jimeng'
import { kuaishou } from '@sns-parse/platform-kuaishou'
import { lishi } from '@sns-parse/platform-lishi'
import { meipai } from '@sns-parse/platform-meipai'
import { oasis } from '@sns-parse/platform-oasis'
import { pipigx } from '@sns-parse/platform-pipigx'
import { pipixia } from '@sns-parse/platform-pipixia'
import { quanmin } from '@sns-parse/platform-quanmin'
import { tiktok } from '@sns-parse/platform-tiktok'
import { toutiao } from '@sns-parse/platform-toutiao'
import { twitter } from '@sns-parse/platform-twitter'
import { wechat_channel } from '@sns-parse/platform-wechat_channel'
import { weibo } from '@sns-parse/platform-weibo'
import { weishi } from '@sns-parse/platform-weishi'
import { xiaohongshu } from '@sns-parse/platform-xiaohongshu'
import { xigua } from '@sns-parse/platform-xigua'
import { youtube } from '@sns-parse/platform-youtube'
import { zhihu } from '@sns-parse/platform-zhihu'
import { zuiyou } from '@sns-parse/platform-zuiyou'

/** 全部内置平台定义 */
export const BUILTIN_PLATFORMS: PlatformDefinition[] = [
  acfun,
  bilibili,
  doubao,
  doubao_image,
  douyin,
  haokan,
  huya,
  instagram,
  jimeng,
  kuaishou,
  lishi,
  meipai,
  oasis,
  pipigx,
  pipixia,
  quanmin,
  tiktok,
  toutiao,
  twitter,
  wechat_channel,
  weibo,
  weishi,
  xiaohongshu,
  xigua,
  youtube,
  zhihu,
  zuiyou,
]

/** 扁平规则表（链接识别用） */
export const BUILTIN_LINK_RULES: { pattern: RegExp; type: string }[] =
  BUILTIN_PLATFORMS.flatMap(p => p.rules.map(pattern => ({ pattern, type: p.type })))

export { acfun } from '@sns-parse/platform-acfun'
export { bilibili } from '@sns-parse/platform-bilibili'
export { doubao } from '@sns-parse/platform-doubao'
export { doubao_image } from '@sns-parse/platform-doubao_image'
export { douyin } from '@sns-parse/platform-douyin'
export { haokan } from '@sns-parse/platform-haokan'
export { huya } from '@sns-parse/platform-huya'
export { instagram } from '@sns-parse/platform-instagram'
export { jimeng } from '@sns-parse/platform-jimeng'
export { kuaishou } from '@sns-parse/platform-kuaishou'
export { lishi } from '@sns-parse/platform-lishi'
export { meipai } from '@sns-parse/platform-meipai'
export { oasis } from '@sns-parse/platform-oasis'
export { pipigx } from '@sns-parse/platform-pipigx'
export { pipixia } from '@sns-parse/platform-pipixia'
export { quanmin } from '@sns-parse/platform-quanmin'
export { tiktok } from '@sns-parse/platform-tiktok'
export { toutiao } from '@sns-parse/platform-toutiao'
export { twitter } from '@sns-parse/platform-twitter'
export { wechat_channel } from '@sns-parse/platform-wechat_channel'
export { weibo } from '@sns-parse/platform-weibo'
export { weishi } from '@sns-parse/platform-weishi'
export { xiaohongshu } from '@sns-parse/platform-xiaohongshu'
export { xigua } from '@sns-parse/platform-xigua'
export { youtube } from '@sns-parse/platform-youtube'
export { zhihu } from '@sns-parse/platform-zhihu'
export { zuiyou } from '@sns-parse/platform-zuiyou'
