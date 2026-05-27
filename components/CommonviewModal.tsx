
import Modal from "./Modal";

interface CommonModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function CommonModal({
    isOpen,
    onClose,
    title,
    children,
}: CommonModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
        >
            {children}
        </Modal>
    );
}