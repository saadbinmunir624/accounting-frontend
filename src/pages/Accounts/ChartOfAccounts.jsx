// src/pages/Accounts/ChartOfAccounts.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';
import { chartOfAccountsAPI, accountTypeAPI, taxTypeAPI } from '../../services/api';

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [taxTypes, setTaxTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    accountType: '',
    tax: '',
  });

  // Fetch data on mount
  useEffect(() => {
    fetchAccountTypes();
    fetchTaxTypes();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await chartOfAccountsAPI.getAll();
      const accountsData = response.data.data || response.data;
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setMessage({ type: 'error', text: 'Failed to fetch chart of accounts' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountTypes.length > 0) {
      fetchAccounts();
    }
  }, [filterType, accountTypes]);

  const fetchAccountTypes = async () => {
    try {
      const response = await accountTypeAPI.getAll();
      setAccountTypes(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching account types:', error);
    }
  };

  const fetchTaxTypes = async () => {
    try {
      const response = await taxTypeAPI.getAll();
      setTaxTypes(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching tax types:', error);
    }
  };

  // Filter accounts based on search
  const filteredAccounts = accounts
    .filter((account) =>
      account.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((account) => {
      if (filterType === 'all') return true;

      const typeId =
        typeof account.accountType === 'object' && account.accountType?._id
          ? account.accountType._id
          : account.accountType;

      const matchedType = accountTypes.find((t) => t._id === typeId);
      const majorType = matchedType?.majorType;

      return majorType === filterType;
    });

  // Open modal for adding new account
  const handleAddNew = () => {
    setEditingAccount(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      accountType: '',
      tax: '',
    });
    setMessage({ type: '', text: '' });
    setShowModal(true);
  };

  // Open modal for editing account
  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      code: account.code || '',
      name: account.name || '',
      description: account.description || '',
      accountType: account.accountType?._id || account.accountType || '',
      tax: account.tax?._id || account.tax || '',
    });
    setMessage({ type: '', text: '' });
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAccount(null);
    setMessage({ type: '', text: '' });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingAccount) {
        await chartOfAccountsAPI.update(editingAccount._id, formData);
        setMessage({ type: 'success', text: 'Account updated successfully!' });
      } else {
        await chartOfAccountsAPI.create(formData);
        setMessage({ type: 'success', text: 'Account created successfully!' });
      }
      setTimeout(() => {
        handleCloseModal();
        fetchAccounts();
      }, 1500);
    } catch (error) {
      console.error('Error saving account:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save account' });
    }
  };

  // Delete account
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await chartOfAccountsAPI.delete(id);
        setMessage({ type: 'success', text: 'Account deleted successfully!' });
        fetchAccounts();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        console.error('Error deleting account:', error);
        setMessage({ type: 'error', text: 'Failed to delete account' });
      }
    }
  };

  // Import general/default chart of accounts
  const handleImportDefaults = async () => {
    if (!window.confirm('Import the general chart of accounts? Existing accounts with the same codes will be skipped.')) {
      return;
    }
    try {
      setLoading(true);
      const response = await chartOfAccountsAPI.importDefaults();
      const importedCount = response.data?.importedCount ?? 0;
      setMessage({
        type: 'success',
        text:
          importedCount > 0
            ? `Imported ${importedCount} default accounts successfully.`
            : 'No new accounts to import. All default codes already exist.',
      });
      await fetchAccounts();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error importing default chart of accounts:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to import default chart of accounts',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeName = (account) => {
    if (typeof account.accountType === 'object' && account.accountType?.name) {
      return account.accountType.name;
    }
    const type = accountTypes.find((t) => t._id === account.accountType);
    return type?.name || '-';
  };

  const getTaxTypeName = (account) => {
    if (!account.tax) return '-';
    if (typeof account.tax === 'object' && account.tax?.name) {
      return account.tax.name;
    }
    const tax = taxTypes.find((t) => t._id === account.tax);
    return tax?.name || '-';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Chart of Accounts</h1>
          <p className="text-secondary-600 mt-1">Manage your accounting chart of accounts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleImportDefaults}
            className="bg-secondary-100 hover:bg-secondary-200 text-secondary-800 rounded-lg px-4 py-2.5 font-semibold flex items-center space-x-2 border border-secondary-300 transition-all"
          >
            <BookOpen className="w-5 h-5" />
            <span>Import General Chart of Accounts</span>
          </button>
          <button
            onClick={handleAddNew}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-5 py-2.5 font-semibold flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add Account</span>
          </button>
        </div>
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

      {/* Filter Tabs and Search */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-secondary-700 border border-secondary-200 hover:bg-secondary-50'
              }`}
            >
              All
            </button>
            {['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'].map((label) => (
              <button
                key={label}
                onClick={() => setFilterType(label)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterType === label
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-secondary-700 border border-secondary-200 hover:bg-secondary-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
            />
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-secondary-600">Loading accounts...</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
            <p className="text-lg font-semibold text-secondary-900 mb-2">No accounts found</p>
            <p className="text-secondary-600 mb-6">Get started by creating your first account</p>
            <button
              onClick={handleAddNew}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-5 py-2.5 font-semibold inline-flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Add Account</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200 bg-secondary-50">
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Code</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Name</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Account Type</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Tax Type</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Description</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account._id} className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors">
                    <td className="py-2 px-3">
                      <span className="font-semibold text-secondary-900">{account.code}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-secondary-900">{account.name}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-sm text-secondary-700">{getAccountTypeName(account)}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-sm text-secondary-700">{getTaxTypeName(account)}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-sm text-secondary-600">{account.description || '-'}</span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(account)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(account._id, account.name)}
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

      {/* Modal for Add/Edit Account */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={handleCloseModal}>
          <div className="bg-white rounded-2xl shadow-large w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-secondary-900">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-2">
                      Code <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                      placeholder="e.g., 1000"
                    />
                  </div>

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
                      placeholder="Account name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-2">
                      Account Type <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="accountType"
                      value={formData.accountType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                    >
                      <option value="">Select account category</option>
                      {['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'].map((group) => {
                        const typesInGroup = accountTypes.filter((t) => t.majorType === group);
                        if (!typesInGroup.length) return null;
                        return (
                          <optgroup key={group} label={group.toUpperCase()}>
                            {typesInGroup.map((type) => (
                              <option key={type._id} value={type._id}>
                                {type.name}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 mb-2">Tax Type</label>
                    <select
                      name="tax"
                      value={formData.tax}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                    >
                      <option value="">No tax</option>
                      {taxTypes.map((tax) => (
                        <option key={tax._id} value={tax._id}>
                          {tax.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                    placeholder="Account description..."
                  />
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
                  {editingAccount ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;
