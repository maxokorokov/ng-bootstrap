import {NgbDate} from './ngb-date';
import {CellModel, DatepickerViewModel, GridModel, GridMonthContext} from './datepicker-view-model';
import {NgbCalendar, NgbDatepickerZoom} from './ngb-calendar';
import {NgbDatepickerI18n} from './datepicker-i18n';

export function isChangedDate(prev?: NgbDate | null, next?: NgbDate | null): boolean {
  return !dateComparator(prev, next);
}

export function isChangedMonth(prev?: NgbDate | null, next?: NgbDate | null): boolean {
  return !prev && !next ? false : !prev || !next ? true : prev.year !== next.year || prev.month !== next.month;
}

export function dateComparator(prev?: NgbDate | null, next?: NgbDate | null): boolean {
  return (!prev && !next) || (!!prev && !!next && prev.equals(next));
}

export function checkMinBeforeMax(minDate?: NgbDate | null, maxDate?: NgbDate | null): void {
  if (maxDate && minDate && maxDate.before(minDate)) {
    throw new Error(`'maxDate' ${maxDate} should be greater than 'minDate' ${minDate}`);
  }
}

export function checkDateInRange(date?: NgbDate | null, minDate?: NgbDate | null, maxDate?: NgbDate | null): NgbDate |
    null {
  if (date && minDate && date.before(minDate)) {
    return minDate;
  }
  if (date && maxDate && date.after(maxDate)) {
    return maxDate;
  }

  return date || null;
}

export function isDateSelectable(date: NgbDate | null | undefined, state: DatepickerViewModel) {
  const {minDate, maxDate, disabled, markDisabled} = state;
  // clang-format off
  return !(
    date === null ||
    date === undefined ||
    disabled ||
    (markDisabled && markDisabled(date, {year: date.year, month: date.month})) ||
    (minDate && date.before(minDate)) ||
    (maxDate && date.after(maxDate))
  );
  // clang-format on
}

export function generateSelectBoxMonths(
    calendar: NgbCalendar, date: NgbDate, minDate: NgbDate | null, maxDate: NgbDate | null) {
  if (!date) {
    return [];
  }

  let months = calendar.getMonths(date.year);

  if (minDate && date.year === minDate.year) {
    const index = months.findIndex(month => month === minDate.month);
    months = months.slice(index);
  }

  if (maxDate && date.year === maxDate.year) {
    const index = months.findIndex(month => month === maxDate.month);
    months = months.slice(0, index + 1);
  }

  return months;
}

export function generateSelectBoxYears(date: NgbDate, minDate: NgbDate | null, maxDate: NgbDate | null) {
  if (!date) {
    return [];
  }

  const start = minDate ? Math.max(minDate.year, date.year - 500) : date.year - 10;
  const end = maxDate ? Math.min(maxDate.year, date.year + 500) : date.year + 10;

  const length = end - start + 1;
  const numbers = Array(length);
  for (let i = 0; i < length; i++) {
    numbers[i] = start + i;
  }

  return numbers;
}

export function nextMonthDisabled(calendar: NgbCalendar, date: NgbDate, maxDate: NgbDate | null) {
  const nextDate = Object.assign(calendar.getNext(date, 'm'), {day: 1});
  return maxDate != null && nextDate.after(maxDate);
}

export function prevMonthDisabled(calendar: NgbCalendar, date: NgbDate, minDate: NgbDate | null) {
  const prevDate = Object.assign(calendar.getPrev(date, 'm'), {day: 1});
  return minDate != null && (prevDate.year === minDate.year && prevDate.month < minDate.month ||
                             prevDate.year < minDate.year && minDate.month === 1);
}

const ZOOM_LEVELS: NgbDatepickerZoom[] = ['days', 'months', 'years'];

export function zoomIn(zoom: NgbDatepickerZoom): NgbDatepickerZoom {
  return ZOOM_LEVELS[Math.max(ZOOM_LEVELS.indexOf(zoom) - 1, 0)];
}

export function zoomOut(zoom: NgbDatepickerZoom): NgbDatepickerZoom {
  return ZOOM_LEVELS[Math.min(ZOOM_LEVELS.indexOf(zoom) + 1, ZOOM_LEVELS.length - 1)];
}

export function buildGrids(
    calendar: NgbCalendar, date: NgbDate, state: DatepickerViewModel, i18n: NgbDatepickerI18n, force: boolean,
    zoomChange: boolean): GridModel[] {
    const {displayMonths, grids, zoom} = state;
    // move old grids to a temporary array, erase everything in case of zoom change
    const gridsToReuse = zoomChange ? [] : grids.splice(0, grids.length);

    // generate new first dates, nullify or reuse grids
    // TODO: take zoom level into account
    const firstDates = Array.from({length: displayMonths}, (_, i) => {

    let firstDate = date;

    switch (zoom) {
      case 'days':
          firstDate = Object.assign(calendar.getNext(date, 'm', i), {day: 1});
        break;
      case 'months':
          firstDate = Object.assign(calendar.getNext(date, 'y', i), {month: 1, day: 1});
        break;
        case 'years':
          const [rows, columns] = calendar.getGridForZoom(date, 'years');
          firstDate = Object.assign(calendar.getNext(date, 'y', i * columns * rows), {month: 1, day: 1});
        break;
    }

    grids[i] = <any>null;

    if (!force) {
      const reusedIndex = gridsToReuse.findIndex(grid => grid.firstDate.equals(firstDate));
      // move reused month back to grids
      if (reusedIndex !== -1) {
        grids[i] = gridsToReuse.splice(reusedIndex, 1)[0];
      }
    }

    return firstDate;
  });

  // rebuild nullified grids
  firstDates.forEach((firstDate, i) => {
    if (grids[i] === null) {
      switch (state.zoom) {
        case 'days':
          grids[i] = buildMonthGrid(calendar, firstDate, state, i18n, gridsToReuse.shift() || {} as GridModel);
          break;
        case 'months':
          grids[i] = buildYearGrid(calendar, firstDate, state, i18n, gridsToReuse.shift() || {} as GridModel);
          break;
        case 'years':
          grids[i] = buildDecadeGrid(calendar, firstDate, state, i18n, gridsToReuse.shift() || {} as GridModel);
      }
    }
  });

  return grids;
}

export function buildMonthGrid(
    calendar: NgbCalendar, date: NgbDate, state: DatepickerViewModel, i18n: NgbDatepickerI18n,
    grid: GridModel = {} as GridModel): GridModel {
  const {dayTemplateData, minDate,         maxDate, firstDayOfWeek, markDisabled, outsideDays,
         weekdayWidth,    weekdaysVisible, zoom} = state;
  const calendarToday = calendar.getToday();

  grid.firstDate = <any>null;
  grid.lastDate = <any>null;
  grid.zoom = 'days';
  grid.rows = grid.rows || [];
  grid.context = {
    month: date.month,
    year: date.year,
    weekdays: (grid.context as GridMonthContext)?.weekdays || []
  }

  date = getFirstViewDate(calendar, date, firstDayOfWeek);

  // clearing weekdays, if not visible
  if (!weekdaysVisible) {
    grid.context.weekdays.length = 0;
  }

  const[ROWS, COLUMNS] = calendar.getGridForZoom(date, grid.zoom);

  // month has weeks
  for (let week = 0; week < ROWS; week++) {
    let weekObject = grid.rows[week];
    if (!weekObject) {
      weekObject = grid.rows[week] = {cells: [], context: {week}};
    }
    const days = weekObject.cells;

    // week has days
    for (let day = 0; day < COLUMNS; day++) {
      if (week === 0 && weekdaysVisible) {
        grid.context.weekdays[day] = i18n.getWeekdayLabel(calendar.getWeekday(date), weekdayWidth);
      }

      const newDate = new NgbDate(date.year, date.month, date.day);
      const nextDate = calendar.getNext(newDate);

      const ariaLabel = i18n.getDayAriaLabel(newDate);

      // marking date as disabled
      let disabled = !!((minDate && newDate.before(minDate)) || (maxDate && newDate.after(maxDate)));
      if (!disabled && markDisabled) {
        disabled = markDisabled(newDate, {month: grid.context.month, year: grid.context.year});
      }

      // today
      let today = newDate.equals(calendarToday);

      // adding user-provided data to the context
      let contextUserData =
          dayTemplateData ? dayTemplateData(newDate, {month: grid.context.month, year: grid.context.year}) : undefined;

      // saving first date of the month
      if (grid.firstDate === null && newDate.month === grid.context.month) {
        grid.firstDate = newDate;
      }

      // saving last date of the month
      if (newDate.month === grid.context.month && nextDate.month !== grid.context.month) {
        grid.lastDate = newDate;
      }

      let dayObject = days[day];
      if (!dayObject) {
        dayObject = days[day] = {} as CellModel;
      }
      dayObject.date = newDate;
      dayObject.context = Object.assign(dayObject.context || {}, {
        $implicit: newDate,
        date: newDate,
        data: contextUserData,
        currentMonth: grid.context.month,
        currentYear: grid.context.year, disabled,
        parentDate: new NgbDate(grid.context.year, grid.context.month, 1),
        focused: false,
        selected: false, today, zoom
      });
      dayObject.tabindex = -1;
      dayObject.ariaLabel = ariaLabel;
      dayObject.hidden = false;

      date = nextDate;
    }

    weekObject.context !.week = calendar.getWeekNumber(days.map(day => day.date), firstDayOfWeek);
  }

  return grid;
}

export function buildYearGrid(
    calendar: NgbCalendar, date: NgbDate, state: DatepickerViewModel, i18n: NgbDatepickerI18n,
    grid: GridModel = {} as GridModel): GridModel {
  const {dayTemplateData, minDate, maxDate, markDisabled, zoom} = state;
  const calendarToday = calendar.getToday();

  grid.firstDate = <any>null;
  grid.lastDate = <any>null;
  grid.zoom = 'months';
  grid.rows = grid.rows || [];
  grid.context = {
    year: date.year,
  };

  const[ROWS, COLUMNS] = calendar.getGridForZoom(date, grid.zoom);

  date = getFirstViewMonth(calendar, date);

  // years has month rows
  for (let row = 0; row < ROWS; row++) {
    let rowObject = grid.rows[row];
    if (!rowObject) {
      rowObject = grid.rows[row] = {cells: []};
    }
    const months = rowObject.cells;

    // row has months
    for (let month = 0; month < COLUMNS; month++) {
      const newDate = new NgbDate(date.year, date.month, date.day);
      const nextDate = calendar.getNext(newDate, 'm');

      // TODO: generate month aria label
      const ariaLabel = 'NO ARIA LABEL YET';  // i18n.getDayAriaLabel(newDate);

      // marking date as disabled
      let disabled = !!((minDate && newDate.before(minDate)) || (maxDate && newDate.after(maxDate)));
      if (!disabled && markDisabled) {
        disabled = markDisabled(newDate, {month: nextDate.month, year: grid.context.year});
      }

      // today
      let today = newDate.equals(calendarToday);

      // adding user-provided data to the context
      let contextUserData =
          dayTemplateData ? dayTemplateData(newDate, {month: nextDate.month, year: grid.context.year}) : undefined;

      // saving first date of the month
      if (grid.firstDate === null) {
        grid.firstDate = newDate;
      }

      let monthObject = months[month];
      if (!monthObject) {
        monthObject = months[month] = {} as CellModel;
      }
      monthObject.date = newDate;
      monthObject.context = Object.assign(monthObject.context || {}, {
        $implicit: newDate,
        date: newDate,
        data: contextUserData,
        currentYear: grid.context.year, disabled,
        focused: false,
        selected: false, today, zoom
      });
      monthObject.tabindex = -1;
      monthObject.ariaLabel = ariaLabel;

      date = nextDate;

      if (newDate.year === grid.context.year && nextDate.year !== newDate.year) {
        grid.lastDate = newDate;
      }
    }
  }

  return grid;
}

export function buildDecadeGrid(
    calendar: NgbCalendar, date: NgbDate, state: DatepickerViewModel, i18n: NgbDatepickerI18n,
    grid: GridModel = {} as GridModel): GridModel {
  const {dayTemplateData, minDate, maxDate, markDisabled, zoom} = state;
  const calendarToday = calendar.getToday();

  grid.firstDate = <any>null;
  grid.lastDate = <any>null;
  grid.zoom = 'years';
  grid.rows = grid.rows || [];
  grid.context = {
    year: date.year,
  };

  const[ROWS, COLUMNS] = calendar.getGridForZoom(date, grid.zoom);

  date = getFirstViewYear(calendar, date);
  grid.lastDate = calendar.getNext(date, 'y', COLUMNS * ROWS - 1);

  // years has month rows
  for (let row = 0; row < ROWS; row++) {
    let rowObject = grid.rows[row];
    if (!rowObject) {
      rowObject = grid.rows[row] = {cells: []};
    }
    const months = rowObject.cells;

    // row has months
    for (let month = 0; month < COLUMNS; month++) {
      const newDate = new NgbDate(date.year, date.month, date.day);
      const nextDate = calendar.getNext(newDate, 'y', 1);

      // TODO: generate month aria label
      const ariaLabel = 'NO ARIA LABEL YET';  // i18n.getDayAriaLabel(newDate);

      // marking date as disabled
      let disabled = !!((minDate && newDate.before(minDate)) || (maxDate && newDate.after(maxDate)));
      if (!disabled && markDisabled) {
        disabled = markDisabled(newDate, {month: nextDate.month, year: grid.context.year});
      }

      // today
      let today = newDate.equals(calendarToday);

      // adding user-provided data to the context
      let contextUserData =
          dayTemplateData ? dayTemplateData(newDate, {month: nextDate.month, year: grid.context.year}) : undefined;

      // saving first date of the month
      if (grid.firstDate === null) {
        grid.firstDate = newDate;
      }

      let monthObject = months[month];
      if (!monthObject) {
        monthObject = months[month] = {} as CellModel;
      }
      monthObject.date = newDate;
      monthObject.context = Object.assign(monthObject.context || {}, {
        $implicit: newDate,
        date: newDate,
        data: contextUserData,
        currentYear: grid.context.year, disabled,
        focused: false,
        selected: false, today, zoom
      });
      monthObject.tabindex = -1;
      monthObject.ariaLabel = ariaLabel;

      date = nextDate;
    }
  }

  return grid;
}

export function getFirstViewDate(calendar: NgbCalendar, date: NgbDate, firstDayOfWeek: number): NgbDate {
  const daysPerWeek = calendar.getDaysPerWeek();
  const firstMonthDate = new NgbDate(date.year, date.month, 1);
  const dayOfWeek = calendar.getWeekday(firstMonthDate) % daysPerWeek;
  return calendar.getPrev(firstMonthDate, 'd', (daysPerWeek + dayOfWeek - firstDayOfWeek) % daysPerWeek);
}

export function getFirstViewMonth(calendar: NgbCalendar, month: NgbDate): NgbDate {
  let firstMonth = month, prevMonth = calendar.getPrev(month, 'm', 1);
  while (firstMonth.year === prevMonth.year) {
    firstMonth = prevMonth;
    prevMonth = calendar.getPrev(firstMonth, 'm', 1);
  }
  return firstMonth;
}

export function getFirstViewYear(calendar: NgbCalendar, year: NgbDate): NgbDate {
  let firstYear = year, prevYear = calendar.getPrev(year, 'y', 1);
  const [rows, column] = calendar.getGridForZoom(firstYear, 'years');
  while (firstYear.year % (rows * column) !== 0) {
    firstYear = prevYear;
    prevYear = calendar.getPrev(firstYear, 'y', 1);
  }
  return firstYear;
}
