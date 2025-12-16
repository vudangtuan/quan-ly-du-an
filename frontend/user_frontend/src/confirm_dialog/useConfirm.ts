import {createContext, useContext} from "react";
import type {ConfirmOptions} from "@/confirm_dialog/ConfirmDialog";

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}
export const ConfirmContext =
    createContext<ConfirmContextType | undefined>(undefined);


export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within ConfirmDialogProvider');
    }
    return context.confirm;
};