// src/components/Products.js
import React, { useEffect, useMemo, useState } from 'react';
import { productsService } from '../../services/productsService';
import {
    Search,
    ChevronLeft,
    ChevronsLeft,
    ChevronRight,
    ChevronsRight,
} from 'lucide-react';

const ITEMS = 10;

const Products = () => {
    const [rows, setRows] = useState([]);
    const [q, setQ] = useState('');
    const [pg, setPg] = useState(1);

    useEffect(() => {
        productsService.list().then(setRows);
    }, []);

    useEffect(() => setPg(1), [q]);

    const list = useMemo(() => {
        const s = q.toLowerCase();
        return q
            ? rows.filter((r) =>
                [r.name, r.description, r.price].join(' ').toLowerCase().includes(s)
            )
            : rows;
    }, [q, rows]);

    const pages = Math.max(1, Math.ceil(list.length / ITEMS));
    const view = list.slice((pg - 1) * ITEMS, pg * ITEMS);
    const go = (n) => setPg(Math.min(Math.max(1, n), pages));

    return (
        <div className="m-2 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between gap-3 p-4 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Products</h2>
                <div className="relative w-full sm:w-64">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search…"
                        className="w-full pl-10 pr-4 py-2 text-sm border rounded-tl-lg rounded-tr-lg rounded-br-lg focus:ring-2 focus:ring-[#ff4473] outline-none"
                    />
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {['Name', 'Description', 'Price / User / Month', 'Active'].map(
                            (h) => (
                                <th
                                    key={h}
                                    className="px-6 py-3 text-left text-sm font-medium text-gray-700"
                                >
                                    {h}
                                </th>
                            )
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {view.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-6 py-2 text-sm text-gray-800">{r.name}</td>
                            <td className="px-6 py-2 text-sm text-gray-800">
                                {r.description}
                            </td>
                            <td className="px-6 py-2 text-sm text-gray-800">₹{r.price}</td>
                            <td className="px-6 py-2 text-sm text-gray-800">
                                {r.active ? 'Yes' : 'No'}
                            </td>
                        </tr>
                    ))}

                    {view.length === 0 && (
                        <tr>
                            <td
                                colSpan={4}
                                className="py-6 text-center text-sm text-gray-500"
                            >
                                No records found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="flex items-center justify-between flex-wrap gap-3 p-4 border-t">
                <p className="text-sm text-gray-600">
                    Showing{' '}
                    <span className="font-medium">
                        {list.length === 0 ? 0 : (pg - 1) * ITEMS + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                        {Math.min(pg * ITEMS, list.length)}
                    </span>{' '}
                    of <span className="font-medium">{list.length}</span> results
                </p>

                <nav className="flex items-center gap-1">
                    <Pager Icon={ChevronsLeft} dis={pg === 1} go={() => go(1)} />
                    <Pager Icon={ChevronLeft} dis={pg === 1} go={() => go(pg - 1)} />
                    {Array.from({ length: pages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === pages || Math.abs(p - pg) <= 2)
                        .map((p, i, a) => (
                            <React.Fragment key={p}>
                                {i > 0 && p - a[i - 1] > 1 && (
                                    <span className="px-1 text-gray-500">…</span>
                                )}
                                <button
                                    onClick={() => go(p)}
                                    className={`px-3 py-1 rounded-tl-lg rounded-tr-lg rounded-br-lg text-sm ${p === pg
                                            ? 'bg-[#ff4473] text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {p}
                                </button>
                            </React.Fragment>
                        ))}
                    <Pager
                        Icon={ChevronRight}
                        dis={pg === pages}
                        go={() => go(pg + 1)}
                    />
                    <Pager
                        Icon={ChevronsRight}
                        dis={pg === pages}
                        go={() => go(pages)}
                    />
                </nav>
            </div>
        </div>
    );
};

const Pager = ({ Icon, dis, go }) => (
    <button
        onClick={go}
        disabled={dis}
        className={`p-1.5 rounded-tl-lg rounded-tr-lg rounded-br-lg ${dis
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
    >
        <Icon size={16} />
    </button>
);

export default Products;
