// Minimal echarts lifecycle helper for the local-data demo chart widgets.
// Each widget registers the echarts modules it needs (same pattern as DbPieWidget).
import type { Ref } from 'vue'
import * as echarts from 'echarts/core'

export function useDemoChart(container: Ref<HTMLElement | undefined>) {
  let chart: echarts.ECharts | null = null
  let observer: ResizeObserver | null = null

  function render(option: any, onClick?: (params: any) => void) {
    if (!container.value) return
    if (!chart) {
      chart = echarts.init(container.value)
      observer = new ResizeObserver(() => chart?.resize())
      observer.observe(container.value)
    }
    chart.setOption(option)
    if (onClick) {
      chart.off('click')
      chart.on('click', onClick)
    }
  }

  onUnmounted(() => {
    observer?.disconnect()
    chart?.dispose()
    chart = null
  })

  return { render }
}
