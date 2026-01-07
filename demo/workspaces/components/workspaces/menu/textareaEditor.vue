<script setup lang="ts">
interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'save', value: string): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const textareaRef = ref<HTMLTextAreaElement>()
const localValue = ref(props.modelValue)
const isCancelling = ref(false)

// Focus textarea on mount
onMounted(() => {
  textareaRef.value?.focus()
  textareaRef.value?.select()
  // Auto-resize textarea to fit content
  autoResize()
})

function autoResize() {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
  }
}

function handleSave() {
  // Don't save if user is cancelling
  if (isCancelling.value) return
  
  emit('save', localValue.value.trim())
}

function handleCancel() {
  isCancelling.value = true
  emit('cancel')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    handleCancel()
  }
  // Note: We don't prevent Enter since users might want newlines in description
  // Users can use Shift+Enter for newlines and click outside or Escape to save/cancel
}

function handleInput() {
  autoResize()
}
</script>

<template>
  <div class="textarea-editor" @click.stop>
    <textarea
      ref="textareaRef"
      v-model="localValue"
      class="textarea-input"
      rows="1"
      @blur="handleSave"
      @keydown="handleKeydown"
      @input="handleInput"
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
.textarea-editor {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-xs);
  flex: 1;
  min-width: 0;
}

.textarea-input {
  flex: 1;
  min-width: 0;
  min-height: 32px;
  padding: 6px 8px;
  font-size: var(--app-font-size-s);
  font-family: inherit;
  line-height: 1.5;
  border: 1px solid var(--el-border-color);
  border-radius: var(--app-border-radius-s);
  background: var(--el-bg-color);
  outline: none;
  resize: none;
  overflow: hidden;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: var(--el-color-primary);
  }
}

.cancel-btn {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  padding: 0;
  margin-top: 6px;
}
</style>

