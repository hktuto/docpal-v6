<template>
  <el-dialog v-model="state.visible" :title="$t('user_newUser')"
             :close-on-click-modal="false" destroy-on-close
  >
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="UserList__CreateNewUser__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import { userProviderKey } from '~/util/userProvider'
import formJson from './dialog.vform.json'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const userProvider = inject(userProviderKey)
const emits = defineEmits([
  'refresh'
])
const state = reactive({
  loading: false,
  visible: false
})
const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    data.status = data.status ? 'A' : 'D'
    if (!data.userId || !data.username) {
      ElMessage.error(t('user_username') + t('render.hint.fieldRequired'))
      return
    }
    state.loading = true
    await newAdminApi.postUcenterUser(data).then(r => r.data)
    if (data.groupList.length > 0) {
      await userProvider?.BatchUserAddGroupsApi({
        userId: data.userId,
        groupIds: data.groupList
      })
    }
    ElMessage.success(t('tip_createdMsg', { modelName: t('User') }))
    emits('refresh')
    console.log('resetFormFormRendererRef', FormRendererRef.value.vFormRenderRef)
    FormRendererRef.value.vFormRenderRef.resetForm()
    state.visible = false
  } catch (error) {
    console.error(error)
  } finally {
    state.loading = false
  }
}

function handleOpen() {
  state.visible = true
}

onMounted(async () => {
})
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>

</style>
