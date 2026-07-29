<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, unref, watch } from 'vue'
import { ElCheckbox, ElInputNumber, ElSelectV2 } from 'element-plus'
import type { CheckboxValueType, Column, FormInstance, FormRules } from 'element-plus'
import { getGroupsSelectOption } from '#imports'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'

const { formData } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

interface OrderItem {
  id?: string
  checked: boolean
  index: number
  markup: number | undefined
  moq: number | undefined
  newUnitPrice: number | undefined
  originalUnitPrice: number | string
  currency: string
  customerName: string
  orderNumber: string
  orderType: string
  salesperson: string[]
  userGroup: string
  creationDate: number
  [key: string]: any
}

const userList = ref<{ value: string; label: string; email: string }[]>([])
const groupList = ref<{ value: string; label: string }[]>([])

function renderSelectionCell(props: { value: boolean; intermediate?: boolean; ariaLabel?: string; onChange: (value: CheckboxValueType) => void }) {
  return h(ElCheckbox, {
    modelValue: props.value,
    indeterminate: props.intermediate ?? false,
    'aria-label': props.ariaLabel,
    onChange: props.onChange
  })
}

/** 禁止科学计数法（e/E），可选禁止小数点 */
function blockInvalidNumberKey(event: Event, options?: { allowDecimal?: boolean }) {
  const e = event as KeyboardEvent
  const blocked = options?.allowDecimal === false ? ['e', 'E', '.', '+'] : ['e', 'E', '+']
  if (blocked.includes(e.key)) {
    e.preventDefault()
  }
}

function normalizeSalesperson(value: unknown): string[] {
  if (Array.isArray(value)) return value
  if (value == null || value === '') return []
  return [String(value)]
}

function roundNumber(value: Decimal.Value, precision: number) {
  return new Decimal(value).toDecimalPlaces(precision).toNumber()
}

function handleMarkupChange(rowData: OrderItem, val: number | undefined) {
  rowData.markup = val
  const original = Number(rowData.originalUnitPrice)
  if (val == null || !Number.isFinite(original)) {
    rowData.newUnitPrice = undefined
    return
  }
  /** (1 + markup / 100) * originalUnitPrice = newUnitPrice */
  rowData.newUnitPrice = roundNumber(new Decimal(1).plus(new Decimal(val).div(100)).times(original), 6)
}

function handleNewUnitPriceChange(rowData: OrderItem, val: number | undefined) {
  rowData.newUnitPrice = val
  const original = Number(rowData.originalUnitPrice)
  if (val == null || !Number.isFinite(original) || original === 0) {
    rowData.markup = undefined
    return
  }
  /** markup = (newUnitPrice / originalUnitPrice - 1) * 100 */
  rowData.markup = roundNumber(new Decimal(val).div(original).minus(1).times(100), 2)
}

const listData = ref<OrderItem[]>([])
const selectData = ref<OrderItem[]>([])
const formRef = ref<FormInstance>()
const formModel = reactive({
  selectDataLength: 0
})

const rules: FormRules = {
  selectDataLength: [
    {
      validator: (_rule, value, callback) => {
        if (!value || value == 0) {
          callback(new Error('請選擇需要通知的信息'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

function syncSelectData() {
  selectData.value = listData.value.filter((row: any) => row.checked)
  formModel.selectDataLength = selectData.value.length
  if (formModel.selectDataLength == 0) {
    formRef.value?.validateField('selectDataLength')
  } else {
    formRef.value?.clearValidate('selectDataLength')
  }
}

const columns = computed<Column<OrderItem>[]>(() => {
  const userOptions = userList.value
  const groupOptions = groupList.value

  return [
    {
      key: 'selection',
      title: 'Selection',
      width: 50,
      fixed: true,
      cellRenderer: ({ rowData }) =>
        renderSelectionCell({
          value: rowData.checked,
          ariaLabel: 'Select row',
          onChange: (value) => {
            rowData.checked = !!value
            syncSelectData()
          }
        }),
      headerCellRenderer: () => {
        const rows = unref(listData)
        const allSelected = rows.length > 0 && rows.every((row) => row.checked)
        const containsChecked = rows.some((row) => row.checked)
        return renderSelectionCell({
          value: allSelected,
          intermediate: containsChecked && !allSelected,
          ariaLabel: 'Select all',
          onChange: (value) => {
            const checked = !!value
            listData.value = rows.map((row) => ({ ...row, checked }))
            syncSelectData()
          }
        })
      }
    },
    {
      key: 'index',
      title: 'Index',
      dataKey: 'index',
      width: 100
    },
    {
      key: 'markup',
      title: '幅度 Markup',
      dataKey: 'markup',
      width: 140,
      cellRenderer: ({ rowData }) =>
        h(
          ElInputNumber,
          {
            modelValue: rowData.markup,
            size: 'small',
            controls: false,
            precision: 2,
            step: 0.01,
            placeholder: 'Enter Markup',
            onKeydown: (e: Event) => blockInvalidNumberKey(e),
            'onUpdate:modelValue': (val: number | undefined) => {
              handleMarkupChange(rowData, val)
            }
          },
          {
            suffix: () => h('span', '%')
          }
        )
    },
    {
      key: 'moq',
      title: '起訂量 MOQ',
      dataKey: 'moq',
      width: 140,
      cellRenderer: ({ rowData }) =>
        h(ElInputNumber, {
          modelValue: rowData.moq,
          size: 'small',
          controls: false,
          min: 0,
          precision: 0,
          step: 1,
          stepStrictly: true,
          placeholder: 'Enter MOQ',
          onKeydown: (e: Event) => blockInvalidNumberKey(e, { allowDecimal: false }),
          'onUpdate:modelValue': (val: number | undefined) => {
            rowData.moq = val
          }
        })
    },
    {
      key: 'newUnitPrice',
      title: '新單價 New Unit Price',
      dataKey: 'newUnitPrice',
      width: 160,
      cellRenderer: ({ rowData }) =>
        h(ElInputNumber, {
          modelValue: rowData.newUnitPrice,
          size: 'small',
          controls: false,
          min: 0,
          precision: 6,
          step: 0.000001,
          placeholder: 'Enter Price',
          onKeydown: (e: Event) => blockInvalidNumberKey(e),
          'onUpdate:modelValue': (val: number | undefined) => {
            handleNewUnitPriceChange(rowData, val)
          }
        })
    },
    {
      key: 'originalUnitPrice',
      title: '原單價 Original Unit Price',
      dataKey: 'originalUnitPrice',
      width: 180,
      align: 'center'
    },
    {
      key: 'currency',
      title: '貨幣 Currency',
      dataKey: 'currency',
      width: 120,
      align: 'center'
    },
    {
      key: 'customerName',
      title: '客戶名稱 Customer Name',
      dataKey: 'customerName',
      width: 200
    },
    {
      key: 'orderNumber',
      title: '訂單編號 Order Number',
      dataKey: 'orderNumber',
      width: 200,
      align: 'center'
    },
    {
      key: 'orderType',
      title: '類型 Type',
      dataKey: 'orderType',
      width: 120
    },
    {
      key: 'salesperson',
      title: '銷售員 Salesperson',
      dataKey: 'salesperson',
      width: 180,
      cellRenderer: ({ rowData }) =>
        h(ElSelectV2, {
          modelValue: normalizeSalesperson(rowData.salesperson),
          options: userOptions,
          size: 'small',
          filterable: true,
          multiple: true,
          collapseTags: true,
          teleported: true,
          placeholder: 'Select Salesperson',
          style: { width: '100%' },
          'onUpdate:modelValue': (val: string[] | undefined) => {
            rowData.salesperson = val ?? []
          }
        })
    },
    // {
    //   key: 'userGroup',
    //   title: '用戶組 User Group',
    //   dataKey: 'userGroup',
    //   width: 200,
    //   cellRenderer: ({ rowData }) =>
    //     h(ElSelectV2, {
    //       modelValue: rowData.userGroup ?? '',
    //       options: groupOptions,
    //       size: 'small',
    //       filterable: true,
    //       clearable: true,
    //       teleported: true,
    //       placeholder: 'Select User Group',
    //       style: { width: '100%' },
    //       'onUpdate:modelValue': (val: string | undefined) => {
    //         rowData.userGroup = val ?? ''
    //       }
    //     })
    // },
    {
      key: 'creationDate',
      title: '創建日期 Creation Date',
      dataKey: 'creationDate',
      width: 180,
      align: 'center',
      cellRenderer: ({ cellData }) => {
        if (cellData == null) return ''
        const date = dayjs(Number(cellData))
        return date.isValid() ? date.format('YYYY/MM/DD').toString() : ''
      }
    }
  ]
})

async function loadGroupOptions() {
  try {
    const list = await getGroupsSelectOption()
    groupList.value = (list || [])
      .map((item: any) => ({
        value: String(item.value ?? item.id ?? ''),
        label: String(item.label ?? item.name ?? item.value ?? '')
      }))
      .filter((item: any) => item.value)
  } catch (e) {
    console.log(e)
    groupList.value = []
  }
}

async function getUser() {
  if (!formData?.office) return

  const conditions = [
    {
      type: 'EQ',
      column: 'f_10605_344a5edf',
      value: formData.office.toUpperCase()
    },
    {
      type: 'EQ',
      column: 'f_10609_2747fdae',
      value: '1'
    }
  ]
  try {
    const rows = await getDbData('ad7437e0-6860-11f1-aaf1-bfeaea0b4089', conditions)
    userList.value = rows.map((item: any) => ({
      value: item.user_name,
      label: item.nickname,
      email: item.email
    }))
  } catch (e) {
    console.log(e)
    userList.value = []
  }
}

async function search() {
  // TODO：根據 formData.part_number(必須), formData.currency, formData.customer_number, formData.date_range
  // 查詢 quotation, quotation_line, quotation_line_pricing, order, order_line 表的數據

  const conditions = [
    {
      type: 'EQ',
      column: 'f_9809_a05d1cf1',
      value: formData.part_number.toUpperCase()
    }
  ]

  // await getDbData('3780fa50-75c6-11f1-bbe6-6d0469e369bf', conditions)

  listData.value = [
    {
      checked: false,
      index: 1,
      markup: 1,
      moq: 1000,
      newUnitPrice: 1,
      originalUnitPrice: 1.005,
      currency: 'USD',
      customerNumber: 'CUST-0101',
      customerName: '星擎半導體科技股份有限公司',
      orderNumber: 'QSZ2600001',
      orderType: 'Pre Order',
      salesperson: ['Joshua.Zheng'],
      userGroup: '',
      creationDate: 1784717318352
    },
    {
      checked: false,
      index: 2,
      markup: 1,
      moq: 1000,
      newUnitPrice: 1.123,
      originalUnitPrice: 1.23,
      currency: 'USD',
      customerNumber: 'CUST-0101',
      customerName: '星擎半導體科技股份有限公司',
      orderNumber: 'QSZ2600002',
      orderType: 'Pre Order',
      salesperson: ['Joshua.Zheng'],
      userGroup: '',
      creationDate: 1784717318352
    },
    {
      checked: false,
      index: 3,
      markup: 1,
      moq: 2000,
      newUnitPrice: 1.123,
      originalUnitPrice: 1.23,
      currency: 'USD',
      customerNumber: 'CUST-0101',
      customerName: '星擎半導體科技股份有限公司',
      orderNumber: 'QSZ2600003',
      orderType: 'Quotation Completed',
      salesperson: ['Joshua.Zheng'],
      userGroup: '',
      creationDate: 1784717318352
    },
    {
      checked: false,
      index: 4,
      markup: 1,
      moq: 2000,
      newUnitPrice: 1.123,
      originalUnitPrice: 1.23,
      currency: 'CNY',
      customerNumber: 'CUST-0101',
      customerName: '星擎半導體科技股份有限公司',
      orderNumber: 'QSZ2600004',
      orderType: 'Quotation Completed',
      salesperson: ['Joshua.Zheng'],
      userGroup: '',
      creationDate: 1784717318352
    }
  ]
  selectData.value = []
}

async function getDbData(tableId: string, conditions?: any[]) {
  // Get Filed Mapping
  const filedData = await $api.get(`/api/docpal/master-table/user-config?tableId=${tableId}&userId=master&type=detail`).then((res: any) => res.data.data)
  const filedMapping: Record<string, string> = {}
  filedData.tableFields.forEach((item: any) => {
    filedMapping[item.field_name] = item.validation_rules.title
  })

  const param = {
    tableId: tableId,
    conditions,
    columns: [{ name: '*' }],
    pagination: {
      pageSize: 1000,
      pageNum: 0
    }
  }

  // Get BD Data
  const dbData = await $api.post('/apis/v1/dynamic-actions', param).then((res) => res.data.data)

  // 匹配數據（同時保留 field_name 與 title，避免下游讀取 key 不一致）
  return dbData.map((row: any) => {
    const out: Record<string, any> = {}
    for (const [fromKey, toKey] of Object.entries(filedMapping)) {
      if (fromKey in row) {
        out[fromKey] = row[fromKey]
        out[toKey] = row[fromKey]
      }
    }
    return out
  })
}

async function getFormData(needValidation = true) {
  const newData = selectData.value.map((item: any) => {
    const set = new Set()
    if (!!item.salesperson && item.salesperson.length > 0) {
      const salespersonSet = new Set(item.salesperson.map((s: string) => s.toUpperCase()))

      const list = userList.value.filter((userItem: any) => salespersonSet.has(userItem.value.toUpperCase()))
      list.forEach((userItem: any) => {
        set.add(userItem.email)
      })
    }

    return {
      pa_number: '',
      order_number: item.orderNumber,
      markup: item.markup,
      moq: item.moq,
      currency: item.currency,
      new_unit_price: item.newUnitPrice,
      original_unit_price: item.originalUnitPrice,
      part_number: formData.part_number,
      customer_number: item.customerNumber,
      customer_name: item.customerName,
      salesperson: item.salesperson.join(','),
      // salesperson_user_group: item.userGroup,
      salesperson_user_group: '',
      price_controller: formData.user,
      office: formData.office,
      branch_office: formData.branch_office,
      recipients: [...set].join(',')
    }
  })

  const result = {
    data_list: newData
  }
  if (!needValidation) return result
  await formRef.value?.validate()
  return result
}

onMounted(async () => {
  await loadGroupOptions()
  if (formData?.office) {
    await getUser()
  }
})

watch(
  () => formData?.office,
  async (office) => {
    if (office) {
      await getUser()
    }
  }
)

defineExpose({ getFormData })
</script>

<template>
  <el-button type="primary" style="width: 100%" @click="search">Search</el-button>
  <div style="margin-block-end: 22px; margin-block-start: 22px">
    <el-divider content-position="left">詳情 Detail</el-divider>
  </div>

  <div class="price-announcement-list">
    <el-auto-resizer>
      <template #default="{ height, width }">
        <el-table-v2 :columns="columns" :data="listData" :width="width" :height="height" fixed />
      </template>
    </el-auto-resizer>
  </div>

  <el-form ref="formRef" :model="formModel" :rules="rules">
    <el-form-item prop="selectDataLength">
      <input type="hidden" :value="formModel.selectDataLength" />
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
.price-announcement-list {
  height: 450px;
  width: 100%;
}
</style>
