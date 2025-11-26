import { ref, watch } from 'vue'

export function useDebounce(sourceRef, delay = 300) {
  const debounced = ref(sourceRef.value)
  let timeout = null

  watch(
    sourceRef,
    (val) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        debounced.value = val
      }, delay)
    },
    { immediate: true }
  )

  return debounced
}

