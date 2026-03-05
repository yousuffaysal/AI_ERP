export default function Home() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">AI ERP Platform</h1>
                <p className="text-gray-400">React frontend coming soon</p>
                <div className="flex gap-4 justify-center mt-8">
                    <a href="/dashboard" className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
                        Dashboard
                    </a>
                </div>
            </div>
        </main>
    );
}
