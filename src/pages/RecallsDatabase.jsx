import { useState, useEffect, Fragment } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Search, Edit2, ChevronDown } from 'lucide-react';
import { getFreshIdToken } from '../lib/tokenManager';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const CLASSIFICATION_OPTIONS = [
  'Class I',
  'Class II',
  'Class III',
  'Pending Review',
  'Not Applicable',
];

export function RecallsDatabase() {
  const [recalls, setRecalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingClassification, setEditingClassification] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchRecalls();
  }, []);

  const fetchRecalls = async () => {
    try {
      setLoading(true);
      const idToken = await getFreshIdToken();
      const res = await fetch(`${BACKEND_URL}/admin/recalls`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) throw new Error('Failed to fetch recalls');
      const data = await res.json();
      setRecalls(Array.isArray(data.recalls) ? data.recalls : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClassification = (recall) => {
    setEditingId(recall.id);
    setEditingClassification(
      recall.result?.fda_class || 'Pending Review'
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingClassification('');
  };

  const handleSaveClassification = async (recallId) => {
    try {
      setUpdateLoading(true);
      const idToken = await getFreshIdToken();

      const res = await fetch(
        `${BACKEND_URL}/admin/recall-classification`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recallId,
            classification: editingClassification,
          }),
        }
      );

      if (!res.ok) throw new Error('Update failed');

      setRecalls((prev) =>
        prev.map((r) =>
          r.id === recallId
            ? {
                ...r,
                result: {
                  ...r.result,
                  fda_class: editingClassification,
                },
              }
            : r
        )
      );

      handleCancelEdit();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const filteredRecalls = recalls.filter((r) => {
    const s = searchTerm.toLowerCase();
    return (
      r.id?.toLowerCase().includes(s) ||
      r.result?.item_number?.toLowerCase().includes(s) ||
      r.result?.manufacturer?.toLowerCase().includes(s) ||
      r.result?.product_name?.toLowerCase().includes(s) ||
      r.result?.product_code?.toLowerCase().includes(s) ||
      r.result?.fda_class?.toLowerCase().includes(s)
    );
  });

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Recalls</h1>
      <p className="text-gray-600 mt-1 mb-6">
        Manage recalls and classifications
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Search Database</CardTitle>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, item number, product name, manufacturer, class, or product code..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Showing {filteredRecalls.length} of {recalls.length} recalls
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-3">Item Number</th>
                  <th className="text-left px-4 py-3">Manufacturer</th>
                  <th className="text-left px-4 py-3">Product Code</th>
                  <th className="text-left px-4 py-3">FDA Class</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecalls.map((recall) => (
                  <Fragment key={recall.id}>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm">
                        {recall.result?.item_number || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {recall.result?.manufacturer || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {recall.result?.product_code || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === recall.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editingClassification}
                              onChange={(e) =>
                                setEditingClassification(e.target.value)
                              }
                              className="border rounded px-2 py-1 text-sm"
                            >
                              {CLASSIFICATION_OPTIONS.map((opt) => (
                                <option key={opt}>{opt}</option>
                              ))}
                            </select>
                            <button
                              onClick={() =>
                                handleSaveClassification(recall.id)
                              }
                              disabled={updateLoading}
                              className="px-2 py-1 text-sm bg-blue-600 text-white rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-2 py-1 text-sm bg-gray-300 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`whitespace-nowrap inline-block px-3 py-1 rounded-full text-xs font-semibold ${getClassificationColor(
                              recall.result?.fda_class
                            )}`}
                          >
                            {recall.result?.fda_class || 'Pending Review'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {recall.created_at
                          ? new Date(
                              recall.created_at
                            ).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {editingId !== recall.id && (
                            <button
                              onClick={() =>
                                handleEditClassification(recall)
                              }
                              className="p-2 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setExpandedId(
                                expandedId === recall.id
                                  ? null
                                  : recall.id
                              )
                            }
                            className="p-2 hover:bg-gray-100 rounded"
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                expandedId === recall.id
                                  ? 'rotate-180'
                                  : ''
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                        {expandedId === recall.id && (
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <td colSpan="6" className="py-4 px-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-semibold text-gray-700">Item Number:</span>
                                  <p className="text-gray-600">{recall.result.item_number || '-'}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Lot Code:</span>
                                  <p className="text-gray-600">{recall.result.lot_code || '-'}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Manufacturer:</span>
                                  <p className="text-gray-600">{recall.result.manufacturer || '-'}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Product Code:</span>
                                  <p className="text-gray-600">{recall.result.product_code || '-'}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">FDA Class:</span>
                                  <p className="text-gray-600">{recall.result.fda_class || '-'}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">File Type:</span>
                                  <p className="text-gray-600">{recall.result.filetype || '-'}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Created:</span>
                                  <p className="text-gray-600">
                                    {recall.created_at
                                      ? new Date(recall.created_at).toLocaleString()
                                      : '-'}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Date Notification Received:</span>
                                  <p className="text-gray-600">
                                    {recall.date_notification_received
                                      ? new Date(recall.date_notification_received).toLocaleString()
                                      : '-'}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Date Acknowledgment Submitted:</span>
                                  <p className="text-gray-600">
                                    {recall.date_acknowledgment_submitted
                                      ? new Date(recall.date_acknowledgment_submitted).toLocaleString()
                                      : '-'}
                                  </p>
                                </div>
                                {recall.result && (
                                  <div className="col-span-2">
                                    <span className="font-semibold text-gray-700">Result:</span>
                                    <pre className="text-gray-600 mt-1 bg-white p-2 rounded border border-gray-200 text-xs overflow-auto max-h-40">
                                      {JSON.stringify(recall.result, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
