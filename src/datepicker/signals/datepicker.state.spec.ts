import { TestBed } from '@angular/core/testing';
import { TranslationWidth } from '@angular/common';
import { NgbDatepickerCalendar } from './datepicker.calendar';
import { createDatepicker, NgbDatepickerDayGridContext, NgbDatepickerGrid } from './datepicker.state';
import { NgbDate } from './ngb-date';
import { NgbDateStruct } from './ngb-date-struct';
import { normalizeDate } from './datepicker.tools';
import { NgbDatepickerI18n } from './datepicker.i18n';

fdescribe('datepicker.state', () => {
	let calendar: NgbDatepickerCalendar;
	let i18n: NgbDatepickerI18n;
	let dp: ReturnType<typeof createDatepicker>;

	const grid = (n: number) => dp.state.grids$()[n];
	const grids = () => dp.state.grids$();

	const dayGridContext = (n: number) => grid(n).context as NgbDatepickerDayGridContext;

	const firstDate = () => grid(0).firstDate;
	const lastDate = () => grid(0).lastDate;

	const cellFrom = (grid: NgbDatepickerGrid, row: number, col: number) => grid.rows[row].cells[col];
	const dateFrom = (grid: NgbDatepickerGrid, row: number, col: number) => cellFrom(grid, row, col).date;
	const date = (row: number, col: number) => dateFrom(grid(0), row, col);
	const cell = (row: number, col: number) => cellFrom(grid(0), row, col);

	const focusableCells = () => {
		let cells: number[][] = [];
		for (let g of grids()) {
			for (let r = 0; r < g.rows.length; r++) {
				for (let c = 0; c < g.rows[r].cells.length; c++) {
					if (g.rows[r].cells[c].tabindex === 0) {
						cells.push([r, c]);
					}
				}
			}
		}
		return cells;
	};

	const d = (date: NgbDateStruct) => NgbDate.from(date)!;

	let selections: NgbDate[];

	beforeEach(() => {
		calendar = TestBed.inject(NgbDatepickerCalendar);
		i18n = TestBed.inject(NgbDatepickerI18n);
		dp = createDatepicker(calendar, i18n);
		selections = [];

		dp.events.selections$.subscribe((d) => selections.push(d));
	});

	it('should create initial state', () => {
		let firstDayOfMonth = normalizeDate(calendar.getToday(), 'm');
		let ariaLabel = i18n.getDateAriaLabel(firstDayOfMonth, 'd');

		expect(dp.state.firstDayOfWeek$()).toBe(1);
		expect(dp.state.displayGrids$()).toBe(1);
		expect(dp.state.showWeekdays$()).toBe(TranslationWidth.Short);
		expect(dp.state.showWeekNumbers$()).toBe(false);

		expect(dp.state.zoom$()).toBe('d');
		expect(dp.state.minZoom$()).toBe('d');

		expect(dp.state.minDate$()).toBe(null);
		expect(dp.state.maxDate$()).toBe(null);

		expect(dp.state.disabled$()).toBe(false);

		// grid
		expect(grids().length).toBe(1);
		expect(grid(0).rows.length).toBe(6);
		expect(grid(0).rows[0].cells.length).toBe(7);
		expect(grid(0).rows[0].cells).toContain({
			id: '2020-01-01',
			date: firstDayOfMonth,
			disabled: false,
			ariaLabel,
			numerals: '1',
			outside: false,
			tabindex: firstDayOfMonth.equals(calendar.getToday()) ? 0 : -1,
		});

		// weekdays
		let context = grid(0).context as NgbDatepickerDayGridContext;
		expect(context).toBeDefined();
		expect(context.zoom).toBe('d');
		expect(context.weekdays).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
		expect(context.weekNumbers).toEqual([]);

		expect(firstDate()).toEqual(firstDayOfMonth);
	});

	it(`should change displayed grid with '.open()' [days]`, () => {
		dp.actions.open({ year: 2021, month: 1, day: 10 });

		expect(firstDate()).toEqual(d({ year: 2021, month: 1, day: 1 }));
		expect(lastDate()).toEqual(d({ year: 2021, month: 1, day: 31 }));

		expect(date(0, 0)).toEqual(d({ year: 2020, month: 12, day: 28 }));
	});

	it(`should change displayed grid with '.open()' [months]`, () => {
		dp.inputs.zoom$.set('m');
		dp.actions.open({ year: 2021, month: 1, day: 10 });

		expect(firstDate()).toEqual(d({ year: 2021, month: 1, day: 1 }));
		expect(lastDate()).toEqual(d({ year: 2021, month: 12, day: 1 }));

		expect(date(0, 0)).toEqual(d({ year: 2021, month: 1, day: 1 }));
		expect(date(0, 1)).toEqual(d({ year: 2021, month: 2, day: 1 }));
	});

	it(`should change displayed grid with '.open()' [years]`, () => {
		dp.inputs.zoom$.set('y');
		dp.actions.open({ year: 2021, month: 2, day: 10 });

		expect(firstDate()).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(lastDate()).toEqual(d({ year: 2039, month: 1, day: 1 }));

		expect(date(0, 0)).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(date(0, 1)).toEqual(d({ year: 2021, month: 1, day: 1 }));
	});

	it(`should change displayed grid with '.next()' [days]`, () => {
		dp.actions.open({ year: 2021, month: 1, day: 10 });
		dp.actions.next();

		expect(firstDate()).toEqual(d({ year: 2021, month: 2, day: 1 }));
		expect(lastDate()).toEqual(d({ year: 2021, month: 2, day: 28 }));

		expect(date(0, 0)).toEqual(d({ year: 2021, month: 2, day: 1 }));
	});

	it(`should change displayed grid with '.next()' [months]`, () => {
		dp.inputs.zoom$.set('m');
		dp.actions.open({ year: 2021, month: 2, day: 10 });
		dp.actions.next();

		expect(firstDate()).toEqual(d({ year: 2022, month: 1, day: 1 }));
		expect(lastDate()).toEqual(d({ year: 2022, month: 12, day: 1 }));

		expect(date(0, 0)).toEqual(d({ year: 2022, month: 1, day: 1 }));
		expect(date(0, 1)).toEqual(d({ year: 2022, month: 2, day: 1 }));
	});

	it(`should change displayed grid with '.next()' [years]`, () => {
		dp.inputs.zoom$.set('y');
		dp.actions.open({ year: 2021, month: 2, day: 10 });
		dp.actions.next();

		expect(firstDate()).toEqual(d({ year: 2040, month: 1, day: 1 }));
		expect(lastDate()).toEqual(d({ year: 2059, month: 1, day: 1 }));

		expect(date(0, 0)).toEqual(d({ year: 2040, month: 1, day: 1 }));
		expect(date(0, 1)).toEqual(d({ year: 2041, month: 1, day: 1 }));
	});

	it(`should change generate correct aria labels`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		expect(cell(0, 0).ariaLabel).toBe('Monday, December 30, 2019');

		dp.inputs.zoom$.set('m');
		expect(cell(0, 0).ariaLabel).toBe('January 2020');

		dp.inputs.zoom$.set('y');
		expect(cell(0, 0).ariaLabel).toBe('2020');
	});

	it(`should mark dates as muted`, () => {
		dp.inputs.displayGrids$.set(2);
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		expect(cell(0, 0).date).toEqual(d({ year: 2019, month: 12, day: 30 }));
		expect(cell(0, 0).outside).toBe(true);

		expect(cell(0, 2).date).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(cell(0, 2).outside).toBe(false);

		expect(cellFrom(grid(1), 4, 5).date).toEqual(d({ year: 2020, month: 2, day: 29 }));
		expect(cellFrom(grid(1), 4, 5).outside).toBe(false);

		expect(cellFrom(grid(1), 4, 6).date).toEqual(d({ year: 2020, month: 3, day: 1 }));
		expect(cellFrom(grid(1), 4, 6).outside).toBe(true);
	});

	it(`should change generate correct cell numerals`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		expect(cell(0, 0).numerals).toBe('30');

		dp.inputs.zoom$.set('m');
		expect(cell(0, 0).numerals).toBe('Jan');

		dp.inputs.zoom$.set('y');
		expect(cell(0, 0).numerals).toBe('2020');
	});

	it(`should change disabled state with 'disabled()'`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		expect(cell(0, 0).disabled).toBe(false);

		dp.inputs.disabled$.set(true);
		expect(cell(0, 0).disabled).toBe(true);
	});

	it(`should mark dates as disabled with min/max [days]`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });

		expect(date(0, 1)).toEqual(d({ year: 2019, month: 12, day: 31 }));
		expect(date(0, 2)).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(date(4, 4)).toEqual(d({ year: 2020, month: 1, day: 31 }));
		expect(date(4, 5)).toEqual(d({ year: 2020, month: 2, day: 1 }));

		expect(cell(0, 1).disabled).toBe(false);
		expect(cell(0, 2).disabled).toBe(false);
		expect(cell(4, 4).disabled).toBe(false);
		expect(cell(4, 5).disabled).toBe(false);

		dp.inputs.minDate$.set({ year: 2020, month: 1, day: 1 });
		dp.inputs.maxDate$.set({ year: 2020, month: 1, day: 31 });

		expect(cell(0, 1).disabled).toBe(true);
		expect(cell(0, 2).disabled).toBe(false);
		expect(cell(4, 4).disabled).toBe(false);
		expect(cell(4, 5).disabled).toBe(true);
	});

	it(`should mark dates as disabled with min/max [months]`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		dp.inputs.zoom$.set('m');

		expect(date(0, 0)).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(date(2, 3)).toEqual(d({ year: 2020, month: 12, day: 1 }));

		expect(cell(0, 0).disabled).toBe(false);
		expect(cell(2, 3).disabled).toBe(false);

		dp.inputs.minDate$.set({ year: 2020, month: 1, day: 31 });
		expect(cell(0, 0).disabled).toBe(false);

		dp.inputs.minDate$.set({ year: 2020, month: 2, day: 1 });
		expect(cell(0, 0).disabled).toBe(true);

		dp.inputs.maxDate$.set({ year: 2020, month: 11, day: 1 });
		expect(cell(2, 3).disabled).toBe(true);

		dp.inputs.maxDate$.set({ year: 2020, month: 12, day: 1 });
		expect(cell(2, 3).disabled).toBe(false);
	});

	it(`should mark dates as disabled with min/max [years]`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		dp.inputs.zoom$.set('y');

		expect(date(0, 0)).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(date(2, 3)).toEqual(d({ year: 2031, month: 1, day: 1 }));

		expect(cell(0, 0).disabled).toBe(false);
		expect(cell(2, 3).disabled).toBe(false);

		dp.inputs.minDate$.set({ year: 2020, month: 12, day: 31 });
		expect(cell(0, 0).disabled).toBe(false);

		dp.inputs.minDate$.set({ year: 2021, month: 1, day: 1 });
		expect(cell(0, 0).disabled).toBe(true);

		dp.inputs.maxDate$.set({ year: 2031, month: 1, day: 1 });
		expect(cell(2, 3).disabled).toBe(false);

		dp.inputs.maxDate$.set({ year: 2030, month: 12, day: 31 });
		expect(cell(2, 3).disabled).toBe(true);
	});

	it(`should mark dates as disabled with 'markDisabled()' [dates]`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });

		expect(date(0, 1)).toEqual(d({ year: 2019, month: 12, day: 31 }));
		expect(cell(0, 1).disabled).toBe(false);

		dp.inputs.markDisabled$.set((date, zoom) => date.equalsZoomed(zoom, { year: 2019, month: 12, day: 31 }));
		expect(cell(0, 1).disabled).toBe(true);
	});

	it(`should mark dates as disabled with 'markDisabled()' [months]`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		dp.inputs.zoom$.set('m');

		expect(date(0, 0)).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(cell(0, 0).disabled).toBe(false);

		dp.inputs.markDisabled$.set((date, zoom) => date.equalsZoomed(zoom, { year: 2020, month: 1, day: 10 }));
		expect(cell(0, 0).disabled).toBe(true);
	});

	it(`should mark dates as disabled with 'markDisabled()' [years]`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		dp.inputs.zoom$.set('y');

		expect(date(0, 0)).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(cell(0, 0).disabled).toBe(false);

		dp.inputs.markDisabled$.set((date, zoom) => date.equalsZoomed(zoom, { year: 2020, month: 10, day: 10 }));
		expect(cell(0, 0).disabled).toBe(true);
	});

	it(`should generate week numbers correctly`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		expect(date(0, 0)).toEqual(d({ year: 2019, month: 12, day: 30 }));
		expect(dayGridContext(0).weekNumbers).toEqual([]);

		dp.inputs.showWeekNumbers$.set(true);
		expect(dayGridContext(0).weekNumbers).toEqual([1, 2, 3, 4, 5, 6]);

		dp.actions.open({ year: 2020, month: 12, day: 31 });
		expect(dayGridContext(0).weekNumbers).toEqual([49, 50, 51, 52, 53, 1]);
	});

	it(`should generate weekdays correctly`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		expect(date(0, 0)).toEqual(d({ year: 2019, month: 12, day: 30 }));
		expect(dayGridContext(0).weekdays).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);

		dp.inputs.showWeekdays$.set(false);
		expect(dayGridContext(0).weekdays).toEqual([]);

		dp.inputs.showWeekdays$.set(TranslationWidth.Abbreviated);
		dp.inputs.firstDayOfWeek$.set(0);
		expect(dayGridContext(0).weekdays).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
	});

	it(`should adjust 'zoom' level based on 'minZoom'`, () => {
		expect(dp.inputs.zoom$()).toBe('d');

		dp.inputs.minZoom$.set('m');
		expect(dp.state.zoom$()).toBe('m');

		dp.inputs.zoom$.set('y');
		expect(dp.state.zoom$()).toBe('y');

		dp.inputs.zoom$.set('d');
		expect(dp.state.zoom$()).toBe('m');
	});

	it(`should select dates with '.select()' [days]`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		expect(date(0, 0)).toEqual(d({ year: 2019, month: 12, day: 30 }));

		dp.actions.select({ year: 2020, month: 1, day: 1 });
		expect(selections).toEqual([d({ year: 2020, month: 1, day: 1 })]);
	});

	it(`should not select invalid dates with '.select()' [days]`, () => {
		dp.inputs.minDate$.set({ year: 2019, month: 12, day: 31 });
		dp.inputs.maxDate$.set({ year: 2020, month: 2, day: 5 });
		dp.inputs.markDisabled$.set((date) => date.equals({ year: 2020, month: 1, day: 9 }));

		dp.actions.open({ year: 2020, month: 1, day: 10 });
		expect(date(0, 0)).toEqual(d({ year: 2019, month: 12, day: 30 }));
		expect(date(5, 6)).toEqual(d({ year: 2020, month: 2, day: 9 }));

		// visible, but before minDate
		dp.actions.select({ year: 2020, month: 12, day: 30 });
		expect(selections).toEqual([]);

		// visible, but after maxDate
		dp.actions.select({ year: 2020, month: 2, day: 6 });
		expect(selections).toEqual([]);

		// not visible
		dp.actions.select({ year: 2010, month: 1, day: 9 });
		expect(selections).toEqual([]);

		// not visible
		dp.actions.select({ year: 2030, month: 1, day: 9 });
		expect(selections).toEqual([]);

		// disabled
		dp.actions.select({ year: 2020, month: 1, day: 9 });
		expect(selections).toEqual([]);
	});

	it(`should select dates with '.select()' [months]`, () => {
		dp.inputs.minZoom$.set('m');
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		expect(date(0, 0)).toEqual(d({ year: 2020, month: 1, day: 1 }));

		dp.actions.select({ year: 2020, month: 2, day: 2 });
		expect(selections).toEqual([d({ year: 2020, month: 2, day: 1 })]);
	});

	it(`should not select invalid dates with '.select()' [months]`, () => {
		dp.inputs.minZoom$.set('m');
		dp.inputs.minDate$.set({ year: 2020, month: 2, day: 5 });
		dp.inputs.maxDate$.set({ year: 2020, month: 10, day: 5 });
		dp.inputs.markDisabled$.set((date) => date.equals({ year: 2020, month: 4, day: 1 }));

		dp.actions.open({ year: 2020, month: 1, day: 10 });
		expect(date(0, 0)).toEqual(d({ year: 2020, month: 1, day: 1 }));

		// visible, but before minDate
		dp.actions.select({ year: 2020, month: 1, day: 20 });
		expect(selections).toEqual([]);

		// visible, but after maxDate
		dp.actions.select({ year: 2020, month: 12, day: 6 });
		expect(selections).toEqual([]);

		// not visible
		dp.actions.select({ year: 2010, month: 1, day: 9 });
		expect(selections).toEqual([]);

		// not visible
		dp.actions.select({ year: 2030, month: 1, day: 9 });
		expect(selections).toEqual([]);

		// disabled
		dp.actions.select({ year: 2020, month: 4, day: 9 });
		expect(selections).toEqual([]);
	});

	it(`should select dates with '.select()' [years]`, () => {
		dp.inputs.minZoom$.set('y');
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		expect(date(0, 0)).toEqual(d({ year: 2020, month: 1, day: 1 }));

		dp.actions.select({ year: 2021, month: 3, day: 1 });
		expect(selections).toEqual([d({ year: 2021, month: 1, day: 1 })]);
	});

	it(`should not select invalid dates with '.select()' [years]`, () => {
		dp.inputs.minZoom$.set('y');
		dp.inputs.minDate$.set({ year: 2021, month: 2, day: 5 });
		dp.inputs.maxDate$.set({ year: 2026, month: 10, day: 5 });
		dp.inputs.markDisabled$.set((date) => date.equals({ year: 2024, month: 1, day: 1 }));

		dp.actions.open({ year: 2023, month: 1, day: 10 });
		expect(date(0, 0)).toEqual(d({ year: 2020, month: 1, day: 1 }));

		// visible, but before minDate
		dp.actions.select({ year: 2020, month: 1, day: 20 });
		expect(selections).toEqual([]);

		// visible, but after maxDate
		dp.actions.select({ year: 2027, month: 12, day: 6 });
		expect(selections).toEqual([]);

		// not visible
		dp.actions.select({ year: 2010, month: 1, day: 9 });
		expect(selections).toEqual([]);

		// not visible
		dp.actions.select({ year: 2050, month: 1, day: 9 });
		expect(selections).toEqual([]);

		// disabled
		dp.actions.select({ year: 2024, month: 4, day: 9 });
		expect(selections).toEqual([]);
	});

	it(`should navigate when selecting correct outside dates`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		expect(date(0, 0)).toEqual(d({ year: 2019, month: 12, day: 30 }));

		dp.actions.select({ year: 2019, month: 12, day: 31 });
		expect(selections).toEqual([d({ year: 2019, month: 12, day: 31 })]);
		expect(firstDate()).toEqual(d({ year: 2019, month: 12, day: 1 }));
	});

	it(`should zoom in when selecting dates`, () => {
		dp.inputs.zoom$.set('y');
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		expect(date(0, 0)).toEqual(d({ year: 2020, month: 1, day: 1 }));

		dp.actions.select({ year: 2024, month: 5, day: 6 });
		expect(selections).toEqual([]);
		expect(dp.state.zoom$()).toBe('m');
		expect(firstDate()).toEqual(d({ year: 2024, month: 1, day: 1 }));

		dp.actions.select({ year: 2024, month: 5, day: 6 });
		expect(selections).toEqual([]);
		expect(dp.state.zoom$()).toBe('d');
		expect(firstDate()).toEqual(d({ year: 2024, month: 5, day: 1 }));
	});

	it(`should navigate with 'zoomOut'`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		expect(dp.state.zoom$()).toBe('d');
		expect(firstDate()).toEqual(d({ year: 2020, month: 1, day: 1 }));

		// can zoom out
		dp.actions.zoomOut();
		expect(dp.state.zoom$()).toBe('m');
		expect(firstDate()).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(lastDate()).toEqual(d({ year: 2020, month: 12, day: 1 }));

		// can zoom out
		dp.actions.zoomOut();
		expect(dp.state.zoom$()).toBe('y');
		expect(firstDate()).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(lastDate()).toEqual(d({ year: 2039, month: 1, day: 1 }));

		// can't zoom out anymore
		dp.actions.zoomOut();
		expect(dp.state.zoom$()).toBe('y');
	});

	it(`should navigate with 'zoomIn'`, () => {
		dp.inputs.zoom$.set('y');
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		expect(firstDate()).toEqual(d({ year: 2020, month: 1, day: 1 }));

		// zooming in
		dp.actions.zoomIn({ year: 2024, month: 5, day: 6 });
		expect(dp.state.zoom$()).toBe('m');
		expect(firstDate()).toEqual(d({ year: 2024, month: 1, day: 1 }));
		expect(lastDate()).toEqual(d({ year: 2024, month: 12, day: 1 }));

		// zooming in
		dp.actions.zoomIn({ year: 2024, month: 5, day: 6 });
		expect(dp.state.zoom$()).toBe('d');
		expect(firstDate()).toEqual(d({ year: 2024, month: 5, day: 1 }));
		expect(lastDate()).toEqual(d({ year: 2024, month: 5, day: 31 }));

		// can't zoom in anymore
		dp.actions.zoomIn({ year: 2024, month: 5, day: 6 });
		expect(dp.state.zoom$()).toBe('d');
	});

	it(`should navigate to disabled dates with 'zoomIn'`, () => {
		dp.inputs.zoom$.set('m');
		dp.actions.open({ year: 2020, month: 1, day: 10 });
		dp.inputs.markDisabled$.set((date) => date.equals({ year: 2020, month: 5, day: 6 }));
		expect(firstDate()).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(lastDate()).toEqual(d({ year: 2020, month: 12, day: 1 }));

		// zooming in
		dp.actions.zoomIn({ year: 2020, month: 5, day: 6 });
		expect(dp.state.zoom$()).toBe('d');
		expect(firstDate()).toEqual(d({ year: 2020, month: 5, day: 1 }));
		expect(lastDate()).toEqual(d({ year: 2020, month: 5, day: 31 }));
	});

	it(`should not navigate to invalid dates with 'zoomIn()'`, () => {
		dp.inputs.zoom$.set('m');
		dp.inputs.minDate$.set({ year: 2020, month: 2, day: 5 });
		dp.inputs.maxDate$.set({ year: 2020, month: 10, day: 5 });
		dp.inputs.markDisabled$.set((date) => date.equals({ year: 2024, month: 1, day: 1 }));

		dp.actions.open({ year: 2020, month: 2, day: 10 });
		expect(firstDate()).toEqual(d({ year: 2020, month: 1, day: 1 }));

		// visible, but before minDate
		dp.actions.zoomIn({ year: 2020, month: 1, day: 20 });
		expect(dp.state.zoom$()).toBe('m');
		expect(firstDate()).toEqual(d({ year: 2020, month: 1, day: 1 }));

		// visible, but after maxDate
		dp.actions.zoomIn({ year: 2020, month: 11, day: 6 });
		expect(dp.state.zoom$()).toBe('m');
		expect(firstDate()).toEqual(d({ year: 2020, month: 1, day: 1 }));
	});

	it(`should generate 'firstDate' and 'lastDate' correctly`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });

		expect(dp.state.firstDate$()).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(dp.state.lastDate$()).toEqual(d({ year: 2020, month: 1, day: 31 }));

		dp.inputs.displayGrids$.set(2);
		expect(dp.state.firstDate$()).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(dp.state.lastDate$()).toEqual(d({ year: 2020, month: 2, day: 29 }));

		dp.actions.open({ year: 2020, month: 3, day: 1 });
		expect(dp.state.firstDate$()).toEqual(d({ year: 2020, month: 3, day: 1 }));
		expect(dp.state.lastDate$()).toEqual(d({ year: 2020, month: 4, day: 30 }));

		dp.inputs.zoom$.set('m');
		expect(dp.state.firstDate$()).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(dp.state.lastDate$()).toEqual(d({ year: 2021, month: 12, day: 1 }));
	});

	it(`should generate 'focusableDate' equal to today by default`, () => {
		let today = calendar.getToday();
		let firstDate = normalizeDate(today, 'm');

		expect(dp.state.firstDate$()).toEqual(firstDate);
		expect(dp.state.focusableDate$()).toEqual(today);
	});

	it(`should generate 'focusableDate' equal to today [days]`, () => {
		let today = calendar.getToday();
		let firstDate = normalizeDate(today, 'm');

		expect(dp.state.firstDate$()).toEqual(firstDate);
		expect(dp.state.focusableDate$()).toEqual(today);
	});

	it(`should generate 'focusableDate' equal to the first day of current month [months]`, () => {
		dp.inputs.zoom$.set('m');
		let today = calendar.getToday();
		let firstDayOfToday = normalizeDate(today, 'm');
		let firstDate = normalizeDate(today, 'y');

		expect(dp.state.firstDate$()).toEqual(firstDate);
		expect(dp.state.focusableDate$()).toEqual(firstDayOfToday);
	});

	it(`should generate 'focusableDate' equal to the first day of current year [years]`, () => {
		dp.inputs.zoom$.set('y');
		let today = calendar.getToday();
		let firstDayOfToday = normalizeDate(today, 'y');
		let firstDate = normalizeDate(today, 'yy');

		expect(dp.state.firstDate$()).toEqual(firstDate);
		expect(dp.state.focusableDate$()).toEqual(firstDayOfToday);
	});

	it(`should generate 'focusableDate' correctly [days]`, () => {
		dp.actions.open({ year: 2020, month: 1, day: 10 });

		expect(dp.state.focusableDate$()).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(focusableCells()).toEqual([[0, 2]]);

		dp.inputs.markDisabled$.set((date) => date.day < 10);
		expect(dp.state.focusableDate$()).toEqual(d({ year: 2020, month: 1, day: 10 }));
		expect(focusableCells()).toEqual([[1, 4]]);

		dp.actions.open({ year: 2020, month: 2, day: 14 });
		expect(dp.state.focusableDate$()).toEqual(d({ year: 2020, month: 2, day: 10 }));
		expect(focusableCells()).toEqual([[2, 0]]);

		dp.inputs.markDisabled$.set(() => true);
		expect(dp.state.focusableDate$()).toEqual(null);
		expect(focusableCells()).toEqual([]);
	});

	it(`should generate 'focusableDate' correctly [months]`, () => {
		dp.inputs.zoom$.set('m');
		dp.actions.open({ year: 2020, month: 3, day: 10 });

		expect(dp.state.focusableDate$()).toEqual(d({ year: 2020, month: 1, day: 1 }));
		expect(focusableCells()).toEqual([[0, 0]]);

		dp.inputs.markDisabled$.set((date) => date.month < 5);
		expect(dp.state.focusableDate$()).toEqual(d({ year: 2020, month: 5, day: 1 }));
		expect(focusableCells()).toEqual([[1, 0]]);

		dp.actions.open({ year: 2022, month: 2, day: 14 });
		expect(dp.state.focusableDate$()).toEqual(d({ year: 2022, month: 5, day: 1 }));
		expect(focusableCells()).toEqual([[1, 0]]);

		dp.inputs.markDisabled$.set(() => true);
		expect(dp.state.focusableDate$()).toEqual(null);
		expect(focusableCells()).toEqual([]);
	});

	xit(`should generate 'focusableDate' correctly [years]`, () => {
		dp.actions.zoomOut();
		dp.actions.open({ year: 2023, month: 2, day: 10 });

		expect(dp.state.focusableDate$()).toEqual(d({ year: 2020, month: 1, day: 1 }));
		// expect(focusableCells()).toEqual([[0, 0]]);

		// dp.inputs.markDisabled$.set((date) => date.month < 5);
		// expect(dp.state.focusableDate$()).toEqual(d({ year: 2020, month: 5, day: 1 }));
		//
		// dp.actions.open({ year: 2022, month: 2, day: 14 });
		// expect(dp.state.focusableDate$()).toEqual(d({ year: 2022, month: 5, day: 1 }));
		//
		// dp.inputs.markDisabled$.set(() => true);
		// expect(dp.state.focusableDate$()).toEqual(null);
	});
});
