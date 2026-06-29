import * as Y from 'yjs';

export function createWhiteboardDoc() {
  const doc = new Y.Doc();
  const state = doc.getMap('state');
  const elements = doc.getArray('elements');
  const meta = doc.getMap('meta');

  // Ensure defaults
  if (!meta.has('initialized')) meta.set('initialized', true);
  if (elements.length === 0 && state.get('seed') === undefined) {
    // no-op; elements start empty
  }

  return doc;
}

export function applyElementsToYjs(elements, doc) {
  const yElements = doc.getArray('elements');
  doc.transact(() => {
    yElements.delete(0, yElements.length);
    yElements.push(elements);
  });
}

export function observeElements(doc, onElements) {
  const yElements = doc.getArray('elements');
  const handler = () => {
    onElements(yElements.toArray());
  };
  yElements.observeDeep(handler);
  handler();
  return () => yElements.unobserveDeep(handler);
}
