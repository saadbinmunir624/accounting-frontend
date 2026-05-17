import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  FileText,
  ShoppingCart,
  Users,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  BarChart3,
  Plus
} from 'lucide-react';

const TopNavbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const menuItems = [
    {
      name: 'Home',
      path: '/',
      icon: Home,
      dropdownItems: null
    },
    {
      name: 'Sales',
      icon: FileText,
      dropdownItems: [
        { name: 'Sales Invoice', path: '/sales/invoices' },
        { name: 'Quotation', path: '/sales/quotations' }
      ]
    },
    {
      name: 'Purchases',
      icon: ShoppingCart,
      dropdownItems: [
        { name: 'Bills', path: '/purchase/bills' },
        { name: 'Purchase Order', path: '/purchase/orders' }
      ]
    },
    {
      name: 'Accounts',
      icon: Settings,
      dropdownItems: [
        { name: 'Chart of Accounts', path: '/accounts/chart-of-accounts' },
        { name: 'Bank Accounts', path: '/accounts/bank-accounts' }
      ]
    },
    {
      name: 'Contacts',
      path: '/contacts',
      icon: Users,
      dropdownItems: null
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: BarChart3,
      dropdownItems: null
    },
    {
      name: 'Manage',
      icon: Settings,
      dropdownItems: [
        { name: 'Bank Account Types', path: '/manage/bank-account-types' },
        { name: 'Tax Types', path: '/manage/tax-types' },
        { name: 'Items', path: '/manage/items' },
        ...(isAdmin ? [{ name: 'Users', path: '/manage/users' }] : [])
      ]
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
        setProfileDropdown(false);
        setQuickActionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDropdown = (menuName) => {
    setActiveDropdown(activeDropdown === menuName ? null : menuName);
    setProfileDropdown(false);
    setQuickActionsOpen(false);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdown(!profileDropdown);
    setActiveDropdown(null);
    setQuickActionsOpen(false);
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const isActiveSection = (dropdownItems) => {
    return dropdownItems?.some(item => location.pathname === item.path);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  return (
    <nav ref={dropdownRef} className="bg-white border-b border-secondary-200 shadow-soft sticky top-0 z-50">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Menu Items */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold text-secondary-900">AccountPro</span>
            </Link>

            {/* Desktop Menu Items */}
            <div className="hidden lg:flex items-center space-x-1">
              {menuItems.map((item) => (
                <div key={item.name} className="relative">
                  {item.dropdownItems ? (
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={`flex items-center space-x-1 px-4 py-2 rounded-lg font-medium transition-all ${
                        activeDropdown === item.name || isActiveSection(item.dropdownItems)
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-secondary-700 hover:text-primary-600 hover:bg-secondary-50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === item.name ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        isActiveLink(item.path)
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-secondary-700 hover:text-primary-600 hover:bg-secondary-50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  )}

                  {/* Dropdown Menu */}
                  {item.dropdownItems && activeDropdown === item.name && (
                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-large border border-secondary-200 py-2 animate-scaleIn">
                      {item.dropdownItems.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.path}
                          to={dropdownItem.path}
                          className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                            isActiveLink(dropdownItem.path)
                              ? 'text-primary-600 bg-primary-50'
                              : 'text-secondary-700 hover:text-primary-600 hover:bg-secondary-50'
                          }`}
                        >
                          {dropdownItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - User Profile */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-secondary-700 hover:bg-secondary-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Quick Actions (Desktop) */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => {
                  setQuickActionsOpen(!quickActionsOpen);
                  setProfileDropdown(false);
                  setActiveDropdown(null);
                }}
                className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg transition-colors flex items-center justify-center"
                title="Quick actions"
              >
                <Plus className="w-5 h-5" />
              </button>

              {quickActionsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-large border border-secondary-200 py-2 animate-scaleIn z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickActionsOpen(false);
                      navigate('/sales/invoices', { state: { openInvoiceForm: true } });
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-secondary-700 hover:text-primary-600 hover:bg-secondary-50 transition-colors"
                  >
                    Create Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickActionsOpen(false);
                      navigate('/purchase/bills', { state: { openBillForm: true } });
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-secondary-700 hover:text-primary-600 hover:bg-secondary-50 transition-colors"
                  >
                    Create Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickActionsOpen(false);
                      navigate('/banking/send-money');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-secondary-700 hover:text-primary-600 hover:bg-secondary-50 transition-colors"
                  >
                    Send Money
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickActionsOpen(false);
                      navigate('/banking/receive-money');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-secondary-700 hover:text-primary-600 hover:bg-secondary-50 transition-colors"
                  >
                    Receive Money
                  </button>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold shadow-md">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{getInitials(user?.fullName)}</span>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-secondary-900">{user?.fullName || 'User'}</p>
                    <p className="text-xs text-secondary-500 capitalize">{user?.role || 'User'}</p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-secondary-500 transition-transform ${profileDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-large border border-secondary-200 py-2 animate-scaleIn">
                  <div className="px-4 py-3 border-b border-secondary-200">
                    <p className="text-sm font-semibold text-secondary-900">{user?.fullName}</p>
                    <p className="text-xs text-secondary-500">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-secondary-700 hover:text-primary-600 hover:bg-secondary-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-secondary-200 bg-white shadow-lg animate-slideDown">
          <div className="px-4 py-4 space-y-1">
            {menuItems.map((item) => (
              <div key={item.name}>
                {item.dropdownItems ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                        activeDropdown === item.name || isActiveSection(item.dropdownItems)
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-secondary-700 hover:bg-secondary-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === item.name ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === item.name && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.dropdownItems.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.path}
                            to={dropdownItem.path}
                            className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                              isActiveLink(dropdownItem.path)
                                ? 'text-primary-600 bg-primary-50'
                                : 'text-secondary-600 hover:text-primary-600 hover:bg-secondary-50'
                            }`}
                          >
                            {dropdownItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActiveLink(item.path)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-secondary-700 hover:bg-secondary-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default TopNavbar;
