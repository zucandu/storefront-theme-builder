/**
 * Shared order helper functions used across admin order pages.
 */
export function useOrderHelpers() {
    /**
     * Return Tailwind badge classes for a given order status ID.
     *
     * @param {number} v - order status id
     * @returns {string} Tailwind CSS classes
     */
    const statusBadge = (v) => {
        switch (v) {
            case 1:
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
            case 2:
                return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400';
            case 3:
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 4:
                return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
            case 5:
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 9:
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            default:
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        }
    };

    return { statusBadge };
}
