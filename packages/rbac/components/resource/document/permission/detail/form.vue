<template>
  <el-form ref="formRef" :model="formData" label-position="top">
    <el-form-item
      :label="$t('user_role')"
      prop="targetId"
      :rules="[{ required: true, message: $t('render.hint.fieldRequired', { name: $t('user_role') }), trigger: 'change' }]"
    >
      <el-select v-model="formData.targetId" :disabled="isEdit" :placeholder="$t('choose', { name: $t('user_role') })"
                 filterable>
        <el-option-group v-for="options in _targetOptions" :key="options.label" :label="$t(options.label)">
          <el-option v-for="item in options.options" :key="item.value" :label="item.label" :value="item.value"
                     :disabled="item.disabled" />
        </el-option-group>
      </el-select>
    </el-form-item>

    <ResourceDocumentPermissionDetailCheckboxForm ref="checkboxFormRef" />
  </el-form>
</template>

<script setup lang="ts">
const props = defineProps<{
  isFolder: boolean
  isEdit: boolean
  targetOptions: any[]
}>()
const _targetOptions = computed(() => {
  if (!props.targetOptions) return []
  return props.targetOptions.map((item: any) => {
    return {
      ...item,
      options: item.selectConfig.options.map((option: any) => {
        return {
          ...option,
          value: '&&' + item.value + '&&' + option.value
        }
      })
    }
  })
})
const formRef = ref()
const checkboxFormRef = ref({})
type SaveData = {
  resourceId: string
  resourceType: number // (1=Document)
  targetType: number // (1=User, 2=Role, 3=Group, 4=User Set)
  targetId: string
  permissionLevel: number //(1=Read, 2=ReadWrite, 3=Manage, 4=Custom, 5=Configuration Set)
  permissionIds: number[]
  configurationRuleName: string
  members: any[] //TODO : create type
  rules: any[] //TODO : create type
}
type FormData = {
  resourceId: string
  resourceType: number
  targetType: number
  targetId: string
}
const formData = ref<FormData>({
  resourceId: '',
  resourceType: 1,
  targetType: 2,
  targetId: '',
  permissionLevel: 0,
  permissionIds: []
})

function setFormData(data: SaveData) {
  formData.value.resourceId = data.resourceId
  formData.value.resourceType = data.resourceType
  formData.value.targetType = data.targetType
  formData.value.targetId = data.targetId ? '&&' + data.targetType + '&&' + data.targetId : ''
  // formData.value.permissionLevel = data.permissionLevel
  // formData.value.permissionIds = data.permissionIds
  checkboxFormRef.value.setData({
    permissionLevel: data.permissionLevel,
    permissionIds: data.permissionIds
  })
}

async function getFormData() {
  try {
    await formRef.value.validate()
    const permissondata = checkboxFormRef.value.getData()
    return {
      resourceType: formData.value.resourceType || 1,
      resourceId: formData.value.resourceId,
      targetType: getTargetType(formData.value.targetId),
      targetId: getTargetId(formData.value.targetId),
      ...permissondata
    }
  } catch (e) {
    console.error(e)
  }

  function getTargetType(targetId: string) {
    return Number(targetId.split('&&')[1])
  }

  function getTargetId(targetId: string) {
    return targetId.split('&&')[2] || ''
  }
}

// 暴露方法给父组件
defineExpose({
  formRef,
  formData,
  setFormData,
  getFormData
})
</script>

<style scoped>
.el-divider {
  margin: 20px 0;
}

.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
