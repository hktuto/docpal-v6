<script lang="ts" setup>
import { useMDGanttInject } from "../../../composables/mdGantt/useMDGantt"
import { useTableViewsInject } from "../../../../dynamic-db/composables/table/useTableViews"
import { ElMessage, ElMessageBox } from 'element-plus'
const visible = ref(false)
const { viewStyleConfig, columns, updateViewFilterSortGroup } = useMDGanttInject()
const { addField, deleteView, currentView } = useTableViewsInject()

const form = ref({
  startField: '',
  endField: ''
})

const dateFields = computed(() => {
  return columns.value?.filter((col: any) => {
    const bt = col.business_type?.toString()
    return bt === '5'
  }) || []
})

const hasDateFields = computed(() => dateFields.value.length > 0)

function open() {
  visible.value = true
  form.value = {
    startField: viewStyleConfig.value?.startField || '',
    endField: viewStyleConfig.value?.endField || ''
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
    endField: form.value.endField
  }
  await updateViewFilterSortGroup?.('style', newStyle)
  close()
}

async function handleAddDateFields() {
  const timestamp = Date.now()
  const newColumns = [
    {
      field_name: `Start Date`,
      business_type: '5',
      display_structure: {
        format: 'YYYY-MM-DD',
        includeTime: false
      }
    },
    {
      field_name: `Start Date`,
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
      'Are you sure you want to remove this Gantt view?',
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
          <h4>Gantt Configuration</h4>

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

          <ElFormItem>
            <ElButton type="primary" @click="submitSetting">Save</ElButton>
            <ElButton @click="close">Close</ElButton>
          </ElFormItem>
        </ElForm>
      </template>

      <template v-else>
        <div class="no-fields-state">
          <p>No date fields available in this table.</p>
          <p class="hint">Gantt view requires at least one date field to configure start and end dates.</p>
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
