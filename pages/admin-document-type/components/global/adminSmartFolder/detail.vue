<script lang="ts" setup>
import { newAdminApi } from 'api'
import { onMounted } from 'vue'

const routerProvider = inject(MenuRouterKey)
const { id } = defineProps<{
  id: string
}>()
const state = reactive({
  setting: {},
  loading: false,
  testLoading: false
})
const { t } = useI18n()
const filterRef = ref()
const tableRef = ref()

async function handleInit() {
  try {
    state.loading = true
    state.setting = await newAdminApi.getAdmindmsSmartFolderId(id).then((res) => res.data)
    if (!!state.setting.json_value) {
      state.setting.json = JSON.parse(state.setting.json_value)
      tableRef.value.initBar(state.setting.json)
      filterRef.value.initForm(state.setting.json)
    } else {
      state.setting.json = {
        condition: 'and',
        docId: '',
        query: [
          {
            id: getUniqueId('query'),
            condition: 'and',
            matchs: [
              {
                id: getUniqueId('matchs'),
                queryType: 'keyword',
                value: '',
                type: 'string',
                option: {
                  matchCase: false,
                  fullMatch: false,
                  synonyms: false,
                  includeLanguages: []
                }
              }
            ]
          }
        ]
      }
      tableRef.value.initBar(state.setting.json)
      filterRef.value.initForm(state.setting.json)
    }
  } catch (error) {
  } finally {
    state.loading = false
  }
}

async function handleTest() {
  try {
    state.testLoading = true
    const data = await filterRef.value.getData()
    tableRef.value.initBar(data)
  } catch (error) {
  } finally {
    setTimeout(() => {
      state.testLoading = false
    }, 1000)
  }
}

function handleClear() {
  filterRef.value.clear()
}

async function handleSave() {
  try {
    state.loading = true
    const data = await filterRef.value.getData()
    const res = await newAdminApi.patchAdmindmsSmartFolder({
      ...state.setting,
      json_value: JSON.stringify(data)
    }).then((res) => res.data)
    routerProvider?.message.success(t('dpMsg_success'))
  } catch (error) {
  } finally {
    state.loading = false
  }
}

const { searchOptions, searchOptionsLoading } = useSearchOptions()
provide('searchOptions', searchOptions)
provide('searchOptionsLoading', searchOptionsLoading)

onMounted(() => {
  state.loading = false
  handleInit()
})
</script>
<template>
  <div class="pageContainer--padding smartFolder">
    <div class="smartFolder-left-header">{{ $t('smartFolder.searchQuery') }}</div>
    <div class="smartFolder-left-main">
      <SearchGroupBarFilter ref="filterRef"></SearchGroupBarFilter>
    </div>
    <div class="smartFolder-left-bottom">
      <div class="flex-x-center">
        <el-button id="SmartFolderSetting__Info__ClearFilter" type="info" @click="handleClear">
          {{ $t('button.clearFilter') }}
        </el-button>
        <el-button id="SmartFolderSetting__Info__Test" class="test-button" type="info" :loading="state.testLoading"
                   @click="handleTest">
          {{ $t('button.test') }}
        </el-button>
      </div>
      <el-button
        id="SmartFolderSetting__Info__Save"
        style="width: 100%; margin: var(--app-space-xs) 0"
        type="primary"
        :loading="state.loading"
        @click="handleSave"
      >
        {{ $t('dpTool_save') }}
      </el-button>
    </div>
    <div class="smartFolder-right-main" style="height: 100%; overflow: hidden">
      <SearchGroupTable ref="tableRef" :tableId="id">
        <template #toolbar_buttons>
          {{ $t('smartFolder.searchResult') }}
        </template>
      </SearchGroupTable>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.smartFolder {
  display: grid;
  grid-template-columns: minmax(min-content, 400px) 1fr;
  grid-template-rows: min-content 1fr min-content;
  gap: var(--app-space-xs);

  .smartFolder-left-header {
    grid-area: 1 / 1 / 2 / 2;
  }

  .smartFolder-left-main {
    grid-area: 2 / 1 / 3 / 2;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .smartFolder-left-bottom {
    grid-area: 3 / 1 / 4 / 2;

    .test-button {
      flex: 1;
    }
  }

  .smartFolder-right-main {
    grid-area: 1 / 2 / 4 / 3;
    position: relative;
  }
}
</style>
