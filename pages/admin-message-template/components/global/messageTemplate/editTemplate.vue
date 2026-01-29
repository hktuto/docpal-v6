<script setup lang="ts">
import { ElNotification } from 'element-plus'
import { clientApi } from 'api'

const { id } = defineProps<{
  id: number
}>()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw createError('menu manger not found')
}
const { t } = useI18n()
const loading = ref(false)
const detailData = ref()

async function getData() {
  loading.value = true
  detailData.value = await clientApi.admin.getAdmindocpalMessageTemplateDetailsId(id).then((r) => r.data)
  console.log('detailData', detailData.value)
  loading.value = false
}

const languageOptions = ref<any[]>([])

async function getLanguageOptions() {
  const data = await clientApi.admin.getAdminext3rdmessageWhatsappLanguages().then((r) => r.data)
  languageOptions.value = data.data
}

async function saveTemplate() {
  const template = detailData.value.template
  await clientApi.admin.postAdmindocpalMessageTemplateEdit(template)
  ElNotification.success('Success')
  await getData()
}

async function init() {
  await getLanguageOptions()
  await getData()
}

async function saveData() {
  try {
    const params = detailData.value.template
    params.recordId = id
    await clientApi.admin.postAdmindocpalMessageTemplateEdit(params).then((r) => r.data)
    routerProvider?.message.success(
      t('tip_updateSuccessMsg', {
        modelName: t('adminMenu.messageTemplate'),
        name: null
      })
    )
  } catch (e) {
    routerProvider?.message.error(t('dpMsg_error'))
  } finally {
    init()
  }
}

onMounted(async () => {
  await init()
})
const header = defineModel<string>('header')
const body = defineModel<string>('body')
const footer = defineModel<string>('footer')
const textMessage = defineModel<string>('textMessage')
</script>

<template>
  <div class="pageContainer">
    <div v-if="detailData" class="infoContainer section">
      <div class="form">
        <ElForm :model="detailData.template" label-position="top">
          <ElRow :gutter="12">
            <ElCol :span="18">
              <ElFormItem label="Name">
                <ElInput v-model="detailData.template.name" placeholder="Name" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="Language">
                <ElSelect v-model="detailData.template.language" placeholder="Language">
                  <ElOption v-for="item in languageOptions" :key="item.code" :label="item.name" :value="item.code" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElForm>
        <ElDivider />
        <div class="subSection">
          <div class="title">Header</div>
        </div>
        <!-- {{detailData.template.header}} -->
        <MessageTemplateEditor
          :row="1"
          v-model:content="detailData.template.header"
          v-model:parameters="detailData.template.hedaerParameters"
          v-model:labelName="header"
        />
        <ElDivider />
        <div class="subSection">
          <div class="title">Body</div>
        </div>
        <MessageTemplateEditor
          :row="6"
          v-model:content="detailData.template.body"
          v-model:parameters="detailData.template.bodyParameters"
          v-model:labelName="body"
        />
        <ElDivider />
        <div class="subSection">
          <div class="title">Footer</div>
        </div>
        <MessageTemplateEditor :row="1" v-model:content="detailData.template.footer" v-model:labelName="footer" :show-variables="false" />
        <ElDivider />
        <ElSwitch v-model="detailData.template.needConfirm" active-text="Confirm" inactive-text="No confirm" />
        <ElFormItem label="Confirm Button">
          <ElInput clearable v-model="detailData.template.confirmButtonName" />
        </ElFormItem>
        <ElDivider />
        <template v-if="detailData.template.needConfirm && detailData.template.confirmButtonName">
          <div class="subSection">
            <div class="title">Content</div>
          </div>
          <MessageTemplateEditor
            :row="6"
            v-model:content="detailData.template.textMessage"
            v-model:parameters="detailData.template.textParameters"
            v-model:labelName="textMessage"
          />
        </template>
      </div>
      <div class="actions">
        <el-popconfirm title="All unsave change will lost" @confirm="init">
          <template #reference>
            <ElButton id="MessageTemplate__Detail__EditTemplate__Discard">{{ $t('discard') }}</ElButton>
          </template>
        </el-popconfirm>
        <ElButton id="MessageTemplate__Detail__EditTemplate__Save" type="primary" @click="saveData">
          {{ $t('common_save') }}
        </ElButton>
      </div>
    </div>
    <div v-if="detailData" class="preview section">
      <MessageTemplatePreviewText :template="detailData.template" title="Whatsapp" :showConfirm="true" bgColor="#F6EBCF" />
      <MessageTemplatePreviewText :template="detailData.template" title="Wechat" :showConfirm="false" bgColor="#E2F6CF" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.actions {
  display: flex;
  gap: var(--app-space-xs);
  justify-content: space-between;
  align-items: center;
}

.infoContainer {
  display: grid;
  grid-template-rows: 1fr min-content;
  gap: var(--app-space-xs);
  overflow: hidden;

  .form {
    overflow: auto;
  }
}

.pageContainer {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  padding: var(--app-space-s);
  display: grid;
  grid-template-columns: 1fr min-content;
  gap: var(--app-space-s);
  background: var(--app-grey-950);
}

.preview {
  display: flex;
  flex-flow: row wrap;
  gap: var(--app-space-s);
  padding: var(--app-space-s);
  background: var(--app-grey-900) !important;
  overflow: auto;
  min-width: 300px;
}

.subSection {
  display: flex;

  .title {
    font-size: var(--app-text-l);
    font-weight: bold;
  }
}
</style>
