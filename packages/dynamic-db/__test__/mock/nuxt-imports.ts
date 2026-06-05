export function useState<T>(_key: string, _init: () => T) {
  return ref(_init())
}

import { ref } from 'vue'
export { ref }
