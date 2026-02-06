import type { ViewRenderFunctionParams, EditRenderFunctionParams } from "../../../types/column-types";
import { clientApi } from "api";
export const UserView = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const userOptions = options?.props
  // console.log('userOptions', userOptions)
  return h('div', {
    class: 'user-view',
  }, row[column.field])
}
export const UserEdit = ({options, params}: EditRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const userOptions = options?.props
  const getUserList = async () => {
    const res = await clientApi.api.postNuxeoIdentityUsers()
    return res.data
  }
  const userList = ref<any[]>([])
  onMounted(async () => {
    const data = await getUserList()
    userList.value = data || []
    console.log('userList', userList.value)
  })
  return h('div', {
    class: 'user-edit',
  }, [
    h('el-select', {
      'v-model': row[column.field],
      options: userList,
    })
  ])
}
