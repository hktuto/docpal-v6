<template>
  <el-card v-loading="state.loading">
    <div>
      <h3 class="title">{{ $t('master.setting.permission') }}</h3>
      <div class="description">{{ $t('master.setting.permissionDescription') }}</div>
      <el-button id="MasterTable__Tables__Detail__Setting__Permissions__AddPermission" type="primary" @click="handleAdd">
        {{ $t('masterTable_settingAddPermission') }}
      </el-button>
    </div>
    <div class="table-container">
      <el-table :data="state.tableData" style="width: 100%; height: 100%" :default-sort="{ prop: 'userId', order: 'descending' }">
        <el-table-column sortable prop="userId" :label="$t('tableHeader.user_role_group')"> </el-table-column>
        <el-table-column
          v-for="item in ['read', 'edit', 'create', 'enable']"
          :key="item"
          :label="$t(`permission.${item}`)"
          align="center"
          header-align="center"
          sortable
          :prop="item"
        >
          <template #default="{ row }">
            <el-switch
              v-model="row[item]"
              :loading="row.loading"
              :disabled="item === 'read'"
              @change="(value: boolean) => handlePermissionChange(value, item, row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dpTable_actions')">
          <template #default="{ row }">
            <el-button
              :id="`MasterTable__Tables__Detail__Setting__Permissions__Remove__${row.userId}`"
              size="small"
              :loading="row.loading"
              @click="handleRemove(row)"
            >
              {{ $t('dpButtom_remove') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <MasterTableSettingAddPermissionDialog ref="AddPermissionDialogRef" :tableId="table.id" :exitList="state.tableData" @refresh="init" />
  </el-card>
</template>
<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'
const routerProvider = inject(MenuRouterKey)
const props = defineProps(['table', 'tableId'])
const { t } = useI18n()
const state = reactive<{ loading: boolean; tableData: any }>({
  loading: false,
  tableData: []
})
const AddPermissionDialogRef = ref()

function handleAdd() {
  AddPermissionDialogRef.value.handleOpen()
}

async function handlePermissionChange(boo: boolean, permission: string, row: any) {
  row.loading = true
  try {
    await clientApi.api.postDmsMasterTableAclsRemove({
      ...row,
      [permission]: boo
    })
  } catch (error) {
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 10))
    row.loading = false
  }
}

async function handleRemove(row: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('masterTable_settingRemoveMsg', { name: row.masterTableName })}`, {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmDelete')
    }).catch(() => {
      return
    })
    if (action !== 'confirm') return
    row.loading = true
    await clientApi.api.postDmsMasterTableAclsDelete({
      masterTableId: row.masterTableId,
      userId: row.userId
    })
    routerProvider?.message.success(t('masterTable_settingRemoveSuccessMsg', { name: row.masterTableName }))
    init()
  } catch (error) {
  } finally {
    row.loading = false
  }
}

async function init() {
  try {
    state.loading = true
    state.tableData = await clientApi.api.getDmsMasterTableIdAcls(props.tableId).then((res) => res.data)
  } catch (error) {
  } finally {
    state.loading = false
  }
}

watch(
  () => props.tableId,
  (newVal) => {
    if (newVal) {
      init()
    }
  },
  {
    immediate: true
  }
)
</script>
<style lang="scss" scoped>
.el-button {
  margin: var(--app-space-xs) 0;
}

:deep(.el-card__body) {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: var(--app-space-xs);
  height: 100%;
  overflow: hidden;
}

.table-container {
  height: 100%;
  overflow: hidden;
}
</style>
