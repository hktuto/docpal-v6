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
const tableData = ref<any[]>([])
const selectList = ref<any[]>([])
const { tableConfig, tableEvent, tableRef, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-user-table',
  api: async (pageParams: any) => {
    return tableData.value
  },
  columns: [
    { field: 'type', title: '類型 Type', fixed: 'left', type: 'checkbox' },
    { field: 'number', title: '編號 Number' },
    { field: 'item', title: '項 Item' },
    { field: 'moq', title: '起訂量 MOQ' },
    { field: 'quantity', title: '數量 Quantity' },
    { field: 'cost', title: '成本 Cost' },
    { field: 'currency', title: '貨幣 Currency' },
    { field: 'effective_date', title: '生效日期 Effective Date' },
    { field: 'note_to_vendor', title: '供應商注意事項 Note to Vendor' }
  ],
  selectChangeHander: (selectedRows: any[]) => {
    selectList.value = [...selectedRows]
  }
})

function open(item: any) {
  showDialog.value = true
  searchData.value = {
    brand: item.brand,
    part_number: item.part_number || '',
    series: item.series || ''
  }
}

async function handleSearch() {
  console.log()
}

function handleSubmit() {
  emits('submit', selectList.value)
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="showDialog" title="歷史價格 historical price" class="big">
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
            <el-date-picker v-model="searchData.date_range" type="daterange" format="YYYY-MM-DD" />
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
