<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="responsiveFilterRef" inputKey="name" @form-change="handleFilterFormChange" inputPlaceHolder="folder_cabinetFilterItemName" />
        <el-button id="UniqueIdGeneratorList__AddUniqueIdGenerator" class="el-icon--right button" type="primary" @click="handleAdd">
          {{ $t('button.add') }}
        </el-button>
      </template>
    </VxeGrid>
  </div>

  <LazyUniqueIdGeneratorAddDialog ref="addDialogRef"></LazyUniqueIdGeneratorAddDialog>

  <LazyUniqueIdGeneratorDuplicateDialog ref="duplicateDialogRef" @refresh="reload"> </LazyUniqueIdGeneratorDuplicateDialog>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'
import { routeUniqueIdGeneratorDetail } from '~/utils/routerHelper'

const routerProvider = inject(MenuRouterKey)
const responsiveFilterRef = ref()
const { t } = useI18n()
let extraParams: any = {}
const addDialogRef = ref()
const duplicateDialogRef = ref()

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'unique-id-generator',
  api: async (pageParams: any) => {
    return await clientApi.admin.postAdmindocpalIdTemplatesPage({
      ...pageParams,
      ...extraParams
    })
  },
  columns: [
    { field: 'name', title: 'uniQueIdGenerator_name', fixed: 'left' },
    { field: 'lastIdValue', title: 'uniQueIdGenerator_latestId' },
    { field: 'createdByName', title: 'role.creator' },
    { field: 'modifiedByName', title: 'modified_by' },
    {
      field: 'modifiedDate',
      title: 'table_last_update',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'edit',
        name: t('common_edit'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDetail(row)
        }
      },
      {
        code: 'duplicate',
        name: t('actions.duplicate'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDuplicate(row)
        }
      },
      {
        code: 'delete',
        name: t('common_delete'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDelete(row)
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDetail(row)
  }
})

function handleAdd() {
  addDialogRef.value.handleOpen()
}

function handleDetail(row: any) {
  routerProvider?.navigateTo(routeUniqueIdGeneratorDetail(row), false)
}

async function handleDuplicate(row: any) {
  duplicateDialogRef.value.handleOpen(row)
}

async function handleDelete(row: any) {
  ElMessageBox.confirm(t('uniQueIdGenerator_deleteMsg', { name: row.name }), {
    confirmButtonClass: 'el-button el-button--warning',
    confirmButtonText: t('common_delete')
  }).then(async () => {
    try {
      await clientApi.admin.deleteAdmindocpalIdTemplatesId(row.id)
      routerProvider?.message.success(
        t('tip_deleteSuccessMsg', {
          modelName: t('adminMenu.uniqueIdGenerator'),
          name: row.name
        })
      )
    } catch (error) {
      console.log(error)
    } finally {
      reload()
    }
  })
}

function handleFilterFormChange(formModel: any) {
  extraParams = {}
  if ('isDesc' in formModel) {
    extraParams.isDesc = formModel.isDesc == 'true'
    delete formModel.isDesc
  }
  if ('orderBy' in formModel) {
    extraParams.orderBy = formModel.orderBy
    delete formModel.orderBy
  }
  if ('name' in formModel) {
    extraParams.name = formModel.name
    delete formModel.name
  }
  if (Object.keys(formModel).length > 0) {
    extraParams.where = formModel
  }
  reload()
}

function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'uniQueIdGenerator_name', value: 'name' },
        { label: 'uniQueIdGenerator_latestId', value: 'lastIdValue' },
        { label: 'role.creator', value: 'createdBy' },
        { label: 'modified_by', value: 'modifiedBy' },
        { label: 'table_last_update', value: 'modifiedDate' }
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
  responsiveFilterRef.value.init(data)
}

onMounted(() => {
  getFilter()
})
</script>
<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}

:deep(.vxe-buttons--wrapper) {
  justify-content: space-between;

  .responsive-container {
    width: 70%;
  }
}

.button-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>
