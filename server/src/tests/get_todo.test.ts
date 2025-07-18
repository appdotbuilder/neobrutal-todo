
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput } from '../schema';
import { getTodo } from '../handlers/get_todo';
import { eq } from 'drizzle-orm';

describe('getTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a todo by id', async () => {
    // Create a test todo first
    const testTodo = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A test todo item',
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = testTodo[0];

    const input: GetTodoInput = {
      id: createdTodo.id
    };

    const result = await getTodo(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTodo.id);
    expect(result!.title).toEqual('Test Todo');
    expect(result!.description).toEqual('A test todo item');
    expect(result!.completed).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when todo is not found', async () => {
    const input: GetTodoInput = {
      id: 999 // Non-existent ID
    };

    const result = await getTodo(input);

    expect(result).toBeNull();
  });

  it('should verify todo exists in database', async () => {
    // Create a test todo
    const testTodo = await db.insert(todosTable)
      .values({
        title: 'Database Test Todo',
        description: null,
        completed: true
      })
      .returning()
      .execute();

    const createdTodo = testTodo[0];

    const input: GetTodoInput = {
      id: createdTodo.id
    };

    const result = await getTodo(input);

    // Verify the todo exists in database
    const dbTodo = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(dbTodo).toHaveLength(1);
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(dbTodo[0].id);
    expect(result!.title).toEqual(dbTodo[0].title);
    expect(result!.description).toBeNull();
    expect(result!.completed).toEqual(true);
  });
});
