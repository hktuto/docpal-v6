<template>
  <el-card class="formContainer">
    <div class="flex-x-start">
      <img src="/logoWithName.png" style="width: 80%" class="logo" />
    </div>
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <div class="footer">
      <el-button type="primary" id="Public_Upload_Submit" @click="handleSubmit">{{ $t('submit') }}</el-button>
    </div>
  </el-card>
</template>
<script lang="ts" setup>
import formJson from './uploadPassword.vform.json'
const emits = defineEmits(['submit'])

const FormRendererRef = ref()
async function handleSubmit() {
  const formData = await FormRendererRef.value.getFormData()
  emits('submit', deepCopy(formData))
}
</script>

<style lang="scss" scoped>
.el-card {
  // position: fixed;
  min-width: 300px;
  max-width: 600px;
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: stretch;

  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.logo {
  width: 80%;
  max-width: 200px;
  margin: 0 auto var(--el-component-size-small) auto;
}
.footer {
  text-align: right;
}
</style>
