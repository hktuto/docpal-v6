<script setup lang="ts">
import { clientApi } from 'api'
import { v7 as uuidv7 } from 'uuid'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const showAll = ref<boolean>(true)
const allList = ref<any[]>([])
const dataList = ref<any[]>([])
const userInfo = ref<any>({
  user: '',
  office: '',
  org_id: ''
})
const isApproval = ref<boolean>(false)
const selectedRowsList = ref<any[]>([])
const header = ref<{
  tn_header_id: number
  office: string
  tn_number: string
  tn_planned_date: string
  commodity_inspection: string
  status: string
  created_by: string
  creation_date: string
  version: string
}>({
  tn_header_id: 0,
  office: '',
  tn_number: '',
  tn_planned_date: '',
  commodity_inspection: '',
  status: '',
  created_by: '',
  creation_date: '',
  version: ''
})
const formRef = ref()
const headerFormRef = ref()
const selectData = reactive({
  selectedRowsListLength: 0
})

watch(
  () => selectedRowsList.value.length,
  (len) => {
    selectData.selectedRowsListLength = len
  },
  { immediate: true }
)

const rules = reactive({
  selectedRowsListLength: [
    {
      validator: (rule: any, value: any, callback: any) => {
        if (value === 0) {
          callback(new Error(''))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
})

const headerRules = {
  status: [
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (
          String(value ?? '')
            .trim()
            .toUpperCase() === 'CANCELED'
        ) {
          callback(new Error(t('transferNoteApproval.statusCannotBeCanceled')))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

function getColumns() {
  const checkboxCol = { type: 'checkbox', width: 60, align: 'center', fixed: 'left' }
  const columns: any[] = [
    {
      field: 'tn_line_num',
      title: t('transferNoteApproval.tnLineNumber'),
      align: 'center',
      minWidth: 140
    },
    {
      field: 'line_num',
      title: t('transferNoteApproval.poLineNumber'),
      minWidth: 140
    },
    {
      field: 'po_number',
      title: t('transferNoteApproval.poNumber'),
      minWidth: 150
    },
    {
      field: 'item',
      title: t('transferNoteApproval.wclPartNumber'),
      minWidth: 200
    },
    {
      field: 'item_origin',
      title: t('transferNoteApproval.origin'),
      minWidth: 100
    },
    {
      field: 'qty_delivered_onhand',
      title: t('transferNoteApproval.onHandQty'),
      minWidth: 120
    },
    {
      field: 'from_subinventory',
      title: t('transferNoteApproval.fromSubInventory'),
      minWidth: 160
    },
    {
      field: 'to_subinventory',
      title: t('transferNoteApproval.toSubInventory'),
      minWidth: 140
    },
    {
      field: 'transfer_quantity',
      title: t('transferNoteApproval.transferQty'),
      minWidth: 100
    },
    {
      field: 'unit_price_in_hkd',
      title: t('transferNoteApproval.unitPrice'),
      minWidth: 100
    },
    {
      field: 'amount_in_hkd',
      title: t('transferNoteApproval.amount'),
      minWidth: 100
    },
    {
      field: 'status',
      title: t('transferNoteApproval.lineStatus'),
      minWidth: 100
    },
    {
      field: 'cancel_reason',
      title: t('transferNoteApproval.cancelReason'),
      minWidth: 240,
      slots: { default: 'cancel_reason' }
    }
  ]

  if (!isApproval.value) {
    columns.unshift(checkboxCol)
  }
  return columns
}

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'tnApprovalReviewTable',
  api: () => {
    return dataList.value
  },
  columns: getColumns(),
  zoom: false,
  refresh: false,
  customeToolBar: false,
  virtualScroll: true,
  remoteSort: false,
  remoteFilter: false,
  saveColumnOrder: false,
  selectChangeHander: (selectedRows: any[]) => {
    selectedRowsList.value = selectedRows
  },
  optionalConfig: {
    rowClassName: ({ row }: { row: any }) => {
      if (isApproval.value && String(row.cancel_reason ?? '').trim()) {
        return 'row--cancel-highlight'
      }
      return ''
    }
  }
})

function handleShowData() {
  dataList.value = showAll.value ? allList.value : selectedRowsList.value

  showAll.value = !showAll.value
  reload()
}
function getUserInfo() {
  const useLocalStorage = localStorage.getItem('docpal-user')
  if (useLocalStorage) {
    const user = JSON.parse(useLocalStorage)

    if (user.org.length > 0) {
      userInfo.value.office = user.org[0].organizationCode
      userInfo.value.org_id = user.org[0].operatingId
    }
  }
}

async function init() {
  showAll.value = true
  allList.value = []
  dataList.value = []
  isApproval.value = formData.is_approval

  header.value = {
    tn_header_id: formData.tn_header_id ?? '',
    office: formData.office ?? '',
    tn_number: formData.tn_number ?? '',
    tn_planned_date: formData.tn_planned_date ?? '',
    commodity_inspection: formData.commodity_inspection ?? '',
    status: formData.status ?? '',
    created_by: formData.created_by ?? '',
    creation_date: formData.creation_date ?? '',
    version: formData.version ?? ''
  }
  allList.value = formData.list ?? []
  selectedRowsList.value = formData.is_approval ? formData.select_list : []
  dataList.value = formData.list ?? []

  nextTick(() => {
    tableConfig.columns = getColumns()
    reload()
    headerFormRef.value?.validateField('status')
  })
}

async function getTNData(tnNumber: string) {
  if (!tnNumber) return

  try {
    tableConfig.loading = true
    const raw = {
      org_id: userInfo.value.org_id,
      tn_numbers: [tnNumber]
    }

    const data = await clientApi.instance.post(`/api/tn/details`, raw).then((r) => r.data.data.items)
    if (data.length === 0) {
      routerProvider?.message.warning(t('transferNoteApproval.noRelatedInfoFound'))
      return
    }
    if (!data[0].header) {
      dataList.value = []

      routerProvider?.message.warning(t('transferNoteApproval.noRelatedInfoFound'))
      return
    }

    const dataHeader = data[0].header

    dataList.value = data[0].lines.map((item: any) => ({
      id: uuidv7(),
      ...item
    }))

    header.value = {
      tn_header_id: dataHeader.tn_header_id ?? 0,
      office: dataHeader.office ?? '',
      tn_number: dataHeader.tn_number ?? '',
      tn_planned_date: dataHeader.tn_planned_date ?? '',
      commodity_inspection: dataHeader.commodity_inspection ?? '',
      status: dataHeader.status ?? '',
      created_by: dataHeader.created_by ?? '',
      creation_date: dataHeader.creation_date ?? '',
      version: dataHeader.version ?? ''
    }
    nextTick(() => headerFormRef.value?.validateField('status'))
  } catch (e) {
    console.log(e)
  } finally {
    reload()
    tableConfig.loading = false
  }
}

watch(
  () => formData.list,
  (value) => {
    if (!!value && value.length > 0) {
      init()
    }
  },
  { immediate: true }
)

async function getFormData(needValidation = true) {
  let result = {}
  if (!isApproval.value) {
    result = {
      org_id: userInfo.value.org_id,
      office: header.value.office,
      tn_number: header.value.tn_number,
      tn_planned_date: header.value.tn_planned_date,
      commodity_inspection: header.value.commodity_inspection,
      status: header.value.status,
      created_by: header.value.created_by,
      creation_date: header.value.creation_date,
      version: header.value.version,
      list: dataList.value,
      select_list: selectedRowsList.value,
      tn_header_id: header.value.tn_header_id,
      tn_line_ids: selectedRowsList.value.map((item: any) => {
        return item.tn_line_id
      })
    }
  }

  if (!needValidation) return result
  await Promise.all([headerFormRef.value?.validate(), formRef.value?.validate()])
  return result
}

onMounted(() => {
  getUserInfo()
})

defineExpose({ getFormData })
</script>

<template>
  <el-form ref="headerFormRef" :model="header" :rules="headerRules" label-position="top">
    <el-row>
      <el-col :span="6">
        <el-form-item :label="t('transferNoteApproval.office')">
          <el-input v-model="header.office" disabled style="width: 90%" />
        </el-form-item>
        <el-form-item :label="t('transferNoteApproval.status')" prop="status">
          <el-input v-model="header.status" disabled style="width: 90%" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="t('transferNoteApproval.tnNumber')">
          <el-input v-model="header.tn_number" style="width: 90%" @change="getTNData" />
        </el-form-item>
        <el-form-item :label="t('transferNoteApproval.createdBy')">
          <el-input v-model="header.created_by" disabled style="width: 90%" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="t('transferNoteApproval.tnPlannedDate')">
          <el-input v-model="header.tn_planned_date" disabled style="width: 90%" />
        </el-form-item>
        <el-form-item :label="t('transferNoteApproval.creationDate')">
          <el-input v-model="header.creation_date" disabled style="width: 90%" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="t('transferNoteApproval.commodityInspection')">
          <el-input v-model="header.commodity_inspection" disabled style="width: 90%" />
        </el-form-item>
        <el-form-item :label="t('transferNoteApproval.version')">
          <el-input v-model="header.version" disabled style="width: 90%" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>

  <div class="tn-review-table" :class="{ 'tn-review-table--approval': isApproval }">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div v-if="!isApproval" class="table-header-center">
          <el-divider content-position="left">{{ t('transferNoteApproval.selectLinesToCancel') }}</el-divider>

          <el-form ref="formRef" :model="selectData" :rules="rules" label-position="left">
            <el-form-item :label="t('transferNoteApproval.selectedQuantity')" prop="selectedRowsListLength" style="width: 100%">
              <el-input v-model="selectData.selectedRowsListLength" disabled />
            </el-form-item>
          </el-form>
        </div>

        <div v-else class="table-header-center">
          <el-divider content-position="left">
            <span style="font-weight: bold; font-size: 16px">{{ $t('transferNoteApproval.linesPendingApproval') }}</span>
            {{
              t('transferNoteApproval.linesPendingApprovalCancellation', {
                selected: selectedRowsList.length,
                total: allList.length
              })
            }}
          </el-divider>
          <el-button type="primary" @click="handleShowData">
            {{ !showAll ? t('transferNoteApproval.showCancelLines') : t('transferNoteApproval.showAllLines') }}
          </el-button>
        </div>
      </template>

      <template #cancel_reason="{ row, index }">
        <el-input v-model="row.cancel_reason" :disabled="isApproval" />
      </template>
    </VxeGrid>
  </div>
</template>

<style scoped lang="scss">
.table-header-center {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
}

.table-header-center .el-divider {
  flex: 1;
  margin: 0;
}

.table-header-center .el-form-item {
  margin-bottom: 0;
}

.tn-review-table {
  height: 70vh;

  &--approval {
    height: 50vh;
  }

  :deep(.vxe-body--row.row--cancel-highlight) {
    background-color: #fff8e1;

    .vxe-body--column {
      background-color: #fff8e1;
    }
  }
}
</style>
