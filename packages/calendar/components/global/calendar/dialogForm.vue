<script setup lang="ts">
import { type EventFormData } from '#imports'
import type { EventNotifyMessage } from '../../../composables/useCalendar'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
const formRendererRef = ref()
const loading = ref(false)
const showSelectUserDialog = ref(false)

const eventNotifyDialogRef = ref()
const eventNotifyType = ref<'create' | 'update' | 'reject' | 'accept'>('create')
// TODO: i18n Not replenished
const sendMessageText = ref<'Send Message to Participants' | 'Send Message to Creator'>('Send Message to Participants')

const props = defineProps<{
  categoryId: string,
  showForm: boolean
}>()

const { initWorkflowForm, runWorkflow, handleReject } = useCalendarStore()
const emits = defineEmits(['ready', 'implement', 'success'])

const eventData = ref<EventFormData>()
const state = reactive({
  loading: false,
  formJson: '',
  tableData: [],
  userList: [],
  isEdit: false,
  processKey: ''
})
const userList = ref([])

const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'newEventDialogParticipantsTable',
  columns: [
    {
      field: 'name',
      title: 'Username',
      fixed: 'left'
    },
    {
      field: 'email',
      title: 'Email'
    }
  ],
  bodyActions: [
    [
      {
        code: 'delete',
        name: 'Remove',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleRemoveUser(row.id)
        }
      }
    ]
  ],
  virtualScroll: true,
  refresh: false,
  zoom: false,
  saveColumnOrder: false
})

function openSelectUser() {
  state.userList = []
  showSelectUserDialog.value = true
}

function handleUserListConfirm() {
  const filter = userList.value.filter((item: any) => state.userList.includes(item.value))
  filter.forEach((item: any) => {
    if (!state.tableData.some((tData: any) => tData.id === item.id)) {
      state.tableData.push(item)
    }
  })
  showSelectUserDialog.value = false
}

function handleRemoveUser(userId: string) {
  state.tableData = state.tableData.filter((item: any) => item.id !== userId)
  state.userList = state.userList.filter((item: any) => item !== userId)
}

watch(() => state.tableData, () => {
  tableConfig.data = state.tableData
  reload()
})

onMounted(() => {
  getUserList()
})

// Common function

/**
 * create and update event
 * @param name  createEventWorkflow | updateEventWorkflow | cancelEventWorkflow | deleteEventWorkflow
 * @param isEdit
 * @param event
 */
async function initForm(name: string, isEdit: boolean, event: EventFormData) {
  if (!props.categoryId) {
    routerProvider?.message.error('Category Id is empty.')
    return
  }

  loading.value = true
  try {
    const workflowData: any = await initWorkflowForm(name, props.categoryId)
    state.processKey = workflowData.processKey

    event.eventCategory = props.categoryId

    if ('location' in workflowData && '' != workflowData.location) {
      event.eventLocation = workflowData.location
    }
    await setForm(workflowData.formJson, isEdit, event)
    emits('ready')
  } catch (e) {
    throw e
  } finally {
    loading.value = false
  }
}

async function setForm(json: string, isEdit: boolean, event: any) {
  if (!json || JSON.stringify(json) === '{}') {
    routerProvider?.message.error(t('No form was obtained'))
    return
  }
  state.tableData = []
  nextTick(async () => {
    formRendererRef.value.setFormJson(json)
    setFormData(isEdit, event)
  })
}

function setFormData(isEdit: boolean, data: EventFormData) {
  state.isEdit = isEdit
  if (isEdit) {
    state.userList = data.eventUser.split(',')
    state.tableData = userList.value.filter((item: any) => state.userList.includes(item.value))
  }
  nextTick(() => {
    formRendererRef.value.setFormData(data)
  })
}

async function getFormData() {
  try {
    let formData = await formRendererRef.value.getFormData().then((res: any) => res)
      .catch((error: any) => {
        console.log(error)
        return
      })
    if (!formData) return
    if (state.tableData.length === 0) {
      routerProvider?.message.error(t('Please add a user'))
      return
    }

    const data: EventFormData = {
      eventName: formData.eventName,
      eventDescription: formData.eventDescription,
      eventCategory: formData.eventCategory,
      eventLocation: formData.eventLocation,
      startTime: formData.startTime + ' 00:00',
      endTime: formData.endTime + ' 23:59',
      isAllDay: formData.isAllDay,
      eventUser: state.tableData.map((item: any) => item.id).join(','),
      sendMessage: false
    }

    if (!formData.isAllDay) {
      data.startTime = formData.startTime + ' ' + formData.eventTime[0]
      data.endTime = formData.endTime + ' ' + formData.eventTime[1]
    }

    // Update operation requires id
    if (state.isEdit) {
      data.eventId = formData.eventId
    }
    return data
  } catch (error) {
    throw error
  }
}

async function getUserList() {
  userList.value = await getUserSelectOption()
}

function confirm(type: 'create' | 'update' | 'reject' | 'accept', event: EventFormData) {
  if ('create' === type) {
    handleNotifyDialogSubmit()
    return
  }

  if ('update' === type) {
    sendMessageText.value = 'Send Message to Participants'
  } else if ('reject' === type || 'accept' === type) {
    state.isEdit = true
    eventData.value = event
    sendMessageText.value = 'Send Message to Creator'
  }

  eventNotifyType.value = type
  eventNotifyDialogRef.value.openDialog()
}

/**
 * create and update
 */
async function handleNotifyDialogSubmit(notifyData?: { message: string, sendMessage: boolean }) {
  emits('implement', true)
  if (!state.processKey) {
    throw new Error('processKey is empty')
  }

  try {
    const event: EventFormData = await getFormData()
    event.recipient = event.eventUser
    if (!state.isEdit) {
      await handleCreateEvent(event)
    } else {
      const msg: EventNotifyMessage = {
        title: event.eventName,
        data: notifyData.message
      }
      event.eventMessage = JSON.stringify(msg)
      event.sendMessage = notifyData.sendMessage
      await handelUpdateEvent(event)
    }
    emits('success')
  } catch (error) {
    throw error
  } finally {
    emits('implement', false)
  }
}

async function handleCreateEvent(event: EventFormData) {
  // Send message by default
  const msg = {
    title: `Calendar Event - ${event.eventName}`,
    data: ''
  }
  event.eventMessage = JSON.stringify(msg)
  event.sendMessage = true

  await runWorkflow(state.processKey, event)
}

async function handelUpdateEvent(event: EventFormData) {
  await runWorkflow(state.processKey, event)
}

async function handleRejectOrAcceptEvent(notifyData: { message: string, sendMessage: boolean }) {
  try {
    const userId = useUserId()
    const type: string = eventNotifyType.value === 'reject' ? 'declined' : `accepts`

    const msg: EventNotifyMessage = {
      title: `${eventData.value.eventName} - User ${userId.value} ${type} this event`,
      data: notifyData.message
    }
    eventData.value.eventMessage = JSON.stringify(msg)
    await handleReject(eventData.value.eventCategory, eventData.value)
    nextTick(() => {
      emits('success')
    })
  } catch (error) {
    throw error
  } finally {
    emits('implement', false)
  }
}

defineExpose({ initForm, confirm })
</script>

<template>
  <div v-loading="loading" v-show="showForm">
    <FormRenderer ref="formRendererRef" :form-json="state.formJson">
      <template v-slot:eventUser>
        <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent" style="height: 300px">
          <template #toolbar_buttons>
            <div class="actions">
              <p>Participants</p>
              <el-button id="Home__Dashboard__Calendar__NewEvent__AddParticipants" @click="openSelectUser"
                         class="button-container" type="primary">
                {{ $t('Add Participants') }}
              </el-button>
            </div>
            <slot name="toolbar_buttons" />
          </template>
        </VxeGrid>

        <el-dialog v-model="showSelectUserDialog" :title="t('Select User')" append-to-body align-center
                   style="width: 400px">
          <el-form-item :label="t('User')" label-position="top">
            <el-select v-model="state.userList" multiple filterable clearable>
              <el-option v-for="user in userList" :key="user.id" :label="user.name" :value="user.id" />
            </el-select>
          </el-form-item>
          <template #footer>
            <el-button id="Home__Dashboard__Calendar__NewEvent__AddParticipants__Cancel"
                       @click="showSelectUserDialog = false">
              {{ $t('vxe.button.cancel') }}
            </el-button>
            <el-button id="Home__Dashboard__Calendar__NewEvent__AddParticipants__Confirm" type="primary"
                       @click="handleUserListConfirm">
              {{ $t('dpButtom_confirm') }}
            </el-button>
          </template>
        </el-dialog>
      </template>
    </FormRenderer>
  </div>

  <CalendarEventNotifyDialog ref="eventNotifyDialogRef" :notifyType="eventNotifyType" :sendMessageText="sendMessageText"
                             @submit="handleNotifyDialogSubmit" @rejectOrAccept="handleRejectOrAcceptEvent" />
</template>

<style scoped lang="scss">
.actions {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
}

.button-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>
