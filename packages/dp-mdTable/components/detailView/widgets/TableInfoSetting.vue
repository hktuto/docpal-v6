<template>
  <el-dialog
    v-model="state.visible"
    :title="$t('detailWidget.tableInfoSettings')"
    width="500px"
    destroy-on-close
  >
    <el-form label-position="top" size="default">
      <!-- Layout Selection -->
      <el-form-item :label="$t('detailWidget.layout')">
        <el-radio-group v-model="state.setting.layout">
          <el-radio-button value="grid">
            <Icon name="lucide:layout-grid" size="14" />
            {{ $t('detailWidget.layoutGrid') }}
          </el-radio-button>
          <el-radio-button value="list">
            <Icon name="lucide:layout-list" size="14" />
            {{ $t('detailWidget.layoutList') }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- Grid Columns (only for grid layout) -->
      <el-form-item v-if="state.setting.layout === 'grid'" :label="$t('detailWidget.gridColumns')">
        <el-radio-group v-model="state.setting.gridColumns">
          <el-radio-button :value="1">1</el-radio-button>
          <el-radio-button :value="2">2</el-radio-button>
          <el-radio-button :value="3">3</el-radio-button>
          <el-radio-button :value="4">4</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- Show Labels -->
      <el-form-item :label="$t('detailWidget.showLabels')">
        <el-switch v-model="state.setting.showLabels" />
      </el-form-item>

      <!-- Field Selection -->
      <el-form-item :label="$t('detailWidget.fieldsToDisplay')">
        <div class="field-selector">
          <el-checkbox-group v-model="state.setting.fields">
            <draggable
              v-model="state.setting.fields"
              item-key="fieldName"
              handle=".drag-handle"
              :animation="200"
            >
              <template #item="{ element: fieldName }">
                <div class="field-item selected">
                  <Icon name="lucide:grip-vertical" class="drag-handle" size="14" />
                  <el-checkbox :value="fieldName" :label="getFieldLabel(fieldName)">
                    {{ getFieldLabel(fieldName) }}
                  </el-checkbox>
                </div>
              </template>
            </draggable>
          </el-checkbox-group>
          
          <!-- Available fields not yet selected -->
          <div class="available-fields">
            <div class="section-label">{{ $t('detailWidget.availableFields') }}</div>
            <div 
              v-for="field in availableFields" 
              :key="field.fieldName"
              class="field-item available"
              @click="addField(field.fieldName)"
            >
              <Icon name="lucide:plus" size="14" />
              <span>{{ field.fieldNameAlias || field.fieldName }}</span>
            </div>
            <div v-if="availableFields.length === 0" class="no-fields">
              {{ $t('detailWidget.allFieldsSelected') }}
            </div>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button type="danger" text @click="handleDelete">
          {{ $t('common_delete') }}
        </el-button>
        <div class="spacer"></div>
        <el-button @click="handleClose">{{ $t('common_cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ $t('common_save') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import draggable from 'vuedraggable'
import type { TableInfoWidgetSetting } from '../../../utils/detailWidgetHelper'
import type { FieldInfo } from '../../../types/view-config'
import { ColumnFieldType } from '../../../types/column-types'

const props = defineProps<{
  setting: TableInfoWidgetSetting
  fields: FieldInfo[]
}>()

const emit = defineEmits<{
  refresh: [setting: TableInfoWidgetSetting]
  delete: []
}>()

const state = reactive({
  visible: false,
  setting: {
    fields: [] as string[],
    layout: 'grid' as 'list' | 'grid',
    showLabels: true,
    gridColumns: 2
  }
})

// Fields that can be selected (exclude relations)
const selectableFields = computed(() => {
  return props.fields.filter(f => 
    f.type !== ColumnFieldType.MagicLink && 
    f.type !== ColumnFieldType.VirtualColumn
  )
})

// Fields not yet selected
const availableFields = computed(() => {
  const selectedSet = new Set(state.setting.fields)
  return selectableFields.value.filter(f => !selectedSet.has(f.fieldName))
})

function getFieldLabel(fieldName: string): string {
  const field = props.fields.find(f => f.fieldName === fieldName)
  return field?.fieldNameAlias || fieldName
}

function addField(fieldName: string) {
  if (!state.setting.fields.includes(fieldName)) {
    state.setting.fields.push(fieldName)
  }
}

function handleOpen(setting: TableInfoWidgetSetting) {
  state.setting = {
    fields: [...(setting.fields || [])],
    layout: setting.layout || 'grid',
    showLabels: setting.showLabels ?? true,
    gridColumns: setting.gridColumns || 2
  }
  state.visible = true
}

function handleClose() {
  state.visible = false
}

function handleSubmit() {
  emit('refresh', { ...state.setting })
  state.visible = false
}

function handleDelete() {
  emit('delete')
  state.visible = false
}

defineExpose({
  handleOpen
})
</script>

<style lang="scss" scoped>
.field-selector {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  max-height: 300px;
  overflow-y: auto;
}

.field-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-s) var(--app-space-m);
  border-bottom: 1px solid var(--el-border-color-lighter);
  
  &:last-child {
    border-bottom: none;
  }

  &.selected {
    background: var(--el-color-primary-light-9);
  }

  &.available {
    cursor: pointer;
    
    &:hover {
      background: var(--el-fill-color-light);
    }
  }

  .drag-handle {
    cursor: grab;
    color: var(--el-text-color-placeholder);
    
    &:active {
      cursor: grabbing;
    }
  }
}

.available-fields {
  border-top: 2px solid var(--el-border-color);
}

.section-label {
  padding: var(--app-space-s) var(--app-space-m);
  font-size: var(--app-font-size-xs);
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}

.no-fields {
  padding: var(--app-space-m);
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: var(--app-font-size-s);
}

.dialog-footer {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);

  .spacer {
    flex: 1;
  }
}
</style>
