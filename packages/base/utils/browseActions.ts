import BrowseActionsHold from '../components/browse/Actions/hold.vue'
import BrowseActionsSubscribe from '../components/browse/Actions/subscribe.vue'
import BrowseActionsEdit from '../components/browse/Actions/edit.vue'
import BrowseActionsNew from '../components/browse/Actions/new.vue'
import BrowseActionsDelete from '../components/browse/Actions/delete.vue'
import BrowseActionsCopyPath from '../components/browse/Actions/copyPath.vue'
import BrowseActionsReplace from '../components/browse/Actions/replace/index.vue'
import BrowseActionsDownload from '../components/browse/Actions/download.vue'
import BrowseActionsOffice from '../components/browse/Actions/office.vue'
import BrowseActionsShare from '../components/browse/Actions/share.vue'
import BrowseActionsUploadRequest from '../components/browse/Actions/uploadRequest.vue'
import BrowseActionsCollection from '../components/browse/Actions/collection.vue'
import BrowseActionsDeleteSelected from '../components/browse/Actions/deleteSelected.vue'
import BrowseActionsInfo from '../components/browse/Actions/info.vue'
import BrowseActionsWatermarkBtn from '../components/browse/Actions/WatermarkBtn.vue'
// import BrowseActionsAi from "../components/browse/Actions/ai/index.vue";
import type { AllPermission, rbacPermission } from './permissionHelper'
import { allowFeature } from './browseHelper'
export type BrowseActionItem = {
  name: string
  icon?: string
  showInFolder?: boolean
  showInDetail?: boolean
  showInShare?: boolean
  permission: rbacPermission
  needFeature?: string[]
  component: any
  groupBy: string
  hideAfterClick?: boolean
  showInTrash?: boolean
  showInGoogleDrive?: boolean
  additionalCheck?: (docDetail: any) => boolean
}
export type ShareActionItem = {
  name: string
  icon: string
  permission: rbacPermission
  component: any
  needFeature?: string[]
}

export const actions: BrowseActionItem[] = [
  {
    name: 'Hold',
    showInFolder: true,
    showInDetail: false,
    permission: 'hold-write',
    component: BrowseActionsHold,
    groupBy: 'holdStatus'
  },
  {
    name: 'Subscribe',
    showInFolder: true,
    showInDetail: true,
    permission: 'normal',
    component: BrowseActionsSubscribe,
    groupBy: 'holdStatus'
  },
  {
    name: 'Edit',
    showInFolder: true,
    showInDetail: false,
    showInShare: false,
    permission: 'write',
    component: BrowseActionsEdit,
    groupBy: 'normal'
  },
  {
    name: 'New',
    showInFolder: true,
    showInDetail: false,
    permission: 'create',
    component: BrowseActionsNew,
    groupBy: 'normal'
  },
  {
    name: 'Delete',
    showInFolder: true,
    showInDetail: true,
    permission: 'delete',
    component: BrowseActionsDelete,
    groupBy: 'normal'
  },
  {
    name: 'copyPath',
    showInFolder: true,
    showInDetail: true,
    permission: 'normal',
    component: BrowseActionsCopyPath,
    groupBy: 'normal'
  },
  {
    name: 'replace',
    showInFolder: false,
    showInDetail: true,
    permission: 'write',
    component: BrowseActionsReplace,
    groupBy: 'normal'
  },
  {
    name: 'download',
    showInFolder: false,
    showInDetail: true,
    permission: 'download',
    component: BrowseActionsDownload,
    groupBy: 'normal'
  },
  {
    name: 'Watermark',
    showInFolder: false,
    showInDetail: true,
    permission: 'write',
    component: BrowseActionsWatermarkBtn,
    groupBy: 'other',
    additionalCheck: (docDetail: any) => {
      const watermarkAcceptFormat = ['jpg', 'pdf', 'png', 'mp4']
      
      if (docDetail.fileContentExtension && watermarkAcceptFormat.includes(docDetail.fileContentExtension.toLowerCase())) {
        return true
      }
      return false
    }
  },
  {
    name: 'share',
    showInFolder: false,
    showInDetail: true,
    showInShare: true,
    permission: 'share',
    needFeature: ['SHARE_EXTERNAL'],
    component: BrowseActionsShare,
    groupBy: 'other',
    hideAfterClick: false
  },
  {
    name: 'collection',
    showInFolder: false,
    showInDetail: false,
    showInShare: true,
    permission: 'editMetadata',
    component: BrowseActionsCollection,
    groupBy: 'other'
  },
  {
    name: 'deleteSelected',
    showInFolder: false,
    showInDetail: false,
    showInShare: true,
    permission: 'deleteSubContent',
    component: BrowseActionsDeleteSelected,
    groupBy: 'other'
  },
  {
    name: 'UploadRequest',
    showInFolder: true,
    showInDetail: false,
    permission: 'write',
    component: BrowseActionsUploadRequest,
    groupBy: 'other'
  }
]
export const shareActions: ShareActionItem[] = []

export const ActionsFilter = (
  actions: BrowseActionItem[],
  docDetail: any,
  booleanKey: 'showInFolder' | 'showInDetail' | 'showInShare',
  isTrash: boolean = false
) => {
  if (isTrash) {
    return actions.filter((item) => {
      return item.showInTrash
    })
  }
  if (docDetail.comeFrom === 'google_drive' || docDetail.path === '/google_drive') {
    return actions.filter((item) => {
      return item.showInGoogleDrive
    })
  }
  return actions
    .filter((item) => {
      if (!item.needFeature || item.needFeature.length === 0) return true

      return item.needFeature.every((feature) => {
        return allowFeature(feature)
      })
    })
    .filter((item) => {
      return item[booleanKey]
    })
    .filter((item) => {
      // console.log(RbacAllowTo(item.permission, docDetail), docDetail);

      return RbacAllowTo(item.permission, docDetail)
    })
    .filter((item) => {
      if (item.additionalCheck) {
        return item.additionalCheck(docDetail)
      }
      return true
    })
    .reduce((prev: any, item: BrowseActionItem) => {
      prev[item.groupBy] = prev[item.groupBy] || []
      prev[item.groupBy].push(item)
      return prev
    }, {})
}
