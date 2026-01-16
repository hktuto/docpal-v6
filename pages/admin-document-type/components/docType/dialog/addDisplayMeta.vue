<template>
  <el-dialog
    v-model="state.visible"
    :title="state.isEdit ? $t('docTypeDetail_editDisplayMeta') : $t('docTypeDetail_addDisplayMeta')"
    :close-on-click-modal="false"
    class="scroll-dialog add-display-meta-dialog big"
  >
    <!-- form -->
    <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="display-meta-form">
      <!-- Metadata Selection -->
      <el-form-item :label="$t('rightDetail_meta')" prop="metadataId" required>
        <el-select-v2
          v-model="formData.metadataId"
          :options="availableMetadata"
          :loading="metadataLoading"
          :placeholder="$t('render.hint.fieldRequired', { name: $t('rightDetail_meta') })"
          default-first-option
          clearable
          filterable
        >
          <template #default="{ item }">
            <span style="margin-right: 8px">{{ $t(item.label) }}</span>
          </template>
        </el-select-v2>
      </el-form-item>

      <!-- Display Settings -->
      <el-row class="display-meta-row">
        <el-col :span="12">
          <el-form-item :label="$t('form_display')" prop="display">
            <el-switch
              class="display-meta-switch"
              v-model="formData.display"
              :active-text="$t('el.popconfirm.confirmButtonText')"
              :inactive-text="$t('el.popconfirm.cancelButtonText')"
            />
          </el-form-item>
        </el-col>
        <!-- <el-col :span="12">
          <el-form-item :label="$t('form_isRequire')" prop="isRequire">
            <el-switch
              class="isRequire-meta-switch"
              v-model="formData.isRequire"
              :active-text="$t('el.popconfirm.confirmButtonText')"
              :inactive-text="$t('el.popconfirm.cancelButtonText')"
            />
          </el-form-item>
        </el-col> -->
      </el-row>
      <el-divider />
      <el-row :gutter="20">
        <el-col :span="8" v-for="item in ['hiddenPermissions', 'maskPermissions', 'readOnlyPermissions']" :key="item">
          <DocTypePermission v-model="formData.metadataPermission[item]" :permissionType="item" />
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button id="DocumentType__DisplayMeta__AddNewDisplayMeta__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit()">
        {{ $t('common_submit') }}
      </el-button>
      <el-button
        id="DocumentType__DisplayMeta__AddNewDisplayMeta__SubmitAndAddMore"
        v-show="!state.isEdit"
        type="primary"
        :loading="state.loading"
        @click="handleSubmit(true)"
      >
        {{ $t('common_addMore') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import { ElMessage, type FormInstance } from 'element-plus'
import { initMetadataOpts, metadataOpts } from '@/composables/useDocumentTypeOptioins'

const routerProvider = inject(MenuRouterKey)
const props = defineProps<{
  documentType: string
  id: string
}>()
const { t } = useI18n()
const emits = defineEmits(['refresh'])
const formRef = ref<FormInstance>()
const metadataLoading = ref(false)
const state = reactive({
  loading: false,
  visible: false,
  isEdit: false,
  lKey: '',
  setting: {},
  metadataList: [] as any[]
})

// Form data
const formData = reactive<any>({
  metadataId: '',
  display: true,
  metadataPermission: {
    hiddenPermissions: [],
    maskPermissions: [],
    readOnlyPermissions: []
  }
})

// Form validation rules
const formRules = reactive({
  metadataId: [{ required: true, message: t('common_canNotEmpty'), trigger: 'change' }]
})

// Available metadata options
const availableMetadata = computed(() => {
  if (!state.metadataList) state.metadataList = []
  const data = metadataOpts.value.map((item: any) => {
    return {
      ...item,
      disabled: state.metadataList.some((item2: any) => item2.id === item.value)
    }
  })
  return data
})

async function handleSubmit(addMore: boolean = false) {
  try {
    // Validate form
    if (!formRef.value) return

    const valid = await formRef.value.validate()
    if (!valid) return

    state.loading = true
    // Add or update metadata
    if (state.isEdit) {
      await clientApi.admin.putAdmindmsDocpalTypeDocpaltypeidMetadata(props.id, formData)
      routerProvider?.message.success(t('tip_updateMsg', {
        modelName: t('tip_SelectedMsg') + t('docType_displayMeta'),
        name: null
      }))
    } else {
      await clientApi.admin.postAdmindmsDocpalTypeDocpaltypeidMetadata(props.id, formData).then(r => r.data)
      ElMessage.success(t('common_addSuccess'))
    }
    const newMetadata = JSON.parse(JSON.stringify(formData))
    // Close dialog and refresh
    emits('refresh', addMore)
    state.visible = false
    // If add more, reopen dialog
    if (addMore) {
      nextTick(() => {
        state.metadataList.push({
          id: newMetadata.metadataId
        })
        handleOpen(state.metadataList, null)
      })
    }
  } catch (error) {
    console.error('Submit error:', error)
  } finally {
    state.loading = false
  }
}

function handleCancel() {
  state.visible = false
  resetForm()
}

function resetForm() {
  formData.metadataId = ''
  formData.display = true
  formRef.value?.resetFields()
}

async function handleOpen(exitList: any[], data: any) {
  state.visible = true
  state.metadataList = exitList || []
  state.isEdit = !!data
  // If editing, populate form with existing data
  if (!!data) {
    formData.metadataId = data.id
    formData.display = data.display
    formData.metadataPermission = {
      hiddenPermissions: data.metadataPermission?.hiddenPermissions || [],
      maskPermissions: data.metadataPermission?.maskPermissions || [],
      readOnlyPermissions: data.metadataPermission?.readOnlyPermissions || []
    }
  } else {
    resetForm()
  }
  try {
    metadataLoading.value = true
    await initMetadataOpts()
  } catch (error) {
    console.error(error)
  } finally {
    metadataLoading.value = false
  }
}

// const ignoreList = ['dc:title', 'dc:creator', 'dc:modified', 'dc:lastContributor', 'dc:created', 'dc:publisher', 'dc:contributors', 'common:icon', 'common:icon-expanded', 'uid:uid', 'uid:major_version', 'uid:minor_version', 'file:content', 'files:files', 'nxtag:tags', 'relatedtext:relatedtextresources', 'sec:clearanceLevel', 'sec:securityKeyword']

// #endregion

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>
.mg-b {
  margin-bottom: var(--app-space-xs);
}
</style>
