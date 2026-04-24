<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
const props = withDefaults(
  defineProps<{
    steps: any
    bpmnXml?: string
    x6Json?: any
    autoplay: boolean
  }>(),
  {
    steps: [],
    autoplay: false
  }
)
const { t } = useI18n()
const mode = ref<list | table>('list')
function toggleMode() {
  if (mode.value === 'list') {
    mode.value = 'table'
  } else {
    mode.value = 'list'
  }
}
const viewerEl = ref()
const { bpmnXml, x6Json } = toRefs(props)
type TaskHistory = {
  id?: string
  assignee?: string
  taskName: string
  startTime: string
  endTime?: string
  taskType: string
  stepId: string
}
const state = reactive({
  playing: false,
  currentStep: 0
})

const displaySteps = ref<TaskHistory[]>([])
const allSteps = ref<any>([])
function createDisplaySteps() {
  if (!props.steps || props.steps.length === 0) return []
  const list = [...props.steps].reverse()
  const graph = viewerEl.value.graph

  const result: TaskHistory[] = list.map((item) => {
    const node = graph.getCellById(item.persistentState.activityId)
    let type = node.data.type
    if (type === 'serviceTask') {
      if (node.data.data['attr_flowable:delegateExpression'] === '${generateDocumentDelegate}') {
        type = 'document'
      } else if (node.data.data['attr_flowable:delegateExpression'] === '${sendNotificationDelegate}') {
        type = 'email'
      }
    }
    return {
      stepId: item.persistentState.activityId,
      assignee: item.assignee,
      taskName: item.persistentState.activityName,
      startTime: item.startTime,
      endTime: item.endTime,
      taskType: type || 'system'
    }
  })
  allSteps.value = result.map((item) => item.stepId)
  displaySteps.value = result
}

function graphReady() {
  // setTimeout(() => {
  //     // viewerEl.value.autoLayout(bpmnXml.value)
  // }, 100)
  if (props.steps) {
    createDisplaySteps()
    nextTick(() => {
      viewerEl.value.dim(allSteps.value)
    })
  }
}
function init(bpmnXml: string, x6Json: any) {
  state.playing = false
  state.currentStep = 0
  viewerEl.value.init(bpmnXml, x6Json)
}

function countDuration(start: string, end: string) {
  const duration = dayjs(end).diff(dayjs(start), 'm')
  if (duration < 60) {
    return duration + t('time.minutes')
  } else if (duration < 1440) {
    return (duration / 60).toFixed(1) + t('time.hours')
  }
  return (duration / 60 / 24).toFixed(0) + t('time.days')
}

function tableRowClick(row: any) {
  if (!state.playing) {
    viewerEl.value.highlightCell([row.stepId], allSteps.value)
  }
}

function stepHoverHandler(step: TaskHistory) {
  if (!state.playing) {
    viewerEl.value.highlightCell([step.stepId], allSteps.value)
  }
}
function stepBlurHandler(step: TaskHistory) {
  if (!state.playing) {
    viewerEl.value.highlightCell(null, allSteps.value)
  }
}
const playInterval = ref()
const tableRef = ref()

function playNext() {
  if (state.currentStep >= displaySteps.value.length || !state.playing) {
    clearInterval(playInterval.value)
    state.playing = false
    playInterval.value = null
    state.currentStep = 0
    viewerEl.value.highlightCell(null, allSteps.value)
    if (tableRef.value) tableRef.value.setCurrentRow()
  } else {
    viewerEl.value.highlightCell([displaySteps.value[state.currentStep].stepId], allSteps.value)
    if (tableRef.value) tableRef.value.setCurrentRow(displaySteps.value[state.currentStep])
  }
  state.currentStep += 1
}

function togglePlay() {
  viewerEl.value.highlightCell(null, allSteps.value)
  state.playing = !state.playing
  state.currentStep = 0
  playNext()
  if (state.playing) playInterval.value = setInterval(playNext, 1500)
}
function handleTableRowHover(row: any) {
  tableRef.value.setCurrentRow(row)
  stepHoverHandler(row)
}

defineExpose({
  init
})
</script>

<template>
  <div class="replayContainer">
    <div class="stepsContainer">
      <div class="actions">
        <div class="playPause" @click="togglePlay">
          <SvgIcon :src="state.playing ? '/icons/pause-circle.svg' : '/icons/play-circle.svg'" /> {{ state.playing ? 'Pause' : 'Play' }}
        </div>
        <div class="viewMode" @click="toggleMode">
          <div :class="{ mode: true, selected: mode === 'list' }">
            <SvgIcon src="/icons/table-list.svg" />
          </div>
          <div :class="{ mode: true, selected: mode === 'table' }">
            <SvgIcon src="/icons/cells.svg" />
          </div>
        </div>
      </div>
      <div v-if="mode === 'list'" class="stepsListContainer">
        <div
          v-for="(step, index) in displaySteps"
          :key="step.id"
          :class="{ steps: true, [step.taskType]: true, noAssign: !step.assignee, selected: state.playing && state.currentStep - 1 === index }"
          @mouseover="stepHoverHandler(step)"
          @mouseleave="stepBlurHandler(step)"
        >
          <div class="start time">
            {{ formatDate(step.startTime) }}
          </div>
          <template v-if="step.assignee">
            <div class="stepContent">
              <div class="taskName">
                {{ step.taskName }}
              </div>
              <div v-if="step.endTime && step.startTime" class="duration">
                <ElTooltip :content="$t('time.endtime') + ' : ' + formatDate(step.endTime)">
                  {{ countDuration(step.startTime, step.endTime) }}
                </ElTooltip>
              </div>
              <div class="assignee">
                {{ step.assignee || 'System' }}
              </div>
            </div>
          </template>
          <template v-else>
            <div class="stepContent system">
              {{ step.taskName }}
            </div>
          </template>
        </div>
      </div>
      <div v-if="mode === 'table'" style="overflow: hidden">
        <ElTable
          ref="tableRef"
          class="table"
          height="100%"
          :data="displaySteps"
          size="small"
          highlight-current-row
          current-row-key="id"
          @cell-mouse-enter="handleTableRowHover"
        >
          <ElTableColumn prop="startTime" label="Start Time">
            <template #default="scope">
              {{ dayjs(scope.row.startTime).format('YYYY-MM-DD HH:mm') }}
            </template>
          </ElTableColumn>
          <ElTableColumn prop="endTime" label="Duration">
            <template #default="scope">
              <ElTooltip :content="$t('time.endtime') + ' : ' + formatDate(scope.row.endTime)">
                {{ countDuration(scope.row.startTime, scope.row.endTime) }}
              </ElTooltip>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="taskName" label="Task Name" />
          <ElTableColumn prop="assignee" label="Assignee" />
        </ElTable>
      </div>
    </div>

    <WorkflowEditor ref="workflowEditorRef" :workflow-data="workflowData" :readonly="workflowReadonly" :showSidebar="false" />
    <BpmnViewer ref="viewerEl" @graphReady="graphReady" />
  </div>
</template>

<style lang="scss" scoped>
.replayContainer {
  height: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  --step-color: var(--app-grey-600);
}
.stepsListContainer {
  height: 100%;
  overflow: auto;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: calc(var(--app-space-xs));
  padding: 0 var(--app-space-xs) 0 20px;
  position: relative;
  &:before {
    content: '';
    width: 2px;
    height: calc(100% - 12px);
    position: absolute;
    left: 9px;
    top: 5px;
    display: block;
    background: var(--step-color);
  }
}
.steps {
  width: 100%;
  position: relative;
  .stepContent {
    padding: calc(var(--app-space-xs) / 2) var(--app-space-xs);
    background: var(--app-grey-800);
    width: 100%;
    border-radius: var(--app-space-xs);
    &.system {
      font-size: 0.8rem;
      background: none;
      //padding:0;
    }
  }

  &.startEvent {
    --step-color: #0099ff;
  }
  &.serviceTask {
    --step-color: green;
  }
  &.endEvent {
    --step-color: #eee;
  }
  &.userTask {
    --step-color: #0099ff;
  }
  &.exclusiveGateway {
    --step-color: #0099ff;
  }
  &.boundaryEvent {
    --step-color: #eee;
  }
  &.serviceTask {
    --step-color: #7b61ff;
  }
  &.document {
    --step-color: #7b61ff;
  }
  &.email {
    --step-color: #36ce3c;
  }
  &.script {
    --step-color: #7b61ff;
  }
  &:before {
    content: '';
    width: 2px;
    height: calc(100% - 12px);
    position: absolute;
    left: -11px;
    top: 5px;
    display: block;
    background: var(--step-color);
  }
  &.noAssign {
    &:before {
      height: 100%;
    }
  }
  &:hover,
  &:focus-within,
  &.selected {
    .stepContent {
      background: var(--app-main-color);
      color: #fff;
      //border: 1px solid var(--app-main-color);
    }
    &:after {
      content: '';
      left: -20px;
      top: -10px;
      width: calc(100% + 40px);
      height: calc(100% + 20px);
      position: absolute;
      display: block;
      background: linear-gradient(90deg, rgba(255, 255, 255, 0) 90%, var(--app-main-color-02) 100%);
      z-index: -1;
      border-right: 1px solid var(--app-main-color);
    }
  }
}
.stepsContainer {
  width: 300px;
  display: grid;
  grid-template-rows: min-content 1fr;

  position: relative;
  height: 100%;
}
.time {
  font-size: 0.8rem;
  position: relative;
  &:before {
    content: '';
    width: 10px;
    height: 10px;
    position: absolute;
    left: -15px;
    top: 5px;
    display: block;
    background: var(--step-color);
    border-radius: 50%;
  }
  &.end {
    font-weight: 700;
  }
}
.duration {
  font-size: 0.9rem;
}
.taskName {
  font-size: 1rem;
  font-weight: 700;
}
.assignee {
  font-size: 0.8rem;
  color: var(--app-grey-900);
}
.actions {
  z-index: 2;
  display: flex;
  flex-flow: row nowrap;
  padding-right: var(--app-space-xs);
  padding-bottom: var(--app-space-xs);
  border-bottom: 1px solid var(--app-grey-800);
}
.playPause {
  flex: 1 0 auto;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
  cursor: pointer;
  z-index: 2;
}
.viewMode {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  z-index: 2;
  cursor: pointer;
  .mode {
    --icon-size: 22px;
    background: var(--app-grey-800);
    padding: 4px;
    &.selected {
      color: var(--app-main-color);
    }
  }
}
.table {
  width: 500px;
}
</style>
