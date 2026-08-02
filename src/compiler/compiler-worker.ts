import asc from "assemblyscript/asc";

console.log('AssemblyScript compiler loaded:', asc.version);

self.onmessage = async ({ data: { source } }) => {
  console.log('Worker received source code:', source);
  try {
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
