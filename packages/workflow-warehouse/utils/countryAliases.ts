/**
 * 国家静态别名表：key 为 country_code，value 为 OCR/业务侧常见写法
 * 匹配时会与 country_name_en、country_code 一并用于回填 code
 */
export const COUNTRY_STATIC_ALIASES: Record<string, string[]> = {
  US: [
    'U.S.A.',
    'U.S.A',
    'USA',
    'US',
    'U.S.',
    'U.S',
    'United States',
    'United States of America',
    'United States of America (the)'
  ]
}
