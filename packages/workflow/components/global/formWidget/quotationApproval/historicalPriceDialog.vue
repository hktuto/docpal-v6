<script setup lang="ts">
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const emits = defineEmits(['submit'])
const showDialog = ref<boolean>(false)
const searchData = ref<any>({
  org_id: 0,
  brand: '',
  currency: '',
  part_number: '',
  series: '',
  date_range: [],
  type: ''
})
const index = ref<number>()
const selectList = ref<any[]>([])
const routerProvider = inject(MenuRouterKey)

const { tableConfig, tableEvent, tableRef, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-user-table',
  api: async (pageParams: any) => {
    console.log(12222)
    return handleSearch(pageParams)
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
    org_id: item.org_id,
    brand: item.brand,
    currency: item.currency,
    part_number: item.part_number || '',
    series: item.series ?? ''
  }
  index.value = item.index
}

async function handleSearch(pageParams: any) {
  try {
    const body: any = {
      currency: searchData.value.currency,
      part_number: searchData.value.part_number,
      org_id: searchData.value.org_id,
      brand: searchData.value.brand,
      page: pageParams.pageNum + 1,
      size: pageParams.pageSize
    }
    if (searchData.value.series !== '') {
      body.series = searchData.value.series
    }
    if (!!searchData.value.date_range && searchData.value.date_range.length > 1) {
      body.start_date = searchData.value.date_range[0]
      body.end_date = searchData.value.date_range[1]
    }
    if (!!searchData.value.type) {
      body.type = searchData.value.type
    }
    console.log(123, body)

    const data = await $api.post('/apis/v1/ms/oracle/quotation/cost-history', body).then((r: any) => r.data)
    console.log(123, data)
    // const data = [
    //   {
    //     currency: 'EUR',
    //     poCustomer: 'Cust for Quotation',
    //     item: 'ICHAUS/IC-HG30 QFN28-5X5',
    //     poNumber: '112000104',
    //     cost: 3.92,
    //     quantity: 73,
    //     creationDate: '2024-10-25',
    //     noteToVendor: 'E/F/XIAO TIAN LI',
    //     type: 'QUOTATION',
    //     rowId: 1,
    //     moq: 73
    //   }
    // ]
    tableRef.value?.loadData(data)
  } catch (e) {
    console.log(e)
  }
}

function handleSubmit() {
  const uniqueCurrencies = new Set(selectList.value.map((item) => item.currency))
  if (uniqueCurrencies.size > 1) {
    ElMessage({
      message: '只允許選擇一個幣種的階梯。',
      type: 'warning',
      plain: true
    })
    return
  }

  const list = selectList.value
    .sort((a, b) => {
      const am = a.moq == null ? Infinity : Number(a.moq)
      const bm = b.moq == null ? Infinity : Number(b.moq)
      if (am !== bm) return am - bm
      return Number(b.cost) - Number(a.cost)
    })
    .map((item: any) => ({
      moq: item.moq,
      quantity: item.quantity,
      cost: item.cost,
      currency: item.currency,
      poCustomer: item.poCustomer
    }))
  emits('submit', { index: index.value, list })
  showDialog.value = false
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="showDialog" title="歷史價格 historical price" class="big" append-to-body>
    <div style="height: 600px">
      <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <el-form :inline="true" label-position="top" class="historical-price-filter-form">
            <el-form-item label="型號 Part Number" prop="part_number">
              <el-input v-model="searchData.part_number" disabled />
            </el-form-item>
            <el-form-item label="系列 Series" prop="series">
              <el-input v-model="searchData.series" disabled />
            </el-form-item>
            <el-form-item label="日期范圍 Date Range" prop="date_range">
              <el-date-picker v-model="searchData.date_range" type="daterange" format="YYYY/MM/DD" value-format="x" />
            </el-form-item>
            <el-form-item label="類型 Type" prop="type">
              <el-select v-model="searchData.type" placeholder="請選擇類型" clearable>
                <el-option label="已購訂單 PO" value="PO" />
                <el-option label="訂單 Quotation" value="Quotation" />
              </el-select>
            </el-form-item>
            <el-form-item class="historical-price-filter-form__action">
              <el-button type="primary" @click="reload">{{ $t('Search') }}</el-button>
            </el-form-item>
          </el-form>
        </template>
      </VxeGrid>
    </div>

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
    width: 220px;
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
