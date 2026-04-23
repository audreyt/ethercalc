import { beforeEach, afterAll, beforeAll, afterEach, inject, } from 'vitest';
// This file is copied to the sandbox dir, don't import anything local!
// See https://github.com/stryker-mutator/stryker-js/issues/5305
const globalNamespace = inject('globalNamespace');
const mutantActivation = inject('mutantActivation');
const mode = inject('mode');
const ns = globalThis[globalNamespace] || (globalThis[globalNamespace] = {});
ns.hitLimit = inject('hitLimit');
const isGreaterThanVitest4Point1 = inject('isGreaterThanVitest4Point1');
if (mode === 'mutant') {
    beforeAll(() => {
        ns.hitCount = 0;
    });
    if (mutantActivation === 'static') {
        ns.activeMutant = inject('activeMutant');
    }
    else {
        beforeAll(() => {
            ns.activeMutant = inject('activeMutant');
        });
    }
    if (isGreaterThanVitest4Point1) {
        // Vitest's hooks API requires this empty destructure to allow access to suite.meta
        // eslint-disable-next-line no-empty-pattern
        afterAll(({}, suite) => {
            suite.meta.hitCount = ns.hitCount;
        });
    }
    else {
        // @ts-expect-error This was changed in Vitest v4.1
        afterAll(({ meta }) => {
            meta.hitCount = ns.hitCount;
        });
    }
}
else {
    ns.activeMutant = undefined;
    beforeEach(({ task }) => {
        ns.currentTestId = toRawTestId(task);
    });
    afterEach(() => {
        ns.currentTestId = undefined;
    });
    if (isGreaterThanVitest4Point1) {
        // Vitest's hooks API requires this empty destructure to allow access to suite.meta
        // eslint-disable-next-line no-empty-pattern
        afterAll(({}, suite) => {
            suite.meta.mutantCoverage = ns.mutantCoverage;
        });
    }
    else {
        // @ts-expect-error This was changed in Vitest v4.1
        afterAll(({ meta }) => {
            meta.mutantCoverage = ns.mutantCoverage;
        });
    }
}
// Stryker disable all: this file is copied to the sandbox dir
function collectTestName({ name, suite, }) {
    const nameParts = [name];
    let currentSuite = suite;
    while (currentSuite) {
        nameParts.unshift(currentSuite.name);
        currentSuite = currentSuite.suite;
    }
    return nameParts.join(' ').trim();
}
function toRawTestId(test) {
    return `${test.file?.filepath ?? 'unknown.js'}#${collectTestName(test)}`;
}
//# sourceMappingURL=stryker-setup.js.map