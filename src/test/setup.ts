import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

Object.defineProperty(window, 'scrollTo', { value: () => undefined, writable: true })
