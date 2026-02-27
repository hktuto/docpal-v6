<template>
  <div class="search-group-bar-filter" v-if="formData && formData.resourceRules">
    <div v-for="(rule, index) in formData.resourceRules" :key="'rule' + index">
      <el-select-v2
        class="attribute-row"
        v-model="rule.attribute"
        :options="resourceAttributes"
        filterable
        :placeholder="$t('render.hint.selectPlaceholder')"
        @change="(val: string) => onResourceAttributeChange(rule, val)"
      >
        <template #default="{ item }">
          <span>{{ item.label }}</span>
          <el-tag v-if="item.tag" class="el-icon--right" :type="item.tagType || 'info'" size="small">
            {{ item.tag }}
          </el-tag>
        </template>
      </el-select-v2>
      <div v-if="rule.type === 'number'" class="filter-row">
        <ElSelect v-model="rule.condition" :placeholder="$t('dhList.condition')">
          <ElOption v-for="cond in numberConditions" :key="cond.value" :label="cond.label" :value="cond.value" />
        </ElSelect>
        <template v-if="rule.condition === 'between'">
          <ElInput v-model.number="rule.value[0]" :placeholder="$t('designer.setting.minValue')" />
          <span> - </span>
          <ElInput v-model.number="rule.value[1]" :placeholder="$t('designer.setting.maxValue')" />
        </template>
        <template v-else>
          <ElInput v-model.number="rule.value[0]" :placeholder="$t('dataField.apiFieldValue')" />
        </template>
      </div>

      <div v-else-if="rule.type === 'select' || rule.type === 'select-dynamic'" class="filter-row">
        <ElSelect v-model="rule.condition" :placeholder="$t('dhList.condition')">
          <ElOption v-for="cond in stringConditions" :key="cond.value" :label="cond.label" :value="cond.value" />
        </ElSelect>
        <el-select-v2
          v-if="rule.selectOptions"
          v-model="rule.value[0]"
          :options="rule.selectOptions"
          filterable
          clearable
          :placeholder="$t('dataField.apiFieldValue')"
        />
      </div>
      <div v-else class="filter-row">
        <ElSelect v-model="rule.condition" :placeholder="$t('dhList.condition')">
          <ElOption v-for="cond in stringConditions" :key="cond.value" :label="cond.label" :value="cond.value" />
        </ElSelect>
        <ElSwitch v-if="rule.type === 'boolean'" v-model="rule.value[0]" />
        <ElInput v-else v-model="rule.value[0]" :placeholder="$t('dataField.apiFieldValue')" />
      </div>
      <el-divider v-if="index !== formData.resourceRules.length - 1 || formData.resourceRules.length > 1"
                  content-position="left">
        <template v-if="index !== formData.resourceRules.length - 1">
          {{ $t(`logic.${formData.condition}`) }}
        </template>
        <ElButton class="delete-button" type="text" icon="el-icon-delete" @click="removeResourceRule(index)"
                  v-if="formData.resourceRules.length > 1" circle />
      </el-divider>
    </div>
    <div class="flex-x-start">
      <el-dropdown v-if="!isOr" type="primary" size="small" split-button @click="addResourceRule"
                   @command="handleCommand">
        {{ $t(`logic.${formData.condition}`) }}
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="and">{{ $t('logic.and') }}</el-dropdown-item>
            <el-dropdown-item command="or">{{ $t('logic.or') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button v-else type="primary" size="small" @click="addResourceRule">
        {{ $t('button.add') }}
      </el-button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { getMasterTableOptions, getUserList, getUserGroupList, getRoleList } from '../meta/metadata'
import { newAdminApi } from 'api'

const props = defineProps({
  isOr: {
    type: Boolean,
    default: false
  },
  formData: {
    type: Object,
    required: true
  },
  resourceAttributes: {
    type: Array as PropType<any[]>,
    required: true
  }
})
const emits = defineEmits(['update:formData'])
const { t } = useI18n()

function handleCommand(command: string) {
  const newFormData = { ...props.formData, condition: command }
  emits('update:formData', newFormData)
}

const numberConditions = [
  { label: t('vxe.renderer.cases.gt'), value: 'gt' },
  { label: t('vxe.renderer.cases.equal'), value: 'eq' },
  { label: t('vxe.renderer.cases.lt'), value: 'lt' },
  { label: t('vxe.renderer.cases.between'), value: 'between' }
]
const stringConditions = [
  { label: t('vxe.renderer.cases.equal'), value: 'eq' },
  { label: t('vxe.renderer.cases.unequal'), value: 'neq' }
]
const selectConditions = stringConditions

// 监听 attribute 变化，自动设置 type
async function onResourceAttributeChange(rule: any, attrValue: string, isInit: boolean = false) {
  const attr = props.resourceAttributes.find((a) => a.value === attrValue)
  if (!isInit) {
    rule.type = attr?.type || ''
    rule.condition = 'eq'
    rule.value = attr?.type === 'boolean' ? false : []
    emits('update:formData', props.formData)
  }
  if (attr?.selectConfig) {
    rule.selectOptions = attr.selectConfig.options ? attr.selectConfig.options : await getSelectOptions(attr?.selectConfig)
    rule.selectConfig = attr?.selectConfig
  }
}

async function getDocumentTypes() {
  try {
    const data = await newAdminApi.postDmsDocpalTypePage({ pageSize: 9999 }).then((res) => res.data)
    if (!data || !data.entryList) return []
    return data.entryList.map((item: any) => ({
      label: item.name,
      value: item.name
    }))
  } catch (e) {
    console.log('getDocumentTypes', e)
  }
}

async function getSelectOptions(selectConfig: any) {
  if (selectConfig.type === 'user') {
    return await getUserList()
  } else if (selectConfig.type === 'user_role_user_group') {
    const options = []
    if (selectConfig.allow !== 'USER_GROUP') {
      options.push({
        label: $t('user_role'),
        value: 'role____',
        options: await getRoleList()
      })
    }
    if (selectConfig.allow !== 'USER_ROLE') {
      options.push({
        label: $t('user_group'),
        value: 'group____',
        options: await getUserGroupList()
      })
    }
    return options.length > 1 ? options : options[0].options
  } else if (selectConfig.type === 'mastertable') {
    return await getMasterTableOptions({
      masterTableName: selectConfig.masterTableName,
      displayColumn: selectConfig.displayColumn,
      valueColumn: selectConfig.valueColumn
    })
  } else if (selectConfig.type === 'document') {
    return await getDocumentTypes()
  }
}

// 添加/删除规则
function addResourceRule() {
  const newRules = [...props.formData.resourceRules, { attribute: '', type: 'string', condition: 'eq', value: [] }]
  const newFormData = { ...props.formData, resourceRules: newRules }
  emits('update:formData', newFormData)
}

function removeResourceRule(index: number) {
  const newRules = [...props.formData.resourceRules]
  newRules.splice(index, 1)
  const newFormData = { ...props.formData, resourceRules: newRules }
  emits('update:formData', newFormData)
}

defineExpose({
  addResourceRule,
  onResourceAttributeChange
})
</script>
<style lang="scss" scoped>
.search-group-bar-filter {
  // border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: var(--app-space-xs);

  :deep(.container-wrapper) {
    min-width: unset;
  }

  :deep(.static-content-item) {
    min-height: unset;
  }

  :deep(.el-form .el-row) {
    padding: unset;
  }
}

.rotateFirst {
  transform: rotate(180deg);
  transition: all 0.5s;
}

.rotateLast {
  transition: all 0.5s;
}

.el-divider--horizontal {
  margin: var(--app-space-s) 0 !important;
}

.el-tag {
  margin-right: var(--app-space-xs);
  margin-bottom: var(--app-space-xs);
}

.filter-row {
  display: flex;
  flex-flow: row nowrap;
  gap: var(--app-space-xs);
  align-items: center;
  justify-content: flex-start;

  .el-select:first-child {
    width: 30rem;
  }
}

.attribute-row {
  margin-bottom: var(--app-space-xs);
}

.delete-button {
  height: 1rem;
}

.flex-x-start {
  margin-top: var(--app-space-xs);
}
</style>
