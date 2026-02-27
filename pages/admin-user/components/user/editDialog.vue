<template>
  <el-dialog v-model="state.visible" :title="$t('user_editUser')" :close-on-click-modal="false">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="UserList__Info__Edit__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import formJson from './editDialog.vform.json'
import { ElMessage } from 'element-plus'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const props = defineProps<{
  user: any
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
    state.loading = true
    await newAdminApi.patchUcenterUser({ ...props.user, properties: null, ...data }).then(r => r.data)
    ElMessage.success(t('tip_updateMsg', { modelName: t('user_info'), name: data.firstName }))
    state.visible = false
    FormRendererRef.value.vFormRenderRef.resetForm()
    emits('refresh')
  } catch (error) {
  }
  state.loading = false
}

function handleOpen() {
  state.visible = true
  setTimeout(() => {
    FormRendererRef.value.vFormRenderRef.setFormData(props.user)
  })
}

onMounted(async () => {
})
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>
</style>
