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
import { gatewayApi } from 'api'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const formRef = ref()
const router = useRouter()
const route = useRoute()
const tokenRef = ref('')

const { form, passwordPolicy, rules, ready, initPasswordPolicyForm } = usePasswordPolicyForm()

async function onSubmit() {
  try {
    await formRef.value.validate()
    if (!tokenRef.value) {
      ElMessage.error(t('passwordPolicy.noTokenProvided'))
      return
    }
    const res = await gatewayApi.auth
      .postAuthInitPasswordConfirm({
        token: tokenRef.value,
        initPassword: form.newPassword
      })
      .then((res) => res.data)
    if (!!res) {
      ElMessage.success(t('passwordPolicy.updatePasswordSuccess'))
      clearAuthSession()
      router.push({ path: '/login' })
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  const token = route.query.token
  if (!token) {
    ElMessage.error(t('passwordPolicy.noTokenProvided'))
    router.push({ path: '/login' })
    return
  }
  tokenRef.value = token as string
  await initPasswordPolicyForm()
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
