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

  async function getUserProject() {
    // TODO: wait for api
  }

  onMounted(() => {
    getUserProject()
  })

  return {
    projects,
    filter
  }
}
