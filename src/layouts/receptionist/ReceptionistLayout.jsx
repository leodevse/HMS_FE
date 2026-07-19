import {ReceptionistLayoutProvider} from "../../hooks/receptionist/layout/receptionist-layout-provider.jsx";
import {ReceptionistLayoutContent} from "./ReceptionistLayoutContent.jsx";


export const ReceptionistLayout = () => {
    return (
            <ReceptionistLayoutProvider>
                <ReceptionistLayoutContent/>
            </ReceptionistLayoutProvider>
    );
};
