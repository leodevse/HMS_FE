import {Navigate, Route} from "react-router-dom";
import NotFoundPage from "../../pages/error/NotFoundPage.jsx";
import UnauthorizedPage from "../../pages/error/UnauthorizedPage.jsx";

export const ErrorRoutes = (
    <Route path={"/"}>
        <Route path={"*"} element={<Navigate to={"/404"} replace/>}/>
        <Route path={"/404"} element={<NotFoundPage/>}/>
        <Route path={"/unauthorized"} element={<UnauthorizedPage/>}/>
    </Route>
);
