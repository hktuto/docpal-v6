<template>
  <!-- <FormRenderer ref="FormRendererRef" :form-json="formJson"
  @formChange="handleFormChange">
</FormRenderer> -->
<div :class="{ 'loading-container': state.loading }" v-for="(item, index) in filters.query" :key="item.id" v-loading="state.loading">
  <SearchGroupBarFilterCondition :ref="(el: any) => BarFilterRef[item.id] = el" :qItem="item"
    :id="id"
    @update="(data: any) =>handleUpdate(data, item)"
    @add="handleAddQueryFilter(item)"
    @command="(command: 'and' | 'or') => handleCommand(command, item)"
    @delete="handleDeleteFilter(item.id, filters.query)"
    @deleteChild="handleDeleteFilter"
    @formChange="emits('search')"></SearchGroupBarFilterCondition>
  <el-divider v-if="index !== filters.query.length - 1">
    {{ $t(`logic.${filters.condition}`)  }}
  </el-divider>
</div>
<div style="margin-top: var(--app-space-xs);" class="flex-x-center">
  <el-dropdown class="plain-dropdown"  size="small" split-button  @click="handleAddFilter" @command="(command: 'and' | 'or') => handleCommand(command, filters)">
    {{ $t(`logic.${filters.condition}`)  }}
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="and">{{ $t('logic.and') }}</el-dropdown-item>
        <el-dropdown-item command="or">{{ $t('logic.or') }}</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</div>
</template>
<script lang="ts" setup>
import type { searchGroup, searchGroupQuery, searchGroupQQ } from '~/typing/search'
import { getUniqueId } from '../../../utils/searchFormHelper'
import { conditionType, getMetadataOptions, languages, mimeTypes, getGroupList, sizes, sortListWithI18n } from '~/utils/formOptions'
const props = defineProps(['id'])
const state = reactive<any>({
  loading: false
})
const emits = defineEmits(['search'])
// const formJson = getJsonApi('client/searchGroupPathForm.json')
const filters = ref<searchGroup>({
  condition: 'and',
  docId: '',
  query: []
})
const BarFilterRef = ref<any>({})
async function getData () {
  const pList: any = []
  for (const item of filters.value.query) {
    pList.push(getFiltersData(item))
  }
  const params = {
    condition: filters.value.condition,
    docId: filters.value.docId,
    query: await Promise.all(pList)
  }
  return params
}
async function getFiltersData (item: searchGroupQuery) {
  const data = await BarFilterRef.value[item.id].getData()
  return {
    condition: item.condition,
    matchs: data
  }
}

function handleAddFilter() {
  const qItem: searchGroupQuery = {
    id: getUniqueId('query'),
    condition: 'and',
    matchs: [
      {
        id: getUniqueId('matchs'),
        queryType: "keyword",
        value: "",
        type: "string",
        option: {
            matchCase: false,
            fullMatch: false,
            synonyms: false,
            includeLanguages: []
        }
      }
    ],
  }
  if(!filters.value.query) filters.value.query = []
  filters.value.query.push(qItem)
}
function handleAddQueryFilter(qItem: any) {
  if(!qItem.matchs) qItem.matchs = []
  const q: searchGroupQQ = {
    id: getUniqueId('matchs'),
    queryType: "keyword",
    value: "",
    type: "string",
    option: {
        matchCase: false,
        fullMatch: false,
        synonyms: false,
        includeLanguages: []
    }
  }
  qItem.matchs.push(q)
}
// function handleFormChange({fieldName, newValue, oldValue, formModel}: any) {
//   if(newValue) filters.value.docId = newValue.pop()
//   else filters.value.docId = ''
//   console.log('handleFormChange', fieldName, newValue, oldValue, formModel)
// }
function handleDeleteFilter(id: string, qItem: searchGroupQuery[] | searchGroupQQ[]) {
  const index = qItem.findIndex(i => i.id === id)
  if(index !== -1 ) qItem.splice(index, 1)
  emits('search')
}
function handleCommand(command: 'and' | 'or', item: searchGroup | searchGroupQuery) {
  item.condition = command
  emits('search')
}
function handleUpdate(data: searchGroupQQ[], item: searchGroupQuery) {
  data.forEach((dItem:any, dIndex:number) => {
    dItem.id = item.matchs[dIndex].id
  })
  item.matchs = data
}
async function initForm(query: any) {
  filters.value = query
}
function clear() {
  filters.value.query = []
  handleAddFilter()
}

function getSearchParams(){
  const searchParams = sessionStorage.getItem('searchParams')
  if(!!searchParams) {
    initForm(JSON.parse(searchParams))
    setTimeout(() => {
      emits('search')
      sessionStorage.setItem('searchParams', '')
    },100)
  }
  else if(filters.value?.query?.length === 0){
    handleAddFilter()
  }
}

onMounted(async () => {
  getSearchParams()
})

defineExpose({
  getData, initForm, clear
})
</script>
<style lang="scss" scoped>
.plain-dropdown {
  :deep(.el-button) {
    border: none;
  }
}
.loading-container {
  min-height: 100px;
}
</style>
