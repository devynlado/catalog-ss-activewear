'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  MessageSquare, 
  ShoppingCart, 
  Mail,
  RefreshCw,
  LogOut,
  Eye,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

interface Summary {
  quotes: { total: number; today: number; new: number };
  contacts: { total: number; today: number; new: number };
  abandoned: { total: number };
  exitCaptures: { total: number };
}

interface Quote {
  id: string;
  quote_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  company: string | null;
  subtotal: number;
  status: string;
  created_at: string;
  items: Array<{ styleName: string; quantity: number }>;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  status: string;
  created_at: string;
}

interface AbandonedCart {
  id: string;
  email: string;
  items: Array<{ styleName: string; quantity: number }>;
  captured_at: string;
  recovered: boolean;
}

interface ExitCapture {
  id: string;
  email: string;
  page_url: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'summary' | 'quotes' | 'contacts' | 'abandoned' | 'exit'>('summary');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [abandoned, setAbandoned] = useState<AbandonedCart[]>([]);
  const [exitCaptures, setExitCaptures] = useState<ExitCapture[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (isAuthenticated) {
      loadData(activeTab);
    }
  }, [activeTab, isAuthenticated]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      if (res.ok) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setAuthError('Invalid password');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError('Login failed');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
  };

  const loadData = async (type: string) => {
    setDataLoading(true);
    try {
      const res = await fetch(`/api/admin/data?type=${type}`);
      const result = await res.json();
      
      if (type === 'summary') {
        setSummary(result);
      } else if (result.data) {
        if (type === 'quotes') setQuotes(result.data);
        if (type === 'contacts') setContacts(result.data);
        if (type === 'abandoned') setAbandoned(result.data);
        if (type === 'exit') setExitCaptures(result.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const updateStatus = async (table: string, id: string, status: string) => {
    try {
      await fetch('/api/admin/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id, status }),
      });
      loadData(activeTab);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">Admin Dashboard</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                placeholder="Enter admin password"
                required
              />
            </div>
            {authError && (
              <p className="text-red-500 text-sm">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-brand-500 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-600 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Garment Decor Admin</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => loadData(activeTab)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-5 w-5 text-slate-600 ${dataLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'summary', label: 'Summary', icon: TrendingUp },
            { id: 'quotes', label: 'Quotes', icon: FileText },
            { id: 'contacts', label: 'Contacts', icon: MessageSquare },
            { id: 'abandoned', label: 'Abandoned Carts', icon: ShoppingCart },
            { id: 'exit', label: 'Exit Captures', icon: Mail },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Summary View */}
        {activeTab === 'summary' && summary && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Quotes</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">{summary.quotes.total}</p>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-green-600">{summary.quotes.today} today</span>
                <span className="text-amber-600">{summary.quotes.new} new</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-100">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Contacts</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">{summary.contacts.total}</p>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-green-600">{summary.contacts.today} today</span>
                <span className="text-amber-600">{summary.contacts.new} new</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-amber-100">
                  <ShoppingCart className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Abandoned Carts</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">{summary.abandoned.total}</p>
              <p className="mt-2 text-sm text-slate-500">Not recovered</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-green-100">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Exit Captures</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">{summary.exitCaptures.total}</p>
              <p className="mt-2 text-sm text-slate-500">Emails collected</p>
            </div>
          </div>
        )}

        {/* Quotes Table */}
        {activeTab === 'quotes' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Quote ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Items</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Subtotal</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-sm">{quote.quote_id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{quote.customer_name}</p>
                        <p className="text-sm text-slate-500">{quote.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {Array.isArray(quote.items) ? quote.items.length : 0} items
                      </td>
                      <td className="px-4 py-3 font-medium">${quote.subtotal?.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={quote.status}
                          onChange={(e) => updateStatus('quotes', quote.id, e.target.value)}
                          className={`text-sm rounded-lg px-2 py-1 border ${
                            quote.status === 'new' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            quote.status === 'contacted' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            quote.status === 'quoted' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                            quote.status === 'converted' ? 'bg-green-50 border-green-200 text-green-700' :
                            'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="quoted">Quoted</option>
                          <option value="converted">Converted</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(quote.created_at)}</td>
                      <td className="px-4 py-3">
                        <button className="p-1 rounded hover:bg-slate-100" title="View Details">
                          <Eye className="h-4 w-4 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {quotes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No quotes yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contacts Table */}
        {activeTab === 'contacts' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Service</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Message</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{contact.name}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{contact.email}</p>
                        {contact.phone && <p className="text-sm text-slate-500">{contact.phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{contact.service || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{contact.message}</td>
                      <td className="px-4 py-3">
                        <select
                          value={contact.status}
                          onChange={(e) => updateStatus('contacts', contact.id, e.target.value)}
                          className={`text-sm rounded-lg px-2 py-1 border ${
                            contact.status === 'new' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            contact.status === 'contacted' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            'bg-green-50 border-green-200 text-green-700'
                          }`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(contact.created_at)}</td>
                    </tr>
                  ))}
                  {contacts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No contacts yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Abandoned Carts Table */}
        {activeTab === 'abandoned' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Items</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Captured</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {abandoned.map((cart) => (
                    <tr key={cart.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{cart.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {Array.isArray(cart.items) ? cart.items.length : 0} items
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(cart.captured_at)}</td>
                      <td className="px-4 py-3">
                        {cart.recovered ? (
                          <span className="inline-flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" /> Recovered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                            <Clock className="h-4 w-4" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!cart.recovered && (
                          <button
                            onClick={() => updateStatus('abandoned_carts', cart.id, 'recovered')}
                            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                          >
                            Mark Recovered
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {abandoned.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No abandoned carts yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Exit Captures Table */}
        {activeTab === 'exit' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Page</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Captured</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exitCaptures.map((capture) => (
                    <tr key={capture.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{capture.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                        {capture.page_url || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(capture.created_at)}</td>
                    </tr>
                  ))}
                  {exitCaptures.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                        No exit captures yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
