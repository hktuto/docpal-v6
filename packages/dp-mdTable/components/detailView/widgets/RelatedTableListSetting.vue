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
import { reactive, watch } from 'vue'
import type { RelatedTableListWidgetSetting } from '../../../utils/detailWidgetHelper'
import type { FieldInfo } from '../../../types/view-config'

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
    allowOpen: true
  }
})

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
    allowOpen: setting.allowOpen ?? true
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
</style>
