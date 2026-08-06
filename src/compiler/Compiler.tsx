import { useState } from 'react'
import { compileInWorker, exampleSource } from './compiler'
import { Button } from '@base-ui/react/button'

function errorText(error: unknown) {
  return error instanceof Error ? (error.stack ?? error.message) : String(error)
}

export default function Compiler() {
  const [status, setStatus] = useState('Loading compiler...')
  const [compilationOutput, setCompilationOutput] = useState('')
  const [executionOutput, setExecutionOutput] = useState('')

  const runWasm = () => {
    const controller = new AbortController()

    async function compileAndRun() {
      let binary: Uint8Array<ArrayBuffer>

      try {
        const result = await compileInWorker(exampleSource, controller.signal)
        binary = result.binary
        setCompilationOutput(
          [
            `Wasm size: ${result.binary.byteLength} bytes`,
            '',
            result.text || 'No WebAssembly text output was emitted.',
            '',
            'JavaScript bindings:',
            result.bindings,
          ].join('\n'),
        )
        setStatus(
          `Compiled in a disposable worker with AssemblyScript ${result.version}`,
        )
      } catch (error) {
        if (controller.signal.aborted) return
        setStatus('Compilation failed')
        setCompilationOutput(errorText(error))
        console.error(error)
        return
      }

      try {
        const { instance } = await WebAssembly.instantiate(binary, {
          env: {
            logString: (value: string) => console.log(value),
            abort: () => {
              throw new Error('Aborted')
            }
          },
        })
        const add = instance.exports.add as (a: string) => number
        setExecutionOutput(`Result = ${add("Hello, World!")}`)
      } catch (error) {
        if (controller.signal.aborted) return
        setStatus('Execution failed')
        setExecutionOutput(errorText(error))
        console.error(error)
      }
    }

    void compileAndRun()
    return () => controller.abort()
  }

  return (
    <main className="compiler">
      <header>
        <p className="compiler-eyebrow">In-browser toolchain</p>
        <h1>AssemblyScript Browser Compiler</h1>
        <p className="compiler-status" role="status">
          {status}
        </p>
      </header>

      <section>
        <h2>AssemblyScript source</h2>
        <pre>{exampleSource}</pre>
      </section>

      <section>
        <h2>Compilation output</h2>
        <pre>{compilationOutput}</pre>
      </section>

      <section>
        <h2>Execution output</h2>
        <pre>{executionOutput}</pre>
      </section>

      <Button onClick={runWasm} className="run-button">
        Compile and run
      </Button>
    </main>
  )
}
