import { computed, InjectionToken, Signal, signal, WritableSignal } from '@angular/core';
import { TranslationWidth } from '@angular/common';
import { Observable, Subject } from 'rxjs';

import { NgbDatepickerCalendar, NgbPeriod } from './datepicker.calendar';
import { NgbDate } from './ngb-date';
import {
	_zoomIn,
	_zoomOut,
	adjustDateWithinRange,
	adjustZoom,
	buildGrids,
	findFirstFocusableDate,
	findFocusableDate,
	findLastFocusableDate,
	isDateDisabled,
	isDateNavigable,
	isDateSelectable,
	isDateWithinRange,
	normalizeDate,
} from './datepicker.tools';
import { NgbDateStruct } from './ngb-date-struct';
import { NgbDatepickerI18n } from './datepicker.i18n';

export const NGB_DATEPICKER = new InjectionToken<NgbDatepickerModel>('datepicker');

export interface NgbDatepickerModel {
	inputs: {
		// visual
		firstDayOfWeek$: WritableSignal<number>;
		showWeekdays$: WritableSignal<TranslationWidth | false>;
		showWeekNumbers$: WritableSignal<boolean>;
		displayGrids$: WritableSignal<number>;

		// navigation
		minDate$: WritableSignal<NgbDateStruct | null>;
		maxDate$: WritableSignal<NgbDateStruct | null>;
		zoom$: WritableSignal<NgbPeriod>;
		minZoom$: WritableSignal<NgbPeriod>;

		// disabling
		disabled$: WritableSignal<boolean>;
		markDisabled$: WritableSignal<(date: NgbDate, zoom: NgbPeriod) => boolean>;
	};

	state: {
		// visual
		firstDayOfWeek$: Signal<number>;
		showWeekdays$: Signal<TranslationWidth | false>;
		showWeekNumbers$: Signal<boolean>;
		displayGrids$: Signal<number>;

		// navigation
		minDate$: Signal<NgbDateStruct | null>;
		maxDate$: Signal<NgbDateStruct | null>;
		zoom$: Signal<NgbPeriod>;
		minZoom$: Signal<NgbPeriod>;

		// focus
		focusableDate$: Signal<NgbDate | null>;

		// disabling
		disabled$: Signal<boolean>;

		firstDate$: Signal<NgbDate>;
		lastDate$: Signal<NgbDate>;
		grids$: Signal<NgbDatepickerGrid[]>;
	};

	actions: {
		next(period?: NgbPeriod): void;
		prev(period?: NgbPeriod): void;
		open(date?: NgbDateStruct): void;

		focus(date?: NgbDateStruct): void;

		zoomIn(date: NgbDateStruct): void;
		zoomOut(): void;

		select(date: NgbDateStruct): void;

		handleKeydown(event: KeyboardEvent): void;
	};

	events: {
		selections$: Observable<NgbDate>;
		focusChange$: Observable<void>;
	};
}

export type NgbDatepickerGridContext = NgbDatepickerDayGridContext | NgbDatepickerMonthGridContext;

export interface NgbDatepickerDayGridContext {
	zoom: 'd';
	weekdays: string[];
	weekNumbers: number[];
}

export interface NgbDatepickerMonthGridContext {
	zoom: 'm';
}

export interface NgbDatepickerGrid {
	id: string;
	firstDate: NgbDate;
	lastDate: NgbDate;
	rows: NgbDatepickerRow[];
	label: string;
	context?: NgbDatepickerGridContext;
}

export interface NgbDatepickerRow {
	id: string;
	cells: NgbDatepickerCell[];
}

export interface NgbDatepickerCell {
	id: string;
	date: NgbDate;
	disabled: boolean;
	ariaLabel: string;
	numerals: string;
	outside: boolean;
	tabindex: number;
}

export function createDatepicker(_calendar: NgbDatepickerCalendar, _i18n: NgbDatepickerI18n): NgbDatepickerModel {
	// DI
	let calendar$ = signal(_calendar);
	let i18n$ = signal(_i18n);

	// INPUTS
	let firstDayOfWeek$ = signal(1);
	let showWeekNumbers$ = signal(false);
	let showWeekdays$ = signal<TranslationWidth | false>(TranslationWidth.Short);
	let displayGrids$ = signal(1);

	let _dirtyZoom$ = signal<NgbPeriod>('d');
	let minZoom$ = signal<NgbPeriod>('d');
	let maxZoom$ = signal<NgbPeriod>('y');

	let _dirtyMinDate$ = signal<NgbDateStruct | null>(null);
	let _dirtyMaxDate$ = signal<NgbDateStruct | null>(null);

	let disabled$ = signal(false);
	let markDisabled$ = signal<(date: NgbDate, zoom: NgbPeriod) => boolean>(() => false);

	// CLEANED INPUTS
	let zoom$ = computed(() => adjustZoom(_dirtyZoom$(), minZoom$(), maxZoom$()));
	let minDate$ = computed(() => NgbDate.from(_dirtyMinDate$()));
	let maxDate$ = computed(() => NgbDate.from(_dirtyMaxDate$()));

	// INTERNAL STATE
	let _dirtyDisplayDate$ = signal(calendar$().getToday());
	let _dirtyFocusableDate$ = signal<NgbDate>(calendar$().getToday());

	// EVENTS
	let selections$ = new Subject<NgbDate>();
	let focusChange$ = new Subject<void>();

	// COMPUTATIONS
	let displayedDate$ = computed(() => adjustDateWithinRange(_dirtyDisplayDate$(), zoom$(), minDate$(), maxDate$()));

	let checkDisabledFn$ = computed(
		() => (date: NgbDate) => isDateDisabled(date, minDate$(), maxDate$(), zoom$(), disabled$(), markDisabled$()),
	);

	let firstDate$ = computed(() => findFirstFocusableDate(displayedDate$(), zoom$(), calendar$()));
	let lastDate$ = computed(() => findLastFocusableDate(firstDate$(), zoom$(), calendar$(), displayGrids$()));

	let focusableDate$ = computed(() =>
		findFocusableDate(_dirtyFocusableDate$(), zoom$(), disabled$(), firstDate$(), lastDate$(), minDate$(), maxDate$()),
	);

	let grids$ = computed<NgbDatepickerGrid[]>(() =>
		buildGrids(
			firstDate$(),
			calendar$(),
			displayGrids$(),
			zoom$(),
			firstDayOfWeek$(),
			i18n$(),
			checkDisabledFn$(),
			showWeekdays$(),
			showWeekNumbers$(),
			focusableDate$(),
		),
	);

	// ACTIONS
	let next = (period?: NgbPeriod) => {
		if (!disabled$()) {
			_dirtyDisplayDate$.set(calendar$().getNext(firstDate$(), period || _zoomOut(zoom$())));
		}
	};

	let prev = (period?: NgbPeriod) => {
		if (!disabled$()) {
			_dirtyDisplayDate$.set(calendar$().getPrev(firstDate$(), period || _zoomOut(zoom$())));
		}
	};

	let open = (date?: NgbDateStruct) => {
		let validDate = NgbDate.from(date);
		if (validDate) {
			_dirtyDisplayDate$.set(validDate);
		}
	};

	let select = (date: NgbDateStruct) => {
		if (!disabled$()) {
			let validDate = NgbDate.from(date);

			if (validDate) {
				// zooming in
				if (minZoom$() !== zoom$()) {
					zoomIn(validDate);
				}

				// selection / navigation
				else {
					const normalizedDate = normalizeDate(validDate, zoom$());

					if (isDateSelectable(normalizedDate, grids$(), checkDisabledFn$())) {
						selections$.next(normalizedDate);
						_dirtyFocusableDate$.set(normalizedDate);
					}

					if (isDateNavigable(normalizedDate, grids$(), minDate$(), maxDate$())) {
						_dirtyDisplayDate$.set(normalizedDate);
					}
				}
			}
		}
	};

	let focus = (date: NgbDateStruct) => {
		if (!disabled$()) {
			let validDate = NgbDate.from(date);

			if (validDate) {
				_dirtyFocusableDate$.set(validDate);
				if (!isDateWithinRange(validDate, firstDate$(), lastDate$())) {
					_dirtyDisplayDate$.set(validDate);
				}

				focusChange$.next();
			}
		}
	};

	let zoomIn = (date: NgbDateStruct) => {
		if (!disabled$()) {
			let validDate = NgbDate.from(date);

			if (validDate) {
				let normalizedDate = normalizeDate(validDate, _zoomIn(zoom$()));
				_dirtyZoom$.set(_zoomIn(zoom$()));
				_dirtyDisplayDate$.set(normalizedDate);
			}
		}
	};

	let zoomOut = () => {
		if (!disabled$()) {
			_dirtyZoom$.set(_zoomOut(zoom$()));
		}
	};

	let handleKeydown = (event: KeyboardEvent) => {
		let { key, shiftKey } = event;
		let focusableDate = focusableDate$();
		let zoom = zoom$();
		let calendar = calendar$();
		let firstDate = firstDate$();
		let lastDate = lastDate$();
		let minDate = minDate$();
		let maxDate = maxDate$();
		if (focusableDate) {
			let [_, COLUMNS] = calendar.getGridForZoom(focusableDate, zoom);
			let nextDate = focusableDate;
			switch (key) {
				case 'ArrowLeft':
					nextDate = calendar.getPrev(focusableDate, zoom, 1);
					break;
				case 'ArrowUp':
					nextDate = calendar.getPrev(focusableDate, zoom, COLUMNS);
					break;
				case 'ArrowRight':
					nextDate = calendar.getNext(focusableDate, zoom, 1);
					break;
				case 'ArrowDown':
					nextDate = calendar.getNext(focusableDate, zoom, COLUMNS);
					break;
				case 'PageUp':
					nextDate = calendar.getNext(focusableDate, shiftKey ? _zoomOut(_zoomOut(zoom)) : _zoomOut(zoom), 1);
					break;
				case 'PageDown':
					nextDate = calendar.getPrev(focusableDate, shiftKey ? _zoomOut(_zoomOut(zoom)) : _zoomOut(zoom), 1);
					break;
				case 'Home':
					nextDate = shiftKey && minDate ? minDate : firstDate;
					break;
				case 'End':
					nextDate = shiftKey && maxDate ? maxDate : lastDate;
					break;
				case ' ':
				case 'Enter':
					select(focusableDate);
					break;
				case 'Escape':
					zoomOut();
					break;
				default:
					return;
			}

			focus(nextDate);

			event.preventDefault();
			event.stopPropagation();
		}
	};

	// FINAL STATE
	return {
		inputs: {
			displayGrids$,
			firstDayOfWeek$,
			showWeekdays$,
			showWeekNumbers$,

			zoom$: _dirtyZoom$,
			minZoom$,
			minDate$: _dirtyMinDate$,
			maxDate$: _dirtyMaxDate$,

			disabled$,
			markDisabled$,
		},

		state: {
			displayGrids$: displayGrids$.asReadonly(),
			firstDayOfWeek$: firstDayOfWeek$.asReadonly(),
			showWeekdays$: showWeekdays$.asReadonly(),
			showWeekNumbers$: showWeekNumbers$.asReadonly(),

			focusableDate$,

			zoom$,
			minZoom$: minZoom$.asReadonly(),
			minDate$,
			maxDate$,

			disabled$: disabled$.asReadonly(),

			firstDate$,
			lastDate$,
			grids$,
		},

		actions: {
			next,
			prev,
			open,
			focus,
			zoomIn,
			zoomOut,
			select,
			handleKeydown,
		},

		events: {
			selections$,
			focusChange$,
		},
	};
}
