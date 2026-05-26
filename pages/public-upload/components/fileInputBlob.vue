<template>
  <el-upload
    ref="uploadRef"
    class="upload-demo"
    action="#"
    name="files"
    drag
    :limit="limit"
    :multiple="multiple"
    :accept="accept"
    :disabled="disabled"
    :file-list="state._fileList"
    :before-remove="beforeRemove"
    :on-change="onChange"
    :auto-upload="false"
  >
    <i class="el-icon-upload"></i>
    <div class="el-upload__text">
      {{ $t('common_dragFileHere') }}，{{ $t('common_or') }}
      <em>{{ $t('common_clickToUpload') }}</em>
    </div>
    <div class="el-upload__tip" slot="tip">
      <slot name="tip"></slot>
    </div>
  </el-upload>
</template>
<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { useDebounceFn } from '@vueuse/core'
import * as mime from 'mime-types'
const props = defineProps<{
  disabled?: Boolean;
  multiple?: Boolean;
  limit?: Number;
  accept?: String;
  fileMaxSize: number;
}>()
const emits = defineEmits(['change'])
const state = reactive<any>({
  fileList: [],
  _fileList: []
})
const { t } = useI18n()
const uploadRef = ref()
// 文件状态改变时的钩子，添加文件、上传成功和上传失败时都会被调用
const onChange = useDebounceFn(
  (file: any, _fileList: any) => {
    // check file type match
    let f = _fileList
    const accepts = props.accept ? props.accept.split(',') : undefined
    if (accepts) {
      const exts = accepts.map((a) => mime.types[a.replace('.','')])
      const filted = [];
      for (const item of f) {
        if (exts.includes(item.raw.type)) {
          filted.push(item)
        } else {
          ElMessage.error(
            '[' + item.name + '] File Type not match'
          )
        }
      }
      f = filted
    }

    state.fileList = f.reduce((prev: any, item: any) => {
      const fileSizeCheckResult = item.size / 1024 / 1024 <= props.fileMaxSize
      if (!fileSizeCheckResult) {
        ElMessage.error(
          '[' + item.name + ']' + t('render.hint.fileSizeExceed') + props.fileMaxSize + 'MB'
        )
        return prev
      }
      prev.push(item)
      return prev
    }, [])
    state._fileList = [...state.fileList]
  },
  500,
  { maxWait: 5000 }
)

// auto-upload 为 false 时不生效
function beforeFileUpload(file: any) {
}

const beforeRemove = (file: any, _fileList: any) => {
  state.fileList = _fileList
}
const getFilesBlob = () => {
  return [...state.fileList]
}
defineExpose({ getFilesBlob })
</script>
