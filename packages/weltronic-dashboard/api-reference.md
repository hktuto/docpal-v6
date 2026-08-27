# Oracle Shipping Copy — API Reference

前端网关访问前缀：`/apis/v1/ms/oracle/shipping-copy`

数据源：

- **Oracle** — header / line（`wsh_new_deliveries` + `oe_order_*` + `hz_*`）
- **PostgreSQL**
  - `oracle_db.cmz_pi_update_planned_date_wcl`（ship date 历史，上游表）
  - `demo.wf_shipping_copy`（下载日志，本模块建表）

建表脚本：[`demo_wf_shipping_copy.sql`](file:///E:/code/wcl_middle_service/docs/workflow/shipping/copy/demo_wf_shipping_copy.sql)

gateway 转发说明：

- 前端访问 `https://www.test.com/apis/v1/ms/oracle/shipping-copy/preview`
- gateway 去掉 `/apis/v1/ms`
- 当前服务实际收到 `/oracle/shipping-copy/preview`

---

## 1. 预览（单票 PDF）

### `POST /oracle/shipping-copy/preview`

请求：

```json
{
  "type": "print-hk",
  "orgId": "2",
  "invoiceNo": "HK2608-0503",
  "ckStatus": "Y",
  "switches": {
    "useLatestPgShipDate": true,
    "debugLayout": false
  }
}
```

成功响应：

- 默认：`Content-Type: application/pdf`，直接为 PDF 二进制
- 调试模式（`?debug=1` 或 `switches.debugLayout=true`）：`application/json`

```json
{
  "payload": {
    "type": "print-hk",
    "templateCode": "shipping-copy-template",
    "orgId": "2",
    "invoiceNo": "HK2608-0503",
    "header": { "...": "..." },
    "totals": { "lineCount": 2, "quantitySum": 4000, "amount": 258.50 },
    "copyNum": 1,
    "copies": [ { "copyNo": 1, "pageTotal": 1, "pages": [ { "pageNo": 1, "lines": [ "..." ] } ] } ]
  },
  "layout": {
    "templateCode": "shipping-copy-template",
    "pageSize": [ 1414, 2000 ],
    "fontName": "Pillow default",
    "linesPerPage": 36,
    "fieldCoordinates": { "header.billTo.name": { "x": 80, "y": 60, "width": 420, "height": 22, "type": "text", "align": "left" } }
  }
}
```

错误：

| HTTP | 含义 |
|------|------|
| 400 | 参数错误 / 模板类型未注册 |
| 404 | 未在 Oracle 中找到该 PI |
| 500 | 渲染失败 |

---

## 2. 批量下载（合并 PDF + 审计）

### `POST /oracle/shipping-copy/download`

请求：

```json
{
  "type": "print-hk",
  "documents": [
    { "orgId": "2", "invoiceNo": "HK2608-0503" },
    { "orgId": "2", "invoiceNo": "HK1703-1978" }
  ],
  "ckStatus": "Y",
  "operatorId": "joshua",                                            
  "operatorName": "Joshua",
  "fileName": "shipping-copy-batch",
  "switches": {
    "useLatestPgShipDate": true,
    "debugLayout": false
  }
}
```

成功响应：

- `Content-Type: application/pdf`，PDF 流
- 自定义响应头：
  - `X-Batch-No: SC-20260820HHMMSS-XXXXXXXX`
  - `X-Log-Ids: 1001,1002`（每个 invoice 一条日志）

行为说明：

- 一次下载请求 = 一个 `batch_no`
- 每个 `(orgId, invoiceNo)` 都会在 `demo.wf_shipping_copy` 插入一条 `action_type='download'` 记录
- 多个 invoice 的页面会被合并到同一份 PDF

---

## 3. 列表页（最新 ship date）

### `GET /oracle/shipping-copy/list-latest?pageNum=1&pageSize=50`

查询参数：

| 参数 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `pageNum` | 否 | `1` | 页码，从 `1` 开始 |
| `pageSize` | 否 | `50` | 每页条数，范围 `1-500` |
| `orderBy` | 否 | `old_plan_date desc` | 兼容旧写法，支持单个排序表达式 |
| `orderByAsc` | 否 | - | 升序排序字段，支持逗号分隔，如 `new_plan_date,updated_date` |
| `orderByDesc` | 否 | - | 降序排序字段，支持逗号分隔，如 `new_plan_date,updated_date` |
| `orgId` | 否 | - | 按 `org_id` 精确过滤 |
| `invoiceNo` | 否 | - | 按 `pi_num` 精确过滤 |
| `customerId` | 否 | - | 按 `customer_id` 精确过滤 |
| `invoiceDateStart` | 否 | - | `invoice_date` 起始日期，格式 `YYYY-MM-DD` |
| `invoiceDateEnd` | 否 | - | `invoice_date` 截止日期，格式 `YYYY-MM-DD` |

```json
{
  "items": [
    {
      "customer_name": "KOA ELECTRONICS (H.K.) LTD.",
      "customer_id": "1001",
      "pi_num": "HK2608-0503",
      "org_id": "2",
      "invoice_date": "2026-08-18",
      "version_no": 3,
      "old_plan_date": "2026-08-20",
      "new_plan_date": "2026-08-25",
      "updated_date": "2026-08-19T17:20:05",
      "download_count": 4
    }
  ],
  "count": 1,
  "pageNum": 1,
  "pageSize": 50,
  "total": 1286,
  "totalPages": 26
}
```

数据源：`oracle_db.cmz_pi_update_planned_date_wcl`（最新版本 SQL，详见设计文档 §六）。

---

## 4. 历史页

### `GET /oracle/shipping-copy/history?orgId=2&invoiceNo=HK2608-0503`

```json
{
  "items": [
    { "org_id": "2", "pi_num": "HK2608-0503", "version_no": 2, "old_plan_date": "...", "new_plan_date": "...", "updated_date": "..." },
    { "org_id": "2", "pi_num": "HK2608-0503", "version_no": 1, "old_plan_date": "...", "new_plan_date": "...", "updated_date": "..." }
  ],
  "count": 2
}
```

数据源：`oracle_db.cmz_pi_update_planned_date_wcl`（历史版本 SQL，排除最新一条）。

---

## 5. 下载日志

### `GET /oracle/shipping-copy/download-log?orgId=2&invoiceNo=HK2608-0503&limit=50`

```json
{
  "items": [
    {
      "id": 1234,
      "batch_no": "SC-20260820HHMMSS-XXXXXXXX",
      "action_type": "download",
      "type": "print-hk",
      "template_code": "shipping-copy-template",
      "org_id": "2",
      "pi_num": "HK2608-0503",
      "version_no": 3,
      "ship_date": "2026-08-25",
      "copy_num": 1,
      "page_count": 1,
      "file_name": "shipping-copy-batch",
      "operator_id": "joshua",
      "operator_name": "Joshua",
      "client_ip": "10.0.0.1",
      "user_agent": "...",
      "created_date": "2026-08-20T10:00:00"
    }
  ],
  "count": 1
}
```

### `GET /oracle/shipping-copy/download-stats?actionType=download`

```json
{
  "items": [
    { "org_id": "2", "pi_num": "HK2608-0503", "download_times": 3, "last_download_at": "2026-08-20T10:00:00" }
  ],
  "count": 1
}
```

---

## 6. 业务规则速查

### 6.1 Ship Date

1. `useLatestPgShipDate=true`（默认）且 PG `new_plan_date` 存在 → 用 PG
2. 否则用 `Oracle.planned_departure_date`（无则回退 `invoice_date`）

### 6.2 打印份数

| ship_to_country | ckStatus | 份数 |
|-----------------|----------|------|
| 非 HK | 任意 | 1 |
| HK | `Y` | `min(default_copy_num, 9)` |
| HK | 非 `Y` | 1 |

### 6.3 JSON 数据消费契约

```json
{
  "type": "print-hk",
  "templateCode": "shipping-copy-template",
  "orgId": "2",
  "invoiceNo": "HK2608-0503",
  "header": {
    "invoiceDate": "2026-08-25",
    "printDate": "2026-08-19 17:20:05",
    "currencyCode": "USD",
    "shipmentTerm": "FOB",
    "paymentTerms": "Net 30 days",
    "salesPerson": "LU Chung Yuan, Lester",
    "contactName": null,
    "remarks": "WCL P/L, DELY BY D/N",
    "madeInCountry": "JAPAN",
    "shipDate": "2026-08-25",
    "billTo":  { "name": "...", "address1": "...", "address2": "...", "address3": "..." },
    "shipTo":  { "name": "...", "address1": "...", "address2": "...", "address3": "..." }
  },
  "totals": { "lineCount": 2, "quantitySum": 4000, "amount": 258.50 },
  "copyNum": 1,
  "copies": [
    {
      "copyNo": 1,
      "pageTotal": 1,
      "pages": [
        {
          "pageNo": 1,
          "lines": [
            {
              "lineNo": 1,
              "itemNumber": "KOA/NV73A2BTTE39",
              "description": "...",
              "drawingNo": "...",
              "customerPartNo": "...",
              "custPoNumber": "...",
              "salesOrderNumber": "...",
              "subinventory": "STORE1",
              "quantity": 2500,
              "unitCode": "PCS",
              "unitPrice": 0.086000,
              "amount": 215.00
            }
          ]
        }
      ]
    }
  ]
}
```
