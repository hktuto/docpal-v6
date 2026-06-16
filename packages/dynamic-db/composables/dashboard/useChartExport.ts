export function useChartExport() {
  function exportChart(
    chartInstance: any,
    filename: string = 'chart',
    options?: { type?: 'png' | 'jpeg'; pixelRatio?: number; backgroundColor?: string }
  ) {
    if (!chartInstance) {
      console.warn('No chart instance available for export')
      return
    }

    const url = chartInstance.getDataURL({
      type: options?.type === 'jpeg' ? 'image/jpeg' : 'image/png',
      pixelRatio: options?.pixelRatio || 2,
      backgroundColor: options?.backgroundColor || '#ffffff'
    })

    const link = document.createElement('a')
    link.download = `${filename}.${options?.type || 'png'}`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return { exportChart }
}
