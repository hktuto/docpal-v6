import { clientApi } from 'api'

const useUsetProject = () => useState<any[]>('use-scan-project', () => [])
const useProjectLoading = () => useState<boolean>('use-scan-project-loading', () => false)
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
  const projectLoading = useProjectLoading()
  async function getUserProject() {
    // TODO: wait for api
    projectLoading.value = true
    const { data } = (await clientApi.api.getCaptureProjUserUserid(userId.value)) as any

    projectsPermissions.value = data
    const allProjects = new Map()
    Object.keys(data).forEach((key) => {
      data[key].forEach((project: any) => {
        allProjects.set(project.id, project)
      })
    })
    projects.value = Array.from(allProjects.values())
    filter.value.projectId = projects.value.map((p) => p.id)
    projectLoading.value = false
    console.log('filter.value', filter.value)
  }

  onMounted(() => {
    if (!projectLoading.value) {
      getUserProject()
    }
  })

  return {
    projects,
    filter
  }
}
