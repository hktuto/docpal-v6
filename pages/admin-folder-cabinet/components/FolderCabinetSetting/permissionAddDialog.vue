<template>
  <el-dialog v-model="state.visible" :title="$t('folder_cabinetDetailLocalPermissionAdd')" :close-on-click-modal="false">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="FolderCabinetSetting__Info__AddLocalPermission__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import formJson from './permissionAddDialog.vform.json'
import { ElMessage } from 'element-plus'
import { getUserAndGroupPermissionSelectOption, getUserSelectOption, getGroupsSelectOption, excludeItemSelectList } from '#imports'

const props = defineProps<{
  id: string
  exitList: any
  isFolder: string
}>()
const { t } = useI18n()
const emits = defineEmits(['refresh'])
const state = reactive<any>({
  loading: false,
  visible: false,
  userList: [],
  groupList: []
})
const FormRendererRef = ref()
const permissionList = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    // TODO：data.userId 是被選中的權限名稱，但是沒有區分是user還是group
    const params: any = {
      id: props.id,
      userId: data.userId
    }
    if (data.permission === 'Print') {
      params.print = true
    } else {
      params.permission = data.permission
    }
    if (data.time === 'dateBase') {
      params.startDate = data.dateRange[0]
      params.endDate = data.dateRange[1]
    }
    state.loading = true
    await clientApi.admin.postAdmindmsCabinetTemplatePermission(params)
    state.visible = false
    const modelName = props.isFolder === 'folder' ? t('folder_cabinetLocalPermissionOfFolder') : t('folder_cabinetLocalPermissionOfFile')
    ElMessage.success(t('tip_createdMsg', { modelName: modelName, name: null }))
    emits('refresh')
  } catch (error) {
    console.log(error)
  }
  state.loading = false
}

function handleOpen() {
  state.visible = true
  setTimeout(() => {
    FormRendererRef.value.vFormRenderRef.resetForm()
    handleOptions()
  })
}

function handleOptions() {
  const userIdRef = FormRendererRef.value.vFormRenderRef.getWidgetRef('userId')
  // TODO 需要檢查 props.exitList 的數據
  excludeItemSelectList(props.exitList, permissionList.value)

  // TODO 移除該數據加載
  const options = [
    { value: 'user_groups', label: t('user_groups'), options: groupListFilter() },
    { value: 'user_users', label: t('user_users'), options: userListFilter() }
  ]
  userIdRef.loadOptions(options)

  // TODO 移除下面兩個方法
  function userListFilter() {
    return state.userList.filter((allItem: any) => !props.exitList.some((exitItem: any) => exitItem.userId === allItem.userId))
  }

  function groupListFilter() {
    return state.groupList.filter((allItem: any) => !props.exitList.some((exitItem: any) => exitItem.userId === allItem.id))
  }
}

async function init() {
  // TODO 移除該獲取數據列表
  state.userList = await getUserSelectOption()
  state.groupList = await getGroupsSelectOption()

  permissionList.value = await getUserAndGroupPermissionSelectOption()
}

onMounted(async () => {
  await init()
})
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
