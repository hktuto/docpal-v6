import { useEventListener, watchDebounced } from '@vueuse/core'
import { formSlotHandleDisplayMethod } from '../components/formSlot/displayColumn/reorderColumn'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
export type useDashboardCardParams = {
  initStyleAction?: (cardRef: any, chartRef: any) => void
  initStyleActionExtend?: (pHeight: number, pWidth: number) => void
  resizeAction?: (instance: any) => void
  resizeActionExtend?: () => void
  onClick?: (instance: any) => void
  clickAction?: (data: any) => void
  handleInitCardAction?: (chartSetting: any) => void
  handleRefreshAction?: (chartSetting: any) => void
  getOptions?: (chartSetting: any) => any
  options?: any

  props: any
}
export const useDashboardCard = (params: useDashboardCardParams) => {
  const props = params.props
  let echartInstance: any
  const chartRef = ref<any>()
  const cardRef = ref<any>()
  const settingRef = ref<any>()
  const loading = ref(false)

  const initStyle = async () => {
    if (params.initStyleAction) {
      params.initStyleAction(cardRef, chartRef)
    } else {
      await new Promise((resolve) =>
        setTimeout(() => {
          if (!cardRef.value) return
          const cardEl = cardRef.value.$el ? cardRef.value.$el : cardRef.value.parentNode ? cardRef.value.parentNode : cardRef.value
          const pHeight = cardEl.offsetHeight - 36 // - header
          const pWidth = cardEl.offsetWidth - 20
          if (chartRef.value) chartRef.value.style = `height: ${pHeight}px; width: ${pWidth}px`
          if (params.initStyleActionExtend) params.initStyleActionExtend(pHeight, pWidth)
          resolve(true)
        }, 100)
      )
    }
  }

  const initChart = (_options: any) => {
    if (echartInstance) echartInstance.clear()
    if (chartRef.value && _options) {
      echartInstance = echarts.init(chartRef.value)
      echartInstance.setOption(_options)
      echartInstance.resize()
      if (params.clickAction) {
        echartInstance.on('click', (data: any) => {
          params.clickAction?.(data)
        })
      }
    }
  }

  // refresh: handleRefreshAction || handleInitCard
  const refresh = async (chartSetting?: any) => {
    if (params.handleRefreshAction) {
      try {
        loading.value = true
        await params.handleRefreshAction(chartSetting)
      } catch (error: any) {
        console.error(error)
      } finally {
        await new Promise((resolve) => setTimeout(resolve, 300))
        loading.value = false
      }
    } else handleInitCard(chartSetting)
  }
  const handleInitCard = async (chartSetting?: any) => {
    try {
      if (!chartSetting) chartSetting = props.setting
      loading.value = true
      if (!params.handleInitCardAction) {
        const options = params.getOptions ? await params.getOptions(chartSetting) : params.options ? params.options : null
        initChart(options)
      } else {
        params.handleInitCardAction(chartSetting)
      }
    } catch (error: any) {
      console.error(error)
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 300))
      loading.value = false
    }
    if (params.onClick) params.onClick(echartInstance)
  }
  const getInstance = () => {
    return echartInstance
  }
  const resize = () => {
    setTimeout(async () => {
      if (params.resizeAction) {
        params.resizeAction(echartInstance)
      } else {
        await initStyle()
        if (echartInstance) echartInstance.resize()
      }
    })
  }

  function offsetResize() {
    setTimeout(() => {
      resize()
    }, 300)
  }
  const setupOptions = (opts: any) => {
    const _opts = JSON.parse(JSON.stringify(opts))

    const setting = props.setting
    if (setting.theme) {
      _opts.color = setting.theme
    }
    if (_opts.grid) {
      _opts.grid.left = setting.leftMargin ? setting.leftMargin + '%' : '10%'
      _opts.grid.right = setting.rightMargin ? setting.rightMargin + '%' : '15%'
      _opts.grid.bottom = setting.bottomMargin ? setting.bottomMargin + '%' : '15%'
      _opts.grid.top = setting.topMargin ? setting.topMargin + '%' : '15%'
    }
    if (_opts.legend) {
      _opts.legend.show = setting.showLegend
      _opts.legend.top = setting.legendTop ? setting.legendTop : 'top'
      _opts.legend.left = setting.legendLeft ? setting.legendLeft : 'center'
      _opts.legend.itemGap = setting.legendGap ? Number(setting.legendGap) : 10
    }
    return _opts
  }
  function setSqlParamsByFilterList(filterList: any[], sqlParams: any[]) {
    filterList.forEach((item: any) => {
      sqlParams.push({
        key: item.filterKey,
        type: item.filterValue.length > 1 ? 'in' : 'eq',
        value: item.filterValue.length > 1 ? item.filterValue : item.filterValue[0]
      })
    })
  }
  function setRpcParamsByFilterList(filterList: any[], rpcFilters: any) {
    filterList.forEach((item: any) => {
      rpcFilters[item.filterKey] = item.filterValue.length > 1 ? item.filterValue : item.filterValue[0]
    })
  }
  function getSystemDateYear() {
    let dates: any
    if (!props.dates) {
      dates = [dayjs(new Date()).format('YYYY-MM-DD'), dayjs(new Date()).format('YYYY-MM-DD')]
    } else {
      dates = JSON.parse(JSON.stringify(props.dates))
    }
    return Number(dayjs(dates[0]).year())
  }
  onMounted(async () => {
    setTimeout(async () => {
      initStyle()
      // 随着屏幕大小调节图表
      useEventListener(window, 'resize', resize)

      const cardElement = cardRef.value?.$el as HTMLElement

      if (!cardElement) return
      cardElement.addEventListener('fullscreenchange', offsetResize)
    })
  })
  onUnmounted(() => {
    if (!!echartInstance) echartInstance.dispose()
    const cardElement = cardRef.value?.$el as HTMLElement
    if (!cardElement) return
    cardElement.removeEventListener('fullscreenchange', offsetResize)
  })
  watchDebounced(
    () => [props.setting, props.dates],
    (newValue, oldValue) => {
      if (!props.setting) return
      if (!oldValue || JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
        handleInitCard(props.setting)
      }
    },
    { debounce: 200, maxWait: 500, immediate: true }
  )

  return {
    loading,
    chartRef,
    cardRef,
    settingRef,
    initChart,
    resize,
    refresh,
    handleInitCard,
    getInstance,
    setupOptions,
    setSqlParamsByFilterList,
    setRpcParamsByFilterList,
    formSlotHandleDisplayMethod,
    getSystemDateYear
  }
}
