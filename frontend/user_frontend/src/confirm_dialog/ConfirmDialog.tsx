import * as Dialog from '@radix-ui/react-dialog';
import React from "react";
import {TriangleAlert, X} from "lucide-react";




interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    warningText?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}
export type ConfirmOptions = Omit<ConfirmDialogProps, 'open' | 'onOpenChange' | 'onConfirm'>;

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
                                                         open,
                                                         onOpenChange,
                                                         onConfirm,
                                                         title,
                                                         description,
                                                         warningText,
                                                         confirmText = 'Xác nhận',
                                                         cancelText = 'Hủy',
                                                         type = 'danger',
                                                         isLoading = false,
                                                     }) => {
    const config = {
        danger: {
            confirmBg: 'bg-red-600 hover:bg-red-700',
            warningBg: 'bg-red-50 border-red-200 text-red-700',
        },
        warning: {
            confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
            warningBg: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        },
        info: {
            confirmBg: 'bg-blue-600 hover:bg-blue-700',
            warningBg: 'bg-blue-50 border-blue-200 text-blue-700',
        },
    };

    const {confirmBg, warningBg} = config[type];

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                {/* Overlay */}
                <Dialog.Overlay
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"/>

                {/* Content */}
                <Dialog.Content
                    className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl shadow-xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
                    {/* Close button */}
                    <Dialog.Close
                        className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <X className="h-4 w-4"/>
                    </Dialog.Close>

                    {/* Title */}
                    <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
                        {title}
                    </Dialog.Title>

                    {/* Description */}
                    <Dialog.Description className="text-sm text-gray-600 mb-3">
                        {description}
                    </Dialog.Description>

                    {/* Warning text */}
                    {warningText && (
                        <div className={`flex gap-2 border rounded-lg p-2.5 mb-5 ${warningBg}`}>
                            <TriangleAlert/>
                            <p className="text-sm font-medium flex-1">
                                {warningText}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-5">
                        <Dialog.Close asChild>
                            <button
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                        </Dialog.Close>
                        <button
                            onClick={() => {
                                onConfirm();
                                onOpenChange(false);
                            }}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${confirmBg}`}
                        >
                            {isLoading ? 'Đang xử lý...' : confirmText}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};