export const getTaskItemConfig = {
  UserTask: {
    human_task: {
      assignee: '',
      candidate_users: [],
      candidate_roles: [],
      candidate_groups: [],
      due_date: '',
      priority: 5,
      // escalation: {
      //   escalation_time: '',
      //   escalation_action: '',
      //   escalation_target: ''
      // },
      form_key: '',
      form_fields: []
    },
    input_mapping: {},
    output_mapping: {}
  },
  ConditionTask: {
    condition: {
      relation: 'AND',
      conditions: []
    },
    input_mapping: {},
    output_mapping: {}
  },
  TransformTask: {
    mappings: {},
    operations: [],
    input_mapping: {},
    output_mapping: {}
  },
  SubProcess: {
    processDefinitionId: ''
  },
  ValidateTask: {
    rules: [],
    input_mapping: {},
    output_mapping: {}
  },
  HTTPTask: {
    http_request: {
      method: 'GET',
      url: '',
      headers: {},
      body: {}
    },
    input_mapping: {},
    output_mapping: {}
  },
  MessageTask: {
    email: {
      method: 'POST',
      url: `${getUrlOrigin()}/api/dms/facade/email/send`,
      headers: generatorHTTPRequestTaskHeaders(),
      to: [],
      cc: [],
      subject: '',
      body: ''
    },
    input_mapping: {},
    output_mapping: {}
  },
  UploadFile: {
    http_request: {
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
      }
    },
    input_mapping: {},
    output_mapping: {}
  },
  DocumentGenerationTask: {
    http_request: {
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
      }
    },
    input_mapping: {},
    output_mapping: {}
  },
  UniqueIdGenerator: {
    http_request: {
      method: 'POST',
      url: `${getUrlOrigin()}/api/dms/facade/id-template/generate`,
      headers: generatorHTTPRequestTaskHeaders(),
      body: {
        templateId: '',
        variables: {}
      }
    },
    input_mapping: {},
    output_mapping: {}
  },
  FilingDocuments: {
    http_request: {
      method: 'POST',
      url: `${getUrlOrigin()}/api/dms/facade/filing-document`,
      headers: generatorHTTPRequestTaskHeaders(),
      query_params: {},
      body: {
        folderCabinetId: '',
        folderCabinet: []
      },
      timeout: 5000
    },
    input_mapping: {},
    output_mapping: {}
  },
  InsertDynamicDatabase: {
    http_request: {
      method: 'POST',

      url: `${getUrlOrigin()}/apis/v1/dynamic-db/table//record`,
      headers: generatorHTTPRequestTaskHeaders(),
      query_params: {},
      body: {},
      timeout: 5000
    },
    input_mapping: {},
    output_mapping: {}
  },
  UpdateDynamicDatabase: {
    http_request: {
      method: 'PUT',
      url: `${getUrlOrigin()}/apis/v1/dynamic-db/table//record/`,
      headers: generatorHTTPRequestTaskHeaders(),
      query_params: {},
      body: {},
      timeout: 5000
    },
    input_mapping: {},
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
