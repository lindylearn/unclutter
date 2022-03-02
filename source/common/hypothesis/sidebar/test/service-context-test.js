import { mount } from 'enzyme';
import { render } from 'preact';

import { ServiceContext, withServices, useService } from '../service-context';

describe('sidebar/service-context', () => {
  describe('withServices', () => {
    let container;
    let lastProps;

    function TestComponent(props) {
      lastProps = props;
    }
    const WrappedComponent = withServices(TestComponent, ['aService']);

    beforeEach(() => {
      lastProps = null;
      container = document.createElement('div');
    });

    it('looks up services that a Component depends on and injects them as props', () => {
      const testService = {};
      const injector = {
        get: sinon.stub().returns(testService),
      };
      render(
        <ServiceContext.Provider value={injector}>
          <WrappedComponent />
        </ServiceContext.Provider>,
        container
      );
      assert.deepEqual(lastProps, { aService: testService });
      assert.calledWith(injector.get, 'aService');
    });

    it('does not look up services if they are passed as props', () => {
      const testService = {};
      const injector = {
        get: sinon.stub(),
      };
      render(
        <ServiceContext.Provider value={injector}>
          <WrappedComponent aService={testService} />
        </ServiceContext.Provider>,
        container
      );
      assert.notCalled(injector.get);
    });

    it('throws if injector is not available', () => {
      assert.throws(() => {
        render(<WrappedComponent />, container);
      }, /Missing ServiceContext/);
    });
  });

  describe('useService', () => {
    it('returns the named service', () => {
      const injector = {
        get: sinon.stub().withArgs('aService').returns('aValue'),
      };
      function TestComponent() {
        const value = useService('aService');
        return <div>{value}</div>;
      }
      const wrapper = mount(
        <ServiceContext.Provider value={injector}>
          <TestComponent />
        </ServiceContext.Provider>
      );
      assert.equal(wrapper.text(), 'aValue');
    });
  });
});
