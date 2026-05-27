// components/DataTable.tsx

import { motion } from "framer-motion";

type Column<T> = {
    key: keyof T | string;
    header: string;
    render?: (row: T) => React.ReactNode;
    className?: string;
};

type DataTableProps<T> = {
    columns: Column<T>[];
    data: T[];

    currentPage?: number;
    totalPages?: number;
    totalCount?: number;

    onPageChange?: (page: number) => void;
};

export default function DataTable<
    T extends { _id: number | string }
>({
    columns,
    data,
    currentPage = 1,
    totalPages = 1,
    totalCount = 0,
    onPageChange,
}: DataTableProps<T>) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* TABLE */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    {/* HEADER */}
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 ${column.className || ""
                                        }`}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* BODY */}
                    <tbody>
                        {data.length > 0 ? (
                            data.map((row, rowIndex) => (
                                <motion.tr
                                    key={row._id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: rowIndex * 0.03,
                                    }}
                                    className="border-b border-slate-100 hover:bg-slate-50 transition"
                                >
                                    {columns.map(
                                        (column, colIndex) => (
                                            <td
                                                key={colIndex}
                                                className={`px-4 py-3 ${column.className || ""
                                                    }`}
                                            >
                                                {column.render
                                                    ? column.render(
                                                        row
                                                    )
                                                    : String(
                                                        row[
                                                        column.key as keyof T
                                                        ]
                                                    )}
                                            </td>
                                        )
                                    )}
                                </motion.tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="text-center py-10 text-slate-500 text-sm"
                                >
                                    No data found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* FOOTER / PAGINATION */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50">
                {/* TOTAL COUNT */}
                <p className="text-xs text-slate-500">
                    Total Records:{" "}
                    <span className="font-semibold text-slate-700">
                        {totalCount}
                    </span>
                </p>

                {/* PAGINATION */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() =>
                            onPageChange?.(currentPage - 1)
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    <div className="text-xs text-slate-600 px-2">
                        Page{" "}
                        <span className="font-semibold">
                            {currentPage}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold">
                            {totalPages}
                        </span>
                    </div>

                    <button
                        onClick={() =>
                            onPageChange?.(currentPage + 1)
                        }
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}