<template>
  <div class="card">
    <div class="tableTopContainer">
      <h3>{{ $t('accessControl_Local') }}</h3>
      <el-button id="AccessControlList__LocalPermission__AddLocalPermission" size="small" type="primary" round
                 @click="handleAclLocalDialogShow">
        {{ $t('accessControl_add') }}
      </el-button>
    </div>
    <div>
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="userId" :label="$t('dpTable_name')"></el-table-column>
        <el-table-column :label="$t('dpTable_validityPeriod')">
          <template #default="{ row }">
            <div @dblclick="timeDialogOpen(row)">
              {{
                !row.startDate && !row.endDate ? 'Permanent' : formatDate(row.startDate) + ' ~ ' + formatDate(row.endDate)
              }}
            </div>
          </template>
        </el-table-column>
        <el-table-column v-for="item in ['read', 'write', 'manage', 'print']" :key="item"
                         :label="$t(`permission.${item}`)" align="center" header-align="center">
          <template #default="{ row }">
            <el-switch v-model="row[item]" :loading="row.loading"
                       @change="(value:any) => handlePermissionChange(value, item, row)"></el-switch>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dpTable_actions')">
          <template #default="{ row }">
            <el-button :id="`AccessControlList__LocalPermission__Remove__${row.userId}`" size="small"
                       :loading="row.loading"
                       @click="removeLocalAcl(row)">
              {{ $t('dpButtom_remove') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <AclAddDialog ref="AclAddDialogRef" :doc="doc" :exit-list="tableData"
                  @refresh="emits('refresh')"></AclAddDialog>
    <AclEditTimeDialog ref="AclEditTimeDialogRef" :doc="doc"
                       @refresh="emits('refresh')"></AclEditTimeDialog>
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { adminApi, newAdminApi } from 'api'
const routerProvider = inject(MenuRouterKey)
const props = defineProps<{
  tableData: any[],
  doc: any
}>()
const emits = defineEmits([
  'refresh'
])
const { t } = useI18n()

async function handlePermissionChange(open: boolean, permission: string, row: any) {
  try {
    row.loading = true
    let res: any
    if (!open && permission === 'print') res = await adminApi.api.deleteNuxeoDocumentAclRemove({
      idOrPath: props.doc.id,
      userId: row.userId,
      permission: 'Print'
    })
    else if (open && permission === 'print') {
      const _data = {
        ...row,
        permission: 'Print',
        idOrPath: props.doc.id
      }
      res = await adminApi.api.postNuxeoDocumentAclAdd(_data)
    } else if (open && !row.acePermission) {
      const _data = {
        ...row,
        permission: permissionRevert(open, permission),
        idOrPath: props.doc.id
      }
      res = await adminApi.api.postNuxeoDocumentAclAdd(_data)
    } else {
      const _permission = permissionRevert(open, permission)
      if (!_permission) {
        const action = await removeLocalAcl(row)
        if (action === 'cancel') row.read = true
        row.loading = false
        return
        // res = await removeACLApi({ idOrPath: props.doc.id, userId: row.userId, permission: row.acePermission})
      } else {
        const _data: any = {
          idOrPath: props.doc.id,
          aceId: row.aceId,
          permission: _permission,
          userId: row.userId
        }
        if (row.startDate) _data.startDate = row.startDate
        if (row.endDate) _data.endDate = row.endDate
        await adminApi.api.putNuxeoDocumentAclReplace(_data)
      }
    }
    if (res && res.errorCode) throw new Error(res.message || 'error')
  } catch (error) {
    // routerProvider?.message.error(error.message || 'error')
  }
  setTimeout(async () => {
    row.loading = false
    emits('refresh')
  }, 500)
}

const AclAddDialogRef = ref()

function handleAclLocalDialogShow() {
  AclAddDialogRef.value.handleOpen()
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
  row.loading = true
  try {
    let msg = ''

    const isShareInternal = await newAdminApi.postDmsInternalshareCheckDocumentIsInShare({
      documentId: props.doc.id,
      shareToUserId: row.userId
    })
    if (isShareInternal.data) msg += `<span class="color__danger">${t('msg_isShareInternal')}</span>,`

    msg += `${t('tip_deleteMsg', { modelName: t('accessControl_Local'), name: null })}`
    const action = await ElMessageBox.confirm(msg, {
      confirmButtonClass: 'el-button el-button--warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') throw new Error('cancel')
    await adminApi.api.deleteNuxeoDocumentAclRemove({ idOrPath: props.doc.id, userId: row.userId })
    routerProvider?.message.success(t('accessControl_deleteSuccessMsg'))
    emits('refresh')
  } catch (error) {
    row.loading = false
    return 'cancel'
  }
  row.loading = false
}
</script>
<style lang="scss" scoped>
.card {
  width: 100%;
  margin: 0 0 var(--app-space-xs) 0;
  padding: var(--app-space-xs);
  box-shadow: var(--el-box-shadow-light);

  .tableTopContainer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
