<template>
  <div class="infoSection vertical-top">
    <div class="infoTitle">
      {{ $t('workflow.adHocApproval') }}
    </div>
    <div class="infoContetn">
      <div class="block" style="margin-bottom: var(--app-space-s)">
        <el-button
          v-if="status === 'NotAllocated' || status === 'Approval'"
          type="primary"
          size="small"
          :loading="checkLoading || loading"
          @click="dialogShow = true"
        >
          {{ $t('workflow_startAdhocWorkflow') }}
        </el-button>

        <template v-if="status === 'NotReviewed' && isReviewer">
          <el-button type="primary" size="mini" :loading="checkLoading || loading" @click="handelAudit(true)">
            {{ $t('workflow_startAdhocWorkflow_approve') }}
          </el-button>
          <el-button type="danger" size="mini" :loading="checkLoading || loading" @click="handelAudit(false)">
            {{ $t('workflow_startAdhocWorkflow_reject') }}
          </el-button>
        </template>
      </div>
      <small class="small-text">{{ displayStatus }}</small>
    </div>

    <el-dialog :title="$t('workflow_startAdhocWorkflow')" v-model="dialogShow" append-to-body v-loading="loading">
      <el-form :model="form" ref="FormRef" @submit.native.prevent>
        <el-form-item :label="$t('role.auditor')">
          <el-select v-model="form.user_approver_id" multiple filterable clearable>
            <template v-for="item in userListFilter">
              <el-option v-if="item.value" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </template>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogShow = false">{{ $t('dpButtom_cancel') }}</el-button>
        <el-button type="primary" @click="handleStart">{{ $t('dpButtom_confirm') }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'
import { getUserSelectOption } from '#imports'

const props = defineProps<{ doc: any }>()
const emit = defineEmits(['update'])

const { doc } = toRefs(props)
const userId = useUserId()
const { t } = useI18n()
const loading = ref(false)
const checkLoading = ref(false)
const adHocHistory = ref<any>()
const pendingApproval = ref<any>()
const { formatDate } = useTime()
const currentHistory = ref<any>({
  pendingApproverId: null
})
// 'NotAllocated' | 'NotReviewed' | 'Approval'
const status = ref<string>('NotAllocated')
const isReviewer = ref<boolean>(false)
const displayStatus = computed(() => {
  if (status.value === 'NotAllocated') return t('tip.noAdhoc')

  if (status.value === 'NotReviewed') {
    return `${pendingApproval.value.user_creator_id} submit on ${formatDate(pendingApproval.value.startTime)}, version: ${pendingApproval.value.documentStartVersion} `
  }

  if (status.value === 'Approval') {
    return `${adHocHistory.value?.approvedBy} ${tagTextFilter(adHocHistory.value?.documentStatus)} on ${t('info_version')}: ${adHocHistory.value?.documentStartVersion} `
  }
})

const userList = ref([])
// #region module: befor audit
// TODO : add method to get UserList
const userListFilter = computed(() => {
  if (!userList) return []
  return userList.value.filter((item) => item.value !== userId.value)
})
const dialogShow = ref(false)
const form = ref({
  user_approver_id: []
})

async function checkAdhocStatus() {
  checkLoading.value = true
  await new Promise((resolve) => setTimeout(resolve, 2000)) // Delay of 1000ms occasionally fails
  await getWorkflowAdhoc(props.doc.id)
  checkLoading.value = false
}

const FormRef = ref()

function handleStart() {
  FormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const param = {
        processKey: 'adhocApproval',
        businessKey: `adhoc-${props.doc.name}`,
        properties: {
          documentId: props.doc.id,
          user_creator_id: userId.value,
          user_approver_id: form.value.user_approver_id.join(',')
        }
      }
      loading.value = true
      try {
        await newClientApi.postDocpalWorkflowProcessStart(param)
        dialogShow.value = false
        FormRef.value.resetFields()
        getNewHistory()
      } catch (error) {
        await checkAdhocStatus()
      }
      loading.value = false
    }
  })
}

let intervalId = null

function getNewHistory() {
  checkLoading.value = true
  intervalId = setInterval(async () => {
    const _pendingApproverId = pendingApproval.value?.user_approver_id ? pendingApproval.value.user_approver_id : ''
    if (currentHistory.value.pendingApproverId !== _pendingApproverId) {
      currentHistory.value.pendingApproverId = _pendingApproverId
      clearInterval(intervalId)
      checkLoading.value = false
    } else {
      await getWorkflowAdhoc(props.doc.id)
    }
  }, 2000, { immediate: true })
}

const canApproval = ref(false)

async function handelAudit(approved: boolean) {
  // if (!!approved && props.doc.isCheckedOut) {

  //   routerProvider?.message.error(`${t('dpTip_versoionError')}`)
  //   return
  // }
  const param = {
    properties: {
      documentId: props.doc.id,
      userId: userId.value,
      approved
    }
  }
  loading.value = true
  const result = await newClientApi.postDocpalWorkflowAdhocApproval(param as any).then((res) => res.code)
  loading.value = false
  if (result) {
    canApproval.value = false
    getNewHistory()
  }
}

function tagTextFilter(status: number) {
  switch (status) {
    case 0:
      return t('status.underApproval')
    case 1:
      return t('status.approve')
    case 2:
      return t('status.reject')
  }
}

async function getWorkflowAdhoc(documentId) {
  const data = (await newClientApi.getDocpalWorkflowAdhocList({
    documentId: documentId,
    userId: userId.value
  }).then((res) => res.data)) as any

  // data is null
  if (!data.id && !data.histories) {
    status.value = 'NotAllocated'
    return
  }

  //
  if (data.pendingApproval) {
    pendingApproval.value = data.pendingApproval
    status.value = 'NotReviewed'

    isReviewer.value = userId.value == data.pendingApproval.user_approver_id
    return
  } else {
    pendingApproval.value = null
  }

  //
  if (data.histories?.length > 0) {
    adHocHistory.value = data.histories?.[0]
    status.value = 'Approval'
  }
}

// doc
watch(
  doc,
  async (newValue) => {
    await getWorkflowAdhoc(newValue.id)
    currentHistory.value.pendingApproverId = pendingApproval.value?.user_approver_id ? pendingApproval.value.user_approver_id : ''
    console.log('start currentHistory.value.pendingApproverId', currentHistory.value.pendingApproverId)
  },
  { immediate: true }
)

onMounted(async () => {
  userList.value = await getUserSelectOption()
})
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<style lang="scss" scoped>
.small-text {
  display: block;
  margin-block: var(--app-space-xs);
}
</style>
