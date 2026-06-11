import { defineStore } from 'pinia';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useSettingsStore } from '@/stores/settings';
import { useHelpers } from '@/composables/useHelpers.js';
import mockProduct from '@/data/product.json';
const { basicCompare } = useHelpers();

export const useProductStore = defineStore('product', {
    state: () => ({ productDetails: {} }),

    getters: {
        taxRate() {
            const authCustomerStore = useAuthCustomerStore();
            return authCustomerStore.customerTax?.rate || 0;
        },
        calculateTaxAmount() {
            return (price, tax) => +price * +tax;
        },
        basePriceWithTax() {
            return (price, taxAmount) => window.zucConfig.product_price_with_tax === 'y' ? +price + +taxAmount : price;
        },
        finalizeProductPrice() {
            return (product) => {
                let finalPrice = +product.sale_price > 0 ? +product.sale_price : +product.price;
                let finalTaxRateAmount = 0;
                if (+product.tax_class_id > 0) {
                    finalTaxRateAmount = +this.taxRate > 0 ? this.calculateTaxAmount(finalPrice, this.taxRate) : 0;
                }
                return {
                    retail: this.basePriceWithTax(product.price, finalTaxRateAmount),
                    sale: +product.sale_price > 0 ? this.basePriceWithTax(product.sale_price, finalTaxRateAmount) : 0,
                    final: this.basePriceWithTax(finalPrice, finalTaxRateAmount),
                    tax: finalTaxRateAmount,
                };
            };
        },
        priceFormat() {
            return (price) => {
                const currencyObj = useSettingsStore().selectedCurrencyObject;
                if (currencyObj) {
                    const digits = currencyObj.decimal_digits ?? 2;
                    const multiplier = Math.pow(10, digits);
                    return Math.round((currencyObj.rate * price) * multiplier + Number.EPSILON) / multiplier || 0;
                }
                return 0;
            };
        },
        childProduct: () => (product, selectedAtt) => {
            const selectedKeys = Object.keys(selectedAtt).map(k => parseInt(k));
            const selectedValues = Object.values(selectedAtt).map(v => parseInt(v));
            if (Object.keys(product).length && Object.keys(selectedAtt).length) {
                return product.children.find(p => {
                    const filtered = p.attributes.filter(a => a.attribute_option.type !== 'readonly');
                    const attrIds = filtered.map(a => +a.attribute_option_id);
                    const valIds  = filtered.map(a => +a.attribute_option_value_id);
                    return attrIds.length === selectedKeys.length
                        && attrIds.every((v, i) => v === selectedKeys[i])
                        && valIds.length === selectedValues.length
                        && valIds.every((v, i) => v === selectedValues[i]);
                }) || { ...product, quantity: 0, status: 0 };
            }
        },
        getAttributes() {
            return (product, type) => {
                if (!Object.keys(product).length) return {};
                const tmp = product.attributes.filter(a => a.attribute_option.type === type);
                const attrs = tmp.map(ao => ({
                    [ao.attribute_option_id]: {
                        id: ao.attribute_option_id,
                        display_ov_image: ao.attribute_option.display_ov_image,
                        filter_only: ao.attribute_option.filter_only,
                        translations: ao.attribute_option.translations,
                        values: tmp
                            .filter(ao2 => ao2.attribute_option_id === ao.attribute_option_id)
                            .map(aov => ({ ...aov.attribute_option_value, vid: aov.attribute_option_value.id })),
                        sort: ao.attribute_option.sort,
                    },
                })).reduce((prev, curr) => ({ ...prev, ...curr }), {});
                Object.values(attrs).forEach(item => item.values.sort((a, b) => basicCompare(+a.sort, +b.sort)));
                return attrs;
            };
        },
        getVariants(state) {
            return Object.values(this.getAttributes(state.productDetails, 'select'))
                .sort((a, b) => basicCompare(+a.sort, +b.sort));
        },
    },

    actions: {
        setProductDetails(productData) {
            this.productDetails = productData;
        },
        async retrieveProductDetails(slug) {
            this.setProductDetails(mockProduct.product);
        },
        async fetchSpotlightProducts() {
            const items = mockProduct.spotlight || [];
            return {
                new: items,
                sale: items.filter(p => +p.sale_price > 0),
                featured: items,
            };
        },
        async fetchLatestReviews() {
            return mockProduct.reviews || [];
        },
        async fetchCrossSells() {
            return { products: mockProduct.cross_sells || [] };
        },
        async fetchUpSells() {
            return { products: mockProduct.up_sells || [] };
        },
        async fetchProductsByIds(ids) {
            return mockProduct.spotlight || [];
        },
        async getSuggestions(keyword) {
            return mockProduct.suggestions || [];
        },
        async addReview() {},
        async subscribeRestockNotification() {},
    },
});
