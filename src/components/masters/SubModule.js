import React, { useMemo, useState, useEffect } from "react";
import {
    Search,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function Submodule() {
    const initialSubmodules = [
        { id: 1, employer: "Acme Corp", product: "Widget A", duration: "6 months", productStrength: 50 },
        { id: 2, employer: "Globex Inc", product: "Gadget B", duration: "12 months", productStrength: 50 },
        { id: 3, employer: "Soylent Co", product: "Thingamajig C", duration: "3 months", productStrength: 100 },
        { id: 4, employer: "Acme Corp", product: "Widget A", duration: "6 months", productStrength: 50 },
        { id: 5, employer: "Globex Inc", product: "Gadget B", duration: "12 months", productStrength: 50 },
        { id: 6, employer: "Soylent Co", product: "Thingamajig C", duration: "3 months", productStrength: 100 },
        { id: 7, employer: "Acme Corp", product: "Widget A", duration: "6 months", productStrength: 50 },
        { id: 8, employer: "Globex Inc", product: "Gadget B", duration: "12 months", productStrength: 50 },
        { id: 9, employer: "Soylent Co", product: "Thingamajig C", duration: "3 months", productStrength: 100 },
        { id: 10, employer: "Acme Corp", product: "Widget A", duration: "6 months", productStrength: 50 },
        { id: 11, employer: "Soylent Co", product: "Thingamajig C", duration: "3 months", productStrength: 100 },
        { id: 12, employer: "Acme Corp", product: "Widget A", duration: "6 months", productStrength: 50 },
    ];

    const [submodules, setSubmodules] = useState(initialSubmodules);

    const [showForm, setShowForm] = useState(false);
    const [editData, setEditData] = useState({
        id: null,
        employer: "",
        product: "",
        duration: "",
        productStrength: "",
    });

    /* search + pagination state */
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);

    /* jump back to first page when the search text changes */
    useEffect(() => setPage(1), [query]);

    /* derived data */
    const filtered = useMemo(() => {
        if (!query.trim()) return submodules;
        const q = query.toLowerCase();
        return submodules.filter((row) =>
            [row.employer, row.product, row.duration, row.productStrength]
                .join(" ")
                .toLowerCase()
                .includes(q)
        );
    }, [query, submodules]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

    const pageData = filtered.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    /* handlers */
    const handleEditClick = (row) => {
        setEditData({ ...row });
        setShowForm(true);
        /* scroll to top so the form is visible */
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSubmodules((prev) =>
            prev.map((item) => (item.id === editData.id ? { ...editData } : item))
        );
        setShowForm(false);
    };

    const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));

    return (
        <div className="m-2">
            {/* edit form */}
            {showForm && (
                <div className="mb-6 p-6 bg-white rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                        Edit Submodule
                    </h2>
                    <form onSubmit={handleSave} className="grid grid-cols-3 gap-6">
                        {[
                            { name: "employer", label: "Employer", type: "text" },
                            { name: "product", label: "Product", type: "text" },
                            { name: "duration", label: "Duration", type: "text" },
                            {
                                name: "productStrength",
                                label: "Product Strength",
                                type: "number",
                            },
                        ].map(({ name, label, type }) => (
                            <div className="relative" key={name}>
                                <input
                                    id={name}
                                    name={name}
                                    type={type}
                                    value={editData[name]}
                                    onChange={handleChange}
                                    required
                                    placeholder={label}
                                    className={`
                    peer w-full px-6 py-2 text-sm rounded-tl-xl rounded-tr-xl rounded-br-xl
                    bg-white text-gray-800 border border-gray-300 shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-transparent
                  `}
                                />
                                <label
                                    htmlFor={name}
                                    className={`
                    absolute left-6 px-1 bg-white rounded transition-all cursor-text
                    peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400
                    peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-500
                    -top-2.5 text-xs text-blue-500
                  `}
                                >
                                    {label}
                                </label>
                            </div>
                        ))}

                        <div className="col-span-3 flex justify-end space-x-3">
                            <button
                                type="submit"
                                className={`
                  px-6 py-2 rounded-tl-xl rounded-tr-xl rounded-br-xl
                  bg-[#ff4473] hover:bg-[#e03b65]
                  text-white text-sm font-semibold transition
                `}
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className={`
                                    px-6 py-2 rounded-tl-xl rounded-tr-xl rounded-br-xl
                                    bg-white border border-gray-300 hover:bg-gray-100
                                    text-gray-800 text-sm font-semibold transition
                                    `}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* SEARCH + TABLE + PAGINATION CARD */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* search bar */}
                <div className="flex items-center justify-between gap-3 p-4 border-b">
                    <h3 className="font-semibold text-gray-800">Submodules</h3>
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Search…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm border rounded-br-lg rounded-tr-lg rounded-tl-lg focus:ring-2 focus:ring-[#ff4473] outline-none"
                        />
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                        />
                    </div>
                </div>

                {/* table */}
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {["Employer", "Product", "Duration", "Product Strength"].map(
                                (h) => (
                                    <th
                                        key={h}
                                        className="px-6 py-3 text-left text-sm font-medium text-gray-700"
                                    >
                                        {h}
                                    </th>
                                )
                            )}
                            <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {pageData.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50">
                                <td className="px-6 py-2 text-sm text-gray-800">
                                    {row.employer}
                                </td>
                                <td className="px-6 py-2 text-sm text-gray-800">
                                    {row.product}
                                </td>
                                <td className="px-6 py-2 text-sm text-gray-800">
                                    {row.duration}
                                </td>
                                <td className="px-6 py-2 text-sm text-gray-800">
                                    {row.productStrength}
                                </td>
                                <td className="px-6 py-2 text-center">
                                    <button
                                        onClick={() => handleEditClick(row)}
                                        className={`
                      px-4 py-1 rounded-tl-lg rounded-tr-lg rounded-br-lg
                      bg-[#ff4473] hover:bg-[#e03b65]
                      text-white text-sm font-semibold transition
                    `}
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {/* empty state */}
                        {pageData.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="py-6 text-center text-sm text-gray-500"
                                >
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

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
                                        className={`px-3 py-1 rounded-br-lg rounded-tr-lg rounded-tl-lg text-sm ${p === page
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
        </div>
    );
}

/* small helper for pagination buttons */
const PagerIcon = ({ Icon, disabled, onClick }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`p-1.5 rounded-lg ${disabled
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-700 hover:bg-gray-100"
            }`}
    >
        <Icon size={16} />
    </button>
);
