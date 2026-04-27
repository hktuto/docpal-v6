<script lang="ts" setup>
import type { View, ViewType, Column } from '../../types/database'
import KanbanViewConfig from './KanbanViewConfig.vue'
import GanttViewConfig from './GanttViewConfig.vue'
import CalendarViewConfig from './CalendarViewConfig.vue'
import GalleryViewConfig from './GalleryViewConfig.vue'

const props = defineProps<{
  modelValue: boolean
  view: View | null
  columns: Column[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [data: {
    name: string
    isDefault: boolean
    groupByField?: string
    startDateField?: string
    endDateField?: string
    dateField?: string
    titleField?: string
  }]
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = ref<{
  name: string
  isDefault: boolean
  groupByField: string
  startDateField: string
  endDateField: string
  dateField: string
  titleField: string
}>({
  name: '',
  isDefault: false,
  groupByField: '',
  startDateField: '',
  endDateField: '',
  dateField: '',
  titleField: ''
})

function getViewIcon(viewType: ViewType): string {
  const icons: Record<ViewType, string> = {
    'table': '📋',
    'kanban': '📌',
    'gantt': '📊',
    'calendar': '📅',
    'gallery': '🖼️'
  }
  return icons[viewType] || '📋'
}

watch(() => props.view, (newView) => {
  if (newView) {
    form.value = {
      name: newView.name,
      isDefault: newView.isDefault || false,
      groupByField: newView.config?.groupByField || '',
      startDateField: newView.config?.startDateField || '',
      endDateField: newView.config?.endDateField || '',
      dateField: newView.config?.dateField || '',
      titleField: newView.config?.titleField || ''
    }
  }
}, { immediate: true })

function handleSave() {
  if (!form.value.name) return
  
  emit('save', {
    name: form.value.name,
    isDefault: form.value.isDefault,
    groupByField: form.value.groupByField || undefined,
    startDateField: form.value.startDateField || undefined,
    endDateField: form.value.endDateField || undefined,
    dateField: form.value.dateField || undefined,
    titleField: form.value.titleField || undefined
  })
  
  dialogVisible.value = false
}

function handleCancel() {
  dialogVisible.value = false
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="Edit View"
    width="480px"
    :close-on-click-modal="false"
    @close="handleCancel"
  >
    <el-form v-if="view" label-position="top">
      <el-form-item label="View Name" required>
        <el-input
          v-model="form.name"
          placeholder="Enter view name"
        />
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="form.isDefault">
          Set as default view
        </el-checkbox>
      </el-form-item>

      <el-form-item label="View Type">
        <el-tag size="large">
          {{ view.type ? getViewIcon(view.type) : '' }} 
          {{ view.type?.charAt(0).toUpperCase() }}{{ view.type?.slice(1) }}
        </el-tag>
        <div class="config-hint">View type cannot be changed after creation.</div>
      </el-form-item>

      <!-- Kanban Config -->
      <KanbanViewConfig
        v-if="view.type === 'kanban'"
        :columns="columns"
        v-model="form.groupByField"
      />

      <!-- Gantt Config -->
      <GanttViewConfig
        v-if="view.type === 'gantt'"
        :columns="columns"
        v-model:title-field="form.titleField"
        v-model:start-date-field="form.startDateField"
        v-model:end-date-field="form.endDateField"
      />

      <!-- Calendar Config -->
      <CalendarViewConfig
        v-if="view.type === 'calendar'"
        :columns="columns"
        v-model="form.dateField"
      />

      <!-- Gallery Config -->
      <GalleryViewConfig
        v-if="view.type === 'gallery'"
        :columns="columns"
        v-model="form.titleField"
      />
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">Cancel</el-button>
      <el-button
        type="primary"
        :disabled="!form.name"
        @click="handleSave"
      >
        Save Changes
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.config-hint {
  margin-top: var(--app-space-xs);
  font-size: var(--app-font-size-s);
  color: var(--app-warning-color);
}
</style>

