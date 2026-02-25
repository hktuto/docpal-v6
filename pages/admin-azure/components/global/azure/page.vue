<script lang="ts" setup>
import { newAdminApi } from 'api'
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
  const res = await newAdminApi.getDsbAzureOcrSetting()
  return res.data
}
async function GetOCRConditions() {
  const res = await newAdminApi.getDsbAzureOcrConditions()
  return res.data
}
const logTableRef = ref()
function handleFilterFormChange(formData: any) {
  filterFormdata = formData
  logTableRef.value?.reload()
}
provide(AzureProviderKey, {
  UpdateAzureApiKeyApi: (params: any) => {
    return newAdminApi.putDsbAzureOcrSettingApiKey(params)
  },
  UpdateAzureOcrSettingApi: (params: any) => {
    return newAdminApi.getDsbAzureOcrSetting(params)
  },
  CreateAzureOcrMappingApi: (params: any) => {
    return newAdminApi.postDsbAzureOcrProfileMapping(params)
  },
  UpdateAzureOcrMappingApi: (params: any) => {
    return newAdminApi.putDsbAzureOcrProfileMapping(params)
  },
  GetAzureOcrModelsApi: (params: any) => {
    return newAdminApi.getDsbAzureOcrModels(params)
  },
  GetOCRTransactionLogApi: (params: any) => {
    const filter: any = filterFormdata
    if (filter) {
      Object.keys(filter).forEach((key) => {
        if (filter[key]) params[key] = filter[key]
      })
    }
    return newAdminApi.postDsbAzureOcrTransactionLogs(params)
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
