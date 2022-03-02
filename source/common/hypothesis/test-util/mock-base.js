/**
 * Mock the base class of a derived class.
 *
 * In unit tests for a derived class it may be useful to mock the base class
 * so that the tests only depend on the interface of the base class and not
 * its implementation.
 *
 * This cannot be done using `$imports.$mock` because the links between the
 * derived and base class are set once when the derived class is initially
 * evaluated.
 *
 * Although it is possible to mock a base class using this function, using
 * composition over inheritance generally makes mocking easier.
 *
 * @param {object} derivedClass - The derived class constructor to mock
 * @param {object} mockBase - The new mock class
 * @return {() => void} A function that un-mocks the base class
 */
export function mockBaseClass(derivedClass, mockBase) {
  const originalBase = derivedClass.__proto__;

  // Modify the base class reference used by `super` expressions.
  derivedClass.__proto__ = mockBase;

  // Modify the prototype chain used by instances of the derived class to find
  // methods or properties defined on the base class.
  derivedClass.prototype.__proto__ = mockBase.prototype;

  return () => {
    derivedClass.__proto__ = originalBase;
    derivedClass.prototype.__proto__ = originalBase.prototype;
  };
}
