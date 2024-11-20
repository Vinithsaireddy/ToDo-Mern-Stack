import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, ListTodo, Calendar, LogOut } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { TodoItem } from '../components/TodoItem';
import { TodoForm } from '../components/TodoForm';
import { Todo } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { AnimatedBackground } from '../components/AnimatedBackground';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export function TodoApp() {
  const { logout, userId } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const defaultCategories = ['all', 'work', 'personal', 'shopping'];
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  useEffect(() => {
    const fetchTodos = async () => {
      if (!userId) return;

      try {
        const response = await axios.get(`${API_BASE_URL}/api/todos/${userId}`);
        const mappedTodos: Todo[] = response.data.map((todo: any) => ({
          id: todo._id,
          title: todo.task,
          category: todo.category,
          priority: todo.priority,
          dueDate: new Date(todo.dueDate).toISOString().split('T')[0],
          notes: todo.notes || '',
          completed: todo.completed,
          createdAt: todo.createdAt
        }));
        setTodos(mappedTodos);
      } catch (error) {
        console.error('Error fetching todos:', error);
        toast.error('Failed to load todos');
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          logout();
        }
      }
    };

    fetchTodos();
  }, [userId]);

  const addTodo = async (todoData: Omit<Todo, 'id' | 'completed' | 'createdAt'>) => {
    try {
      if (!todoData.title.trim()) {
        toast.error('Task title is required');
        return;
      }

      if (!userId) {
        toast.error('You must be logged in to add todos');
        return;
      }

      const requestData = {
        userId,
        task: todoData.title.trim(),
        category: todoData.category || 'personal',
        priority: todoData.priority || 'medium',
        dueDate: todoData.dueDate ? new Date(todoData.dueDate).toISOString() : null,
        notes: todoData.notes?.trim() || ''
      };

      const response = await axios.post(`${API_BASE_URL}/api/todos`, requestData);

      if (response.status === 201) {
        const newTodo: Todo = {
          id: response.data._id,
          title: response.data.task,
          category: response.data.category,
          priority: response.data.priority,
          dueDate: todoData.dueDate,
          notes: response.data.notes,
          completed: false,
          createdAt: response.data.createdAt
        };

        setTodos(prevTodos => [newTodo, ...prevTodos]);
        toast.success('Task added successfully!');
      }
    } catch (error) {
      console.error('Error adding todo:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Failed to add todo: ${error.response.data.message}`);
      } else {
        toast.error('Failed to add todo: Unknown error occurred');
      }
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/todos/${id}/toggle`, {
        userId
      });
      
      if (response.status === 200) {
        setTodos(todos.map(todo =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
      toast.error('Failed to update todo status');
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/todos/${id}`, {
        data: { userId }
      });
      
      if (response.status === 200) {
        setTodos(todos.filter(todo => todo.id !== id));
        toast.custom(() => (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-lg shadow-lg"
          >
            Task deleted successfully!
          </motion.div>
        ));
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete todo');
    }
  };

  const editTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setShowForm(true);
  };

  const filteredTodos = todos
    .filter(todo => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .filter(todo => 
      todo.title.toLowerCase().includes(search.toLowerCase()) ||
      todo.category.toLowerCase().includes(search.toLowerCase())
    )
    .filter(todo => 
      categoryFilter === 'all' ? true : todo.category === categoryFilter
    );

    const categories = [...new Set(['all', ...defaultCategories, ...todos.map(todo => todo.category)])];

  return (
    <div className="min-h-screen py-4 sm:py-8 px-2 sm:px-4">
      <AnimatedBackground />
      <Toaster position="top-right" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="glass-card rounded-2xl shadow-xl p-8 mb-8">
          <motion.div 
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 sm:p-3 rounded-xl shadow-lg">
                <ListTodo size={24} className="text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text">My Tasks</h1>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-4">
              <ThemeToggle />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(true)}
                className="btn-primary px-3 sm:px-6 py-2 sm:py-3 rounded-xl flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Task</span>
                <span className="sm:hidden">Add</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="p-2 sm:p-3 hover:bg-gray-100 rounded-xl"
                title="Logout"
              >
                <LogOut size={18} className="text-gray-600" />
              </motion.button>
            </div>
          </motion.div>

          <motion.div 
            className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hidden max-[400px]:hidden sm:block" size={20} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10 max-[400px]:pl-4"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'completed')}
              className="input-field"
            >
              <option value="all">All Tasks</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </motion.div>

          <AnimatePresence mode="wait">
            {filteredTodos.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-16"
              >
                <motion.div className="float-animation">
                  <Calendar size={64} className="mx-auto text-indigo-400 mb-6" />
                </motion.div>
                <p className="text-xl text-gray-500">No tasks found</p>
              </motion.div>
            ) : (
              <motion.div 
                layout 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredTodos.map((todo, index) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TodoItem
                      todo={todo}
                      onToggle={toggleTodo}
                      onDelete={deleteTodo}
                      onEdit={editTodo}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <TodoForm
            onSubmit={(todoData) => {
              if (editingTodo) {
                // Handle edit
                const updatedTodo = {
                  ...editingTodo,
                  ...todoData
                };
                setTodos(todos.map(t => 
                  t.id === editingTodo.id ? updatedTodo : t
                ));
                toast.custom(() => (
                  <motion.div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-lg shadow-lg">
                    Task updated successfully!
                  </motion.div>
                ));
              } else {
                // Handle add
                addTodo(todoData);
              }
              setEditingTodo(null);
              setShowForm(false);
            }}
            onClose={() => {
              setShowForm(false);
              setEditingTodo(null);
            }}
            initialData={editingTodo || undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}