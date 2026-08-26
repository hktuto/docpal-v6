<template>
  <div class="detail-item" :class="{ 'is-no-label': !hasLabel }">
    <span v-if="hasLabel" class="detail-label" :class="{ 'is-required': required }">{{ label }}</span>

    <div class="detail-value-wrap">
      <div v-if="isEditing && type === 'date'" class="detail-value-edit is-date" :class="{ 'has-action': !!buttonText }">
        <el-date-picker
          ref="datePickerRef"
          v-model="draft"
          type="date"
          size="small"
          :format="format"
          :value-format="format"
          :aria-label="$t('workflowWarehouse.editDate')"
          @change="handleDateChange"
          @visible-change="handleDateVisibleChange"
          @keydown.esc.prevent="handleCancel"
        />
        <el-button
          v-if="buttonText"
          v-tooltip="buttonTitle || buttonText"
          type="primary"
          size="small"
          @click="handleBotton"
        >
          {{ buttonText }}
        </el-button>
      </div>

      <div v-else-if="isEditing && type === 'select'" class="detail-value-edit is-select">
        <el-select-v2
          ref="selectRef"
          v-model="draft"
          :options="options"
          :fit-input-width="false"
          :popper-style="{ maxWidth: '50rem' }"
          placement="bottom-start"
          :fallback-placements="['bottom-start', 'bottom', 'bottom-end']"
          size="small"
          filterable
          clearable
          :placeholder="$t('el.select.placeholder')"
          :aria-label="$t('workflowWarehouse.editSelect')"
          @change="handleSave"
          @visible-change="handleSelectVisibleChange"
          @keydown.esc.prevent="handleCancel"
        />
      </div>

      <div v-else-if="isEditing" class="detail-value-edit is-textarea" @focusout="handleFocusOut">
        <el-input
          ref="inputRef"
          v-model="draft"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 6 }"
          :aria-label="$t('workflowWarehouse.editValue')"
          @keydown.esc.prevent="handleCancel"
          @keydown.enter.exact.prevent="handleSave"
        />
      </div>

      <div class="detail-value" :class="{ 'is-hidden': isEditing }">
        <span v-if="textValue" class="detail-value-text" :title="String(textValue)">{{ textValue }}</span>
        <span
          v-else
          class="detail-value-text"
          :class="{ 'is-editable': !disabled }"
          :title="displayValue"
          :tabindex="disabled ? undefined : 0"
          :aria-label="!disabled ? $t('workflowWarehouse.clickToEdit') : label"
          @click="handleStartEdit"
          @keydown.enter.prevent="handleStartEdit"
        >
          {{ displayValue }}
        </span>
        <template v-if="!disabled">
          <el-icon v-if="status === 'loading'" class="detail-edit-icon is-loading" aria-hidden="true">
            <Loading />
          </el-icon>
          <el-icon v-else-if="status === 'fail'" class="detail-edit-icon is-fail" aria-hidden="true" @click="handleRetry">
            <RefreshRight />
          </el-icon>
          <el-icon v-else class="detail-edit-icon" aria-hidden="true" @click="handleStartEdit">
            <EditPen />
          </el-icon>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EditPen, Loading, RefreshRight } from '@element-plus/icons-vue'
import type { InputInstance } from 'element-plus'

export type DetailSelectOption = {
  label: string
  value: string | number
}

const props = withDefaults(
  defineProps<{
    label?: string
    value?: string | number | null
    textValue?: string | number
    disabled?: boolean
    type?: 'text' | 'date' | 'select'
    status?: 'pass' | 'fail' | 'loading'
    options?: DetailSelectOption[]
    buttonText?: string
    buttonTitle?: string
    format?: string
    required?: boolean
  }>(),
  {
    label: '',
    disabled: false,
    type: 'text',
    status: 'pass',
    options: () => [],
    buttonText: '',
    buttonTitle: '',
    format: 'YYYY/MM/DD',
    required: false
  }
)

const hasLabel = computed(() => Boolean(props.label?.trim()))

const emit = defineEmits<{
  'update:value': [value: string]
  save: [value: string]
  button: [value: string]
}>()

const { formatDate } = useTime()

const isEditing = ref(false)
const draft = ref<string | number>('')
const inputRef = ref<InputInstance>()
const datePickerRef = ref()
const selectRef = ref()

const displayValue = computed(() => {
  const val = props.value
  if (val === null || val === undefined || val === '') return '—'
  if (props.type === 'date') {
    return formatDate(String(val), props.format) || String(val)
  }
  if (props.type === 'select') {
    const matched = props.options.find((opt) => String(opt.value) === String(val))
    return matched?.label ?? String(val)
  }
  return String(val)
})

function toDateDraft(val: string | number | null | undefined) {
  if (val === null || val === undefined || val === '') return ''
  return formatDate(String(val), props.format) || String(val)
}

async function handleStartEdit() {
  if (props.disabled) return
  if (props.type === 'date') {
    draft.value = toDateDraft(props.value)
  } else if (props.type === 'select') {
    draft.value = props.value == null || props.value === '' ? '' : String(props.value)
  } else {
    draft.value = props.value == null ? '' : props.value
  }
  isEditing.value = true
  await nextTick()
  if (props.type === 'date') {
    datePickerRef.value?.focus?.()
  } else if (props.type === 'select') {
    // Defer open so the click that entered edit mode does not close the menu as outside-click
    setTimeout(() => {
      selectRef.value?.focus?.()
      selectRef.value?.toggleMenu?.()
    }, 0)
  } else {
    inputRef.value?.focus()
  }
}

function getComparableValue(val: string | number | null | undefined) {
  if (props.type === 'date') return toDateDraft(val)
  return val == null ? '' : String(val)
}

function handleSave() {
  if (!isEditing.value || props.disabled) return
  const value = draft.value == null ? '' : String(draft.value)
  const oldValue = getComparableValue(props.value)
  isEditing.value = false
  // 未真正改动时不触发保存，避免无意义的 updateInvoiceData
  if (value === oldValue) return
  emit('update:value', value)
  emit('save', value)
}

function handleBotton() {
  if (props.disabled) return
  const value = draft.value == null ? '' : String(draft.value)
  emit('button', value)
}

function handleRetry() {
  if (props.disabled || props.status !== 'fail') return
  emit('save', props.value == null ? '' : String(props.value))
}

function handleFocusOut(event: FocusEvent) {
  const current = event.currentTarget as HTMLElement | null
  const next = event.relatedTarget as Node | null
  if (current && next && current.contains(next)) return
  handleSave()
}

function handleDateChange() {
  handleSave()
}

function handleDateVisibleChange(visible: boolean) {
  if (!visible) handleSave()
}

function handleSelectVisibleChange(visible: boolean) {
  if (!visible) handleSave()
}

function handleCancel() {
  isEditing.value = false
}
</script>

<style scoped lang="scss">
.detail-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-m);
  overflow: visible;

  &.is-no-label {
    justify-content: flex-start;

    .detail-value-wrap {
      max-width: 100%;
      overflow: visible;
    }

    .detail-value {
      justify-content: flex-start;
      text-align: left;
      font-size: 1.2rem;
    }
  }
}

.detail-label {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
  line-height: 1.4;

  &.is-required::before {
    content: '*';
    color: var(--el-color-danger);
    margin-right: 2px;
  }
}

.detail-value-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  max-width: 70%;
  overflow: visible;
}

.detail-value {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--app-space-xxs);
  width: 100%;
  text-align: right;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);

  &.is-hidden {
    visibility: hidden;
    pointer-events: none;
  }
}

.detail-value-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.is-editable {
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

.detail-edit-icon {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  font-size: 0.875rem;
  cursor: pointer;

  &:hover:not(.is-loading):not(.is-fail) {
    color: var(--el-color-primary);
  }

  &.is-fail {
    color: var(--el-color-danger);
  }
}

.detail-value-edit {
  z-index: 20;
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  overflow: visible;

  :deep(.el-date-editor),
  :deep(.el-select-v2) {
    width: 100%;
  }

  &.is-date,
  &.is-select,
  &.is-textarea {
    min-width: 10rem;
    width: max(100%, 10rem);
  }

  &.is-date.has-action {
    display: inline-flex;
    align-items: center;
    gap: var(--app-space-xxs);
    width: max(100%, 14rem);

    :deep(.el-date-editor) {
      flex: 1;
      min-width: 0;
    }

    .el-button {
      flex-shrink: 0;
    }
  }

  &.is-textarea {
    :deep(.el-textarea__inner) {
      text-align: left;
      font-weight: 600;
    }
  }
}
</style>
