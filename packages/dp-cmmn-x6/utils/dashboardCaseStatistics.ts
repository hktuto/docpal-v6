
import CaseFieldNum from '../components/caseStatistics/fieldNum/index.vue'
import CaseMonthlyAverage from '../components/caseStatistics/monthlyAverage/index.vue'
import CaseFieldLifecycle from '../components/caseStatistics/fieldLifecycle/index.vue'
import CaseFieldTotal from '../components/caseStatistics/fieldTotal/index.vue'
import CaseLimitFieldNum from '../components/caseStatistics/limitFieldNum/index.vue'
import CaseLimitGroupFieldNum from '../components/caseStatistics/limitGroupFieldNum/index.vue'
export type CaseStatisticsWidget = 'CaseFieldNum' | 'CaseMonthlyAverage' | 'CaseFieldLifecycle' | 'CaseFieldTotal' | 'CaseLimitFieldNum' | 'CaseLimitGroupFieldNum'
export const enum CASE_STATISTICS_TYPE {
  caseCount = 'caseCount',
}
export const CaseStatisticsWidgetSetting: { [key in CaseStatisticsWidget]: DashboardWidgetSetting | any } = {
  CaseFieldNum: {
    type: CASE_STATISTICS_TYPE.caseCount,
    label: 'cmmnCaseFieldNum',
    minW: 1,
    minH: 1,
    maxW: 12,
    maxH: 12,
    w: 2,
    h: 2,
    component: 'CaseFieldNum',
    setting: {
      name: '',
      prefix: '',
      displayMethod: '',
      dateField: 'created_date'
    }
  },
  CaseFieldTotal: {
    type: CASE_STATISTICS_TYPE.caseCount,
    label: 'cmmnCaseFieldTotal',
    minW: 1,
    minH: 1,
    maxW: 12,
    maxH: 12,
    w: 2,
    h: 2,
    component: 'CaseFieldTotal',
    setting: {
      caseId: '',
      relatedField: '',
      dateField: 'created_date',
      title: 'Total',
      dialogSettingTitle: '',
      displayColumns: [],
      fields: '[]',
      displayMethod: '',
      prefix: '',
    }
  },
  CaseLimitFieldNum: {
    type: CASE_STATISTICS_TYPE.caseCount,
    label: 'cmmnCaseLimitFieldNum',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 3,
    h: 4,
    component: 'CaseLimitFieldNum',
    setting: {
      name: '',
      prefix: '',
      displayMethod: '',
      dateField: 'created_date'
    }
  },
  CaseLimitGroupFieldNum: {
    type: CASE_STATISTICS_TYPE.caseCount,
    label: 'cmmnCaseLimitGroupFieldNum',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 3,
    h: 4,
    component: 'CaseLimitGroupFieldNum',
    setting: {
      name: '',
      prefix: '',
      displayMethod: '',
      dateField: 'created_date'
    }
  },
  CaseMonthlyAverage: {
    type: CASE_STATISTICS_TYPE.caseCount,
    label: 'cmmnCaseMonthlyAverage',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 4,
    component: 'CaseMonthlyAverage',
    setting: {
      caseId: '',
      relatedField: '',
      averageField: '',
      averageTitle: '',
      averageUnit: 'Average Duration',
      title: 'Number of Cases',
      dialogSettingTitle: '',
      displayColumns: [],
      fields: '[]',
      dateField: 'created_date'
    }
  },
  CaseFieldLifecycle: {
    type: CASE_STATISTICS_TYPE.caseCount,
    label: 'cmmnCaseFieldLifecycle',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 4,
    component: 'CaseFieldLifecycle',
    setting: {
      caseId: '',
      relatedField: '',
      title: 'Field Lifecycle',
      dialogSettingTitle: '',
      displayColumns: [],
      fields: '[]',
      dateField: 'created_date'
    }
  }
}
export const CaseStatisticsWidgetComponent: { [key in CaseStatisticsWidget]: Component } = {
  CaseFieldNum: CaseFieldNum,
  CaseFieldTotal: CaseFieldTotal,
  CaseMonthlyAverage: CaseMonthlyAverage,
  CaseFieldLifecycle: CaseFieldLifecycle,
  CaseLimitFieldNum: CaseLimitFieldNum,
  CaseLimitGroupFieldNum: CaseLimitGroupFieldNum,
}

export function displaySettingFields(fields: string[], formRendererRef: any) {
  setTimeout(async () => {
    fields.forEach((field) => {
      const widgetRef = formRendererRef.vFormRenderRef.getWidgetRef(field)
      if (widgetRef) {
        widgetRef.setHidden(false)
      }
    })
  }, 100)
}
