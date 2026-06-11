export function useAvailablePaymentMethods() {
    const availablePaymentMethods = {};
    const modules = import.meta.glob('../stores/payments/*.js', { eager: true });

    Object.keys(modules).forEach((fileName) => {
        const moduleName = fileName.split('/').pop().replace(/\.js$/, '');
        const camelCaseName = moduleName.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
        if (modules[fileName].default) {
            availablePaymentMethods[camelCaseName] = modules[fileName].default;
        }
    });

    return { availablePaymentMethods };
}
