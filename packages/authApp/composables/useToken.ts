import { gatewayApi } from 'api'

/** 到期前多久自动刷新 */
const REFRESH_BEFORE_MS = 3 * 60 * 1000

const KEY = {
  access: 'access_token',
  refresh: 'refresh_token',
  expiry: 'accessTokenExpiry',
  session: 'sessionId',
  legacy: 'token'
} as const

let refreshTimer: ReturnType<typeof setTimeout> | null = null
/** 多处并发 refresh 共用同一个 Promise */
let refreshPromise: Promise<string> | null = null
let hydrated = false

export interface TokenPayload {
  access_token?: string
  refresh_token?: string
  /** ms 时间戳 / 秒级时间戳 / ISO 字符串 */
  accessTokenExpiry?: number | string
  sessionId?: string
}

/** 共享状态（useState key 保证多处调用同一份） */
function tokenState() {
  return {
    access_token: useState<string>('auth-access-token', () => ''),
    refresh_token: useState<string>('auth-refresh-token', () => ''),
    accessTokenExpiry: useState<number>('auth-access-token-expiry', () => 0),
    sessionId: useState<string>('auth-session-id', () => '')
  }
}

function parseJwtExpMs(token: string): number {
  try {
    const part = token.split('.')[1]
    if (!part) return 0
    const json = JSON.parse(window.atob(part.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof json.exp === 'number' ? json.exp * 1000 : 0
  } catch {
    return 0
  }
}

/** 把各种过期格式统一成 ms；没有则从 JWT exp 解析 */
function toExpiryMs(value?: number | string, accessToken?: string): number {
  if (typeof value === 'number' && value > 0) {
    return value < 1e12 ? value * 1000 : value
  }
  if (typeof value === 'string' && value) {
    const asNum = Number(value)
    if (!Number.isNaN(asNum) && asNum > 0) return asNum < 1e12 ? asNum * 1000 : asNum
    const asDate = Date.parse(value)
    if (!Number.isNaN(asDate)) return asDate
  }
  return accessToken ? parseJwtExpMs(accessToken) : 0
}

function stopTimer() {
  if (refreshTimer == null) return
  clearTimeout(refreshTimer)
  refreshTimer = null
}

/** 在 expiry 前 3 分钟触发 handleRefreshToken */
function startTimer(expiryMs: number) {
  stopTimer()
  if (!import.meta.client || !expiryMs) return

  const delay = Math.max(expiryMs - Date.now() - REFRESH_BEFORE_MS, 0)
  refreshTimer = setTimeout(() => {
    handleRefreshToken().catch(() => {})
  }, delay)
}

/** 写入内存 + localStorage，并重设定时器 */
export function setToken(payload: TokenPayload) {
  const s = tokenState()

  if (payload.access_token != null) {
    s.access_token.value = payload.access_token
    localStorage.setItem(KEY.access, payload.access_token)
    localStorage.setItem(KEY.legacy, payload.access_token)
  }
  if (payload.refresh_token != null) {
    s.refresh_token.value = payload.refresh_token
    localStorage.setItem(KEY.refresh, payload.refresh_token)
  }
  if (payload.sessionId != null) {
    s.sessionId.value = payload.sessionId
    localStorage.setItem(KEY.session, payload.sessionId)
  }

  const expiry = toExpiryMs(
    payload.accessTokenExpiry,
    payload.access_token || s.access_token.value
  )
  if (!expiry) return

  s.accessTokenExpiry.value = expiry
  localStorage.setItem(KEY.expiry, String(expiry))
  startTimer(expiry)
}

/** 清状态、定时器、本地存储 */
export function clearToken() {
  stopTimer()
  refreshPromise = null
  hydrated = false

  const s = tokenState()
  s.access_token.value = ''
  s.refresh_token.value = ''
  s.accessTokenExpiry.value = 0
  s.sessionId.value = ''

  if (!import.meta.client) return
  Object.values(KEY).forEach((k) => localStorage.removeItem(k))
}

/**
 * 刷新 access_token。
 * 定时器 / 401 / 业务代码可同时调用，只会请求一次。
 */
export async function handleRefreshToken() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const s = tokenState()
    const refresh =
      s.refresh_token.value || localStorage.getItem(KEY.refresh) || ''
    if (!refresh) throw new Error('no refresh token')

    const res: any = await gatewayApi.auth.postAuthRefresh({ refreshToken: refresh })
    const data = res?.data ?? res
    const access_token = (data?.access_token || data?.accessToken) as string | undefined
    if (!access_token) throw new Error('refresh token response is null')

    setToken({
      access_token,
      refresh_token: data?.refresh_token || data?.refreshToken,
      sessionId: data?.sessionId || data?.session_id,
      accessTokenExpiry: data?.accessTokenExpiry || data?.expiresAt || data?.expires_at
    })
    return access_token
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

/** 首次从 localStorage 恢复（页面刷新后） */
function hydrateOnce() {
  if (!import.meta.client || hydrated) return
  hydrated = true

  const s = tokenState()
  if (s.access_token.value) {
    startTimer(s.accessTokenExpiry.value)
    return
  }

  const access_token = localStorage.getItem(KEY.access)
  if (!access_token) return

  setToken({
    access_token,
    refresh_token: localStorage.getItem(KEY.refresh) || undefined,
    sessionId: localStorage.getItem(KEY.session) || undefined,
    accessTokenExpiry: localStorage.getItem(KEY.expiry) || undefined
  })
}

/**
 * 入口：一次创建、多处调用。
 * 返回共享状态 + setToken / clearToken / handleRefreshToken
 */
export function useToken() {
  const s = tokenState()
  hydrateOnce()

  return {
    ...s,
    setToken,
    clearToken,
    handleRefreshToken
  }
}
