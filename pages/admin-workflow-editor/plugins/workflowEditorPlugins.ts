import { defineNuxtPlugin } from '#app'
import { newAdminApi } from 'api'

export default defineNuxtPlugin((nuxtApp) => {
  // @ts-ignore
  const { t } = nuxtApp.$i18n
  const actionList = useGlobalActionList()

  const newAction: GlobalSearchList = {
    label: 'workflow',
    icon: 'dp-icon:flow-outline',
    items: [
      {
        label: 'actions',
        keyword: [],
        icon: 'dp-icon:flow-outline',
        visibleFn: async (keyword: string) => {
          // get list in ssession storage
          const { data } = (await newAdminApi.postDocpalWorkflowProcessDefinitionDraftPage({
            name: keyword,
            pageNum: 0,
            pageSize: 10
          })) as any
          let result: GlobalSearchItem[] = []
          if (data?.entryList?.length > 0) {
            data.entryList.forEach((item: any) => {
              const reg = new RegExp(keyword, 'gi')
              result.push({
                label: item.name.replace(reg, '<span class=hightlight>$&</span>') + ' - latest version',
                icon: 'dp-icon:flow-outline',
                action: ({ tabProvider, keyword }) => {
                  const praams = {
                    ...item,
                    versionNumber: item.latestVersion,
                    draftId: item.id
                  }
                  const newItem = newWorkflowEditorDetail(praams)
                  tabProvider.openTab(newItem, true)
                }
              } as GlobalSearchItem)
              // check if has production version
              if (item.productionVersion) {
                result.push({
                  label: item.name.replace(reg, '<span class=hightlight>$&</span>') + ' - production version',
                  icon: 'dp-icon:flow-outline',
                  action: ({ tabProvider, keyword }) => {
                    const praams = {
                      ...item,
                      versionNumber: item.productionVersion,
                      draftId: item.id
                    }
                    const newItem = newWorkflowEditorDetail(praams)
                    tabProvider.openTab(newItem, true)
                  }
                } as GlobalSearchItem)
              }
            })
            return result
          }
        },
        action: ({ tabProvider, keyword }) => {}
      }
    ]
  }
  // TODO : fix this workflow action
  // actionList.value.push(newAction)
})
