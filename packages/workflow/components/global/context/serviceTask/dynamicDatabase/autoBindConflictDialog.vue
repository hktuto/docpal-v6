<script lang="ts" setup>
export type AutoBindConflictItem = {
  fieldId: string
  fieldName: string
  currentValue: string
  currentLabel: string
  targetValue: string
  targetLabel: string
}

const { t } = useI18n()
const emits = defineEmits<{
  confirm: [selected: AutoBindConflictItem[]]
}>()

const opened = ref(false)
const rows = ref<(AutoBindConflictItem & { checked: boolean })[]>([])

const selectedCount = computed(() => rows.value.filter((row) => row.checked).length)
const canConfirm = computed(() => selectedCount.value > 0)

function handleOpen(conflicts: AutoBindConflictItem[]) {
  rows.value = conflicts.map((item) => ({ ...item, checked: true }))
  opened.value = true
}

function handleConfirm() {
  const selected = rows.value
    .filter((row) => row.checked)
    .map(({ checked, ...rest }) => {
      void checked
      return rest
    })
  opened.value = false
  emits('confirm', selected)
}

function handleCancel() {
  opened.value = false
}

defineExpose({ handleOpen })
</script>

<template>
  <el-dialog
    v-model="opened"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    :title="t('workflow_autoBindConflictTitle')"
  >
    <p class="hint">{{ t('workflow_autoBindConflictHint') }}</p>
    <div class="conflict-list">
      <div
        v-for="row in rows"
        :key="row.fieldId"
        class="conflict-row"
        tabindex="0"
        role="checkbox"
        :aria-checked="row.checked"
        :aria-label="row.fieldName"
        @click="row.checked = !row.checked"
        @keydown.enter.prevent="row.checked = !row.checked"
        @keydown.space.prevent="row.checked = !row.checked"
      >
        <el-checkbox v-model="row.checked" @click.stop />
        <div class="conflict-info">
          <div class="field-name">{{ row.fieldName }}</div>
          <div class="bind-change">
            <span class="current">{{ row.currentLabel }}</span>
            <span class="arrow">→</span>
            <span class="target">{{ row.targetLabel }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleCancel">{{ t('common_cancel') }}</el-button>
      <el-button type="primary" :disabled="!canConfirm" @click="handleConfirm">
        {{ t('common_submit') }} ({{ selectedCount }})
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.hint {
  margin: 0 0 var(--app-space-s);
  color: var(--el-text-color-secondary);
  font-size: var(--app-font-size-s);
}

.conflict-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  max-height: 40vh;
  overflow: auto;
}

.conflict-row {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-s);
  padding: var(--app-space-s);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
}

.conflict-info {
  flex: 1;
  min-width: 0;
}

.field-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.bind-change {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-secondary);
}

.current {
  text-decoration: line-through;
}

.target {
  color: var(--el-color-primary);
}

.arrow {
  color: var(--el-text-color-placeholder);
}
</style>
