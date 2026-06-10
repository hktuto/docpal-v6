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
  DbScatter: {
    label: 'DbScatter',
    type: 'database' as any,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 6,
    component: 'LazyDbScatterWidget',
    setting: {
      tableId: '',
      xField: '',
      yField: '',
      categoryField: '',
      rowLimit: 100,
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
      viewId: '',
      groupField: '',
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
      viewId: '',
      dateField: '',
      subtitle: '',
      footer: ''
    }
  }
}

export function getDbDashboardWidgetByType(): Record<string, DashboardWidgetSetting[]> {
  const result: Record<string, DashboardWidgetSetting[]> = {
    database: []
  }

  Object.keys(dbDashboardWidgetSetting).forEach((key) => {
    result.database.push(dbDashboardWidgetSetting[key])
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
