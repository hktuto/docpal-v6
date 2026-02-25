<template>
  <el-dialog v-model="state.visible" :title="$t('docType.new')"
             class="scroll-dialog"
             append-to-body
             :close-on-click-modal="false"
             destroy-on-close
  >
    <el-form :model="formData" ref="elFormRef" label-position="top">
      <el-form-item :label="$t('search.type')" prop="name" required>
        <el-input v-model="formData.name" />
      </el-form-item>
      <el-form-item :label="$t('docType.category')" prop="category" required>
        <el-select v-model="formData.category" placeholder="Select" filterable>
          <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('doc.isFolder')" prop="isFolder">
        <el-switch v-model="formData.isFolder" />
      </el-form-item>
      <el-divider />
      <el-form-item :label="$t('dpTable_permission')">
        <el-select v-model="state.permission" multiple placeholder="Select" style="width: 100%" filterable>
          <el-option-group v-for="group in permissionOptions" :key="group.label" :label="$t(group.label)">
            <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
          </el-option-group>
        </el-select>
      </el-form-item>
      <!-- Add more fields as needed -->
    </el-form>
    <template #footer>
      <div class="footer-grid">
        <el-button id="DocumentType__CreateNewDocumentType__Submit" type="primary" :loading="state.loading"
                   @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>


<script lang="ts" setup>
import { newAdminApi } from 'api'
import { ElMessage } from 'element-plus'
import { getPermissionSelectOption, convertPermissionObjectByPermissions } from '#imports'

const emits = defineEmits([
  'refresh'
])
const state = reactive({
  loading: false,
  visible: false,
  setting: {},
  permission: []
})

const elFormRef = ref()
const { t } = useI18n()
const permissionOptions = ref<any>()
const categoryOptions = ref<any[]>([])

async function getOptions() {
  permissionOptions.value = await getPermissionSelectOption()

  const data: any = await newAdminApi.getDmsDocpalTypeCategories().then((res) => res.data)
  if (!data) {
    categoryOptions.value = []
    return
  }
  categoryOptions.value = data.map((item: any) => ({
    label: item,
    value: item
  }))
}

const formData = reactive({
  name: '',
  category: '',
  isFolder: false,
  permission: {},
  status: 'A',
  langs: {
    en: true,
    zh: true,
    ja: true,
    ko: true,
    fr: true
  }
  // add other fields as needed
})

async function handleSubmit() {
  try {
    await elFormRef.value.validate()
    const data = formData
    data.permission = convertPermissionObjectByPermissions(state.permission)

    state.loading = true

    const result = await newAdminApi.postDmsDocpalTypeCreate(data).then(r => r.data)
    ElMessage.success(t('tip_createdMsg', {
      modelName: t('tip_newMsg') + t('docType_documentType'),
      name: data.name
    }))
    state.visible = false
    emits('refresh')
  } catch (error) {
    console.log('error', error)
  } finally {
    state.loading = false
  }
}

async function handleOpen() {
  state.visible = true
  await getOptions()
  setTimeout(async () => {
    elFormRef.value.resetFields()
    state.loading = false
  })
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>

</style>
    