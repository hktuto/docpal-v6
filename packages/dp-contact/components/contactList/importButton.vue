<template>
  <el-button type="primary" @click="handleOpen"> {{ $t('button.import', { name: $t('data') }) }}</el-button>
  <el-dialog v-model="dialogVisible" class="scroll-dialog" :title="$t('button.import', { name: $t('data') })"
             destroy-on-close>
    <ContactListImportButtonForm ref="FormRef" />
    <template #footer>
      <el-button :loading="loading" type="primary" @click="handleSubmit"> {{ $t('button.import') }}</el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { newClientApi } from 'api'

const props = defineProps<{
  id: string
  name: string
  detail: any
}>()
const { t } = useI18n()
const importHelper = useImportHelper()
const emits = defineEmits(['refresh'])
const FormRef = ref()
const dialogVisible = ref(false)
const loading = ref(false)

function handleExport(command: string) {
  ElMessage.success(t('dpMsg_success'))
}

function handleOpen() {
  dialogVisible.value = true
  setTimeout(() => {
    FormRef.value.initMappings()
  })
}

async function handleSubmit() {
  try {
    loading.value = true
    const data = await FormRef.value.getFormData()
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('columns', JSON.stringify(data.dataMapping))
    formData.append('replace', data.replace)
    const result = await newClientApi.postDmsContactGroupIdContactdetailImport(props.id, formData as any).then((res) => res.data)

    if (result.failureNumber > 0) {
      ElMessage.error(t('dpTip.importFailed', { num: result.failureNumber }))
      importHelper.downloadFailList(result.failList)
    } else {
      ElMessage.success(t('dpMsg_success'))
    }
    dialogVisible.value = false
    emits('refresh')
  } catch (error) {
    console.error('Error getting form data:', error)
  } finally {
    loading.value = false
  }
}

provide('importHelper', importHelper)
</script>
<style lang="scss" scoped></style>
