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
    // check expiredAt
    const today = new Date()
    const expiredAt = new Date(state.fileRequestDetail.uploadRequest.expiredAt)
    console.log("expiredAt", expiredAt, "today", today)
    if (expiredAt && today > new Date(expiredAt)) {
      throw new Error('Link expired')
    }
    if (state.fileRequestDetail.uploadRequest.status !== 'pending_upload') {
      throw new Error('Link expired')
    }

    state.uploadState = true
  } catch (error) {
    console.log("error",error)
    router.push('/public/uploadTip?tip=linkExpired')
  }
  await new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      state.loading = false
      resolve()
    }, 100)
  })
}


async function handleWorkflow(fileList: any) {
  state.loading = true
  try {
    const formData: any = new FormData()
    formData.append('password', state.password)
    formData.append('token', route.query.token)
    fileList.forEach((file: any) => {
      formData.append('files', file.raw)
    })
    const res = await newClientApi.postDmsPublicUploadRequestFiles(formData, {
      timeout: 0
    })
    if (res) router.push('/public/uploadTip?tip=uploadedSuccessfully')
  } catch (error) {
    console.log("error", error)
  }
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
