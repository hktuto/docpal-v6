import { newClientApi } from 'api'
import type { OrgNode } from '../components/rbac/OrgChart/X6/types'

const useRoleTree = () => useState<OrgNode[]>('role-tree', () => ([]))
const useFlatRole = () => useState<any[]>('flat-role', () => ([]))
export const useRBAC = (roleId?: string) => {
  const loading = ref(false)
  const roleTree = useRoleTree()
  const flatRole = useFlatRole()

  async function getRoleTree() {
    loading.value = true
    try {
      if (roleId) {
        // const roleIdArray = Array.isArray(roleIds) ? roleIds : [roleIds]
        // normalize roleIds to array
        const data: any = await newClientApi.getDocpalAclRoleHierarchyRoleid(roleId).then((res: any) => res.data) as OrgNode[]
        roleTree.value = data.children || []
        console.log(roleTree)
      } else {
        const data = await newClientApi.getDocpalAclRoleRoot().then((res: any) => res.data) as OrgNode
        roleTree.value = data ? [data] : []
      }
      flatRole.value = makeFlapRoleList([...roleTree.value])
    } catch (error) {
      console.error(error)
    } finally {
      loading.value = false
    }
  }

  function makeFlapRoleList(data: OrgNode[], roleList: any[] = []) {
    data.forEach(node => {
      roleList.push(node)
      if (node.children) {
        makeFlapRoleList(node.children, roleList)
      }
    })
    return roleList
  }

  onMounted(async () => {
    if (roleTree.value.length === 0) {
      await getRoleTree()
    }
  })
  return {
    getRoleTree,
    roleTree,
    flatRole,
    loading
  }
}

function flatMap(arr: any[]) {
  return arr.reduce((acc, item) => {
    acc.push(item.label)
    if (item.child) {
      acc = acc.concat(flatMap(item.child))
    }
    return acc
  }, [])
}

export const seedUser = async () => {
  const roles = useRoleList()
  const users = useUserList()
  // create flat roles
  const roleList = flatMap(roles.value)
  // get user from fake api
  const userList = await fetch('https://jsonplaceholder.typicode.com/users', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => res.json())

  const roleLength = roleList.length
  users.value = userList.map((user) => {
    const role = roleList[Math.floor(Math.random() * roleLength)]
    return {
      username: user.username,
      firstName: user.name.split(' ')[0],
      lastName: user.name.split(' ')[1],
      email: user.email,
      role: role
    }
  }) as User[]
}

export const seedRole = () => {
  const roles = useRoleList()
  roles.value = [
    {
      label: 'CEO',
      child: [
        {
          label: 'Managing Director',
          child: [
            {
              label: 'Advisor',
              child: []
            },
            {
              label: 'Assistant MD',
              child: [
                {
                  label: 'Marketing Director',
                  child: [
                    {
                      label: 'Marketing Manager',
                      child: [
                        {
                          label: 'Marketing Analyst',
                          child: []
                        },
                        {
                          label: 'Marketing Planner',
                          child: []
                        },
                        {
                          label: 'clerk',
                          child: []
                        }
                      ]
                    }
                  ]
                },
                {
                  label: 'Finance Director',
                  child: [
                    {
                      label: 'Manager',
                      child: [
                        {
                          label: 'Analyst',
                          child: []
                        },
                        {
                          label: 'Planner',
                          child: []
                        },
                        {
                          label: 'clerk',
                          child: []
                        }
                      ]
                    }
                  ]
                },
                {
                  label: 'HR Director',
                  child: [
                    {
                      label: 'Manager',
                      child: [
                        {
                          label: 'Talent Acquisitio',
                          child: []
                        },
                        {
                          label: 'Compensation & Benefits',
                          child: []
                        },
                        {
                          label: 'Operatior',
                          child: []
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
