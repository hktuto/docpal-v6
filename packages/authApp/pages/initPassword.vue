<template>
  <AppPublic>
    <div class="LoginContainer" v-loading="!ready">
      <LoadingBg></LoadingBg>
      <el-form v-if="ready" ref="formRef" :model="form" :rules="rules" label-position="top" class="reset-password-form">
        <AppBigLogo class="logo" mode="withName" />
        <div class="title">{{ $t('passwordPolicy.updatePassword') }}</div>
        <div class="tip" v-if="passwordPolicy.expirationDay">
          {{
            $t('passwordPolicy.expirationDayTip', {
              day: passwordPolicy.expirationDay
            })
          }}
        </div>
        <el-form-item :label="$t('passwordPolicy.newPassword')" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            :maxlength="128"
            autocomplete="off"
            show-password
            :placeholder="t('render.hint.fieldRequired', { name: t('passwordPolicy.newPassword') })"
          />
        </el-form-item>
        <el-form-item :label="$t('passwordPolicy.confirmPassword')" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            autocomplete="off"
            show-password
            :placeholder="t('render.hint.fieldRequired', { name: t('passwordPolicy.confirmPassword') })"
            @paste.prevent
          />
        </el-form-item>
        <el-button style="width: 100%" type="primary" @click="onSubmit">{{ $t('confirm') }}</el-button>
      </el-form>
    </div>
  </AppPublic>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { newClientApi, gatewayApi } from 'api'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const formRef = ref()
const form = reactive({
  newPassword: '',
  confirmPassword: ''
})
const ready = ref(false)
const passwordPolicy = ref<any>({})
const rules = ref<any>({})
const router = useRouter()

async function getPasswordPolicy() {
  let config: any = {}
  try {
    config = await gatewayApi.password.getPasswordPolicy({
      serviceId: 'docpal'
    }).then((res) => res.data)
  } catch (e) {
    console.error(e)
  }
  passwordPolicy.value = {
    minPasswordLength: 8,
    containLowerAndUppercase: true,
    containNumericDigits: true,
    containSpecialCharacters: true,
    ...config
  }
}

async function onSubmit() {
  try {
    await formRef.value.validate()
    const res = await newClientApi.postUcenterPasswordInitPassword({
      password: form.newPassword
    }).then((res) => res.data)
    if (!!res) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('token')
      ElMessage.success(t('passwordPolicy.updatePasswordSuccess'))

      window.location.href = window.location.origin
      // router.push('/')
    }
  } catch (e) {
    console.error(e)
    return
  }
}

function parseJwt(token: string) {
  if (!token) {
    return
  }
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(window.atob(base64))
}

const route = useRoute()

const id = ref('')
onMounted(async () => {
  const token = route.query.token
  if (!token) {
    ElMessage.error(t('no token provided'))
    router.push({
      path: '/login'
    })
    return
  }
  const decodedToken = parseJwt(token as string)
  if (!decodedToken) {
    ElMessage.error(t('no token provided'))
    router.push({
      path: '/login'
    })
    return
  }

  id.value = decodedToken.userId
  // get user detail from decodedToken
  localStorage.setItem('access_token', token as string)
  localStorage.setItem('token', token as string)
  await getPasswordPolicy()
  // Need to wait for translation 
  rules.value = {
    newPassword: [
      {
        required: true,
        message: t('render.hint.fieldRequired', { name: t('passwordPolicy.newPassword') }),
        trigger: 'blur'
      }
    ],
    confirmPassword: [
      {
        required: true,
        message: t('render.hint.fieldRequired', { name: t('passwordPolicy.confirmPassword') }),
        trigger: 'blur'
      },
      {
        validator: (rule: any, value: string) => value === form.newPassword,
        message: t('tip.inputUserPasswordMatch'),
        trigger: 'blur'
      }
    ]
  }
  if (passwordPolicy.value.containLowerAndUppercase) {
    rules.value.newPassword.push({
      validator: (rule: any, value: string) => {
        return /^(?=.*[a-z])(?=.*[A-Z]).*$/.test(value)
      },
      message: t('passwordPolicy.containLowerAndUppercase'),
      trigger: 'blur'
    })
  }
  if (passwordPolicy.value.containNumericDigits) {
    rules.value.newPassword.push({
      validator: (rule: any, value: string) => {
        return /.*[0-9].*/.test(value)
      },
      message: t('passwordPolicy.containNumericDigits'),
      trigger: 'blur'
    })
  }
  if (passwordPolicy.value.containSpecialCharacters) {
    rules.value.newPassword.push({
      validator: (rule: any, value: string) => {
        return /^(?=.*[!@#$%^&*()\-+=\[\]{}:;'",.<>/\\|]).+$/.test(value)
      },
      message: t('passwordPolicy.containSpecialCharacters'),
      trigger: 'blur'
    })
  }
  ready.value = true
})
</script>

<style scoped>
.logo {
  --icon-size: clamp(100px, 80%, 200px);
  max-width: 200px;
  margin: 0 auto var(--app-space-s) auto;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.tip {
  font-size: 1rem;
  color: var(--app-grey-950);
  margin-bottom: 12px;
}

.reset-password-form {
  width: 400px;
  padding: 32px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.LoginContainer {
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
}
</style>
