<script lang="ts" setup>
const { saveMenuItemToDb } = useSingleWorkspaceContext()
type InfoItem = {
  id: string
  descriptioin: string
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    item: InfoItem
  }>(),
  {
    modelValue: false,
    item: () => ({
      id: '',
      descriptioin: ''
    })
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'input', value: string): void
}>()

const localText = ref('')
const editableRef = ref<HTMLDivElement>()

watch(
  () => props.item,
  async (value) => {
    localText.value = value?.descriptioin ?? ''
    await nextTick()
    if (!editableRef.value) return
    editableRef.value.innerText = localText.value
  },
  { immediate: true, deep: true }
)

watch(
  () => localText.value,
  (value) => {
    if (!editableRef.value) return
    if (editableRef.value.innerText === value) return
    editableRef.value.innerText = value
  }
)

function handleClose() {
  emit('update:modelValue', false)
}

function handleEditableInput(event: Event) {
  const target = event.target as HTMLDivElement
  const value = target.innerText ?? ''
  localText.value = value
  void handleInput(value)
}

async function handleInput(value: string) {
  console.log('handleInput', value)
  await saveMenuItemToDb({
    id: props.item.id,
    description: value
  })
  emit('input', value)
}
</script>

<template>
  <el-dialog class="scroll-dialog info-popover" :model-value="modelValue" width="640px" title="Description" append-to-body @close="handleClose">
    <div
      ref="editableRef"
      class="editable-textarea"
      contenteditable="true"
      tabindex="0"
      aria-label="Please input description"
      data-placeholder="Please input description"
      @input="handleEditableInput"
    ></div>
  </el-dialog>
</template>

<style lang="scss">
.info-popover {
  transform: translate(-50%, -100%);

  .editable-textarea {
    min-height: 320px;
    max-height: 480px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
    outline: none;
    border: none;
    box-shadow: none;
    color: var(--el-text-color-primary);
    background: transparent;

    &:focus {
      border: none;
      box-shadow: none;
    }

    &:empty::before {
      content: attr(data-placeholder);
      color: var(--el-text-color-placeholder);
      pointer-events: none;
    }
  }
}
</style>
