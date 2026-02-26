import type { DashboardWidgetSetting } from '@packages/dp-dashboard/utils/dashboardWidgetHelper'

import { CaseStatisticsWidgetSetting } from './dashboardCaseStatistics'
import type { CaseStatisticsWidget as CaseStatisticsWidgetType } from './dashboardCaseStatistics'
// TODO: 需要优化Lazy组件的引用
export type CmmnDashboardWidget =
  CaseStatisticsWidgetType
  | 'Action'
  | 'BasicInfo'
  | 'Process'
  | 'TaskPage'
  | 'WorkflowPage'
  | 'Activity'
  | 'DocumentRoot'
  | 'RelatedCase'
  | 'RelatedMaster'
  | 'MasterTableInfo'
  | 'RelatedCaseInfo'
  | 'AuditLog'
  | 'Stage'

export const CmmnDashboardWidgetSetting: { [key in CmmnDashboardWidget]: DashboardWidgetSetting } = {
  BasicInfo: {
    label: 'cmmnBasicInfo',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 2,
    h: 2,
    component: 'LazyDashboardBasicInfo',
    setting: {
      layout: [],
      defaultValue: {}
    }
  },
  Activity: {
    label: 'cmmnActivity',
    minW: 2,
    minH: 2,
    maxW: 10,
    maxH: 12,
    w: 2,
    h: 3,
    component: 'LazyDashboardActivity',
    setting: {}
  },
  Action: {
    label: 'cmmnAction',
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 12,
    w: 2,
    h: 2,
    component: 'LazyDashboardAction',
    setting: {}
  },
  Process: {
    label: 'cmmnProcess',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 2,
    h: 2,
    component: 'LazyDashboardProcess',
    setting: {
      layout: []
    }
  },
  TaskPage: {
    label: 'cmmnTaskPage',
    minW: 2,
    minH: 2,
    maxW: 8,
    maxH: 12,
    w: 2,
    h: 3,
    component: 'LazyDashboardTaskPage',
    setting: {}
  },
  WorkflowPage: {
    label: 'cmmnWorkflowPage',
    minW: 6,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 8,
    h: 4,
    component: 'LazyDashboardWorkflowPage',
    setting: {}
  },
  DocumentRoot: {
    label: 'cmmnDocumentRoot',
    minW: 2,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 8,
    h: 4,
    component: 'LazyDashboardDocumentRoot',
    setting: {
      home: ''
    }
  },
  RelatedCase: {
    label: 'cmmnRelatedCase',
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 4,
    h: 4,
    component: 'LazyDashboardRelatedCase',
    setting: {
      caseId: '',
      caseLabel: '',
      newButtonLabel: 'common_add',
      displayColumns: []
    }
  },
  RelatedMaster: {
    label: 'cmmnRelatedMaster',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 4,
    h: 4,
    component: 'LazyDashboardRelatedMaster',
    setting: {
      masterTableId: '',
      label: '',
      relatedField: '',
      displayColumns: []
    }
  },
  MasterTableInfo: {
    label: 'cmmnMasterTableInfo',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 2,
    h: 2,
    component: 'LazyDashboardMasterTableInfo',
    setting: {
      title: '',
      layout: [],
      masterTableId: '',
      masterTableName: '',
      relatedField: ''
    }
  },
  RelatedCaseInfo: {
    label: 'cmmnRelatedCaseInfo',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 2,
    h: 2,
    component: 'LazyDashboardRelatedCaseInfo',
    setting: {
      title: '',
      layout: [],
      caseId: '',
      caseLabel: '',
      caseVersionId: '', // 初始化 case list
      relatedCaseField: ''
    }
  },
  AuditLog: {
    label: '',
    minW: 6,
    minH: 4,
    maxW: 16,
    maxH: 12,
    w: 6,
    h: 4,
    component: 'LazyDashboardAuditLog',
    setting: {
      caseId: '',
      caseLabel: '',
      newButtonLabel: 'common_add',
      displayColumns: []
    }
  },
  Stage: {
    label: 'Stage',
    minW: 6,
    minH: 1,
    maxW: 12,
    maxH: 2,
    w: 6,
    h: 1,
    component: 'LazyDashboardStage',
    setting: {
      label: "Stage",
      selectedField: "",
      steps:[],
    }
  },
  ...CaseStatisticsWidgetSetting
}

export function getCmmnWidgetSetting(widget: CmmnDashboardWidget) {
  return CmmnDashboardWidgetSetting[widget]
}

export const getCmmnNormalizeSetting = (setting: CmmnDashboardWidget) => {
  const item = getCmmnWidgetSetting(setting)
  return {
    minW: item.minW,
    minH: item.minH,
    maxW: item.maxW,
    maxH: item.maxH
  }
}

