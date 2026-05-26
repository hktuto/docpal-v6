<script lang="ts" setup>
import { useMDKanbanInject } from "../../../composables/mdKanban/useMDKanban"
import {useTableViewsInject} from '../../../../dynamic-db/composables/table/useTableViews'

const visible = ref(false);
const { viewStyleConfig, updateViewFilterSortGroup, columns } = useMDKanbanInject()
const { deleteView, currentView, addField } = useTableViewsInject()

function open(setting: any) {
  visible.value = true;
  form.value = {
    selectedColumnId: '',
    options: [],
    layout: { title: '', content: [] },
    ...viewStyleConfig.value,
    ...setting
  }
}

function close() {
  visible.value = false;
}

// Form Logic
// Form State
const form = ref({
  selectedColumnId:"",
  options: [],
  layout: {
    title: "",
    content:[]
  }
})
// columns fiter
const selectFilter = computed(() => {
  return columns.value.filter((column:any) => column.business_type.toString() === "3")
})

const selectedColumnDetail = computed(() => {
  return columns.value.find((column:any) => column.field_name === form.value.selectedColumnId)
})

const availableColumns = computed(() => columns.value || [])

const availableContentColumns = computed(() => {
  const used = new Set(form.value.layout?.content || [])
  if (form.value.layout?.title) used.add(form.value.layout.title)
  return availableColumns.value.filter((col: any) => !used.has(col.field_name))
})

function getColumnLabel(fieldName: string) {
  const col = columns.value?.find((c: any) => c.field_name === fieldName)
  return col?.field_name_alias || fieldName
}

function addContentField(fieldName: string) {
  if (!fieldName) return
  if (!form.value.layout) {
    form.value.layout = { title: '', content: [] }
  }
  if (!form.value.layout.content) {
    form.value.layout.content = []
  }
  form.value.layout.content.push(fieldName)
}

function removeContentField(fieldName: string) {
  if (!form.value.layout?.content) return
  const index = form.value.layout.content.indexOf(fieldName)
  if (index > -1) {
    form.value.layout.content.splice(index, 1)
  }
}

function moveContentField(index: number, direction: number) {
  if (!form.value.layout?.content) return
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= form.value.layout.content.length) return
  const item = form.value.layout.content.splice(index, 1)[0]
  form.value.layout.content.splice(newIndex, 0, item)
}

async function submitSetting(){
  // check if selectedColumnId is valid
  form.value.options = selectedColumnDetail.value?.display_structure.options
  await updateViewFilterSortGroup?.('style', form.value)
  close()
}

async function deleteKanban() {
  await deleteView?.(currentView.value.id)
  close()
}

async function addDummyColumn() {
// create columns to table and set form
  const dummyColumns = [
    {
    "field_name": "New Field",
    "business_type": "3",
    "display_structure": {
      "options": [
        {
          "id": `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          "label": "pending",
          "color": "#9b59b6"
        },
        {
          "id": `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          "label": "in progress",
          "color": "#3498db"
        },
        {
          "id": `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          "label": "done",
          "color": "#1abc9c"
        }
      ]
    }
  }]
  await addField(dummyColumns)
  const selectColumn = columns.value.filter((col) => col.business_type === '3')
  if (selectColumn && selectColumn.length == 1) {
    // only one select column, auto selecte this column
    form.value.selectedColumnId = selectColumn[0].field_name
    submitSetting()
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
      <ElForm :model="form" label-position="top">

        <ElFormItem v-if="selectFilter.length > 0" label="Column" >
          <ElSelect v-model="form.selectedColumnId" placeholder="Select a column" clearable filterable>
            <ElOption v-for="column in selectFilter" :key="column.field_name" :label="column.field_name_alias" :value="column.field_name">
              {{column.field_name_alias}}
            </ElOption>
          </ElSelect>
        </ElFormItem>

        <div v-else>
          <div>No columns available</div>
          <ElButton type="primary" @click="addDummyColumn">Create Select Column</ElButton>
          <ElButton type="primary" @click="deleteKanban">Remove View</ElButton>
        </div>
        <template v-if="form.selectedColumnId">
          <h4>Card Layout:</h4>
          <div class="cardPreviewContainer">
            <!-- Live Preview -->
            <div class="card-preview">
              <div class="preview-header">
                <div class="preview-title">{{ getColumnLabel(form.layout?.title) || 'Title' }}</div>
              </div>
              <div class="preview-content">
                <div v-for="field in form.layout?.content" :key="field" class="preview-field">
                  <span class="preview-label">{{ getColumnLabel(field) }}</span>
                  <span class="preview-value">—</span>
                </div>
                <div v-if="!form.layout?.content?.length" class="preview-empty">No content fields</div>
              </div>
            </div>

            <!-- Config -->
            <div class="layout-config">
              <ElFormItem label="Title Field">
                <ElSelect v-model="form.layout.title" placeholder="Select title field" clearable>
                  <ElOption
                    v-for="column in availableColumns"
                    :key="column.field_name"
                    :label="column.field_name_alias"
                    :value="column.field_name"
                  />
                </ElSelect>
              </ElFormItem>

              <ElFormItem label="Content Fields">
                <div class="content-fields-list">
                  <div
                    v-for="(field, index) in form.layout?.content"
                    :key="field"
                    class="content-field-item"
                  >
                    <span class="field-name">{{ getColumnLabel(field) }}</span>
                    <div class="field-actions">
                      <ElButton
                        v-if="index > 0"
                        text
                        size="small"
                        @click="moveContentField(index, -1)"
                      >
                        ↑
                      </ElButton>
                      <ElButton
                        v-if="index < form.layout.content.length - 1"
                        text
                        size="small"
                        @click="moveContentField(index, 1)"
                      >
                        ↓
                      </ElButton>
                      <ElButton
                        text
                        size="small"
                        type="danger"
                        @click="removeContentField(field)"
                      >
                        ×
                      </ElButton>
                    </div>
                  </div>
                </div>
                <ElSelect
                  v-if="availableContentColumns.length"
                  placeholder="Add field"
                  clearable
                  @change="addContentField"
                >
                  <ElOption
                    v-for="column in availableContentColumns"
                    :key="column.field_name"
                    :label="column.field_name_alias"
                    :value="column.field_name"
                  />
                </ElSelect>
              </ElFormItem>
            </div>
          </div>
        </template>
        <ElFormItem>
          <ElButton v-if="selectFilter.length > 0" type="primary" @click="submitSetting">Save</ElButton>
          <ElButton v-if="viewStyleConfig.selectedColumnId" @click="close">Close</ElButton>
        </ElFormItem>
      </ElForm>
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

.cardPreviewContainer {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.card-preview {
  background: var(--app-paper);
  border: 1px solid var(--app-grey-800);
  border-radius: var(--app-border-radius-s);
  padding: var(--app-space-s);
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  align-self: start;

  .preview-title {
    font-weight: bold;
    font-size: var(--app-font-size-m);
    min-height: 20px;
    word-break: break-word;
  }

  .preview-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .preview-field {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--app-font-size-s);
    color: var(--app-grey-300);
  }

  .preview-empty {
    font-size: var(--app-font-size-s);
    color: var(--app-grey-600);
    font-style: italic;
  }
}

.layout-config {
  .content-fields-list {
    margin-bottom: 8px;
    max-height: 160px;
    overflow: auto;
  }

  .content-field-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    background: var(--app-grey-900);
    border-radius: var(--app-border-radius-s);
    margin-bottom: 4px;

    .field-name {
      font-size: var(--app-font-size-s);
    }

    .field-actions {
      display: flex;
      align-items: center;
      gap: 2px;
    }
  }
}
</style>
