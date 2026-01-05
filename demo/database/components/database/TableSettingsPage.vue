<script lang="ts" setup>
import type { Database, Table } from '../../types/database'
import UnifiedHeader from './UnifiedHeader.vue'
import type { BreadcrumbItem, HeaderAction } from './UnifiedHeader.vue'
import GeneralSettings from './settings/GeneralSettings.vue'
import FieldsSettings from './settings/FieldsSettings.vue'
import FormsSettings from './settings/FormsSettings.vue'
import RecordDisplaySettings from './settings/RecordDisplaySettings.vue'
import PermissionsSettings from './settings/PermissionsSettings.vue'
import RowSecuritySettings from './settings/RowSecuritySettings.vue'
import DetailViewSettings from './settings/DetailViewSettings.vue'
import TriggersSettings from './settings/TriggersSettings.vue'

const props = defineProps<{
  database: Database
  table: Table
}>()

const emit = defineEmits<{
  back: []
  updated: []
}>()

// Active section
const activeSection = ref('general')

// Settings sections configuration
const settingsSections = [
  {
    group: 'TABLE',
    items: [
      { key: 'general', label: 'General', icon: 'Setting' },
      { key: 'fields', label: 'Fields', icon: 'Grid' }
    ]
  },
  {
    group: 'INTERFACE',
    items: [
      { key: 'views', label: 'Views', icon: 'View', disabled: true },
      { key: 'forms', label: 'Forms', icon: 'Document' },
      { key: 'record-display', label: 'Record Display', icon: 'Picture' },
      { key: 'detail-view', label: 'Detail View Layout', icon: 'Tickets' }
    ]
  },
  {
    group: 'ACCESS & SECURITY',
    items: [
      { key: 'permissions', label: 'Permissions', icon: 'Lock' },
      { key: 'row-security', label: 'Row-Level Security', icon: 'View' }
    ]
  },
  {
    group: 'AUTOMATION',
    items: [
      { key: 'triggers', label: 'Triggers', icon: 'Lightning' }
    ]
  }
]

// Breadcrumb for UnifiedHeader
const breadcrumb = computed<BreadcrumbItem[]>(() => [
  {
    label: props.database.name,
    to: () => emit('back')
  },
  {
    label: props.table.name,
    to: () => emit('back')
  },
  {
    label: 'Settings'
  }
])

// Header actions
const headerActions = computed<HeaderAction[]>(() => [
  {
    code: 'back',
    label: 'Back to Table',
    action: () => emit('back')
  }
])

// Get current component
const currentComponent = computed(() => {
  const components: Record<string, any> = {
    'general': GeneralSettings,
    'fields': FieldsSettings,
    'forms': FormsSettings,
    'permissions': PermissionsSettings,
    'row-security': RowSecuritySettings,
    'detail-view': DetailViewSettings,
    'record-display': RecordDisplaySettings,
    'triggers': TriggersSettings
  }
  return components[activeSection.value] || GeneralSettings
})

function handleSectionChange(key: string) {
  activeSection.value = key
}

function handleSettingsUpdated() {
  emit('updated')
}

function handleOpenFormEditor() {
  // Emit event to parent to handle form editor opening
  // This can be connected to your existing form editor
  console.log('Open form editor')
}
</script>

<template>
  <div class="table-settings-page">
    <!-- Header -->
    <UnifiedHeader
      :breadcrumb="breadcrumb"
      :context="{
        type: 'table',
        database: props.database,
        table: props.table
      }"
      :actions="headerActions"
      :show-collaborators="false"
    />

    <!-- Settings Container -->
    <div class="settings-container">
      <!-- Sidebar Navigation -->
      <aside class="settings-sidebar">
        <div class="sidebar-content">
          <template v-for="section in settingsSections" :key="section.group">
            <div class="settings-group">
              <div class="group-title">{{ section.group }}</div>
              <div class="group-items">
                <div
                  v-for="item in section.items"
                  :key="item.key"
                  class="settings-item"
                  :class="{ 
                    active: activeSection === item.key,
                    disabled: item.disabled
                  }"
                  @click="!item.disabled && handleSectionChange(item.key)"
                >
                  <span class="item-label">{{ item.label }}</span>
                  <el-tag v-if="item.disabled" size="small" type="info">Soon</el-tag>
                </div>
              </div>
            </div>
          </template>
        </div>
      </aside>

      <!-- Content Area -->
      <main class="settings-content">
        <component
          :is="currentComponent"
          :database="database"
          :table="table"
          @updated="handleSettingsUpdated"
          @open-form-editor="handleOpenFormEditor"
        />
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-settings-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--app-bg-color-page);
}

.settings-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.settings-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--app-paper);
  border-right: 1px solid var(--app-border-color);
  overflow-y: auto;
}

.sidebar-content {
  padding: var(--app-space-m) 0;
}

.settings-group {
  margin-bottom: var(--app-space-l);

  &:last-child {
    margin-bottom: 0;
  }
}

.group-title {
  padding: 0 var(--app-space-m);
  margin-bottom: var(--app-space-xs);
  font-size: var(--app-font-size-xs);
  font-weight: 600;
  color: var(--app-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.group-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-xs) var(--app-space-m);
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover:not(.disabled) {
    background: var(--app-fill-color);
  }

  &.active {
    background: var(--app-primary-color-light-9);
    color: var(--app-primary-color);
    font-weight: 500;
    border-right: 2px solid var(--app-primary-color);
  }

  &.disabled {
    color: var(--app-text-color-placeholder);
    cursor: not-allowed;
  }
}

.item-label {
  flex: 1;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  background: var(--app-bg-color-page);
}
</style>

