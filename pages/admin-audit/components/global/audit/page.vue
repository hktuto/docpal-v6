<script lang="ts" setup>
import { newAdminApi, clientApi } from 'api'
import formJson from './form.vform.json'

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

const { page, pageSize, time } = toRefs(props)

const config: any = useRuntimeConfig()
const FormRendererRef = ref()

const formData = ref<any>({})
function handleFormChange(data: any) {
  formData.value = Object.keys(data.formModel).reduce((prev: any, key) => {
    console.log(key, data.formModel[key])
    if (key === 'auditTemplate' && data.formModel[key]) {
      if (data.formModel[key][0]) prev.eventCategory = data.formModel[key][0]
      if (data.formModel[key][1]) prev.eventId = data.formModel[key][1]
    } else if (key === 'dates' && data.formModel[key]) {
      if (data.formModel[key][0]) prev.eventDateFrom = data.formModel[key][0].replace(/.000.*$/, '.000Z')
      if (data.formModel[key][1]) prev.eventDateTo = data.formModel[key][1].replace(/.000.*$/, '.000Z')
      // .replace(/.000.*$/, 'Z')
    } else if (key === 'path' && data.formModel[key]) {
      const p = deepCopy(data.formModel[key])
      prev.documentId = p.pop()
    } else if (data.formModel[key]) prev[key] = data.formModel[key]
    return prev
  }, {})
  console.log(formData.value)
  reload()
  // handlePaginationChange(1)
}

const tableRef = ref()
function reload() {
  tableRef.value.reload()
}

const {
  public: { endPoint }
} = useRuntimeConfig()
function goClientPath(path: string) {
  window.open(endPoint.clientUrl + '/browse?path=' + path, '_blank')
}

provide(AuditProviderKey, {
  getListApi: (params: any) => {
    return clientApi.api.postAuditLogPage(params)
  },
  goClientPath
})
</script>

<template>
  <div class="pageContainer">
    <AuditTable ref="tableRef"> </AuditTable>
  </div>
</template>

<style lang="scss" scoped>
.pageContainer {
  padding: var(--app-space-s);
  height: 100%;
}
</style>
