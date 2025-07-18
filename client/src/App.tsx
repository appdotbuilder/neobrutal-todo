import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit, Check, X, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-yellow-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black text-black mb-4 tracking-tight">
            TODO.APP
          </h1>
          <p className="text-xl font-bold text-gray-700">
            GET STUFF DONE
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="neobrutal-card p-4 mb-6 bg-orange-100 border-4 border-orange-500 shadow-[4px_4px_0px_0px_rgba(234,88,12,1)]">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Create Todo Form */}
        <Card className="neobrutal-card p-6 mb-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-medium text-gray-800 mb-4">Add a new task</h2>
          <form onSubmit={handleCreateTodo} className="space-y-4">
            <div>
              <Input
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                }
                className="neobrutal-input text-lg font-semibold w-full"
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
                className="neobrutal-input text-base w-full"
                rows={3}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="neobrutal-button w-full bg-green-400 hover:bg-green-500 text-black font-black text-lg"
            >
              {isLoading ? 'ADDING...' : 'ADD TASK'}
            </Button>
          </form>
        </Card>

        {/* Todos List */}
        <div className="space-y-4">
          {todos.length === 0 ? (
            <Card className="neobrutal-card p-8 bg-gray-100 text-center">
              <p className="text-lg text-gray-600">
                No tasks yet! Add one above to get started
              </p>
            </Card>
          ) : (
            todos.map((todo: Todo) => (
              <Card
                key={todo.id}
                className={`neobrutal-card p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ${
                  todo.completed ? 'bg-gray-200 opacity-75' : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className="flex-shrink-0 mt-1">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleComplete(todo)}
                      className="h-6 w-6 border-4 border-black data-[state=checked]:bg-green-400 data-[state=checked]:border-black"
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
                          className="neobrutal-input font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-full text-sm"
                        />
                        <Textarea
                          value={editFormData.description || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              description: e.target.value || null
                            }))
                          }
                          className="neobrutal-input shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-full text-sm"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveEdit(todo.id)}
                            className="neobrutal-button bg-green-400 hover:bg-green-500 text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-2 py-1 text-sm"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            className="neobrutal-button bg-gray-400 hover:bg-gray-500 text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-2 py-1 text-sm"
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
                              className="neobrutal-button bg-blue-400 hover:bg-blue-500 text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-2 py-1"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="neobrutal-button bg-red-400 hover:bg-red-500 text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-2 py-1"
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
          <p className="text-lg font-bold text-gray-600">
            Made with 🔥 and ☕
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;