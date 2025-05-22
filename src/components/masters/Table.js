// src/components/Table.js
import React, { useEffect, useMemo, useState } from "react";
import sampleData from "./SampleData";
import {
    Search,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function Table({ data = sampleData }) {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);

    /* reset page on new search */
    useEffect(() => setPage(1), [query]);

    /* filter rows */
    const filtered = useMemo(() => {
        if (!query.trim()) return data;
        const q = query.toLowerCase();
        return data.filter((r) =>
            [
                r.id,
                r.name,
                r.mobile,
                r.aadhaar,
                r.location,
                r.branch,
                r.role,
                r.process,
            ]
                .join(" ")
                .toLowerCase()
                .includes(q)
        );
    }, [query, data]);

    /* pagination */
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const pageRows = filtered.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );
    const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));

    /* helpers for export */
    const headers = [
        "ID",
        "Name",
        "Mobile",
        "Aadhaar",
        "Location",
        "Branch",
        "Process",
        "Role",
        "Month/Year",
        "Present",
        "Absent",
        "WeekOff",
        "Payable Days",
        "Salary",
    ];

    const rowsToArray = (rows) =>
        rows.map((r) => [
            r.id,
            r.name,
            r.mobile,
            r.aadhaar,
            r.location,
            r.branch,
            r.process,
            r.role,
            r.monthYear,
            r.present,
            r.absent,
            r.weekoff,
            r.payableDays,
            r.salary,
        ]);

    const downloadFile = (content, mimeType, filename) => {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportCSV = () => {
        const csv =
            [headers, ...rowsToArray(filtered)]
                .map((row) =>
                    row
                        .map((cell) =>
                            cell === undefined || cell === null
                                ? ""
                                : `"${String(cell).replace(/"/g, '""')}"`
                        )
                        .join(",")
                )
                .join("\n");
        downloadFile(csv, "text/csv;charset=utf-8;", "employee_attendance.csv");
    };

    const handleExportExcel = () => {
        /* simple CSV with .xls extension so Excel opens it */
        const csv =
            [headers, ...rowsToArray(filtered)].map((row) => row.join("\t")).join("\n");
        downloadFile(
            csv,
            "application/vnd.ms-excel;charset=utf-8;",
            "employee_attendance.xls"
        );
    };

    return (
        <div className="m-2 bg-white rounded-lg shadow overflow-hidden flex flex-col overflow-x-hidden">
            {/* header + export + search */}
            <div className="flex items-center justify-between gap-3 p-4 border-b flex-wrap">
                <h2 className="text-xl font-semibold text-gray-800">
                    Employee Attendance
                </h2>

                <div className="flex items-center gap-2 order-last sm:order-none w-full sm:w-auto">
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 rounded-tr-lg rounded-tl-lg rounded-br-lg bg-[#ff4473] text-white text-sm font-semibold hover:bg-[#e03b65] transition"
                    >
                        CSV
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="px-4 py-2 rounded-tr-lg rounded-tl-lg rounded-br-lg bg-[#ff4473] text-white text-sm font-semibold hover:bg-[#e03b65] transition"
                    >
                        Excel
                    </button>
                    <div className="relative flex-1 sm:flex-none">
                        <input
                            type="text"
                            placeholder="Search…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full sm:w-72 pl-10 pr-4 py-2 text-sm border rounded-tr-lg rounded-tl-lg rounded-br-lg focus:ring-2 focus:ring-[#ff4473] outline-none placeholder:text-gray-400"
                        />
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                        />
                    </div>
                </div>
            </div>

            {/* three‑pane grid */}
            <div
                className="flex-1 overflow-hidden grid"
                style={{ gridTemplateColumns: "max-content 1fr max-content" }}
            >
                <div className="border-r border-gray-200 bg-white">
                    <LeftTable rows={pageRows} />
                </div>
                <div className="overflow-x-auto">
                    <MiddleTable rows={pageRows} />
                </div>
                <div className="border-l border-gray-200 bg-white">
                    <RightTable rows={pageRows} />
                </div>
            </div>

            {/* pagination footer */}
            <div className="flex items-center justify-between flex-wrap gap-3 p-4 border-t">
                <p className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-medium">
                        {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                        {Math.min(page * ITEMS_PER_PAGE, filtered.length)}
                    </span>{" "}
                    of <span className="font-medium">{filtered.length}</span> results
                </p>

                <nav className="flex items-center gap-1">
                    <PagerIcon
                        Icon={ChevronsLeft}
                        disabled={page === 1}
                        onClick={() => goTo(1)}
                    />
                    <PagerIcon
                        Icon={ChevronLeft}
                        disabled={page === 1}
                        onClick={() => goTo(page - 1)}
                    />

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                            (p) =>
                                p === 1 ||
                                p === totalPages ||
                                Math.abs(p - page) <= 2
                        )
                        .map((p, idx, arr) => (
                            <React.Fragment key={p}>
                                {idx > 0 && p - arr[idx - 1] > 1 && (
                                    <span className="px-1 text-gray-500">…</span>
                                )}
                                <button
                                    onClick={() => goTo(p)}
                                    className={`px-3 py-1 rounded-tr-lg rounded-tl-lg rounded-br-lg text-sm ${p === page
                                        ? "bg-[#ff4473] text-white"
                                        : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    {p}
                                </button>
                            </React.Fragment>
                        ))}

                    <PagerIcon
                        Icon={ChevronRight}
                        disabled={page === totalPages}
                        onClick={() => goTo(page + 1)}
                    />
                    <PagerIcon
                        Icon={ChevronsRight}
                        disabled={page === totalPages}
                        onClick={() => goTo(totalPages)}
                    />
                </nav>
            </div>
        </div>
    );
}

/* reusable cell components */
const Th = ({ children }) => (
    <th className="px-6 py-3 text-sm font-medium text-gray-700 text-left whitespace-nowrap">
        {children}
    </th>
);
const Td = ({ children }) => (
    <td className="px-6 py-2.5 text-sm text-gray-800 whitespace-nowrap">
        {children}
    </td>
);

/* left column */
const LeftTable = ({ rows }) => (
    <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
                <Th>ID</Th>
                <Th>Name</Th>
                <Th>Mobile</Th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
            {rows.map((r) => (
                <tr key={`l-${r.id}`} className="hover:bg-gray-50">
                    <Td>{r.id}</Td>
                    <Td>{r.name}</Td>
                    <Td>{r.mobile}</Td>
                </tr>
            ))}
        </tbody>
    </table>
);

/* middle scrolling table */
const MiddleTable = ({ rows }) => (
    <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
                {[
                    "Aadhaar",
                    "Location",
                    "Branch",
                    "Process",
                    "Role",
                    "Month/Year",
                    "Present",
                    "Absent",
                    "Week Off",
                    "Present",
                    "Absent",
                    "Week Off",
                ].map((h) => (
                    <Th key={h}>{h}</Th>
                ))}
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
            {rows.map((r) => (
                <tr key={`m-${r.id}`} className="hover:bg-gray-50">
                    <Td>{r.aadhaar}</Td>
                    <Td>{r.location}</Td>
                    <Td>{r.branch}</Td>
                    <Td>{r.process}</Td>
                    <Td>{r.role}</Td>
                    <Td>{r.monthYear}</Td>
                    <Td>{r.present}</Td>
                    <Td>{r.absent}</Td>
                    <Td>{r.weekoff}</Td>
                    <Td>{r.present}</Td>
                    <Td>{r.absent}</Td>
                    <Td>{r.weekoff}</Td>
                </tr>
            ))}
        </tbody>
    </table>
);

/* right column */
const RightTable = ({ rows }) => (
    <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
                <Th>Payable Days</Th>
                <Th>Salary</Th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
            {rows.map((r) => (
                <tr key={`r-${r.id}`} className="hover:bg-gray-50">
                    <Td>{r.payableDays}</Td>
                    <Td>₹{r.salary?.toLocaleString()}</Td>
                </tr>
            ))}
        </tbody>
    </table>
);

/* pagination icon helper */
const PagerIcon = ({ Icon, disabled, onClick }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`p-1.5 rounded-tr-lg rounded-tl-lg rounded-br-lg ${disabled
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-700 hover:bg-gray-100"
            }`}
    >
        <Icon size={16} />
    </button>
);
