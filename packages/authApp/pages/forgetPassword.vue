<template>
  <AppPublic>
    <div class="LoginContainer">
      <LoadingBg></LoadingBg>
      <div class="fromContainer card glass">
        <AppBigLogo class="logo" mode="withName" />
        <template v-if="status === 'submitted'">
          <div class="tip">
            {{ $t('The operation is successful, please go to the mailbox to reset the password') }}
          </div>
        </template>
        <template v-else>
          <el-form label-position="top" ref="FormRef" :status-icon="true" :model="form" @submit.native.prevent>
            <template v-if="status === 'beforeSubmit'">
              <el-form-item
                :label="$t('login_username')"
                prop="userId"
                class="intro"
                :rules="[{ required: true, message: $t('login_username') + $t('render.hint.fieldRequired') }]"
              >
                <el-input v-model="form.userId" type="text" @keyup.enter.native="handleSubmit" />
              </el-form-item>
              <el-button class="fullSize" type="primary" size="large" :block="true" @click="handleSubmit"
                         :loading="loading">
                {{ $t('dpButtom_confirm') }}
              </el-button>
            </template>
          </el-form>
        </template>
        <el-button class="intro" @click="login" text>
          {{ $t('login') }}
        </el-button>
        <div v-if="state.time > 0">
          <h3>{{ $t('dpTip_autoLogin') }}: {{ state.time }}s</h3>
        </div>
      </div>
    </div>
  </AppPublic>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { clientApi } from 'api'

const {
  public: { DEFAULT_PATH }
} = useRuntimeConfig()
const status = ref('beforeSubmit')
const loading = ref(false)
const router = useRouter()
const { t } = useI18n()
const state = reactive<any>({
  time: 0,
  timer: null
})
const form = ref({
  userId: '',
  password: '',
  confirmPassword: ''
})

const FormRef = ref()

// #region module: before submit form
async function handleSubmit() {
  try {
    await FormRef.value.validate()
  } catch (e) {
    console.error(e)
    return
  }

  loading.value = true
  try {
    const data = await clientApi.api.postUcenterPasswordForgetPassword({ userId: form.value.userId }).then(r => r.data)
    if (!!data) status.value = 'submitted'
    ElMessage.success(t('dpMsg_success'))
    returnLogin()
  } catch (error) {
  }
  loading.value = false
}

function returnLogin() {
  if (!!state.timer) clearInterval(state.timer)
  state.time = 5
  state.timer = setInterval(() => {
    state.time--
    if (state.time === 0) {
      clearInterval(state.timer)
      login()
    }
  }, 1000)
}

function login() {
  router.push({
    path: '/login'
  })
}

onMounted(async () => {
  await getLocale()
})
</script>

<style scoped lang="scss">
.LoginContainer {
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--el-component-size-small);
}

.fromContainer {
  min-width: 300px;
  max-width: 600px;
  width: 100%;
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

.tip {
  padding: var(--app-space-xs);
  font-size: 1.2rem;
  text-align: center;
  color: var(--app-grey-950);
}

.card {
  padding: var(--el-component-size-small);
  border-radius: var(--el-border-radius-round);
}

.glass {
  /* From https://css.glass */
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(6.3px);
  -webkit-backdrop-filter: blur(6.3px);
  border: 1px solid rgba(255, 255, 255, 0.31);
}
</style>
