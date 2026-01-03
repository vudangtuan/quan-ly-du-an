import {AdminService, type User} from "@/shared/services";
import React, {useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel, getFilteredRowModel,
    getPaginationRowModel, getSortedRowModel,
    useReactTable
} from "@tanstack/react-table";
import {ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search} from "lucide-react";
import {format} from "date-fns";
import type {Activity} from "@/shared/types";

interface UserActivityTabProps {
    user: User
}

const columnHelper = createColumnHelper<Activity>();

export const UserActivityTab: React.FC<UserActivityTabProps> = ({user}) => {
    const {data: activity} = useQuery({
        queryKey: ['activity', user.userId],
        queryFn: () => AdminService.getActivity(user.userId),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled: !!user.userId
    });

    const [globalFilter, setGlobalFilter] = useState('');


    const columns = useMemo(() => [
        columnHelper.accessor('actionType', {
            header: "ACTION",
            cell: (info) => info.getValue()
        }),
        columnHelper.accessor(row => format(new Date(row.createdAt), 'dd/MM/yyyy HH:mm:ss'), {
            id: 'time',
            header: 'time',
            cell: (info) => info.getValue()
        }),
        columnHelper.accessor('targetName', {
            header: 'target',
            cell: (info) => info.getValue()
        }),
        columnHelper.accessor(row => JSON.stringify(row.metadata), {
            id: 'metadata',
            header: 'metadata',
            cell: (info) => {
                const rawString = info.getValue();
                if (!rawString || rawString === 'null' || rawString === '{}') {
                    return <span className="text-gray-400">-</span>;
                }
                const parsedData = JSON.parse(rawString);

                return (
                    <pre
                        className="text-sm bg-[#1e1e1e] text-green-400 p-2 rounded border border-gray-700 overflow-auto max-h-40 max-w-[300px] font-mono scrollbar-thin">
                        {JSON.stringify(parsedData, null, 2)}
                    </pre>
                );
            }
        })
    ], []);

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: activity || [],
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