import { adminApi, clientApi } from 'api'

export type menuTypeSetting = {
  id: string,
  name: string,
  label: string,
  icon: string,
  hoverIcon?: string,
  component: string,
  feature?: string,
  handleError?: boolean,
  props: {
    [key: string]: any
  },
  createRouteItem: (params?: any) => {},
  shouldReplace: (oldSetting: menuTypeSetting, newSetting: menuTypeSetting) => {}
}

export const getMenuItemByComponent = (componentName: string) => {
  return Object.values(allMenuItem).find(item => item.component === componentName) || null
}

export const allMenuItem: Record<string, menuTypeSetting> = {
  'admin/acl': {
    id: 'admin-acl',
    name: 'admin-acl',
    label: 'adminMenu.ACL',
    icon: 'dp-icon:acl',
    hoverIcon: 'dp-icon:acl',
    component: 'LazyAclPage',
    feature: 'CORE',
    props: {},
    createRouteItem: async ({ id, expandedItems }) => {
      return {
        id: 'admin-acl',
        name: 'admin-acl',
        label: 'adminMenu.ACL',
        icon: 'dp-icon:acl',
        hoverIcon: 'dp-icon:acl',
        component: 'LazyAclPage',
        feature: 'CORE',
        props: {
          id: id,
          expandedItems: expandedItems
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'admin/audit': {
    id: 'admin-audit',
    name: 'admin-audit',
    label: 'adminMenu.audit',
    icon: 'dp-icon:slog',
    hoverIcon: 'dp-icon:slog',
    component: 'LazyAuditPage',
    feature: 'AUDIT',
    props: {},
    createRouteItem: async () => {
      return {
        id: 'admin-audit',
        name: 'admin-audit',
        label: 'adminMenu.audit',
        icon: 'dp-icon:slog',
        hoverIcon: 'dp-icon:slog',
        component: 'LazyAuditPage',
        feature: 'AUDIT',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/azure': {
    id: 'admin-azure',
    name: 'admin-azure',
    label: 'adminMenu.azure',
    icon: 'teenyicons:azure-solid',
    hoverIcon: 'teenyicons:azure-solid',
    component: 'LazyAzurePage',
    feature: 'AZURE_OCR',
    props: {},
    createRouteItem: async () => {
      return {
        id: 'admin-azure',
        name: 'admin-azure',
        label: 'adminMenu.azure',
        icon: 'teenyicons:azure-solid',
        hoverIcon: 'teenyicons:azure-solid',
        component: 'LazyAzurePage',
        feature: 'AZURE_OCR',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  // TODO 未使用
  'admin/bulk-import': {
    id: 'admin-bulk-import',
    name: 'bulkImportConfig',
    label: 'adminMenu.bulkImportConfig',
    icon: 'flowbite:file-import-outline',
    hoverIcon: 'flowbite:file-import-solid',
    component: 'LazyBulkImportPage',
    feature: 'BULK_IMPORT',
    props: {
      pageNum: 0,
      pageSize: 20,
      orderBy: 'documentType',
      isDesc: false,
      filters: {}
    },
    createRouteItem: async (filters) => {
      return {
        id: 'admin-bulk-import',
        name: 'bulkImportConfig',
        label: 'adminMenu.bulkImportConfig',
        icon: 'flowbite:file-import-outline',
        hoverIcon: 'flowbite:file-import-solid',
        component: 'LazyBulkImportPage',
        feature: 'BULK_IMPORT',
        props: {
          pageNum: 0,
          pageSize: 20,
          orderBy: 'documentType',
          isDesc: false,
          filters: filters
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/bulk-import-detail': {
    id: 'admin-bulk-import-detail',
    name: 'bulk-import-detail-',
    label: 'Bulk import detail',
    icon: 'flowbite:file-import-outline',
    component: 'LazyBulkImportDetail',
    props: {
      documentType: ''
    },
    createRouteItem: async ({ documentType }) => {
      return {
        id: `bulk-import-detail-${documentType}-${Date.now()}`,
        name: `bulk-import-detail-${documentType}`,
        label: documentType,
        icon: 'flowbite:file-import-outline',
        component: 'LazyBulkImportDetail',
        props: {
          documentType: documentType
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.documentType === newSetting.props.documentType
    }
  },
  'admin/calendar-setting': {
    id: 'admin-calendar-setting',
    name: 'calendar-setting',
    label: 'adminMenu.calendarSetting',
    icon: 'lucide:calendar',
    hoverIcon: 'lucide:calendar',
    component: 'LazyCalendarSetting',
    props: {},
    createRouteItem: async () => {
      return {
        id: 'admin-calendar-setting',
        name: 'calendar-setting',
        label: 'adminMenu.calendarSetting',
        icon: 'lucide:calendar',
        hoverIcon: 'lucide:calendar',
        component: 'LazyCalendarSetting',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/case-management': {
    id: 'admin-case-management',
    name: 'admin-case-management-list',
    label: 'adminMenu.caseManagement',
    icon: 'dp-icon:case',
    hoverIcon: 'dp-icon:case',
    component: 'LazyCaseManagementList',
    feature: 'WORKFLOW',
    props: {
      pageNum: 0,
      pageSize: 20,
      orderBy: 'modifiedDate',
      isDesc: true
    },
    createRouteItem: async ({ caseId }) => {
      return {
        id: 'admin-case-management',
        name: 'admin-case-management-list',
        label: 'adminMenu.caseManagement',
        icon: 'dp-icon:case',
        hoverIcon: 'dp-icon:case',
        component: 'LazyCaseManagementList',
        feature: 'WORKFLOW',
        props: {
          pageNum: 0,
          pageSize: 20,
          orderBy: 'modifiedDate',
          isDesc: true
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/company-profile': {
    id: 'admin-company-profile',
    name: 'admin-company-profile',
    label: 'adminMenu.companyProfile',
    icon: 'octicon:organization-24',
    hoverIcon: 'octicon:organization-24',
    component: 'LazyCompanyProfilePage',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-company-profile',
        name: 'admin-company-profile',
        label: 'adminMenu.companyProfile',
        icon: 'octicon:organization-24',
        hoverIcon: 'octicon:organization-24',
        component: 'LazyCompanyProfilePage',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/company-profile-detail-versions': {
    id: `company-profile-detail-versions-${Date.now()}`,
    name: 'company-profile-detail-versions-',
    icon: 'dp-icon:flow-outline',
    label: 'versionsName',
    component: 'LazyCompanyProfileDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, name }) => {
      return {
        id: `company-profile-detail-versions-${Date.now()}`,
        name: `company-profile-detail-versions-${id}`,
        icon: 'dp-icon:flow-outline',
        label: name,
        component: 'LazyCompanyProfileDetail',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id === newSetting.props.id
    }
  },
  'admin/case-management-import-export': {
    id: 'admin-case-management-import-export',
    name: 'admin-case-management-import-export',
    label: 'adminMenu.caseManagementImportExport',
    icon: 'mdi:database-export-outline',
    hoverIcon: 'mdi:database-export',
    component: 'LazyConfigMigrationImportExport',
    props: {},
    createRouteItem: async () => {
      return {
        id: 'admin-case-management-import-export',
        name: 'admin-case-management-import-export',
        label: 'adminMenu.caseManagementImportExport',
        icon: 'mdi:database-export-outline',
        hoverIcon: 'mdi:database-export',
        component: 'LazyConfigMigrationImportExport',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/dam': {
    id: 'admin-dam',
    name: 'dam-file-conversion',
    label: 'adminMenu.DAM',
    icon: 'lucide:file-scan',
    hoverIcon: 'lucide:file-scan',
    component: 'LazyDamPage',
    feature: 'DAM_FILE_CONVERTION',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-dam',
        name: 'dam-file-conversion',
        label: 'adminMenu.DAM',
        icon: 'lucide:file-scan',
        hoverIcon: 'lucide:file-scan',
        component: 'LazyDamPage',
        feature: 'DAM_FILE_CONVERTION',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/dashboard': {
    id: 'admin-dashboard',
    name: 'dashboardManage',
    label: 'adminMenu.dashboard',
    icon: 'carbon:dashboard',
    hoverIcon: 'carbon:dashboard',
    component: 'LazyDashboardManagePage',
    feature: 'DASHBOARD',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-dashboard',
        name: 'dashboardManage',
        label: 'adminMenu.dashboard',
        icon: 'carbon:dashboard',
        hoverIcon: 'carbon:dashboard',
        component: 'LazyDashboardManagePage',
        feature: 'DASHBOARD',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/work-panel': {
    id: 'admin-work-panel',
    name: 'admin-work-panel',
    label: 'adminMenu.workPanel',
    icon: 'material-symbols:home',
    hoverIcon: 'material-symbols:home',
    component: 'LazyPersonalDashboardManagePage',
    feature: 'DASHBOARD',
    handleError: true,
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-work-panel',
        name: 'admin-work-panel',
        label: 'adminMenu.workPanel',
        icon: 'material-symbols:home',
        hoverIcon: 'material-symbols:home',
        component: 'LazyPersonalDashboardManagePage',
        feature: 'DASHBOARD',
        handleError: true,
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/dashboard-manage-detail': {
    id: `admin-dashboard-versions-${Date.now()}`,
    name: 'admin-dashboard-versions-',
    icon: 'material-symbols:dashboard-customize-outline-rounded',
    label: 'dashboard-manage-detail',
    component: 'LazyDashboardManageDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, name }) => {
      return {
        id: `admin-dashboard-versions-${Date.now()}`,
        name: `admin-dashboard-versions-${id}`,
        icon: 'material-symbols:dashboard-customize-outline-rounded',
        label: name,
        component: 'LazyDashboardManageDetail',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id === newSetting.props.id
    }
  },
  'admin/dashboard-personal-detail': {
    id: `admin-dashboard-personal-${Date.now()}`,
    name: 'admin-dashboard-personal',
    icon: 'carbon:dashboard',
    label: 'dashboard-personal-detail',
    component: 'LazyPersonalDashboardManageDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, name }) => {
      return {
        id: `admin-dashboard-personal-${Date.now()}`,
        name: `admin-dashboard-personal-${id}`,
        icon: 'carbon:dashboard',
        label: name,
        component: 'LazyPersonalDashboardManageDetail',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id === newSetting.props.id
    }
  },
  'admin/docker-log': {
    id: 'admin-docker-log',
    name: 'admin-docker-log',
    label: 'adminMenu.systemLog',
    icon: 'mdi:docker',
    hoverIcon: 'mdi:docker',
    component: 'LazyDockerLog',
    feature: 'DOCKER_LOG',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-docker-log',
        name: 'admin-docker-log',
        label: 'adminMenu.systemLog',
        icon: 'mdi:docker',
        hoverIcon: 'mdi:docker',
        component: 'LazyDockerLog',
        feature: 'DOCKER_LOG',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/document-template': {
    id: 'admin-document-template',
    name: 'document-template',
    label: 'adminMenu.template',
    icon: 'dp-icon:template',
    hoverIcon: 'dp-icon:template',
    component: 'LazyDocumentTemplatePage',
    feature: 'GENERATE_TEMPLATE',
    props: {
      pageNum: 0,
      pageSize: 20,
      orderBy: 'createdDate',
      isDesc: true
    },
    createRouteItem: async () => {
      return {
        id: 'admin-document-template',
        name: 'document-template',
        label: 'adminMenu.template',
        icon: 'dp-icon:template',
        hoverIcon: 'dp-icon:template',
        component: 'LazyDocumentTemplatePage',
        feature: 'GENERATE_TEMPLATE',
        props: {
          pageNum: 0,
          pageSize: 20,
          orderBy: 'createdDate',
          isDesc: true
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/document-template-detail': {
    id: `document-template-detail-${Date.now()}`,
    name: 'document-template-detail',
    icon: 'lucide:file-sliders',
    label: 'document-template-detail',
    component: 'LazyDocumentTemplateDetail',
    props: {
      id: '',
      name: '',
      item: '',
      isEdit: ''
    },
    createRouteItem: async ({ id, name, isEdit }) => {
      return {
        id: `document-template-detail-${Date.now()}`,
        name: `document-template-detail- ${id}`,
        icon: 'lucide:file-sliders',
        label: name,
        component: 'LazyDocumentTemplateDetail',
        props: {
          id: id,
          name: name,
          isEdit: isEdit
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'admin/document-type': {
    id: 'admin-document-type',
    name: 'admin-document-type',
    label: 'adminMenu.documentType',
    icon: 'typcn:document',
    hoverIcon: 'typcn:document',
    component: 'LazyDocTypePage',
    feature: 'CORE',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-document-type',
        name: 'admin-document-type',
        label: 'adminMenu.documentType',
        icon: 'typcn:document',
        hoverIcon: 'typcn:document',
        component: 'LazyDocTypePage',
        feature: 'CORE',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/metadata-list': {
    id: 'admin-metadata-list',
    name: 'admin-metadata-list',
    label: 'adminMenu.metadataList',
    icon: 'typcn:database',
    hoverIcon: 'typcn:database',
    component: 'LazyMetadataList',
    feature: 'CORE',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-metadata-list',
        name: 'admin-metadata-list',
        label: 'adminMenu.metadataList',
        icon: 'typcn:database',
        hoverIcon: 'typcn:database',
        component: 'LazyMetadataList',
        feature: 'CORE',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/smart-folder': {
    id: 'admin-smart-folder',
    name: 'admin-smart-folder',
    label: 'adminMenu.smartFolder',
    icon: 'material-symbols:map-search-outline-rounded',
    hoverIcon: 'material-symbols:map-search-outline-rounded',
    component: 'LazyAdminSmartFolderPage',
    feature: 'SMART_FOLDER',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-smart-folder',
        name: 'admin-smart-folder',
        label: 'adminMenu.smartFolder',
        icon: 'material-symbols:map-search-outline-rounded',
        hoverIcon: 'material-symbols:map-search-outline-rounded',
        component: 'LazyAdminSmartFolderPage',
        feature: 'SMART_FOLDER',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/document-type-versions': {
    id: `admin-document-type-versions-${Date.now()}`,
    name: 'admin-document-type-versions',
    icon: 'material-symbols:dynamic-form-outline-rounded',
    label: 'document-type-versions',
    component: 'LazyDocTypeDetail',
    props: {
      name: '',
      id: ''
    },
    createRouteItem: async ({ id, name }) => {
      return {
        id: `admin-document-type-versions-${Date.now()}`,
        name: `admin-document-type-versions-${id}`,
        icon: 'material-symbols:dynamic-form-outline-rounded',
        label: name,
        component: 'LazyDocTypeDetail',
        props: {
          name: name,
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'admin/smart-folder-versions': {
    id: `admin-smart-folder-versions-${Date.now()}`,
    name: 'admin-smart-folder-versions',
    icon: 'fluent:folder-people-24-regular',
    label: 'smart-folder-versions',
    component: 'LazyAdminSmartFolderDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, name }) => {
      return {
        id: `admin-smart-folder-versions-${Date.now()}`,
        name: `admin-smart-folder-versions-${id}`,
        icon: 'fluent:folder-people-24-regular',
        label: name,
        component: 'LazyAdminSmartFolderDetail',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'admin/easy-form': {
    id: 'admin-easy-form',
    name: 'admin-easy-form',
    label: 'adminMenu.easyForm',
    icon: 'material-symbols-light:table-edit-rounded',
    hoverIcon: 'material-symbols-light:table-edit-rounded',
    component: 'LazyAdminEasyFormPage',
    feature: 'WORKFLOW',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-easy-form',
        name: 'admin-easy-form',
        label: 'adminMenu.easyForm',
        icon: 'material-symbols-light:table-edit-rounded',
        hoverIcon: 'material-symbols-light:table-edit-rounded',
        component: 'LazyAdminEasyFormPage',
        feature: 'WORKFLOW',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/easy-form-detail': {
    id: `easy-form-detail-versions-${Date.now()}`,
    name: 'easy-form-detail-versions',
    icon: 'material-symbols-light:table-edit-rounded',
    label: 'easy-form-detail',
    component: 'LazyAdminEasyFormDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, name }) => {
      return {
        id: `easy-form-detail-versions-${Date.now()}`,
        name: `easy-form-detail-versions-${id}`,
        icon: 'material-symbols-light:table-edit-rounded',
        label: name,
        component: 'LazyAdminEasyFormDetail',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'admin/easy-form-designer': {
    id: `easy-form-designer-versions-${Date.now()}`,
    name: 'easy-form-designer-versions',
    icon: 'material-symbols-light:table-edit-rounded',
    label: 'easy-form-designer',
    component: 'LazyAdminEasyFormDesigner',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, name }) => {
      return {
        id: `easy-form-designer-versions-${Date.now()}`,
        name: `easy-form-designer-versions-${id}`,
        icon: 'material-symbols-light:table-edit-rounded',
        label: name,
        component: 'LazyAdminEasyFormDesigner',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'admin/email-template': {
    id: 'admin-email-template',
    name: 'admin-email-template',
    label: 'adminMenu.emailTemplate',
    icon: 'dp-icon:envelope',
    hoverIcon: 'dp-icon:envelope',
    component: 'LazyEmailTemplatePage',
    feature: 'EMAIL_TEMPLATE',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-email-template',
        name: 'admin-email-template',
        label: 'adminMenu.emailTemplate',
        icon: 'dp-icon:envelope',
        hoverIcon: 'dp-icon:envelope',
        component: 'LazyEmailTemplatePage',
        feature: 'EMAIL_TEMPLATE',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/email-template-detail': {
    id: `admin-email-template-detail-versions-${Date.now()}`,
    name: 'admin-email-template-detail-versions',
    icon: 'fluent:mail-template-16-regular',
    label: 'email-template-detail',
    component: 'LazyEmailTemplateDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, name }) => {
      return {
        id: `admin-email-template-detail-versions-${Date.now()}`,
        name: `admin-email-template-detail-versions-${id}`,
        icon: 'fluent:mail-template-16-regular',
        label: id,
        component: 'LazyEmailTemplateDetail',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'admin/email-layout-template': {
    id: `admin-email-layout-template-${Date.now()}`,
    name: 'admin-email-layout-template',
    icon: 'fluent:mail-template-16-regular',
    label: 'emailTemplate.layout',
    component: 'LazyLayoutTemplatePage',
    props: {},
    createRouteItem: async () => {
      return {
        id: `admin-email-layout-template-${Date.now()}`,
        name: 'admin-email-layout-template',
        icon: 'fluent:mail-template-16-regular',
        label: 'emailTemplate.layout',
        component: 'LazyLayoutTemplatePage',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/external-connection': {
    id: 'admin-external-connection',
    name: 'admin-external-connection',
    label: 'adminMenu.externalConnection',
    icon: 'fluent:communication-person-20-regular',
    hoverIcon: 'fluent:communication-person-20-regular',
    component: 'LazyExternalConnectionPage',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-external-connection',
        name: 'admin-external-connection',
        label: 'adminMenu.externalConnection',
        icon: 'fluent:communication-person-20-regular',
        hoverIcon: 'fluent:communication-person-20-regular',
        component: 'LazyExternalConnectionPage',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/external-storage': {
    id: 'admin-external-storage',
    name: 'aadmin-external-storage',
    label: 'adminMenu.externalStorage',
    icon: 'carbon:volume-block-storage',
    hoverIcon: 'carbon:volume-block-storage',
    component: 'LazyExternalStoragePage',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-external-storage',
        name: 'aadmin-external-storage',
        label: 'adminMenu.externalStorage',
        icon: 'carbon:volume-block-storage',
        hoverIcon: 'carbon:volume-block-storage',
        component: 'LazyExternalStoragePage',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/external-storage-detail': {
    id: `external-storage-detail-versions-${Date.now()}`,
    name: 'external-storage-detail-versions',
    icon: 'dp-icon:flow-outline',
    label: 'external-storage-detail',
    component: 'LazyExternalStorageDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, name }) => {
      return {
        id: `external-storage-detail-versions-${Date.now()}`,
        name: `external-storage-detail-versions-${id}`,
        icon: 'dp-icon:flow-outline',
        label: name,
        component: 'LazyExternalStorageDetail',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'admin/external-storage-profile-detail': {
    id: `external-storage-profile-detail-versions-${Date.now()}}`,
    name: 'external-storage-profile-detail-versions',
    icon: 'dp-icon:flow-outline',
    label: '',
    component: 'LazyExternalStorageProfileDetail',
    props: {
      id: '',
      storageId: ''
    },
    createRouteItem: async ({ id, name, storageId }) => {
      return {
        id: `external-storage-profile-detail-versions-${Date.now()}}`,
        name: `external-storage-profile-detail-versions-${id}`,
        icon: 'dp-icon:flow-outline',
        label: name,
        component: 'LazyExternalStorageProfileDetail',
        props: {
          id: id,
          storageId: storageId
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id === newSetting.props.id && oldSetting.props.storageId === newSetting.props.storageId
    }
  },
  'admin/hold-policies': {
    id: 'admin-hold-policies',
    name: 'admin-hold-policies',
    label: 'adminMenu.holdPoliciesManage',
    icon: 'dp-icon:hold',
    hoverIcon: 'dp-icon:hold',
    component: 'LazyAdminHoldPage',
    feature: 'HOLD_POLICIES',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-hold-policies',
        name: 'admin-hold-policies',
        label: 'adminMenu.holdPoliciesManage',
        icon: 'dp-icon:hold',
        hoverIcon: 'dp-icon:hold',
        component: 'LazyAdminHoldPage',
        feature: 'HOLD_POLICIES',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/retention-policies': {
    id: 'admin-retention-policies',
    name: 'admin-retention-policies',
    label: 'adminMenu.retention',
    icon: 'dp-icon:retention',
    hoverIcon: 'dp-icon:retention',
    component: 'LazyAdminRetentionPage',
    feature: 'RETENTION_POLICIES',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-retention-policies',
        name: 'admin-retention-policies',
        label: 'adminMenu.retention',
        icon: 'dp-icon:retention',
        hoverIcon: 'dp-icon:retention',
        component: 'LazyAdminRetentionPage',
        feature: 'RETENTION_POLICIES',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/retention-detail': {
    id: `admin-retention-detail-versions-${Date.now()}`,
    name: 'admin-retention-detail-versions',
    icon: 'streamline:interface-lock-shield-combination-combo-lock-locked-padlock-secure-security-shield-keyhole',
    label: 'retention-detail',
    component: 'LazyAdminRetentionDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, policyName }) => {
      return {
        id: `admin-retention-detail-versions-${Date.now()}`,
        name: `admin-retention-detail-versions-${id}`,
        icon: 'streamline:interface-lock-shield-combination-combo-lock-locked-padlock-secure-security-shield-keyhole',
        label: policyName,
        component: 'LazyAdminRetentionDetail',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'admin/folder-cabinet': {
    id: 'admin-folder-cabinet',
    name: 'admin-folder-cabinet',
    label: 'adminMenu.folderCabinet',
    icon: 'icon-park-outline:document-folder',
    hoverIcon: 'icon-park-outline:document-folder',
    component: 'LazyAdminFolderCabinetPage',
    feature: 'FOLDER_CABINET',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-folder-cabinet',
        name: 'admin-folder-cabinet',
        label: 'adminMenu.folderCabinet',
        icon: 'icon-park-outline:document-folder',
        hoverIcon: 'icon-park-outline:document-folder',
        component: 'LazyAdminFolderCabinetPage',
        feature: 'FOLDER_CABINET',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/folder-cabinet-detail': {
    id: `admin-folder-cabinet-detail-versions-${Date.now()}`,
    name: 'admin-folder-cabinet-detail-versions',
    icon: 'icon-park-outline:document-folder',
    label: 'folder-cabinet-detail',
    component: 'LazyAdminFolderCabinetDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, label }) => {
      return {
        id: `admin-folder-cabinet-detail-versions-${Date.now()}`,
        name: `admin-folder-cabinet-detail-versions-${id}`,
        icon: 'icon-park-outline:document-folder',
        label: label,
        component: 'LazyAdminFolderCabinetDetail',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'admin/import-jobs': {
    id: 'admin-import-jobs',
    name: 'admin-import-jobs',
    label: 'adminMenu.importJobs',
    icon: 'hugeicons:folder-import',
    hoverIcon: 'hugeicons:folder-import',
    component: 'LazyImportJobsPage',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-import-jobs',
        name: 'admin-import-jobs',
        label: 'adminMenu.importJobs',
        icon: 'hugeicons:folder-import',
        hoverIcon: 'hugeicons:folder-import',
        component: 'LazyImportJobsPage',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/import-jobs-detail': {
    id: `import-jobs-detail-versions-${Date.now()}`,
    name: 'import-jobs-detail-versions',
    icon: 'dp-icon:flow-outline',
    label: 'import-jobs-detail',
    component: 'LazyImportJobsDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, profileName }) => {
      return {
        id: `import-jobs-detail-versions-${Date.now()}`,
        name: `import-jobs-detail-versions-${id}`,
        icon: 'dp-icon:flow-outline',
        label: profileName,
        component: 'LazyImportJobsDetail',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'admin/log-manage': {
    id: 'admin-log-manage',
    name: 'log-manage',
    label: 'adminMenu.logManage',
    icon: 'lucide:logs',
    hoverIcon: 'lucide:logs',
    component: 'LazyLogManage',
    feature: 'LOG_MANAGE',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-log-manage',
        name: 'log-manage',
        label: 'adminMenu.logManage',
        icon: 'lucide:logs',
        hoverIcon: 'lucide:logs',
        component: 'LazyLogManage',
        feature: 'LOG_MANAGE',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/master-table': {
    id: 'admin-master-table',
    name: 'admin-master-table',
    label: 'adminMenu.masterTable',
    icon: 'dp-icon:table',
    hoverIcon: 'dp-icon:table',
    component: 'LazyAdminMasterTablePage',
    feature: 'MASTER_TABLE',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-master-table',
        name: 'admin-master-table',
        label: 'adminMenu.masterTable',
        icon: 'dp-icon:table',
        hoverIcon: 'dp-icon:table',
        component: 'LazyAdminMasterTablePage',
        feature: 'MASTER_TABLE',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/master-table-detail': {
    id: `master-table-detail-versions-${Date.now}`,
    name: 'master-table-detail-versions',
    icon: 'uil:database-alt',
    label: 'master-table-detail',
    component: 'LazyAdminMasterTableDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, name }) => {
      return {
        id: `master-table-detail-versions-${Date.now}`,
        name: `master-table-detail-versions-${id}`,
        icon: 'uil:database-alt',
        label: name,
        component: 'LazyAdminMasterTableDetail',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'admin/master-table-new': {
    id: `master-table-new-${Date.now()}`,
    name: 'master-table-new',
    label: 'adminMenu.masterTable',
    icon: 'uil:database-alt',
    component: 'LazyAdminMasterTableNewDead',
    props: {},
    createRouteItem: async ({ name }) => {
      return {
        id: `master-table-new-${Date.now()}`,
        name: name,
        label: 'adminMenu.masterTable',
        icon: 'uil:database-alt',
        component: 'LazyAdminMasterTableNewDead',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/message-queue': {
    id: 'admin-message-queue',
    name: 'admin-message-queue',
    label: 'adminMenu.message_queue',
    icon: 'material-symbols-light:display-settings-rounded',
    hoverIcon: 'material-symbols-light:display-settings-rounded',
    component: 'LazyMessageQueuePage',
    feature: 'JOB_STATUS',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-message-queue',
        name: 'admin-message-queue',
        label: 'adminMenu.message_queue',
        icon: 'material-symbols-light:display-settings-rounded',
        hoverIcon: 'material-symbols-light:display-settings-rounded',
        component: 'LazyMessageQueuePage',
        feature: 'JOB_STATUS',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/message-retention-detail': {
    id: `admin-retention-versions-${Date.now()}`,
    name: 'admin-retention-versions',
    icon: 'streamline:interface-lock-shield-combination-combo-lock-locked-padlock-secure-security-shield-keyhole',
    label: 'retention-detail',
    component: 'LazyRetentionDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, policyName }) => {
      return {
        id: `admin-retention-versions-${Date.now()}`,
        name: `admin-retention-versions-${id}`,
        icon: 'streamline:interface-lock-shield-combination-combo-lock-locked-padlock-secure-security-shield-keyhole',
        label: policyName,
        component: 'LazyRetentionDetail',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'admin/message-template': {
    id: 'admin-message-template',
    name: 'admin-message-template',
    label: 'adminMenu.messageTemplate',
    icon: 'dp-icon:chat',
    hoverIcon: 'dp-icon:chat',
    component: 'MessageTemplateList',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-message-template',
        name: 'admin-message-template',
        label: 'adminMenu.messageTemplate',
        icon: 'dp-icon:chat',
        hoverIcon: 'dp-icon:chat',
        component: 'MessageTemplateList',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/message-template-detail': {
    id: `admin-message-template-detail-${Date.now()}`,
    name: 'admin-message-template-detail',
    label: 'adminMenu.messageTemplate',
    icon: 'lucide:message-circle-code',
    component: 'LazyMessageTemplateDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id }) => {
      return {
        id: `admin-message-template-detail-${Date.now()}`,
        name: `admin-message-template-detail-${id}`,
        label: 'adminMenu.messageTemplate',
        icon: 'lucide:message-circle-code',
        component: 'LazyMessageTemplateDetail',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'admin/password-policy': {
    id: 'admin-password-policy',
    name: 'admin-password-policy',
    label: 'adminMenu.passwordPolicy',
    icon: 'dp-icon:key',
    hoverIcon: 'dp-icon:key',
    component: 'LazyPasswordPolicyPage',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-password-policy',
        name: 'admin-password-policy',
        label: 'adminMenu.passwordPolicy',
        icon: 'dp-icon:key',
        hoverIcon: 'dp-icon:key',
        component: 'LazyPasswordPolicyPage',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/rbac-page': {
    id: 'RBAC-page',
    name: 'rbac-page',
    label: 'ROLE-Page',
    icon: 'dp-icon:role',
    hoverIcon: 'dp-icon:role',
    component: 'LazyAdminRbacPage',
    feature: 'CORE',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'RBAC-page',
        name: 'rbac-page',
        label: 'ROLE-Page',
        icon: 'dp-icon:role',
        hoverIcon: 'dp-icon:role',
        component: 'LazyAdminRbacPage',
        feature: 'CORE',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/setting': {
    id: 'admin-setting',
    name: 'admin-setting',
    label: 'admin.setting.title',
    icon: 'lucide:settings',
    hoverIcon: 'lucide:settings',
    component: 'LazySettingPage',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-setting',
        name: 'admin-setting',
        label: 'admin.setting.title',
        icon: 'lucide:settings',
        hoverIcon: 'lucide:settings',
        component: 'LazySettingPage',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/profile-setting': {
    id: 'admin-profile-setting',
    name: 'admin-profile-setting',
    icon: 'dp-icon:user',
    hoverIcon: 'dp-icon:user',
    label: 'user.setting.userProfile',
    component: 'SettingUserSetting',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-profile-setting',
        name: 'admin-profile-setting',
        icon: 'dp-icon:user',
        hoverIcon: 'dp-icon:user',
        label: 'user.setting.userProfile',
        component: 'SettingUserSetting',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/internal-share': {
    id: 'admin-internal-share',
    name: 'share-internal',
    label: 'adminMenu.shareInternal',
    icon: 'lucide:file-symlink',
    hoverIcon: 'lucide:file-symlink',
    component: 'LazyInternalShareList',
    feature: 'SHARE_INTERNAL',
    props: {
      pageNum: 0,
      pageSize: 20,
      filters: {}
    },
    createRouteItem: async () => {
      return {
        id: 'admin-internal-share',
        name: 'share-internal',
        label: 'adminMenu.shareInternal',
        icon: 'lucide:file-symlink',
        hoverIcon: 'lucide:file-symlink',
        component: 'LazyInternalShareList',
        feature: 'SHARE_INTERNAL',
        props: {
          pageNum: 0,
          pageSize: 20
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/external-share': {
    id: 'admin-external-share',
    name: 'admin-external-share',
    label: 'adminMenu.share',
    icon: 'dp-icon:export',
    hoverIcon: 'dp-icon:export',
    component: 'LazyExternalSharePage',
    feature: 'SHARE_EXTERNAL',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-external-share',
        name: 'admin-external-share',
        label: 'adminMenu.share',
        icon: 'dp-icon:export',
        hoverIcon: 'dp-icon:export',
        component: 'LazyExternalSharePage',
        feature: 'SHARE_EXTERNAL',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/unique-id-generator': {
    id: 'admin-unique-id-generator',
    name: 'unique-id-generator',
    label: 'adminMenu.uniqueIdGenerator',
    icon: 'icon-park-outline:writing-fluently',
    hoverIcon: 'icon-park-outline:writing-fluently',
    component: 'LazyUniqueIdGeneratorPage',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-unique-id-generator',
        name: 'unique-id-generator',
        label: 'adminMenu.uniqueIdGenerator',
        icon: 'icon-park-outline:writing-fluently',
        hoverIcon: 'icon-park-outline:writing-fluently',
        component: 'LazyUniqueIdGeneratorPage',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/unique-id-generator-detail': {
    id: `unique-id-generator-detail-${Date.now()}`,
    name: 'unique-id-generator-detail',
    icon: 'dp-icon:flow-outline',
    label: 'unique-id-generator-detail',
    component: 'LazyUniqueIdGeneratorDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id }) => {
      return {
        id: `unique-id-generator-detail-${Date.now()}`,
        name: 'unique-id-generator-detail',
        icon: 'dp-icon:flow-outline',
        label: 'unique-id-generator-detail',
        component: 'LazyUniqueIdGeneratorDetail',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'admin/user': {
    id: 'admin-user',
    name: 'admin-user-list',
    label: 'adminMenu.User',
    icon: 'lucide:user',
    hoverIcon: 'lucide:user',
    component: 'LazyAdminUserList',
    feature: 'CORE',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-user',
        name: 'admin-user-list',
        label: 'adminMenu.User',
        icon: 'lucide:user',
        hoverIcon: 'lucide:user',
        component: 'LazyAdminUserList',
        feature: 'CORE',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/user-group': {
    id: 'admin-user-group',
    name: 'admin-group-list',
    label: 'adminMenu.group',
    icon: 'mingcute:group-line',
    hoverIcon: 'mingcute:group-line',
    component: 'LazyGroupList',
    feature: 'CORE',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-user-group',
        name: 'admin-group-list',
        label: 'adminMenu.group',
        icon: 'mingcute:group-line',
        hoverIcon: 'mingcute:group-line',
        component: 'LazyGroupList',
        feature: 'CORE',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/watermark': {
    id: 'admin-watermark',
    name: 'admin-watermark',
    label: 'adminMenu.watermark',
    icon: 'lucide:file-image',
    hoverIcon: 'lucide:file-image',
    component: 'LazyWatermark',
    feature: 'WATERMARK',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-watermark',
        name: 'admin-watermark',
        label: 'adminMenu.watermark',
        icon: 'lucide:file-image',
        hoverIcon: 'lucide:file-image',
        component: 'LazyWatermark',
        feature: 'WATERMARK',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/workflow-manage': {
    id: 'admin-workflow-manage',
    name: 'admin-workflow-manage',
    label: 'adminMenu.runningWorkflow',
    icon: 'icon-park-outline:writing-fluently',
    hoverIcon: 'icon-park-outline:writing-fluently',
    component: 'LazyWorkflowManagePage',
    feature: 'WORKFLOW',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-workflow-manage',
        name: 'admin-workflow-manage',
        label: 'adminMenu.runningWorkflow',
        icon: 'icon-park-outline:writing-fluently',
        hoverIcon: 'icon-park-outline:writing-fluently',
        component: 'LazyWorkflowManagePage',
        feature: 'WORKFLOW',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/workflow-retry': {
    id: 'admin-workflow-retry',
    name: 'admin-workflow-retry',
    label: 'adminMenu.WorkflowRetry',
    icon: 'fluent:tray-item-add-24-regular',
    hoverIcon: 'fluent:tray-item-add-24-regular',
    component: 'LazyWorkflowRetryPage',
    feature: 'WORKFLOW',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-workflow-retry',
        name: 'admin-workflow-retry',
        label: 'adminMenu.WorkflowRetry',
        icon: 'fluent:tray-item-add-24-regular',
        hoverIcon: 'fluent:tray-item-add-24-regular',
        component: 'LazyWorkflowRetryPage',
        feature: 'WORKFLOW',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/workflow-editor': {
    id: 'admin-workflow-editor',
    name: 'workflow-editor-list',
    label: 'adminMenu.workflowEditor',
    icon: 'dp-icon:flow-outline',
    hoverIcon: 'dp-icon:flow-fill',
    component: 'LazyWorkflowEditorList',
    feature: 'WORKFLOW',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'admin-workflow-editor',
        name: 'workflow-editor-list',
        label: 'adminMenu.workflowEditor',
        icon: 'dp-icon:flow-outline',
        hoverIcon: 'dp-icon:flow-fill',
        component: 'LazyWorkflowEditorList',
        feature: 'WORKFLOW',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'admin/workflow-editor-versions': {
    id: `admin-workflow-editor-versions-${Date.now()}`,
    name: 'workflow-editor-versions',
    icon: 'dp-icon:flow-outline',
    label: 'workflow-editor-versions',
    component: 'LazyWorkflowEditorVersion',
    props: {
      id: '',
      draftId: '',
      name: '',
      latestVersion: ''
    },
    createRouteItem: async ({ id, name, draftId, latestVersion }) => {
      return {
        id: `admin-workflow-editor-versions-${Date.now()}`,
        name: `workflow-editor-versions-${id}`,
        icon: 'dp-icon:flow-outline',
        label: name,
        component: 'LazyWorkflowEditorVersion',
        props: {
          id: id,
          draftId: draftId || id,
          name: name,
          latestVersion: latestVersion
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id &&
        oldSetting.props.draftId == newSetting.props.draftId &&
        oldSetting.props.latestVersion == newSetting.props.latestVersion
    }
  },
  'admin/workflow-editor-detail': {
    id: `admin-workflow-editor-detail-${Date.now()}`,
    name: 'workflow-editor-detail',
    icon: 'dp-icon:flow-outline',
    label: 'workflow-editor-detail',
    component: 'LazyWorkflowEditorDetailDead',
    props: {
      id: '',
      versionId: '',
      currentVersion: ''
    },
    createRouteItem: async ({ id, name, versionId, currentVersion }) => {
      return {
        id: `admin-workflow-editor-detail-${Date.now()}`,
        name: `workflow-editor-detail-${id}`,
        icon: 'dp-icon:flow-outline',
        label: name,
        component: 'LazyWorkflowEditorDetailDead',
        props: {
          id: id,
          versionId: versionId,
          currentVersion: currentVersion
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id &&
        oldSetting.props.versionId == newSetting.props.versionId &&
        oldSetting.props.currentVersion == newSetting.props.currentVersion
    }
  },
  'ai-upload': {
    id: 'client-ai-upload',
    name: 'client-ai-upload',
    icon: 'lucide:cloud-upload',
    hoverIcon: 'lucide:cloud-upload',
    label: 'clientAIUpload',
    component: 'LazyAiUpload',
    feature: 'BROWSE',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-ai-upload',
        name: 'client-ai-upload',
        icon: 'lucide:cloud-upload',
        hoverIcon: 'lucide:cloud-upload',
        label: 'clientAIUpload',
        component: 'LazyAiUpload',
        feature: 'BROWSE',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'ai-upload-detail': {
    id: `ai-upload-detail-${Date.now()}`,
    name: 'ai-upload-detail',
    icon: 'lucide:file-text',
    label: 'clientAIUpload',
    component: 'LazyAiUploadDetail',
    props: {
      id: '',
      status: ''
    },
    createRouteItem: async ({ id, status }) => {
      return {
        id: `ai-upload-detail-${Date.now()}`,
        name: `ai-upload-detail-${id}`,
        label: 'clientAIUpload',
        component: 'LazyAiUploadDetail',
        props: {
          id: id,
          status: status
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id &&
        oldSetting.props.status == newSetting.props.status
    }
  },
  'browse': {
    id: 'client-browse',
    name: 'client-browse',
    icon: 'dp-icon:browse-outline',
    hoverIcon: 'dp-icon:browse-fill',
    label: 'file_browse',
    component: 'LazyBrowsePage',
    feature: 'BROWSE',
    props: {
      idOrPath: 'root'
    },
    createRouteItem: async ({ idOrPath, home, commentId, expandedItems, isReload, showInfo }) => {
      return {
        id: `client-browse-${Date.now()}`,
        name: `client-browse-${idOrPath}`,
        icon: 'dp-icon:browse-outline',
        hoverIcon: 'dp-icon:browse-fill',
        label: 'file_browse',
        component: 'LazyBrowsePage',
        feature: 'BROWSE',
        props: {
          idOrPath: idOrPath || 'root' as string,
          home: home || [] as any,
          commentId: commentId || '' as string,
          expandedItems: expandedItems || [] as any[],
          isReload: isReload || false as boolean,
          showInfo: showInfo || false as boolean
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.idOrPath == newSetting.props.idOrPath
    }
  },
  'browse-collections': {
    id: 'client-collections',
    name: 'client-collections',
    icon: 'icon-park-outline:layers',
    hoverIcon: 'icon-park-twotone:layers',
    label: 'file_collections',
    component: 'LazyCollectionPage',
    feature: 'COLLECTION',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: `'client-collections-${Date.now()}`,
        name: 'client-collections',
        icon: 'icon-park-outline:layers',
        hoverIcon: 'icon-park-twotone:layers',
        label: 'file_collections',
        component: 'LazyCollectionPage',
        feature: 'COLLECTION',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'browse-file-request': {
    id: 'client-file-request',
    name: 'client-file-request',
    icon: 'lucide:file-symlink',
    hoverIcon: 'lucide:file-symlink',
    label: 'file_uploads',
    component: 'LazyUploadRequestPage',
    feature: 'UPLOAD_REQUEST',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-file-request',
        name: 'client-file-request',
        icon: 'lucide:file-symlink',
        hoverIcon: 'lucide:file-symlink',
        label: 'file_uploads',
        component: 'LazyUploadRequestPage',
        feature: 'UPLOAD_REQUEST',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'browse-detail': {
    id: `client-browse-detail-${Date.now}`,
    name: 'client-browse-detail',
    label: 'browse-detail',
    icon: 'lucide:file-text',
    component: 'LazyBrowseDetail',
    props: {},
    createRouteItem: async ({ idOrPath, docName, showHeaderAction, showInfo, commentId }) => {
      return {
        id: `client-browse-detail-${Date.now}`,
        name: `client-browse-detail-${idOrPath}`,
        label: docName,
        component: 'LazyBrowseDetail',
        props: {
          idOrPath: idOrPath,
          showHeaderAction: showHeaderAction || true as boolean,
          showInfo: showInfo || false as boolean,
          commentId: commentId || '' as string
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.idOrPath == newSetting.props.idOrPath &&
        oldSetting.props.commentId == newSetting.props.commentId
    }
  },
  'browse-watermark': {
    id: `client-browse-watermark-${Date.now()}`,
    name: 'client-browse-watermark',
    label: 'browse-watermark',
    icon: 'lucide:file-pen',
    component: 'LazyBrowseWatermark',
    props: {
      docId: '',
      docName: ''
    },
    createRouteItem: async ({ docId, docName }) => {
      return {
        id: `client-browse-watermark-${Date.now()}`,
        name: `client-browse-watermark-${docName}`,
        label: docName,
        component: 'LazyBrowseWatermark',
        props: {
          docId: docId,
          docName: docName
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.docId == newSetting.props.docId
    }
  },
  'browse-share': {
    id: 'client-share',
    name: 'client-share',
    icon: 'lucide:file-share',
    hoverIcon: 'lucide:file-share',
    label: 'share.shareQueue',
    component: 'LazyBrowseShare',
    props: {
      backPath: ''
    },
    createRouteItem: async ({ backPath }) => {
      return {
        id: `client-share-${Date.now()}`,
        name: 'client-share',
        icon: 'lucide:file-share',
        hoverIcon: 'lucide:file-share',
        label: 'share.shareQueue',
        component: 'LazyBrowseShare',
        props: {
          backPath: backPath
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.backPath == newSetting.props.backPath
    }
  },
  'browse-file-request-detail': {
    id: `client-file-request-detail-${Date.now()}`,
    name: 'client-fileRequest',
    icon: 'uil:upload',
    label: 'file_uploads',
    component: 'LazyUploadRequestDetail',
    props: {
      id: '',
      paramKey: ''
    },
    createRouteItem: async ({ taskId, paramKey }) => {
      return {
        id: `client-file-request-detail-${Date.now()}`,
        name: `client-fileRequest-${taskId}`,
        icon: 'uil:upload',
        label: 'file_uploads',
        component: 'LazyUploadRequestDetail',
        props: {
          id: taskId,
          paramKey: paramKey
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id &&
        oldSetting.props.paramKey == newSetting.props.paramKey
    }
  },
  'browse-version-Comparison': {
    id: 'client-version-Comparison',
    name: 'client-version-Comparison',
    icon: 'lucide:file-diff',
    hoverIcon: 'lucide:file-diff',
    label: 'browse-version-Comparison',
    component: 'LazyBrowseVersionComparison',
    props: {
      id: '',
      oldVersionNum: ''
    },
    createRouteItem: async ({ id, name, oldVersionNum }) => {
      return {
        id: 'client-version-Comparison',
        name: 'client-version-Comparison',
        icon: 'lucide:file-diff',
        hoverIcon: 'lucide:file-diff',
        label: name,
        component: 'LazyBrowseVersionComparison',
        props: {
          id: id,
          oldVersionNum: oldVersionNum
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id &&
        oldSetting.props.oldVersionNum == newSetting.props.oldVersionNum
    }
  },
  'case-manage': {
    id: 'client-case-manage',
    name: 'client-case-manage',
    icon: 'dp-icon:case',
    hoverIcon: 'dp-icon:case',
    label: 'adminMenu.caseManagement',
    component: 'LazyCasePage',
    feature: 'WORKFLOW',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-case-manage',
        name: 'client-case-manage',
        icon: 'dp-icon:case',
        hoverIcon: 'dp-icon:case',
        label: 'adminMenu.caseManagement',
        component: 'LazyCasePage',
        feature: 'WORKFLOW',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'case-manage-detail': {
    id: `client-case-manage-detail-${Date.now()}`,
    name: 'client-case-manage-detail',
    icon: 'dp-icon:case-outline',
    label: 'case-manage-detail',
    component: 'LazyCaseDetail',
    props: {
      id: '',
      name: '',
      data: ''
    },
    createRouteItem: async ({ id, name, data }) => {
      return {
        id: `client-case-manage-detail-${Date.now()}`,
        name: `client-case-manage-detail-${id}`,
        icon: 'dp-icon:case-outline',
        label: name,
        component: 'LazyCaseDetail',
        props: {
          id: id as string,
          name: name as string,
          data: data as string
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id &&
        oldSetting.props.name == newSetting.props.name &&
        oldSetting.props.data == newSetting.props.data
    }
  },
  'case-manage-detail-dashboard': {
    id: `client-case-manage-detail-dashboard-${Date.now()}`,
    name: 'client-case-manage-detail-dashboard',
    icon: 'dp-icon:case-outline',
    label: 'case',
    component: 'LazyCaseDashboard',
    props: {
      instanceId: '',
      versionId: ''
    },
    createRouteItem: async ({ caseId }) => {
      const caseInstance = await clientApi.api.getCaseInstanceCaseidCaseid(caseId).then((res) => res.data)
      return {
        id: `client-case-manage-detail-dashboard-${Date.now()}`,
        name: `client-case-manage-detail-dashboard-${caseId}`,
        icon: 'dp-icon:case-outline',
        label: caseId,
        component: 'LazyCaseDashboard',
        props: {
          instanceId: caseId,
          versionId: caseInstance?.cmmnVersionId
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.instanceId === newSetting.props.instanceId
    }
  },
  'case-manage-process-task-form': {
    id: `client-case-manage-process-task-form-${Date.now()}`,
    name: 'client-case-manage-process-task-form',
    icon: 'dp-icon:case-outline',
    label: 'case-manage-process-task-form',
    component: 'LazyCaseProcessTaskStartFullPageDead',
    props: {
      caseInstanceId: '',
      actionStepId: '',
      backItem: ''
    },
    createRouteItem: async ({ caseInstanceId, actionStepId, label = 'Form', backItem }) => {
      return {
        id: `client-case-manage-process-task-form-${Date.now()}`,
        name: `client-case-manage-process-task-form-${actionStepId}`,
        icon: 'dp-icon:case-outline',
        label: label,
        component: 'LazyCaseProcessTaskStartFullPageDead',
        props: {
          caseInstanceId: caseInstanceId,
          actionStepId: actionStepId,
          backItem: backItem
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.caseInstanceId == newSetting.props.caseInstanceId &&
        oldSetting.props.actionStepId == newSetting.props.actionStepId &&
        oldSetting.props.backItem == newSetting.props.backItem
    }
  },
  'dashboard': {
    id: 'client-dashboard',
    name: 'client-dashboard',
    label: 'adminMenu.dashboard',
    icon: 'carbon:dashboard',
    hoverIcon: 'carbon:dashboard',
    component: 'LazyDashboardPage',
    feature: 'DASHBOARD',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-dashboard',
        name: 'client-dashboard',
        label: 'adminMenu.dashboard',
        icon: 'carbon:dashboard',
        hoverIcon: 'carbon:dashboard',
        component: 'LazyDashboardPage',
        feature: 'DASHBOARD',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'work-panel': {
    id: 'client-work-panel',
    name: 'client-work-panel',
    label: 'adminMenu.workPanel',
    icon: 'material-symbols:home',
    hoverIcon: 'material-symbols:home',
    component: 'LazyHomePage',
    feature: 'DASHBOARD',
    handleError: true,
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-work-panel',
        name: 'client-work-panel',
        label: 'adminMenu.workPanel',
        icon: 'material-symbols:home',
        hoverIcon: 'material-symbols:home',
        component: 'LazyHomePage',
        feature: 'DASHBOARD',
        handleError: true,
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'dashboard-detail': {
    id: `dashboard-detail-${Date.now()}`,
    name: 'dashboard-detail',
    icon: 'dp-icon:flow-outline',
    label: '',
    component: 'LazyDashboardDetailPage',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, name }) => {
      return {
        id: `dashboard-detail-versions-${Date.now()}`,
        name: `dashboard-detail-versions-${id}`,
        icon: 'dp-icon:flow-outline',
        label: name,
        component: 'LazyDashboardDetailPage',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'easy-form': {
    id: 'client-easy-form',
    name: 'client-easy-form',
    label: 'adminMenu.easyForm',
    icon: 'material-symbols-light:table-edit-rounded',
    hoverIcon: 'material-symbols-light:table-edit-rounded',
    component: 'LazyEasyFormPage',
    feature: 'WORKFLOW',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-easy-form',
        name: 'client-easy-form',
        label: 'adminMenu.easyForm',
        icon: 'material-symbols-light:table-edit-rounded',
        hoverIcon: 'material-symbols-light:table-edit-rounded',
        component: 'LazyEasyFormPage',
        feature: 'WORKFLOW',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'easy-form-detail': {
    id: `easy-form-detail-${Date.now()}`,
    name: 'easy-form-detail',
    icon: 'material-symbols-light:table-edit-rounded',
    label: 'easy-form-detail',
    component: 'LazyEasyFormDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, name }) => {
      return {
        id: `easy-form-detail-${Date.now()}`,
        name: `easy-form-detail-${id}`,
        icon: 'material-symbols-light:table-edit-rounded',
        label: name,
        component: 'LazyEasyFormDetail',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  },
  'hold-policies': {
    id: 'client-hold-policies',
    name: 'client-hold-policies',
    label: 'client_holdPolicies',
    icon: 'dp-icon:hold',
    hoverIcon: 'dp-icon:hold',
    component: 'LazyHoldPage',
    feature: 'HOLD_POLICIES',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-hold-policies',
        name: 'client-hold-policies',
        label: 'client_holdPolicies',
        icon: 'dp-icon:hold',
        hoverIcon: 'dp-icon:hold',
        component: 'LazyHoldPage',
        feature: 'HOLD_POLICIES',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'retention': {
    id: 'client-retention',
    name: 'client-retention',
    label: 'client_retention',
    icon: 'dp-icon:retention',
    hoverIcon: 'dp-icon:retention',
    component: 'LazyRetentionPage',
    feature: 'RETENTION_POLICIES',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-retention',
        name: 'client-retention',
        label: 'client_retention',
        icon: 'dp-icon:retention',
        hoverIcon: 'dp-icon:retention',
        component: 'LazyRetentionPage',
        feature: 'RETENTION_POLICIES',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'hold-page-folder': {
    id: `hold-page-folder-versions-${Date.now()}`,
    name: 'hold-page-folder',
    icon: 'ic:outline-lock-clock',
    label: 'hold-page-folder',
    component: 'LazyHoldPageFolder',
    props: {
      idOrPath: '',
      homeId: ''
    },
    createRouteItem: async ({ documentId, documentName }) => {
      return {
        id: `hold-page-folder-versions-${Date.now()}`,
        name: `hold-page-folder-${documentName}`,
        icon: 'ic:outline-lock-clock',
        label: documentName,
        component: 'LazyHoldPageFolder',
        props: {
          idOrPath: documentId,
          homeId: documentId
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.idOrPath == newSetting.props.idOrPath &&
        oldSetting.props.homeId == newSetting.props.homeId
    }
  },
  'retention-page-folder': {
    id: `retention-page-folder-versions-${Date.now()}`,
    name: 'retention-page-folder',
    icon: 'ic:outline-lock-clock',
    label: 'retention-page-folder',
    component: 'LazyRetentionPageFolder',
    props: {
      idOrPath: '',
      homeId: ''
    },
    createRouteItem: async ({ documentId, documentName }) => {
      return {
        id: `retention-page-folder-versions-${Date.now()}`,
        name: `retention-page-folder-${documentName}`,
        icon: 'ic:outline-lock-clock',
        label: documentName,
        component: 'LazyRetentionPageFolder',
        props: {
          idOrPath: documentId,
          homeId: documentId
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.idOrPath == newSetting.props.idOrPath &&
        oldSetting.props.homeId == newSetting.props.homeId
    }
  },
  'folder-cabinet': {
    id: 'client-folder-cabinet',
    name: 'client-folder-cabinet',
    label: 'menus_folderCabinet',
    icon: 'icon-park-outline:document-folder',
    hoverIcon: 'icon-park-outline:document-folder',
    component: 'LazyFolderCabinetPage',
    feature: 'FOLDER_CABINET',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-folder-cabinet',
        name: 'client-folder-cabinet',
        label: 'menus_folderCabinet',
        icon: 'icon-park-outline:document-folder',
        hoverIcon: 'icon-park-outline:document-folder',
        component: 'LazyFolderCabinetPage',
        feature: 'FOLDER_CABINET',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'master-table': {
    id: 'client-master-table',
    name: 'client-master-table',
    label: 'menu_master-table',
    icon: 'dp-icon:table',
    hoverIcon: 'dp-icon:table',
    component: 'LazyMasterTablePage',
    feature: 'MASTER_TABLE',
    props: {
      curTableId: ''
    },
    createRouteItem: async ({ curTableId }) => {
      return {
        id: 'client-master-table',
        name: 'client-master-table',
        label: 'menu_master-table',
        icon: 'dp-icon:table',
        hoverIcon: 'dp-icon:table',
        component: 'LazyMasterTablePage',
        feature: 'MASTER_TABLE',
        props: {
          curTableId: curTableId || ''
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.curTableId == newSetting.props.curTableId
    }
  },
  'rbac-page': {
    id: 'rbac-page',
    name: 'rbac-page',
    label: 'ROLE-Page',
    icon: 'lucide:file-cog',
    hoverIcon: 'lucide:file-cog',
    component: 'LazyRbacPage',
    feature: 'CORE',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'rbac-page',
        name: 'rbac-page',
        label: 'ROLE-Page',
        icon: 'lucide:file-cog',
        hoverIcon: 'lucide:file-cog',
        component: 'LazyRbacPage',
        feature: 'CORE',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'search': {
    id: 'client-search',
    name: 'client-search',
    icon: 'lucide:search',
    hoverIcon: 'lucide:search',
    label: 'file_search',
    component: 'LazySearchPage',
    feature: 'SEARCH',
    props: {
      searchParams: []
    },
    createRouteItem: async ({ searchParams }) => {
      return {
        id: 'client-search',
        name: 'client-search',
        icon: 'lucide:search',
        hoverIcon: 'lucide:search',
        label: 'file_search',
        component: 'LazySearchPage',
        feature: 'SEARCH',
        props: {
          searchParams: searchParams || []
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return false
    }
  },
  // TODO: 未使用
  'smart-folder': {
    id: 'client-smart-folder',
    name: 'client-smart-folder',
    icon: 'material-symbols:map-search-outline-rounded',
    hoverIcon: 'material-symbols:map-search-outline-rounded',
    label: 'file_smartFolder',
    component: 'LazySmartFolderPage',
    feature: 'SMART_FOLDER',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-smart-folder',
        name: 'client-smart-folder',
        icon: 'material-symbols:map-search-outline-rounded',
        hoverIcon: 'material-symbols:map-search-outline-rounded',
        label: 'file_smartFolder',
        component: 'LazySmartFolderPage',
        feature: 'SMART_FOLDER',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'share': {
    id: 'client-share',
    name: 'client-share',
    label: 'file_share',
    icon: 'dp-icon:export',
    hoverIcon: 'dp-icon:export',
    component: 'LazySharePage',
    feature: 'SHARE_EXTERNAL',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-share',
        name: 'client-share',
        label: 'file_share',
        icon: 'dp-icon:export',
        hoverIcon: 'dp-icon:export',
        component: 'LazySharePage',
        feature: 'SHARE_EXTERNAL',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'share-me': {
    id: 'client-share-me',
    name: 'client-share-me',
    label: 'file_share_me',
    icon: 'lucide:file-symlink',
    hoverIcon: 'lucide:file-symlink',
    component: 'LazyInternalShareMePage',
    feature: 'SHARE_INTERNAL',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-share-me',
        name: 'client-share-me',
        label: 'file_share_me',
        icon: 'lucide:file-symlink',
        hoverIcon: 'lucide:file-symlink',
        component: 'LazyInternalShareMePage',
        feature: 'SHARE_INTERNAL',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'share-other': {
    id: 'client-share-other',
    name: 'client-share-other',
    label: 'file_share_other',
    icon: 'lsicon:file-export-filled',
    hoverIcon: 'lsicon:file-export-filled',
    component: 'LazyInternalShareOtherPage',
    feature: 'SHARE_INTERNAL',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-share-other',
        name: 'client-share-other',
        label: 'file_share_other',
        icon: 'lsicon:file-export-filled',
        hoverIcon: 'lsicon:file-export-filled',
        component: 'LazyInternalShareOtherPage',
        feature: 'SHARE_INTERNAL',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'trash': {
    id: 'client-trash',
    name: 'client-trash',
    label: 'file_trash',
    icon: 'lucide:trash-2',
    hoverIcon: 'lucide:trash-2',
    component: 'LazyTrashPage',
    feature: 'TRASH',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-trash',
        name: 'client-trash',
        label: 'file_trash',
        icon: 'lucide:trash-2',
        hoverIcon: 'lucide:trash-2',
        component: 'LazyTrashPage',
        feature: 'TRASH',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'user-setting': {
    id: 'client-user-setting',
    name: 'client-user-setting',
    label: 'admin.setting.title',
    icon: 'lucide:user',
    component: 'Setting',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-user-setting',
        name: 'client-user-setting',
        label: 'admin.setting.title',
        icon: 'lucide:user',
        component: 'Setting',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'workflow': {
    id: 'client-workflow',
    name: 'client-workflow',
    icon: 'dp-icon:flow-outline',
    hoverIcon: 'dp-icon:flow-outline',
    label: 'menus_workflow',
    component: 'LazyWorkflowPage',
    feature: 'WORKFLOW',
    props: {},
    createRouteItem: async ({}) => {
      return {
        id: 'client-workflow',
        name: 'client-workflow',
        icon: 'dp-icon:flow-outline',
        hoverIcon: 'dp-icon:flow-outline',
        label: 'menus_workflow',
        component: 'LazyWorkflowPage',
        feature: 'WORKFLOW',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return true
    }
  },
  'workflow-detail': {
    id: `workflow-detail-versions-${Date.now()}`,
    name: 'workflow-detail-versions',
    icon: 'dp-icon:flow-outline',
    label: 'workflow-detail',
    component: 'LazyWorkflowDetail',
    props: {
      id: '',
      workflowType: 'myTask'
    },
    createRouteItem: async ({ id, name, workflowType }) => {
      return {
        id: `workflow-detail-versions-${Date.now()}`,
        name: `workflow-detail-versions-${id}`,
        icon: 'dp-icon:flow-outline',
        label: name,
        component: 'LazyWorkflowDetail',
        props: {
          id: id,
          workflowType: workflowType || 'myTask'
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id &&
        oldSetting.props.workflowType == newSetting.props.workflowType
    }
  },
  'public/public-form': {
    id: `public-form-${Date.now()}`,
    name: 'public-form',
    icon: 'dp-icon:flow-outline',
    label: 'public-form',
    component: 'LazyPublicPublicEasyForm',
    props: {
      id: ''
    },
    createRouteItem: async ({ id }) => {
      return {
        id: `public-form-${Date.now()}`,
        name: 'public-form',
        icon: 'dp-icon:flow-outline',
        label: 'public-form',
        component: 'LazyPublicPublicEasyForm',
        props: {
          id: id
        }
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
    }
  }
}
