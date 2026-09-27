import type { PlatformDefinition } from '@sns-parse/core'
import { parseWeibo } from './weibo'

export * from './weibo'

export const weibo: PlatformDefinition = {
  type: "weibo",
  label: "微博",
  rules: [
    // 桌面端状态页 weibo.com/{uid}/{bid}（负向排除 profile 等子路径误伤）
    new RegExp("https?:\\/\\/(?:www\\.)?weibo\\.com\\/(?:\\d+|status)\\/(?!profile)[0-9a-zA-Z]{5,18}(?:\\?[^\\s'\"“”<>]*)?", "gi"),
    // 移动端 m.weibo.cn/{status|detail|profile}/{id}
    new RegExp("https?:\\/\\/m\\.weibo\\.cn\\/(?:status|detail|profile)\\/[0-9a-zA-Z]{5,18}(?:\\?[^\\s'\"“”<>]*)?", "gi"),
    // 视频页 video.weibo.com/show?fid=1034:{mid}（fid 含冒号，query 任意）
    new RegExp("https?:\\/\\/video\\.weibo\\.com\\/show\\?fid=[0-9]+:[0-9]+(?:&[^\\s'\"“”<>]*)?", "gi"),
    // t.cn 短链（解析后须命中微博形态，否则明确报"指向非微博内容"）
    new RegExp("https?:\\/\\/t\\.cn\\/[0-9a-zA-Z]+", "gi"),
  ],
  hints: [
    't.cn 短链可能指向站外内容：非微博目标会明确提示；直播微博暂无回放，降级为文本+直播间链接',
  ],
  /** 原生解析：passport 访客流（SUB cookie）→ m.weibo.cn/statuses/show（长文走 extend，转发借一层媒体） */
  parse(url, ctx) {
    return parseWeibo(url, ctx.http, Number(ctx.config?.maxDescLength) || 200)
  },
}

export default weibo
