export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🚀 Excalidraw AI Backend
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Next.js AI service powered by DeepSeek for Excalidraw
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-3">
                📊 Text to Diagram
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Convert natural language descriptions into Mermaid diagrams
              </p>
              <code className="block mt-2 text-xs bg-blue-100 dark:bg-gray-600 p-2 rounded">
                POST /v1/ai/text-to-diagram/generate
              </code>
            </div>
            
            <div className="bg-green-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-300 mb-3">
                🎨 Diagram to Code
              </h3>
              <p className="text-sm text-green-700 dark:text-green-200">
                Transform UI mockups into clean HTML/CSS code
              </p>
              <code className="block mt-2 text-xs bg-green-100 dark:bg-gray-600 p-2 rounded">
                POST /v1/ai/diagram-to-code/generate
              </code>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/health"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              🔍 Health Check
            </a>
            <a
              href="https://excalidraw.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              🎯 Open Excalidraw
            </a>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ready to power your Excalidraw AI features • Port: 3015
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
