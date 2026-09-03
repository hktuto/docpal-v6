import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  FormRenderer,
  UniqueIdGeneratorDetail,
  UniqueIdGeneratorAddDialog,
  UniqueIdGeneratorDuplicateDialog
} from '#components'
import { mockRouterProvider } from './util'
import { adminApi } from './mock/api'
import addDialogForm from '~/components/uniqueIdGenerator/addDialog.vform.json'
import duplicateDialogForm from '~/components/uniqueIdGenerator/duplicateDialog.vform.json'

describe('[admin-unique-id-generator]UniqueIdGeneratorDetail', () => {
  let wrapper: any
  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(UniqueIdGeneratorDetail, {
      global: {
        components: { FormRenderer },
        mocks: {
          $t: (msg: string) => msg,
          $i18n: { t: (key: string) => key }
        },
        provide: {
          [MenuRouterKey]: mockRouterProvider
        }
      },
      props: {
        id: '71f73a02-886d-411c-8ec7-e4bdadc7fb26',
        state: {
          example: {
            prefix: [
              { index: 0, expression: '{var(qwe)}', type: 'variable', value: '123' },
              { index: 1, expression: '{date(HH:mm)}', type: 'date', value: 'HH:mm' },
              { index: 2, expression: '-', type: 'string', value: '-' }
            ],
            suffix: []
          }

        }
      }
    })

  })

  it('should inti the component correctly', async () => {
    const data = {
      id: '71f73a02-886d-411c-8ec7-e4bdadc7fb26',
      name: 'test3',
      idDigit: 2,
      startNumber: 100,
      lastIdValue: null,
      prefix: [
        {
          index: 0,
          expression: '{var(qwe)}',
          type: 'variable',
          value: 'ewq'
        },
        {
          index: 1,
          expression: '{date(yyyy-MM-dd HH:mm)}',
          type: 'date',
          value: 'yyyy-MM-dd HH:mm'
        }
      ],
      suffix: [],
      enabled: true,
      createdBy: 'Joshua',
      modifiedBy: 'Joshua',
      createdDate: '2025-04-25T01:42:53Z',
      modifiedDate: '2025-04-25T01:49:15Z',
      createdByName: 'Joshua',
      modifiedByName: 'Joshua'
    }
    vi.spyOn(adminApi.api, 'getIdTemplatesId').mockResolvedValue({ data: data })
    await wrapper.vm.init()
    await wrapper.vm.$nextTick()
    expect(adminApi.api.getIdTemplatesId).toHaveBeenCalled()
    expect(wrapper.vm.state.form).toEqual(data)
    expect(wrapper.vm.state.example.prefix).toEqual(data.prefix)
    expect(wrapper.vm.state.example.suffix).toEqual(data.suffix)
    expect(wrapper.vm.affixExpressions.prefix).toEqual(['{var(qwe)}', '{date(yyyy-MM-dd HH:mm)}'])
    expect(wrapper.vm.affixExpressions.suffix).toEqual([])
  })

  it('should example Label the component correctly', async () => {
    const testCases = [
      { type: 'string', value: 'test1', expected: 'string' },
      { type: 'date', value: '{date(yyyy-MM-dd)}', expected: 'Date(yyyy-MM-dd)' },
      { type: 'variable', value: '{var(qwe)}', expected: 'qwe' }
    ]

    for (const { type, value, expected } of testCases) {
      const result = await wrapper.vm.handleLabel(type, value)
      await wrapper.vm.$nextTick()
      expect(result).toBe(expected)
    }
  })

  it('should handleDataFormat the component correctly', async () => {
    const testCase = { value: '{var(qwe)}', expected: 'qwe' }
    const result = await wrapper.vm.handleDataFormat(testCase.value)
    await wrapper.vm.$nextTick()
    expect(result).toBe(testCase.expected)
  })

  it('should handleExampleData the component correctly', async () => {
    const testCases = [
      { type: 'string', value: 'test1', expected: 'test1' },
      { type: 'date', value: 'yyyy-MM-dd', expected: formatDate(new Date(), 'yyyy-MM-dd') },
      { type: 'variable', value: 'qwe', expected: 'qwe' }
    ]

    for (const { type, value, expected } of testCases) {
      const result = await wrapper.vm.handleExampleData(type, value)
      await wrapper.vm.$nextTick()
      expect(result).toBe(expected)
    }
  })

  it('should handleGenerateId the component correctly', async () => {
    const data = '123' + formatDate(new Date(), 'HH:mm') + '-0001'
    vi.spyOn(adminApi.api, 'postIdTemplatesValidate').mockResolvedValue({ data: data })
    await wrapper.vm.handleGenerateId()
    await wrapper.vm.$nextTick()
    expect(adminApi.api.postIdTemplatesValidate).toHaveBeenCalled()
    expect(wrapper.vm.state.uniqueId).toBe(data)
  })

  it('should handleOpenTag the component correctly', async () => {
    wrapper.vm.variableDialogRef = {
      handleOpen: vi.fn()
    }

    await wrapper.vm.handleOpenTag('prefix', 'date')
    expect(wrapper.vm.variableDialogRef.handleOpen).toHaveBeenCalledWith('prefix', 'date')

    await wrapper.vm.handleOpenTag('suffix', 'variable')
    expect(wrapper.vm.variableDialogRef.handleOpen).toHaveBeenCalledWith('suffix', 'variable')
  })

  it('should handleAddItemTag date the component correctly', async () => {
    const item = {
      expression: '{date(yyyy-mm-dd)}',
      index: 0,
      type: 'date',
      value: 'yyyy-mm-dd'
    }

    await wrapper.vm.handleVariableConfirm({ item, key: 'prefix', isEdit: false })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.state.form.prefix).toEqual([item])
    expect(wrapper.vm.state.example.prefix).toEqual([item])
    expect(wrapper.vm.affixExpressions.prefix).toEqual([item.expression])
  })

  it('should handleAddItemTag variable the component correctly', async () => {
    const item = {
      expression: '{var(qwe)}',
      index: 0,
      type: 'variable',
      value: '123'
    }

    await wrapper.vm.handleVariableConfirm({ item, key: 'prefix', isEdit: false })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.state.form.prefix).toEqual([item])
    expect(wrapper.vm.state.example.prefix).toEqual([item])
    expect(wrapper.vm.affixExpressions.prefix).toEqual([item.expression])
  })

  it('should handleEditVariable the component correctly', async () => {
    wrapper.vm.state.form.prefix = [
      { index: 0, type: 'variable', expression: '{var(qwe)}', value: '123' },
      { index: 1, type: 'string', expression: '-', value: '-' }
    ]

    const handleOpenEdit = vi.fn()
    wrapper.vm.variableDialogRef = { handleOpenEdit }

    await wrapper.vm.handleEditVariable('prefix', 0)
    await wrapper.vm.$nextTick()

    expect(handleOpenEdit).toHaveBeenCalledWith({
      index: 0,
      type: 'variable',
      affixKey: 'prefix',
      variableName: 'qwe',
      variableValue: '123'
    })
  })

  it('should handleEditItemTag the component correctly', async () => {
    wrapper.vm.state.form.prefix = [
      { index: 0, type: 'variable', expression: '{var(qwe)}', value: '123' },
      { index: 1, type: 'string', expression: '-', value: '-' }
    ]
    wrapper.vm.state.example.prefix = deepCopy(wrapper.vm.state.form.prefix)

    const item = {
      index: 0,
      type: 'variable',
      expression: '{var(qwe)}',
      value: '111'
    }

    await wrapper.vm.handleVariableConfirm({ item, key: 'prefix', isEdit: true })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.state.form.prefix[0]).toEqual(item)
    expect(wrapper.vm.state.example.prefix[0]).toEqual(item)
    expect(wrapper.vm.affixExpressions.prefix[0]).toBe('{var(qwe)}')
  })

  it('should handleAddItemTag the component correctly', async () => {
    wrapper.vm.state.form.prefix = [
      { index: 0, type: 'variable', expression: '{var(qwe)}', value: '123' },
      { index: 1, type: 'string', expression: '-', value: '-' }
    ]
    wrapper.vm.state.example.prefix = deepCopy(wrapper.vm.state.form.prefix)

    const item = {
      index: 0,
      type: 'variable',
      expression: '{var(newVar)}',
      value: '111'
    }

    await wrapper.vm.handleVariableConfirm({ item, key: 'prefix', isEdit: true })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.affixExpressions.prefix[0]).toBe('{var(newVar)}')
    expect(wrapper.vm.state.form.prefix[0]).toEqual({
      expression: '{var(newVar)}',
      value: '111',
      type: 'variable',
      index: 0
    })
    expect(wrapper.vm.state.example.prefix[0]).toEqual({
      expression: '{var(newVar)}',
      value: '111',
      type: 'variable',
      index: 0
    })
  })

  it('should handleAffixTagsChange the ', async () => {
    wrapper.vm.state.form.prefix = [
      { index: 0, type: 'variable', expression: '{var(qwe)}', value: '123' },
      { index: 1, type: 'string', expression: '-', value: '-' },
      { index: 2, type: 'variable', expression: '{var(ewq)}', value: '312' }
    ]

    const newPrefix = [
      { index: 0, type: 'variable', expression: '{var(ewq)}', value: '312' },
      { index: 1, type: 'string', expression: '-', value: '-' },
      { index: 2, type: 'variable', expression: '{var(qwe)}', value: '123' }
    ]

    await wrapper.vm.handleAffixTagsChange('prefix', ['{var(ewq)}', '-', '{var(qwe)}'])
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.state.form.prefix).toEqual(newPrefix)
    expect(wrapper.vm.state.example.prefix).toEqual(newPrefix)
  })

  it('should handleSubmit the component correctly', async () => {
    wrapper.vm.state.form = {
      id: '21312313',
      name: 'Test1',
      prefix: [
        { index: 0, type: 'variable', expression: '{var(qwe)}', value: '123' },
        { index: 1, type: 'string', expression: '-', value: '-' }
      ],
      suffix: [],
      idDigit: 4,
      startNumber: 1
    }

    await wrapper.vm.handleSubmit()
    expect(wrapper.vm.state.loading).toBe(false)
  })

})

describe('[admin-unique-id-generator]UniqueIdGeneratorAddDetail', () => {
  let wrapper: any
  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(UniqueIdGeneratorAddDialog, {
      global: {
        components: { FormRenderer },
        mocks: {
          $t: (msg: string) => msg,
          $i18n: { t: (key: string) => key }
        },
        provide: {
          [MenuRouterKey]: mockRouterProvider
        }
      }
    })

  })

  it('should addDialog handleSubmit the component correctly', async () => {
    const data = {
      id: '71f73a02-886d-411c-8ec7-e4bdadc7fb26',
      name: 'test1',
      idDigit: 2,
      startNumber: 100,
      lastIdValue: null,
      prefix: [
        {
          index: 0,
          expression: '{var(qwe)}',
          type: 'variable',
          value: 'ewq'
        },
        {
          index: 1,
          expression: '{date(yyyy-MM-dd HH:mm)}',
          type: 'date',
          value: 'yyyy-MM-dd HH:mm'
        }
      ],
      suffix: [],
      enabled: true,
      createdBy: 'Joshua',
      modifiedBy: 'Joshua',
      createdDate: '2025-04-25T01:42:53Z',
      modifiedDate: '2025-04-25T01:49:15Z',
      createdByName: 'Joshua',
      modifiedByName: 'Joshua'
    }
    vi.spyOn(adminApi.api, 'postIdTemplates').mockResolvedValue({ data: data })
    const formData = {
      name: 'test1'
    }
    wrapper.vm.state.visible = true

    wrapper.vm.FormRendererRef = {
      getFormData: vi.fn().mockResolvedValue(formData),
      vFormRenderRef: {
        resetForm: vi.fn(),
        setFormJson: vi.fn().mockResolvedValue(addDialogForm)
      }
    }

    await wrapper.vm.handleSubmit()
    await wrapper.vm.$nextTick()

    expect(adminApi.api.postIdTemplates).toHaveBeenCalled()
    expect(mockRouterProvider.navigateTo).toHaveBeenCalledWith(expect.anything(), false)
  })
})

describe('[admin-unique-id-generator]UniqueIdGeneratorDuplicateDetail', () => {
  let wrapper: any
  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(UniqueIdGeneratorDuplicateDialog, {
      global: {
        components: { FormRenderer },
        mocks: {
          $t: (msg: string) => msg,
          $i18n: { t: (key: string) => key }
        },
        provide: {
          [MenuRouterKey]: mockRouterProvider
        }
      }
    })
  })

  it('should duplicateDialog handleSubmit the component correctly', async () => {
    const data = {
      id: '71f73a02-886d-411c-8ec7-e4bdadc7fb26',
      name: 'test1',
      idDigit: 2,
      startNumber: 100,
      lastIdValue: null,
      prefix: [
        {
          index: 0,
          expression: '{var(qwe)}',
          type: 'variable',
          value: 'ewq'
        },
        {
          index: 1,
          expression: '{date(yyyy-MM-dd HH:mm)}',
          type: 'date',
          value: 'yyyy-MM-dd HH:mm'
        }
      ],
      suffix: [],
      enabled: true,
      createdBy: 'Joshua',
      modifiedBy: 'Joshua',
      createdDate: '2025-04-25T01:42:53Z',
      modifiedDate: '2025-04-25T01:49:15Z',
      createdByName: 'Joshua',
      modifiedByName: 'Joshua'
    }
    vi.spyOn(adminApi.api, 'postIdTemplates').mockResolvedValue({ data: data })
    const formData = {
      name: 'test1'
    }
    wrapper.vm.state.visible = true

    wrapper.vm.FormRendererRef = {
      getFormData: vi.fn().mockResolvedValue(formData),
      vFormRenderRef: {
        resetForm: vi.fn(),
        setFormJson: vi.fn().mockResolvedValue(duplicateDialogForm)
      }
    }

    await wrapper.vm.handleSubmit()
    await wrapper.vm.$nextTick()

    expect(adminApi.api.postIdTemplates).toHaveBeenCalled()
    expect(adminApi.api.putIdTemplatesId).toHaveBeenCalled()
    expect(mockRouterProvider.message.success).toHaveBeenCalledWith(expect.stringContaining('tip_createdSuccessMsg'));
    expect(wrapper.vm.state.visible).toBe(false)
  })
})
