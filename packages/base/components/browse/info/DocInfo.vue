<template>
  <div class="docInfoContainer">
    <el-card shadow="never">
      <div class="infoSection">
        <div class="infoTitle">{{ $t('info_type') }}</div>
        <div class="infoContent" v-if="info.type">
          {{ $t(info.type) }}
          <BrowseActionsChangeDocType v-if="!disable" class="el-icon--right" :doc="doc" @success="$emit('refresh')" />
        </div>
      </div>
      <div v-show="!info.isFolder" class="infoSection">
        <div class="infoTitle">{{ $t('info_version') }}</div>
        <div class="infoContent"><BrowseInfoVersionPopover v-if="info.id" :doc="info"></BrowseInfoVersionPopover></div>
      </div>
      <div v-if="!info.isFolder && info.properties && info.properties['file_content'] && info.properties['file_content']['mime-type']" class="infoSection">
        <div class="infoTitle">{{ $t('docInfo.fileExtension') }}</div>
        <div class="infoContent">{{ getFileExtension(info.properties['file_content']['mime-type']) }}</div>
      </div>
      <div v-if="info.properties['file_content']" class="infoSection">
        <div class="infoTitle">{{ $t('info_size') }}</div>
        <div class="infoContent">{{ fileSizeCalc(info.properties['file_content'].length) }}</div>
      </div>
      <div class="infoSection">
        <div class="infoTitle">{{ $t('info_modified') }}</div>
        <div class="infoContent">{{ formatDate(info.modifiedDate) === '-' ? formatDate(info.createdDate) : formatDate(info.modifiedDate) }}</div>
      </div>
      <div class="infoSection">
        <div class="infoTitle">{{ $t('fileModifiedDate_label') }}</div>
        <div class="infoContent">{{ formatDate(info.properties['dpc:fileModifiedDate']) }}</div>
      </div>
      <div class="infoSection">
        <div class="infoTitle">{{ $t('info_created') }}</div>
        <div class="infoContent">{{ formatDate(info.createdDate) }}</div>
      </div>
      <div class="infoSection">
        <div class="infoTitle">{{ $t('info_by') }}</div>
        <div class="infoContent">{{ info.createdBy }}</div>
      </div>
      <div class="infoSection">
        <div class="infoTitle">{{ $t('info_contributors') }}</div>
        <div class="infoContent tagList">
          <div v-for="(contributor, index) in info.contributors" :key="index" class="tag tableItemTags">
            {{ contributor }}
          </div>
        </div>
      </div>

      <BrowseInfoMeta v-bind="$props" :doc="doc" @update="$emit('update', true)" />
      <BrowseInfoTag :doc="doc" @update="$emit('update', true)" />
      <BrowseInfoCollection v-if="doc.isCollectionMember":disable="disable" :doc="doc" @update="$emit('update', true)" />
    </el-card>
    <el-card v-if="!doc.isFolder && allowFeature('WORKFLOW_ADHOC') && doc.status !== 20" shadow="never">
      <BrowseInfoWorkflowSection :disable="disable" :doc="doc"></BrowseInfoWorkflowSection>
    </el-card>
    <!-- <el-divider /> -->
    <el-card shadow="never">
      <BrowseInfoAcl :doc="doc" />
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import * as mime from 'mime-types'
const props = defineProps<{
  doc: any
  disable: boolean
}>()

const info = computed(() => {
  return (
    props.doc || {
      type: '',
      modifiedDate: '',
      createdDate: '',
      createdBy: ''
    }
  )
})

function fileSizeCalc(bytesLength: number) {
  const kb = 1000
  const mb = kb * 1000
  const gb = mb * 1000
  if (bytesLength >= gb) {
    return (bytesLength / gb).toFixed(2) + ' GB'
  } else if (bytesLength >= mb) {
    return (bytesLength / mb).toFixed(2) + ' MB'
  } else if (bytesLength >= kb) {
    return (bytesLength / kb).toFixed(2) + ' KB'
  } else {
    return bytesLength + ' bytes'
  }
}
function getFileExtension(mimeType) {
  return mime.extension(mimeType)
}

// const contributors = computed(() => props.doc?.properties?.['dc:contributors'] || [])
</script>

<style lang="scss" scoped>
.docInfoContainer {
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-xs);
  color: var(--app-grey-300);
  :deep(.el-divider--horizontal) {
    margin: var(--app-space-m) 0 !important;
  }
  :deep( > * ) {
    flex: 1 0 auto;
  }
  :deep(.infoSection) {
    margin-bottom: var(--app-space-s);
  }
  :deep(.infoTitle){
      font-size: var(--app-font-size-s);
      display: block;
      color: var(--app-grey-600);
      margin-bottom: var(--app-space-xs);
    }
  :deep(.infoContent) {
    font-size: var(--app-font-size-m);
    font-weight: 500;
    min-height: 1rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    --icon-size: var(--app-font-size-m);
  }
}
.tagList {
  .tag {
    display: inline-block;
    background: var(--app-grey-900);
    padding: 4px 12px;
    border-radius: 2px;
    margin: 0 4px 4px 0;
  }
}
</style>
