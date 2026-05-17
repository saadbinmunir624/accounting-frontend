// src/pages/Sales/SalesInvoice.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowLeft,
  Calendar,
  Filter,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  salesInvoiceAPI,
  contactAPI,
  itemAPI,
  chartOfAccountsAPI,
  taxTypeAPI,
  bankAccountAPI,
  quotationAPI,
} from '../../services/api';
import ContactFormModal from '../../components/Forms/ContactFormModal';
import ItemFormModal from '../../components/Forms/ItemFormModal';
import AccountFormModal from '../../components/Forms/AccountFormModal';
import PaymentModal from '../../components/Forms/PaymentModal';

const SalesInvoice = () => {
  const location = useLocation();
  const fromQuotationState = location.state && location.state.fromQuotation ? location.state : null;
  const openInvoiceForm = location.state && location.state.openInvoiceForm;

  // View state
  const [view, setView] = useState(fromQuotationState || openInvoiceForm ? 'form' : 'list'); // 'list' or 'form'
  const [editingInvoice, setEditingInvoice] = useState(null);

  // List view state
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form view state
  const [contacts, setContacts] = useState([]);
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [taxTypes, setTaxTypes] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modal states
  const [showContactModal, setShowContactModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Invoice form data
  const [formData, setFormData] = useState({
    contact: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    invoiceNumber: '',
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
  const [sourceQuotationId] = useState(fromQuotationState?.quotationId || null);
  const [initializedFromQuotation, setInitializedFromQuotation] = useState(false);
  // We only need the setter to track a pending status when opening
  // the payment modal; the value itself is not read.
  const [, setPendingStatus] = useState(null);

  // Search state for autocomplete
  const [itemSearchTerms, setItemSearchTerms] = useState({});
  const [itemSearchResults, setItemSearchResults] = useState({});
  const [showItemDropdown, setShowItemDropdown] = useState({});

  // If editing an overdue invoice: force Paid while due date is past; auto-reenable Sent when due date is today/future
  useEffect(() => {
    if (!editingInvoice || editingInvoice.status !== 'Overdue' || !formData.dueDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(formData.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate >= today) {
      setSelectedStatus('Sent');
    } else if (selectedStatus === 'Overdue') {
      setSelectedStatus('Paid');
    }
  }, [editingInvoice, formData.dueDate, selectedStatus]);

  // If navigated from a quotation, initialize the invoice form with quotation data once
  useEffect(() => {
    if (!fromQuotationState || initializedFromQuotation || editingInvoice) return;

    const quotation = fromQuotationState.quotation;
    if (!quotation) return;

    setFormData(prev => {
      const quoteTaxMode = quotation.taxMode || quotation.amountTreatment || prev.taxMode;
      const mappedLineItems = (quotation.lineItems || prev.lineItems || []).map((item) => ({
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
        contact: quotation.contact || prev.contact,
        issueDate: quotation.issueDate?.split('T')[0] || prev.issueDate,
        dueDate: '',
        invoiceNumber: '',
        reference: quotation.reference || prev.reference,
        taxMode: quoteTaxMode,
        lineItems: mappedLineItems.length > 0 ? mappedLineItems : prev.lineItems,
        subtotal: quotation.subtotal || prev.subtotal,
        totalTax: quotation.totalTax || prev.totalTax,
        grandTotal: quotation.grandTotal || prev.grandTotal,
      };
    });

    setSelectedStatus('Draft');
    setInitializedFromQuotation(true);
  }, [fromQuotationState, initializedFromQuotation, editingInvoice]);

  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [contactSearchResults, setContactSearchResults] = useState([]);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  const [accountSearchTerms, setAccountSearchTerms] = useState({});
  const [accountSearchResults, setAccountSearchResults] = useState({});
  const [showAccountDropdown, setShowAccountDropdown] = useState({});

  // Fetch data on mount
  useEffect(() => {
    fetchInvoices();
    fetchContacts();
    fetchItems();
    fetchAccounts();
    fetchTaxTypes();
    fetchBankAccounts();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await salesInvoiceAPI.getAll();
      setInvoices(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await contactAPI.getAll({ type: 'customer' });
      setContacts(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await itemAPI.getAll();
      setItems(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
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

  const fetchBankAccounts = async () => {
    try {
      const response = await bankAccountAPI.getAll();
      setBankAccounts(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  // Filter invoices for list view
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.contact?.contactName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge class
  const getStatusClass = (status) => {
    const classes = {
      Draft: 'bg-gray-100 text-gray-700',
      Sent: 'bg-blue-100 text-blue-700',
      Paid: 'bg-green-100 text-green-700',
      Overdue: 'bg-red-100 text-red-700',
      Cancelled: 'bg-yellow-100 text-yellow-700',
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  };

  // Switch to form view
  const handleNewInvoice = () => {
    setEditingInvoice(null);
    setSelectedStatus('Draft');
    setFormData({
      contact: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      invoiceNumber: '',
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
    setMessage({ type: '', text: '' });
    setView('form');
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setSelectedStatus(invoice.status || 'Draft');
    // Check if split payment is being used
    const hasSplitPayment = invoice.paymentAccounts && invoice.paymentAccounts.length > 0;
    setFormData({
      contact: invoice.contact?._id || '',
      issueDate: invoice.issueDate?.split('T')[0] || '',
      dueDate: invoice.dueDate?.split('T')[0] || '',
      invoiceNumber: invoice.invoiceNumber || '',
      reference: invoice.reference || '',
      taxMode: invoice.taxMode || 'Excluding',
      onlinePayment: invoice.onlinePayment?._id || '',
      useSplitPayment: hasSplitPayment,
      paymentAccounts: hasSplitPayment
        ? invoice.paymentAccounts.map(p => ({
            bankAccount: p.bankAccount?._id || p.bankAccount || '',
            amount: p.amount || 0
          }))
        : [{ bankAccount: '', amount: 0 }],
      lineItems: invoice.lineItems || [{ item: '', description: '', qty: 1, price: 0, discount: 0, account: '', taxType: '', taxAmount: 0, amount: 0 }],
      subtotal: invoice.subtotal || 0,
      totalTax: invoice.totalTax || 0,
      grandTotal: invoice.grandTotal || 0,
    });
    setMessage({ type: '', text: '' });
    setView('form');
  };

  const handleBackToList = () => {
    setView('list');
    setEditingInvoice(null);
    setMessage({ type: '', text: '' });
  };

  const handleDeleteInvoice = async (id, invoiceNumber) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoiceNumber}?`)) {
      try {
        await salesInvoiceAPI.delete(id);
        setMessage({ type: 'success', text: 'Invoice deleted successfully!' });
        fetchInvoices();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        console.error('Error deleting invoice:', error);
        setMessage({ type: 'error', text: 'Failed to delete invoice' });
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await salesInvoiceAPI.update(id, { status: newStatus });
      setMessage({ type: 'success', text: 'Status updated successfully!' });
      fetchInvoices();
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  // Calculate remaining amount for split payment
  const calculateRemainingAmount = () => {
    const totalAllocated = formData.paymentAccounts.reduce((sum, payment) => {
      return sum + (parseFloat(payment.amount) || 0);
    }, 0);
    return formData.grandTotal - totalAllocated;
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
    setFormData({
      ...formData,
      lineItems: newLineItems.length > 0 ? newLineItems : [{ item: '', description: '', qty: 1, price: 0, discount: 0, account: '', taxType: '', taxAmount: 0, amount: 0 }],
    });
    calculateTotals(newLineItems);
  };

  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index][field] = value;

    // If item selected, auto-fill fields from item data
    if (field === 'item' && value) {
      const selectedItem = items.find(item => item._id === value);
      if (selectedItem) {
        newLineItems[index].description = selectedItem.description || '';
        newLineItems[index].price = selectedItem.salePrice || 0;
        newLineItems[index].account = selectedItem.saleAccount?._id || selectedItem.saleAccount || '';
        // Only auto-assign tax type when overall tax mode is not "No Tax"
        newLineItems[index].taxType = formData.taxMode === 'No Tax'
          ? ''
          : (selectedItem.taxRateOnSale?._id || selectedItem.taxRateOnSale || '');
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
      // The difference is how each line's net and tax are computed.
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
    setContactSearchTerm(searchTerm);

    if (searchTerm.trim()) {
      const results = contacts.filter(contact =>
        contact.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setContactSearchResults(results);
    } else {
      // Show all contacts when search is empty
      setContactSearchResults(contacts);
    }
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
    // If status is "Paid", show payment modal instead
    if (status === 'Paid') {
      setPendingStatus(status);
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

      const invoiceData = {
        ...formData,
        amountTreatment: formData.taxMode,
        lineItems: validLineItems.map(item => ({
          ...item,
          taxRate: item.taxType,
          taxType: undefined,
          account: item.account || undefined,
        })),
        status,
      };

      // Remove frontend-only fields
      delete invoiceData.taxMode;
      delete invoiceData.useSplitPayment;
      delete invoiceData.paymentAccounts;
      delete invoiceData.onlinePayment;

      if (editingInvoice) {
        await salesInvoiceAPI.update(editingInvoice._id, invoiceData);
        setMessage({ type: 'success', text: 'Invoice updated successfully!' });
      } else {
        const response = await salesInvoiceAPI.create(invoiceData);
        setMessage({ type: 'success', text: 'Invoice created successfully!' });

        // If this invoice was created from a quotation, delete the quotation now
        if (sourceQuotationId) {
          try {
            await quotationAPI.delete(sourceQuotationId);
          } catch (err) {
            console.error('Failed to delete quotation after creating invoice:', err);
          }
        }
      }

      setTimeout(() => {
        handleBackToList();
        fetchInvoices();
      }, 1500);
    } catch (error) {
      console.error('Error saving invoice:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save invoice' });
    }
  };

  // Handle payment submission from modal
  const handlePaymentSubmit = async (paymentAccounts) => {
    try {
      const validLineItems = formData.lineItems.filter(item => item.item && item.item !== '');

      const invoiceData = {
        ...formData,
        amountTreatment: formData.taxMode,
        lineItems: validLineItems.map(item => ({
          ...item,
          taxRate: item.taxType,
          taxType: undefined,
          account: item.account || undefined,
        })),
        status: 'Paid',
        paymentAccounts: paymentAccounts,
      };

      // Remove frontend-only fields
      delete invoiceData.taxMode;
      delete invoiceData.useSplitPayment;
      delete invoiceData.onlinePayment;

      if (editingInvoice) {
        await salesInvoiceAPI.update(editingInvoice._id, invoiceData);
        setMessage({ type: 'success', text: 'Payment recorded and invoice marked as paid!' });
      } else {
        const response = await salesInvoiceAPI.create(invoiceData);
        setMessage({ type: 'success', text: 'Invoice created and marked as paid!' });

        // If this invoice was created from a quotation, delete the quotation now
        if (sourceQuotationId) {
          try {
            await quotationAPI.delete(sourceQuotationId);
          } catch (err) {
            console.error('Failed to delete quotation after creating paid invoice:', err);
          }
        }
      }

      setShowPaymentModal(false);
      setPendingStatus(null);

      setTimeout(() => {
        handleBackToList();
        fetchInvoices();
      }, 1500);
    } catch (error) {
      console.error('Error saving invoice with payment:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save invoice' });
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
            <h1 className="text-3xl font-bold text-secondary-900">Sales Invoices</h1>
            <p className="text-secondary-600 mt-1">Create and manage your sales invoices</p>
          </div>
          <button
            onClick={handleNewInvoice}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-6 py-3 font-semibold flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>New Invoice</span>
          </button>
        </div>

        {/* Message Alert */}
        {message.text && (
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
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search by invoice number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-secondary-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
              >
                <option value="All">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-secondary-600">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-lg font-semibold text-secondary-900 mb-2">No invoices found</p>
              <p className="text-secondary-600 mb-6">Get started by creating your first invoice</p>
              <button
                onClick={handleNewInvoice}
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-6 py-3 font-semibold inline-flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>New Invoice</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200 bg-secondary-50">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Invoice Number</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Contact</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Issue Date</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Due Date</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Amount</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-secondary-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice._id} className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-semibold text-secondary-900">{invoice.invoiceNumber}</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-secondary-700">{invoice.contact?.contactName || 'N/A'}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2 text-sm text-secondary-700">
                          <Calendar className="w-4 h-4 text-secondary-400" />
                          <span>{formatDate(invoice.issueDate)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2 text-sm text-secondary-700">
                          <Calendar className="w-4 h-4 text-secondary-400" />
                          <span>{formatDate(invoice.dueDate)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-secondary-900">{formatCurrency(invoice.grandTotal)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditInvoice(invoice)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(invoice._id, invoice.invoiceNumber)}
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
      </div>
    );
  }

  // Render form view
  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToList}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-secondary-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">
              {editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
            </h1>
            <p className="text-secondary-600 mt-1">
              {editingInvoice ? `Editing ${editingInvoice.invoiceNumber}` : 'Create a new sales invoice'}
            </p>
          </div>
        </div>
        {selectedStatus !== 'Paid' && editingInvoice?.status !== 'Paid' && (
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

      {/* Message Alert */}
      {message.text && (
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
      )}

      {/* Invoice Form */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        {/* Invoice Details Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Contact */}
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Contact <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={contactSearchTerm || contacts.find(c => c._id === formData.contact)?.contactName || ''}
                  onChange={(e) => handleContactSearch(e.target.value)}
                  onFocus={() => handleContactSearch(contactSearchTerm || '')}
                  placeholder="Search customer..."
                  required
                  className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
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
                        className="w-full text-left px-4 py-2.5 hover:bg-primary-50 text-sm flex items-center space-x-2 text-primary-600 font-semibold"
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
                className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
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
                className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
              />
            </div>

            {/* Invoice Number */}
            {editingInvoice && (
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  readOnly
                  className="w-full px-4 py-2.5 bg-secondary-100 border border-secondary-200 rounded-lg text-secondary-700 cursor-not-allowed"
                />
              </div>
            )}

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
                className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
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

                  // Recalculate all line items according to the selected tax mode
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
                        taxAmount: taxAmount,
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
                className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
              >
                <option value="Including">Tax Including</option>
                <option value="Excluding">Tax Excluding</option>
                <option value="No Tax">No Tax</option>
              </select>
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
                          className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
                                className="w-full text-left px-3 py-2 hover:bg-primary-50 text-sm flex items-center space-x-2 text-primary-600 font-semibold"
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
                        className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
                        className="w-20 px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
                        className="w-24 px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
                        className="w-24 px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
                          className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
                                className="w-full text-left px-3 py-2 hover:bg-primary-50 text-sm flex items-center space-x-2 text-primary-600 font-semibold"
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
                        className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
                          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
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
              <span className="text-sm font-semibold text-secondary-700">
                {formData.taxMode === 'Including' ? 'Tax (Included):' : formData.taxMode === 'Excluding' ? 'Tax:' : 'Tax:'}
              </span>
              <span className="text-lg font-bold text-secondary-900">{formatCurrency(formData.totalTax)}</span>
            </div>
            <div className="border-t border-secondary-300 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-secondary-900">Total:</span>
                <span className="text-2xl font-bold text-primary-600">{formatCurrency(formData.grandTotal)}</span>
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
            const isOverdueAndPast = editingInvoice?.status === 'Overdue' && dueDate && dueDate < today;

            // If overdue and still past due: allow only marking Paid (keep due date as record)
            if (isOverdueAndPast) {
              return (
                <select
                  value={selectedStatus === 'Overdue' ? 'Paid' : selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold text-secondary-900"
                >
                  <option value="Paid">Paid</option>
                </select>
              );
            }

            return (
              <select
                value={selectedStatus === 'Overdue' ? 'Sent' : selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold text-secondary-900"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
              </select>
            );
          })()}
          <button
            type="button"
            onClick={() => handleSubmit(selectedStatus)}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-sm"
          >
            Save Invoice
          </button>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactFormModal
        show={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSuccess={handleContactSuccess}
        defaultType="customer"
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

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPendingStatus(null);
        }}
        invoice={{ ...formData, invoiceNumber: editingInvoice?.invoiceNumber || 'New' }}
        bankAccounts={bankAccounts}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  );
};

export default SalesInvoice;
