import { inject, Injectable, NgZone, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { fromEvent, merge } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { delay } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class NgbFocusService {
	private _document = inject(DOCUMENT);
	private _activeElement$ = signal(this._document.activeElement);

	get activeElement$() {
		return this._activeElement$.asReadonly();
	}

	constructor() {
		inject(NgZone).runOutsideAngular(() => {
			merge(
				fromEvent(this._document.documentElement, 'focusin'),
				fromEvent(this._document.documentElement, 'focusout').pipe(delay(0)),
			)
				.pipe(takeUntilDestroyed())
				.subscribe(() => this._activeElement$.set(this._document.activeElement));
		});
	}
}
