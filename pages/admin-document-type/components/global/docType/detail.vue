<template>
  <div class="pageContainer--padding" backPath="/documentType">
    <div class="metaSetting-container">
      <div class="meta-setting-info">
        <BrowseItemIcon style="--icon-size: 80px" class="meta-setting-info-icon el-icon--left" :documentBasicType="docBasicType" />

        <el-form label-position="top" class="meta-setting-info-form">
          <LanguageUnitForm ref="LanguageUnitFormRef" class="meta-setting-info-language" :lKey="metadataName" />
          <el-form-item class="meta-setting-info-category" :label="$t('docType.category')">
            <el-select
              :loading="categoryLoading"
              v-model="state.docTypeDetail.category"
              :disabled="state.loading"
              filterable
              @change="handleSubmit('category')"
            >
              <el-option v-for="item in categoryOpts" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <el-tabs v-model="state.activeTabName" class="dp-tabs--auto">
        <el-tab-pane :label="$t('docType_displayMeta')" name="metadata">
          <DocTypeDisplayMetaTable :documentType="metadataName" :id="id" @refresh="initDocType" @updateDetail="initDocType" />
        </el-tab-pane>
        <!-- <el-tab-pane :label="$t('docType_relatedDocument')" name="related">
          <DocTypeRelatedTypeTable :docTypeDetail="state.docTypeDetail" :name="name"></DocTypeRelatedTypeTable>
        </el-tab-pane> -->
      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { newAdminApi } from 'api'
import { useDebounceFn } from '@vueuse/core'
import { initCategoryOpts, categoryOpts } from '@/composables/useDocumentTypeOptioins'
const { name, metadataName, id } = defineProps<{
  name: string
  id: string
  metadataName: string
}>()
const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const permissionOptions = ref<any>()

const state = reactive({
  docTypeDetail: {
    category: '',
    isFolder: false,
    dataType: ''
  },
  activeTabName: 'metadata',
  loading: false
})
const docBasicType = computed(() => {
  const basicType = state.docTypeDetail.isFolder ? 'Folder' : state.docTypeDetail.dataType || 'File'
  return basicType
})
const categoryLoading = ref(false)

async function initDocType(detail: any) {
  state.docTypeDetail = {
    category: detail.category,
    isFolder: detail.isFolder === 'Yes',
    dataType: detail.dataType
  }
}

async function handleSubmit(attr: string) {
  try {
    state.loading = true
    const params = {
      name: metadataName,
      category: state.docTypeDetail.category,
      id
    }
    await newAdminApi.postDmsDocpalTypeUpdate(params).then((res) => res.data)
    routerProvider?.message.success(t('dpMsg_success', { tip: t('docType.category') }))
  } catch (error) {
    console.error(error)
  } finally {
    state.loading = false
  }
}

onMounted(async () => {
  try {
    categoryLoading.value = true
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
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}
.meta-setting-info-form {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  grid-column-gap: var(--app-space-xs);
  grid-row-gap: 0px;
  .meta-setting-info-language {
    grid-area: 1 / 1 / 2 / 4;
  }
  .meta-setting-info-category {
    grid-area: 2 / 1 / 3 / 2;
  }
  .meta-setting-info-permission {
    grid-area: 2 / 2 / 3 / 3;
  }
  .meta-setting-info-isFolder {
    grid-area: 2 / 3 / 3 / 4;
  }
}
</style>
