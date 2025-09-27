import React, { useState, useEffect } from 'react';
import { Plus, Search, CheckCircle2, Circle, Edit3, Trash2, User, Lock, Mail, Eye, EyeOff, LogOut, Save, X, Settings, AlertCircle } from 'lucide-react';

const TodoApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  const [todos, setTodos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:8000');

  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: ''
  });

  const priorities = ['low', 'medium', 'high', 'urgent'];
  const categories = ['Work', 'Personal', 'Shopping', 'Health', 'Learning'];

  const API_CONFIG = {
    BASE_URL: 'http://localhost:8000'
  };

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError('');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'demo@example.com' && password === 'password') {
      const userData = { id: 1, name: 'Demo User', email: email };
      setUser(userData);
      setIsAuthenticated(true);
      setShowLogin(false);
    } else {
      setAuthError('Invalid credentials. Try demo@example.com / password');
    }
    
    setAuthLoading(false);
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    setAuthLoading(true);
    setAuthError('');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userData = { id: Date.now(), name: name, email: email };
    setUser(userData);
    setIsAuthenticated(true);
    setShowLogin(false);
    
    setAuthLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setShowLogin(true);
    setTodos([]);
    setAuthForm({ email: '', password: '', confirmPassword: '', name: '' });
  };

  useEffect(() => {
    if (isAuthenticated) {
      const mockTodos = [
        {
          id: 1,
          title: "Buy groceries",
          description: "Milk, Bread, Eggs",
          completed: false,
          priority: "medium",
          category: "Shopping"
        },
        {
          id: 2, 
          title: "Finish project report",
          description: "Complete the final draft",
          completed: false,
          priority: "high",
          category: "Work"
        },
        {
          id: 3,
          title: "Exercise",
          description: "30 minutes cardio", 
          completed: true,
          priority: "low",
          category: "Health"
        }
      ];
      setTodos(mockTodos);
    }
  }, [isAuthenticated]);

  const filteredTodos = todos.filter(todo =>
    todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addTodo = () => {
    if (!newTodo.title.trim()) return;
    
    const todo = {
      id: Date.now(),
      ...newTodo,
      completed: false
    };
    
    setTodos([...todos, todo]);
    setNewTodo({ title: '', description: '', priority: 'medium', category: '' });
    setShowAddForm(false);
  };

  const updateTodo = (id: number, updates: any) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, ...updates } : todo));
    setEditingTodo(null);
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const toggleComplete = (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      updateTodo(id, { completed: !todo.completed });
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-green-600 bg-green-50',
      medium: 'text-yellow-600 bg-yellow-50', 
      high: 'text-orange-600 bg-orange-50',
      urgent: 'text-red-600 bg-red-50'
    };
    return colors[priority] || colors.medium;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const SettingsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">API Settings</h3>
          <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Base URL</label>
            <input
              type="url"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="http://localhost:8000/todo/api"
            />
            <p className="text-xs text-gray-500 mt-1">Change this to point to your backend API</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowSettings(false);
                if (isAuthenticated) {
                  // loadTodos();
                }
              }}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save & Test Connection
            </button>
            <button
              onClick={() => {
                setApiBaseUrl(API_CONFIG.BASE_URL);
                setShowSettings(false);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const TodoItem = ({ todo }: { todo: any }) => (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${todo.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => toggleComplete(todo.id)}
          className="mt-1 text-blue-500 hover:text-blue-600 transition-colors"
        >
          {todo.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </button>
        
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {todo.title}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => setEditingTodo(todo)}
                className="text-gray-400 hover:text-blue-500 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {todo.description && (
            <p className="text-sm text-gray-600 mt-1">{todo.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(todo.priority)}`}>
              {todo.priority}
            </span>
            {todo.category && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {todo.category}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const TodoForm = ({ todo, onSave, onCancel }: { todo?: any, onSave: (data: any) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState(todo || {
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      category: ''
    });

    const handleSubmit = () => {
      if (!formData.title.trim()) return;
      onSave(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
        <div className="bg-white w-full sm:w-96 sm:rounded-lg max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {todo ? 'Edit Todo' : 'Add New Todo'}
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter todo title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {priorities.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Category"
                  list="categories-list"
                />
                <datalist id="categories-list">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {todo ? 'Update' : 'Add'} Todo
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LoginForm = ({ isSignup, onToggle, onSubmit }: { isSignup: boolean, onToggle: () => void, onSubmit: (...args: any[]) => void }) => {
    const handleSubmit = () => {
      setAuthError('');
      
      if (!authForm.email || !authForm.password) {
        setAuthError('Please fill in all required fields');
        return;
      }
      
      if (isSignup) {
        if (!authForm.name) {
          setAuthError('Name is required');
          return;
        }
        if (authForm.password !== authForm.confirmPassword) {
          setAuthError('Passwords do not match');
          return;
        }
        if (authForm.password.length < 6) {
          setAuthError('Password must be at least 6 characters');
          return;
        }
        onSubmit(authForm.name, authForm.email, authForm.password);
      } else {
        onSubmit(authForm.email, authForm.password);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Todos</h1>
            <p className="text-gray-600">
              {isSignup ? 'Create your account' : 'Welcome back! Please sign in'}
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {authError}
            </div>
          )}

          <div className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={authLoading}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  {isSignup ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isSignup ? 'Create Account' : 'Sign In'
              )}
            </button>

            {!isSignup && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800 mb-2">Demo Credentials:</p>
                <p className="text-sm text-blue-700">Email: demo@example.com</p>
                <p className="text-sm text-blue-700">Password: password</p>
              </div>
            )}

            <div className="text-center pt-4">
              <span className="text-gray-600">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}
              </span>
              <button
                onClick={onToggle}
                className="ml-2 text-blue-500 hover:text-blue-600 font-medium"
              >
                {isSignup ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <LoginForm
        isSignup={!showLogin}
        onToggle={() => setShowLogin(!showLogin)}
        onSubmit={showLogin ? handleLogin : handleSignup}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Smart Todos</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 mr-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-sm text-gray-600 hidden sm:block">
                  {user?.name || 'User'}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                title="API Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* API Error Display */}
          {apiError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <div>
                  <p className="text-sm text-red-700">API Error: {apiError}</p>
                  <button
                    onClick={() => setApiError('')}
                    className="text-xs text-red-600 hover:text-red-800 underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search todos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Circle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No todos found</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first todo</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Todo
              </button>
            </div>
          ) : (
            filteredTodos.map(todo => (
              <TodoItem key={todo.id} todo={todo} />
            ))
          )}
        </div>
      </div>

      {showSettings && <SettingsModal />}

      {showAddForm && (
        <TodoForm
          onSave={(formData) => {
            setNewTodo(formData);
            addTodo();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingTodo && (
        <TodoForm
          todo={editingTodo}
          onSave={(formData) => updateTodo(editingTodo.id, formData)}
          onCancel={() => setEditingTodo(null)}
        />
      )}
    </div>
  );
};

export default TodoApp;
