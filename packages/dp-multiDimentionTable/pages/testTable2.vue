<!-- 测试multiDimentionTable -->
<template>
  <div class="test-container">
    <h1>MultiDimensionTable 组件测试</h1>

    <MultiDimentionTable ref="tableRef" tableName="test_table">
      <!-- 自定义工具栏左侧 -->
      <template #toolbar-left>
      </template>

      <!-- 自定义工具栏右侧 -->
      <template #toolbar-right>
        <el-button @click="handleExport">导出Excel</el-button>
        <el-button @click="getAllRowData">获取数据</el-button>
        <el-button type="warning" @click="handleTestDeleteColumn">测试删除列</el-button>
        <el-button type="info" @click="handleTestUpdateColumn">测试更新列</el-button>
      </template>
    </MultiDimentionTable>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const tableRef = ref<any>()
</script>

<style scoped lang="scss">
.test-container {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;

  h1 {
    margin-bottom: 20px;
    font-size: 24px;
    font-weight: bold;
  }

  .debug-info {
    margin-top: 20px;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 4px;
    max-height: 300px;
    overflow-y: auto;

    h3 {
      margin-top: 0;
      margin-bottom: 10px;
    }

    p {
      margin: 5px 0;
    }

    pre {
      background: #fff;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      margin-top: 10px;
    }
  }
}
</style>
