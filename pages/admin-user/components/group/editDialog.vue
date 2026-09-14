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
import formJson from './editDialog.vform.json'
import { ElMessage } from 'element-plus'
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const { updateGroup, fetchGroupsPage } = useAdminGroup()
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
    data.id = props.group.id
    data.groupId = props.group.id
    const res = await updateGroup(data)
    ElMessage.success(t('tip_updateMsg', { modelName: t('user_UserGroup'), name: null }))
    state.visible = false
    emits('refresh', data)
  } catch (error) {
    console.log(error)
  } finally {
    FormRendererRef.value.vFormRenderRef.resetForm()
    state.loading = false
  }
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
