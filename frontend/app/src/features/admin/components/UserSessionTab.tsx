import {AdminService, type Session, type User} from "@/shared/services";
import React, {useMemo, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel, getFilteredRowModel,
    getPaginationRowModel, getSortedRowModel,
    useReactTable
} from "@tanstack/react-table";
import {ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search, Trash2} from "lucide-react";
import {format} from "date-fns";
import toast from "react-hot-toast";
import {useConfirm} from "@/confirm_dialog";

interface UserSessionTabProps {
    user: User
}

const columnHelper = createColumnHelper<Session>();

export const UserSessionTab: React.FC<UserSessionTabProps> = ({user}) => {
    const {data: sessions} = useQuery({
        queryKey: ['session', user.userId],
        queryFn: () => AdminService.getSessionByUserId(user.userId),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const deleteSessionMutation = useMutation({
        mutationFn:(id:string)=>AdminService.deleteSessionById(user.userId,id),
        onSuccess:()=>{
            queryClient.invalidateQueries({queryKey: ['session', user.userId]});
        },
        onError:(e)=>{
            toast.error(e.message);
        }
    })
    const [globalFilter, setGlobalFilter] = useState('');


    const columns = useMemo(() => [
        columnHelper.accessor('deviceInfo', {
            header: "Device",
            cell: (info) => info.getValue()
        }),
        columnHelper.accessor('ipAddress',{
            header:"IP",
            cell: (info) => info.getValue()
        }),
        columnHelper.accessor('createdAt',{
            header:'Create At',
            cell: (info) =>
                format(new Date(info.getValue()), 'dd/MM/yyyy HH:mm')
        }),
        columnHelper.accessor('lastAccessedAt',{
            header:'Last access',
            cell: (info) =>
                format(new Date(info.getValue()), 'dd/MM/yyyy HH:mm')
        }),
        columnHelper.display({
            id: 'actions',
            header: '',
            cell: (info) => {
                return (
                    <div
                        onClick={async () => {
                            const confirmed = await confirm({
                                type: "danger",
                                confirmText: "Xóa",
                                isLoading: deleteSessionMutation.isPending,
                                title: "Xóa phiên đăng nhập",
                                cancelText: "Hủy",
                                description: "Bạn có chắc khóa Session này không?"
                            });
                            if (confirmed) {
                                deleteSessionMutation.mutate(info.row.original.sessionId);
                            }
                        }}
                        title={'Xóa'}
                        className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4"/>
                        </button>
                    </div>
                );
            }
        }),
    ], []);

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: sessions || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            globalFilter
        },
        onGlobalFilterChange: setGlobalFilter,
        initialState: {
            pagination: {
                pageSize: 5,
            }
        }
    });

    return (
        <div className={"space-y-5"}>
            <div className="bg-white px-4 py-2 rounded border border-gray-200 shadow-sm flex gap-4 w-fit">
                <div className="flex items-center gap-1.5">
                    <Search className={"h-4 w-4 text-gray-600"}/>
                    <input
                        value={globalFilter}
                        onChange={(e) => {
                            setGlobalFilter(e.target.value)
                        }}
                        type="text"
                        placeholder="Tìm kiếm"
                        className="text-xs outline-none border-none focus:ring-0 p-0 bg-transparent w-32"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-auto scrollbar-thin bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                    {table.getHeaderGroups().map((headerGroup) => {
                        return (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <th
                                            key={header.id}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-1">
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                                {header.column.getIsSorted() && (
                                                    <span>
                                                    {header.column.getIsSorted() === "asc" ?
                                                        <ArrowDown className={"h-4 w-4"}/> :
                                                        <ArrowUp className={"h-4 w-4"}/>}
                                                 </span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        );
                    })}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className="hover:bg-gray-50 transition-colors group">
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id} className="py-2 px-5">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            <div className="px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                         <span className="text-sm text-gray-600">
                            Trang <strong>{table.getState().pagination.pageIndex + 1}</strong> / {table.getPageCount()}
                        </span>
                    <select
                        value={table.getState().pagination.pageSize}
                        onChange={e => {
                            table.setPageSize(Number(e.target.value));
                        }}
                        className="border border-gray-300 rounded py-1 text-sm"
                    >
                        {[5, 10, 20].map(pageSize => (
                            <option key={pageSize} value={pageSize}>{pageSize}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
                            className="p-2 border rounded hover:bg-white disabled:opacity-50">
                        <ChevronLeft className="w-4 h-4"/></button>
                    <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
                            className="p-2 border rounded hover:bg-white disabled:opacity-50">
                        <ChevronRight className="w-4 h-4"/></button>
                </div>
            </div>
        </div>
    );
}