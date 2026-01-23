<template>
  <div v-if="doc" class="version-display">
    <div class="flex">
      <slot />
      v{{ doc.version }}
      <template v-if="doc.isCheckedOut">+</template>
      - {{ displayTime(doc.modifiedDate) }}
      <el-popover v-if="canRestore" v-model="popoverShow" placement="top" width="200">
        <div v-loading="loading">
          <p>{{ $t('file_resetVersionTip') }} v{{ doc.version }}</p>
          <div class="flex-x-end">
            <!-- <el-button size="small" type="text" @click="popoverShow = false">{{$t('cancelText')}}</el-button> -->
            <el-button type="primary" size="small" @click="handleRestore()">{{ $t('dpButtom_confirm') }}</el-button>
          </div>
        </div>
        <template #reference>
          <img class="cursorPointer el-icon--right" :src="'/icons/restore.svg'" round />
        </template>
      </el-popover>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { clientApi } from 'api'

const props = defineProps<{
  doc: any,
  canRestore: boolean
}>()
const { displayTime } = useTime()
const popoverShow = ref(false)
const loading = ref(false)
const routerProvider = inject(MenuRouterKey)

function handleUpdate(handleType?: String) {
  const ev = new CustomEvent('tree-node-update', {
    detail: { doc: props.doc, handleType }
  })
  window.dispatchEvent(ev)
}

async function handleRestore() {
  loading.value = true
  try {
    await clientApi.api.postDmsDocumentVersionRestore({
      idOrPath: props.doc.id,
      versionNum: props.doc.version
    }).then(res => res.data)
    const newItem = createDetailPageParams({
      idOrPath: props.doc.id,
      docName: props.doc.name,
      showHeaderAction: true
    })
    routerProvider?.navigateTo(newItem)
    // router.push(`/browse?path=${props.doc.path}`)
    popoverShow.value = false
  } catch (error) {

  }
  loading.value = false
}

</script>

<style lang="scss" scoped>
.flex {
  display: flex;
  // justify-content: space-between;
  align-items: center;
  margin-bottom: var(--app-space-s);
}

.version-display {
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr;
}

main {
  height: 100%;
  overflow: auto;
}
</style>
