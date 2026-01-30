<template>
  <div class="search-group-bar">
    <div v-if="!['recordDetailAgg', 'recordDetail'].includes(mode)" class="search-group-bar__title">
      <template v-if="mode === 'agg'">
        {{ $t('searchGroup.filter') }}
      </template>
      <template v-else-if="mode === 'record'">
        {{ $t('searchGroup.record') }}
      </template>
      <template v-else>
        {{ $t('file_search') }}
      </template>
    </div>
    <div v-if="!['recordDetailAgg', 'recordDetail'].includes(mode)" class="flex-x-start search-group-bar__action">
      <SvgIcon id="Search__Filter" v-if="mode !== 'agg'" src="/icons/tools/filter.svg" class="mr-2" @click="handleMode('agg')" @search="handleSearch"></SvgIcon>
      <SvgIcon id="Search__Search" v-else src="/icons/tools/search.svg" class="mr-2" @click="handleMode('filter')"></SvgIcon>
      <SvgIcon id="Search__Save" src="/icons/tools/save1.svg" class="mr-2" @click="handleMode('record')"></SvgIcon>
      <!-- <SearchGroupBarSaveLog ref="logRef" @search="handleLogSearch"  /> -->
      <SearchGroupBarRecentSearch ref="recentRef" @search="handleLogSearch" />
    </div>
    <div class="search-group-bar__content" v-show="mode === 'filter'">
      <SearchGroupBarFilter ref="filterRef" @search="handleSearch"></SearchGroupBarFilter>
    </div>
    <div class="search-group-bar__content" v-show="mode === 'agg'">
      <SearchGroupBarAggregation ref="aggRef" :aggregation="aggregation" @filters="handleAgg"></SearchGroupBarAggregation>
    </div>
    <div class="search-group-bar__content" v-show="mode === 'record'">
      <SearchGroupBarRecord
        ref="recordRef"
        @filters="handleLogSearch"
        @edit="handleEditRecord"
        @save="handleSave"
        @dblclick="handleLogSearch"
      ></SearchGroupBarRecord>
    </div>
    <div class="search-group-bar__content" v-show="mode === 'recordDetail'">
      <SearchGroupBarRecordDetail
        ref="recordDetailRef"
        :aggregation="aggregation"
        :query="recordDetailData"
        @cancel="mode = 'record'"
        @update="updateSaveRecord()"
      ></SearchGroupBarRecordDetail>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { clientApi, globalApi } from 'api'
import { ElMessage } from 'element-plus'
const { t } = useI18n()
const mode = ref<'filter' | 'agg' | 'record' | 'recordDetail'>('filter')
const props = defineProps(['aggregation'])
const emits = defineEmits(['search', 'aggSearch', 'searchLog'])
const filterRef = ref()
const aggRef = ref()
let isHistory = false // 控制是否触发form change事件
const recentRef = ref()
async function handleSearch() {
  if (isHistory) return
  const params = await filterRef.value.getData()
  if (!params.docId && params.query.length === 0) return
  aggRef.value.clear()
  emits('search', params)
  setTimeout(() => {
    recentRef.value.initList()
  }, 2000)
  // mode.value = 'search'
}
function handleMode(_mode: string = 'filter') {
  if ((mode.value === 'record' || mode.value === 'recordDetail') && _mode === 'agg') mode.value = 'filter'
  else mode.value = _mode
}
function handleAgg(data: any) {
  emits('aggSearch', data)
}

// #region module: record
const recordDetailRef = ref()
const recordDetailData = ref({})
const recordRef = ref()
async function handleLogSearch(query: any) {
  isHistory = true
  aggRef.value.clear()
  // if (query.filter) aggRef.value.setDefaultFilter(query.filter,'72')
  // else aggRef.value.setDefaultFilter({},'73')
  await filterRef.value.initForm(query)
  emits('searchLog', query)
  setTimeout(() => {
    isHistory = false
  }, 2000)
}
async function handleSave(data: any) {
  const condition = await filterRef.value.getData()
  if (!condition.docId && (!condition.query || condition.query.length === 0)) {
    ElMessage.warning(t('search.noCondition'))
    return
  }
  if (data.includeFilter) {
    const agg = await aggRef.value.getData()
    condition.filter = agg
  }
  const params = {
    label: data.label,
    queryCondition: JSON.stringify(condition)
  }
  await clientApi.api.postDmsSearchSaveNestedSearchLog(params)
  ElMessage.success(t('dpMsg_success'))
  updateSaveRecord()
}
function updateSaveRecord() {
  recordRef.value.getList()
}
function handleEditRecord(record: any) {
  // recordDetail(query)
  handleLogSearch(record.query)
  mode.value = 'recordDetail'
  recordDetailData.value = record
  recordDetailRef.value.init(record)
}
// #endregion
function setQuery(query: any) {
  filterRef.value.initForm(query)
}
const { searchOptions, searchOptionsLoading } = useSearchOptions()
provide('searchOptions', searchOptions)
provide('searchOptionsLoading', searchOptionsLoading)

onMounted(() => {
  mode.value = 'filter'
})
defineExpose({
  setQuery,
  aggRef
})
</script>
<style lang="scss" scoped>
.search-group-bar {
  display: grid;
  grid-template-columns: 1fr min-content;
  grid-template-rows: min-content 1fr;
  grid-column-gap: 0px;
  grid-row-gap: 0px;
  height: 100%;
  overflow: hidden;
  gap: var(--app-space-xs);
  &__title {
    grid-area: 1 / 1 / 2 / 2;
    font-size: var(--app-font-size-l);
    font-weight: bold;
    display: flex;
    align-items: center;
  }
  &__action {
    grid-area: 1 / 2 / 2 / 3;
    --icon-size: 16px;
    --icon-color: var(--app-grey-400);
    :deep(svg) {
      cursor: pointer;
      margin-left: var(--app-space-xs);
    }
  }
  &__content {
    grid-area: 2 / 1 / 3 / 3;
    overflow: auto;
  }
}
</style>
