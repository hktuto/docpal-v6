<script setup lang="ts">
import { ArrowDownBold } from '@element-plus/icons-vue'
import { newClientApi } from 'api'
import dayjs from 'dayjs'
import { exportSingleSheet } from '~/utils/excelHelper'
import { exportTableToPDF } from '~/utils/pdfHelper'

const emits = defineEmits(['delete', 'refreshSetting'])
const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: {},
    hideSetting: true
  }
)

const { cardRef, settingRef, refresh, loading } = useDashboardCard({
  props
})

const formData = ref({
  project: '',
  date: dayjs().format('YYYY-MM-DD')
})

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'HKHS-ApplicationsVerified',
  virtualScroll: true,
  api: () => getData(),
  columns: [
    { field: 'batch_no', title: 'Batch No.', fixed: 'left' },
    { field: 'application_no', title: 'Application No.' },
    { field: 'form_type', title: 'Form Type' },
    {
      field: 'compare',
      title: 'Compare',
      minWidth: 120,
      type: 'html',
      formatter: ({ cellValue, row }) => {
        return cellValue
        /*return `<table>
                  <thead>
                    <tr>
                      <th>Appin No.</th>
                      <th>Form Type</th>
                      <th>HKIC</th>
                      <th>Payment Ref</th>
                      <th>Family Class</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${cellValue}</td>
                    </tr>
                  </tbody>
                </table>`*/
      }
    },
    {
      field: 'modified',
      title: 'Modified',
      minWidth: 120,
      type: 'html',
      formatter: ({ cellValue, row }) => {
        if (cellValue.toLowerCase() === 'y') {
          return `<div class="container"><div class="circle yes"></div><div class="text">${cellValue}</div></div>`
        }
        if (cellValue.toLowerCase() === 'n') {
          return `<div class="container"><div class="circle no"></div><div class="text">${cellValue}</div></div>`
        }
        return cellValue
      }
    },
    { field: 'verified_by', title: 'Verified By' },
    { field: 'completed_on', title: 'Completed on' }
  ],
  bodyActions: [],
  dblClickAction: ({ row, column, event }: any) => {}
})

const footerData = ref([
  {
    batch_no: 'Total',
    application_no: 0,
    form_type: '-',
    compare: '-',
    modified: '-',
    verified_by: '-',
    completed_on: '-'
  }
])

const name = ref('SCS-102 - List of the Applications Verified')

function handleDownloadCommand(command: string) {
  if (command === 'excel') {
    handleDownloadExcel()
  } else if (command === 'pdf') {
    handleDownloadPDF()
  }
}

function handleDownloadExcel() {
  // Prepare clean data for export (without HTML)
  const exportColumns = [
    { field: 'batch_no', title: 'Batch No.' },
    { field: 'application_no', title: 'Application No.' },
    { field: 'form_type', title: 'Form Type' },
    { field: 'compare_export', title: 'Compare' },
    { field: 'modified_export', title: 'Modified' },
    { field: 'verified_by', title: 'Verified By' },
    { field: 'completed_on', title: 'Completed on' }
  ]

  const exportData = dataList.value.map(row => ({
    ...row,
    compare_export: getCompareExportValue(row),
    modified_export: getModifiedExportValue(row)
  }))

  exportSingleSheet(exportColumns, exportData, 'SCS-102_Applications_Verified', footerData.value)
}

function getCompareExportValue(row: any): string {
  if (!row.compare || !Array.isArray(row.compare)) return ''
  return row.compare.map((item: string) => {
    // Clean HTML tags
    return item.replace(/<[^>]*>/g, '').trim()
  }).join('; ')
}

function getModifiedExportValue(row: any): string {
  return row.modified || ''
}

function handleDownloadPDF() {
  const exportColumns = [
    { field: 'batch_no', title: 'Batch No.' },
    { field: 'application_no', title: 'Application No.' },
    { field: 'form_type', title: 'Form Type' },
    { field: 'compare_export', title: 'Compare' },
    { field: 'modified', title: 'Modified' },
    { field: 'verified_by', title: 'Verified By' },
    { field: 'completed_on', title: 'Completed on' }
  ]

  const exportData = dataList.value.map(row => ({
    ...row,
    compare_export: getCompareExportValue(row)
  }))

  exportTableToPDF({
    title: 'SCS-102 - List of the Applications Verified',
    columns: exportColumns,
    data: exportData,
    footerData: footerData.value,
    fileName: 'SCS-102_Applications_Verified',
    orientation: 'landscape'
  })
}

function handleDelete() {
  emits('delete')
}

function handleRefresh() {
  query()
  reload()
  refresh()
}

const dataList = ref([])

async function getData() {
  const rpcParams = {
    p_start_date: formData.value.date,
    p_end_date: formData.value.date,
    p_distinct_flag: 2,
    default_schema: true
  }
  const data: any[] = await newClientApi.postPostgrestRpcFunc('get_user_verification_list', JSON.stringify(rpcParams)).then((res: any) => res.data)
  const element: any = data[data.length - 1]
  data.splice(data.length - 1, 1)
  footerData.value[0].application_no = element.total_number_of_application

  data.forEach((item: any) => {
    item.compare = handleCompare(item.before, item.after)
  })
  dataList.value = data
  return data
}

function handleCompare(oldStr: string, newStr: string): string[] {
  // 將字符串根據 '&' 分隔到數組中並去除空格
  const oldParts = oldStr.split('&').map((part) => part.trim())
  const newParts = newStr.split('&').map((part) => part.trim())

  return oldParts.map((oldValue, i) => {
    const newValue = newParts[i] || ''
    return oldValue !== newValue ? `${oldValue} - ${newValue}` : `<div style="background: #c1c1c1">${oldValue}</div>`
  })
}

const columnsRef = ref([
  { field: 'batch_no', title: 'Batch No.' },
  { field: 'application_no', title: 'Application No.' },
  { field: 'form_type', title: 'Form Type' },
  { field: 'compare', title: 'Compare' },
  { field: 'modified', title: 'Modified' },
  { field: 'verified_by', title: 'Verified By' },
  { field: 'completed_on', title: 'Completed on' }
])
const orderBy = ref(true)
const sortingField = ref(columnsRef.value[0].field)
const sortingName = computed(() => {
  let find = columnsRef.value.find((item: any) => item.field === sortingField.value)
  return find ? find.title : columnsRef.value[0].title
})

function HandleSorting(command: string) {
  sortingField.value = command
  const sort = dataList.value.sort((a, b) => {
    if (orderBy.value) {
      return b[sortingField.value].localeCompare(a[sortingField.value], undefined, { sensitivity: 'base' })
    } else {
      return a[sortingField.value].localeCompare(b[sortingField.value], undefined, { sensitivity: 'base' })
    }
  })
  tableRef.value.loadData(sort)
}

function handleOrderBy() {
  orderBy.value = !orderBy.value
  HandleSorting(sortingField.value)
}

const projectList = ref([])

onMounted(async () => {
  projectList.value = await newClientApi.postCaptureProjPage({}).then((r) => r.data)
})
</script>

<template>
  <DashboardCard
    ref="cardRef"
    v-loading="loading"
    class="dp-dashboard--card__padding"
    :settingRef="settingRef"
    :hideSetting="hideSetting"
    :setting="setting"
    :show-refresh-icon="false"
    :show-fullscreen-icon="false"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <template #title_suffix>
      <span class="title-suffix-name">{{ name }}</span>
    </template>
    <template #action_prefix>
      <el-dropdown trigger="click" @command="handleDownloadCommand">
        <el-button type="primary">
          Download &nbsp;<el-icon><ArrowDownBold /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="excel">Download Excel</el-dropdown-item>
            <el-dropdown-item command="pdf">Download PDF</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>

    <div class="pageContainer--padding">
      <VxeGrid show-footer ref="tableRef" v-bind="tableConfig" v-on="tableEvent" :footer-data="footerData">
        <template #toolbar_buttons>
          <div class="toolbar-wrap">
            <div class="toolbar-form-row">
              <el-select class="toolbar-select toolbar-select--type" v-model="formData.project" @change="query">
                <el-option v-for="(item, index) in projectList" :label="item.name" :value="item.id" />
              </el-select>
              <el-select class="toolbar-select toolbar-select--type">
                <el-option @change="query" />
              </el-select>
              <el-date-picker
                class="toolbar-date"
                v-model="formData.date"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                placeholder="Pick a day"
                :clearable="false"
                @change="query"
              />
            </div>

            <div class="toolbar-sorting-wrap">
              <el-dropdown trigger="click" @command="HandleSorting">
                <el-button text>
                  {{ sortingName }} &nbsp;
                  <el-icon><ArrowDownBold /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-for="(item, index) in columnsRef" :command="item.field">{{ item.title }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <Icon :name="orderBy ? 'mdi:sort-descending' : 'mdi:sort-ascending'" style="background-color: #1abc9c" @click="handleOrderBy" />
            </div>
          </div>
        </template>
      </VxeGrid>
    </div>
    <HkhsSetting ref="settingRef" :setting="setting" @submit="(setting) => $emit('refreshSetting', setting)"/>
  </DashboardCard>
</template>

<style scoped lang="scss">
.title-suffix-name {
  font-size: 35px;
  line-height: 35px;
}

.toolbar-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.toolbar-form-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.toolbar-sorting-wrap {
  display: flex;
  align-items: center;
}

.toolbar-select {
  width: 180px;
}

:deep(.table) {
  width: 100%;
  border-collapse: collapse;
}
:deep(th, td) {
  padding: 8px;
  text-align: left;
  border: none;
}

:deep(.container) {
  display: flex;
  align-items: center;
}

:deep(.circle) {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 10px;
}

:deep(.yes) {
  background-color: #1abc9c;
}

:deep(.no) {
  background-color: #e74c3c;
}

:deep(.text) {
  font-size: 16px;
  color: #333;
}
</style>
