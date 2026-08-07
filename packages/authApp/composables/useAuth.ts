import { useState } from '#imports'
import { EventType, emitBus } from 'eventbus'
import { newClientApi, globalApi, gatewayApi } from 'api'

import type { UserDTO } from 'api/src/generate/client'

export const useDesktopMode = () => useState<boolean>('is-desktop')
export const useUserState = () => useState<UserDTO | null>('auth-user')

export const usePublicPageState = () =>
  useState<string[]>('auth-public-page', () => [
    '/forgetPassword',
    '/forgetPassword/',
    '/resetPassword/',
    '/resetPassword',
    '/login/',
    '/login',
    '/initPassword/',
    '/initPassword',
  ])
export const useLoginHook = () => useState<any>(() => shallowRef([]))

export const useUserId = () => useState<string>(() => '')
export const useUserPreference = () => useState<Record<string, any>>()
export const useFeature = () => useState<Record<string, boolean>>('app-feature')
export const useOcrSetting = () => useState<any>('ocr-setting')
export const useLoginState = () => useState<boolean>('auth-login-state', () => false)
export const useUserRole = () => useState<string>('auth-user-role', () => '')
export const useIsAdmin = () => useState<boolean>('auth-is-admin', () => false)
export const useIsSuperAdmin = () => useState<boolean>('auth-is-super-admin', () => true)
export const useIsMac = () => useState<boolean>('auth-is-mac', () => false)

export type LoginWithPasswordResult =
  | { ok: true; passwordResetRequired?: boolean }
  | { ok: false; reason: 'locked' | 'invalid'; message: string }

export const useAuth = () => {
  const loggedIn = useLoginState()
  return {
    loggedIn,
    logout,
    loginWithPassword,
    silentLogin,
    verifly
  }
}

export const userDisplayTimeSetting = () => {
  const userPreference = useUserPreference()
  return userPreference.value?.metaDateFormat ? userPreference.value.metaDateFormat : 'YYYY-MM-DD'
}

export async function verifly() {
  const logedIn = useLoginState()
  const isDesktopMode = useDesktopMode()
  const isMac = useIsMac()
  const { initializeTheme } = useStyle()
  await Promise.all([getUser(), getFeature(), getUserPreference(), getOCRSetting(), initializeTheme()])
  isDesktopMode.value = !(!window || !window.navigator || !window.navigator.userAgent || !window.navigator.userAgent.toLowerCase().includes('electron'))
  isMac.value = window.navigator.userAgent.toLowerCase().includes('apple')
  logedIn.value = true
  const { access_token } = useToken()
  const decodedToken = parseJwt(access_token.value || localStorage.getItem('access_token') || '')

  if (decodedToken && decodedToken.roles) {
    const isAdmin = useIsAdmin()
    const isSuperAdmin = useIsSuperAdmin()
    const hasAdmin = decodedToken.roles.includes('ROLE_ADMIN')
    const hasSuperAdmin = decodedToken.roles.includes('ROLE_SUPER')
    isAdmin.value = hasAdmin || hasSuperAdmin
    isSuperAdmin.value = hasSuperAdmin
  }

  emitBus(EventType.USER_LOGIN__SUCCESS, '')
}

function parseJwt(token: string) {
  if (!token) {
    return
  }
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(window.atob(base64))
}

/** 账号密码登录：登录 API → setToken → verifly → checkPassword */
export async function loginWithPassword(
  username: string,
  password: string
): Promise<LoginWithPasswordResult> {
  try {
    const data = await gatewayApi.auth
      .postAuthLogin({
        username,
        password,
        serviceId: 'docpal',
        rememberMe: true
      })
      .then((res) => res.data)

    useToken().setToken({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      sessionId: data.sessionId,
      accessTokenExpiry: data.accessTokenExpiry || data.expiresAt || data.expires_at
    })
    await verifly()
    const passwordResetRequired = await checkPassword()
    return { ok: true, passwordResetRequired }
  } catch (error) {
    return {
      ok: false,
      reason: 'invalid',
      message: 'Username or password is incorrect'
    }
  }
}

/** 已有 token 时恢复会话（plugin / 刷新后） */
export async function silentLogin() {
  try {
    const storageToken = localStorage.getItem('access_token')
    if (!storageToken) {
      throw new Error('access token not found')
    }
    useToken().setToken({
      access_token: storageToken,
      refresh_token: localStorage.getItem('refresh_token') || undefined,
      sessionId: localStorage.getItem('sessionId') || undefined,
      accessTokenExpiry: localStorage.getItem('accessTokenExpiry') || undefined
    })
    await verifly()
    await checkPassword()
  } catch (error) {
    console.log('silentLogin error', error)
    logout()
  }
}

async function checkPassword() {
  const userId = useUserId().value
  if (userId === 'Administrator' || userId === 'administrator') {
    return false
  }
  try {
    const data = await gatewayApi.password.getPasswordStatus().then((r) => r.data)
    if (data?.mustResetPassword || data?.isExpired) {
      const router = useRouter()
      await router.push('/resetPassword')
      return true
    }
  } catch (error) {}
  return false
}

export function getOCRSetting() {
  const ocrSetting = useOcrSetting()
  ocrSetting.value = newClientApi.getDmsSettingSystem('OCR').then((res) => res.data)
}

export function canOCR(extension: string): boolean {
  if (!allowFeature('OCR')) return false
  const ocrSetting = useOcrSetting()
  return ocrSetting.value.supportedInputFormats.includes(extension)
}

export function logout() {
  const logedIn = useLoginState()
  const userState = useUserState()
  const router = useRouter()
  const route = useRoute()
  const ignoreRedirectPath = ['/login', '/forgetPassword', '/resetPassword', '/initPassword', '/admin']

  useToken().clearToken()
  userState.value = null
  logedIn.value = false
  localStorage.clear()

  router.push({
    path: '/login',
    query: {
      ...route.query,
      redirect: ignoreRedirectPath.includes(route.path) ? '/' : route.path
    }
  })
}

/**
 *  從Backend 拿回當前環境有的 feature, 并存到 `useFeature` 裡
 */
async function getFeature() {
  const features = useFeature()
  const data = await globalApi.getDmsFeatureGetfeatures().then((r) => r.data)
  if (!data) throw new Error('get license feature error')
  features.value = data
}

/**
 *
 * @param requireFeatures  string | string[] // 單個或多個需要的 Feature
 * @returns boolean
 */
export function checkLicenseFeatures(requireFeatures: string[] | string) {
  const features = useFeature()
  if (!features.value) return true
  if (typeof requireFeatures === 'string') return features.value[requireFeatures]
  let result = false
  if (Array.isArray(requireFeatures)) {
    requireFeatures.forEach((item) => {
      if (features.value[item]) result = true
    })
  }
  return result
}

const colorModeOption = [
  {
    id: '1',
    value: 'system',
    name: 'System'
  },
  {
    id: '2',
    value: 'light',
    name: 'Light'
  },
  {
    id: '3',
    value: 'dark',
    name: 'Dark'
  }
]
const uiSize = [
  {
    label: 'small',
    value: '14px'
  },
  {
    label: 'normal',
    value: '18px'
  },
  {
    label: 'large',
    value: '20px'
  }
]

/**
 *  從後台拿回 user 的 setting, 包括文字大小，color mode ...
 */
export async function getUserPreference() {
  const preference = useUserPreference()
  const data = await newClientApi.getDmsUserSetting().then((r) => r.data)
  if (!data) {
    throw new Error('get user preference fail')
  }
  const userSetting = JSON.parse(data) || {}
  // normalize user preference , user may be come from old version
  userSetting.size ||= '14px'
  userSetting.color ||= 'light'
  userSetting.language ||= 'en-US'
  // normalize uploadFileMaxSize
  if (userSetting.uploadFileMaxSize && typeof userSetting.uploadFileMaxSize === 'string') {
    userSetting.uploadFileMaxSize = Number(userSetting.uploadFileMaxSize.replace('M', '').replace('G', ''))
  }
  // normalize userSetting
  if (userSetting.userSetting) {
    delete userSetting.userSetting
  }
  preference.value = Object.assign(
    {
      size: '14px',
      folderView: 'tree',
      language: 'en-US',
      color: 'light',
      tableSettings: {},
      uploadFileMaxSize: 1200
    },
    userSetting
  )
  const htmlElement = document.querySelector('html')
  if (htmlElement) {
    htmlElement.style.fontSize = preference.value.size
  }
  // normalize language, check if perference language is one of 'en-US' | "zh-HK' | 'zh-CN'
  const allLang = ['en-US', 'zh-HK', 'zh-CN']
  if (!allLang.includes(preference.value.language)) {
    preference.value.language = 'en-US'
  }

  if (preference.value.metaDateFormat) {
    // emit time format change
    const timeBus = useEventBus<string>(EventType.USER_PREFERENCE_CHANGE__TIME)
    timeBus.emit(preference.value.metaDateFormat)
  }
}

async function getUser() {
  const user = useUserState()
  const userId = useUserId()
  const userRole = useUserRole()
  const data: any = await gatewayApi.users.getUsersApplication().then((r) => r.data)
  if (!data) {
    throw new Error('Get Application Is Null')
  }
  userId.value = data.userId
  userRole.value = data.aclUserDetail?.roleId
  localStorage.setItem('docpal-user', JSON.stringify(data))
  if (!data) throw new Error('Get user info fail')
  user.value = data
}
