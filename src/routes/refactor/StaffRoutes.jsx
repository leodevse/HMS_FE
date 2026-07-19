import {Route} from "react-router-dom";
import {ReceptionistLayout} from "../../layouts/receptionist/ReceptionistLayout.jsx";
import {RECEPTIONIST_ROUTES} from "../../constants/receptionist.jsx";

export const StaffRoutes = (
        <Route path={"/staff"} element={<ReceptionistLayout/>}>
            <Route index element={<div>Staff Dashboard</div>}/>
            {
                RECEPTIONIST_ROUTES.map(item => {
                    return (
                            /**
                             * @type {React.JSX.Element}
                             */
                            <Route key={item.path} path={item.path.replace("/staff/", "")} element={item.element}/>
                    )
                })
            }
        </Route>
);
