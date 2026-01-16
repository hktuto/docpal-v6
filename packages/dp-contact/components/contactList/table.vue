<template>
  <div style="overflow: hidden; height: 100%">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef" inputKey="q" @form-change="handleFilterFormChange" inputPlaceHolder="tableHeader_name" />
        <div class="actions">
          <ContactListExportButton class="el-icon--left" :id="id" :name="name" />
          <ContactListImportButton v-if="isCreate" :id="id" :name="name" :detail="detail" @refresh="reload" />
          <el-button v-if="isCreate" class="el-icon--right" id="Dashboard__CreateNewDashboard" type="primary" @click="handleCreate">
            {{ $t('button.add') }}
          </el-button>
        </div>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.status === 'A'" type="success">{{ $t('actions.activated') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
    <ContactListDialog ref="ContactListDialogRef" v-bind="props" @refresh="reload" />
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'

const props = defineProps<{
  id: string
  name: string
  detail: any
}>()
const permissionHelper = inject('contactBookPermissionHelper')
const { isEdit, isDelete, isCreate } = toRefs(permissionHelper)
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: `contactBook-${props.id}`,
  api: (pageParams: any) => {
    return clientApi.api.postDmsContactGroupIdContactdetailPage(props.id, { ...pageParams, ...extraParams })
  },
  columns: [],
  bodyActions: [
    [
      {
        code: 'contactbook_detail_edit',
        name: t('common_edit'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleEditRow(row)
        }
      },
      {
        code: 'contactbook_detail_delete',
        name: t('common_remove'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          deleteItem(row)
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    // handleEditRow(row)
  },
  permissionMethod: (args: PermissionMethodParams) => {
    // options 是 menuConfig 中的 body 配置
    switch (args.code) {
      case 'contactbook_detail_edit':
        return {
          visible: isEdit.value,
          disabled: false
        }
      case 'contactbook_detail_delete':
        return {
          visible: isDelete.value,
          disabled: false
        }
    }
    return {
      visible: true,
      disabled: false
    }
  },
  editRender: {
    editClosed: async ({ row, rowIndex, $rowIndex, column, columnIndex, $columnIndex }: any) => {
      handleEditRowValid(row, rowIndex)
    }
  }
})

const ContactListDialogRef = ref()

async function handleCreate() {
  ContactListDialogRef.value.handleOpen()
}
function handleEditRow(row: any) {
  ContactListDialogRef.value.handleOpen(row)
}
async function handleEditRowValid(row: any, rowIndex: number) {
  try {
    const validateResult = await tableRef.value.validate(true).catch((errMap) => errMap)
    if (validateResult && validateResult.length > 0) {
      const exitErrorRow = validateResult.find((item: any) => item.field === row.name && item.rowIndex === rowIndex)
      if (exitErrorRow) {
        routerProvider?.message.error(exitErrorRow.rule.message)
      }
      return
    }
    const params: any = {}
    props.detail.attributes.forEach((item: any) => {
      params[item.value] = row[item.value]
    })
    await clientApi.api.putDmsContactGroupIdContactdetailContactdetailid(props.id, row.id, params)
  } catch (error) {
    console.error(error)
  }
}
async function deleteItem(row: any) {
  try {
    const action = await ElMessageBox.confirm(t('msg_confirmWhetherToDelete'))
    if (action !== 'confirm') return
    await clientApi.api.deleteDmsContactGroupIdContactdetailContactdetailid(props.id, row.id)
    routerProvider?.message.success(
      t('tip_deleteSuccessMsg', {
        modelName: props.name,
        name: row.name
      })
    )
    query({})
  } catch (error) {
    console.error(error)
  }
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  let filterParams: any = {
    q: formModel.q === '' ? undefined : formModel.q,
    orderBy: formModel.orderBy === undefined || formModel.orderBy === '' ? 'createdDate' : formModel.orderBy
  }
  filterParams.isDesc = formModel.isDesc
  extraParams = filterParams
  reload()
}

const ResponsiveFilterRef = ref()

async function getFilter(attrColumns: any[]) {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'role.creator', value: 'createdBy' },
        { label: 'tableHeader_creationDate', value: 'createdDate' },
        { label: 'tableHeader_modifiedDate', value: 'modifiedDate' }
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
  // backend no support attrColumns
  // data[0].options.unshift(...attrColumns.map((item: any) => ({ label: item.title, value: item.field })))
  ResponsiveFilterRef.value.init(data)
}

const EDIT_RENDER = {
  editConfig: {
    trigger: 'click',
    mode: 'row',
    showStatus: true
  }
}
function init() {
  const defauleRule = {
    name: [{ required: true, message: t('render.hint.fieldRequired', { name: t('tableHeader_name') }), trigger: 'blur' }],
    email: [
      {
        required: true,
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        message: t('tip.enterValidEmail')
      }
    ]
  }
  const columns = [
    { title: 'role.creator', field: 'createdBy' },
    {
      field: 'createdDate',
      title: 'tableHeader_creationDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'modifiedDate',
      title: 'tableHeader_modifiedDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ]
  const attrColumns = props.detail.attributes.map((item: any) => {
    return {
      field: item.value,
      title: item.name,
      editRender: { name: 'VxeInput' }
    }
  })
  columns.unshift(...attrColumns)
  const actions = tableConfig.columns.find((item: any) => item.title === 'dpTable_actions')
  if (actions) {
    columns.push(actions)
  }
  tableConfig.columns = columns
  if (isEdit.value) {
    tableConfig.editConfig = EDIT_RENDER.editConfig
    tableConfig.editRules = defauleRule
  }
  getFilter(attrColumns)
}

defineExpose({
  init
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
