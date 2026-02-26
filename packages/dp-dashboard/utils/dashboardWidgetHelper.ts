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
export type WorkflowCoCountWidget =
  | 'WorkflowActiveCount'
  | 'WorkflowApproveRate'
  | 'WorkflowNewCount'
  | 'WorkflowTimeSpendPerTask'
  | 'WorkflowTimeSpendPerWorkflow'

// personal
import {
  LazyPersonalDashboard,
  LazyPersonalShare,
  LazyPersonalShareExternal,
  LazyPersonalShareInternalMe,
  LazyPersonalShareInternalOther,
  LazyPersonalPredefinedSearch,
  LazyPersonalWorkflowCreate,
  LazyPersonalWorkflow,
  LazyPersonalSearchHistory,
  LazyPersonalSearchDefine,
  LazyPersonalSearchRecentDoc,
  LazyPersonalSearchSubscribed,
  LazyPersonalCaseCreate,
  LazyPersonalCase,
  LazyPersonalCaseSingle,
  LazyPersonalWorkflowSingle,
  LazyCalendarWidget
} from '#components'

import DocTypeCoCount from '../components/global/doc/coCount/index.vue'
import DocTypeCount from '../components/global/doc/count.vue'
import DocSizeStatistics from '../components/global/doc/sizeStatistics.vue'
// workflow co-count
import WorkflowCoCount from '../components/global/workflow/coCount/index.vue'
import WorkflowActiveCount from '../components/global/workflow/coCount/activeCount.vue'
import WorkflowApproveRate from '../components/global/workflow/coCount/approveRate.vue'
import WorkflowNewCount from '../components/global/workflow/coCount/newCount.vue'
import WorkflowTimeSpendPerTask from '../components/global/workflow/coCount/timeSpendPerTask.vue'
import WorkflowTimeSpendPerWorkflow from '../components/global/workflow/coCount/timeSpendPerWorkflow.vue'
// workflow group
import WorkflowGroup from '../components/global/workflow/group/index.vue'
// azure
import AzureThreshold from '../components/global/azure/threshold.vue'
import AzureOcrProcessed from '../components/global/azure/ocrProcessed/index.vue'
import AzureOcrProcessedHistory from '../components/global/azure/ocrProcessHistory/index.vue'
// import PersonalDashboard from '../components/global/personal/dashboard.vue'
// import PersonalShare from '../components/global/personal/share/index.vue'
// import PersonalShareExternal from '../components/global/personal/share/external.vue'
// import PersonalShareInternalMe from '../components/global/personal/share/internalMe.vue'
// import PersonalShareInternalOther from '../components/global/personal/share/internalOther.vue'
// import PersonalPredefinedSearch from '../components/global/personal/predefinedSearch.vue'
// import PersonalWorkflowCreate from '../components/global/personal/workflow/create/index.vue'
// import PersonalWorkflow from '../components/global/personal/workflow/index.vue'
// import PersonalSearchHistory from '../components/global/personal/search/history.vue'
// import PersonalSearchDefine from '../components/global/personal/search/define.vue'
// import PersonalSearchRecentDoc from '../components/global/personal/search/recentDoc.vue'
// import PersonalSearchSubscribed from '../components/global/personal/search/subscribed.vue'
// import PersonalCaseCreate from '../components/global/personal/case/create.vue'
// import PersonalCase from '../components/global/personal/case/index.vue'
// import PersonalCaseSingle from '../components/global/personal/case/single/index.vue'
// import CalendarWidget from '../components/global/calendar/widget/index.vue'
// import PersonalWorkflowSingle from '../components/global/personal/workflow/single/index.vue'
// import PersonalWorkflowSingleFilter from '../components/global/personal/workflow/singleFilter/index.vue'
import '../assets/dashboard.scss'
import Browse from '../components/global/personal/browse/index.vue'
export const enum DASHBOARD_TYPE {
  documentCount = 'documentCount',
  workflowCount = 'workflowCount',
  document = 'document',
  workflow = 'workflow',
  case = 'case',
  azure = 'azure',
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
  DocSizeStatistics: {
    type: DASHBOARD_TYPE.documentCount,
    label: 'docTypeSizeChart',
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 4,
    w: 2,
    h: 2,
    component: 'DocSizeStatistics',
    setting: {
      style: 'pie',
      displayList: [{ documentType: 'File' }, { documentType: 'Video' }]
    }
  },
  DocTypeCount: {
    type: DASHBOARD_TYPE.documentCount,
    label: 'docTypeCountChart',
    minW: 1,
    minH: 2,
    maxW: 2,
    maxH: 4,
    w: 1,
    h: 2,
    component: 'DocTypeCount',
    setting: {
      documentType: 'File',
      color: 'red',
      icon: '/icons/doc/file.svg'
    }
  },
  DocTypeCoCount: {
    type: DASHBOARD_TYPE.documentCount,
    label: 'docTypeChart',
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
    w: 6,
    h: 6,
    component: 'DocTypeCoCount',
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
    label: 'workflowCoCount',
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
    w: 6,
    h: 6,
    component: 'WorkflowCoCount',
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
    label: 'workflowGroup',
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
    w: 12,
    h: 6,
    component: 'WorkflowGroup',
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
  //     label: 'azureThreshold',
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
  //     label: 'azureOcrProcessed',
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
  //     label: 'azureOcrProcessedHistory',
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
    component: 'PersonalDashboard',
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
    component: 'PersonalShare',
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
    component: 'PersonalShareExternal',
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
    component: 'PersonalShareInternalOther',
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
    component: 'PersonalShareInternalMe',
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
    component: 'PersonalWorkflowCreate',
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
    component: 'PersonalWorkflow',
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
    component: 'PersonalWorkflowSingle',
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
    component: 'PersonalSearchHistory',
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
    component: 'PersonalSearchDefine',
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
    component: 'PersonalSearchRecentDoc',
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
    component: 'PersonalSearchSubscribed',
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
    component: 'PersonalCaseCreate',
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
    component: 'PersonalCase',
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
    component: 'PersonalCaseSingle',
    setting: {
      caseId: '',
      caseLabel: '',
      newButtonLabel: 'common_add',
      displayColumns: []
    }
  },
  ...CaseStatisticsWidgetSetting,
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
    component: 'CalendarWidget',
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
    component: 'Browse',
    setting: {
      home: {},
      hideSetting: []
    }
  }
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

// TODO : 删除
export const widgetComponent = {
  DocTypeCoCount: DocTypeCoCount,
  DocTypeCount: DocTypeCount,
  DocSizeStatistics: DocSizeStatistics,

  WorkflowCoCount: WorkflowCoCount,
  WorkflowActiveCount: WorkflowActiveCount,
  WorkflowApproveRate: WorkflowApproveRate,
  WorkflowNewCount: WorkflowNewCount,
  WorkflowTimeSpendPerTask: WorkflowTimeSpendPerTask,
  WorkflowTimeSpendPerWorkflow: WorkflowTimeSpendPerWorkflow,

  WorkflowGroup: WorkflowGroup,

  AzureThreshold: AzureThreshold,
  AzureOcrProcessed: AzureOcrProcessed,
  AzureOcrProcessedHistory: AzureOcrProcessedHistory,

  PersonalDashboard: LazyPersonalDashboard,
  PersonalShare: LazyPersonalShare,
  PersonalShareExternal: LazyPersonalShareExternal,
  PersonalShareInternalMe: LazyPersonalShareInternalMe,
  PersonalShareInternalOther: LazyPersonalShareInternalOther,
  PersonalPredefinedSearch: LazyPersonalPredefinedSearch,
  PersonalWorkflowCreate: LazyPersonalWorkflowCreate,
  PersonalWorkflow: LazyPersonalWorkflow,
  PersonalSearchHistory: LazyPersonalSearchHistory,
  PersonalSearchDefine: LazyPersonalSearchDefine,
  PersonalSearchRecentDoc: LazyPersonalSearchRecentDoc,
  PersonalSearchSubscribed: LazyPersonalSearchSubscribed,
  PersonalCaseCreate: LazyPersonalCaseCreate,
  PersonalCase: LazyPersonalCase,
  PersonalWorkflowSingle: LazyPersonalWorkflowSingle,
  PersonalCaseSingle: LazyPersonalCaseSingle,
  CalendarWidget: LazyCalendarWidget,

  Browse: Browse,
  ...CaseStatisticsWidgetComponent
}
