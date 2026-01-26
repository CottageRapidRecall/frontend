import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Activity, FileText, AlertCircle, CheckCircle, Users, Settings, Square, CheckSquare, RotateCcw, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFreshIdToken } from '../lib/tokenManager';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const getClassificationColor = (c) => {
  const map = {
    'Class I': 'bg-red-100 text-red-800',
    'Class II': 'bg-orange-100 text-orange-800',
    'Class III': 'bg-yellow-100 text-yellow-800',
    'Pending Review': 'bg-blue-100 text-blue-800',
    'Not Applicable': 'bg-gray-100 text-gray-800',
  };
  return map[c] || map['Pending Review'];
};

export function AdminDashboard() {
  const [recalls, setRecalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedActionId, setExpandedActionId] = useState(null);

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
      const res = await fetch(`${BACKEND_URL}/admin/recalls`, {
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

  const handleAcknowledge = async (recallId) => {
    try {
      const idToken = await getFreshIdToken();
      const res = await fetch(`${BACKEND_URL}/admin/recall-acknowledge`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recallId }),
      });

      if (!res.ok) throw new Error('Failed to acknowledge recall');

      setRecalls((prev) =>
        prev.map((r) =>
          r.id === recallId
            ? { ...r, date_acknowledgment_submitted: new Date().toISOString() }
            : r
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnacknowledge = async (recallId) => {
    try {
      const idToken = await getFreshIdToken();
      const res = await fetch(`${BACKEND_URL}/admin/recall-unacknowledge`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recallId }),
      });

      if (!res.ok) throw new Error('Failed to unacknowledge recall');

      setRecalls((prev) =>
        prev.map((r) =>
          r.id === recallId
            ? { ...r, date_acknowledgment_submitted: null }
            : r
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Action items: all recalls that haven't been acknowledged (in progress)
  const actionItems = recalls.filter(
    (r) => !r.date_acknowledgment_submitted
  );

  // Recent recalls: last 5 recalls
  const recentRecalls = [...recalls]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // Stats
  const totalRecalls = recalls.length;
  const inProgress = actionItems.length;
  const processed = recalls.filter((r) => r.date_acknowledgment_submitted).length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System Overview and Management</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

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
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{inProgress}</p>
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
                <p className="text-sm font-medium text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{processed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items + Admin Controls side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle>Action Items ({actionItems.length} pending)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" />
              </div>
            ) : actionItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
                <p>All caught up!</p>
                <p className="text-sm mt-1">No pending action items</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actionItems.map((recall) => (
                  <div
                    key={recall.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Collapsed View - Click to expand */}
                    <button
                      onClick={() => setExpandedActionId(
                        expandedActionId === recall.id ? null : recall.id
                      )}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                    >
                      <ChevronDown
                        className={`h-5 w-5 text-gray-400 transition-transform ${
                          expandedActionId === recall.id ? 'rotate-180' : ''
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getClassificationColor(
                              recall.result?.fda_class
                            )}`}
                          >
                            {recall.result?.fda_class || 'Pending'}
                          </span>
                          <span className="font-medium text-gray-900 truncate">
                            {recall.result?.item_number || recall.id}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {recall.result?.manufacturer || 'Unknown manufacturer'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {recall.created_at
                          ? new Date(recall.created_at).toLocaleDateString()
                          : '-'}
                      </span>
                    </button>

                    {/* Expanded View - More details + Acknowledge button */}
                    {expandedActionId === recall.id && (
                      <div className="border-t bg-gray-50 p-4">
                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                          <div>
                            <span className="font-semibold text-gray-700">Item Number:</span>
                            <p className="text-gray-600">{recall.result?.item_number || '-'}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Lot Code:</span>
                            <p className="text-gray-600">{recall.result?.lot_code || '-'}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Manufacturer:</span>
                            <p className="text-gray-600">{recall.result?.manufacturer || '-'}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Product Code:</span>
                            <p className="text-gray-600">{recall.result?.product_code || '-'}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">FDA Class:</span>
                            <p className="text-gray-600">{recall.result?.fda_class || '-'}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Date Received:</span>
                            <p className="text-gray-600">
                              {recall.date_notification_received
                                ? new Date(recall.date_notification_received).toLocaleDateString()
                                : '-'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAcknowledge(recall.id)}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Mark as Processed
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Admin Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                to="/admin/users"
                className="block w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors text-center"
              >
                Manage Users
              </Link>
              <Link
                to="/admin/recalls"
                className="block w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors text-center"
              >
                View Recalls
              </Link>
              <button className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors">
                System Settings
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Recalls - full width below */}
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
            </div>
          ) : (
            <div className="space-y-3">
              {recentRecalls.map((recall) => (
                <div
                  key={recall.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {recall.result?.item_number || recall.id}
                      </span>
                      {recall.result?.fda_class && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getClassificationColor(
                            recall.result.fda_class
                          )}`}
                        >
                          {recall.result.fda_class}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {recall.result?.manufacturer || 'Processing...'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {recall.created_at
                      ? new Date(recall.created_at).toLocaleDateString()
                      : '-'}
                  </span>
                  <select
                    value={recall.date_acknowledgment_submitted ? 'processed' : 'in_progress'}
                    onChange={(e) => {
                      if (e.target.value === 'processed' && !recall.date_acknowledgment_submitted) {
                        handleAcknowledge(recall.id);
                      } else if (e.target.value === 'in_progress' && recall.date_acknowledgment_submitted) {
                        handleUnacknowledge(recall.id);
                      }
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-full border-0 cursor-pointer ${
                      recall.date_acknowledgment_submitted
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="processed">Processed</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
