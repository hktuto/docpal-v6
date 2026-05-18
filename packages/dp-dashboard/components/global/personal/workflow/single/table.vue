<script lang="ts" setup>
import dayjs from 'dayjs'
import { newClientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const platform = useAppPlatform()

const props = defineProps<{
  setting: any
}>()
const { setting } = toRefs(props)

const isValid = computed(() => {
  return props.setting?.selectedWorkflow && props.setting.columns.length > 0
})

function getRecursiveValue(obj: any, path: string) {
  if (path.includes('.')) {
    const pathList = path.split('.')
    return getRecursiveValue(obj[pathList[0]], pathList.slice(1).join('.'))
  }
  return obj[path] || path
}

function displayValue(f: string) {
  // check if f is a string date
  const d = dayjs(f, 'YYYY-MM-DD', true).isValid()
  if (d) {
    return dayjs(f).format('YYYY-MM-DD HH:mm')
  }
  return f
}
function setupTable() {
  const newColumn = deepCopy(props.setting.columns) || []
  const columns: any[] = []
  const addedColumn = newColumn.map((item: any) => {
    if (item.field.length > 1) {
      item.field = item.field.join(',')

      item.formatter = (args: any) => {
        let result = ''
        const field = args.column.field.split(',')
        field.forEach((f: string) => {
          try {
            const r = getRecursiveValue(args.row, f)
            if (r) {
              result += displayValue(r)
            } else {
              result += displayValue(f)
            }
          } catch (err) {
            console.log('err', err)
            result += displayValue(f)
          }
        })
        return result || '--'
      }
    } else {
      item.field = item.field[0]
      item.formatter = (args: any) => {
        return displayValue(args.row[item.field])
      }
    }
    return item
  })
  columns.splice(0, 0, ...addedColumn)
  console.log('columns', columns)
  tableConfig.columns = columns
}

function openDetail(row: any) {
  if (!routeWorkflowDetail) return
  try {
    routerProvider?.navigateTo(
      routeWorkflowDetail({
        ...row,
        name: row.taskInstance.businessKey,
        workflowType: 'allTask'
      }),
      false
    )
  } catch (error: any) {
    console.error(error)
  }
}

function filterStep(list: any) {
  if (!list || !props.setting.steps || props.setting.steps.length === 0) return list
  return list.filter((item: any) => {
    return props.setting.steps.includes(item.taskDefinitionKey)
  })
}
const filterKeyword = ref('')
function sortAndFilterList(list: any) {
  // fitler list
  if (filterKeyword.value) {
    list = list.filter((item: any) => {
      return JSON.stringify(item).toLowerCase().includes(filterKeyword.value.toLowerCase())
    })
  }
  if (!list || !props.setting.sortColumn) return list
  return list.sort((a: any, b: any) => {
    if (!a[props.setting.sortColumn]) return -1
    if (!b[props.setting.sortColumn]) return 1
    const aVal = a[props.setting.sortColumn]
    const bVal = b[props.setting.sortColumn]
    if (aVal === bVal) return 0
    if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal
    if (typeof aVal === 'boolean' && typeof bVal === 'boolean') return aVal ? 1 : -1
    // check if aVal is date
    if (aVal instanceof Date && bVal instanceof Date) return aVal.getTime() - bVal.getTime()
    // check if aVal is date string
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const aDate = dayjs(aVal)
      const bDate = dayjs(bVal)
      if (aDate.isValid() && bDate.isValid()) return aDate.diff(bDate)
      return aVal.localeCompare(bVal)
    }
    return a[props.setting.sortColumn] > b[props.setting.sortColumn] ? 1 : -1
  })
}

async function getAllWorkingInstances(processKey: string, pageNum: number = 0, pageSize: number = 100, result: any[] = [], totalLength = 0) {
  const pageParams: any = {
    processKeys: [props.setting.selectedWorkflow],
    candidateOrAssigned: useUserId().value,
    pageNum,
    pageSize
  }
  const { data }: any = await newClientApi.postDocpalWorkflowTasksUser(pageParams)
  // filter step name
  const entryList = filterStep(data?.entryList || [])
  const _entryList = entryList.map((item: any) => {
    return {
      ...item.taskInstance,
      ...item,
      ...item.taskInstance.processVariables
    }
  })
  result.push(..._entryList)
  return sortAndFilterList(result)
}

const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'personal-workflow-single-table',
  api: async (pageParams: any) => {
    if (platform.value === 'admin') {
      return []
    }
    return getAllWorkingInstances(props.setting.selectedWorkflow, 0, 100, [])
  },
  zoom: false,
  saveColumnOrder: false,
  virtualScroll: true,
  columns: [],
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'common_open',
        action: ({ row }) => {
          openDetail(row)
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }) => {
    openDetail(row)
  }
})

const intervalReload = ref()

onMounted(() => {
  if (!intervalReload.value) {
    intervalReload.value = setInterval(() => {
      console.log('reload')
      reload()
    }, 30000)
  }
})

onUnmounted(() => {
  if (intervalReload.value) {
    console.log('clean interval')
    clearInterval(intervalReload.value)
    intervalReload.value = null
  }
})

watch(
  setting,
  () => {
    console.log('setting change', setting)
    setupTable()
  },
  {
    deep: true,
    immediate: true
  }
)
defineExpose({ query, reload })
</script>

<template>
  <div class="table-container">
    <VxeGrid v-if="isValid" ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ElInput v-model="filterKeyword" placeholder="" class="w-100" @change="reload" />
      </template>
    </VxeGrid>
    <div v-else>
      <el-empty :description="$t('noData')" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-container {
  :deep(.vxe-toolbar) {
    display: flex;
    padding-top: 0;
  }
}
</style>
