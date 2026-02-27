<template>
  <el-dialog
    class="scroll-dialog"
    v-model="state.visible" :title="$t('template.replace')"
    :close-on-click-modal="false" append-to-body
  >
    <FormUpload v-model="form.fileList" :limit="1" :accept="state.accept"></FormUpload>
    <template #footer>
      <el-button id="DocumentTemplate__ReplaceDocument__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'

const emits = defineEmits([
  'refresh'
])
const state = reactive({
  loading: false,
  visible: false,
  accept: '',
  setting: {}
})
const router = useRouter()
const form = reactive({
  fileList: []
})

async function handleSubmit() {
  if (form.fileList.length === 0) {
    state.visible = false
    return
  }
  const file = form.fileList[0]
  Object.defineProperty(file, 'name', { writable: true })
  file.name = getName()
  try {
    state.loading = true
    const formData = new FormData()
    formData.append('file', file)
    formData.append('id', state.setting.id)
    await newAdminApi.putDmsTemplateDocumentUpload({ requestDTO: {} }, formData as any).then(r => r.data)
    state.visible = false
    emits('refresh')
  } catch (error) {
  }
  state.loading = false
}

function getName() {
  const ext = state.setting.name.split('.').pop()
  if (['xlsx', 'pdf', 'docx', 'pptx'].includes(ext)) return state.setting.name
  return state.setting.name + ExtensionMap[state.setting.fileType]
}

async function handleOpen(setting) {
  state.visible = true
  state.setting = setting
  state.accept = ExtensionMap[setting.fileType]

  form.fileList = []
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>

</style>
