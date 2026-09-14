<script lang="ts" setup>
import { clientApi } from 'api'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
const selectedItem = ref<any>([]);


async function downloadSingle(doc: any) {
  downloadBatch([doc])
}

const loading = ref(false)
async function downloadBatch(docs: any[]) {
  loading.value = true
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
  } catch (err) {
    ElMessage.error("Can not download shipping copy")
  } finally {
    loading.value = false
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

const { tableConfig, tableEvent, tableRef, reload, setupLazyLoad } = useVxeTable({
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
      title: "ORG / Invoice# / Version",
      type: "html",
      width: 250,
      treeNode: true,
      formatter: ({ cellValue, row }: any) => {
        return `${row.org_id} / ${row.pi_num} / <div class="el-tag">${row.version_no}</div>`
      }
    },
    {
      field: "customer_name",
      title: "Customer",
    }, {
      field: "old_plan_date",
      title: "Invoice Date",
      formatter: ({ cellValue }: any) => {
        return formatDate(cellValue, 'YYYY-MMM-DD')
      }
    }, {
      field: "new_plan_date",
      title: "Plan Date",
      formatter: ({ cellValue }: any) => {
        return formatDate(cellValue, 'YYYY-MMM-DD')
      }
    }, {
      field: "download_count",
      title: "Download Count",
    }, {
      title: "Download",
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
<DashboardCard title="Invoice (Pending For Ship)">
    <VxeGrid
        v-loading="loading"
        ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <slot name="toolbar_buttons" />
          <template v-if="selectedItem.length > 0">
            <ElButton @click="cleanSelected">Clean Selected({{ selectedItem.length }})</ElButton>
            <ElButton @click="downloadBatch(selectedItem)" type="primary">Download Selected</ElButton>
          </template>
          <template v-else>
            <ElSelect v-model="filterForm.orgId" placeholder="ORG" clearable filterable class="filter-item filter-select" @change="handleFilter">
              <ElOption v-for="item in orgOptions" :key="item.value" :label="item.label" :value="item.value" />
            </ElSelect>
            <ElInput v-model="filterForm.invoiceNo" placeholder="Invoice#" clearable class="filter-item filter-input" @change="handleFilter" @keyup.enter="handleFilter" />
            <ElSelect
              v-model="filterForm.customerId"
              placeholder="Customer"
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
              placeholder="Invoice Date From"
              value-format="YYYY-MM-DD"
              clearable
              class="filter-item filter-date"
              :disabled-date="disabledStartDate"
              @change="handleFilter"
            />
            <ElDatePicker
              v-model="filterForm.invoiceDateEnd"
              type="date"
              placeholder="Invoice Date To"
              value-format="YYYY-MM-DD"
              clearable
              class="filter-item filter-date"
              :disabled-date="disabledEndDate"
              @change="handleFilter"
            />
            <ElButton @click="handleResetFilter">Reset</ElButton>
          </template>
        </template>
        <template #download="{ row }">
          <ElButton @click="downloadSingle(row)" type="primary">Download</ElButton>
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
