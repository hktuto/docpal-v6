import { adminApi, clientApi } from 'api'

export const masterTableOpts = useState('masterTableOpts', () => [])
export const metadataOpts = useState('metadataOpts', () => [])
export const userRulesOpts = useState<any>('userRulesOpts', () => [])
export const categoryOpts = useState('categoryOpts', () => [])
export async function initMasterTableOpts() {
  if (masterTableOpts.value.length > 0) return masterTableOpts.value
  const data = await clientApi.api.postDmsMasterTablePage({
      pageSize: 10000,
      pageNum: 0
    })
    .then((res: any) => res.data)
  masterTableOpts.value = data.entryList.map((item: any) => ({ label: item.name, value: item.name, id: item.id }))
}
export async function initMetadataOpts() {
  // if (metadataOpts.value.length > 0) return metadataOpts.value
  const data = await clientApi.admin.getAdmindmsDocpalTypeCache().then((res: any) => res.data)
  metadataOpts.value = data.map((item: any) => ({ label: item.name, value: item.id }))
}
export async function initCategoryOpts() {
  if (categoryOpts.value.length > 0) return categoryOpts.value
  const data = await clientApi.admin.getAdmindmsDocpalTypeCategories().then((res: any) => res.data)
  categoryOpts.value = data.map((item: any) => ({ label: item, value: item }))
}
export async function getMasterTableDisplayOpts(masterTableId: string) {
  // if(masterTableOpts.value.length > 0) return masterTableOpts.value
  const data = await clientApi.api.getDmsMasterTableId(masterTableId).then((res: any) => res.data)
  return data.fields.map((item: any) => ({ label: item.columnName, value: item.columnName }))
}
const { flatRole } = useRBAC()
export async function initUserRulesOpts() {
  // @ts-ignore
  const t = window.$t
  async function getGroupList() {
    try {
      return await adminApi.api.postNuxeoIdentityGroups({}).then((res) => res.data)
    } catch (error) {
      console.error(error)
      return []
    }
  }
  async function getUserList() {
    try {
      return await adminApi.api.postNuxeoIdentityGetkeycloakallusers({}).then((res) => res.data)
    } catch (error) {
      console.error(error)
      return []
    }
  }
  const groupList: any = await getGroupList()
  const userList: any = await getUserList()
  userRulesOpts.value = [
    {
      label: t('user_role'),
      value: 'userRole', // 1=User, 3=Group, 2=Role
      type: 'select',
      selectConfig: {
        options: flatRole.value
          .map((item: any) => ({
            label: item.name,
            value: item.id
          }))
          .sort((a: any, b: any) => a.label.localeCompare(b.label))
      }
    },
    {
      label: t('user_UserGroup'),
      value: 'userGroup',
      type: 'select',
      selectConfig: {
        options: groupList
          .map((item: any) => ({
            label: item.name,
            value: item.id
          }))
          .sort((a: any, b: any) => a.label.localeCompare(b.label))
      }
    },
    {
      label: t('User'),
      value: 'user',
      type: 'select',
      selectConfig: {
        options: userList
          .map((item: any) => ({
            label: item.username,
            value: item.userId
          }))
          .sort((a: any, b: any) => a.label.localeCompare(b.label))
      }
    }
  ]
}
