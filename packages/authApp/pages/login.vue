<script lang="ts" setup>
const loading = ref(false)
const form = reactive({
  username: '',
  password: ''
})
const usernameEl = ref()
const errorMessage = ref('')
const systemError = ref('')
const rules = {
  username: [{ required: true, message: 'Please input Username', trigger: 'blur' }],
  password: [{ required: true, message: 'Please input Password', trigger: 'blur' }]
}

const { loginWithPassword } = useAuth()
const router = useRouter()
const route = useRoute()

function resolveRedirectPath() {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect && redirect !== '/login') {
    const query = { ...route.query }
    delete query.redirect
    const qs = Object.keys(query)
      .map((key) => `${key}=${query[key]}`)
      .join('&')
    return qs ? `${redirect}?${qs}` : redirect
  }
  return '/'
}

async function submit() {
  try {
    if (!form.username || !form.password) return
    loading.value = true
    errorMessage.value = ''
    const result = await loginWithPassword(form.username, form.password)
    if (!result.ok) {
      errorMessage.value = result.message
      return
    }
    if (!result.passwordResetRequired) {
      await router.push(resolveRedirectPath())
    }
    form.username = ''
    form.password = ''
  } finally {
    loading.value = false
  }
}

function forgetPassword() {
  router.push('/forgetPassword')
}

const languageReady = ref(false)

async function initLoginPage() {
  try {
    await getLocale()
    languageReady.value = true
    nextTick(() => {
      if (usernameEl.value) usernameEl.value.focus()
    })
  } catch (error) {
    console.log('error to fetch language', error)
    systemError.value = 'Failed to load language'
    throw createError({
      message: 'Failed to load language',
      status: 503,
      fatal: true
    })
  }
}

function handleEnterKey(event: KeyboardEvent) {
  if (event.key !== 'Enter') return
  if (loading.value) return
  event.preventDefault()
  submit()
}

onMounted(() => {
  initLoginPage()
  window.addEventListener('keydown', handleEnterKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEnterKey)
})
</script>

<template>
  <div class="login-page">
    <div v-if="languageReady && !systemError" class="fromContainer card glass">
      <AppBigLogo class="logo" mode="withName" />
      <ElForm :model="form" :rules="rules" label-position="top">
        <ElFormItem label="Username" :rules="rules.username">
          <ElInput ref="usernameEl" v-model="form.username" type="text" />
        </ElFormItem>
        <ElFormItem label="Password" :rules="rules.password">
          <ElInput v-model="form.password" type="password" show-password />
        </ElFormItem>
        <ElFormItem>
          <ElAlert v-if="errorMessage" :title="errorMessage" type="error" />
        </ElFormItem>
      </ElForm>
      <ElButton class="fullSize" size="large" type="primary" @click="submit" :loading="loading">Submit</ElButton>
      <el-button @click="forgetPassword" link>
        {{ $t('login_forgetPassword') }}
      </el-button>
    </div>
    <div v-else>{{ systemError ? systemError : 'loading Language' }}</div>
    <LoadingBg />
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
}

.fromContainer {
  width: clamp(300px, calc(100vw - 4rem), 600px);
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: stretch;
}

.logo {
  --icon-size: clamp(100px, 80%, 200px);
  max-width: 200px;
  margin: 0 auto var(--app-space-s) auto;
}

.card {
  padding: var(--el-component-size-small);
  border-radius: var(--el-border-radius-round);
}
</style>
