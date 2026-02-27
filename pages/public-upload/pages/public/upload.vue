<template>
  <LoadingBg />
  <div class="app" v-loading="state.loading">
    <UploadForm v-if="uploadState" :fileRequestDetail="fileRequestDetail" @submit="handleWorkflow"></UploadForm>
    <UploadPassword v-else @submit="handleGetPublicDocument"></UploadPassword>
  </div>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'
const route = useRoute()
const router = useRouter()
const state = reactive<any>({
  uploadState: '',
  loading: false,
  fileRequestDetail: {},
  password: ''
})
const { uploadState, fileRequestDetail } = toRefs(state)
async function handleGetPublicDocument(formData: any) {
  state.password = formData.password
  try {
    state.loading = true
    formData.token = route.query.token
    state.fileRequestDetail = await newClientApi.getDmsPublicUploadRequest(formData).then((res) => res.data)
    state.fileRequestDetail.config = getFormData(state.fileRequestDetail.properties)
    state.uploadState = true
  } catch (error) {
    router.push('/public/uploadTip?tip=linkExpired')
  }
  await new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      state.loading = false
      resolve()
    }, 100)
  })
}
function getFormData(properties: any) {
  const result = <any>{}
  properties.forEach((item: any) => {
    result[item.id] = item.value
  })
  return result
}

async function handleWorkflow(fileList: any) {
  state.loading = true
  try {
    const formData: any = new FormData()
    formData.append('taskId', state.fileRequestDetail.task.id)
    formData.append('password', state.password)
    formData.append('token', route.query.token)
    fileList.forEach((file: any) => {
      formData.append('files', file.raw)
    })
    const res = await newClientApi.postDmsPublicUploadRequestFiles(formData)
    if (res) router.push('/public/uploadTip?tip=uploadedSuccessfully')
  } catch (error) {}
  await new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      state.loading = false
      resolve()
    }, 100)
  })
}
</script>

<style lang="scss" scoped>
.app {
  height: 100vh;
}
</style>
