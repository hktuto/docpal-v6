<script setup lang="ts">
import { newClientApi } from 'api'
import { type EventFormData, updateEventWorkflow } from '../../../../composables/useCalendar'
import type { CalendarEventExternal } from '@schedule-x/calendar'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

const props = defineProps<{
  processInstanceId: string
}>()

const { processInstanceId } = toRefs(props)
const workflowInstanceId = ref<string>(processInstanceId.value)

const { t } = useI18n()
const showDetail = ref(false)
const showForm = ref(false)
const calendarRef = ref()
const options = ref({
  title: '',
  showUserFilter: true,
  showCategoryFilter: true,
  showLocationFilter: true,
  view: 'week',
  firstDayOfWeek: 'MONDAY',
  allowCreate: false,
  editable: false
})
const event = ref<{
  eventId: string,
  eventName: string,
  eventDescription: string,
  eventLocation: string,
  locationName?: string,
  eventCategory: string,
  categoriesName?: string,
  startTime: string,
  endTime: string,
  isAllDay: boolean,
  eventUser: string,
  creator: string
}>({
  eventId: '',
  eventName: '',
  eventDescription: '',
  eventLocation: '',
  locationName: '',
  eventCategory: '',
  categoriesName: '',
  startTime: '',
  endTime: '',
  isAllDay: false,
  eventUser: '',
  creator: ''
})
const { setting: calendarSetting, categoriesOption, locationsOption, handleCancel, handleRemove } = useCalendarStore()
const eventDialogFormRef = ref()

const state = reactive({
  workflowKey: '',
  flows: [],
  loading: false,
  categoryId: ''
})
const isReject = ref(false)
const isAccept = ref(false)
const isUpdate = ref(false)

function handleRejectEvent() {
  const userId = useUserId()
  // Remove from eventUser
  const eventUser: any = event.value.eventUser.split(',')
  if (!eventUser.includes(userId.value)) {
    routerProvider?.message.error('You did not attend the event.')
    return
  }

  const newUserList: any = eventUser.filter((item: string) => item !== userId.value)

  if (newUserList.length < 1) {
    routerProvider?.message.error('The number of participants cannot be less than 1.')
    return
  }

  showForm.value = !!isUpdate.value

  const data: EventFormData = {
    eventId: event.value.eventId,
    eventName: event.value.eventName,
    eventDescription: event.value.eventDescription,
    eventCategory: event.value.eventCategory,
    eventLocation: event.value.eventLocation,
    startTime: event.value.startTime,
    endTime: event.value.endTime,
    isAllDay: event.value.isAllDay,
    eventUser: newUserList.join(','),
    sendMessage: true,
    recipient: event.value.creator
  }

  eventDialogFormRef.value.confirm('reject', data)
}

function handleAcceptEvent() {
  const userId = useUserId()

  const eventUser: any = event.value.eventUser.split(',')
  if (eventUser.includes(userId.value)) {
    routerProvider?.message.error('You have attended this event')
    return
  } else {
    eventUser.push(userId.value)
  }

  const data: EventFormData = {
    eventId: event.value.eventId,
    eventName: event.value.eventName,
    eventDescription: event.value.eventDescription,
    eventCategory: event.value.eventCategory,
    eventLocation: event.value.eventLocation,
    startTime: event.value.startTime,
    endTime: event.value.endTime,
    isAllDay: event.value.isAllDay,
    eventUser: eventUser.join(','),
    sendMessage: true,
    recipient: event.value.creator
  }
  eventDialogFormRef.value.confirm('accept', data)
}

function handleUpdateEvent() {
  showForm.value = !!isUpdate.value

  eventDialogFormRef.value.confirm('update', null)
}

async function handelCancelEvent(event: CalendarEventExternal) {
  const data: EventFormData = {
    eventId: event.detail.eventId,
    eventName: event.detail.eventName,
    eventDescription: event.detail.eventDescription,
    eventCategory: event.detail.category,
    eventLocation: event.detail.location,
    startTime: event.start,
    endTime: event.end,
    eventUser: event.detail.relatedUsers.user,
    isAllDay: event.detail.isAllDay,
    sendMessage: false
  }
  data.eventMessage = ''
  await handleCancel(event.calendarId, data)
  nextTick(() => {
    calendarRef.value.refresh()
  })
}

async function handelDeleteEvent(event: CalendarEventExternal) {
  const data: EventFormData = {
    eventId: event.detail.eventId,
    eventName: event.detail.eventName,
    eventDescription: event.detail.eventDescription,
    eventCategory: event.detail.category,
    eventLocation: event.detail.location,
    startTime: event.start,
    endTime: event.end,
    eventUser: event.detail.relatedUsers.user,
    isAllDay: event.detail.isAllDay,
    sendMessage: false
  }
  data.eventMessage = ''
  await handleRemove(event.calendarId, data)
  nextTick(() => {
    calendarRef.value.refresh()
  })
}

async function handleJump() {
  if (!workflowInstanceId.value || '' == workflowInstanceId.value) {
    return
  }

  showForm.value = true
  const historyList: any = await newClientApi.postDocpalWorkflowHistoryProcessWithoutVariables({
    processInstanceId: workflowInstanceId.value,
    completed: false
  }).then((res) => res?.data?.entryList)

  const processVariables = historyList[historyList.length - 1].processVariables
  if (!processVariables) {
    routerProvider?.message.error('processVariables not exist')
    return
  }

  const startDate = processVariables.startTime
  const eventId = processVariables.eventId
  calendarRef.value.setSpecificSate(startDate)

  setTimeout(() => {
    // TODO：可能會出現 EventList 獲取不到的情況
    const eventData = calendarRef.value.getEventList().find((item: any) => item.detail.eventId === eventId)
    if (!eventData) {
      routerProvider?.message.error('Event does not exist')
      return
    }

    if ('R' == eventData.detail.status) {
      routerProvider?.message.error('Event canceled')
      return
    }
    handleShowDetail(eventData)
  }, 1000)
}

function handleShowDetail(eventData: any) {
  workflowInstanceId.value = ''

  if ('R' === eventData.detail.status || 'D' === eventData.detail.status) {
    showDetail.value = false
    return
  }
  state.categoryId = eventData.calendarId

  event.value = {
    eventId: eventData.detail.eventId,
    eventName: eventData.title,
    eventCategory: eventData.calendarId,
    eventLocation: eventData.detail.location,
    eventDescription: eventData.detail.eventDescription,
    isAllDay: eventData.detail.isAllDay,
    startTime: eventData.start,
    endTime: eventData.end,
    eventUser: eventData.detail.relatedUsers.eventUser,
    creator: eventData.detail.createdBy
  }

  try {
    // Check permissions
    checkPermission(eventData.detail.category)
    // if (!viewPermission) {
    //   routerProvider?.message.error('No permission to view')
    //   return
    // }
  } catch (e) {
    console.log(e)
    showDetail.value = false
    routerProvider?.message.error(t('tip_deleteSuccessMessage', { name: 'Calendar setting' }))
    return
  }

  const location = locationsOption.value.find((item: any) => item.id === eventData.detail.location)
  event.value.locationName = location ? location.name : ''

}

function checkPermission(categoryId: string) {
  const categories = categoriesOption.value.find((item: any) => item.id === categoryId)
  if (!categories) {
    throw new Error('Operation without permission')
  }
  event.value.categoriesName = categories.name || ''
  const userId = useUserId()
  const categoriesPermission = categories.permission

  const userPermissions: any = Object.keys(categoriesPermission).reduce((acc, action) => {
    if (categoriesPermission[action].USERS.includes(userId.value)) {
      acc.push(action)
    }
    return acc
  }, [])

  userPermissions.forEach((item: string) => {
    switch (item) {
      case 'view':
        showDetail.value = true
        break
      case 'cancel':

        break
      case'create':

        break
      case 'export':

        break
      case 'remove':

        break
      case 'update':
        isUpdate.value = true
        showUpdateDetail()
        break
      default:
        isUpdate.value = false
    }
  })
}

function showUpdateDetail() {
  state.loading = true

  const startTime = event.value.startTime.split(' ')
  const endTime = event.value.endTime.split(' ')

  const data: EventFormData = {
    eventId: event.value.eventId,
    eventName: event.value.eventName,
    eventCategory: event.value.calendarId,
    eventLocation: event.value.location,
    eventDescription: event.value.eventDescription,
    isAllDay: event.value.isAllDay,
    startTime: startTime[0],
    endTime: endTime[0],
    eventUser: event.value.eventUser,
    creator: event.value.createdBy
  }

  if (!event.value.isAllDay) {
    const time = []
    time.push(`${startTime[1]}:00`)
    time.push(`${endTime[1]}:00`)
    data.eventTime = time
  }

  nextTick(async () => {
    await eventDialogFormRef.value.initForm(updateEventWorkflow, true, data)
  })
}

function handleReady() {
  state.loading = false
}

// Disable page operations
function handleImplement(isLoading: boolean) {
  state.loading = isLoading
}

function handleSuccess() {
  calendarRef.value.refresh()
  state.loading = false
  showDetail.value = false
}

onMounted(async () => {
  showDetail.value = false
  showForm.value = false
  isReject.value = false
  isAccept.value = false
  isUpdate.value = false
})
</script>

<template>
  <el-row :gutter="20">
    <el-col :span="16">
      <div class="scrollable">
        <Calendar ref="calendarRef" :options="options" @openDetail="handleShowDetail" @ready="handleJump"
                  @cancelEvent="handelCancelEvent" @deleteEvent="handelDeleteEvent" />
      </div>
    </el-col>

    <el-col :span="8">
      <div v-if="showDetail" class="detail-container">
        <h2 style="color: #9e9e9e">{{ $t('Event Detail') }}</h2>
        <el-space direction="vertical" alignment="stretch" class="left-aligned">
          <el-text line-clamp="2" style="height: 30px ">{{ $t('Information') }}</el-text>
        </el-space>
        <div v-if="!isUpdate">
          <el-space direction="vertical" alignment="stretch" class="left-aligned">
            <el-text tag="b">{{ $t('Name') }}: {{ event.eventName }}</el-text>
            <el-text tag="b">{{ $t('Description') }}: {{ event.eventDescription }}</el-text>
            <el-text tag="b">{{ $t('Location') }}: {{ event.locationName }}</el-text>
            <el-text tag="b">{{ $t('Category') }}: {{ event.categoriesName }}</el-text>
            <el-text tag="b">{{ $t('StartTime') }}: {{ event.startTime }}</el-text>
            <el-text tag="b">{{ $t('EndTime') }}: {{ event.endTime }}</el-text>
          </el-space>
        </div>

        <div :class="{ 'update-form-container':showForm }" v-loading="state.loading">
          <CalendarDialogForm ref="eventDialogFormRef" :categoryId="state.categoryId" :showForm="showForm"
                              @ready="handleReady" @implement="handleImplement" @success="handleSuccess" />
        </div>

        <div class="response-section" v-loading="state.loading">
          <el-divider />

          <div class="response-buttons">
            <el-text>{{ $t('Response') }}</el-text>
            <div style="text-align: right;">
              <!--          <el-button v-show="isReject" type="warning" size="large" @click="handleRejectEvent">-->
              <el-button type="warning" size="large" @click="handleRejectEvent">
                {{ $t('Reject') }}
              </el-button>
              <!--          <el-button v-show="isAccept" type="primary" size="large" @click="handleAcceptEvent">-->
              <el-button type="primary" size="large" @click="handleAcceptEvent">
                {{ $t('Accept') }}
              </el-button>
              <!--          <el-button v-if="isUpdate && isUpdate" type="primary" size="large" @click="handleUpdateEvent">-->
              <el-button v-if="isUpdate" type="primary" size="large" @click="handleUpdateEvent">
                {{ $t('Update') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<style scoped lang="scss">
.scrollable {
  max-height: 88vh;
  overflow-y: auto;
}

.left-aligned {
  text-align: left;
}

.detail-container {
  display: flex;
  flex-direction: column;
  height: 88vh;
  position: relative;
}

.update-form-container {
  max-height: calc(88vh - 200px - 60px);
  overflow-y: auto;
  padding: 10px;
}

.response-section {
  position: sticky;
  bottom: 0;
  flex-shrink: 0;
  padding: 10px 0;
  z-index: 10;
}

.response-buttons {
  position: relative;
  padding: 10px 0;
}
</style>
