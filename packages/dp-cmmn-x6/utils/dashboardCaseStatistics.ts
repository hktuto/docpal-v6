export type CaseStatisticsWidget = 'CmmnCaseFieldNum' | 'CmmnCaseMonthlyAverage' | 'CmmnCaseFieldLifecycle' | 'CmmnCaseFieldTotal' | 'CmmnCaseLimitFieldNum' | 'CmmnCaseLimitGroupFieldNum'
export const enum CASE_STATISTICS_TYPE {
  caseCount = 'caseCount',
}
export const CaseStatisticsWidgetSetting: { [key in CaseStatisticsWidget]: DashboardWidgetSetting | any } = {
  CmmnCaseFieldNum: {
    type: CASE_STATISTICS_TYPE.caseCount,
    label: 'CmmnCaseFieldNum',
    minW: 1,
    minH: 1,
    maxW: 12,
    maxH: 12,
    w: 2,
    h: 2,
    component: 'LazyCaseStatisticsFieldNum',
    setting: {
      name: '',
      prefix: '',
      displayMethod: '',
      dateField: 'created_date',
      drilldownTitle: 'Case List',
    }
  },
  CmmnCaseFieldTotal: {
    type: CASE_STATISTICS_TYPE.caseCount,
    label: 'CmmnCaseFieldTotal',
    minW: 1,
    minH: 1,
    maxW: 12,
    maxH: 12,
    w: 2,
    h: 2,
    component: 'LazyCaseStatisticsFieldTotal',
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
      drilldownTitle: 'Case List(Total)',
    }
  },
  CmmnCaseLimitFieldNum: {
    type: CASE_STATISTICS_TYPE.caseCount,
    label: 'CmmnCaseLimitFieldNum',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 3,
    h: 4,
    component: 'LazyCaseStatisticsLimitFieldNum',
    setting: {
      name: '',
      prefix: '',
      displayMethod: '',
      dateField: 'created_date',
      drilldownTitle: 'Case List(Limit)',
    }
  },
  CmmnCaseLimitGroupFieldNum: {
    type: CASE_STATISTICS_TYPE.caseCount,
    label: 'CmmnCaseLimitGroupFieldNum',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 3,
    h: 4,
    component: 'LazyCaseStatisticsLimitGroupFieldNum',
    setting: {
      name: '',
      prefix: '',
      displayMethod: '',
      dateField: 'created_date',
      drilldownTitle: 'Case List(Limit Group)',
    }
  },
  CmmnCaseMonthlyAverage: {
    type: CASE_STATISTICS_TYPE.caseCount,
    label: 'CmmnCaseMonthlyAverage',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 4,
    component: 'LazyCaseStatisticsMonthlyAverage',
    setting: {
      caseId: '',
      relatedField: '',
      title: 'Number of Cases',
      dialogSettingTitle: '',
      displayColumns: [],
      fields: '[]',
      dateField: 'created_date',
      drilldownTitle: 'Case List',
      barYAxisTitle: 'Number of Cases',
      barLegendTitle: 'Number of Cases',
      barColor: '',
      barDisplayMethod: '',
      barChartSuffix: '',
      lineYAxisTitle: 'Average Duration',
      lineDataField: '',
      lineLegendTitle: 'Average Duration',
      lineColor: '',
      lineDisplayMethod: '',
      lineChartSuffix: '',
    }
  },
  CmmnCaseFieldLifecycle: {
    type: CASE_STATISTICS_TYPE.caseCount,
    label: 'CmmnCaseFieldLifecycle',
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 4,
    component: 'LazyCaseStatisticsFieldLifecycle',
    setting: {
      caseId: '',
      relatedField: '',
      title: 'Field Lifecycle',
      dialogSettingTitle: '',
      displayColumns: [],
      fields: '[]',
      dateField: 'created_date',
      drilldownTitle: 'Case List(Lifecycle)',
    }
  }
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
