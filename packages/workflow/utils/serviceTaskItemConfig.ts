export const getServiceTaskItemConfig = {
  ConditionTask: {
    relation: 'AND',
    conditions: []
  },
  SubProcess: {
    processDefinitionId: ''
  },
  ValidateTask: {
    rules: [],
    output_mapping: {}
  },
  MessageTask: {
    implementation: 'email',
    method: 'POST',
    url: `${getUrlOrigin()}/api/dms/facade/email/send`,
    headers: generatorHTTPRequestTaskHeaders(),
    to: [],
    cc: [],
    subject: '',
    body: '',
    input_mapping: {}
  },
  UploadFile: {
    implementation: 'upload_document',
    method: 'POST',
    url: `${getUrlOrigin()}/api/dms/facade/document/creation`,
    headers: generatorHTTPRequestTaskHeaders(),
    body: {
      parentPath: '',
      name: '',
      type: '',
      fileContentId: '',
      creator: '',
      properties: {}
    },
    input_mapping: {},
    output_mapping: {}
  },
  DocumentGenerationTask: {
    implementation: 'upload_document',
    method: 'POST',
    url: `${getUrlOrigin()}/api/dms/facade/document/template/generate`,
    headers: generatorHTTPRequestTaskHeaders(),
    body: {
      templateId: '',
      parentPath: '',
      name: '',
      type: 'File',
      creator: '',
      variables: {}
    },
    input_mapping: {},
    output_mapping: {}
  },
  UniqueIdGenerator: {
    method: 'POST',
    url: `${getUrlOrigin()}/api/dms/facade/id-template/generate`,
    headers: generatorHTTPRequestTaskHeaders(),
    body: {
      templateId: '',
      variables: {}
    },
    output_mapping: {}
  },
  FilingDocuments: {
    implementation: 'filing_document',
    method: 'POST',
    url: `${getUrlOrigin()}/api/dms/facade/filing-document`,
    headers: generatorHTTPRequestTaskHeaders(),
    body: {
      folderCabinetId: '',
      folderCabinet: []
    },
    input_mapping: {},
    output_mapping: {}
  },
  InsertDynamicDatabase: {
    method: 'POST',
    url: `${getUrlOrigin()}/apis/v1/dynamic-db/table//record`,
    headers: generatorHTTPRequestTaskHeaders(),
    body: {},
    output_mapping: {

    }
  },
  UpdateDynamicDatabase:{
    method: 'PUT',
    url: `${getUrlOrigin()}/apis/v1/dynamic-db/table//record/`,
    headers: generatorHTTPRequestTaskHeaders(),
    body: {},
    output_mapping: {}
  }
}

export function getUrlOrigin() {
  return 'https://sit-v3.wclsolution.com'
  // return window?.location?.origin || ''
}

// TODO get config setting
export function generatorHTTPRequestTaskHeaders() {
  return {
    ServerName: 'docpal-api',
    ServerKey: '14ecdf56081AGSDghw',
    'Content-Type': 'application/json',
    'x-api-key': 'bf77bd45b0a82691b911054d2f9ca50d3b70dc964782b419456e7fdd9ddc0a5ca19b0638d42662a0e22c4734ce8d787c'
  }
}
