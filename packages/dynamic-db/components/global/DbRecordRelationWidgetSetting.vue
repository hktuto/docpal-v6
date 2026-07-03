<template>
  <RelatedTableListSetting
    ref="settingRef"
    :setting="effectiveSetting"
    :relation-fields="relationFields"
    :target-fields="targetFields"
    @refresh="handleRefresh"
    @delete="emit('delete')"
  />
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import RelatedTableListSetting from '@packages/dp-mdTable/components/detailView/widgets/RelatedTableListSetting.vue'
import { RecordDashboardContextKey } from '../../composables/dashboard/recordDashboardContext'
import type { FieldInfo } from '@packages/dp-mdTable/types/view-config'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { useTableFields } from '../../composables/dashboard/useTableFields'

const props = defineProps<{
  setting?: Record<string, any>
}>()

const emit = defineEmits(['delete', 'refreshSetting'])

const context = inject(RecordDashboardContextKey, null)
const { getFields } = useTableFields()

const relationFields = computed<FieldInfo[]>(() => {
  return (context?.tableFields.value ?? [])
    .filter((f: any) => f.business_type === ColumnFieldType.Relation)
    .map((f: any) => ({
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

const targetFields = ref<FieldInfo[]>([])

async function loadTargetFields(relationFieldName: string) {
  const field = relationFields.value.find((f) => f.fieldName === relationFieldName)
  if (!field?.relationTableId) {
    targetFields.value = []
    return
  }
  const rawFields = await getFields(field.relationTableId)
  targetFields.value = rawFields.map((f: any) => ({
    fieldName: f.field_name,
    fieldNameAlias: f.field_name_alias,
    type: f.business_type,
    isSystem: f.is_system,
    properties: f.display_structure
  }))
}

watch(
  () => effectiveSetting.value.relationFieldName,
  (relationFieldName) => {
    if (relationFieldName) {
      loadTargetFields(relationFieldName)
    } else {
      targetFields.value = []
    }
  },
  { immediate: true }
)

const settingRef = ref()

defineExpose({
  settingRef
})

function handleRefresh(newSetting: any) {
  emit('refreshSetting', {
    ...props.setting,
    ...newSetting
  })
}
</script>
