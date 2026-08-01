// For production, bundle asc and its dependencies into this worker instead of
// loading a shim and multiple CDN modules at runtime.
importScripts(
  "https://cdn.jsdelivr.net/npm/es-module-shims@1/dist/es-module-shims.wasm.min.js",
);

importShim.addImportMap({
  imports: {
    assemblyscript:
      "https://cdn.jsdelivr.net/npm/assemblyscript@0.28.20/dist/assemblyscript.js",
    "assemblyscript/asc":
      "https://cdn.jsdelivr.net/npm/assemblyscript@0.28.20/dist/asc.js",
    binaryen:
      "https://cdn.jsdelivr.net/npm/binaryen@131.0.0-nightly.20260721/index.js",
    long: "https://cdn.jsdelivr.net/npm/long@5.3.2/index.js",
  },
});

const compiler = importShim("assemblyscript/asc").then(
  ({ default: asc }) => asc,
);

self.onmessage = async ({ data: { source } }) => {
  try {
    const asc = await compiler;
    const { error, binary, text, stderr } = await asc.compileString(source, {
      optimizeLevel: 3,
      runtime: "stub",
    });

    if (error || !binary) {
      throw new Error(stderr.toString() || error?.message || "Compilation failed");
    }

    self.postMessage(
      { binary, text, version: asc.version },
      [binary.buffer],
    );
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.stack : String(error),
    });
  }
};
