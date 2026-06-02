<template>
  <div>
    <el-form-item :label="t('mdTable.addColumnField.iconForTrue')">
      <UiIconPicker v-model="formData.icon" @change="handleIconChange" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const props = defineProps<{
  formData: any
}>()

</script>
