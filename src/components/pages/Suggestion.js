import React from 'react';

const Suggestion = () => {
    return (
        <div className="p-6 min-h-[calc(100vh-64px)] bg-[#d0e1ff]">
            <div className="max-w-4xl mx-auto bg-white shadow rounded-2xl p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">💡 Suggestion Page</h1>
                <p className="text-sm text-gray-600 mb-6">
                    This is a placeholder for user suggestions and feedback inside the dashboard.
                </p>

                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                    <li>Submit improvement ideas for the app</li>
                    <li>Provide feedback on existing modules</li>
                    <li>Raise feature requests or UI/UX suggestions</li>
                </ul>
            </div>
        </div>
    );
};

export default Suggestion;
