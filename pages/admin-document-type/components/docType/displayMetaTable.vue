<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="q"
                          inputPlaceHolder="documentType_metaFilter" />
        <el-button id="DocumentType__DisplayMeta__AddNewDisplayMeta" type="primary" @click="handleDialogShow()">
          {{ $t('documentType_metaAdd') }}
        </el-button>
      </template>
      <template #display="{ row }">
        <el-switch v-model="row.display" :loading="row.loading" @click.native.stop
                   @change="handleDisplayChange(row)"></el-switch>
      </template>
      <!-- <template #isRequire="{ row }">
        <el-icon v-if="row.isRequire" style="--color: var(--app-primary-color)"><Select /></el-icon>
        <el-icon v-else style="--color: #f56c6c">
          <CloseBold />
        </el-icon>
      </template> -->
    </VxeGrid>
    <DocTypeDialogAddDisplayMeta ref="MetaDisplayMetaDialogRef" v-bind="props" @refresh="handleRefresh" />
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { adminApi, clientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const props = defineProps<{
  documentType: string
  id: string
}>()
const ResponsiveFilterRef = ref()
const isFilter = ref(false)
let extraParams: any = {}
let tableData: any[] = []
const emits = defineEmits(['refresh', 'updateDetail'])
const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'displayMetaTable',
  virtualScroll: true,
  api: async (pageParams: any) => {
    // const data = await getChildApi(id.value || 'root')
    return await getList()
  },
  columns: [
    { type: 'seq', width: 70, align: 'right', dragSort: true },
    {
      field: 'name',
      title: 'rightDetail_meta',
      formatter({ cellValue }: any) {
        console.log(cellValue, 'cellValue')
        return t(cellValue)
      }
    },
    { field: 'dataType', title: 'meta.dataTypeText' },
    // 无效设置
    // {
    //   field: 'display',
    //   title: 'form_display',
    //   slots: {
    //     default: 'display'
    //   }
    // },
    {
      field: 'lastModifiedDate',
      title: 'tableHeader_lastModified',
      formatter: ({ cellValue }) => {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'documentType_edit',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDialogShow(row)
        }
      },
      {
        code: 'delete',
        name: 'documentType_delete',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDelete(row)
        }
      },
      {
        code: 'moveup',
        name: 'documentType_moveup',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleMove(row, 1)
        }
      },
      {
        code: 'movedown',
        name: 'documentType_movedown',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleMove(row, -1)
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDialogShow(row)
  },
  dragConfig: {
    dragend: ({ oldRow, _index }) => {
      const offsetIndex = _index.oldIndex - _index.newIndex
      handleMove(oldRow, offsetIndex, false)
    }
  }
})

async function getList() {
  if (!isFilter.value) {
    const data: any = await clientApi.admin.postAdmindmsDocpalTypeMetadata({ docpalTypeName: props.documentType }).then((res) => res.data)
    tableData = data.metadataList.map((item: any) => ({
      ...item,
      display: !!item.display
    }))
    emits('updateDetail', data)
  }
  let filterData = tableData.filter((item: any) => {
    return true
  })
  if (extraParams.q) {
    filterData = filterData.filter((item: any) => {
      const name = (item.name || '').toLowerCase()
      return name.includes(extraParams.q.toLowerCase())
    })
  }

  isFilter.value = false
  return filterData
}

function handleRefresh(addMore: boolean = false) {
  isFilter.value = false
  if (addMore) handleDialogShow()
  reload()
}

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(t('tip_deleteMsg', { modelName: t('docType_displayMeta'), name: null }), {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return
    const res = await clientApi.admin.deleteAdmindmsDocpalTypeDocpaltypeidMetadata(props.id, {
      metadataId: row.id
    }).then(r => r.data)
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: t('tip_SelectedMsg') + t('docType_displayMeta') }))
    reload()
  } catch (error) {
    console.log(error)
  }
}

const MetaDisplayMetaDialogRef = ref()

function handleDialogShow(data?: any) {
  MetaDisplayMetaDialogRef.value.handleOpen(tableData, data)
}

function handleFilterFormChange(formModel: any) {
  isFilter.value = true
  extraParams = formModel
  reload()
}

async function handleMove(row: any, moveIndex: number, isReload: boolean = true) {
  try {
    await clientApi.admin.postAdmindmsDocpalTypeMetadataSort({
      docpalTypeId: props.id,
      metadataId: row.id,
      moveIndex
    })
    if (isReload) {
      reload()
    }
  } catch (error) {
    console.error(error)
    reload()
  }
}

async function handleDisplayChange(row: any) {
  try {
    row.loading = true
    const params = {
      metadataId: row.id,
      display: row.display,
      metadataPermission: row.metadataPermission || {
        hiddenPermissions: [],
        maskPermissions: [],
        readOnlyPermissions: []
      }
    }
    await adminApi.api.postDocpaltypeSettingsDocpalTypeV2UpdateMetadataDocpaltypeid(props.id, params)
  } catch (error) {
    row.display = !row.display
    console.error(error)
  } finally {
    setTimeout(() => {
      row.loading = false
    }, 500)
  }
}
</script>
<style lang="scss" scoped>
:deep(.vxe-buttons--wrapper) {
  display: flex;
  justify-content: space-between;
}

.responsive-container {
  width: 70%;

  :deep(.el-input) {
    width: 200px;
  }
}
</style>
