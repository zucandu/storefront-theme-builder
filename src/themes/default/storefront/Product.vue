<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useHelpers } from '@/composables/useHelpers';
import { useRestockModal } from '@/composables/useRestockModal';
import { useStorefrontIframeHooks } from '@/composables/useStorefrontIframeHooks';

import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useProductStore } from '@/stores/catalog/product';
import { useCartStore } from '@/stores/cart';
import { useWishlistStore } from '@/stores/wishlist';

import ProductCard from '@theme/storefront/components/listing/ProductCard.vue'
import Breadcrumb from '@theme/storefront/components/Breadcrumb.vue'
import RestockModal from '@theme/storefront/components/RestockModal.vue'
import StorefrontIframeHook from '@theme/storefront/components/layout/StorefrontIframeHook.vue'
import BookablePicker from '@theme/storefront/components/booking/BookablePicker.vue'

import {
    MinusIcon,
    PlusIcon,
} from '@heroicons/vue/24/outline';

const { t, locale } = useI18n();
const toast = useToast();
const productStore = useProductStore();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const authCustomerStore = useAuthCustomerStore();
const { translateItemField, translateItemObj } = useHelpers();
const { isRestockModalOpen, restockForm, submitting, openRestockModal, closeRestockModal, restockNotify, selectedProductName } = useRestockModal();

const { hooks: afterAddToCartHooks, fetchHooks: fetchAfterAddToCartHooks } = useStorefrontIframeHooks('storefront_product_after_add_to_cart');
const { hooks: afterDescHooks, fetchHooks: fetchAfterDescHooks } = useStorefrontIframeHooks('storefront_product_after_description');
const { hooks: productBottomHooks, fetchHooks: fetchProductBottomHooks } = useStorefrontIframeHooks('storefront_product_bottom');

const loaded = ref(false);
const route = useRoute();
const selectedAttributes = ref({});
const formdata = ref({ qty: 1, meta: {} });
const selectedImageIndex = ref(0);
const addingToCart = ref(false);
const reviews = ref([]);
const crossSells = ref([]);
const upSells = ref([]);
const loadingRelated = ref(true);

// Booking restore (TB.8.6.x): when the customer comes back from /cart via
// the product link, we receive `?cart_row={compositeId}` and pre-fill the
// BookablePicker with the saved selection. The composite id is
// "{productId}!{hash}" — see BookingCompositeId::for(). We look the row up
// in the already-loaded cart store (no extra request) and only use it when
// the row exists AND belongs to this product. Anything else (stale link,
// pasted URL across products, non-booking product) silently falls through
// to default selections.
const initialBookingSelection = computed(() => {
    const cartRowId = route.query.cart_row;
    if (!cartRowId) return {};
    const productId = productStore.productDetails?.id;
    if (!productId) return {};
    // Composite id starts with the real product id followed by '!'.
    if (!String(cartRowId).startsWith(`${productId}!`)) return {};
    const row = cartStore.items.find(it => it.id === cartRowId);
    return row?.meta?.booking?.fields ?? {};
});

// Query product details by slug
onMounted(async () => {
    await productStore.retrieveProductDetails(route.params.slug).finally(() => loaded.value = true);
    fetchAfterAddToCartHooks();
    fetchAfterDescHooks();
    fetchProductBottomHooks();
    if(productStore.productDetails.default_attributes !== undefined) {
        Object.keys(productStore.productDetails.default_attributes).forEach(aoId => (selectedAttributes.value = {  ...selectedAttributes.value, [aoId]: productStore.productDetails.default_attributes[aoId] }))
    }
    // Fetch reviews, cross-sells, up-sells in parallel
    if (productStore.productDetails.id) {
        const pid = productStore.productDetails.id;
        productStore.fetchLatestReviews(pid).then(data => reviews.value = data || []).catch(() => {});
        Promise.all([
            productStore.fetchCrossSells(pid).then(data => crossSells.value = data || []).catch(() => {}),
            productStore.fetchUpSells(pid).then(data => upSells.value = data || []).catch(() => {}),
        ]).finally(() => loadingRelated.value = false);
    }
});

// Re-fetch product data when navigating between products (cross-sell/up-sell clicks)
onBeforeRouteUpdate(async (to, from, next) => {
    loaded.value = false;
    selectedAttributes.value = {};
    formdata.value = { qty: 1, meta: {} };
    selectedImageIndex.value = 0;
    reviews.value = [];
    crossSells.value = [];
    upSells.value = [];
    loadingRelated.value = true;

    await productStore.retrieveProductDetails(to.params.slug).finally(() => loaded.value = true);
    if (productStore.productDetails.default_attributes !== undefined) {
        Object.keys(productStore.productDetails.default_attributes).forEach(aoId => (selectedAttributes.value = { ...selectedAttributes.value, [aoId]: productStore.productDetails.default_attributes[aoId] }));
    }
    if (productStore.productDetails.id) {
        const pid = productStore.productDetails.id;
        productStore.fetchLatestReviews(pid).then(data => reviews.value = data || []).catch(() => {});
        Promise.all([
            productStore.fetchCrossSells(pid).then(data => crossSells.value = data || []).catch(() => {}),
            productStore.fetchUpSells(pid).then(data => upSells.value = data || []).catch(() => {}),
        ]).finally(() => loadingRelated.value = false);
    }
    next();
});

// Get real product data
const productComputed = computed(() => {

    // Get product details
    const actualProduct = productStore.childProduct(productStore.productDetails, selectedAttributes.value);
    const productData = actualProduct !== undefined ? actualProduct : productStore.productDetails;

    // Get translation
    const translation = translateItemObj(productData, locale.value);

    // Manufacturer
    const manufacturerTranslation = translateItemObj(productStore.productDetails.manufacturer, locale.value);

    // Set readonly attributes
	const readonlyAttributes = productStore.getAttributes(productData, 'readonly');

	// Set meta tags
	document.title = translation?.meta_title || zucConfig.store_name;
	const metaDesc = document.querySelector('meta[name="description"]');
	if (metaDesc) metaDesc.content = translation?.meta_description || '';

    return { productData, translation, manufacturerTranslation, readonlyAttributes };
});

// Computed helpers
const rating = computed(() => Math.round(productComputed.value?.productData?.rating || 0));

const hasSale = computed(() => productComputed.value?.productData?.sale_price > 0);

const salePercent = computed(() => {
    const p = productComputed.value?.productData;
    if (!hasSale.value || !p?.price) return 0;
    return Math.round((1 - p.sale_price / p.price) * 100);
});

const images = computed(() => {
    const child = productComputed.value?.productData;
    // Show child variant images if available, fallback to parent
    if (child?.images?.length) return child.images;
    const parent = productStore.productDetails;
    if (!parent?.images?.length) return [];
    return parent.images;
});

const mainImageSrc = computed(() => {
    const img = images.value[selectedImageIndex.value];
    if (!img) return '/images/placeholder.webp';
    return `${zucConfig.store_url}/storage/${img.src}`;
});

const inStock = computed(() => (productComputed.value?.productData?.quantity || 0) > 0);

const hasQuantityDiscount = computed(() => +productComputed.value?.productData?.quantity_discount_status === 1);

const calculateDiscountedPrice = (discount) => {
    const p = productComputed.value?.productData
    const basePrice = +p?.sale_price > 0 ? parseFloat(p.sale_price) : parseFloat(p?.price || 0)
    if (discount.discount_type === 1) return +(basePrice - discount.discount_amount)
    if (discount.discount_type === 2) return +(basePrice - (basePrice * (discount.discount_amount / 100)))
    return +basePrice
}

const calculatePercentageDiscount = (discount) => {
    const price = parseFloat(productComputed.value?.productData?.price || 0)
    if (discount.discount_type === 1) return ((discount.discount_amount / price) * 100).toFixed(0)
    if (discount.discount_type === 2) return discount.discount_amount
    return 0
};

// Find the active quantity discount tier based on current qty
const activeQuantityDiscount = computed(() => {
    const p = productComputed.value?.productData
    if (!p || +p.quantity_discount_status !== 1 || !p.quantity_discounts?.length) return null
    return p.quantity_discounts.find(d => formdata.value.qty >= d.min_qty && formdata.value.qty <= d.max_qty)
        || (formdata.value.qty >= p.quantity_discounts[p.quantity_discounts.length - 1].min_qty
            ? p.quantity_discounts[p.quantity_discounts.length - 1]
            : null)
});

// Base unit price (sale_price if on sale, otherwise price)
const baseUnitPrice = computed(() => {
    const p = productComputed.value?.productData
    return +p?.sale_price > 0 ? parseFloat(p.sale_price) : parseFloat(p?.price || 0)
});

// Booking-only: extra charge from BookablePicker selections (e.g. Pet=Dog +$2,
// Duration=30m +$5). Stays 0 for non-booking products. Cart wiring is a
// separate task — for now this only feeds the displayed unit price.
const bookingPriceDelta = ref(0);
const bookingSelection = ref({});
// TB.10.1.1 — set by BookablePicker via update:hasMissingRequired event whenever
// any admin-marked required field (date/text/textarea, is_required=1) is empty.
// Drives the ADD TO CART button's disabled state below.
const bookingHasMissingRequired = ref(false);

// TB.9.X.1 — full server quote response from BookablePicker. Drives the
// duration breakdown line ($180 × 5 nights = $900) and the prominent
// subtotal display. Null until the first successful quote() call lands;
// breakdown line guards on `bookingQuote && bookingCount > 1` so first
// paint and single-unit picks fall through cleanly.
const bookingQuote = ref(null);

// Unit price after quantity discount (if applicable)
const effectiveUnitPrice = computed(() => {
    const d = activeQuantityDiscount.value
    if (!d) return null
    return calculateDiscountedPrice(d)
});

// Booking unit price = base + delta. Non-booking products ignore this.
const bookingUnitPrice = computed(() => baseUnitPrice.value + (bookingPriceDelta.value || 0));

// TB.9.X.1 hotfix — true only when a booking product has BOTH start and end
// FK columns configured by the admin. Drives whether the qty stepper hides
// (configured booking → count drives subtotal, qty pinned to 1) or stays
// visible (unconfigured booking → no calendar to pick a range, count
// always = 1 fallback, customer needs the stepper to pick > 1 unit so they
// don't get stuck with a flat-priced single-unit booking). Mirrors the same
// FK-pair gate that BookingAvailabilityService uses (TB.9.2.2 fall-through).
// True when the product is a booking with at least the start FK configured.
// End FK is OPTIONAL — null = single-date mode (consumes one day per
// booking), non-null = range mode (hotel-style check-in/check-out).
// The qty stepper hides for either configured shape: configured bookings
// get `cart_quantity = 1` (one row per booking) and the customer picks
// dates instead of using the stepper.
const bookingHasFkPair = computed(() => {
    const p = productComputed.value?.productData;
    return p?.type === 'booking'
        && p?.booking_start_attribute_option_id != null;
});

// TB.9.X.1 — duration breakdown computeds derived from the server quote.
// Falls back to count = 1 / unit = 'night' / subtotal = bookingUnitPrice
// before the first quote response so the price block always has values
// to render (no null-coalescing inside the template).
const bookingCount = computed(() => bookingQuote.value?.count ?? 1);
const bookingCountUnit = computed(() => bookingQuote.value?.count_unit ?? 'night');
const bookingSubtotal = computed(() => bookingQuote.value?.subtotal ?? bookingUnitPrice.value);

// TB.9.X.1 hotfix — big price displayed in the prominent slot. Configured
// booking products (FK pair set) → show server-authoritative subtotal as
// is (count × unit, qty pinned to 1). Unconfigured booking products fall
// back to unit × qty multiplication (stepper drives the qty, no calendar
// to drive a count).
const bookingDisplayPrice = computed(() => {
    if (bookingHasFkPair.value) return bookingSubtotal.value;
    return bookingSubtotal.value * (formdata.value.qty > 0 ? formdata.value.qty : 1);
});

// Pluralized unit label. Project only ships `$t()` (no `$tc` for true
// plural rules), so we ternary on the count and translate the singular/
// plural forms separately. EN-only-friendly; translators get full freedom
// to map e.g. `nights` differently.
const bookingCountUnitLabel = computed(() => {
    const c = bookingCount.value;
    const u = bookingCountUnit.value;
    if (u === 'day')  return c === 1 ? t('day')  : t('days');
    if (u === 'hour') return c === 1 ? t('hour') : t('hours');
    return c === 1 ? t('night') : t('nights');
});

const totalReviews = computed(() => productStore.productDetails?.total_reviews || 0);

const averageRating = computed(() => {
    if (!reviews.value.length) return 0;
    const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.value.length).toFixed(1);
});

function scrollToReviews() {
    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
}

// Category breadcrumb chain from product details (full ancestor path)
const categoryBreadcrumbs = computed(() => {
    const product = productStore.productDetails;
    if (!product?.categories?.length) return [];
    return product.categories.map(cat => translateItemObj(cat, locale.value));
});

// Breadcrumb items for Breadcrumb component
const breadcrumbItems = computed(() => {
    const items = [{ name: t('Home'), url: '/' }];
    for (const crumb of categoryBreadcrumbs.value) {
        items.push({ name: crumb.name, url: `/category/${crumb.slug}` });
    }
    const name = productComputed.value?.translation?.name;
    if (name) items.push({ name });
    return items;
});

// Reset image index when variant changes
watch(selectedAttributes, async (val) => {
    selectedImageIndex.value = 0;
    const oids = await Promise.all(Object.keys(val))
    oids.forEach(oid => {
        const attrEls = document.querySelectorAll(`#option${oid} .aov-item`)
        attrEls.forEach(e => document.querySelector(`#attr-${oid}-${e.getAttribute('data-aovid')}`).classList.remove('outofstock', 'invalid'))
        productStore.productDetails.attributes.filter(at => +at.attribute_option_id === +oid)
            .map(r => r.attribute_option_value_id)
            .forEach(ovid => {
                const childProduct = productStore.childProduct(productStore.productDetails, { ...selectedAttributes.value, [oid]: ovid })
                if(childProduct.status === 0) {
                    document.querySelector(`#attr-${oid}-${ovid}`).classList.add('invalid')
                } else {
                    if(childProduct.quantity === 0) {
                        document.querySelector(`#attr-${oid}-${ovid}`).classList.add('outofstock')
                    }
                }
            })
    })
}, { deep: true });

const togglingWishlist = ref(false);
const toggleWishlist = async () => {
    if (!authCustomerStore.isLoggedIn) {
        toast.info(t('Please login to add items to your wishlist'));
        return;
    }
    const { productData } = productComputed.value;
    togglingWishlist.value = true;
    try {
        const action = await wishlistStore.toggleProduct(productData.id);
        toast.success(t(action === 'added' ? 'Added to wishlist' : 'Removed from wishlist'));
    } catch {
        toast.error(t('Failed to update wishlist'));
    } finally {
        togglingWishlist.value = false;
    }
};

const addToCart = async () => {
    if (addingToCart.value) return;  // T33.B.3 — double-click guard
    const { productData, translation } = productComputed.value;
    addingToCart.value = true;
    const qty = formdata.value.qty > 0 ? formdata.value.qty : 1;
    try {
        if (productData.type === 'booking') {
            // B.8.6.3 — booking products go through the dedicated endpoint;
            // server recomputes price from the persisted `fields` selection
            // (BookingPriceCalculator). Never carries pricing fields client-side.
            // TB.9.X.1 — fork on FK-pair config:
            //   - With FK pair (configured booking): pin cart_quantity = 1
            //     because the duration count multiplier (server-side) drives
            //     the subtotal — qty stepper is hidden in the template.
            //   - Without FK pair (legacy / unconfigured booking): no
            //     calendar to pick a range, count falls through to 1
            //     server-side, and the qty stepper is shown — pass
            //     formdata.qty so the customer can actually buy > 1 unit.
            const cartQty = bookingHasFkPair.value
                ? 1
                : (formdata.value.qty > 0 ? formdata.value.qty : 1);
            await cartStore.addBookingProduct({
                id: productData.id,
                cart_quantity: cartQty,
                fields: bookingSelection.value || {},
            });
        } else {
            await cartStore.addProduct({
                id: productData.id,
                cart_quantity: qty,
                meta: formdata.value.meta
            });
        }
        toast.success(t('cart.itemAdded', { name: translation.name }));
    } catch (error) {
        toast.error(error.response?.data?.message || t('Failed to add product to cart'));
    } finally {
        addingToCart.value = false;
    }
}

function updateMetaForm(obj) {
    formdata.value.meta = { ...formdata.value.meta, ...obj }
}

function decrementQty() {
    if (formdata.value.qty > 1) formdata.value.qty--;
}

function incrementQty() {
    formdata.value.qty++;
}
</script>

<template>
    <div>

        <!-- Skeleton loading state -->
        <template v-if="!loaded">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
                    <!-- Breadcrumb skeleton -->
                    <div class="flex items-center gap-2 mb-8">
                        <div class="h-3 w-10 bg-[#e0d8c8] rounded animate-pulse"></div>
                        <div class="h-3 w-3 bg-[#e0d8c8] rounded animate-pulse"></div>
                        <div class="h-3 w-20 bg-[#e0d8c8] rounded animate-pulse"></div>
                        <div class="h-3 w-3 bg-[#e0d8c8] rounded animate-pulse"></div>
                        <div class="h-3 w-32 bg-[#e0d8c8] rounded animate-pulse"></div>
                    </div>

                    <!-- Product layout skeleton -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <!-- Image skeleton -->
                        <div>
                            <div class="aspect-square bg-[#e0d8c8] rounded-2xl animate-pulse"></div>
                            <div class="flex gap-3 mt-4">
                                <div v-for="i in 4" :key="i" class="w-20 h-20 bg-[#e0d8c8] rounded-xl animate-pulse"></div>
                            </div>
                        </div>

                        <!-- Info skeleton -->
                        <div class="space-y-6">
                            <div class="h-3 w-24 bg-[#e0d8c8] rounded animate-pulse"></div>
                            <div class="h-8 w-3/4 bg-[#e0d8c8] rounded animate-pulse"></div>
                            <div class="h-4 w-32 bg-[#e0d8c8] rounded animate-pulse"></div>
                            <div class="flex gap-1">
                                <div v-for="i in 5" :key="i" class="size-4 bg-[#e0d8c8] rounded animate-pulse"></div>
                            </div>
                            <div class="h-8 w-28 bg-[#e0d8c8] rounded animate-pulse"></div>
                            <div class="h-px bg-[#e0d8c8] w-full"></div>
                            <div class="space-y-3">
                                <div class="h-4 w-20 bg-[#e0d8c8] rounded animate-pulse"></div>
                                <div class="flex gap-3">
                                    <div v-for="i in 3" :key="i" class="h-10 w-20 bg-[#e0d8c8] rounded-lg animate-pulse"></div>
                                </div>
                            </div>
                            <!-- Specs skeleton -->
                            <div class="space-y-2">
                                <div class="h-3 w-24 bg-[#e0d8c8] rounded animate-pulse"></div>
                                <div class="flex gap-4">
                                    <div class="h-4 w-24 bg-[#e0d8c8] rounded animate-pulse"></div>
                                    <div class="h-4 flex-1 bg-[#e0d8c8] rounded animate-pulse"></div>
                                </div>
                                <div class="flex gap-4">
                                    <div class="h-4 w-24 bg-[#e0d8c8] rounded animate-pulse"></div>
                                    <div class="h-4 flex-1 bg-[#e0d8c8] rounded animate-pulse"></div>
                                </div>
                            </div>
                            <div class="flex gap-4">
                                <div class="h-12 w-32 bg-[#e0d8c8] rounded-xl animate-pulse"></div>
                                <div class="h-12 flex-1 bg-[#e0d8c8] rounded-xl animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Description skeleton -->
                    <div class="mt-16 space-y-3">
                        <div class="h-6 w-32 bg-[#e0d8c8] rounded animate-pulse"></div>
                        <div class="h-4 w-full bg-[#e0d8c8] rounded animate-pulse"></div>
                        <div class="h-4 w-5/6 bg-[#e0d8c8] rounded animate-pulse"></div>
                        <div class="h-4 w-4/6 bg-[#e0d8c8] rounded animate-pulse"></div>
                    </div>
                </div>
        </template>

        <!-- Loaded content -->
        <template v-else>
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

                <!-- Breadcrumb -->
                <Breadcrumb :items="breadcrumbItems" />

                <!-- Product layout -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

                    <!-- Left: Image gallery -->
                    <div class="lg:sticky lg:top-28 lg:self-start">
                        <!-- Main image -->
                        <div class="relative overflow-hidden rounded-2xl bg-[var(--ds-neutral)] aspect-square">
                            <!-- Sale badge -->
                            <div v-if="hasSale && salePercent > 0" class="absolute top-4 left-4 z-10">
                                <span class="rounded bg-white/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-[var(--ds-sale)] shadow-sm uppercase tracking-wider">
                                    -{{ salePercent }}%
                                </span>
                            </div>

                            <!-- Out of stock overlay -->
                            <div v-if="!inStock" class="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                                <span class="text-sm font-medium text-[var(--ds-text-secondary)] uppercase tracking-wider bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                                    {{ $t('Out of stock') }}
                                </span>
                            </div>

                            <img
                                :src="mainImageSrc"
                                :alt="productComputed.translation.name"
                                class="h-full w-full object-contain p-4 transition-opacity duration-300"
                                @error.once="e => e.target.src = '/images/placeholder.webp'"
                            />
                        </div>

                        <!-- Thumbnail strip -->
                        <div v-if="images.length > 1" class="flex gap-3 mt-4 overflow-x-auto p-2">
                            <button
                                v-for="(img, index) in images"
                                :key="index"
                                type="button"
                                @click="selectedImageIndex = index"
                                :class="[
                                    'shrink-0 size-20 rounded-xl overflow-hidden bg-[var(--ds-neutral)] transition-all duration-200',
                                    selectedImageIndex === index
                                        ? 'ring-2 ring-[var(--ds-accent)] ring-offset-2'
                                        : 'ring-1 ring-[#e0d8c8] hover:ring-[var(--ds-accent)]'
                                ]"
                            >
                                <img
                                    :src="`${zucConfig.store_url}/storage/${zucConfig.small_image_size}/${img.src}`"
                                    :alt="productComputed.translation.name"
                                    class="h-full w-full object-contain p-1.5"
                                    loading="lazy"
                                    @error.once="e => e.target.src = '/images/placeholder.webp'"
                                />
                            </button>
                        </div>
                    </div>

                    <!-- Right: Product info -->
                    <div class="flex flex-col">
                        <form @submit.prevent="addToCart" class="flex flex-col h-full">

                            <!-- Manufacturer -->
                            <p v-if="productComputed.manufacturerTranslation" class="!mb-0 text-[10px] font-medium text-[var(--ds-text-secondary)] uppercase tracking-widest">
                                <LocalizedLink
                                    :to="`/manufacturer/${productComputed.manufacturerTranslation.slug}`"
                                    class="hover:text-[var(--ds-text)] transition-colors"
                                >
                                    {{ productComputed.manufacturerTranslation.name }}
                                </LocalizedLink>
                            </p>

                            <!-- Product name -->
                            <h1 class="font-[family-name:var(--font-display)] text-4xl sm:text-5xl tracking-wide text-[var(--ds-text)] mt-2">
                                {{ productComputed.translation.name }}
                            </h1>

                            <!-- Rating + Review link -->
                            <div class="flex items-center gap-3 mt-3">
                                <button
                                    v-if="rating > 0"
                                    type="button"
                                    @click="scrollToReviews"
                                    class="flex items-center gap-1.5 cursor-pointer group"
                                >
                                    <div class="flex items-center gap-0.5">
                                        <svg
                                            v-for="i in 5"
                                            :key="i"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            :class="['size-4', i <= rating ? 'text-[var(--ds-accent)]' : 'text-[#e0d8c8]']"
                                        >
                                            <path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                    <span v-if="totalReviews > 0" class="text-xs text-[var(--ds-text-secondary)] group-hover:text-[var(--ds-accent)] transition-colors">
                                        ({{ totalReviews }})
                                    </span>
                                </button>
                                <span v-if="rating > 0 && totalReviews > 0" class="text-[#e0d8c8]">|</span>
                                <LocalizedLink
                                    :to="`/product/${productComputed.translation.slug}/write-review`"
                                    class="text-xs text-[var(--ds-text-secondary)] hover:text-[var(--ds-accent)] transition-colors"
                                >
                                    {{ $t('Write a Review') }}
                                </LocalizedLink>
                            </div>

                            <!-- SKU + Stock status -->
                            <div class="flex items-center gap-4 mt-4 text-xs text-[var(--ds-text-secondary)]">
                                <span v-if="productComputed.productData.sku">
                                    {{ $t('SKU') }}: {{ productComputed.productData.sku }}
                                </span>
                                <span :class="inStock ? 'text-green-600' : 'text-red-500'">
                                    {{ inStock ? $t('In stock') : $t('Out of stock') }}
                                </span>
                            </div>

                            <!-- Price -->
                            <div class="ds-price mt-6">
                                <template v-if="productComputed.productData?.type === 'booking'">
                                    <span class="font-[family-name:var(--font-display)] text-3xl text-[var(--ds-text)]">
                                        <PriceDisplay :price="bookingDisplayPrice" />
                                    </span>
                                    <!-- TB.9.X.1 — duration breakdown. Hides on first paint
                                         (bookingQuote === null), single-unit picks (count = 1),
                                         and on quote errors (last-known-good retained).
                                         Also gated on bookingHasFkPair: unconfigured booking
                                         products always have count = 1 fallback so the breakdown
                                         line would never render anyway, but the explicit gate
                                         documents the intent and avoids surprising future readers. -->
                                    <p v-if="bookingHasFkPair && bookingQuote && bookingCount > 1" class="!mb-0 mt-1 text-xs text-[var(--ds-text-secondary)]">
                                        <PriceDisplay :price="bookingUnitPrice" /> &times; {{ bookingCount }} {{ bookingCountUnitLabel }} = <PriceDisplay :price="bookingSubtotal" />
                                    </p>
                                </template>
                                <template v-else-if="activeQuantityDiscount">
                                    <div class="flex items-baseline gap-3">
                                        <span class="font-[family-name:var(--font-display)] text-3xl text-[var(--ds-text)]">
                                            <PriceDisplay :price="effectiveUnitPrice * formdata.qty" />
                                        </span>
                                        <span class="text-sm text-[var(--ds-text-secondary)] line-through">
                                            <PriceDisplay :price="baseUnitPrice * formdata.qty" />
                                        </span>
                                        <span
                                            class="inline-flex items-center rounded bg-[#b44c3a]/10 text-[#b44c3a] px-1.5 py-0.5 text-[11px] font-bold"
                                            style="font-family: var(--font-label)"
                                        >
                                            -{{ calculatePercentageDiscount(activeQuantityDiscount) }}%
                                        </span>
                                    </div>
                                    <p class="!mb-0 mt-1 text-xs text-[var(--ds-text-secondary)]">
                                        <PriceDisplay :price="effectiveUnitPrice" /> {{ $t('each') }}
                                    </p>
                                </template>
                                <PriceConverter
                                    v-else
                                    :product="productComputed.productData"
                                    :qty="formdata.qty"
                                    class="font-[family-name:var(--font-display)] text-3xl text-[var(--ds-text)]"
                                />
                            </div>

                            <!-- Divider -->
                            <div class="h-px bg-[#e0d8c8] my-6"></div>

                            <!-- Variant selectors (configurable products only — booking products use the booking-fields block below) -->
                            <div v-if="productStore.getVariants.length > 0 && productComputed.productData?.type !== 'booking'" class="space-y-5">
                                <div v-for="ao in productStore.getVariants" :key="ao.id">
                                    <div :id="`option${ao.id}`">
                                        <div class="mb-2.5">
                                            <span class="text-sm font-medium text-[var(--ds-text)]">{{ translateItemField(ao, 'name', $i18n.locale) }}</span>
                                            <span class="ml-2 text-sm text-[var(--ds-text-secondary)]">{{ translateItemField(ao.values.find(v => v.id === selectedAttributes[ao.id]), 'name', $i18n.locale) }}</span>
                                        </div>
                                        <div class="flex flex-wrap gap-2.5">
                                            <button
                                                v-for="aov in ao.values"
                                                :key="aov.vid"
                                                type="button"
                                                :data-aovid="aov.vid"
                                                :id="`attr-${ao.id}-${aov.vid}`"
                                                @click.stop="selectedAttributes[ao.id] = aov.vid"
                                                :class="[
                                                    'aov-item relative cursor-pointer rounded-lg text-center transition-all duration-200',
                                                    +ao.display_ov_image === 1 && aov.image
                                                        ? 'p-1 size-16'
                                                        : 'px-4 py-2.5 text-sm min-w-[3.5rem]',
                                                    selectedAttributes[ao.id] === aov.vid
                                                        ? 'bg-[var(--ds-primary)] text-white ring-1 ring-[var(--ds-primary)]'
                                                        : 'bg-white text-[var(--ds-text)] ring-1 ring-[#e0d8c8] hover:ring-[var(--ds-accent)]'
                                                ]"
                                            >
                                                <template v-if="+ao.display_ov_image === 1 && aov.image">
                                                    <img
                                                        :src="`/storage/${zucConfig.small_image_size}/${aov.image}`"
                                                        :alt="translateItemField(aov, 'name', $i18n.locale)"
                                                        :width="zucConfig.small_image_size"
                                                        :height="zucConfig.small_image_size"
                                                        class="h-full w-full object-contain rounded-md"
                                                    />
                                                </template>
                                                <template v-else>
                                                    {{ translateItemField(aov, 'name', $i18n.locale) }}
                                                </template>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Divider after variants -->
                                <div class="h-px bg-[#e0d8c8]"></div>
                            </div>

                            <!-- Booking fields (extracted into reusable component per Part A polish; B.8.6 will add reactive state + quote integration).
                                 TB.9.3.3 — pass productId + start/end FK pair so BookablePicker can mount the
                                 shared BookingCalendarModal and the AttributeFieldRenderer for each FK-bound
                                 date cell can render as a calendar trigger. NULL FK pair → plain date input. -->
                            <BookablePicker
                                v-if="productComputed.productData?.type === 'booking'"
                                :fields="productStore.productDetails?.booking_fields ?? []"
                                :initial-selection="initialBookingSelection"
                                :product-id="productStore.productDetails?.id ?? null"
                                :booking-start-option-id="productStore.productDetails?.booking_start_attribute_option_id ?? null"
                                :booking-end-option-id="productStore.productDetails?.booking_end_attribute_option_id ?? null"
                                @update:priceDelta="bookingPriceDelta = $event"
                                @update:selection="bookingSelection = $event"
                                @update:hasMissingRequired="bookingHasMissingRequired = $event"
                                @update:bookingQuote="bookingQuote = $event"
                            />

                            <!-- Specifications -->
                            <div v-if="Object.keys(productComputed.readonlyAttributes).length > 0" class="mt-5">
                                <h3 class="font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--ds-text-secondary)] mb-3">{{ $t('Specifications') }}</h3>
                                <div class="overflow-hidden rounded-lg">
                                    <table class="min-w-full text-sm">
                                        <tbody class="divide-y divide-[#e0d8c8]">
                                            <tr
                                                v-for="(attr, attrId) in productComputed.readonlyAttributes"
                                                :key="attrId"
                                                class="odd:bg-white even:bg-[var(--ds-neutral)]/50"
                                            >
                                                <td class="px-4 py-2.5 font-[family-name:var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] w-2/5">
                                                    {{ translateItemField(attr, 'name', $i18n.locale) }}
                                                </td>
                                                <td class="px-4 py-2.5 text-[var(--ds-text)]">
                                                    {{ attr.values.map(v => translateItemField(v, 'name', $i18n.locale)).join(', ') }}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Quantity Discount Tiers -->
                            <div v-if="hasQuantityDiscount && productComputed.productData.quantity_discounts?.length" class="mt-6">
                                <h3 class="font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-[var(--ds-text-secondary)] mb-3">
                                    {{ $t('Buy More, Save More!') }}
                                </h3>
                                <div class="grid grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2">
                                    <div
                                        v-for="(discount, k) in productComputed.productData.quantity_discounts"
                                        :key="k"
                                        :class="[
                                            'relative rounded-lg border p-3 text-center',
                                            activeQuantityDiscount === discount
                                                ? 'border-[var(--ds-accent)] bg-[var(--ds-accent)]/10 ring-1 ring-[var(--ds-accent)]'
                                                : 'border-[#e0d8c8] bg-[var(--ds-neutral)]'
                                        ]"
                                    >
                                        <!-- Best value badge -->
                                        <span
                                            v-if="k === productComputed.productData.quantity_discounts.length - 1"
                                            class="absolute -top-2 left-1/2 -translate-x-1/2 hidden sm:inline-flex items-center gap-1 rounded-full bg-[var(--ds-accent)] text-[var(--ds-primary)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap"
                                            style="font-family: var(--font-label)"
                                        >
                                            {{ $t('Best value') }}
                                        </span>

                                        <!-- Qty range -->
                                        <div class="text-[11px] uppercase tracking-wide text-[var(--ds-text-secondary)] mb-1" style="font-family: var(--font-label)">
                                            {{ $t('Buy') }}
                                            <span class="font-semibold text-[var(--ds-text)]">{{ discount.min_qty }}</span>
                                            <template v-if="k === productComputed.productData.quantity_discounts.length - 1">+</template>
                                            <template v-else>–<span class="font-semibold text-[var(--ds-text)]">{{ discount.max_qty }}</span></template>
                                        </div>

                                        <!-- Price -->
                                        <div class="text-sm font-semibold text-[var(--ds-text)]" style="font-family: var(--font-display)">
                                            <PriceDisplay :price="calculateDiscountedPrice(discount)" />
                                        </div>

                                        <!-- Save % -->
                                        <div
                                            v-if="calculatePercentageDiscount(discount) > 0"
                                            class="mt-1 inline-flex items-center rounded bg-[#b44c3a]/10 text-[#b44c3a] px-1.5 py-0.5 text-[10px] font-bold"
                                            style="font-family: var(--font-label)"
                                        >
                                            -{{ calculatePercentageDiscount(discount) }}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Quantity + Add to Cart -->
                            <div class="mt-auto pt-6">
                                <template v-if="inStock">
                                    <div class="flex items-center gap-4">
                                        <!-- Quantity selector — TB.9.X.1: hidden ONLY for fully-
                                             configured booking products (start/end FK pair set).
                                             For booking products without an FK pair (legacy /
                                             unconfigured), the calendar trigger doesn't activate,
                                             count falls through to 1, and the customer would
                                             otherwise get stuck at a single-unit flat-priced
                                             booking — show the stepper as a fallback. -->
                                        <div v-if="!bookingHasFkPair" class="inline-flex items-center rounded-xl ring-1 ring-[#e0d8c8]">
                                            <button
                                                type="button"
                                                @click="decrementQty"
                                                class="flex items-center justify-center size-12 text-[var(--ds-text-secondary)] hover:text-[var(--ds-text)] transition-colors"
                                                :disabled="formdata.qty <= 1"
                                            >
                                                <MinusIcon class="size-4" />
                                            </button>
                                            <input
                                                v-model.number="formdata.qty"
                                                type="number"
                                                min="1"
                                                class="w-12 text-center border-0 bg-transparent text-sm font-medium text-[var(--ds-text)] focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <button
                                                type="button"
                                                @click="incrementQty"
                                                class="flex items-center justify-center size-12 text-[var(--ds-text-secondary)] hover:text-[var(--ds-text)] transition-colors"
                                            >
                                                <PlusIcon class="size-4" />
                                            </button>
                                        </div>

                                        <!-- Add to Cart button -->
                                        <button
                                            type="submit"
                                            :disabled="addingToCart || bookingHasMissingRequired"
                                            :title="bookingHasMissingRequired ? $t('Please fill all required fields') : ''"
                                            class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--ds-accent)] py-3.5 font-[family-name:var(--font-label)] text-sm font-bold uppercase tracking-wider text-[var(--ds-primary)] hover:bg-[var(--ds-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <svg v-if="addingToCart" class="animate-spin size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                            </svg>
                                            <span>{{ addingToCart ? $t('Adding...') : $t('Add to Cart') }}</span>
                                        </button>

                                        <!-- Wishlist toggle -->
                                        <button
                                            type="button"
                                            :disabled="togglingWishlist"
                                            @click="toggleWishlist"
                                            class="flex items-center justify-center size-12 rounded-xl border border-[#e0d8c8] text-[var(--ds-text-secondary)] hover:text-[var(--ds-sale)] hover:border-[var(--ds-sale)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            :title="wishlistStore.isInWishlist(productComputed.productData?.id) ? $t('Remove from wishlist') : $t('Add to wishlist')"
                                        >
                                            <!-- Filled heart (in wishlist) -->
                                            <svg v-if="wishlistStore.isInWishlist(productComputed.productData?.id)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5 text-[var(--ds-sale)]">
                                                <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                                            </svg>
                                            <!-- Outline heart (not in wishlist) -->
                                            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                                            </svg>
                                        </button>
                                    </div>
                                </template>
                                <template v-else>
                                    <button
                                        type="button"
                                        @click="openRestockModal(productComputed.productData)"
                                        class="w-full flex items-center justify-center gap-2 rounded-xl bg-[#c8a45c]/15 py-3.5 text-sm font-semibold text-[#c8a45c] uppercase tracking-wider hover:bg-[#c8a45c]/25 transition-colors cursor-pointer"
                                        style="font-family: var(--font-label)"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                        </svg>
                                        {{ $t('Get Notified') }}
                                    </button>
                                </template>
                            </div>

                            <!-- Storefront hook: after add to cart -->
                            <StorefrontIframeHook
                                v-for="hook in afterAddToCartHooks" :key="hook.id"
                                :hook="hook"
                                hook-point="storefront_product_after_add_to_cart"
                                :query-params="{ product_id: productComputed.productData?.id, lang: locale, store_url: zucConfig.zucandu_subdomain || zucConfig.store_url }"
                            />
                        </form>
                    </div>
                </div>

                <!-- Product description -->
                <div v-if="productComputed.translation.description" class="mt-16">
                    <div class="mb-6">
                        <h2 class="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--ds-text)]">{{ $t('Description') }}</h2>
                        <div class="w-12 h-0.5 bg-[var(--ds-accent)] mt-2"></div>
                    </div>
                    <div
                        class="prose prose-sm max-w-none text-[var(--ds-text-secondary)] leading-relaxed [&>p]:!mb-4 [&_strong]:font-semibold [&_img]:rounded-xl [&_h2]:text-lg [&_h2]:font-medium [&_h2]:text-[var(--ds-text)] [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-[var(--ds-text)] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-[var(--ds-text)] [&_a]:underline [&_a]:underline-offset-2"
                        v-html="productComputed.translation.description"
                    ></div>
                </div>

                <!-- Storefront hook: after description -->
                <StorefrontIframeHook
                    v-for="hook in afterDescHooks" :key="hook.id"
                    :hook="hook"
                    hook-point="storefront_product_after_description"
                    :query-params="{ product_id: productComputed.productData?.id, lang: locale, store_url: zucConfig.zucandu_subdomain || zucConfig.store_url }"
                />

                <!-- Related products skeleton -->
                <template v-if="loadingRelated">
                    <div v-for="i in 2" :key="i" class="mt-16">
                        <div class="mb-6">
                            <div class="h-7 w-48 bg-[#e0d8c8] rounded animate-pulse"></div>
                            <div class="w-12 h-0.5 bg-[#e0d8c8] mt-2"></div>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-6">
                            <div v-for="j in 6" :key="j" class="space-y-3">
                                <div class="aspect-square bg-[#e0d8c8] rounded-2xl animate-pulse"></div>
                                <div class="h-3 w-3/4 bg-[#e0d8c8] rounded animate-pulse"></div>
                                <div class="h-4 w-1/2 bg-[#e0d8c8] rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </template>

                <template v-else>
                    <!-- Up-sells: You may also like -->
                    <div v-if="upSells.length > 0" class="mt-16">
                        <div class="mb-6">
                            <h2 class="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--ds-text)]">{{ $t('You May Also Like') }}</h2>
                            <div class="w-12 h-0.5 bg-[var(--ds-accent)] mt-2"></div>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-6">
                            <ProductCard v-for="product in upSells" :key="product.id" :product="product" size="compact" @open-restock-modal="openRestockModal" />
                        </div>
                    </div>

                    <!-- Cross-sells: Frequently bought together -->
                    <div v-if="crossSells.length > 0" class="mt-16">
                        <div class="mb-6">
                            <h2 class="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--ds-text)]">{{ $t('Frequently Bought Together') }}</h2>
                            <div class="w-12 h-0.5 bg-[var(--ds-accent)] mt-2"></div>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-6">
                            <ProductCard v-for="product in crossSells" :key="product.id" :product="product" size="compact" @open-restock-modal="openRestockModal" />
                        </div>
                    </div>
                </template>

                <!-- Reviews section -->
                <div id="reviews-section" class="mt-16">
                    <div class="flex items-center justify-between mb-8">
                        <div>
                            <div class="flex items-center gap-3">
                                <h2 class="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--ds-text)]">{{ $t('Customer Reviews') }}</h2>
                                <span v-if="totalReviews > 0" class="text-sm text-[var(--ds-text-secondary)]">({{ totalReviews }})</span>
                            </div>
                            <div class="w-12 h-0.5 bg-[var(--ds-accent)] mt-2"></div>
                        </div>
                        <LocalizedLink
                            :to="`/product/${productComputed.translation.slug}/write-review`"
                            class="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ds-text-secondary)] hover:text-[var(--ds-accent)] transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                            {{ $t('Write a Review') }}
                        </LocalizedLink>
                    </div>

                    <!-- Rating summary -->
                    <div v-if="reviews.length > 0" class="flex items-center gap-6 mb-8 pb-8 border-b border-[#e0d8c8]">
                        <div class="text-center">
                            <div class="font-[family-name:var(--font-display)] text-5xl text-[var(--ds-text)]">{{ averageRating }}</div>
                            <div class="flex items-center gap-0.5 mt-1.5 justify-center">
                                <svg
                                    v-for="i in 5"
                                    :key="i"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    :class="['size-3.5', i <= Math.round(averageRating) ? 'text-[var(--ds-accent)]' : 'text-[#e0d8c8]']"
                                >
                                    <path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <p class="!mb-0 text-xs text-[var(--ds-text-secondary)] mt-1">{{ reviews.length }} {{ $t('reviews') }}</p>
                        </div>

                        <!-- Rating distribution bars -->
                        <div class="flex-1 max-w-xs space-y-1.5">
                            <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-2">
                                <span class="text-xs text-[var(--ds-text-secondary)] w-4 text-right">{{ star }}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-3 text-[#e0d8c8]">
                                    <path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" />
                                </svg>
                                <div class="flex-1 h-1.5 bg-[#e0d8c8] rounded-full overflow-hidden">
                                    <div
                                        class="h-full bg-[var(--ds-accent)] rounded-full transition-all duration-500"
                                        :style="{ width: reviews.length ? (reviews.filter(r => r.rating === star).length / reviews.length * 100) + '%' : '0%' }"
                                    ></div>
                                </div>
                                <span class="text-xs text-[var(--ds-text-secondary)] w-6">{{ reviews.filter(r => r.rating === star).length }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Review list -->
                    <div v-if="reviews.length > 0" class="space-y-0 divide-y divide-[#e0d8c8]">
                        <div v-for="review in reviews" :key="review.id" class="py-6 first:pt-0">
                            <div class="flex items-start gap-4">
                                <!-- Avatar -->
                                <div class="shrink-0 size-10 rounded-full bg-[var(--ds-neutral)] flex items-center justify-center">
                                    <span class="text-sm font-medium text-[var(--ds-text-secondary)]">
                                        {{ review.customer_name?.charAt(0)?.toUpperCase() }}
                                    </span>
                                </div>

                                <div class="flex-1 min-w-0">
                                    <!-- Name + date -->
                                    <div class="flex items-center justify-between gap-4">
                                        <span class="text-sm font-medium text-[var(--ds-text)]">{{ review.customer_name }}</span>
                                        <span class="text-xs text-[var(--ds-text-secondary)] shrink-0">{{ review.created_at }}</span>
                                    </div>

                                    <!-- Stars -->
                                    <div class="flex items-center gap-0.5 mt-1">
                                        <svg
                                            v-for="i in 5"
                                            :key="i"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            :class="['size-3.5', i <= review.rating ? 'text-[var(--ds-accent)]' : 'text-[#e0d8c8]']"
                                        >
                                            <path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" />
                                        </svg>
                                    </div>

                                    <!-- Title + text -->
                                    <h4 v-if="review.review_title" class="text-sm font-medium text-[var(--ds-text)] mt-2">
                                        {{ review.review_title }}
                                    </h4>
                                    <p class="!mb-0 text-sm text-[var(--ds-text-secondary)] mt-1 leading-relaxed">
                                        {{ review.review_text }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Empty reviews state -->
                    <div v-else class="text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-12 text-[#e0d8c8] mx-auto mb-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                        </svg>
                        <p class="!mb-0 text-sm text-[var(--ds-text-secondary)]">{{ $t('No reviews yet.') }}</p>
                        <LocalizedLink
                            :to="`/product/${productComputed.translation.slug}/write-review`"
                            class="inline-block mt-3 text-sm font-medium text-[var(--ds-text-secondary)] hover:text-[var(--ds-accent)] transition-colors"
                        >
                            {{ $t('Be the first to write a review') }}
                        </LocalizedLink>
                    </div>
                </div>

                <!-- Storefront hook: product bottom -->
                <StorefrontIframeHook
                    v-for="hook in productBottomHooks" :key="hook.id"
                    :hook="hook"
                    hook-point="storefront_product_bottom"
                    :query-params="{ product_id: productComputed.productData?.id, lang: locale, store_url: zucConfig.zucandu_subdomain || zucConfig.store_url }"
                />
            </div>
        </template>

        <!-- Restock Notification Modal -->
        <RestockModal
            :show="isRestockModalOpen"
            :product-name="selectedProductName()"
            :form="restockForm"
            :submitting="submitting"
            @close="closeRestockModal"
            @submit="restockNotify"
        />
    </div>
</template>

<style>
/* Variant button states applied via JS classList */
.aov-item.outofstock {
    opacity: 0.4;
    text-decoration: line-through;
}
.aov-item.invalid {
    opacity: 0.2;
    pointer-events: none;
    cursor: not-allowed;
}

/* Price override — drumsticks theme tokens */
.ds-price .line-through {
    color: var(--ds-text-secondary) !important;
    font-weight: normal;
    font-size: 1.25rem; /* text-xl */
}
.ds-price .text-red-600 {
    color: var(--ds-sale) !important;
}
</style>
