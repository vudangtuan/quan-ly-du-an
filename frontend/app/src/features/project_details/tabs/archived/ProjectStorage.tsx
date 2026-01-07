import React from "react";
import {useOutletContext} from "react-router-dom";
import type {ProjectDetailContext} from "@/features/project_details";
import {Clock, Columns2, Loader2, RefreshCcw, Trash2, Clipboard} from "lucide-react";
import {formatDateLocalDate} from "@/utils";
import {useStorage} from "@/features/project_details/tabs/archived/useStorage";


export const ProjectStorage: React.FC = () => {
    const {projectDetail} = useOutletContext<ProjectDetailContext>();

    const  {
        items, handleDeleteItem, handleRestoreItem,
        isFetchingNextPage, isLoading, hasNextPage, fetchNextPage
    } = useStorage(projectDetail.projectId);


    if (isLoading) {
        return <div className={'flex justify-center'}>
            <Loader2 className={"animate-spin"}/>
        </div>
    }
    return (
        <div className="p-4 md:p-8 h-full overflow-auto bg-gray-50/50">
            {/* Main List */}
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {/* Items */}
                    {items.map((item) => (
                        <div key={item.itemId}
                             className="flex items-center justify-between p-2 hover:bg-gray-50 transition-colors group">
                            {/* Thông tin dự án */}
                            <div className="flex items-center gap-4 min-w-0">
                                <div
                                    className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                    {item.type === 'TASK' && <Clipboard/>}
                                    {item.type === 'COLUMN' && <Columns2/>}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs">
                                        {item.name}
                                    </h4>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                        <Clock size={12}/>
                                        <span>{item.archivedAt ? formatDateLocalDate(item.archivedAt) : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Nút hành động */}
                            <div className="flex items-center gap-2">
                                {/* Nút Xóa - MỚI THÊM */}
                                <button
                                    onClick={() => handleDeleteItem(item)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg
                                             transition-colors disabled:opacity-50"
                                    title="Xóa vĩnh viễn"
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </button>

                                {/* Nút Khôi phục */}
                                <button
                                    onClick={() => handleRestoreItem(item)}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50
                                             hover:bg-blue-100 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <RefreshCcw className="h-3.5 w-3.5"/>
                                </button>
                            </div>
                        </div>
                    ))}
                    {hasNextPage && (
                        <div onClick={() => fetchNextPage()}
                             className="flex justify-center py-2">
                            <button className={"py-2 px-4 hover:bg-blue-50 text-blue-500 rounded-xl"}
                                    disabled={isFetchingNextPage}>
                                {isFetchingNextPage ? <Loader2 className={"animate-spin h-5 w-5"}/> :
                                    <span>Xem thêm</span>}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};