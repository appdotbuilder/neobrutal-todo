import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit, Plus, Check, X, AlertCircle } from 'lucide-react';
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating new todos
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Form state for editing existing todos
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string | null;
  }>({
    title: '',
    description: null
  });

  const loadTodos = useCallback(async () => {
    try {
      setError(null);
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
      setError('Backend is not fully implemented yet. Using demo mode.');
      // Initialize with some demo data to show the UI working
      setTodos([
        {
          id: 1,
          title: 'Learn React',
          description: 'Study React hooks and components',
          completed: false,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          title: 'Build Todo App',
          description: 'Create a Google Keep style todo application',
          completed: true,
          created_at: new Date(Date.now() - 86400000), // 1 day ago
          updated_at: new Date()
        }
      ]);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      setError(null);
      const newTodo = await trpc.createTodo.mutate(formData);
      setTodos((prev: Todo[]) => [newTodo, ...prev]);
      setFormData({ title: '', description: null });
    } catch (error) {
      console.error('Failed to create todo:', error);
      setError('Backend is not fully implemented. Creating demo todo.');
      // Create a demo todo locally to show the UI working
      const demoTodo: Todo = {
        id: Date.now(), // Use timestamp as ID for demo
        title: formData.title,
        description: formData.description,
        completed: false,
        created_at: new Date(),
        updated_at: new Date()
      };
      setTodos((prev: Todo[]) => [demoTodo, ...prev]);
      setFormData({ title: '', description: null });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      setError(null);
      const updatedTodo = await trpc.updateTodo.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      
      if (updatedTodo) {
        setTodos((prev: Todo[]) =>
          prev.map((t: Todo) => (t.id === todo.id ? updatedTodo : t))
        );
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
      setError('Backend is not fully implemented. Updating locally.');
      // Update locally for demo purposes
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => 
          t.id === todo.id 
            ? { ...t, completed: !t.completed, updated_at: new Date() }
            : t
        )
      );
    }
  };

  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditFormData({
      title: todo.title,
      description: todo.description
    });
  };

  const handleSaveEdit = async (todoId: number) => {
    if (!editFormData.title.trim()) return;

    try {
      setError(null);
      const updatedTodo = await trpc.updateTodo.mutate({
        id: todoId,
        title: editFormData.title,
        description: editFormData.description || null
      });

      if (updatedTodo) {
        setTodos((prev: Todo[]) =>
          prev.map((t: Todo) => (t.id === todoId ? updatedTodo : t))
        );
      }
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update todo:', error);
      setError('Backend is not fully implemented. Updating locally.');
      // Update locally for demo purposes
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => 
          t.id === todoId 
            ? { 
                ...t, 
                title: editFormData.title,
                description: editFormData.description || null,
                updated_at: new Date() 
              }
            : t
        )
      );
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ title: '', description: null });
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      setError(null);
      const success = await trpc.deleteTodo.mutate({ id: todoId });
      if (success) {
        setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setError('Backend is not fully implemented. Deleting locally.');
      // Delete locally for demo purposes
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-gray-800 mb-2">
            Todo
          </h1>
          <p className="text-lg text-gray-600">
            Keep track of your tasks
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <Card className="google-keep-card p-4 mb-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-800">{error}</p>
            </div>
          </Card>
        )}

        {/* Create Todo Form */}
        <Card className="google-keep-card p-6 mb-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-medium text-gray-800 mb-4">Add a new task</h2>
          <form onSubmit={handleCreateTodo} className="space-y-4">
            <div>
              <Input
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                }
                className="google-keep-input w-full"
                required
              />
            </div>
            <div>
              <Textarea
                placeholder="Add some details (optional)"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                className="google-keep-input w-full"
                rows={3}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="google-keep-button bg-green-100 hover:bg-green-200 text-green-800 focus:ring-green-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isLoading ? 'Adding...' : 'Add Task'}
            </Button>
          </form>
        </Card>

        {/* Todos List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {todos.length === 0 ? (
            <div className="col-span-full">
              <Card className="google-keep-card p-8 text-center">
                <p className="text-lg text-gray-600">
                  No tasks yet! Add one above to get started
                </p>
              </Card>
            </div>
          ) : (
            todos.map((todo: Todo) => (
              <Card
                key={todo.id}
                className={`google-keep-card p-4 ${
                  todo.completed 
                    ? 'opacity-60 bg-gray-100' 
                    : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className="flex-shrink-0 mt-1">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleComplete(todo)}
                      className="h-5 w-5 border-gray-400 data-[state=checked]:bg-emerald-400 data-[state=checked]:border-emerald-400"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {editingId === todo.id ? (
                      /* Edit Mode */
                      <div className="space-y-3">
                        <Input
                          value={editFormData.title}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditFormData((prev) => ({ ...prev, title: e.target.value }))
                          }
                          className="google-keep-input w-full text-sm"
                        />
                        <Textarea
                          value={editFormData.description || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              description: e.target.value || null
                            }))
                          }
                          className="google-keep-input w-full text-sm"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveEdit(todo.id)}
                            className="google-keep-button bg-green-100 hover:bg-green-200 text-green-800 focus:ring-green-500 px-2 py-1 text-sm"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            className="google-keep-button bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-500 px-2 py-1 text-sm"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <div>
                        <h3 className={`font-medium mb-2 ${
                          todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                        }`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className={`text-sm mb-3 ${
                            todo.completed ? 'line-through text-gray-400' : 'text-gray-600'
                          }`}>
                            {todo.description}
                          </p>
                        )}
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-400">
                            {todo.created_at.toLocaleDateString()}
                          </p>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => handleStartEdit(todo)}
                              className="google-keep-button bg-blue-100 hover:bg-blue-200 text-blue-800 focus:ring-blue-500 px-2 py-1"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="google-keep-button bg-red-100 hover:bg-red-200 text-red-800 focus:ring-red-500 px-2 py-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 p-6">
          <p className="text-sm text-gray-500">
            Simple and clean todo management
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;