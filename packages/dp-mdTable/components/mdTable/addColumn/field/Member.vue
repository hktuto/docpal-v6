<template>
  <div>
     <div class="switch-container">
      <div>允许添加多个成员</div>
      <el-switch v-model="formData.allowMulti" />
    </div>
  </div>
</template>

<script setup lang="ts">
const formData = ref<any>({})
</script>
