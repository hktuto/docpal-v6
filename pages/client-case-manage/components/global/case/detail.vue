<script lang="ts" setup>
import { newClientApi } from 'api'

const { id, name, data } = defineProps<{
  id: string;
  name: string;
  data: string
}>()

const { t } = useI18n()
const emits = defineEmits(['filter-change', 'refresh'])
const routerProvider = inject(MenuRouterKey)
type TableState = {
  columns: any;
};
const state = reactive<TableState>({
  columns: []
})
let extraParams: any = {}
const tableReady = ref(false)
const {
  tableConfig,
  tableEvent,
  tableRef,
  query,
  reload,
  cleanSelectedRows
} = useVxeTable({
  id: 'clientCaseTableList',
  api: async (pageParams: any) => {
    try {
      return newClientApi.postCaseTypesCasetypeidRecordsPage(id, { ...pageParams, ...extraParams })
    } catch (e) {
      console.log(e)
    }
  },
  defaultSort: {},
  optionalConfig: {
    tooltipConfig: {}
  },
  dblClickAction: ({ row }) => {
    const item = caseManageDashboardPage({
      ...row,
      id,
      instanceId: row.case_id,
      versionId: row.caseDefinitionVersionId,
      data
    })
    console.log('new page', item)
    routerProvider?.navigateTo(item)
  }
})

const responsiveFilter = ref()

async function initCondition() {
  try {
    const data = await newClientApi.getCaseTypesCasetypeidRecordsPageConditions(id).then(r =>r.data)
    const order = [
      {
        key: 'orderBy',
        label: 'tableHeader.sortBy',
        type: 'string',
        isMultiple: false,
        options: [
          { label: 'caseManagement.id', value: 'case_id' },
          { label: 'table_modifiedDate', value: 'modified_date' },
          { label: 'workflow_createDate', value: 'created_date' }
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
    responsiveFilter.value.init([...data, ...order])
  } catch (error) {
    console.log(error)
  }
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
  if ('q' in formModel) {
    extraParams.q = formModel.q
    delete formModel.q
  }

  extraParams.where = formModel
  reload()
}

async function reorderColumn() {
  try {
    const { fields } = await newClientApi.getCaseDashboardCasetypeCasetypeidPrimaryform(id).then(r => r.data)
    const columns = [
      // { field: 'case_id', title: 'caseManagement.id' },
      {
        field: 'created_date',
        title: 'workflow_createDate',
        formatter({ cellValue }: any) {
          return formatDate(cellValue)
        }
      },
      {
        field: 'modified_date',
        title: 'table_modifiedDate',
        formatter({ cellValue }: any) {
          return formatDate(cellValue)
        }
      }
    ]
    fields.forEach((row) => {
      columns.unshift({ field: row.id, title: row.name, width: 200 })
    })
    const caseIdIndex = columns.findIndex((item) => item.field === 'case_id')
    if (caseIdIndex !== -1) {
      columns.splice(0, 0, columns.splice(caseIdIndex, 1)[0])
    }
    const actionColumn = tableConfig.columns.find(
      (item) => item.title === 'dpTable_actions'
    )
    if (!!actionColumn) columns.push(actionColumn)
    tableConfig.columns = columns
  } catch (e) {
  }
  tableReady.value = true
}

const addCaseDialog = ref()

function handleAddCaseDialog() {
  addCaseDialog.value.handleOpen(id, data)
}

onMounted(() => {
  reorderColumn()
  initCondition()
})
</script>

<template>
  <div class="pageContainer--padding">
    <VxeGrid v-if="tableReady" ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <header class="header-flex">
          <ResponsiveFilter
            ref="responsiveFilter"
            @form-change="handleFilterFormChange"
            inputKey="q"
            inputPlaceHolder="caseManagement_detailFilter"
          />
          <div class="flex-x-end">
            <el-button id="CaseManagement__Detail__AddNewRow" type="primary" @click="handleAddCaseDialog">
              {{ $t('render.hint.subFormAddActionHint') }}
            </el-button>
          </div>
        </header>
      </template>
    </VxeGrid>
  </div>
  <LazyCaseAddCaseDialog ref="addCaseDialog" @refresh="reload"></LazyCaseAddCaseDialog>
</template>

<style lang="scss" scoped>
.header-flex {
  width: 100%;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr min-content;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs);
  background: var(--el-color-primary-light-9);
}

.flex-x-end {
  display: flex;
  justify-content: end;
}

:deep(.el-input) {
  width: 200px;
}
</style>
