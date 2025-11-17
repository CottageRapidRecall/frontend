import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { FileText } from 'lucide-react';

export function Documents({ user }) {
  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-2">Upload and process recall documents</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section (placeholder) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Recall Document</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
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
