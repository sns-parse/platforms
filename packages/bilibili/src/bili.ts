/**
 * 哔哩哔哩解析（原生）：
 * - 短链归一：b23.tv / bili2233.cn / b23.wtf / biliN.cn 跟随重定向取 www.bilibili.com/video/…；
 * - 风控：需先预热 bilibili.com 并经 SPI 取 buvid3/buvid4（模块级缓存 ~30min + 并发单飞），
 *   配合浏览器头（Origin/Referer/Sec-*）才能过 WAF（否则 412）；
 * - 元数据：/x/web-interface/view（标题/UP/封面/统计/分P）；
 * - 直链：/x/player/playurl?platform=html5&high_quality=1 → durl 单文件 muxed mp4（QQ 可直接播放；
 *   实测该直链无需 Referer 亦可下载）；
 * - 412/412 风控或会话失效时强刷 buvid 重试一次。
 */
import type { AxiosInstance } from 'axios'
import type { ParsedData, VideoQuality } from '@sns-parse/core'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const WARM = 'https://www.bilibili.com/'
const SPI = 'https://api.bilibili.com/x/frontend/finger/spi'
const VIEW = 'https://api.bilibili.com/x/web-interface/view'
const PLAYURL = 'https://api.bilibili.com/x/player/playurl'

const COOKIE_TTL = 30 * 60 * 1000
let cookieCache: { cookie: string; ts: number } | null = null
let inflight: Promise<string> | null = null

const QUALITY_LABEL: Record<number, string> = {
  127: '8K', 126: '杜比视界', 125: 'HDR', 120: '4K', 116: '1080P60', 112: '1080P+',
  100: '智能修复', 80: '1080P', 74: '720P60', 64: '720P', 32: '480P', 16: '360P', 6: '240P',
}

function baseParsed(): ParsedData {
  return {
    type: 'video', title: '', desc: '', author: '', uid: '', avatar: '', cover: '',
    video: '', videos: [], images: [], live_photo: [], music: {},
    like: 0, comment: 0, collect: 0, share: 0, play: 0, duration: 0, publishTime: 0,
    author_followers: 0, author_signature: '', admire: 0,
  }
}

function normalizeUrl(u: unknown): string {
  const s = String(u || '').trim()
  if (!s) return ''
  if (s.startsWith('//')) return 'https:' + s
  if (s.startsWith('http://')) return 'https:' + s.slice(5)
  return s
}

function toCount(v: unknown): number {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

function collectCookies(res: any, jar: Record<string, string>): void {
  const setCookie: unknown = res?.headers?.['set-cookie']
  for (const c of Array.isArray(setCookie) ? setCookie : []) {
    const [kv] = String(c).split(';')
    const i = kv.indexOf('=')
    if (i > 0) jar[kv.slice(0, i)] = kv.slice(i + 1)
  }
}

/** 预热门户 + SPI 取 buvid3/buvid4（缓存 + 单飞） */
async function buvidCookie(http: AxiosInstance): Promise<string> {
  if (cookieCache && Date.now() - cookieCache.ts < COOKIE_TTL) return cookieCache.cookie
  if (inflight) return inflight
  inflight = (async () => {
    const jar: Record<string, string> = {}
    try {
      const w = await http.get(WARM, {
        timeout: 15000,
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
        validateStatus: () => true,
      })
      collectCookies(w, jar)
    } catch { /* 预热失败不致命，SPI 可能补全 */ }
    try {
      const s = await http.get(SPI, {
        timeout: 10000,
        headers: { 'User-Agent': UA, 'Referer': WARM },
        validateStatus: () => true,
      })
      const d = (s as any)?.data?.data
      if (d?.b_3) { jar.buvid3 = String(d.b_3); jar.buvid4 = String(d.b_4 || '') }
    } catch { /* ignore */ }
    const cookie = Object.entries(jar).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('; ')
    cookieCache = { cookie, ts: Date.now() }
    return cookie
  })()
  try {
    return await inflight
  } finally {
    inflight = null
  }
}

function invalidateBuvid(): void {
  cookieCache = null
}

function browserHeaders(cookie: string, extra: Record<string, string> = {}): Record<string, string> {
  return {
    'User-Agent': UA,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Origin': 'https://www.bilibili.com',
    'Referer': WARM,
    'Cookie': cookie,
    ...extra,
  }
}

export interface BiliTarget { kind: 'bv' | 'av'; id: string; p: number }

/** 从 bilibili 链接提取目标（BV/av + 分P）；不匹配返回 null */
export function extractBiliTarget(url: string): BiliTarget | null {
  const m = /bilibili\.com\/video\/(BV[0-9A-Za-z]{5,20}|av\d{1,18})/i.exec(url)
  if (!m) return null
  const raw = m[1]
  const kind: 'bv' | 'av' = /^av/i.test(raw) ? 'av' : 'bv'
  const id = kind === 'bv' ? raw : raw.replace(/^av/i, '')
  let p = 1
  const pm = /[?&]p=(\d+)/i.exec(url)
  if (pm) p = Math.max(1, parseInt(pm[1], 10))
  return { kind, id, p }
}

const SHORT_LINK = /(?:^|\.)(?:b23\.tv|b23\.wtf|bili2233\.cn|bili\d+\.cn)$/i

/** 短链归一：跟随重定向，最终须命中 bilibili.com/video/ */
async function resolveBiliUrl(url: string, http: AxiosInstance): Promise<string> {
  let host = ''
  try { host = new URL(url).hostname } catch { return url }
  if (!SHORT_LINK.test(host)) return url
  const res = await http.get(url, {
    maxRedirects: 5,
    timeout: 15000,
    responseType: 'text',
    validateStatus: () => true,
    headers: { 'User-Agent': UA },
  })
  const finalUrl: string = ((res as any)?.request?.res?.responseUrl as string) || url
  if (extractBiliTarget(finalUrl)) return finalUrl
  // 兜底：从响应体里找 /video/BVxxx
  const body = typeof (res as any)?.data === 'string' ? (res as any).data : ''
  const m = /https?:\/\/www\.bilibili\.com\/video\/BV[0-9A-Za-z]+/i.exec(body)
  if (m) return m[0]
  throw new Error('短链指向的不是 B 站视频（可能是番剧/直播/动态），暂不支持')
}

/** view+playurl（412 风控/会话失效时强刷 buvid 重试一次） */
async function fetchBiliData(target: BiliTarget, http: AxiosInstance): Promise<{ view: any; durl: string; quality: number }> {
  const idParam = target.kind === 'bv' ? { bvid: target.id } : { aid: target.id }
  let lastMsg = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    const cookie = await buvidCookie(http)
    const viewRes = await http.get(VIEW, {
      params: { ...idParam },
      timeout: 20000,
      headers: browserHeaders(cookie),
      validateStatus: () => true,
    })
    const vj = (viewRes as any)?.data
    const httpStatus = (viewRes as any)?.status
    if (httpStatus === 412 || vj?.code === -412 || vj?.code === -799) {
      lastMsg = '风控拦截'
      invalidateBuvid()
      if (attempt === 0) continue
      throw new Error('B站风控拦截（412）：请稍后重试')
    }
    if (vj?.code !== 0) {
      const msg = String(vj?.message || '')
      if (vj?.code === -404) throw new Error('视频不存在或已失效')
      if (vj?.code === -403) throw new Error('视频受限（可能需要登录或大会员）')
      throw new Error(`B站接口错误：${msg || vj?.code}`)
    }
    const d = vj.data
    if (d?.state && d.state < 0) throw new Error('视频已失效或处于审核中')
    const pages = Array.isArray(d?.pages) ? d.pages : []
    const page = pages.find((x: any) => x.page === target.p) || pages[0]
    const cid = page?.cid
    if (!cid) throw new Error('无法获取视频分P信息（cid 缺失）')
    const playRes = await http.get(PLAYURL, {
      params: {
        ...idParam,
        cid,
        platform: 'html5',
        high_quality: 1,
        qn: 80,
        fnval: 1,
        fnver: 0,
        fourk: 1,
      },
      timeout: 20000,
      headers: browserHeaders(cookie),
      validateStatus: () => true,
    })
    const pj = (playRes as any)?.data
    const durl = pj?.data?.durl?.[0]?.url
    if (pj?.code === 0 && durl) return { view: { ...d, __page: page }, durl, quality: Number(pj?.data?.quality || 0) }
    lastMsg = String(pj?.message || pj?.code || '')
    invalidateBuvid()
    if (attempt === 0) continue
    throw new Error(`无法获取视频直链（${lastMsg || '可能需登录或视频受限'}）`)
  }
  throw new Error(`B站解析失败${lastMsg ? '：' + lastMsg : ''}`)
}

function mapBili(d: any, durl: string, quality: number, maxDescLength: number): ParsedData {
  const p = baseParsed()
  const page = d.__page || {}
  p.title = String(d.title || '')
  if (page.page && page.page > 1 && page.part) p.title = `${p.title} P${page.page} ${page.part}`
  p.desc = String(d.desc || '').slice(0, maxDescLength)
  const owner = d.owner || {}
  p.author = String(owner.name || '')
  p.uid = String(owner.mid || '')
  p.avatar = normalizeUrl(owner.face)
  p.author_signature = String(d.dynamic || '')
  p.cover = normalizeUrl(d.pic)
  p.video = durl
  p.videos = [{ quality: QUALITY_LABEL[quality] || `${quality}P`, url: durl }] as VideoQuality[]
  p.duration = Number(page.duration || d.duration || 0)
  const st = d.stat || {}
  p.like = toCount(st.like)
  p.comment = toCount(st.reply)
  p.collect = toCount(st.favorite)
  p.share = toCount(st.share)
  p.play = toCount(st.view)
  if (d.pubdate) p.publishTime = Number(d.pubdate) * 1000
  return p
}

/** B 站解析入口 */
export async function parseBilibili(url: string, http: AxiosInstance, maxDescLength = 200): Promise<ParsedData> {
  const resolved = await resolveBiliUrl(url, http)
  const target = extractBiliTarget(resolved)
  if (!target) throw new Error(`无法从链接中提取视频 ID（仅支持 bilibili.com/video/BV… 与 b23.tv 短链）：${resolved}`)
  const { view, durl, quality } = await fetchBiliData(target, http)
  const p = mapBili(view, durl, quality, maxDescLength)
  if (!p.video) throw new Error('未获取到视频直链')
  return p
}
