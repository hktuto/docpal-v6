
// import VxeUIAll from 'vxe-pc-ui';
// import 'vxe-pc-ui/lib/style.css';
// import VxeUITable from 'vxe-table';
// import { VxeUI } from 'vxe-table'
// import 'vxe-table/lib/style.css';
// // import VxeUIPluginRenderElement from '@vxe-ui/plugin-render-element';
// import '@vxe-ui/plugin-render-element/dist/style.css';

import {
  VxeUI,

  VxeButton,
  
  VxeInput,
  VxeTextarea,
  
} from 'vxe-pc-ui'

import {
  VxeTable,
  VxeColumn,
  VxeColgroup,
  VxeGrid,
  VxeToolbar
} from 'vxe-table'

// 导入主题变量，也可以重写主题变量
import 'vxe-pc-ui/lib/style.css'
import 'vxe-table/lib/style.css'

import VxeUIPluginExportXLSX from '@vxe-ui/plugin-export-xlsx'
import ExcelJS from 'exceljs'

function lazyVxeUI (app:any) {
  
  app.use(VxeButton)
  
  app.use(VxeInput)
  app.use(VxeTextarea)
  
}

function lazyVxeTable (app:any) {
  app.use(VxeTable)
  app.use(VxeColumn)
  app.use(VxeColgroup)
  app.use(VxeGrid)
  app.use(VxeToolbar)
}


export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.use(lazyVxeUI).use(lazyVxeTable);
  const i18n = nuxtApp.$i18n as any;
  // VxeUI.use(VxeUIPluginRenderElement);
  VxeUI.use(VxeUIPluginExportXLSX,{
    ExcelJS
  });
  VxeUI.setConfig({
    // 对组件内置的提示语进行国际化翻译
    i18n: (key, args) => i18n.t(key, args),
    translate: (key, args) => i18n.t(key, args)
  });
});
