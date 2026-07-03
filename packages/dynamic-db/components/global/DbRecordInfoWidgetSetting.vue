<template>
  <TableInfoSetting ref="settingRef" :setting="effectiveSetting" :fields="fields" @refresh="handleRefresh" @delete="emit('delete')" />
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import TableInfoSetting from '@packages/dp-mdTable/components/detailView/widgets/TableInfoSetting.vue'
import { RecordDashboardContextKey } from '../../composables/dashboard/recordDashboardContext'
import type { FieldInfo } from '@packages/dp-mdTable/types/view-config'

const props = defineProps<{
  setting?: Record<string, any>
}>()

const emit = defineEmits(['delete', 'refreshSetting'])

const context = inject(RecordDashboardContextKey, null)

const fields = computed<FieldInfo[]>(() => {
  return (context?.tableFields.value ?? []).map((f: any) => ({
    fieldName: f.field_name,
    fieldNameAlias: f.field_name_alias,
    type: f.business_type,
    isSystem: f.is_system,
    properties: f.display_structure
  }))
})

const effectiveSetting = computed(() => {
  const { recordId, tableId, _recordContext, ...rest } = props.setting || {}
  return rest
})

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
