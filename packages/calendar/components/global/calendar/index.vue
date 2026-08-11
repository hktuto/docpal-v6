<script lang="ts" setup>
import { newClientApi } from 'api'
import { fetchUsersSelectSorted } from '@packages/base/composables/usePermissionOption'
import type { CalendarEventExternal } from '@schedule-x/calendar'

const { t } = useI18n()
const { setting: calendarSetting, categoriesOption, locationsOption } = useCalendarStore()
import {
  type CalendarOptions,
  type DocPalEventType,
  convertSiteEventToCalendarEvent
} from '../../../utils/calendarHelper'
import CalendarViewer from './viewer.vue'
import CalendarDetailDialog from './detailDialog.vue'

const viewerRef = ref<InstanceType<typeof CalendarViewer>>()
const detailDialogRef = ref<InstanceType<typeof CalendarDetailDialog>>()
const props = defineProps<{
  options: CalendarOptions
  addtionalCheckBeforeEventUpdate: (oldEvent: any, editedEvent: any) => boolean
}>()

const displayOption = ref<CalendarOptions>({
  ...props.options
})

const emits = defineEmits(['createEvent', 'filterChange', 'openDetail', 'editEvent', 'onEventUpdate', 'updateEvent', 'ready'])

function addEvent(newEvent: CalendarEventExternal) {
  viewerRef.value?.addEvent(newEvent)
}

function getEvent(id: string) {
  return viewerRef.value?.getEvent(id)
}

function updateEvent(newEvent: CalendarEventExternal) {
  viewerRef.value?.updateEvent(newEvent)
}

// #region filter logic
const filter = ref({
  category: '',
  user: '',
  location: '',
  workflow: ''
})
const userFiterOptions = ref<any>([])

async function getFilterOptions() {
  try {
    let user: any = []
    if (props.options.userFilter) {
      const res = await newClientApi.getPermissionUserGroupGroupidUsers(props.options.userFilter).then((res) => res.data)
      user = res.users
    } else {
      user = await fetchUsersSelectSorted()
      if (!user.length) throw new Error('no user')
    }

    userFiterOptions.value = user
      .map((item) => {
        return {
          label: item.label || item.username,
          value: item.value || item.userId
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
    userFiterOptions.value.unshift({
      label: 'Current User',
      value: 'currentUser'
    })
  } catch (err) {
    console.log('no user', err)
  }
}

async function setDefaultFilter() {
  if (props.options.showCategoryFilter || props.options.showLocationFilter || props.options.showUserFilter) {
    await getFilterOptions()
  }
  if (props.options.defaultUser) {
    filter.value.user = props.options.defaultUser
  }
  if (props.options.defaultLocation) {
    filter.value.location = props.options.defaultLocation
  }
  if (props.options.defaultCategory) {
    filter.value.category = props.options.defaultCategory
  }
  if (!props.options.view) {
    displayOption.value.view = calendarSetting.value?.basic.default_view
  }
  if (!props.options.firstDayOfWeek) {
    displayOption.value.firstDayOfWeek = calendarSetting.value?.basic.default_first_week
  }
}

// #endregion

function openDetail(event: CalendarEventExternal) {
  detailDialogRef.value?.open(event)
}

// calendar Event
const calendarEvents = {
  onEventClick: (args: any) => {
    console.log('onEventClick', props.options, args)
    // edit event
    if (props.options.editable) {
      // Cancelled event cannot be edited
      if ('R' === args.detail.status || 'D' === args.detail.status) {
        return
      }
      emits('editEvent', args)
    } else {
      // 不可編輯狀態，該點擊應該讓user選擇是否操作頁面
      // detailDialogRef.value?.open(args)
      emits('openDetail', args)
    }
  },
  onClickDate: (args: string) => {
    console.log('onClickDate', args)
  },
  onClickDateTime: (args: string) => {
    // Create an event in a blank space
    console.log('onClickDateTime')
    if (!props.options.allowCreate) return
    // if editItem is exist, update it
    emits('createEvent', args)
  },
  onClickAgendaDate: (args) => {
    console.log('onClickAgendaDate', args)
  },
  onClickPlusEvents: (args) => {
    console.log('onClickPlusEvents', args)
  },
  onEventUpdate: (args: any) => {
    console.log('onEventUpdate', args)
    const newData = convertCalendarEventToSiteEvent(args)
    emits('updateEvent', newData)
    // convert scheduls-x event to calendar event
    // emits('updateEvent', args)
  },
  cancelEvent: (args: any) => {
    console.log('calendar/index-cancelEvent', args)
    emits('cancelEvent', args)
  },
  deleteEvent: (args: any) => {
    console.log('calendar/index-deleteEvent', args)
    emits('deleteEvent', args)
  },
  ready: () => {
    emits('ready')
  }
}

function filterChange() {
  emits('filterChange', filter.value)
  viewerRef.value?.getList()
}

const filtetColumnWidth = computed(() => {
  let item = 0
  if (props.options.showCategoryFilter) {
    item++
  }
  if (props.options.showUserFilter) {
    item++
  }
  if (props.options.showLocationFilter) {
    item++
  }
  return 24 / item
})

const showCalendar = ref(true)

function refresh() {
  viewerRef.value.getList()
}

function setSpecificSate(date: string) {
  viewerRef.value.setSpecificSate(date)
}

function getEventList() {
  return viewerRef.value?.eventList || []
}

onMounted(async () => {
  await setDefaultFilter()
})

// TODO： Unable to obtain event list in real time
const eventList = computed(() => viewerRef.value?.eventList || [])

defineExpose({
  addEvent,
  getEvent,
  updateEvent,
  filter,
  openDetail,
  eventList,
  refresh,
  setSpecificSate,
  getEventList
})
</script>

<template>
  <div class="calendarWidgetViewerContainer">
    <div class="filterContainer">
      <ElForm label-position="top">
        <ElRow :gutter="20">
          <ElCol v-if="options.showLocationFilter" :span="filtetColumnWidth">
            <ElFormItem :label="options.locationLabel || t('Location')">
              <ElSelect v-model="filter.location" clearable placeholder="Select" filterable @change="filterChange">
                <ElOption v-for="item in locationsOption" :key="item.id" :label="item.name" :value="item.id" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol v-if="options.showUserFilter" :span="filtetColumnWidth">
            <ElFormItem :label="options.userLabel || t('User')">
              <ElSelect v-model="filter.user" clearable placeholder="Select" filterable @change="filterChange">
                <ElOption v-for="item in userFiterOptions" :key="item.value" :label="item.label" :value="item.value" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol v-if="options.showCategoryFilter" :span="filtetColumnWidth">
            <ElFormItem :label="options.categoryLabel || t('Category')">
              <ElSelect v-model="filter.category" clearable placeholder="Select" filterable @change="filterChange">
                <ElOption v-for="item in categoriesOption" :key="item.id" :label="item.name" :value="item.id" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
    </div>
    <CalendarViewer ref="viewerRef" :options="options" :filter="filter" v-on="calendarEvents" />
    <CalendarDetailDialog ref="detailDialogRef" width="80%" :options="options"
                          :addtionalCheckBeforeEventUpdate="addtionalCheckBeforeEventUpdate" />
  </div>
</template>

<style lang="scss" scoped>
.calendarWidgetViewerContainer {
  height: 100%;
  min-height: 500px;
  position: relative;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-flow: column nowrap;
}
</style>
