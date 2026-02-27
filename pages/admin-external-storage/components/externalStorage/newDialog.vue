<template>
  <el-dialog
    v-model="state.visible"
    :title="state.isEdit ? $t('externalStorage.editConnection') : $t('externalStorage.create')"
    class="scroll-dialog externalStorage-dialog"
    append-to-body
    :close-on-click-modal="false"
    destroy-on-close
  >
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <div class="footer-grid">
        <el-button id="submit" type="primary" :loading="state.loading" @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import formJson from './newDialog.vform.json'
import { newAdminApi } from 'api'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const emits = defineEmits(['refresh'])
const state = reactive<any>({
  isEdit: false,
  loading: false,
  visible: false,
  setting: {}
})

const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    state.loading = true
    const params: any = {
      name: data.name,
      connection_type: data.connection_type,
      path: data.path,
      status: data.status ? 'A' : 'D',
      work_group: data.work_group,
      platform: data.platform,
      credentials: {
        port: data.port,
        password: data.password,
        secret: data.secret,
        username: data.username,
        host: data.host
      }
    }
    if (state.isEdit) {
      await newAdminApi.putExt3rdstorageIdUpdate(state.setting.id, params).then(r => r.data)
    } else {
      await newAdminApi.postExt3rdstorage(params).then(r => r.data)
    }
    ElMessage.success(t('dpMsg_success'))
    state.visible = false
    setTimeout(() => {
      emits('refresh')
    }, 500)
  } catch (error) {
    console.error(error)
  } finally {
    state.loading = false
  }
}

function handleOpen() {
  state.visible = true
  state.isEdit = false
  state.setting = {}
  setTimeout(async () => {
    FormRendererRef.value.vFormRenderRef.resetForm()
    state.loading = false
  })
}

function handleEdit(data: any) {
  state.visible = true
  state.isEdit = true
  state.setting = { ...data }
  const params = {
    name: data.name,
    connection_type: data.connection_type,
    path: data.path,
    status: data.status === 'A',
    work_group: data.work_group,
    host: data.credentials?.host,
    password: data.credentials?.password,
    secret: data.credentials?.secret,
    username: data.credentials?.username,
    port: data.credentials?.port,
    platform: data.platform
  }
  setTimeout(async () => {
    FormRendererRef.value.vFormRenderRef.resetForm()
    FormRendererRef.value.vFormRenderRef.setFormData(params)
    state.loading = false
  })
}

defineExpose({ handleOpen, handleEdit })
</script>
<style lang="scss" scoped></style>
