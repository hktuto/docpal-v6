<script lang="ts" setup>
import { ArrowDown } from '@element-plus/icons-vue'
import { adminApi, clientApi } from 'api'

const props = defineProps<{
  document: any
}>()

const { document } = toRefs(props)
let tableData: any[] = []
const ResponsiveFilterRef = ref()
const targetOptions = ref<any>([])
let isFilter = ref(false)
let extraParams: any = {}
const isInherit = ref(false)
const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'rbac-resource-document-permission-table',
  virtualScroll: true,
  api: async (pageParams: any) => {
    // const data = await getChildApi(id.value || 'root')
    return await getList()
  },
  columns: [
    {
      field: 'targetName',
      title: 'rbac.permission.targetName',
      type: 'html',
      formatter: ({ cellValue, row }: any) => {
        const icon =
          row.targetType === 1
            ? '/icons/menu/user2.svg'
            : row.targetType === 2
              ? '/icons/menu/user-role.svg'
              : row.targetType === 3
                ? '/icons/menu/group.svg'
                : '/icons/menu/system.svg'
        return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue || row.configurationRuleName}</span> `
      }
    },
    {
      field: 'permissionLevel',
      title: 'rbac.permission.permissionLevel',
      formatter: ({ cellValue }) => {
        switch (cellValue) {
          case 1:
            return $t('permission.read')
          case 2:
            return $t('permission.write')
          case 3:
            return $t('permission.manage')
          case 5:
            return $t('permission.userSet')
          default:
            return $t('permission.custom')
        }
      }
    },
    {
      field: 'isInherit',
      title: 'rbac.permission.isInherit',
      type: 'html',
      width: 80,
      formatter: ({ cellValue, row }: any) => {
        let icon = row.isInherit ? '/icons/check2.svg' : '/icons/close.svg'
        return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> </span> `
      }
    },
    { field: 'inheritFromPath', title: 'rbac.permission.inheritFrom' }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblClick(row)
  },
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'common_edit',
        action: ({ row }: any) => {
          handleDblClick(row)
        }
      },
      {
        code: 'common_delete',
        name: 'common_delete',
        action: ({ row }: any) => {
          handleRemove(row)
        }
      }
    ]
  ],
  permissionMethod: ({ options, code, column, row, rowIndex }: any) => {
    if (!row) {
      return {
        visible: false,
        disabled: false
      }
    }
    if (code === 'common_delete' || code === 'edit') {
      return {
        visible: !row.isInherit,
        disabled: false
      }
    }
    return {
      visible: true,
      disabled: false
    }
  }
})
const userSetDialogRef = ref()

function handleAddSet() {
  userSetDialogRef.value?.open(null, document.value.id)
}

const detailDialogRef = ref()

function handleDblClick(row: any) {
  // check if row is user set
  if (row.permissionLevel === 5) {
    userSetDialogRef.value?.open(row, document.value.id)
    return
  } else {
    detailDialogRef.value?.open(row, document.value.id)
  }
}

function handleAdd() {
  detailDialogRef.value?.open(null, document.value.id)
}

async function getList() {
  if (!isFilter.value) {
    tableData = await adminApi.api.getAclResourcePermissionsResourceResourceid(document.value.id).then((res) => res.data)
    setTimeout(() => {
      updateTargetOptions()
    }, 100)
  }
  isInherit.value = false
  let filterData = tableData.filter((item: any) => {
    if (item.isInherit) {
      isInherit.value = true
    }
    return true
  })
  if (extraParams.q) {
    filterData = filterData.filter((item: any) => {
      const name = (item.targetName || item.configurationRuleName || '').toLowerCase()
      return name.includes(extraParams.q.toLowerCase())
    })
  }
  if (extraParams.permissionLevel) {
    filterData = filterData.filter((item: any) => extraParams.permissionLevel.includes(item.permissionLevel))
  }

  if (extraParams.orderBy) {
    filterData = filterData.sort((a: any, b: any) => {
      let aName: any = ''
      let bName: any = ''
      if (extraParams.orderBy === 'targetName') {
        aName = a.targetName || a.configurationRuleName || ''
        bName = b.targetName || b.configurationRuleName || ''
        if (extraParams.isDesc === 'desc') {
          return bName.localeCompare(aName)
        } else {
          return aName.localeCompare(bName)
        }
      } else {
        aName = a[extraParams.orderBy]
        bName = b[extraParams.orderBy]
        if (extraParams.isDesc === 'desc') {
          return bName - aName
        } else {
          return aName - bName
        }
      }
    })
  }
  isFilter.value = false
  return filterData
}

async function handleRemove(row: any) {
  await adminApi.api.deleteAclResourcePermissionsId(row.id)
  reload()
}

function handleFilterFormChange(formData: any) {
  isFilter.value = true
  extraParams = formData
  reload()
}

const filterSetting = [
  {
    key: 'permissionLevel',
    label: 'rbac.permission.permissionLevel',
    type: 'string',
    isMultiple: true,
    options: [
      { label: 'permission.read', value: 1 },
      { label: 'permission.write', value: 2 },
      { label: 'permission.manage', value: 3 },
      { label: 'permission.custom', value: 4 },
      { label: 'permission.userSet', value: 5 }
    ]
  },
  {
    key: 'orderBy',
    label: 'tableHeader.sortBy',
    type: 'string',
    isMultiple: false,
    value: ['targetName'],
    options: [
      { label: 'rbac.permission.targetName', value: 'targetName' },
      { label: 'rbac.permission.permissionLevel', value: 'permissionLevel' },
      { label: 'rbac.permission.isInherit', value: 'isInherit' }
    ]
  },
  {
    key: 'isDesc',
    label: 'tableHeader.sortOrder',
    type: 'string',
    isMultiple: false,
    value: ['asc'],
    options: [
      { label: 'tableHeader.asc', value: 'asc' },
      { label: 'tableHeader.desc', value: 'desc' }
    ]
  }
]

function getFilter() {
  ResponsiveFilterRef.value.init(filterSetting)
}

async function handleRemoveInherent() {
  await adminApi.api.postAclResourcePermissionsCopyInheritResourceid(document.value.id)
  reload()
}

async function handleInherent() {
  await adminApi.api.postAclResourcePermissionsIncludeInheritResourceid(document.value.id)
  reload()
}

const { flatRole } = useRBAC()

async function getTargetOptions() {
  async function getGroupList() {
    try {
      return await clientApi.api.postUcenterGroups().then(r => r.data)
    } catch (error) {
      console.error(error)
      return []
    }
  }

  async function getUserList() {
    try {
      return await clientApi.admin.postAdminucenterGetKeycloakAllUsers({}).then((res) => res.data)
    } catch (error) {
      console.error(error)
      return []
    }
  }

  const groupList: any = await getGroupList()
  const userList: any = await getUserList()
  targetOptions.value.push(
    {
      label: 'user_role',
      value: 2, // 1=User, 3=Group, 2=Role
      type: 'select',
      selectConfig: {
        options: flatRole.value.map((item) => ({
          label: item.name,
          value: item.id
        }))
      }
    },
    {
      label: 'user_groups',
      value: 3,
      type: 'select',
      selectConfig: {
        options: groupList.map((item: any) => ({
          label: item.name,
          value: item.id
        }))
      }
    },
    {
      label: 'user_users',
      value: 1,
      type: 'select',
      selectConfig: {
        options: userList.map((item: any) => ({
          label: item.username,
          value: item.userId
        }))
      }
    }
  )
}

async function updateTargetOptions() {
  while (targetOptions.value.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  if (tableData.length > 0) {
    const targetIds = tableData.map((item: any) => item.targetId)
    targetOptions.value.forEach((item: any) => {
      item.selectConfig.options.forEach((option: any) => {
        if (targetIds.includes(option.value)) option.disabled = true
        else option.disabled = false
      })
    })
  }
}

onMounted(() => {
  getFilter()
  getTargetOptions()
})
watch(
  document,
  async () => {
    reload()
  },
  {
    immediate: true
  }
)
</script>

<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons>
      <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="q" />
      <div class="actions">
        <el-button type="primary" @click="handleAdd">{{ $t('rbac.permission.addPermission') }}</el-button>
        <el-button type="primary" @click="handleAddSet">{{ $t('rbac.permission.addUserSet') }}</el-button>
        <el-dropdown>
          <el-button type="primary">
            {{ $t('button.more') }}
            <el-icon class="el-icon--right">
              <arrow-down />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="isInherit" @click="handleRemoveInherent">
                {{ $t('accessControl_removeInherent') }}
              </el-dropdown-item>
              <el-dropdown-item v-else @click="handleInherent">{{ $t('accessControl_inherent') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </template>
  </VxeGrid>
  <ResourceDocumentPermissionDetailDialog ref="detailDialogRef" :targetOptions="targetOptions" @success="reload" />
  <ResourceDocumentUserSetDialog ref="userSetDialogRef" :targetOptions="targetOptions" @success="reload" />
</template>

<style lang="scss" scoped>
.actions {
  display: flex;
  align-items: center;
  justify-content: flex-flex;
  gap: var(--app-space-s);
}

:deep(.browseNameCell) {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  cursor: pointer;
}

:deep(.browseFileIcon) {
  width: calc(var(--app-space-m) * 1.5);
  height: calc(var(--app-space-m) * 1.5);
}

:deep(.vxe-buttons--wrapper) {
  display: grid;
  grid-template-columns: 1fr min-content;

  .el-input {
    width: 200px;
  }
}
</style>
