import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useProductStore } from '@/stores/catalog/product'
import { useAuthCustomerStore } from '@/stores/auth/customer'
import { useHelpers } from '@/composables/useHelpers'

export function useRestockModal() {
    const { t, locale } = useI18n()
    const toast = useToast()
    const productStore = useProductStore()
    const authCustomerStore = useAuthCustomerStore()
    const { translateItemField } = useHelpers()

    const isRestockModalOpen = ref(false)
    const selectedProduct = ref(null)
    const restockForm = ref({ email: '', name: '' })
    const submitting = ref(false)

    const openRestockModal = (product) => {
        selectedProduct.value = product
        restockForm.value.name = authCustomerStore.profile?.firstname ?? ''
        restockForm.value.email = authCustomerStore.profile?.email ?? ''
        isRestockModalOpen.value = true
    }

    const closeRestockModal = () => {
        isRestockModalOpen.value = false
        selectedProduct.value = null
    }

    const getRecaptchaToken = () => {
        if (!zucConfig.recaptcha_site_key) return Promise.resolve(undefined)
        return new Promise((resolve) => {
            grecaptcha.ready(() => {
                grecaptcha.execute(zucConfig.recaptcha_site_key, { action: 'submit' }).then(resolve)
            })
        })
    }

    const restockNotify = async () => {
        submitting.value = true
        try {
            const grecaptcha_token = await getRecaptchaToken()
            await productStore.subscribeRestockNotification({
                ...restockForm.value,
                product_id: selectedProduct.value.id,
                locale: locale.value,
                grecaptcha_token,
            })
            toast.success(t('You have been successfully subscribed to the restock notification list.'))
            closeRestockModal()
        } catch (error) {
            toast.error(t(error.response?.data?.message || 'Something went wrong.'))
        } finally {
            submitting.value = false
        }
    }

    const selectedProductName = () => {
        if (!selectedProduct.value) return ''
        return translateItemField(selectedProduct.value, 'name', locale.value)
    }

    return {
        isRestockModalOpen,
        selectedProduct,
        restockForm,
        submitting,
        openRestockModal,
        closeRestockModal,
        restockNotify,
        selectedProductName,
    }
}
