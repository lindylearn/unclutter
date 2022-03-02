import { useRef, useEffect, useState } from "react";

import {
  highlightRange,
  removeAllHighlights,
} from "../../common/hypothesis/annotator/highlighter";
import {
  anchor as anchorHTML,
  describe as describeAnnotation,
} from "../../common/hypothesis/annotator/anchoring/html";

import { getAnnotationColor } from "../../common/styling";

function EmbeddedPage({
  src,
  annotations,
  setAnnotationOffsets,
  onPageUnrenderable,
  createHighlight,
}) {
  const iframeRef = useRef();

  const [loaded, setLoaded] = useState(false);
  const [documentScale, setDocumentScale] = useState(1.0);
  const [height, setHeight] = useState("2000px");
  const onLoad = () => {
    const document = iframeRef.current.contentWindow.document;

    try {
      const documentScale = scaleDocument(iframeRef, document);
      setDocumentScale(documentScale);

      observeHeightChange(document, setHeight);

      beautifyDocument(document);
      injectStyle(document);
    } catch (err) {
      console.error(`Error patching iframe contents: ${err}`);
    }

    setLoaded(true);
  };

  useEffect(() => {
    if (loaded && annotations) {
      (async () => {
        const annotationOffsets = await highlightAnnotations(
          iframeRef,
          annotations,
          documentScale
        );
        setAnnotationOffsets(annotationOffsets);

        if (
          (annotations.length != 0 && annotationOffsets.length == 0) ||
          height == "0px"
        ) {
          onPageUnrenderable();
        }
      })();
    }

    return () => {
      const document = iframeRef.current.contentWindow.document;
      removeAllHighlights(document);
    };
  }, [annotations, loaded]);

  useEffect(() => {
    const document = iframeRef.current.contentWindow.document;

    const mouseupHandler = () => {
      annotationListener(iframeRef, document, createHighlight, documentScale);
    };
    document.addEventListener("mouseup", mouseupHandler);

    return () => {
      document.removeEventListener("mouseup", mouseupHandler);
    };
  }, [createHighlight, loaded]);

  return (
    <div>
      <iframe
        ref={iframeRef}
        src={src}
        onLoad={onLoad}
        width="100%"
        height={height}
        scrolling="no"
        frameBorder="0"
        style={{
          overflow: "auto",
        }}
      />
    </div>
  );
}
export default EmbeddedPage;

function observeHeightChange(document, setHeight) {
  // expand iframe to fit document without scrolling
  setHeight(document.body.scrollHeight + "px");

  const observer = new MutationObserver(function (mutations) {
    console.log("Iframe height changed, adjusting size");
    setHeight(document.body.scrollHeight + "px");
  });

  observer.observe(document.body, {
    attributes: true,
    attributeOldValue: false,
    characterData: true,
    characterDataOldValue: false,
    childList: true,
    subtree: true,
  });
}

function injectStyle(document) {
  // get iframe CSS rules that reference viewport height (which we change by expanding to content height)
  const cssRules = [...document.styleSheets].flatMap((ruleList) => [
    ...ruleList.cssRules,
  ]);
  const viewportRules = cssRules.filter((rule) => rule.cssText.includes("vh"));

  // get individual css rules ([mediaCondition, selector, key, value])
  const viewportProperties = viewportRules
    .flatMap((rule) => {
      if (rule.type == CSSRule.MEDIA_RULE) {
        return [...rule.cssRules].map((innerRule) => [
          rule.conditionText,
          innerRule,
        ]);
      }
      return [[null, rule]];
    })
    .flatMap(([mediaCondition, rule]) => {
      if (rule.type == CSSRule.STYLE_RULE) {
        const keys = [...rule.style];
        const viewportProperties = keys
          .map((key) => [
            mediaCondition,
            rule.selectorText,
            key,
            rule.style.getPropertyValue(key),
          ])
          .filter(([mediaCondition, selector, key, value]) =>
            value.includes("vh")
          );
        return viewportProperties;
      }
      return [];
    });
  console.log("Overriding the following iframe viewport CSS rules:");
  console.log(viewportProperties);

  // override with actual user viewport height
  const overrideProperties = viewportProperties.map(
    ([mediaCondition, selector, key, value]) => {
      const vhCount = /([0-9]+)vh/g.exec(value)[1];
      const pxCount = Math.round(window.innerHeight * (vhCount / 100));
      const newValue = value.replace(`${vhCount}vh`, `${pxCount}px`);

      return [mediaCondition, selector, key, newValue];
    }
  );
  // console.log(overrideProperties);

  // insert new style
  var style = document.createElement("style");
  style.type = "text/css";
  document.head.appendChild(style);

  style.sheet.insertRule(".lindy-highlight { }");

  overrideProperties.forEach(([mediaCondition, selector, key, value]) => {
    const selectorRule = `${selector} { ${key}: ${value}; }`;
    if (mediaCondition) {
      style.sheet.insertRule(`@media ${mediaCondition} { ${selectorRule} }`);
    } else {
      style.sheet.insertRule(selectorRule);
    }
  });

  // console.log(style.sheet.cssRules);
}

function scaleDocument(iframeRef, document) {
  // scale iFrame manually if viewport is set statically
  const customViewportWidth = document
    .querySelector('meta[name="viewport"]')
    ?.getAttribute("content")
    ?.match(/width=([0-9]+)/)?.[1];
  if (customViewportWidth) {
    const scale = iframeRef.current.offsetWidth / parseInt(customViewportWidth);
    if (scale >= 1.0) {
      // only scale down (on small screens)
      return 1.0;
    }

    console.log(
      `Scaling iframe ${scale}x to fit custom viewport width ${customViewportWidth}px`
    );
    iframeRef.current.style.width = `${customViewportWidth}px`;
    iframeRef.current.style.transform = `scale(${scale})`;
    iframeRef.current.style.transformOrigin = `0 0`;

    return scale;
  }

  return 1;
}

function beautifyDocument(document) {
  // document.getElementsByTagName("header")[0]?.remove(); // e.g. joelonsoftware.com
  document.getElementsByTagName("nav")[0]?.remove(); // e.g. joelonsoftware.com
  document.getElementsByTagName("footer")[0]?.remove(); // e.g. joelonsoftware.com
  document.getElementsByTagName("aside")[0]?.remove(); // e.g. https://funcall.blogspot.com/2009/03/not-lisp-again.html
  document.getElementById("masthead")?.remove(); // e.g. sive.rs
  document.getElementById("sidebar")?.remove(); // e.g. https://mikecanex.wordpress.com/2012/12/26/1922-why-i-quit-being-so-accommodating/
  document.getElementById("side-bar")?.remove(); // e.g. http://hintjens.com/blog:114
  document.getElementById("comments")?.remove(); // e.g. sive.rs
  document.getElementById("categoriescol")?.remove(); // e.g. https://kk.org/thetechnium/1000-true-fans/
  document.getElementById("nav")?.remove(); // e.g. https://kk.org/thetechnium/1000-true-fans/

  // TODO fix content margin after removing sidebar?
}

async function highlightAnnotations(
  iframeRef,
  annotations,
  documentScale = 1.0
) {
  const body = iframeRef.current.contentWindow.document.body;
  const pageOffset = iframeRef.current.offsetTop;

  const annotationOffsets = [];
  await Promise.all(
    annotations.map(async (annotation) => {
      try {
        const range = await anchorHTML(body, annotation.quote_html_selector);
        if (!range) {
          return;
        }
        const highlightedNodes = highlightRange(
          range,
          getAnnotationColor(annotation)
        );

        const displayOffset =
          pageOffset +
          highlightedNodes[0].getBoundingClientRect().top * documentScale;
        annotationOffsets.push({ displayOffset, ...annotation });
      } catch (err) {
        console.error(`Could not anchor annotation:`, annotation);
      }
    })
  );

  return annotationOffsets;
}

function annotationListener(
  iframeRef,
  document,
  createHighlight,
  documentScale
) {
  const selection = document.getSelection();
  if (!selection || !selection.toString().trim()) {
    return;
  }
  // Typically there's only one range (https://developer.mozilla.org/en-US/docs/Web/API/Selection#multiple_ranges_in_a_selection)
  const range = selection.getRangeAt(0);

  // anchor
  const annotationSelector = describeAnnotation(document.body, range);
  if (!annotationSelector) {
    return;
  }

  // create annotation state
  // offset will be set normally once EmbeddedPage renders
  createHighlight(annotationSelector);

  // remove user selection
  selection.empty();
}
