import {createContext, useContext, useMemo, useState} from "react";

/**
 * Hàm tạo context cho list, quản lý SearchParams và Page riêng biệt.
 *
 * @template SearchParamsType, PageType
 * @param {SearchParamsType} initialSearchParams - Các tham số tìm kiếm ban đầu.
 * @param {PageType} initialPage - Dữ liệu phân trang/danh sách ban đầu.
 * @returns {ListFactoryType<SearchParamsType, PageType>}
 */
export const createListContext = (initialSearchParams, initialPage) => {
    /**
     * @type {React.Context<ListContextType<SearchParamsType, PageType> | null>}
     */
    const Context = createContext(null);

    const Provider = ({children}) => {
        /** @type {[SearchParamsType, React.Dispatch<React.SetStateAction<SearchParamsType>>]} */
        const [searchParams, setSearchParams] = useState(initialSearchParams);

        /** @type {[PageType, React.Dispatch<React.SetStateAction<PageType>>]} */
        const [page, setPage] = useState(initialPage);

        const [isLoading, setIsLoading] = useState(false);

        /** @type {ListContextType<SearchParamsType, PageType>} */
        const value = useMemo(
                () => ({
                    searchParams,
                    setSearchParams,
                    page,
                    setPage,
                    isLoading,
                    setIsLoading
                }),
                [searchParams, page, isLoading],
        );

        return <Context.Provider value={value}>{children}</Context.Provider>;
    };

    const useList = () => {
        const context = useContext(Context);
        if (!context) {
            throw new Error("useList must be used within its respective Provider");
        }
        return context;
    };

    return {
        Provider,
        useList,
    };
};
