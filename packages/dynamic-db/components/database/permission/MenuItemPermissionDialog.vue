<script setup lang="ts">
import { useSingleDatabaseContext } from '../../../composables/useSignleDatabase'

const props = defineProps<{
  itemId: string
  itemLabel: string
  itemType: string
}>()

const { getMenuItemPermissions } = useSingleDatabaseContext()

const dialogVisible = ref(false)
const localItem = ref<{ id: string; label: string; item_type: string } | null>(null)

const effectiveItemId = computed(() => localItem.value?.id || props.itemId)
const effectiveItemLabel = computed(() => localItem.value?.label || props.itemLabel)
const title = computed(() => (effectiveItemLabel.value ? `${effectiveItemLabel.value} - Permissions` : 'Permissions'))

function open(target?: HTMLElement, itemData?: any) {
  if (itemData) {
    localItem.value = {
      id: itemData.id,
      label: itemData.label || itemData.name || '',
      item_type: itemData.item_type
    }
  }
  dialogVisible.value = true
  nextTick(() => {
    if (effectiveItemId.value) {
      getMenuItemPermissions(effectiveItemId.value)
    }
  })
}

function close() {
  dialogVisible.value = false
}

defineExpose({ open, close })
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="800px"
    :close-on-click-modal="false"
    @close="close"
  >
    <DatabaseSettingMenuPermission
      v-if="effectiveItemId"
      :id="effectiveItemId"
    />
  </el-dialog>
</template>
