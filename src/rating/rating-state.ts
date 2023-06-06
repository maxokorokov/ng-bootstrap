import { computed, inject, InjectionToken, Signal, signal } from '@angular/core';
import { NgbRatingConfig } from './rating-config';

export interface StarContext {
	fill: number;
	index: number;
}

export interface RatingProps {
	rating: number;
	readonly: boolean;
	resettable: boolean;
	maxRating: number;
	tabindex: number;
	disabled: boolean;
	onHover: (rating: number) => void;
	onLeave: (rating: number) => void;
}

export interface RatingState {
	rating: Signal<number>;
	visibleRating: Signal<number>;
	maxRating: Signal<number>;
	disabled: Signal<boolean>;
	resettable: Signal<boolean>;
	readonly: Signal<boolean>;
	isInteractive: Signal<boolean>;
	stars: Signal<StarContext[]>;
	tabindex: Signal<number>;
}

export interface RatingMethods {
	click(index: number): void;
	hover(index: number): void;
	leave(): void;
}

export type RatingApi = {
	patch(parameters: Partial<RatingProps>): void;
	user: RatingMethods;
} & RatingState;

export const NGB_RATING_API = new InjectionToken('ngb-rating-api', {
	factory: createRating,
});

function adjustRating(value: number, max: number): number {
	return Math.max(Math.min(value, max), 0);
}

export function createRating(): RatingApi {
	let cfg = inject(NgbRatingConfig);

	// dirty inputs
	let _dirtyRating = signal(0);
	let _dirtyTabindex = signal(cfg.tabindex);

	// internal inputs
	const _hoveredRating = signal(0);

	// inputs
	let maxRating = signal(cfg.max);
	let disabled = signal(false);
	let readonly = signal(cfg.readonly);
	let resettable = signal(cfg.resettable);

	let onHover = signal((rating: number) => {});
	let onLeave = signal((rating: number) => {});

	// computed
	let rating = computed(() => {
		let adjusted = adjustRating(_dirtyRating(), maxRating());
		if (adjusted !== _dirtyRating()) {
			_dirtyRating.set(adjusted);
		}
		return adjusted;
	});
	let tabindex = computed(() => (disabled() ? -1 : parseInt(`${_dirtyTabindex()}`)));
	let visibleRating = computed(() => (_hoveredRating() !== 0 ? _hoveredRating() : rating()));
	let isInteractive = computed(() => !disabled() && !readonly());
	let stars = computed(() =>
		Array.from({ length: maxRating() }, (v, i) => ({
			fill: Math.round(Math.max(Math.min(visibleRating() - i, 1), 0) * 100),
			index: i,
		})),
	);

	return {
		patch(p: Partial<RatingProps>) {
			if (p.rating !== undefined) {
				_dirtyRating.set(p.rating);
			}
			if (p.maxRating !== undefined) {
				maxRating.set(p.maxRating);
			}
			if (p.resettable !== undefined) {
				resettable.set(p.resettable);
			}
			if (p.readonly !== undefined) {
				readonly.set(p.readonly);
			}
			if (p.tabindex !== undefined) {
				_dirtyTabindex.set(p.tabindex);
			}
			if (p.disabled !== undefined) {
				disabled.set(p.disabled);
			}
		},
		user: {
			click: (index: number) => {
				if (isInteractive() && index > 0 && index <= maxRating()) {
					this.patch({ rating: rating() === index && resettable() ? 0 : index });
				}
			},
			hover: (index: number) => {
				if (isInteractive() && index > 0 && index <= maxRating()) {
					_hoveredRating.set(index);
					onHover()(index);
				}
			},
			leave: () => {
				if (isInteractive()) {
					onLeave()(_hoveredRating());
					_hoveredRating.set(0);
				}
			},
		},
		rating,
		visibleRating,
		resettable,
		isInteractive,
		stars,
		tabindex,
		readonly,
		maxRating: maxRating.asReadonly(),
		disabled: disabled.asReadonly(),
	};
}
