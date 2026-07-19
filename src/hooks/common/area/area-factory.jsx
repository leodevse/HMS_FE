import {createContext, useContext, useMemo, useState} from "react";

/**
 * @template T
 * @param {T} initialState - Đối tượng khởi tạo ban đầu cho state
 */
export const createAreaContext = (initialState) => {
    /** @type {React.Context<any>} */
    const Context = createContext(null);

    const AreaProvider = ({children}) => {
        const [state, setState] = useState(initialState);
        const [isLoading, setIsLoading] = useState(false); // Thêm trạng thái isLoading mặc định là false

        /**
         * Hàm cập nhật một phần của state (patching)
         * @param {Partial<T> | ((prev: T) => Partial<T>)} patch
         */
        const updateState = (patch) => {
            setState((prev) => ({
                ...prev,
                ...(typeof patch === 'function' ? patch(prev) : patch)
            }));
        };

        const value = useMemo(() => ({
            ...state,
            state,
            setState,
            updateState,
            isLoading,       // Export trạng thái isLoading
            setIsLoading     // Export hàm điều khiển isLoading
        }), [state, isLoading]);

        return <Context.Provider value={value}>{children}</Context.Provider>;
    };

    /**
     * Hook để truy cập state, isLoading và các hàm điều khiển
     * @returns {T & {
     * state: T,
     * isLoading: boolean,
     * setState: React.Dispatch<React.SetStateAction<T>>,
     * setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
     * updateState: (patch: Partial<T> | ((prev: T) => Partial<T>)) => void
     * }}
     */
    const useArea = () => {
        const context = useContext(Context);
        if (!context) throw new Error("useArea must be used within its Provider");
        return context;
    };

    return {
        Provider: AreaProvider,
        useArea: useArea,
    };
};