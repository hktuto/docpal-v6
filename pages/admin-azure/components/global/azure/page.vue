<script lang="ts" setup>
import { clientApi } from 'api'
import { AzureProviderKey } from '~/utils/azureProvider'
import type { AzureSettingDTO } from 'api/src/generate/admin'
const tabProvider = inject(TabManagerKey)
const routerProvider = inject(MenuRouterKey)
if (!tabProvider || !routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const props = defineProps<{
  page: number
  pageSize: number
  time?: string
}>()

const config: any = useRuntimeConfig()
const azureSetting = ref<AzureSettingDTO | undefined>({
  azureOcrApiKey: {},
  azureOcrSetting: {},
  azureOcrProfileMappings: [],
  ocrTransactionLogs: {}
})

let filterFormdata = {}
const ResponsiveFilterRef = ref()
async function init() {
  try {
    azureSetting.value = await GetAzureSetting()
  } catch (error) {}
}
async function initLogCondition() {
  const logTableCondition = await GetOCRConditions()
  ResponsiveFilterRef.value.init(logTableCondition)
}
function goClientPath(path: string) {
  const host = window.location.host
  const protocol = window.location.protocol
  window.open(protocol + '//' + host + '/browse?path=' + path, '_blank')
}
async function GetAzureSetting() {
  const res = await clientApi.admin.getAdmindsbAzureOcrSetting()
  return res.data
}
async function GetOCRConditions() {
  const res = await clientApi.admin.getAdmindsbAzureOcrConditions()
  return res.data
}
const logTableRef = ref()
function handleFilterFormChange(formData: any) {
  filterFormdata = formData
  logTableRef.value?.reload()
}
provide(AzureProviderKey, {
  UpdateAzureApiKeyApi: (params: any) => {
    return clientApi.admin.putAdmindsbAzureOcrSettingApiKey(params)
  },
  UpdateAzureOcrSettingApi: (params: any) => {
    return clientApi.admin.getAdmindsbAzureOcrSetting(params)
  },
  CreateAzureOcrMappingApi: (params: any) => {
    return clientApi.admin.postAdmindsbAzureOcrProfileMapping(params)
  },
  UpdateAzureOcrMappingApi: (params: any) => {
    return clientApi.admin.putAdmindsbAzureOcrProfileMapping(params)
  },
  GetAzureOcrModelsApi: (params: any) => {
    return clientApi.admin.getAdmindsbAzureOcrModels(params)
  },
  GetOCRTransactionLogApi: (params: any) => {
    const filter: any = filterFormdata
    if (filter) {
      Object.keys(filter).forEach((key) => {
        if (filter[key]) params[key] = filter[key]
      })
    }
    return clientApi.admin.postAdmindsbAzureOcrTransactionLogs(params)
  },
  goClientPath
})
onMounted(async () => {
  init()
  initLogCondition()
})
</script>

<template>
  <div class="pageContainer">
    <AzureSettingApi class="azureSettingApi" :setting="azureSetting?.azureOcrApiKey" />
    <AzureSettingOcr class="azureSettingOcr" :setting="azureSetting?.azureOcrSetting" />
    <AzureSettingMappingTable class="azureSettingMappingTable" :tableData="azureSetting?.azureOcrProfileMappings" @refresh="init" />
    <AzureSettingLogTable ref="logTableRef">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="name" />
      </template>
    </AzureSettingLogTable>
  </div>
</template>

<style lang="scss" scoped>
.pageContainer {
  padding: var(--app-space-s);
  height: 100%;
  overflow: auto;
}
</style>
