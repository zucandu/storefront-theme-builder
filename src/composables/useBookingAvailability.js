import { ref, shallowRef } from 'vue';

export function useBookingAvailability(productId) {
    const cache = shallowRef(new Map());
    const loading = ref(false);
    const error = ref(null);
    const horizonMaxDate = ref(null);

    function key(year, month) {
        const mm = String(month).padStart(2, '0');
        return `${productId}:${year}-${mm}`;
    }

    function getCached(year, month) {
        return cache.value.get(key(year, month)) ?? null;
    }

    async function loadMonth(year, month) {
        const cached = getCached(year, month);
        if (cached) {
            horizonMaxDate.value = cached.horizon_max_date;
            return cached;
        }

        loading.value = true;
        error.value = null;
        try {
            const data = {
                unavailable_dates: [],
                partial_dates: [],
                horizon_max_date: `${year + 1}-12-31`,
            };
            const next = new Map(cache.value);
            next.set(key(year, month), data);
            cache.value = next;
            horizonMaxDate.value = data.horizon_max_date;
            return data;
        } catch (e) {
            error.value = 'Could not load availability.';
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function prefetchMonth(year, month) {
        if (getCached(year, month)) return;
        const data = {
            unavailable_dates: [],
            partial_dates: [],
            horizon_max_date: `${year + 1}-12-31`,
        };
        const next = new Map(cache.value);
        next.set(key(year, month), data);
        cache.value = next;
    }

    function invalidate(year, month) {
        const next = new Map(cache.value);
        next.delete(key(year, month));
        cache.value = next;
    }

    return {
        loading,
        error,
        horizonMaxDate,
        loadMonth,
        prefetchMonth,
        invalidate,
        getCached,
    };
}
