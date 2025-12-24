import { adminApi, clientApi } from 'api'

export type menuTypeSetting = {
  id: string,
  name: string,
  label: string,
  icon: string,
  hoverIcon?: string,
  component: string,
  feature?: string,
  props: {
    [key: string]: any
  },
  createRouteItem: (params: any) => {},
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
    createRouteItem: async ({}) => {
      return {
        id: 'admin-acl',
        name: 'admin-acl',
        label: 'adminMenu.ACL',
        icon: 'dp-icon:acl',
        hoverIcon: 'dp-icon:acl',
        component: 'LazyAclPage',
        feature: 'CORE',
        props: {}
      }
    },
    shouldReplace: (oldSetting: any, newSetting: any) => {
      return oldSetting.props.id == newSetting.props.id
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


