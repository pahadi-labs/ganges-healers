export async function runSideEffect<T>(promise: Promise<T>): Promise<T | void> {
  const sync = process.env.NODE_ENV === 'test' || process.env.RUN_SYNC_SIDE_EFFECTS === '1'
  if (sync) {
    return await promise
  }
  promise.catch(err => {
    try {
      console.error('[side-effect][unhandled]', String(err))
    } catch {}
  })
}
