import { useTableViewsInject } from './useTableViews'
import { buildPageParams } from '../../utils/pageParams'

export function useDBParams() {
  const { currentView, columnFilterRules, columnSortRules, columnGroupRules } = useTableViewsInject()
  const columns = computed(() => currentView.value?.displayColumns)

  function getPageParams(getGroup: boolean = true, getOrderBy: boolean = true) {
    return buildPageParams(
      {
        columnFilterRules: columnFilterRules.value,
        columnSortRules: columnSortRules.value,
        columnGroupRules: columnGroupRules.value,
        columns: columns.value
      },
      { group: getGroup, orderBy: getOrderBy }
    )
  }

  return {
    getPageParams,
    columns
  }
}

export default useDBParams
