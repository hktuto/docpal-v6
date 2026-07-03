import type { DashboardWidgetSetting } from '@packages/dp-dashboard/utils/dashboardWidgetHelper'
import { dashboardWidgetSetting as dpDashboardWidgetSetting } from '@packages/dp-dashboard/utils/dashboardWidgetHelper'

export const dbDashboardWidgetSetting: Record<string, DashboardWidgetSetting> = {
  DbStat: {
    label: 'DbStat',
    type: 'database' as any,
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 4,
    w: 2,
    h: 2,
    component: 'LazyDbStatWidget',
    setting: {
      tableId: '',
      field: '',
      aggregation: 'count',
      label: 'Records',
      color: 'primary',
      subtitle: '',
      footer: ''
    }
  },
  DbTable: {
    label: 'DbTable',
    type: 'database' as any,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 6,
    component: 'LazyDbTableWidget',
    setting: {
      tableId: '',
      columns: [],
      rowLimit: 10,
      sortField: '',
      sortOrder: 'desc',
      filterRules: [],
      sortRules: [],
      title: '',
      subtitle: '',
      footer: ''
    }
  },
  DbChart: {
    label: 'DbChart',
    type: 'database' as any,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 6,
    component: 'LazyDbChartWidget',
    setting: {
      tableId: '',
      xField: '',
      series: [
        {
          field: '',
          aggregation: 'sum',
          type: 'bar',
          label: '',
          color: ''
        }
      ],
      appearance: {
        legendPosition: 'bottom',
        stacked: false,
        smooth: false
      },
      title: '',
      subtitle: '',
      footer: ''
    }
  },
  DbPie: {
    label: 'DbPie',
    type: 'database' as any,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 6,
    component: 'LazyDbPieWidget',
    setting: {
      tableId: '',
      chartType: 'pie',
      categoryField: '',
      valueField: '',
      aggregation: 'count',
      rowLimit: 20,
      label: '',
      subtitle: '',
      footer: ''
    }
  },
  DbRecentRecords: {
    label: 'DbRecentRecords',
    type: 'database' as any,
    minW: 3,
    minH: 3,
    maxW: 6,
    maxH: 8,
    w: 4,
    h: 4,
    component: 'LazyDbRecentRecordsWidget',
    setting: {
      tableId: '',
      fields: [],
      limit: 5,
      sortField: '',
      sortOrder: 'desc',
      title: '',
      subtitle: '',
      footer: ''
    }
  },
  DbProgress: {
    label: 'DbProgress',
    type: 'database' as any,
    minW: 3,
    minH: 2,
    maxW: 6,
    maxH: 4,
    w: 4,
    h: 2,
    component: 'LazyDbProgressWidget',
    setting: {
      tableId: '',
      filterField: '',
      filterValue: '',
      label: '',
      color: 'primary',
      subtitle: '',
      footer: ''
    }
  },
  DbGauge: {
    label: 'DbGauge',
    type: 'database' as any,
    minW: 3,
    minH: 3,
    maxW: 6,
    maxH: 6,
    w: 4,
    h: 4,
    component: 'LazyDbGaugeWidget',
    setting: {
      tableId: '',
      field: '',
      aggregation: 'sum',
      label: 'Metric',
      min: 0,
      max: 100,
      target: 80,
      subtitle: '',
      footer: ''
    }
  },
  DbTopList: {
    label: 'DbTopList',
    type: 'database' as any,
    minW: 4,
    minH: 4,
    maxW: 8,
    maxH: 12,
    w: 4,
    h: 6,
    component: 'LazyDbTopListWidget',
    setting: {
      tableId: '',
      categoryField: '',
      valueField: '',
      aggregation: 'sum',
      limit: 10,
      subtitle: '',
      footer: ''
    }
  },
  DbPivot: {
    label: 'DbPivot',
    type: 'database' as any,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 6,
    component: 'LazyDbPivotWidget',
    setting: {
      tableId: '',
      rowField: '',
      columnField: '',
      valueField: '',
      aggregation: 'sum',
      subtitle: '',
      footer: ''
    }
  },
  DbKanban: {
    label: 'DbKanban',
    type: 'database' as any,
    minW: 6,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 8,
    h: 6,
    component: 'LazyDbKanbanWidget',
    setting: {
      tableId: '',
      groupField: '',
      titleField: '',
      limit: 100,
      label: '',
      subtitle: '',
      footer: ''
    }
  },
  DbCalendar: {
    label: 'DbCalendar',
    type: 'database' as any,
    minW: 6,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 8,
    h: 6,
    component: 'LazyDbCalendarWidget',
    setting: {
      tableId: '',
      startField: '',
      endField: '',
      titleField: '',
      limit: 200,
      label: '',
      subtitle: '',
      footer: ''
    }
  },
  DbRecordInfo: {
    label: 'DbRecordInfo',
    type: 'record' as any,
    minW: 4,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 4,
    component: 'LazyDbRecordInfoWidget',
    setting: {
      label: 'Record Info',
      fields: [],
      fieldConfigs: [],
      layout: 'grid',
      showLabels: true,
      gridColumns: 2
    }
  },
  DbRecordRelation: {
    label: 'DbRecordRelation',
    type: 'record' as any,
    minW: 4,
    minH: 3,
    maxW: 12,
    maxH: 12,
    w: 12,
    h: 5,
    component: 'LazyDbRecordRelationWidget',
    setting: {
      label: 'Related Records',
      relationFieldName: '',
      displayColumns: [],
      pageSize: 5,
      allowAdd: false,
      allowOpen: true,
      filterRules: {
        conditions: [],
        conjunction: 'AND'
      },
      sortRules: []
    }
  }
}

/**
 * Returns the full dashboard widget palette grouped by type.
 * Includes dynamic-db widgets (database, record) plus eligible dp-dashboard widgets.
 */
export function getDbDashboardWidgetByType(): Record<string, DashboardWidgetSetting[]> {
  const result: Record<string, DashboardWidgetSetting[]> = {
    database: [],
    record: []
  }

  Object.keys(dbDashboardWidgetSetting).forEach((key) => {
    const widget = dbDashboardWidgetSetting[key]
    const type = widget.type || 'database'
    // Record widgets are only for the per-record dashboard, not the database dashboard
    if (type === 'record') return
    if (!result[type]) {
      result[type] = []
    }
    result[type].push(widget)
  })

  Object.keys(dpDashboardWidgetSetting).forEach((key) => {
    const widget = dpDashboardWidgetSetting[key]
    const type = widget.type || 'default'
    // Skip case and common widgets since these features are not used in DB dashboards
    if (type === 'case' || type === 'caseCount' || type === 'default') return
    if (!result[type]) {
      result[type] = []
    }
    result[type].push(widget)
  })

  return result
}

export function getRecordDashboardWidgetByType(): Record<string, DashboardWidgetSetting[]> {
  const result: Record<string, DashboardWidgetSetting[]> = {
    record: []
  }

  Object.keys(dbDashboardWidgetSetting).forEach((key) => {
    const widget = dbDashboardWidgetSetting[key]
    if (widget.type === 'record') {
      result.record.push(widget)
    }
  })

  return result
}
