<template>
  <el-dialog
    v-model="state.visible"
    :title="state.isEdit ? $t('caseManagement.editPermission') : $t('caseManagement.addPermission')"
    :close-on-click-modal="false"
    class="scroll-dialog big"
    append-to-body
  >
    <el-form ref="FormRef" style="--icon-size: 1.2rem" label-position="top" :model="form">
      <el-form-item prop="isGroup">
        <el-switch v-model="form.isGroup" :active-text="$t('user_UserGroup')" :inactive-text="$t('user_role')"
                   @change="handleIsGroupChange" />
      </el-form-item>
      <template v-if="!form.isGroup">
        <el-form-item
          prop="role"
          :label="$t('user_role')"
          :rules="[{ required: !form.isGroup, message: $t('user_UserGroup') + $t('render.hint.fieldRequired'), trigger: 'change' }]"
        >
          <el-select-v2
            v-model="form.role"
            :options="enableRoleList"
            clearable
            filterable
            :placeholder="$t('common_selectedIsRequiredMsg')"
            @change="handleRecordChange"
          />
        </el-form-item>
      </template>
      <template v-else>
        <el-form-item
          prop="group"
          :label="$t('user_UserGroup')"
          :rules="[{ required: form.isGroup, message: $t('user_UserGroup') + $t('render.hint.fieldRequired'), trigger: 'change' }]"
        >
          <el-select-v2
            v-model="form.group"
            :options="enableGroupList"
            clearable
            filterable
            @change="handleRecordChange"
            :placeholder="$t('common_selectedIsRequiredMsg')"
          />
        </el-form-item>
      </template>

      <el-form-item
        prop="record"
        :label="$t('caseManagement_record')"
        :rules="[{ required: true, message: $t('caseManagement_record') + $t('render.hint.fieldRequired'), trigger: 'change' }]"
      >
        <el-select-v2
          v-model="form.record"
          clearable
          :options="[
            { value: 'all', label: $t('caseManagement_recordAll') },
            { value: 'some', label: $t('caseManagement_recordSome') }
          ]"
          :placeholder="$t('common_selectedIsRequiredMsg')"
          @change="handleRecordChange"
        />
      </el-form-item>
      <template v-if="form.record === 'some'">
        <el-row :gutter="20">
          <el-col :span="5">{{ $t('easyForm.fields') }}</el-col>
          <el-col :span="5">{{ $t('case.condition') }}</el-col>
          <el-col :span="12"
          >{{ $t('case.value') }} <small>({{ $t('case.value_tip') }}</small
          >)
          </el-col
          >
        </el-row>
        <el-row :gutter="20" v-for="(item, index) in form.filed_condition" :key="index">
          <el-col :span="5">
            <el-form-item :prop="`filed_condition[${index}].id`" :rules="[selectRule]">
              <el-select-v2 v-model="item.id" :options="state.caseInformation"
                            @change="(value: any) => handleRowIdChange(value, index)" />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item :prop="`filed_condition[${index}].condition`" :rules="[selectRule]">
              <el-select-v2 v-model="item.condition" :options="item.conditionList" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :prop="`filed_condition[${index}].__cdata`">
              <CaseManagementDetailPermissionValueField
                ref="metaForm"
                :config="item"
                @formChange="(value: any, label: string) => handleValueChange(value, label, index)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="1">
            <SvgIcon class="svgIcon" src="/icons/menu/trash.svg" @click="handleDeleteRow(index)" />
          </el-col>
        </el-row>
        <el-button type="text" @click="handleAdd">{{ $t('easyForm.actionsAdd') }}</el-button>
      </template>
    </el-form>
    <CaseManagementDetailPermissionDrag :list="state.permissionField" />
    <template #footer>
      <el-button id="CaseManagement__Detail__Permission__AddPermission__Delete" v-if="state.isEdit" type="danger"
                 @click="handleDelete">
        {{ $t('common_delete') }}
      </el-button>
      <el-button id="CaseManagement__Detail__Permission__AddPermission__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
const { t } = useI18n()
const inputRule = { required: true, message: t('tip.input'), trigger: 'blur' }
const selectRule = { required: true, message: t('el.select.placeholder'), trigger: 'change' }
import { clientApi } from 'api'

const emits = defineEmits(['refresh', 'delete'])

const props = defineProps<{
  groups: any[]
  caseInformation: []
  exitList: []
}>()
const state = reactive<any>({
  loading: false,
  visible: false,
  setting: {},
  isEdit: true,
  permissionField: {
    mask: [],
    hidden: [],
    edit: [],
    read: []
  },
  caseInformationMap: {},
  conditionList: [
    { label: 'Equal To', value: 'equal' },
    { label: 'Not Equal To', value: 'not equal' },
    { label: 'Greaten Than', value: 'Greaten Than' },
    { label: 'Less Than', value: 'Less Than' },
    { label: 'In Between', value: 'In Between' },
    { label: 'Not Between', value: 'Not Between' }
  ],
  groupList: [],
  roleList: []
})
const form = ref<any>({
  group: '',
  role: '',
  record: 'all',
  filed_condition: []
})
const FormRef = ref()
const enableGroupList = computed(() => {
  if (!state.groupList) return []
  return state.groupList.map((item: any) => {
    item.disabled = props.exitList.some((exitItem: any) => exitItem.group === item.value)
    return item
  })
})
const enableRoleList = computed(() => {
  if (!state.roleList) return []
  return state.roleList.map((item: any) => {
    item.disabled = props.exitList.some((exitItem: any) => exitItem.role === item.value)
    return item
  })
})

function handleIsGroupChange(value: boolean) {
  if (value) {
    form.value.role = ''
  } else {
    form.value.group = ''
  }
}

async function handleSubmit() {
  try {
    await FormRef.value.validate()
  } catch (e) {
    console.error(e)
    return
  }

  state.visible = false
  let permission: any = {}
  let filter: any = {
    filed_condition:
      form.value?.filed_condition?.map((item: any) => ({
        id: item.id,
        condition: item.condition,
        __cdata: item.__cdata,
        type: item.type,
        label: item.label
      })) || []
  }
  if (form.value.isGroup) {
    permission.group = form.value.group
    filter.group = form.value.group
  } else {
    permission.role = form.value.role
    filter.role = form.value.role
  }

  if (state.setting?.permission)
    permission = {
      ...state.setting.permission,
      ...permission
    }

  permission.field = Object.keys(state.permissionField).reduce((prev: any, key: string) => {
    const fields = state.permissionField[key]
    fields.forEach((item: any) => {
      prev.push({
        ...item,
        accesstype: key
      })
    })
    return prev
  }, [])
  // throw new Error('test')
  let result: any = {
    permission,
    filter
  }
  if (form.value.isGroup) {
    result.group = form.value.group
  } else {
    result.role = form.value.role
  }
  emits('refresh', result)

  // } catch (error) {
  // } finally {
  // }
}

function handleDelete() {
  state.visible = false
  emits('delete', state.setting)
}

async function handleOpen(setting: any) {
  await getGroup()
  await getRole()

  state.visible = true
  state.isEdit = false
  form.value.group = ''
  form.value.role = ''
  state.permissionField = {
    hidden: [],
    mask: [],
    read: [],
    edit: []
  }
  if (!!setting) {
    state.isEdit = true
    const isGroupOrRole = setting.permission.group ? 'group' : 'role'
    state.setting = setting
    Object.keys(setting.fieldList).forEach((key) => {
      state.permissionField[key] = [...setting.fieldList[key]]
    })
  }
  setTimeout(() => {
    initOptions()
    if (!!setting) {
      form.value.isGroup = setting.group ? true : false
      form.value.group = setting.group
      form.value.role = setting.role
      form.value.record = setting?.filter?.filed_condition?.length > 0 ? 'some' : 'all'
      form.value.filed_condition =
        setting.filter.filed_condition.map((item: any) => {
          const info = getRowInfo(item.id)
          const _item: any = {
            id: item.id,
            condition: item.condition,
            __cdata: item.__cdata,
            conditionList: getConditionList(item.id),
            type: info.type
          }
          if (info.masterTable) {
            _item.masterTable = info.masterTable
            _item.displayField = info.displayField
          }
          return _item
        }) || []
    } else {
      state.permissionField.read = props.caseInformation
    }
  })
}

function initOptions() {
  let caseInformation: any[] = []
  if (props.caseInformation) caseInformation = props.caseInformation
  state.caseInformation = caseInformation.map((item: any) => ({
    ...item,
    value: item.id,
    label: item.name,
    type: item.type
  }))
}

function handleRecordChange(value: any) {
  form.value.filed_condition = []
  if (value === 'some') handleAdd()
}

let time = 1

function handleAdd() {
  if (!form.value.filed_condition) form.value.filed_condition = []
  const id = new Date().getTime() + time++
  form.value.filed_condition.push({
    id: id,
    condition: '',
    __cdata: '',
    type: '',
    conditionList: []
  })
}

function handleDeleteRow(index: number) {
  form.value.filed_condition.splice(index, 1)
}

function handleValueChange(value: any, label: string, index: number) {
  form.value.filed_condition[index].__cdata = value
  form.value.filed_condition[index].label = label
}

function handleRowIdChange(fieldId: any, index: number) {
  const info = getRowInfo(fieldId)
  const data: any = {
    ...form.value.filed_condition[index],
    type: info.type,
    __cdata: '',
    conditionList: getConditionList(fieldId)
  }
  if (info.type === 'master_table') {
    data.masterTable = info.masterTable
    data.displayField = info.displayField
  }
  form.value.filed_condition[index] = data
}

function getRowInfo(fieldId: string) {
  const info = state.caseInformation.find((item: any) => item.value === fieldId)
  return { ...info }
}

function getConditionList(fieldId: string) {
  const info = state.caseInformation.find((item: any) => item.value === fieldId)
  switch (info.type) {
    case 'float':
    case 'number':
      return [
        { label: 'Equal To', value: 'equal' },
        { label: 'Not Equal To', value: 'not equal' },
        { label: 'Greaten Than', value: 'Greaten Than' },
        { label: 'Less Than', value: 'Less Than' },
        { label: 'In Between', value: 'In Between' },
        { label: 'Not Between', value: 'Not Between' }
      ]
    case 'date':
      return [
        { label: 'Equal To', value: 'equal' },
        { label: 'Not Equal To', value: 'not equal' },
        { label: 'In Between', value: 'In Between' },
        { label: 'Not Between', value: 'Not Between' }
      ]
    case 'boolean':
    case 'master_table':
    case 'user_group':
      return [
        { label: 'Equal To', value: 'equal' },
        { label: 'Not Equal To', value: 'not equal' }
      ]

    default:
      return [
        { label: 'Equal To', value: 'equal' },
        { label: 'Not Equal To', value: 'not equal' },
        { label: 'Contains', value: 'Contains' }
      ]
  }
}

async function getGroup() {
  const groupList = await clientApi.api.postUcenterGroups().then(r => r.data)
  state.groupList = groupList
    ?.sort((a: any, b: any) => a.name.localeCompare(b.name))
    .map((item) => ({
      label: item.name,
      value: item.id
    }))
}

async function getRole() {
  const { flatRole, getRoleTree } = useRBAC()
  if (flatRole.value.length === 0) {
    await getRoleTree()
  }
  state.roleList = flatRole.value.map((item: any) => ({
    label: item.name,
    value: item.id
  }))
}

onMounted(async () => {
})
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
