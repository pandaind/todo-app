import React, { useState, useEffect } from 'react';
import Header from './Header';
import FilterTabs from './FilterTabs';
import TodoList from './TodoList';
import TodoForm from './TodoForm';
import LoginForm from './LoginForm';
import SettingsModal from './SettingsModal';
import { Todo, User, AuthForm } from './types';
import { loadFromStorage, saveToStorage, getApiUrl } from './constants';

function TodoApp() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [authForm, setAuthForm] = useState<AuthForm>({
    name: '',
    email: '',
    password: ''
  });
  const [isSignup, setIsSignup] = useState(false);

  // Todos state
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  // UI state
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Settings state
  const [apiUrl, setApiUrl] = useState(() => loadFromStorage('apiUrl', 'http://localhost:8000'));
  const [apiKey, setApiKey] = useState(() => loadFromStorage('apiKey', ''));

  // Load initial data
  useEffect(() => {
    const savedUser = loadFromStorage('user', null);
    const savedTodos = loadFromStorage('todos', []);
    
    if (savedUser) {
      setUser(savedUser);
      setTodos(savedTodos);
      if (savedTodos.length === 0) {
        fetchTodos();
      }
    }
  }, []);

  // Save data when it changes
  useEffect(() => {
    if (user) {
      saveToStorage('user', user);
    }
  }, [user]);

  useEffect(() => {
    if (todos.length > 0) {
      saveToStorage('todos', todos);
    }
  }, [todos]);

  useEffect(() => {
    saveToStorage('apiUrl', apiUrl);
  }, [apiUrl]);

  useEffect(() => {
    saveToStorage('apiKey', apiKey);
  }, [apiKey]);

  // API helpers
  const makeApiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`${getApiUrl(apiUrl)}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error occurred';
      setApiError(message);
      throw error;
    }
  };

  // Authentication functions
  const handleLogin = async () => {
    if (!authForm.email || !authForm.password || (isSignup && !authForm.name)) {
      setApiError('Please fill in all required fields');
      return;
    }

    try {
      const endpoint = isSignup ? '/auth/signup' : '/auth/login';
      const userData = await makeApiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(authForm),
      });

      setUser(userData);
      setAuthForm({ name: '', email: '', password: '' });
      await fetchTodos();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setTodos([]);
    setAuthForm({ name: '', email: '', password: '' });
    localStorage.removeItem('user');
    localStorage.removeItem('todos');
  };

  // Todo CRUD operations
  const fetchTodos = async () => {
    try {
      const todosData = await makeApiCall('/todos');
      setTodos(todosData);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const handleAddTodo = () => {
    setEditingTodo(null);
    setShowTodoForm(true);
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setShowTodoForm(true);
  };

  const handleSubmitTodo = async (todoData: Partial<Todo>) => {
    try {
      if (editingTodo) {
        const updatedTodo = await makeApiCall(`/todos/${editingTodo.id}`, {
          method: 'PUT',
          body: JSON.stringify(todoData),
        });
        setTodos(todos.map(t => t.id === editingTodo.id ? updatedTodo : t));
      } else {
        const newTodo = await makeApiCall('/todos', {
          method: 'POST',
          body: JSON.stringify({ ...todoData, user_id: user?.id }),
        });
        setTodos([...todos, newTodo]);
      }
      setShowTodoForm(false);
      setEditingTodo(null);
    } catch (error) {
      console.error('Failed to save todo:', error);
    }
  };

  const handleToggleComplete = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const updatedTodo = await makeApiCall(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...todo, completed: !todo.completed }),
      });
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await makeApiCall(`/todos/${id}`, { method: 'DELETE' });
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleToggleStarred = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const updatedTodo = await makeApiCall(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...todo, starred: !todo.starred }),
      });
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to toggle starred:', error);
    }
  };

  const handleArchiveTodo = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const updatedTodo = await makeApiCall(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...todo, archived: true }),
      });
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to archive todo:', error);
    }
  };

  // Filter todos based on search query
  const filteredTodos = todos.filter(todo =>
    todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    todo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    todo.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate todo counts for filter tabs
  const todoCounts = {
    all: todos.filter(t => !t.archived).length,
    active: todos.filter(t => !t.completed && !t.archived).length,
    completed: todos.filter(t => t.completed && !t.archived).length,
    archived: todos.filter(t => t.archived).length,
  };

  // Show login form if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Smart Todos</h1>
              <p className="text-gray-600 mt-2">Your intelligent task manager</p>
            </div>
            
            <LoginForm
              authForm={authForm}
              onAuthFormChange={setAuthForm}
              onLogin={handleLogin}
              isSignup={isSignup}
              setIsSignup={setIsSignup}
            />
            
            {apiError && (
              <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-sm text-red-700">{apiError}</p>
                <button
                  onClick={() => setApiError(null)}
                  className="text-xs text-red-600 hover:text-red-800 underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main app interface
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddTodo={handleAddTodo}
        onLogout={handleLogout}
        onShowSettings={() => setShowSettings(true)}
        apiError={apiError}
        onClearApiError={() => setApiError(null)}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <FilterTabs
          currentFilter={filter}
          onFilterChange={setFilter}
          todoCounts={todoCounts}
        />

        <TodoList
          todos={filteredTodos}
          filter={filter}
          onToggleComplete={handleToggleComplete}
          onDeleteTodo={handleDeleteTodo}
          onEditTodo={handleEditTodo}
          onToggleStarred={handleToggleStarred}
          onArchiveTodo={handleArchiveTodo}
        />
      </div>

      {/* Todo Form Modal */}
      {showTodoForm && (
        <TodoForm
          isOpen={showTodoForm}
          onClose={() => {
            setShowTodoForm(false);
            setEditingTodo(null);
          }}
          onSubmit={handleSubmitTodo}
          editingTodo={editingTodo}
          apiKey={apiKey}
          apiUrl={apiUrl}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          apiUrl={apiUrl}
          apiKey={apiKey}
          onApiUrlChange={setApiUrl}
          onApiKeyChange={setApiKey}
        />
      )}
    </div>
  );
}

export default TodoApp;
