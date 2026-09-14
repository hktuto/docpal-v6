import { gatewayApi } from 'api'
import type { ServicePasswordPolicyConfig } from 'api/src/generate/gateway'

const DEFAULT_POLICY: ServicePasswordPolicyConfig = {
  minPasswordLength: 8,
  containLowerAndUppercase: true,
  containNumericDigits: true,
  containSpecialCharacters: true
}

/**
 * 密码策略表单公共逻辑：拉策略、组校验规则、基础表单字段。
 * 提交 / token 场景由各页面自行处理。
 */
export function usePasswordPolicyForm() {
  const { t } = useI18n()

  const form = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const passwordPolicy = ref<ServicePasswordPolicyConfig>({ ...DEFAULT_POLICY })
  const rules = ref<Record<string, any[]>>({})
  const ready = ref(false)

  function buildPasswordRules(options: { requireOldPassword?: boolean } = {}) {
    const nextRules: Record<string, any[]> = {
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
          validator: (_rule: any, value: string) => value === form.newPassword,
          message: t('tip.inputUserPasswordMatch'),
          trigger: 'blur'
        }
      ]
    }

    if (options.requireOldPassword) {
      nextRules.oldPassword = [
        {
          required: true,
          message: t('render.hint.fieldRequired', { name: t('passwordPolicy.oldPassword') }),
          trigger: 'blur'
        }
      ]
    }

    if (passwordPolicy.value.containLowerAndUppercase) {
      nextRules.newPassword.push({
        validator: (_rule: any, value: string) => /^(?=.*[a-z])(?=.*[A-Z]).*$/.test(value),
        message: t('passwordPolicy.containLowerAndUppercase'),
        trigger: 'blur'
      })
    }
    if (passwordPolicy.value.containNumericDigits) {
      nextRules.newPassword.push({
        validator: (_rule: any, value: string) => /.*[0-9].*/.test(value),
        message: t('passwordPolicy.containNumericDigits'),
        trigger: 'blur'
      })
    }
    if (passwordPolicy.value.containSpecialCharacters) {
      nextRules.newPassword.push({
        validator: (_rule: any, value: string) =>
          /^(?=.*[!@#$%^&*()\-+=\[\]{}:;'",.<>/\\|]).+$/.test(value),
        message: t('passwordPolicy.containSpecialCharacters'),
        trigger: 'blur'
      })
    }

    rules.value = nextRules
  }

  async function initPasswordPolicyForm(options: { requireOldPassword?: boolean } = {}) {
    let config: ServicePasswordPolicyConfig = {}
    try {
      config = await gatewayApi.password.getPasswordPolicy().then((res) => res.data ?? {})
    } catch (e) {
      console.error(e)
    }
    passwordPolicy.value = {
      ...DEFAULT_POLICY,
      ...config
    }
    buildPasswordRules(options)
    ready.value = true
  }

  return {
    form,
    passwordPolicy,
    rules,
    ready,
    buildPasswordRules,
    initPasswordPolicyForm
  }
}
