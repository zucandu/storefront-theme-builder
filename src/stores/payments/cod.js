import { defineStore } from 'pinia';

export const useCodStore = defineStore('cod', {
    state: () => ({ enabled: true }),
    actions: { async initPayment() {} },
});

export default useCodStore;
