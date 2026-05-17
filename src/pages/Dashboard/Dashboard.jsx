// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Clock,
  Plus,
  Calendar
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { salesInvoiceAPI, billAPI } from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    pendingAmount: 0,
    overdueBills: 0,
    totalProfit: 0
  });
  const [upcomingInvoices, setUpcomingInvoices] = useState([]);
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [cashFlowData, setCashFlowData] = useState([]);
  const [timeFilter, setTimeFilter] = useState('week'); // week, month, year, custom
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load dashboard data when the time filter or custom dates change.
  // We intentionally do not include `fetchDashboardData` in the
  // dependency list to avoid re-running this effect on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchDashboardData();
  }, [timeFilter, startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [invoicesRes, billsRes] = await Promise.all([
        salesInvoiceAPI.getAll(),
        billAPI.getAll()
      ]);

      const invoices = invoicesRes.data.data || invoicesRes.data || [];
      const bills = billsRes.data.data || billsRes.data || [];

      // Calculate stats
      const totalIncome = invoices
        .filter(inv => inv.status === 'Paid')
        .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

      const totalExpense = bills
        .filter(bill => bill.status === 'Paid')
        .reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);

      const pendingAmount = invoices
        .filter(inv => inv.status !== 'Paid' && inv.status !== 'Cancelled')
        .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

      const overdueBills = bills
        .filter(bill => {
          if (bill.status === 'Paid' || bill.status === 'Cancelled') return false;
          return new Date(bill.dueDate) < new Date();
        })
        .reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);

      const totalProfit = totalIncome - totalExpense;

      setStats({
        totalIncome,
        totalExpense,
        pendingAmount,
        overdueBills,
        totalProfit
      });

      // Get upcoming invoices (sorted by due date)
      const upcoming = invoices
        .filter(inv => inv.status !== 'Paid' && inv.status !== 'Cancelled')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);
      setUpcomingInvoices(upcoming);

      // Get upcoming bills (sorted by due date)
      const upcomingB = bills
        .filter(bill => bill.status !== 'Paid' && bill.status !== 'Cancelled')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);
      setUpcomingBills(upcomingB);

      // Generate cash flow data based on time filter
      generateCashFlowData(invoices, bills, timeFilter);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCashFlowData = (invoices, bills, filter) => {
    const now = new Date();
    let data = [];

    if (filter === 'custom' && startDate && endDate) {
      // Custom date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      for (let i = 0; i <= diffDays; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const income = invoices
          .filter(inv => inv.status === 'Paid' && inv.issueDate?.split('T')[0] === dateStr)
          .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

        const expense = bills
          .filter(bill => bill.status === 'Paid' && bill.issueDate?.split('T')[0] === dateStr)
          .reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);

        // Show fewer points if date range is long
        if (diffDays <= 7 || i % Math.ceil(diffDays / 10) === 0 || income > 0 || expense > 0) {
          data.push({
            name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            income: Math.round(income * 100) / 100,
            expense: Math.round(expense * 100) / 100
          });
        }
      }
    } else if (filter === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const income = invoices
          .filter(inv => inv.status === 'Paid' && inv.issueDate?.split('T')[0] === dateStr)
          .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

        const expense = bills
          .filter(bill => bill.status === 'Paid' && bill.issueDate?.split('T')[0] === dateStr)
          .reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);

        data.push({
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          income: Math.round(income * 100) / 100,
          expense: Math.round(expense * 100) / 100
        });
      }
    } else if (filter === 'month') {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const income = invoices
          .filter(inv => inv.status === 'Paid' && inv.issueDate?.split('T')[0] === dateStr)
          .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

        const expense = bills
          .filter(bill => bill.status === 'Paid' && bill.issueDate?.split('T')[0] === dateStr)
          .reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);

        if (i % 5 === 0 || income > 0 || expense > 0) {
          data.push({
            name: `${date.getDate()}/${date.getMonth() + 1}`,
            income: Math.round(income * 100) / 100,
            expense: Math.round(expense * 100) / 100
          });
        }
      }
    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const month = date.getMonth();
        const year = date.getFullYear();

        const income = invoices
          .filter(inv => {
            if (inv.status !== 'Paid') return false;
            const invDate = new Date(inv.issueDate);
            return invDate.getMonth() === month && invDate.getFullYear() === year;
          })
          .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

        const expense = bills
          .filter(bill => {
            if (bill.status !== 'Paid') return false;
            const billDate = new Date(bill.issueDate);
            return billDate.getMonth() === month && billDate.getFullYear() === year;
          })
          .reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);

        data.push({
          name: date.toLocaleDateString('en-US', { month: 'short' }),
          income: Math.round(income * 100) / 100,
          expense: Math.round(expense * 100) / 100
        });
      }
    }

    setCashFlowData(data);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Paid': 'bg-green-100 text-green-700',
      'Draft': 'bg-gray-100 text-gray-700',
      'Sent': 'bg-blue-100 text-blue-700',
      'Overdue': 'bg-red-100 text-red-700',
      'Cancelled': 'bg-gray-100 text-gray-500'
    };
    return statusConfig[status] || 'bg-secondary-100 text-secondary-700';
  };

  const isDueSoon = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'Paid' || status === 'Cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-secondary-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">

      {/* Stats Grid - 5 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {/* Total Income */}
        <div className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-secondary-600 text-sm font-medium mb-1">Total Income</h3>
          <p className="text-2xl font-bold text-secondary-900">{formatCurrency(stats.totalIncome)}</p>
        </div>

        {/* Total Expense */}
        <div className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-secondary-600 text-sm font-medium mb-1">Total Expense</h3>
          <p className="text-2xl font-bold text-secondary-900">{formatCurrency(stats.totalExpense)}</p>
        </div>

        {/* Pending Amount */}
        <div className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-secondary-600 text-sm font-medium mb-1">Pending Invoices</h3>
          <p className="text-2xl font-bold text-secondary-900">{formatCurrency(stats.pendingAmount)}</p>
        </div>

        {/* Overdue Bills */}
        <div className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-secondary-600 text-sm font-medium mb-1">Overdue Bills</h3>
          <p className="text-2xl font-bold text-secondary-900">{formatCurrency(stats.overdueBills)}</p>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.totalProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-6 h-6 ${stats.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
          </div>
          <h3 className="text-secondary-600 text-sm font-medium mb-1">Net Profit</h3>
          <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats.totalProfit)}
          </p>
        </div>
      </div>

      {/* Charts and Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-soft p-6">
          <div className="flex flex-col space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-secondary-900">Cash Flow</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setTimeFilter('week');
                    setShowDatePicker(false);
                  }}
                  className={`px-3 py-1 text-sm rounded-lg ${timeFilter === 'week' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Week
                </button>
                <button
                  onClick={() => {
                    setTimeFilter('month');
                    setShowDatePicker(false);
                  }}
                  className={`px-3 py-1 text-sm rounded-lg ${timeFilter === 'month' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Month
                </button>
                <button
                  onClick={() => {
                    setTimeFilter('year');
                    setShowDatePicker(false);
                  }}
                  className={`px-3 py-1 text-sm rounded-lg ${timeFilter === 'year' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Year
                </button>
                <button
                  onClick={() => {
                    setShowDatePicker(!showDatePicker);
                    if (!showDatePicker) setTimeFilter('custom');
                  }}
                  className={`px-3 py-1 text-sm rounded-lg flex items-center space-x-1 ${timeFilter === 'custom' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Custom</span>
                </button>
              </div>
            </div>
            {showDatePicker && (
              <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">From</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    dateFormat="MMM dd, yyyy"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholderText="Select start date"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">To</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    dateFormat="MMM dd, yyyy"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholderText="Select end date"
                  />
                </div>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cashFlowData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend />
              <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h2 className="text-xl font-bold text-secondary-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/sales/invoices')}
              className="w-full flex items-center space-x-3 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors group"
            >
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-secondary-900">New Invoice</p>
                <p className="text-xs text-secondary-600">Create sales invoice</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/purchase/bills')}
              className="w-full flex items-center space-x-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group"
            >
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-secondary-900">New Bill</p>
                <p className="text-xs text-secondary-600">Create vendor bill</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/contacts')}
              className="w-full flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-secondary-900">Add Contact</p>
                <p className="text-xs text-secondary-600">Create new contact</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Invoices and Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Invoices */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-secondary-900">Upcoming Invoices</h2>
            <button
              onClick={() => navigate('/sales/invoices')}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View All →
            </button>
          </div>
          {upcomingInvoices.length === 0 ? (
            <p className="text-secondary-500 text-center py-8">No upcoming invoices</p>
          ) : (
            <div className="space-y-3">
              {upcomingInvoices.map((invoice) => (
                <div
                  key={invoice._id}
                  className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-secondary-900">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-secondary-600">{invoice.contact?.contactName || 'N/A'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-secondary-900">{formatCurrency(invoice.grandTotal)}</span>
                    <div className="flex items-center space-x-2">
                      {isDueSoon(invoice.dueDate) && invoice.status !== 'Overdue' && invoice.status !== 'Paid' && (
                        <span className="text-xs text-yellow-600 font-semibold">Due Soon</span>
                      )}
                      <span className="text-sm text-secondary-600">Due: {formatDate(invoice.dueDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Bills */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-secondary-900">Upcoming Bills</h2>
            <button
              onClick={() => navigate('/purchase/bills')}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View All →
            </button>
          </div>
          {upcomingBills.length === 0 ? (
            <p className="text-secondary-500 text-center py-8">No upcoming bills</p>
          ) : (
            <div className="space-y-3">
              {upcomingBills.map((bill) => (
                <div
                  key={bill._id}
                  className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-secondary-900">{bill.billNumber}</p>
                      <p className="text-sm text-secondary-600">{bill.contact?.contactName || 'N/A'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(bill.status)}`}>
                      {bill.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-secondary-900">{formatCurrency(bill.grandTotal)}</span>
                    <div className="flex items-center space-x-2">
                      {isDueSoon(bill.dueDate) && bill.status !== 'Overdue' && bill.status !== 'Paid' && (
                        <span className="text-xs text-yellow-600 font-semibold">Due Soon</span>
                      )}
                      <span className="text-sm text-secondary-600">Due: {formatDate(bill.dueDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
