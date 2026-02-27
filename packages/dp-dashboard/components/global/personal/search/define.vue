<template>
  <DashboardCard
    ref="cardRef"
    v-loading="loading"
    class="dp-dashboard--card__padding dp-dashboard--card__scroll"
    :hideSetting="hideSetting"
    :title="$t('search.SearchDefine')"
    :setting="setting"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <div v-if="!hideSetting" style="height: 100%; overflow: auto">
      <el-card v-for="item in 2" :key="item" class="detail">
        <el-skeleton :rows="4" />
      </el-card>
    </div>
    <div v-else v-for="key in ['records', 'systemRecords']" style="margin-bottom: var(--app-space-s)">
      <h3>{{ t(`dpSearch.${key}`) }}</h3>
      <div v-for="item in state[key]" class="search-bar-record__list__item flex-x-between" @dblclick="handleDblclick(item)">
        {{ item.label }}
      </div>
    </div>
  </DashboardCard>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const emits = defineEmits(['dblclick', 'search', 'delete'])
const props = withDefaults(
  defineProps<{
    dates?: any
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: {},
    hideSetting: false
  }
)
const state = reactive<any>({
  records: [],
  _records: [],
  systemRecords: [],
  _systemRecords: [],
  input: ''
})

async function getList() {
  const data = await newClientApi.getDmsSearchQueryNestedSearchLog().then(r => r.data)
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
async function handleDelete() {
  emits('delete')
}
function handleDblclick(row: any) {
  const query = JSON.parse(row.queryCondition)
  conditionDecorators(query)
  routerProvider?.navigateTo(routeSearch({ searchParams: query }), false)
}
const { cardRef, refresh, loading } = useDashboardCard({
  props,
  handleRefreshAction: async (setting: any) => {
    try {
      await getSystemRecords()
      await getList()
    } catch (error) {
      console.error(error)      
    }
  }
})
onMounted(() => {
  getSystemRecords()
  getList()
})
</script>
<style lang="scss" scoped>
.detail {
  margin-bottom: var(--app-space-xs);
  height: fit-content !important;
  cursor: pointer;
  :deep(.el-card__body) {
    padding: var(--app-space-xs);
  }
  .el-divider {
    margin: var(--app-space-xs) 0;
  }
  &:hover {
    background-color: var(--app-primary-color);
    color: #fff;
  }
}
.search-bar-record {
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);

  &__list {
    overflow: auto;

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
