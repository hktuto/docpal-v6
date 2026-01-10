<script setup lang="ts">
import type { MenuItem } from '../../../../utils/db/schema/workspaces'

interface Props {
  children: MenuItem[]
}

defineProps<Props>()

const { navigateToItem, getMenuIcon } = useSingleWorkspaceContext()

function getChildIcon(child: MenuItem) {
  return getMenuIcon(child)
}
</script>

<template>
  <div class="children-grid">
    <div
      v-for="child in children"
      :key="child.id"
      class="child-card"
      @click="navigateToItem(child)"
    >
      <div class="child-icon">
        <Icon :name="getChildIcon(child)" />
      </div>
      <div class="child-label">
        {{ child.label }}
      </div>
      <p class="child-description">
        {{ child.description }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.children-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--app-space-m);
}

.child-card {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--app-space-s);
  padding: var(--app-space-s);
  cursor: pointer;
  
  &:hover {
    border-color: var(--app-primary-color);
  }
}

.child-icon {
  font-size: var(--app-font-size-xxl);
}

.child-label {
  font-size: var(--app-font-size-l);
  font-weight: bold;
}

.child-description {
  margin: 0;
  color: var(--el-text-color-regular);
}
</style>
