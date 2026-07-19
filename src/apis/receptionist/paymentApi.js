import axiosInstance from "../axiosConfig.js";

export const paymentApi = {
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
	}
}
