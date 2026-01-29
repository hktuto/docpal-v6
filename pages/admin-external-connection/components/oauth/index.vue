<script lang="ts" setup>
import { clientApi } from 'api'
import formJson from './index.vform.json'
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const FormRendererRef = ref()

function handleFormChange() {}

async function handleGet() {
  const res = await clientApi.admin.getAdmindocpalOauth2Setting().then((res) => res.data)
  FormRendererRef.value.vFormRenderRef.setFormData(res)
}

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    const res = await clientApi.admin.postAdmindocpalOauth2Setting(data)
    if (data.authenticationMethod === 'DEFAULT') {
      routerProvider?.message.success(t('msg_successfullyModified'))
    } else {
      const url: any = res
      window.open(url, '_blank')
    }
  } catch (error: any) {
    console.error(error)
  }
}

// #region module: import
const inputRef = ref()

function uploadXlsx() {
  inputRef.value.click()
}

function handleFile(event) {
  const reader = new FileReader()
  reader.readAsText(event.target.files[0], 'UTF-8')
  reader.onload = function (e: any) {
    try {
      let configJson = JSON.parse(e.target.result as string)
      if (configJson.web) configJson = configJson.web
      if (configJson.installed) configJson = configJson.installed
      const _configJson: any = {
        clientId: configJson.client_id || configJson.clientId,
        clientSecret: configJson.client_secret || configJson.clientSecret,
        redirectUri: configJson.redirectUri || configJson.redirect_uris[0],
        authenticationMethod: configJson.tenantId ? 'MICROSOFT_OFFICE_365' : 'GOOGLE'
      }
      if (configJson.senderAddress) _configJson.senderAddress = configJson.senderAddress
      if (configJson.tenantId) _configJson.tenantId = configJson.tenantId
      FormRendererRef.value.vFormRenderRef.setFormData(_configJson)
    } catch (error) {
      routerProvider?.message.error('file format error')
    }
  }
}

// #endregion
onMounted(() => {
  nextTick(async () => {
    FormRendererRef.value.vFormRenderRef.setFormJson(formJson)
    await handleGet()
  })
})
</script>
<template>
  <el-card>
    <div class="flex-x-between">
      <h3>{{ $t('adminMenu.oauth') }}</h3>
      <div class="flex-x-end">
        <el-button id="ExternalConnection__Oauth__Import" @click="uploadXlsx">
          {{ $t('import') }}
        </el-button>
        <el-button id="ExternalConnection__Oauth__Save" type="primary" @click="handleSubmit">
          {{ $t('dpTool_save') }}
        </el-button>
      </div>
    </div>
    <FormRenderer ref="FormRendererRef" :form-json="formJson" @formChange="handleFormChange" />
    <input v-show="false" ref="inputRef" type="file" accept=".json" @change="handleFile" />
  </el-card>
</template>
<style lang="scss" scoped></style>
