// The experiments for a pin tumbler lock in "How it works" (src/pages/tour.ts hands them over): slide the
// key in and out and watch the stacks ride its cuts, hold the key turned, and change to a wrong key. The
// readouts read the lock's module (src/viewer/pinlock.ts) through the viewer.
import { KEYS, LOCK, type KeyName, type LockState } from '../viewer/pinlock';
import type { Viewer } from '../viewer/Viewer';

type HoldButton = (text: string, hint: string, set: (on: boolean) => void) => HTMLButtonElement;

const code = (key: KeyName) => KEYS[key].join('-');
const onLine = (s: LockState) => s.gaps.filter((g) => Math.abs(g) <= LOCK.tolerance).length;

/** Builds the experiment `kind` into `host` (its controls) and its readout; returns what undoes it. */
export function lockTry(kind: string, host: HTMLElement, readout: (text: () => string) => void, viewer: () => Viewer | null, holdButton: HoldButton): () => void {
  const state = () => viewer()?.lockState ?? null;

  if (kind === 'lock-insert') {
    viewer()?.chooseKey('right');
    const label = document.createElement('label');
    label.className = 'tour__slider';
    label.innerHTML = `<span>Key drawn out · 0 to ${LOCK.out} mm</span><input type="range" min="0" max="${LOCK.out}" step="0.1" value="0">`;
    const input = label.querySelector('input')!;
    const say = () => input.setAttribute('aria-valuetext', `${Number(input.value).toFixed(1)} mm out`);
    input.addEventListener('input', () => {
      viewer()?.setKeyOut(Number(input.value));
      say();
    });
    say();
    host.append(label);
    readout(() => {
      const s = state();
      if (!s) return '';
      if (s.out >= LOCK.tipEnd) return 'Key out: every driver pin has dropped across the shear line';
      if (s.free) return 'All the way in: all five splits on the shear line';
      return `${s.out.toFixed(1)} mm out · ${onLine(s)} of 5 splits on the shear line`;
    });
    return () => viewer()?.setKeyOut(0);
  }

  // Hold to turn, with the right key or (lock-keys) a choice of keys.
  if (kind === 'lock-keys') {
    const keys: KeyName[] = ['right', 'wrong'];
    const group = document.createElement('div');
    group.className = 'tour__choices';
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', 'Key');
    const buttons = keys.map((key) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tour__choice';
      button.setAttribute('role', 'radio');
      button.textContent = key === 'right' ? 'Right key' : 'Wrong key';
      button.title = `Cut ${code(key)}`;
      group.append(button);
      return button;
    });
    const choose = (key: KeyName) => {
      buttons.forEach((b, i) => b.setAttribute('aria-checked', String(keys[i] === key)));
      viewer()?.chooseKey(key);
    };
    buttons.forEach((button, i) => button.addEventListener('click', () => choose(keys[i])));
    choose(state()?.key ?? 'right');
    host.append(group);
  } else viewer()?.chooseKey('right');
  host.append(holdButton('Turn the key', 'Press and hold to turn', (on) => viewer()?.turnKey(on)));
  readout(() => {
    const s = state();
    if (!s) return '';
    if (s.busy) return 'Changing keys';
    const which = kind === 'lock-keys' ? `${s.key === 'right' ? 'Right' : 'Wrong'} key, ${code(s.key)}: ` : '';
    if (!s.free && s.blocking >= 0) {
      const g = s.gaps[s.blocking];
      const stuck = s.turning ? `, so the plug stops at ${s.turn.toFixed(1)}°` : '';
      return `${which}the ${g > 0 ? 'key' : 'driver'} pin in stack ${s.blocking + 1} is ${Math.abs(g).toFixed(2)} mm across the shear line${stuck}`;
    }
    if (s.turn >= LOCK.throw - 0.5) return `${which}turned ${LOCK.throw}°: the tailpiece has thrown the bolt`;
    if (s.turn > 0.5) return `${which}turning, ${Math.round(s.turn)}°`;
    return `${which}all five splits on the shear line, free to turn`;
  });
  return () => {
    viewer()?.turnKey(false);
    if (kind === 'lock-keys') viewer()?.chooseKey('right');
  };
}
