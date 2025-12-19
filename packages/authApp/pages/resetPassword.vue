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
        <el-form-item :label="$t('passwordPolicy.oldPassword')" prop="oldPassword">
          <el-input
            v-model="form.oldPassword"
            type="password"
            autocomplete="off"
            show-password
            :placeholder="t('render.hint.fieldRequired', { name: t('passwordPolicy.oldPassword') })"
          />
        </el-form-item>
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
import { clientApi } from 'api'
import { ElMessage } from 'element-plus'
const { t } = useI18n()
const formRef = ref()
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const ready = ref(false)
const passwordPolicy = ref<any>({})
const rules = ref<any>({})
async function getPasswordPolicy() {
  let config: any = {}
  try {
    config = await clientApi.api.getPasswordConfig().then((res) => res.data)
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
    const res = await clientApi.api
      .patchPasswordUpdatePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      })
      .then((res) => res.data)
    if (!!res) {
      ElMessage.success(t('passwordPolicy.updatePasswordSuccess'))
      const router = useRouter()
      await verifly()
      router.push('/')
    }
  } catch (e) {
    console.error(e)
    return
  }
}
onMounted(async () => {
  await isLocaleFinished()
  await getPasswordPolicy()
  // Need to wait for translation 
  rules.value = {
    oldPassword: [{ required: true, message: t('render.hint.fieldRequired', { name: t('passwordPolicy.oldPassword') }), trigger: 'blur' }],
    newPassword: [
      { required: true, message: t('render.hint.fieldRequired', { name: t('passwordPolicy.newPassword') }), trigger: 'blur' }
      // {
      //   validator: (rule, value) => value === form.oldPassword,
      //   message: t('tip.samePassword'),
      //   trigger: 'blur'
      // }
    ],
    confirmPassword: [
      { required: true, message: t('render.hint.fieldRequired', { name: t('passwordPolicy.confirmPassword') }), trigger: 'blur' },
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
        return /^(?=.*[!@#$%&*]).+$/.test(value)
      },
      message: t('passwordPolicy.containSpecialCharacters'),
      trigger: 'blur'
    })
  }
  ready.value = true
  // formRef.value.resetFields()
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
