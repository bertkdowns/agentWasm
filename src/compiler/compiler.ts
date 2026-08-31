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

let compilerWorker: Worker | undefined
let compilerReady: Promise<Worker> | undefined

function resetCompilerWorker(worker: Worker) {
  worker.terminate()
  if (compilerWorker === worker) {
    compilerWorker = undefined
    compilerReady = undefined
  }
}

function getCompilerWorker(): Promise<Worker> {
  if (compilerReady) return compilerReady

  const worker = new Worker(
    new URL('./compiler-worker.ts', import.meta.url),
    { type: 'module' },
  )
  compilerWorker = worker
  compilerReady = new Promise((resolve, reject) => {
    const handleMessage = ({ data }: MessageEvent<WorkerResponse>) => {
      if (!('ready' in data)) return
      cleanup()
      resolve(worker)
    }
    const handleError = ({ message }: ErrorEvent) => {
      cleanup()
      resetCompilerWorker(worker)
      reject(new Error(message))
    }
    const cleanup = () => {
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError)
    }

    worker.addEventListener('message', handleMessage)
    worker.addEventListener('error', handleError)
  })

  return compilerReady
}

export function prepareCompiler(): Promise<void> {
  return getCompilerWorker().then(() => undefined)
}

export async function compileInWorker(
  source: string,
  signal?: AbortSignal,
): Promise<CompilationResult> {
  const worker = await getCompilerWorker()

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      signal?.removeEventListener('abort', handleAbort)
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError)
    }
    const handleAbort = () => {
      cleanup()
      resetCompilerWorker(worker)
      reject(signal?.reason)
    }
    const handleMessage = ({ data }: MessageEvent<WorkerResponse>) => {
      if ('ready' in data) return
      cleanup()
      if ('error' in data) {
        reject(new Error(data.error))
      } else {
        resolve(data)
      }
    }
    const handleError = ({ message }: ErrorEvent) => {
      cleanup()
      resetCompilerWorker(worker)
      reject(new Error(message))
    }

    signal?.addEventListener('abort', handleAbort, { once: true })
    worker.addEventListener('message', handleMessage)
    worker.addEventListener('error', handleError)
    worker.postMessage({ source })
  })
}
