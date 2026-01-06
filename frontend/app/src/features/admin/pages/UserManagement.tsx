import React, {useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {AdminService, type User} from "@/shared/services";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel, getFilteredRowModel,
    getPaginationRowModel, getSortedRowModel,
    useReactTable
} from "@tanstack/react-table";
import {ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Eye, Search} from "lucide-react";
import {format} from "date-fns";
import {useNavigate} from "react-router-dom";

const columnHelper = createColumnHelper<User>();

export const UserManagement: React.FC = () => {
    const {data: allUser} = useQuery({
        queryKey: ['allUsers'],
        queryFn: () => AdminService.getUsers(),
        refetchOnWindowFocus: false,
        refetchOnMount: false
    });
    const navigate = useNavigate();

    const [globalFilter, setGlobalFilter] = useState('');


    const columns = useMemo(() => [
        columnHelper.accessor('fullName', {
            header: 'Tên',
            cell: (info) => {
                return (
                    <div className="font-semibold">
                        {info.getValue()}
                    </div>
                );
            }
        }),
        columnHelper.accessor('email', {
            header: 'Email',
            cell: (info) => {
                return (
                    <div className="">
                        {info.getValue()}
                    </div>
                );
            }
        }),
        columnHelper.accessor('role', {
            header: 'Vai trò',
            cell: (info) => {
                const role = info.getValue();
                const isAdmin = role === 'ADMIN';
                return (
                    <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            isAdmin
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                        {role}
                    </span>
                );
            }
        }),
        columnHelper.accessor('status', {
            header: 'Trạng thái',
            cell: (info) => {
                const status = info.getValue();
                const isActive = status === 'ACTIVE';
                return (
                    <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            isActive
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                        {status}
                    </span>
                );
            }
        }),
        columnHelper.accessor('createdAt', {
            header: 'Ngày tạo',
            cell: (info) => (
                <div className="flex items-center gap-2 text-gray-500">
                    {format(new Date(info.getValue()), 'dd/MM/yyyy HH:mm')}
                </div>
            )
        }),

        columnHelper.display({
            id: 'actions',
            header: '',
            cell: (info) => {
                return (
                    <div
                        onClick={()=>{
                            navigate(`id/${info.row.original.userId}`)
                        }}
                        title={'chi tiết'}
                        className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Eye className="w-4 h-4"/>
                        </button>
                    </div>
                );
            }
        }),
    ], []);

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: allUser || [],
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