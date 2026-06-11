import { defineStore } from 'pinia';

export const useBankTransferStore = defineStore('bankTransfer', {
    state: () => ({ enabled: true }),
    actions: { async initPayment() {} },
});

export default useBankTransferStore;
