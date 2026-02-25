<template>
  <el-dialog v-model="state.visible" :title="$t('user_editPassword')" :close-on-click-modal="false">
    <el-form ref="formRef" :model="form" label-position="top" :rules="rules">
      <el-form-item :label="t('user_password')" prop="password" required>
        <el-input v-model="form.password" type="password" show-password />
      </el-form-item>
      <el-form-item :label="t('dpForm_confrimPassword')" prop="confirmPassword" required>
        <el-input v-model="form.confirmPassword" type="password" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button id="UserList__Info__ChangePassword__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { userProviderDetailKey } from '~/util/userProvider'
import { ElMessage } from 'element-plus'
import { newAdminApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const userProviderDetail = inject(userProviderDetailKey)

const props = defineProps<{
  user: object,
}>()
const emits = defineEmits([
  'refresh'
])
const state = reactive({
  loading: false,
  visible: false
})
const formRef = ref()
const form = reactive({
  password: '',
  confirmPassword: ''
})
const passwordPolicy = ref<{
  minPasswordLength?: number,
  containLowerAndUppercase: boolean,
  containNumericDigits: boolean,
  containSpecialCharacters: boolean
}>({
  minPasswordLength: 8,
  containLowerAndUppercase: false,
  containNumericDigits: false,
  containSpecialCharacters: false
})
const rules = ref({
  password: [
    { required: true, message: t('render.hint.fieldRequired', { name: t('user_password') }), trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: t('render.hint.fieldRequired', { name: t('dpForm_confrimPassword') }), trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
})

function validatePassword(rule: any, value: any, callback: any) {
  if (!value) {
    callback()
    return
  }

  // 检查最小长度
  const minLength = passwordPolicy.value.minPasswordLength || 8
  if (value.length < minLength) {
    callback(new Error(`${t('passwordPolicy.length')}: ${minLength}`))
    return
  }

  // 检查是否包含大小写字母
  if (passwordPolicy.value.containLowerAndUppercase) {
    if (!/^(?=.*[a-z])(?=.*[A-Z]).*$/.test(value)) {
      callback(new Error(t('passwordPolicy.containLowerAndUppercase')))
      return
    }
  }

  // 检查是否包含数字
  if (passwordPolicy.value.containNumericDigits) {
    if (!/.*[0-9].*/.test(value)) {
      callback(new Error(t('passwordPolicy.containNumericDigits')))
      return
    }
  }

  // 检查是否包含特殊字符（只允许 !@#$%^&*()-+=[]{}:;'",.<>\|）
  if (passwordPolicy.value.containSpecialCharacters) {
    if (!/^(?=.*[!@#$%^&*()\-+=\[\]{}:;'",.<>/\\|]).+$/.test(value)) {
      callback(new Error(t('passwordPolicy.containSpecialCharacters')))
      return
    }
  }
  callback()
}

function validateConfirmPassword(rule: any, value: any, callback: any) {
  if (!value) {
    callback()
    return
  }

  if (value !== form.password) {
    callback(new Error(t('tip.inputUserPasswordMatch')))
    return
  }

  callback()
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    state.loading = true
    const param = {
      password: form.password,
      userId: props.user.userId
    }
    await userProviderDetail?.PatchUserPasswordApi(param)
    ElMessage.success(t('tip_updateMsg', {
      modelName: t('user_userPassword'),
      name: param.userId
    }))
    state.visible = false
    formRef.value.resetFields()
    form.password = ''
    form.confirmPassword = ''
    emits('refresh')
  } catch (error) {
    console.log(error)
    return
  } finally {
    state.loading = false
  }
}

async function getPasswordPolicy() {
  const response = await newAdminApi.getUcenterPasswordConfig().then(r => r.data)
  if (!response) {
    routerProvider?.message.error(t('Password policy rules not found'))
    state.visible = false
    return
  }

  passwordPolicy.value = {
    minPasswordLength: response.minPasswordLength || 8,
    containLowerAndUppercase: response.containLowerAndUppercase || false,
    containNumericDigits: response.containNumericDigits || false,
    containSpecialCharacters: response.containSpecialCharacters || false
  }
}

async function handleOpen() {
  await getPasswordPolicy()
  state.visible = true
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>

</style>
