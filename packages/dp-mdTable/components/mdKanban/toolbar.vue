<template>
  <div v-if="showToolbar" class="kanban-toolbar">
    <div class="toolbar-left">
      <slot name="toolbar-left">
        <el-button type="primary" @click="handleAddRow">
          <el-icon><Plus /></el-icon>
          Add Row
        </el-button>
      </slot>
    </div>
    <div class="toolbar-right">
      <slot name="toolbar-right">
        <el-button text :icon="Setting" @click="handleOpenSettings">
          Setting
        </el-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Setting } from '@element-plus/icons-vue'

interface Props {
  showToolbar?: boolean
}

interface Emits {
  (e: 'refresh'): void
  (e: 'search', value: string): void
  (e: 'add-row'): void
  (e: 'open-settings'): void
}

const props = withDefaults(defineProps<Props>(), {
  showToolbar: true
})

const emit = defineEmits<Emits>()

const handleAddRow = () => {
  emit('add-row')
}

const handleOpenSettings = () => {
  emit('open-settings')
}
</script>

<style scoped lang="scss">
.kanban-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--app-space-s);
  border-bottom: 1px solid var(--app-grey-800);
  background: var(--app-paper);
  border-radius: var(--app-border-radius-s);
  flex-shrink: 0;

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
  }
}
</style>
