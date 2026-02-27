<template>
  <div class="search-group-bar-filter">
    <div class="flex-x-end">
      <el-icon :class="[mode === 'edit' ? 'rotateLast' : 'rotateFirst', 'cursorPointer']" @click="handleUp">
        <ArrowUp />
      </el-icon>
    </div>
    <div v-show="mode === 'edit'">
      <div v-for="(item, index) in qItem.matchs" :key="item.id">
        <SearchGroupBarFilterForm :form="item" :id="id" :ref="el => formRef[item.id] = el"
                             @selectClear="handleDelete(item)"
                             @formChange="emits('formChange')" />
        <el-divider v-if="index !== qItem.matchs.length - 1">
          {{ $t(`logic.${qItem.condition}`) }}
        </el-divider>
      </div>
      <div class="flex-x-center">
        <el-dropdown type="primary" size="small" split-button @click="handleAddFilter" @command="handleCommand">
          {{ $t(`logic.${qItem.condition}`) }}
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="and">{{ $t('logic.and') }}</el-dropdown-item>
              <el-dropdown-item command="or">{{ $t('logic.or') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <div v-show="mode === 'view'">
      <template v-for="(item, index) in viewData" :key="item.id">
        <el-tag class="el-tag--ellipsis" closable
                v-if="(item.queryType !== 'metadata' && item.value) ||
          (item.value.key && item.value.value)"
                @close="handleDelete(item)">
          <template v-if="item.queryType !== 'metadata'">
            {{ item.queryType }}: {{ item.value }}
          </template>
          <template v-else>
            {{ item.value.key }}: {{ item.value.value }}
          </template>
        </el-tag>
      </template>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { searchGroupQQ } from '~/typing/search'
import { ArrowUp } from '@element-plus/icons-vue'

const props = defineProps(['qItem', 'id'])
const emits = defineEmits(['delete', 'deleteChild', 'add', 'command', 'update', 'formChange'])
const formRef = ref({})
const mode = ref('edit')
const viewData = ref({})

function handleAddFilter() {
  emits('add')
}

function handleCommand(command: string) {
  emits('command', command)
}

async function handleUp() {
  if (mode.value === 'edit') {
    const data = await getData()
    viewData.value = data
    // emits('update', data)
  }
  mode.value = mode.value === 'edit' ? 'view' : 'edit'
}

function handleDelete(item: searchGroupQQ, fieldName?: string) {
  if (!fieldName || fieldName === 'queryType') {
    if (props.qItem.matchs.length === 1) {
      emits('delete')
    } else {
      emits('deleteChild', item.id, props.qItem.matchs)
    }
  }
}


async function getData() {
  const pList: any = []
  for (const item of props.qItem.matchs) {
    pList.push(getFormData(item))
  }
  const data = await Promise.all(pList)
  return data.reduce((pre, cur) => {
    const item: any = {}
    let rItem: any = {}
    Object.keys(cur).forEach(key => {
      if (String(cur[key]) === 'false' || String(cur[key]) === '0' || !!cur[key]) {
        if (cur[key] instanceof Array && cur[key].length === 0) return
        item[key] = cur[key]
      }
    })
    if (item.queryType !== 'metadata') {
      rItem = {
        queryType: item.queryType,
        value: item[item.queryType]
      }
      if (item.queryType === 'keyword') {
        rItem.option = {
          // matchCase: item.matchCase,
          fullMatch: item.fullMatch,
          synonyms: item.synonyms,
          includeLanguages: item.includeLanguages ? item.includeLanguages : []
        }
      }

      pre.push(rItem)
    } else {
      rItem = {
        queryType: item.queryType,
        value: {
          key: item.metadataKey,
          value: item.metadataValue || ''
        },
        option: {
          // matchCase: item.matchCase,
          fullMatch: item.fullMatch
        }
      }
      pre.push(rItem)
    }
    return pre
  }, [])
}

async function getFormData(item: any) {
  const id = item.id
  const data = await formRef.value[id].getFormData()
  return { ...data }
}

onMounted(async () => {
})
defineExpose({
  getData
})
</script>
<style lang="scss" scoped>
.search-group-bar-filter {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: var(--app-space-xs);

  :deep(.container-wrapper) {
    min-width: unset;
  }

  :deep(.static-content-item) {
    min-height: unset;
  }

  :deep(.el-form .el-row) {
    padding: unset;
  }
}

.rotateFirst {
  transform: rotate(180deg);
  transition: all 0.5s;
}

.rotateLast {
  transition: all 0.5s;
}

.el-tag {
  margin-right: var(--app-space-xs);
  margin-bottom: var(--app-space-xs);
}
</style>
