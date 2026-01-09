import { adminApi, clientApi } from 'api'
import { onMounted } from 'vue'
import { viewName } from '../utils/calendarHelper'

type CalendarVieweCalendar = {
  colorName: string,
  lightColors: {
    main: string,
    container: string,
    onContainer: string,
  },
  darkColors: {
    main: string,
    onContainer: string,
    container: string,
  },
}
type CalendarVieweCalendarSetting = {
  [key: string]: CalendarVieweCalendar
}

export const useCalendarSetting = () => useState<any>('calendarSetting')
export const useCategoriesColumn = () => useState<any[]>('categoriesColumn')
export const useCalenarCategories = () => useState<any[]>('calendarCategories', () => ([]))
export const useCalenarLocation = () => useState<any[]>('calendarLocations', () => ([]))
export const useCalendarViewerCategories = () => useState<CalendarVieweCalendarSetting>('calendarViewerCategories')

// Workflow Form Field
export type EventFormData = {
  eventId?: string;
  eventName: string;
  eventDescription: string;
  eventCategory: string;
  eventLocation: string;
  startTime: string;
  endTime: string;
  eventUser: string;
  isAllDay: boolean;
  eventTime?: string[],
  sendMessage?: boolean;
  recipient?: string;
  eventMessage?: string;
  creator?: string;
}

export type EventNotifyMessage = {
  title: string,
  data: string
}

export const createEventWorkflow = 'create calendar event'
export const updateEventWorkflow = 'update calendar event'
export const cancelEventWorkflow = 'cancel calendar event'
export const deleteEventWorkflow = 'delete calendar event'

export const useCalendarStore = () => {
  const setting = useCalendarSetting()

  const calendarViewOptions = viewName

  const weekDayOptions = [
    'MONDAY',
    'SUNDAY'
  ]

  const timeSelecteStep = computed(() => {
    return '00:' + setting.value.basic.default_slot
  })

  const timeSelectLimit = computed(() => {
    return {
      start: setting.value.basic.office_start_time || '00:00',
      end: setting.value.basic.office_end_time || '24:00'
    }
  })

  async function getCalendarMasterTable() {
    return await clientApi.api.getDmsCalendarsSettingTables().then(r => r.data)
  }

  const categoriesOption = useCalenarCategories()
  const calendarViewerCategories = useCalendarViewerCategories()

  async function getCategories() {
    const data = await clientApi.api.postDmsMasterTableRecords({
      id: setting.value.category.master_table
    }).then(res => res.data) as any

    categoriesOption.value = (data || []).filter(i => i.status).sort((a, b) => a.name.localeCompare(b.name))
  }

  const locationsOption = useCalenarLocation()

  async function getLocations() {
    const data = await clientApi.api.postDmsMasterTableRecords({
      id: setting.value.location.master_table
    }).then(res => res.data) as any
    locationsOption.value = (data || []).filter(i => i.status).sort((a, b) => a.name.localeCompare(b.name))
  }

  async function getCalendarsSetting() {
    const masterTable = await getCalendarMasterTable()
    const data = await clientApi.api.getDmsCalendarsSetting().then(r => r.data)
    const { public: { platform } } = useRuntimeConfig()

    setting.value = {
      basic: {
        default_view: !data.basic?.default_view ? 'MONTH' : calendarViewOptions.includes(data.basic.default_view) ? data.basic.default_view : 'MONTH',
        default_first_week: !data.basic?.default_first_week ? 'MONDAY' : weekDayOptions.includes(data.basic.default_first_week) ? data.basic.default_first_week : 'MONDAY',
        default_slot: !data.basic?.default_slot ? 15 : typeof data.basic.default_slot === 'number' ? data.basic.default_slot : 15,
        allow_custom_slot: !data.basic?.allow_custom_slot ? false : data.basic.allow_custom_slot !== undefined ? data.basic.allow_custom_slot : false,
        office_start_time: data.basic?.office_start_time || '08:00',
        office_end_time: data.basic?.office_end_time || '20:00'
      },
      location: {
        master_table: masterTable['Event Location'],
        allow_custom: data?.location?.allow_custom !== undefined ? data.location.allow_custom : false,
        allow_empty: data?.location?.allow_empty !== undefined ? data.location.allow_empty : false
      },
      category: {
        master_table: masterTable['Event Categories']
      }
    }
    // get master table detail of event location and event categories
    if (setting.value.category.master_table) {
      await getCategories()
    }

    if (setting.value.location.master_table) {
      await getLocations()
    }
  }

  async function getFormJson(processKey: string, versionId: string) {
    const response: any = await clientApi.api.getDmsFormPropertiesQuery({
      userTaskId: 'start',
      processKey,
      versionId
    }).then((res: any) => res.data)
    if (!response[0] || (response[0] && !response[0].jsonValue)) return {}
    return JSON.parse(response[0].jsonValue)
  }

  async function getCategoriesAndProcessKey(name: string, categoryId: string) {
    if (0 == categoriesOption.value.length) {
      throw new Error('categoriesOption is empty')
    }
    const categories = categoriesOption.value.find((item: any) => item.id === categoryId)
    if (!categories || !categories.flows || categories.flows.length === 0) {
      console.log('categories is null', categories)
      return
    }

    const flow = categories.flows.find((item: any) => item.name.toLowerCase().includes(name))
    if (!flow) {
      throw new Error('flow is empty', flow)
    }

    const data: { categories: any, processKey: string } = {
      categories: categories,
      processKey: flow.key
    }

    return data
  }

  async function initWorkflowForm(name: string, categoryId: string) {
    const data: { processKey: string, location?: string, formJson: string } = {
      processKey: '',
      formJson: ''
    }
    const newVar: any = await getCategoriesAndProcessKey(name, categoryId)
    const categories = newVar.categories
    data.processKey = newVar.processKey

    if (!!categories.location && categories.location.value.length > 0) {
      data.location = categories.location.value.map((item: any) => item.id).join(',')
    }

    // const appPlatform = useAppPlatform()
    // const api = appPlatform.value === 'admin' ? adminApi : clientApi
    // TODO 該接口只有admin端有，client不存在
    const workflow: any = await adminApi.api.getWorkflowVersionKeyProcessdefinitionkey(data.processKey).then((r) => r.data)
    if (!workflow) {
      throw new Error('workflow is empty')
    }

    data.formJson = await getFormJson(workflow.processDefinitionKey, workflow.id)
    return data
  }

  async function handleCancel(calendarId: string, event: EventFormData) {
    const CategoriesAndProcessKey: any = await getCategoriesAndProcessKey(cancelEventWorkflow, calendarId)
    await runWorkflow(CategoriesAndProcessKey.processKey, event)
  }

  async function handleRemove(calendarId: string, event: EventFormData) {
    const CategoriesAndProcessKey: any = await getCategoriesAndProcessKey(deleteEventWorkflow, calendarId)
    await runWorkflow(CategoriesAndProcessKey.processKey, event)
  }

  async function handleReject(calendarId: string, event: EventFormData) {
    const CategoriesAndProcessKey: any = await getCategoriesAndProcessKey(updateEventWorkflow, calendarId)
    await runWorkflow(CategoriesAndProcessKey.processKey, event)
  }

  async function runWorkflow(processKey: string, event: EventFormData) {
    const form = {
      processKey: processKey,
      businessKey: '',
      properties: Object.entries(event).reduce((newObj, [key, val]) => {
        if (val || val === false || val == '0') newObj[key] = val
        return newObj
      }, {})
    }

    try {
      await clientApi.api.postWorkflowProcessStart(form, { async: false }).then((res) => res.data)
    } catch (e) {
      console.error(e)
    }
  }

  onMounted(async () => {
    if (!setting.value) {
      await getCalendarsSetting()
    }
  })

  return {
    setting,
    getCalendarsSetting,
    calendarViewOptions,
    weekDayOptions,
    categoriesOption,
    locationsOption,
    calendarViewerCategories,
    timeSelecteStep,
    timeSelectLimit,
    initWorkflowForm,
    handleCancel,
    handleRemove,
    handleReject,
    createEventWorkflow,
    updateEventWorkflow,
    cancelEventWorkflow,
    deleteEventWorkflow,
    runWorkflow
  }
}
