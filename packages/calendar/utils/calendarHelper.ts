import type { CalendarEventExternal } from '@schedule-x/calendar'
import { newClientApi } from 'api'
import type { CalendarTaskRespDTO } from 'api/src/generate/client'
import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useCalenarLocation } from '../composables/useCalendar'
import { ElMessage } from 'element-plus'
import isBetween from 'dayjs/plugin/isBetween'

dayjs.extend(utc)
dayjs.extend(isBetween)
export const viewName = [
  'day', 'week', 'month-grid', 'month-agenda'
]

export type DocPalEventType = CalendarTaskRespDTO & {
  user: string;
};

export type CalendarOptions = {
  allowCreate: boolean,
  standalone?: boolean;
  editable: boolean,
  showWorkflowFilter: boolean,
  showLocationFilter: boolean,
  showUserFilter: boolean,
  createUserFilter?: string,
  showCategoryFilter: boolean,
  defaultCategory: string,
  defaultLocation: string,
  defaultUser: string,
  locationLabel?: string,
  categoryLabel?: string,
  userLabel?: string,
  userFilter?: string,
  userFilterGroup?: string,
  officeStartTime?: string, // office start time default to 08:00
  officeEndTime?: string, // office end time default to 20:00
  view?: 'day' | 'week' | 'month-grid' | 'month-agenda';
  firstDayOfWeek?: 'MONDAY' | 'SUNDAY',
  addtionalCheckBeforeEventUpdate?: (oldEvent: CalendarEventExternal, editedEvent: CalendarEventExternal) => boolean;
};

export function convertSiteEventToCalendarEvent(event: DocPalEventType): CalendarEventExternal {
  const calendarLocation = useCalenarLocation()
  const format = event.isAllDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm'
  const locationName = event.location ? calendarLocation.value.find(item => item.id === event.location)?.name : undefined

  const newEvent = {
    id: event.id || new Date().valueOf().toString(),
    start: dayjs.utc(event.startTime).format(format),
    end: dayjs.utc(event.endTime).format(format),
    title: event.eventName,
    description: event.title,
    location: locationName,
    people: event.relatedUsers ? [event.relatedUsers.user] : [],
    detail: { ...event },
    calendarId: event.status === 'A' ? (event.category || undefined) : undefined,
    _options: {
      disableResize: true,
      disableDND: true
    }
  }
  return newEvent
}

export function convertCalendarEventToSiteEvent(event: CalendarEventExternal): DocPalEventType {
  return {
    eventId: event.detail.eventId,
    startTime: dayjs(event.start).toISOString(),
    endTime: dayjs(event.end).toISOString(),
    user: event.people ? event.people[0] : undefined,
    category: event.calendarId,
    location: event.location
  }
}

export async function getEventFromApi(calendarApp: any, calendarControls: any, filter: any) {
  const range = calendarControls.getRange()
  // When using dayjs to convert time, there will be deviations in the query data due to time zone problems. Use the "utc" method to change the time zone before using
  const params: any = {
    startTime: dayjs.utc(range.start).toISOString(),
    endTime: dayjs.utc(range.end).toISOString()
  }
  const defaultCalendarId = Object.keys(calendarControls.getCalendars())[0]
  const user = localStorage.getItem('docpal-user')
  const userId = user ? JSON.parse(user).userId : undefined
  // TODO : backend is missing filter
  const data = await newClientApi.postDmsCalendarsList(params).then(res => res.data)
  const calendarLocation = useCalenarLocation()

  const events = data.filter((event: any) => {
    // Exclude data with deleted status
    if (event.status === 'D') return false
    if (filter.category) {
      const matCat = event.category === filter.category
      if (!matCat) return false
    }
    if (filter.location) {
      const matLoc = event.location === filter.location
      if (!matLoc) return false
    }
    if (filter.user) {
      const userFilter = filter.user === 'currentUser' ? userId : filter.user
      const mapUser = event.assignee === userFilter || event.modifiedBy === userFilter
      const userInRelated = event.relatedUsers ? event.relatedUsers.user === userFilter : false
      if (!mapUser && !userInRelated) return false
    }
    return true
  }).map((ev) => convertSiteEventToCalendarEvent(ev))
  // filter events

  // dummy full date event

  calendarApp.eventsService.set(events)
  return events
}

export function isEventValid(allEvents: any[], event: any) {
  const startDay = dayjs(event.start)
  const endDay = dayjs(event.end)
  if (startDay.isBefore(dayjs())) {
    ElMessage.error('Start time cannot be earlier than today')
    return false
  }
  const people = event.people as string[] || []

  const otherEvs = allEvents.filter((ev: any) => {
    const evStart = dayjs(ev.start)
    const evEnd = dayjs(ev.end)
    const isOverlap = startDay.isBetween(evStart, evEnd, 'day', '[]') || endDay.isBetween(evStart, evEnd, 'day', '[]')
    if (isOverlap) {

      console.log('isOverlap', event, ev)
    }
    return isOverlap && ev.id !== event.id && ev.people.find((item: any) => people.includes(item))
  })

  // check if user has all day event in that day
  const hasAllDayEvent = otherEvs.find((e) => e.start.length === 10 && e.end.length === 10)
  if (hasAllDayEvent) {
    ElMessage.error(`${people} has all day event in that day`)
    return false
  }
  // check if user has other location event in that day
  const hasLocationEvent = otherEvs.find((e) => e.location && e.location !== event.location)

  if (hasLocationEvent) {
    ElMessage.error(`${people} has other location event in that day`)
    return false
  }
  return true
}

export function snapDownTo15Minutes(time: Dayjs) {
  const minutes = time.minute()
  const snappedMinutes = Math.floor(minutes / 15) * 15
  return time.minute(snappedMinutes).second(0)
}

export function displayTimeFn(event: any, dateMode = false) {
  // check if event is in all day
  const stateDate = dayjs(event.start).format('YYYY-MM-DD')
  const endDate = dayjs(event.end).format('YYYY-MM-DD')

  if (stateDate === endDate) {
    if (dateMode) {
      return dayjs(event.start).format('HH:mm') + ' - ' + dayjs(event.end).format('HH:mm')
    }
    return stateDate + ' ' + dayjs(event.start).format('HH:mm') + ' - ' + dayjs(event.end).format('HH:mm')
  } else {
    return dayjs(event.start).format('YYYY-MM-DD HH:mm') + ' - ' + dayjs(event.end).format('YYYY-MM-DD HH:mm')
  }
}

export const routeCalendarManagement = function(processInstanceId?: string, activeTab: 'calendar' | 'table') {
  return {
    id: 'calendar-management-' + new Date().getTime(),
    name: 'calendar-management',
    icon: '',
    label: 'Calendar Management',
    component: 'LazyCalendarManagement',
    props: {
      processInstanceId,
      activeTab
    }
  } as TabItem
}


/**
 * example workflow setting
 * {
 "type": "calendar",
 "data": {
 "allowCreate": true,
 "showLocationFilter": true,
 "showUserFilter": true,
 "fieldMapping": {
 "startTime":"starttime",
 "endtime":"endtime",
 "category":"category",
 "location":"location",
 "caseId": "caseId",
 "taskId":"taskId"
 }
 }
 }
 *
 *
 */
