import { mount } from 'enzyme';

import LaunchErrorPanel from '../LaunchErrorPanel';

describe('LaunchErrorPanel', () => {
  // nb. Child components are not mocked here. We need to ensure that the whole
  // component tree does not rely on services, the store etc.

  it('displays error message', () => {
    const error = new Error('Unable to fetch configuration');
    const wrapper = mount(<LaunchErrorPanel error={error} />);
    assert.include(wrapper.text(), 'Unable to fetch configuration');
  });
});
