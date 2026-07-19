import axiosInstance from "../axiosConfig.js";

export const paymentApi = {
	getCheckoutSummary: async (reservationId) => {
		const {data} = await axiosInstance.get(`/billing/checkout/${reservationId}`, {suppressErrorNotification: true});
		return data;
	},
	recordPayment: async ({folioId, amount, paymentMethod}) => {
		const {data} = await axiosInstance.post('/billing/payments', {
			folioId,
			amount: Number(amount),
			paymentMethod,
			transactionType: 'FINAL_PAYMENT',
		}, {suppressErrorNotification: true});
		return data;
	},
	finalizeCheckout: async (reservationId) => {
		const {data} = await axiosInstance.post(`/billing/checkout/${reservationId}/finalize`, null, {suppressErrorNotification: true});
		return data;
	},
	/**
	 * Hàm lấy tất cả Payment
	 *
	 * @param {PaymentSearchParams} searchParams
	 * @returns {Promise<PageResponse<PaymentTransactionResponse>>}
	 */
	getAll: async (searchParams) => {
		const {data} = await axiosInstance.get("/billing/payments", {
			params: searchParams
		});

		return data;
	},
}
