import * as fixtures from '../../test/annotation-fixtures';
import * as annotationMetadata from '../annotation-metadata';

const documentMetadata = annotationMetadata.documentMetadata;
const domainAndTitle = annotationMetadata.domainAndTitle;

describe('sidebar/helpers/annotation-metadata', () => {
  const fakeAnnotation = (props = {}) => {
    return {
      document: {},
      uri: 'http://example.com/a/page',
      ...props,
    };
  };

  describe('documentMetadata', () => {
    context('when the annotation has a document property', () => {
      it('returns the hostname from annotation.uri as the domain', () => {
        const annotation = fakeAnnotation();
        assert.equal(documentMetadata(annotation).domain, 'example.com');
      });

      context('when annotation.uri does not start with "urn"', () => {
        it('uses annotation.uri as the uri', () => {
          const annotation = fakeAnnotation();
          assert.equal(
            documentMetadata(annotation).uri,
            'http://example.com/a/page'
          );
        });
      });

      context('when document.title is an available', () => {
        it('uses the first document title as the title', () => {
          const annotation = fakeAnnotation({
            document: {
              title: ['My Document', 'My Other Document'],
            },
          });

          assert.equal(
            documentMetadata(annotation).title,
            annotation.document.title[0]
          );
        });
      });

      context('when there is no document.title', () => {
        it('returns the domain as the title', () => {
          const annotation = fakeAnnotation();
          assert.equal(documentMetadata(annotation).title, 'example.com');
        });
      });

      ['http://localhost:5000', '[not a URL]'].forEach(uri => {
        it('returns empty domain if URL is invalid or private', () => {
          const annotation = fakeAnnotation({ uri });
          const { domain } = documentMetadata(annotation);
          assert.equal(domain, '');
        });
      });
    });

    context('when the annotation does not have a document property', () => {
      let annotationNoDocument;

      beforeEach(() => {
        annotationNoDocument = fakeAnnotation();
        delete annotationNoDocument.document;
      });

      it('returns annotation.uri for the uri', () => {
        assert.equal(
          documentMetadata(annotationNoDocument).uri,
          annotationNoDocument.uri
        );
      });

      it('returns the hostname of annotation.uri for the domain', () => {
        assert.equal(
          documentMetadata(annotationNoDocument).domain,
          'example.com'
        );
      });

      it('returns the hostname of annotation.uri for the title', () => {
        assert.equal(
          documentMetadata(annotationNoDocument).title,
          'example.com'
        );
      });
    });
  });

  describe('domainAndTitle', () => {
    context('when an annotation has a non-http(s) uri', () => {
      it('returns no title link', () => {
        const annotation = fakeAnnotation({
          uri: 'file:///example.pdf',
        });

        assert.equal(domainAndTitle(annotation).titleLink, null);
      });
    });

    context('when an annotation has a direct link', () => {
      it('returns the direct link as a title link', () => {
        const annotation = {
          uri: 'https://annotatedsite.com/',
          links: {
            incontext: 'https://example.com',
          },
        };

        assert.equal(
          domainAndTitle(annotation).titleLink,
          'https://example.com'
        );
      });
    });

    context(
      'when an annotation has no direct link but has a http(s) uri',
      () => {
        it('returns the uri as title link', () => {
          const annotation = fakeAnnotation({
            uri: 'https://example.com',
          });

          assert.equal(
            domainAndTitle(annotation).titleLink,
            'https://example.com'
          );
        });
      }
    );

    context('when the annotation title is shorter than 30 characters', () => {
      it('returns the annotation title as title text', () => {
        const annotation = fakeAnnotation({
          uri: 'https://annotatedsite.com/',
          document: {
            title: ['A Short Document Title'],
          },
        });

        assert.equal(
          domainAndTitle(annotation).titleText,
          'A Short Document Title'
        );
      });
    });

    context('when the annotation title is longer than 30 characters', () => {
      it('truncates the title text with ellipsis character "…"', () => {
        const annotation = fakeAnnotation({
          document: {
            title: ['My Really Really Long Document Title'],
          },
        });

        assert.equal(
          domainAndTitle(annotation).titleText,
          'My Really Really Long Document…'
        );
      });
    });

    context('when the document uri refers to a filename', () => {
      it('returns the filename as domain text', () => {
        const annotation = fakeAnnotation({
          uri: 'file:///path/to/example.pdf',
          document: {
            title: ['Document Title'],
          },
        });

        assert.equal(domainAndTitle(annotation).domain, 'example.pdf');
      });
    });

    context('when domain and title are the same', () => {
      it('returns an empty domain text string', () => {
        const annotation = fakeAnnotation({
          uri: 'https://example.com',
          document: {
            title: ['example.com'],
          },
        });

        assert.equal(domainAndTitle(annotation).domain, '');
      });
    });

    context('when the document has no domain', () => {
      it('returns an empty domain text string', () => {
        const annotation = fakeAnnotation({
          uri: 'doi:10.1234/5678',
          document: {
            title: ['example.com'],
          },
        });

        assert.equal(domainAndTitle(annotation).domain, '');
      });
    });

    context('when the document is a local file with a title', () => {
      it('returns the filename', () => {
        const annotation = fakeAnnotation({
          uri: 'file:///home/seanh/MyFile.pdf',
          document: {
            title: ['example.com'],
          },
        });

        assert.equal(domainAndTitle(annotation).domain, 'MyFile.pdf');
      });
    });
  });

  describe('location', () => {
    it('returns the position for annotations with a text position', () => {
      assert.equal(
        annotationMetadata.location({
          target: [
            {
              selector: [
                {
                  type: 'TextPositionSelector',
                  start: 100,
                },
              ],
            },
          ],
        }),
        100
      );
    });

    it('returns +ve infinity for annotations without a text position', () => {
      assert.equal(
        annotationMetadata.location({
          target: [
            {
              selector: undefined,
            },
          ],
        }),
        Number.POSITIVE_INFINITY
      );
    });
  });

  describe('isHidden', () => {
    it('returns `true` if annotation has been hidden', () => {
      const annotation = fixtures.moderatedAnnotation({ hidden: true });
      assert.isTrue(annotationMetadata.isHidden(annotation));
    });

    [
      fixtures.newEmptyAnnotation(),
      fixtures.newReply(),
      fixtures.newHighlight(),
      fixtures.oldAnnotation(),
    ].forEach(nonHiddenAnnotation => {
      it('returns `false` if annotation is not hidden', () => {
        assert.isFalse(annotationMetadata.isHidden(nonHiddenAnnotation));
      });
    });
  });

  describe('.isHighlight', () => {
    [
      {
        annotation: fixtures.newEmptyAnnotation(),
        expect: false,
        desc: 'new, empty annotation',
      },
      {
        annotation: fixtures.newReply(),
        expect: false,
        desc: 'new, reply annotation',
      },
      {
        annotation: fixtures.newAnnotation(),
        expect: false,
        desc: 'new, with some text',
      },
      {
        annotation: fixtures.newHighlight(),
        expect: true,
        desc: 'new, marked as $highlight',
      },
      {
        annotation: fixtures.oldAnnotation(),
        expect: false,
        desc: 'pre-existing annotation',
      },
      {
        annotation: fixtures.oldHighlight(),
        expect: true,
        desc: 'pre-existing higlight',
      },
      {
        annotation: fixtures.oldPageNote(),
        expect: false,
        desc: 'pre-existing page note',
      },
      {
        annotation: fixtures.oldReply(),
        expect: false,
        desc: 'pre-existing reply',
      },
    ].forEach(testcase => {
      it(`returns ${testcase.expect} for isHighlight when annotation is: ${testcase.desc}`, () => {
        assert.equal(
          annotationMetadata.isHighlight(testcase.annotation),
          testcase.expect
        );
      });
    });
  });

  describe('isPageNote', () => {
    it('returns true for an annotation with an empty target', () => {
      assert.isTrue(
        annotationMetadata.isPageNote({
          target: [],
        })
      );
    });

    it('returns true for an annotation without selectors', () => {
      assert.isTrue(
        annotationMetadata.isPageNote({
          target: [{ selector: undefined }],
        })
      );
    });

    it('returns true for an annotation without a target', () => {
      assert.isTrue(
        annotationMetadata.isPageNote({
          target: undefined,
        })
      );
    });

    it('returns false for an annotation which is a reply', () => {
      assert.isFalse(
        annotationMetadata.isPageNote({
          target: [],
          references: ['xyz'],
        })
      );
    });
  });

  describe('isAnnotation', () => {
    it('returns true if an annotation is a top level annotation', () => {
      assert.isTrue(
        annotationMetadata.isAnnotation({
          target: [{ selector: [] }],
        })
      );
    });

    it('returns false if an annotation has no target', () => {
      assert.isFalse(annotationMetadata.isAnnotation({}));
    });
  });

  describe('isPublic', () => {
    it('returns true if an annotation is shared within a group', () => {
      assert.isTrue(annotationMetadata.isPublic(fixtures.publicAnnotation()));
    });

    [
      {
        read: ['acct:someemail@localhost'],
      },
      {
        read: ['something invalid'],
      },
    ].forEach(testCase => {
      it('returns false if an annotation is not publicly readable', () => {
        const annotation = Object.assign(fixtures.defaultAnnotation(), {
          permissions: testCase,
        });
        assert.isFalse(annotationMetadata.isPublic(annotation));
      });
    });

    it('returns false if an annotation is missing permissions', () => {
      const annot = fixtures.defaultAnnotation();
      delete annot.permissions;
      assert.isFalse(annotationMetadata.isPublic(annot));
    });
  });

  describe('isOrphan', () => {
    it('returns true if an annotation failed to anchor', () => {
      const annotation = Object.assign(fixtures.defaultAnnotation(), {
        $orphan: true,
      });
      assert.isTrue(annotationMetadata.isOrphan(annotation));
    });

    it('returns false if an annotation successfully anchored', () => {
      const orphan = Object.assign(fixtures.defaultAnnotation(), {
        $orphan: false,
      });
      assert.isFalse(annotationMetadata.isOrphan(orphan));
    });
  });

  describe('isWaitingToAnchor', () => {
    const isWaitingToAnchor = annotationMetadata.isWaitingToAnchor;

    it('returns true for annotations that are not yet anchored', () => {
      assert.isTrue(isWaitingToAnchor(fixtures.defaultAnnotation()));
    });

    it('returns false for annotations that are anchored', () => {
      const anchored = Object.assign({}, fixtures.defaultAnnotation(), {
        $orphan: false,
      });
      assert.isFalse(isWaitingToAnchor(anchored));
    });

    it('returns false for annotations that failed to anchor', () => {
      const anchored = Object.assign({}, fixtures.defaultAnnotation(), {
        $orphan: true,
      });
      assert.isFalse(isWaitingToAnchor(anchored));
    });

    it('returns false for replies', () => {
      assert.isFalse(isWaitingToAnchor(fixtures.oldReply()));
    });

    it('returns false for page notes', () => {
      assert.isFalse(isWaitingToAnchor(fixtures.oldPageNote()));
    });

    it('returns false if the anchoring timeout flag was set', () => {
      const pending = Object.assign({}, fixtures.defaultAnnotation(), {
        $anchorTimeout: true,
      });
      assert.isFalse(isWaitingToAnchor(pending));
    });
  });

  describe('flagCount', () => {
    const flagCount = annotationMetadata.flagCount;

    it('returns `null` if the user is not a moderator', () => {
      assert.equal(flagCount(fixtures.defaultAnnotation()), null);
    });

    it('returns the flag count if present', () => {
      const ann = fixtures.moderatedAnnotation({ flagCount: 10 });
      assert.equal(flagCount(ann), 10);
    });
  });

  describe('quote', () => {
    it('returns quote if annotation has a quote', () => {
      const ann = {
        target: [
          {
            source: 'https://publisher.org/article.pdf',
            selector: [{ type: 'TextQuoteSelector', exact: 'expected quote' }],
          },
        ],
      };
      assert.equal(annotationMetadata.quote(ann), 'expected quote');
    });

    // FIXME - This currently happens when creating a new Page Note. Annotations
    // from the API should always have a target.
    //
    // See https://github.com/hypothesis/client/issues/1290.
    it('returns `null` if annotation has an empty target array', () => {
      const ann = { target: [] };
      assert.equal(annotationMetadata.quote(ann), null);
    });

    it('returns `null` if annotation has no selectors', () => {
      const ann = {
        target: [
          {
            source: 'https://publisher.org/article.pdf',
          },
        ],
      };
      assert.equal(annotationMetadata.quote(ann), null);
    });

    it('returns `null` if annotation has no text quote selector', () => {
      const ann = {
        target: [
          {
            source: 'https://publisher.org/article.pdf',
            selector: [{ type: 'TextPositionSelector', start: 0, end: 100 }],
          },
        ],
      };
      assert.equal(annotationMetadata.quote(ann), null);
    });
  });

  describe('hasBeenEdited', () => {
    it('should return false if created and updated timestamps are equal', () => {
      const annotation = fakeAnnotation({
        created: '2020-10-28T15:35:26.822151+00:00',
        updated: '2020-10-28T15:35:26.822151+00:00',
      });
      assert.isFalse(annotationMetadata.hasBeenEdited(annotation));
    });

    it('should return false if created and updated timestamps are very close', () => {
      // Sub-second difference
      const annotation1 = fakeAnnotation({
        created: '2020-10-28T15:35:26.822151+00:00',
        updated: '2020-10-28T15:35:26.822450+00:00',
      });
      // Slightly more than one-second difference
      const annotation2 = fakeAnnotation({
        created: '2020-10-28T15:35:26.822151+00:00',
        updated: '2020-10-28T15:35:27.822450+00:00',
      });
      assert.isFalse(annotationMetadata.hasBeenEdited(annotation1));
      assert.isFalse(annotationMetadata.hasBeenEdited(annotation2));
    });

    it('should return true if created and updated timestamps are meaningfully different', () => {
      // Few seconds difference
      const annotation1 = fakeAnnotation({
        created: '2020-10-28T15:35:26.822151+00:00',
        updated: '2020-10-28T15:35:29.555555+00:00',
      });
      // A few days
      const annotation2 = fakeAnnotation({
        created: '2020-10-28T15:35:26.822151+00:00',
        updated: '2020-10-30T15:35:27.822450+00:00',
      });
      assert.isTrue(annotationMetadata.hasBeenEdited(annotation1));
      assert.isTrue(annotationMetadata.hasBeenEdited(annotation2));
    });

    context('invalid created or updated dates', () => {
      it('should return false if created and updated are equal', () => {
        const annotation = fakeAnnotation({
          created: 'nope',
          updated: 'nope',
        });
        assert.isFalse(annotationMetadata.hasBeenEdited(annotation));
      });

      it('should return false if updated is not present', () => {
        const annotation = fakeAnnotation({
          created: '2020-10-28T15:35:26.822151+00:00',
        });
        assert.isFalse(annotationMetadata.hasBeenEdited(annotation));
      });

      it('should return false if created and updated are different but problematic', () => {
        const annotation = fakeAnnotation({
          created: 'nope',
          updated: 'nope!',
        });
        assert.isFalse(annotationMetadata.hasBeenEdited(annotation));
      });
    });
  });
});
