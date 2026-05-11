import type { DashboardWidgetSetting } from '@packages/dp-dashboard/utils/dashboardWidgetHelper'

export const dbDashboardWidgetSetting: Record<string, DashboardWidgetSetting> = {
  DbStat: {
    label: 'DbStat',
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
      sortOrder: 'desc'
    }
  },
  DbChart: {
    label: 'DbChart',
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
      yField: '',
      aggregation: 'count',
      rowLimit: 20
    }
  },
  DbRecentRecords: {
    label: 'DbRecentRecords',
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
  },
  DbText: {
    label: 'DbText',
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 6,
    w: 3,
    h: 3,
    component: 'LazyDbTextWidget',
    setting: {
      content: '',
      bgColor: '#ffffff',
      textColor: '#333333',
      fontSize: 'medium'
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

  return result
}
