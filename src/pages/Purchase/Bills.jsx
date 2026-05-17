// Bills.jsx - Purchase Bills/Expenses (Vendor bills)
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Edit,
  Calendar,
  FileText
} from 'lucide-react';
import {
  billAPI,
  contactAPI,
  itemAPI,
  chartOfAccountsAPI,
  taxTypeAPI,
  bankAccountAPI,
  purchaseOrderAPI,
} from '../../services/api';
import ContactFormModal from '../../components/Forms/ContactFormModal';
import ItemFormModal from '../../components/Forms/ItemFormModal';
import AccountFormModal from '../../components/Forms/AccountFormModal';
import PaymentModal from '../../components/Forms/PaymentModal';

const Bills = () => {
  const location = useLocation();
  const fromPurchaseOrderState = location.state && location.state.fromPurchaseOrder ? location.state : null;
  const openBillForm = location.state && location.state.openBillForm;
  // View state
  const [view, setView] = useState(fromPurchaseOrderState || openBillForm ? 'form' : 'list'); // 'list' or 'form'
  const [editingBill, setEditingBill] = useState(null);

  // List view state
  const [bills, setBills] = useState([]);

  // Form view state
  const [contacts, setContacts] = useState([]);
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [taxTypes, setTaxTypes] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sourcePurchaseOrderId] = useState(fromPurchaseOrderState?.purchaseOrderId || null);
  const [initializedFromPurchaseOrder, setInitializedFromPurchaseOrder] = useState(false);

  // Modal states
  const [showContactModal, setShowContactModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Bill form data
  const [formData, setFormData] = useState({
    contact: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    billNumber: '',
    reference: '',
    taxMode: 'Excluding', // Including, Excluding, No Tax
    onlinePayment: '', // Single bank account (backward compatibility)
    useSplitPayment: false, // Toggle for split payment
    paymentAccounts: [{ bankAccount: '', amount: 0 }], // Split payment accounts
    lineItems: [{ item: '', description: '', qty: 1, price: 0, discount: 0, account: '', taxType: '', taxAmount: 0, amount: 0 }],
    subtotal: 0,
    totalTax: 0,
    grandTotal: 0,
  });

  const [selectedStatus, setSelectedStatus] = useState('Draft');

  // If editing an overdue bill: keep Overdue while due date is past; auto-reenable Payment Pending when due date moves to today/future
  useEffect(() => {
    if (!editingBill || editingBill.status !== 'Overdue' || !formData.dueDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(formData.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate >= today) {
      setSelectedStatus('Payment Pending');
    } else if (selectedStatus !== 'Overdue') {
      setSelectedStatus('Overdue');
    }
  }, [editingBill, formData.dueDate, selectedStatus]);

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
    fetchBills();
    fetchContacts();
    fetchItems();
    fetchAccounts();
    fetchTaxTypes();
    fetchBankAccounts();
  }, []);

  // If navigated from a purchase order, initialize the bill form with PO data once
  useEffect(() => {
    if (!fromPurchaseOrderState || initializedFromPurchaseOrder || editingBill) return;

    const purchaseOrder = fromPurchaseOrderState.purchaseOrder;
    if (!purchaseOrder) return;

    setFormData(prev => {
      const poTaxMode = purchaseOrder.taxMode || purchaseOrder.amountTreatment || prev.taxMode;
      const mappedLineItems = (purchaseOrder.lineItems || prev.lineItems || []).map((item) => ({
        item: item.item || '',
        description: item.description || '',
        qty: item.qty || 1,
        price: item.price || 0,
        discount: item.discount || 0,
        account: item.account || '',
        taxType: item.taxType || item.taxRate || '',
        taxAmount: item.taxAmount || 0,
        amount: item.amount || 0,
      }));

      return {
        ...prev,
        contact: purchaseOrder.contact || prev.contact,
        issueDate: purchaseOrder.issueDate?.split('T')[0] || prev.issueDate,
        dueDate: '',
        billNumber: '',
        reference: purchaseOrder.reference || prev.reference,
        taxMode: poTaxMode,
        lineItems: mappedLineItems.length > 0 ? mappedLineItems : prev.lineItems,
        subtotal: purchaseOrder.subtotal || prev.subtotal,
        totalTax: purchaseOrder.totalTax || prev.totalTax,
        grandTotal: purchaseOrder.grandTotal || prev.grandTotal,
      };
    });

    setSelectedStatus('Draft');
    setInitializedFromPurchaseOrder(true);
  }, [fromPurchaseOrderState, initializedFromPurchaseOrder, editingBill]);

  const fetchBills = async () => {
    try {
      const response = await billAPI.getAll();
      setBills(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
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
      setTaxTypes(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching tax types:', error);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await bankAccountAPI.getAll();
      setBankAccounts(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
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
      'Payment Pending': 'bg-blue-100 text-blue-800',
      Paid: 'bg-green-100 text-green-800',
      Overdue: 'bg-red-100 text-red-800',
      Cancelled: 'bg-gray-100 text-gray-800',
    };
    return statusClasses[status] || 'bg-secondary-100 text-secondary-800';
  };

  // Navigation functions
  const handleNewBill = () => {
    setEditingBill(null);
    setFormData({
      contact: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      billNumber: '',
      reference: '',
      taxMode: 'Excluding',
      onlinePayment: '',
      useSplitPayment: false,
      paymentAccounts: [{ bankAccount: '', amount: 0 }],
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

  const handleEditBill = (bill) => {
    setEditingBill(bill);

    const contact = contacts.find(c => c._id === bill.contact?._id || bill.contact);
    setContactSearchTerm(contact?.contactName || '');

    const lineItemsWithSearch = bill.lineItems.map((lineItem, index) => {
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

    // Check if split payment is being used
    const hasSplitPayment = bill.paymentAccounts && bill.paymentAccounts.length > 0;
    setFormData({
      contact: bill.contact?._id || bill.contact,
      issueDate: bill.issueDate?.split('T')[0] || '',
      dueDate: bill.dueDate?.split('T')[0] || '',
      billNumber: bill.billNumber || '',
      reference: bill.reference || '',
      taxMode: bill.amountTreatment || 'Excluding',
      onlinePayment: bill.onlinePayment?._id || '',
      useSplitPayment: hasSplitPayment,
      paymentAccounts: hasSplitPayment
        ? bill.paymentAccounts.map(p => ({
            bankAccount: p.bankAccount?._id || p.bankAccount || '',
            amount: p.amount || 0
          }))
        : [{ bankAccount: '', amount: 0 }],
      lineItems: lineItemsWithSearch,
      subtotal: bill.subtotal || 0,
      totalTax: bill.totalTax || 0,
      grandTotal: bill.grandTotal || 0,
    });

    setSelectedStatus(bill.status || 'Draft');
    setView('form');
  };

  const handleBackToList = () => {
    setView('list');
    setEditingBill(null);
    setMessage({ type: '', text: '' });
  };

  const handleDeleteBill = async (id) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await billAPI.delete(id);
        setMessage({ type: 'success', text: 'Bill deleted successfully!' });
        fetchBills();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        console.error('Error deleting bill:', error);
        setMessage({ type: 'error', text: 'Failed to delete bill' });
      }
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
        // Only auto-assign tax type when overall tax mode is not "No Tax"
        newLineItems[index].taxType = formData.taxMode === 'No Tax'
          ? ''
          : (selectedItem.taxRateOnPurchase?._id || selectedItem.taxRateOnPurchase || '');
      }
    }

    // Recalculate line amount and tax
    const qty = parseFloat(newLineItems[index].qty) || 0;
    const price = parseFloat(newLineItems[index].price) || 0;
    const discountPercent = parseFloat(newLineItems[index].discount) || 0;

    // Determine tax rate based on selected tax type and overall tax mode
    let taxRate = 0;
    if (formData.taxMode !== 'No Tax') {
      const taxType = taxTypes.find(t => t._id === newLineItems[index].taxType);
      taxRate = taxType ? parseFloat(taxType.taxPercentage) / 100 : 0;
    }

    const lineSubtotal = qty * price;
    const discountAmount = lineSubtotal * (discountPercent / 100);

    if (formData.taxMode === 'Including' && taxRate > 0) {
      // Price is tax-inclusive: adjust so tax is inside the entered amount
      const grossAmount = lineSubtotal - discountAmount; // amount the user sees (incl. tax)
      const baseAmount = grossAmount / (1 + taxRate); // amount without tax
      const taxAmount = grossAmount - baseAmount;

      newLineItems[index].amount = baseAmount;
      newLineItems[index].taxAmount = taxAmount;
    } else {
      // Tax excluded or no tax: price is before tax
      const lineAmount = lineSubtotal - discountAmount;
      const taxAmount = formData.taxMode === 'No Tax' ? 0 : lineAmount * taxRate;

      newLineItems[index].amount = lineAmount;
      newLineItems[index].taxAmount = taxAmount;
    }

    setFormData({ ...formData, lineItems: newLineItems });
    calculateTotals(newLineItems);
  };

  const calculateTotals = (lineItems, taxModeOverride) => {
    const taxMode = taxModeOverride || formData.taxMode;

    // Subtotal is always the sum of amounts WITHOUT tax
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);

    // Total tax is the sum of all line tax amounts
    const totalTax = lineItems.reduce((sum, item) => sum + (parseFloat(item.taxAmount) || 0), 0);

    let grandTotal;

    if (taxMode === 'No Tax') {
      // No tax at all
      grandTotal = subtotal;
    } else {
      // For both Excluding and Including, total = net + tax.
      grandTotal = subtotal + totalTax;
    }

    setFormData(prev => ({
      ...prev,
      subtotal,
      totalTax,
      grandTotal,
    }));
  };

  // Contact search functionality
  const handleContactSearch = (searchTerm) => {
    console.log('🔍 [BILLS] handleContactSearch called with:', searchTerm);
    console.log('📊 [BILLS] Total contacts available:', contacts.length);
    setContactSearchTerm(searchTerm);

    if (searchTerm.trim()) {
      const results = contacts.filter(contact =>
        contact.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('✅ [BILLS] Filtered results:', results.length);
      setContactSearchResults(results);
    } else {
      // Show all contacts when search is empty
      console.log('📋 [BILLS] Showing all contacts:', contacts.length);
      setContactSearchResults(contacts);
    }
    console.log('👁️ [BILLS] Setting dropdown to visible');
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

    const safeItems = Array.isArray(items) ? items : [];
    const term = searchTerm.trim().toLowerCase();

    const results = term
      ? safeItems.filter(item =>
          item.name?.toLowerCase().includes(term) ||
          item.itemCode?.toLowerCase().includes(term)
        )
      : safeItems;

    setItemSearchResults({ ...itemSearchResults, [index]: results });
    setShowItemDropdown({ ...showItemDropdown, [index]: true });
  };

  const handleSelectItem = (index, item) => {
    handleLineItemChange(index, 'item', item._id);
    setItemSearchTerms({ ...itemSearchTerms, [index]: item.name });
    setShowItemDropdown({ ...showItemDropdown, [index]: false });
  };

  // Account search functionality
  const handleAccountSearch = (index, searchTerm) => {
    setAccountSearchTerms({ ...accountSearchTerms, [index]: searchTerm });

    const safeAccounts = Array.isArray(accounts) ? accounts : [];
    const term = searchTerm.trim().toLowerCase();

    const results = term
      ? safeAccounts.filter(account =>
          account.name?.toLowerCase().includes(term) ||
          account.code?.toLowerCase().includes(term)
        )
      : safeAccounts;

    setAccountSearchResults({ ...accountSearchResults, [index]: results });
    setShowAccountDropdown({ ...showAccountDropdown, [index]: true });
  };

  const handleSelectAccount = (index, account) => {
    handleLineItemChange(index, 'account', account._id);
    setAccountSearchTerms({ ...accountSearchTerms, [index]: `${account.code} - ${account.name}` });
    setShowAccountDropdown({ ...showAccountDropdown, [index]: false });
  };

  // Form submission
  const handleSubmit = async (status) => {
    // If status is "Paid", open payment modal to collect allocation
    if (status === 'Paid') {
      setShowPaymentModal(true);
      return;
    }

    try {
      // Filter out empty line items (where item is not selected)
      const validLineItems = formData.lineItems.filter(item => item.item && item.item !== '');

      if (validLineItems.length === 0) {
        setMessage({ type: 'error', text: 'Please add at least one line item with an item selected' });
        return;
      }

      const billData = {
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
      delete billData.taxMode;
      delete billData.useSplitPayment;
      delete billData.paymentAccounts;
      delete billData.onlinePayment;

      if (editingBill) {
        await billAPI.update(editingBill._id, billData);
        setMessage({ type: 'success', text: 'Bill updated successfully!' });
      } else {
        await billAPI.create(billData);
        setMessage({ type: 'success', text: 'Bill created successfully!' });

        if (sourcePurchaseOrderId) {
          try {
            await purchaseOrderAPI.delete(sourcePurchaseOrderId);
          } catch (err) {
            console.error('Failed to delete purchase order after creating bill:', err);
          }
        }
      }

      setTimeout(() => {
        setView('list');
        setEditingBill(null);
        setMessage({ type: '', text: '' });
        fetchBills();
      }, 1500);
    } catch (error) {
      console.error('Error saving bill:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save bill' });
    }
  };

  // Handle payment submission from modal
  const handlePaymentSubmit = async (paymentAccounts) => {
    try {
      const validLineItems = formData.lineItems.filter(item => item.item && item.item !== '');

      const billData = {
        ...formData,
        amountTreatment: formData.taxMode,
        lineItems: validLineItems.map(item => ({
          ...item,
          taxRate: item.taxType,
          taxType: undefined,
          account: item.account || undefined,
        })),
        status: 'Paid',
        paymentAccounts,
      };

      delete billData.taxMode;
      delete billData.useSplitPayment;
      delete billData.onlinePayment;

      if (editingBill) {
        await billAPI.update(editingBill._id, billData);
        setMessage({ type: 'success', text: 'Payment recorded and bill marked as paid!' });
      } else {
        await billAPI.create(billData);
        setMessage({ type: 'success', text: 'Bill created and marked as paid!' });

        if (sourcePurchaseOrderId) {
          try {
            await purchaseOrderAPI.delete(sourcePurchaseOrderId);
          } catch (err) {
            console.error('Failed to delete purchase order after creating paid bill:', err);
          }
        }
      }

      setShowPaymentModal(false);

      setTimeout(() => {
        setView('list');
        setEditingBill(null);
        setMessage({ type: '', text: '' });
        fetchBills();
      }, 1500);
    } catch (error) {
      console.error('Error saving bill with payment:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save bill' });
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
            <h1 className="text-3xl font-bold text-secondary-900">Bills</h1>
            <p className="text-secondary-600 mt-1">Manage vendor bills and expenses</p>
          </div>
          <button
            onClick={handleNewBill}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">New Bill</span>
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Bills List */}
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Bill #</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Vendor</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Bill Date</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Due Date</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Amount</th>
                <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <FileText className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                    <p className="text-secondary-500">No bills found</p>
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-secondary-50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-secondary-900">{bill.billNumber}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-secondary-900">{bill.contact?.contactName}</div>
                        {bill.contact?.email && (
                          <div className="text-sm text-secondary-600">{bill.contact.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2 text-sm text-secondary-700">
                        <Calendar className="w-4 h-4 text-secondary-400" />
                        <span>{formatDate(bill.issueDate)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2 text-sm text-secondary-700">
                        <Calendar className="w-4 h-4 text-secondary-400" />
                        <span>{formatDate(bill.dueDate)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-secondary-900">{formatCurrency(bill.grandTotal)}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(bill.status)}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditBill(bill)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBill(bill._id)}
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
            {editingBill ? 'Edit Bill' : 'New Bill'}
          </h1>
          <p className="text-secondary-600 mt-1">
            {editingBill ? 'Update bill details' : 'Create a new vendor bill'}
          </p>
        </div>
        {selectedStatus !== 'Paid' && editingBill?.status !== 'Paid' && (
          <button
            type="button"
            onClick={() => {
              setSelectedStatus('Paid');
              handleSubmit('Paid');
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-sm"
          >
            Mark as Paid
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
        {/* Bill Details */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Bill Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-secondary-900"
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
                        className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm flex items-center space-x-2 text-red-600 font-semibold"
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
                className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-secondary-900"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Due Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-secondary-900"
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
                  const newTaxMode = e.target.value;

                  const updatedLineItems = formData.lineItems.map((line) => {
                    const qty = parseFloat(line.qty) || 0;
                    const price = parseFloat(line.price) || 0;
                    const discountPercent = parseFloat(line.discount) || 0;

                    let taxRate = 0;
                    if (newTaxMode !== 'No Tax') {
                      const taxType = taxTypes.find(t => t._id === line.taxType);
                      taxRate = taxType ? parseFloat(taxType.taxPercentage) / 100 : 0;
                    }

                    const lineSubtotal = qty * price;
                    const discountAmount = lineSubtotal * (discountPercent / 100);

                    if (newTaxMode === 'Including' && taxRate > 0) {
                      const grossAmount = lineSubtotal - discountAmount;
                      const baseAmount = grossAmount / (1 + taxRate);
                      const taxAmount = grossAmount - baseAmount;

                      return {
                        ...line,
                        taxType: newTaxMode === 'No Tax' ? '' : line.taxType,
                        amount: baseAmount,
                        taxAmount,
                      };
                    } else {
                      const lineAmount = lineSubtotal - discountAmount;
                      const taxAmount = newTaxMode === 'No Tax' ? 0 : lineAmount * taxRate;

                      return {
                        ...line,
                        taxType: newTaxMode === 'No Tax' ? '' : line.taxType,
                        amount: lineAmount,
                        taxAmount,
                      };
                    }
                  });

                  setFormData(prev => ({
                    ...prev,
                    taxMode: newTaxMode,
                    lineItems: updatedLineItems,
                  }));

                  calculateTotals(updatedLineItems, newTaxMode);
                }}
                required
                className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-secondary-900"
              >
                <option value="Excluding">Tax Excluding</option>
                <option value="Including">Tax Including</option>
                <option value="No Tax">No Tax</option>
              </select>
            </div>
          </div>

          {/* Reference - Full Width */}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-secondary-700 mb-2">
              Reference
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Optional reference"
              className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-secondary-900"
            />
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
                          className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
                                className="w-full text-left px-3 py-2 hover:bg-red-50 text-sm flex items-center space-x-2 text-red-600 font-semibold"
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
                        className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
                        className="w-20 px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
                        className="w-24 px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
                        className="w-24 px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
                          className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
                                className="w-full text-left px-3 py-2 hover:bg-red-50 text-sm flex items-center space-x-2 text-red-600 font-semibold"
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
                        value={formData.taxMode === 'No Tax' ? '' : line.taxType}
                        onChange={(e) => {
                          if (formData.taxMode === 'No Tax') return;
                          handleLineItemChange(index, 'taxType', e.target.value);
                        }}
                        disabled={formData.taxMode === 'No Tax'}
                        className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                <span className="text-2xl font-bold text-red-600">{formatCurrency(formData.grandTotal)}</span>
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
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = formData.dueDate ? new Date(formData.dueDate) : null;
            if (dueDate) dueDate.setHours(0, 0, 0, 0);
            const isOverdueAndPast = editingBill?.status === 'Overdue' && dueDate && dueDate < today;

            if (isOverdueAndPast) {
              return (
                <select
                  value={selectedStatus === 'Overdue' ? 'Paid' : selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-semibold text-secondary-900"
                >
                  <option value="Paid">Paid</option>
                </select>
              );
            }

            return (
              <select
                value={selectedStatus === 'Overdue' ? 'Payment Pending' : selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-semibold text-secondary-900"
              >
                <option value="Draft">Draft</option>
                <option value="Payment Pending">Payment Pending</option>
                <option value="Paid">Paid</option>
              </select>
            );
          })()}
          <button
            type="button"
            onClick={() => handleSubmit(selectedStatus)}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-sm"
          >
            Save Bill
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

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
        }}
        invoice={{
          invoiceNumber: editingBill?.billNumber || formData.billNumber,
          grandTotal: formData.grandTotal,
        }}
        bankAccounts={bankAccounts}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  );
};

export default Bills;
