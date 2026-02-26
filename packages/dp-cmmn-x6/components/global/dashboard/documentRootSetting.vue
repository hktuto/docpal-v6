<template>
  <el-dialog
    v-model="state.visible"
    :title="$t('dashboard.setting')"
    class="scroll-dialog"
    append-to-body
    :close-on-click-modal="false"
  >
    <div>
      <el-form-item label="Name" labelPosition="top" @submit.native.prevent>
        <el-input v-model="form.name" :placeholder="Name" />
      </el-form-item>
      <el-form :model="form" ref="FormRef" labelPosition="top" @submit.native.prevent>
        <el-form-item :label="$t('documentId')" prop="home">
          <el-select v-model="form.home" filterable clearable>
            <el-option
              v-for="item in state.allList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="footer-grid">
        <el-button type="primary" :loading="state.loading" @click="handleSubmit">{{
          $t("common_submit")
        }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
const emits = defineEmits(["refresh", "delete"]);
const form = ref({
  home: "",
});
const state = reactive<any>({
  loading: false,
  visible: false,
  setting: {},
  allList: [],
});
async function handleSubmit() {
  state.loading = true;
  try {
    emits("refresh", {
      home: form.value.home,
    });
  } catch (error) {
    state.loading = false;
  }
  state.visible = false;
  state.loading = false;
}
function handleOpen(setting: any, allList: any) {
  if (!allList) allList = [];
  state.visible = true;
  setTimeout(async () => {
    state.setting = deepCopy(setting);
    form.value.home = setting.home
    state.allList = allList
    state.loading = false;
  });
}
defineExpose({ handleOpen });
</script>
<style lang="scss" scoped>

</style>
