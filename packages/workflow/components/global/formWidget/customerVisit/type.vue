<script setup lang="ts">
const { t } = useI18n()
const { formData } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const activity_type = ref<string>('Regular Visitor')

const showSupplier = computed(() => {
  return activity_type.value === 'Joint Visitor'
})

const supplierInfo = reactive({
  supplierName: '',
  contactName: '',
  position: '',
  telephone: '',
  email: ''
})

const formRef = ref()
const supplierRules = {
  supplier_name: [{ required: true, message: t('render.hint.fieldRequired', { name: t('customerVisit.supplierName') }), trigger: 'blur' }],
  name: [{ required: true, message: t('render.hint.fieldRequired', { name: t('customerVisit.name') }), trigger: 'blur' }],
  email: [{ validator: validateEmail, trigger: 'blur' }]
}

function validateEmail(_rule: unknown, value: string, callback: (error?: Error) => void) {
  if (!value) {
    callback(new Error(t('render.hint.fieldRequired', { name: t('customerVisit.email') })))
    return
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(value)) {
    callback(new Error(t('user_emailFormatError')))
    return
  }
  callback()
}

async function getFormData(needValidation = true) {
  const result = {
    activity_type: activity_type.value
  }
  if (showSupplier.value && supplierInfo.supplierName !== '' && supplierInfo.contactName !== '') {
    result.supplier_name = supplierInfo.supplierName
    result.supplier_contactName = supplierInfo.contactName ?? ''
    result.supplier_position = supplierInfo.position ?? ''
    result.supplier_telephone = supplierInfo.telephone ?? ''
    result.supplier_email = supplierInfo.email ?? ''
  }

  if (!needValidation) return result
  await formRef.value?.validate()
  return result
}

defineExpose({ getFormData })
</script>

<template>
  <el-form-item>
    <el-radio-group v-model="activity_type">
      <el-radio value="Regular Visitor">{{ t('customerVisit.regularVisitor') }}</el-radio>
      <el-radio value="Joint Visitor">{{ t('customerVisit.jointVisitor') }}</el-radio>
    </el-radio-group>
  </el-form-item>

  <div v-if="showSupplier">
    <el-divider content-position="left">{{ t('customerVisit.supplierInfo') }}</el-divider>
    <el-form ref="formRef" :model="supplierInfo" :rules="supplierRules" label-position="top" class="all-input-style">
      <el-row>
        <el-col :span="6">
          <el-form-item :label="t('customerVisit.supplierName')" prop="supplier_name">
            <el-input v-model="supplierInfo.supplierName" />
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item :label="t('customerVisit.name')" prop="name">
            <el-input v-model="supplierInfo.contactName" />
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item :label="t('customerVisit.position')">
            <el-input v-model="supplierInfo.position" />
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item :label="t('customerVisit.telephone')">
            <el-input v-model="supplierInfo.telephone" />
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item :label="t('customerVisit.email')" prop="email">
            <el-input v-model="supplierInfo.email" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>
<style scoped lang="scss">
.all-input-style {
  ::v-deep(.el-input) {
    width: 95%;
  }
}
</style>
