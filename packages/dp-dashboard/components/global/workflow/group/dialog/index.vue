<template>
  <el-dialog
    v-model="state.visible"
    :title="$t('dashboard.setting')"
    class="scroll-dialog"
    append-to-body
    :close-on-click-modal="false"
    width="80%"
    @close="handleClose"
  >
    <div>
      <h3>{{ $t('dashboard.workflowStartTask') }}</h3>
      <WorkflowGroupDialogTags :allTags="state.workflowAList" :tags="form.workflowList"
                               @change="handleWorkflowListChange" />
      <div class="sub-title">{{ $t('dashboard.workflowStartTaskPlaceholder') }}</div>
    </div>
    <div>
      <h3>{{ $t('dashboard.workflowVariableFilter') }}</h3>
      <DragSelect itemKey="name" joiner="" :dragList="state.filterHeaderPList" :dropList="form.filterHeaderList" />
      <div class="sub-title">{{ $t('dashboard.workflowVariableFilterPlaceHolder') }}</div>
    </div>
    <div>
      <h3>{{ $t('dashboard.workflowStatusHeaderDesign') }}</h3>
      <WorkflowGroupDialogCard :isAuto="true" :pLayout="state.cardHeaderPLayout" :layout="form.cardHeaderLayout" />
    </div>
    <div>
      <h3>{{ $t('dashboard.workflowStatusCardDesign') }}</h3>
      <WorkflowGroupDialogCard :pLayout="state.cardPLayout" :layout="form.cardLayout" />
    </div>
    <template #footer>
      <div class="footer-grid">
        <el-button type="primary" :loading="state.loading" @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'

const props = defineProps(['setting'])
const { t } = useI18n()

const emits = defineEmits(['refresh', 'delete'])
const state = reactive({
  loading: false,
  visible: false,
  setting: {},
  icon: '',
  filterHeaderPList: [],
  workflowAList: [],
  cardHeaderPLayout: [],
  cardPLayout: []
})
const form = ref({
  filterHeaderList: [],
  workflowList: [],
  cardHeaderLayout: [],
  cardLayout: []
})

async function handleSubmit() {
  try {
    state.loading = true
    emits('refresh', { ...form.value })
  } catch (error) {
  } finally {
    state.visible = false
    state.loading = false
  }
}

function handleOpen(setting) {
  state.visible = true
  // state.loading = true
  setTimeout(async () => {
    state.setting = setting
    if (!setting.filterHeaderList) setting.filterHeaderList = []
    form.value.filterHeaderList = [...setting.filterHeaderList]

    if (!setting.workflowList) setting.workflowList = []
    form.value.workflowList = [...setting.workflowList]

    if (!setting.cardLayout) setting.cardLayout = []
    form.value.cardLayout = [...setting.cardLayout]

    if (!setting.cardHeaderLayout) setting.cardHeaderLayout = []
    form.value.cardHeaderLayout = [...setting.cardHeaderLayout]
    await getWorkflowProps(form.value.workflowList)
    // state.loading = false;
  })
}

function handleWorkflowListChange(list) {
  getWorkflowProps(list)
}

async function getWorkflowProps(list) {
  const pList: any = []
  list.forEach((item) => {
    pList.push(
      newClientApi.postDsbWorkflowJobFilterData({
        processDefinitionName: item.name
      })
        .then((res) => res.data)
    )
  })
  const res = await Promise.all(pList)
  state.filterHeaderPList = res.reduce((prev, item) => {
    item.forEach((p) => {
      if (!form.value.filterHeaderList.find((f) => f.name === p.name) && !prev.find((f) => f.name === p.name)) {
        prev.push(p)
      }
    })
    return prev
  }, [])
  const workflowProps = [
    { source: 'workflow', variables: 'workflowName', name: 'Workflow Name', width: '50%' },
    { source: 'workflow', variables: 'startDate', name: 'Start Date', width: '25%' },
    { source: 'workflow', variables: 'endDate', name: 'End Date', width: '25%' },
    { source: 'workflow', variables: 'startDate~endDate', name: 'Startdate-Enddate', width: '50%' },
    { source: 'workflow', variables: 'duration startDate~endDate', name: 'Duration-Startdate-Enddate', width: '50%' },
    { source: 'workflow', variables: 'duration', name: 'Duration', width: '25%' },
    { source: 'workflow', variables: 'approver', label: t('role.approver'), name: 'Approval', width: '25%' },
    { source: 'workflow', variables: 'creator', label: t('role.creator'), name: 'Create By', width: '25%' },
    { source: 'workflow', variables: 'terminator', label: t('role.terminator'), name: 'Terminate User', width: '25%' },
    { source: 'workflow', variables: 'state', name: 'State', width: '25%' }
  ]
  const layouts = [workflowProps, ...res]
  const defaultStyle = {
    width: '50%',
    align: 'left',
    size: 'Default'
  }
  state.cardPLayout = layouts.reduce((prev, item) => {
    item.forEach((p) => {
      if (!form.value.cardLayout.find((f) => f.name === p.name) && !prev.find((f) => f.name === p.name)) {
        prev.push({ ...defaultStyle, ...p })
      }
    })
    return prev
  }, [])

  state.cardHeaderPLayout = layouts.reduce((prev, item) => {
    item.forEach((p) => {
      if (!form.value.cardHeaderLayout.find((f) => f.name === p.name) && !prev.find((f) => f.name === p.name)) {
        prev.push({ ...defaultStyle, ...p })
      }
    })
    return prev
  }, [])

  if (!form.value.cardHeaderLayout.find((f) => f.source === 'workflowIndex')) {
    state.cardHeaderPLayout.unshift({ source: 'workflowIndex', name: 'Workflow Index' })
  }
}

async function getWorkflowList() {
  state.workflowAList = await newClientApi.postDsbWorkflowProcessList({}).then((res) => res.data)
}

onMounted(() => {
  getWorkflowList()
})

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
