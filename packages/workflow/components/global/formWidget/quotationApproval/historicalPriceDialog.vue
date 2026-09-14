<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { clientApi } from 'api'

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
    return handleSearch(pageParams)
  },
  columns: [
    { field: 'po_number', title: t('quotationApproval.number'), fixed: 'left', type: 'checkbox', width: 200 },
    { field: 'type', title: t('quotationApproval.type'), width: 130 },
    { field: 'item', title: t('quotationApproval.item'), width: 300 },
    { field: 'moq', title: t('quotationApproval.moq') },
    { field: 'quantity', title: t('quotationApproval.quantity'), width: 200 },
    { field: 'cost', title: t('quotationApproval.cost') },
    { field: 'currency', title: t('quotationApproval.currency') },
    { field: 'po_customer', title: t('quotationApproval.customer'), width: 400 },
    {
      field: 'creation_date',
      title: t('quotationApproval.effectiveDate'),
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      },
      width: 200
    },
    { field: 'note_to_vendor', title: t('quotationApproval.noteToVendor'), width: 300 }
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
  reload()
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

    const response = await clientApi.instance.post('/apis/v1/ms/oracle/quotation/cost-history', body).then((r: any) => r.data)
    const data = {
      entryList: response.items ?? [],
      totalSize: response.total ?? response.count ?? 0
    }
    return { data }
  } catch (e) {
    console.log(e)
  }
}

function handleSubmit() {
  const uniqueCurrencies = new Set(selectList.value.map((item) => item.currency))
  if (uniqueCurrencies.size > 1) {
    ElMessage({
      message: t('quotationApproval.singleCurrencyTierOnly'),
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
      poCustomer: item.poCustomer,
      exchangeRate: item.exchange_rate,
      type: item.type
    }))
  emits('submit', { index: index.value, list })
  showDialog.value = false
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="showDialog" :title="t('quotationApproval.historicalPrice')" class="big" append-to-body>
    <div style="height: 600px">
      <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <el-form :inline="true" label-position="top" class="historical-price-filter-form">
            <el-form-item :label="t('quotationApproval.partNumber')" prop="part_number">
              <el-input v-model="searchData.part_number" disabled />
            </el-form-item>
            <el-form-item :label="t('quotationApproval.series')" prop="series">
              <el-input v-model="searchData.series" disabled />
            </el-form-item>
            <el-form-item :label="t('quotationApproval.dateRange')" prop="date_range">
              <el-date-picker v-model="searchData.date_range" type="daterange" format="YYYY/MM/DD" value-format="x" />
            </el-form-item>
            <el-form-item :label="t('quotationApproval.type')" prop="type">
              <el-select v-model="searchData.type" :placeholder="t('quotationApproval.selectType')" clearable>
                <el-option :label="t('quotationApproval.typePo')" value="PO" />
                <el-option :label="t('quotationApproval.typeQuotation')" value="Quotation" />
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
