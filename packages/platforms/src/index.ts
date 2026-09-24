/**
 * @sns-parse/platforms：全量平台声明聚合包。
 *
 * - 通过 dependencies 自动安装全部 27 个 platform-* 碎片包
 * - 导出 definitions[]（全部平台声明并集），供 core collectPlatformDefinitions()
 *   聚合优先通道一次性取全；粒度包可单独安装并覆盖聚合条目
 */
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

export {
  acfun, bilibili, doubao, doubao_image, douyin, haokan, huya, instagram, jimeng,
  kuaishou, lishi, meipai, oasis, pipigx, pipixia, quanmin, tiktok, toutiao,
  twitter, wechat_channel, weibo, weishi, xiaohongshu, xigua, youtube, zhihu, zuiyou,
}

/** 全部平台声明（支持范围 = 已加载声明并集） */
export const definitions: PlatformDefinition[] = [
  acfun, bilibili, doubao, doubao_image, douyin, haokan, huya, instagram, jimeng,
  kuaishou, lishi, meipai, oasis, pipigx, pipixia, quanmin, tiktok, toutiao,
  twitter, wechat_channel, weibo, weishi, xiaohongshu, xigua, youtube, zhihu, zuiyou,
]

export default definitions
