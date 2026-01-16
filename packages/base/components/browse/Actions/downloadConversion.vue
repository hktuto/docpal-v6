<template>
  <div style="width: 100%">
    <ElDivider />
    <ElForm ref="formRef" :model="form" class="downloadConvertForm" label-position="top">
      <ElFormItem
        :label="$t('convert_documentFormat')"
        prop="targetFile"
        :rules="[{ required: true, message: $t('convert_documentFormat') + $t('render.hint.fieldRequired') }]"
      >
        <ElSelect v-model="form.targetFile" value-key="targetFileType">
          <ElOption v-for="item in supportedFormatList" :key="item.targetFileType" :label="item.targetFileType"
                    :value="item"></ElOption>
        </ElSelect>
      </ElFormItem>
    </ElForm>
    <ElButton type="primary" :loading="loading" @click="handleConfirm">{{ $t('convert_convert') }}</ElButton>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { clientApi } from 'api'
import * as mime from 'mime-types'

const props = defineProps<{
  doc?: any
}>()

const form = ref<any>({
  targetFile: ''
})
const formRef = ref()
const loading = ref(false)
const emits = defineEmits(['success'])
const supportedFormatObject = ref<any>({})
// #region new convert
const supportedFormatList = computed(() => {
  try {
    const suffix = mime.extension(props.doc.properties['file:content']['mime-type'])
    return filterArrObj(supportedFormatObject.value[suffix], 'targetFileType')
  } catch (error) {
    return []
  }
})
const handleConfirm = async () => {
  try {
    await formRef.value.validate()
  } catch (e) {
    console.error(e)
    return
  }
  const param = {
    idOrPath: props.doc.id,
    targetFileType: form.value.targetFile.targetFileType,
    fileType: form.value.targetFile.type
  }
  loading.value = true
  const response = await clientApi.api.postDmsConversionFormatSubmit([param])
  if (response.result) {
    ElMessage.success(`${$i18n.t('convert_transferring')}`)
    formRef.value.resetFields()
    // 刷新转档列表
    const ev = new CustomEvent('refresh-conversion-history')
    window.dispatchEvent(ev)
    loading.value = false
    emits('success')
  } else {
    // Message.error(`${i18n.t('responseMsg_errorCode_2')}`)
  }
}
const handleGetSupportedFormat = async () => {
  if (supportedFormatObject.value instanceof Object && Object.keys(supportedFormatObject.value).length !== 0) return
  supportedFormatObject.value = await clientApi.api.getDmsConversionFormatSupport().then(r => r.data)
}
const filterArrObj = (arr, filterField) => {
  const newArr = arr.reduce((pre, cur) => (pre.some((item) => item[filterField] === cur[filterField]) ? pre : [...pre, cur]), [])
  return newArr
}
// #endregion

onMounted(async () => {
  await handleGetSupportedFormat()
})
</script>

<style lang="scss" scoped>
.popoverContent {
  .el-form,
  .el-select,
  .el-button {
    width: 100%;
  }

  .el-button {
    margin: unset;
  }
}
</style>
