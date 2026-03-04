export const useAdminProject = () => useState('adminProject', () => [])
export const useAdminListFilter = () =>
  useState<{
    name: string
    statusList: ('A' | 'I')[]
  }>('adminListFilter', () => ({
    name: '',
    statusList: ['A', 'I']
  }))

export const useAdminScan = () => {
  const projects = useAdminProject()
  const filter = useAdminListFilter()

  return {
    projects,
    filter
  }
}
