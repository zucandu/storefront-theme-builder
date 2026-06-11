import { ref } from 'vue';

export function useCheckoutCoupon() {
    const couponCode = ref('');
    const couponError = ref('');
    const couponLoading = ref(false);
    const appliedCoupon = ref(null);
    const hasCouponModule = ref(true);

    async function applyCoupon() {
        const code = couponCode.value.trim();
        if (!code) return;
        couponError.value = '';
        couponLoading.value = true;
        try {
            await new Promise(r => setTimeout(r, 300));
            appliedCoupon.value = { id: 'CouponModule', code, discount: 10 };
            couponCode.value = '';
        } catch {
            couponError.value = 'Invalid coupon code';
        } finally {
            couponLoading.value = false;
        }
    }

    async function removeCoupon() {
        couponError.value = '';
        couponLoading.value = true;
        await new Promise(r => setTimeout(r, 200));
        appliedCoupon.value = null;
        couponLoading.value = false;
    }

    return {
        couponCode,
        couponError,
        couponLoading,
        hasCouponModule,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
    };
}
