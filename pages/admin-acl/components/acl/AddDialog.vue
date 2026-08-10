<template>
  <el-dialog v-model="state.visible" :title="$t('accessControl_add')" :close-on-click-modal="false">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="AccessControlList__LocalPermission__AddLocalPermission__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { adminApi, clientApi, gatewayApi } from 'api'
import formJson from './acl.vform.json'
import { ElMessage } from 'element-plus'
const routerProvider = inject(MenuRouterKey)
const props = defineProps<{
  doc: any
  exitList: any[]
}>()
const emits = defineEmits(['refresh'])
const state = reactive({
  loading: false,
  visible: false,

  userList: [],
  groupList: []
})
const FormRendererRef = ref()
const { t } = useI18n()

async function handleSubmit() {
  state.loading = true
  try {
    const data = await FormRendererRef.value.getFormData()
    const params: any = {
      idOrPath: props.doc.id,
      userId: data.userId,
      permission: data.permission
    }
    if (data.time === 'dateBase') {
      params.startDate = data.dateRange[0]
      params.endDate = data.dateRange[1]
    }
    await adminApi.api.postNuxeoDocumentAclAdd(params)
    ElMessage.success(t('tip_createdMsg', { modelName: t('accessControl_Local'), name: null }))
    state.visible = false
    emits('refresh')
  } catch (error) {}
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
  const options = [
    { value: 'user_groups', label: t('user_groups'), options: groupListFilter() },
    { value: 'user_users', label: t('user_users'), options: userListFilter() }
  ]
  userIdRef.loadOptions(options)

  function userListFilter() {
    return state.userList.filter((allItem: any) => !props.exitList.some((exitItem: any) => exitItem.userId === allItem.userId))
  }

  function groupListFilter() {
    return state.groupList.filter((allItem: any) => !props.exitList.some((exitItem: any) => exitItem.userId === allItem.id))
  }
}

onMounted(async () => {
  const data =  await clientApi.api.postUcenterUsers({}).then((res) => res.data)
  state.userList = data || ([] as any)
  state.userList.forEach((item: any) => {
    item.value = item.userId
    item.label = item.username
  })
  const groupResponse = await gatewayApi.groups.getGroupsSelect()
  state.groupList = (groupResponse.data || []).map((item: any) => ({
    ...item,
    value: item.value,
    label: item.label,
    id: item.value,
  }))
})
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
