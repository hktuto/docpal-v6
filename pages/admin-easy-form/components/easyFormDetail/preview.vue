<template>
  <el-card>
    <div class="title-container">
      <h3 class="title">{{ $t("easyForm.formPreview") }}</h3>
      <div class="btns">
        <el-button id="EasyForm__Detail__FormPreview__EditForm" type="primary" @click="handleOpenFormDesign">
          {{ $t("easyForm.editForm") }}
        </el-button>
        <el-button id="EasyForm__Detail__FormPreview__CopyUrl" type="primary" :disabled="props.detail.publishStatus === 'D'" @click="handleCopyUrl">
          {{ $t("easyForm.copyUrl") }}
        </el-button>
        <el-button id="EasyForm__Detail__FormPreview__CopyEmbedCode" type="primary" :disabled="props.detail.publishStatus === 'D'" @click="handleCopyIframe">
          {{ $t("easyForm.copyEmbedCode") }}
        </el-button>
        <el-button id="EasyForm__Detail__FormPreview__SendEmail" type="primary" :disabled="props.detail.publishStatus === 'D'" @click="handleSendEmail">
          {{ $t("easyForm.sendEmail") }}
        </el-button>
      </div>
    </div>
    <div class="preview-container">
      <div style="height: 100%; overflow: auto">
        <!-- <div v-for="i in 50">111</div> -->
        <FormRenderer
          v-if="state.formJsonLoad"
          ref="FormRendererRef"
          :form-json="state.formJson"
        />
      </div>
    </div>
    <EasyFormEmailDialog ref="dialogRef" @email-update="update"/>
  </el-card>
</template>
<script lang="ts" setup>
import {routeEasyFormDesigner} from "~/util/easyFormRouterHelper";

const emits = defineEmits(["email-update"])
const props = defineProps(["detail"]);

const routerProvider = inject(MenuRouterKey);
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
function update() {
  emits('email-update')
}

const dialogRef = ref()
const {
  public: {endPoint},
} = useRuntimeConfig();
const {t} = useI18n();
const state = reactive<any>({
  formJsonLoad: false,
  formJson: {},
});

function handleOpenFormDesign() {
  // router.push(`/easyFormManage/formDesign?id=${props.detail.id}`)
  const newItem = routeEasyFormDesigner(props.detail);
  routerProvider?.navigateTo(newItem);
}

const copy = (data: any, msg = "common_copySuccess") => {
  try {
    navigator.clipboard.writeText(data)
  } catch (error) {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.value = data;
    input.focus();
    input.select();
    document.execCommand("Copy");
    document.body.removeChild(input);
  }
  routerProvider?.message.success(msg as string);
};

function handleCopyUrl() {
  const origin = location.origin;
  const url = `${origin}/public/public-form?id=${props.detail.id}`;
  copy(url, t("dpTip.urlCopied"));
}

function handleCopyIframe() {
  const origin = endPoint?.clientUrl;
  const url = `${origin}/public-form?id=${props.detail.id}`;
  const iframe = `<iframe width=800 height=500 frameborder="no" scrolling="no" allowtransparency="no"  src="${url}"></iframe>`;
  copy(iframe, t("dpTip.embedCodeCopied"));
}

function handleSendEmail() {
  dialogRef.value.handleOpen(props.detail.id)
}

watch(
  () => props.detail,
  (newValue, oldValue) => {
    console.log("watch", newValue, oldValue);
    if (newValue.previewStyle) {
      state.formJsonLoad = false;
      nextTick(() => {
        state.formJson = JSON.parse(newValue.previewStyle);
        state.formJsonLoad = true;
      });
    } else {
      state.formJsonLoad = false;
      // empty form
      nextTick(() => {
        state.formJson = {}
        state.formJsonLoad = true;
      });
    }
  },
  {
    deep: true,
    immediate: true
  }
);
</script>
<style lang="scss" scoped>
.title-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-container {
  height: 380px;
  overflow: hidden;
  width: 100%;
  background-color: #d1d8de;
  padding: calc(var(--app-space-xs) * 3);

  .formContainer {
    background-color: #fff;
    padding: var(--app-space-xs);
  }
}
</style>
