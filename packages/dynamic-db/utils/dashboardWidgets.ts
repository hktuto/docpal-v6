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
      color: 'primary'
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
      sortRules: []
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
      chartType: 'bar',
      xField: '',
      xTimeGranularity: '',
      series: [
        {
          field: '',
          aggregation: 'sum',
          label: '',
          color: ''
        }
      ],
      appearance: {
        legendPosition: 'bottom',
        stacked: false,
        smooth: false
      },
      rowLimit: 20
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
      rowLimit: 20
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
      sortOrder: 'desc'
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
      color: 'primary'
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
