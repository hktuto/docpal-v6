<template>
  <DashboardCard
    v-loading="loading"
    class="o-auto dp-dashboard--card__padding dp-dashboard--card__scroll"
    ref="cardRef"
    :hideSetting="hideSetting"
    :title="setting.title || $t('dashboard.cmmnBasicInfo')"
    :setting="setting"
    :settingRef="settingRef"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <div class="flex-zoom">
      <div :style="`--field-width: ${item.width}`" class="list-group-item" v-for="item in state.layout">
        <div class="header">{{ item.label }}</div>
        <div :class="{ content: true, 'content--link': item.linkType }" @click="handleLink(item)">
          {{ displayValue(item) }}
        </div>
      </div>
    </div>
    <DashboardRelatedCaseInfoSetting v-if="!hideSetting" ref="settingRef" @delete="handleDelete"
                                     @refresh="handleRefresh" />
  </DashboardCard>
</template>
<script lang="ts" setup>
import { useEventBus, EventType } from 'eventbus'

import { set, watchDebounced } from '@vueuse/core'
import { clientApi } from 'api'

const platform = useAppPlatform()

const props = withDefaults(
  defineProps<{
    dates?: any
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: {
      layout: [],
      defaultValue: {},
      label: {}
    },
    hideSetting: false
  }
)

const caseProvider: any = inject(CaseManagementDashboardKey)
const emits = defineEmits(['refreshSetting', 'delete'])
const { t } = useI18n()
const tabProvider = inject(TabManagerKey)

function displayValue(item: any) {
  if (platform.value === 'admin') {
    return item.defaultValue
  }
  if (item.dataType === 'timestamp') {
    return formatDate(item.value)
  }
  if (item.dataType === 'bit') {
    return item.value ? 'Yes' : 'No'
  }
  return item.value || '--'
}

function displayLabel(label: any) {
  let _label = label.split('_').join(' ')
  return _label.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase())
}

const state = reactive<any>({
  caseRecord: {},
  masterTableRecord: {},
  layout: []
})

// #region module: dialog

function handleDelete() {
  emits('delete')
}

function handleRefresh(chartSetting: any) {
  emits('refreshSetting', chartSetting)
}

// #endregion
function handleLink(item: any) {
  if (!item.linkType) return
  const content: any = {}
  switch (item.linkType) {
    case 'case':
      content.caseInstanceId = item.value
      break
    case 'workflow':
      content.processInstanceId = item.value
      break
    case 'document':
      content.documentId = item.value
      break
  }
  notiHandleView({ content }, tabProvider)
}

function renderLabel(label: any) {
  // convert label to titel case
  // return orgin label if secound string is also uppercase
  if (label.toUpperCase() === label) return label
  return label.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase())
}

async function getCaseData() {
  try {
    const instanceIdId = caseProvider.instanceId?.value || null
    if (!instanceIdId)
      return props.setting.layout.reduce((prev: any, item: any) => {
        prev[item.name] = item.defaultValue
        return prev
      }, {})
    state.caseRecord = await clientApi.api.getCaseDashboardInstanceCaseidPrimaryformData(instanceIdId).then(r => r.data)
    const caseId = state.caseRecord.rows.find((item: any) => item.id === props.setting.relatedCaseField)?.value
    if (!caseId) throw new Error('Case not found')
    const caseData = await clientApi.api.getCaseDashboardInstanceCaseidPrimaryformData(caseId).then(r => r.data)
    return caseData.rows.reduce((prev: any, item: any) => {
      prev[item.id] = item.value
      return prev
    }, {})
  } catch (error) {
    console.error('error', error)
    return null
  }
}

const { settingRef, cardRef, refresh, loading } = useDashboardCard({
  props,
  handleInitCardAction: async (setting: any) => {
    const data = await getCaseData()
    state.layout = setting.layout.reduce((prev: any, item: any) => {
      item.value = data[item.name]
      prev.push(item)
      return prev
    }, [])
  }
})
</script>
<style lang="scss" scoped>
:deep(.flex-zoom) {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  row-gap: var(--app-space-xs);
  column-gap: var(--app-space-xs);
  // overflow: auto;
  .list-group-item {
    min-width: 100px;
    height: fit-content;
    gap: var(--app-space-xs);
    background-color: #fff;
    width: calc(var(--field-width, 25%) - var(--app-space-xs));
    --icon-size: 1.14rem;

    .header {
      margin: var(--app-input-padding) 0;
      color: var(--app-grey-600);
    }

    .content {
      font-size: var(--app-font-size-l);
      font-weight: 600;
    }
  }

  .content {
    min-height: var(--app-space-s);
  }
}

.o-auto > .el-card__body {
  overflow: auto;
}

.content--link {
  cursor: pointer;
  color: var(--el-color-primary);

  &:hover {
    color: var(--el-color-primary-dark-2);
  }
}
</style>
