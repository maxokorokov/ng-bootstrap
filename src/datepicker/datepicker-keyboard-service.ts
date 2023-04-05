import { Injectable } from '@angular/core';
import { NgbDatepicker } from './datepicker';
import { Key } from '../util/key';
import { NgbDatepickerZoom } from './ngb-calendar';

/**
 * A service that represents the keyboard navigation.
 *
 * Default keyboard shortcuts [are documented in the overview](#/components/datepicker/overview#keyboard-shortcuts)
 *
 * @since 5.2.0
 */
@Injectable({ providedIn: 'root' })
export class NgbDatepickerKeyboardService {
	/**
	 * Processes a keyboard event.
	 */
	processKey(event: KeyboardEvent, datepicker: NgbDatepicker, zoom: NgbDatepickerZoom) {
		const { state, calendar } = datepicker;
		const [, COLUMNS] = calendar.getGridForZoom(state.focusedDate, zoom);
		/* eslint-disable-next-line deprecation/deprecation */
		switch (event.which) {
			case Key.PageUp:
				switch (zoom) {
					case 'days':
						datepicker.focusDate(calendar.getPrev(state.focusedDate, event.shiftKey ? 'y' : 'm', 1));
						break;
					case 'months':
						datepicker.focusDate(calendar.getPrev(state.focusedDate, 'y', event.shiftKey ? 10 : 1));
						break;
				}
				break;
			case Key.PageDown:
				switch (zoom) {
					case 'days':
						datepicker.focusDate(calendar.getNext(state.focusedDate, event.shiftKey ? 'y' : 'm', 1));
						break;
					case 'months':
						datepicker.focusDate(calendar.getNext(state.focusedDate, 'y', event.shiftKey ? 10 : 1));
						break;
				}
				break;
			case Key.End:
				datepicker.focusDate(event.shiftKey ? state.maxDate : state.lastDate);
				break;
			case Key.Home:
				datepicker.focusDate(event.shiftKey ? state.minDate : state.firstDate);
				break;
			case Key.ArrowLeft:
				switch (zoom) {
					case 'days':
						datepicker.focusDate(calendar.getPrev(state.focusedDate, 'd', 1));
						break;
					case 'months':
						datepicker.focusDate(calendar.getPrev(state.focusedDate, 'm', 1));
						break;
					case 'years':
						datepicker.focusDate(calendar.getPrev(state.focusedDate, 'y', 1));
						break;
				}
				break;

			case Key.ArrowUp:
				switch (zoom) {
					case 'days':
						datepicker.focusDate(calendar.getPrev(state.focusedDate, 'd', COLUMNS));
						break;
					case 'months':
						datepicker.focusDate(calendar.getPrev(state.focusedDate, 'm', COLUMNS));
						break;
					case 'years':
						datepicker.focusDate(calendar.getPrev(state.focusedDate, 'y', COLUMNS));
						break;
				}
				break;
			case Key.ArrowRight:
				switch (zoom) {
					case 'days':
						datepicker.focusDate(calendar.getNext(state.focusedDate, 'd', 1));
						break;
					case 'months':
						datepicker.focusDate(calendar.getNext(state.focusedDate, 'm', 1));
						break;
					case 'years':
						datepicker.focusDate(calendar.getNext(state.focusedDate, 'y', 1));
						break;
				}
				break;
			case Key.ArrowDown:
				switch (zoom) {
					case 'days':
						datepicker.focusDate(calendar.getNext(state.focusedDate, 'd', COLUMNS));
						break;
					case 'months':
						datepicker.focusDate(calendar.getNext(state.focusedDate, 'm', COLUMNS));
						break;
					case 'years':
						datepicker.focusDate(calendar.getNext(state.focusedDate, 'y', COLUMNS));
						break;
				}
				break;
			case Key.Enter:
			case Key.Space:
				datepicker.focusSelect();
				break;
			default:
				return;
		}
		event.preventDefault();
		event.stopPropagation();
	}
}
