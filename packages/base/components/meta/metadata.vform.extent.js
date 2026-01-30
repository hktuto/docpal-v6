export function mounteRoleOptions(isRole = false, isGroup = false, isUser = false) {
  const codeString = `const _this = this
async function getOptions() {
  const options = []
  if (${isGroup}) {
    options.push({ value: 'user_groups', label: $i18n.t('user_groups'), options: await getGroupList() })
  }
  if (${isUser}) {
    options.push({ value: 'user_users', label: $i18n.t('user_users'), options: await getUserList() })
  }
  if (${isRole}) {
    options.push({ value: 'user_roles', label: $i18n.t('user_role'), options: await getRoleList() })
  }
  if(options.length === 1) { 
    _this.loadOptions(options[0].options)
  } else {
    _this.loadOptions(options)
  }
}
async function getUserList() {
  const data = await $api.post('/api/ucenter/users', {}).then((res) => res.data.data)
  return data.reduce((prev, item) => {
    if (item.userId)
      prev.push({
        label: item.username,
        value: item.userId,
        type: 'user'
      })
    return prev
  }, [])
}
async function getGroupList() {
  const data = await $api.post('/api/ucenter/groups', {}).then((res) => res.data.data)
  return data.reduce((prev, item) => {
    if (item.id)
      prev.push({
        label: item.name,
        value: item.id,
        type: 'group'
      })
    return prev
  }, [])
}
async function getRoleList() {
  try {
    const data = await $api.get('/api/docpal/acl/role/root').then((res) => res.data.data)
    const roleList = data ? makeFlapRoleList([data]) : []
    return roleList.map((item) => ({
      label: item.name,
      value: item.id,
      type: 'role'
    }))
  } catch (error) {
    console.error(error)
    return []
  }
}

function makeFlapRoleList(data, roleList = []) {
  data.forEach((node) => {
    const _node = { ...node }
    delete _node.children
    roleList.push(_node)
    if (node.children) {
      makeFlapRoleList(node.children, roleList)
    }
  })
  return roleList
}
getOptions()
  `
  return codeString
}
export function mounteMasterTableOptions(masterTableId, displayColumn, valueColumn) {
  const codeString = `const _this = this
async function getList() {
  try {
    const data = await $api.post('/dms/master-tables/record/page/nonPermission', {
      name: '${masterTableId}'
    }).then(res => res.data.data)
    return data.reduce((prev, item) => {
      if (!item.${displayColumn} || !item.${valueColumn} || prev.find(p => p.value === item.${valueColumn})) return prev
      const resultItem = {
        value: item.${valueColumn},
        label: item.${displayColumn} || '',
        disabled: !item.status
      }
      prev.push(resultItem)
      return prev
    }, []).sort((a, b) => (a.label.localeCompare(b.label)))
  } catch (e) { return [] }
}
async function init() {
  const options = await getList()
  _this.loadOptions(options)
}
init()
  `
  return codeString
}
