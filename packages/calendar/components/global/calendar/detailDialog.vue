<script lang="ts" setup>
import dayjs from 'dayjs'
import type { CalendarEventExternal } from '@schedule-x/calendar'
import {clientApi} from 'api'
import { ElDialog, ElMessage } from 'element-plus'
import { displayTimeFn } from '../../../utils/calendarHelper'
const opened = ref(false)
const { options } = defineProps<{

    options: CalendarOptions,
}>()

const categories = useCalenarCategories()
const locations = useCalenarLocation()

const routerProvider = inject(MenuRouterKey)

const location = computed(() => {
    if(!eventDetail.value || !eventDetail.value.detail) return ""
    return locations.value.find(item => item.id === eventDetail.value.detail.location)?.name || eventDetail.value.detail.location
})

const category = computed(() => {
    if(!eventDetail.value || !eventDetail.value.detail) return ""
    return categories.value.find(item => item.id === eventDetail.value.detail.category)?.name
})

const eventDetail = ref<CalendarEventExternal>()
async function open(ev:CalendarEventExternal) {
    eventDetail.value = ev
    if(ev.detail?.relatedCases) {
        await getCaseData()
    }
    if(ev.detail?.relatedUsers) {
        await getUserData()
    }
    opened.value = true
}
const caseData = ref();
async function getCaseData() {
    try{
        const caseInstanceId = eventDetail.value.detail.relatedCases.caseDefinitionId
        if(!caseInstanceId) return
        const res = await clientApi.api.getCaseDashboardInstanceCaseidPrimaryformData(caseInstanceId,{
            headers:{
                "noThrowError":"true"
            }
        }).then(r => r.data)
        console.log("getCaseData", res)
    }catch(err) {
        caseData.value = null
    }
}

const relatedUserId = ref();
async function getUserData(){
    try{
        const eventUserId = eventDetail.value.detail.relatedUsers.user
        if(!eventUserId) throw new Error("eventUserId is empty")
        relatedUserId.value = eventUserId
    }catch(err){
        relatedUserId.value = null
    }
}

function openCase(){
    const caseId = eventDetail.value.detail.relatedCases.caseDefinitionId
}

async function openWorkflow(){
  if(!routeWorkflowDetail) return
  const workflow = eventDetail.value.detail.relatedWorkflows
  const processInstanceId = workflow.processInstanceId
  const taskList = await clientApi.api.getWorkflowTasks({processInstanceId}).then(res => res.data)
  try {
    if(taskList && taskList.length > 0) {
        const task = taskList[0]
        const newTab = routeWorkflowDetail({
            id: task.id,
            name: task.name
        })
        routerProvider?.navigateTo(newTab, true)
    }else{
      // open dialog an show the task is already completed
      ElMessage.warning("The task is already completed")
    }
  } catch (error: any) {
    console.error(error)
  }
}



defineExpose({
    open
})
</script>
<template>

    <ElDialog v-model="opened" draggable >
        <div class="content">
          <div class="eventInfoContainer">
            <div class="title eventInfo">
              <Icon name="mdi:calendar-text"  /> Title: {{ eventDetail.title }}
            </div>
            <!-- <div class="description eventInfo">
              <Icon name="mdi:text"  /> Description: {{ eventDetail.description }}
            </div> -->
            <div class="location eventInfo">
              <Icon name="mdi:map-marker"  /> Location : {{ location }}
            </div>
            <div class="category eventInfo">
              <Icon name="mdi:tag"  /> Category : {{ category }}
            </div>
            <div class="time eventInfo">
              <Icon name="mdi:clock-outline"  /> Time: {{ displayTimeFn(eventDetail) }}
            </div>
          </div>

            <!-- <ElForm label-position="top">
                <ElRow :gutter="12">
                    <ElCol :span="12">
                        <ElFormItem label="Start">
                            <ElDatePicker v-model="eventDetail.detail.startTime" format="YYYY-MM-DD HH:mm" :disabled="!options.editable" ></ElDatePicker>
                        </ElFormItem>
                    </ElCol>
                    <ElCol :span="12">
                        <ElFormItem label="End">
                            <ElDatePicker v-model="eventDetail.detail.endTime" format="YYYY-MM-DD HH:mm" :disabled="!options.editable"></ElDatePicker>
                        </ElFormItem>
                    </ElCol>
                </ElRow>
            </ElForm> -->
            <!-- Related Workflow -->
            <div v-if="eventDetail?.detail?.relatedWorkflows" class="relatedWorkflow pointer">
                <div class="relatedWorkflowTitle">Related Workflow</div>
                <div class="workflowTitle" @click="openWorkflow">
                   {{ eventDetail.detail.relatedWorkflows.businessKey}}
                    <!-- {{ eventDetail.detail.relatedWorkflows }} -->
                </div>
            </div>

            <div v-if="caseData" class="relatedWorkflow pointer">
                <div class="relatedWorkflowTitle">Related Case</div>
                <div class="workflowTitle" @click="openCase">
                    <!-- {{ eventDetail.detail.relatedWorkflows }} -->
                </div>
            </div>
            <div v-if="relatedUserId" class="relatedWorkflow">
                <div class="relatedWorkflowTitle">Related User</div>
                <div class="workflowTitle">
                    {{ relatedUserId }}
                </div>
            </div>
        </div>
    </ElDialog>
</template>

<style lang="scss" scoped>
.eventInfoContainer{
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  padding-block: var(--app-space-s);
  .eventInfo{
    display: flex;
    align-items: center;
    gap: var(--app-space-s);
    font-size: var(--app-font-size-m);
    line-height: 1.1rem;
  }
}
.relatedWorkflow{
    width:100%;
    height: 100%;
    padding: var(--app-space-s);
    background: var(--app-grey-900);
    cursor: pointer;
    border-radius: var(--app-border-radius-m);
    margin-bottom: var(--app-space-s);
    .relatedWorkflowTitle{
        font-size: var(--app-font-size-s);
        font-weight: normal;
        color: var(--app-grey-200);
    }
    .workflowTitle{
        font-size: var(--app-font-size-l);
        font-weight: bold;
        color: var(--app-accent-color);
    }
}

</style>
