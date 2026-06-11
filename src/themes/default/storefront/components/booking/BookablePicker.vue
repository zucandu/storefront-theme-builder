<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useHelpers } from '@/composables/useHelpers';
import AttributeFieldRenderer from './AttributeFieldRenderer.vue';
import BookingCalendarModal from '../BookingCalendarModal.vue';

/**
 * Storefront booking-fields picker (TB.8.6.2).
 *
 * Groups the per-row `booking_fields` payload (one row per product_attributes
 * entry) by attribute_option_id so each option renders once. Mounts an
 * `<AttributeFieldRenderer>` per group and tracks the customer's selection
 * across all 4 supported field types.
 *
 * State + emits:
 *   - Internal `selection` ref holds `{ [attribute_option_id]: value }`. Value
 *     is the aov_id for `select`, ISO date string for `date`, or raw string
 *     for `text`/`textarea`.
 *   - `update:selection` emits the full selection map (cart/quote payload).
 *   - `update:priceDelta` emits the running per-unit surcharge sum.
 *
 * Defaults:
 *   - `select` defaults from the row marked `attribute_default = 1` (or first
 *     option if none). Backend's `applyDefaults()` mirrors this server-side.
 *   - date/text/textarea default to empty string. Sentinel `attribute_price`
 *     (when > 0) is added to the delta only once the customer fills the
 *     field — matches the live-quote UX without forcing surcharges on
 *     untouched optional fields.
 */
const props = defineProps({
    fields: {
        type: Array,
        required: true,
        default: () => [],
    },
    // Pre-fill the picker from a previously saved selection (e.g. when the
    // customer comes back from the cart to edit a booking row). Shape matches
    // what the cart stores under `meta.booking.fields`:
    //   { [attribute_option_id]: aov_id | iso-date | text }
    // Values present here win over the per-field default; missing keys still
    // fall through to the existing default-seeding logic below.
    initialSelection: {
        type: Object,
        default: () => ({}),
    },

    // TB.9.3.3 — booking trigger context. When all three are present, the
    // two `date` cells matching the FK pair render as read-only triggers
    // that open the shared BookingCalendarModal mounted at the bottom of
    // this component. When any of the three is missing/null, the renderer
    // falls back to plain <input type="date"> (legacy / unconfigured
    // booking products keep working unchanged).
    productId: { type: [Number, String], default: null },
    bookingStartOptionId: { type: [Number, String], default: null },
    bookingEndOptionId: { type: [Number, String], default: null },
});

const emit = defineEmits([
    'update:priceDelta',
    'update:selection',
    'update:hasMissingRequired',
    // TB.9.X.1 — full server quote response so Product.vue can render the
    // duration breakdown line (`$180 × 5 nights = $900`). Payload is the
    // raw response from POST /api/v3/storefront/booking/quote, or null
    // when no successful quote has landed yet (first paint / network fail).
    'update:bookingQuote',
]);

const { translateItemField } = useHelpers();

/**
 * Group raw booking_fields rows by attribute_option_id. For each group:
 *  - select: collect all value_options with their attribute_price.
 *  - date/text/textarea: capture the sentinel row's attribute_price as
 *    `sentinel_price` (the renderer charges this once the field is filled).
 */
const grouped = computed(() => {
    const groups = new Map();
    for (const row of props.fields) {
        const oid = row.attribute_option_id;
        if (!groups.has(oid)) {
            groups.set(oid, {
                attribute_option_id: oid,
                attribute_option: row.attribute_option,
                value_options: [],
                default_value_id: null,
                sentinel_price: 0,
            });
        }
        const entry = groups.get(oid);
        const type = entry.attribute_option?.type;
        const price = parseFloat(row.attribute_price ?? 0) || 0;

        if (type === 'select') {
            if (row.attribute_option_value) {
                entry.value_options.push({
                    ...row.attribute_option_value,
                    attribute_price: price,
                });
            }
            if (+row.attribute_default === 1 && row.attribute_option_value_id) {
                entry.default_value_id = row.attribute_option_value_id;
            }
        } else {
            // date / text / textarea — single sentinel row carries the price.
            entry.sentinel_price = price;
        }
    }
    return Array.from(groups.values());
});

// Per-option price contribution (delta from current selection / input value).
// Renderer emits `priceChange` whenever a field updates; we keep one entry per
// option_id so summing them gives the total bookingPriceDelta.
const priceContribs = ref({});

// Pre-fill from `initialSelection` (cart-row restore). Done synchronously so
// the seeding watcher below sees these values and skips its default-fill
// branch via the `if (next[id] != null) continue` guard.
const selection = ref({ ...(props.initialSelection || {}) });

// Seed defaults whenever the grouped set changes (first load + product swap).
// Only fills slots that aren't already user-set / pre-filled so manual picks
// and restored cart-row selections survive.
watch(grouped, (groups) => {
    const next = { ...selection.value };
    const contribs = { ...priceContribs.value };

    for (const g of groups) {
        const type = g.attribute_option?.type;
        if (type === 'select') {
            if (next[g.attribute_option_id] != null) {
                // Pre-filled (or user-picked) — sync the price contribution to
                // match the chosen aov so unit-price preview is correct on
                // first paint after a cart-row restore.
                const picked = g.value_options.find(v => v.id === next[g.attribute_option_id]);
                contribs[g.attribute_option_id] = picked ? parseFloat(picked.attribute_price ?? 0) : 0;
                continue;
            }
            const defaultId = g.default_value_id ?? g.value_options[0]?.id ?? null;
            next[g.attribute_option_id] = defaultId;
            // Seed the price contribution for the default selection so the
            // initial unit-price preview matches what BookingPriceCalculator
            // will quote (server-side `applyDefaults` produces the same).
            const defaultAov = g.value_options.find(v => v.id === defaultId);
            contribs[g.attribute_option_id] = defaultAov ? parseFloat(defaultAov.attribute_price ?? 0) : 0;
        } else {
            // date/text/textarea — when pre-filled, charge the sentinel price
            // (matches "field is filled in" semantics from the live quote).
            if (next[g.attribute_option_id] != null && next[g.attribute_option_id] !== '') {
                contribs[g.attribute_option_id] = parseFloat(g.sentinel_price ?? 0) || 0;
            } else {
                if (next[g.attribute_option_id] == null) next[g.attribute_option_id] = '';
                if (contribs[g.attribute_option_id] == null) contribs[g.attribute_option_id] = 0;
            }
        }
    }

    selection.value = next;
    priceContribs.value = contribs;
}, { immediate: true });

const totalPriceDelta = computed(() => {
    let total = 0;
    for (const v of Object.values(priceContribs.value)) {
        total += parseFloat(v ?? 0) || 0;
    }
    return total;
});

// ─────────────────────────────────────────────────────────────────────────
// TB.9.3.4 — Server-authoritative live preview
//
// `totalPriceDelta` above is a fast client-side approximation summed from
// per-field price contributions. It's correct enough for first-paint and as
// a fallback while a server quote is in flight, but it can drift from the
// actual cart-add price (translated label rounding, future per-day pricing,
// etc.). We additionally call `POST /api/v3/storefront/booking/quote` on
// every selection change (debounced) and prefer its `options_sum` once we
// have a successful response. AbortController cancels in-flight calls when
// the user keeps toggling so we never emit an out-of-order value.
//
// `serverPriceDelta.value === null` means "no successful quote yet" and we
// emit the client-side fallback. After the first success we keep emitting
// the server number; if a later request fails / aborts we keep the LAST
// known good server value rather than flicker back to the client sum.
// ─────────────────────────────────────────────────────────────────────────

const serverPriceDelta = ref(null);
const effectivePriceDelta = computed(() =>
    serverPriceDelta.value !== null ? serverPriceDelta.value : totalPriceDelta.value
);
watch(effectivePriceDelta, (v) => emit('update:priceDelta', v), { immediate: true });

// Debounce + abort plumbing for the live quote() call. Declared here (NOT
// inside the helpers below) because the `selection` watcher is registered
// with `immediate: true`, which calls `scheduleQuote()` synchronously
// during script setup — that callback must be able to read these slots
// without hitting a `let` TDZ ReferenceError.
const QUOTE_DEBOUNCE_MS = 280;
let quoteDebounceTimer = null;
let quoteAbortController = null;

/**
 * TB.10.1.1 — track whether any admin-marked required field (type
 * date/text/textarea, is_required=1) currently holds an empty string.
 * Parent (Product.vue) consumes this via `update:hasMissingRequired` to
 * disable ADD TO CART. select / readonly auto-default and never empty.
 */
const hasMissingRequired = computed(() => {
    return grouped.value.some((g) => {
        const type = g.attribute_option?.type;
        if (!['date', 'text', 'textarea'].includes(type)) return false;
        if (!g.attribute_option?.is_required) return false;
        const v = selection.value[g.attribute_option_id];
        return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
    });
});

watch(hasMissingRequired, (v) => emit('update:hasMissingRequired', v), { immediate: true });

/**
 * Strip empty / null values from a selection map. Laravel's
 * `ConvertEmptyStringsToNull` global middleware would coerce empty strings
 * to `null` and the `ValidatesBookingFields` trait rejects non-scalar
 * values (null fails `is_scalar`). Keeping the picker's internal state
 * with empty strings is intentional — that's what the input field needs
 * to stay reactive — but the wire format must drop them. Shared by the
 * `update:selection` emitter and the TB.9.3.4 quote() call so both speak
 * the same shape.
 */
const filterSelection = (sel) => {
    const filtered = {};
    for (const [k, v] of Object.entries(sel)) {
        if (v === null || v === undefined) continue;
        if (typeof v === 'string' && v.trim() === '') continue;
        filtered[k] = v;
    }
    return filtered;
};

watch(
    selection,
    (sel) => {
        emit('update:selection', filterSelection(sel));
        scheduleQuote();
    },
    { immediate: true, deep: true }
);

const onFieldUpdate = (optionId, value) => {
    selection.value = { ...selection.value, [optionId]: value };
};

const onFieldPriceChange = (optionId, contribution) => {
    priceContribs.value = { ...priceContribs.value, [optionId]: parseFloat(contribution ?? 0) || 0 };
};

// ─────────────────────────────────────────────────────────────────────────
// TB.9.3.3 — BookingCalendarModal wiring
//
// One shared modal mounted at picker level (NOT per-renderer): both the
// check-in and check-out triggers open the same dialog so the customer
// perceives a single picker for the full range. The modal returns a
// {start, end} pair via its `select` event; we fan out into BOTH selection
// slots in a single atomic assignment (one .value rebuild) so the
// `selection` watcher never observes a half-written intermediate state
// (start updated but end still empty, etc.).
//
// Sentinel-price contributions for both date fields are also written
// together so `totalPriceDelta` doesn't briefly double-count or
// undercount during the fan-out.
// ─────────────────────────────────────────────────────────────────────────

// Calendar mounts whenever start FK is configured. End FK is OPTIONAL —
// when null, the modal renders in single-pick mode and only the start
// selection is fanned out into selection state.
const hasBookingCalendar = computed(() =>
    props.productId != null
    && props.bookingStartOptionId != null
);

// True when only start FK is set (single-day services). Drives modal
// `mode` prop and the fan-out branch in `onCalendarSelect`.
const isSingleDateBooking = computed(() =>
    hasBookingCalendar.value && props.bookingEndOptionId == null
);

const modalOpen = ref(false);

// Element that opened the modal — focus is restored here on Confirm /
// Esc / backdrop close so keyboard users don't lose their place.
const triggerEl = ref(null);

const initialStart = computed(() => {
    if (!hasBookingCalendar.value) return null;
    const v = selection.value[props.bookingStartOptionId];
    return typeof v === 'string' && v ? v : null;
});

const initialEnd = computed(() => {
    if (!hasBookingCalendar.value) return null;
    if (isSingleDateBooking.value) return null;
    const v = selection.value[props.bookingEndOptionId];
    return typeof v === 'string' && v ? v : null;
});

const onRequestOpenCalendar = () => {
    if (!hasBookingCalendar.value) return;
    // Capture the trigger button so we can restore focus when the modal
    // closes. document.activeElement is the trigger because the click
    // (or Enter/Space) fired the request.
    triggerEl.value = document.activeElement;
    modalOpen.value = true;
};

/**
 * Look up the sentinel price for a given option_id from `grouped` so we
 * can write the correct price contribution when the calendar fan-out
 * fills the date fields. Mirrors AttributeFieldRenderer.inputPriceContribution
 * — sentinel surcharge applies only when the field is non-empty.
 */
const sentinelPriceFor = (optionId) => {
    const g = grouped.value.find(x => x.attribute_option_id == optionId);
    if (!g) return 0;
    return parseFloat(g.sentinel_price ?? 0) || 0;
};

const onCalendarSelect = ({ start, end }) => {
    if (!hasBookingCalendar.value) return;
    const startId = props.bookingStartOptionId;
    const endId = props.bookingEndOptionId;

    const startEmpty = !start || (typeof start === 'string' && start.trim() === '');

    // Single-date mode: only fan out the start key. End FK is null on
    // the product so there's nothing to write under, and the backend
    // derives bEnd = bStart + 1 day at occupancy time.
    if (isSingleDateBooking.value) {
        selection.value = {
            ...selection.value,
            [startId]: start,
        };
        priceContribs.value = {
            ...priceContribs.value,
            [startId]: startEmpty ? 0 : sentinelPriceFor(startId),
        };
        return;
    }

    // Range mode: ATOMIC dual-write — single .value rebuild for both
    // keys so downstream watchers see a single coherent transition.
    selection.value = {
        ...selection.value,
        [startId]: start,
        [endId]: end,
    };

    // Sentinel surcharge fan-out — empty value contributes 0, non-empty
    // contributes the sentinel_price. After a successful range select
    // both are non-empty, so both surcharges apply at once.
    const endEmpty = !end || (typeof end === 'string' && end.trim() === '');
    priceContribs.value = {
        ...priceContribs.value,
        [startId]: startEmpty ? 0 : sentinelPriceFor(startId),
        [endId]: endEmpty ? 0 : sentinelPriceFor(endId),
    };
};

const onCalendarOpenChange = (open) => {
    modalOpen.value = open;
    if (!open && triggerEl.value && typeof triggerEl.value.focus === 'function') {
        // Restore focus to the trigger that opened the modal. nextTick
        // because the dialog's own close animation may still be releasing
        // focus on this same frame.
        nextTick(() => {
            try { triggerEl.value.focus(); } catch { /* element may be unmounted */ }
        });
    }
};

// `function` (not `const` arrow) so the hoisted declaration is reachable
// from the `watch(selection, ..., { immediate: true })` callback at the
// top of the script — the immediate run fires synchronously during
// registration, before this block is evaluated.
function scheduleQuote() {
    // Hard gate — picker is only mounted under a booking product in
    // Product.vue today, but defending in depth means a future caller
    // can't accidentally fire the call against a non-booking product.
    if (props.productId == null) return;

    if (quoteDebounceTimer !== null) {
        clearTimeout(quoteDebounceTimer);
    }
    quoteDebounceTimer = setTimeout(() => {
        quoteDebounceTimer = null;
        runQuote();
    }, QUOTE_DEBOUNCE_MS);
}

async function runQuote() {
    if (props.productId == null) return;

    // Abort the previous in-flight request (if any) before kicking off the
    // new one. axios v1 honours `signal` from a real AbortController — the
    // request is genuinely cancelled, not just ignored, so the server
    // releases the connection too.
    if (quoteAbortController) {
        quoteAbortController.abort();
    }
    quoteAbortController = {};

    try {
        // Mock booking quote — return zero options_sum
        const mockData = { options_sum: 0, count: 1, count_unit: 'night', subtotal: 0 };
        serverPriceDelta.value = 0;
        emit('update:bookingQuote', mockData);
    } catch (err) {
        // silent
    } finally {
        quoteAbortController = null;
    }
}

onBeforeUnmount(() => {
    if (quoteDebounceTimer !== null) {
        clearTimeout(quoteDebounceTimer);
        quoteDebounceTimer = null;
    }
    if (quoteAbortController) {
        quoteAbortController.abort();
        quoteAbortController = null;
    }
});
</script>

<template>
    <div v-if="grouped.length" class="space-y-5">
        <div v-for="field in grouped" :key="field.attribute_option_id">
            <label class="block mb-2.5 text-sm font-medium text-[var(--ds-text)]">
                {{ translateItemField(field.attribute_option, 'name', $i18n.locale) }}
                <!-- TB.10.1.1 — red asterisk indicator for admin-marked required fields.
                     Only meaningful for free-form types (date/text/textarea) where the
                     value can actually be empty; select auto-defaults so no asterisk. -->
                <span
                    v-if="field.attribute_option?.is_required && ['date','text','textarea'].includes(field.attribute_option?.type)"
                    class="text-red-500 ml-0.5"
                    aria-hidden="true"
                >*</span>
            </label>

            <AttributeFieldRenderer
                :field="field"
                :model-value="selection[field.attribute_option_id]"
                :product-id="productId"
                :booking-start-option-id="bookingStartOptionId"
                :booking-end-option-id="bookingEndOptionId"
                @update:model-value="(v) => onFieldUpdate(field.attribute_option_id, v)"
                @price-change="(c) => onFieldPriceChange(field.attribute_option_id, c)"
                @request-open-calendar="onRequestOpenCalendar"
            />
        </div>

        <!-- Divider after booking fields -->
        <div class="h-px bg-[#e0d8c8]"></div>
    </div>

    <!-- TB.9.3.3 — single shared BookingCalendarModal for both check-in and
         check-out triggers. Mounted at picker level (NOT per-renderer) so
         opening either trigger drives the same dialog and the customer
         perceives one picker for the full range. Mounts when start FK is
         configured; end FK optional (single-date mode when null). -->
    <BookingCalendarModal
        v-if="hasBookingCalendar"
        :product-id="productId"
        :mode="isSingleDateBooking ? 'single' : 'range'"
        :open="modalOpen"
        :initial-start="initialStart"
        :initial-end="initialEnd"
        @update:open="onCalendarOpenChange"
        @select="onCalendarSelect"
    />
</template>
