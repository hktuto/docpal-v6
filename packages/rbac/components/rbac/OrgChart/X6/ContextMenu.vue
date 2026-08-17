<template>
  <div v-if="visible" class="context-menu" :style="position">
    <div class="menu-item" @click="$emit('edit')"><i class="fas fa-edit"></i> {{ $t('orgChart.contextMenu.edit') }}</div>
    <div class="menu-item" @click="$emit('add')"><i class="fas fa-plus"></i> {{ $t('orgChart.contextMenu.addChild') }}</div>
    <div v-if="data.status === 1" class="menu-item inactivate" @click="$emit('setStatus', 2)"><i class="fas fa-trash"></i> {{ $t('actions.inactivate') }}</div>
    <div v-else class="menu-item" @click="$emit('setStatus', 1)"><i class="fas fa-trash"></i> {{ $t('actions.activate') }}</div>
    <div class="menu-item delete" @click="$emit('delete')"><i class="fas fa-trash"></i> {{ $t('orgChart.contextMenu.delete') }}</div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  visible: boolean
  position: {
    left: string
    top: string
  }
  data: any
}>()

defineEmits<{
  (e: 'edit'): void
  (e: 'add'): void
  (e: 'delete'): void
  (e: 'setStatus'): void
}>()
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  z-index: 1000;
  min-width: 160px;
}

.menu-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item.delete {
  color: #ff4d4f;
}
.menu-item.inactivate {
  color: var(--app-grey-500);
}

.menu-item.delete:hover {
  background: #fff1f0;
}

i {
  font-size: 14px;
}
</style>
