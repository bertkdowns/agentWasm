import asc from "assemblyscript/asc";

console.log('AssemblyScript compiler loaded:', asc.version);

self.onmessage = async ({ data: { source } }) => {
  console.log('Worker received source code:', source);
  try {
    const outputs = new Map<string, string | Uint8Array>();
    const { error, stderr } = await asc.main([
      "module.ts",
      "--outFile", "module.wasm",
      "--textFile", "module.wat",
      "--bindings", "raw",
      "--optimizeLevel", "3",
      "--runtime", "stub",
      "--no-unsafe"
    ], {
      readFile: (filename) => filename === "module.ts" ? source : null,
      writeFile: (filename, contents) => {
        outputs.set(filename, contents);
      },
      listFiles: () => [],
    });

    const binary = outputs.get("module.wasm");
    const text = outputs.get("module.wat");
    const bindings = outputs.get("module.js");
    const bindingsTypes = outputs.get("module.d.ts");

    if (
      error ||
      !(binary instanceof Uint8Array) ||
      typeof text !== "string" ||
      typeof bindings !== "string" ||
      typeof bindingsTypes !== "string"
    ) {
      throw new Error(stderr.toString() || error?.message || "Compilation failed");
    }

    const transferableBinary = new Uint8Array(binary);
    self.postMessage(
      {
        binary: transferableBinary,
        text,
        bindings,
        bindingsTypes,
        version: asc.version,
      },
      { transfer: [transferableBinary.buffer] },
    );
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.stack : String(error),
    });
  }
};
