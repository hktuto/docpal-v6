import { shallowMount, mount } from '@vue/test-utils'
import { describe, it, test, vi, expect, beforeEach, afterEach } from 'vitest'
import {
  DashboardManagePage,
  DashboardManageDetail
} from '#components'
import { adminApi, publicApi } from './mock/api'
import { VxeGrid } from 'vxe-table'
import { ElMessageBox, ElMessage, ElSwitch } from 'element-plus'
import { mockRouterProvider } from './util'
import { mockQuery} from './setup'
vi.mock('element-plus', () => ({
  ElMessageBox: {
    alert: vi.fn(),
    confirm: vi.fn()
  },
  ElNotification: {
    success: vi.fn()
  },
  ElMessage: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn()
  }
}))

const FormRenderer = {
  template: '<div class="FormRenderer">FormRenderer</div>',
  methods: {
    setFormJson: vi.fn(),
    setFormData: vi.fn()
  }
}
const VFormRender = {
  template: '<div class="FormRenderer">FormRenderer</div>',
  methods: {}
}
const ReaderDialog = {
  template: '<div class="FormRenderer">FormRenderer</div>',
  methods: {}
}

describe('[admin-dashboard]DashboardManagePage', () => {
  let wrapper: any
  const mockTabProvider = {}
  console.log(process.env)
  beforeEach(async () => {
    wrapper = mount(DashboardManagePage, {
      props: {
        pageNum: 0,
        pageSize: 20
      },
      global: {
        components: { VxeGrid, FormRenderer, VFormRender, ReaderDialog },
        provide: {
          [TabManagerKey]: mockTabProvider,
          [MenuRouterKey]: mockRouterProvider
        },
        mocks: {
          $t: (msg: string) => msg, // Mock translation function
          $i18n: { t: (key: string) => key }
        }
      }
    })
    // const dialogRef = wrapper.vm.$refs.DocTypeDialogNewRef
    // dialogRef.handleOpen = vi.fn()
    // const tableRef = wrapper.vm.$refs.tableRef;
    // tableRef.loadData = vi.fn();
  })

  afterEach(() => {
    wrapper.unmount()
    vi.clearAllMocks()
  })
  it('renders correctly with title', () => {
    expect(wrapper.find('.vxe-grid--table-container').exists()).toBe(true) // 根据实际文本调整
  })
  it('opens dialog on create button click', async () => {
    wrapper.vm.DashboardDialogRef = { handleOpen: vi.fn() }
    wrapper.vm.handleConfig()
    expect(wrapper.vm.DashboardDialogRef.handleOpen).toHaveBeenCalled() // 根据实际实现调整
  })
  it('handles double click action correctly', async () => {
    const row = { id: 1, name: 'Test Dashboard' }
    await wrapper.vm.handleDblclick(row)

    // 验证路由跳转
    expect(mockRouterProvider.navigateTo).toHaveBeenCalled()
  })

  it('handles delete item correctly', async () => {
    const row = { id: 1, name: 'Test Dashboard' }
    ElMessageBox.confirm.mockResolvedValue('confirm')

    await wrapper.vm.deleteItem(row)

    // 验证 API 调用
    expect(publicApi.api.deleteUserDashboardId).toHaveBeenCalledWith(row.id)
    expect(mockQuery).toHaveBeenCalled()
  })

  it('initializes filter options on mount', async () => {
    wrapper.vm.ResponsiveFilterRef = {
      init: vi.fn().mockResolvedValue('true')
    }
    await wrapper.vm.getFilter()
    // 检查 ResponsiveFilterRef 是否初始化
    expect(wrapper.vm.ResponsiveFilterRef.init).toHaveBeenCalled()
  })
})
