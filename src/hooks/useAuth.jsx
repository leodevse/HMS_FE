// src/hooks/useAuth.jsx
import * as React from "react";
import {createContext, useContext, useEffect, useState} from "react";
import {authApi} from "../apis/authApi";
import {jwtDecode} from "jwt-decode";
import {notifications} from "@mantine/notifications";

/** @type {AuthContextType} */
const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
    /**
     * @type {[UserResponseDTO, React.Dispatch<UserResponseDTO>]}
     */
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check token on load
    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            setLoading(false);
            return;
        }

        try {
            /**
             * @type {JwtPayload}
             */
            const decoded = jwtDecode(token);

            if (decoded.exp * 1000 < Date.now()) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("authUser");
                setLoading(false);
                return;
            }

            const storedUser = JSON.parse(localStorage.getItem("authUser") || "null");
            setUser({
                id: decoded.userId,
                username: decoded.sub,
                role: decoded.roles?.[0],
                fullName: storedUser?.username === decoded.sub ? storedUser.fullName : undefined,
            });
        } catch {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("authUser");
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Hàm đăng nhập người dùng
     *
     * @param {string} email - Email của người dùng
     * @param {string} password - Mật khẩu của người dùng
     * @return {Promise<{success: boolean, user?: UserResponseDTO, error?: string}>}
     */
    const login = async (username, password) => {
        try {
            const response = await authApi.login(username, password);
            const token = response?.token;

            if (!token) {
                throw new Error("No token in response");
            }

            const userData = {
                id: response.userId,
                username: response.username,
                role: response.role,
                fullName: response.fullName,
            };

            localStorage.setItem("accessToken", token);
            localStorage.setItem("authUser", JSON.stringify(userData));
            setUser(userData);

            return {success: true, user: userData};
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Login failed",
            };
        }
    };

    /**
     * Hàm đăng ký người dùng
     *
     * @param {UserRequestDTO} userData - Dữ liệu đăng ký người dùng
     * @return {Promise<{success: boolean, message?: string, data?: UserResponseDTO, error?: string}>}
     */
    const register = async (userData) => {
        try {
            const response = await authApi.register(userData);
            return {
                success: true,
                message: response.data?.message || "Registration successful",
                data: response.data?.data,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || "Registration failed",
            };
        }
    };

    /**
     * Hàm đăng xuất người dùng
     */
    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authUser");
        setUser(null);
        window.location.href = "/user";
        notifications.show({
            title: 'Success',
            message: `You have been logged out successfully.`,
            color: 'green',
        });
    };

    /**
     * Hàm kiểm tra vai trò của người dùng
     *
     * @param {string|string[]} roles - Vai trò hoặc mảng vai trò cần kiểm tra
     * @return {boolean} - Trả về true nếu người dùng có vai trò phù hợp, ngược lại trả về false
     */
    const hasRole = (roles) => {
        if (!user) return false;
        return Array.isArray(roles)
                ? roles.includes(user.role)
                : user.role === roles;
    };

    const getDashboardPath = (targetUser) => {
        console.log(targetUser);
        if (!targetUser) {
            console.log("getDashboardPath: No user provided, returning /");
            return "/";
        }

        console.log("getDashboardPath: User role =", targetUser.role);
        console.log("getDashboardPath: Full user object =", targetUser);

        switch (targetUser.role) {
            case "ADMIN":
                console.log("getDashboardPath: Redirecting to /admin");
                return "/admin";
            case "HOUSEKEEPING":
                console.log("getDashboardPath: Redirecting to /housekeeping");
                return "/housekeeping";
            case "RECEPTIONIST":
                console.log("getDashboardPath: Redirecting to /receptionist");
                return "/receptionist";
            case "STAFF":
                console.log("getDashboardPath: Redirecting to /staff");
                return "/staff";
            case "CUSTOMER":
                console.log("getDashboardPath: Redirecting to /");
                return "/";
            default:
                console.log("getDashboardPath: Unknown role, redirecting to /");
                return "/";
        }
    };

    const value = {
        user,
        isLoading: loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        getDashboardPath,
        hasRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
