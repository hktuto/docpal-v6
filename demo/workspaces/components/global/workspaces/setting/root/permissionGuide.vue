<script lang="ts" setup>
type PermissionKey = 'isSuperAdmin' | 'canManage' | 'canEdit' | 'canRead'

type PermissionGuideRow = {
  feature: string
  isSuperAdmin: boolean
  canManage: boolean
  canEdit: boolean
  canRead: boolean
}
type PermissionGuideItem = {
  label: string
  value: string
  children: PermissionGuideRow[]
}
type PermissionDef = {
  key: PermissionKey
  label: string
  color: string
}

const columnDefinitions: PermissionDef[] = [
  { key: 'isSuperAdmin', label: 'Workspace/File admin', color: '#3b82f6' },
  { key: 'canManage', label: 'Can Manage', color: '#6366f1' },
  { key: 'canEdit', label: 'Can Edit', color: '#10b981' },
  { key: 'canRead', label: 'Read Only', color: '#f59e0b' }
]
const LIST: PermissionGuideItem[] = [
  {
    label: 'Table Operation Permissions',
    value: 'table',
    children: [
      {
        feature: 'Edit view list',
        isSuperAdmin: true,
        canManage: true,
        canEdit: true,
        canRead: false
      },
      {
        feature: 'Export view data',
        isSuperAdmin: true,
        canManage: true,
        canEdit: false,
        canRead: false
      },
      {
        feature: 'Edit records (create and update)',
        isSuperAdmin: true,
        canManage: true,
        canEdit: true,
        canRead: false
      },
      {
        feature: 'Delete records',
        isSuperAdmin: true,
        canManage: true,
        canEdit: false,
        canRead: false
      },
      {
        feature: 'Post comments',
        isSuperAdmin: true,
        canManage: true,
        canEdit: true,
        canRead: false
      },
      {
        feature: 'View records',
        isSuperAdmin: true,
        canManage: true,
        canEdit: true,
        canRead: true
      }
    ]
  },
  {
    label: 'File/Folder Operation Permissions',
    value: 'file',
    children: [
      {
        feature: 'Set file/folder permissions',
        isSuperAdmin: true,
        canManage: true,
        canEdit: false,
        canRead: false
      },
      {
        feature: 'Create file/folder',
        isSuperAdmin: true,
        canManage: true,
        canEdit: false,
        canRead: false
      },
      {
        feature: 'Import file',
        isSuperAdmin: true,
        canManage: true,
        canEdit: false,
        canRead: false
      },
      {
        feature: 'Export file',
        isSuperAdmin: true,
        canManage: true,
        canEdit: false,
        canRead: false
      },
      {
        feature: 'Copy file (requires current and parent folder permissions)',
        isSuperAdmin: true,
        canManage: true,
        canEdit: false,
        canRead: false
      },
      {
        feature: 'Move file (requires current and target folder permissions)',
        isSuperAdmin: true,
        canManage: true,
        canEdit: false,
        canRead: false
      },
      {
        feature: 'Rename file/folder',
        isSuperAdmin: true,
        canManage: true,
        canEdit: false,
        canRead: false
      },
      {
        feature: 'Delete file/folder',
        isSuperAdmin: true,
        canManage: true,
        canEdit: false,
        canRead: false
      },
      {
        feature: 'Share file/folder',
        isSuperAdmin: true,
        canManage: true,
        canEdit: true,
        canRead: false
      },
      {
        feature: 'Edit file/folder description',
        isSuperAdmin: true,
        canManage: true,
        canEdit: false,
        canRead: false
      },
      {
        feature: 'Save as template',
        isSuperAdmin: true,
        canManage: true,
        canEdit: false,
        canRead: false
      }
    ]
  }
]
const expandList = ref<string[]>(['table', 'file'])
function getPermissionColor(permission: boolean, columnColor: string) {
  if (permission) return columnColor
  return 'var(--app-grey-400)'
}
</script>

<template>
  <el-card class="setting-section">
    <template #header>
      <div class="card-header">
        <h3>Workspace Permission Guide</h3>
      </div>
    </template>

    <p class="description">View permission boundaries for each role in this workspace to configure access quickly.</p>

    <el-collapse v-model="expandList" class="guide-collapse">
      <el-collapse-item v-for="item in LIST" :key="item.label" :name="item.value">
        <template #title>
          <span class="group-title">{{ item.label }}</span>
        </template>
        <div>
          <el-row :gutter="20" class="header-row">
            <el-col :span="6">Feature</el-col>
            <el-col :span="3" v-for="column in columnDefinitions" :key="column.key">
              <span :style="{ color: column.color }">{{ column.label }}</span>
            </el-col>
          </el-row>

          <el-row :gutter="20" v-for="row in item.children" :key="row.feature">
            <el-col :span="6">{{ row.feature }}</el-col>
            <el-col :span="3" v-for="column in columnDefinitions" :key="`${row.feature}-${column.key}`">
              <Icon
                name="lucide:check"
                class="permission-icon"
                :style="{ color: getPermissionColor(row[column.key], column.color) }"
                :class="{ denied: !row[column.key] }"
                :aria-label="row[column.key] ? 'allowed' : 'denied'"
              />
            </el-col>
          </el-row>
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

.permission-icon {
  font-size: 20px;
}
.el-row {
  padding: var(--app-space-s);
  &:hover {
    background-color: var(--app-grey-800);
  }
}

.header-row {
  font-weight: 700;
}
.denied {
  opacity: 0.2;
}
</style>
