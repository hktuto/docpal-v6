import type { DashboardWidgetSetting } from '@packages/dp-dashboard/utils/dashboardWidgetHelper'
import { dashboardWidgetSetting as dpDashboardWidgetSetting } from '@packages/dp-dashboard/utils/dashboardWidgetHelper'

export const dbDashboardWidgetSetting: Record<string, DashboardWidgetSetting> = {
  DemoInventory: {
    label: '總庫存報表',
    type: 'database' as any,
    minW: 4,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 8,
    h: 4,
    component: 'LazyDemoInventoryWidget',
    setting: {
      title: '總庫存報表',
      subtitle: '',
      footer: ''
    }
  },
  DemoInOut: {
    label: '倉庫入庫/出庫',
    type: 'database' as any,
    minW: 4,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 12,
    h: 4,
    component: 'LazyDemoInOutWidget',
    setting: {
      title: '倉庫入庫/出庫',
      subtitle: '',
      footer: ''
    }
  },
  DemoArrival: {
    label: '即將到貨',
    type: 'database' as any,
    minW: 4,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 8,
    h: 2,
    component: 'LazyDemoArrivalWidget',
    setting: {
      title: '即將到貨',
      subtitle: '',
      footer: ''
    }
  },
  DemoAging: {
    label: '庫齡報表',
    type: 'database' as any,
    minW: 4,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 10,
    h: 2,
    component: 'LazyDemoAgingWidget',
    setting: {
      title: '庫齡報表',
      subtitle: '',
      footer: ''
    }
  },
  DemoSalesOrder: {
    label: '銷售訂單報表',
    type: 'database' as any,
    minW: 4,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 12,
    h: 2,
    component: 'LazyDemoSalesOrderWidget',
    setting: {
      title: '銷售訂單報表',
      subtitle: '',
      footer: ''
    }
  },
  DemoInactiveItem: {
    label: '非活躍項目報表',
    type: 'database' as any,
    minW: 4,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 12,
    h: 2,
    component: 'LazyDemoInactiveItemWidget',
    setting: {
      title: '非活躍項目報表',
      subtitle: '',
      footer: ''
    }
  },
  DemoSalesPerformance: {
    label: '銷售表現儀表板',
    type: 'database' as any,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 10,
    h: 8,
    component: 'LazyDemoSalesPerformanceWidget',
    setting: {
      title: '銷售表現儀表板',
      subtitle: '',
      footer: ''
    }
  },
  DemoPurchaseOrder: {
    label: '採購訂單報表',
    type: 'database' as any,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 12,
    h: 8,
    component: 'LazyDemoPurchaseOrderWidget',
    setting: {
      title: '採購訂單報表',
      subtitle: '',
      footer: ''
    }
  },
  DemoBrandPicker: {
    label: '品牌篩選',
    type: 'demo' as any,
    minW: 4,
    minH: 2,
    maxW: 12,
    maxH: 4,
    w: 12,
    h: 2,
    component: 'LazyDemoBrandPickerWidget',
    setting: {
      title: '品牌篩選',
      subtitle: '',
      footer: ''
    }
  },
  DemoSalesKpi: {
    label: '銷售總覽',
    type: 'demo' as any,
    minW: 4,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 12,
    h: 2,
    component: 'LazyDemoSalesKpiWidget',
    setting: { title: '銷售總覽', subtitle: '', footer: '' }
  },
  DemoMonthlySales: {
    label: '每月已出貨與待出貨',
    type: 'demo' as any,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 8,
    h: 8,
    component: 'LazyDemoMonthlySalesWidget',
    setting: { title: '每月已出貨與待出貨', subtitle: '', footer: '' }
  },
  DemoInventoryValue: {
    label: '庫存價值（按庫齡）',
    type: 'demo' as any,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 8,
    component: 'LazyDemoInventoryValueWidget',
    setting: { title: '庫存價值（按庫齡）', subtitle: '', footer: '' }
  },
  DemoOutstandingCustomer: {
    label: '客戶待出貨',
    type: 'demo' as any,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 8,
    component: 'LazyDemoOutstandingCustomerWidget',
    setting: { title: '客戶待出貨', subtitle: '', footer: '' }
  },
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
  DbTableView: {
    label: 'DbTableView',
    type: 'database' as any,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 6,
    component: 'LazyDbTableViewWidget',
    setting: {
      tableId: '',
      viewId: '',
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
