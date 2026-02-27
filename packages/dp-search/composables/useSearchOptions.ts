import { newClientApi } from 'api'
import { sortListWithI18n, conditionType, languages, getGroupList, getMetadataOptions } from '../utils/formOptions'

export const useSearchOptions = () => {
  const searchOptions = ref<any>({})
  const searchOptionsLoading = ref(false)
  async function getOptions() {
    searchOptions.value.conditionType = sortListWithI18n(conditionType, 'searchGroup.')
    searchOptions.value.languages = sortListWithI18n(languages)

    const [docType, users, collections, tags, groupList, metadata] = await Promise.all([
      newClientApi.getDmsDocpalTypeActive(),
      newClientApi.postUcenterGetKeycloakAllUsers(),
      newClientApi.getDmsCollection(),
      newClientApi.getDmsDocumentTagsList(),
      getGroupList(),
      getMetadataOptions()
    ])
    searchOptions.value.groupList = sortListWithI18n(groupList)
    searchOptions.value.metadata = sortListWithI18n(metadata)
    const tagData = tags.data?.map((item: any) => ({ label: item, value: item }))
    searchOptions.value.tags = sortListWithI18n(tagData)
    const docTypeData = docType.data?.map((item: any) => ({ label: item.name, value: item.name }))
    searchOptions.value.docType = sortListWithI18n(docTypeData)
    const appPlatform = useAppPlatform()
    const collectionData = collections?.data?.entryList?.map((item: any) => ({
      label: appPlatform.value === 'admin' && item.createdBy ? item.createdBy + ' - ' + item.name : item.name,
      value: item.id
    }))
    searchOptions.value.collections = sortListWithI18n(collectionData)
    const userData = users.data?.map((item: any) => ({ label: item.username, value: item.userId }))
    searchOptions.value.users = sortListWithI18n(userData)
    searchOptions.value.mimeTypes = mimeTypes
    searchOptions.value.sizes = sizes
  }
  onMounted(async () => {
    searchOptionsLoading.value = true
    await getOptions()
    searchOptionsLoading.value = false
  })
  return {
    searchOptions,
    searchOptionsLoading,
    getOptions
  }
}
