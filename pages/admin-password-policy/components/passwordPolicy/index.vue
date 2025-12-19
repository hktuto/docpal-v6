<template>
  <el-card>
    <h2>{{ $t('adminMenu.passwordPolicy') }}</h2>
    <el-form label-width="180px" :model="form" label-position="top" class="password-policy-form">
      <div>
        <el-form-item :label="$t('passwordPolicy.length')">
          <el-input-number id="SystemSetting__PasswordPolicy__MinimumPasswordLength" v-model="form.minPasswordLength"
                           :disabled="loading" :precision="0" :min="8" :max="24" @change="handleSave" />
        </el-form-item>
        <PasswordPolicySwitch
          id="SystemSetting__PasswordPolicy__LowerAndUppercase"
          :label="$t('passwordPolicy.lowerUpper')"
          v-model:value="form.containLowerAndUppercase"
          :description="$t('passwordPolicy.lowerUpperDesc')"
          :disabled="loading"
          @change="handleSave"
        />
        <PasswordPolicySwitch
          id="SystemSetting__PasswordPolicy__NumericDigits"
          :label="$t('passwordPolicy.digit')"
          v-model:value="form.containNumericDigits"
          :description="$t('passwordPolicy.digitDesc')"
          :disabled="loading"
          @change="handleSave"
        />
        <PasswordPolicySwitch
          id="SystemSetting__PasswordPolicy__SpecialCharacters"
          :label="$t('passwordPolicy.special')"
          v-model:value="form.containSpecialCharacters"
          :description="$t('passwordPolicy.specialDesc', {char: '[ !,@,#,$,%,&,* ]'})"
          :disabled="loading"
          @change="handleSave"
        />
        <PasswordPolicySwitch
          id="SystemSetting__PasswordPolicy__ForceFirstPasswordReset"
          :label="$t('passwordPolicy.forceReset')"
          v-model:value="form.forceResetPassword"
          :description="$t('passwordPolicy.forceResetDesc')"
          :disabled="loading"
          @change="handleSave"
        />
      </div>
      <el-divider direction="vertical" />
      <div>
        <PasswordPolicySwitch
          id="SystemSetting__PasswordPolicy__EnableExpirationTime"
          :label="$t('passwordPolicy.expireEnable')"
          v-model:value="form.enableExpirationTime"
          :description="$t('passwordPolicy.expireEnableDesc')"
          :disabled="loading"
          @change="handleSave"
        />
        <el-form-item :label="$t('passwordPolicy.expireDay')" v-if="form.enableExpirationTime">
          <el-input-number id="SystemSetting__PasswordPolicy__EnableExpirationTime__ExpirationPeriod"
                           v-model="form.expirationDay" :disabled="loading" :precision="0" :min="1" :max="2147483647"
                           @change="handleSave" />
        </el-form-item>
        <el-divider />
        <PasswordPolicySwitch
          id="SystemSetting__PasswordPolicy__LockoutPolicy"
          :label="$t('passwordPolicy.lockEnable')"
          v-model:value="form.enableLockoutPolicy"
          :description="$t('passwordPolicy.lockEnableDesc')"
          :disabled="loading"
          @change="handleSave"
        />

        <template v-if="form.enableLockoutPolicy">
          <el-form-item :label="$t('passwordPolicy.retryPeriod')">
            <el-input-number id="SystemSetting__PasswordPolicy__LockoutPolicy__RetryPeriod" v-model="form.retryPeriod"
                             :disabled="loading" :precision="0" :min="1" :max="255" @change="handleSave" />
          </el-form-item>
          <el-form-item :label="$t('passwordPolicy.lockPeriod')">
            <el-input-number id="SystemSetting__PasswordPolicy__LockoutPolicy__LockPeriod" v-model="form.lockoutPeriod"
                             :disabled="loading" :precision="0" :min="1" :max="2147483647"
                             @change="handleSave" />
          </el-form-item>
          <el-form-item :label="$t('passwordPolicy.lockCount')">
            <el-input-number id="SystemSetting__PasswordPolicy__LockoutPolicy__LockCount" v-model="form.lockoutCount"
                             :disabled="loading" :precision="0" :min="1" :max="255" @change="handleSave" />
          </el-form-item>
          <el-tag type="warning">
            {{
              $t('passwordPolicy.lockPolicy', {
                minute: form.retryPeriod,
                count: form.lockoutCount,
                lock: form.lockoutPeriod
              })
            }}
          </el-tag>
        </template>
        <el-divider />
        <PasswordPolicySwitch
          id="SystemSetting__PasswordPolicy__EnablePasswordReuseRestriction"
          :label="$t('passwordPolicy.reuseEnable')"
          :disabled="loading"
          v-model:value="form.enableReusePasswordLimit"
          :description="$t('passwordPolicy.reuseEnableDesc')"
          @change="handleSave"
        />
        <el-form-item :label="$t('passwordPolicy.reuseCount')" v-if="form.enableReusePasswordLimit">
          <el-input-number id="SystemSetting__PasswordPolicy__EnablePasswordReuseRestriction__ReuseLockCount"
                           v-model="form.reusePasswordCount" :disabled="loading" :precision="0" :min="1" :max="10"
                           @change="handleSave" />
        </el-form-item>
      </div>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from 'api'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const loading = ref(false)

const form = ref({
  minPasswordLength: 12,
  containLowerAndUppercase: false,
  containNumericDigits: false,
  containSpecialCharacters: false,
  forceResetPassword: false,
  enableExpirationTime: false,
  expirationDay: 60,
  enableLockoutPolicy: false,
  retryPeriod: 4,
  lockoutPeriod: 15,
  lockoutCount: 5,
  enableReusePasswordLimit: false,
  reusePasswordCount: 5
})

// 加载密码策略配置
async function init() {
  try {

    loading.value = true
    const response = await adminApi.api.getPasswordConfig()
    if (response.data) {
      const policyData = response.data
      // 更新表单数据
      Object.assign(form.value, {
        minPasswordLength: policyData.minPasswordLength || 12,
        containLowerAndUppercase: policyData.containLowerAndUppercase !== false,
        containNumericDigits: policyData.containNumericDigits !== false,
        containSpecialCharacters: policyData.containSpecialCharacters === true,
        forceResetPassword: policyData.forceResetPassword === true,
        enableExpirationTime: policyData.enableExpirationTime === true,
        expirationDay: policyData.expirationDay || 60,
        enableLockoutPolicy: policyData.enableLockoutPolicy === true,
        retryPeriod: policyData.retryPeriod || 4,
        lockoutPeriod: policyData.lockoutPeriod || 15,
        lockoutCount: policyData.lockoutCount || 5,
        enableReusePasswordLimit: policyData.enableReusePasswordLimit === true,
        reusePasswordCount: policyData.reusePasswordCount || 5
      })
    }
  } catch (error) {
    console.error('加载密码策略失败:', error)
    ElMessage.error(t('passwordPolicy.loadError'))
  } finally {
    loading.value = false
  }
}

// 保存密码策略配置
async function handleSave() {
  try {
    loading.value = true

    // 准备保存的数据
    const policyData = {
      ...form.value,
      // 确保布尔值正确传递
      containLowerAndUppercase: form.value.containLowerAndUppercase,
      containNumericDigits: form.value.containNumericDigits,
      containSpecialCharacters: form.value.containSpecialCharacters,
      forceResetPassword: form.value.forceResetPassword,
      enableExpirationTime: form.value.enableExpirationTime,
      enableLockoutPolicy: form.value.enableLockoutPolicy,
      enableReusePasswordLimit: form.value.enableReusePasswordLimit
    }

    // 调用API保存配置
    await adminApi.api.postPasswordSaveConfig(policyData)

    ElMessage.success(t('passwordPolicy.saveSuccess'))
  } catch (error) {
    console.error('保存密码策略失败:', error)
    ElMessage.error(t('passwordPolicy.saveError'))
  } finally {
    setTimeout(() => {
      loading.value = false
    }, 300)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  init()
})
</script>

<style scoped>
.password-policy-form .desc {
  margin-left: 12px;
  color: #888;
  font-size: 13px;
}

.password-policy-form {
  display: grid;
  grid-template-columns: 1fr min-content 1fr;
  gap: 3rem;
}

.el-divider--vertical {
  height: 100%;
}

:deep(.el-card__body) {
  padding: var(--app-space-m);
}
</style>
