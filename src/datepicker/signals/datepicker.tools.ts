import { NgbDate } from './ngb-date';
import { TranslationWidth } from '@angular/common';
import { NgbDatepickerCalendar, NgbPeriod } from './datepicker.calendar';
import {
	NgbDatepickerCell,
	NgbDatepickerDayGridContext,
	NgbDatepickerGrid,
	NgbDatepickerRow,
} from './datepicker.state';
import { NgbDatepickerI18n } from './datepicker.i18n';

const ZOOM_LEVELS: NgbPeriod[] = ['d', 'm', 'y', 'yy'];

export function _zoomIn(zoom: NgbPeriod): NgbPeriod {
	return ZOOM_LEVELS[Math.max(ZOOM_LEVELS.indexOf(zoom) - 1, 0)];
}

export function _zoomOut(zoom: NgbPeriod): NgbPeriod {
	return ZOOM_LEVELS[Math.min(ZOOM_LEVELS.indexOf(zoom) + 1, ZOOM_LEVELS.length - 1)];
}

export function adjustZoom(zoom: NgbPeriod, minZoom: NgbPeriod, maxZoom: NgbPeriod) {
	const z = ZOOM_LEVELS.indexOf(zoom);
	const min = ZOOM_LEVELS.indexOf(minZoom);
	const max = ZOOM_LEVELS.indexOf(maxZoom);
	return ZOOM_LEVELS[Math.min(Math.max(z, min), max)];
}

export function getFirstGridDate(
	calendar: NgbDatepickerCalendar,
	date: NgbDate,
	firstDayOfWeek: number,
	zoom: NgbPeriod,
): NgbDate {
	switch (zoom) {
		case 'd':
			const daysPerWeek = calendar.getDaysPerWeek();
			const firstMonthDate = new NgbDate(date.year, date.month, 1);
			const dayOfWeek = calendar.getWeekday(firstMonthDate) % daysPerWeek;
			return calendar.getPrev(firstMonthDate, 'd', (daysPerWeek + dayOfWeek - firstDayOfWeek) % daysPerWeek);
		case 'm':
			let firstMonth = date;
			let prevMonth = calendar.getPrev(date, 'm', 1);
			while (firstMonth.year === prevMonth.year) {
				firstMonth = prevMonth;
				prevMonth = calendar.getPrev(firstMonth, 'm', 1);
			}
			return firstMonth;
		case 'y':
			let firstYear = date,
				prevYear = calendar.getPrev(date, 'y', 1);
			const [rows, column] = calendar.getGridForZoom(firstYear, 'y');
			while (firstYear.year % (rows * column) !== 0) {
				firstYear = prevYear;
				prevYear = calendar.getPrev(firstYear, 'y', 1);
			}
			return normalizeDate(firstYear, 'y');
		case 'yy':
			throw new Error(`Unknown period '${zoom}'`);
	}
}

/**
 * Returns the first date of the period (month, year, decade) that contains the given date
 */
export function normalizeDate(date: NgbDate, period: NgbPeriod): NgbDate {
	switch (period) {
		case 'y':
		case 'yy':
			return new NgbDate(date.year, 1, 1);
		case 'm':
			return new NgbDate(date.year, date.month, 1);
		default:
			return date;
	}
}

/*
 * Builds calendar structure for the given date
 */
export function buildGrids(
	firstDate: NgbDate,
	calendar: NgbDatepickerCalendar,
	displayGrids: number,
	zoom: NgbPeriod,
	firstDayOfWeek: number,
	i18n: NgbDatepickerI18n,
	checkDisabledFn: (date: NgbDate) => boolean,
	showWeekdays: TranslationWidth | false,
	showWeekNumbers: boolean,
	focusableDate: NgbDate | null,
): NgbDatepickerGrid[] {
	const grids: NgbDatepickerGrid[] = [];

	for (let i = 0; i < displayGrids; i++) {
		// building generic grid for days/months/years
		const grid = buildGrid(firstDate, calendar, zoom, firstDayOfWeek, i18n, checkDisabledFn, focusableDate);

		// adding specific context
		switch (zoom) {
			case 'd':
				grid.context = buildDayGridContext(grid, calendar, i18n, showWeekdays, showWeekNumbers, firstDayOfWeek);
				break;
		}

		grids.push(grid);
		firstDate = calendar.getNext(firstDate, _zoomOut(zoom));
	}

	return grids;
}

export function buildDayGridContext(
	grid: NgbDatepickerGrid,
	calendar: NgbDatepickerCalendar,
	i18n: NgbDatepickerI18n,
	showWeekdays: TranslationWidth | false,
	showWeekNumbers: boolean,
	firstDayOfWeek: number,
): NgbDatepickerDayGridContext {
	let weekdays: string[] = [];
	let weekNumbers: number[] = [];

	if (showWeekdays) {
		for (let cell of grid.rows[0].cells) {
			weekdays.push(i18n.getWeekdayLabel(calendar.getWeekday(cell.date), showWeekdays));
		}
	}

	if (showWeekNumbers) {
		for (let row of grid.rows) {
			weekNumbers.push(
				calendar.getWeekNumber(
					row.cells.map((cell) => cell.date),
					firstDayOfWeek,
				),
			);
		}
	}

	return {
		zoom: 'd',
		weekdays,
		weekNumbers,
	};
}

/**
 * Builds calendar structure for the given date
 */
export function buildGrid(
	firstDate: NgbDate, // valid 1st date of the month/year/decade
	calendar: NgbDatepickerCalendar,
	zoom: NgbPeriod,
	firstDayOfWeek: number,
	i18n: NgbDatepickerI18n,
	checkDisabledFn: (date: NgbDate) => boolean,
	focusableDate: NgbDate | null,
): NgbDatepickerGrid {
	const [ROWS, COLUMNS] = calendar.getGridForZoom(firstDate, zoom);

	const grid: NgbDatepickerGrid = {
		id: `${firstDate.year}-${firstDate.month}-${firstDate.day}`,
		rows: [],
		firstDate,
		lastDate: normalizeDate(calendar.getPrev(calendar.getNext(firstDate, _zoomOut(zoom))), zoom),
		label: '',
	};

	let date = getFirstGridDate(calendar, firstDate, firstDayOfWeek, zoom);

	for (let i = 0; i < ROWS; i++) {
		const row: NgbDatepickerRow = { id: '', cells: [] };

		for (let j = 0; j < COLUMNS; j++) {
			const cell: NgbDatepickerCell = {
				id: `${date.year}-${date.month}-${date.day}`,
				date,
				disabled: checkDisabledFn(date),
				ariaLabel: i18n.getDateAriaLabel(date, zoom),
				numerals: i18n.getDateNumerals(date, zoom),
				outside: isOutside(date, firstDate, zoom),
				tabindex: date.equals(focusableDate) && !isOutside(date, firstDate, zoom) ? 0 : -1,
			};

			row.cells.push(cell);
			date = calendar.getNext(date, zoom);
		}

		row.id = row.cells[0].id;
		grid.rows.push(row);
	}

	grid.label = i18n.getGridLabel(grid.firstDate, grid.lastDate, zoom);

	return grid;
}

function isOutside(date: NgbDate, gridDate: NgbDate, zoom: NgbPeriod) {
	switch (zoom) {
		case 'd':
			return gridDate.month !== date.month;
		default:
			return false;
	}
}

/**
 * Finds the first focusable date in the grid view
 */
export function findFirstFocusableDate(date: NgbDate, zoom: NgbPeriod, calendar: NgbDatepickerCalendar) {
	switch (zoom) {
		case 'd':
			return normalizeDate(date, 'm');
		case 'm':
			return normalizeDate(date, 'y');
		default:
			return getFirstGridDate(calendar, date, 1, zoom);
	}
}

/**
 * Finds the last focusable date in the grid view
 */
export function findLastFocusableDate(
	firstDate: NgbDate,
	zoom: NgbPeriod,
	calendar: NgbDatepickerCalendar,
	displayGrids: number,
) {
	firstDate = normalizeDate(firstDate, zoom);
	displayGrids = Math.max(1, displayGrids);

	let lastDate = calendar.getNext(firstDate, _zoomOut(zoom), displayGrids - 1);
	let afterLastDate = calendar.getNext(lastDate, _zoomOut(zoom));
	return normalizeDate(calendar.getPrev(afterLastDate), zoom);
}

/**
 * Finds the focusable date in the grid:
 *
 * - within [firstDate, lastDate]
 * - within [minDate, maxDate]
 * - not disabled
 */
export function findFocusableDate(
	date: NgbDate,
	zoom: NgbPeriod,
	disabled: boolean,
	firstDate: NgbDate,
	lastDate: NgbDate,
	minDate: NgbDate | null,
	maxDate: NgbDate | null,
) {
	if (disabled) {
		return null;
	}

	firstDate = normalizeDate(firstDate, zoom);
	lastDate = normalizeDate(lastDate, zoom);
	date = normalizeDate(date, zoom);

	// making sure the focusable date is within the current view
	if (date.before(firstDate) || date.after(lastDate)) {
		date = firstDate;
	}

	// making sure the focusable date is within min/max dates
	return adjustDateWithinRange(date, zoom, minDate, maxDate);
}

/**
 * Selectable date is:
 * - not before minDate
 * - not after maxDate
 * - not disabled
 * - belongs to the currently visible grid
 */
export function isDateSelectable(
	date: NgbDate,
	grids: NgbDatepickerGrid[],
	checkDisabledFn: (date: NgbDate) => boolean,
): boolean {
	if (checkDisabledFn(date)) {
		return false;
	}

	const rows = grids[0].rows.length;
	const columns = grids[0].rows[0].cells.length;
	const firstVisibleDate = grids[0].rows[0].cells[0].date;
	const lastVisibleDate = grids[grids.length - 1].rows[rows - 1].cells[columns - 1].date;

	if (date.before(firstVisibleDate) || date.after(lastVisibleDate)) {
		return false;
	}

	return true;
}

/**
 * Navigable date is:
 *
 * - not before minDate
 * - not after maxDate
 * - outside the currently visible grids
 */
export function isDateNavigable(
	date: NgbDate,
	grids: NgbDatepickerGrid[],
	minDate: NgbDate | null,
	maxDate: NgbDate | null,
): boolean {
	const dateIsOutsideMinMax = (minDate && date.before(minDate)) || (maxDate && date.after(maxDate));
	const dateIsOutsideGrids = date.after(grids[grids.length - 1].lastDate) || date.before(grids[0].firstDate);
	return dateIsOutsideMinMax ? false : dateIsOutsideGrids;
}

/**
 * Disabled date is:
 * - before minDate
 * - after maxDate
 * - according to markDisabledFn
 */
export function isDateDisabled(
	date: NgbDate,
	minDate: NgbDate | null,
	maxDate: NgbDate | null,
	zoom: 'yy' | 'y' | 'm' | 'd',
	disabled: boolean,
	markDisabledFn: (date: NgbDate, zoom: NgbPeriod) => boolean,
) {
	minDate = minDate ? normalizeDate(minDate, zoom) : null;
	maxDate = maxDate ? normalizeDate(maxDate, zoom) : null;
	date = normalizeDate(date, zoom);
	return (
		disabled || (minDate && date.before(minDate)) || (maxDate && date.after(maxDate)) || markDisabledFn(date, zoom)
	);
}

/**
 * Checks if a date is within range.
 *
 * - not before minDate
 * - not after maxDate
 */
export function isDateWithinRange(date: NgbDate, minDate: NgbDate | null, maxDate: NgbDate | null): boolean {
	return !((minDate && date.before(minDate)) || (maxDate && date.after(maxDate)));
}

/**
 * Adjusts the date to be within min/max dates.
 */
export function adjustDateWithinRange(
	date: NgbDate,
	zoom: NgbPeriod,
	minDate: NgbDate | null,
	maxDate: NgbDate | null,
): NgbDate {
	date = normalizeDate(date, zoom);
	minDate = minDate ? normalizeDate(minDate, zoom) : null;
	maxDate = maxDate ? normalizeDate(maxDate, zoom) : null;

	if (minDate && date.before(minDate)) {
		return minDate;
	}

	if (maxDate && date.after(maxDate)) {
		return maxDate;
	}

	return date;
}
