import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import {
  bankAccountAPI,
  itemAPI,
  chartOfAccountsAPI,
  taxTypeAPI,
  bankTransactionAPI,
  contactAPI,
} from '../../services/api';

const TAX_MODES = ['Excluding', 'Including', 'No Tax'];

const ReceiveMoney = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');

  const [contacts, setContacts] = useState([]);
  const [personSearchTerm, setPersonSearchTerm] = useState('');
  const [personSearchResults, setPersonSearchResults] = useState([]);
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);

  const [person, setPerson] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [taxMode, setTaxMode] = useState('Excluding');

  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [taxTypes, setTaxTypes] = useState([]);

  const [itemSearchTerms, setItemSearchTerms] = useState({});
  const [itemSearchResults, setItemSearchResults] = useState({});
  const [showItemDropdown, setShowItemDropdown] = useState({});

  const [accountSearchTerms, setAccountSearchTerms] = useState({});
  const [accountSearchResults, setAccountSearchResults] = useState({});
  const [showAccountDropdown, setShowAccountDropdown] = useState({});

  const [lineItems, setLineItems] = useState([
    {
      item: null,
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      account: null,
      taxType: null,
      taxRate: 0,
      taxAmount: 0,
      lineTotal: 0,
    },
  ]);

  const [subtotal, setSubtotal] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bankRes, itemRes, accountRes, taxRes, contactRes] = await Promise.all([
          bankAccountAPI.getAll(),
          itemAPI.getAll(),
          chartOfAccountsAPI.getAll(),
          taxTypeAPI.getAll(),
          contactAPI.getAll(),
        ]);

        const bankData = bankRes.data && bankRes.data.data ? bankRes.data.data : bankRes.data;
        const itemData = itemRes.data && itemRes.data.data ? itemRes.data.data : itemRes.data;
        const accountData = accountRes.data && accountRes.data.data ? accountRes.data.data : accountRes.data;
        const taxData = taxRes.data && taxRes.data.data ? taxRes.data.data : taxRes.data;
        const contactData = contactRes.data && contactRes.data.data ? contactRes.data.data : contactRes.data;

        setBankAccounts(Array.isArray(bankData) ? bankData : []);
        setItems(Array.isArray(itemData) ? itemData : []);
        setAccounts(Array.isArray(accountData) ? accountData : []);
        setTaxTypes(Array.isArray(taxData) ? taxData : []);
        setContacts(Array.isArray(contactData) ? contactData : []);
      } catch (error) {
        console.error('Failed to load receive money data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const recalculateTotals = (updatedLineItems, mode) => {
    let newSubtotal = 0;
    let newTotalTax = 0;

    const recalculated = updatedLineItems.map((line) => {
      const quantity = Number(line.quantity) || 0;
      const price = Number(line.unitPrice) || 0;
      const discount = Number(line.discount) || 0;
      const taxRate = Number(line.taxRate) || 0;

      if (quantity <= 0) {
        return { ...line, taxAmount: 0, lineTotal: 0 };
      }

      const grossBeforeDiscount = quantity * price;
      const discountAmount = Math.min(discount, grossBeforeDiscount);

      if (mode === 'No Tax') {
        const net = grossBeforeDiscount - discountAmount;
        newSubtotal += net;
        return { ...line, taxAmount: 0, lineTotal: net };
      }

      if (mode === 'Excluding') {
        const net = grossBeforeDiscount - discountAmount;
        const taxAmount = (net * taxRate) / 100;
        const total = net + taxAmount;
        newSubtotal += net;
        newTotalTax += taxAmount;
        return { ...line, taxAmount, lineTotal: total };
      }

      // Tax Including
      const gross = grossBeforeDiscount - discountAmount;
      const divisor = 1 + taxRate / 100;
      const net = taxRate > 0 ? gross / divisor : gross;
      const taxAmount = gross - net;
      newSubtotal += net;
      newTotalTax += taxAmount;
      return { ...line, taxAmount, lineTotal: gross };
    });

    setLineItems(recalculated);
    setSubtotal(newSubtotal);
    setTotalTax(newTotalTax);
    setGrandTotal(newSubtotal + newTotalTax);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const handlePersonSearch = (searchTerm) => {
    setPerson(searchTerm);
    setPersonSearchTerm(searchTerm);

    const safeContacts = Array.isArray(contacts) ? contacts : [];
    const results = searchTerm.trim()
      ? safeContacts.filter((contact) =>
          (contact.contactName || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (contact.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (contact.accountNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      : safeContacts;

    setPersonSearchResults(results);
    setShowPersonDropdown(true);
  };

  const handleSelectPerson = (contact) => {
    setPerson(contact.contactName || '');
    setPersonSearchTerm(contact.contactName || '');
    setShowPersonDropdown(false);
  };

  useEffect(() => {
    recalculateTotals(lineItems, taxMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxMode]);

  const handleLineChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    recalculateTotals(updated, taxMode);
  };

  const handleTaxTypeChange = (index, taxTypeId) => {
    const safeTaxTypes = Array.isArray(taxTypes) ? taxTypes : [];
    const tax = safeTaxTypes.find((t) => t._id === taxTypeId) || null;
    const rate = tax ? Number(tax.taxPercentage) || 0 : 0;
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      taxType: tax,
      taxRate: taxMode === 'No Tax' ? 0 : rate,
    };
    recalculateTotals(updated, taxMode);
  };

  const handleItemSearch = (index, searchTerm) => {
    setItemSearchTerms((prev) => ({ ...prev, [index]: searchTerm }));

    const safeItems = Array.isArray(items) ? items : [];
    const term = searchTerm.trim().toLowerCase();

    const results = term
      ? safeItems.filter((item) =>
          (item.name || '').toLowerCase().includes(term) ||
          (item.itemCode || '').toLowerCase().includes(term)
        )
      : safeItems;

    setItemSearchResults((prev) => ({ ...prev, [index]: results }));
    setShowItemDropdown((prev) => ({ ...prev, [index]: true }));
  };

  const handleSelectItemFromSearch = (index, item) => {
    handleItemChange(index, item._id);
    setItemSearchTerms((prev) => ({ ...prev, [index]: item.name }));
    setShowItemDropdown((prev) => ({ ...prev, [index]: false }));
  };

  const handleAccountSearch = (index, searchTerm) => {
    setAccountSearchTerms((prev) => ({ ...prev, [index]: searchTerm }));

    const safeAccounts = Array.isArray(accounts) ? accounts : [];
    const term = searchTerm.trim().toLowerCase();

    const results = term
      ? safeAccounts.filter((account) =>
          (account.name || '').toLowerCase().includes(term) ||
          (account.code || '').toLowerCase().includes(term)
        )
      : safeAccounts;

    setAccountSearchResults((prev) => ({ ...prev, [index]: results }));
    setShowAccountDropdown((prev) => ({ ...prev, [index]: true }));
  };

  const handleSelectAccount = (index, account) => {
    const updated = [...lineItems];
    const existing = updated[index] || {};
    updated[index] = { ...existing, account };
    recalculateTotals(updated, taxMode);

    setAccountSearchTerms((prev) => ({
      ...prev,
      [index]: account.code && account.name ? `${account.code} - ${account.name}` : account.name || '',
    }));
    setShowAccountDropdown((prev) => ({ ...prev, [index]: false }));
  };

  const handleItemChange = (index, itemId) => {
    const safeItems = Array.isArray(items) ? items : [];
    const selectedItem = safeItems.find((i) => i._id === itemId) || null;
    const updated = [...lineItems];
    const existing = updated[index] || {};

    let nextLine = {
      ...existing,
      item: selectedItem,
    };

    if (selectedItem) {
      nextLine.description = selectedItem.description || existing.description || '';
      // For Receive Money (cash in), mirror sales-side defaults
      nextLine.unitPrice = selectedItem.salePrice || existing.unitPrice || 0;

      const saleAccount =
        selectedItem.saleAccount && selectedItem.saleAccount._id
          ? selectedItem.saleAccount
          : selectedItem.saleAccount || existing.account;
      nextLine.account = saleAccount || null;

      if (taxMode !== 'No Tax') {
        const saleTaxId =
          (selectedItem.taxRateOnSale && selectedItem.taxRateOnSale._id) ||
          selectedItem.taxRateOnSale ||
          null;

        if (saleTaxId) {
          const safeTaxTypes = Array.isArray(taxTypes) ? taxTypes : [];
          const tax = safeTaxTypes.find((t) => t._id === saleTaxId) || null;
          nextLine.taxType = tax;
          nextLine.taxRate = tax ? Number(tax.taxPercentage) || 0 : 0;
        }
      }
    }

    updated[index] = nextLine;
    recalculateTotals(updated, taxMode);
  };

  const addLineItem = () => {
    const updated = [
      ...lineItems,
      {
        item: null,
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        account: null,
        taxType: null,
        taxRate: 0,
        taxAmount: 0,
        lineTotal: 0,
      },
    ];
    recalculateTotals(updated, taxMode);
  };

  const removeLineItem = (index) => {
    if (lineItems.length === 1) return;
    const updated = lineItems.filter((_, i) => i !== index);
    recalculateTotals(updated, taxMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBankAccountId) return;
    if (!person.trim()) return;
    if (grandTotal <= 0) return;

    setSubmitting(true);
    try {
      const payload = {
        bankAccount: selectedBankAccountId,
        type: 'Receive',
        person: person.trim(),
        date,
        reference: reference.trim() || undefined,
        taxMode,
        lineItems: lineItems.map((line) => ({
          item: line.item ? line.item._id || line.item : undefined,
          description: line.description,
          quantity: Number(line.quantity) || 0,
          unitPrice: Number(line.unitPrice) || 0,
          discount: Number(line.discount) || 0,
          account: line.account ? line.account._id || line.account : undefined,
          taxRate: Number(line.taxRate) || 0,
          taxAmount: Number(line.taxAmount) || 0,
          lineTotal: Number(line.lineTotal) || 0,
        })),
        subtotal,
        totalTax,
        grandTotal,
        notes: notes.trim() || undefined,
      };

      await bankTransactionAPI.create(payload);
      navigate('/accounts/bank-accounts');
    } catch (error) {
      console.error('Failed to receive money', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-600">Loading receive money...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Receipt details */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-secondary-900 mb-4">Receipt Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Bank Account <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedBankAccountId}
                  onChange={(e) => setSelectedBankAccountId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                  required
                >
                  <option value="">Select bank account...</option>
                  {(Array.isArray(bankAccounts) ? bankAccounts : []).map((ba) => (
                    <option key={ba._id} value={ba._id}>
                      {ba.accountName} {ba.bankName ? `- ${ba.bankName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Person <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={person}
                    onChange={(e) => handlePersonSearch(e.target.value)}
                    onFocus={() => handlePersonSearch(person || '')}
                    placeholder="Search contact..."
                    className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                    required
                  />
                  {showPersonDropdown && (
                    <div className="absolute z-[200] w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {personSearchResults.length > 0 ? (
                        personSearchResults.map((contact) => (
                          <button
                            key={contact._id}
                            type="button"
                            onClick={() => handleSelectPerson(contact)}
                            className="w-full text-left px-4 py-2.5 hover:bg-secondary-50 text-sm border-b border-secondary-100 last:border-b-0"
                          >
                            <div className="font-medium text-secondary-900">{contact.contactName}</div>
                            {contact.email && (
                              <div className="text-xs text-secondary-600">{contact.email}</div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2.5 text-sm text-secondary-500">No contacts found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">Reference</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Optional reference"
                  className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-secondary-700 mb-2">Tax Mode</label>
                <select
                  value={taxMode}
                  onChange={(e) => setTaxMode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                >
                  {TAX_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m === 'Excluding' ? 'Tax Excluding' : m === 'Including' ? 'Tax Including' : 'No Tax'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-semibold text-secondary-700 mb-2">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-secondary-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="px-4 py-3 border-b border-secondary-200 flex items-center justify-between">
            <h2 className="text-sm font-medium text-secondary-900">Line Items</h2>
            <button
              type="button"
              onClick={addLineItem}
              className="px-3 py-1.5 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg font-semibold flex items-center space-x-1 transition-all text-xs"
              title="Add new line"
            >
              <Plus className="w-4 h-4" />
              <span>Add Line</span>
            </button>
          </div>

          <div className="pb-12">
            <table className="w-full relative z-10 text-sm">
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
                  <th className="text-left py-2 px-3 text-sm font-semibold text-secondary-700"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((line, index) => (
                  <tr key={index} className="border-b border-secondary-100">
                    {/* Item */}
                    <td className="py-2 px-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={itemSearchTerms[index] || ''}
                          onChange={(e) => handleItemSearch(index, e.target.value)}
                          onFocus={() => handleItemSearch(index, itemSearchTerms[index] || '')}
                          placeholder="Search item..."
                          className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        />
                        {showItemDropdown[index] && (
                          <div className="absolute z-[200] w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {itemSearchResults[index]?.length > 0 ? (
                              itemSearchResults[index].map((item) => (
                                <button
                                  key={item._id}
                                  type="button"
                                  onClick={() => handleSelectItemFromSearch(index, item)}
                                  className="w-full text-left px-3 py-2 hover:bg-secondary-50 text-sm border-b border-secondary-100 last:border-b-0"
                                >
                                  <div className="font-medium text-secondary-900">{item.name}</div>
                                  <div className="text-xs text-secondary-600">{item.itemCode}</div>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-secondary-500">No items found</div>
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
                        onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                        placeholder="Description"
                        className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                    </td>

                    {/* Qty */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                        className="w-20 px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                    </td>

                    {/* Price */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => handleLineChange(index, 'unitPrice', e.target.value)}
                        className="w-24 px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                    </td>

                    {/* Discount */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.discount}
                        onChange={(e) => handleLineChange(index, 'discount', e.target.value)}
                        className="w-24 px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                    </td>

                    {/* Account */}
                    <td className="py-2 px-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={accountSearchTerms[index] || ''}
                          onChange={(e) => handleAccountSearch(index, e.target.value)}
                          onFocus={() => handleAccountSearch(index, accountSearchTerms[index] || '')}
                          placeholder="Search account..."
                          className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        />
                        {showAccountDropdown[index] && (
                          <div className="absolute z-[200] w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {accountSearchResults[index]?.length > 0 ? (
                              accountSearchResults[index].map((account) => (
                                <button
                                  key={account._id}
                                  type="button"
                                  onClick={() => handleSelectAccount(index, account)}
                                  className="w-full text-left px-3 py-2 hover:bg-secondary-50 text-sm border-b border-secondary-100 last:border-b-0"
                                >
                                  <div className="font-medium text-secondary-900">
                                    {account.code} - {account.name}
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-secondary-500">No accounts found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Tax Type */}
                    <td className="py-2 px-3">
                      <select
                        value={line.taxType ? line.taxType._id || line.taxType : ''}
                        onChange={(e) => handleTaxTypeChange(index, e.target.value)}
                        className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        disabled={taxMode === 'No Tax'}
                      >
                        <option value="">No tax</option>
                        {(Array.isArray(taxTypes) ? taxTypes : []).map((tax) => (
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
                        value={formatCurrency(line.lineTotal)}
                        readOnly
                        className="w-28 px-3 py-2 bg-secondary-100 border border-secondary-200 rounded-lg text-sm font-semibold text-secondary-900 cursor-not-allowed"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={addLineItem}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Add line below"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
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

          <div className="px-4 py-3 border-t border-gray-200 flex flex-col items-end space-y-1 text-sm bg-gray-50">
            <div className="flex justify-between w-full md:w-1/2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-full md:w-1/2">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">{totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-full md:w-1/2">
              <span className="text-gray-900 font-semibold">Total</span>
              <span className="text-lg font-semibold">{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedBankAccountId || !person.trim() || grandTotal <= 0}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Save Receipt'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReceiveMoney;
