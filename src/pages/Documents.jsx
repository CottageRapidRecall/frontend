import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { FileText, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { auth } from '../lib/firebase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://rapidrecall-production.up.railway.app";

export function Documents({ user }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Clear previous result when selecting a new file
      setResult(null);
    }
  };

  const handleRemoveFile = () => {
    // Clean up preview URL to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setStatus('');
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }

    if (!user) {
      alert('You must be signed in to upload files.');
      return;
    }

    setUploading(true);
    setStatus('Uploading...');

    try {
      const idToken = await auth.currentUser.getIdToken();

      const formData = new FormData();
      formData.append('recall', selectedFile);

      const response = await fetch(`${BACKEND_URL}/v1`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setResult(data);
      setStatus('Processing complete!');
    } catch (error) {
      console.error('Upload error:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
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

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedFile || uploading}
                  className="w-full"
                >
                  {uploading ? 'Processing...' : 'Submit Document'}
                </Button>

                {/* Status Message */}
                {status && (
                  <div className={`flex items-center p-4 rounded-lg ${
                    status.startsWith('Error')
                      ? 'bg-red-50 text-red-700'
                      : status.includes('complete')
                      ? 'bg-green-50 text-green-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    {status.startsWith('Error') ? (
                      <AlertCircle className="h-5 w-5 mr-3" />
                    ) : status.includes('complete') ? (
                      <CheckCircle className="h-5 w-5 mr-3" />
                    ) : (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3"></div>
                    )}
                    <span className="text-sm font-medium">{status}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview/Results Section */}
        <div className="space-y-6">
          {previewUrl ? (
            <Card>
              <CardHeader>
                <CardTitle>Document Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-4">
                  {selectedFile?.type.startsWith('image/') ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-auto rounded"
                    />
                  ) : selectedFile?.type === 'application/pdf' ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-[600px] rounded"
                      title="PDF Preview"
                    />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="font-medium">No document selected</p>
                  <p className="text-sm mt-1">Upload a document to see preview and results</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs whitespace-pre-wrap break-words overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
