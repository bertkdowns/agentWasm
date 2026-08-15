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
      "--bindings", "json",
      "--optimizeLevel", "3",
      "--runtime", "stub",
      "--no-unsafe"
    ], {
      readFile: (filename: string) => filename === "module.ts" ? source : null,
      writeFile: (filename: string, contents: string | Uint8Array) => {
        outputs.set(filename, contents);
      },
      listFiles: () => [],
    });

    const binary = outputs.get("module.wasm");
    const text = outputs.get("module.wat");
    const bindingsSchema = outputs.get("module.bindings.json");

    if (
      error ||
      !(binary instanceof Uint8Array) ||
      typeof text !== "string" ||
      typeof bindingsSchema !== "string"
    ) {
      throw new Error(stderr.toString() || error?.message || "Compilation failed");
    }

    const transferableBinary = new Uint8Array(binary);
    self.postMessage(
      {
        binary: transferableBinary,
        text,
        bindingsSchema,
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

self.postMessage({ ready: true });
