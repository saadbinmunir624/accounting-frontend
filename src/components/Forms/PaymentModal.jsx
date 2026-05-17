import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, invoice, bankAccounts, onSubmit }) => {
  const [paymentMode, setPaymentMode] = useState('single');
  const [paymentAccounts, setPaymentAccounts] = useState([
    { bankAccount: '', amount: invoice?.grandTotal || 0 }
  ]);

  useEffect(() => {
    if (isOpen && invoice) {
      setPaymentMode('single');
      setPaymentAccounts([{ bankAccount: '', amount: invoice.grandTotal }]);
    }
  }, [isOpen, invoice]);

  const handleModeChange = (mode) => {
    setPaymentMode(mode);
    if (mode === 'single') {
      setPaymentAccounts([{ bankAccount: '', amount: invoice.grandTotal }]);
    } else {
      setPaymentAccounts([
        { bankAccount: '', amount: invoice.grandTotal / 2 },
        { bankAccount: '', amount: invoice.grandTotal / 2 }
      ]);
    }
  };

  const handleAddAccount = () => {
    setPaymentAccounts([...paymentAccounts, { bankAccount: '', amount: 0 }]);
  };

  const handleRemoveAccount = (index) => {
    if (paymentAccounts.length > 1) {
      setPaymentAccounts(paymentAccounts.filter((_, i) => i !== index));
    }
  };

  const handleAccountChange = (index, field, value) => {
    const newAccounts = [...paymentAccounts];
    newAccounts[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setPaymentAccounts(newAccounts);
  };

  const calculateTotal = () => {
    return paymentAccounts.reduce((sum, acc) => sum + (acc.amount || 0), 0);
  };

  const handleSubmit = () => {
    const total = calculateTotal();
    const roundedTotal = Math.round(total * 100) / 100;
    const roundedGrandTotal = Math.round(invoice.grandTotal * 100) / 100;

    if (Math.abs(roundedTotal - roundedGrandTotal) > 0.01) {
      alert(`Payment total ($${roundedTotal}) must equal invoice total ($${roundedGrandTotal})`);
      return;
    }

    const validAccounts = paymentAccounts.filter(acc => acc.bankAccount && acc.amount > 0);
    if (validAccounts.length === 0) {
      alert('Please add at least one payment account');
      return;
    }

    onSubmit(validAccounts);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">Record Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Invoice Info */}
        <div className="bg-blue-50 p-4 rounded mb-4">
          <p className="text-sm text-gray-600">Invoice: <span className="font-semibold">{invoice?.invoiceNumber}</span></p>
          <p className="text-lg font-bold text-blue-900">Total: ${invoice?.grandTotal?.toFixed(2)}</p>
        </div>

        {/* Payment Mode */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode</label>
          <div className="flex gap-3">
            <button
              onClick={() => handleModeChange('single')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                paymentMode === 'single'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => handleModeChange('split')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                paymentMode === 'split'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Split Payment
            </button>
          </div>
        </div>

        {/* Payment Accounts */}
        <div className="space-y-3 mb-4">
          {paymentAccounts.map((account, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Bank Account</label>
                <select
                  value={account.bankAccount}
                  onChange={(e) => handleAccountChange(index, 'bankAccount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Account</option>
                  {bankAccounts?.map((ba) => (
                    <option key={ba._id} value={ba._id}>
                      {ba.bankName} - {ba.accountName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={account.amount}
                  onChange={(e) => handleAccountChange(index, 'amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {paymentAccounts.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveAccount(index)}
                  className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>

        {paymentMode === 'split' && (
          <button
            type="button"
            onClick={handleAddAccount}
            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm mb-4 flex items-center gap-1"
          >
            <Plus size={16} /> Add Account
          </button>
        )}

        {/* Summary */}
        <div className="bg-gray-50 p-3 rounded mb-4">
          <div className="flex justify-between text-sm">
            <span>Total Payment:</span>
            <span className="font-bold">${calculateTotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Invoice Total:</span>
            <span className="font-bold">${invoice?.grandTotal?.toFixed(2)}</span>
          </div>
          <div className={`flex justify-between text-sm font-bold mt-2 pt-2 border-t ${
            Math.abs(calculateTotal() - invoice?.grandTotal) < 0.01 ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>Difference:</span>
            <span>${(calculateTotal() - invoice?.grandTotal).toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
