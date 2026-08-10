<template>
  <div v-loading="state.loading">
    <FormVariablesRenderer
      ref="FormVariablesRendererRef"
      @formChange="handleFormChange"
    />
    <template v-for="(item, key) in state.relationFields">
      <FormVariablesRenderer :ref="(el: any) => RelationRefs[key] = el" />
    </template>
  </div>
</template>
<script lang="ts" setup>
import { globalApi, gatewayApi } from 'api'

const props = withDefaults(
  // @ts-ignore
  defineProps<{
    ignoreList: any;
    isAddRelation: boolean; // 是否是添加关联
    flexible: boolean; // 可选 column
  }>(),
  {
    ignoreList: [],
    isAddRelation: false,
    flexible: false
  }
)
const { t } = useI18n()
const emits = defineEmits(['refresh', 'delete'])
const state = reactive<any>({
  fields: [],
  flexibleFields: [],
  loading: false,
  relationfieldsDetail: {}, // 保存relation数据
  relationFields: {} // 动态生成 RelationRefs
})
const platform = useAppPlatform()
const FormVariablesRendererRef = ref()
const RelationRefs = ref<any>({})

async function getData(needValidation: boolean = false) {
  const data = await FormVariablesRendererRef.value.getData(needValidation)
  if (!data) return
  let pList: any = []
  if (Object.keys(state.relationFields).length > 0) {
    let relationRecords: any = []
    Object.keys(state.relationFields).forEach(async (key) => {
      if (data[key] === 'addNew') delete data[key]
      pList.push(getRelationData(key, relationRecords))
    })
    data.relationRecords = relationRecords
  }
  await Promise.all(pList)
  delete data.flexibleList
  return data

  async function getRelationData(key: string, result: any) {
    const rd = await RelationRefs.value[key].getData(needValidation)
    delete rd[`divider_${key}`]
    if (rd && Object.keys(rd).length > 0) {
      const record: any = {
        data: { ...rd }
      }
      const detail = state.relationfieldsDetail[key]
      if (detail.tableId) record.tableId = detail.tableId
      if (detail._recordId) record.recordId = detail._recordId
      result.push(record)
    }
  }
}

async function init(fields: any, initData: any) {
  state.loading = true
  state.fields = await turnFields(fields, initData, props.flexible)
  const renderFields = props.flexible ? [state.fields[0]] : state.fields
  // const renderFields = state.fields
  FormVariablesRendererRef.value.createJson(renderFields)
  FormVariablesRendererRef.value.setData(initData ? initData : {})
  state.loading = false
}

async function turnFields(fields: any, initData: any, flexible: boolean = false) {
  const typeMap: any = {
    varchar: 'input',
    json: 'json-editor',
    'VARCHAR:255': 'textarea',
    'varchar:4000': 'textarea',
    clob: 'textarea',
    long: 'textarea',
    text: 'textarea',
    bigint: 'int',
    timestamp: 'date',
    bit: 'switch',
    boolean: 'switch',
    decimal: 'number',
    Relation: 'select',
    userGroup: 'userGroup',
    string: 'input',
    number: 'int',
    float: 'number',
    volcaboury: 'vocabulary',
    master_table: 'master_table',
    document: 'document',
    date: 'date'
  }
  const resultFields: any = []
  const pList: any = []
  if (flexible) {
    const _item = {
      name: 'flexibleList',
      label: 'masterTable.flexibleList',
      type: 'select',
      required: false,
      options: {
        filterable: true,
        multiple: true,
        optionItems: fields.reduce((acc: any, cur: any) => {
          if (!props.ignoreList.find((iItem: any) => iItem === cur.columnName)) {
            acc.push({
              label: cur.id || cur.columnName,
              value: cur.label || cur.columnName
            })
          }
          return acc
        }, [])
      }
    }
    resultFields.push(_item)
  }
  fields.forEach(async (item: any) => {
    if (!props.ignoreList.find((iItem: any) => iItem === item.columnName)) {
      const type = typeMap[item.dataType] || 'input'
      const _item: any = {
        name: item.id || item.columnName,
        label: item.label || item.columnName,
        type: type,
        required: item.required,
        options: {}
      }
      if (initData && initData[_item.name])
        _item.options.defaultValue = initData[_item.name]
      if (item.relationTable) {
        state.relationfieldsDetail[_item.name] = { ...item }
        if (initData && initData[`RelationTable_${_item.name}`])
          state.relationfieldsDetail[_item.name].tableId =
            initData[`RelationTable_${_item.name}`]
        if (initData && initData[`RelationRecordId_${_item.name}`])
          state.relationfieldsDetail[_item.name].recordId =
            initData[`RelationRecordId_${_item.name}`]

        const params: any = {
          relationTable: item.relationTable,
          relationField: item.relationField,
          displayField: item.displayField
        }
        pList.push(getRelationOptions(params, _item))
        return
      } else if (item.dataType === 'varchar') {
        _item.maxLength = item.length
        if (item.length > 255) _item.type = 'textarea'
      } else if (item.dataType === 'bigint' || type === 'int') {
        _item.type = 'number'
        _item.options.stepStrictly = true
        _item.options.customClass = ['align-left']
        _item.options.precision = 0
      } else if (item.dataType === 'json') {
        // _item.type = 'textarea'
        // _item.options.maxLength = ''
      } else if (item.dataType === 'date') {
        _item.type = 'date'
      } else if (item.dataType === 'user_group') {
        // _item.type = 'textarea'
        // _item.options.maxLength = ''
        pList.push(getUserGroup(_item))
        return
      } else if (item.dataType === 'master_table') {
        // pList.push(getMasterTable({
        //   id: item.masterTable,
        //   displayField: item.displayField
        // },_item))
        const params: any = {}
        if (item.masterTable) params.id = item.masterTable
        else if (item.masterTableName) params.name = item.masterTableName
        pList.push(getMasterTableOptions(params, item.displayField, _item))
        return
      }
      resultFields.push(_item)
    }
  })
  await Promise.all(pList)
  return resultFields

  async function getRelationOptions(params: any, field: any): Promise<any> {
    try {
      const data: any = await globalApi.getDmsMasterTableRecords(params).then((res) => res.data)

      if (props.isAddRelation)
        data.push({
          [params.displayField]: 'Add New',
          [params.relationField]: 'addNew'
        })
      field.type = 'select'
      field.options.optionItems = data?.map((item: any) => ({
        label: item[params.displayField],
        value: item[params.relationField]
      }))
      field.options.filterable = true
      setField(field)
    } catch (error) {
      field.type = 'input'
      setField(field)
    }
  }

  async function getUserGroup(field: any): Promise<any> {
    try {
      const groups = await gatewayApi.groups.getGroupsSelect().then(r => r.data)
      const _groups = groups?.map((item) => ({
        label: item.label,
        value: item.value
      }))
      const users = await globalApi.postUcenterGetKeycloakAllUsers({}).then((res) => res.data)
      const _users = users?.map((item) => ({
        label: item.username,
        value: item.userId
      }))
      field.type = 'select-v2'
      field.options.optionItems = [
        { label: t('user_groups'), options: _groups },
        { label: t('user_users'), options: _users }
      ]
      field.options.filterable = true
      setField(field)
    } catch (error) {
      field.type = 'input'
      setField(field)
    }
  }

  // async function getMasterTable(params: any, field: any): Promise<any> {
  //   const data = await GetMasterTablesRecordPageApi({
  //     ...params,
  //     pageNum: 0,
  //     pageSize: 10000
  //   })
  //   console.log(data);
  //   field.type = 'select'
  //   field.options.optionItems = data
  //   field.options.filterable = true
  //   setField(field)
  // }

  async function getMasterTableOptions(
    params: any,
    displayField: string,
    field: any
  ): Promise<any> {
    // displayField: displayField
    const record: any = await globalApi.postDmsMasterTableRecordPageNonpermission(params).then((res) => res.data)
    const options = record.map((item: any) => ({
      label: item[displayField],
      value: item[displayField]
    }))
    field.type = 'select'
    field.options.optionItems = options
    field.options.filterable = true
    setField(field)
  }

  function setField(field: any) {
    const index = resultFields.findIndex((item: any) => item.name === field.name)
    if (index !== -1) resultFields.splice(index, 1, field)
    else resultFields.push(field)
  }
}

function handleFormChange({ fieldName, formModel, newValue, oldValue }: any) {
  if (oldValue === 'addNew') {
    handleClearRelationField(fieldName)
  } else if (fieldName === 'flexibleList') {
    handleRenderFlexibleList(formModel)
    return
  } else if (props.flexible && newValue) {
    const field = state.fields.find((item: any) => item.name === fieldName)
    field.options.defaultValue = newValue
  }
  if (props.isAddRelation) handleRelationField(fieldName)
}

function handleRenderFlexibleList(formModel: any) {
  const renderFields = state.fields.reduce((acc: any, cur: any) => {
    if (formModel.flexibleList.includes(cur.name) || cur.name === 'flexibleList') {
      if (cur.name === 'flexibleList') cur.options.defaultValue = formModel[cur.name]
      acc.push(cur)
      handleRelationField(cur.name)
    }
    return acc
  }, [])
  Object.keys(state.relationFields).forEach(async (key) => {
    if (!formModel.flexibleList.includes(key)) delete state.relationFields[key]
  })
  FormVariablesRendererRef.value.createJson(renderFields)
  // FormVariablesRendererRef.value.setData({...formModel})
}

async function getRelationFields(tableId: string, fieldName: string) {
  try {
    if (!state.relationfieldsDetail[fieldName].fields) {
      const relationDeatil: any = await globalApi.getDmsMasterTableId(tableId).then((res) => res.data)
      console.log('relationDeatil', relationDeatil)
      state.relationfieldsDetail[fieldName].fields = relationDeatil.fields
      state.relationfieldsDetail[fieldName].read = relationDeatil.read
      state.relationfieldsDetail[fieldName].edit = relationDeatil.edit
      state.relationfieldsDetail[fieldName].create = relationDeatil.create
      state.relationfieldsDetail[fieldName].enable = relationDeatil.enable
    }
    return state.relationfieldsDetail[fieldName].fields
  } catch (error) {
    state.relationfieldsDetail[fieldName].read = false
    state.relationfieldsDetail[fieldName].edit = false
    state.relationfieldsDetail[fieldName].create = false
    state.relationfieldsDetail[fieldName].enable = false
    return []
  } finally {
    try {
      if (!state.relationfieldsDetail[fieldName].create) {
        const widget = FormVariablesRendererRef.value.getWidgetRef(fieldName)
        const options = widget.getOptionItems()
        const addNewIndex = options.findIndex((t: any) => t.value === 'addNew')
        if (addNewIndex !== -1) options.splice(addNewIndex, 1)
      }
    } catch (error) {
    }
  }
}

async function handleRelationField(fieldName: string) {
  if (!state.relationfieldsDetail[fieldName]) return
  const field = state.relationfieldsDetail[fieldName]
  setTimeout(async () => {
    try {
      const widget = FormVariablesRendererRef.value.getWidgetRef(fieldName)
      const value = widget.getValue()
      if (!value) throw new Error('')
      const options = widget.getOptionItems()
      const o = options.find((t: any) => t.value === value)

      if (!o) throw new Error('')
      state.relationfieldsDetail[fieldName]._recordId = o.id
      handleRenderRelationField(o)
    } catch (error) {
      handleRenderRelationField()
    }
  })

  async function handleRenderRelationField(initData: any = {}) {
    const relationFields = await getRelationFields(field.tableId, fieldName)
    const isContinue =
      platform.value === 'admin'
        ? true
        : initData.id
          ? state.relationfieldsDetail[fieldName].edit
          : state.relationfieldsDetail[fieldName].create
    if (!isContinue) {
      setTimeout(() => {
        delete state.relationFields[fieldName]
        // RelationRefs.value[fieldName].createJson([])
      })
      return
    }
    const _fields = await turnFields(relationFields, initData)
    _fields.unshift({
      name: `divider_${fieldName}`,
      label: fieldName,
      type: 'divider',
      options: {
        contentPosition: 'left'
      }
    })
    state.relationFields[fieldName] = _fields
    setTimeout(() => {
      RelationRefs.value[fieldName].createJson(state.relationFields[fieldName])
    })
  }
}

function handleClearRelationField(fieldName: string) {
  if (!state.relationfieldsDetail[fieldName]) return
  delete state.relationFields[fieldName]
  // RelationRefs.value[fieldName].createJson([])
}

function getWidgetRef(fieldName: string) {
  return FormVariablesRendererRef.value.getWidgetRef(fieldName)
}

defineExpose({ init, getData, getWidgetRef })
</script>
<style lang="scss" scoped>
.formContainer {
  min-height: 200px;
}

:deep(.static-content-item) {
  display: flex !important;
}
</style>
