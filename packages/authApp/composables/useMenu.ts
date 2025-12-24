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
  // TODO: 未使用
  'admin/personal-dashboard-detail': {
    id: `admin-personal-dashboard-${Date.now()}`,
    name: 'admin-personal-dashboard-',
    icon: 'carbon:dashboard',
    label: 'personal-dashboard-detail',
    component: 'LazyPersonalDashboardManageDetail',
    props: {
      id: ''
    },
    createRouteItem: async ({ id, name }) => {
      return {
        id: `admin-personal-dashboard-${Date.now()}`,
        name: `admin-personal-dashboard-${id}`,
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

  'case-manage-detail': {
    id: 'client-case-manage-dashboard',
    name: 'client-case-manage-dashboard',
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
        id: `client-case-manage-dashboard-${Date.now()}`,
        name: `client-case-manage-dashboard-${caseId}`,
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
  }
}
