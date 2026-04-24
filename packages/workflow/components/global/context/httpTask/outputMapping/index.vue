<script setup lang="ts">
const { t } = useI18n()

// TODO: 用於顯示JSON schema 的數據層級

</script>

<template>
  <el-dialog :title="t('Response Mapping')" append-to-body class="big" :close-on-click-modal="false">
    <el-tree ref="treeRef2" style="max-width: 600px" :data="dataSource" show-checkbox node-key="id" default-expand-all :expand-on-click-node="false">
      <template #default="{ node, data }">
        <div class="custom-tree-node">
          <span>{{ node.label }}</span>
          <div>
            <el-button type="primary" link @click="append(data)"> Append </el-button>
            <el-button style="margin-left: 4px" type="danger" link @click="remove(node, data)"> Delete </el-button>
          </div>
        </div>
      </template>
    </el-tree>
  </el-dialog>

  <LazyContextHttpTaskOutputMappingDialog ref="outputMappingDialog" @update="" />
</template>

<style scoped lang="scss"></style>
