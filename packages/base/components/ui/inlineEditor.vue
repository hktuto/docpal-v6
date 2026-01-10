<script setup lang="ts">
interface Props {
  modelValue: string
  wrapper?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
  editable?: boolean
  placeholder?: string
  multiline?: boolean
  editing?: boolean // External control of editing state (controlled mode)
}

const props = withDefaults(defineProps<Props>(), {
  wrapper: 'span',
  editable: true,
  placeholder: '',
  multiline: false,
  editing: undefined // undefined = uncontrolled mode
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:editing', value: boolean): void
  (e: 'save', value: string): void
  (e: 'cancel'): void
}>()

const wrapperRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement>()
const internalEditing = ref(false)
const localValue = ref(props.modelValue)
const isCancelling = ref(false)
const inputStyles = ref<Record<string, string>>({})

// Computed to handle both controlled and uncontrolled modes
const isEditing = computed({
  get: () => props.editing !== undefined ? props.editing : internalEditing.value,
  set: (val: boolean) => {
    if (props.editing !== undefined) {
      emit('update:editing', val)
    } else {
      internalEditing.value = val
    }
  }
})

// Sync localValue when modelValue changes externally
watch(() => props.modelValue, (newVal) => {
  if (!isEditing.value) {
    localValue.value = newVal
  }
})

// Watch for external editing changes (controlled mode)
watch(() => props.editing, (newVal) => {
  if (newVal === true) {
    captureWrapperStyles()
    localValue.value = props.modelValue
    isCancelling.value = false
  }
})

// Watch for input becoming available and focus it
watch(inputRef, (newRef) => {
  if (newRef && isEditing.value) {
    nextTick(() => {
      newRef.focus()
      newRef.select()
      if (props.multiline) {
        autoResize()
      }
    })
  }
})

function captureWrapperStyles() {
  if (wrapperRef.value) {
    const computed = getComputedStyle(wrapperRef.value)
    inputStyles.value = {
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      lineHeight: computed.lineHeight,
      color: computed.color,
      fontFamily: computed.fontFamily,
      letterSpacing: computed.letterSpacing
    }
  }
}

function startEditing() {
  if (!props.editable) return
  
  captureWrapperStyles()
  localValue.value = props.modelValue
  isCancelling.value = false
  isEditing.value = true
}

function autoResize() {
  if (inputRef.value && props.multiline) {
    const textarea = inputRef.value as HTMLTextAreaElement
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }
}

function handleSave() {
  if (isCancelling.value) return
  
  const trimmedValue = localValue.value.trim()
  
  // For non-multiline, don't save empty values
  if (!props.multiline && !trimmedValue) {
    handleCancel()
    return
  }
  
  emit('update:modelValue', trimmedValue)
  emit('save', trimmedValue)
  isEditing.value = false
}

function handleCancel() {
  isCancelling.value = true
  localValue.value = props.modelValue
  emit('cancel')
  isEditing.value = false
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    handleCancel()
  } else if (event.key === 'Enter' && !props.multiline) {
    event.preventDefault()
    handleSave()
  }
}

function handleInput() {
  if (props.multiline) {
    autoResize()
  }
}
</script>

<template>
  <!-- View Mode -->
  <component
    v-if="!isEditing"
    :is="wrapper"
    ref="wrapperRef"
    class="inline-editor-view"
    :class="{ 'is-editable': editable, 'is-empty': !modelValue }"
    @dblclick="startEditing"
  >
    <slot>
      <template v-if="modelValue">{{ modelValue }}</template>
      <template v-else-if="placeholder && editable">
        <span class="placeholder">{{ placeholder }}</span>
      </template>
    </slot>
  </component>

  <!-- Edit Mode -->
  <div v-else class="inline-editor" @click.stop>
    <textarea
      v-if="multiline"
      ref="inputRef"
      v-model="localValue"
      class="inline-editor-input"
      :style="inputStyles"
      rows="1"
      @blur="handleSave"
      @keydown="handleKeydown"
      @input="handleInput"
    />
    <input
      v-else
      ref="inputRef"
      v-model="localValue"
      type="text"
      class="inline-editor-input"
      :style="inputStyles"
      @blur="handleSave"
      @keydown="handleKeydown"
    />
    <el-button
      text
      circle
      size="small"
      class="cancel-btn"
      @mousedown.prevent
      @click="handleCancel"
    >
      <Icon name="material-symbols:close" size="14" />
    </el-button>
  </div>
</template>

<style scoped lang="scss">
.inline-editor-view {
  &.is-editable {
    cursor: pointer;
    
    &:hover {
      opacity: 0.8;
    }
  }
  
  .placeholder {
    color: var(--app-grey-600);
    font-style: italic;
  }
}

.inline-editor {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-xs);
  flex: 1;
  min-width: 0;
}

.inline-editor-input {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--app-border-radius-s);
  background: var(--el-bg-color);
  outline: none;
  transition: border-color 0.2s ease;
  
  // Reset for textarea
  resize: none;
  overflow: hidden;
  font-family: inherit;

  &:focus {
    border-color: var(--el-color-primary);
  }
}

.cancel-btn {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  padding: 0;
  margin-top: 4px;
}
</style>
