import { gatewayApi } from 'api'

/** accessTokenExpiry 到期前多久触发刷新 */
const REFRESH_BEFORE_MS = 3 * 60 * 1000

let refreshTimer: ReturnType<typeof setTimeout> | null = null
/** 多处并发调用共用同一次 refresh */
let refreshPromise: Promise<string> | null = null
let hydrated = false

export interface TokenPayload {
  access_token?: string
  refresh_token?: string
  /** 过期时间戳（ms）；也可传 ISO 字符串 */
  accessTokenExpiry?: number | string
  sessionId?: string
}

function getAccessToken() {
  return useState<string>('auth-access-token', () => '')
}
function getRefreshToken() {
  return useState<string>('auth-refresh-token', () => '')
}
function getAccessTokenExpiry() {
  return useState<number>('auth-access-token-expiry', () => 0)
}
function getSessionId() {
  return useState<string>('auth-session-id', () => '')
}

function clearRefreshTimer() {
  if (refreshTimer != null) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

function toExpiryMs(value?: number | string, accessToken?: string): number {
  if (typeof value === 'number' && value > 0) {
    return value < 1e12 ? value * 1000 : value
  }
  if (typeof value === 'string' && value) {
    const asNum = Number(value)
    if (!Number.isNaN(asNum) && asNum > 0) {
      return asNum < 1e12 ? asNum * 1000 : asNum
    }
    const asDate = Date.parse(value)
    if (!Number.isNaN(asDate)) return asDate
  }
  if (accessToken) {
    try {
      const base64Url = accessToken.split('.')[1]
      if (!base64Url) return 0
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(window.atob(base64))
      return typeof payload.exp === 'number' ? payload.exp * 1000 : 0
    } catch {
      return 0
    }
  }
  return 0
}

function scheduleRefresh() {
  clearRefreshTimer()
  if (!import.meta.client) return

  const accessTokenExpiry = getAccessTokenExpiry()
  if (!accessTokenExpiry.value) return

  const delay = accessTokenExpiry.value - Date.now() - REFRESH_BEFORE_MS
  refreshTimer = setTimeout(() => {
    handleRefreshToken().catch(() => {})
  }, Math.max(delay, 0))
}

/**
 * 写入 token。多处调用共享同一实现，后写覆盖先写。
 * 值未变化时跳过；仅 expiry 变化时重设定时器，避免重复调用打乱刷新节奏。
 */
export function setToken(payload: TokenPayload) {
  const access_token = getAccessToken()
  const refresh_token = getRefreshToken()
  const accessTokenExpiry = getAccessTokenExpiry()
  const sessionId = getSessionId()
  let expiryChanged = false

  if (payload.access_token != null && payload.access_token !== access_token.value) {
    access_token.value = payload.access_token
    localStorage.setItem('access_token', payload.access_token)
    localStorage.setItem('token', payload.access_token)
  }
  if (payload.refresh_token != null && payload.refresh_token !== refresh_token.value) {
    refresh_token.value = payload.refresh_token
    localStorage.setItem('refresh_token', payload.refresh_token)
  }
  if (payload.sessionId != null && payload.sessionId !== sessionId.value) {
    sessionId.value = payload.sessionId
    localStorage.setItem('sessionId', payload.sessionId)
  }

  // 显式传了 expiry，或本次带了新 access_token（可从 JWT 解析）时才更新
  const shouldResolveExpiry =
    payload.accessTokenExpiry != null || payload.access_token != null
  if (shouldResolveExpiry) {
    const expiry = toExpiryMs(
      payload.accessTokenExpiry,
      payload.access_token || access_token.value
    )
    if (expiry && expiry !== accessTokenExpiry.value) {
      accessTokenExpiry.value = expiry
      localStorage.setItem('accessTokenExpiry', String(expiry))
      expiryChanged = true
    }
  }

  if (expiryChanged) scheduleRefresh()
}

/**
 * 刷新 token。定时器 / 401 / 业务代码多处调用时，
 * 并发共用同一个 Promise，只会请求一次。
 */
export async function handleRefreshToken() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refresh_token = getRefreshToken()
    const currentRefresh =
      refresh_token.value || localStorage.getItem('refresh_token') || ''
    if (!currentRefresh) throw new Error('no refresh token')

    const res: any = await gatewayApi.auth.postAuthRefresh({
      refreshToken: currentRefresh
    })
    const tokens = res?.data ?? res
    const nextAccess = (tokens?.access_token || tokens?.accessToken) as string | undefined
    if (!nextAccess) throw new Error('refresh token response is null')

    setToken({
      access_token: nextAccess,
      refresh_token: tokens?.refresh_token || tokens?.refreshToken,
      sessionId: tokens?.sessionId || tokens?.session_id,
      accessTokenExpiry:
        tokens?.accessTokenExpiry || tokens?.expiresAt || tokens?.expires_at
    })
    return nextAccess
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

function hydrateFromStorage() {
  if (!import.meta.client || hydrated) return
  hydrated = true

  const access_token = getAccessToken()
  if (access_token.value) {
    if (getAccessTokenExpiry().value) scheduleRefresh()
    return
  }

  const storedAccess = localStorage.getItem('access_token') || ''
  if (!storedAccess) return

  access_token.value = storedAccess
  getRefreshToken().value = localStorage.getItem('refresh_token') || ''
  getSessionId().value = localStorage.getItem('sessionId') || ''
  getAccessTokenExpiry().value = toExpiryMs(
    localStorage.getItem('accessTokenExpiry') || undefined,
    storedAccess
  )
  if (getAccessTokenExpiry().value) scheduleRefresh()
}

/**
 * 一次创建、多处调用的 token 状态。
 * handleRefreshToken / setToken 为模块单例，并发刷新只执行一次。
 */
export function useToken() {
  const access_token = getAccessToken()
  const refresh_token = getRefreshToken()
  const accessTokenExpiry = getAccessTokenExpiry()
  const sessionId = getSessionId()

  hydrateFromStorage()

  return {
    access_token,
    refresh_token,
    accessTokenExpiry,
    sessionId,
    handleRefreshToken,
    setToken
  }
}
