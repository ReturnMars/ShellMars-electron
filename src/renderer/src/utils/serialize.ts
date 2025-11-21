import { toRaw, unref } from 'vue'
import type { MaybeRef } from 'vue'

/**
 * 将 Vue 响应式对象转换为纯对象（可序列化）
 * 使用 unref 解包 ref，toRaw 去除响应式代理，然后通过 JSON 序列化确保完全可序列化
 * 
 * @param obj 响应式对象、ref 或普通对象
 * @returns 纯对象（可序列化）
 */
export function toPlainObject<T>(obj: MaybeRef<T>): T {
  // 先使用 unref 解包 ref（如果是 ref 则获取 .value，否则直接返回）
  const unwrapped = unref(obj)
  
  // 再使用 toRaw 去除响应式代理
  const raw = toRaw(unwrapped)
  
  // 通过 JSON 序列化/反序列化确保完全可序列化
  // 这会移除所有不可序列化的属性（如函数、undefined 等）
  try {
    return JSON.parse(JSON.stringify(raw)) as T
  } catch {
    // 如果序列化失败，返回 toRaw 的结果
    return raw
  }
}

/**
 * 将 Vue ref 的值转换为纯对象（toPlainObject 的别名，更语义化）
 * 
 * @param refValue ref 的值
 * @returns 纯对象
 */
export function refToPlainObject<T>(refValue: MaybeRef<T>): T {
  return toPlainObject(refValue)
}

