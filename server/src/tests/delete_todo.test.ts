
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: DeleteTodoInput = {
  id: 1
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a todo first
    await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing'
      })
      .execute();

    // Delete the todo
    const result = await deleteTodo(testInput);

    // Should return true for successful deletion
    expect(result).toBe(true);
  });

  it('should return false for non-existent todo', async () => {
    // Try to delete a todo that doesn't exist
    const result = await deleteTodo({ id: 999 });

    // Should return false for non-existent todo
    expect(result).toBe(false);
  });

  it('should remove todo from database', async () => {
    // Create a todo first
    await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing'
      })
      .execute();

    // Delete the todo
    await deleteTodo(testInput);

    // Verify todo is removed from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, testInput.id))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should not affect other todos', async () => {
    // Create multiple todos
    await db.insert(todosTable)
      .values([
        { title: 'Todo 1', description: 'First todo' },
        { title: 'Todo 2', description: 'Second todo' }
      ])
      .execute();

    // Delete the first todo
    await deleteTodo({ id: 1 });

    // Verify only the targeted todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(1);
    expect(remainingTodos[0].title).toEqual('Todo 2');
  });
});
