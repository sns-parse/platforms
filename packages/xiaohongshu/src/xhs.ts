/**
 * 小红书笔记解析（原生）：
 * - 短链（xhslink.com）自行跟随重定向拿完整 URL（含 xsec_token）；死链/登录墙时从
 *   redirectPath 参数恢复真实链接再试。
 * - 游客拉取笔记页，提取 window.__INITIAL_STATE__.note.noteDetailMap（标题/正文/图集/
 *   视频流/互动数据），og 元信息兜底。
 * - 页面拿不到时回退旧网关（api.bugpk.com/api/xhs）解析（需带 token 的完整链接）。
 */
import type { AxiosInstance } from 'axios'
import type { ParsedData, VideoQuality } from '@sns-parse/core'
import { parseApiResponse } from '@sns-parse/core'

const PAGE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const LEGACY_GATEWAY = 'https://api.bugpk.com/api/xhs'

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

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
}

function metaContent(html: string, key: RegExp): string {
  const re = new RegExp(`<meta[^>]+(?:property|name)\\s*=\\s*["'](?:${key.source})["'][^>]*>`, 'i')
  const tag = re.exec(html)
  if (!tag) return ''
  const c = /content\s*=\s*["']([^"']*)["']/i.exec(tag[0])
  return c ? decodeHtmlEntities(c[1]).trim() : ''
}

/** 提取 __INITIAL_STATE__（undefined→null 后 JSON.parse；失败返回 null） */
function extractInitialState(html: string): any | null {
  const m = /window\.__INITIAL_STATE__\s*=\s*([\s\S]*?)<\/script>/.exec(html)
  if (!m) return null
  let raw = m[1].trim().replace(/;$/, '')
  try {
    return JSON.parse(raw.replace(/\bundefined\b/g, 'null'))
  } catch {
    return null
  }
}

/** noteDetailMap 中取真实笔记节点（跳过 currentNoteId 等元键） */
function pickNoteNode(state: any): any | null {
  const map = state?.note?.noteDetailMap
  if (!map || typeof map !== 'object') return null
  for (const k of Object.keys(map)) {
    const n = map[k]?.note
    if (n && (n.id || n.noteId || Array.isArray(n.imageList) || n.video)) return n
  }
  return null
}

/** 视频流 → 变体列表（h264 主选 + h265/av1 与 backup 兜底） */
function videoVariants(note: any): VideoQuality[] {
  const stream = note?.video?.media?.stream || {}
  const out: VideoQuality[] = []
  for (const codec of ['h264', 'h265', 'av1', 'h265_drm', 'av1_drm']) {
    const list = stream[codec]
    if (!Array.isArray(list)) continue
    for (const v of list) {
      const urls = [v.masterUrl, ...(Array.isArray(v.backupUrls) ? v.backupUrls : [])].filter(Boolean)
      for (const u of urls) {
        out.push({ quality: `${codec}${v.avgBitrate ? '@' + v.avgBitrate : ''}`, url: String(u), bit_rate: Number(v.avgBitrate || 0) })
      }
    }
  }
  return out
}

/** __INITIAL_STATE__.note → ParsedData */
function mapNoteState(n: any): ParsedData | null {
  const p = baseParsed()
  const imgs = (Array.isArray(n.imageList) ? n.imageList : [])
    .map((i: any) => normalizeImgUrl(i.urlDefault || i.url || (Array.isArray(i.infoList) ? i.infoList[i.infoList.length - 1]?.url : '')))
    .filter(Boolean)
  const variants = videoVariants(n)
  p.images = imgs
  if (variants.length) {
    p.videos = variants
    p.video = variants[0].url
    p.type = 'video'
    const capa = n.video?.capa
    const durMs = Number(n.video?.media?.stream?.h264?.[0]?.durationMs || capa?.duration * 1000 || 0)
    if (durMs) p.duration = Math.round(durMs / 1000)
    if (imgs.length) p.cover = imgs[0]
  } else {
    p.type = imgs.length ? 'image' : 'text'
    if (imgs.length) p.cover = imgs[0]
  }
  p.title = String(n.title || '').trim()
  p.desc = String(n.desc || '').trim()
  const user = n.user || {}
  p.author = String(user.nickname || user.nickName || '')
  p.uid = String(user.userId || user.user_id || '')
  p.avatar = normalizeImgUrl(user.avatar || user.images)
  const inter = n.interactInfo || {}
  p.like = toCount(inter.liked)
  p.comment = toCount(inter.commentCount)
  p.collect = toCount(inter.collected)
  p.share = toCount(inter.shared)
  if (n.time) p.publishTime = Number(n.time) || 0
  if (n.ipLocation) p.author_signature = String(n.ipLocation)
  if (p.title && p.desc && p.desc.startsWith(p.title)) p.title = ''
  return p
}

/** og 元信息兜底（picasso-static 为站点框架图，不可用） */
function mapOgMeta(html: string): ParsedData | null {
  const image = normalizeImgUrl(metaContent(html, /og:image(?::secure_url)?|twitter:image/))
  if (!image || image.includes('picasso-static')) return null
  const p = baseParsed()
  p.type = 'image'
  p.title = metaContent(html, /og:title|twitter:title/)
  p.desc = metaContent(html, /og:description|twitter:description/)
  p.images = [image]
  p.cover = image
  return p
}

interface ResolvedLink {
  finalUrl: string
  html: string
  noteUnavailable: boolean
  verifyMsg: string
}

/** 短链/直链归一：跟随重定向；死链或登录墙时从 redirectPath 恢复真实链接重试一次 */
async function resolveAndFetch(url: string, http: AxiosInstance): Promise<ResolvedLink> {
  const fetch = async (u: string): Promise<ResolvedLink> => {
    const res = await http.get(u, {
      timeout: 30000,
      responseType: 'text' as const,
      maxRedirects: 10,
      validateStatus: () => true,
      headers: {
        'User-Agent': PAGE_UA,
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    })
    const finalUrl: string = (res.request?.res?.responseUrl as string) || u
    const html = typeof res.data === 'string' ? res.data : String(res.data || '')
    const q = new URL(finalUrl, 'https://www.xiaohongshu.com')
    const verifyMsg = decodeURIComponent(q.searchParams.get('verifyMsg') || q.searchParams.get('error_msg') || '')
    const noteUnavailable = /\/404/.test(q.pathname) || !!q.searchParams.get('error_code')
    return { finalUrl, html, noteUnavailable, verifyMsg }
  }
  const first = await fetch(url)
  const q = new URL(first.finalUrl, 'https://www.xiaohongshu.com')
  // 短链过期→登录墙 / 死链→404：redirectPath 里常保有带 token 的真实链接，恢复后重试
  if (q.pathname.startsWith('/login') || first.noteUnavailable) {
    const rp = q.searchParams.get('redirectPath')
    if (rp && !rp.startsWith('/login')) {
      const recovered = decodeURIComponent(rp)
      if (recovered.startsWith('http')) {
        const second = await fetch(recovered)
        const q2 = new URL(second.finalUrl, 'https://www.xiaohongshu.com')
        if (!second.noteUnavailable && !q2.pathname.startsWith('/login')) return second
      }
    }
  }
  return first
}

/** 小红书解析入口：页面（__INITIAL_STATE__ / og）优先，旧网关兜底 */
export async function parseXiaohongshu(url: string, http: AxiosInstance, maxDescLength = 200): Promise<ParsedData> {
  let resolved = url
  let html = ''
  try {
    const r = await resolveAndFetch(url, http)
    resolved = r.finalUrl
    html = r.html
    if (r.noteUnavailable) {
      throw new Error(r.verifyMsg || '当前笔记暂时无法浏览（可能已删除、被下架或需要验证）')
    }
    const state = extractInitialState(html)
    const note = state ? pickNoteNode(state) : null
    if (note) {
      const p = mapNoteState(note)
      if (p && (p.images.length || p.video || p.desc || p.title)) return p
    }
    const og = mapOgMeta(html)
    if (og) return og
  } catch (e: any) {
    // 页面路径失败（含笔记不可浏览）时，若原始 URL 带 token 仍可试网关；否则把页面阶段的错误抛出
    const hasToken = /xsec_token=/.test(resolved) || /xsec_token=/.test(url)
    if (!hasToken) throw e
  }

  // 网关兜底（需带 xsec_token 的完整链接）
  const gwUrl = /xsec_token=/.test(resolved) ? resolved : (/xsec_token=/.test(url) ? url : resolved)
  const res = await http.get(LEGACY_GATEWAY, {
    params: { url: gwUrl },
    timeout: 30000,
    headers: { 'User-Agent': PAGE_UA },
    validateStatus: () => true,
  })
  const body = res?.data
  const code = body?.code ?? body?.status
  const ok = body && (code === 200 || code === 0 || (code === undefined && body.status === undefined))
  if (ok && body.data) {
    const p = parseApiResponse(body, maxDescLength)
    if (p && (p.video || (p.images && p.images.length) || p.desc || p.title)) return p
  }
  const msg = String(body?.msg || body?.message || `网关返回 HTTP ${res?.status}`)
  if (/xsec_token/i.test(msg)) {
    throw new Error('小红书链接缺少 xsec_token：请发送 App 分享链接（xhslink.com 短链）或浏览器完整链接（含 xsec_token 参数），裸链无法过闸')
  }
  throw new Error(`小红书解析失败：${msg}`)
}
