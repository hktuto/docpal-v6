<script lang="ts" setup>
import dayjs from 'dayjs'
import { ElMessage, ElTimeSelect } from 'element-plus'
import { snapDownTo15Minutes } from '../../utils/calendarHelper'
import { newClientApi } from 'api'
import { fetchUsersSelectSorted } from '@packages/base/composables/usePermissionOption'
const routerProvider = inject(MenuRouterKey)
const opened = ref(false)
const newEventId = defineModel<string>('newEventId')
const { options, checkValid } = defineProps<{
  options: CalendarOptions,
  checkValid?: Function
}>()
const { t } = useI18n()
const formRef = ref()
const { categoriesOption, locationsOption, timeSelecteStep, timeSelectLimit } = useCalendarStore()
const userFiterOptions = ref<any>([])
const emits = defineEmits(['submit'])
const startTime = ref<any>()

const activeLocations = computed(() => {
  return locationsOption.value.filter(i => !!i.status).sort((a, b) => a.name.localeCompare(b.name))
})

const form = ref<any>({
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  eventName: '',
  description: '',
  category: '',
  user: '',
  location: '',
  edited: false,
  isAllDay: false,
  detail: {}
})
const userId = useUserId()

async function getFilterOptions() {
  let user: any[] = []
  console.log('getFilterOptions', options.createUserFilter)
  if (options.createUserFilter) {
    const res = await newClientApi.getPermissionUserGroupGroupidUsers(options.createUserFilter).then(res => res.data)
    user = res.users.filter(item => item.status).sort((a, b) => a.username.localeCompare(b.username))
    console.log('user', user)
  } else {
    user = await fetchUsersSelectSorted()
  }
  userFiterOptions.value = user.map(item => {
    return {
      label: item.label || item.username,
      value: item.value || item.userId
    }
  })
}

async function open(event) {
  await getFilterOptions()
  console.log('open event', event)
  opened.value = true
  form.value.detail = event.detail || {}
  form.value.startDate = event.startDate,
    form.value.startTime = event.startTime,
    form.value.endDate = event.endDate,
    form.value.endTime = event.endTime
  form.value.location = event.location
  form.value.category = event.category || options.defaultCategory
  form.value.user = event.user === 'currentUser' ? userId.value : event.user
  // form.value.workflow = filter.workflow
  if (event.id) {
    newEventId.value = event.id
  }

}

function startTimeChange() {
  const startDay = dayjs(form.value.startDate + ' ' + form.value.startTime)
  if (startDay.isBefore(dayjs())) {
    ElMessage.error('Start time cannot be earlier than today')
  }
  form.value.endDate = startDay.format('YYYY-MM-DD')
  form.value.endTime = snapDownTo15Minutes(startDay.add(15, 'minutes')).format('HH:mm')
}

function endTimeChange() {
  const endTime = dayjs(form.value.endDate + ' ' + form.value.endTime)
  const startTime = dayjs(form.value.startDate + ' ' + form.value.startTime)
  if (endTime.isBefore(dayjs())) {
    ElMessage.error('End time cannot be earlier than today')
  }
  if (startTime.isAfter(endTime)) {
    ElMessage.error('Start time cannot be later than end time')
  }

  // form.value.startDate = endTime.format('YYYY-MM-DD')
  // form.value.startTime = snapDownTo15Minutes(endTime.subtract(15, 'minutes')).format('HH:mm')
  // form.value.endTime = snapDownTo15Minutes(endTime).toISOString()
  // form.value.startTime = snapDownTo15Minutes(endTime.subtract(15, 'minutes')).toISOString()
}

const rules = reactive({
  startTime: [{
    required: true,
    message: t('msg_pleaseSelectStartTime'),
    trigger: 'blur'
  }],
  endTime: [{
    required: true,
    message: t('msg_pleaseSelectEndTime'),
    trigger: 'blur'
  }],
  location: [{
    required: true,
    message: t('msg_pleaseSelectLocation'),
    trigger: 'blur'
  }],
  user: [{
    required: true,
    message: t('msg_pleaseSelectUser'),
    trigger: 'blur'
  }]
})

async function submit() {

  // check location and user
  try {
    try {
      await formRef.value.validate()
    } catch (e) {
      console.error(e)
      return
    }
    // const okToSubmit = checkValid(form.value)

    const data = {
      id: newEventId.value,
      eventId: form.value?.detail?.eventId,
      startTime: dayjs(form.value.startDate + ' ' + form.value.startTime).toISOString(),
      endTime: dayjs(form.value.endDate + ' ' + form.value.endTime).toISOString(),
      eventName: form.value.user,
      title: form.value.user,
      category: form.value.category || options.defaultCategory,
      location: form.value.location,
      isAllDay: form.value.isAllDay,
      user: form.value.user
    }
    if (checkValid) {
      const valid = await checkValid(data)
      console.log(valid)
    }
    emits('submit', data)
    opened.value = false
  } catch (err) {
    console.log(err)
  }
}

defineExpose({
  open
})
</script>

<template>
  <ElDialog v-model="opened" append-to-body>
    <ElForm ref="formRef" label-position="top" :model="form" :rules="rules">
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem :label="options.locationLabel || 'Location'" prop="location" required>
            <ElSelect v-model="form.location" clearable placeholder="Select" filterable>
              <ElOption v-for="item in activeLocations" :key="item.id" :label="item.name" :value="item.id" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem :label="options.userLabel || 'User'" prop="user" required>
            <ElSelect v-model="form.user" clearable placeholder="Select" filterable>
              <ElOption v-for="item in userFiterOptions" :key="item.value" :label="item.label" :value="item.value" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span='6'>
          <ElFormItem label="Start Date" prop="startTime" required>
            <ElDatePicker v-model="form.startDate" type="date" placeholder="Select date and time" format="YYYY-MM-DD"
                          value-format="YYYY-MM-DD" @change="startTimeChange" />
          </ElFormItem>
        </ElCol>
        <ElCol :span='6'>
          <ElFormItem label="Start Time" prop="startTime" required>
            <ElTimeSelect
              v-model="form.startTime"
              placeholder="Select time"
              :start="timeSelectLimit.start"
              :step="timeSelecteStep"
              :end="timeSelectLimit.end"
              format="HH:mm" @change="startTimeChange" />
          </ElFormItem>
        </ElCol>
        <ElCol :span='6'>
          <ElFormItem label="End Date" prop="endTime" required>
            <ElDatePicker v-model="form.endDate" type="date" placeholder="Select date and time" format="YYYY-MM-DD"
                          value-format="YYYY-MM-DD" @change="endTimeChange" />
          </ElFormItem>
        </ElCol>
        <ElCol :span='6'>
          <ElFormItem label="End Time" prop="endTime" required>
            <ElTimeSelect
              v-model="form.endTime"
              placeholder="Select time"
              :start="timeSelectLimit.start"
              :step="timeSelecteStep"
              :end="timeSelectLimit.end"
              format="HH:mm" @change="endTimeChange" />
          </ElFormItem>
        </ElCol>
        <!-- <ElCol :span="12">
            <ElFormItem label="Category">
                <ElSelect v-model="form.category" clearable placeholder="Select" @change="getCurrentRangeEvent">
                    <ElOption v-for="item in categoriesOption" :key="item.id" :label="item.name" :value="item.id" />
                </ElSelect>
            </ElFormItem>
            </ElCol> -->
      </ElRow>
    </ElForm>
    <ElButton @click="submit">Confirm</ElButton>
  </ElDialog>

</template>
