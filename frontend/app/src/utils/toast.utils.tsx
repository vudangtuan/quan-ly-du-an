import toast from "react-hot-toast";

interface ArchiveToastOptions {
    itemName: string;
    onRestore: () => void;
    duration?: number;
}

export const showArchiveToast = ({
                                     itemName,
                                     onRestore,
                                     duration = 5000
                                 }: ArchiveToastOptions) => {
    toast.custom(
        (t) => {
            return (
                <div
                    className={`
                    ${t.visible ? 'animate-in slide-in-from-top-5 fade-in-0' : 'animate-out slide-out-to-right-5 fade-out-0'}
                    max-w-md w-full bg-white rounded-lg pointer-events-auto 
                    shadow-lg border border-gray-200 overflow-hidden
                    transition-all duration-300 ease-out
                `}
                >
                    <div className="flex items-start justify-between gap-4 py-2 px-4">
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-normal text-gray-900">
                                {itemName}
                            </p>
                        </div>

                        {/* Undo Button */}
                        <button
                            onClick={() => {
                                toast.remove(t.id)
                                onRestore()
                            }}
                            className="flex-shrink-0 px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100
                                 hover:bg-gray-200 rounded-md border border-gray-300
                                 transition-colors duration-150 ease-out
                                 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                        >
                            Undo
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1 bg-gray-200">
                        <div
                            className="h-full bg-emerald-600"
                            style={{
                                animation: `shrink ${duration}ms linear forwards`
                            }}
                        />
                    </div>

                    <style>{`
                        @keyframes shrink {
                            from { width: 100%; }
                            to { width: 0%; }
                        }
                    `}</style>
                </div>
            )
        },
        {duration}
    );
};