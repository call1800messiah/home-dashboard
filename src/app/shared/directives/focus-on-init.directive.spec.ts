import { ElementRef } from '@angular/core';

import { FocusOnInitDirective } from './focus-on-init.directive';

describe('FocusOnInitDirective', () => {
  let input: HTMLInputElement;

  const createInput = (type: string, value: string) => {
    input = document.createElement('input');
    input.type = type;
    input.value = value;
    document.body.appendChild(input);
  };

  const init = () => new FocusOnInitDirective(new ElementRef(input)).ngOnInit();

  afterEach(() => {
    input.remove();
  });

  it('focuses the element', () => {
    createInput('text', 'some text');

    init();

    expect(document.activeElement).toBe(input);
  });

  it('selects the existing text', () => {
    createInput('text', 'some text');

    init();

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('some text'.length);
  });

  it('falls back to select() on inputs without a selection range', () => {
    // Browsers throw on setSelectionRange() for types such as email.
    createInput('email', 'someone@example.com');
    const select = spyOn(input, 'select');

    init();

    expect(select).toHaveBeenCalled();
  });
});
