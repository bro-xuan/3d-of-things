// The tape measure's experiments in "How it works": pull the blade out and let it go, lock it, run it out past its
// standout, and hook or push the hook. Each drives the viewer's tape (src/viewer/tapemeasure.ts) and reads it back,
// so every number in the readout is the model's.
import { esc, icons } from '../dom';
import type { TapeState } from '../viewer/tapemeasure';
// Only types: the viewer arrives with three.js, after the page is up.
import type { Viewer } from '../viewer/Viewer';

const metres = (mm: number) => `${(mm / 1000).toFixed(2)} m`;
const newtons = (n: number) => `${n.toFixed(1)} N`;

function slider(text: string, max: number, set: (mm: number) => void, say: (mm: number) => string): { label: HTMLLabelElement; input: HTMLInputElement } {
  const label = document.createElement('label');
  label.className = 'tour__slider';
  label.innerHTML = `<span>${esc(text)}</span><input type="range" min="0" max="${Math.round(max)}" step="10" value="0">`;
  const input = label.querySelector('input')!;
  input.addEventListener('input', () => {
    set(Number(input.value));
    input.setAttribute('aria-valuetext', say(Number(input.value)));
  });
  input.setAttribute('aria-valuetext', say(0));
  return { label, input };
}

function button(icon: string, text: string, click: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'button button--try';
  b.innerHTML = `${icon}<span>${esc(text)}</span>`;
  b.addEventListener('click', click);
  return b;
}

/**
 * Builds a tape measure's experiment (`tape-pull`, `tape-lock`, `tape-standout`, `tape-hook`) into `host`, with its
 * readout. Returns what undoes it: the blade home, the lock off, the hook pushed.
 */
export function tapeTry(kind: string, host: HTMLElement, readout: (text: () => string) => void, viewer: () => Viewer | null): () => void {
  const state = (): TapeState | null => viewer()?.tapeState ?? null;
  const max = state()?.max ?? 3000;
  const undo = () => {
    const v = viewer();
    v?.setTapeLock(false);
    v?.setTapeHook(false);
    v?.setTapeOut(0);
  };
  undo();

  if (kind === 'tape-pull') {
    // Pull it out as far as you like, then let go: the spring winds it in.
    const { label, input } = slider('Pull the blade out · 0 to 3 m', max, (mm) => viewer()?.setTapeOut(mm), (mm) => `${metres(mm)} out`);
    host.append(label, button(icons.release, 'Let go', () => viewer()?.letGoTape()));
    readout(() => {
      const s = state();
      if (!s) return '';
      if (s.returning) input.value = String(Math.round(s.out));
      return `${metres(s.out)} out · drum ${s.drum.toFixed(1)} turns · spring ${Math.round(s.torque)} N·mm · pulling the hook in with ${newtons(s.pull)}${s.returning ? ' · winding in' : ''}`;
    });
  } else if (kind === 'tape-lock') {
    // Pull some out, press the lock, and let go: the shoe holds it against the spring.
    let locked = false;
    const lock = button(icons.hold, 'Press the lock', () => {
      locked = !locked;
      lock.setAttribute('aria-pressed', String(locked));
      lock.querySelector('span')!.textContent = locked ? 'Release the lock' : 'Press the lock';
      viewer()?.setTapeLock(locked);
    });
    lock.setAttribute('aria-pressed', 'false');
    host.append(
      button(icons.lift, 'Pull out 30 cm', () => viewer()?.setTapeOut(300)),
      lock,
      button(icons.release, 'Let go', () => viewer()?.letGoTape()),
    );
    readout(() => {
      const s = state();
      if (!s) return '';
      if (s.locked && s.out > 0) return `Locked at ${metres(s.out)}: the shoe pinches the blade, holding ${newtons(s.pull)} of spring`;
      if (s.locked) return 'Locked with the blade home: pull some out first';
      if (s.returning) return `Free: the spring winds it in · ${metres(s.out)} out`;
      return s.out > 0 ? `Free at ${metres(s.out)}: let go and the spring winds it in` : 'Home: the hook rests against the mouth';
    });
  } else if (kind === 'tape-standout') {
    // Run it out into the air until the curve gives.
    const { label } = slider('Run the blade out into the air · 0 to 2 m', 2000, (mm) => viewer()?.setTapeOut(mm), (mm) => `${metres(mm)} out`);
    host.append(label);
    readout(() => {
      const s = state();
      if (!s) return '';
      return s.folded
        ? `${metres(s.unsupported)} out in the air: past ${metres(s.standout)} the curve flattens near the case and the blade folds`
        : `${metres(s.unsupported)} out in the air: the curve across the blade holds it up (it stands to ${metres(s.standout)})`;
    });
  } else if (kind === 'tape-hook') {
    // Hooked over an edge, or pushed against a wall: the hook moves by its own thickness.
    const group = document.createElement('div');
    group.className = 'tour__choices';
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', 'The hook');
    const choices = ['Push it against a wall', 'Hook it over an edge'];
    const choose = (i: number) => {
      group.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-checked', String(k === i)));
      viewer()?.setTapeHook(i === 1);
    };
    choices.forEach((text, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tour__choice';
      b.setAttribute('role', 'radio');
      b.textContent = text;
      b.addEventListener('click', () => choose(i));
      group.append(b);
    });
    host.append(group);
    choose(0);
    readout(() => {
      const s = state();
      if (!s) return '';
      const play = `${s.play.toFixed(1)} mm`;
      return s.hook > 0.5
        ? `Hooked: the pull slides the hook out ${play}, so the zero is its inside face, on the edge`
        : `Pushed: the hook slides in ${play}, so the zero is its outside face, on the wall`;
    });
  }
  return undo;
}
