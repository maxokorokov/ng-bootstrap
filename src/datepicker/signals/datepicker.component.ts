import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ContentChild,
	Directive,
	ElementRef,
	EventEmitter,
	forwardRef,
	inject,
	Injector,
	Input,
	NgZone,
	OnChanges,
	OnInit,
	Output,
	SimpleChanges,
	TemplateRef,
	ViewChild,
	ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { JsonPipe, NgTemplateOutlet } from '@angular/common';

import { NgbDatepickerCalendar } from './datepicker.calendar';
import { NgbDate } from './ngb-date';
import { NgbDatepickerConfig } from './datepicker.config';
import { NgbDateAdapter } from './adapters/ngb-date-adapter';
import { NgbDateStruct } from './ngb-date-struct';
import { createDatepicker, NGB_DATEPICKER } from './datepicker.state';
import { NgbDatepickerI18n } from './datepicker.i18n';
import {
	NgbDatepickerCellContext,
	NgbDatepickerGridComponent,
	NgbDatepickerMonthComponent,
} from './datepicker-grid.component';
import { ContentTemplateContext } from '../datepicker-content-template-context';
import { take } from 'rxjs/operators';
import { NgbDatepickerSelectionManager } from './datepicker.selection';
import { NgbDatepickerNavigationSelect } from '../datepicker-navigation-select';

/**
 * A directive that marks the content template that customizes the way datepicker months are displayed
 *
 * @since 5.3.0
 */
@Directive({ selector: 'ng-template[ngbDatepickerContent]', standalone: true })
export class NgbDatepickerContent {
	templateRef = inject(TemplateRef<any>);
}

/**
 * A highly configurable component that helps you with selecting calendar dates.
 *
 * `NgbDatepicker` is meant to be displayed inline on a page or put inside a popup.
 */
@Component({
	exportAs: 'ngbDatepicker',
	selector: 'ngb-datepicker',
	standalone: true,
	imports: [
		NgTemplateOutlet,
		NgbDatepickerMonthComponent,
		NgbDatepickerGridComponent,
		JsonPipe,
		NgbDatepickerNavigationSelect,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	styleUrls: ['./datepicker.scss'],
	host: { '[class.disabled]': 'dp.state.disabled$()' },
	template: `
		<ng-template #defaultCellTemplate let-cell="cell" let-selected="selected">
			<div
				class="ngb-dp-cell-template btn-light"
				[class.outside]="cell.outside || cell.disabled"
				[class.selected]="selected && !cell.outside && dp.state.zoom$() === dp.state.minZoom$()"
				>{{ cell.numerals }}</div
			>
		</ng-template>

		<ng-template #defaultNavigation>
			<div class="d-flex justify-content-end">
				<button
					class="btn btn-sm btn-outline-primary me-2"
					(click)="dp.actions.prev()"
					[disabled]="dp.state.firstDate$().before(dp.state.minDate$())"
					>&larr;</button
				>
				<button
					class="btn btn-sm btn-outline-primary me-2"
					(click)="dp.actions.next()"
					[disabled]="dp.state.lastDate$().after(dp.state.maxDate$())"
					>&rarr;</button
				>
			</div>
		</ng-template>

		<ng-template #defaultContentTemplate>
			@for (grid of dp.state.grids$(); track grid.id) {
				@switch (dp.state.zoom$()) {
					@case ('d') {
						<div class="ngb-dp-month">
							<div class="ngb-dp-month-name">{{ grid.label }}</div>
							<ngb-datepicker-month [grid]="grid" [cellTemplate]="cellTemplate || defaultCellTemplate" />
						</div>
					}
					@case ('m') {
						<div class="ngb-dp-year">
							<div class="ngb-dp-year-name">{{ grid.label }}</div>
							<ngb-datepicker-grid [grid]="grid" zoom="m" [cellTemplate]="cellTemplate || defaultCellTemplate" />
						</div>
					}
					@case ('y') {
						<div class="ngb-dp-decade">
							<div class="ngb-dp-decade-name">{{ grid.label }}</div>
							<ngb-datepicker-grid [grid]="grid" zoom="m" [cellTemplate]="cellTemplate || defaultCellTemplate" />
						</div>
					}
				}
			}
		</ng-template>

		<div class="ngb-dp-header">
			<ng-template [ngTemplateOutlet]="defaultNavigation" />
			<!--			<ngb-datepicker-navigation-->
			<!--				*ngIf="navigation !== 'none'"-->
			<!--				[date]="model.firstDate!"-->
			<!--				[grids]="model.grids"-->
			<!--				[disabled]="model.disabled"-->
			<!--				[showSelect]="model.navigation === 'select'"-->
			<!--				[prevDisabled]="model.prevDisabled"-->
			<!--				[nextDisabled]="model.nextDisabled"-->
			<!--				[selectBoxes]="model.selectBoxes"-->
			<!--				[zoom]="model.zoom"-->
			<!--				(navigate)="onNavigateEvent($event)"-->
			<!--				(select)="onNavigateDateSelect($event)"-->
			<!--				(zoomOut)="zoomOut($event)"-->
			<!--			>-->
			<!--			</ngb-datepicker-navigation>-->
		</div>

		<div class="ngb-dp-content" [class.ngb-dp-months]="!contentTemplate" #content>
			<ng-template
				[ngTemplateOutlet]="contentTemplate || contentTemplateFromContent?.templateRef || defaultContentTemplate"
				[ngTemplateOutletInjector]="injector"
			/>
		</div>

		<ng-template [ngTemplateOutlet]="footerTemplate" />
	`,
	providers: [
		{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NgbDatepickerComponent), multi: true },
		{
			provide: NGB_DATEPICKER,
			useFactory: () => createDatepicker(inject(NgbDatepickerCalendar), inject(NgbDatepickerI18n)),
		},
		NgbDatepickerSelectionManager,
	],
})
export class NgbDatepickerComponent implements AfterViewInit, OnChanges, OnInit, ControlValueAccessor {
	// TODO: static types
	static ngAcceptInputType_autoClose: boolean | string;
	static ngAcceptInputType_mode: string;
	static ngAcceptInputType_navigation: string;
	static ngAcceptInputType_outsideDays: string;
	static ngAcceptInputType_weekdays: boolean | number;
	static ngAcceptInputType_zoom: string;

	dp = inject(NGB_DATEPICKER);

	get model() {
		return this.dp;
	}

	@ViewChild('defaultCellTemplate', { static: true })
	private _defaultCellTemplate: TemplateRef<NgbDatepickerCellContext>;
	@ViewChild('content', { static: true }) private _contentEl: ElementRef<HTMLElement>;

	protected injector = inject(Injector);

	private _config = inject(NgbDatepickerConfig);
	private _ngbDateAdapter = inject(NgbDateAdapter<any>);
	private _selectionManager = inject(NgbDatepickerSelectionManager);

	private _controlValue: NgbDate | null = null;

	get selectionManager() {
		return this._selectionManager;
	}

	/**
	 * The reference to a custom content template.
	 *
	 * Allows to completely override the way datepicker displays months.
	 *
	 * See [`NgbDatepickerContent`](#/components/datepicker/api#NgbDatepickerContent) and
	 * [`ContentTemplateContext`](#/components/datepicker/api#ContentTemplateContext) for more details.
	 *
	 * @since 14.2.0
	 */
	@Input() contentTemplate: TemplateRef<ContentTemplateContext>;
	@ContentChild(NgbDatepickerContent, { static: true }) contentTemplateFromContent?: NgbDatepickerContent;

	// TODO: figure out context type
	/**
	 * The reference to a custom template for the day.
	 *
	 * Allows to completely override the way a day 'cell' in the calendar is displayed.
	 *
	 * See [`DayTemplateContext`](#/components/datepicker/api#DayTemplateContext) for the data you get inside.
	 */
	@Input() cellTemplate = this._config.cellTemplate;

	// TODO: dayTemplateData
	// /**
	//  * The callback to pass any arbitrary data to the template cell via the
	//  * [`DayTemplateContext`](#/components/datepicker/api#DayTemplateContext)'s `data` parameter.
	//  *
	//  * `current` is the month that is currently displayed by the datepicker.
	//  *
	//  * @since 3.3.0
	//  */
	// @Input() dayTemplateData: (date: NgbDate, current?: { year: number; month: number }) => any;

	/**
	 * The number of months to display.
	 */
	@Input() displayMonths = this._config.displayMonths;

	/**
	 * The first day of the week.
	 *
	 * With default calendar we use ISO 8601: 'weekday' is 1=Mon ... 7=Sun.
	 */
	@Input() firstDayOfWeek = this._config.firstDayOfWeek;

	/**
	 * The reference to the custom template for the datepicker footer.
	 *
	 * @since 3.3.0
	 */
	@Input() footerTemplate = this._config.footerTemplate;

	/**
	 * The callback to mark some dates as disabled.
	 *
	 * It is called for each new date when navigating to a different month.
	 *
	 * `current` is the month that is currently displayed by the datepicker.
	 */

	// TODO: type change vs original
	@Input() markDisabled = this._config.markDisabled;

	/**
	 * The latest date that can be displayed or selected.
	 *
	 * If not provided, 'year' select box will display 10 years after the current month.
	 */
	@Input() maxDate = this._config.maxDate;

	/**
	 * The earliest date that can be displayed or selected.
	 *
	 * If not provided, 'year' select box will display 10 years before the current month.
	 */
	@Input() minDate = this._config.minDate;

	// TODO: navigation type
	//
	// /**
	//  * Navigation type.
	//  *
	//  * * `"select"` - select boxes for month and navigation arrows
	//  * * `"arrows"` - only navigation arrows
	//  * * `"none"` - no navigation visible at all
	//  */
	// @Input() navigation: 'select' | 'arrows' | 'none';

	// TODO: outside days
	// /**
	//  * The way of displaying days that don't belong to the current month.
	//  *
	//  * * `"visible"` - days are visible
	//  * * `"hidden"` - days are hidden, white space preserved
	//  * * `"collapsed"` - days are collapsed, so the datepicker height might change between months
	//  *
	//  * For the 2+ months view, days in between months are never shown.
	//  */
	// @Input() outsideDays: 'visible' | 'collapsed' | 'hidden';

	/**
	 * If `true`, week numbers will be displayed.
	 */
	@Input() showWeekNumbers = this._config.showWeekNumbers;

	/**
	 * Which level should be selected
	 */
	@Input() mode = this._config.mode;

	/**
	 * The date to open calendar with.
	 *
	 * With the default calendar we use ISO 8601: 'month' is 1=Jan ... 12=Dec.
	 * If nothing or invalid date is provided, calendar will open with current month.
	 *
	 * You could use `navigateTo(date)` method as an alternative.
	 */
	// TODO: day was optional for some reason
	@Input() startDate = this._config.startDate;

	/**
	 * The way weekdays should be displayed.
	 *
	 * * `true` - weekdays are displayed using default width
	 * * `false` - weekdays are not displayed
	 * * `TranslationWidth` - weekdays are displayed using specified width
	 *
	 * @since 9.1.0
	 */
	// TODO: changed boolean -> false
	@Input() weekdays = this._config.weekdays;

	/**
	 * Zoom level defines what is currently displayed by the datepicker
	 */
	@Input() zoom = this._config.zoom;

	// TODO: navigation event ?
	// /**
	//  * An event emitted right before the navigation happens and displayed month changes.
	//  *
	//  * See [`NgbDatepickerNavigateEvent`](#/components/datepicker/api#NgbDatepickerNavigateEvent) for the payload info.
	//  */
	// @Output() navigate = new EventEmitter<'prev' | 'next'>();

	/**
	 * An event emitted when user selects a date using keyboard or mouse.
	 *
	 * The payload of the event is currently selected `NgbDate`.
	 *
	 * @since 5.2.0
	 */
	@Output() dateSelect = new EventEmitter<NgbDate>();

	onChange = (_: any) => {};
	onTouched = () => {};

	constructor() {
		// date selection forward
		// TODO: just forward it directly via output ?
		this.dp.events.selections$.pipe(takeUntilDestroyed()).subscribe((date) => {
			this.dateSelect.emit(date);
		});

		let element = inject(ElementRef).nativeElement as HTMLElement;
		let zone = inject(NgZone);

		this.dp.events.focusChange$.pipe(takeUntilDestroyed()).subscribe(() => {
			console.log('change');

			zone.onStable.pipe(take(1)).subscribe(() => {
				const elementToFocus = element.querySelector<HTMLDivElement>('div.ngb-dp-cell[tabindex="0"]');
				if (elementToFocus) {
					elementToFocus.focus();
				}
			});
		});

		// _service.model$.pipe(takeUntil(this._destroyed$)).subscribe((model) => {
		// const newDate = model.firstDate!;
		// const oldDate = this.model ? this.model.firstDate : null;
		// const oldZoom = this.model ? this.model.zoom : null;
		//
		// TODO: navigation event
		// let navigationPrevented = false;
		// // emitting navigation event if the first month changes
		// if (!newDate.equals(oldDate)) {
		// 	this.navigate.emit({
		// 		current: oldDate ? { year: oldDate.year, month: oldDate.month } : null,
		// 		next: { year: newDate.year, month: newDate.month },
		// 		preventDefault: () => (navigationPrevented = true),
		// 	});
		//
		// 	// can't prevent the very first navigation
		// 	if (navigationPrevented && oldDate !== null) {
		// 		this._service.open(oldDate);
		// 		return;
		// 	}
		// }

		// const newSelectedDate = model.selectedDate;
		// const newFocusedDate = model.focusDate;
		// const oldFocusedDate = this.model ? this.model.focusDate : null;

		// handling selection change
		// TODO: selection change ?
		// if (isChangedDate(newSelectedDate, this._controlValue)) {
		// 	this._controlValue = newSelectedDate;
		// 	this.onTouched();
		// 	this.onChange(this._ngbDateAdapter.toModel(newSelectedDate));
		// }

		// handling focus change
		// TODO: focus handling
		// if (
		// 	((isChangedDate(newFocusedDate, oldFocusedDate) && oldFocusedDate) || this.model.zoom !== oldZoom) &&
		// 	model.focusVisible
		// ) {
		// 	this.focus();
		// }

		// TODO: mark for check?
		// cd.markForCheck();
		// });
	}

	/**
	 *  Focuses on given date.
	 */
	focusDate(date?: NgbDateStruct | null): void {
		// TODO: focus date ?
		// this._service.focus(NgbDate.from(date));
	}

	/**
	 *  Selects focused date.
	 */
	focusSelect(): void {
		// TODO: select focused date ?
		// this._service.focusSelect();
	}

	focus() {
		// TODO: focus
		// this._ngZone.onStable
		// 	.asObservable()
		// 	.pipe(take(1))
		// 	.subscribe(() => {
		// 		const elementToFocus = this._elementRef.nativeElement.querySelector<HTMLDivElement>(
		// 			'div.ngb-dp-cell[tabindex="0"]',
		// 		);
		// 		if (elementToFocus) {
		// 			elementToFocus.focus();
		// 		}
		// 	});
	}

	/**
	 * Navigates to the provided date.
	 *
	 * With the default calendar we use ISO 8601: 'month' is 1=Jan ... 12=Dec.
	 * If nothing or invalid date provided calendar will open current month.
	 *
	 * Use the `[startDate]` input as an alternative.
	 */
	navigateTo(date?: { year: number; month: number; day: number }) {
		this.dp.actions.open(date);
	}

	ngAfterViewInit() {
		// TODO: fancy focus handling
		// this._ngZone.runOutsideAngular(() => {
		// 	const focusIns$ = fromEvent<FocusEvent>(this._contentEl.nativeElement, 'focusin');
		// 	const focusOuts$ = fromEvent<FocusEvent>(this._contentEl.nativeElement, 'focusout');
		// 	const { nativeElement } = this._elementRef;
		//
		// 	// we're changing 'focusVisible' only when entering or leaving months view
		// 	// and ignoring all focus events where both 'target' and 'related' target are day cells
		// 	merge(focusIns$, focusOuts$)
		// 		.pipe(
		// 			filter(
		// 				({ target, relatedTarget }) =>
		// 					!(
		// 						hasClassName(target, 'ngb-dp-cell') &&
		// 						hasClassName(relatedTarget, 'ngb-dp-cell') &&
		// 						nativeElement.contains(target as Node) &&
		// 						nativeElement.contains(relatedTarget as Node)
		// 					),
		// 			),
		// 			takeUntil(this._destroyed$),
		// 		)
		// 		.subscribe(({ type }) =>
		// 			this._ngZone.run(() => {
		// 				// TODO: fuck, this should be done dependent on the click vs keyboard???!!!
		// 				console.log('FOCUS VISBILE', { focusVisible: type === 'focusin' });
		// 				this._service.set({ focusVisible: type === 'focusin' });
		// 			}),
		// 		);
		// });
	}

	ngOnInit() {
		// if (this.model === undefined) {
		// const inputs: DatepickerServiceInputs = {};
		// [
		// 	'dayTemplateData',
		// 	'displayMonths',
		// 	'markDisabled',
		// 	'firstDayOfWeek',
		// 	'navigation',
		// 	'minDate',
		// 	'maxDate',
		// 	'outsideDays',
		// 	'weekdays',
		// 	'mode',
		// 	'zoom',
		// ].forEach((name) => (inputs[name] = this[name]));
		// this._service.set(inputs);

		this.navigateTo(this.startDate);
		// }
		if (!this.cellTemplate) {
			this.cellTemplate = this._defaultCellTemplate;
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		// TODO: dayTemplateData, navigation, outsideDays
		const { displayMonths, markDisabled, firstDayOfWeek, minDate, maxDate, weekdays, mode, zoom, showWeekNumbers } =
			changes;

		if (displayMonths) {
			this.dp.inputs.displayGrids$.set(this.displayMonths);
		}

		if (markDisabled) {
			this.dp.inputs.markDisabled$.set(this.markDisabled);
		}

		if (firstDayOfWeek) {
			this.dp.inputs.firstDayOfWeek$.set(this.firstDayOfWeek);
		}

		if (minDate) {
			this.dp.inputs.minDate$.set(this.minDate);
		}

		if (maxDate) {
			this.dp.inputs.maxDate$.set(this.maxDate);
		}

		if (weekdays) {
			this.dp.inputs.showWeekdays$.set(this.weekdays);
		}

		if (mode) {
			this.dp.inputs.minZoom$.set(this.mode);
		}

		if (zoom) {
			this.dp.inputs.zoom$.set(this.zoom);
		}

		if (showWeekNumbers) {
			this.dp.inputs.showWeekNumbers$.set(this.showWeekNumbers);
		}

		// const inputs: DatepickerServiceInputs = {};
		// [
		// 	'dayTemplateData',
		// 	'displayMonths',
		// 	'markDisabled',
		// 	'firstDayOfWeek',
		// 	'navigation',
		// 	'minDate',
		// 	'maxDate',
		// 	'outsideDays',
		// 	'weekdays',
		// 	'mode',
		// 	'zoom',
		// ]
		// 	.filter((name) => name in changes)
		// 	.forEach((name) => (inputs[name] = this[name]));
		// this._service.set(inputs);

		// if ('startDate' in changes) {
		// 	const { currentValue, previousValue } = changes.startDate;
		// 	if (isChangedMonth(previousValue, currentValue)) {
		// 		this.navigateTo(this.startDate);
		// 	}
		// }
	}

	onNavigateDateSelect(date: NgbDate) {
		// this._service.open(date);
		// TODO: navigation handling
	}

	onNavigateEvent(event: any) {
		// TODO: navigation handling
		// switch (event) {
		// 	case NavigationEvent.PREV:
		// 		this._service.openPrev();
		// 		break;
		// 	case NavigationEvent.NEXT:
		// 		this._service.openNext();
		// 		break;
		// }
	}

	registerOnChange(fn: (value: any) => any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: () => any): void {
		this.onTouched = fn;
	}

	setDisabledState(disabled: boolean) {
		this.dp.inputs.disabled$.set(disabled);
	}

	writeValue(value) {
		this._controlValue = NgbDate.from(this._ngbDateAdapter.fromModel(value));
		this.dp.actions.select(this._controlValue!);
	}
}
