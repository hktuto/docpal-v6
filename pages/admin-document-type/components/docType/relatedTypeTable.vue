<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="name" inputPlaceHolder="documentType_relatedFilter" />
        <el-button id="DocumentType__RelatedDocument__AddNewRelatedDocument" type="primary" @click="handleDialogShow()">
          {{ $t('docType_addRelatedMeta') }}
        </el-button>
      </template>
    </VxeGrid>
    <DocTypeDialogAddRelatedType ref="DialogRef" :docType="docTypeDetail" :name="name" @refresh="getList" />
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const props = defineProps<{
  docTypeDetail: any
  name: string
}>()
const ResponsiveFilterRef = ref()
const { t } = useI18n()
let _list: any = []
const { tableConfig, tableEvent, tableRef, query, reload } = useVxeTable({
  id: 'relatedType',
  columns: [
    {
      field: 'rootDocPalType',
      title: 'dpTable_documentType',
      fixed: 'left',
      formatter({ cellValue }: any) {
        return t(cellValue)
      }
    },
    {
      field: 'metaData',
      title: 'rightDetail_meta'
    }
  ],
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'documentType_relatedEdit',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDialogShow(row)
        }
      },
      {
        code: 'delete',
        name: 'documentType_relatedDelete',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDelete(row)
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDialogShow(row)
  },
  virtualScroll: true
})

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(t('tip_deleteMsg', { modelName: t('docType_relatedDocument'), name: null }), {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return
    await clientApi.admin.deleteDocpaltypeSettingsRelatedId(row.id).then(r => r.data)
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: t('tip_SelectedMsg') + t('docType_relatedDocument') }))
    await getList()
  } catch (error) {
  } finally {
  }
}

const DialogRef = ref()

function handleDialogShow(data?: any) {
  DialogRef.value.handleOpen(_list, {
    ...data,
    documentType: data?.rootDocPalType,
    metadata: data?.metaData
  })
}

function handleFilterFormChange(formModel: any) {
  const name = formModel.name
  const list = _list.filter((item: any) => {
    return (
      !formModel.name || item.rootDocPalType.toLowerCase().includes(name.toLowerCase()) || t(item.rootDocPalType).toLowerCase().includes(name.toLowerCase())
    )
  })
  tableRef?.value?.loadData(list)
}

async function getList() {
  ResponsiveFilterRef.value.handleFilter()

  _list = await adminApi.api.getDocpaltypeSettingsNameNameRelated(props.name).then((res) => res.data)
  tableRef?.value?.loadData(_list)
}

onMounted(() => {
  getList()
})
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
