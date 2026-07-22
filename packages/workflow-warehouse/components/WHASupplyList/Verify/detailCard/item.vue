<template>
  <div class="detail-item">
    <span class="detail-label">{{ label }}</span>

    <div class="detail-value-wrap">
      <div v-if="isEditing && type === 'date'" class="detail-value-edit">
        <el-date-picker
          ref="datePickerRef"
          v-model="draft"
          type="date"
          size="small"
          format="YYYY/MM/DD"
          value-format="YYYY/MM/DD"
          aria-label="Edit date"
          @change="handleSave"
          @visible-change="handleDateVisibleChange"
          @keydown.esc.prevent="handleCancel"
        />
      </div>

      <div v-else-if="isEditing" class="detail-value-edit is-textarea" @focusout="handleFocusOut">
        <el-input
          ref="inputRef"
          v-model="draft"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 6 }"
          aria-label="Edit value"
          @keydown.esc.prevent="handleCancel"
        />
      </div>

      <button
        type="button"
        class="detail-value"
        :class="{ 'is-readonly': disabled, 'is-hidden': isEditing }"
        tabindex="0"
        :aria-label="!disabled ? 'Click to edit' : label"
        @click="handleStartEdit"
        @keydown.enter.prevent="handleStartEdit"
      >
        <span class="detail-value-text" v-if="textValue">{{ textValue }}</span>
        <span class="detail-value-text" v-else :title="displayValue">{{ displayValue }}</span>
        <el-icon v-if="!disabled" class="detail-edit-icon" aria-hidden="true">
          <EditPen />
        </el-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EditPen } from '@element-plus/icons-vue'
import type { InputInstance } from 'element-plus'

const props = withDefaults(
  defineProps<{
    label: string
    value?: string | number | null
    textValue?: string
    disabled?: boolean
    type?: 'text' | 'date'
  }>(),
  {
    disabled: false,
    type: 'text'
  }
)

const emit = defineEmits<{
  'update:value': [value: string]
}>()

const { formatDate } = useTime()

const isEditing = ref(false)
const draft = ref('')
const inputRef = ref<InputInstance>()
const datePickerRef = ref()

const displayValue = computed(() => {
  const val = props.value
  if (val === null || val === undefined || val === '') return '—'
  if (props.type === 'date') {
    return formatDate(String(val), 'YYYY/MM/DD') || String(val)
  }
  return String(val)
})

function toDateDraft(val: string | number | null | undefined) {
  if (val === null || val === undefined || val === '') return ''
  return formatDate(String(val), 'YYYY/MM/DD') || String(val)
}

async function handleStartEdit() {
  if (props.disabled) return
  draft.value = props.type === 'date' ? toDateDraft(props.value) : props.value == null ? '' : String(props.value)
  isEditing.value = true
  await nextTick()
  if (props.type === 'date') {
    datePickerRef.value?.focus?.()
  } else {
    inputRef.value?.focus()
  }
}

function handleSave() {
  if (!isEditing.value || props.disabled) return
  emit('update:value', draft.value ?? '')
  isEditing.value = false
}

function handleFocusOut(event: FocusEvent) {
  const current = event.currentTarget as HTMLElement | null
  const next = event.relatedTarget as Node | null
  if (current && next && current.contains(next)) return
  handleSave()
}

function handleDateVisibleChange(visible: boolean) {
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
}

.detail-label {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
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
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: right;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);

  &:hover:not(.is-readonly) {
    color: var(--el-color-primary);

    .detail-edit-icon {
      color: var(--el-color-primary);
    }
  }

  &.is-readonly {
    cursor: default;
  }

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
}

.detail-edit-icon {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  font-size: 0.875rem;
}

.detail-value-edit {
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;

  :deep(.el-date-editor) {
    width: 100%;
  }

  &.is-textarea {
    :deep(.el-textarea__inner) {
      text-align: left;
      font-weight: 600;
    }
  }
}
</style>
