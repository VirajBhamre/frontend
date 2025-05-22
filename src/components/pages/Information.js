import React from 'react';

const Information = () => {
    return (
        <div className="p-6 min-h-[calc(100vh-64px)] bg-[#d0e1ff]">
            <div className="max-w-4xl mx-auto bg-white shadow rounded-2xl p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">📘 Information Page</h1>
                <p className="text-sm text-gray-600 mb-6">
                    This is a placeholder page for information-related content inside the dashboard.
                </p>

                <div className="space-y-3 text-sm text-gray-700">
                    <p>✅ You can populate this section with important announcements, documentation, or FAQs.</p>
                    <p>📌 This section is only visible after logging into the dashboard.</p>
                </div>
            </div>
        </div>
    );
};

export default Information;
