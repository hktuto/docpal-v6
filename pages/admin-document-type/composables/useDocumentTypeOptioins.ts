import { newAdminApi } from 'api'

export const masterTableOpts = useState('masterTableOpts', () => [])
export const metadataOpts = useState('metadataOpts', () => [])
export const categoryOpts = useState('categoryOpts', () => [])

export async function initMasterTableOpts() {
  if (masterTableOpts.value.length > 0) return masterTableOpts.value
  const data = await newAdminApi.postDmsMasterTablePage({
    pageSize: 10000,
    pageNum: 0
  })
    .then((res: any) => res.data)
  masterTableOpts.value = data.entryList.map((item: any) => ({ label: item.name, value: item.name, id: item.id }))
}

export async function initMetadataOpts() {
  // if (metadataOpts.value.length > 0) return metadataOpts.value
  const data = await newAdminApi.getDmsDocpalTypeCache().then((res: any) => res.data)
  metadataOpts.value = data.map((item: any) => ({ label: item.name, value: item.id }))
}

export async function initCategoryOpts() {
  if (categoryOpts.value.length > 0) return categoryOpts.value
  const data = await newAdminApi.getDmsDocpalTypeCategories().then((res: any) => res.data)
  categoryOpts.value = data.map((item: any) => ({ label: item, value: item }))
}

export async function getMasterTableDisplayOpts(masterTableId: string) {
  // if(masterTableOpts.value.length > 0) return masterTableOpts.value
  const data = await newAdminApi.getDmsMasterTableId(masterTableId).then((res: any) => res.data)
  return data.fields.map((item: any) => ({ label: item.columnName, value: item.columnName }))
}
