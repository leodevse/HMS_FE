import {Route} from "react-router-dom";
import {AuthLayout} from "../../layouts/AuthLayout.jsx";
import LoginPage from "../../pages/auth/LoginPage";
import RegisterPage from "../../pages/auth/RegisterPage";
import OAuth2RedirectPage from "../../pages/auth/OAuth2RedirectPage.jsx";

export const AuthenticationRoutes = (
    <Route path="/" element={<AuthLayout/>}>
        <Route path="/oauth2/redirect" element={<OAuth2RedirectPage/>}/>
        <Route path="login" element={<LoginPage/>}/>
        <Route path="register" element={<RegisterPage/>}/>
        <Route path="forgot-password" element={<div>Forgot Password</div>}/>
    </Route>
);
