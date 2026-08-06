<script setup lang="ts">
import { ElMessage } from 'element-plus'
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const formWidgetProformaInvoicePreloadTable = ref()
const temporary_list = ref<any[]>([])

function handleSearch() {
  console.log('formData', formData)

  if ((!formData.customer_number && !formData.so_number) || (formData.customer_number === '' && formData.so_number === '')) {
    ElMessage.error('請填寫客戶編號或訂單編號')
    return
  }

  if (formData.customer_number !== 'CUST-0122') {
    temporary_list.value = []
    formWidgetProformaInvoicePreloadTable.value.reload()
    return
  }

  temporary_list.value = [
    {
      order_number: 'SO-2026-0001',
      customer_number: 'CUST-0122',
      customer_name: '普瑞斯電路板製造',
      customer_engineer_name: 'Precise PCB Manufacturing Co.Ltd.',
      part_number: 'KOA/RS73F1JTTD 3002B',
      order_quantity: 100,
      pi_number: 80,
      description: 'CHIP.RES 0603 30K OHM 0.1% 1/5W Sn MPQ=5K/R MOQ=5000',
      sub_inventory: 'FG',
      tax_code: 'VAT0',
      currency: 'HKD',
      amount: 1250.0,
      bill_to_location: 'Hong Kong Island',
      ship_to_location: 'Kowloon Bay Warehouse'
    },
    {
      order_number: 'SO-2026-0001',
      customer_number: 'CUST-0122',
      customer_name: '普瑞斯電路板製造',
      customer_engineer_name: 'Precise PCB Manufacturing Co.Ltd.',
      part_number: 'KOA/RN73H1JTTD 3001B25',
      order_quantity: 250,
      pi_number: 200,
      description: 'CHIP.RES 0603 3K OHM 0.1% 1/10W Sn MPQ=5K/R MOQ=5000',
      sub_inventory: 'FG',
      tax_code: 'VAT5',
      currency: 'HKD',
      amount: 2062.5,
      bill_to_location: 'Hong Kong Island',
      ship_to_location: 'Kowloon Bay Warehouse'
    },
    {
      order_number: 'SO-2026-0002',
      customer_number: 'CUST-0122',
      customer_name: '普瑞斯電路板製造',
      customer_engineer_name: 'Precise PCB Manufacturing Co.Ltd.',
      part_number: 'KOA/RS73F1JTTD 3002B',
      order_quantity: 50,
      pi_number: 50,
      description: 'CHIP.RES 0603 30K OHM 0.1% 1/5W Sn MPQ=5K/R MOQ=5000',
      sub_inventory: 'WIP',
      tax_code: 'VAT0',
      currency: 'USD',
      amount: 2140.0,
      bill_to_location: 'Shenzhen Nanshan',
      ship_to_location: 'Shenzhen Baoan Factory'
    },
    {
      order_number: 'SO-2026-0003',
      customer_number: 'CUST-0122',
      customer_name: '普瑞斯電路板製造',
      customer_engineer_name: 'Precise PCB Manufacturing Co.Ltd.',
      part_number: 'KOA/RS73F1JTTD 3002B',
      order_quantity: 1000,
      pi_number: 800,
      description: 'CHIP.RES 0603 30K OHM 0.1% 1/5W Sn MPQ=5K/R MOQ=5000',
      sub_inventory: 'RM',
      tax_code: 'VAT8',
      currency: 'CNY',
      amount: 1200.0,
      bill_to_location: 'Guangzhou Tianhe',
      ship_to_location: 'Guangzhou Huangpu Port'
    },
    {
      order_number: 'SO-2026-0004',
      customer_number: 'CUST-0122',
      customer_name: '普瑞斯電路板製造',
      customer_engineer_name: 'Precise PCB Manufacturing Co.Ltd.',
      part_number: 'KOA/RS73F1JTTD 3002B',
      order_quantity: 80,
      pi_number: 75,
      description: 'CHIP.RES 0603 30K OHM 0.1% 1/5W Sn MPQ=5K/R MOQ=5000',
      sub_inventory: 'FG',
      tax_code: 'VAT5',
      currency: 'USD',
      amount: 1904.0,
      bill_to_location: 'Taipei Neihu',
      ship_to_location: 'Hsinchu Science Park'
    },
    {
      order_number: 'SO-2026-0005',
      customer_number: 'CUST-0122',
      customer_name: '普瑞斯電路板製造',
      customer_engineer_name: 'Precise PCB Manufacturing Co.Ltd.',
      part_number: 'KOA/RS73F1JTTD 3002B',
      order_quantity: 120,
      pi_number: 100,
      description: 'CHIP.RES 0603 30K OHM 0.1% 1/5W Sn MPQ=5K/R MOQ=5000',
      sub_inventory: 'FG',
      tax_code: 'VAT0',
      currency: 'USD',
      amount: 3600.0,
      bill_to_location: 'Singapore CBD',
      ship_to_location: 'Jurong Port Warehouse'
    }
  ]
  formWidgetProformaInvoicePreloadTable.value.reload()
}

function handleClear() {
  temporary_list.value = []
  formWidgetProformaInvoicePreloadTable.value.reload()
}

function handleRemoveUnSelectedLines(selectedRows: any[]) {
  temporary_list.value = selectedRows
  formWidgetProformaInvoicePreloadTable.value.reload()
}

function handleDelete(row: any) {
  temporary_list.value = temporary_list.value.filter((item: any) => item.order_number !== row.order_number)
  formWidgetProformaInvoicePreloadTable.value.reload()
}

function init() {
  temporary_list.value = formData.order_item_list

  nextTick(() => {
    formWidgetProformaInvoicePreloadTable.value.reload()
  })
}

async function getFormData(needValidation = true) {
  const list = temporary_list.value.map((item: any) => {
    delete item['_X_ROW_KEY']
    return item
  })

  const result = {
    order_item_list: list
  }
  if (!needValidation) return result
  return result
}

watch(
  () => formData.order_item_list,
  (value) => {
    if (!!value && value.length > 0) {
      init()
    }
  },
  { immediate: true, deep: true }
)

defineExpose({ getFormData })
</script>

<template>
  <el-button type="primary" style="width: 100%; margin-block-end: 20px" @click="handleSearch">搜索 Search</el-button>
  <el-divider content-position="left">暫存表 Temporary Table</el-divider>

  <FormWidgetProformaInvoicePreloadTable
    ref="formWidgetProformaInvoicePreloadTable"
    :disabled="false"
    :temporary_list="temporary_list"
    @clear="handleClear"
    @removeUnSelectedLines="handleRemoveUnSelectedLines"
    @delete="handleDelete"
  />
</template>

<style scoped lang="scss"></style>
