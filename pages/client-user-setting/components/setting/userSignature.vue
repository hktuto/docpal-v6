<script setup lang="ts">
import { clientApi } from 'api'
import { UploadFilled, DeleteFilled } from '@element-plus/icons-vue'
import { useDebounceFn } from '@vueuse/core'

const props = defineProps<{
  userId: string
}>()

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const state = reactive({
  userSignatureVisible: false,
  fileList: [] as any[],
  imageSize: 5,
  isCreate: true
})
const form = reactive({})

async function handleOpen() {
  state.userSignatureVisible = true
  state.isCreate = true
  state.fileList = []
  await getImageUrl()
}

async function getImageUrl() {
  try {
    const response:any = await clientApi.api.getDmsUserprofileUseridSignature(props.userId, { format: 'blob' })
    if (!!response && response.size > 0) {
      const blob = new Blob([response], { type: response.type })
      const url = URL.createObjectURL(blob)

      const file = {
        name: 'user-signature.png',
        url: url,
        size: blob.size,
        type: response.type
      }
      state.fileList = [file]
      state.isCreate = false
    }
  } catch (error) {
    routerProvider?.message.error(t('user.setting.userSignatureFailed'))
  }
}

async function handleSubmit() {
  if (!state.isCreate && state.fileList.length === 0) {
    await clientApi.api.deleteDmsUserprofileUseridSignature(props.userId).then(r => r.data)
    routerProvider?.message.success(
      t('tip_updateSuccessMsg', {
        modelName: t('user.setting.userSignature'),
        name: null
      })
    )
    state.userSignatureVisible = false
    return
  }

  try {
    const fileObj = state.fileList[0].raw
    const format = fileObj.type
    const form = new FormData()
    form.append('file', fileObj)
    form.append('format', format)

    // TODO: swagger APi 文檔需要移除 query 參數
    if (state.isCreate) {
      await clientApi.api.postDmsUserprofileUseridSignature(props.userId, {} as any, form as any)
    } else {
      await clientApi.api.putDmsUserprofileUseridSignature(props.userId, {} as any, form as any)
    }
  } catch (e) {
    routerProvider?.message.error(t('user.setting.userSignatureUploadFailed'))
    return
  }

  routerProvider?.message.success(t('tip_updateSuccessMsg', { modelName: t('user.setting.userSignature'), name: null }))
  state.userSignatureVisible = false
}

const onChange = useDebounceFn(
  (file: any, _fileList: any) => {
    state.fileList = _fileList.reduce((prev: any, item: any) => {
      const fileSizeCheckResult = item.size / 1024 / 1024 <= state.imageSize
      if (!fileSizeCheckResult) {
        routerProvider?.message.error('[' + item.name + ']' + t('render.hint.fileSizeExceed') + state.imageSize + 'MB')
        return prev
      }
      prev.push(item)
      return prev
    }, [])
  },
  500,
  { maxWait: 5000 }
)

function beforeRemove() {
  state.fileList = []
}

defineExpose({ handleOpen })
</script>

<template>
  <el-dialog v-model="state.userSignatureVisible" :title="t('user.setting.editSignature')" width="600px">
    <div>
      <el-form ref="FormRef" :model="form" label-position="top">
        <el-form-item label="Upload Image ( Support PNG, SVG )">
          <el-upload
            ref="uploadRef"
            class="upload-demo"
            action="#"
            accept="image/png,.svg"
            drag
            :limit="1"
            list-type="picture"
            :file-list="state.fileList"
            :on-change="onChange"
            :auto-upload="false"
            :show-file-list="false"
            :disabled="state.fileList.length > 0"
          >
            <div>
              <el-icon
                v-if="state.fileList.length > 0"
                :disabled="!state.fileList.length > 0"
                style="position: relative; right: -80px; font-size: var(--app-font-size-l); cursor: pointer"
                @click.stop="beforeRemove"
              >
                <DeleteFilled />
              </el-icon>
            </div>
            <el-image v-if="state.fileList.length > 0" style="height: 100px" :src="state.fileList[0].url"
                      fit="scale-down" />
            <el-icon class="el-icon--upload" v-if="state.fileList.length === 0">
              <upload-filled />
            </el-icon>
            <div v-if="state.fileList.length === 0" class="el-upload__text">Drop file here or click to upload</div>
          </el-upload>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="actions">
        <ElButton id="UserSignature__Dialog__Cancel" type="info" @click="state.userSignatureVisible = false">
          {{ $t('dpButtom_cancel') }}
        </ElButton>
        <ElButton id="UserSignature__Dialog__Save" type="primary" @click="handleSubmit">
          {{ $t('common_save') }}
        </ElButton>
      </div>
    </template>
  </el-dialog>
</template>

<style></style>
