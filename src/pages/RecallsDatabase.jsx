import { useState, useEffect, Fragment } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Search, Edit2, ChevronDown, ChevronUp, RotateCcw, CheckSquare, Square } from 'lucide-react';
import { getFreshIdToken } from '../lib/tokenManager';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080';

const CLASSIFICATION_OPTIONS = [
  'Class I',
  'Class II',
  'Class III',
  'Pending',
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
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAllRecalls, setShowAllRecalls] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    fetchRecalls();
  }, [showAllRecalls]);

  const checkUserRole = async () => {
    try {
      const idToken = await getFreshIdToken();
      // Try to fetch admin recalls to check if user is admin
      const res = await fetch(`${BACKEND_URL}/admin/recalls`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setIsAdmin(res.ok);
      // Set initial state to show all recalls only if admin
      if (!res.ok) {
        setShowAllRecalls(false);
      }
    } catch (err) {
      setIsAdmin(false);
      setShowAllRecalls(false);
    }
  };

  const fetchRecalls = async () => {
    try {
      setLoading(true);
      const idToken = await getFreshIdToken();
      const endpoint = (isAdmin && showAllRecalls) ? '/admin/recalls' : '/user/recalls';
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
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
      recall.result?.fda_class || 'Pending'
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

  const handleMarkReviewed = async (recallId) => {
    try {
      const idToken = await getFreshIdToken();
      const res = await fetch(`${BACKEND_URL}/admin/recall-review`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recallId }),
      });

      if (!res.ok) throw new Error('Failed to mark recall as reviewed');

      setRecalls((prev) =>
        prev.map((r) =>
          r.id === recallId
            ? { ...r, reviewed_at: new Date().toISOString() }
            : r
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMarkPending = async (recallId) => {
    try {
      const idToken = await getFreshIdToken();
      const res = await fetch(`${BACKEND_URL}/admin/recall-unreview`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recallId }),
      });

      if (!res.ok) throw new Error('Failed to mark recall as pending');

      setRecalls((prev) =>
        prev.map((r) =>
          r.id === recallId
            ? { ...r, reviewed_at: null }
            : r
        )
      );
    } catch (err) {
      setError(err.message);
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

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredRecalls = [...filteredRecalls].sort((a, b) => {
    let aValue, bValue;

    if (sortColumn === 'created_at') {
      aValue = new Date(a.created_at || 0).getTime();
      bValue = new Date(b.created_at || 0).getTime();
    } else if (sortColumn === 'fda_class') {
      aValue = a.result?.fda_class || 'Pending';
      bValue = b.result?.fda_class || 'Pending';
    }

    if (aValue === undefined || bValue === undefined) return 0;

    let primarySort = 0;
    if (typeof aValue === 'string') {
      primarySort = sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      primarySort = sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // If primary sort is equal and we're sorting by classification, sort by date ascending
    if (primarySort === 0 && sortColumn === 'fda_class') {
      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();
      return aDate - bDate; // Always ascending by date
    }

    return primarySort;
  });

  const SortHeader = ({ column, label }) => (
    <th
      onClick={() => handleSort(column)}
      className="text-left px-4 py-3 cursor-pointer hover:bg-gray-100"
    >
      <div className="flex items-center gap-2">
        {label}
        {sortColumn === column && (
          sortDirection === 'asc' ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        )}
      </div>
    </th>
  );

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

  const groupByItemNumber = (recalls) => {
    const grouped = {};
    recalls.forEach((recall) => {
      const itemNumber = recall.result?.item_number || 'Unknown';
      if (!grouped[itemNumber]) {
        grouped[itemNumber] = [];
      }
      grouped[itemNumber].push(recall);
    });
    return grouped;
  };

  const displayRecalls = showDuplicates 
    ? Object.entries(groupByItemNumber(sortedAndFilteredRecalls)).map(([itemNumber, group]) => ({
        itemNumber,
        group: group.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        isGroup: true
      }))
    : sortedAndFilteredRecalls.map(recall => ({ recall, isGroup: false }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{isAdmin ? 'Manage Recalls' : 'My Recalls'}</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? (showAllRecalls ? 'All Recalls' : 'View your submitted recalls') : 'View your submitted recalls'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAllRecalls(!showAllRecalls)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showAllRecalls
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {showAllRecalls ? 'My Recalls' : 'All Recalls'}
          </button>
        )}
      </div>

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
                  <SortHeader column="fda_class" label="FDA Class" />
                  <SortHeader column="created_at" label="Created" />
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {sortedAndFilteredRecalls.map((recall) => (
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
                            {recall.result?.fda_class || 'Pending'}
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
                        <select
                          value={recall.reviewed_at ? 'reviewed' : 'pending'}
                          onChange={(e) => {
                            if (e.target.value === 'reviewed' && !recall.reviewed_at) {
                              handleMarkReviewed(recall.id);
                            } else if (e.target.value === 'pending' && recall.reviewed_at) {
                              handleMarkPending(recall.id);
                            }
                          }}
                          className={`px-3 py-1 text-xs font-medium rounded-full border-0 cursor-pointer ${
                            recall.reviewed_at
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {editingId !== recall.id && (
                            <button
                              onClick={() =>
                                handleEditClassification(recall)
                              }
                              className="p-2 hover:bg-blue-50 rounded"
                              title="Edit Classification"
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
                            title="View Details"
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
                            <td colSpan="7" className="py-4 px-4">
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

                                {recall.file_url && (
                                  <div className="col-span-2">
                                    <span className="font-semibold">Recall PDF:</span>
                                    <div className="mt-1">
                                      <a
                                        href={recall.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline"
                                      >
                                        Open Document
                                      </a>
                                    </div>
                                  </div>
                                )}
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
                                  <span className="font-semibold text-gray-700">Date Reviewed:</span>
                                  <p className="text-gray-600">
                                    {recall.reviewed_at
                                      ? new Date(recall.reviewed_at).toLocaleString()
                                      : 'Not yet reviewed'}
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