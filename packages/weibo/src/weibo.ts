/**
 * 微博解析（原生访客流）：
 * - visitor.passport.weibo.cn 访客系统（genvisitor → incarnate → SUB cookie，模块级缓存 ~20min + 单飞）。
 * - URL 归一：weibo.com/{uid}/{bid} / m.weibo.cn/{status|detail|profile}/{id} /
 *   video.weibo.com/show?fid=1034:{mid} / t.cn 短链（302 跟随后须命中微博形态，否则明确报错）。
 * - m.weibo.cn/statuses/show 拉数据；432/未 ok 时强刷访客 cookie 重试一次。
 * - 长文（isLongText）走 /statuses/extend；转发取一层（本条无媒体时借转发对象的媒体）。
 * - 视频直链为带签名时效 URL（Expires/ssig），下游应即取即用。
 */
import type { AxiosInstance } from 'axios'
import type { ParsedData, VideoQuality } from '@sns-parse/core'

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
const GENVISITOR = 'https://visitor.passport.weibo.cn/visitor/genvisitor'
const INCARNATE = 'https://visitor.passport.weibo.cn/visitor/visitor'
const SHOW = 'https://m.weibo.cn/statuses/show'
const EXTEND = 'https://m.weibo.cn/statuses/extend'

const COOKIE_TTL = 20 * 60 * 1000
let cookieCache: { cookie: string; ts: number } | null = null
let inflight: Promise<string> | null = null

function baseParsed(): ParsedData {
  return {
    type: 'image', title: '', desc: '', author: '', uid: '', avatar: '', cover: '',
    video: '', videos: [], images: [], live_photo: [], music: {},
    like: 0, comment: 0, collect: 0, share: 0, play: 0, duration: 0, publishTime: 0,
    author_followers: 0, author_signature: '', admire: 0,
  }
}

function normalizeImgUrl(u: unknown): string {
  const s = String(u || '').trim()
  if (!s) return ''
  if (s.startsWith('//')) return 'https:' + s
  return s
}

function toCount(v: unknown): number {
  if (v == null) return 0
  const n = Number(v)
  if (!isNaN(n)) return n
  const m = /([\d.]+)\s*万/.exec(String(v))
  if (m) return Math.round(parseFloat(m[1]) * 10000)
  return 0
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
}

/** 微博富文本 → 纯文本：<a> 取文字、emoji <img> 取 alt、<br> 换行 */
function weiboTextToPlain(html: unknown): string {
  let s = String(html || '')
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<img[^>]*\balt="([^"]*)"[^>]*>/gi, '$1')
  s = s.replace(/<\/?[a-z][^>]*>/gi, '')
  return decodeEntities(s).trim()
}

/** 访客 cookie（SUB/SUBP/SRT/SRF…，.weibo.cn 域），模块级缓存 + 并发单飞 */
async function visitorCookie(http: AxiosInstance): Promise<string> {
  if (cookieCache && Date.now() - cookieCache.ts < COOKIE_TTL) return cookieCache.cookie
  if (inflight) return inflight
  inflight = (async () => {
    const fp = '{"os":"2","browser":"Safari17","fonts":"undefined","screenInfo":"24*24*30","plugins":""}'
    const g = await http.post(GENVISITOR, new URLSearchParams({ cb: 'gen_callback', fp }).toString(), {
      timeout: 15000,
      headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
      validateStatus: () => true,
    })
    const tid = /"tid":"([^"]+)"/.exec(String((g as any)?.data || ''))?.[1]
    if (!tid) throw new Error('微博访客签名获取失败（genvisitor 未返回 tid）')
    const inc = await http.get(INCARNATE, {
      params: { a: 'incarnate', t: tid, w: 2, c: 100, gc: '', cb: 'cross_domain', from: 'weibo', _rand: Date.now() },
      timeout: 15000,
      headers: { 'User-Agent': UA },
      validateStatus: () => true,
    })
    const setCookie: unknown = (inc.headers as any)?.['set-cookie']
    const jar: Record<string, string> = {}
    for (const c of Array.isArray(setCookie) ? setCookie : []) {
      const [kv] = String(c).split(';')
      const i = kv.indexOf('=')
      if (i > 0) jar[kv.slice(0, i)] = kv.slice(i + 1)
    }
    const cookie = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ')
    if (!/(?:^|;\s*)SUB=/.test(cookie)) throw new Error('微博访客授权失败（未获得 SUB cookie）')
    cookieCache = { cookie, ts: Date.now() }
    return cookie
  })()
  try {
    return await inflight
  } finally {
    inflight = null
  }
}

function invalidateVisitor(): void {
  cookieCache = null
}

/** 从微博 URL 提取 status id（bid / mid）；不匹配返回 null */
export function extractWeiboId(url: string): string | null {
  let m = /weibo\.cn\/(?:status|detail|profile)\/([0-9a-zA-Z]{5,18})/i.exec(url)
  if (m) return m[1]
  m = /weibo\.com\/(?:\d+|status)\/([0-9a-zA-Z]{5,18})/i.exec(url)
  if (m && !/^profile$/i.test(m[1])) return m[1]
  m = /video\.weibo\.com\/show\?fid=[0-9]+:([0-9]+)/i.exec(url)
  if (m) return m[1]
  return null
}

/** t.cn 短链解析：跟随 302（最多 3 跳），最终须命中微博形态 */
async function resolveWeiboUrl(url: string, http: AxiosInstance): Promise<string> {
  if (!/https?:\/\/t\.cn\//i.test(url)) return url
  for (let hop = 0; hop < 3; hop++) {
    const res = await http.get(url, {
      maxRedirects: 0,
      timeout: 15000,
      validateStatus: () => true,
      headers: { 'User-Agent': UA },
    })
    const loc = (res.headers as any)?.location as string | undefined
    if (!loc) break
    url = new URL(loc, url).href
    if (!/https?:\/\/t\.cn\//i.test(url)) break
  }
  if (!extractWeiboId(url)) {
    const host = /https?:\/\/([^/?#]+)/i.exec(url)?.[1] || '未知'
    throw new Error(`t.cn 短链指向的不是微博内容（${host}），无法解析`)
  }
  return url
}

/** statuses/show；432/未 ok 时强刷访客 cookie 重试一次 */
async function weiboShow(id: string, http: AxiosInstance): Promise<any | null> {
  let lastMsg = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    const cookie = await visitorCookie(http)
    const res = await http.get(SHOW, {
      params: { id },
      timeout: 20000,
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `https://m.weibo.cn/status/${id}`,
        'Cookie': cookie,
      },
      validateStatus: () => true,
    })
    const body = (res as any)?.data
    if (body?.ok && body.data) return body.data
    lastMsg = String(body?.msg || '')
    invalidateVisitor()
    if (attempt === 0) continue
    if (/未找到|不存在|删除/.test(lastMsg)) throw new Error('微博不存在或已删除')
    return null
  }
  return null
}

/** show 数据 → ParsedData */
function mapWeiboStatus(d: any, maxDescLength: number, extendText: string): ParsedData {
  const p = baseParsed()
  const user = d.user || {}
  p.author = String(user.screen_name || '')
  p.uid = String(user.id || user.uid || '')
  p.avatar = normalizeImgUrl(user.avatar_hd || user.profile_image_url)
  p.author_followers = toCount(user.followers_count)
  p.like = toCount(d.attitudes_count)
  p.comment = toCount(d.comments_count)
  p.share = toCount(d.reposts_count)
  const t = Date.parse(String(d.created_at || ''))
  if (!isNaN(t)) p.publishTime = t

  let text = weiboTextToPlain(extendText || d.full_text || d.text)

  // 媒体宿主：本条优先（live 卡不算可提取媒体）；本条无媒体且为转发时借转发对象（一层）
  let media = d
  const pi0 = d.page_info
  const selfHasMedia = (Array.isArray(d.pic_ids) && d.pic_ids.length) || (pi0?.media_info && pi0.type !== 'live')
  if (!selfHasMedia && d.retweeted_status) {
    media = d.retweeted_status
    const rtText = weiboTextToPlain(media.full_text || media.text)
    text += `\n//@${media.user?.screen_name || ''}: ${rtText}`
  }

  const pi = media.page_info
  const mi = pi?.media_info
  const streamUrls = [mi?.stream_url_hd, mi?.stream_url].filter(Boolean)
  if (pi?.type !== 'live' && streamUrls.length) {
    const seen = new Set<string>()
    p.videos = ([
      { quality: '高清', url: mi.stream_url_hd },
      { quality: '标清', url: mi.stream_url },
    ] as VideoQuality[]).filter(v => v.url && !seen.has(v.url) && (seen.add(v.url), true))
    p.video = p.videos[0].url
    p.type = 'video'
    if (pi.page_pic?.url) p.cover = normalizeImgUrl(pi.page_pic.url)
    if (mi.duration) p.duration = Math.round(Number(mi.duration) || 0)
    p.play = toCount(pi.play_count)
  } else if (pi?.type === 'live') {
    // 直播无回放：降级文本 + 直播间链接
    p.type = 'text'
    const liveUrl = normalizeImgUrl(mi?.stream_url || pi.page_url)
    if (liveUrl) text += `\n【正在直播】${liveUrl}`
    if (pi.page_pic?.url) p.cover = normalizeImgUrl(pi.page_pic.url)
  } else {
    const imgs: string[] = []
    if (media.pic_infos && typeof media.pic_infos === 'object') {
      for (const info of Object.values<any>(media.pic_infos)) {
        const u = normalizeImgUrl(info?.largest?.url || info?.large?.url || info?.bmiddle?.url)
        if (u) imgs.push(u)
        const lp = info?.livephoto
        const v = normalizeImgUrl(lp?.video_url || lp?.url || lp?.stream_url)
        if (u && v) p.live_photo.push({ image: u, video: v })
      }
    }
    if (!imgs.length && Array.isArray(media.pic_ids)) {
      for (const pid of media.pic_ids) {
        const s = String(pid)
        imgs.push(`https://wx2.sinaimg.cn/large/${/\.[a-z0-9]+$/i.test(s) ? s : s + '.jpg'}`)
      }
    }
    p.images = imgs
    p.type = imgs.length ? 'image' : 'text'
    if (imgs.length) p.cover = imgs[0]
    else if (pi?.page_pic?.url) p.cover = normalizeImgUrl(pi.page_pic.url)
  }

  if (d.region_name) text += ` 发布于 ${d.region_name}`
  p.desc = text.slice(0, maxDescLength).trim()
  return p
}

/** 微博解析入口 */
export async function parseWeibo(url: string, http: AxiosInstance, maxDescLength = 200): Promise<ParsedData> {
  const resolved = await resolveWeiboUrl(url, http)
  const id = extractWeiboId(resolved)
  if (!id) throw new Error(`无法从链接中提取微博 ID：${resolved}`)
  const d = await weiboShow(id, http)
  if (!d) throw new Error('微博获取失败：可能需要登录或内容受限')
  let extendText = ''
  if (d.isLongText) {
    try {
      const cookie = cookieCache?.cookie || await visitorCookie(http)
      const res = await http.get(EXTEND, {
        params: { id },
        timeout: 15000,
        headers: {
          'User-Agent': UA,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': `https://m.weibo.cn/status/${id}`,
          'Cookie': cookie,
        },
        validateStatus: () => true,
      })
      const body = (res as any)?.data
      if (body?.ok && body.data?.longTextContent) extendText = String(body.data.longTextContent)
    } catch { /* 长文失败退回普通文本 */ }
  }
  const p = mapWeiboStatus(d, maxDescLength, extendText)
  if (p.video || p.images.length || p.live_photo.length || p.desc) return p
  throw new Error('微博内容为空（可能仅含不可见媒体）')
}
