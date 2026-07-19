import React from 'react'
import ReactDOM from 'react-dom/client'
import {MantineProvider} from '@mantine/core'
import {Notifications} from '@mantine/notifications'
import {ModalsProvider} from '@mantine/modals'
import App from './App'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <MantineProvider defaultColorScheme="light" withGlobalStyles withNormalizeCSS>
                <Notifications position="top-right"/>
                <ModalsProvider>
                    <App/>
                </ModalsProvider>
            </MantineProvider>
        </React.StrictMode>
)