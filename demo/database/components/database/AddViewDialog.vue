<script lang="ts" setup>
import type { ViewType, Column } from '../../types/database'
import KanbanViewConfig from './KanbanViewConfig.vue'
import GanttViewConfig from './GanttViewConfig.vue'
import CalendarViewConfig from './CalendarViewConfig.vue'
import GalleryViewConfig from './GalleryViewConfig.vue'

const props = defineProps<{
  modelValue: boolean
  columns: Column[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'create': [data: {
    name: string
    type: ViewType
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
  type: ViewType
  groupByField: string
  startDateField: string
  endDateField: string
  dateField: string
  titleField: string
}>({
  name: '',
  type: 'table',
  groupByField: '',
  startDateField: '',
  endDateField: '',
  dateField: '',
  titleField: ''
})

const viewTypeOptions: { value: ViewType; label: string }[] = [
  { value: 'table', label: 'Table' },
  { value: 'kanban', label: 'Kanban' },
  { value: 'gantt', label: 'Gantt' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'gallery', label: 'Gallery' }
]

function handleCreate() {
  if (!form.value.name) return
  
  emit('create', {
    name: form.value.name,
    type: form.value.type,
    groupByField: form.value.groupByField || undefined,
    startDateField: form.value.startDateField || undefined,
    endDateField: form.value.endDateField || undefined,
    dateField: form.value.dateField || undefined,
    titleField: form.value.titleField || undefined
  })
  
  // Reset form
  form.value = {
    name: '',
    type: 'table',
    groupByField: '',
    startDateField: '',
    endDateField: '',
    dateField: '',
    titleField: ''
  }
  
  dialogVisible.value = false
}

function handleCancel() {
  dialogVisible.value = false
  // Reset form
  form.value = {
    name: '',
    type: 'table',
    groupByField: '',
    startDateField: '',
    endDateField: '',
    dateField: '',
    titleField: ''
  }
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="Add New View"
    width="480px"
    :close-on-click-modal="false"
    @close="handleCancel"
  >
    <el-form label-position="top">
      <el-form-item label="View Name" required>
        <el-input
          v-model="form.name"
          placeholder="Enter view name"
        />
      </el-form-item>

      <el-form-item label="View Type" required>
        <el-radio-group v-model="form.type" class="view-type-group">
          <el-radio-button
            v-for="option in viewTypeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- Kanban Config -->
      <KanbanViewConfig
        v-if="form.type === 'kanban'"
        :columns="columns"
        v-model="form.groupByField"
      />

      <!-- Gantt Config -->
      <GanttViewConfig
        v-if="form.type === 'gantt'"
        :columns="columns"
        v-model:title-field="form.titleField"
        v-model:start-date-field="form.startDateField"
        v-model:end-date-field="form.endDateField"
      />

      <!-- Calendar Config -->
      <CalendarViewConfig
        v-if="form.type === 'calendar'"
        :columns="columns"
        v-model="form.dateField"
      />

      <!-- Gallery Config -->
      <GalleryViewConfig
        v-if="form.type === 'gallery'"
        :columns="columns"
        v-model="form.titleField"
      />
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">Cancel</el-button>
      <el-button
        type="primary"
        :disabled="!form.name"
        @click="handleCreate"
      >
        Create View
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.view-type-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-xs);

  :deep(.el-radio-button__inner) {
    border-radius: var(--app-border-radius-s) !important;
    border-left-width: 1px !important;
  }
}
</style>

