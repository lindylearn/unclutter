// import winkNLP from "wink-nlp";
// import model from "wink-eng-lite-web-model";
// import sbd from "sbd";

// const nlp = winkNLP(model);

export function getParagraphSentences(paragraphs: Array<string>): [Array<string>, Array<number>] {
    const t0 = performance.now();

    let sentences: Array<string> = [];
    let sentence_paragraph: Array<number> = [];
    for (let i = 0; i < paragraphs.length; i++) {
        let paragraph = paragraphs[i];
        let paragraph_sentences = splitSentences(paragraph);

        paragraph_sentences = combineShortSentences(paragraph_sentences);

        sentences = sentences.concat(paragraph_sentences);
        sentence_paragraph = sentence_paragraph.concat(Array(paragraph_sentences.length).fill(i));
    }

    console.log(
        `Splitted ${sentences.length} sentences across ${
            paragraphs.length
        } paragraphs in ${Math.round(performance.now() - t0)}ms`
    );

    return [sentences, sentence_paragraph];
}

export function splitSentences(paragraph: string): string[] {
    // good test case: http://www.paulgraham.com/users.html

    // TODO use more resilient sentence splitter

    const sentences = paragraph.split(/(?<=[.?!])\s+(?=[a-z])/gi);

    // sbd seems to have bugs with whitespace
    // const sentences: string[] = sbd.sentences(paragraph, {
    //     newline_boundaries: false,
    //     preserve_whitespace: true,
    // });

    // winkNLP doesn't keep whitespace
    // const sentences = nlp.readDoc(paragraph).sentences().out();

    // console.log(sentences);

    return sentences;
}

export function combineShortSentences(sentences: string[], threshold = 70) {
    let combined_sentences: string[] = [];
    for (let i = 0; i < sentences.length; i++) {
        if (i == 0) {
            combined_sentences.push(sentences[i]);
        } else {
            if (
                combined_sentences[combined_sentences.length - 1].length < threshold ||
                sentences[i].length < threshold
            ) {
                combined_sentences[combined_sentences.length - 1] += " " + sentences[i];
            } else {
                combined_sentences.push(sentences[i]);
            }
        }
    }

    return combined_sentences;
}
