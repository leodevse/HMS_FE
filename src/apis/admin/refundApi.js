export const refundApi = {
    getPendingRefunds: async (params) => {
        // The current billing service has no refund-request resource yet.
        // Keep the dashboard usable until that backend feature is implemented.
        void params;
        return { content: [] };
    },
    getRefundById: async (id) => {
        throw new Error(`Refund requests are not implemented by the backend (${id})`);
    },
    approveRefund: async (id) => {
        throw new Error(`Refund requests are not implemented by the backend (${id})`);
    },
    rejectRefund: async (id, rejectReason) => {
        throw new Error(`Refund requests are not implemented by the backend (${id}: ${rejectReason})`);
    }
};
