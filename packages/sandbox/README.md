```sh
# run from project dir
DENO_DIR=./tmp/deno/ deno run --allow-read --allow-write --allow-net --unstable-worker-options --no-prompt --allow-run --allow-env --env-file=.env --unstable-bare-node-builtins src/sandbox/sandbox.ts
```

## node deno vm

https://github.com/casual-simulation/node-deno-vm/blob/master/src/DenoWorker.ts

https://github.com/laverdet/isolated-vm

## quickjs/deno compat shim

https://github.com/jkriss/quickdeno

## Deno discussions

https://docs.deno.com/api/deno/~/Deno.MemoryUsage

https://github.com/denoland/deno/discussions/13249

https://github.com/denoland/deno/discussions/12626

## Deno sandbox

https://github.com/healeycodes/deno-script-sandbox

## max out space size

deno run --v8-flags=--max-heap-size=50,--max-old-space-size=50'
