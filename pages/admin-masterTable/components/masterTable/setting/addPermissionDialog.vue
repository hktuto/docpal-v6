<template>
  <el-dialog v-model="state.visible" :title="$t('masterTable_settingAddPermission')" :close-on-click-modal="false">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="MasterTable__Tables__Detail__Setting__Permissions__AddPermission__Submit" type="primary"
                 :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import formJson from './addPermissionDialog.vform.json'
import {
  getGroupsSelectOption,
  getRoleSelectOption,
  getUserSelectOption,
  getPermissionSelectOption,
  excludeItemSelectList
} from '#imports'

const routerProvider = inject(MenuRouterKey)
const props = defineProps<{
  exitList: any[]
  tableId: string
}>()
const { t } = useI18n()
const emits = defineEmits(['refresh'])

const state = reactive<any>({
  loading: false,
  visible: false
})
const userList = ref([])
const groupList = ref([])
const roleList = ref([])
const permissionList = ref([])
const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    const params = {
      masterTableId: props.tableId,
      userId: data.userId,
      ...data
    }
    state.loading = true
    await newAdminApi.postDmsMasterTableAclsAdd(params).then(r => r.data)
    routerProvider?.message.success(
      t('tip_createdMsg', {
        modelName: t('masterTable_permissionForMaster', { name: props.exitList[0]?.masterTableName }),
        name: null
      })
    )
    state.visible = false
    emits('refresh')
  } catch (error) {
  } finally {
    state.loading = false
  }
}

async function handleOpen() {
  state.visible = true
  await new Promise((resolve) => setTimeout(resolve, 10))

  FormRendererRef.value.vFormRenderRef.resetForm()
  handleOptions()
}

function handleOptions() {
  const userIdRef = FormRendererRef.value.vFormRenderRef.getWidgetRef('userId')

  // 排除了數據的結果集
  // const options = excludeItemSelectList(props.exitList, permissionList.value)
  // userIdRef.loadOptions(options)

  // TODO：刪除下面全面内容
  const options = [
    {
      key: 'role',
      label: t('user_role'),
      type: 'string',
      isMultiple: false,
      options: roleList.value
    },
    { value: 'user_groups', label: t('user_groups'), options: groupListFilter() },
    { value: 'user_users', label: t('user_users'), options: userListFilter() }
  ]
  userIdRef.loadOptions(options)

  // TODO：不生效，無法移除已添加過的 Permission
  function userListFilter() {
    return userList.value.filter((allItem: any) => !props.exitList.some((exitItem: any) => exitItem.userId === allItem.userId))
  }

  function groupListFilter() {
    return groupList.value.filter((allItem: any) => !props.exitList.some((exitItem: any) => exitItem.userId === allItem.id))
  }
}

onMounted(async () => {
  // permissionList.value = getPermissionSelectOption()

  // TODO: 刪除
  userList.value = await getUserSelectOption()
  groupList.value = await getGroupsSelectOption()
  try {
    roleList.value = await getRoleSelectOption()
  } catch (e) {
    roleList.value = []
  }
})
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
