<script lang="ts" setup>
import { clientApi } from 'api'
import { ElMessage } from 'element-plus'

const props = defineProps(['query', 'aggregation'])
const emits = defineEmits(['cancel', 'update'])
const { t } = useI18n()
const filterRef = ref()
const aggRef = ref()
const loading = ref(false)
const recordData = reactive({
  label: ''
})
const mode = ref('recordDetail')

function handleMode(_mode: string = 'recordDetail') {
  mode.value = _mode
}

function handleSearch() {
}

function init(record: any) {
  recordData.id = record.id
  recordData.label = record.label
  filterRef.value.initForm(record.query)

  if (record.query.filter) aggRef.value.setDefaultFilter(record.query.filter)
  else aggRef.value.setDefaultFilter({})
}

async function handleSave() {
  const condition = await filterRef.value.getData()
  if (!condition.docId && (!condition.query || condition.query.length === 0)) {
    ElMessage.warning(t('search.noCondition'))
    return
  }
  loading.value = true
  const agg = await aggRef.value.getData()
  if (Object.keys(agg).length > 0) {
    condition.filter = agg
  }
  const params = {
    id: recordData.id,
    label: recordData.label,
    queryCondition: JSON.stringify(condition)
  }
  await clientApi.api.postDmsSearchSaveNestedSearchLog(params)
  setTimeout(() => {
    loading.value = false
    ElMessage.success(t('dpMsg_success'))
    emits('update')
    emits('cancel')
  }, 500)
}

defineExpose({ filterRef, init })
</script>
<template>
  <div class="search-bar-detail">
    <div class="search-bar-detail__title">
      <template v-if="mode === 'record'">{{ $t('dpSearch.recordTitle') }}</template>
      <template v-else-if="['recordDetailAgg', 'recordDetail'].includes(mode)">
        <!-- <ElTooltip :content="$t('common_back')" placement="top">
            <Icon class="el-icon--left" name="tabler:arrow-back" @click="mode = 'record'" />
          </ElTooltip> -->
        {{ $t('dpSearch.recordDetailTitle') }}
      </template>
    </div>
    <div class="search-bar-detail__action">
      <SvgIcon
        v-if="mode !== 'recordDetailAgg'"
        src="/icons/tools/filter.svg"
        class="mr-2"
        @click="handleMode('recordDetailAgg')"
        @search="handleSearch"
      ></SvgIcon>
      <SvgIcon
        v-else
        src="/icons/tools/search.svg"
        class="mr-2"
        @click="handleMode('recordDetail')"
      ></SvgIcon>
    </div>
    <div v-show="mode === 'recordDetail'" class="search-bar-detail__main">
      <el-input
        v-model="recordData.label"
        class="search-bar-detail__main--label"
        :placeholder="$t('dpTable_label')"
      ></el-input>
      <SearchGroupBarFilter ref="filterRef" id="record" @search="handleSearch"></SearchGroupBarFilter>
    </div>
    <div v-show="mode === 'recordDetailAgg'" class="search-bar-detail__main">
      <SearchGroupBarAggregation
        ref="aggRef"
        :aggregation="aggregation"
      ></SearchGroupBarAggregation>
    </div>
    <div class="search-bar-detail__buttons">
      <el-button id="Search__Save__Edit__Cancel" type="info" :loading="loading" @click="emits('cancel')">
        {{ $t('cancelText') }}
      </el-button>
      <el-button id="Search__Save__Edit__Submit" type="primary" :loading="loading" @click="handleSave">
        {{ $t('common_submit') }}
      </el-button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.search-bar-detail {
  height: 100%;
  overflow: hidden;
}

.search-bar-detail {
  display: grid;
  grid-template-columns: 1fr min-content;
  grid-template-rows: min-content 1fr min-content;
  gap: var(--app-space-xs);

  &__title {
    grid-area: 1 / 1 / 2 / 2;
  }

  &__action {
    grid-area: 1 / 2 / 2 / 3;
  }

  &__main {
    overflow: auto;
    grid-area: 2 / 1 / 3 / 3;

    &--label {
      margin-bottom: var(--app-space-xs);
    }
  }

  &__buttons {
    grid-area: 3 / 1 / 4 / 3;
  }
}
</style>
