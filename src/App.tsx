import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  ShoppingBag, 
  Store, 
  Video, 
  Settings, 
  Plus, 
  Import, 
  Zap, 
  PlusCircle, 
  Search,
  ExternalLink,
  ChevronRight,
  User,
  LogOut,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { auth, signIn, signOut, db, handleFirestoreError, OperationType } from './services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { enhanceProduct, generateAdScript } from './services/geminiService';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, id, active, onClick }: { icon: any, label: string, id: string, active: boolean, onClick: (id: any) => void }) => (
  <button
    id={`sidebar-item-${id}`}
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </button>
);

// --- Main Application ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<'find' | 'stores' | 'ads' | 'settings'>('find');
  const [stores, setStores] = useState<any[]>([]);
  const [importedProducts, setImportedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<'unauthorized-domain' | 'other' | null>(null);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signIn();
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setAuthError('unauthorized-domain');
      } else {
        setAuthError('other');
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const storesQuery = query(collection(db, 'stores'), where('ownerId', '==', user.uid));
    const unsubStores = onSnapshot(storesQuery, 
      (snapshot) => setStores(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'stores')
    );

    const productsQuery = query(collection(db, 'products'), where('ownerId', '==', user.uid));
    const unsubProducts = onSnapshot(productsQuery, 
      (snapshot) => setImportedProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'products')
    );

    return () => { unsubStores(); unsubProducts(); };
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium font-sans">Booting HypedSync...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex bg-white font-sans overflow-hidden">
        {/* Left: Design/Marketing */}
        <div className="hidden lg:flex w-1/2 bg-indigo-600 items-center justify-center p-12 relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="grid grid-cols-8 gap-4 rotate-12 scale-150">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="w-full aspect-square border border-white" />
              ))}
            </div>
          </div>
          <div className="max-w-md relative z-10">
            <h1 className="text-6xl font-bold text-white mb-6 tracking-tight leading-none">Import. Enhance. Sell.</h1>
            <p className="text-indigo-100 text-xl font-light mb-8">
              The only AI-powered dashboard designed for drop-shippers. Automated SEO, high-converting copy, and viral UGC scripts in one click.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-indigo-200">
                <CheckCircle2 className="w-6 h-6" />
                <span className="text-lg">Multi-Store Shopify Core</span>
              </div>
              <div className="flex items-center gap-3 text-indigo-200">
                <Zap className="w-6 h-6 fill-current" />
                <span className="text-lg">Gemini AI Product Enhancer</span>
              </div>
              <div className="flex items-center gap-3 text-indigo-200">
                <Video className="w-6 h-6" />
                <span className="text-lg">UGC Video Ad Script Engine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Login */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
          <div className="max-w-md w-full">
            <div className="mb-12">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-200">
                <ShoppingBag className="text-white w-8 h-8" />
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-2">Welcome to HypedSync</h2>
              <p className="text-slate-500">Sign in to start scaling your stores.</p>
            </div>
            
            <button
              id="login-button"
              onClick={handleSignIn}
              className="w-full flex items-center justify-center gap-4 bg-white border border-slate-200 hover:border-indigo-600 hover:shadow-md py-4 px-6 rounded-2xl text-slate-700 font-semibold transition-all duration-300 transform active:scale-[0.98]"
            >
              <img src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" alt="Google" className="w-6 h-6" />
              Sign in with Google
            </button>

            {authError === 'unauthorized-domain' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl space-y-4"
              >
                <div className="flex items-center gap-2 text-amber-800 font-bold">
                  <AlertCircle className="w-5 h-5" />
                  <span>Setup Required</span>
                </div>
                <p className="text-sm text-amber-900 leading-relaxed">
                  Firebase needs your authorization for these preview domains. Please add them to your <strong>Authorized Domains</strong> in the Firebase Console:
                </p>
                <div className="bg-white/50 p-3 rounded-lg space-y-2 border border-amber-100">
                  <code className="block text-[10px] break-all text-slate-600 font-mono">ais-dev-g5ivzdhiwmo7uq6bmbwr73-181873511000.europe-west2.run.app</code>
                  <code className="block text-[10px] break-all text-slate-600 font-mono">ais-pre-g5ivzdhiwmo7uq6bmbwr73-181873511000.europe-west2.run.app</code>
                </div>
                <a 
                  href="https://console.firebase.google.com/project/gen-lang-client-0473626092/authentication/settings" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl text-xs font-bold transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Firebase Console
                </a>
              </motion.div>
            )}
            <p className="mt-8 text-center text-slate-400 text-sm">
              Securely powered by Firebase Enterprise
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F9FAFB] overflow-hidden text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">H</div>
            <span className="text-xl font-semibold tracking-tight">HypedSync</span>
          </div>
          
          <nav className="space-y-1">
            <button 
              id="nav-find"
              onClick={() => setActiveTab('find')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                activeTab === 'find' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Search className="w-5 h-5" />
              <span className="text-sm font-medium">Find Products</span>
            </button>
            <button 
              id="nav-stores"
              onClick={() => setActiveTab('stores')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                activeTab === 'stores' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Store className="w-5 h-5" />
              <span className="text-sm font-medium">My Stores</span>
            </button>
            <button 
              id="nav-ads"
              onClick={() => setActiveTab('ads')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors group relative ${
                activeTab === 'ads' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Video className="w-5 h-5" />
              <span className="text-sm font-medium">Ad Studio</span>
              <span className="ml-auto bg-indigo-100 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">AI</span>
            </button>
            <button 
              id="nav-settings"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <img 
              src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} 
              className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300"
              alt="Avatar"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">{user.displayName}</span>
              <span className="text-xs text-slate-400">Pro Plan</span>
            </div>
            <button 
              id="logout-btn"
              onClick={signOut}
              className="ml-auto p-1.5 text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-500 font-medium">Store:</label>
            <select 
              className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
              defaultValue={stores[0]?.id || ""}
            >
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              {stores.length === 0 && <option disabled>No stores connected</option>}
            </select>
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setActiveTab('find')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-shadow shadow-sm"
             >
                Import New Product
             </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto px-10 py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-6xl mx-auto"
            >
              {activeTab === 'find' && (
                <FindProductsView stores={stores} user={user} importedIds={importedProducts.map(p => p.originalData.id)} />
              )}
              {activeTab === 'stores' && (
                <MyStoresView stores={stores} user={user} />
              )}
              {activeTab === 'ads' && (
                <AdStudioView products={importedProducts} user={user} />
              )}
              {activeTab === 'settings' && (
                <div id="settings-view" className="space-y-6">
                  <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
                    <p className="text-slate-500 mt-1">Manage your account and billing preferences.</p>
                  </header>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">Email Notifications</h3>
                          <p className="text-sm text-slate-400">Get alerts for new viral product finds.</p>
                        </div>
                        <div className="w-10 h-5 bg-indigo-600 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                      <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">Auto-Enhancement</h3>
                          <p className="text-sm text-slate-400">Automatically run AI optimizer on import.</p>
                        </div>
                        <div className="w-10 h-5 bg-indigo-600 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// --- View Sub-components ---

const MyStoresView = ({ stores, user }: { stores: any[], user: FirebaseUser }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', shopUrl: '', apiKey: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleAddStore = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'stores'), {
        ...newStore,
        ownerId: user.uid,
        createdAt: serverTimestamp()
      });
      setNewStore({ name: '', shopUrl: '', apiKey: '' });
      setIsAdding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'stores');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this store connection?')) {
      await deleteDoc(doc(db, 'stores', id));
    }
  };

  return (
    <div id="stores-view" className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Stores</h1>
          <p className="text-slate-500 mt-1">Connect and manage your Shopify instances.</p>
        </div>
        <button 
          id="add-store-btn"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Connect Store
        </button>
      </header>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-6"
        >
          <h2 className="text-lg font-bold text-slate-900">Configure Shopify Integration</h2>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleAddStore}>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Store Name</label>
              <input 
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="Luxe Living"
                value={newStore.name}
                onChange={e => setNewStore({...newStore, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Shopify URL</label>
              <input 
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="store.myshopify.com"
                value={newStore.shopUrl}
                onChange={e => setNewStore({...newStore, shopUrl: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin API Token</label>
              <input 
                required
                type="password"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="shpat_..."
                value={newStore.apiKey}
                onChange={e => setNewStore({...newStore, apiKey: e.target.value})}
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-slate-500 text-sm font-medium hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button 
                disabled={submitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Connecting...' : 'Validate & Save'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-500">Store Name</th>
              <th className="px-6 py-4 font-semibold text-slate-500">Platform</th>
              <th className="px-6 py-4 font-semibold text-slate-500">API Connection</th>
              <th className="px-6 py-4 font-semibold text-slate-500">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stores.map(store => (
              <tr key={store.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{store.name}</td>
                <td className="px-6 py-4">Shopify</td>
                <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                  {store.apiKey?.substring(0, 12)}...
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Connected
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(store.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-2"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {stores.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <Store className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>No stores connected yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FindProductsView = ({ stores, user, importedIds }: { stores: any[], user: FirebaseUser, importedIds: string[] }) => {
  const [importingId, setImportingId] = useState<string | null>(null);

  // Mock trending products
  const TRENDING = [
    { id: 'p1', name: 'Cloud Comfort Slides', price: '$24.99', img: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&q=80&w=400', desc: 'Ergonomic non-slip slides for ultimate indoor comfort.' },
    { id: 'p2', name: 'MagGlow Portable charger', price: '$49.99', img: 'https://images.unsplash.com/photo-1610492476579-dd23330e7058?auto=format&fit=crop&q=80&w=400', desc: 'Magnetic wireless charging with built-in ambient lighting.' },
    { id: 'p3', name: 'SonicBreeze Mini AC', price: '$34.00', img: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400', desc: 'Personal cooling system with ultrasonic mist technology.' },
    { id: 'p4', name: 'GripPro Desk Lamp', price: '$19.99', img: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=400', desc: '360° flexible LED lamp for focused nighttime work.' },
  ];

  const handleImport = async (product: any, storeId: string) => {
    if (!storeId) return alert('Select a store first!');
    setImportingId(product.id);
    try {
      const enhanced = await enhanceProduct({
        name: product.name,
        description: product.desc,
        features: ['Portable', 'Durable', 'Modern Aesthetic']
      });

      await addDoc(collection(db, 'products'), {
        ownerId: user.uid,
        storeId,
        originalData: product,
        enhancedData: enhanced,
        status: 'draft',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div id="find-view" className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Find Products</h1>
        <p className="text-slate-500 mt-1">Curated viral products ready for import.</p>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Available Trends</p>
          <h3 className="text-2xl font-bold text-slate-900">{TRENDING.length}</h3>
          <div className="flex items-center gap-1 text-emerald-500 text-xs font-medium mt-2">
            <BarChart3 className="w-3 h-3" />
            <span>Updated 2 hours ago</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Imports</p>
          <h3 className="text-2xl font-bold text-slate-900">{importedIds.length}</h3>
          <p className="text-xs text-slate-500 mt-2">Scale with confidence</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Stores</p>
          <h3 className="text-2xl font-bold text-slate-900">{stores.length}</h3>
          <p className="text-xs text-slate-500 mt-2">Across all platforms</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {TRENDING.map(p => {
          const isImported = importedIds.includes(p.id);
          return (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-black shadow-sm tracking-wider uppercase">Viral</span>
                </div>
              </div>
              <div className="p-5 flex-grow flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">{p.name}</h3>
                  <span className="text-indigo-600 font-bold text-sm">{p.price}</span>
                </div>
                
                <div className="mt-auto pt-4 flex flex-col gap-2">
                  {isImported ? (
                    <div className="w-full py-2 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-md flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-3 h-3" />
                      Imported
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select 
                        id={`store-select-${p.id}`}
                        className="w-full p-2 text-[11px] bg-slate-50 border border-slate-100 rounded-md outline-none font-medium"
                        defaultValue=""
                      >
                        <option value="" disabled>Select Destination</option>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <button 
                        onClick={(e) => {
                          const select = (e.currentTarget.previousSibling as HTMLSelectElement);
                          handleImport(p, select.value);
                        }}
                        disabled={importingId === p.id || stores.length === 0}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-slate-900 text-white font-bold text-xs rounded-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {importingId === p.id ? (
                           <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            Import to Store
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AdStudioView = ({ products, user }: { products: any[], user: FirebaseUser }) => {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adScript, setAdScript] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (type: 'tiktok' | 'facebook') => {
    if (!selectedProduct) return;
    setGenerating(true);
    try {
      const script = await generateAdScript(selectedProduct, type);
      setAdScript(script);
      
      await addDoc(collection(db, 'ads'), {
        ownerId: user.uid,
        productId: selectedProduct.id,
        type: type === 'tiktok' ? 'tiktok_script' : 'facebook_ad',
        content: script,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div id="ads-view" className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ad Studio</h1>
        <p className="text-slate-500 mt-1">Generate high-converting scripts from your products.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Product List */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Select Product</h2>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedProduct(p); setAdScript(''); }}
                className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left ${
                  selectedProduct?.id === p.id 
                    ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                  <img src={p.originalData.img} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider leading-none">AI Enhanced</div>
                  <div className="font-bold text-slate-900 truncate text-sm">{p.enhancedData.title}</div>
                </div>
              </button>
            ))}
            {products.length === 0 && (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-400 shadow-sm">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-20" />
                <p className="text-xs font-medium">No products imported yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Generator */}
        <div className="lg:col-span-8">
          {selectedProduct ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full min-h-[500px]">
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedProduct.enhancedData.title}</h2>
                  <div className="flex gap-2 mt-1">
                    {selectedProduct.enhancedData.seoKeywords.slice(0, 3).map((kw: string) => (
                      <span key={kw} className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-medium">#{kw}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => handleGenerate('tiktok')}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
                  >
                    <Video className="w-3.5 h-3.5" />
                    TikTok UGC
                  </button>
                  <button 
                     onClick={() => handleGenerate('facebook')}
                     disabled={generating}
                     className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    FB Meta Ad
                  </button>
                </div>
              </div>

              <div className="flex-1 p-8 relative overflow-y-auto">
                {generating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur z-10">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm font-bold text-indigo-600">Generating viral hook...</p>
                  </div>
                )}

                {adScript ? (
                  <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {adScript}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-40">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                      <SparklesIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Ready to script?</p>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">Choose a format above to generate a high-performing UGC script for this product.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] border border-slate-200 rounded-xl flex flex-col items-center justify-center p-12 text-center bg-white shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mb-6">
                <Video className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-400">No Product Selected</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-xs">Select a product from your imported list on the left to begin generating assets.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

