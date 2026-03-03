import { clientApi } from 'api'

const useUsetProject = () => useState('use-scan-project', () => [])
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
  const filter = useUserListFilter()
  const userId = useUserId()
  async function getUserProject() {
    // TODO: wait for api
    // const { data } = await clientApi.api.postCaptureProjUser({
    //   userId: userId.value
    // })
    projects.value = []
  }

  onMounted(() => {
    getUserProject()
  })

  return {
    projects,
    filter
  }
}
