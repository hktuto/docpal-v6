import { getCurrentInstance } from 'vue'
import { ElMessageBox } from 'element-plus'
import '../assets/dashboard.scss'

export type DashboardWidget =
  | 'DocTypeCoCount'
  | 'DocTypeCount'
  | 'DocSizeStatistics'
  | 'WorkflowCoCount'
  | 'WorkflowGroup'
  | 'AzureThreshold'
  | 'AzureOcrProcessed'
  | 'AzureOcrProcessedHistory'
  | 'PersonalShare'
  | 'PersonalShareExternal'
  | 'PersonalShareInternalMe'
  | 'PersonalShareInternalOther'
  | 'PersonalPredefinedSearch'
  | 'PersonalWorkflowCreate'
  | 'PersonalWorkflow'
  | 'PersonalSearchHistory'
  | 'PersonalSearchDefine'
  | 'PersonalSearchRecentDoc'
  | 'PersonalSearchSubscribed'
  | 'PersonalCaseCreate'
  | 'PersonalCase'
  | 'Browse'
export type WorkflowCoCountWidget =
  | 'WorkflowActiveCount'
  | 'WorkflowApproveRate'
  | 'WorkflowNewCount'
  | 'WorkflowTimeSpendPerTask'
  | 'WorkflowTimeSpendPerWorkflow'



export const enum DASHBOARD_TYPE {
  documentCount = 'documentCount',
  workflowCount = 'workflowCount',
  document = 'document',
  workflow = 'workflow',
  case = 'case',
  azure = 'azure',
  default = 'default',
  weltonic = 'weltronic'
}
export type DashboardWidgetSetting = {
  x?: number
  y?: number
  i?: string
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  divided?: boolean // 分割线
  w: number
  h: number
  component: any
  setting?: any
  show?: boolean
  layout?: DashboardWidgetSetting
  label: string
  feature?: string
  type?: DASHBOARD_TYPE | string
}

export const useDashboardWidgetSetting = () => useState<{ [key in string]: DashboardWidgetSetting }>('dashboardWidgetSetting', () => ({
  DocSizeStatistics: {
    type: DASHBOARD_TYPE.documentCount,
    label: 'DocSizeStatistics',
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 4,
    w: 2,
    h: 2,
    component: 'LazyDocSizeStatistics',
    setting: {
      style: 'pie',
      displayList: [{ documentType: 'File' }, { documentType: 'Video' }]
    }
  },
  DocTypeCount: {
    type: DASHBOARD_TYPE.documentCount,
    label: 'DocTypeCount',
    minW: 1,
    minH: 2,
    maxW: 2,
    maxH: 4,
    w: 1,
    h: 2,
    component: 'LazyDocCount',
    setting: {
      documentType: 'File',
      color: 'red',
      icon: '/icons/doc/file.svg'
    }
  },
  DocTypeCoCount: {
    type: DASHBOARD_TYPE.documentCount,
    label: 'DocTypeCoCount',
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
    w: 6,
    h: 6,
    component: 'LazyDocCoCount',
    setting: {
      documentType: 'File',
      color: '#fff',
      showCount: true,
      showSize: true,
      displayList: [{ meta: 'create_by' }],
      showUserFilter: true
    }
  },
  PersonalShare: {
    type: DASHBOARD_TYPE.document,
    feature: 'SHARE_INTERNAL',
    label: 'PersonalShare',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 6,
    w: 3,
    h: 3,
    component: 'LazyPersonalShare',
    setting: {}
  },
  PersonalShareExternal: {
    type: DASHBOARD_TYPE.document,
    feature: 'SHARE_EXTERNAL',
    label: 'PersonalShareExternal',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 6,
    w: 3,
    h: 3,
    component: 'LazyPersonalShareExternal',
    setting: {}
  },
  PersonalShareInternalOther: {
    type: DASHBOARD_TYPE.document,
    feature: 'SHARE_INTERNAL',
    label: 'PersonalShareInternalOther',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 6,
    w: 3,
    h: 3,
    component: 'LazyPersonalShareInternalOther',
    setting: {}
  },
  PersonalShareInternalMe: {
    type: DASHBOARD_TYPE.document,
    label: 'PersonalShareInternalMe',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 6,
    w: 3,
    h: 3,
    component: 'LazyPersonalShareInternalMe',
    setting: {}
  },
  PersonalWorkflowCreate: {
    type: DASHBOARD_TYPE.workflow,
    feature: 'WORKFLOW',
    label: 'PersonalWorkflowCreate',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 6,
    w: 3,
    h: 3,
    component: 'LazyPersonalWorkflowCreate',
    setting: {
      workflowKeys: []
    }
  },
  PersonalSearchHistory: {
    type: DASHBOARD_TYPE.document,
    // feature: 'SEARCH',
    label: 'PersonalSearchHistory',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 6,
    w: 3,
    h: 3,
    component: 'LazyPersonalSearchHistory',
    setting: {}
  },
  PersonalSearchDefine: {
    type: DASHBOARD_TYPE.document,
    label: 'PersonalSearchDefine',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 6,
    w: 3,
    h: 3,
    component: 'LazyPersonalSearchDefine',
    setting: {}
  },
  PersonalSearchRecentDoc: {
    type: DASHBOARD_TYPE.document,
    // feature: 'SEARCH',
    label: 'PersonalSearchRecentDoc',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 6,
    w: 3,
    h: 3,
    component: 'LazyPersonalSearchRecentDoc',
    setting: {}
  },
  PersonalSearchSubscribed: {
    type: DASHBOARD_TYPE.document,
    label: 'PersonalSearchSubscribed',
    minW: 4,
    minH: 2,
    maxW: 12,
    maxH: 5,
    w: 6,
    h: 3,
    component: 'LazyPersonalSearchSubscribed',
    setting: {}
  },
  Browse: {
    type: DASHBOARD_TYPE.document,
    label: 'Browse',
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 6,
    w: 3,
    h: 3,
    component: 'LazyPersonalBrowse',
    setting: {
      home: {},
      hideSetting: []
    }
  },
}))

export const useDashboard = () => {

}

export function getDashboardWidgetByType(settingMap: { [key in string]: DashboardWidgetSetting }): { [key in string]: DashboardWidgetSetting[] } {
  const DashboardWidgetResult: { [key in string]: DashboardWidgetSetting[] } = {
    default: []
  }

  Object.keys(settingMap).forEach((key) => {
    const item = settingMap[key]
    if (item.type) {
      if (!DashboardWidgetResult[item.type]) {
        DashboardWidgetResult[item.type] = []
      }
      DashboardWidgetResult[item.type].push(item)
    } else {
      DashboardWidgetResult.default.push(item)
    }
  })
  return DashboardWidgetResult
}
export const getWidgetSetting = (widget: DashboardWidget) => {
  const dashboardWidgetSetting = useDashboardWidgetSetting()
  return dashboardWidgetSetting.value[widget]
}

export const getNormalizeSetting = (setting: DashboardWidget) => {
  const item = getWidgetSetting(setting)
  if (!item) return {}
  return {
    minW: item.minW || 2,
    minH: item.minH || 2,
    maxW: item.maxW || 2,
    maxH: item.maxH || 2
  }
}

type DashboardSettingParams = {
  beforeOpen?: (setting: any) => void
  afterDelete?: (setting: any) => void
}
/**
 *
 * Helper function of dashboard setting,
 * handle open is already included
 * @param DashboardSettingParams
 *
 * @returns
 */
export const useDashboardSetting = ({ beforeOpen, afterDelete }: DashboardSettingParams) => {
  const { emit, props, exposed } = getCurrentInstance()

  const { t } = useI18n()
  const state = reactive({
    loading: false,
    visible: false,
    setting: {}
  })

  async function handleSubmit() {
    // const data = await FormRendererRef.value.getFormData();
    state.loading = true
    try {
      emit('refresh', structuredClone(toRaw(state.setting)))
    } catch (error) {
      state.loading = false
    } finally {
      state.visible = false
      state.loading = false
    }
  }

  async function handleOpen(setting) {
    if (beforeOpen) {
      await beforeOpen(setting)
    }
    if (!setting.columns) setting.columns = []
    if (!setting.steps) setting.steps = []
    if (!setting.sortColumn) setting.sortColumn = ''
    state.visible = true
    state.setting = setting
    state.loading = false
  }

  function handleClose() {
    state.visible = false
  }

  async function handleDelete() {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`).catch((action) => action)
    if (action !== 'confirm') return
    if (afterDelete) {
      afterDelete()
    }
    emit('delete')
    state.visible = false
  }

  return {
    state,
    handleSubmit,
    handleDelete,
    handleClose,
    handleOpen
  }
}
