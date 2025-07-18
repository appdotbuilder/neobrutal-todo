
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a todo with all fields', async () => {
    // Create a todo first
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createdTodo[0].id;

    const input: UpdateTodoInput = {
      id: todoId,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true
    };

    const result = await updateTodo(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(todoId);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Updated description');
    expect(result!.completed).toEqual(true);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create a todo first
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createdTodo[0].id;
    const originalCreatedAt = createdTodo[0].created_at;

    const input: UpdateTodoInput = {
      id: todoId,
      title: 'Updated Title Only'
    };

    const result = await updateTodo(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(todoId);
    expect(result!.title).toEqual('Updated Title Only');
    expect(result!.description).toEqual('Original description'); // Should remain unchanged
    expect(result!.completed).toEqual(false); // Should remain unchanged
    expect(result!.created_at).toEqual(originalCreatedAt);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description update', async () => {
    // Create a todo with description
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createdTodo[0].id;

    const input: UpdateTodoInput = {
      id: todoId,
      description: null
    };

    const result = await updateTodo(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(todoId);
    expect(result!.title).toEqual('Original Title'); // Should remain unchanged
    expect(result!.description).toBeNull(); // Should be updated to null
    expect(result!.completed).toEqual(false); // Should remain unchanged
  });

  it('should return null for non-existent todo', async () => {
    const input: UpdateTodoInput = {
      id: 999999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateTodo(input);

    expect(result).toBeNull();
  });

  it('should save updates to database', async () => {
    // Create a todo first
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createdTodo[0].id;

    const input: UpdateTodoInput = {
      id: todoId,
      title: 'Updated Title',
      completed: true
    };

    await updateTodo(input);

    // Verify the update was saved to database
    const savedTodo = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(savedTodo).toHaveLength(1);
    expect(savedTodo[0].title).toEqual('Updated Title');
    expect(savedTodo[0].description).toEqual('Original description');
    expect(savedTodo[0].completed).toEqual(true);
    expect(savedTodo[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update completed status to false', async () => {
    // Create a completed todo
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'This is done',
        completed: true
      })
      .returning()
      .execute();

    const todoId = createdTodo[0].id;

    const input: UpdateTodoInput = {
      id: todoId,
      completed: false
    };

    const result = await updateTodo(input);

    expect(result).toBeDefined();
    expect(result!.completed).toEqual(false);
    expect(result!.title).toEqual('Completed Todo'); // Should remain unchanged
    expect(result!.description).toEqual('This is done'); // Should remain unchanged
  });
});
