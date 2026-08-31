import { useEffect, useState } from 'react'
import { instantiate } from 'assemblyscript/bindings'
import { compileInWorker, exampleSource, prepareCompiler } from './compiler'
import { Button } from '@base-ui/react/button'

function errorText(error: unknown) {
  return error instanceof Error ? (error.stack ?? error.message) : String(error)
}

export default function Compiler() {
  const [status, setStatus] = useState('Loading compiler...')
  const [compilationOutput, setCompilationOutput] = useState('')
  const [executionOutput, setExecutionOutput] = useState('')
  const [isCompiling, setIsCompiling] = useState(false)

  useEffect(() => {
    let active = true

    void prepareCompiler().then(
      () => {
        if (active) setStatus('Compiler ready')
      },
      (error: unknown) => {
        if (!active) return
        setStatus('Compiler failed to load')
        setCompilationOutput(errorText(error))
      },
    )

    return () => {
      active = false
    }
  }, [])

  const runWasm = () => {
    const controller = new AbortController()
    setIsCompiling(true)
    setStatus('Compiling...')
    setCompilationOutput('')
    setExecutionOutput('')

    async function compileAndRun() {
      let binary: Uint8Array<ArrayBuffer>
      let bindingsSchema: string

      try {
        const result = await compileInWorker(exampleSource, controller.signal)
        binary = result.binary
        bindingsSchema = result.bindingsSchema
        setCompilationOutput(
          [
            `Wasm size: ${result.binary.byteLength} bytes`,
            '',
            result.text || 'No WebAssembly text output was emitted.',
            '',
            'JSON bindings:',
            result.bindingsSchema,
          ].join('\n'),
        )
        setStatus(
          `Compiled with AssemblyScript ${result.version}`,
        )
      } catch (error) {
        if (controller.signal.aborted) return
        setStatus('Compilation failed')
        setCompilationOutput(errorText(error))
        setIsCompiling(false)
        console.error(error)
        return
      }

      try {
        const { exports } = await instantiate(binary, bindingsSchema, {
          env: {
            logString: (value: string) => console.log(value),
            abort: () => {
              throw new Error('Aborted')
            }
          },
        })
        const add = exports.add as (a: string) => number
        setExecutionOutput(`Result = ${add("Hello, World!")}`)
      } catch (error) {
        if (controller.signal.aborted) return
        setStatus('Execution failed')
        setExecutionOutput(errorText(error))
        console.error(error)
      } finally {
        setIsCompiling(false)
      }
    }

    void compileAndRun()
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

      <Button onClick={runWasm} disabled={isCompiling} className="run-button">
        {isCompiling ? 'Compiling...' : 'Compile and run'}
      </Button>
    </main>
  )
}
