// Expose the sinon assertions.
sinon.assert.expose(assert, { prefix: null });

// Patch extra assert helper methods
import { patch } from '../../test-util/assert-methods';
patch(assert);

// Configure Enzyme for UI tests.
import 'preact/debug';

import { configure } from 'enzyme';
import { Adapter } from 'enzyme-adapter-preact-pure';

configure({ adapter: new Adapter() });

// Make all the icons that are available for use with `SvgIcon` in the actual
// app available in the tests. This enables validation of icon names passed to
// `SvgIcon`.
import sidebarIcons from '../icons';
import annotatorIcons from '../../annotator/icons';
import { registerIcons } from '@hypothesis/frontend-shared';
registerIcons({
  ...sidebarIcons,
  ...annotatorIcons,
});

// Ensure that uncaught exceptions between tests result in the tests failing.
// This works around an issue with mocha / karma-mocha, see
// https://github.com/hypothesis/client/issues/2249.
let pendingError = null;
let pendingErrorNotice = null;

window.addEventListener('error', event => {
  pendingError = event.error;
  pendingErrorNotice = 'An uncaught exception was thrown between tests';
});
window.addEventListener('unhandledrejection', event => {
  pendingError = event.reason;
  pendingErrorNotice = 'An uncaught promise rejection occurred between tests';
});

afterEach(() => {
  if (pendingError) {
    console.error(pendingErrorNotice);
    throw pendingError;
  }
});
