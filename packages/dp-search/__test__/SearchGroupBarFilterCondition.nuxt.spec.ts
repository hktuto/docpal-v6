import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { SearchGroupBarFilterCondition } from '#components'
import { globalApi } from './mock/api'

// Mock child components
const mockSearchGroupBarFilterForm = {
  template: '<div>SearchGroupBarFilterForm</div>',
  methods: {
    getFormData: vi.fn().mockResolvedValue({
      queryType: 'keyword',
      keyword: 'test',
      synonyms: false,
      includeLanguages: []
    })
  }
}

const mockElDivider = {
  template: '<div class="el-divider"></div>'
}

const mockElDropdown = {
  template: '<div class="el-dropdown"><slot /><slot name="dropdown" /></div>',
  props: ['type', 'size', 'split-button'],
  emits: ['click', 'command']
}

const mockElDropdownMenu = {
  template: '<div class="el-dropdown-menu"><slot /></div>'
}

const mockElDropdownItem = {
  template: '<div class="el-dropdown-item"></div>',
  props: ['command']
}

const mockElTag = {
  template: '<div class="el-tag"><slot /></div>',
  props: ['closable'],
  emits: ['close']
}

const mockElIcon = {
  template: '<div class="el-icon"></div>',
  props: ['class']
}

const ArrowUp = {
  template: '<div class="arrow-up"></div>'
}

describe('[dp-search]SearchGroupBarFilterCondition', () => {
  let wrapper: any
  let getFormDataSpy: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    getFormDataSpy = vi.fn().mockResolvedValue({
      queryType: 'keyword',
      keyword: 'test',
      synonyms: false,
      includeLanguages: []
    })

    const qItem = {
      id: 'test-id',
      condition: 'and',
      matchs: [
        {
          id: 'match-1',
          queryType: 'keyword',
          value: 'test',
          type: 'string',
          option: {
            matchCase: false,
            fullMatch: false,
            synonyms: false,
            includeLanguages: []
          }
        }
      ]
    }

    wrapper = mount(SearchGroupBarFilterCondition, {
      props: {
        qItem,
        id: 'test-id'
      },
      global: {
        mocks: {
          $t: (msg: string) => msg,
          $i18n: { t: (key: string) => key }
        },
        components: {
          SearchGroupBarFilterForm: mockSearchGroupBarFilterForm,
          ElDivider: mockElDivider,
          ElDropdown: mockElDropdown,
          ElDropdownMenu: mockElDropdownMenu,
          ElDropdownItem: mockElDropdownItem,
          ElTag: mockElTag,
          ElIcon: mockElIcon,
          ArrowUp
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Mock formRef
    wrapper.vm.formRef = {
      'match-1': {
        getFormData: getFormDataSpy
      }
    }
  })

  it('should render correctly', () => {
    expect(wrapper.find('.search-group-bar-filter').exists()).toBe(true)
    expect(wrapper.find('.el-icon').exists()).toBe(true)
  })

  it('should handle mode toggle correctly', async () => {
    expect(wrapper.vm.mode).toBe('edit')
    
    await wrapper.vm.handleUp()
    
    expect(wrapper.vm.mode).toBe('view')
  })

  it('should handle add filter correctly', () => {
    wrapper.vm.handleAddFilter()
    
    expect(wrapper.emitted('add')).toBeTruthy()
  })

  it('should handle command correctly', () => {
    wrapper.vm.handleCommand('or')
    
    expect(wrapper.emitted('command')).toBeTruthy()
    expect(wrapper.emitted('command')[0][0]).toBe('or')
  })

  it('should handle delete correctly', () => {
    const item = { id: 'match-1' }
    wrapper.vm.handleDelete(item)
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('should handle delete when only one match remains', () => {
    wrapper.vm.qItem.matchs = [{ id: 'match-1' }]
    const item = { id: 'match-1' }
    
    wrapper.vm.handleDelete(item)
    
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('should get data correctly', async () => {
    const result = await wrapper.vm.getData()
    
    expect(result).toHaveLength(1)
    expect(result[0].queryType).toBe('keyword')
    expect(result[0].value).toBe('test')
  })


  it('should expose correct methods', () => {
    expect(wrapper.vm.getData).toBeDefined()
  })

  it('should render edit mode correctly', () => {
    wrapper.vm.mode = 'edit'
    wrapper.vm.$nextTick()
    
    expect(wrapper.find('.el-dropdown').exists()).toBe(true)
  })

  it('should handle multiple matches in getData', async () => {
    wrapper.vm.qItem.matchs = [
      {
        id: 'match-1',
        queryType: 'keyword',
        value: 'test1'
      },
      {
        id: 'match-2',
        queryType: 'documentTypes',
        value: ['pdf', 'doc']
      }
    ]
    
    wrapper.vm.formRef = {
      'match-1': {
        getFormData: vi.fn().mockResolvedValue({
          queryType: 'keyword',
          keyword: 'test1'
        })
      },
      'match-2': {
        getFormData: vi.fn().mockResolvedValue({
          queryType: 'documentTypes',
          documentTypes: ['pdf', 'doc']
        })
      }
    }
    
    const result = await wrapper.vm.getData()
    
    expect(result).toHaveLength(2)
    expect(result[0].queryType).toBe('keyword')
    expect(result[1].queryType).toBe('documentTypes')
  })
  
  it('should handle metadata type in getData', async () => {
    wrapper.vm.formRef = {
      'match-1': {
        getFormData: vi.fn().mockResolvedValue({
          queryType: 'metadata',
          metadataKey: 'testKey',
          metadataValue: 'testValue',
          fullMatch: false
        })
      }
    }
    
    const result = await wrapper.vm.getData()
    
    expect(result).toHaveLength(1)
    expect(result[0].queryType).toBe('metadata')
    expect(result[0].value.key).toBe('testKey')
    expect(result[0].value.value).toBe('testValue')
  })

  it('should collapse to view mode when keyword value is empty', async () => {
    wrapper.vm.formRef = {
      'match-1': {
        getFormData: vi.fn().mockResolvedValue({
          queryType: 'keyword'
        })
      }
    }

    await wrapper.vm.handleUp()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.mode).toBe('view')
    expect(wrapper.find('.search-group-bar-filter').exists()).toBe(true)
  })
})
