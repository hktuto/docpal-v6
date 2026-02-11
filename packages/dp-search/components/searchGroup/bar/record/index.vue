<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { newClientApi } from 'api'
import { Search } from '@element-plus/icons-vue'
import { conditionDecorators } from '~/utils/searchFormHelper'

const emits = defineEmits(['edit', 'dblclick'])
const props = defineProps(['aggregation'])
const state = reactive<any>({
  records: [],
  _records: [],
  systemRecords: [],
  _systemRecords: [],
  input: ''
})
const { t } = useI18n()

async function getList() {
  const data: any = await newClientApi.getDmsSearchQueryNestedSearchLog().then(r => r.data)
  // state.searchList = await GetSearchApi()
  state.records = [...data]
  state._records = [...state.records]
}

async function getSystemRecords() {
  const data: any = await newClientApi.getDmsSmartFolder().then(r => r.data)
  state.systemRecords = data.map((item: any) => ({
    label: item.name,
    queryCondition: item.json_value
  }))
  state._systemRecords = [...state.systemRecords]
}

const addRef = ref()

function handleAdd() {
  addRef.value.handleOpen()
}

function handleEdit(row: any) {
  const query = JSON.parse(row.queryCondition)
  conditionDecorators(query)
  emits('edit', {
    id: row.id,
    label: row.label,
    query
  })
}

function handleDblclick(row: any) {
  const query = JSON.parse(row.queryCondition)
  conditionDecorators(query)
  emits('dblclick', query)
}

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(t('msg_confirmWhetherToDelete'))
    if (action !== 'confirm') return
    await newClientApi.deleteDmsSearchDeleteNestedSearchLogId(row.id).then(r => r.data)
    await getList()
  } catch (error) {
    console.log(error)
  }
}

function handleSearch() {
  filterArr('records')
  filterArr('systemRecords')

  function filterArr(arrKey: 'records' | 'systemRecords') {
    state[arrKey] = state[`_${arrKey}`].filter((item: any) => {
      console.log(item)
      return !state.input || item.label.toLowerCase().includes(state.input.toLowerCase())
    })
  }
}

onDeactivated(() => {
  state.input = ''
})

onMounted(() => {
  getSystemRecords()
  getList()
})

defineExpose({ getList })
</script>
<template>
  <div class="search-bar-record">
    <div class="flex-x-between">
      <el-input
        v-model="state.input"
        :placeholder="$t('dpTip.filterBy', { name: $t('dpTable_label') })"
        :prev-icon="Search"
        clearable
        @input="handleSearch"
      ></el-input>
      <SvgIcon
        id="Search__Save__Add"
        src="/icons/add-circle-fill.svg"
        style="--icon-color: var(--app-primary-color)"
        class="el-icon--right"
        @click="handleAdd"
      ></SvgIcon>
    </div>
    <div class="search-bar-record__list">
      <div v-for="key in ['records', 'systemRecords']" style="margin-bottom: var(--app-space-s)">
        <div class="search-bar-record__list__title">{{ $t(`dpSearch.${key}`) }}</div>
        <div v-for="item in state[key]" class="search-bar-record__list__item flex-x-between"
             @dblclick="handleDblclick(item)">
          {{ item.label }}
          <div v-if="key === 'records'" class="flex-x-between"
               style="--icon-color: var(--app-grey-400); --icon-size: 14px">
            <SvgIcon
              :id="`Search__Save__Edit__${item.id}`"
              src="/icons/edit.svg"
              class="el-icon--right"
              @click="handleEdit(item)"
            />
            <SvgIcon
              :id="`Search__Save__Delete__${item.id}`"
              src="/icons/delete.svg"
              class="el-icon--right"
              @click="handleDelete(item)"
            />
          </div>
        </div>
      </div>
    </div>
    <SearchGroupBarRecordAddDialog ref="addRef" @save="(data: any) => emits('save', data)" />
  </div>
</template>
<style lang="scss" scoped>
.search-bar-record {
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);

  &__list {
    overflow: auto;

    &__title {
      font-style: normal;
      font-weight: normal;
      font-size: var(--app-font-size-m);
      line-height: 1.375rem;
      color: var(--app-grey-300);
      padding: var(--app-space-xs) 0;
    }

    &__item {
      cursor: pointer;
      font-size: 1rem;
      padding: var(--app-space-xs);
      border-radius: var(--app-border-radius-s);

      &:hover {
        background-color: var(--app-grey-800);
      }
    }
  }
}
</style>
