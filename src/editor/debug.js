import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, gutter, GutterMarker } from '@codemirror/view';

export const executionPosition = StateEffect.define();
const position = StateField.define({
  create: () => Decoration.none,
  update(value, transaction) {
    value = value.map(transaction.changes);
    for (const effect of transaction.effects) if (effect.is(executionPosition)) {
      value = effect.value == null ? Decoration.none : Decoration.set([Decoration.line({ class: 'cm-execution-line' }).range(transaction.state.doc.lineAt(Math.min(effect.value, transaction.state.doc.length)).from)]);
    }
    return value;
  },
  provide: field => EditorView.decorations.from(field),
});
class Breakpoint extends GutterMarker {
  toDOM() { const dot = document.createElement('span'); dot.className = 'breakpoint-dot'; dot.textContent = '●'; dot.title = 'Remover ponto de parada'; return dot; }
}
const marker = new Breakpoint();
const toggle = StateEffect.define();
const points = StateField.define({
  create: () => [],
  update(value, transaction) {
    value = [...new Set(value.map(pos => transaction.state.doc.lineAt(transaction.changes.mapPos(pos)).from))];
    for (const effect of transaction.effects) if (effect.is(toggle)) value = value.includes(effect.value) ? value.filter(pos => pos !== effect.value) : [...value, effect.value];
    return value;
  },
});
export const breakpointLines = state => state.field(points).map(pos => state.doc.lineAt(pos).number);
export const debugExtensions = [position, points, gutter({
  class: 'debug-gutter', renderEmptyElements: true, initialSpacer: () => marker,
  lineMarker: (view, line) => view.state.field(points).includes(line.from) ? marker : null,
  lineMarkerChange: update => update.state.field(points) !== update.startState.field(points),
  domEventHandlers: { mousedown(view, line) { view.dispatch({ effects: toggle.of(line.from) }); return true; } },
})];
