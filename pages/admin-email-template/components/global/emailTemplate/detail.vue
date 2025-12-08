<script lang="ts" setup>
import { adminApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const { id } = defineProps<{
  id: string;
}>()
const editInfoOpened = ref(false)
const testEmailOpened = ref(false)
const testEmailDialog = ref()
const variables = ref<any[]>([])
const ready = ref(false)
const layouts = ref<any[]>([])
const editorEl = ref()
const selectedLayout = ref<any>('')
const infoFormEl = ref()
const showClose = ref(true)

const layoutHtml = computed(() => {
  try {
    if (selectedLayout.value === null || selectedLayout.value === undefined || selectedLayout.value === '' || !layouts.value) return null
    return layouts.value.find((item) => item.id === selectedLayout.value).layoutContent
  } catch (error) {
    return null
  }
})
let data: any = ref(null)

async function handleInit() {

  // TODO : if id is new , create new dummy data
  if (!id || id === 'new') {
    ready.value = true
    await getTemplateLayout('')
    editInfoOpened.value = true
    showClose.value = true
    return {
      subject: 'new template',
      body: '',
      emailLayoutId: '',
      emailTemplateJson: '',
      emailTemplateVariable: ''
    }
  }
  const res = await adminApi.api.getTemplateEmailTemplateId(id).then((res) => res.data)
  // loop template body and get all variables
  // const body = res?.body;
  await getTemplateLayout(res?.emailLayoutId)
  console.log('res', res)
  ready.value = true
  return res
}

/**
 * Step 1: 從後端取得 template 資料
 */

/**
 * Step 3: 從後端取得所有的 layout
 * @param templateId
 */
async function getTemplateLayout(templateId?: any) {
  const res: any = await adminApi.api
    .postTemplateEmailLayoutPage({ pageNum: 0, pageSize: 1000 })
    .then((res) => res.data)
  layouts.value = res?.entryList
  const layoutId = layouts.value.length > 0 ? layouts.value[0].id : ''
  selectedLayout.value = templateId || layoutId
  // selectedLayout.value = templateId || entryList[0].id;
}

function handleClose() {
  if (id === 'new') {
    const newItem: any = {
      id: 'admin-email-template',
      name: 'admin-email-template',
      icon: 'fluent:mail-template-16-regular',
      label: 'adminMenu.emailTemplate',
      component: 'LazyEmailTemplatePage',
      props: {}
    }
    routerProvider?.navigateTo(newItem)
  }
}

/**
 *  儲存
 */
async function save() {
  const { html, json, variable } = await editorEl.value.getData()
  try {

    // if id is new , create new
    // check form valid
    if (id === 'new') {
      try {
        nextTick(async () => {
          await infoFormEl.value.validate()
        })
      } catch (e) {
        console.error(e)
        return
      }
      // }
      const result = await adminApi.api.postTemplateEmailTemplate({
        ...data.value,
        // TODO : send html to body
        // url encode html
        body: html,
        emailLayoutId: selectedLayout.value,
        emailTemplateJson: JSON.stringify(json),
        emailTemplateVariable: JSON.stringify(variable)
      }).then(res => res.data)
      if (result?.id) {
        routerProvider?.updateProps({
          label: result.id,
          id: result.id
        })
      }
      routerProvider?.message.success(t('tip_createdMsg', { modelName: null, name: data.value.label }))
      editInfoOpened.value = false
      showClose.value = true
      // TODO : add notification
      return
    }

    // update new variable
    // test save json to backend
    await adminApi.api.putTemplateEmailTemplate({
      id: id,
      ...data.value,
      // TODO : send html to body
      // url encode html
      body: html,
      emailLayoutId: selectedLayout.value,
      emailTemplateJson: JSON.stringify(json),
      emailTemplateVariable: JSON.stringify(variable)
    })
    routerProvider?.message.success(t('tip_updateMsg', {
      modelName: null,
      name: data.value.label
    }))
    editInfoOpened.value = false
  } catch (error) {
    console.error(error)
  }
  // TODO : add notification
}

let title = t('emailContentTemplate_create')

function handleEdit() {
  title = t('emailContentTemplate_edit')
  editInfoOpened.value = true
  showClose.value = true
}

/**
 *  送出測試信
 */
async function sendTest() {
  testEmailDialog.value.send()
  // TODO : add notification
}

onMounted(async () => {
  data.value = await handleInit()
})
</script>
<template>
  <div class="pageContainer--padding">
    
    <Editorjs v-if="data" ref="editorEl" :data="data" :layout="layoutHtml">
      <template #name>
        <div class="editButton">
          <SvgIcon id="EmailContentTemplate__Detail__Edit" :src="'/icons/edit.svg'" @click="handleEdit" />
        </div>
      </template>
      <template #action>
        <ElSelect type="primary" v-model="selectedLayout">
          <ElOption v-for="item in layouts" :key="item.id" :label="item.name" :value="item.id"></ElOption>
        </ElSelect>
        <ElButton id="EmailContentTemplate__Detail__SendTest" type="primary" size="small"
                  @click="testEmailOpened = true">
          {{ $t('email_send_test') }}
        </ElButton>
        <ElButton id="EmailContentTemplate__Detail__Save" type="primary" size="small" @click="save">
          {{ $t('common_save') }}
        </ElButton>
      </template>
    </Editorjs>

    <ElDialog
      ref="editInfoDialog"
      v-model="editInfoOpened"
      append-to-body
      destroy-on-close
      :close-on-press-escape="showClose"
      :close-on-click-modal="showClose"
      :show-close="showClose"
      @closed="handleClose"
      :title="title"
    >
      <EditorjsInfoForm v-if="data" ref="infoFormEl" :data="data" />
      <template #footer>
        <!-- <ElButton v-if="!showClose" type="primary" @click="$router.back()">{{
        $t("common_back")
      }}</ElButton> -->
        <ElButton id="EmailContentTemplate__CreateNewEmailTemplate__Submit" type="primary" @click="save">
          {{ $t('common_submit') }}
        </ElButton>
      </template>
    </ElDialog>
    <ElDialog v-model="testEmailOpened" append-to-body destroy-on-close>
      <EditorjsTestDialog ref="testEmailDialog" v-if="data" :data="data" :id="id" :variables="variables" />
      <template #footer>
        <ElButton type="primary" @click="() => {sendTest();testEmailOpened = false;}">
          {{ $t('email_send_test') }}
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>
<style lang="scss" scoped>
.actions {
  display: grid;
  grid-template-columns: 1fr min-content;
  gap: var(--app-space-xs);
  margin-bottom: 20px;

  .name {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: var(--app-space-xs);
    flex: 1 0 auto;
    word-break: break-all;

    span {
      font-size: 1.2rem;
      font-weight: bold;
    }
  }

  .action {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: var(--app-space-xs);

    .el-select {
      width: 200px;
    }

    > * {
      margin: 0;
    }
  }
}

.email_content {
  flex: 1 0 auto;
  position: relative;

  &.desktop {
    width: 100%;
  }

  &.mobile {
    width: 375px;
    margin: 0 auto;
  }
}

.emailTemplateContainer {
  height: 100%
}

.responsiveSizeEditorContainer {
  position: absolute;
  left: calc(50% - 31px);
  top: -15px;
  width: 62px;
  height: 30px;
  background-color: #fff;
  z-index: 2;
  border: 1px solid #eee;
  border-radius: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  --icon-color: var(--app-grey-600);

  .desktop,
  .mobile {
    cursor: pointer;

    &.active {
      --icon-color: var(--app-primary-color);
    }
  }
}
</style>
