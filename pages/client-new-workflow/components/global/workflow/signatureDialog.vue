<script lang="ts" setup>
import { newClientApi } from 'api'
import { Plus } from '@element-plus/icons-vue'

const opened = ref(false)
const props = defineProps<{
  signatureSetting: any
}>()
const emit = defineEmits(['confirm'])
const loading = ref(false)
const signatures = ref<any[]>([])
const signaturePreview = ref<any[]>([])
const currenUserDetail = useUserState()
const signatureCanvasRef = ref()

function ensureUserId(): string {
  const userId = currenUserDetail.value?.userId
  if (!userId) {
    throw new Error('Missing user id')
  }
  return userId
}

async function getUserSignature() {
  const signature = (await newClientApi.getDmsUserprofileUseridSignature(ensureUserId(), {
    format: 'blob',
    timeout: 0,
    headers: {
      noThrowError: true
    }
  })) as unknown as Blob

  if (!signature || signature.size === 0) {
    signaturePreview.value.push({
      type: 'user',
      img: ''
    })
    return
  }
  const reader = new FileReader()
  reader.readAsDataURL(signature)
  reader.onloadend = function () {
    const base64data = reader.result
    signatures.value.push(base64data)
    signaturePreview.value.push({
      type: 'user',
      img: base64data
    })
  }
}

async function getCompanyChop(chopId: string) {
  const signature = (await newClientApi.getDmsCompanyprofilesChopsCompanychopidFile(chopId, {
    format: 'blob',
    timeout: 0,
    headers: {
      noThrowError: true
    }
  })) as unknown as Blob
  const reader = new FileReader()
  reader.readAsDataURL(signature)
  reader.onloadend = function () {
    const base64data = reader.result
    signatures.value.push(base64data)
    signaturePreview.value.push({
      type: 'company',
      img: base64data
    })
  }
}

async function open() {
  opened.value = true
  loading.value = true
  signatures.value = []
  signaturePreview.value = []
  // check if signatureVariableSetting is personal or company
  const type = props.signatureSetting.signatureVariableSetting.value.type

  if (type === 'personal' || type === 'both') {
    await getUserSignature()
  }
  if (type === 'company' || type === 'both') {
    const chopId = props.signatureSetting.signatureVariableSetting.value.signatureId
    await getCompanyChop(chopId)
  }
}

function close() {
  opened.value = false
}

function openSignatureCanvas() {
  signatureCanvasRef.value.open()
}

async function handleSubmitSignature(signature: string) {
  if (!signature) {
    return
  }

  const response = await fetch(signature)
  const blob = await response.blob()
  const fileObj = new File([blob], 'signature.png', { type: 'image/png' })
  const form = new FormData()
  form.append('file', fileObj)
  form.append('format', 'image/png')

  const userSignature = signaturePreview.value.find((item: any) => item.type === 'user')

  if (!userSignature || !userSignature.img) {
    await newClientApi.postDmsUserprofileUseridSignature(ensureUserId(), {} as any, form as any)
  } else {
    await newClientApi.putDmsUserprofileUseridSignature(ensureUserId(), {} as any, form as any)
  }
  await open()
}

function confirmApplySignature() {
  // step 1 , create current user info
  const signatureData = {
    username: currenUserDetail.value?.username ?? '',
    userId: currenUserDetail.value?.userId ?? '',
    email: currenUserDetail.value?.email ?? '',
    phone: currenUserDetail.value?.phone ?? '',
    firstName: currenUserDetail.value?.firstName ?? '',
    lastName: currenUserDetail.value?.lastName ?? '',
    role: currenUserDetail.value?.aclUserDetail?.roleName ?? '',
    signature: JSON.parse(JSON.stringify(signatures.value)),
    signDate: Date.now()
  }
  emit('confirm', signatureData)
  close()
}

function toTitleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const canDrawNewSignature = computed(() => {
  return props.signatureSetting.signatureVariableSetting.value.type === 'personal' || props.signatureSetting.signatureVariableSetting.value.type === 'both'
})

defineExpose({ open, close })
</script>

<template>
  <el-dialog v-model="opened" v-loading="loading" append-to-body title="Apply Signature">
    <div class="signatureItem" v-for="signature in signaturePreview" :key="signature">
      <div class="signatureType">
        {{ toTitleCase(signature.type) }}
      </div>
      <div class="signatureImageContainer">
        <template v-if="signature.img">
          <img class="signatureImage" :src="signature.img" alt="signature" />
        </template>
        <template v-else>
          <el-icon class="cursor-pointer" @click="openSignatureCanvas">
            <Plus />
          </el-icon>
        </template>
      </div>
    </div>

    <template #footer>
      <el-button v-if="canDrawNewSignature" type="primary" @click="openSignatureCanvas">Draw New Signature</el-button>
      <el-button type="info" @click="close">Cancel</el-button>
      <el-button type="primary" @click="confirmApplySignature">Apply Signature</el-button>
    </template>
  </el-dialog>
  <SignatureCanvas ref="signatureCanvasRef" @submit="handleSubmitSignature" />
</template>

<style scoped>
.signatureItem {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 5px;
}

.signatureImage {
  width: 100%;
  height: 100%;
  max-width: 200px;
}
</style>
