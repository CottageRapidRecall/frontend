import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { FileText, Upload } from 'lucide-react';

export function Documents({ user }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-2">Upload and process recall documents</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Recall Document</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* File Input */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      Choose a file
                    </span>
                    <span className="text-gray-600"> or drag and drop</span>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">PDF or image files</p>
                </div>

                {/* Selected File Info */}
                {selectedFile && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview/Results Section (placeholder) */}
        <div className="space-y-6">
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">No document selected</p>
                <p className="text-sm mt-1">Upload a document to see preview and results</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
