import { newClientApi } from 'api'

interface PermissionOption {
  id: string;
  label: string;
  value: number;
  type: string;
  options: any[];
}

const userList = ref<any[]>([])
const roleList = ref<any[]>([])
const groupList = ref<any[]>([])
export const usePermissionOption = () => useState<PermissionOption[]>('permission', () => ([]))

export const getFromServer = async function(loadUserList: boolean, loadRoleList: boolean, loadGroupList: boolean) {
  const options = usePermissionOption()
  options.value = []

  try {
    if (loadUserList) {
      const user = await newClientApi.postUcenterUsers().then((res: any) => res.data)
      userList.value = user || []
      if (userList.value.length > 0) {
        options.value.push(
          {
            id: 'user',
            label: $t('user_users'),
            value: 1,
            type: 'select',
            options: user.map((item: any) => item)
          }
        )
      }
    }

    if (loadRoleList) {
      const role = await newClientApi.postDocpalAclRoleList([{
        column: 'status',
        type: 'EQ',
        values: '1'
      }]).then((res: any) => res.data)
      roleList.value = role || []
      if (roleList.value.length > 0) {
        options.value.push(
          {
            id: 'role',
            label: $t('user_role'),
            value: 2,
            type: 'select',
            options: role.map((item: any) => item)
          }
        )
      }
    }

    if (loadGroupList) {
      const group = await newClientApi.postUcenterGroups().then((res) => res.data)
      groupList.value = group || []
      if (groupList.value.length > 0 && !!group) {
        options.value.push(
          {
            id: 'group',
            label: $t('user_groups'),
            value: 3,
            type: 'select',
            options: group.map((item: any) => item)
          }
        )
      }
    }
  } catch (e) {
    console.log(e)
  }
  return options.value
}

// User, Role, Group Select Option
export const getPermissionSelectOption = async () => {
  const options = usePermissionOption()
  if (options.value.length === 0) {
    await getFromServer(true, true, true)
  }
  return convertId(options.value)
}

// User, Role Select option
export const getUserAndRolePermissionSelectOption = async () => {
  const options = usePermissionOption()
  if (options.value.length === 0) {
    await getFromServer(true, true, false)
  }
  return convertId(options.value)
}

// User, Group Select option
export const getUserAndGroupPermissionSelectOption = async () => {
  const options = usePermissionOption()
  if (options.value.length === 0) {
    await getFromServer(true, false, true)
  }
  return convertId(options.value)
}

// Role, Group Select Option
export const getRoleAndGroupPermissionSelectOption = async () => {
  const options = usePermissionOption()
  if (options.value.length === 0) {
    await getFromServer(false, true, true)
  }
  return convertId(options.value)
}

function convertId(options: any) {
  return options.map((item: any) => ({
    ...item,
    options: item.options.map((option: any) => {
      const name = option.name || option.userName || option.username || ''
      let id = option.id
      switch (item.id) {
        case 'user':
          id = `user_${option.userId}`
          break
        case 'role':
          id = `role_${id}`
          break
        case 'group':
          id = `group_${id}`
          break
      }
      return { value: id, label: name }
    })
  }))
}

/**
 * From the select array, convert permissions to objects.
 * ['user_joshua', 'role_cxv', 'group_IT'] To format: { "user": ["joshua"], "group": ['IT'], "role": ['cxv']}
 * @param permissions string array
 */
export const convertPermissionObjectByPermissions = (permissions: string[]) => {
  if (!permissions) return {}
  const item: Record<string, string[]> = {}
  permissions.forEach((key: string) => {
    const segments = key.split('_')

    if (segments.length < 1) {
      return item
    }
    if (!item[segments[0]]) {
      item[segments[0]] = []
    }
    item[segments[0]].push(segments.slice(1).join('_'))
  })
  return item
}

/**
 * Convert permissions object to permission array.
 * { "user": ["joshua"], "group": ['IT'], "role": ['cxv']} To format: [ "user_joshua", "group_IT", "role_cxv" ]
 * @param permissions { 'user': ['joshua'], 'group': ['group_IT'], 'role': ['role_cxv']}
 */
export const convertPermissionsByPermissionObject = (permissions: {
  user?: string[],
  role?: string[],
  group?: string[]
}) => {
  return Object.entries(permissions).flatMap(([key, values]) =>
    values.map(value => `${key}_${value}`)
  )
}

/**
 * Exclude the permission content that has been selected
 * @param permission string Array
 * @param permissionOptionList <PermissionOption[]>
 */
export const excludeItemSelectList = (permission: any, permissionOptionList: PermissionOption[]) => {
  if (!permission.exitList) {
    return permissionOptionList
  }
  const userIdsToRemove = new Set(permission.exitList.map((item: any) => item.userId))
  return permissionOptionList.reduce((acc: any[], allItem: any) => {
    const newOptions = allItem.options.filter((option: any) => {
      return !userIdsToRemove.has(option.value.split('_').slice(1).join('_'))
    })
    if (newOptions.length > 0) {
      acc.push({ ...allItem, options: newOptions })
    }
    return acc
  }, [])
}

/**
 * Convert permissions array Object to permission array.
 * [{"dataType": "group", "value": "administrators", "name": "Administrators Group"}] To format: [ "group_administrators" ]
 * @param permissions
 */
export const convertSelectOptions = (permissions: any) => {
  const permission: any = []
  permissions.forEach((item: any) => {
    const type = item.dataType
    switch (type) {
      case 'user':
        permission.push(`user_${item.value}`)
        break
      case 'role':
        permission.push(`role_${item.value}`)
        break
      case 'group':
        permission.push(`group_${item.value}`)
        break
    }
  })
  return permission
}

// User Select Option
export const getUserPermissionSelectOption = async () => {
  const options = usePermissionOption()
  if (options.value.length === 0) {
    await getFromServer(true, false, false)
  }

  return userList.value.map((item: any) => {
    const name = item.name || item.userName || item.username || ''
    return { label: name, value: item.userId, email: item.email, userId: item.userId }
  })
}

// Role Select Option
export const getRolePermissionSelectOption = async () => {
  const options = usePermissionOption()
  if (options.value.length === 0) {
    await getFromServer(false, true, false)
  }

  return roleList.value.map((item: any) => {
    return { label: item.name, value: item.id }
  })
}

// Group Select Option
export const getGroupPermissionSelectOption = async () => {
  const options = usePermissionOption()
  if (options.value.length === 0) {
    await getFromServer(false, false, true)
  }
  return groupList.value.map((item: any) => {
    return { label: item.name, value: item.id }
  })
}

export const getPermissionPairOption = async () => {
  const options = usePermissionOption()
  if (options.value.length === 0) {
    await getFromServer(true, true, true)
  }
  return options.value.map((item: any) => ({
    ...item,
    options: item.options.map((option: any) => {
      const name = option.name || option.userName || option.username || ''
      return { value: option.id, label: name }
    })
  }))
}

export const getCachePermissionOptions = async () => {
  const options = usePermissionOption()
  if (options.value.length > 0) {
    return options.value
  } else {
    await getFromServer(true, true, true)
    return options.value
  }
}

export const getUserSelectOption = async () => {
  const list: any = await newClientApi.postUcenterUsers().then((res) => res.data)
  if (list.length === 0) return []

  return list.map((item: any) => ({
    value: item.userId,
    label: item.username,
    email: item.email
  }))
}

export const getRoleSelectOption = async () => {
  try {
    const list: any = await newClientApi.postDocpalAclRoleList([{
      column: 'status',
      type: 'EQ',
      values: '1'
    }]).then((res: any) => res.data)
    if (list.length === 0) return []

    return list.map((item: any) => ({
      value: item.id,
      label: item.name
    }))
  } catch (e) {
    console.log(e)
    return []
  }
}

export const getGroupsSelectOption = async () => {
  let list: any = await newClientApi.postUcenterGroups().then((res) => res.data)
  if (list.length === 0) return []

  return list.map((item: any) => ({
    value: item.id,
    label: item.name
  }))
}
