<template>
    <div id="editorjsEditorContainer">
      <div class="actions">
        <div class="name">
          <div class="span">{{data.label}}</div>
          <slot name="name"></slot>
        </div>
        <div class="action">
          <slot name="action"></slot>
        </div>
      </div>
      <div :class="`email_content ${mode}`">
        <div :class="`emailTemplateContainer ${mode}`" v-html="contentHtml">
        </div>
      </div>
      <div class="responsiveSizeEditorContainer">
        <SvgIcon :class="{desktop:true, active:mode === 'desktop'}" :src="'/icons/desktop.svg'" @click="mode = 'desktop'" />
        <SvgIcon :class="{mobile:true, active:mode === 'mobile'}" :src="'/icons/smartphone.svg'" @click="mode = 'mobile'" />
      </div>
    </div>
</template>

<script lang="ts" setup>

//#region setup
  import {useEditor} from "~/composables/useEditorjs";

const props = defineProps<{
    data: any,
    layout: string,
  }>()

const { layout, data } = toRefs(props)

  const emits = defineEmits([
    'save',
  ])

  const mode = ref<'desktop' | 'mobile'>('desktop');
  const contentHtml = ref()
  const editor = useEditor(data);

//#endregion

function layoutOrDataChange() {
  if(!layout.value) return;
  contentHtml.value = "";
  nextTick(() => {
    contentHtml.value = layout.value.replaceAll('[[emailContent]]', '<div id="emailContent"></div>');
    nextTick(() => {
      const emailContent = document.getElementById('emailContent')
      if(emailContent) {
        emailContent.innerHTML = "";
      }
      editor.createEditor('emailContent', data.value);
    })
  })



}


function getVariables(){
  return editor.variables.value;
}

watch(()=> [layout.value, data.value], () => {
  layoutOrDataChange()
},{
  immediate: true
})

defineExpose({
  getVariables,
  getData: () => editor.getData(),

})


</script>

<style scoped>
#editorjsEditorContainer{
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: min-content 1fr;
  overflow: hidden;
  .actions{
    display: grid;
    grid-template-columns: 1fr min-content;
    gap: var(--app-space-xs);
    margin-bottom: 20px;
    .name {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
      gap: var(--app-space-xs);
      flex:1 0 auto;
      word-break: break-all;
      span{
        font-size: 1.2rem;
        font-weight: bold;
      }
    }
    .action{
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
      gap: var(--app-space-xs);
      .el-select{
        width: 200px;
      }
      > * {
        margin:0;

      }
    }
  }
  .email_content{
    flex: 1 0 auto;
    position: relative;
    overflow: hidden;
    &.desktop{
      width: 100%;
    }
    &.mobile{
      width: 375px;
      margin: 0 auto;
    }
  }
  .emailTemplateContainer{
    height: 100%;
    overflow: auto;
  }
}

.responsiveSizeEditorContainer{
  position: absolute;
  left: calc(50% - 31px);
  top: 56px;
  width: 62px;
  height: 30px;
  background-color: #fff;
  z-index: 2;
  border: 1px solid #eee;
  border-radius: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  --icon-color: var(--app-grey-600);
  .desktop, .mobile{
    cursor: pointer;
    &.active{
      --icon-color: var(--app-primary-color);
    }
  }
}
</style>
