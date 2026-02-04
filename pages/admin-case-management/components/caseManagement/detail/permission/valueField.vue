<template>
  <el-date-picker
    v-if="type === 'date'"
    v-model="state.value"
    type="date"
    format="YYYY-MM-DD"
    value-format="YYYY-MM-DD"
    @change="handleChange"
  />
  <el-input
    v-else-if="type === 'input'"
    v-model="state.value"
    :placeholder="$t('tip.input')"
    clearable
    @change="handleChange"
  />
  <el-input-number
    v-else-if="numberTypes.includes(type)"
    v-model="state.value"
    v-bind="state.precisionSetting"
    controls-position="right"
    :placeholder="$t('tip.input')"
    clearable
    @change="handleChange"
  />

  <el-switch
    v-else-if="type === 'boolean'"
    v-model="state.value"
    @change="handleChange"
  />
  <div v-else-if="type === 'number-range'" class="range-input">
    <el-input-number
      v-model="state.value[0]"
      v-bind="state.precisionSetting"
      controls-position="right"
      :placeholder="$t('tip.input')"
      clearable
      @change="(value: number)=>handleChange([value, state.value[1]])"
    />
    -
    <el-input-number
      v-model="state.value[1]"
      v-bind="state.precisionSetting"
      controls-position="right"
      :placeholder="$t('tip.input')"
      clearable
      @change="(value: number)=> handleChange([state.value[0], value])"
    />
  </div>
  <div v-else-if="type === 'date-range'" class="range-input">
    <el-date-picker
      v-model="state.value[0]"
      type="date"
      format="YYYY-MM-DD HH:mm:ss"
      value-format="YYYY-MM-DD HH:mm:ss"
      default-time="2000-01-01 00:00:00"
      @change="(value: string) => handleChange([value, state.value[1]])"
    />
    -
    <el-date-picker
      v-model="state.value[1]"
      type="date"
      format="YYYY-MM-DD HH:mm:ss"
      value-format="YYYY-MM-DD HH:mm:ss"
      default-time="2000-01-01 23:59:59"
      @change="(value: string) => handleChange([state.value[0], value])"
    />
  </div>
  <el-select-v2
    v-else-if="type === 'master_table'"
    v-model="state.value"
    :options="state.recordOptions"
    filterable
    clearable
    @change="handleChange"
  >
  </el-select-v2>
  <el-select-v2
    v-else-if="type === 'user_group'"
    v-model="state.value"
    :options="state.userOptions"
    filterable
    clearable
    @change="handleChange"
  >
  </el-select-v2>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import { getGroupsSelectOption } from '#imports'

const props = defineProps(['config', 'value'])

const emits = defineEmits(['formChange'])
const { t } = useI18n()
const state = reactive<any>({
  value: '',
  precisionSetting: {},
  options: [],
  recordOptions: [],
  userOptions: []
})
const numberTypes = ['number', 'float']
const type = computed(() => {
  const type = props.config.type || 'date'
  switch (props.config.condition) {
    case 'In Between':
    case 'Not Between':
      if (type === 'date') {
        return 'date-range'
      } else if (numberTypes.includes(type)) {
        setPrecision(type)
        return 'number-range'
      }
      break
    case 'equal':
    case 'not equal':
      if (type === 'date') {
        return 'date'
      } else if (type === 'user_group') {
        return 'user_group'
      } else if (type === 'master_table') {
        return 'master_table'
      } else if (numberTypes.includes(type)) {
        setPrecision(type)
        return 'number'
      } else if (type === 'boolean') {
        return 'boolean'
      } else {
        return 'input'
      }
    default:
      if (numberTypes.includes(type)) {
        setPrecision(type)
        return 'number'
      }
      return 'input'
  }
})

function setPrecision(type: string) {
  if (type === 'number') state.precisionSetting.precision = 0
  else state.precisionSetting = {}
}

function handleChange(value: any) {
  let _value = value
  let label = ''
  if (Array.isArray(value)) {
    const dateRange: any = {}
    if (value[0]) dateRange.start = value[0]
    if (value[1]) dateRange.end = value[1]
    _value = JSON.stringify(dateRange)
  }
  emits('formChange', _value, label)
}

function setValue(value: any) {
  state.value = value
}

async function getMasterTableOptions(masterTableId: string, displayField: string) {
  if (state.recordOptions.length > 0) return
  const params = {
    id: masterTableId
  }
  // displayField: displayField
  try {
    const record: any = await newAdminApi.postDmsMasterTableRecordPageNonpermission(params).then((res) => res.data)
    state.recordOptions = record.map((item: any) => ({
      label: item[displayField],
      value: item[displayField]
    }))
  } catch (error) {
    state.recordOptions = []
  }
}

async function getUserGroupOptions() {
  if (state.userOptions.length > 0) return
  const userData: any = await newAdminApi.postUcenterGetKeycloakAllUsers({}).then((res) => res.data)
  const userList = userData.map((item: any) => ({
    value: item.userId || item.username,
    label: item.username || item.userId
  }))
  const groups = await getGroupsSelectOption().sort((a: any, b: any) => a.label.localeCompare(b.label))

  state.userOptions = [
    {
      label: t('user_groups'),
      value: 'user_groups',
      options: groups
        .map((item: any) => ({
          label: item.name,
          value: 'UserGroupId:' + item.id
        }))
        .filter((item: any) => !item.id)
    },
    {
      label: t('user_users'),
      value: 'user_users',
      options: userList.map((item: any) => ({
        label: item.label,
        value: 'UserId:' + item.value
      }))
    }
  ]
}

function isJSON(str: string) {
  try {
    JSON.parse(str)
  } catch (e) {
    // 转换出错，抛出异常
    return false
  }
  return true
}

watch(
  () => props.config,
  (newValue, oldValue) => {
    if (!oldValue || newValue.__cdata !== oldValue.__cdata) {
      if (isJSON(newValue.__cdata) && JSON.parse(newValue.__cdata) instanceof Object) {
        const cData = JSON.parse(newValue.__cdata)
        let cDataArr = ['', '']
        if (cData.start)
          cDataArr[0] = ['number', 'float'].includes(newValue.type)
            ? Number(cData.start)
            : cData.start
        if (cData.end)
          cDataArr[1] = ['number', 'float'].includes(newValue.type)
            ? Number(cData.end)
            : cData.end
        setValue(cDataArr)
      } else {
        let _cData = newValue.__cdata
        if (['number', 'float'].includes(newValue.type)) _cData = Number(_cData)
        else if (newValue.type === 'boolean')
          _cData = _cData === 'false' ? false : Boolean(_cData)
        setValue(_cData)
      }
    } else if (!newValue.__cdata && newValue.type && newValue.condition) {
      if (['Not Between', 'In Between'].includes(newValue.condition)) {
        if (['number', 'float'].includes(newValue.type)) {
          setValue([0, 0])
        } else if (newValue.type === 'date') {
          setValue(['', ''])
        }
      }
    }
    if (newValue.type === 'master_table')
      getMasterTableOptions(newValue.masterTable, newValue.displayField)
    else if (newValue.type === 'user_group') getUserGroupOptions()
  },
  {
    immediate: true,
    deep: true
  }
)
</script>
<style lang="scss" scoped>
.range-input {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr min-content 1fr;
  gap: 0 5px;

  :deep(.el-date-editor.el-input) {
    width: 100% !important;
  }
}

.el-input-number {
  width: 100% !important;
}
</style>
