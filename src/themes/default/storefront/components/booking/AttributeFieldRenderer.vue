<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHelpers } from '@/composables/useHelpers';
import { useSettingsStore } from '@/stores/settings';

/**
 * Generic field renderer for one attribute_options row. Switches on the
 * option's `type` to mount the right input control. Used by BookablePicker
 * (TB.8.6.1); reusable for any future product-attribute editor that needs
 * the same `select`/`date`/`text`/`textarea` matrix.
 *
 * The `field` prop is one entry from BookablePicker's `grouped` projection,
 * carrying `attribute_option`, `value_options[]` (for select), and
 * `default_value_id`. Each value_option has `attribute_price` already
 * folded in by the picker.
 *
 * Pricing model:
 *   - select: the selected aov.id maps to one of value_options[*].attribute_price
 *   - date/text/textarea: `field.sentinel_price` (sentinel row's attribute_price,
 *     0 when there's no surcharge for filling the field)
 *
 * Emits:
 *   - update:modelValue — the selected value (aov.id for select, ISO date
 *     string for date, raw string for text/textarea, or null when empty).
 *   - priceChange — the per-row unit-price contribution (current selection's
 *     attribute_price). Parent sums these to compute total bookingPriceDelta.
 *   - requestOpenCalendar — fired by the date trigger (TB.9.3.3) when this
 *     renderer is in booking-trigger mode and the customer clicks/keyboards
 *     into the trigger button. Parent (BookablePicker) opens the shared
 *     BookingCalendarModal in response.
 *
 * Booking-trigger mode (TB.9.3.3):
 *   When the parent passes `productId` + `bookingStartOptionId` +
 *   `bookingEndOptionId` and this renderer's option_id matches one of the
 *   FK pair, the date input is replaced by a read-only trigger button with
 *   a calendar icon. Clicking emits `requestOpenCalendar`. Falls through
 *   to plain `<input type="date">` for unconfigured booking products
 *   (any of the 3 booking props missing).
 */
const props = defineProps({
    field: { type: Object, required: true },
    modelValue: { type: [String, Number, null], default: null },

    // TB.9.3.3 — booking trigger context. All three must be present AND
    // this field's option_id must be one of the FK pair for trigger mode
    // to activate. Otherwise plain <input type="date"> renders.
    productId: { type: [Number, String], default: null },
    bookingStartOptionId: { type: [Number, String], default: null },
    bookingEndOptionId: { type: [Number, String], default: null },
});

const emit = defineEmits(['update:modelValue', 'priceChange', 'requestOpenCalendar']);

const { t } = useI18n();
const { translateItemField, formatCurrency } = useHelpers();
const settingsStore = useSettingsStore();

const fieldType = computed(() => props.field?.attribute_option?.type ?? 'select');

/**
 * TB.9.3.3 — true when this renderer should swap its date input for a
 * read-only trigger button that opens BookingCalendarModal.
 *
 * Two valid configurations:
 *   - **Range mode** — both start AND end FK present; trigger fires for
 *     either FK cell.
 *   - **Single-date mode** — only start FK present (end FK null); trigger
 *     fires only for the start FK cell. Modal opens in single-pick mode.
 */
const isBookingTrigger = computed(() => {
    if (fieldType.value !== 'date') return false;
    if (props.productId == null) return false;
    if (props.bookingStartOptionId == null) return false;
    const myId = props.field?.attribute_option_id;
    if (myId == null) return false;
    if (myId == props.bookingStartOptionId) return true;
    // End FK trigger only valid when end FK is configured (range mode).
    if (props.bookingEndOptionId != null && myId == props.bookingEndOptionId) {
        return true;
    }
    return false;
});

/**
 * Locale-aware "Jun 5, 2026" formatter for the trigger label. Uses the
 * timezone-safe `new Date(y, m-1, d)` constructor so YYYY-MM-DD strings
 * never get parsed as UTC and shifted by ±1 day in non-UTC zones. Returns
 * empty string for null / empty / malformed input — caller falls back to
 * the placeholder.
 */
const triggerDateFormatter = computed(() => {
    const loc = settingsStore.locale ?? 'en';
    try {
        return new Intl.DateTimeFormat(loc, { dateStyle: 'medium' });
    } catch {
        return new Intl.DateTimeFormat('en', { dateStyle: 'medium' });
    }
});

const formatTriggerDate = (ymd) => {
    if (!ymd || typeof ymd !== 'string') return '';
    const parts = ymd.split('-');
    if (parts.length !== 3) return '';
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return '';
    return triggerDateFormatter.value.format(new Date(y, m - 1, d));
};

/**
 * Build the label rendered inside <option>: "Dog — $2.00" when there's a
 * surcharge, just "Dog" when the price is 0. Matches existing convention.
 */
const valueLabel = (aov) => {
    const baseName = translateItemField(aov, 'name', settingsStore.locale ?? 'en') ?? aov.name ?? '';
    const price = parseFloat(aov.attribute_price ?? 0);
    if (!(price > 0)) return baseName;
    const { decimal_digits, code } = settingsStore.selectedCurrencyObject ?? {};
    return `${baseName} — ${formatCurrency(price, decimal_digits ?? 2, code ?? 'USD')}`;
};

/**
 * For non-select types, the picker passes `sentinel_price` (the sentinel
 * row's attribute_price). Empty input contributes 0; once the customer
 * fills the field we charge the sentinel surcharge. Mirror this so live
 * subtotal updates as the customer types.
 */
const inputPriceContribution = (val) => {
    const price = parseFloat(props.field?.sentinel_price ?? 0);
    if (!(price > 0)) return 0;
    return val !== null && val !== undefined && String(val).trim() !== '' ? price : 0;
};

const onSelectChange = (e) => {
    const id = parseInt(e.target.value, 10);
    emit('update:modelValue', Number.isFinite(id) ? id : null);
    const aov = props.field.value_options.find(v => v.id === id);
    emit('priceChange', aov ? parseFloat(aov.attribute_price ?? 0) : 0);
};

const onInput = (e) => {
    const v = e.target.value ?? '';
    emit('update:modelValue', v);
    emit('priceChange', inputPriceContribution(v));
};
</script>

<template>
    <select
        v-if="fieldType === 'select'"
        :value="modelValue ?? ''"
        @change="onSelectChange"
        class="select-bg appearance-none w-full rounded-lg border border-[#e0d8c8] bg-white px-4 py-3 pr-10 text-sm text-[var(--ds-text)] focus:border-[var(--ds-accent)] focus:outline-none"
    >
        <option
            v-for="aov in field.value_options"
            :key="aov.id"
            :value="aov.id"
            :data-price="aov.attribute_price ?? 0"
        >
            {{ valueLabel(aov) }}
        </option>
    </select>

    <!-- TB.9.3.3 — booking-trigger mode: read-only button that opens the
         shared BookingCalendarModal mounted at BookablePicker level. Wins
         priority over the plain date input branch below. -->
    <button
        v-else-if="isBookingTrigger"
        type="button"
        @click="emit('requestOpenCalendar')"
        :aria-label="t('Open booking calendar')"
        aria-haspopup="dialog"
        class="relative w-full rounded-lg border border-[#e0d8c8] bg-white px-4 py-3 pr-10 text-sm text-left text-[var(--ds-text)] cursor-pointer hover:border-[var(--ds-accent)] focus:border-[var(--ds-accent)] focus:outline-none transition-colors"
    >
        <span v-if="modelValue">{{ formatTriggerDate(modelValue) }}</span>
        <span v-else class="text-[var(--ds-text-secondary)]">{{ t('Select date') }}</span>
        <svg
            class="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[var(--ds-text-secondary)] pointer-events-none"
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
            aria-hidden="true"
        >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0V12a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 12v6.75" />
        </svg>
    </button>

    <input
        v-else-if="fieldType === 'date'"
        type="date"
        :value="modelValue ?? ''"
        @input="onInput"
        class="w-full rounded-lg border border-[#e0d8c8] bg-white px-4 py-3 text-sm text-[var(--ds-text)] focus:border-[var(--ds-accent)] focus:outline-none"
    />

    <input
        v-else-if="fieldType === 'text'"
        type="text"
        :value="modelValue ?? ''"
        @input="onInput"
        maxlength="2000"
        class="w-full rounded-lg border border-[#e0d8c8] bg-white px-4 py-3 text-sm text-[var(--ds-text)] placeholder:text-[var(--ds-text-secondary)] focus:border-[var(--ds-accent)] focus:outline-none"
    />

    <textarea
        v-else-if="fieldType === 'textarea'"
        :value="modelValue ?? ''"
        @input="onInput"
        rows="3"
        maxlength="2000"
        class="w-full rounded-lg border border-[#e0d8c8] bg-white px-4 py-3 text-sm text-[var(--ds-text)] placeholder:text-[var(--ds-text-secondary)] focus:border-[var(--ds-accent)] focus:outline-none resize-y"
    ></textarea>
</template>
