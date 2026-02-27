<template>
  <el-dialog v-model="visible" :title="$t('docType.ruleTitle', { name: title })" width="600px"
             :before-close="handleClose" class="scroll-dialog">
    <el-form ref="ruleFormRef" :model="formData" :rules="rules" label-position="top">
      <!-- 规则名称 -->
      <el-form-item :label="$t('docType.ruleName')" prop="name">
        <el-input v-model="formData.name"
                  :placeholder="$t('render.hint.fieldRequired', { name: $t('docType.ruleName') })" clearable />
      </el-form-item>
      <DocTypePermissionUserRules ref="UserRulesRef" :targetOptions="permission" />
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">Cancel</el-button>
        <el-button v-if="selectedIndex > -1" type="danger" @click="handleRemove">Remove</el-button>
        <el-button type="primary" @click="handleSave" :loading="loading">Save</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getPermissionSelectOption } from '#imports'

const props = defineProps<{
  title: string
}>()
const { t } = useI18n()
// Emits
const emit = defineEmits(['add', 'remove'])
// 响应式数据
const visible = ref(false)
const ruleFormRef = ref<FormInstance>()
const isEdit = ref(false)
const loading = ref(false)
const selectedIndex = ref(-1)
// 表单数据
const formData = reactive<RuleForm>({
  name: '',
  conditions: [
    {
      attribute: 'userRole',
      condition: 'not_equal',
      value: 'financeManager'
    }
  ]
})
const permission = ref([])

// 表单验证规则
const rules: FormRules = {
  name: [{ required: true, message: t('render.hint.fieldRequired', { name: t('docType.ruleName') }), trigger: 'blur' }]
}
const UserRulesRef = ref()
// 打开弹窗
const handleOpen = async (data: any, index: number = -1) => {
  visible.value = true
  selectedIndex.value = index

  setTimeout(() => {
    formData.name = data?.name ? data.name : ''
    const conditions = data?.conditions ? data.conditions : null
    UserRulesRef.value.setFormData(conditions)
    console.log(data)
  }, 100)
  try {
    loading.value = true
    permission.value = await getPermissionSelectOption()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 关闭弹窗
const handleClose = () => {
  visible.value = false
}

// 保存
const handleSave = async () => {
  if (!ruleFormRef.value) return

  try {
    await ruleFormRef.value.validate()
    const conditions = UserRulesRef.value.getFormData()
    if (selectedIndex.value > -1) {
      emit('update', { ...formData, conditions }, selectedIndex.value)
    } else {
      emit('add', { ...formData, conditions })
    }
    ElMessage.success('保存成功')
    handleClose()
  } catch (error) {
    ElMessage.error('请检查表单信息')
  }
}

// 删除
const handleRemove = () => {
  emit('remove', selectedIndex.value)
  ElMessage.success('删除成功')
  handleClose()
}

// 暴露方法给父组件
defineExpose({
  handleOpen
})
</script>

<style scoped></style>
