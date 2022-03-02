import { createStore } from '../../create-store';
import links from '../links';

describe('sidebar/store/modules/links', () => {
  let store;

  beforeEach(() => {
    store = createStore([links]);
  });

  function addLinks() {
    // Snapshot of response from https://hypothes.is/api/links.
    const data = {
      'account.settings': 'https://hypothes.is/account/settings',
      'forgot-password': 'https://hypothes.is/forgot-password',
      'groups.new': 'https://hypothes.is/groups/new',
      help: 'https://hypothes.is/docs/help',
      'oauth.authorize': 'https://hypothes.is/oauth/authorize',
      'oauth.revoke': 'https://hypothes.is/oauth/revoke',
      'search.tag': 'https://hypothes.is/search?q=tag%3A%22:tag%22',
      signup: 'https://hypothes.is/signup',
      user: 'https://hypothes.is/u/:user',
    };
    store.updateLinks(data);
  }

  describe('#getLink', () => {
    it('returns an empty string before links are loaded', () => {
      assert.equal(store.getLink('account.settings'), '');
    });

    it('renders URLs once links are loaded', () => {
      addLinks();
      assert.equal(
        store.getLink('account.settings'),
        'https://hypothes.is/account/settings'
      );
    });

    it('renders URLs with parameters', () => {
      addLinks();
      assert.equal(
        store.getLink('user', { user: 'foobar' }),
        'https://hypothes.is/u/foobar'
      );
    });

    it('throws an error if link name is invalid', () => {
      addLinks();
      assert.throws(() => {
        store.getLink('unknown');
      }, 'Unknown link "unknown"');
    });

    it('throws an error if unused link parameters are provided', () => {
      addLinks();
      assert.throws(() => {
        store.getLink('account.settings', { unused: 'foo', unused2: 'bar' });
      }, 'Unused parameters: unused, unused2');
    });
  });
});
