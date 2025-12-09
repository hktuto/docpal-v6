export const useStatsTableFilter = (setting: any, sql: string) => {
  const ResponsiveFilterRef = ref()
  let originalData: any[] = []
  let filteredData: any[] = []
  let filterParams: any = {}
  function handleFilterData() {
    try {
      if (originalData.length === 0) {
        return []
      }
      filteredData = JSON.parse(JSON.stringify(originalData))
      Object.keys(filterParams).forEach((key: string) => {
        if (key === 'q') {
          filteredData = filteredData.filter((item: any, index: number) => {
            return Object.keys(item).some((key: string) => {
              return item[key]?.toString().toLowerCase().includes(filterParams.q.toLowerCase())
            })
          })
        } else {
          filteredData = filteredData.filter((item: any) => filterParams[key].includes(item[key]))
        }
      })
      return filteredData
    } catch (error) {
      console.error('error', error)
      return []
    }
  }
  function setOriginalData(data: any[]) {
    try {
      originalData = JSON.parse(JSON.stringify(data))
      filteredData = originalData
    } catch (error) {
      originalData = []
      filteredData = []
      console.error('error', error)
    }
  }
  function setFilterParams(params: any) {
    filterParams = params
  }
  function initFilter() {
    const filterList = setting.displayColumns.reduce((prev: any, item: any) => {
      if (item.value && ['short_text', 'float'].includes(item.type) && item.showInFilter) {
        prev.push({
          label: item.label,
          key: item.value,
          options: getFileterOptions(item.value)
        })
      }
      return prev
    }, [])
    setTimeout(() => {
      ResponsiveFilterRef.value?.init(filterList)
    }, 100)
  }
  function getFileterOptions(key: string) {
    const options: any[] = originalData.map((item: any) => item[key])
    const uniqueOptions = [...new Set(options)]
    return uniqueOptions.map((item: any) => ({
      label: item,
      value: item
    })).sort((a: any, b: any) => a.label.localeCompare(b.label))
  }
  return {
    initFilter,
    filterParams,
    handleFilterData,
    setOriginalData,
    setFilterParams,
    ResponsiveFilterRef
  }
}
