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
  (e: 'input', value: InfoItem): void
}>()

const localText = ref('')

watch(
  () => props.item,
  (value) => {
    localText.value = value?.descriptioin ?? ''
  },
  { immediate: true, deep: true }
)

function handleClose() {
  emit('update:modelValue', false)
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
    <el-input v-model="localText" type="textarea" :rows="12" auto-size placeholder="Please input description" @input="handleInput" />
  </el-dialog>
</template>

<style lang="scss">
.info-popover {
  transform: translate(-50%, -100%);
}
</style>
