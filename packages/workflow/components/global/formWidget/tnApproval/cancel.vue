<script setup lang="ts">
import { clientApi } from 'api'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const showAll = ref<boolean>(true)
const tnList = ref<any[]>([])
const dataList = ref<any[]>([])
const userInfo = ref<any>({
  user: '',
  office: '',
  org_id: ''
})
const isApproval = ref<boolean>(false)
const selectedRowsList = ref<any[]>([])
const header = ref<{
  office: string
  tn_number: string
  tn_planned_date: string
  commodity_inspection: string
  status: string
  created_by: string
  creation_date: string
  version: string
}>({
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
const selectData = reactive({
  selectedRowsListLength: 0
})

watch(
  () => selectedRowsList.value,
  (value) => {
    selectData.selectedRowsListLength = value.length
  },
  { deep: true }
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

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'tnApprovalReviewTable',
  api: () => {
    return dataList.value
  },
  columns: [
    {
      type: 'checkbox',
      width: 60,
      align: 'center',
      fixed: 'left'
    },
    {
      field: 'tn_line_num',
      title: t('transferNoteApproval.tnLineNumber'),
      align: 'center',
      minWidth: 100
    },
    {
      field: 'line_num',
      title: t('transferNoteApproval.poLineNumber'),
      minWidth: 100
    },
    {
      field: 'po_number',
      title: t('transferNoteApproval.poNumber'),
      minWidth: 240
    },
    {
      field: 'item',
      title: t('transferNoteApproval.wclPartNumber'),
      minWidth: 240
    },
    {
      field: 'item_origin',
      title: t('transferNoteApproval.origin'),
      minWidth: 100
    },
    {
      field: 'qty_delivered_onhand',
      title: t('transferNoteApproval.onHandQty'),
      minWidth: 240
    },
    {
      field: 'from_subinventory',
      title: t('transferNoteApproval.fromSubInventory'),
      minWidth: 240
    },
    {
      field: 'to_subinventory',
      title: t('transferNoteApproval.toSubInventory'),
      minWidth: 240
    },
    {
      field: 'transfer_quantity',
      title: t('transferNoteApproval.transferQty'),
      minWidth: 140
    },
    {
      field: 'unit_price_in_hkd',
      title: t('transferNoteApproval.unitPrice'),
      minWidth: 160
    },
    {
      field: 'amount_in_hkd',
      title: t('transferNoteApproval.amount'),
      minWidth: 150
    },
    {
      field: 'status',
      title: t('transferNoteApproval.lineStatus'),
      minWidth: 240
    },
    {
      field: 'cancel_reason',
      title: t('transferNoteApproval.cancelReason'),
      minWidth: 240,
      slots: { default: 'cancel_reason' }
    }
  ],
  zoom: false,
  refresh: false,
  customeToolBar: false,
  virtualScroll: true,
  remoteSort: false,
  remoteFilter: false,
  saveColumnOrder: false,
  selectChangeHander: (selectedRows: any[]) => {
    selectedRowsList.value = selectedRows
  }
})

function handleShowData() {
  const data = showAll ? [] : dataList.value
  tableRef.value.loadData(data)
  // reload()
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
  tnList.value = []
  dataList.value = []

  nextTick(() => reload())
}

async function getTNData(tnNumber: string) {
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

  const dataHeader = data[0].header
  header.value = {
    ...dataHeader
  }

  dataList.value = data[0].lines
  tableConfig.loading = false
  reload()
}

watch(
  () => formData.tn_number,
  (value) => {
    if (!!value) {
      init(value)
    }
  },
  { immediate: true, deep: true }
)

async function getFormData(needValidation = true) {
  const result = {
    office: header.value.office,
    tn_number: header.value.tn_number,
    tn_planned_date: header.value.tn_planned_date,
    commodity_inspection: header.value.commodity_inspection,
    status: header.value.status,
    created_by: header.value.created_by,
    creation_date: header.value.creation_date,
    version: header.value.version,
    list: dataList.value
  }

  if (!needValidation) return result
  await formRef.value?.validate()
  return result
}

onMounted(() => {
  getUserInfo()
})

defineExpose({ getFormData })
</script>

<template>
  <el-row>
    <el-col :span="6">
      <el-form-item :label="t('transferNoteApproval.office')">
        <el-input v-model="header.office" disabled style="width: 90%" />
      </el-form-item>
      <el-form-item :label="t('transferNoteApproval.status')">
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

  <div class="tn-review-table">
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

        <el-divider v-else content-position="left">
          <span>{{ t('transferNoteApproval.linesPendingApproval') }}</span>

          {{
            t('transferNoteApproval.linesPendingApprovalCancellation', {
              selected: selectedRowsList.length,
              total: dataList.length
            })
          }}
        </el-divider>
        <el-button v-if="isApproval" type="primary" @click="handleShowData">
          {{ showAll ? t('transferNoteApproval.showCancelLines') : t('transferNoteApproval.showAllLines') }}
        </el-button>
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
}
</style>
