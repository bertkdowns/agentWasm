const source = `

// this function is declared by the host environment and is not implemented in AssemblyScript
@external("env", "logInteger")
export declare function logInteger(i: i32): void

// This function is implemented in AssemblyScript and can be called by the host environment
export function add(a: i32, b: i32): i32 {
  return a + b;
}
`.trim();

const status = document.querySelector("#status");
const sourceOutput = document.querySelector("#source");
const compilationOutput = document.querySelector("#output");
const executionOutput = document.querySelector("#exe-output");

sourceOutput.textContent = source;

let wasm_code = null;
try {
  const { binary, text, version } = await compileInWorker(source);
  wasm_code = binary;
  compilationOutput.textContent = [
    `Wasm size: ${binary.byteLength} bytes`,
    "",
    text || "No WebAssembly text output was emitted.",
  ].join("\n");
  status.textContent = `Compiled in a disposable worker with AssemblyScript ${version}`;


} catch (error) {
  status.textContent = "Compilation failed";
  compilationOutput.textContent = error instanceof Error ? error.stack : String(error);
  console.error(error);
}


try {
  const { instance } = await WebAssembly.instantiate(wasm_code, {
    env: {
      logInteger: (i) => console.log(i),
    },
  });
  const result = instance.exports.add(20, 22);

  executionOutput.textContent = [
    `add(20, 22) = ${result}`,
  ].join("\n");
} catch (error) {
  status.textContent = "Execution failed";
  executionOutput.textContent = error instanceof Error ? error.stack : String(error);
  console.error(error);
}
async function compileInWorker(source) {
  const worker = new Worker(new URL("./compiler-worker.js", import.meta.url));

  try {
    return await new Promise((resolve, reject) => {
      worker.onmessage = ({ data }) => {
        if (data.error) {
          reject(new Error(data.error));
        } else {
          resolve(data);
        }
      };
      worker.onerror = ({ message }) => reject(new Error(message));
      worker.postMessage({ source });
    });
  } finally {
    worker.terminate();
  }
}
