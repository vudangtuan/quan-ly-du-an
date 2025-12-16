import {ConfirmDialog} from "./ConfirmDialog";
import React, {type ReactNode} from "react";
import {useConfirmDialog} from "./useConfirmDialog";
import {ConfirmContext} from './useConfirm'



export const ConfirmDialogProvider: React.FC<{ children: ReactNode }> = ({children}) => {
    const {confirm, config, handleConfirm, handleOpenChange, isOpen} = useConfirmDialog();
    return (
        <ConfirmContext.Provider value={{confirm}}>
            {children}
            <ConfirmDialog
                {...config}
                onOpenChange={handleOpenChange}
                open={isOpen}
                onConfirm={handleConfirm}
            />
        </ConfirmContext.Provider>
    )
}