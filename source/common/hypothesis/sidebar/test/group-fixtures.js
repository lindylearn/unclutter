import Chance from 'chance';

const chance = new Chance();

export function group() {
  const id = chance.hash({ length: 15 });
  const name = chance.string();
  const group = {
    id,
    name,
    links: {
      html: `http://localhost:5000/groups/${id}/${name}`,
    },
    type: 'private',
  };
  return group;
}

export function organization(options = {}) {
  const org = {
    id: chance.hash({ length: 15 }),
    name: chance.string(),
    logo: chance.url(),
  };
  return Object.assign(org, options);
}

export function defaultOrganization() {
  return {
    id: '__default__',
    name: 'Hypothesis',
    logo: 'http://example.com/hylogo',
  };
}

export function expandedGroup(options = {}) {
  const expanded = group();
  expanded.organization = organization();

  return Object.assign(expanded, options);
}
