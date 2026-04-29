<script lang="ts" setup>
type DbPermissionKey = 'member' | 'manage'

type DbPermissionRow = {
  feature: string
  member: boolean
  manage: boolean
}

type ItemPermissionKey = 'view' | 'edit' | 'manage'

type ItemPermissionRow = {
  feature: string
  view: boolean
  edit: boolean
  manage: boolean
}

type PermissionGuideSection =
  | {
      label: string
      value: string
      level: 'database'
      columns: { key: DbPermissionKey; label: string; color: string }[]
      children: DbPermissionRow[]
    }
  | {
      label: string
      value: string
      level: 'menuItem'
      columns: { key: ItemPermissionKey; label: string; color: string }[]
      children: ItemPermissionRow[]
    }

const dbColumns = [
  { key: 'member' as const, label: 'Member', color: '#0ea5e9' },
  { key: 'manage' as const, label: 'Manage', color: '#6366f1' }
]

const itemColumns = [
  { key: 'view' as const, label: 'View', color: '#f59e0b' },
  { key: 'edit' as const, label: 'Edit', color: '#10b981' },
  { key: 'manage' as const, label: 'Manage', color: '#6366f1' }
]

const SECTIONS: PermissionGuideSection[] = [
  {
    label: 'Database Permissions',
    value: 'database',
    level: 'database',
    columns: dbColumns,
    children: [
      { feature: 'Access database', member: true, manage: true },
      { feature: 'View database menu items', member: true, manage: true },
      { feature: 'View database settings', member: true, manage: true },
      { feature: 'Edit database settings', member: false, manage: true },
      { feature: 'Manage workspace members & permissions', member: false, manage: true }
    ]
  },
  {
    label: 'Database Menu Item Permissions (Table, Dashboard, etc.)',
    value: 'menuItem',
    level: 'menuItem',
    columns: itemColumns,
    children: [
      { feature: 'Access item', view: true, edit: true, manage: true },
      { feature: 'View records / content', view: true, edit: true, manage: true },
      { feature: 'Edit records (create & update)', view: false, edit: true, manage: true },
      { feature: 'Delete records', view: false, edit: true, manage: true },
      { feature: 'Export data', view: false, edit: true, manage: true },
      { feature: 'Post comments', view: false, edit: true, manage: true },
      { feature: 'Edit view list (create, update, delete views)', view: false, edit: false, manage: true },
      { feature: 'Manage item permissions', view: false, edit: false, manage: true },
      { feature: 'Delete item', view: false, edit: false, manage: true }
    ]
  }
]

const expandList = ref<string[]>(['database', 'menuItem'])

function getPermissionColor(allowed: boolean, columnColor: string) {
  return allowed ? columnColor : 'var(--app-grey-400)'
}
</script>

<template>
  <el-card class="setting-section">
    <template #header>
      <div class="card-header">
        <h3>Workspace Permission Guide</h3>
      </div>
    </template>

    <p class="description">
      View permission boundaries for each role in this workspace to configure access quickly.
    </p>

    <el-collapse v-model="expandList" class="guide-collapse">
      <el-collapse-item
        v-for="section in SECTIONS"
        :key="section.value"
        :name="section.value"
      >
        <template #title>
          <span class="group-title">{{ section.label }}</span>
        </template>

        <div class="permission-table">
          <!-- Header -->
          <div class="table-row header-row">
            <div class="cell feature-cell">Feature</div>
            <div
              v-for="col in section.columns"
              :key="col.key"
              class="cell permission-cell"
              :style="{ color: col.color }"
            >
              {{ col.label }}
            </div>
          </div>

          <!-- Body -->
          <div
            v-for="row in section.children"
            :key="row.feature"
            class="table-row body-row"
          >
            <div class="cell feature-cell">{{ row.feature }}</div>
            <div
              v-for="col in section.columns"
              :key="`${row.feature}-${col.key}`"
              class="cell permission-cell"
            >
              <Icon
                name="lucide:check"
                class="permission-icon"
                :class="{ denied: !(row as any)[col.key] }"
                :style="{ color: getPermissionColor((row as any)[col.key], col.color) }"
                :aria-label="(row as any)[col.key] ? 'allowed' : 'denied'"
              />
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </el-card>
</template>

<style lang="scss" scoped>
.setting-section {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: var(--app-font-size-l);
      font-weight: 600;
    }
  }

  .description {
    margin: 0 0 var(--app-space-m) 0;
    color: var(--app-grey-500);
    font-size: var(--app-font-size-s);
  }
}

.guide-collapse {
  border-top: none;
}

.group-title {
  font-weight: 600;
  color: var(--app-grey-800);
}

.permission-table {
  display: table;
  width: 100%;
  border-collapse: collapse;
}

.table-row {
  display: table-row;

  &.header-row {
    font-weight: 700;
    border-bottom: 1px solid var(--app-grey-800);
  }

  &.body-row:hover {
    background-color: var(--app-grey-800);
  }
}

.cell {
  display: table-cell;
  padding: var(--app-space-s) var(--app-space-m);
  vertical-align: middle;
}

.feature-cell {
  width: 55%;
}

.permission-cell {
  width: 15%;
  text-align: center;
}

.permission-icon {
  font-size: 20px;
}

.denied {
  opacity: 0.2;
}
</style>
