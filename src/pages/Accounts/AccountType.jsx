// src/pages/Accounts/AccountType.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Tag, AlertCircle, CheckCircle } from 'lucide-react';
import { accountTypeAPI } from '../../services/api';

const AccountType = () => {
  const [accountTypes, setAccountTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    majorType: '',
  });

  useEffect(() => {
    fetchAccountTypes();
  }, []);

  const fetchAccountTypes = async () => {
    try {
      setLoading(true);
      const response = await accountTypeAPI.getAll();
      setAccountTypes(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching account types:', error);
      setMessage({ type: 'error', text: 'Failed to fetch account types' });
    } finally {
      setLoading(false);
    }
  };

  const filteredTypes = accountTypes.filter((type) =>
    type.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    setEditingType(null);
    setFormData({
      name: '',
      majorType: '',
    });
    setMessage({ type: '', text: '' });
    setShowModal(true);
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name || '',
      majorType: type.majorType || '',
    });
    setMessage({ type: '', text: '' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingType(null);
    setMessage({ type: '', text: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingType) {
        await accountTypeAPI.update(editingType._id, formData);
        setMessage({ type: 'success', text: 'Account type updated successfully!' });
      } else {
        await accountTypeAPI.create(formData);
        setMessage({ type: 'success', text: 'Account type created successfully!' });
      }
      setTimeout(() => {
        handleCloseModal();
        fetchAccountTypes();
      }, 1500);
    } catch (error) {
      console.error('Error saving account type:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save account type' });
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will fail if the account type is in use.`)) {
      try {
        await accountTypeAPI.delete(id);
        setMessage({ type: 'success', text: 'Account type deleted successfully!' });
        fetchAccountTypes();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        console.error('Error deleting account type:', error);
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to delete account type. It may be in use.'
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Account Types</h1>
          <p className="text-secondary-600 mt-1">Manage account type categories</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-5 py-2.5 font-semibold flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add Account Type</span>
        </button>
      </div>

      {/* Message Alert */}
      {message.text && !showModal && (
        <div
          className={`p-4 rounded-lg flex items-start space-x-3 animate-slideDown ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search account types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
          />
        </div>
      </div>

      {/* Account Types Table */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-secondary-600">Loading account types...</p>
          </div>
        ) : filteredTypes.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
            <p className="text-lg font-semibold text-secondary-900 mb-2">No account types found</p>
            <p className="text-secondary-600 mb-6">Get started by creating your first account type</p>
            <button
              onClick={handleAddNew}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-5 py-2.5 font-semibold inline-flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Add Account Type</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200 bg-secondary-50">
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Name</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Major Type</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTypes.map((type) => (
                  <tr key={type._id} className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Tag className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="font-semibold text-secondary-900">{type.name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-sm text-secondary-700">{type.majorType || '-'}</span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(type)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(type._id, type.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit Account Type */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={handleCloseModal}>
          <div className="bg-white rounded-2xl shadow-large w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-secondary-900">
                {editingType ? 'Edit Account Type' : 'Add New Account Type'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors">
                <X className="w-6 h-6 text-secondary-600" />
              </button>
            </div>

            {/* Message Alert in Modal */}
            {message.text && (
              <div className="px-6 pt-4">
                <div
                  className={`p-4 rounded-lg flex items-start space-x-3 ${
                    message.type === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                    {message.text}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                    placeholder="e.g., Current Asset, Sales, Expense"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2">
                    Major Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="majorType"
                    value={formData.majorType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                  >
                    <option value="">Select major type</option>
                    <option value="Assets">Assets</option>
                    <option value="Liabilities">Liabilities</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expenses">Expenses</option>
                  </select>
                </div>
              </div>

              <div className="bg-secondary-50 border-t border-secondary-200 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-2xl">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 bg-white text-secondary-700 font-semibold rounded-lg border border-secondary-300 hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  {editingType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountType;
