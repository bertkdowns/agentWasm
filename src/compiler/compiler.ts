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
  bindings: string
  bindingsTypes: string
  version: string
}

type WorkerResponse = CompilationResult | { error: string }

const worker = new Worker(
    new URL('./compiler-worker.ts', import.meta.url),
    { type: 'module' },
  )

export async function compileInWorker(
  source: string,
  signal?: AbortSignal,
): Promise<CompilationResult> {
  
  console.log('Worker created:', worker)
  try {
    return await new Promise((resolve, reject) => {
      const abort = () => reject(signal?.reason)

      signal?.addEventListener('abort', abort, { once: true })
      worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
        console.log('Worker message received:', data)
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
      worker.postMessage({ source })
    })
  } finally {
    worker.terminate()
  }
}
