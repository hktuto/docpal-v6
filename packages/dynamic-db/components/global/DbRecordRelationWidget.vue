<template>
  <RelatedTableList
    ref="relationTableRef"
    :setting="effectiveSetting"
    :hide-setting="hideSetting"
    :fields="fields"
    :record="record"
    :fetch-related-records="fetchRelatedRecords"
    :get-target-fields="getTargetFields"
    @delete="emit('delete')"
    @refresh-setting="handleRefresh"
  />
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import RelatedTableList from '@packages/dp-mdTable/components/detailView/widgets/RelatedTableList.vue'
import { RecordDashboardContextKey } from '../../composables/dashboard/recordDashboardContext'
import type { FieldInfo } from '@packages/dp-mdTable/types/view-config'
import { postDynamicActions } from 'api'
import { useTableFields } from '../../composables/dashboard/useTableFields'
import { useRelatedRecordParams, type FilterRules, type SortRule } from '../../composables/dashboard/useRelatedRecordParams'

const props = defineProps<{
  setting?: Record<string, any>
  hideSetting?: boolean
}>()

const emit = defineEmits(['delete', 'refreshSetting'])

const context = inject(RecordDashboardContextKey, null)
const record = computed(() => context?.record.value ?? {})
const { getFields } = useTableFields()
const { buildParams } = useRelatedRecordParams()

const fields = computed<FieldInfo[]>(() => {
  return (context?.tableFields.value ?? []).map((f: any) => ({
    fieldName: f.field_name,
    fieldNameAlias: f.field_name_alias,
    type: f.business_type,
    isSystem: f.is_system,
    properties: f.display_structure,
    relationTableId: f.display_structure?.relation_table_id ?? f.relation_table_id
  }))
})

const effectiveSetting = computed(() => {
  const { recordId, tableId, _recordContext, ...rest } = props.setting || {}
  return rest
})

const relationTableRef = ref()

defineExpose({
  settingRef: relationTableRef
})

async function fetchRelatedRecords(
  relationFieldName: string,
  recordIds: string[],
  options: {
    filterRules?: FilterRules
    runtimeFilterRules?: FilterRules
    sortRules?: SortRule[]
    runtimeSortRules?: SortRule[]
  } = {}
) {
  if (!recordIds?.length) return []

  const relationField = (context?.tableFields.value ?? []).find(
    (f: any) => f.field_name === relationFieldName
  )
  const relationTableId =
    relationField?.display_structure?.relation_table_id ??
    relationField?.relation_table_id

  if (!relationTableId) return []

  const { conditions, orderBy } = buildParams(
    recordIds,
    options.filterRules,
    options.runtimeFilterRules,
    options.sortRules,
    options.runtimeSortRules
  )

  const { data }: any = await postDynamicActions({
    tableId: relationTableId,
    columns: [{ name: '*' }],
    conditions,
    orderBy
  })

  return data?.data ?? []
}

async function getTargetFields(relationTableId: string) {
  const rawFields = await getFields(relationTableId)
  return rawFields.map((f: any) => ({
    fieldName: f.field_name,
    fieldNameAlias: f.field_name_alias,
    type: f.business_type,
    isSystem: f.is_system,
    properties: f.display_structure
  }))
}

function handleRefresh(newSetting: any) {
  emit('refreshSetting', {
    ...props.setting,
    ...newSetting
  })
}
</script>
