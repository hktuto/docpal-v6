<script lang="ts" setup>
import { InternalShareProviderKey } from '#imports'
import { newAdminApi } from 'api'
import { provide } from 'vue'
import InternalShareListTable from '../../InternalShare/list/table.vue'
import { ElMessageBox } from 'element-plus'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

const props = defineProps<{
  pageNum: number
  pageSize: number
  filters?: any
}>()
const { pageNum, pageSize, filters } = toRefs(props)

const { t } = useI18n()
const filterData = ref()
const ResponsiveFilterRef = ref()
const tableRef = ref<InstanceType<typeof InternalShareListTable>>()

function handleFilterFormChange(formData: any) {
  filterData.value = formData
  tableRef.value?.reload()
}

function handleClearFilter() {
  filterData.value = {}
  tableRef.value?.reload()
}

onMounted(() => {
  setTimeout(() => {
    // unit-test need
    initFilter()
  })
})
function initFilter() {
  try {
    const data = [
      {
        key: 'orderBy',
        label: 'tableHeader.sortBy',
        type: 'string',
        isMultiple: false,
        options: [
          { label: 'tableHeader.fileOrFolderName', value: 'documentNames' },
          { label: 'tableHeader_shareBy', value: 'shareByUserId' },
          { label: 'tableHeader_shareTo', value: 'shareToUserIds' },
          { label: 'workflow_createDate', value: 'createdDate' }
        ]
      },
      {
        key: 'isDesc',
        label: 'tableHeader.sortOrder',
        type: 'string',
        isMultiple: false,
        options: [
          { label: 'tableHeader.asc', value: false },
          { label: 'tableHeader.desc', value: true }
        ]
      }
    ]
    ResponsiveFilterRef.value.init(data)
    if (filters.value) {
      filterData.value = filters.value
      nextTick(() => {
        Object.keys(filters.value).forEach((key) => {
          ResponsiveFilterRef.value.setValue(key, filters.value[key])
        })
        // tableRef.value?.reload()
      })
    }
  } catch {}
}

async function deleteAction(row: any) {
  try {
    const action = await ElMessageBox.confirm(t('tip_deleteMsg', { modelName: t('share_internalShareLink'), name: null }), {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return
    // param.push(...row.detailIds.split(','))
    await newAdminApi.deleteDmsInternalshare({ internalShareId: row.internalShareId })
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: t('tip_SelectedMsg') +  t('share_internalShareLink') }))
    tableRef.value?.reload()
    return
  } catch (error) {
    console.log(error)
  }
}
async function getListApi(params: any) {
  let filter: any = undefined
  if (filterData.value) {
    Object.keys(filterData.value).forEach((key) => {
      if (filterData.value[key]) params[key] = filterData.value[key]
    })
    filter = { ...filterData.value }
  }
  console.log('filte', params)
  routerProvider?.updateProps({
    pageNum: params.pageNum + 1,
    pageSize: params.pageSize,
    filters: filter
  })
  return newAdminApi.postDmsInternalsharePage(params)
}
provide(InternalShareProviderKey, {
  getListApi,
  actionPermission: (args: PermissionMethodParams) => {
    return { visible: true, disabled: false }
  },
  deleteAction
})
</script>

<template>
  <div class="pageContainer">
    <InternalShareListTable ref="tableRef">
      <template #toolbar_buttons>
        <ResponsiveFilter
          ref="ResponsiveFilterRef"
          @form-change="handleFilterFormChange"
          inputKey="documentName"
          @clear-filter="handleClearFilter"
          inputPlaceHolder="share_FilterByDocumentName"
        />
      </template>
    </InternalShareListTable>
  </div>
</template>

<style lang="scss" scoped>
.pageContainer {
  width: 100%;
  height: 100%;
  padding: var(--app-space-s);
  overflow: hidden;
}

:deep(.el-input) {
  width: 200px;
}
</style>
