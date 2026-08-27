<template>
  <div v-if="hold">
    <el-dropdown v-if="doc.isFolder && (!hold.status || hold.status === 'R')" trigger="click">
      <BrowseActionsButton id="shareActionButton" :label="svgContent">
        <SvgIcon class="hd-lock-img" src="/icons/file/lock.svg" style="--icon-color: var(--app-error-color)" round
                 :content="svgContent" />
      </BrowseActionsButton>
      <template #dropdown>
        <el-dropdown-menu class="hd-list--menu">
          <el-dropdown-item v-for="item in state.holdList" :key="item.id" @click="handleAdd(item)">
            {{ item.policyName }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-popover v-else-if="hold.status === 'P' || hold.status === 'L'" :visible="state.dVisible" placement="bottom"
                :width="250">
      <div v-if="hold" v-click-outside="onClickOutside">
        <b>{{ hold.removeProcessInstanceId ? $t('hp.pendingRemoveApproval') : $t('hp.pendingAddApproval') }}</b>
        <el-row :gutter="10">
          <el-col :span="10">
            <small>{{ $t('tableHeader_applyDate') }}</small>
          </el-col>
          <el-col :span="14">{{ hold.status === 'P' ? formatDate(hold.createdDate) : formatDate(hold.removeDate) }}
          </el-col>
        </el-row>
        <el-row :gutter="10">
          <el-col :span="10">
            <small>{{ $t('tableHeader_applyBy') }}</small>
          </el-col>
          <el-col :span="14">{{ hold.status === 'P' ? hold.applyBy : hold.removeBy }}</el-col>
        </el-row>
        <el-row :gutter="10">
          <el-col :span="10">
            <small>{{ $t('tableHeader_applyReason') }}</small>
          </el-col>
          <el-col :span="14" v-html="hold.status === 'P' ? hold.applyReason : hold.removeReason"></el-col>
        </el-row>
        <el-row :gutter="10"
                v-if="(hold.status === 'P' && userId !== hold.applyApprovedBy) || (hold.status === 'L' && userId !== hold.removeApprovedBy)">
          <el-col :span="10">
            <small>{{ $t('role.approver') }}</small>
          </el-col>
          <el-col :span="14">{{ hold.status === 'P' ? hold.applyApprovedBy : hold.removeApprovedBy }}</el-col>
        </el-row>
        <template v-else>
          <el-button type="primary" size="small" :loading="state.loading" @click="handelAudit(true)">
            {{ $t('workflow_startAdhocWorkflow_approve') }}
          </el-button>
          <el-button type="danger" size="small" :loading="state.loading" @click="handelAudit(false)">
            {{ $t('workflow_startAdhocWorkflow_reject') }}
          </el-button>
        </template>
      </div>
      <template #reference>
        <BrowseActionsButton id="shareActionButton" :label="svgContent">
          <SvgIcon
            class="hd-pending-approval-img icon-hold"
            disabled
            :src="hold.removeProcessInstanceId ? '/icons/file/lock.svg' : '/icons/file/unlock.svg'"
            round
            :content="svgContent"
            @click="state.dVisible = !state.dVisible"
          ></SvgIcon>
        </BrowseActionsButton>
      </template>
    </el-popover>
    <BrowseActionsButton v-else-if="hold.status === 'A'" id="shareActionButton" :label="svgContent">
      <SvgIcon class="hd-unlock-img" src="/icons/file/unlock.svg" round :content="svgContent"
               @click="handleRemoveHold"></SvgIcon>
    </BrowseActionsButton>
    <BrowseActionsHoldAddDialog ref="BrowseActionsHoldAddDialogRef" @submit="addHold" @remove="removeHold" />
  </div>
</template>

<script lang="ts" setup>
import { ClickOutside as vClickOutside } from 'element-plus'
import { newClientApi } from 'api'

const status = ref('D')
const props = defineProps<{
  doc?: any
}>()
const { t } = useI18n()
const hold = computed(() => {
  return props.doc?.holdDocument ? props.doc.holdDocument : {}
})
const state = reactive<any>({
  holdList: [],
  dVisible: false,
  loading: false
})
const emits = defineEmits(['success'])
const svgContent = computed(() => {
  switch (hold.value.status) {
    case 'A':
      return t('hp.removeHold')
    case 'P':
      return t('hp.pendingAddApproval')
    case 'L':
      return t('hp.pendingRemoveApproval')
    default:
      return t('hp.addHold')
  }
})
const userId: string = useUserId().value
// #region module: status: R || ''
const BrowseActionsHoldAddDialogRef = ref()

function handleAdd(holdDetail) {
  holdDetail.operation = 'ADD'
  holdDetail.approvedBy = holdDetail.holdApprovalId
  if (!holdDetail.isHoldAuto) {
    BrowseActionsHoldAddDialogRef.value.handleOpen(holdDetail)
  } else {
    hold.value.status === 'A'
    addHold({ holdPolicyId: holdDetail.id })
  }
}

async function addHold(params, cb?) {
  params.documentId = props.doc.id
  const res = await newClientApi.postDmsPolicyHoldDocument(params).then(r => r.data)
  await refreshHold()
  if (cb) cb()
}

// #endregion
// #region module: status: A
function handleRemoveHold() {
  const holdDetail = state.holdList.find((item) => item.id === hold.value.policyHoldId)
  if (!holdDetail) return
  holdDetail.operation = 'REMOVE'
  holdDetail.approvedBy = holdDetail.removeApprovalId
  if (!holdDetail.isRemoveAuto) BrowseActionsHoldAddDialogRef.value.handleOpen(holdDetail)
  else removeHold({})
}

async function removeHold(params?, cb?) {
  params.id = hold.value.id
  const res = await newClientApi.postDmsPolicyHoldDocumentUnbindRequest(params)
  if (res) await refreshHold()
  if (cb) cb()
}

// #endregion

// #region module: status: P/L
function onClickOutside() {
  state.dVisible = false
}

async function handelAudit(approved: boolean) {
  state.loading = true
  const result = await newClientApi.patchDmsPolicyHoldDocumentHolddocumentidApprovalStatus(hold.value.id, approved)
  if (result) await refreshHold()
  state.dVisible = false
  state.loading = false
}

// #endregion
async function refreshHold() {
  let _permission: any = await newClientApi.getDmsDocumentDocumentidUserPermissionUserid(props.doc.id, userId).then(r => r.data)
  if (!_permission) _permission = {}
  if (!_permission.hold) _permission.hold = {}
  props.doc.hold = _permission.hold

  nextTick(() => {
    emits('success')
  })
}

async function getHoldPolicies() {
  state.holdList = await newClientApi.getDmsPolicyHoldList().then((res: any) => res.data)
}

onMounted(() => {
  getHoldPolicies()
})
</script>
<style lang="scss" scoped>
.el-dropdown {
  color: var(--app-grey-300);
}

.hd-unlock-img {
  color: var(--app-accent-color);
}

.icon-hold {
  color: var(--app-error-color);
}
</style>
