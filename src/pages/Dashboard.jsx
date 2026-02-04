import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Activity, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { getFreshIdToken } from '../lib/tokenManager';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const getClassificationColor = (c) => {
  const map = {
    'Class I': 'bg-red-100 text-red-800',
    'Class II': 'bg-orange-100 text-orange-800',
    'Class III': 'bg-yellow-100 text-yellow-800',
    'Pending': 'bg-blue-100 text-blue-800',
    'Not Applicable': 'bg-gray-100 text-gray-800',
  };
  return map[c] || map['Pending'];
};

export function Dashboard() {
  const navigate = useNavigate();
  const [recalls, setRecalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecalls();
  }, []);

  const fetchRecalls = async () => {
    try {
      setLoading(true);
      const idToken = await getFreshIdToken();
      if (!idToken) {
        setLoading(false);
        return;
      }
      const res = await fetch(`${BACKEND_URL}/user/recalls`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.startsWith('<!') ? 'Backend unavailable' : text);
      }
      const data = await res.json();
      setRecalls(Array.isArray(data.recalls) ? data.recalls : []);
    } catch (err) {
      if (!err.message.includes('auth') && !err.message.includes('token')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const recentRecalls = [...recalls]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  const totalRecalls = recalls.length;
  const pending = recalls.filter((r) => !r.reviewed_time).length;
  const reviewed = recalls.filter((r) => r.reviewed_time).length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to RapidRecall</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recalls</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{totalRecalls}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Activity className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reviewed</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{reviewed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Recalls</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" />
            </div>
          ) : recentRecalls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No recalls uploaded yet</p>
              <p className="text-sm mt-1">Upload your first recall document to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRecalls.map((recall) => {
                const recallItem = recall?.result?.recall_data?.recall_items?.[0];
                return (
                <div
                  key={recall.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/my-recalls?expand=${recall.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {recallItem?.product_description || recall.id}
                      </span>
                      {recallItem?.fda_class && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getClassificationColor(
                            recallItem?.fda_class
                          )}`}
                        >
                          {recallItem?.fda_class}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {recallItem?.manufacturer || 'Processing...'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {recall.created_at
                      ? new Date(recall.created_at).toLocaleDateString()
                      : '-'}
                  </span>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      recall.reviewed_time
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {recall.reviewed_time ? 'Reviewed' : 'Pending'}
                  </span>
                </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
