export type DashboardWidget =
  | CaseStatisticsWidget
  | 'DocTypeCoCount'
  | 'DocTypeCount'
  | 'DocSizeStatistics'
  | 'WorkflowCoCount'
  | 'WorkflowGroup'
  | 'AzureThreshold'
  | 'AzureOcrProcessed'
  | 'AzureOcrProcessedHistory'
  | 'PersonalDashboard'
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
  | 'HkhsDailyReportTable'
  | 'HkhsApplicationFormsPassLog'
  | 'HkhsApplicationsVerified'
  | 'HkhsDailySummary'
export type WorkflowCoCountWidget =
  | 'WorkflowActiveCount'
  | 'WorkflowApproveRate'
  | 'WorkflowNewCount'
  | 'WorkflowTimeSpendPerTask'
  | 'WorkflowTimeSpendPerWorkflow'

import '../assets/dashboard.scss'
export const enum DASHBOARD_TYPE {
  documentCount = 'documentCount',
  workflowCount = 'workflowCount',
  document = 'document',
  workflow = 'workflow',
  case = 'case',
  azure = 'azure',
  hkhs = 'HKHS',
  default = 'default'
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
  type?: DASHBOARD_TYPE
}

export const dashboardWidgetSetting: { [key in string]: DashboardWidgetSetting } = {
  // HKHS
  HkhsDailyReportTable:{
    type: DASHBOARD_TYPE.hkhs,
    label: 'HkhsDailyReportTable',
    minW: 8,
    minH: 6,
    maxW: 12,
    maxH: 8,
    w: 8,
    h: 6,
    component: 'LazyHkhsDailyReportTable',
    setting: {
    }
  },
  HkhsApplicationFormsPassLog:{
    type: DASHBOARD_TYPE.hkhs,
    label: 'HkhsApplicationFormsPassLog',
    minW: 8,
    minH: 6,
    maxW: 12,
    maxH: 8,
    w: 8,
    h: 6,
    component: 'LazyHkhsApplicationFormsPassLog',
    setting: {
    }
  },
  HkhsApplicationsVerified:{
    type: DASHBOARD_TYPE.hkhs,
    label: 'HkhsApplicationsVerified',
    minW: 8,
    minH: 6,
    maxW: 12,
    maxH: 8,
    w: 8,
    h: 6,
    component: 'LazyHkhsApplicationsVerified',
    setting: {
    }
  },
  HkhsDailySummary:{
    type: DASHBOARD_TYPE.hkhs,
    label: 'HkhsDailySummary',
    minW: 8,
    minH: 6,
    maxW: 12,
    maxH: 8,
    w: 8,
    h: 6,
    component: 'LazyHkhsDailySummary',
    setting: {
    }
  },
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
  WorkflowCoCount: {
    type: DASHBOARD_TYPE.workflowCount,
    divided: true,
    label: 'WorkflowCoCount',
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
    w: 6,
    h: 6,
    component: 'LazyWorkflowCoCount',
    setting: {
      workflow: 'contractApproval',
      displayList: [
        'WorkflowNewCount',
        'WorkflowTimeSpendPerTask',
        'WorkflowTimeSpendPerWorkflow',
        'WorkflowActiveCount'
        // 'WorkflowApproveRate',
      ],
      showUserFilter: true
    }
  },
  WorkflowGroup: {
    type: DASHBOARD_TYPE.workflowCount,
    label: 'WorkflowGroup',
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
    w: 12,
    h: 6,
    component: 'LazyWorkflowGroup',
    setting: {
      groupId: '',
      filterList: []
    }
  },
  // azure
  // 屏蔽Azure
  // AzureThreshold: {
  //     feature: 'AZURE_OCR',
  //     divided: true,
  //     label: 'AzureThreshold',
  //     minW: 1,
  //     minH: 1,
  //     maxW: 4,
  //     maxH: 1,
  //     w: 1,
  //     h: 1,
  //     component : 'AzureThreshold',
  //     setting : {
  //         scanType: 'Pre-Build',
  //     }
  // },
  // AzureOcrProcessed: {
  //     feature: 'AZURE_OCR',
  //     label: 'AzureOcrProcessed',
  //     minW: 4,
  //     minH: 2,
  //     maxW: 12,
  //     maxH: 8,
  //     w: 12,
  //     h: 5,
  //     component : 'AzureOcrProcessed',
  //     setting : {
  //         dataType: 'workflow'
  //     }
  // },
  // AzureOcrProcessedHistory: {
  //     feature: 'AZURE_OCR',
  //     label: 'AzureOcrProcessedHistory',
  //     minW: 4,
  //     minH: 2,
  //     maxW: 12,
  //     maxH: 6,
  //     w: 12,
  //     h: 4,
  //     component : 'AzureOcrProcessedHistory',
  //     setting: {}
  // },
  PersonalDashboard: {
    type: DASHBOARD_TYPE.default,
    feature: 'DASHBOARD',
    divided: true,
    label: 'PersonalDashboard',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 6,
    w: 3,
    h: 3,
    component: 'LazyPersonalDashboard',
    setting: {}
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
  // merge to search
  // PersonalPredefinedSearch: {
  //     type: 'personal',
  //     feature: 'SMART_FOLDER',
  //     label: 'PersonalPredefinedSearch',
  //     minW: 2,
  //     minH: 2,
  //     maxW: 12,
  //     maxH: 6,
  //     w: 3,
  //     h: 3,
  //     component : 'PersonalPredefinedSearch',
  //     setting : {
  //     }
  // },
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
  PersonalWorkflow: {
    type: DASHBOARD_TYPE.workflow,
    feature: 'WORKFLOW',
    label: 'PersonalWorkflow',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 3,
    h: 3,
    component: 'LazyPersonalWorkflow',
    setting: {
      isTabView: false,
      processKeys: []
    }
  },
  PersonalWorkflowSingle: {
    type: DASHBOARD_TYPE.workflow,
    label: 'PersonalWorkflowSingle',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 3,
    h: 3,
    component: 'LazyPersonalWorkflowSingle',
    setting: {
      selectedWorkflow: '',
      columns: []
    }
  },
  // PersonalWorkflowSingleFilter:{
  //     type: 'personal',
  //     label: 'PersonalWorkflowSingle',
  //     minW: 2,
  //     minH: 2,
  //     maxW: 12,
  //     maxH: 12,
  //     w: 3,
  //     h: 3,
  //     component : 'PersonalWorkflowSingleFilter',
  //     setting : {
  //         selectedWorkflow: '',
  //         columns: []
  //     }
  // },
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
  PersonalCaseCreate: {
    type: DASHBOARD_TYPE.case,
    label: 'PersonalCaseCreate',
    minW: 1,
    minH: 2,
    maxW: 12,
    maxH: 6,
    w: 2,
    h: 3,
    component: 'LazyPersonalCaseCreate',
    setting: {}
  },
  PersonalCase: {
    type: DASHBOARD_TYPE.case,
    label: 'PersonalCase',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 6,
    w: 3,
    h: 3,
    component: 'LazyPersonalCase',
    setting: {
      caseKeys: []
    }
  },
  PersonalCaseSingle: {
    type: DASHBOARD_TYPE.case,
    label: 'PersonalCaseSingle',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 6,
    component: 'LazyPersonalCaseSingle',
    setting: {
      caseId: '',
      caseLabel: '',
      newButtonLabel: 'common_add',
      displayColumns: []
    }
  },
  CalendarWidget: {
    divided: true,
    type: DASHBOARD_TYPE.default,
    label: 'CalendarWidget',
    minW: 2,
    minH: 6,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 8,
    component: 'LazyCalendarWidget',
    setting: {
      editable: true
    }
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
  ...CaseStatisticsWidgetSetting,
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
  return dashboardWidgetSetting[widget]
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

