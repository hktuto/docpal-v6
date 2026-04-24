import { newClientApi } from 'api'

interface PermissionOption {
  id: string;
  label: string;
  value: number;
  type: string;
  options: any[];
}

export interface BaseOption {
  value: string,
  label: string,
  email?: string
}

export const usePermissionOption = () => useState<PermissionOption[]>('permission', () => ([]))
export const useUserPermissionOption = () => useState<BaseOption[]>('userPermission', () => ([]))
export const useRolePermissionOption = () => useState<BaseOption[]>('rolePermission', () => ([]))
export const useGroupsPermissionOption = () => useState<BaseOption[]>('groupsPermission', () => ([]))

export const getFromServer = async function(loadUserList: boolean = true, loadRoleList: boolean = true, loadGroupList: boolean = true) {
  const options = usePermissionOption()
  options.value = []
  try {
    if (loadUserList) {
      const user = await getUserSelectOption(false)
      if (user.length > 0) {
        options.value.push(
          {
            id: 'user',
            label: $t('user_users'),
            value: 1,
            type: 'select',
            options: user
          }
        )
      }
    }

    if (loadRoleList) {
      const role = await getRoleSelectOption(false)
      if (role.length > 0) {
        options.value.push(
          {
            id: 'role',
            label: $t('user_role'),
            value: 2,
            type: 'select',
            options: role
          }
        )
      }
    }

    if (loadGroupList) {
      const group = await getGroupsSelectOption(false)
      if (group.length > 0) {
        options.value.push(
          {
            id: 'group',
            label: $t('user_groups'),
            value: 3,
            type: 'select',
            options: group
          }
        )
      }
    }
  } catch (e) {
    console.log(e)
  }
  console.log('options.value', options.value)
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
      let id = option.value
      switch (item.id) {
        case 'user':
          id = `user_${id}`
          break
        case 'role':
          id = `role_${id}`
          break
        case 'group':
          id = `group_${id}`
          break
      }
      return { value: id, label: option.label }
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
export const getUserSelectOption = async (refresh?: boolean) => {
  const options = useUserPermissionOption()
  if (options.value.length === 0 || refresh) {
    try {
      const list: any = await newClientApi.postUcenterUsers().then((res) => res.data)
      if (list.length === 0) return []

      options.value = list.map((item: any) => ({
        id: item.userId,
        value: item.userId,
        label: item.username || item.userName || item.name || '',
        email: item.email
      })).sort((a: any, b: any) => a.label.localeCompare(b.label))
    } catch (e) {
      console.log(e)
      return []
    }
  }
  return options.value
}

// Role Select Option
export const getRoleSelectOption = async (refresh?: boolean) => {
  const options = useRolePermissionOption()
  if (options.value.length === 0 || refresh) {
    try {
      const list: any = await newClientApi.postDocpalAclRoleList([{
        column: 'status',
        type: 'EQ',
        values: '1'
      }]).then((res: any) => res.data)
      if (list.length === 0) return []

      options.value = list.map((item: any) => ({
        id: item.id,
        value: item.id,
        label: item.name
      })).sort((a: any, b: any) => a.label.localeCompare(b.label))
    } catch (e) {
      console.log(e)
      return []
    }
  }
  return options.value
}

// Group Select Option
export const getGroupsSelectOption = async (refresh?: boolean) => {
  const options = useGroupsPermissionOption()
  if (options.value.length === 0 || refresh) {
    try {
      let list: any = await newClientApi.postUcenterGroups().then((res) => res.data)
      if (list.length === 0) return []

      options.value = list.map((item: any) => ({
        id: item.id,
        value: item.id,
        label: item.name
      })).sort((a: any, b: any) => a.label.localeCompare(b.label))
    } catch (e) {
      console.log(e)
      return []
    }
  }
  return options.value
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
