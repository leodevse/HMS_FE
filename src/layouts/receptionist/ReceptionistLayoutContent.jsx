import {ReceptionistHeader} from "./ReceptionistHeader.jsx";
import {ReceptionistNavbar} from "./ReceptionistNavbar.jsx";
import {AppShell, Container, rem} from "@mantine/core";
import {Outlet} from "react-router-dom";
import {useReceptionistLayout} from "../../hooks/receptionist/layout/use-receptionist-layout.jsx";

export const ReceptionistLayoutContent = () => {
    const {isMobileOpened} = useReceptionistLayout();
    return (
            <AppShell
                    padding="md"
                    header={{height: 60}}
                    navbar={{
                        width: 240,
                        breakpoint: "lg",
                        collapsed: {mobile: !isMobileOpened, desktop: true},
                    }}
            >
                {/* HEADER */}
                <ReceptionistHeader/>

                {/* MOBILE NAVBAR */}
                <ReceptionistNavbar/>

                {/* CONTENT */}
                <AppShell.Main pt={`calc(${rem(60)} + var(--mantine-spacing-md))`}>
                    <Container size="xl">
                        <Outlet/>
                    </Container>
                </AppShell.Main>
            </AppShell>
    )
}
