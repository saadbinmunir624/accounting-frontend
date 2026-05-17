// src/pages/Contacts/Contacts.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Mail, Phone, Building, AlertCircle, CheckCircle } from 'lucide-react';
import { contactAPI } from '../../services/api';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    contactName: '',
    accountNumber: '',
    email: '',
    phone: '',
    website: '',
    businessRegistrationNumber: '',
    notes: '',
    contactType: {
      isCustomer: false,
      isSupplier: false,
    },
    billingAddress: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
    financialDetails: {
      bankAccountName: '',
      bankAccountNumber: '',
      bankDetails: '',
      taxIdNumber: '',
    },
  });
  const [sameAsBilling, setSameAsBilling] = useState(false);

  // Fetch contacts on mount and when filter changes.
  // We only want this effect to re-run when `filterType` changes,
  // not on every render when `fetchContacts` is re-created.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchContacts();
  }, [filterType]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType !== 'all') {
        params.type = filterType;
      }
      const response = await contactAPI.getAll(params);
      setContacts(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setMessage({ type: 'error', text: 'Failed to fetch contacts' });
    } finally {
      setLoading(false);
    }
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter((contact) =>
    contact.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open modal for adding new contact
  const handleAddNew = () => {
    setEditingContact(null);
    setFormData({
      contactName: '',
      accountNumber: '',
      email: '',
      phone: '',
      website: '',
      businessRegistrationNumber: '',
      notes: '',
      contactType: {
        isCustomer: false,
        isSupplier: false,
      },
      billingAddress: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
      deliveryAddress: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
      financialDetails: {
        bankAccountName: '',
        bankAccountNumber: '',
        bankDetails: '',
        taxIdNumber: '',
      },
    });
    setSameAsBilling(false);
    setMessage({ type: '', text: '' });
    setShowModal(true);
  };

  // Open modal for editing contact
  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      contactName: contact.contactName || '',
      accountNumber: contact.accountNumber || '',
      email: contact.email || '',
      phone: contact.phone || '',
      website: contact.website || '',
      businessRegistrationNumber: contact.businessRegistrationNumber || '',
      notes: contact.notes || '',
      contactType: contact.contactType || {
        isCustomer: false,
        isSupplier: false,
      },
      billingAddress: contact.billingAddress || {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
      deliveryAddress: contact.deliveryAddress || {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
      financialDetails: contact.financialDetails || {
        bankAccountName: '',
        bankAccountNumber: '',
        bankDetails: '',
        taxIdNumber: '',
      },
    });
    setMessage({ type: '', text: '' });
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContact(null);
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

  // Handle checkbox changes for contact type
  const handleContactTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      contactType: {
        ...prev.contactType,
        [type]: !prev.contactType[type],
      },
    }));
  };

  // Handle nested object changes (addresses, financial details)
  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Copy billing address to delivery address
  const handleSameAsBilling = (checked) => {
    setSameAsBilling(checked);
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        deliveryAddress: { ...prev.billingAddress },
      }));
    }
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate at least one contact type is selected
    if (!formData.contactType.isCustomer && !formData.contactType.isSupplier) {
      setMessage({ type: 'error', text: 'Please select at least one contact type (Customer or Supplier)' });
      return;
    }

    try {
      if (editingContact) {
        await contactAPI.update(editingContact._id, formData);
        setMessage({ type: 'success', text: 'Contact updated successfully!' });
      } else {
        await contactAPI.create(formData);
        setMessage({ type: 'success', text: 'Contact created successfully!' });
      }
      setTimeout(() => {
        handleCloseModal();
        fetchContacts();
      }, 1500);
    } catch (error) {
      console.error('Error saving contact:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save contact' });
    }
  };

  // Delete contact
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await contactAPI.delete(id);
        setMessage({ type: 'success', text: 'Contact deleted successfully!' });
        fetchContacts();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        console.error('Error deleting contact:', error);
        setMessage({ type: 'error', text: 'Failed to delete contact' });
      }
    }
  };

  const getContactTypeBadges = (contact) => {
    const badges = [];
    if (contact.contactType?.isCustomer) {
      badges.push(
        <span key="customer" className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          Customer
        </span>
      );
    }
    if (contact.contactType?.isSupplier) {
      badges.push(
        <span key="supplier" className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
          Supplier
        </span>
      );
    }
    return badges.length > 0 ? badges : <span className="text-secondary-400">-</span>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Contacts</h1>
          <p className="text-secondary-600 mt-1">Manage your customers and suppliers</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-5 py-2.5 font-semibold flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add Contact</span>
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

      {/* Filter Tabs and Search */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-secondary-700 border border-secondary-200 hover:bg-secondary-50'
              }`}
            >
              All Contacts
            </button>
            <button
              onClick={() => setFilterType('customer')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterType === 'customer'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-secondary-700 border border-secondary-200 hover:bg-secondary-50'
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => setFilterType('supplier')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterType === 'supplier'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-secondary-700 border border-secondary-200 hover:bg-secondary-50'
              }`}
            >
              Suppliers
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or account number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
            />
          </div>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-secondary-600">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 text-center">
            <Building className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
            <p className="text-lg font-semibold text-secondary-900 mb-2">No contacts found</p>
            <p className="text-secondary-600 mb-6">Get started by creating your first contact</p>
            <button
              onClick={handleAddNew}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-5 py-2.5 font-semibold inline-flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Add Contact</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200 bg-secondary-50">
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Contact Name</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Account Number</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Email</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Phone</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Type</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact._id} className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="font-semibold text-secondary-900">{contact.contactName}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-sm text-secondary-700">{contact.accountNumber || '-'}</td>
                    <td className="py-2 px-3">
                      {contact.email ? (
                        <div className="flex items-center space-x-2 text-sm text-secondary-700">
                          <Mail className="w-4 h-4 text-secondary-400" />
                          <span>{contact.email}</span>
                        </div>
                      ) : (
                        <span className="text-secondary-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {contact.phone ? (
                        <div className="flex items-center space-x-2 text-sm text-secondary-700">
                          <Phone className="w-4 h-4 text-secondary-400" />
                          <span>{contact.phone}</span>
                        </div>
                      ) : (
                        <span className="text-secondary-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {getContactTypeBadges(contact)}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(contact)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contact._id, contact.contactName)}
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

      {/* Modal for Add/Edit Contact */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={handleCloseModal}>
          <div className="bg-white rounded-2xl shadow-large w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-secondary-900">
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
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
              <div className="px-6 py-6 space-y-6">
                {/* Contact Type Selection */}
                <div className="bg-secondary-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-3">Contact Type</h3>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.contactType.isCustomer}
                        onChange={() => handleContactTypeChange('isCustomer')}
                        className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-secondary-700">Customer</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.contactType.isSupplier}
                        onChange={() => handleContactTypeChange('isSupplier')}
                        className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-secondary-700">Supplier</span>
                    </label>
                  </div>
                </div>

                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">
                        Contact Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="Enter contact name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Account Number</label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="e.g., ACC-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="contact@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="+1-555-0100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Website</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Business Registration Number</label>
                      <input
                        type="text"
                        name="businessRegistrationNumber"
                        value={formData.businessRegistrationNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="BRN-123456"
                      />
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Billing Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Street</label>
                      <input
                        type="text"
                        value={formData.billingAddress.street}
                        onChange={(e) => handleNestedChange('billingAddress', 'street', e.target.value)}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">City</label>
                      <input
                        type="text"
                        value={formData.billingAddress.city}
                        onChange={(e) => handleNestedChange('billingAddress', 'city', e.target.value)}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="New York"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">State</label>
                      <input
                        type="text"
                        value={formData.billingAddress.state}
                        onChange={(e) => handleNestedChange('billingAddress', 'state', e.target.value)}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="NY"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={formData.billingAddress.country}
                        onChange={(e) => handleNestedChange('billingAddress', 'country', e.target.value)}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="USA"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Postal Code</label>
                      <input
                        type="text"
                        value={formData.billingAddress.postalCode}
                        onChange={(e) => handleNestedChange('billingAddress', 'postalCode', e.target.value)}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="10001"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-secondary-900">Delivery Address</h3>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameAsBilling}
                        onChange={(e) => handleSameAsBilling(e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-secondary-700">Same as billing address</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Street</label>
                      <input
                        type="text"
                        value={formData.deliveryAddress.street}
                        onChange={(e) => handleNestedChange('deliveryAddress', 'street', e.target.value)}
                        disabled={sameAsBilling}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900 disabled:bg-secondary-100 disabled:cursor-not-allowed"
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">City</label>
                      <input
                        type="text"
                        value={formData.deliveryAddress.city}
                        onChange={(e) => handleNestedChange('deliveryAddress', 'city', e.target.value)}
                        disabled={sameAsBilling}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900 disabled:bg-secondary-100 disabled:cursor-not-allowed"
                        placeholder="New York"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">State</label>
                      <input
                        type="text"
                        value={formData.deliveryAddress.state}
                        onChange={(e) => handleNestedChange('deliveryAddress', 'state', e.target.value)}
                        disabled={sameAsBilling}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900 disabled:bg-secondary-100 disabled:cursor-not-allowed"
                        placeholder="NY"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={formData.deliveryAddress.country}
                        onChange={(e) => handleNestedChange('deliveryAddress', 'country', e.target.value)}
                        disabled={sameAsBilling}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900 disabled:bg-secondary-100 disabled:cursor-not-allowed"
                        placeholder="USA"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Postal Code</label>
                      <input
                        type="text"
                        value={formData.deliveryAddress.postalCode}
                        onChange={(e) => handleNestedChange('deliveryAddress', 'postalCode', e.target.value)}
                        disabled={sameAsBilling}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900 disabled:bg-secondary-100 disabled:cursor-not-allowed"
                        placeholder="10001"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Financial Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Bank Account Name</label>
                      <input
                        type="text"
                        value={formData.financialDetails.bankAccountName}
                        onChange={(e) => handleNestedChange('financialDetails', 'bankAccountName', e.target.value)}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="Business Account"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Bank Account Number</label>
                      <input
                        type="text"
                        value={formData.financialDetails.bankAccountNumber}
                        onChange={(e) => handleNestedChange('financialDetails', 'bankAccountNumber', e.target.value)}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="1234567890"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Bank Details</label>
                      <input
                        type="text"
                        value={formData.financialDetails.bankDetails}
                        onChange={(e) => handleNestedChange('financialDetails', 'bankDetails', e.target.value)}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="Chase Bank, NY Branch"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">Tax ID Number</label>
                      <input
                        type="text"
                        value={formData.financialDetails.taxIdNumber}
                        onChange={(e) => handleNestedChange('financialDetails', 'taxIdNumber', e.target.value)}
                        className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                        placeholder="TAX-123456"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Notes</h3>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                    placeholder="Additional notes about this contact..."
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-secondary-50 border-t border-secondary-200 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-2xl">
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
                  {editingContact ? 'Update Contact' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
