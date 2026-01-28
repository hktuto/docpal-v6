<template>
  <el-dialog
    v-model="visible"
    :title="$t('detailWidget.auditHistorySettings')"
    width="400px"
    :close-on-click-modal="false"
  >
    <el-form label-position="top">
      <el-form-item :label="$t('detailWidget.maxItemsToShow')">
        <el-input-number
          v-model="localSetting.maxItems"
          :min="1"
          :max="50"
          size="default"
        />
      </el-form-item>

      <el-form-item :label="$t('detailWidget.showChangeDetails')">
        <el-switch v-model="localSetting.showDetails" />
      </el-form-item>

      <el-form-item v-if="localSetting.showDetails" :label="$t('detailWidget.maxFieldsToShow')">
        <el-input-number
          v-model="localSetting.maxFieldsToShow"
          :min="1"
          :max="10"
          size="default"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button type="danger" text @click="handleDelete">
          <Icon name="lucide:trash-2" size="14" />
          {{ $t('common_delete') }}
        </el-button>
        <div class="spacer" />
        <el-button @click="visible = false">{{ $t('common_cancel') }}</el-button>
        <el-button type="primary" @click="handleSave">{{ $t('common_save') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { RecordAuditHistoryWidgetSetting } from '../../../utils/detailWidgetHelper'

const props = defineProps<{
  setting: RecordAuditHistoryWidgetSetting
}>()

const emit = defineEmits<{
  (e: 'refresh', setting: RecordAuditHistoryWidgetSetting): void
  (e: 'delete'): void
}>()

const { t: $t } = useI18n()
const visible = ref(false)

const localSetting = ref<RecordAuditHistoryWidgetSetting>({
  ...props.setting,
  maxItems: props.setting.maxItems || 5,
  showDetails: props.setting.showDetails ?? true,
  maxFieldsToShow: props.setting.maxFieldsToShow || 3
})

function open() {
  localSetting.value = {
    ...props.setting,
    maxItems: props.setting.maxItems || 5,
    showDetails: props.setting.showDetails ?? true,
    maxFieldsToShow: props.setting.maxFieldsToShow || 3
  }
  visible.value = true
}

function handleSave() {
  emit('refresh', { ...localSetting.value })
  visible.value = false
}

function handleDelete() {
  emit('delete')
  visible.value = false
}

watch(() => props.setting, (newSetting) => {
  localSetting.value = {
    ...newSetting,
    maxItems: newSetting.maxItems || 5,
    showDetails: newSetting.showDetails ?? true,
    maxFieldsToShow: newSetting.maxFieldsToShow || 3
  }
}, { deep: true })

defineExpose({ open })
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  align-items: center;
  gap: 8px;

  .spacer {
    flex: 1;
  }
}
</style>
