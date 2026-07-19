import { useState } from "react";

/**
 * Cập nhật một trường cụ thể trong object.
 * @template T
 * @callback UpdateField
 * @param {keyof T} field - Tên trường cần cập nhật.
 * @param {T[keyof T]} value - Giá trị mới (phải khớp kiểu của field).
 * @returns {void}
 */

/**
 * Hook hỗ trợ quản lý và cập nhật state dạng Object (Form).
 * @template {object} T
 * @param {T} initialData - Giá trị khởi tạo của object.
 * @param {React.Dispatch<React.SetStateAction<T>>} [customSetData] - Optional: Hàm setState nếu muốn quản lý state bên ngoài.
 * @returns {{
 *   data: T,
 *   setData: import("react").Dispatch<import("react").SetStateAction<T>>,
 *   updateField: UpdateField<T>
 *   reset: () => void
 * }}
 */
export const useObjectState = (initialData, customSetData) => {
    const [state, setState] = useState({
        ...initialData,
    });

    const data = customSetData ? initialData : state;
    const setData = customSetData || setState;

    const updateField = (field, value) => {
        setData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    /** Đưa dữ liệu về trạng thái ban đầu */
    const reset = () => setData(initialData);

    return { data, setData, updateField, reset };
};
