<script lang="ts" setup>
import { clientApi } from 'api'
const visible = ref(false)
const file = ref([])
const formConfig = ref<any>(null)
const projectId = ref<string>('')
const formId = ref<string>('')
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}
function open(testFormId: string, testProjectId:string, testFormConfig: any) {
  visible.value = true

  formConfig.value = testFormConfig
  formId.value = testFormId
  projectId.value = testProjectId
}

function close() {
  visible.value = false
  formConfig.value = null
  file.value = []
}

const loading = ref(false)
async function submit(){
  loading.value = true
  try{
    const formData = new FormData()
    formData.append('file', file.value[0].raw)
    formData.append('projectId', projectId.value)
    formData.append('formId', formId.value)
    formData.append('fieldsSettingJson', JSON.stringify(formConfig.value))
    const {data} = await clientApi.api.postCaptureProjformsettingTestform(formData)
    const tab = createScanTestFormPageTab({
      formConfig: formConfig.value,
      ocrResult: data?.ocrResult,
      splitInfo: data?.splitInfo
    })
    routerProvider?.navigateTo(tab)
  }catch(err){

  }finally{
    loading.value = false
  }
}

watch(visible, (bool) => {
  if (!bool) {
    formConfig.value = null
  }
})

defineExpose({
  open,
  close,
})
</script>


<template>
  <ElDialog v-model="visible" @close="file = []" >
      <ElForm v-loading="loading" label-position="top">
          <ElFormItem>
              <el-upload
                    class="avatar-uploader"
                    v-model:file-list="file"
                    drag
                    :limit="1"
                    :auto-upload="false"
                  >
                      <span class="avatar-uploader-icon">
                          Drag file to upload
                      </span>
              </el-upload>
          </ElFormItem>
          <ElFormItem >
              <ElButton type="info" @click="close">
                  Cancel
              </ElButton>
              <ElButton type="primary" @click="submit">
                  Confirm
              </ElButton>
          </ElFormItem>
      </ElForm>
  </ElDialog>
</template>


<style>
.avatar-uploader{
    width: 100%;
}
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);

}
.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}
</style>
