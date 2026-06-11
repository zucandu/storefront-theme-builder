<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import {
    TransitionRoot, TransitionChild,
    Dialog, DialogPanel, DialogTitle,
} from '@headlessui/vue';
import { useI18n } from 'vue-i18n';
import { useBookingAvailability } from '@/composables/useBookingAvailability';

/**
 * BookingCalendarModal — storefront calendar for booking products (TB.9.3.2).
 *
 * Self-contained: pass `productId` + `:open` and listen for `select`. The
 * modal fetches its own availability via `useBookingAvailability` (TB.9.3.1
 * endpoint), runs a one-click range-select state machine (idle → check-in →
 * range → confirm), and emits `{start, end}` only when the customer hits
 * the explicit Confirm button in the footer.
 *
 * See `docs/TB_9_3_2_BOOKING_CALENDAR_MODAL.md` for the full spec.
 */
const props = defineProps({
    productId: { type: [Number, String], required: true },
    open: { type: Boolean, default: false },
    initialStart: { type: String, default: null }, // 'YYYY-MM-DD' or null
    initialEnd: { type: String, default: null },
    firstDayOfWeek: { type: Number, default: 1 }, // 0=Sun, 1=Mon

    // Selection mode:
    //   'range'  — hotel-style check-in / check-out (default, legacy).
    //   'single' — pick one date; emit `{start, end: null}` on Confirm.
    //              Used by single-day services (dog walking, salon visits)
    //              where the product has booking_end_attribute_option_id
    //              null and the backend derives bEnd = bStart + 1 day at
    //              occupancy time.
    mode: { type: String, default: 'range' },
});

const isSingleMode = computed(() => props.mode === 'single');

// Footer Confirm button enables when:
//   - range mode: both start AND end picked (full [checkin, checkout))
//   - single mode: just start picked (end stays null by design)
// Templated as a single computed so the disabled style + aria-disabled
// stay in sync without two parallel ternaries in the template.
const confirmDisabled = computed(() => {
    if (isSingleMode.value) return !start.value;
    return !start.value || !end.value;
});

const emit = defineEmits(['update:open', 'select']);

const { locale, t } = useI18n();

// ─────────────────────────────────────────────────────────────────────────
// Date helpers — timezone-safe (string-based comparisons, no Date for math).
// ALL dates flow through 'YYYY-MM-DD' strings. NEW Date(string) is FORBIDDEN
// (parses as UTC, shifts in non-UTC zones); always `new Date(y, m-1, d)`.
// ─────────────────────────────────────────────────────────────────────────

function pad2(n) { return String(n).padStart(2, '0'); }

function ymd(year, month, day) {
    return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseYmd(str) {
    const [y, m, d] = str.split('-').map(Number);
    return { y, m, d };
}

function todayYmd() {
    const d = new Date();
    return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function daysInMonth(year, month) {
    // Day 0 of next month = last day of this month. month is 1-indexed.
    return new Date(year, month, 0).getDate();
}

function dayOfWeek(year, month, day) {
    // 0=Sun, 1=Mon, ..., 6=Sat — JS Date convention.
    return new Date(year, month - 1, day).getDay();
}

function addDays(yyyymmdd, n) {
    const { y, m, d } = parseYmd(yyyymmdd);
    const dt = new Date(y, m - 1, d + n);
    return ymd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

function diffDays(a, b) {
    // Count of nights between two YYYY-MM-DD strings (b > a). Uses Date
    // arithmetic but ONLY through the local-time constructor — safe.
    const A = parseYmd(a), B = parseYmd(b);
    const dA = new Date(A.y, A.m - 1, A.d);
    const dB = new Date(B.y, B.m - 1, B.d);
    return Math.round((dB - dA) / 86400000);
}

function shiftMonth(year, month, delta) {
    // Returns {year, month} shifted by delta months (delta can be negative).
    const total = year * 12 + (month - 1) + delta;
    return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

// ─────────────────────────────────────────────────────────────────────────
// Reactive state
// ─────────────────────────────────────────────────────────────────────────

const today = ref(todayYmd());

// Visible viewport — left month on desktop 2-month layout. Mobile + small
// screens show only this one.
const viewYear = ref(0);
const viewMonth = ref(0);

// Range selection state machine
//   IDLE (start=null, end=null)
//   CHECKIN_SELECTED (start='YYYY-MM-DD', end=null)
//   RANGE_SELECTED (start, end both set)
const start = ref(null);
const end = ref(null);
const hoverDay = ref(null); // for preview range while in CHECKIN_SELECTED
const focusedDay = ref(null); // roving tabindex anchor — YYYY-MM-DD string

// Two-month desktop layout flag — read once on mount, no listener needed
// (unlikely to cross md breakpoint mid-modal-session).
const showTwoMonths = ref(false);

const dialogRef = ref(null);
const liveRegion = ref(null);
let liveRegionDebounce = null;

// Restore focus on close — captured when modal opens.
let triggerEl = null;

const {
    loading, error, horizonMaxDate,
    loadMonth, prefetchMonth, invalidate, getCached,
} = useBookingAvailability(props.productId);

// ─────────────────────────────────────────────────────────────────────────
// Derived state
// ─────────────────────────────────────────────────────────────────────────

const rightView = computed(() => shiftMonth(viewYear.value, viewMonth.value, 1));

const leftMonthData = computed(() => getCached(viewYear.value, viewMonth.value));
const rightMonthData = computed(() =>
    showTwoMonths.value ? getCached(rightView.value.year, rightView.value.month) : null
);

/**
 * Combined sorted list of unavailable dates across the months we currently
 * have data for. Used by `firstBlockerAfter()` to compute the span-blocking
 * cap once a check-in is picked. Recomputes when cache fills in (the
 * composable's cache map identity changes on `set()`).
 */
const knownUnavailable = computed(() => {
    const all = [];
    if (leftMonthData.value) all.push(...leftMonthData.value.unavailable_dates);
    if (rightMonthData.value) all.push(...rightMonthData.value.unavailable_dates);
    // Also include any other prefetched months (uncommon but possible).
    return all.sort();
});

const knownPartial = computed(() => {
    const set = new Set();
    if (leftMonthData.value) leftMonthData.value.partial_dates.forEach(d => set.add(d));
    if (rightMonthData.value) rightMonthData.value.partial_dates.forEach(d => set.add(d));
    return set;
});

const knownUnavailableSet = computed(() => new Set(knownUnavailable.value));

/**
 * After check-in is picked, find the first known unavailable day strictly
 * after start. Customers can checkout ON that day (checkout-day exclusive)
 * but not span beyond it. Returns null when no blocker is known — caller
 * treats the visible boundary as the cap pending prefetch.
 */
const firstBlockerAfterStart = computed(() => {
    if (!start.value) return null;
    return knownUnavailable.value.find(d => d > start.value) ?? null;
});

const horizonExclusive = computed(() => {
    // horizon_max_date is the inclusive last-bookable day. Add one day for
    // exclusive comparisons (cell is past horizon iff its date > horizonMax).
    if (!horizonMaxDate.value) return null;
    return horizonMaxDate.value;
});

const isPrevDisabled = computed(() => {
    // Don't allow navigating to a month entirely before the current month
    // (no past months — bookings don't go backward).
    const t = parseYmd(today.value);
    return viewYear.value < t.y || (viewYear.value === t.y && viewMonth.value <= t.m);
});

const isNextDisabled = computed(() => {
    if (!horizonMaxDate.value) return false;
    const h = parseYmd(horizonMaxDate.value);
    // Next-arrow target = current view + 1 (or +2 if showing 2 months).
    const target = shiftMonth(viewYear.value, viewMonth.value, showTwoMonths.value ? 2 : 1);
    // Disable when the FIRST day of target month is already past horizon.
    return target.year > h.y || (target.year === h.y && target.month > h.m);
});

const nightsCount = computed(() => {
    if (!start.value || !end.value) return 0;
    return diffDays(start.value, end.value);
});

// ─────────────────────────────────────────────────────────────────────────
// Cell-state classifier — returns one of:
//   'available' | 'today' | 'in-range' | 'range-start' | 'range-end' |
//   'unavailable' | 'partial' | 'past' | 'beyond-horizon' | 'span-blocked' |
//   'overflow'
// Spec sections 3 + corresponding states (a)–(l).
// ─────────────────────────────────────────────────────────────────────────

function cellState(yyyymmdd, isOverflow) {
    if (isOverflow) return 'overflow';

    // Past
    if (yyyymmdd < today.value) return 'past';

    // Beyond horizon
    if (horizonExclusive.value && yyyymmdd > horizonExclusive.value) {
        return 'beyond-horizon';
    }

    const isUnavailable = knownUnavailableSet.value.has(yyyymmdd);
    if (isUnavailable) return 'unavailable';

    // Range start/end (single mode reuses 'range-start' for the lone pick
    // so it gets the same highlight treatment as range mode's check-in).
    if (start.value === yyyymmdd) return 'range-start';
    if (end.value === yyyymmdd) return 'range-end';

    // The remaining range/preview/span-blocked branches are range-mode only.
    // Single mode never enters them — it has no "between" state and no
    // span-crossing concern (the booking is always exactly 1 day).
    if (isSingleMode.value) {
        if (knownPartial.value.has(yyyymmdd)) return 'partial';
        return 'available';
    }

    // In-range (between start and end inclusive of intermediates)
    if (start.value && end.value && yyyymmdd > start.value && yyyymmdd < end.value) {
        return 'in-range';
    }

    // Hover preview range while CHECKIN_SELECTED
    if (start.value && !end.value && hoverDay.value && hoverDay.value > start.value) {
        if (yyyymmdd > start.value && yyyymmdd < hoverDay.value) {
            // Cap preview at first blocker
            if (!firstBlockerAfterStart.value || hoverDay.value <= firstBlockerAfterStart.value) {
                return 'in-range';
            }
        }
        if (yyyymmdd === hoverDay.value
            && (!firstBlockerAfterStart.value || hoverDay.value <= firstBlockerAfterStart.value)) {
            return 'range-end';
        }
    }

    // Span-blocked (after check-in, can't reach this day without crossing unavailable)
    if (start.value && !end.value && firstBlockerAfterStart.value
        && yyyymmdd > firstBlockerAfterStart.value) {
        return 'span-blocked';
    }

    // Partial
    if (knownPartial.value.has(yyyymmdd)) return 'partial';

    // Today (only if no other state claimed it)
    if (yyyymmdd === today.value) return 'today';

    return 'available';
}

function isInteractive(state) {
    return ['available', 'today', 'partial', 'range-start', 'range-end', 'in-range'].includes(state);
}

// ─────────────────────────────────────────────────────────────────────────
// Cell visual classes per state. Centralised so dark mode + a11y stay
// in lockstep with the spec's visual table.
// ─────────────────────────────────────────────────────────────────────────

function cellClasses(state) {
    const base = 'relative flex items-center justify-center text-sm font-medium select-none w-11 h-11';
    switch (state) {
        case 'available':
            return `${base} rounded-full text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors`;
        case 'today':
            return `${base} rounded-full text-blue-600 dark:text-cyan-400 font-semibold ring-1 ring-blue-400 dark:ring-cyan-600 hover:bg-blue-50 dark:hover:bg-cyan-900/20 cursor-pointer transition-colors`;
        case 'partial':
            return `${base} rounded-full text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors`;
        case 'in-range':
            return `${base} bg-blue-100 dark:bg-cyan-900/30 text-gray-900 dark:text-gray-100 cursor-pointer`;
        case 'range-start':
            return `${base} bg-blue-600 dark:bg-cyan-700 text-white font-bold rounded-l-full ${end.value ? '' : 'rounded-r-full'} cursor-pointer`;
        case 'range-end':
            return `${base} bg-blue-600 dark:bg-cyan-700 text-white font-bold rounded-r-full cursor-pointer`;
        case 'unavailable':
            return `${base} rounded-full text-gray-500 dark:text-slate-400 line-through cursor-not-allowed`;
        case 'past':
            return `${base} rounded-full text-gray-400 dark:text-slate-500 cursor-not-allowed`;
        case 'beyond-horizon':
            return `${base} rounded-full text-gray-400 dark:text-slate-500 cursor-not-allowed`;
        case 'span-blocked':
            return `${base} rounded-full text-gray-400 dark:text-slate-500 cursor-not-allowed bg-gray-50 dark:bg-slate-800/50 ring-1 ring-dashed ring-gray-300 dark:ring-slate-600`;
        case 'overflow':
            return `${base} text-gray-300 dark:text-slate-600 pointer-events-none`;
        default:
            return base;
    }
}

// ─────────────────────────────────────────────────────────────────────────
// ARIA label composition (locale-aware, state at end per WCAG/APG guidance)
// ─────────────────────────────────────────────────────────────────────────

const ariaDateFormatter = computed(() => {
    try {
        return new Intl.DateTimeFormat(locale.value, { dateStyle: 'full' });
    } catch {
        return new Intl.DateTimeFormat('en', { dateStyle: 'full' });
    }
});

function formatAriaDate(yyyymmdd) {
    const { y, m, d } = parseYmd(yyyymmdd);
    return ariaDateFormatter.value.format(new Date(y, m - 1, d));
}

function cellAriaLabel(yyyymmdd, state) {
    const dateText = state === 'today'
        ? `${t('Today')}, ${formatAriaDate(yyyymmdd)}`
        : formatAriaDate(yyyymmdd);

    switch (state) {
        case 'available':
        case 'today':
            return `${dateText}, ${t('available')}`;
        case 'partial': {
            // We don't expose the actual room count from the endpoint —
            // partial just means "0 < occupancy < capacity". Speak the
            // generic version. If room count gets surfaced later, slot it in.
            return `${dateText}, ${t('partially booked')}`;
        }
        case 'unavailable':
            return `${dateText}, ${t('unavailable, fully booked')}`;
        case 'past':
            return `${dateText}, ${t('past date, unavailable')}`;
        case 'beyond-horizon':
            return `${dateText}, ${t('outside booking window')}`;
        case 'span-blocked':
            return `${dateText}, ${t('would extend across a fully booked date')}`;
        case 'range-start':
            return `${dateText}, ${t('selected as check-in')}`;
        case 'range-end':
            return `${dateText}, ${t('selected as check-out')}`;
        case 'in-range':
            return `${dateText}, ${t('in selected range')}`;
        case 'overflow':
            return formatAriaDate(yyyymmdd);
        default:
            return dateText;
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Grid construction — always 6 rows × 7 cols = 42 cells (no layout shift).
// Returns array of {ymd, day, isOverflow, state}.
// ─────────────────────────────────────────────────────────────────────────

function buildGrid(year, month) {
    const totalCells = 42;
    const firstDow = dayOfWeek(year, month, 1); // 0=Sun..6=Sat
    // Offset accounts for the user's first-day-of-week preference.
    let offset = (firstDow - props.firstDayOfWeek + 7) % 7;

    const cells = [];
    const totalThisMonth = daysInMonth(year, month);
    const prev = shiftMonth(year, month, -1);
    const totalPrev = daysInMonth(prev.year, prev.month);

    // Leading overflow days from previous month
    for (let i = 0; i < offset; i++) {
        const day = totalPrev - offset + 1 + i;
        const dateStr = ymd(prev.year, prev.month, day);
        cells.push({ ymd: dateStr, day, isOverflow: true });
    }

    // Days in current month
    for (let d = 1; d <= totalThisMonth; d++) {
        cells.push({ ymd: ymd(year, month, d), day: d, isOverflow: false });
    }

    // Trailing overflow from next month to fill 42
    const remaining = totalCells - cells.length;
    const next = shiftMonth(year, month, 1);
    for (let d = 1; d <= remaining; d++) {
        cells.push({ ymd: ymd(next.year, next.month, d), day: d, isOverflow: true });
    }

    return cells.map(c => ({ ...c, state: cellState(c.ymd, c.isOverflow) }));
}

const leftGrid = computed(() => buildGrid(viewYear.value, viewMonth.value));
const rightGrid = computed(() =>
    showTwoMonths.value ? buildGrid(rightView.value.year, rightView.value.month) : []
);

// ─────────────────────────────────────────────────────────────────────────
// Weekday headers + month titles (locale-aware)
// ─────────────────────────────────────────────────────────────────────────

const weekdayHeaders = computed(() => {
    const fmt = new Intl.DateTimeFormat(locale.value, { weekday: 'short' });
    const headers = [];
    // Use a known Sunday (2024-01-07 is Sun) as the reference, then offset
    // by firstDayOfWeek + i.
    const ref = new Date(2024, 0, 7); // Jan 7, 2024 = Sunday
    for (let i = 0; i < 7; i++) {
        const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + props.firstDayOfWeek + i);
        headers.push(fmt.format(d));
    }
    return headers;
});

function monthTitle(year, month) {
    try {
        const fmt = new Intl.DateTimeFormat(locale.value, { month: 'long', year: 'numeric' });
        return fmt.format(new Date(year, month - 1, 1));
    } catch {
        return `${year}-${pad2(month)}`;
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Live region announcement (debounced 150ms)
// ─────────────────────────────────────────────────────────────────────────

function announce(message) {
    if (!liveRegion.value) return;
    if (liveRegionDebounce) clearTimeout(liveRegionDebounce);
    liveRegionDebounce = setTimeout(() => {
        liveRegion.value.textContent = '';
        // Force a tick so SR re-reads even when text is identical.
        nextTick(() => {
            if (liveRegion.value) liveRegion.value.textContent = message;
        });
    }, 150);
}

// ─────────────────────────────────────────────────────────────────────────
// State machine — one-click range select
// ─────────────────────────────────────────────────────────────────────────

function disabledReason(state) {
    switch (state) {
        case 'unavailable': return t('That date is unavailable.');
        case 'past': return t('That date is in the past.');
        case 'beyond-horizon': return t('That date is outside the booking window.');
        case 'span-blocked': return t('That date would extend across a fully booked date.');
        default: return null;
    }
}

function onCellClick(cell) {
    if (cell.isOverflow) return;
    const reason = disabledReason(cell.state);
    if (reason) {
        announce(reason);
        return;
    }
    if (!isInteractive(cell.state)) return;

    // Single-date mode: one click → start = picked, end stays null. The
    // customer can re-click any other day to swap their pick. Confirm
    // emits {start, end: null}.
    if (isSingleMode.value) {
        start.value = cell.ymd;
        end.value = null;
        hoverDay.value = null;
        announce(`${t('Date selected:')} ${formatAriaDate(cell.ymd)}.`);
        return;
    }

    // RANGE_SELECTED → start over
    if (start.value && end.value) {
        start.value = cell.ymd;
        end.value = null;
        announce(`${t('Check-in selected:')} ${formatAriaDate(cell.ymd)}. ${t('Now select check-out date.')}`);
        maybePrefetchAfterCheckin();
        return;
    }

    // IDLE → CHECKIN_SELECTED
    if (!start.value) {
        start.value = cell.ymd;
        announce(`${t('Check-in selected:')} ${formatAriaDate(cell.ymd)}. ${t('Now select check-out date.')}`);
        maybePrefetchAfterCheckin();
        return;
    }

    // CHECKIN_SELECTED with start already set
    // Same day → silent reset (no 1-night-from-same-day)
    if (cell.ymd === start.value) {
        start.value = null;
        announce(t('Selection cleared.'));
        return;
    }

    // Earlier day → reset check-in to the earlier one
    if (cell.ymd < start.value) {
        start.value = cell.ymd;
        announce(`${t('Check-in selected:')} ${formatAriaDate(cell.ymd)}. ${t('Now select check-out date.')}`);
        return;
    }

    // Later day → confirm range
    end.value = cell.ymd;
    const nights = diffDays(start.value, end.value);
    const nightWord = nights === 1 ? t('night') : t('nights');
    announce(`${t('Stay selected:')} ${formatAriaDate(start.value)} ${t('to')} ${formatAriaDate(end.value)}. ${nights} ${nightWord}.`);
}

function onCellHover(cell) {
    if (!start.value || end.value) return;
    if (cell.isOverflow || !isInteractive(cell.state)) {
        hoverDay.value = null;
        return;
    }
    hoverDay.value = cell.ymd;
}

function onCellLeave() {
    hoverDay.value = null;
}

function clearSelection() {
    start.value = null;
    end.value = null;
    hoverDay.value = null;
    announce(t('Selection cleared.'));
}

function confirmSelection() {
    if (isSingleMode.value) {
        if (!start.value) {
            announce(t('Select a date to confirm.'));
            return;
        }
        emit('select', { start: start.value, end: null });
        closeModal();
        return;
    }

    if (!start.value || !end.value) {
        announce(t('Select a check-out date to confirm.'));
        return;
    }
    emit('select', { start: start.value, end: end.value });
    closeModal();
}

function closeModal() {
    emit('update:open', false);
}

// ─────────────────────────────────────────────────────────────────────────
// Prefetch — fire when check-in lands in last 7 days of visible month
// ─────────────────────────────────────────────────────────────────────────

function maybePrefetchAfterCheckin() {
    if (!start.value) return;
    const { y, m, d } = parseYmd(start.value);
    const total = daysInMonth(y, m);
    if (d >= total - 6) {
        const nextMonth = shiftMonth(y, m, 1);
        // Don't prefetch past horizon
        if (horizonMaxDate.value) {
            const h = parseYmd(horizonMaxDate.value);
            if (nextMonth.year > h.y || (nextMonth.year === h.y && nextMonth.month > h.m)) {
                return;
            }
        }
        prefetchMonth(nextMonth.year, nextMonth.month);
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Month navigation
// ─────────────────────────────────────────────────────────────────────────

async function goPrevMonth() {
    if (isPrevDisabled.value) return;
    const next = shiftMonth(viewYear.value, viewMonth.value, -1);
    viewYear.value = next.year;
    viewMonth.value = next.month;
    await ensureMonthsLoaded();
    moveFocusAfterMonthChange();
}

async function goNextMonth() {
    if (isNextDisabled.value) return;
    const next = shiftMonth(viewYear.value, viewMonth.value, showTwoMonths.value ? 2 : 1);
    viewYear.value = next.year;
    viewMonth.value = next.month;
    await ensureMonthsLoaded();
    moveFocusAfterMonthChange();
}

async function ensureMonthsLoaded() {
    await loadMonth(viewYear.value, viewMonth.value);
    if (showTwoMonths.value) {
        await loadMonth(rightView.value.year, rightView.value.month);
    }
}

function moveFocusAfterMonthChange() {
    // Keep same day-of-month if exists + selectable, else first selectable.
    const currentFocus = focusedDay.value ? parseYmd(focusedDay.value).d : 1;
    const total = daysInMonth(viewYear.value, viewMonth.value);
    const targetDay = Math.min(currentFocus, total);
    let candidate = ymd(viewYear.value, viewMonth.value, targetDay);

    // Find first interactive day from candidate forward, then from start of month.
    const cells = leftGrid.value;
    const fromCandidate = cells.find(c => !c.isOverflow && c.ymd >= candidate && isInteractive(c.state));
    const fromStart = cells.find(c => !c.isOverflow && isInteractive(c.state));
    focusedDay.value = (fromCandidate ?? fromStart)?.ymd ?? candidate;

    // Focus the cell DOM after render
    nextTick(focusCell);
}

function focusCell() {
    if (!focusedDay.value) return;
    // dialogRef binds to <DialogPanel> (a Vue component), so .value is the
    // component instance, not a DOM node. Headless UI exposes the underlying
    // element on `.$el`. Fall back to a document query if anything in that
    // chain comes back nullish (covers test environments and edge mounts).
    const root = dialogRef.value?.$el ?? dialogRef.value;
    const el = (root && typeof root.querySelector === 'function')
        ? root.querySelector(`[data-ymd="${focusedDay.value}"]`)
        : document.querySelector(`[data-ymd="${focusedDay.value}"]`);
    if (el && typeof el.focus === 'function') el.focus();
}

// ─────────────────────────────────────────────────────────────────────────
// Keyboard navigation — roving tabindex
// ─────────────────────────────────────────────────────────────────────────

function isRTL() {
    return typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
}

async function onKeyDown(e, cell) {
    const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End', 'PageUp', 'PageDown', 'Enter', ' '];
    if (!handled.includes(e.key)) return;

    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCellClick(cell);
        return;
    }

    e.preventDefault();
    let next = focusedDay.value || cell.ymd;
    const rtl = isRTL();

    switch (e.key) {
        case 'ArrowLeft':  next = addDays(next, rtl ? +1 : -1); break;
        case 'ArrowRight': next = addDays(next, rtl ? -1 : +1); break;
        case 'ArrowUp':    next = addDays(next, -7); break;
        case 'ArrowDown':  next = addDays(next, +7); break;
        case 'Home': {
            // Start of week
            const { y, m, d } = parseYmd(next);
            const dow = dayOfWeek(y, m, d);
            const offset = (dow - props.firstDayOfWeek + 7) % 7;
            next = addDays(next, -offset);
            break;
        }
        case 'End': {
            const { y, m, d } = parseYmd(next);
            const dow = dayOfWeek(y, m, d);
            const offset = (dow - props.firstDayOfWeek + 7) % 7;
            next = addDays(next, 6 - offset);
            break;
        }
        case 'PageUp': {
            const cur = parseYmd(next);
            const shifted = shiftMonth(cur.y, cur.m, -1);
            const total = daysInMonth(shifted.year, shifted.month);
            next = ymd(shifted.year, shifted.month, Math.min(cur.d, total));
            break;
        }
        case 'PageDown': {
            const cur = parseYmd(next);
            const shifted = shiftMonth(cur.y, cur.m, +1);
            const total = daysInMonth(shifted.year, shifted.month);
            next = ymd(shifted.year, shifted.month, Math.min(cur.d, total));
            break;
        }
    }

    focusedDay.value = next;

    // Auto-paginate if focus moved outside the visible range.
    const { y: fy, m: fm } = parseYmd(next);
    const visibleStart = ymd(viewYear.value, viewMonth.value, 1);
    const visibleEnd = showTwoMonths.value
        ? ymd(rightView.value.year, rightView.value.month, daysInMonth(rightView.value.year, rightView.value.month))
        : ymd(viewYear.value, viewMonth.value, daysInMonth(viewYear.value, viewMonth.value));

    if (next < visibleStart) {
        const target = shiftMonth(fy, fm, 0);
        viewYear.value = target.year;
        viewMonth.value = target.month;
        await ensureMonthsLoaded();
    } else if (next > visibleEnd) {
        // Move so that target month becomes left view
        viewYear.value = fy;
        viewMonth.value = fm;
        await ensureMonthsLoaded();
    }

    await nextTick();
    focusCell();
}

function cellTabindex(cell) {
    if (cell.isOverflow) return -1;
    return cell.ymd === focusedDay.value ? 0 : -1;
}

// ─────────────────────────────────────────────────────────────────────────
// Lifecycle — init on open, restore on close
// ─────────────────────────────────────────────────────────────────────────

function detectShowTwoMonths() {
    // md breakpoint = 768px in Tailwind v4 default
    showTwoMonths.value = typeof window !== 'undefined' && window.innerWidth >= 768;
}

watch(() => props.open, async (isOpen) => {
    if (isOpen) {
        triggerEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        detectShowTwoMonths();
        today.value = todayYmd();

        // Init range from props
        start.value = props.initialStart || null;
        end.value = props.initialEnd || null;
        hoverDay.value = null;

        // Set view to month containing initialStart, else current month
        const seed = props.initialStart || today.value;
        const { y, m } = parseYmd(seed);
        viewYear.value = y;
        viewMonth.value = m;

        // Initial focus priority: initialStart → today → first available
        focusedDay.value = props.initialStart || today.value;

        await ensureMonthsLoaded();
        await nextTick();
        focusCell();
    } else {
        // Restore focus to trigger
        if (triggerEl && typeof triggerEl.focus === 'function') {
            triggerEl.focus();
        }
        triggerEl = null;
    }
});

// React to prop changes mid-open (rare but spec-required)
watch(() => [props.initialStart, props.initialEnd], ([s, e]) => {
    if (!props.open) return;
    start.value = s || null;
    end.value = e || null;
});

// ─────────────────────────────────────────────────────────────────────────
// Retry button after error
// ─────────────────────────────────────────────────────────────────────────

async function retryLoad() {
    invalidate(viewYear.value, viewMonth.value);
    await loadMonth(viewYear.value, viewMonth.value);
}
</script>

<template>
    <TransitionRoot appear :show="open" as="template">
        <Dialog
            as="div"
            @close="closeModal"
            class="relative z-50"
        >
            <!-- Backdrop -->
            <TransitionChild
                as="template"
                enter="motion-safe:duration-200 motion-safe:ease-out"
                enter-from="opacity-0"
                enter-to="opacity-100"
                leave="motion-safe:duration-150 motion-safe:ease-in"
                leave-from="opacity-100"
                leave-to="opacity-0"
            >
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
            </TransitionChild>

            <!-- Panel container -->
            <div class="fixed inset-0 overflow-y-auto">
                <div class="flex min-h-full items-center justify-center p-0 md:p-4">
                    <TransitionChild
                        as="template"
                        enter="motion-safe:duration-200 motion-safe:ease-out"
                        enter-from="opacity-0 scale-95"
                        enter-to="opacity-100 scale-100"
                        leave="motion-safe:duration-150 motion-safe:ease-in"
                        leave-from="opacity-100 scale-100"
                        leave-to="opacity-0 scale-95"
                    >
                        <DialogPanel
                            ref="dialogRef"
                            class="w-full md:max-w-2xl rounded-none md:rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex flex-col h-screen md:h-auto md:max-h-[90vh] overflow-hidden"
                        >
                            <!-- Header -->
                            <header class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 shrink-0">
                                <DialogTitle class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {{ isSingleMode ? $t('Pick a date') : $t('Select your dates') }}
                                </DialogTitle>
                                <button
                                    type="button"
                                    @click="closeModal"
                                    :aria-label="$t('Close')"
                                    class="inline-flex items-center justify-center size-11 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </header>

                            <!-- SR-only help text + live region -->
                            <p class="sr-only">{{ $t('Use arrow keys to navigate. Enter to select.') }}</p>
                            <div ref="liveRegion" role="status" aria-live="polite" aria-atomic="true" class="sr-only" />

                            <!-- Body — scrollable on mobile -->
                            <div class="flex-1 overflow-y-auto px-4 py-3">
                                <!-- Month nav row -->
                                <div class="flex items-center justify-between mb-3">
                                    <button
                                        type="button"
                                        @click="goPrevMonth"
                                        :disabled="isPrevDisabled"
                                        :aria-label="$t('Previous month')"
                                        class="inline-flex items-center justify-center size-11 md:size-9 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                    >
                                        <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                        </svg>
                                        <svg v-else class="animate-spin size-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    </button>

                                    <div class="flex-1 text-center flex items-center justify-around">
                                        <h3
                                            class="text-base font-semibold text-gray-900 dark:text-gray-100"
                                            aria-live="polite"
                                        >
                                            {{ monthTitle(viewYear, viewMonth) }}
                                        </h3>
                                        <h3
                                            v-if="showTwoMonths"
                                            class="text-base font-semibold text-gray-900 dark:text-gray-100"
                                            aria-live="polite"
                                        >
                                            {{ monthTitle(rightView.year, rightView.month) }}
                                        </h3>
                                    </div>

                                    <button
                                        type="button"
                                        @click="goNextMonth"
                                        :disabled="isNextDisabled"
                                        :aria-label="$t('Next month')"
                                        class="inline-flex items-center justify-center size-11 md:size-9 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                    >
                                        <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                        </svg>
                                        <svg v-else class="animate-spin size-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    </button>
                                </div>

                                <!-- Error state -->
                                <div
                                    v-if="error && !loading"
                                    role="alert"
                                    class="flex flex-col items-center justify-center py-12 text-center"
                                >
                                    <svg class="size-10 text-red-400 dark:text-red-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                    </svg>
                                    <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">{{ error }}</p>
                                    <button
                                        type="button"
                                        @click="retryLoad"
                                        class="inline-flex items-center px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    >
                                        {{ $t('Try again') }}
                                    </button>
                                </div>

                                <!-- Calendar grid(s) -->
                                <div
                                    v-else
                                    class="grid gap-6 md:grid-cols-2"
                                >
                                    <!-- Left month -->
                                    <div>
                                        <div
                                            role="grid"
                                            :aria-busy="loading ? 'true' : 'false'"
                                            :aria-label="monthTitle(viewYear, viewMonth)"
                                        >
                                            <!-- Weekday headers -->
                                            <div role="row" class="grid grid-cols-7 gap-0.5 mb-1">
                                                <span
                                                    v-for="(name, i) in weekdayHeaders"
                                                    :key="`hdr-${i}`"
                                                    role="columnheader"
                                                    class="flex items-center justify-center h-8 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                                                >
                                                    {{ name }}
                                                </span>
                                            </div>
                                            <!-- Cells -->
                                            <div role="row" class="grid grid-cols-7 gap-0.5">
                                                <button
                                                    v-for="cell in leftGrid"
                                                    :key="`L-${cell.ymd}`"
                                                    type="button"
                                                    role="gridcell"
                                                    :data-ymd="cell.ymd"
                                                    :data-day-state="cell.state"
                                                    :class="cellClasses(cell.state)"
                                                    :aria-label="cellAriaLabel(cell.ymd, cell.state)"
                                                    :aria-current="cell.state === 'today' ? 'date' : undefined"
                                                    :aria-selected="cell.state === 'range-start' || cell.state === 'range-end' ? 'true' : 'false'"
                                                    :aria-disabled="!isInteractive(cell.state) && !cell.isOverflow ? 'true' : undefined"
                                                    :tabindex="cellTabindex(cell)"
                                                    @click="onCellClick(cell)"
                                                    @mouseenter="onCellHover(cell)"
                                                    @mouseleave="onCellLeave"
                                                    @focus="onCellHover(cell)"
                                                    @keydown="onKeyDown($event, cell)"
                                                >
                                                    <span>{{ cell.day }}</span>
                                                    <!-- Unavailable X icon -->
                                                    <svg
                                                        v-if="cell.state === 'unavailable'"
                                                        aria-hidden="true"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke-width="2.5"
                                                        stroke="currentColor"
                                                        class="absolute top-0.5 right-0.5 size-3 text-red-500 dark:text-red-400"
                                                    >
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                    </svg>
                                                    <!-- Partial warn icon + mobile inline count -->
                                                    <svg
                                                        v-if="cell.state === 'partial'"
                                                        aria-hidden="true"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                        class="absolute top-0.5 right-0.5 size-3 text-amber-500 dark:text-amber-400"
                                                    >
                                                        <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Right month (desktop only) -->
                                    <div v-if="showTwoMonths">
                                        <div
                                            role="grid"
                                            :aria-busy="loading ? 'true' : 'false'"
                                            :aria-label="monthTitle(rightView.year, rightView.month)"
                                        >
                                            <div role="row" class="grid grid-cols-7 gap-0.5 mb-1">
                                                <span
                                                    v-for="(name, i) in weekdayHeaders"
                                                    :key="`rhdr-${i}`"
                                                    role="columnheader"
                                                    class="flex items-center justify-center h-8 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                                                >
                                                    {{ name }}
                                                </span>
                                            </div>
                                            <div role="row" class="grid grid-cols-7 gap-0.5">
                                                <button
                                                    v-for="cell in rightGrid"
                                                    :key="`R-${cell.ymd}`"
                                                    type="button"
                                                    role="gridcell"
                                                    :data-ymd="cell.ymd"
                                                    :data-day-state="cell.state"
                                                    :class="cellClasses(cell.state)"
                                                    :aria-label="cellAriaLabel(cell.ymd, cell.state)"
                                                    :aria-current="cell.state === 'today' ? 'date' : undefined"
                                                    :aria-selected="cell.state === 'range-start' || cell.state === 'range-end' ? 'true' : 'false'"
                                                    :aria-disabled="!isInteractive(cell.state) && !cell.isOverflow ? 'true' : undefined"
                                                    :tabindex="cellTabindex(cell)"
                                                    @click="onCellClick(cell)"
                                                    @mouseenter="onCellHover(cell)"
                                                    @mouseleave="onCellLeave"
                                                    @focus="onCellHover(cell)"
                                                    @keydown="onKeyDown($event, cell)"
                                                >
                                                    <span>{{ cell.day }}</span>
                                                    <svg
                                                        v-if="cell.state === 'unavailable'"
                                                        aria-hidden="true"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke-width="2.5"
                                                        stroke="currentColor"
                                                        class="absolute top-0.5 right-0.5 size-3 text-red-500 dark:text-red-400"
                                                    >
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                    </svg>
                                                    <svg
                                                        v-if="cell.state === 'partial'"
                                                        aria-hidden="true"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                        class="absolute top-0.5 right-0.5 size-3 text-amber-500 dark:text-amber-400"
                                                    >
                                                        <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Legend (helps users decode the icons) -->
                                <div class="flex flex-wrap gap-4 mt-4 text-xs text-gray-600 dark:text-gray-400">
                                    <div class="flex items-center gap-1.5">
                                        <span class="inline-block size-3 rounded-full bg-blue-100 dark:bg-cyan-900/30" />
                                        {{ $t('Selected') }}
                                    </div>
                                    <div class="flex items-center gap-1.5">
                                        <svg viewBox="0 0 24 24" fill="currentColor" class="size-3 text-amber-500 dark:text-amber-400">
                                            <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003Z" clip-rule="evenodd" />
                                        </svg>
                                        {{ $t('Limited availability') }}
                                    </div>
                                    <div class="flex items-center gap-1.5">
                                        <svg fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="size-3 text-red-500 dark:text-red-400">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                        {{ $t('Unavailable') }}
                                    </div>
                                </div>
                            </div>

                            <!-- Footer — summary + Clear/Confirm -->
                            <footer class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-slate-700 shrink-0">
                                <div class="text-sm">
                                    <!-- Single-date mode: just show the picked day, no nights/checkout copy. -->
                                    <template v-if="isSingleMode">
                                        <template v-if="start">
                                            <span class="text-gray-700 dark:text-gray-300">
                                                {{ formatAriaDate(start) }}
                                            </span>
                                        </template>
                                        <template v-else>
                                            <span class="text-gray-500 dark:text-gray-400">
                                                {{ $t('Select a date') }}
                                            </span>
                                        </template>
                                    </template>
                                    <template v-else-if="start && end">
                                        <span class="text-gray-700 dark:text-gray-300">
                                            {{ formatAriaDate(start) }}
                                            <span class="mx-1 text-gray-400">→</span>
                                            {{ formatAriaDate(end) }}
                                        </span>
                                        <span class="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {{ nightsCount }} {{ nightsCount === 1 ? $t('night') : $t('nights') }}
                                        </span>
                                    </template>
                                    <template v-else-if="start">
                                        <span class="text-gray-500 dark:text-gray-400">
                                            {{ $t('Select check-out date') }}
                                        </span>
                                    </template>
                                    <template v-else>
                                        <span class="text-gray-500 dark:text-gray-400">
                                            {{ $t('Select check-in date') }}
                                        </span>
                                    </template>
                                </div>
                                <div class="flex gap-2">
                                    <button
                                        type="button"
                                        @click="clearSelection"
                                        :disabled="!start && !end"
                                        class="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                    >
                                        {{ $t('Clear') }}
                                    </button>
                                    <button
                                        type="button"
                                        @click="confirmSelection"
                                        :aria-disabled="confirmDisabled ? 'true' : 'false'"
                                        :class="[
                                            'px-4 py-2 text-sm rounded-lg shadow-xs transition-colors text-white',
                                            confirmDisabled
                                                ? 'bg-green-700/50 dark:bg-green-600/50 cursor-not-allowed'
                                                : 'bg-green-700 hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 cursor-pointer'
                                        ]"
                                    >
                                        {{ $t('Confirm') }}
                                    </button>
                                </div>
                            </footer>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>

<style scoped>
/* Forced-colors mode (Windows High Contrast): selection state via outline,
   not background, so the range stays visible when colors are overridden. */
@media (forced-colors: active) {
    [aria-selected="true"] {
        outline: 2px solid Highlight;
        outline-offset: -2px;
    }
}
</style>
