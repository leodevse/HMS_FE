import {LucideIcon} from "lucide-react";
import React from "react";

declare global {
    type JwtPayload = {
        id: number;
        email: string;
        role: string;
        fullName: string;
        provider: string;
        iss?: string;
        sub?: string;
        aud?: string[] | string;
        exp?: number;
        nbf?: number;
        iat?: number;
        jti?: string;
    };

    type StaffLayoutContextType = {
        isMobileOpen: boolean;
        toggle: () => void;
        close: () => void;
        open: () => void;
    };

    type AuthContextType = {
        user: UserResponseDTO | null;
        loading: boolean;
        isAuthenticated: boolean;
        /**
         * @returns Trả về object kết quả login
         */
        login: (
            email: string,
            password: string,
        ) => Promise<{
            success: boolean;
            user?: UserResponseDTO;
            error?: string;
        }>;
        register: (userData: UserRequestDTO) => Promise<{
            success: boolean;
            message?: string;
            data?: UserResponseDTO;
            error?: string;
        }>;
        logout: () => void;
        getDashboardPath: (targetUser: UserResponseDTO | null) => string;
        hasRole: (roles: string | string[]) => boolean;
    };

    type RouteItemType = {
        path: string;
        label?: string;
        icon?: LucideIcon;
        element: React.JSX.Element;
        inNavbar?: boolean;
    };

    type RouteMapType = Object<string, RouteItemType>;

    type ListContextType<PageType, SearchParamsType> = {
        page: PageType;
        setPage: React.Dispatch<React.SetStateAction<PageType>>;
        searchParams: SearchParamsType;
        setSearchParams: React.Dispatch<React.SetStateAction<SearchParamsType>>;
        isLoading: boolean;
        setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    };

    type ListFactoryType<PageType, SearchParamsType> = {
        Provider: React.FC<{ children: React.ReactNode }>;
        useList: () => ListContextType<PageType, SearchParamsType>;
    };

    function createListContext<SearchParamsType, PageType>(
        initialSearchParams: SearchParamsType,
        initialPage: PageType,
    ): ListFactoryType<SearchParamsType, PageType>;

    /**
     * PageableRequest: Định nghĩa kiểu dữ liệu cho yêu cầu phân trang khi gọi API.
     *
     * Các trường:
     * - page: Số trang hiện tại (bắt đầu từ 0). Nếu không cung cấp, mặc định là 0.
     * - size: Số lượng phần tử trên mỗi trang. Nếu không cung cấp, mặc định là 20.
     * - sort: Chuỗi định dạng để chỉ định trường và thứ tự sắp xếp (ví dụ: "name,asc" hoặc "createdDate,desc").
     */
    type PageableRequest = {
        page?: number;
        size?: number;
        sort?: string;
    };

    type PageResponse<ContentType> = {
        content: ContentType[];
        pageable: {
            sort: {
                empty: boolean;
                sorted: boolean;
                unsorted: boolean;
            };
            offset: number;
            pageNumber: number;
            pageSize: number;
            paged: boolean;
            unpaged: boolean;
        };
        last: boolean;
        totalElements: number;
        totalPages: number;
        size: number;
        number: number; // Page index hiện tại (bắt đầu từ 0)
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        };
        first: boolean;
        numberOfElements: number;
        empty: boolean;
    };

    type ReservationSearchParams = ReservationSearchRequest & PageableRequest;

    type RoomSearchParams = RoomSearchRequest & PageableRequest;

    type PaymentSearchParams = PaymentTransactionResponse & PageableRequest;
}
