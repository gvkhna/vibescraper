await (async function () {
  const {expect} = await import('jsr:@std/expect')
  globalThis.expect = expect

  const _originalPostMessage = globalThis.postMessage.bind(globalThis)

  globalThis.___TESTS___ = []
  // const tests = [];

  // Keep track of which tests are marked .only(...)
  const onlySet = new Set()
  let onlyMode = false

  function postSkipped(description) {
    const startHR = performance.now()
    const startTS = performance.timeOrigin + startHR
    const ts = Math.floor(startTS)
    _originalPostMessage({
      type: 'test',
      kind: 'test',
      payload: {
        status: 'skipped',
        message: 'Test skipped',
        name: description,
        eventTimestamp: ts,
        duration: -1
      }
    })
  }

  async function runTest(description, fn) {
    const startHR = performance.now()
    // Wall‑clock timestamp in ms since epoch
    const startTS = performance.timeOrigin + startHR

    // 1) "Test started" message
    _originalPostMessage({
      type: 'test',
      kind: 'test',
      payload: {
        status: 'running',
        message: 'Test started',
        name: description,
        eventTimestamp: Math.floor(startTS),
        duration: -1
      }
    })

    try {
      // 2) run user's test (sync or async)
      await fn()

      // 3) On success, measure again
      const endHR = performance.now()
      const endTS = performance.timeOrigin + endHR
      _originalPostMessage({
        type: 'test',
        kind: 'test',
        payload: {
          status: 'passed',
          message: 'Test passed',
          name: description,
          eventTimestamp: Math.floor(endTS),
          duration: Math.round(endHR - startHR)
        }
      })
    } catch (err) {
      const failHR = performance.now()
      const failTS = performance.timeOrigin + failHR
      const isAssertion = err instanceof AssertionError || err.name === 'AssertionError'

      // 4b) Then send the "failed" test log
      _originalPostMessage({
        type: 'test',
        kind: 'test',
        payload: {
          status: 'failed',
          message: isAssertion ? 'Test assertion failed' : 'Test errored',
          name: description,
          eventTimestamp: Math.floor(failTS),
          duration: Math.round(failHR - startHR)
        }
      })

      if (!isAssertion) {
        globalThis.process.emit('uncaughtException', err)
      }
    }
  }

  globalThis.test = (description, fn) => {
    // console.log('calling test');
    globalThis.___TESTS___.push({description, fn, only: false, skip: false})
    // queueMicrotask(() => {
    //   console.log('called test microtask');
    // });
  }

  // 2) test.only()
  globalThis.test.only = (description, fn) => {
    onlyMode = true
    globalThis.___TESTS___.push({description, fn, only: true, skip: false})
  }

  // 3) test.skip()
  globalThis.test.skip = (description, _fn) => {
    globalThis.___TESTS___.push({description, fn: _fn, only: false, skip: true})
  }

  // The global `test` function
  // globalThis.test = async (description, fn) => {
  //   if (onlyMode && !onlySet.has(description)) {
  //     // Skip non-only tests
  //     const startHR = performance.now();
  //     const startTS = performance.timeOrigin + startHR;
  //     const ts = Math.floor(startTS);
  //     _originalPostMessage({
  //       type: 'test',
  //       kind: 'test',
  //       payload: {
  //         status: 'skipped',
  //         message: 'Test skipped',
  //         name: description,
  //         eventTimestamp: ts,
  //         duration: -1
  //       }
  //     });
  //     return;
  //   }
  //   await runTest(description, fn);
  // };

  // // .only marks this test as the only one to run
  // globalThis.test.only = (description, fn) => {
  //   onlyMode = true;
  //   onlySet.add(description);
  //   // immediately schedule it
  //   return globalThis.test(description, fn);
  // };

  // // .skip always emits a skipped message
  // globalThis.test.skip = (description, _fn) => {
  //   const startHR = performance.now();
  //   const startTS = performance.timeOrigin + startHR;
  //   const ts = Math.floor(startTS);
  //   _originalPostMessage({
  //     type: 'test',
  //     kind: 'test',
  //     payload: {
  //       status: 'skipped',
  //       message: 'Test skipped',
  //       name: description,
  //       eventTimestamp: ts,
  //       duration: -1
  //     }
  //   });
  // };

  Object.freeze(globalThis.test)
  Object.freeze(globalThis.test.only)
  Object.freeze(globalThis.test.skip)
  Object.freeze(globalThis.expect)

  // console.log('setup tests', tests.length);

  globalThis.___RUN_TESTS___ = async () => {
    for (const {description, fn, only, skip} of globalThis.___TESTS___) {
      if (skip || (onlyMode && !only)) {
        // postTest('skipped', description, performance.now(), 0, 'Test skipped');
        postSkipped(description)
        continue
      }
      await runTest(description, fn)
    }
  }
  // globalThis.___TESTS___ = {
  //   runAll: new Promise(async (resolveAll) => {
  //     // queueMicrotask(async () => {
  //     console.log('tests length', tests.length);
  //     for (const {description, fn, only, skip} of tests) {
  //       if (skip || (onlyMode && !only)) {
  //         // postTest('skipped', description, performance.now(), 0, 'Test skipped');
  //         postSkipped(description);
  //         continue;
  //       }
  //       await runTest(description, fn);
  //     }
  //     resolveAll();
  //     // });
  //   })
  // };
  // Object.freeze(globalThis.___TESTS___);
  // Object.freeze(globalThis.___TESTS___.runAll);
  // await new Promise((resolve) => {
  //   console.log('running tests promise');
  //   setTimeout(() => {
  //     console.log('next looped', tests.length);
  //     queueMicrotask(async () => {
  //       console.log('queued for end of this loop?', tests.length);
  //       for (const {description, fn, only, skip} of tests) {
  //         // Skip logic
  //         if (skip || (onlyMode && !only)) {
  //           // emit skipped…
  //           postSkipped(description);
  //           // _post({ /* job-test skipped payload */ });
  //           continue;
  //         }
  //         // Otherwise run the test
  //         await runTest(description, fn);
  //       }
  //       console.log('logging resolve', tests.length);
  //       resolve();
  //       // Finally, close the worker or send summary
  //       // globalThis.self.close();
  //     });
  //   }, 0);
  // });
})()
