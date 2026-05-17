// src/pages/Manage/Items.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Package, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { itemAPI, chartOfAccountsAPI, taxTypeAPI } from '../../services/api';

const Items = () => {
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [taxTypes, setTaxTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    itemCode: '',
    name: '',
    description: '',
    costPrice: '',
    salePrice: '',
    purchaseAccount: '',
    taxRateOnPurchase: '',
    saleAccount: '',
    taxRateOnSale: '',
  });

  useEffect(() => {
    fetchItems();
    fetchAccounts();
    fetchTaxTypes();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemAPI.getAll();
      setItems(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      setMessage({ type: 'error', text: 'Failed to fetch items' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await chartOfAccountsAPI.getAll();
      setAccounts(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
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

  const filteredItems = items.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.itemCode?.toLowerCase().includes(searchLower) ||
      item.name?.toLowerCase().includes(searchLower)
    );
  });

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      itemCode: '',
      name: '',
      description: '',
      costPrice: '',
      salePrice: '',
      purchaseAccount: '',
      taxRateOnPurchase: '',
      saleAccount: '',
      taxRateOnSale: '',
    });
    setMessage({ type: '', text: '' });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      itemCode: item.itemCode || '',
      name: item.name || '',
      description: item.description || '',
      costPrice: item.costPrice || '',
      salePrice: item.salePrice || '',
      purchaseAccount: item.purchaseAccount?._id || item.purchaseAccount || '',
      taxRateOnPurchase: item.taxRateOnPurchase?._id || item.taxRateOnPurchase || '',
      saleAccount: item.saleAccount?._id || item.saleAccount || '',
      taxRateOnSale: item.taxRateOnSale?._id || item.taxRateOnSale || '',
    });
    setMessage({ type: '', text: '' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
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
      if (editingItem) {
        await itemAPI.update(editingItem._id, formData);
        setMessage({ type: 'success', text: 'Item updated successfully!' });
      } else {
        await itemAPI.create(formData);
        setMessage({ type: 'success', text: 'Item created successfully!' });
      }
      setTimeout(() => {
        handleCloseModal();
        fetchItems();
      }, 1500);
    } catch (error) {
      console.error('Error saving item:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save item' });
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await itemAPI.delete(id);
        setMessage({ type: 'success', text: 'Item deleted successfully!' });
        fetchItems();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        console.error('Error deleting item:', error);
        setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete item' });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Items</h1>
          <p className="text-secondary-600 mt-1">Manage your products and services</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-6 py-3 font-semibold flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add Item</span>
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
      <div className="bg-white rounded-xl shadow-soft p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search items by item code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-secondary-600">Loading items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
            <p className="text-lg font-semibold text-secondary-900 mb-2">No items found</p>
            <p className="text-secondary-600 mb-6">Get started by creating your first item</p>
            <button
              onClick={handleAddNew}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-6 py-3 font-semibold inline-flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Add Item</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 border-b border-secondary-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Item Code</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Sale Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Purchase Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="font-semibold text-secondary-900">{item.itemCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-secondary-900">{item.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-secondary-900">
                          {item.salePrice ? parseFloat(item.salePrice).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-secondary-900">
                          {item.costPrice ? parseFloat(item.costPrice).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-secondary-600">
                        {item.description ? (item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id, item.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Item"
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

      {/* Modal for Add/Edit Item */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <div>
                <h2 className="text-2xl font-bold text-secondary-900">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h2>
                <p className="text-sm text-secondary-600 mt-1">
                  {editingItem ? 'Update item information and pricing' : 'Create a new item for inventory'}
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors">
                <X className="w-6 h-6 text-secondary-600" />
              </button>
            </div>

            {/* Message Alert in Modal */}
            {message.text && (
              <div className="px-6 pt-6">
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
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">
                        Item Code <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="itemCode"
                        value={formData.itemCode}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="e.g., ITM-001"
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
                        placeholder="Enter item name"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="Item description..."
                      />
                    </div>
                  </div>
                </div>

                {/* Purchase Information */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Purchase Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Cost Price</label>
                      <input
                        type="number"
                        name="costPrice"
                        step="0.01"
                        min="0"
                        value={formData.costPrice}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Purchase Account</label>
                      <select
                        name="purchaseAccount"
                        value={formData.purchaseAccount}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                      >
                        <option value="">Select account</option>
                        {accounts.map((account) => (
                          <option key={account._id} value={account._id}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Tax Rate on Purchase</label>
                      <select
                        name="taxRateOnPurchase"
                        value={formData.taxRateOnPurchase}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                      >
                        <option value="">No tax</option>
                        {taxTypes.map((tax) => (
                          <option key={tax._id} value={tax._id}>
                            {tax.name} ({tax.taxPercentage}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sale Information */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Sale Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Sale Price</label>
                      <input
                        type="number"
                        name="salePrice"
                        step="0.01"
                        min="0"
                        value={formData.salePrice}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Sale Account</label>
                      <select
                        name="saleAccount"
                        value={formData.saleAccount}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                      >
                        <option value="">Select account</option>
                        {accounts.map((account) => (
                          <option key={account._id} value={account._id}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Tax Rate on Sale</label>
                      <select
                        name="taxRateOnSale"
                        value={formData.taxRateOnSale}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                      >
                        <option value="">No tax</option>
                        {taxTypes.map((tax) => (
                          <option key={tax._id} value={tax._id}>
                            {tax.name} ({tax.taxPercentage}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-secondary-50 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg"
                >
                  {editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
