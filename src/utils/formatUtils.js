export const formatUtils = {
	/**
	 * Format chuỗi ngày tháng từ API thành định dạng dễ đọc (Việt Nam)
	 * @param {string | Date} dateInput
	 * @param {boolean} includeTime - Có bao gồm giờ phút không
	 * @returns {string} - vd: 31/12/2023
	 */
	formatDate: (dateInput, includeTime = false) => {
		if (!dateInput) return "—";

		const date = new Date(dateInput);

		// Kiểm tra ngày hợp lệ
		if (isNaN(date.getTime())) return dateInput;

		const options = {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		};

		if (includeTime) {
			options.hour = "2-digit";
			options.minute = "2-digit";
		}

		return new Intl.DateTimeFormat("vi-VN", options).format(date);
	},

	/**
	 * Format chuỗi ngày tháng từ API thành định dạng ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
	 *
	 * @param {string | Date} dateInput
	 * @return {string} - Nếu input hợp lệ sẽ trả về chuỗi ISO, nếu không sẽ trả về input gốc hoặc "—" nếu input là null/undefined
	 */
	formatDateISO: (dateInput) => {
		if (!dateInput) return "—";
		if (typeof dateInput === "string") {
			const date = new Date(dateInput);
			if (isNaN(date.getTime())) return dateInput;
			return date.toISOString();
		} else if (dateInput instanceof Date) {
			if (isNaN(dateInput.getTime())) return dateInput;
			return dateInput.toISOString();
		} else {
			return dateInput;
		}
	},

	/**
	 * Định dạng số thành chuỗi tiền tệ Việt Nam (VND)
	 *
	 * @param {number} money
	 * @returns {string}
	 */
	formatCurrency: (money) => {
		return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(money);
	},
};
