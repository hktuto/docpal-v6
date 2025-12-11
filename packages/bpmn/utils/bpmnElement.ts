import { Cell, CellView, Graph } from '@antv/x6'
import { circleNodeStyle, squareNodeStyle } from './bpmnElementHelper'

Graph.registerNode(
  'invisible-node',
  {
    inherit: 'rect',
    markup: []
  },
  true
)
Graph.registerNode(
  'bpmn-node',
  {
    inherit: 'rect',
    ports: {
      groups: {
        from: {
          position: 'top',
          attrs: {
            circle: {
              magnet: true,
              stroke: 'transparent',
              fill: 'transparent',
              r: 5
            }
          }
        },
        to: {
          position: 'bottom',
          attrs: {
            circle: {
              magnet: true,
              stroke: 'transparent',
              fill: 'transparent',
              r: 5
            }
          }
        },
        left: {
          position: 'left',
          attrs: {
            circle: {
              magnet: true,
              stroke: 'transparent',
              fill: 'transparent',
              r: 5
            }
          }
        },
        right: {
          position: 'right',
          attrs: {
            circle: {
              magnet: true,
              stroke: 'transparent',
              fill: 'transparent',
              r: 5
            }
          }
        }
      }
    }
  },
  true
)

export enum BpmnElementType {
  startEvent = 'startEvent',
  endEvent = 'endEvent',
  userTask = 'userTask',
  exclusiveGateway = 'exclusiveGateway',
  serviceTask = 'serviceTask',
  boundaryEvent = 'boundaryEvent',
  scriptTask = 'scriptTask',
  sequenceFlow = 'sequenceFlow' // sequenceFlow must be in last, otherwise , create edge may not work
}

export type BpmnElement = {
  [key in BpmnElementType]: {
    nodeStyle: any
    embed?: boolean
    embeddingValidateRule?: (args: { child: Cell; parent: Cell; childView: CellView; parentView: CellView }) => boolean
    connectable?: boolean
    connectRule?: (args: { child: Cell; parent: Cell; childView: CellView; parentView: CellView }) => boolean
    toolbar: {
      icon: string
      label: string
      group: string
      order: number
      dropData: any
    }[]
    newNodeData: (
      id: string,
      label: string,
      data: any
    ) => {
      id: string
      name: string
      type: BpmnElementType
      data: any
    }
    clickHandler: (args: { node: Cell; view: Cell }) => void
    contextMenuComponent?: string | Function
    validator?: (args: {
      attr_name: string,
      attr_id: string,
      extensionElements?: any,
      [key: string]: any
    }) => Promise<boolean>
  }
}

export const bpmnElement: BpmnElement = {
  startEvent: {
    nodeStyle: () => ({
      ...squareNodeStyle('#0099ff', 'Start Event', '/bpmn/icons/form.svg', 120, 64),
      // ...circleNodeStyle('#0099ff', '/bpmn/icons/form.svg'),
      shape: 'bpmn-node',
      ports: {
        items: [
          {
            id: 'to',
            group: 'to'
          }
        ]
      }
    }),
    embed: false,
    toolbar: [],
    newNodeData: (id, label, data) => ({
      id,
      name: label,
      type: BpmnElementType['startEvent'],
      data
    }),
    clickHandler: () => {
    },
    contextMenuComponent: 'LazyBpmnContextStartEvent'
  },
  endEvent: {
    nodeStyle: () => ({
      ...squareNodeStyle('#ddd', 'End Event', '/bpmn/icons/close.svg', 120, 64),

      shape: 'bpmn-node',
      ports: {
        items: [
          {
            id: 'from',
            group: 'from'
          }
        ]
      }
    }),
    embed: false,
    toolbar: [],
    newNodeData: (id, label, data) => ({
      id,
      name: label,
      type: BpmnElementType['endEvent'],
      data
    }),
    clickHandler: () => {
    },
    contextMenuComponent: 'LazyBpmnContextEndEvent'
  },
  userTask: {
    nodeStyle: (item: any) => {
      let icon = '/bpmn/icons/form.svg'
      let color = '#0099ff'
      let type = 'User Task'
      let bgColor = '#fff'
      let textColor = '#000'
      if (item && item['attr_docpal:formType']) {
        switch (item['attr_docpal:formType']) {
          case 'signature':
            icon = '/bpmn/icons/signature.svg'
            color = '#0099ff'
            type = 'Signature'
            bgColor = '#fff'
            textColor = '#000'
            break
          case 'form':
            icon = '/bpmn/icons/form.svg'
            color = '#0099ff'
            type = 'UserTask'
            bgColor = '#fff'
            textColor = '#000'
            break
          default:
            break
        }
      }
      return {
        ...squareNodeStyle(color, type, icon, 200, 64, bgColor, textColor),
        shape: 'bpmn-node',
        ports: {
          items: [
            {
              id: 'from',
              group: 'from'
            },
            {
              id: 'to',
              group: 'to'
            },
            {
              id: 'left',
              group: 'left'
            },
            {
              id: 'right',
              group: 'right'
            }
          ]
        }
      }
    },
    embed: false,
    toolbar: [
      {
        icon: 'bpmn:form',
        label: 'UserForm',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.userTask.nodeStyle(),
          label: 'New User Task',
          data: bpmnElement.userTask.newNodeData(id, 'New User Task', {
            ['attr_flowable:candidateRoles']: '',
            ['attr_flowable:formFieldValidation']: true,
            attr_id: id,
            attr_name: 'New User Task',
            ['attr_docpal:formType']: 'form',
            extensionElements: {
              ['flowable:taskListener']: {
                ['attr_delegateExpression']: '${customTaskAssignmentListener}',
                ['attr_event']: 'create'
              }
            }
          })
        })
      },
      {
        icon: 'bpmn:signature',
        label: 'Signature',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.userTask.nodeStyle({}),
          label: 'New Signature',
          data: bpmnElement.userTask.newNodeData(id, 'New Signature', {
            attr_id: id,
            attr_name: 'Signature',
            ['attr_docpal:formType']: 'signature',
            extensionElements: {
              ['flowable:formProperty']: [],
              ['docpal:signature']: [],
              ['docpal:showForm']: true,
              ['docpal:rejectField']: '',
              ['modeler:activiti-idm-candidate-group']: {
                'attr_xmlns:modeler': 'http://flowable.org/modeler',
                __cdata: 'true'
              },
              ['modeler:initiator-can-complete']: {
                'attr_xmlns:modeler': 'http://flowable.org/modeler',
                __cdata: 'false'
              }
            }
          })
        })
      }
    ],
    newNodeData: (id, label, data) => ({
      id,
      name: label,
      type: BpmnElementType['userTask'],
      data
    }),
    clickHandler: () => {
    },
    contextMenuComponent: (item: any) => {
      if (item && item['attr_docpal:formType'] === 'signature') {
        return 'LazyBpmnContextSignature'
      }
      return 'LazyBpmnContextUserTask'
    },

    validator: async (nodeData) => {
      // check if candidate or assignee is set
      const candidate = nodeData['attr_flowable:candidateGroups']
      const assignee = nodeData.extensionElements['flowable:taskListener']?.['flowable:field']?.['flowable:expression']?.['__cdata']
      if (!candidate && !assignee) {
        throw new Error(`Candidate or assignee is required on ${nodeData.attr_name}`)
      }
      return true
    }
  },
  exclusiveGateway: {
    nodeStyle: (item: any) => ({
      ...circleNodeStyle('#0099ff', '/bpmn/icons/check.svg'),
      shape: 'bpmn-node',
      ports: {
        items: [
          {
            id: 'from',
            group: 'from'
          },
          {
            id: 'to',
            group: 'to'
          },
          {
            id: 'left',
            group: 'left'
          },
          {
            id: 'right',
            group: 'right'
          }
        ]
      }
    }),
    embed: false,
    toolbar: [
      //     {
      //     icon:'bpmn:check',
      //     label: "exclusiveGateway",
      //     dropData:(id:string) => ({
      //         id,
      //         ...bpmnElement.exclusiveGateway.nodeStyle({}),
      //         label: 'new approval',
      //         data: bpmnElement.exclusiveGateway.newNodeData(id, 'New Approval', {
      //             attr_id:id,
      //         })
      //     })
      // }
    ],
    newNodeData: (id, label, data) => ({
      id,
      type: BpmnElementType['exclusiveGateway'],
      name: label,
      data: {
        attr_id: id,
        ...data
      }
    }),
    clickHandler: () => {
    },
    contextMenuComponent: 'LazyBpmnContextExclusiveGateway'
  },
  boundaryEvent: {
    nodeStyle: (item: any) => ({
      ...circleNodeStyle('#eee', '/bpmn/icons/clock.svg'),
      shape: 'bpmn-node',
      ports: {
        items: [
          {
            id: 'from',
            group: 'from'
          },
          {
            id: 'to',
            group: 'to'
          },
          {
            id: 'left',
            group: 'left'
          },
          {
            id: 'right',
            group: 'right'
          }
        ]
      }
    }),
    embed: false,
    toolbar: [
      {
        icon: 'bpmn:clock',
        label: 'Boundary Event',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.boundaryEvent.nodeStyle(),
          data: bpmnElement.boundaryEvent.newNodeData(id, '', {
            attr_id: id,
            attr_attachedToRef: '',
            attr_cancelActivity: false,
            timerEventDefinition: {
              timeDuration: 'P3D'
            }
          })
        })
      }
    ],
    newNodeData: (id, label, data) => ({
      id,
      type: BpmnElementType['boundaryEvent'],
      name: label,
      data
    }),
    clickHandler: () => {
    },
    contextMenuComponent: 'LazyBpmnContextBoundaryEvent'
  },
  serviceTask: {
    nodeStyle: (item: any) => {
      let icon = '/bpmn/icons/document.svg'
      let color = '#7B61FF'
      let type = 'ServiceTask'
      let bgColor = '#fff'
      let textColor = '#000'
      if (item['attr_flowable:type'] === 'http') {
        icon = '/bpmn/icons/http-task.svg'
        type = 'Http Task'
        color = '#7B61FF'
      } else {
        if (!item['attr_flowable:delegateExpression']) {
          return squareNodeStyle('#7B61FF', 'ServiceTask', icon)
        }

        switch (item['attr_flowable:delegateExpression']) {
          case '${sendNotificationDelegate}':
            icon = '/bpmn/icons/email.svg'
            type = 'Email'
            color = '#36ce3c'
            break
          case '${generateDocumentDelegate}':
            icon = '/bpmn/icons/document.svg'
            type = 'Document'
            color = '#7B61FF'
            break
          case '${conditionValidateDelegate}':
            icon = '/bpmn/icons/condition.svg'
            type = 'Condition'
            color = '#7B61FF'
            bgColor = '#0F2037'
            textColor = '#fff'
            break
          case '${sendWhatsAppMsgDelegate}':
            icon = '/bpmn/icons/whatsapp.svg'
            type = 'WhatsApp'
            color = '#7B61FF'
            break
          case '${updateDataDelegate}':
            icon = '/bpmn/icons/update-data.svg'
            type = 'Update Data'
            color = '#7B61FF'
            break
          case '${idGeneratorDelegate}':
            icon = '/bpmn/icons/update-data.svg'
            type = 'Generate Id'
            color = '#7B61FF'
            break
          case '${masterTableRecordDelegate}':
            icon = '/bpmn/icons/master-table.svg'
            type = 'Master Table'
            color = '#7B61FF'
            break
          case '${calendarEventDelegate}':
            icon = '/bpmn/icons/calendar.svg'
            type = 'Calendar'
            color = '#7B61FF'
            break
          case '${pdfFormReader}':
            icon = '/bpmn/icons/upload-pdf.svg'
            type = 'Reader PDF'
            color = '#7B61FF'
            break
          case '${pdfFormWriter}':
            icon = '/bpmn/icons/download-pdf.svg'
            type = 'Writer PDF'
            color = '#7B61FF'
            break
          case '${documentFolderCabinetDelegate}':
            icon = '/bpmn/icons/browse.svg'
            type = 'Folder Cabinet'
            color = '#7B61FF'
            break
          case '${docpalNotificationDelegate}':
            icon = '/bpmn/icons/message.svg'
            type = 'Send Notification'
            color = '#7B61FF'
            break
          case '${startCaseInstanceDelegate}':
            icon = '/bpmn/icons/case.svg'
            type = 'Case Task'
            color = '#7B61FF'
            break
          case '${updateCaseInstanceInfoDelegate}':
            icon = '/bpmn/icons/case.svg'
            type = 'Update Case Data Task'
            color = '#7B61FF'
            break
          case '${createAuditLogDelegate}':
            icon = '/bpmn/icons/log.svg'
            type = 'Audit Log Task'
            color = '#7B61FF'
            break
        }
      }

      return {
        ...squareNodeStyle(color, type, icon, 200, 64, bgColor, textColor),
        shape: 'bpmn-node',
        ports: {
          items: [
            {
              id: 'from',
              group: 'from'
            },
            {
              id: 'to',
              group: 'to'
            },
            {
              id: 'left',
              group: 'left'
            },
            {
              id: 'right',
              group: 'right'
            }
          ]
        }
      }
    },
    embed: false,
    toolbar: [
      {
        icon: 'bpmn:document',
        label: 'Document',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            ['attr_flowable:delegateExpression']: '${generateDocumentDelegate}',
            extensionElements: {
              ['flowable:field']: [
                { attr_name: 'storeValue', 'flowable:expression': { '__cdata': '' } },
                { attr_name: 'documentName', 'flowable:expression': { '__cdata': '' } },
                { attr_name: 'documentType', 'flowable:expression': { '__cdata': 'File' } },
                { attr_name: 'templateId', 'flowable:expression': { '__cdata': '' } }
              ]
            }
          }),
          label: 'New Document Generate',
          data: bpmnElement.serviceTask.newNodeData(id, 'New Document Generate', {
            attr_id: id,
            attr_name: 'New Document Generate',
            ['attr_flowable:delegateExpression']: '${generateDocumentDelegate}',
            extensionElements: {
              ['flowable:field']: [
                { attr_name: 'storeValue', 'flowable:expression': { '__cdata': '' } },
                { attr_name: 'documentName', 'flowable:expression': { '__cdata': '' } },
                { attr_name: 'documentType', 'flowable:expression': { '__cdata': 'File' } },
                { attr_name: 'templateId', 'flowable:expression': { '__cdata': '' } }
              ]
            }
          })
        })
      },
      {
        icon: 'bpmn:email',
        label: 'Email',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            ['attr_flowable:delegateExpression']: '${sendNotificationDelegate}',
            extensionElements: {
              ['flowable:field']: [
                { attr_name: 'notificationType', 'flowable:string': { __cdata: '' } },
                { attr_name: 'tos', 'flowable:expression': { __cdata: '' } },
                { attr_name: 'ccs', 'flowable:expression': { __cdata: '' } },
                { attr_name: 'bcc', 'flowable:expression': { __cdata: '' } },
                { attr_name: 'attachmentsFilePath', 'flowable:expression': { __cdata: '' } }
              ]
            }
          }),
          label: 'New Email',
          data: bpmnElement.serviceTask.newNodeData(id, 'New Email', {
            attr_id: id,
            attr_name: 'New Email',
            ['attr_flowable:delegateExpression']: '${sendNotificationDelegate}',
            ['attr_flowable:async']: true,
            ['attr_flowable:exclusive']: false,
            extensionElements: {
              ['flowable:field']: [
                { attr_name: 'notificationType', 'flowable:string': { __cdata: '' } },
                { attr_name: 'tos', 'flowable:expression': { __cdata: '' } },
                { attr_name: 'ccs', 'flowable:expression': { __cdata: '' } },
                { attr_name: 'bcc', 'flowable:expression': { __cdata: '' } },
                { attr_name: 'attachmentsFilePath', 'flowable:expression': { __cdata: '' } }
              ]
            }
          })
        })
      },
      {
        icon: 'bpmn:condition',
        label: 'Condition',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            ['attr_flowable:delegateExpression']: '${conditionValidateDelegate}',
            extensionElements: {
              'docpal:decisionTable': {
                orConditionElements: []
              },
              'docpal:graphLabel': {
                attr_successLable: 'success',
                attr_failureLable: 'failure'
              }
            }
          }),
          label: 'New Condition',
          data: bpmnElement.serviceTask.newNodeData(id, 'New Condition', {
            attr_id: id,
            attr_name: 'New Condition',
            ['attr_flowable:delegateExpression']: '${conditionValidateDelegate}',
            extensionElements: {
              'docpal:decisionTable': {
                orConditionElements: []
              },
              'docpal:graphLabel': {
                attr_successLable: 'success',
                attr_failureLable: 'failure'
              }
            }
          })
        })
      },
      {
        icon: 'bpmn:whatsapp',
        label: 'WhatsApp',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            ['attr_flowable:delegateExpression']: '${sendWhatsAppMsgDelegate}',
            extensionElements: {
              ['flowable:field']: [
                {
                  attr_name: 'template_name',
                  'flowable:string': {
                    __cdata: ''
                  }
                }
              ]
            }
          }),
          label: 'New WhatsApp',
          data: bpmnElement.serviceTask.newNodeData(id, 'New WhatsApp', {
            attr_id: id,
            attr_name: 'New WhatsApp',
            ['attr_flowable:delegateExpression']: '${sendWhatsAppMsgDelegate}',
            extensionElements: {
              ['flowable:field']: [
                {
                  attr_name: 'template_name',
                  'flowable:string': {
                    __cdata: ''
                  }
                }
              ]
            }
          })
        })
      },
      {
        icon: 'bpmn:update-data',
        label: 'Update Data',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            ['attr_flowable:delegateExpression']: '${updateDataDelegate}',
            extensionElements: {
              ['flowable:field']: []
            }
          }),
          label: 'New Update Data',
          data: bpmnElement.serviceTask.newNodeData(id, 'New Update Date', {
            attr_id: id,
            attr_name: 'New Update Date',
            ['attr_flowable:delegateExpression']: '${updateDataDelegate}',
            extensionElements: {
              ['flowable:field']: []
            }
          })
        })
      },
      {
        icon: 'bpmn:update-data',
        label: 'Generate Id',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            ['attr_flowable:delegateExpression']: '${idGeneratorDelegate}',
            extensionElements: {
              ['flowable:field']: []
            }
          }),
          label: 'Generate Id',
          data: bpmnElement.serviceTask.newNodeData(id, 'Generate Id', {
            attr_id: id,
            attr_name: 'Generate Id',
            ['attr_flowable:delegateExpression']: '${idGeneratorDelegate}',
            extensionElements: {
              ['flowable:field']: [
                { attr_name: 'templateId', ['flowable:expression']: { '__cdata': '' } },
                { attr_name: 'workflowInfo', ['flowable:expression']: { '__cdata': '' } },
                { attr_name: 'variables', ['flowable:expression']: { '__cdata': '' } }
              ]
            }
          })
        })
      },
      {
        icon: 'bpmn:master-table',
        label: 'Master Table',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            ['attr_flowable:delegateExpression']: '${masterTableRecordDelegate}',
            extensionElements: {
              'flowable:mastertableRecord': {
                attr_allowUpdate: false,
                attr_masterTableId: '',
                attr_workflowInfo: '',
                attr_tableColumn: '',
                attr_masterTableReturnId: '',
                field: []
              }
            }
          }),
          label: 'New Master Table',
          data: bpmnElement.serviceTask.newNodeData(id, 'New Master Table', {
            attr_id: id,
            attr_name: 'New Master Table',
            ['attr_flowable:delegateExpression']: '${masterTableRecordDelegate}',
            extensionElements: {
              'flowable:mastertableRecord': {
                attr_allowUpdate: false,
                attr_masterTableId: '',
                attr_workflowInfo: '',
                attr_tableColumn: '',
                attr_masterTableReturnId: '',
                field: []
              }
            }
          })
        })
      },
      {
        icon: 'bpmn:upload-pdf',
        label: 'Reader PDF',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            ['attr_flowable:delegateExpression']: '${pdfFormReader}',
            extensionElements: {
              ['flowable:field']: [
                { attr_name: 'fileField', ['flowable:expression']: { '__cdata': '' } },
                { attr_name: 'pdfExample', ['flowable:expression']: { '__cdata': '' } }
              ]
            }
          }),
          label: 'New Reader PDF',
          data: bpmnElement.serviceTask.newNodeData(id, 'Reader PDF', {
            attr_id: id,
            attr_name: 'Reader PDF',
            ['attr_flowable:delegateExpression']: '${pdfFormReader}',
            extensionElements: {
              ['flowable:field']: [
                { attr_name: 'fileField', ['flowable:expression']: { '__cdata': '' } },
                { attr_name: 'pdfExample', ['flowable:expression']: { '__cdata': '' } }
              ]
            }
          })
        })
      },
      {
        icon: 'bpmn:download-pdf',
        label: 'Writer PDF',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            ['attr_flowable:delegateExpression']: '${pdfFormWriter}',
            extensionElements: {
              ['flowable:field']: [
                { attr_name: 'fileField', ['flowable:expression']: { '__cdata': '' } },
                { attr_name: 'pdfExample', ['flowable:expression']: { '__cdata': '' } }
              ]
            }
          }),
          label: 'New Writer PDF',
          data: bpmnElement.serviceTask.newNodeData(id, 'Writer PDF', {
            attr_id: id,
            attr_name: 'New Writer PDF',
            ['attr_flowable:delegateExpression']: '${pdfFormWriter}',
            extensionElements: {
              ['flowable:field']: [
                { attr_name: 'fileField', ['flowable:expression']: { '__cdata': '' } },
                { attr_name: 'pdfExample', ['flowable:expression']: { '__cdata': '' } }
              ]
            }
          })
        })
      },
      {
        icon: 'bpmn:http-task',
        label: 'HTTP Task',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            // ['attr_flowable:parallelInSameTransaction']: 'true',
            ['attr_flowable:type']: 'http',
            extensionElements: {
              ['flowable:field']: [
                { attr_name: 'requestMethod', ['flowable:expression']: { '__cdata': 'GET' } },
                { attr_name: 'requestUrl', ['flowable:expression']: { '__cdata': '' } },
                {
                  attr_name: 'requestHeaders',
                  ['flowable:expression']: { '__cdata': 'Content-Type: application/json' }
                },
                { attr_name: 'requestBody', ['flowable:expression']: { '__cdata': '{}' } },
                { attr_name: 'requestTimeout', ['flowable:expression']: { '__cdata': '2000' } },
                { attr_name: 'responseVariableName', ['flowable:expression']: { '__cdata': '' } },
                { attr_name: 'saveResponseVariableAsJson', ['flowable:expression']: { '__cdata': 'false' } },
                { attr_name: 'saveResponseParametersTransient', ['flowable:expression']: { '__cdata': 'false' } },
                { attr_name: 'saveResponseParameters', ['flowable:expression']: { '__cdata': 'false' } },
                { attr_name: 'disallowRedirects', ['flowable:expression']: { '__cdata': 'false' } },
                { attr_name: 'ignoreException', ['flowable:expression']: { '__cdata': 'true' } }
              ]
            }
          }),
          label: 'HTTP Task',
          data: bpmnElement.serviceTask.newNodeData(id, 'HTTP Task', {
            attr_id: id,
            attr_name: 'HTTP Task',
            // ['attr_flowable:parallelInSameTransaction']: 'true',
            ['attr_flowable:type']: 'http',
            extensionElements: {
              ['flowable:field']: [
                { attr_name: 'requestMethod', ['flowable:expression']: { '__cdata': 'GET' } },
                { attr_name: 'requestUrl', ['flowable:expression']: { '__cdata': '' } },
                { attr_name: 'requestTimeout', ['flowable:expression']: { '__cdata': '2000' } },
                {
                  attr_name: 'requestHeaders',
                  ['flowable:expression']: { '__cdata': 'Content-Type: application/json' }
                },
                { attr_name: 'requestBody', ['flowable:expression']: { '__cdata': '{}' } },
                { attr_name: 'responseVariableName', ['flowable:expression']: { '__cdata': '' } },
                { attr_name: 'saveResponseVariableAsJson', ['flowable:expression']: { '__cdata': 'false' } },
                { attr_name: 'saveResponseParametersTransient', ['flowable:expression']: { '__cdata': 'false' } },
                { attr_name: 'saveResponseParameters', ['flowable:expression']: { '__cdata': 'false' } },
                { attr_name: 'disallowRedirects', ['flowable:expression']: { '__cdata': 'false' } },
                { attr_name: 'ignoreException', ['flowable:expression']: { '__cdata': 'true' } }
              ]
            }
          })
        })
      },
      {
        icon: 'bpmn:browse',
        label: 'Folder Cabinet',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            ['attr_flowable:delegateExpression']: '${documentFolderCabinetDelegate}',
            extensionElements: {
              ['flowable:folderCabinetMapping']: {
                attr_id: '',
                attr_name: '',
                ['field']: []
              }
            }
          }),
          label: 'New Folder Cabinet',
          data: bpmnElement.serviceTask.newNodeData(id, 'New Folder Cabinet', {
            attr_id: id,
            attr_name: 'New Folder Cabinet',
            ['attr_flowable:delegateExpression']: '${documentFolderCabinetDelegate}',
            extensionElements: {
              ['flowable:folderCabinetMapping']: {
                attr_id: '',
                attr_name: '',
                ['field']: []
              }
            }
          })
        })
      },
      {
        icon: 'bpmn:message',
        label: 'Send Notification',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            ['attr_flowable:delegateExpression']: '${docpalNotificationDelegate}',
            extensionElements: {
              ['flowable:field']: [
                {
                  attr_name: 'system_notification_message',
                  'flowable:string': { __cdata: '{"templateId": "notification.workflow.custom","level": "success","eventType": "common","additionalContent": "","showNotification": true,"notiStatus":"SUCCESS"}' }
                },
                {
                  attr_name: 'notificationUserFromVariables',
                  'flowable:expression': { __cdata: '' }
                }
              ]
            }
          }),
          label: 'Send Message to user',
          data: bpmnElement.serviceTask.newNodeData(id, 'Send Notification', {
            attr_id: id,
            attr_name: 'Send Notification',
            ['attr_flowable:delegateExpression']: '${docpalNotificationDelegate}',
            extensionElements: {
              ['flowable:field']: [
                {
                  attr_name: 'system_notification_message',
                  'flowable:string': { __cdata: '{"templateId": "notification.workflow.custom","level": "success","eventType": "common","additionalContent": "","showNotification": true,"notiStatus":"SUCCESS"}' }
                },
                {
                  attr_name: 'notificationUserFromVariables',
                  'flowable:expression': { __cdata: '' }
                }
              ]
            }
          })
        })
      },
      {
        icon: 'bpmn:calendar',
        label: 'Calendar',
        group: '',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            ['attr_flowable:delegateExpression']: '${calendarEventDelegate}',
            extensionElements: {
              'flowable:calendarEvent': {
                attr_description: 'New Calendar Task',
                attr_eventId: '',
                attr_eventName: '',
                attr_actionType: '',
                attr_eventDescription: '',
                attr_category: '',
                attr_location: '',
                attr_startTime: '',
                attr_endTime: '',
                attr_isAllDay: '',
                related: {
                  attr_user: ''
                },
                reminder: []
              }
            }
          }),
          label: 'New Calendar Task',
          data: bpmnElement.serviceTask.newNodeData(id, 'New Calendar Task', {
            attr_id: id,
            attr_name: 'New Calendar Task',
            ['attr_flowable:delegateExpression']: '${calendarEventDelegate}',
            extensionElements: {
              'flowable:calendarEvent': {
                attr_description: 'New Calendar Task',
                attr_eventId: '',
                attr_eventName: '',
                attr_actionType: '',
                attr_eventDescription: '',
                attr_category: '',
                attr_location: '',
                attr_startTime: '',
                attr_endTime: '',
                attr_isAllDay: '',
                related: {
                  attr_user: ''
                },
                reminder: []
              }
            }
          })
        })
      },
      {
        icon: 'bpmn:case',
        label: 'Case Task',
        group: 'case',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            ['attr_flowable:delegateExpression']: '${startCaseInstanceDelegate}',
            extensionElements: {
              'flowable:newCase': {
                attr_caseTypeId: '',
                attr_name: '',
                attr_systemCaseInstanceId: ''
              }
            }
          }),
          label: 'New Case Task',
          data: bpmnElement.serviceTask.newNodeData(id, 'New Case Task', {
            attr_id: id,
            attr_name: 'New Case Task',
            ['attr_flowable:delegateExpression']: '${startCaseInstanceDelegate}',
            extensionElements: {
              'flowable:newCase': {
                attr_caseTypeId: '',
                attr_name: '',
                attr_systemCaseInstanceId: ''
              }
            }
          })
        })
      },
      {
        icon: 'bpmn:case',
        label: 'Update Case Data Task',
        group: 'case',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            ['attr_flowable:delegateExpression']: '${updateCaseInstanceInfoDelegate}',
            extensionElements: {
              'flowable:newCase': {
                attr_caseTypeId: '',
                attr_name: ''
              }
            }
          }),
          label: 'New Update Case Data Task',
          data: bpmnElement.serviceTask.newNodeData(id, 'New Update Case Data Task', {
            attr_id: id,
            attr_name: 'Update Case Data Task',
            ['attr_flowable:delegateExpression']: '${updateCaseInstanceInfoDelegate}',
            extensionElements: {
              'flowable:newCase': {
                attr_caseTypeId: '',
                attr_name: ''
              }
            }
          })
        })
      },
      {
        icon: 'bpmn:log',
        label: 'Audit Log',
        group: 'case',
        order: 0,
        dropData: (id: string) => ({
          id,
          ...bpmnElement.serviceTask.nodeStyle({
            ['attr_flowable:delegateExpression']: '${createAuditLogDelegate}',
            extensionElements: {
              ['flowable:field']: [
                { attr_name: 'category', 'flowable:expression': { __cdata: 'case' } },
                { attr_name: 'uniqueIdentifier', 'flowable:expression': { __cdata: '' } },
                { attr_name: 'id', 'flowable:expression': { __cdata: '' } },
                { attr_name: 'userId', 'flowable:expression': { __cdata: '' } },
                { attr_name: 'activities', attr_status: 'field', 'flowable:expression': { __cdata: '' } },
                { attr_name: 'status', attr_status: 'field', 'flowable:expression': { __cdata: '' } }
              ]
            }
          }),
          label: 'New Audit Log Task',
          data: bpmnElement.serviceTask.newNodeData(id, 'New Audit Log Task', {
            attr_id: id,
            attr_name: 'Audit Log Task',
            ['attr_flowable:delegateExpression']: '${createAuditLogDelegate}',
            extensionElements: {
              ['flowable:field']: [
                { attr_name: 'category', 'flowable:expression': { __cdata: 'case' } },
                { attr_name: 'uniqueIdentifier', 'flowable:expression': { __cdata: '' } },
                { attr_name: 'id', 'flowable:expression': { __cdata: '' } },
                { attr_name: 'userId', 'flowable:expression': { __cdata: '' } },
                { attr_name: 'activities', attr_status: 'field', 'flowable:expression': { __cdata: '' } },
                { attr_name: 'status', attr_status: 'field', 'flowable:expression': { __cdata: '' } }
              ]
            }
          })
        })
      }
    ],
    newNodeData: (id, label, data) => ({
      id,
      name: label,
      type: BpmnElementType['serviceTask'],
      data
    }),
    clickHandler: () => {
    },
    contextMenuComponent: (item: any) => {
      if (item['attr_flowable:type'] === 'http') {
        return 'LazyBpmnContextHttpRequest'
      }

      const type = item['attr_flowable:delegateExpression']
      if (!type) {
        return 'LazyBpmnContextCustomeService'
      }
      switch (type) {
        case '${sendNotificationDelegate}':
          return 'LazyBpmnContextEmail'
        case '${generateDocumentDelegate}':
          return 'LazyBpmnContextDocument'
        case '${conditionValidateDelegate}':
          return 'LazyBpmnContextCondition'
        case '${sendWhatsAppMsgDelegate}':
          return 'LazyBpmnContextWhatsApp'
        case '${updateDataDelegate}':
          return 'LazyBpmnContextUpdateData'
        case '${idGeneratorDelegate}':
          return 'LazyBpmnContextGenerateId'
        case '${masterTableRecordDelegate}':
          return 'LazyBpmnContextUpdateMasterTable'
        case '${calendarEventDelegate}':
          return 'LazyBpmnContextCalendar'
        case '${pdfFormReader}':
          return 'LazyBpmnContextPDFReader'
        case '${pdfFormWriter}':
          return 'LazyBpmnContextPDFWriter'
        case '${documentFolderCabinetDelegate}':
          return 'LazyBpmnContextFolderCabinet'
        case '${docpalNotificationDelegate}':
          return 'LazyBpmnContextMessage'
        case '${startCaseInstanceDelegate}':
          return 'LazyBpmnContextCase'
        case '${updateCaseInstanceInfoDelegate}':
          return 'LazyBpmnContextCaseUpdate'
        case '${createAuditLogDelegate}':
          return 'LazyBpmnContextAuditLog'
        default:
          return 'LazyBpmnContextCustomeService'
      }
    }
  },
  scriptTask: {
    nodeStyle: (item: any) => {
      return {
        ...squareNodeStyle('#0099ff', 'Script Task', '/bpmn/icons/form.svg', 200, 64, '#fff', '#000'),
        shape: 'bpmn-node',
        ports: {
          items: [
            {
              id: 'from',
              group: 'from'
            },
            {
              id: 'to',
              group: 'to'
            },
            {
              id: 'left',
              group: 'left'
            },
            {
              id: 'right',
              group: 'right'
            }
          ]
        }
      }
    },
    embed: false,
    toolbar: [{
      icon: 'bpmn:script',
      label: 'Script Task',
      group: '',
      order: 0,
      dropData: (id: string) => ({
        id,
        ...bpmnElement.scriptTask.nodeStyle({
          script: {
            ['__cdata']: ''
          }
        }),
        label: 'New Script Task',
        data: bpmnElement.scriptTask.newNodeData(id, 'New Script Task', {
          ['attr_flowable:async']: true,
          attr_id: id,
          attr_name: 'Script Task',
          attr_scriptFormat: 'javascript',
          script: {
            ['__cdata']: ''
          }
        })
      })
    }],
    newNodeData: (id, label, data) => ({
      id,
      name: label,
      type: BpmnElementType['scriptTask'],
      data
    }),
    clickHandler: () => {
    },
    contextMenuComponent: 'LazyBpmnContextScript'
  },
  sequenceFlow: {
    nodeStyle: () => ({}),
    embed: false,
    toolbar: [],
    newNodeData: (id, label, data) => ({
      id,
      name: label,
      type: BpmnElementType['sequenceFlow'],

      data
    }),
    clickHandler: () => {
    }
  }
}
