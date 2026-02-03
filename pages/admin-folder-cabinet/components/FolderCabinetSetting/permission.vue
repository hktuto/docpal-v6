<template>
  <div class="permission-container">
    <div class="tableTopContainer">
      <h3>{{ $t('folderCabinet.localPermission') }}</h3>
      <el-button id="FolderCabinetSetting__Info__AddLocalPermission" size="small" type="primary" round @click="handleAclLocalDialogShow">
        {{ $t('folder_cabinetDetailLocalPermissionAdd') }}
      </el-button>
    </div>
    <div>
      <el-table v-if="!!localList" :data="localList" style="width: 100%">
        <el-table-column prop="userId" :label="$t('user_UserAndUserGroup')"></el-table-column>
        <el-table-column :label="$t('dpTable_validityPeriod')">
          <template #default="{ row }">
            <div @dblclick="timeDialogOpen(row)">
              {{ !row.startDate && !row.endDate ? 'Permanent' : `${formatDate(row.startDate)} ~ ${formatDate(row.endDate)}` }}
            </div>
          </template>
        </el-table-column>
        <el-table-column v-for="item in ['read', 'write', 'manage', 'print']" :key="item" :label="$t(`permission.${item}`)" header-align="left">
          <template #default="{ row }">
            <el-switch v-model="row[item]" :loading="row.loading" @change="(value: any) => handlePermissionChange(value, item, row)"></el-switch>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dpTable_actions')">
          <template #default="{ row }">
            <el-button
              :id="`FolderCabinetSetting__Info__LocalPermission__Remove__${row.userId}`"
              size="small"
              :loading="row.loading"
              @click="removeLocalAcl(row)"
            >
              {{ $t('dpButtom_remove') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <FolderCabinetSettingPermissionAddDialog ref="AclAddDialogRef" :isFolder="props.isFolder" :id="id" :exit-list="localList" @refresh="emits('refresh')" />
    <FolderCabinetSettingPermissionEditTimeDialog ref="AclEditTimeDialogRef" :id="id" @refresh="emits('refresh')" />
  </div>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import { ElMessageBox } from 'element-plus'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const props = defineProps<{
  tableData: any
  id: string
  isFolder: string
}>()
const emits = defineEmits(['refresh'])

async function handlePermissionChange(open: boolean, permission: string, row: any) {
  try {
    row.loading = true
    let res: any
    if (!open && permission === 'print')
      res = await newAdminApi.deleteAdmindmsCabinetTemplatePermission(
        {
          id: props.id,
          userId: row.userId,
          permission: 'Print'
        },
        {}
      )
    else if (open && permission === 'print') {
      const _data = {
        userId: row.userId,
        startDate: row.startDate,
        endDate: row.endDate,
        permission: 'Print',
        id: props.id
      }
      res = await newAdminApi.postAdmindmsCabinetTemplatePermission(_data)
    } else {
      const _permission = permissionRevert(open, permission)
      if (!_permission) {
        const action = await removeLocalAcl(row)
        if (action === 'cancel') row.read = true
        row.loading = false
        return
      } else {
        const _data: any = {
          id: props.id,
          aceId: row.aceId,
          permission: _permission,
          userId: row.userId
        }
        if (row.startDate) _data.startDate = row.startDate
        if (row.endDate) _data.endDate = row.endDate
        await newAdminApi.postAdmindmsCabinetTemplatePermission(_data)
      }
    }
    if (res && res.errorCode) throw new Error(res.message || 'error')
  } catch (error) {
    // routerProvider?.message.error(error.message || 'error')
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 500))
    row.loading = false
    emits('refresh')
  }
}

const AclAddDialogRef = ref()

function handleAclLocalDialogShow() {
  AclAddDialogRef.value.handleOpen()
  emits('refresh')
}

const AclEditTimeDialogRef = ref()

function timeDialogOpen(row: any) {
  AclEditTimeDialogRef.value.handleOpen(row)
}

function permissionRevert(open: boolean, permission: string) {
  switch (permission) {
    case 'read':
      return open ? 'Read' : ''
    case 'write':
      return open ? 'ReadWrite' : 'Read'
    default:
      return open ? 'Everything' : 'ReadWrite'
  }
}

async function removeLocalAcl(row: any) {
  try {
    row.loading = true
    let msg = t('folder_cabinetDetailLocalPermissionRemoveMsg')
    const action = await ElMessageBox.confirm(msg, {
      confirmButtonClass: 'el-button el-button--warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('common_confirmRemove')
    })
    if (action !== 'confirm') throw new Error('cancel')
    await newAdminApi.deleteAdmindmsCabinetTemplatePermission({ id: props.id, userId: row.userId }, {})
    routerProvider?.message.success(t('folder_cabinetDetailLocalPermissionRemoveSuccessMsg'))
    emits('refresh')
  } catch (error) {
    row.loading = false
    return 'cancel'
  } finally {
    row.loading = false
  }
}

// #region module: getPermission
function isRead(permission: string) {
  return ['Read', 'ReadWrite', 'ManageRecord', 'ManageLegalHold', 'Everything'].includes(permission)
}

function isWrite(permission: string) {
  return ['ReadWrite', 'ManageRecord', 'ManageLegalHold', 'Everything'].includes(permission)
}

function isManage(permission: string) {
  return ['Everything'].includes(permission)
}

function isPrint(permission: string) {
  return ['Print'].includes(permission)
}

const localList = computed(() => {
  try {
    const result = props.tableData.map((item: any) => ({
      userId: item.userId,
      permission: item.permission,
      startDate: item.startDate,
      endDate: item.endDate,
      print: item.print,
      read: isRead(item.permission),
      write: isWrite(item.permission),
      manage: isManage(item.permission),
      loading: false,
      printLoading: false
    }))
    // TODO 該數據需要檢查數據格式，區分User與Group
    console.log('localList', props.tableData, result)
    result.sort((a: any, b: any) => a.userId.localeCompare(b.userId))
    return result
  } catch (error) {
    return []
  }
})
// #endregion
</script>
<style lang="scss" scoped>
.permission-container {
  width: 100%;

  .tableTopContainer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
