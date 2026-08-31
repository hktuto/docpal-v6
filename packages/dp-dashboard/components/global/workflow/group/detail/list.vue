<template>
  <div class="table-main">
    <ResponsiveFilter ref="ResponsiveFilterRef" :initValue="filterInitValue" @form-change="handleFilterFormChange" />
    <div class="main" v-loading="state.loading">
    <!-- {{setting}} -->
    <!-- {{state.data}} -->
      <div v-for="(item, index) in state.data" class="">
        <div class="header flex-x-start">
          <div :class="`${getClass(ch, item)} el-icon--left`" v-for="ch in setting.cardHeaderLayout" :key="ch.name">
            <template v-if="ch.source === 'workflowIndex'">
              <el-tag :type="ch.type" effect="dark">{{(pageParams.pageNum - 1) * pageParams.pageSize + index + 1}}</el-tag>
            </template>
            <template v-else>
              {{ getValue({ ...item.details[0].inputData, ...item }, ch) }}
            </template>
          </div>
        </div>
        <div class="card-container flex-x-start">
          <div :class="`card-main card-main--${cItem.workflowState}`" v-for="cItem in item.details"
            @dblclick="goToWorkflow(cItem)">
            <template v-for="c in setting.cardLayout" :key="c.name">
              <div v-if="c.label && getValue({ ...cItem, ...cItem.inputData }, c)" class="card-item--label">{{ c.label }}</div>
              <div :style="`width: ${c.width};`" :class="getClass(c, cItem)">
                {{ getValue({ ...cItem, ...cItem.inputData }, c) }}
              </div>
            </template>
          </div>
        </div>
        <el-divider />
      </div>
    </div>
    <el-pagination v-if="state.totalSize"
      v-model:current-page="pageParams.pageNum"
      v-model:page-size="pageParams.pageSize"
      :size="pageParams.pageSize"
      layout="total, sizes, prev, pager, next"
      :total="state.totalSize"
      @change="handlePageChange"
    />
  </div>
</template>
<script lang="ts" setup>
import { watchDebounced } from '@vueuse/core'
import { newClientApi } from 'api';
import dayjs from 'dayjs'
const props = defineProps(['setting', 'dates'])
const { t } = useI18n()
const { public: { endPoint } } = useRuntimeConfig();
const pageParams = ref({
  pageSize: 20,
  pageNum: 1
})
const state = reactive<any>({
  loading: false,
  data: [],
  totalSize: 0,
  extraParams: {
    dateFilter: {
      filterType: 'Start Workflow within',
      startDate: props.dates[0],
      endDate: props.dates[1]
    }
  },
  extraParams2: {}
})
const filterInitValue = {
  filterType: state.extraParams.dateFilter.filterType
}
async function getData(params: any = {}) {
  try {
    state.loading = true
    if(!params.pageNum) {
      params.pageNum = pageParams.value.pageNum > 0 ? pageParams.value.pageNum - 1 : 0
    }
    if(!params.pageSize) {
      params.pageSize = pageParams.value.pageSize
    }
    params.workflowNames = props.setting.workflowList.map(item=>(item.name))
    const res: any = await newClientApi.postDsbWorkflowJobList({
      ...params,
      ...state.extraParams,
      ...state.extraParams2
    }).then(res => res.data)
    state.data = res.entryList
    state.totalSize = res.totalSize
  } catch (error) {
    
  } finally {
    setTimeout(() => state.loading = false, 300)
  }
}
function goToWorkflow(row) {
  // let url = router.resolve({  path: '/browse', query: { path: row.path, docId: row.id } })
  window.open(`https://${endPoint.value.docpal}/workflow/${row.instanceId}`);
}
function handlePageChange(currentPage: number, pageSize?: number) {
  
  getData({
    pageNum: currentPage - 1,
    pageSize
  })
}
function getValue(row, config) {
  let result: any = []
  if (config.variables) {
    const variables = config.variables.split(',')
    variables.forEach(key => {
      let value = row[key]
      switch (key) {
        case 'startDate':
        case 'endDate':
          value = formatDate(row[key])
          break;
        case 'duration':
          if(!row.endDate) value = ''
          else value = dayjs(row.endDate).diff(row.startDate, 'day')
          break;
        case 'state':
          value = row[key] || row.workflowState
          break
        case 'duration startDate~endDate':
          value = dayjs(row.endDate).diff(row.startDate, 'day') + 'day ' + formatDate(row.startDate) + '~' + formatDate(row.endDate, 'YYYY-MM-DD')
          break
        case 'startDate~endDate':
          value = formatDate(row.startDate) + '~' + formatDate(row.endDate)
          break
        default:
          break;
      }
     
      if (value) result.push(value)
    })
    return result.join('-')
  } else {
    return row[config.name]
  }
}
function getClass(config, row) {
  let result = ''
  if (config.align) result += ` card-item--${config.align}`
  if (config.size) result += ` card-item--${config.size}`
  if (config.variables === 'state' && row.state) result += ` card-item--${row.state}`
  return result
}
// #region module: filter
  const ResponsiveFilterRef = ref() 
  async function initCondition () {
    try {
      const approvalList = await newClientApi.getDsbWorkflowJobApproverList()
      const creatorList = await newClientApi.getDsbWorkflowJobStartCreatorList()
      const statusList = [
        { label: 'In-process', value: 'In-process'},
        { label: 'Complete', value: 'Complete'},
        { label: 'terminate', value: 'terminate'},
      ]
      const filterTypeList = [
        { label: 'Start Workflow within', value: 'Start Workflow within'},
        { label: 'End Workflow within', value: 'End Workflow within'}
      ]
      const data = [
        { key: 'startCreator', label: t('role.creator'), type: "String", isMultiple: false,
          options: creatorList
        },
        { key: 'approver', label: t('role.approver'), type: "String", isMultiple: false,
          options: approvalList
        },
        { key: 'overallStatus', label: t('common_status'), type: "String", isMultiple: false,
          options: statusList
        },
        { key: 'workflowStatus', label: t('dashboard.workflowStatus'), type: "String", isMultiple: false,
          options: statusList
        },
        { key: 'filterType', label: t('dashboard.dateRangeFilter'), type: "String", isMultiple: false,
          options: filterTypeList
        }
      ]
      ResponsiveFilterRef.value.init(data)
    } catch (error) {
    }
  }
  function handleFilterFormChange(formModel) {
    state.extraParams = Object.keys(formModel).reduce((prev: any,key) => {
      if(key === 'filterType') {
        prev.dateFilter = {
          filterType: formModel[key],
          startDate: props.dates[0],
          endDate: props.dates[1]
        }
      } else {
        prev[key] = formModel[key]
      }
      return prev
    }, {})
    handlePageChange(1)
  }
  function handleCommonFilterChange(form) {
    const variables = Object.keys(form).reduce((prev,key) => {
      if(form[key]) prev[key] = form[key]
      return prev
    }, {})
    if(Object.keys(variables).length > 0) state.extraParams2 = { variables }
    else state.extraParams2 = {}
    handlePageChange(1)
  }
// #endregion
onMounted(() => {
  initCondition()
})
watchDebounced(() => [props.setting, props.dates], (newValue, oldValue) => {
  if(!props.setting) return
  if(!oldValue|| JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
    state.extraParams.dateFilter.startDate =  props.dates[0]
    state.extraParams.dateFilter.endDate =  props.dates[1]
    getData()
  }
},{ debounce: 200, maxWait: 500, immediate: true })
defineExpose({
  getData, handleCommonFilterChange
})
</script>
<style lang="scss" scoped>
.table-main {
  height: 100%;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  gap: var(--app-space-xs);
  overflow: hidden;
  .main {
    overflow: auto;
  }
}
.card-container {
  gap: var(--app-space-xs);
  flex-wrap: wrap;
  align-items: flex-start;
}
.card-main {
  height: 100%;
  background-color: #b5e1e5;
  border-radius: 3px;
  padding: var(--app-space-xs);
  max-width: calc((100% - var(--app-space-xs) * 3) / 4);
  display: flex;
  flex-wrap: wrap;
  div {
    word-break: break-all;
  }
  &.card-main--In-process {
    background-color: #d9ecff;
  }
  &.card-main--terminate {
    background-color: #ffc7c7;
  }
  
  .card-item--Small {
    font-size: var(--app-font-size-m);
  }
  .card-item--Large {
    font-size: var(--app-font-size-l);;
  }
  .card-item--right {
    text-align: right;
  }
  .card-item--left {
    text-align: left;
  }
  .card-item--center {
    text-align: center;
  }
}
.card-item--In-process {
  color: #409eff;
}
.card-item--Complete {
  color: #5cd5e0;
}
.card-item--terminate {
  color: #dc2525;
}
.card-item--label {
  margin-top: var(--app-space-xs);
  font-size: 12px;
  color: #0F2037;
}
</style>
