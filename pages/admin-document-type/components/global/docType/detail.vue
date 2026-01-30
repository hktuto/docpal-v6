<template>
  <div class="pageContainer--padding" backPath="/documentType">
    <div class="metaSetting-container">
      <div class="meta-setting-info">
        <BrowseItemIcon style="--icon-size: 80px" class="meta-setting-info-icon el-icon--left" :documentBasicType="state.docTypeDetail.dataType" />
        <el-form label-position="top" class="meta-setting-info-form">
          <el-form-item :label="$t('search.type')">
            <el-input
              v-model="state.form.docpalTypeName"
              @input="handleInput('docpalTypeName')"
              @keyup.enter="handleSubmit('docpalTypeName')"
              :disabled="state.loading"
            ></el-input>
          </el-form-item>
          <el-form-item :label="$t('docType.category')">
            <el-select :loading="categoryLoading" v-model="state.form.category" :disabled="state.loading" filterable @change="handleSubmit('category')">
              <el-option v-for="item in categoryOpts" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('dpTable_permission')">
            <el-select
              v-model="state.form.permission"
              placeholder="Select"
              multiple
              filterable
              clearable
              @blur="handleSubmit('permission')"
              :disabled="state.loading"
            >
              <el-option-group v-for="group in permissionOptions" :key="group.label" :label="$t(group.label)">
                <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
              </el-option-group>
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('doc.isFolder')">
            <el-switch
              v-model="state.form.isFolder"
              :active-text="$t('el.popconfirm.confirmButtonText')"
              :inactive-text="$t('el.popconfirm.cancelButtonText')"
              @change="handleSubmit('isFolder')"
              :disabled="state.loading"
            />
          </el-form-item>
        </el-form>
        <LanguageUnitForm ref="LanguageUnitFormRef" class="meta-setting-info-language" :lKey="name" />
      </div>
      <el-tabs v-model="state.activeTabName" class="dp-tabs--auto">
        <el-tab-pane :label="$t('docType_displayMeta')" name="metadata">
          <DocTypeDisplayMetaTable :documentType="name" :id="id" @refresh="initDocType" @updateDetail="initDocType" />
        </el-tab-pane>
        <!-- <el-tab-pane :label="$t('docType_relatedDocument')" name="related">
          <DocTypeRelatedTypeTable :docTypeDetail="state.docTypeDetail" :name="name"></DocTypeRelatedTypeTable>
        </el-tab-pane> -->
      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { clientApi } from 'api'
import { useDebounceFn } from '@vueuse/core'
import { initCategoryOpts, categoryOpts } from '@/composables/useDocumentTypeOptioins'
import { convertPermissionObjectByPermissions, convertPermissionsByPermissionObject, getPermissionSelectOption } from '#imports'
// const { getLanguageListStore } = useLanguage()
const { name, id } = defineProps<{
  name: string
  id: string
}>()
const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const permissionOptions = ref<any>()

const state = reactive({
  docTypeDetail: {},
  activeTabName: 'metadata',
  loading: false,
  form: {
    permission: [],
    acls: [],
    docpalTypeName: '',
    category: '',
    isFolder: false
  }
})
const categoryLoading = ref(false)

async function getOptions() {
  permissionOptions.value = await getPermissionSelectOption()
}

async function initDocType(detail: any) {
  state.docTypeDetail = {
    docpalTypeName: detail.docpalTypeName,
    category: detail.category,
    isFolder: detail.isFolder === 'Yes',
    dataType: detail.dataType
  }
  const permissions = convertPermissionsByPermissionObject(detail.permission)

  setTimeout(() => {
    state.form = {
      permission: permissions,
      docpalTypeName: detail.docpalTypeName,
      category: detail.category,
      isFolder: detail.isFolder === 'Yes'
    }
  }, 100)
}

const handleInput = useDebounceFn(
  (attr: string) => {
    handleSubmit(attr)
  },
  1000,
  {
    maxWait: 3000
  }
)

async function handleSubmit(attr: string) {
  if (attr === 'isFolder' && state.form.isFolder === state.docTypeDetail.isFolder) return

  if ('' === state.form.docpalTypeName || !state.form.docpalTypeName) {
    routerProvider?.message.error(t('render.hint.fieldRequired', { name: t('search.type') }))
    return
  }
  const permissionsObjet = convertPermissionObjectByPermissions(state.form.permission)

  try {
    state.loading = true
    const params = {
      permission: permissionsObjet,
      name: state.form.docpalTypeName,
      category: state.form.category,
      isFolder: state.form.isFolder,
      id
    }
    let tip = ''
    if (attr) {
      const i18nMap: any[string] = {
        docpalTypeName: t('search.type'),
        category: t('docType.category'),
        isFolder: t('doc.isFolder'),
        permission: t('dpTable_permission')
      }
      const i18nValue = attr === 'isFolder' ? (state.form.isFolder ? 'Yes' : 'No') : state.form[attr]
      tip = attr === 'permission' ? `[${i18nMap[attr]}]` : `[${i18nMap[attr]}:${i18nValue}]`
    }
    await clientApi.admin.postAdmindmsDocpalTypeUpdate(params).then((res) => res.data)
    state.docTypeDetail[attr] = params[attr]
    routerProvider?.message.success(t('dpMsg_success', { tip }))
  } catch (error) {
    console.error(error)
    state.form[attr] = state.docTypeDetail[attr]
  } finally {
    state.loading = false
  }
}

onMounted(async () => {
  try {
    categoryLoading.value = true
    // TODO: 數據前綴不匹配問題
    // permissionOptions.value = await getPermissionPairOption()
    await getOptions()
    await initCategoryOpts()
  } catch (error) {
    console.error(error)
  } finally {
    categoryLoading.value = false
  }
})
</script>

<style lang="scss" scoped>
.dp-tabs--auto {
  height: 100%;
  overflow: hidden;

  .el-tab-pane {
    height: 100%;
  }
}

.metaSetting-container {
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);
  height: 100%;
  overflow: hidden;
}

.meta-setting-info {
  display: grid;
  gap: calc(var(--app-space-xs) * 2);
  margin-bottom: var(--app-space-xs);
  grid-template-columns: min-content 1fr;
  grid-template-rows: repeat(2, min-content);
  grid-column-gap: var(--app-space-s);
  grid-row-gap: 0px;
  align-items: center;

  &-icon {
    grid-area: 1 / 1 / 3 / 2;
  }

  &-form {
    grid-area: 1 / 2 / 2 / 3;
  }

  &-language {
    grid-area: 2 / 2 / 3 / 3;
  }
}

.meta-setting-info-form {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--app-space-xs);
}
</style>
