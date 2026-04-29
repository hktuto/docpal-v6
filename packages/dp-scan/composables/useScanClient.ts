import { clientApi } from 'api'

const useUsetProject = () => useState<any[]>('use-scan-project', () => [])
const useProjectLoading = () => useState<boolean>('use-scan-project-loading', () => false)
export type ProjectPermission = {
  id: string
  name: string
}

export type ProjectsPermissions = {
  creator: ProjectPermission[]
  verifier: ProjectPermission[]
  exporter: ProjectPermission[]
  admin: ProjectPermission[]
}

export const useUserProjectPremission = () =>
  useState<ProjectsPermissions>('use-scan-project-permission', () => ({
    creator: [],
    verifier: [],
    exporter: [],
    admin: []
  }))

/**
 * Permission types for scan client
 * - creator: can create new batch from project
 * - verifier: can edit batch form and confirm batch
 * - exporter: can export batch
 * - admin: can cancel batch
 */
export type ScanClientPermission = 'creator' | 'verifier' | 'exporter' | 'admin'

/**
 * Check if user has specific permission for a project
 * @param projectsPermissions - The permissions ref from useUserProjectPremission
 * @param projectId - The project ID to check
 * @param permission - The permission type to check
 * @returns boolean indicating if user has the permission
 */
export const hasProjectPermission = (
  projectsPermissions: Ref<ProjectsPermissions>,
  projectId: string | undefined | null,
  permission: ScanClientPermission
): boolean => {
  if (!projectId) return false
  return projectsPermissions.value[permission]?.some((project) => project.id === projectId) || false
}

/**
 * Check if user has any of the specified permissions for a project
 * @param projectsPermissions - The permissions ref from useUserProjectPremission
 * @param projectId - The project ID to check
 * @param permissions - Array of permission types to check
 * @returns boolean indicating if user has any of the permissions
 */
export const hasAnyProjectPermission = (
  projectsPermissions: Ref<ProjectsPermissions>,
  projectId: string | undefined | null,
  permissions: ScanClientPermission[]
): boolean => {
  if (!projectId) return false
  return permissions.some((permission) => hasProjectPermission(projectsPermissions, projectId, permission))
}

export const useUserListFilter = () =>
  useState<any>('use-scan-user-list-filter', () => ({
    filter: '',
    projectId: [],
    status: [],
    createdAtStart: '',
    createdAtEnd: '',
    updatedAtStart: '',
    updatedAtEnd: '',
    orderBy: 'updatedAt',
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
        if (project && project.id) {

          allProjects.set(project.id, project)
        }
      })
    })
    projects.value = Array.from(allProjects.values()) as any[]
    if (!filter.value.projectId ||　!filter.value.projectId.length && projects.value.length) {
      filter.value.projectId = projects.value[0].id
      // set default status filter base on project permission
      // const projectPermission = [];
      if (isAdmin(filter.value.projectId)) {
        filter.value.status = []
      } else {
        let result = new Set()
        if(isExporter(filter.value.projectId)) {
          result.add('exportReady')
        }
        if (isVerifier(filter.value.projectId)) {
          result.add('failed')
          result.add('verification')
        }
        if (isCreator(filter.value.projectId)) {
          result.add('processing')
          result.add('failed')
           result.add('verification')
        }
        filter.value.status = Array.from(result)
      }

      console.log("StatusMap", StatusMap, filter.value.status)
    }

    projectLoading.value = false
    // update
  }

  onMounted(() => {
    if (!projectLoading.value && projects.value.length ===0) {
      getUserProject()
    }
  })

  /**
   * Check if user is a creator for a specific project
   * @param projectId - The project ID to check
   */
  const isCreator = (projectId: string | undefined | null): boolean => {
    return hasProjectPermission(projectsPermissions, projectId, 'creator') || hasProjectPermission(projectsPermissions, projectId, 'admin')
  }

  /**
   * Check if user is a verifier for a specific project
   * @param projectId - The project ID to check
   */
  const isVerifier = (projectId: string | undefined | null): boolean => {

    return hasProjectPermission(projectsPermissions, projectId, 'verifier') || hasProjectPermission(projectsPermissions, projectId, 'admin')
  }

  /**
   * Check if user is an exporter for a specific project
   * @param projectId - The project ID to check
   */
  const isExporter = (projectId: string | undefined | null): boolean => {
    return hasProjectPermission(projectsPermissions, projectId, 'exporter')
  }

  /**
   * Check if user is an admin for a specific project
   * @param projectId - The project ID to check
   */
  const isAdmin = (projectId: string | undefined | null): boolean => {
    return hasProjectPermission(projectsPermissions, projectId, 'admin')
  }

  return {
    projects,
    projectsPermissions,
    filter,
    isCreator,
    isVerifier,
    isExporter,
    isAdmin
  }
}
