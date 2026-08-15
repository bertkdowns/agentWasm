export const exampleSource = `

// this function is declared by the host environment and is not implemented in AssemblyScript
@external("env", "logString")
export declare function logString(s: string): void

// This function is implemented in AssemblyScript and can be called by the host environment
export function add(a: string): i32 {
  logString(a)
  return a.length
}
`.trim()

type CompilationResult = {
  binary: Uint8Array<ArrayBuffer>
  text: string
  bindingsSchema: string
  version: string
}

type WorkerResponse = CompilationResult | { error: string } | { ready: true }

export async function compileInWorker(
  source: string,
  signal?: AbortSignal,
): Promise<CompilationResult> {
  const worker = new Worker(
    new URL('./compiler-worker.ts', import.meta.url),
    { type: 'module' },
  )

  console.log('Worker created:', worker)
  try {
    return await new Promise((resolve, reject) => {
      const abort = () => reject(signal?.reason)

      signal?.addEventListener('abort', abort, { once: true })
      worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
        console.log('Worker message received:', data)

        if ('ready' in data) {
          worker.postMessage({ source })
          return
        }

        signal?.removeEventListener('abort', abort)

        if ('error' in data) {
          reject(new Error(data.error))
        } else {
          resolve(data)
        }
      }
      worker.onerror = ({ message }) => {
        signal?.removeEventListener('abort', abort)
        reject(new Error(message))
      }
    })
  } finally {
    worker.terminate()
  }
}
