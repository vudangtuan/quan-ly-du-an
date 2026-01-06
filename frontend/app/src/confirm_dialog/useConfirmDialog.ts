import {useRef, useState} from "react";
import type {ConfirmOptions} from "./ConfirmDialog";


export const useConfirmDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState<ConfirmOptions>({
        title: '',
        description: '',
    });

    // Lưu hàm resolve để gọi sau khi người dùng bấm nút
    const resolveRef = useRef<(value: boolean) => void | null>(null);

    const confirm = (options: ConfirmOptions): Promise<boolean> => {
        setConfig(options);
        setIsOpen(true);
        return new Promise((resolve) => {
            resolveRef.current = resolve;
        });
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open && resolveRef.current) {
            resolveRef.current(false);
            resolveRef.current = null;
        }
    };

    const handleConfirm = () => {
        if (resolveRef.current) {
            resolveRef.current(true);
            resolveRef.current = null;
        }
    };

    return {confirm, config, isOpen, handleOpenChange, handleConfirm};
}