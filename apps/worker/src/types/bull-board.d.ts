declare module '@bull-board/api/bullMQAdapter' {
  // Explicitly re-export the symbol so the compiler can see it
  export { BullMQAdapter } from '@bull-board/api/dist/src/queueAdapters/bullMQ';
  // ...and re-export everything else as well
  export * from '@bull-board/api/dist/src/queueAdapters/bullMQ';
}

declare module '@bull-board/api/bullMQAdapter.js' {
  export { BullMQAdapter } from '@bull-board/api/dist/src/queueAdapters/bullMQ';
  export * from '@bull-board/api/dist/src/queueAdapters/bullMQ';
}

