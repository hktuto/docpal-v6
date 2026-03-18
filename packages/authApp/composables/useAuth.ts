import { useState, createError } from '#imports'
import { EventType, emitBus } from 'eventbus'
import { newClientApi, globalApi } from 'api'
import type Keycloak from 'keycloak-js'

import type { UserDTO } from 'api/src/generate/client'

export const useDesktopMode = () => useState<boolean>('is-desktop')
export const useUserState = () => useState<UserDTO | null>('auth-user')

export const usePublicPageState = () => useState<string[]>('auth-public-page', () => ['/forgetPassword', '/forgetPassword/', '/resetPassword/', '/resetPassword', '/login/', '/login', '/initPassword/', '/initPassword'])
export const useLoginHook = () => useState<any>(() => shallowRef([]))

export const useUserId = () => useState<string>(() => '')
export const useUserPreference = () => useState<Record<string, any>>()
export const useFeature = () => useState<Record<string, boolean>>('app-feature')
export const useToken = () => useState<string>('auth-token')
export const useOcrSetting = () => useState<any>('ocr-setting')
export const useLoginState = () => useState<boolean>('auth-login-state', () => false)
export const useUserRole = () => useState<string>(() => '')
export const useIsAdmin = () => useState<boolean>(() => false)
export const useIsSuperAdmin = () => useState<boolean>(() => true)
export const useIsMac = () => useState<boolean>(() => false)

export const useAuth = () => {
  const loggedIn = useLoginState()
  return {
    loggedIn,
    logout,
    login,
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
  const token = localStorage.getItem('access_token') || ''
  const decodedToken = parseJwt(token)
  if (decodedToken && decodedToken.roles) {
    console.log('decodedToken', decodedToken)
    const isAdmin = useIsAdmin()
    const isSuperAdmin = useIsSuperAdmin()
    const hasAdmin = decodedToken.roles.includes('ROLE_ADMIN')
    const hasSuperAdmin = decodedToken.roles.includes('ROLE_SUPER')
    isAdmin.value = hasAdmin
    isSuperAdmin.value = hasSuperAdmin
  }
  // check if user in in db
  const userId = useUserId()
  const user = useUserState()

  const {
    create,
    findOne,
    deleteTable
  } = useSqliteTable({
    schema: {
      name: 'auth_user',
      columns: [
        {
          name: 'id',
          type: 'TEXT',
          primaryKey: true
        },
        {
          name: 'username',
          type: 'TEXT',
          primaryKey: false
        }
      ]
    }
  })
  try {
    console.log('user in db', userId.value)
    await findOne({
      id: userId.value
    })
  } catch (err) {
    console.log('user not in db')
    await deleteTable('docpal_documents')
    await create({
      id: userId.value,
      username: user.value.username
    })
  }
  emitBus(EventType.USER_LOGIN__SUCCESS, '')
}

/**
 *  從 keycloak 拿回用戶 token, 放到 localStorage,
 *  登陸後先  {@link useFeature}
 *  再
 */

function parseJwt(token: string) {
  if (!token) {
    return
  }
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(window.atob(base64))
}

export async function login() {
  // const keyCloakState = useKeyCloakState()


  // check route is superAdmin
  try {
    // get access token from local storage
    const storageToken = localStorage.getItem('access_token')
    console.log('useAuth', storageToken)
    if (!storageToken) {
      throw new Error('access token not found')
    }
    const token = useToken()
    token.value = storageToken
    await verifly()
    await checkPassword()

  } catch (error) {
    console.log('login error', error)
    logout()
  }
}

async function checkPassword() {
  // let result = {
  //   accountExpire: false,
  //   firstLoginForceResetPassword: true
  // }
  try {
    const data = await newClientApi.getUcenterPasswordUserStatus().then(r => r.data)
    console.log(data)
    if (data?.firstLoginForceResetPassword || data?.accountExpire) {
      const router = useRouter()
      router.push('/resetPassword')
    }
  } catch (error) {
  }
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
  router.push({
    path: '/login',
    query: {
      ...route.query,
      redirect: ignoreRedirectPath.includes(route.path) ? '/' : route.path
    }
  })
  // clean up local storage

  localStorage.clear()
  logedIn.value = false

}

/**
 *  從Backend 拿回當前環境有的 feature, 并存到 `useFeature` 裡
 */
async function getFeature() {
  const features = useFeature()
  const data = await globalApi.getDmsFeatureGetfeatures().then(r => r.data)
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
  const data = await newClientApi.getDmsUserSetting().then(r => r.data)
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
  const data: any = await newClientApi.getDmsUserGetapplication().then(r => r.data)
  if (!data) {
    throw new Error('Get Application Is Null')
  }
  userId.value = data.userId
  userRole.value = data.aclUserDetail?.roleId
  localStorage.setItem('docpal-user', JSON.stringify(data))
  if (!data) throw new Error('Get user info fail')
  user.value = data
}
