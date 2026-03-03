import { clientApi } from 'api'

const useUsetProject = () => useState<any[]>('use-scan-project', () => [])
const useUserProjectPremission = () =>
  useState('use-scan-project-permission', () => ({
    creator: [],
    verifier: [],
    exporter: [],
    admin: []
  }))
const useUserListFilter = () =>
  useState('use-scan-user-list-filter', () => ({
    filter: '',
    projectId: [],
    status: [],
    createdAtStart: '',
    createdAtEnd: '',
    updatedAtStart: '',
    updatedAtEnd: '',
    orderBy: 'createdAt',
    isDesc: true
  }))
export const useScanClient = () => {
  const projects = useUsetProject()
  const projectsPermissions = useUserProjectPremission()
  const filter = useUserListFilter()
  const userId = useUserId()
  async function getUserProject() {
    // TODO: wait for api
    const { data } = (await clientApi.api.getCaptureProjUserUserid(userId.value)) as any

    projectsPermissions.value = data
    const allProjects = new Map()
    Object.keys(data).forEach((key) => {
      data[key].forEach((project: any) => {
        allProjects.set(project.id, project)
      })
    })
    projects.value = Array.from(allProjects.values())
  }

  onMounted(() => {
    getUserProject()
  })

  return {
    projects,
    filter
  }
}
