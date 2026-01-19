<script lang="ts" setup>
// Navigation state
const activeSection = ref('general')
const sections = [
  { id: 'general', label: 'General', icon: 'lucide:settings' },
  { id: 'permissions', label: 'Permissions', icon: 'lucide:shield' },
  { id: 'danger', label: 'Danger Zone', icon: 'lucide:alert-triangle' }
]

function switchSection(sectionId: string) {
  activeSection.value = sectionId
}

const sectionComponent = computed(() => {
  switch (activeSection.value) {
    case 'general':
      return 'LazyWorkspacesSettingRootGeneral'
    case 'permissions':
      return 'LazyWorkspacesSettingRootPermissions'
    case 'danger':
      return 'LazyWorkspacesSettingRootDanger'
    default:
      return 'LazyWorkspacesSettingRootGeneral'
  }
})
</script>

<template>
  <div class="setting-page">
    <!-- Navigation Sidebar -->
    <div class="setting-nav">
      <div class="nav-title">Settings</div>
      <div class="nav-menu">
        <div
          v-for="section in sections"
          :key="section.id"
          class="nav-item"
          :class="{ active: activeSection === section.id }"
          @click="switchSection(section.id)"
        >
          <Icon :name="section.icon" />
          <span>{{ section.label }}</span>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="setting-container">
      <component :is="sectionComponent" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.setting-page {
  height: 100%;
  display: grid;
  grid-template-columns: 220px 1fr;
  overflow: hidden;
}

.setting-nav {
  height: 100%;
  background: var(--app-grey-950);
  border-right: 1px solid var(--app-grey-800);
  padding: var(--app-space-m);
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);

  .nav-title {
    font-size: var(--app-font-size-xl);
    font-weight: 600;
    color: var(--app-grey-300);
    padding: var(--app-space-s) 0;
  }

  .nav-menu {
    display: flex;
    flex-flow: column nowrap;
  }

  .nav-item {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    gap: var(--app-space-s);
    padding: var(--app-space-s) var(--app-space-m);
    border-radius: var(--app-border-radius);
    cursor: pointer;
    transition: all 0.2s;
    color: var(--app-grey-300);
    font-size: var(--app-font-size-m);
    & + .nav-item {
      border-top: 1px solid var(--app-grey-800);
    }
    &:hover {
      background: var(--app-grey-400);
      color: var(--app-grey-900);
    }

    &.active {
      background: var(--app-primary-color);
      color: white;
      font-weight: 500;
    }
  }
}

.setting-container {
  height: 100%;
  overflow-y: auto;
  padding: var(--app-space-m);
}
</style>
