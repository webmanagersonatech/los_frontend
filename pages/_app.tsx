import "../styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }: AppProps) {
    return (
        <>
            <Toaster
                position="top-right"
                reverseOrder={false}
                containerStyle={{
                    zIndex: 99999,
                }}
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: "#fff",
                        color: "#0f172a",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        padding: "12px 16px",
                    },
                }}
            />

            <Component {...pageProps} />
        </>
    );
}