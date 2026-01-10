import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Search, Edit2, ChevronDown, X } from 'lucide-react';
import { getFreshIdToken } from '../lib/tokenManager';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const CLASSIFICATION_OPTIONS = [
  'Class I',
  'Class II',
  'Class III',
  'Pending Review',
  'Not Applicable'
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
    setLoading(true);
    setError(null);
    try {
      const idToken = await getFreshIdToken();
      const response = await fetch(`${BACKEND_URL}/admin/recalls`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recalls');
      }

      const data = await response.json();
      setRecalls(Array.isArray(data.recalls) ? data.recalls : []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClassification = (recall) => {
    setEditingId(recall.id);
    setEditingClassification(recall.classification || 'Pending Review');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingClassification('');
  };

  const handleSaveClassification = async (recallId) => {
    setUpdateLoading(true);
    try {
      const idToken = await getFreshIdToken();
      const response = await fetch(`${BACKEND_URL}/admin/recall-classification`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recallId,
          classification: editingClassification,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update classification');
      }

      // Update local state
      setRecalls(
        recalls.map(r =>
          r.id === recallId ? { ...r, classification: editingClassification } : r
        )
      );

      setEditingId(null);
      setEditingClassification('');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const filteredRecalls = recalls.filter(recall => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (recall.id && recall.id.toLowerCase().includes(searchLower)) ||
      (recall.product_name && recall.product_name.toLowerCase().includes(searchLower)) ||
      (recall.manufacturer && recall.manufacturer.toLowerCase().includes(searchLower)) ||
      (recall.classification && recall.classification.toLowerCase().includes(searchLower))
    );
  });

  const getClassificationColor = (classification) => {
    const colors = {
      'Critical': 'bg-red-100 text-red-800',
      'High': 'bg-orange-100 text-orange-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-green-100 text-green-800',
      'Pending Review': 'bg-blue-100 text-blue-800',
      'Not Applicable': 'bg-gray-100 text-gray-800',
    };
    return colors[classification] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recalls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recalls</h1>
        <p className="text-gray-600 mt-2">Manage recalls and classifications</p>
      </div>
    {error && (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Database</CardTitle>
          </CardHeader>
          <CardContent>
            

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ID, product name, manufacturer, or classification..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredRecalls.length} of {recalls.length} recalls
            </div>

            {/* Recalls Table */}
            {filteredRecalls.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No recalls found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Recall ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Product Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Manufacturer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Classification</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Submitted</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecalls.map((recall) => (
                      <tbody key={recall.id}>
                        <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-mono text-sm text-gray-900">{recall.id}</td>
                          <td className="py-3 px-4 text-gray-900">{recall.product_name || '-'}</td>
                          <td className="py-3 px-4 text-gray-900">{recall.manufacturer || '-'}</td>
                          <td className="py-3 px-4">
                            {editingId === recall.id ? (
                              <div className="flex gap-2">
                                <select
                                  value={editingClassification}
                                  onChange={(e) => setEditingClassification(e.target.value)}
                                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  {CLASSIFICATION_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleSaveClassification(recall.id)}
                                  disabled={updateLoading}
                                  className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={updateLoading}
                                  className="px-2 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getClassificationColor(recall.classification)}`}>
                                {recall.classification || 'Pending Review'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {recall.submitted_at
                              ? new Date(recall.submitted_at).toLocaleDateString()
                              : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {editingId !== recall.id && (
                                <button
                                  onClick={() => handleEditClassification(recall)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit classification"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  setExpandedId(expandedId === recall.id ? null : recall.id)
                                }
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title="View details"
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${
                                    expandedId === recall.id ? 'transform rotate-180' : ''
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
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-semibold text-gray-700">Description:</span>
                                  <p className="text-gray-600 mt-1">{recall.description || 'No description'}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Risk Level:</span>
                                  <p className="text-gray-600">{recall.risk_level || '-'}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Actions Required:</span>
                                  <p className="text-gray-600">{recall.actions_required || '-'}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Status:</span>
                                  <p className="text-gray-600">{recall.status || '-'}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
