<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from "vue-router";
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';

import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useProductStore } from '@/stores/catalog/product';
import { useHelpers } from '@/composables/useHelpers';
import { useRedirect } from '@/composables/useRedirect';

const route = useRoute();
const { t, locale } = useI18n();
const toast = useToast();
const { redirectTo } = useRedirect();

const productStore = useProductStore();
const authCustomerStore = useAuthCustomerStore();
const { translateItemField, translateItemObj } = useHelpers();

const formdata = ref({
    rating: 5,
    review_title: undefined,
    review_text: undefined,
    customer_name: undefined,
    grecaptcha_token: undefined
});
const loaded = ref(false);

onMounted(() => {
    productStore.retrieveProductDetails(route.params.slug)
        .then(() => {
            if (authCustomerStore.isLoggedIn) {
                formdata.value.customer_name = authCustomerStore.customerInfo.username || authCustomerStore.customerInfo.firstname;
            }
        })
        .finally(() => loaded.value = true);
});

const productTranslation = computed(() => {
    if(loaded) {
        return translateItemObj(productStore.productDetails, locale.value);
    }
})

const submitProductReview = async () => {

    if(zucConfig.recaptcha_site_key) {
        grecaptcha.ready(function() {
            grecaptcha.execute(zucConfig.recaptcha_site_key, { action: 'submit' }).then(function(token) {
                formdata.value.grecaptcha_token = token
            })
        })
        while(formdata.value.grecaptcha_token === undefined) {
            await new Promise(r => setTimeout(r, 100))
        }
    }

    await productStore.addReview({ ...formdata.value, locale: locale.value, product_id: productStore.productDetails.id })
        .then(() => {
            toast.success(t(`Thank you for your review! It will be reviewed and published shortly.`));
            redirectTo(`/product/${productTranslation.slug}`);
        })
        .catch(error => {
            toast.error(t(error.response.data.message));
        });
}
</script>

<template>
    <div>
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div class="max-w-2xl mx-auto">
                <div class="text-center mb-8">
                    <h1 class="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight !mb-0">{{ $t('Write Your Own Review') }}</h1>
                </div>
                <div v-if="loaded" class="border border-gray-200 rounded-xl p-6 sm:p-8">
                    <div class="mb-6">
                        <LocalizedLink :to="`/product/${productTranslation.slug}`" class="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors underline underline-offset-2">
                            {{ productTranslation.name }} {{ productTranslation.sku }}
                        </LocalizedLink>
                    </div>

                    <form @submit.prevent="submitProductReview" class="space-y-5">
                        <!-- Star Rating -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 !mb-0">{{ $t('Please choose rating') }}</label>
                            <div class="flex items-center gap-1.5 mt-2">
                                <button v-for="rating in 5" :key="rating" type="button" @click="formdata.rating = rating" class="focus:outline-hidden">
                                    <svg class="w-7 h-7 transition-colors" :class="+formdata.rating >= +rating ? 'text-yellow-400' : 'text-gray-200'" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </button>
                                <span class="ml-2 text-sm text-gray-500">{{ formdata.rating }}/5</span>
                            </div>
                        </div>

                        <!-- Review Title -->
                        <div>
                            <label for="rtitle" class="block text-sm font-medium text-gray-700 !mb-0">{{ $t('Review Title') }} {{ $t('(Optional)') }}</label>
                            <div class="mt-1.5">
                                <input v-model="formdata.review_title" id="rtitle" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors" :placeholder="$t('Enter your review title')" />
                            </div>
                        </div>

                        <!-- Review Text -->
                        <div>
                            <label for="rtext" class="block text-sm font-medium text-gray-700 !mb-0">{{ $t('Let Us Know Your Thoughts?') }}</label>
                            <div class="mt-1.5">
                                <textarea v-model="formdata.review_text" id="rtext" rows="4" required class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors resize-none" :placeholder="$t('Write something...')"></textarea>
                            </div>
                        </div>

                        <!-- Nickname -->
                        <div>
                            <label for="rnickname" class="block text-sm font-medium text-gray-700 !mb-0">{{ $t('Nickname') }}</label>
                            <div class="mt-1.5">
                                <input v-model="formdata.customer_name" id="rnickname" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors" :placeholder="$t('Enter your nickname')" />
                            </div>
                        </div>

                        <div class="flex justify-end pt-1">
                            <button type="submit" class="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 py-2.5 font-medium text-sm transition-colors">{{ $t('Submit Review') }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
