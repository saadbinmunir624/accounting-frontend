// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/Auth/Login';

// Main Pages
import Dashboard from './pages/Dashboard/Dashboard';

// Sales Pages
import SalesInvoice from './pages/Sales/SalesInvoice';
import Quotation from './pages/Sales/Quotation';

// Purchase Pages
import Bills from './pages/Purchase/Bills';
import PurchaseOrder from './pages/Purchase/PurchaseOrder';

// Banking Pages
import SendMoney from './pages/Banking/SendMoney';
import ReceiveMoney from './pages/Banking/ReceiveMoney';

// Contacts
import Contacts from './pages/Contacts/Contacts';

// Accounts Pages
import ChartOfAccounts from './pages/Accounts/ChartOfAccounts';
import BankAccount from './pages/Accounts/BankAccount';
import BankAccountTypes from './pages/Accounts/BankAccountTypes';

// Manage Pages

import TaxTypes from './pages/Accounts/TaxTypes';
import Items from './pages/Manage/Items';
import Users from './pages/Manage/Users';

// Profile
import Profile from './pages/Profile/Profile';

// Reports
import Reports from './pages/Reports/Reports';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    {/* Dashboard */}
                    <Route path="/" element={<Dashboard />} />

                    {/* Sales */}
                    <Route path="/sales/invoices" element={<SalesInvoice />} />
                    <Route path="/sales/quotations" element={<Quotation />} />

                    {/* Purchases */}
                    <Route path="/purchase/bills" element={<Bills />} />
                    <Route path="/purchase/orders" element={<PurchaseOrder />} />

                    {/* Banking */}
                    <Route path="/banking/send-money" element={<SendMoney />} />
                    <Route path="/banking/receive-money" element={<ReceiveMoney />} />

                    {/* Contacts */}
                    <Route path="/contacts" element={<Contacts />} />

                    {/* Accounts */}
                    <Route path="/accounts/chart-of-accounts" element={<ChartOfAccounts />} />
                    <Route path="/accounts/bank-accounts" element={<BankAccount />} />

                    {/* Reports */}
                    <Route path="/reports" element={<Reports />} />

                    {/* Accounts - Tax Types */}
                    <Route path="/accounts/tax-types" element={<TaxTypes />} />

                    {/* Manage */}
                    <Route path="/manage/bank-account-types" element={<BankAccountTypes />} />
                    <Route path="/manage/tax-types" element={<TaxTypes />} />
                    <Route path="/manage/items" element={<Items />} />
                    <Route
                      path="/manage/users"
                      element={
                        <ProtectedRoute requireAdmin>
                          <Users />
                        </ProtectedRoute>
                      }
                    />

                    {/* Profile */}
                    <Route path="/profile" element={<Profile />} />

                    {/* 404 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;