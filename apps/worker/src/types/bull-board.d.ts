declare module '@bull-board/api/bullMQAdapter' { // declaration for ts module
  // Explicitly re-export the symbol so the compiler can see it
  export { BullMQAdapter } from '@bull-board/api/dist/src/queueAdapters/bullMQ'; // main adapter
  // ...and re-export everything else as well
  export * from '@bull-board/api/dist/src/queueAdapters/bullMQ'; // other exports
}

declare module '@bull-board/api/bullMQAdapter.js' { // allow js import path
  export { BullMQAdapter } from '@bull-board/api/dist/src/queueAdapters/bullMQ'; // main adapter
  export * from '@bull-board/api/dist/src/queueAdapters/bullMQ'; // other exports
}

