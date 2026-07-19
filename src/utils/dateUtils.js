export const dateUtils = {
	/**
	 * Tính số ngày giữa 2 date, làm tròn lên và trả về tối thiểu là 0
	 *
	 * @param {string | Date} from
	 * @param {string | Date} to
	 * @returns {number}
	 */
	dateDiff: (from, to) => {
		if (!from || !to) return 0;
		const start = new Date(from);
		const end = new Date(to);
		const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
		const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
		return Math.max(0, Math.round((endDay - startDay) / 86400000));
	},
};
