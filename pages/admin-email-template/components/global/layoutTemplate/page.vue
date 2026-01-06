<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter
          ref="ResponsiveFilterRef"
          inputKey="name"
          @form-change="handleFilterFormChange"
          inputPlaceHolder="emailContentTemplate_layoutFilter"
        />
        <el-button id="EmailContentTemplate__CreateNewEmailLayout" type="primary" @click="handleAdd">
          {{ $t('emailContentTemplate_layoutCreate') }}
        </el-button>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.enable" type="success">{{ $t('actions.activated') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
    <EmailLayoutDialog ref="EmailLayoutDialogRef" @refresh="query({})"></EmailLayoutDialog>
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-email-layout-template',
  api: (pageParams: any) => clientApi.api.postDmsTemplateEmailLayoutPage({ ...pageParams, ...extraParams }),
  columns: [
    { field: 'name', title: 'emailContentTemplate_layoutName', fixed: 'left' },
    { field: 'createdBy', title: 'emailContentTemplate_layoutCreator' },
    {
      field: 'createDate',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'edit',
        name: t('emailContentTemplate_layoutEdit'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'delete',
        name: t('emailContentTemplate_layoutDelete'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDeleteTemplate(row)
        }
      }
    ]
  ]
})
const EmailLayoutDialogRef = ref()

function handleDblclick(row) {
  // router.push(`/easyFormManage/${row.id}`);
  EmailLayoutDialogRef.value.handleOpen(row)
}

function handleAdd() {
  EmailLayoutDialogRef.value.handleOpen()
}

async function handleDeleteTemplate(row) {
  try {
    const action = await ElMessageBox.confirm(
      t('tip_deleteMsg', { modelName: t('emailTemplate.layout'), name: row.name }),
      {
        confirmButtonClass: 'el-button el-button--warning',
        confirmButtonText: t('common_confirmDelete')
      })
    if (action !== 'confirm') return
    await clientApi.api.deleteDmsTemplateEmailLayoutId(row.id)
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: row.name }))
    query({})
  } catch (error) {
    console.log(error)
  }
}

function handleFilterFormChange(formModel: any) {
  extraParams = formModel
  reload()
}

onMounted(() => {})
</script>
<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}

.responsive-container {
  overflow: hidden;
  width: 70%;
}

:deep(.vxe-buttons--wrapper) {
  display: flex;
  justify-content: space-between;
}
</style>
