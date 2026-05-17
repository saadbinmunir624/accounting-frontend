import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Scale,
  DollarSign,
  BarChart3,
  Users,
  ShoppingCart,
  ShoppingBag,
  Percent,
  FileBarChart,
  Briefcase,
  Building2,
  CreditCard,
  Package,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/reports';

const Reports = () => {
  const [selectedCategory, setSelectedCategory] = useState('financial');
  const [selectedReport, setSelectedReport] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1));
  const [endDate, setEndDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    contactId: '',
    accountId: '',
    bankAccountId: '',
    itemId: '',
    status: '',
  });
  const [filterOptions, setFilterOptions] = useState({
    contacts: [],
    accounts: [],
    bankAccounts: [],
    items: [],
  });

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const [contacts, accounts, bankAccounts, items] = await Promise.all([
        axios.get('http://localhost:5000/api/contacts').catch(e => ({ data: [] })),
        axios.get('http://localhost:5000/api/chart-of-accounts').catch(e => ({ data: [] })),
        axios.get('http://localhost:5000/api/bank-accounts').catch(e => ({ data: [] })),
        axios.get('http://localhost:5000/api/items').catch(e => ({ data: [] })),
      ]);

      setFilterOptions({
        contacts: Array.isArray(contacts.data) ? contacts.data : [],
        accounts: Array.isArray(accounts.data) ? accounts.data : [],
        bankAccounts: Array.isArray(bankAccounts.data) ? bankAccounts.data : [],
        items: Array.isArray(items.data) ? items.data : [],
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Set empty arrays as fallback
      setFilterOptions({
        contacts: [],
        accounts: [],
        bankAccounts: [],
        items: [],
      });
    }
  };

  const reportCategories = [
    { id: 'financial', name: 'Financial Reports', icon: Scale },
    { id: 'sales', name: 'Sales Reports', icon: ShoppingCart },
    { id: 'purchase', name: 'Purchase Reports', icon: ShoppingBag },
    { id: 'contacts', name: 'Reports by Contacts', icon: Users },
    { id: 'accounts', name: 'Reports by Accounts', icon: Briefcase },
    { id: 'bankAccounts', name: 'Reports by Bank Accounts', icon: Building2 },
    { id: 'items', name: 'Reports by Items', icon: Package },
    { id: 'tax', name: 'Tax Reports', icon: Percent },
  ];

  const reports = {
    financial: [
      { id: 'profit-loss', name: 'Profit & Loss Statement', icon: TrendingUp },
      { id: 'balance-sheet', name: 'Balance Sheet', icon: Scale },
      { id: 'cash-flow', name: 'Cash Flow Statement', icon: BarChart3 },
      { id: 'income-statement', name: 'Income Statement', icon: FileBarChart },
    ],
    sales: [
      { id: 'sales-summary', name: 'Sales Summary', icon: DollarSign },
      { id: 'sales-by-customer', name: 'Sales by Customer', icon: Users },
      { id: 'invoice-details', name: 'Invoice Details', icon: FileText },
      { id: 'customer-balance', name: 'Customer Balance', icon: DollarSign },
      { id: 'aged-receivables', name: 'Aged Receivables', icon: Calendar },
    ],
    purchase: [
      { id: 'purchase-summary', name: 'Purchase Summary', icon: DollarSign },
      { id: 'purchase-by-vendor', name: 'Purchase by Vendor', icon: Users },
      { id: 'bill-details', name: 'Bill Details', icon: FileText },
      { id: 'vendor-balance', name: 'Vendor Balance', icon: DollarSign },
      { id: 'aged-payables', name: 'Aged Payables', icon: Calendar },
    ],
    contacts: [
      { id: 'contact-transactions', name: 'Contact Transactions', icon: CreditCard },
      { id: 'contact-summary', name: 'Contact Summary', icon: Users },
      { id: 'customer-transactions', name: 'Customer Transactions', icon: ShoppingCart },
      { id: 'vendor-transactions', name: 'Vendor Transactions', icon: ShoppingBag },
    ],
    accounts: [
      { id: 'account-activity', name: 'Account Activity', icon: Briefcase },
      { id: 'account-balance', name: 'Account Balance', icon: DollarSign },
      { id: 'account-transactions', name: 'Account Transactions', icon: CreditCard },
      { id: 'trial-balance', name: 'Trial Balance', icon: FileBarChart },
    ],
    bankAccounts: [
      { id: 'bank-account-activity', name: 'Bank Account Activity', icon: Building2 },
      { id: 'bank-account-balance', name: 'Bank Account Balance', icon: DollarSign },
      { id: 'bank-reconciliation', name: 'Bank Reconciliation', icon: Scale },
    ],
    items: [
      { id: 'item-sales', name: 'Item Sales Report', icon: ShoppingCart },
      { id: 'item-purchases', name: 'Item Purchases Report', icon: ShoppingBag },
      { id: 'item-summary', name: 'Item Summary', icon: Package },
      { id: 'item-movement', name: 'Item Movement', icon: TrendingUp },
    ],
    tax: [
      { id: 'tax-summary', name: 'Tax Summary', icon: Percent },
      { id: 'sales-tax', name: 'Sales Tax Report', icon: ShoppingCart },
      { id: 'purchase-tax', name: 'Purchase Tax Report', icon: ShoppingBag },
    ],
  };

  const generateReport = async () => {
    if (!selectedReport) return;

    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (filters.contactId) queryParams.append('contactId', filters.contactId);
      if (filters.accountId) queryParams.append('accountId', filters.accountId);
      if (filters.bankAccountId) queryParams.append('bankAccountId', filters.bankAccountId);
      if (filters.itemId) queryParams.append('itemId', filters.itemId);
      if (filters.status) queryParams.append('status', filters.status);

      const response = await axios.get(
        `${API_BASE_URL}/${selectedReport.id}?${queryParams.toString()}`
      );
      
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      setReportData({ error: error.response?.data?.message || 'Failed to generate report' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Automatically generate the selected report when filters change.
  // We intentionally omit `generateReport` from the dependency list
  // to avoid recreating it on every render and re-triggering this effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedReport) {
      generateReport();
    }
  }, [selectedReport, startDate, endDate, filters]);

  const renderReportContent = () => {
    if (!reportData) {
      return (
        <div className="text-center py-12 text-gray-500">
          Select a report from the left sidebar to get started
        </div>
      );
    }

    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating report...</p>
        </div>
      );
    }

    if (reportData.error) {
      return (
        <div className="text-center py-12 text-red-600">
          <p>{reportData.error}</p>
        </div>
      );
    }

    switch (reportData.type) {
      case 'profit-loss':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(reportData.revenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.invoiceCount} invoices
                </p>
              </div>
              <div className="bg-red-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(reportData.expenses)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{reportData.billCount} bills</p>
              </div>
              <div
                className={`${
                  reportData.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
                } p-6 rounded-lg`}
              >
                <p className="text-sm text-gray-600 mb-1">Net Profit</p>
                <p
                  className={`text-2xl font-bold ${
                    reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(reportData.netProfit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.netProfit >= 0 ? 'Profit' : 'Loss'}
                </p>
              </div>
            </div>
          </div>
        );

      case 'sales-summary':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-emerald-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(reportData.totalSales)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.invoiceCount} invoices
                </p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Tax Collected</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(reportData.totalTax)}
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(reportData.totalPaid)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{reportData.paidCount} invoices</p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Unpaid</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(reportData.totalUnpaid)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{reportData.unpaidCount} invoices</p>
              </div>
            </div>
          </div>
        );

      case 'sales-by-customer':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.customers.map((customer, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                      {formatCurrency(customer.totalSales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.invoiceCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'invoice-details':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.invoices.map((inv, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {inv.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inv.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inv.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          inv.status === 'Paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(inv.subtotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(inv.tax)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                      {formatCurrency(inv.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'purchase-summary':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-purple-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Purchases</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(reportData.totalPurchases)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{reportData.billCount} bills</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Tax Paid</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(reportData.totalTax)}
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(reportData.totalPaid)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{reportData.paidCount} bills</p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Unpaid</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(reportData.totalUnpaid)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{reportData.unpaidCount} bills</p>
              </div>
            </div>
          </div>
        );

      case 'purchase-by-vendor':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Purchases
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill Count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.vendors.map((vendor, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                      {formatCurrency(vendor.totalPurchases)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vendor.billCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'bill-details':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.bills.map((bill, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {bill.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bill.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bill.vendor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          bill.status === 'Paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(bill.subtotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(bill.tax)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                      {formatCurrency(bill.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'customer-balance':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Invoiced
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance Due
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.customers.map((customer, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(customer.totalInvoiced)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(customer.totalPaid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                      {formatCurrency(customer.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'vendor-balance':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Billed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance Due
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.vendors.map((vendor, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(vendor.totalBilled)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(vendor.totalPaid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                      {formatCurrency(vendor.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'aged-receivables':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Current</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(reportData.totals.current)}
                </p>
                <p className="text-xs text-gray-500">{reportData.aging.current.length} invoices</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">1-30 Days</p>
                <p className="text-lg font-bold text-yellow-600">
                  {formatCurrency(reportData.totals.days30)}
                </p>
                <p className="text-xs text-gray-500">{reportData.aging.days30.length} invoices</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">31-60 Days</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(reportData.totals.days60)}
                </p>
                <p className="text-xs text-gray-500">{reportData.aging.days60.length} invoices</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">61-90 Days</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(reportData.totals.days90)}
                </p>
                <p className="text-xs text-gray-500">{reportData.aging.days90.length} invoices</p>
              </div>
              <div className="bg-red-100 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">90+ Days</p>
                <p className="text-lg font-bold text-red-700">
                  {formatCurrency(reportData.totals.days90Plus)}
                </p>
                <p className="text-xs text-gray-500">
                  {reportData.aging.days90Plus.length} invoices
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Overdue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    ...reportData.aging.current,
                    ...reportData.aging.days30,
                    ...reportData.aging.days60,
                    ...reportData.aging.days90,
                    ...reportData.aging.days90Plus,
                  ].map((inv, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inv.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            inv.daysOverdue <= 0
                              ? 'bg-green-100 text-green-800'
                              : inv.daysOverdue <= 30
                              ? 'bg-yellow-100 text-yellow-800'
                              : inv.daysOverdue <= 60
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {inv.daysOverdue <= 0 ? 'Current' : `${inv.daysOverdue} days`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'aged-payables':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Current</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(reportData.totals.current)}
                </p>
                <p className="text-xs text-gray-500">{reportData.aging.current.length} bills</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">1-30 Days</p>
                <p className="text-lg font-bold text-yellow-600">
                  {formatCurrency(reportData.totals.days30)}
                </p>
                <p className="text-xs text-gray-500">{reportData.aging.days30.length} bills</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">31-60 Days</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(reportData.totals.days60)}
                </p>
                <p className="text-xs text-gray-500">{reportData.aging.days60.length} bills</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">61-90 Days</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(reportData.totals.days90)}
                </p>
                <p className="text-xs text-gray-500">{reportData.aging.days90.length} bills</p>
              </div>
              <div className="bg-red-100 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">90+ Days</p>
                <p className="text-lg font-bold text-red-700">
                  {formatCurrency(reportData.totals.days90Plus)}
                </p>
                <p className="text-xs text-gray-500">{reportData.aging.days90Plus.length} bills</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bill #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Overdue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    ...reportData.aging.current,
                    ...reportData.aging.days30,
                    ...reportData.aging.days60,
                    ...reportData.aging.days90,
                    ...reportData.aging.days90Plus,
                  ].map((bill, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bill.vendor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bill.billNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                        {formatCurrency(bill.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            bill.daysOverdue <= 0
                              ? 'bg-green-100 text-green-800'
                              : bill.daysOverdue <= 30
                              ? 'bg-yellow-100 text-yellow-800'
                              : bill.daysOverdue <= 60
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {bill.daysOverdue <= 0 ? 'Current' : `${bill.daysOverdue} days`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'tax-summary':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Sales Tax Collected</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(reportData.salesTax)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{reportData.salesCount} invoices</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Purchase Tax Paid</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(reportData.purchaseTax)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{reportData.purchaseCount} bills</p>
              </div>
              <div
                className={`${
                  reportData.netTax >= 0 ? 'bg-green-50' : 'bg-red-50'
                } p-6 rounded-lg`}
              >
                <p className="text-sm text-gray-600 mb-1">Net Tax Liability</p>
                <p
                  className={`text-2xl font-bold ${
                    reportData.netTax >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(reportData.netTax)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.netTax >= 0 ? 'Owed to Tax Authority' : 'Tax Refund Due'}
                </p>
              </div>
            </div>
          </div>
        );

      case 'sales-tax':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Sales Tax Collected</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(reportData.totalTax)}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.taxDetails.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {formatCurrency(item.tax)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'purchase-tax':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Purchase Tax Paid</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(reportData.totalTax)}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bill #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.taxDetails.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.billNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.vendor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                        {formatCurrency(item.tax)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'contact-list':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.contacts.map((contact, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {contact.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          contact.type === 'customer'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {contact.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contact.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contact.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.company || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      // Contact Reports
      case 'contact-transactions':
      case 'customer-transactions':
      case 'vendor-transactions':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.transactions?.map((txn, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{txn.type}</td>
                    <td className="px-6 py-4 text-sm font-medium">{txn.number}</td>
                    <td className="px-6 py-4 text-sm">{txn.contact || txn.customer || txn.vendor}</td>
                    <td className="px-6 py-4 text-sm">{new Date(txn.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-emerald-600">{formatCurrency(txn.amount)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        txn.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'contact-summary':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoices</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bills</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.contacts?.map((contact, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{contact.name}</td>
                    <td className="px-6 py-4 text-sm">{contact.type}</td>
                    <td className="px-6 py-4 text-sm">{contact.invoiceCount}</td>
                    <td className="px-6 py-4 text-sm">{contact.billCount}</td>
                    <td className="px-6 py-4 text-sm font-medium">{contact.totalTransactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      // Account Reports
      case 'account-activity':
      case 'account-balance':
      case 'trial-balance':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.accounts?.map((account, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{account.code}</td>
                    <td className="px-6 py-4 text-sm">{account.name}</td>
                    <td className="px-6 py-4 text-sm">{account.accountType?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{account.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'account-transactions':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.transactions?.map((txn, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{txn.type}</td>
                    <td className="px-6 py-4 text-sm font-medium">{txn.number}</td>
                    <td className="px-6 py-4 text-sm">{new Date(txn.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-emerald-600">{formatCurrency(txn.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      // Bank Account Reports
      case 'bank-account-activity':
      case 'bank-account-balance':
      case 'bank-reconciliation':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.accounts?.map((account, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{account.bankName}</td>
                    <td className="px-6 py-4 text-sm font-medium">{account.accountName}</td>
                    <td className="px-6 py-4 text-sm">{account.bankAccountType?.accountTypeName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      // Item Reports
      case 'item-sales':
      case 'item-purchases':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(reportData.sales || reportData.purchases || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{item.itemCode}</td>
                    <td className="px-6 py-4 text-sm">{item.itemName}</td>
                    <td className="px-6 py-4 text-sm">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm font-medium text-emerald-600">{formatCurrency(item.totalAmount)}</td>
                    <td className="px-6 py-4 text-sm">{item.transactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'item-summary':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchased Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{item.itemCode}</td>
                    <td className="px-6 py-4 text-sm">{item.name}</td>
                    <td className="px-6 py-4 text-sm">{formatCurrency(item.costPrice)}</td>
                    <td className="px-6 py-4 text-sm">{formatCurrency(item.salePrice)}</td>
                    <td className="px-6 py-4 text-sm">{item.soldQuantity}</td>
                    <td className="px-6 py-4 text-sm">{item.purchasedQuantity}</td>
                    <td className={`px-6 py-4 text-sm font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'item-movement':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.movements?.map((movement, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{movement.type}</td>
                    <td className="px-6 py-4 text-sm font-medium">{movement.number}</td>
                    <td className="px-6 py-4 text-sm">{new Date(movement.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">{movement.quantity}</td>
                    <td className="px-6 py-4 text-sm font-medium text-emerald-600">{formatCurrency(movement.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return (
          <div className="text-center py-12 text-gray-500">
            <p>{reportData.message || 'This report is coming soon'}</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Report Categories & Reports */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-sm text-gray-600 mt-1">Analyze your business data</p>
        </div>

        <div className="p-4 space-y-6">
          {reportCategories.map((category) => {
            const CategoryIcon = category.icon;
            return (
              <div key={category.id}>
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <CategoryIcon size={20} />
                  <span className="font-medium">{category.name}</span>
                </button>

                {selectedCategory === category.id && (
                  <div className="mt-2 ml-4 space-y-1">
                    {reports[category.id].map((report) => {
                      const ReportIcon = report.icon;
                      return (
                        <button
                          key={report.id}
                          onClick={() => setSelectedReport(report)}
                          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedReport?.id === report.id
                              ? 'bg-emerald-100 text-emerald-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <ReportIcon size={16} />
                          <span>{report.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Content - Report Display */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {selectedReport && (
            <>
              {/* Report Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      {React.createElement(selectedReport.icon, {
                        className: 'w-6 h-6 text-emerald-600',
                      })}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {selectedReport.name}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    <Download size={18} />
                    <span>Export</span>
                  </button>
                </div>

                {/* Date Range Selector */}
                <div className="flex items-center space-x-4 pt-4 border-t pb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-600 font-medium">Date Range:</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      dateFormat="MMM dd, yyyy"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-gray-500">to</span>
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      dateFormat="MMM dd, yyyy"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Filters Section */}
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-4 gap-4">
                    {/* Status Filter */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">All Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                      </select>
                    </div>

                    {/* Contact Filter */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Contact</label>
                      <select
                        value={filters.contactId}
                        onChange={(e) => setFilters({ ...filters, contactId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">All Contacts</option>
                        {filterOptions.contacts?.length > 0 && filterOptions.contacts.map((contact) => (
                          <option key={contact._id} value={contact._id}>
                            {contact.contactName || contact.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Account Filter */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Account</label>
                      <select
                        value={filters.accountId}
                        onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">All Accounts</option>
                        {filterOptions.accounts?.length > 0 && filterOptions.accounts.map((account) => (
                          <option key={account._id} value={account._id}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Item Filter */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Item</label>
                      <select
                        value={filters.itemId}
                        onChange={(e) => setFilters({ ...filters, itemId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">All Items</option>
                        {filterOptions.items?.length > 0 && filterOptions.items.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.itemCode} - {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Content */}
              <div className="bg-white rounded-lg shadow-sm p-6">{renderReportContent()}</div>
            </>
          )}

          {!selectedReport && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Select a Report to Get Started
              </h3>
              <p className="text-gray-500">
                Choose a report category and report type from the left sidebar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
