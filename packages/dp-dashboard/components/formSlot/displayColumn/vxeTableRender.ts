import { VxeUI } from 'vxe-pc-ui'
import DocumentLink from './link/document.vue'
// 创建一个单元格超链接
VxeUI.renderer.add('ClickActionCell', {
  // 默认显示模板
  renderTableDefault(renderOpts: any, renderParams: any) {
    return rendererFunction.ClickActionCell(renderOpts, renderParams)
  }
})
export const rendererFunction: any = {
  ClickActionCell: (renderOpts: any, renderParams: any) => {
    if (!renderParams.row[renderParams.column.field]) {
      return h('div', {}, '-')
    }
    const prefix = renderOpts.params.setting.prefix || ''
    const suffix = renderOpts.params.setting.suffix || ''
    let label = "";
    if(renderOpts.params.linkType === 'openDocument') {
      return h(DocumentLink, {
        docId: renderParams.row[renderParams.column.field]
      })
    }else{
      label = prefix + renderParams.row[renderParams.column.field] + suffix
    }
    return h(
      'a',
      {
        href: 'javascript:void(0)',
        onClick: () => {
          const content: any = {}
          switch (renderOpts.params.linkType) {
            case 'openCase':
              content.caseInstanceId = renderParams.row[renderParams.column.field]
              break
            case 'openWorkflow':
              content.processInstanceId = renderParams.row[renderParams.column.field]
              break
            case 'openDocument':
              content.documentId = renderParams.row[renderParams.column.field]
              break
          }
          notiHandleView({ content }, renderOpts.params.tabProvider)
          if (renderOpts.params.closeDialog) {
            renderOpts.params.closeDialog()
          }
        },
        class: 'click-action-cell'
      },
      label
    )
  }
}
