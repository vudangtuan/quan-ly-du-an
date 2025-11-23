import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {Toaster} from "react-hot-toast";
import {ConfirmDialogProvider} from "@components/ConfirmDialog";
import {GoogleOAuthProvider} from "@react-oauth/google";


const queryClient = new QueryClient()


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <QueryClientProvider client={queryClient}>
                <ConfirmDialogProvider>
                    <App/>
                </ConfirmDialogProvider>
                <Toaster position="top-right"/>
            </QueryClientProvider>
        </GoogleOAuthProvider>
    </StrictMode>,
)
