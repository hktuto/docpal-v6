<script setup lang="ts">
const { t } = useI18n()
const emits = defineEmits(['submit'])
const showDialog = ref<boolean>(false)
const searchData = ref<any>({
  brand: '',
  currency: '',
  part_number: '',
  series: '',
  date_range: [],
  type: ''
})
const index = ref<number>()
const selectList = ref<any[]>([])
const { tableConfig, tableEvent, tableRef, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-user-table',
  api: async (pageParams: any) => {
    return handleSearch()
  },
  columns: [
    { field: 'poNumber', title: '編號 Number', fixed: 'left', type: 'checkbox', width: 200 },
    { field: 'type', title: '類型 Type', width: 130 },
    { field: 'item', title: '項 Item', width: 300 },
    { field: 'moq', title: '起訂量 MOQ' },
    { field: 'quantity', title: '數量 Quantity', width: 200 },
    { field: 'cost', title: '成本 Cost' },
    { field: 'currency', title: '貨幣 Currency' },
    { field: 'poCustomer', title: '客戶 Customer', width: 400 },
    {
      field: 'creationDate',
      title: '生效日期 Effective Date',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      },
      width: 200
    },
    { field: 'noteToVendor', title: '供應商注意事項 Note to Vendor', width: 300 }
  ],
  selectChangeHander: (selectedRows: any[]) => {
    selectList.value = [...selectedRows]
  },
  optionalConfig: {
    scrollX: {
      enabled: true,
      gt: 40
    },
    autoResize: true
  }
})

function open(item: any) {
  showDialog.value = true
  searchData.value = {
    brand: item.brand,
    part_number: item.part_number || '',
    series: item.series || ''
  }
  index.value = item.index
}

async function handleSearch() {
  // tableData.value = [{}]
  // cell API Get data

  // test Data
  const data = [
    {
      currency: 'EUR',
      poCustomer: 'Cust for Quotation',
      item: 'ICHAUS/IC-HG30 QFN28-5X5',
      poNumber: '112000104',
      cost: 3.92,
      quantity: 73,
      creationDate: '2024-10-25',
      noteToVendor: 'E/F/XIAO TIAN LI',
      type: 'QUOTATION',
      rowId: 1,
      moq: 73
    },
    {
      currency: 'EUR',
      poCustomer: 'Cust for Quotation',
      item: 'ICHAUS/IC-HG30 QFN28-5X5',
      poNumber: '112000104',
      cost: 6,
      quantity: 1,
      creationDate: '2023-04-10',
      noteToVendor: 'E/F/XIAO TIAN LI',
      type: 'QUOTATION',
      rowId: 2,
      moq: 73
    },
    {
      currency: 'EUR',
      poCustomer: 'Cust for Quotation',
      item: 'ICHAUS/IC-HG30 QFN28-5X5',
      poNumber: '112000104',
      cost: 2.97,
      quantity: 250000,
      creationDate: '2022-12-15',
      noteToVendor: 'E/F/XIAO TIAN LI',
      type: 'QUOTATION',
      rowId: 3,
      moq: 73
    },
    {
      currency: 'EUR',
      poCustomer: 'Cust for Quotation',
      item: 'ICHAUS/IC-HG30 QFN28-5X5',
      poNumber: '112000104',
      cost: 4.09,
      quantity: 10000,
      creationDate: '2022-12-15',
      noteToVendor: 'E/F/XIAO TIAN LI',
      type: 'QUOTATION',
      rowId: 4,
      moq: 73
    },
    {
      currency: 'EUR',
      poCustomer: 'Cust for Quotation',
      item: 'ICHAUS/IC-HG30 QFN28-5X5',
      poNumber: '112000104',
      cost: 3.12,
      quantity: 100000,
      creationDate: '2022-12-15',
      noteToVendor: 'E/F/XIAO TIAN LI',
      type: 'QUOTATION',
      rowId: 5,
      moq: 73
    },
    {
      currency: 'EUR',
      poCustomer: 'Cust for Quotation',
      item: 'ICHAUS/IC-HG30 QFN28-5X5',
      poNumber: '112000104',
      cost: 3.83,
      quantity: 20000,
      creationDate: '2022-12-15',
      noteToVendor: 'E/F/XIAO TIAN LI',
      type: 'QUOTATION',
      rowId: 6,
      moq: 73
    },
    {
      currency: 'EUR',
      poCustomer: 'Cust for Quotation',
      item: 'ICHAUS/IC-HG30 QFN28-5X5',
      poNumber: '112000104',
      cost: 3.39,
      quantity: 50000,
      creationDate: '2022-12-15',
      noteToVendor: 'E/F/XIAO TIAN LI',
      type: 'QUOTATION',
      rowId: 7,
      moq: 73
    },
    {
      currency: 'EUR',
      poCustomer: '合肥美亚光电技术股份有限公司',
      item: 'ICHAUS/IC-HG30 QFN28-5X5',
      poNumber: '339080480',
      cost: 3.92,
      quantity: 73,
      creationDate: '2026-04-02',
      noteToVendor: null,
      type: 'PO',
      rowId: 8,
      moq: null
    },
    {
      currency: 'EUR',
      poCustomer: '梅卡曼德（雄安）机器人科技股份有限公司',
      item: 'ICHAUS/IC-HG30 QFN28-5X5',
      poNumber: '349021829',
      cost: 3.92,
      quantity: 1460,
      creationDate: '2026-04-01',
      noteToVendor: null,
      type: 'PO',
      rowId: 9,
      moq: null
    },
    {
      currency: 'EUR',
      poCustomer: '合肥瑞识智能科技有限公司',
      item: 'ICHAUS/IC-HG30 QFN28-5X5',
      poNumber: '339080258',
      cost: 3.92,
      quantity: 73,
      creationDate: '2026-03-25',
      noteToVendor: null,
      type: 'PO',
      rowId: 10,
      moq: null
    }
  ]
  tableRef.value?.loadData(data)
}

function handleSubmit() {
  const list = selectList.value
    .sort((a, b) => {
      const am = a.moq == null ? -Infinity : Number(a.moq)
      const bm = b.moq == null ? -Infinity : Number(b.moq)
      return bm - am
    })
    .map((item: any) => ({
      moq: item.moq,
      quantity: item.quantity,
      cost: item.cost,
      currency: item.currency
    }))
  emits('submit', { index: index.value, list })
  showDialog.value = false
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="showDialog" title="歷史價格 historical price" class="big" append-to-body>
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <el-form :inline="true" label-position="top" class="historical-price-filter-form">
          <el-form-item label="型號 Part Number" prop="part_number">
            <el-input v-model="searchData.part_number" disabled />
          </el-form-item>
          <el-form-item label="系列 Series" prop="series">
            <el-input v-model="searchData.series" clearable />
          </el-form-item>
          <el-form-item label="日期范圍 Date Range" prop="date_range">
            <el-date-picker v-model="searchData.date_range" type="daterange" format="YYYY-MM-DD" value-format="x" />
          </el-form-item>
          <el-form-item label="類型 Type" prop="type">
            <el-select v-model="searchData.type" placeholder="請選擇類型" clearable>
              <el-option label="已購訂單 PO" value="PO" />
              <el-option label="訂單 Quotation" value="Quotation" />
            </el-select>
          </el-form-item>
          <el-form-item class="historical-price-filter-form__action">
            <el-button type="primary" @click="handleSearch">{{ $t('Search') }}</el-button>
          </el-form-item>
        </el-form>
      </template>
    </VxeGrid>

    <template #footer>
      <el-button type="primary" @click="handleSubmit">{{ $t('common_submit') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.historical-price-filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
  width: 100%;

  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 0;
  }

  :deep(.el-form-item__label) {
    line-height: 1.4;
    padding-bottom: 4px;
  }

  :deep(.el-input),
  :deep(.el-select) {
    width: 180px;
  }

  :deep(.el-date-editor) {
    width: 260px;
  }

  &__action {
    :deep(.el-form-item__label) {
      visibility: hidden;
    }
  }
}
</style>
