<script lang="ts" setup>
import { clientApi } from 'api'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const selectedItem = ref<any>([]);


const batchDownloading = ref(false)
const downloadingRowKey = ref<string | null>(null)

async function downloadSingle(doc: any) {
  downloadingRowKey.value = doc._rowKey
  try {
    await doDownload([doc])
  } finally {
    downloadingRowKey.value = null
  }
}

async function downloadBatch(docs: any[]) {
  batchDownloading.value = true
  try {
    await doDownload(docs)
  } finally {
    batchDownloading.value = false
  }
}

async function doDownload(docs: any[]) {
  const documents = docs.map(doc => ({
    orgId: doc.org_id,
    invoiceNo: doc.pi_num,
    versionNo: doc.version_no
  }))
  const fileName = dayjs().format('YYYY-MM-DD')
  const userId = useUserId()
  const body = {
    "type": "print-hk",
    "documents": [
      ...documents
    ],
    "ckStatus": "Y",
    "operatorId": userId.value,
    "operatorName": userId.value,
    "fileName": fileName,
  }
  try {
    const res = await clientApi.instance.post(`/v1/ms/oracle/shipping-copy/download`, body, {
      baseURL: '/apis',
      responseType: 'blob',
      headers: {
        noThrowError: true
      }
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(res.data)
    a.download = fileName
    a.click()
    a.remove()
    docs.forEach((doc) => {
      doc.download_count = (doc.download_count || 0) + 1
    })
    cleanSelected()
  } catch (err) {
    ElMessage.error(t('shipCopy.downloadFailed'))
  }
}


const filterForm = reactive({
  orgId: '',
  invoiceNo: '',
  customerId: '',
  invoiceDateStart: '',
  invoiceDateEnd: ''
})

const orgOptions = ref<any[]>([])
async function getOrgOptions() {
  const res = await clientApi.instance.get(`/v1/ms/oracle/org-mapping`, {
    baseURL: '/apis'
  })
  orgOptions.value = (res.data.items || []).map((item: any) => ({
    label: item.organization_code,
    value: String(item.org_id)
  }))
}

const customerOptions = ref<any[]>([])
const customerLoading = ref(false)
let customerSearchTimer: ReturnType<typeof setTimeout> | undefined

function searchCustomers(query: string) {
  clearTimeout(customerSearchTimer)
  customerSearchTimer = setTimeout(async () => {
    customerLoading.value = true
    try {
      const res = await clientApi.instance.get(`/v1/ms/oracle/customers?q=${encodeURIComponent(query)}&limit=50`, {
        baseURL: '/apis'
      })
      const options = (res.data.items || []).map((item: any) => ({
        label: item.customer_name,
        value: String(item.cust_account_id)
      }))
      // keep the currently selected option so its label doesn't disappear after searching
      const selected = customerOptions.value.find(o => o.value === filterForm.customerId)
      customerOptions.value = selected && !options.some(o => o.value === selected.value)
        ? [selected, ...options]
        : options
    } finally {
      customerLoading.value = false
    }
  }, 300)
}

const { tableConfig, tableEvent, tableRef, setupLazyLoad } = useVxeTable({
  id: "shipConfirmTable",
  virtualScroll:true,
  api: async (pageParams: any) => {
    const query = new URLSearchParams({
      pageNum: String(pageParams?.page?.currentPage || 1),
      pageSize: '20'
    })
    if (filterForm.orgId) query.set('orgId', filterForm.orgId)
    if (filterForm.invoiceNo) query.set('invoiceNo', filterForm.invoiceNo)
    if (filterForm.customerId) query.set('customerId', filterForm.customerId)
    if (filterForm.invoiceDateStart) query.set('invoiceDateStart', filterForm.invoiceDateStart)
    if (filterForm.invoiceDateEnd) query.set('invoiceDateEnd', filterForm.invoiceDateEnd)
    const res = await clientApi.instance.get(`/v1/ms/oracle/shipping-copy/list-latest?${query.toString()}`, {
      baseURL:'/apis'
    })
    return {
      result: (res.data.items || []).map((item: any) => ({
        ...item,
        _rowKey: `${item.org_id}_${item.pi_num}`,
        hasChild: item.version_no > 1
      })),
      page: {
        total: res.data.total,
        currentPage: res.data.pageNum
      }
    }
  },
  optionalConfig: {
    treeConfig: {
      transform: false,
      rowField: '_rowKey',
      childrenField: 'children',
      lazy: true,
      showLine: true,
      hasChildField: 'hasChild',
      loadMethod: async ({ row }: any) => {
        const res = await clientApi.instance.get(`/v1/ms/oracle/shipping-copy/history?orgId=${row.org_id}&invoiceNo=${encodeURIComponent(row.pi_num)}`, {
          baseURL: '/apis'
        })
        return (res.data.items || []).map((item: any) => ({
          ...item,
          _rowKey: `${item.org_id}_${item.pi_num}_${item.version_no}`,
          hasChild: false
        }))
      }
    }
  },
  columns: [
    {
      type: 'checkbox',
      width: 50
    },
    {
      title: t('shipCopy.orgInvoiceVersion'),
      type: "html",
      width: 250,
      treeNode: true,
      formatter: ({ cellValue, row }: any) => {
        return `${row.org_id} / ${row.pi_num} / <div class="el-tag">${row.version_no}</div>`
      }
    },
    {
      field: "customer_name",
      title: t('shipCopy.customer'),
    }, {
      field: "old_plan_date",
      title: t('shipCopy.invoiceDate'),
      formatter: ({ cellValue }: any) => {
        return formatDate(cellValue, 'YYYY-MMM-DD')
      }
    }, {
      field: "new_plan_date",
      title: t('shipCopy.planDate'),
      formatter: ({ cellValue }: any) => {
        return formatDate(cellValue, 'YYYY-MMM-DD')
      }
    }, {
      field: "download_count",
      title: t('shipCopy.downloadCount'),
    }, {
      title: t('shipCopy.download'),
      slots: {
        default: "download"
      }
    }
  ],
  selectChangeHander: (selectedRows: any[]) => {
    selectedItem.value = selectedRows
  }
})

function cleanSelected() {
  selectedItem.value = []
  tableRef.value?.setAllCheckboxRow(false)
}

function handleFilter() {
  cleanSelected()
  // re-run setupLazyLoad to reset data/paging and reload with current filters
  setupLazyLoad()
}

function handleResetFilter() {
  filterForm.orgId = ''
  filterForm.invoiceNo = ''
  filterForm.customerId = ''
  filterForm.invoiceDateStart = ''
  filterForm.invoiceDateEnd = ''
  handleFilter()
}

// start date cannot be after selected end date, and vice versa
function disabledStartDate(date: Date) {
  return filterForm.invoiceDateEnd ? dayjs(date).isAfter(filterForm.invoiceDateEnd, 'day') : false
}
function disabledEndDate(date: Date) {
  return filterForm.invoiceDateStart ? dayjs(date).isBefore(filterForm.invoiceDateStart, 'day') : false
}

onMounted(() => {
  setupLazyLoad()
  getOrgOptions()
  searchCustomers('')
})

</script>

<template>
<DashboardCard :title="t('shipCopy.title')">
    <VxeGrid
        ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <slot name="toolbar_buttons" />
          <template v-if="selectedItem.length > 0">
            <ElButton @click="cleanSelected">{{ t('shipCopy.cleanSelected', { count: selectedItem.length }) }}</ElButton>
            <ElButton :loading="batchDownloading" @click="downloadBatch(selectedItem)" type="primary">{{ t('shipCopy.downloadSelected') }}</ElButton>
          </template>
          <template v-else>
            <ElSelect v-model="filterForm.orgId" :placeholder="t('shipCopy.org')" clearable filterable class="filter-item filter-select" @change="handleFilter">
              <ElOption v-for="item in orgOptions" :key="item.value" :label="item.label" :value="item.value" />
            </ElSelect>
            <ElInput v-model="filterForm.invoiceNo" :placeholder="t('shipCopy.invoiceNo')" clearable class="filter-item filter-input" @change="handleFilter" @keyup.enter="handleFilter" />
            <ElSelect
              v-model="filterForm.customerId"
              :placeholder="t('shipCopy.customer')"
              clearable
              filterable
              remote
              :remote-method="searchCustomers"
              :loading="customerLoading"
              class="filter-item filter-select filter-select--wide"
              @change="handleFilter"
            >
              <ElOption v-for="item in customerOptions" :key="item.value" :label="item.label" :value="item.value" />
            </ElSelect>
            <ElDatePicker
              v-model="filterForm.invoiceDateStart"
              type="date"
              :placeholder="t('shipCopy.invoiceDateFrom')"
              value-format="YYYY-MM-DD"
              clearable
              class="filter-item filter-date"
              :disabled-date="disabledStartDate"
              @change="handleFilter"
            />
            <ElDatePicker
              v-model="filterForm.invoiceDateEnd"
              type="date"
              :placeholder="t('shipCopy.invoiceDateTo')"
              value-format="YYYY-MM-DD"
              clearable
              class="filter-item filter-date"
              :disabled-date="disabledEndDate"
              @change="handleFilter"
            />
            <ElButton @click="handleResetFilter">{{ t('shipCopy.reset') }}</ElButton>
          </template>
        </template>
        <template #download="{ row }">
          <ElButton :loading="downloadingRowKey === row._rowKey" @click="downloadSingle(row)" type="primary">{{ t('shipCopy.download') }}</ElButton>
        </template>
    </VxeGrid>
</DashboardCard>
</template>

<style lang="scss" scoped>
.filter-item {
  margin-right: 8px;
}
.filter-select {
  width: 120px;
}
.filter-select--wide {
  width: 200px;
}
.filter-input {
  width: 160px;
}
.filter-date {
  width: 150px;
}
</style>
