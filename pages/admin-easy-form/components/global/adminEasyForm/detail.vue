<template>
  <div class="pageContainer--padding main">
    <EasyFormDetailName :detail="state.detail" @refresh="getDetail" />
    <EasyFormDetailInfomation :detail="state.detail" @refresh="getDetail" />
    <EasyFormDetailPreview
      v-if="state.detail.id"
      :detail="state.detail"
      @email-update="handleEmailUpdate"
    />
    <EasyFormDetailPermission :detail="state.detail" @refresh="getDetail" />
    <EasyFormAction
      :detail="state.detail"
      @refresh="handleUpdateAction"
      @delete="handleDeleteAction"
      
    />
    <EasyFormDetailEmailLog ref="logRef" :detail="state.detail" />
  </div>
</template>
<script lang="ts" setup>
import { clientApi } from "api";
const { id } = defineProps<{
  id: string;
}>();
const state = reactive<any>({
  detail: {},
});
async function getDetail() {
  try {
    state.detail = await clientApi.api.getDmsEasyFormDraftId(id).then((res) => res.data);
    
    setTimeout(() => {
      handleEmailUpdate();
    });
  } catch (error) {
    state.detail = {}
  }
}
function handleUpdateAction(action: any) {
  const index = state.detail.formResult.findIndex((item: any) => item.id === action.id);
  if (index !== -1) state.detail.formResult[index] = action;
  else state.detail.formResult.push(action);
}
function handleDeleteAction(id: string) {
  const index = state.detail.formResult.findIndex((item: any) => item.id === id);
  if (index !== -1) state.detail.formResult.splice(index, 1);
}
const logRef = ref();
function handleEmailUpdate() {
  setTimeout(() => {
    // app4测试有延时
    logRef.value.tableRef.reload();
  }, 1000);
}
onMounted(async() => {
  await getDetail();
});
onDeactivated(() => {
  state.detail = {};
});
</script>
<style lang="scss" scoped>
.main {
  overflow: auto;
}
.el-card {
  margin-bottom: var(--app-space-xs);
}
</style>
