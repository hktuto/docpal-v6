<template>
  <div>
     <div class="switch-container">
      <div>{{ t('mdTable.addColumnField.allowMultipleMembers') }}</div>
      <el-switch v-model="formData.allowMulti" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const formData = ref<any>({})
</script>
