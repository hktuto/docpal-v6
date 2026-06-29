<template>
  <el-dialog
    v-model="state.visible"
    :title="$t('detailWidget.relatedTableListSettings')"
    width="500px"
    destroy-on-close
  >
    <el-form label-position="top" size="default">
      <!-- Relation Field Selection -->
      <el-form-item :label="$t('detailWidget.selectRelationField')">
        <el-select
          v-model="state.setting.relationFieldName"
          :placeholder="$t('detailWidget.selectRelation')"
          style="width: 100%"
        >
          <el-option
            v-for="field in relationFields"
            :key="field.fieldName"
            :label="field.fieldNameAlias || field.fieldName"
            :value="field.fieldName"
          />
        </el-select>
      </el-form-item>

      <!-- Display Columns -->
      <el-form-item :label="$t('detailWidget.columnsToDisplay')">
        <el-select
          v-model="state.setting.displayColumns"
          multiple
          :placeholder="$t('detailWidget.selectColumns')"
          style="width: 100%"
          :disabled="!state.setting.relationFieldName"
        >
          <el-option
            v-for="field in targetFields"
            :key="field.fieldName"
            :label="field.fieldNameAlias || field.fieldName"
            :value="field.fieldName"
          />
        </el-select>
        <div class="form-tip">
          {{ $t('detailWidget.columnsToDisplayTip') }}
        </div>
      </el-form-item>

      <!-- Page Size -->
      <el-form-item :label="$t('detailWidget.pageSize')">
        <el-input-number
          v-model="state.setting.pageSize"
          :min="1"
          :max="50"
          :step="5"
        />
      </el-form-item>

      <!-- Options -->
      <el-form-item :label="$t('detailWidget.options')">
        <div class="options-group">
          <el-checkbox v-model="state.setting.allowAdd">
            {{ $t('detailWidget.allowAddRecords') }}
          </el-checkbox>
          <el-checkbox v-model="state.setting.allowOpen">
            {{ $t('detailWidget.allowOpenRecords') }}
          </el-checkbox>
        </div>
      </el-form-item>
    </el-form>

    <!-- Default Filter -->
    <div class="setting-section">
      <div class="setting-section__title">{{ $t('common_defaultFilter') }}</div>
      <ToolsFilterButton
        :available-columns="availableFilterColumns"
        :column-filter-rules="state.setting.filterRules"
        @filter-change="state.setting.filterRules = $event"
      />
    </div>

    <!-- Default Sort -->
    <div class="setting-section">
      <div class="setting-section__title">{{ $t('common_defaultSort') }}</div>
      <ToolsSortButton
        :available-columns="availableFilterColumns"
        @sort-change="state.setting.sortRules = $event"
      />
    </div>

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
import { reactive, watch, computed, provide } from 'vue'
import type { RelatedTableListWidgetSetting } from '../../../utils/detailWidgetHelper'
import type { FieldInfo } from '../../../types/view-config'
import { ColumnFieldType } from '../../../types/column-types'
import { type FilterRule } from '../../tools/filter/ConfigPopover.vue'
import { type SortRule } from '../../tools/sort/configPopover.vue'
import ToolsFilterButton from '../../tools/filter/Button.vue'
import ToolsSortButton from '../../tools/sort/button.vue'

const props = defineProps<{
  setting: RelatedTableListWidgetSetting
  relationFields: FieldInfo[]
  targetFields: FieldInfo[]
}>()

const emit = defineEmits<{
  refresh: [setting: RelatedTableListWidgetSetting]
  delete: []
}>()

const state = reactive({
  visible: false,
  setting: {
    relationFieldName: '',
    displayColumns: [] as string[],
    pageSize: 5,
    allowAdd: true,
    allowOpen: true,
    filterRules: {
      conditions: [] as FilterRule[],
      conjunction: 'AND' as 'AND' | 'OR'
    },
    sortRules: [] as SortRule[]
  }
})

const availableFilterColumns = computed(() => {
  return props.targetFields
    .filter(
      (f) =>
        f.type !== ColumnFieldType.Relation &&
        f.type !== ColumnFieldType.VirtualColumn &&
        f.type !== ColumnFieldType.Formula &&
        f.type !== ColumnFieldType.AggVirtualColumn
    )
    .map((f) => ({
      field_name: f.fieldName,
      field_name_alias: f.fieldNameAlias,
      field: f.fieldName,
      title: f.fieldNameAlias || f.fieldName,
      type: f.type,
      business_type: f.type as ColumnFieldType,
      display_structure: f.properties || {}
    }))
})

const columnSortRules = computed({
  get: () => state.setting.sortRules,
  set: (val) => {
    state.setting.sortRules = val
  }
})
provide('viewTools', { columnSortRules })

// Clear display columns when relation changes
watch(
  () => state.setting.relationFieldName,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      state.setting.displayColumns = []
    }
  }
)

function handleOpen(setting: RelatedTableListWidgetSetting) {
  state.setting = {
    relationFieldName: setting.relationFieldName || '',
    displayColumns: [...(setting.displayColumns || [])],
    pageSize: setting.pageSize || 5,
    allowAdd: setting.allowAdd ?? true,
    allowOpen: setting.allowOpen ?? true,
    filterRules: {
      conditions: [...(setting.filterRules?.conditions || [])],
      conjunction: setting.filterRules?.conjunction || 'AND'
    },
    sortRules: [...(setting.sortRules || [])]
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
.form-tip {
  font-size: var(--app-font-size-xs);
  color: var(--el-text-color-secondary);
  margin-top: var(--app-space-xs);
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.dialog-footer {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);

  .spacer {
    flex: 1;
  }
}

.setting-section {
  margin-top: var(--app-space-m);

  .setting-section__title {
    font-size: var(--app-font-size-m);
    font-weight: 600;
    margin-bottom: var(--app-space-s);
    color: var(--el-text-color-primary);
  }
}
</style>
