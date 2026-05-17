// PurchaseOrder.jsx - Purchase Orders to Vendors
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Edit,
  Calendar,
  FileText
} from 'lucide-react';
import {
  purchaseOrderAPI,
  contactAPI,
  itemAPI,
  chartOfAccountsAPI,
  taxTypeAPI
} from '../../services/api';
import ContactFormModal from '../../components/Forms/ContactFormModal';
import ItemFormModal from '../../components/Forms/ItemFormModal';
import AccountFormModal from '../../components/Forms/AccountFormModal';

const PurchaseOrder = () => {
  const navigate = useNavigate();
  // View state
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editingPO, setEditingPO] = useState(null);

  // List view state
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  // Form view state
  const [contacts, setContacts] = useState([]);
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [taxTypes, setTaxTypes] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isApproving, setIsApproving] = useState(false);

  // Modal states
  const [showContactModal, setShowContactModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // PO form data
  const [formData, setFormData] = useState({
    contact: '',
    issueDate: new Date().toISOString().split('T')[0],
    purchaseOrderNumber: '',
    reference: '',
    taxMode: 'Excluding', // Including, Excluding, No Tax
    lineItems: [{ item: '', description: '', qty: 1, price: 0, discount: 0, account: '', taxType: '', taxAmount: 0, amount: 0 }],
    subtotal: 0,
    totalTax: 0,
    grandTotal: 0,
  });

  const [selectedStatus, setSelectedStatus] = useState('Draft');

  // Search state for autocomplete
  const [itemSearchTerms, setItemSearchTerms] = useState({});
  const [itemSearchResults, setItemSearchResults] = useState({});
  const [showItemDropdown, setShowItemDropdown] = useState({});

  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [contactSearchResults, setContactSearchResults] = useState([]);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  const [accountSearchTerms, setAccountSearchTerms] = useState({});
  const [accountSearchResults, setAccountSearchResults] = useState({});
  const [showAccountDropdown, setShowAccountDropdown] = useState({});

  // Fetch data on mount
  useEffect(() => {
    fetchPurchaseOrders();
    fetchContacts();
    fetchItems();
    fetchAccounts();
    fetchTaxTypes();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await purchaseOrderAPI.getAll();
      setPurchaseOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await contactAPI.getAll({ type: 'supplier' });
      setContacts(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await itemAPI.getAll();
      setItems(response.data.data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await chartOfAccountsAPI.getAll();
      setAccounts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchTaxTypes = async () => {
    try {
      const response = await taxTypeAPI.getAll();
      setTaxTypes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tax types:', error);
    }
  };


  // Utility functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      Draft: 'bg-secondary-100 text-secondary-800',
      Sent: 'bg-blue-100 text-blue-800',
      Approved: 'bg-green-100 text-green-800',
    };
    return statusClasses[status] || 'bg-secondary-100 text-secondary-800';
  };

  // Navigation functions
  const handleNewPO = () => {
    setEditingPO(null);
    setFormData({
      contact: '',
      issueDate: new Date().toISOString().split('T')[0],
      purchaseOrderNumber: '',
      reference: '',
      taxMode: 'Excluding',
      lineItems: [{ item: '', description: '', qty: 1, price: 0, discount: 0, account: '', taxType: '', taxAmount: 0, amount: 0 }],
      subtotal: 0,
      totalTax: 0,
      grandTotal: 0,
    });
    setSelectedStatus('Draft');
    setContactSearchTerm('');
    setItemSearchTerms({});
    setAccountSearchTerms({});
    setView('form');
  };

  const handleEditPO = (po) => {
    setEditingPO(po);

    const contact = contacts.find(c => c._id === po.contact?._id || po.contact);
    setContactSearchTerm(contact?.contactName || '');

    const lineItemsWithSearch = po.lineItems.map((lineItem, index) => {
      const item = items.find(i => i._id === (lineItem.item?._id || lineItem.item));
      const account = accounts.find(a => a._id === (lineItem.account?._id || lineItem.account));

      if (item) {
        setItemSearchTerms(prev => ({ ...prev, [index]: item.name }));
      }
      if (account) {
        setAccountSearchTerms(prev => ({ ...prev, [index]: `${account.code} - ${account.name}` }));
      }

      return {
        ...lineItem,
        item: lineItem.item?._id || lineItem.item,
        account: lineItem.account?._id || lineItem.account,
        taxType: lineItem.taxRate?._id || lineItem.taxRate,
      };
    });

    setFormData({
      contact: po.contact?._id || po.contact,
      issueDate: po.issueDate?.split('T')[0] || '',
      purchaseOrderNumber: po.purchaseOrderNumber || '',
      reference: po.reference || '',
      taxMode: po.amountTreatment || 'Excluding',
      lineItems: lineItemsWithSearch,
      subtotal: po.subtotal || 0,
      totalTax: po.totalTax || 0,
      grandTotal: po.grandTotal || 0,
    });

    setSelectedStatus(po.status || 'Draft');
    setView('form');
  };

  const handleBackToList = () => {
    setView('list');
    setEditingPO(null);
    setMessage({ type: '', text: '' });
  };

  const handleApproveClick = () => {
    const validLineItems = formData.lineItems.filter(item => item.item && item.item !== '');

    if (validLineItems.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one line item with an item selected before approving' });
      return;
    }

    const purchaseOrderPayload = {
      ...formData,
      lineItems: validLineItems,
      status: selectedStatus,
    };

    setIsApproving(true);

    setTimeout(() => {
      navigate('/purchase/bills', {
        state: {
          fromPurchaseOrder: true,
          purchaseOrderId: editingPO?._id || null,
          purchaseOrder: purchaseOrderPayload,
        },
      });
    }, 1000);
  };

  const handleDeletePO = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await purchaseOrderAPI.delete(id);
        setMessage({ type: 'success', text: 'Purchase order deleted successfully!' });
        fetchPurchaseOrders();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        console.error('Error deleting purchase order:', error);
        setMessage({ type: 'error', text: 'Failed to delete purchase order' });
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await purchaseOrderAPI.update(id, { status: newStatus });

      if (newStatus === 'Approved') {
        setMessage({ type: 'success', text: 'Purchase order approved and converted to bill!' });
      } else {
        setMessage({ type: 'success', text: 'Status updated successfully!' });
      }

      fetchPurchaseOrders();
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  // Line item functions
  const handleAddLine = () => {
    setFormData({
      ...formData,
      lineItems: [
        ...formData.lineItems,
        { item: '', description: '', qty: 1, price: 0, discount: 0, account: '', taxType: '', taxAmount: 0, amount: 0 },
      ],
    });
  };

  const handleRemoveLine = (index) => {
    const newLineItems = formData.lineItems.filter((_, i) => i !== index);
    setFormData({ ...formData, lineItems: newLineItems });
    calculateTotals(newLineItems);
  };

  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index][field] = value;

    // If item selected, auto-fill fields from item data (use purchase fields)
    if (field === 'item' && value) {
      const selectedItem = items.find(item => item._id === value);
      if (selectedItem) {
        newLineItems[index].description = selectedItem.description || '';
        newLineItems[index].price = selectedItem.costPrice || 0;
        newLineItems[index].account = selectedItem.purchaseAccount?._id || selectedItem.purchaseAccount || '';
        newLineItems[index].taxType = selectedItem.taxRateOnPurchase?._id || selectedItem.taxRateOnPurchase || '';
      }
    }

    // Recalculate line amount and tax
    const qty = parseFloat(newLineItems[index].qty) || 0;
    const price = parseFloat(newLineItems[index].price) || 0;
    const discountPercent = parseFloat(newLineItems[index].discount) || 0;

    const taxType = taxTypes.find(t => t._id === newLineItems[index].taxType);
    const taxRate = taxType ? parseFloat(taxType.taxPercentage) / 100 : 0;

    // Calculate line item amount (qty * price - discount%)
    const lineSubtotal = qty * price;
    const discountAmount = lineSubtotal * (discountPercent / 100);
    const lineAmount = lineSubtotal - discountAmount; // Amount BEFORE tax

    // Calculate tax amount (tax is NOT included in line item amount)
    const taxAmount = lineAmount * taxRate;

    newLineItems[index].taxAmount = taxAmount;
    newLineItems[index].amount = lineAmount; // This is the amount WITHOUT tax

    setFormData({ ...formData, lineItems: newLineItems });
    calculateTotals(newLineItems);
  };

  const calculateTotals = (lineItems) => {
    // Calculate subtotal - sum of all line item amounts (after discount, before tax)
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);

    // Calculate total tax
    const totalTax = lineItems.reduce((sum, item) => sum + (parseFloat(item.taxAmount) || 0), 0);

    let grandTotal;
    let adjustedSubtotal = subtotal;

    if (formData.taxMode === 'Excluding') {
      // Tax is excluded - add tax to subtotal
      grandTotal = subtotal + totalTax;
      adjustedSubtotal = subtotal;
    } else if (formData.taxMode === 'Including') {
      // Tax is included - re-adjust subtotal
      grandTotal = subtotal;
      adjustedSubtotal = subtotal - totalTax;
    } else {
      // No tax
      grandTotal = subtotal;
      adjustedSubtotal = subtotal;
    }

    setFormData(prev => ({
      ...prev,
      subtotal: adjustedSubtotal,
      totalTax,
      grandTotal,
    }));
  };

  // Contact search functionality
  const handleContactSearch = (searchTerm) => {
    console.log('🔍 [PO] handleContactSearch called with:', searchTerm);
    console.log('📊 [PO] Total contacts available:', contacts.length);
    setContactSearchTerm(searchTerm);

    if (searchTerm.trim()) {
      const results = contacts.filter(contact =>
        contact.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('✅ [PO] Filtered results:', results.length);
      setContactSearchResults(results);
    } else {
      // Show all contacts when search is empty
      console.log('📋 [PO] Showing all contacts:', contacts.length);
      setContactSearchResults(contacts);
    }
    console.log('👁️ [PO] Setting dropdown to visible');
    setShowContactDropdown(true);
  };

  const handleSelectContact = (contact) => {
    setFormData({ ...formData, contact: contact._id });
    setContactSearchTerm(contact.contactName);
    setShowContactDropdown(false);
  };

  // Item search functionality
  const handleItemSearch = (index, searchTerm) => {
    setItemSearchTerms({ ...itemSearchTerms, [index]: searchTerm });

    if (searchTerm.trim()) {
      const results = items.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setItemSearchResults({ ...itemSearchResults, [index]: results });
      setShowItemDropdown({ ...showItemDropdown, [index]: true });
    } else {
      setShowItemDropdown({ ...showItemDropdown, [index]: false });
    }
  };

  const handleSelectItem = (index, item) => {
    handleLineItemChange(index, 'item', item._id);
    setItemSearchTerms({ ...itemSearchTerms, [index]: item.name });
    setShowItemDropdown({ ...showItemDropdown, [index]: false });
  };

  // Account search functionality
  const handleAccountSearch = (index, searchTerm) => {
    setAccountSearchTerms({ ...accountSearchTerms, [index]: searchTerm });

    if (searchTerm.trim()) {
      const results = accounts.filter(account =>
        account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setAccountSearchResults({ ...accountSearchResults, [index]: results });
      setShowAccountDropdown({ ...showAccountDropdown, [index]: true });
    } else {
      setShowAccountDropdown({ ...showAccountDropdown, [index]: false });
    }
  };

  const handleSelectAccount = (index, account) => {
    handleLineItemChange(index, 'account', account._id);
    setAccountSearchTerms({ ...accountSearchTerms, [index]: `${account.code} - ${account.name}` });
    setShowAccountDropdown({ ...showAccountDropdown, [index]: false });
  };

  // Form submission
  const handleSubmit = async (status) => {
    try {
      // Filter out empty line items (where item is not selected)
      const validLineItems = formData.lineItems.filter(item => item.item && item.item !== '');

      if (validLineItems.length === 0) {
        setMessage({ type: 'error', text: 'Please add at least one line item with an item selected' });
        return;
      }

      const poData = {
        ...formData,
        amountTreatment: formData.taxMode, // Backend uses amountTreatment instead of taxMode
        lineItems: validLineItems.map(item => ({
          ...item,
          taxRate: item.taxType, // Backend uses taxRate instead of taxType
          taxType: undefined, // Remove taxType
          account: item.account || undefined, // Convert empty string to undefined
        })),
        status,
      };

      // Remove frontend-only fields
      delete poData.taxMode;

      if (editingPO) {
        await purchaseOrderAPI.update(editingPO._id, poData);
        setMessage({ type: 'success', text: 'Purchase order updated successfully!' });
      } else {
        await purchaseOrderAPI.create(poData);
        setMessage({ type: 'success', text: 'Purchase order created successfully!' });
      }

      setTimeout(() => {
        setView('list');
        setEditingPO(null);
        setMessage({ type: '', text: '' });
        fetchPurchaseOrders();
      }, 1500);
    } catch (error) {
      console.error('Error saving purchase order:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save purchase order' });
    }
  };

  // Modal success callbacks
  const handleContactSuccess = (newContact) => {
    setMessage({ type: 'success', text: 'Contact created successfully!' });
    fetchContacts();
    setFormData({ ...formData, contact: newContact._id });
  };

  const handleItemSuccess = () => {
    setMessage({ type: 'success', text: 'Item created successfully!' });
    fetchItems();
  };

  const handleAccountSuccess = () => {
    setMessage({ type: 'success', text: 'Account created successfully!' });
    fetchAccounts();
  };

  // Render list view
  if (view === 'list') {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Purchase Orders</h1>
            <p className="text-secondary-600 mt-1">Manage purchase orders to vendors</p>
          </div>
          <button
            onClick={handleNewPO}
            className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">New Purchase Order</span>
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Purchase Orders List */}
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">PO #</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Vendor</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Date</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Amount</th>
                <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <FileText className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                    <p className="text-secondary-500">No purchase orders found</p>
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po._id} className="hover:bg-secondary-50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-secondary-900">{po.purchaseOrderNumber}</span>
                      {po.status === 'Approved' && po.convertedToBill && (
                        <div className="text-xs text-green-600 mt-1">Converted to Bill</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-secondary-900">{po.contact?.contactName}</div>
                        {po.contact?.email && (
                          <div className="text-sm text-secondary-600">{po.contact.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2 text-sm text-secondary-700">
                        <Calendar className="w-4 h-4 text-secondary-400" />
                        <span>{formatDate(po.issueDate)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-secondary-900">{formatCurrency(po.grandTotal)}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(po.status)}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditPO(po)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeletePO(po._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Render form view
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            {editingPO ? 'Edit Purchase Order' : 'New Purchase Order'}
          </h1>
          <p className="text-secondary-600 mt-1">
            {editingPO ? 'Update purchase order details' : 'Create a new purchase order'}
          </p>
        </div>
        {(!editingPO || editingPO.status !== 'Approved') && (
          <button
            type="button"
            onClick={handleApproveClick}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-sm"
          >
            Approve
          </button>
        )}
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-soft p-8">
        {/* PO Details */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Purchase Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Contact */}
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Vendor <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={contactSearchTerm || contacts.find(c => c._id === formData.contact)?.contactName || ''}
                  onChange={(e) => handleContactSearch(e.target.value)}
                  onFocus={() => handleContactSearch(contactSearchTerm || '')}
                  placeholder="Search vendor..."
                  required
                  className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-secondary-900"
                />
                {showContactDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {contactSearchResults.length > 0 ? (
                      contactSearchResults.map((contact) => (
                        <button
                          key={contact._id}
                          type="button"
                          onClick={() => handleSelectContact(contact)}
                          className="w-full text-left px-4 py-2.5 hover:bg-secondary-50 text-sm border-b border-secondary-100 last:border-b-0"
                        >
                          <div className="font-medium text-secondary-900">{contact.contactName}</div>
                          {contact.email && <div className="text-xs text-secondary-600">{contact.email}</div>}
                        </button>
                      ))
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setShowContactModal(true);
                          setShowContactDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-sm flex items-center space-x-2 text-indigo-600 font-semibold"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add "{contactSearchTerm}"</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Issue Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-secondary-900"
              />
            </div>

            {/* Tax Mode */}
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Tax Mode <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.taxMode}
                onChange={(e) => {
                  setFormData({ ...formData, taxMode: e.target.value });
                  calculateTotals(formData.lineItems);
                }}
                required
                className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-secondary-900"
              >
                <option value="Excluding">Tax Excluding</option>
                <option value="Including">Tax Including</option>
                <option value="No Tax">No Tax</option>
              </select>
            </div>

            {/* Reference */}
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Reference
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Optional reference"
                className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-secondary-900"
              />
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Line Items</h2>
          <div className="pb-12">
            <table className="w-full relative z-10">
              <thead>
                <tr className="border-b border-secondary-200 bg-secondary-50">
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Item</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Description</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Qty</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Price</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Discount (%)</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Account</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Tax Type</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Tax Amount</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Amount</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="px-3 py-1.5 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg font-semibold flex items-center space-x-1 transition-all text-xs"
                      title="Add new line"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Line</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.lineItems.map((line, index) => (
                  <tr key={index} className="border-b border-secondary-100">
                    {/* Item */}
                    <td className="py-2 px-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={itemSearchTerms[index] || items.find(i => i._id === line.item)?.name || ''}
                          onChange={(e) => handleItemSearch(index, e.target.value)}
                          onFocus={() => handleItemSearch(index, itemSearchTerms[index] || '')}
                          placeholder="Search item..."
                          className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        {showItemDropdown[index] && (
                          <div className="absolute z-[100] w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {itemSearchResults[index]?.length > 0 ? (
                              itemSearchResults[index].map((item) => (
                                <button
                                  key={item._id}
                                  type="button"
                                  onClick={() => handleSelectItem(index, item)}
                                  className="w-full text-left px-3 py-2 hover:bg-secondary-50 text-sm border-b border-secondary-100 last:border-b-0"
                                >
                                  <div className="font-medium text-secondary-900">{item.name}</div>
                                  <div className="text-xs text-secondary-600">{item.itemCode}</div>
                                </button>
                              ))
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowItemModal(true);
                                  setShowItemDropdown({ ...showItemDropdown, [index]: false });
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm flex items-center space-x-2 text-indigo-600 font-semibold"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Add "{itemSearchTerms[index]}"</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                        placeholder="Description"
                        className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </td>

                    {/* Qty */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={line.qty}
                        onChange={(e) => handleLineItemChange(index, 'qty', e.target.value)}
                        required
                        className="w-20 px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </td>

                    {/* Price */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.price}
                        onChange={(e) => handleLineItemChange(index, 'price', e.target.value)}
                        required
                        className="w-24 px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </td>

                    {/* Discount */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.discount}
                        onChange={(e) => handleLineItemChange(index, 'discount', e.target.value)}
                        className="w-24 px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </td>

                    {/* Account */}
                    <td className="py-2 px-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={accountSearchTerms[index] || accounts.find(a => a._id === line.account)?.name || ''}
                          onChange={(e) => handleAccountSearch(index, e.target.value)}
                          onFocus={() => handleAccountSearch(index, accountSearchTerms[index] || '')}
                          placeholder="Search account..."
                          className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        {showAccountDropdown[index] && (
                          <div className="absolute z-[100] w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {accountSearchResults[index]?.length > 0 ? (
                              accountSearchResults[index].map((account) => (
                                <button
                                  key={account._id}
                                  type="button"
                                  onClick={() => handleSelectAccount(index, account)}
                                  className="w-full text-left px-3 py-2 hover:bg-secondary-50 text-sm border-b border-secondary-100 last:border-b-0"
                                >
                                  <div className="font-medium text-secondary-900">{account.code} - {account.name}</div>
                                </button>
                              ))
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAccountModal(true);
                                  setShowAccountDropdown({ ...showAccountDropdown, [index]: false });
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm flex items-center space-x-2 text-indigo-600 font-semibold"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Add "{accountSearchTerms[index]}"</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Tax Type */}
                    <td className="py-2 px-3">
                      <select
                        value={line.taxType}
                        onChange={(e) => handleLineItemChange(index, 'taxType', e.target.value)}
                        className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="">No tax</option>
                        {taxTypes.map((tax) => (
                          <option key={tax._id} value={tax._id}>
                            {tax.name} ({tax.taxPercentage}%)
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Tax Amount */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={formatCurrency(line.taxAmount)}
                        readOnly
                        className="w-24 px-3 py-2 bg-secondary-100 border border-secondary-200 rounded-lg text-sm text-secondary-700 cursor-not-allowed"
                      />
                    </td>

                    {/* Amount */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={formatCurrency(line.amount)}
                        readOnly
                        className="w-28 px-3 py-2 bg-secondary-100 border border-secondary-200 rounded-lg text-sm font-semibold text-secondary-900 cursor-not-allowed"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={handleAddLine}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Add line below"
                          tabIndex={0}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(index)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete line"
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
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-6">
          <div className="w-full md:w-96 bg-secondary-50 rounded-lg p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-secondary-700">Subtotal:</span>
              <span className="text-lg font-bold text-secondary-900">{formatCurrency(formData.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-secondary-700">Tax:</span>
              <span className="text-lg font-bold text-secondary-900">{formatCurrency(formData.totalTax)}</span>
            </div>
            <div className="border-t border-secondary-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-secondary-900">Grand Total:</span>
                <span className="text-2xl font-bold text-indigo-600">{formatCurrency(formData.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-secondary-200">
          <button
            type="button"
            onClick={handleBackToList}
            className="px-4 py-2 bg-white text-secondary-700 font-semibold rounded-lg border border-secondary-300 hover:bg-secondary-50 transition-colors text-sm"
          >
            Cancel
          </button>
          {editingPO && (editingPO.status === 'Approved' || selectedStatus === 'Approved') ? (
            <select
              value="Approved"
              disabled
              className="px-3 py-2 bg-secondary-100 border border-secondary-200 rounded-lg text-sm font-semibold text-secondary-700 cursor-not-allowed"
            >
              <option value="Approved">Approved</option>
            </select>
          ) : (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-secondary-900"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
            </select>
          )}
          <button
            type="button"
            onClick={() => handleSubmit(selectedStatus)}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-sm"
          >
            Save Purchase Order
          </button>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactFormModal
        show={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSuccess={handleContactSuccess}
        defaultType="vendor"
      />

      {/* Item Modal */}
      <ItemFormModal
        show={showItemModal}
        onClose={() => setShowItemModal(false)}
        onSuccess={handleItemSuccess}
      />

      {/* Account Modal */}
      <AccountFormModal
        show={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onSuccess={handleAccountSuccess}
      />

      {isApproving && (
        <div className="fixed inset-0 z-[999] bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg px-6 py-4 flex items-center space-x-3">
            <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-sm font-semibold text-secondary-900">Moving purchase order to Bill...</p>
              <p className="text-xs text-secondary-600">Please wait a moment.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrder;
