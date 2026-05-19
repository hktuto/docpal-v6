<template>
  <el-card class="formContainer">
    <div class="flex-x-start">
      <img src="/logoWithName.png" style="width: 80%" class="logo" />
    </div>
    <div class="message dpTitle">{{ $t("dpTable_message") }}</div>
    <div class="message-content" v-html="fileRequestDetail.uploadRequest.message"></div>
    <FileInputBlob ref="FileInputBlobRef" v-bind="fileOptions"></FileInputBlob>
    <div class="footer">
      <el-button type="primary" @click="handleSubmit">{{ $t("submit") }}</el-button>
    </div>
  </el-card>
</template>
<script lang="ts" setup>
import { ElMessage } from 'element-plus'
const props = defineProps<{
  fileRequestDetail?: any;
}>();
const emits = defineEmits(["submit"]);
const fileOptions = computed(() => {
  let fileMaxSize: any = 1200;
  if (props.fileRequestDetail.uploadFileMaxSize) {
    fileMaxSize = props.fileRequestDetail.uploadFileMaxSize
      .replace("M", "")
      .replace("G", "");
    fileMaxSize = Number(fileMaxSize);
  }
  return {
    limit: props.fileRequestDetail.uploadRequest.maximum || "",
    accept: props.fileRequestDetail.uploadRequest.fileType || "",
    multiple: true,
    fileMaxSize,
  };
});
const FileInputBlobRef = ref();
function getFilesBlob() {
  return FileInputBlobRef.value.getFilesBlob();
}
function handleSubmit() {
  const data = getFilesBlob();
  if (data.length === 0) {
    ElMessage.warning('No file selected')
    return
  }
  emits("submit", data);
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
  .logo {
    width: 80%;
    max-width: 200px;
    margin: 0 auto var(--el-component-size-small) auto;
  }
}

.footer {
  text-align: right;
}
:deep(.el-upload-list) {
  max-height: 30vh;
  overflow: auto;
}
.message {

}
.message-content {
  margin-top: var(--app-space-xs);
  margin-bottom: var(--app-space-s);
}
</style>
