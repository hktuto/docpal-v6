<template>
  <el-form v-if="options" :model="form" label-position="top">
    <el-form-item :label="$t('search.conditionType')">
      <el-select-v2 v-if="options.conditionType"
                    v-model="state.form.queryType"
                    :options="options.conditionType"
                    :placeholder="$t('common_selectOccupancyContent')"
                    size="small"
                    clearable
                    filterable
                    default-first-option
                    @clear="emits('selectClear')"
                    @change="handleChangeQueryType"
      >
      </el-select-v2>
    </el-form-item>
    <el-form-item v-if="isQuertType('keyword')" :label="$t('search.keyword')">
      <el-input v-model="state.form.keyword" :placeholder="$t('tip.input')" clearable size="small"
                @change="handleChange" />
    </el-form-item>
    <el-form-item v-if="isQuertType('metadata')" :label="$t('search.metadataKey')">
      <el-select-v2
        v-if="options.metadata"
        v-model="state.form.metadataKey"
        :options="options.metadata"
        :placeholder="$t('common_selectOccupancyContent')"
        clearable
        filterable
        default-first-option
        size="small"
        @change="handleMetaChange"
      >
        <template #default="{ item }">{{ $t(item.label) }}</template>
        <template #label="row">{{ $t(row.label) }}</template>
      </el-select-v2>
    </el-form-item>
    <el-form-item v-show="isQuertType('metadata')" :label="$t('search.metadataValue')">
      <SearchGroupBarFilterMetaform ref="metaForm" :config="state.metadataType" @formChange="handleMetaValueChange" />
    </el-form-item>
    <el-form-item v-if="isQuertType('keyword')" :label="$t('search.synonyms')">
      <el-switch v-model="state.form.synonyms" size="small" @change="handleChangeKeyword('synonyms')" />
    </el-form-item>
    <el-form-item v-if="state.form.synonyms && isQuertType('keyword')" :label="$t('search.includeLanguages')">
      <el-select-v2
        v-if="options.languages"
        v-model="state.form.includeLanguages"
        :options="options.languages"
        :placeholder="$t('common_selectOccupancyContent')"
        clearable
        filterable
        default-first-option
        size="small"
        multiple
        @change="handleChangeKeyword"
      >
        <template #default="{ item }">{{ $t('languages.' + item.label) }}</template>
        <template #label="row">{{ $t('languages.' + row.label) }}</template>
      </el-select-v2>
    </el-form-item>

    <el-form-item v-if="isQuertType('documentTypes')" :label="$t('searchGroup.documentTypes')">
      <el-select-v2
        v-if="options.docType"
        v-model="state.form.documentTypes"
        :options="options.docType"
        :placeholder="$t('common_selectOccupancyContent')"
        clearable
        filterable
        default-first-option
        size="small"
        multiple
        @change="handleChange"
      >
      </el-select-v2>
    </el-form-item>
    <el-form-item v-if="isQuertType('mimeTypes')" :label="$t('search.mimeTypes')">
      <el-select-v2
        v-if="options.mimeTypes"
        v-model="state.form.mimeTypes"
        :options="options.mimeTypes"
        :placeholder="$t('common_selectOccupancyContent')"
        clearable
        filterable
        default-first-option
        size="small"
        multiple
        @change="handleChange"
      />
    </el-form-item>
    <el-form-item v-if="isQuertType('creators')" :label="$t('doc_SearchCreators')">
      <el-select-v2
        v-if="options.users"
        v-model="state.form.creators"
        :options="options.users"
        :placeholder="$t('common_selectOccupancyContent')"
        clearable
        filterable
        default-first-option
        size="small"
        multiple
        @change="handleChange"
      />
    </el-form-item>
    <el-form-item v-if="isQuertType('authors')" :label="$t('searchGroup.authors')">
      <el-select-v2
        v-if="options.users"
        v-model="state.form.authors"
        :options="options.users"
        :placeholder="$t('common_selectOccupancyContent')"
        clearable
        filterable
        default-first-option
        size="small"
        multiple
        @change="handleChange"
      />
    </el-form-item>
    <el-form-item v-if="isQuertType('collections')" :label="$t('searchGroup.collections')">
      <el-select-v2
        v-if="options.collections"
        v-model="state.form.collections"
        :options="options.collections"
        :placeholder="$t('common_selectOccupancyContent')"
        clearable
        filterable
        default-first-option
        size="small"
        multiple
        @change="handleChange"
      />
    </el-form-item>
    <el-form-item v-if="isQuertType('tags')" :label="$t('searchGroup.tags')">
      <el-select-v2
        v-if="options.tags"
        v-model="state.form.tags"
        :options="options.tags"
        :placeholder="$t('common_selectOccupancyContent')"
        size="small"
        multiple
        clearable
        filterable
        default-first-option
        @change="handleChange"
      />
    </el-form-item>
    <el-form-item v-if="isQuertType('creatorGroups')" :label="$t('searchGroup.creatorGroups')">
      <el-select-v2
        v-if="options.groupList"
        v-model="state.form.creatorGroups"
        :options="options.groupList"
        :placeholder="$t('common_selectOccupancyContent')"
        size="small"
        multiple
        clearable
        filterable
        default-first-option
        @change="handleChange"
      />
    </el-form-item>
    <el-form-item v-if="isQuertType('authorGroups')" :label="$t('searchGroup.authorGroups')">
      <el-select-v2
        v-if="options.groupList"
        v-model="state.form.authorGroups"
        :options="options.groupList"
        :placeholder="$t('common_selectOccupancyContent')"
        size="small"
        multiple
        clearable
        filterable
        default-first-option
        @change="handleChange"
      />
    </el-form-item>
    <el-form-item v-if="isQuertType('size')" :label="$t('searchGroup.size')">
      <el-select-v2
        v-if="options.sizes"
        v-model="state.form.size"
        :options="options.sizes"
        :placeholder="$t('common_selectOccupancyContent')"
        default-first-option
        size="small"
        @change="handleChange"
      >
        <template #default="{ item }">{{ $t(item.label) }}</template>
        <template #label="row">{{ $t(row.label) }}</template>
      </el-select-v2>
    </el-form-item>
    <el-form-item v-if="isQuertType('createdDate')" :label="$t('searchGroup.createdDate')">
      <el-date-picker v-model="state.form.createdDate" type="daterange" size="small" @change="handleChange" />
    </el-form-item>
    <el-form-item v-if="isQuertType('modified')" :label="$t('searchGroup.modified')">
      <el-date-picker v-model="state.form.modified" type="daterange" size="small" @change="handleChange" />
    </el-form-item>
    <el-form-item v-if="isQuertType('path')" :label="$t('searchGroup.path')">
      <el-cascader v-model="state._path" :props="pathProps" size="small" @change="handleChange('path')">
        <template #default="{ node, data }">
          <span>{{ data.label }}</span>
          <!-- <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span> -->
        </template>
      </el-cascader>
    </el-form-item>
  </el-form>
</template>
<script lang="ts" setup>
import type { CascaderProps } from 'element-plus'
import { globalApi } from 'api'

const props = defineProps(['form', 'id'])
const emits = defineEmits(['selectClear', 'formChange'])
const state = reactive<any>({
  form: {},
  metadataType: {
    type: 'string'
  },
  _path: ''
})
const options = inject('searchOptions')

const metaForm = ref()
const pathProps: CascaderProps = {
  lazy: true,
  checkStrictly: true,
  lazyLoad(node, resolve) {
    const { level, value, childrenData } = node
    // if (!!childrenData) {
    //   resolve(childrenData)
    //   return
    // }
    const idOrPath = level == 0 ? '/' : value
    globalApi.postDmsDocumentChildrenThumbnail({ idOrPath, pageSize: 100000 }).then((res: any) => {
      const nodes = res.data.entryList.reduce((prev: any, item: any) => {
        if (item.isFolder)
          prev.push({
            value: item.path,
            label: item.name
          })
        return prev
      }, [])
      resolve(nodes)
    }).catch((err) => {
      resolve([])
    })
  }
}

function isQuertType(value: string) {
  return state.form.queryType === value
}

async function handleMetaChange(value: string) {
  state.metadataType = options.value.metadata.find((item: any) => item.value === value)
}

async function handleMetaEcho(q: any) {
  if (q.value?.key) {
    handleMetaChange(q.value.key)
  }
}

async function handlePath(path: string) {
  const paths = path.split('/').filter((item) => item)
  state._path = paths.reduce((prev: any, name, index) => {
    let path = '/'
    paths.forEach((item, i) => {
      if (i <= index) {
        path += item + '/'
      }
    })
    prev.push(path)
    return prev
  }, [])
}

function handleMetaValueChange(value: string) {
  state.form.metadataValue = value
  handleChange()
}

function handleChangeQueryType(value: string) {
  state.form = {
    queryType: value
  }
}

function handleChange(key: string = '') {
  if (key === 'path') {
    if (state._path.length > 0) {
      state.form.path = state._path.pop()
    } else {
      state.form.path = ''
    }
  }
  emits('formChange')
}

function handleChangeKeyword(key: string) {
  if (key === 'synonyms') {
    state.form.includeLanguages = []
  }
  if (state.form.keyword && state.form.keyword.length > 0) {
    emits('formChange')
  }
}

function getFormData() {
  return {
    ...state.form
  }
}

watch(
  () => props.form,
  (newValue: any, oldValue: any) => {
    state.form = { ...newValue, ...newValue.option }
    if (newValue.value) {
      state.form[newValue.queryType] = newValue.value
    }
    if (newValue.queryType === 'metadata' && (!oldValue || newValue.queryType !== oldValue?.queryType)) {
      handleMetaEcho(newValue)
      setTimeout(() => {
        if (metaForm.value) metaForm.value.setValue(newValue.metadataValue || newValue.value?.value)
      }, 100)
    } else if (newValue.queryType === 'path') {
      handlePath(newValue.value)
    }
  },
  {
    immediate: true
  }
)

defineExpose({
  getFormData
})
</script>
<style lang="scss" scoped>
:deep(.el-cascader) {
  width: 100%;
}
</style>
