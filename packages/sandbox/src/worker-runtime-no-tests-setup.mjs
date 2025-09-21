/* eslint-disable */
await (async function () {
  globalThis.___RUN_TESTS___ = undefined
  globalThis.___TESTS___ = undefined
  globalThis.test = async (description, fn) => {
    // no-op
  }
  globalThis.test.only = globalThis.test
  globalThis.test.skip = globalThis.test
  const _noop = () => _noop
  const _noopProxy = new Proxy(_noop, {
    get: (_target, _prop) => _noopProxy,
    apply: (_target, _thisArg, _args) => _noopProxy
  })
  globalThis.expect = _noopProxy
})()
