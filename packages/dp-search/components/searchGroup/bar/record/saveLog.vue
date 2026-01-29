<template>
<el-popover
  ref="popoverRef"
  :width="200"
  size="small"
  trigger="click"
>
  <el-input v-model="state.input1" placeholder="Please Input" clearable :suffix-icon="Search"
    @input="handleChange"></el-input>

  <div class="list">
    <div v-for="item in state._searchList" :key="item.id" class="log-item flex-x-between" @click="handleSearch(item)">
      <div>{{ item.label }}</div>
      <SvgIcon style="--icon-size: 16px;--icon-color:var(--app-grey-400);"src="/icons/menu/trash.svg"
        @click.stop="handleDelete(item)"></SvgIcon>
    </div>
  </div>
  <el-button type="primary" text @click="handleAdd">{{$t('button.add')}}</el-button>
  <SearchGroupBarSaveLogAdd ref="addRef" @save="(data: any) => emits('save', data)"></SearchGroupBarSaveLogAdd>
  <template #reference>
    <SvgIcon src="/icons/tools/save1.svg" class="mr-2" ></SvgIcon>
  </template>
</el-popover>
</template>
<script lang="ts" setup>
import { Search } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { conditionDecorators } from '~/utils/searchFormHelper'
import { clientApi } from 'api'

const { t } = useI18n()
const state = reactive<any>({
  input1: '',
  searchList: [],
  _searchList: []
})
const emits = defineEmits(['search', 'save'])
const popoverRef = ref()
function hidePopover () {
    popoverRef.value.hide()
}
function handleChange(value: string) {
  state._searchList = state.searchList.filter((item: any) => {
    return (!item.label ||
            item.label.toLowerCase().includes(value.toLowerCase()))
  })
}
const addRef = ref()
function handleAdd() {
  addRef.value.handleOpen()
  hidePopover()
}
function handleSearch(item: any) {
  const query = JSON.parse(item.queryCondition)
  conditionDecorators(query)
  emits('search', query)
  popoverRef.value.hide()
}
async function getList() {
  const data = await clientApi.api.getDmsSearchQueryNestedSearchLog().then(r => r.data)
  // state.searchList = await GetSearchApi()
  state._searchList = [ ...data ]
}
async function handleDelete(item: any) {
  try {
    const action = await ElMessageBox.confirm(t('msg_confirmWhetherToDelete'))
    if (action !== "confirm") return
    await clientApi.api.deleteDmsSearchDeleteNestedSearchLogId(item.id).then(r => r.data)
    getList()
  } catch (error) {
    console.error(error)
  }
}
onMounted(() => {
  getList()
})
defineExpose({
  getList
})
</script>
<style lang="scss" scoped>
.log-item {
  padding: var(--app-space-xs);
  cursor: pointer;
  &:hover {
    background: var(--el-color-primary-light-9);
  }
}
.list {
  max-height: 300px;
  overflow: auto;
}
</style>
