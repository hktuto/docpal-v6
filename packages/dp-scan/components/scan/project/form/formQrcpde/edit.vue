<script lang="ts" setup>
const modelValue = defineModel('modelValue', {
  required:true,
})
const props = defineProps<{
  modelValue:any,
  img:string
}>()
const emtis = defineEmits(['update:modelValue','delete','select'])
const localValue = computed({
  get: () => modelValue.value,
  set: (value) => emtis('update:modelValue', value),
})

</script>

<template>
<el-collapse-item :title="localValue.label" :name="localValue.key" >
    <div class="qrcodeContainer">
        <div class="imgContainer">
            <img :src="img" alt="QR Code" />
            <ElButton  type="danger" size="small" @click="emtis('delete')">
                <Icon name="lucide:trash-2" />
            </ElButton>
        </div>
        <ElForm label-position="top" size="small" class="qrContent">
            <ElFormItem label="Label">
                <ElInput v-model="localValue.label" />
            </ElFormItem>
            <ElFormItem label="Export Label">
                <ElInput v-model="localValue.export_label" />
            </ElFormItem>
            <ElFormItem label="Readonly">
                <ElSwitch v-model="localValue.readonly" />
            </ElFormItem>

        </ElForm>
    </div>
</el-collapse-item>
</template>
<style lang="scss" scoped>
.imgContainer{
    width: clamp(60px, 50%, 200px);
    img{
    width:100%;
    object-fit: contain;
    position: relative;
    :deep(.el-button){
        position: absolute;
        top: 5px;
        right: 5px;
    }
}
}
.qrcodeContainer {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  flex-flow: row nowrap;
  gap:var(--app-space-xs);
}
</style>
