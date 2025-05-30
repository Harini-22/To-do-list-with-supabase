import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './Login'
import Register from './Register'

function TodoApp({ onLogout }) {
  const [todos, setTodos] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState('All')
  const [filterCategory, setFilterCategory] = useState('All')

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching todos:', error.message, error.details, error.hint)
    } else {
      setTodos(data)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
      const newTodo = {
        text: inputValue.trim(),
        completed: false,
        created_at: new Date().toISOString(),
        category: category
      }
      console.log('Attempting to insert todo:', newTodo)
      const { data, error } = await supabase
        .from('todos')
        .insert([newTodo])
        .select()
      if (error) {
        console.error('Error adding todo:', error.message, error.details, error.hint)
      } else {
        console.log('Todo added successfully:', data)
        setTodos([...todos, data[0]])
        setInputValue('')
        setCategory('All')
      }
    }
  }

  const toggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id)
    const { error } = await supabase
      .from('todos')
      .update({ completed: !todo.completed })
      .eq('id', id)
    if (error) {
      console.error('Error toggling todo:', error)
    } else {
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ))
    }
  }

  const deleteTodo = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
      if (error) {
        console.error('Error deleting todo:', error)
      } else {
        setTodos(todos.filter(todo => todo.id !== id))
      }
    }
  }

  const clearCompleted = async () => {
    if (window.confirm('Are you sure you want to clear all completed tasks?')) {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('completed', true)
      if (error) {
        console.error('Error clearing completed todos:', error)
      } else {
        setTodos(todos.filter(todo => !todo.completed))
      }
    }
  }

  const completedCount = todos.filter(todo => todo.completed).length
  const totalCount = todos.length

  const filteredTodos = todos.filter(todo =>
    todo.text.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterCategory === 'All' || todo.category === filterCategory)
  )

  return (
    <div className="container">
      <div className="header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Todo List</h1>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </div>
      
      <form onSubmit={handleSubmit} className="todo-form" style={{ gap: '10px' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="What needs to be done?"
          className="todo-input"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="todo-input"
        >
          <option value="All">All</option>
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
          <option value="Shopping">Shopping</option>
        </select>
        <button type="submit" className="todo-button">
          Add Task
        </button>
      </form>

      <div style={{ display: 'flex', marginTop: '10px', flexDirection: 'row', gap: '10px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search tasks..."
          className="todo-input search-input"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="todo-input"
        >
          <option value="All">All</option>
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
          <option value="Shopping">Shopping</option>
        </select>
      </div>

      {totalCount > 0 && (
        <div className="todo-stats" style={{ marginTop: '10px' }}>
          <div className="stats-text">
            {completedCount} of {totalCount} tasks completed
          </div>
          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              className="clear-completed-button"
            >
              Clear Completed
            </button>
          )}
        </div>
      )}

      <ul className="todo-list">
        {filteredTodos.map(todo => (
          <li
            key={todo.id}
            className={`todo-item ${todo.completed ? 'completed' : ''}`}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              className="todo-checkbox"
            />
            <div className="todo-content">
              <span className="todo-text">{todo.text}</span>
              <span className="todo-date">
                {new Date(todo.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <span className="todo-category">{todo.category}</span>
            </div>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="delete-button"
              aria-label="Delete todo"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {filteredTodos.length === 0 && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p>No tasks found</p>
          <p style={{ fontSize: '14px', color: '#A0AEC0' }}>Add your first task above</p>
        </div>
      )}
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    navigate('/login')
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/" element={user ? <TodoApp onLogout={handleLogout} /> : <Navigate to="/login" />} />
    </Routes>
  )
}

export default function RootApp() {
  return (
    <Router>
      <App />
    </Router>
  )
} 