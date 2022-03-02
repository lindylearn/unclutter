import sidebarTrigger from '../sidebar-trigger';

describe('sidebarTrigger', () => {
  let triggerEl1;
  let triggerEl2;

  beforeEach(() => {
    triggerEl1 = document.createElement('button');
    triggerEl1.setAttribute('data-hypothesis-trigger', '');
    document.body.appendChild(triggerEl1);

    triggerEl2 = document.createElement('button');
    triggerEl2.setAttribute('data-hypothesis-trigger', '');
    document.body.appendChild(triggerEl2);
  });

  it('calls the show callback which a trigger button is clicked', () => {
    const fakeShowFn = sinon.stub();
    sidebarTrigger(document, fakeShowFn);

    triggerEl1.dispatchEvent(new Event('click'));
    triggerEl2.dispatchEvent(new Event('click'));

    assert.calledTwice(fakeShowFn);
  });
});
