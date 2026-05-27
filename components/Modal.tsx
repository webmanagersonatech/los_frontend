// components/Modal.tsx

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = "md",
}: ModalProps) {
    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
                >
                    {/* BACKDROP */}
                    <div
                        className="absolute inset-0"
                        onClick={onClose}
                    />

                    {/* MODAL */}
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.95,
                            y: 20,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.95,
                            y: 20,
                        }}
                        transition={{ duration: 0.2 }}
                        className={`relative w-full ${sizeClasses[size]} rounded-2xl bg-white shadow-2xl`}
                    >
                        {/* HEADER */}
                        <div className="flex items-center justify-between border-b border-slate-100 p-4">
                            <h3 className="text-base font-semibold text-slate-800">
                                {title}
                            </h3>

                            <button
                                onClick={onClose}
                                className="rounded-lg p-1 transition hover:bg-slate-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="p-4">
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}