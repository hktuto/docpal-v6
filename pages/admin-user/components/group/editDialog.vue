<template>
  <el-dialog v-model="state.visible" :title="$t('user_editGroup')" :close-on-click-modal="false">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="UserGroupList__Info__EditUserGroup__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { groupProviderDetailKey } from '~/util/userProvider'
import formJson from './editDialog.vform.json'
import { newAdminApi } from 'api'
import { ElMessage } from 'element-plus'
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const groupProviderDetail = inject(groupProviderDetailKey)
const props = defineProps<{
  group: any
}>()
const emits = defineEmits(['refresh'])
const state = reactive({
  loading: false,
  visible: false
})
const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    if (!data.groupName) {
      ElMessage.error(t('user_userGroupName') + t('render.hint.fieldRequired'))
      return
    }
    if (props.group.name === data.groupName) {
      state.visible = false
      return
    }
    const groupList: any = await newAdminApi.postUcenterGroups().then((r) => r.data)
    // check group name exist
    if (groupList.some((g: any) => g.name === data.groupName)) {
      ElMessage.error(t('user_userGroupsIsExistsMsg'))
      return
    }
    data.groupId = props.group.id
    const res = await groupProviderDetail?.PatchGroupApi(data)
    ElMessage.success(t('tip_updateMsg', { modelName: t('user_UserGroup'), name: null }))
    state.visible = false
    FormRendererRef.value.vFormRenderRef.resetForm()
    emits('refresh', res.data)
  } catch (error) {
    console.log(error)
  }
  state.loading = false
}

function handleOpen() {
  state.visible = true
  setTimeout(() => {
    FormRendererRef.value.vFormRenderRef.setFormData({ id: props.group.id, groupName: props.group.name })
  })
}

onMounted(async () => {})
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
