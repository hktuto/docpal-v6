<template>
  <el-card>
    <div class="flex-x-start">
      <h3 class="el-icon--left">{{ $t('adminMenu.whatsApps') }}</h3>
      <el-switch v-model="state.setting.whatsAppSetting.whatsAppSwitch" :loading="state.switchLoading"
                 @change="handleSwitchChange"></el-switch>
    </div>
    <el-form ref="formRef" label-position="top" :model="form">
      <el-form-item :label="$t('config.accessToken')">
        <el-input clearable v-model="form.accessToken" :placeholder="$t('config.accessTokenTip')"></el-input>
      </el-form-item>
      <el-form-item :label="$t('config.phoneNum')">
        <el-input clearable v-model="form.phoneNum" :placeholder="$t('config.phoneNumbTip')"></el-input>
      </el-form-item>
      <el-form-item :label="$t('config.accountNum')">
        <el-input clearable v-model="form.accountNum" :placeholder="$t('config.accountNumberTip')"></el-input>
      </el-form-item>
    </el-form>
    <div>
      <el-button id="ExternalConnection__WhatsApps__TestConnection" :loading="state.testLoading" type="info"
                 @click="handleTestConnection">
        {{ $t('config.testConnection') }}
      </el-button>
      <el-button id="ExternalConnection__WhatsApps__Save" :loading="state.saveLoading" type="primary"
                 @click="handleSave">
        {{ $t('common_save') }}
      </el-button>
    </div>
    <h3>{{ $t('config.statusMonitor') }}</h3>
    <div class="config-status-monitor">
      <div class="config-status-monitor-item">
        <div class="config-status-monitor-item-title">{{ $t('config.responseTime') }}</div>
        <el-text size="large">{{ state.setting.responseTime }}</el-text>
      </div>
      <div class="config-status-monitor-item">
        <div class="config-status-monitor-item-title">{{ $t('config.uptime') }}</div>
        <el-text size="large">{{ state.setting.successPercent }}</el-text>
      </div>
      <div class="config-status-monitor-item">
        <div class="config-status-monitor-item-title">{{ $t('config.status') }}</div>
        <el-text type="success" size="large" v-if="state.setting.status === 'Online'">
          {{ state.setting.status }}
        </el-text>
        <el-text type="danger" size="large" v-else>
          {{ state.setting.status }}
        </el-text>
      </div>
    </div>
    <h3>{{ $t('config.errorLog') }}</h3>
    <div style="height: 50vh;overflow: hidden;">
      <WhatappsLog />
    </div>
  </el-card>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const state = reactive<any>({
  setting: {
    whatsAppSetting: {
      whatsAppSwitch: false
    }
  },
  testLoading: false,
  saveLoading: false,
  switchLoading: false
})
const form = ref({
  accessToken: '',
  accountNum: '',
  phoneNum: ''

})
const formRef = ref()

async function handleSwitchChange(val) {
  // state.setting.whatsAppSetting.whatsAppSwitch = val
  try {
    state.switchLoading = true
    const res = await newAdminApi.putExt3rdmessageWhatsappSettings({
      whatsAppSwitch: val,
      accessToken: state.setting.whatsAppSetting.accessToken,
      phoneNum: form.value.phoneNum,
      accountNum: form.value.accountNum
    }).then(res => res.data)
    if (!!res) {
      routerProvider?.message.success(t('dpMsg_success'))
    }
  } catch (error) {
  } finally {
    setTimeout(() => state.switchLoading = false, 500)
  }
}

async function handleSave(val) {
  // state.setting.whatsAppSetting.whatsAppSwitch = val
  try {
    state.saveLoading = true
    try {
      await formRef.value.validate()
    } catch (e) {
      console.error(e)
      return
    }
    const res = await newAdminApi.putExt3rdmessageWhatsappSettings({
      whatsAppSwitch: state.setting.whatsAppSetting.whatsAppSwitch,
      accessToken: form.value.accessToken,
      phoneNum: form.value.phoneNum,
      accountNum: form.value.accountNum
    }).then(res => res.data)
    if (!!res) {
      routerProvider?.message.success(t('dpMsg_success'))
    }
  } catch (error) {
  } finally {
    setTimeout(() => state.saveLoading = false, 500)
  }
}

async function handleTestConnection() {
  try {
    state.testLoading = true
    const res = await newAdminApi.getExt3rdmessageWhatsappConnectionStatus().then(res => res.data)
    if (res === 'Online') {
      routerProvider?.message.success(res)
    } else {
      routerProvider?.message.error(res)
    }
  } catch (error) {
    routerProvider?.message.error(error)
  } finally {
    setTimeout(() => state.testLoading = false, 500)
  }
}

onMounted(async () => {
  state.setting = await newAdminApi.postExt3rdmessageWhatsappOverview({}).then(res => res.data)
  form.value.accessToken = state.setting.whatsAppSetting.accessToken
  form.value.phoneNum = state.setting.whatsAppSetting.phoneNum || ''
  form.value.accountNum = state.setting.whatsAppSetting.accountNum || ''
})
</script>
<style lang="scss" scoped>
.config-status-monitor {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background-color: var(--app-grey-900);
  border-radius: var(--el-border-radius-base);
  padding: var(--app-space-xs);
  gap: var(--app-space-xs);

  &-item {
    background-color: var(--app-grey-800);
    padding: var(--app-space-xs);
    border-radius: var(--el-border-radius-base);

    &-title {
      font-size: var(--el-font-size-base);
      color: var(--el-text-color-secondary);
    }

    .el-text {
      font-weight: bold;
      padding: var(--app-space-xs) 0;
      display: block;
    }
  }
}
</style>
