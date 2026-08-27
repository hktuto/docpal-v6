export type AllPermission = {
  permission: Permission
  print: boolean
  hold: any
  retention: any
}
export type Permission = 'Read' | 'ReadWrite' | 'ManageRecord' | 'ManageLegalHold' | 'Everything' | 'ACL-ReadWrite'
/**
 * A: active
 * D: de-active
 * R: remove
 * P: pending add
 * L: pending remove
 */
export type HoldStatus = 'A' | 'D' | 'R' | 'P' | 'L' | ''
const PermissionArray: Permission[] = ['Read', 'ACL-ReadWrite', 'ReadWrite', 'ManageRecord', 'ManageLegalHold', 'Everything']

type AllowToArgs = {
  feature: Permission
  permission: AllPermission
}

export const AllowTo = ({ feature, permission }: AllowToArgs) => {
  if (feature === 'Read') return true
  if (!permission) {
    console.log('permission is null')
    return false
  }
  // 针对 hold-policy, 仅 acl 为 ReadWrite 权限时显示
  if (feature !== 'ACL-ReadWrite') {
    if (!!permission.hold && ['A', 'L', 'P'].includes(permission.hold.status)) return false
  }
  if (!!permission.retention && permission.retention.status) return false
  const userPermission = permission.permission
  // ['A', 'L', 'P'].includes(holdStatus)
  // FIXME: Y add this?
  // if (!userPermission || feature === 'Read') {
  //     return false;
  // }
  console.log('check permission', PermissionArray.indexOf(userPermission) >= PermissionArray.indexOf(feature))
  return PermissionArray.indexOf(userPermission) >= PermissionArray.indexOf(feature)
}
export type rbacPermission =
  | 'viewFolder'
  | 'viewMetadata'
  | 'print'
  | 'download'
  | 'read'
  | 'write'
  | 'editSubContent'
  | 'editMetadata'
  | 'share'
  | 'createSubFolder'
  | 'create'
  | 'delete'
  | 'deleteSubContent'
  | 'assignPermission'
  | 'addUserSet'
  | 'normal'
  | 'hold-write'
export enum RbacPermission {
  viewFolder = 1,
  viewMetadata = 2,
  print = 3,
  download = 4,
  read = 5,
  write = 6,
  editSubContent = 7,
  editMetadata = 8,
  share = 9,
  createSubFolder = 10,
  create = 11,
  delete = 12,
  deleteSubContent = 13,
  assignPermission = 14,
  addUserSet = 15,
  normal = 16,
  holdWrite = 17
}
const permissionOptions = [
  { label: 'rbac.permission.viewFolder', value: RbacPermission.viewFolder, group: 'read', name: 'viewFolder' },
  { label: 'rbac.permission.viewMetadata', value: RbacPermission.viewMetadata, group: 'read', name: 'viewMetadata' },
  { label: 'rbac.permission.print', value: RbacPermission.print, group: 'read', name: 'print', isFolder: 'false' },
  { label: 'rbac.permission.download', value: RbacPermission.download, group: 'read', name: 'download', isFolder: 'false' },
  { label: 'rbac.permission.read', value: RbacPermission.read, group: 'read', name: 'read' },

  { label: 'rbac.permission.editFolder', value: RbacPermission.write, group: 'write', name: 'write' },
  { label: 'rbac.permission.editSubContent', value: RbacPermission.editSubContent, group: 'write', name: 'editSubContent', isFolder: 'true' },
  { label: 'rbac.permission.editMetadata', value: RbacPermission.editMetadata, group: 'write', name: 'editMetadata' },
  { label: 'share.share', value: RbacPermission.share, group: 'write', name: 'share' },

  { label: 'rbac.permission.createFolder', value: RbacPermission.createSubFolder, group: 'write', name: 'createSubFolder', isFolder: 'true' },
  { label: 'rbac.permission.createFile', value: RbacPermission.create, group: 'write', name: 'create', isFolder: 'true' },

  { label: 'rbac.permission.deleteFolder', value: RbacPermission.delete, group: 'manage', name: 'delete' },
  { label: 'rbac.permission.deleteSubContent', value: RbacPermission.deleteSubContent, group: 'manage', name: 'deleteSubContent', isFolder: 'true' },
  { label: 'rbac.permission.assignPermission', value: RbacPermission.assignPermission, group: 'manage', name: 'assignPermission' },
  { label: 'rbac.permission.addUserSet', value: RbacPermission.addUserSet, group: 'manage', name: 'addUserSet' }
]
export const RbacAllowTo = (
  rbacPermission: rbacPermission | any,
  docDetail: any,
  isFolder: boolean | '' = ''
): boolean => {
  // trash document is not editable
  if (!docDetail || docDetail.status === 20) return false
  const permissionIds = docDetail?.permissionIds || []
  if (!permissionIds) return false
  if (['normal', 'read'].includes(rbacPermission)) return true
  
  // hold status is A, L, P, return false,hold folder is not editable
  if (!['hold-write'].includes(rbacPermission)) {
    if (!!docDetail.hold && ['A', 'L', 'P'].includes(docDetail.hold.status)) return false
  } else {
    rbacPermission = 'write'
  }
  if(!Array.isArray(permissionIds)) {
    console.error('permissionIds', permissionIds)
  }
  return permissionIds.some((id: number) => {
    const option = permissionOptions.find((opt) => {
      const optIsFolder = opt.isFolder !== 'false'
      const folderMatch = isFolder === '' || Boolean(isFolder) === optIsFolder || !('isFolder' in opt)
      return opt.value === id && folderMatch
    })

    return option && (option.name === rbacPermission || option.value === rbacPermission)
  })
}
