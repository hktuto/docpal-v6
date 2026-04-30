<script lang="ts" setup>
import { useMDCalendarInject } from "../../../composables/mdCalendar/useMDCalendar"
import { useTableViewsInject } from "../../../../dynamic-db/composables/table/useTableViews"

const visible = ref(false)
const { viewStyleConfig, columns, updateViewFilterSortGroup } = useMDCalendarInject()
const { addField, deleteView, currentView } = useTableViewsInject()

const form = ref({
  startField: '',
  endField: '',
  titleField: '',
  isFullDayField: ''
})

const dateFields = computed(() => {
  return columns.value?.filter((col: any) => {
    const bt = col.business_type?.toString()
    return bt === '5'
  }) || []
})

const textFields = computed(() => {
  return columns.value?.filter((col: any) => {
    const bt = col.business_type?.toString()
    return bt === '19'
  }) || []
})

const booleanFields = computed(() => {
  return columns.value?.filter((col: any) => {
    const bt = col.business_type?.toString()
    return bt === '11'
  }) || []
})

const hasDateFields = computed(() => dateFields.value.length > 0)

const selectedStartField = computed(() =>
  dateFields.value.find((f: any) => f.field_name === form.value.startField)
)

const selectedEndField = computed(() =>
  dateFields.value.find((f: any) => f.field_name === form.value.endField)
)

const hasTimeDateField = computed(() => {
  const check = (field: any) => {
    if (!field) return false
    const ds = field.display_structure
    return ds?.type === 'datetime' || ds?.includeTime === true
  }
  return check(selectedStartField.value) || check(selectedEndField.value)
})

function open() {
  visible.value = true
  form.value = {
    startField: viewStyleConfig.value?.startField || '',
    endField: viewStyleConfig.value?.endField || '',
    titleField: viewStyleConfig.value?.titleField || '',
    isFullDayField: viewStyleConfig.value?.isFullDayField || ''
  }
}

function close() {
  visible.value = false
}

async function submitSetting() {
  if (!form.value.startField || !form.value.endField) {
    ElMessage.warning('Please select start and end date fields')
    return
  }
  const newStyle = {
    ...viewStyleConfig.value,
    startField: form.value.startField,
    endField: form.value.endField,
    titleField: form.value.titleField || undefined,
    isFullDayField: form.value.isFullDayField || undefined
  }
  await updateViewFilterSortGroup?.('style', newStyle)
  close()
}

async function handleAddDateFields() {
  const timestamp = Date.now()
  const newColumns = [
    {
      field_name: `start_date_${timestamp}`,
      business_type: '5',
      display_structure: {
        format: 'YYYY-MM-DD',
        includeTime: false
      }
    },
    {
      field_name: `end_date_${timestamp}`,
      business_type: '5',
      display_structure: {
        format: 'YYYY-MM-DD',
        includeTime: false
      }
    }
  ]
  await addField(newColumns)
  ElMessage.success('Date fields added')
}

async function handleRemoveView() {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to remove this Calendar view?',
      'Confirm Remove',
      {
        confirmButtonText: 'Remove',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
    await deleteView?.(currentView.value?.id)
    close()
  } catch {
    // user cancelled
  }
}

defineExpose({
  open,
  close,
})
</script>

<template>
  <div v-if="visible" class="simple-dialog-overlay">
    <div class="simple-dialog">
      <template v-if="hasDateFields">
        <ElForm label-position="top">
          <h4>Calendar Configuration</h4>

          <ElFormItem label="Start Date Field" required>
            <ElSelect v-model="form.startField" placeholder="Select start date field" clearable filterable>
              <ElOption
                v-for="column in dateFields"
                :key="column.field_name"
                :label="column.field_name_alias"
                :value="column.field_name"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="End Date Field" required>
            <ElSelect v-model="form.endField" placeholder="Select end date field" clearable filterable>
              <ElOption
                v-for="column in dateFields"
                :key="column.field_name"
                :label="column.field_name_alias"
                :value="column.field_name"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="Title Field">
            <ElSelect v-model="form.titleField" placeholder="Select field to display as title" clearable filterable>
              <ElOption
                v-for="column in textFields"
                :key="column.field_name"
                :label="column.field_name_alias"
                :value="column.field_name"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem v-if="hasTimeDateField" label="All Day Field">
            <ElSelect v-model="form.isFullDayField" placeholder="Select boolean field for all-day flag" clearable filterable>
              <ElOption
                v-for="column in booleanFields"
                :key="column.field_name"
                :label="column.field_name_alias"
                :value="column.field_name"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem>
            <ElButton type="primary" @click="submitSetting">Save</ElButton>
            <ElButton @click="close">Close</ElButton>
          </ElFormItem>
        </ElForm>
      </template>

      <template v-else>
        <div class="no-fields-state">
          <p>No date fields available in this table.</p>
          <p class="hint">Calendar view requires at least one date field to configure start and end dates.</p>
          <div class="actions">
            <ElButton type="primary" @click="handleAddDateFields">Add Start & End Date Fields</ElButton>
            <ElButton type="danger" @click="handleRemoveView">Remove View</ElButton>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.simple-dialog-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.simple-dialog {
  background: var(--app-paper);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-m);
  min-width: 420px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  box-shadow: var(--app-shadow-l);
}

.no-fields-state {
  text-align: center;
  padding: var(--app-space-m);

  p {
    margin: 0 0 var(--app-space-s);
    color: var(--app-grey-300);
  }

  .hint {
    font-size: var(--app-font-size-s);
    color: var(--app-grey-600);
    margin-bottom: var(--app-space-l);
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: var(--app-space-s);
  }
}
</style>
