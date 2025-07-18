
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { getTodos } from '../handlers/get_todos';

// Test data
const testTodos: CreateTodoInput[] = [
  {
    title: 'First Todo',
    description: 'This is the first todo'
  },
  {
    title: 'Second Todo',
    description: null
  },
  {
    title: 'Third Todo',
    description: 'This is the third todo'
  }
];

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();

    expect(result).toEqual([]);
  });

  it('should return all todos', async () => {
    // Create test todos
    await db.insert(todosTable)
      .values(testTodos)
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    expect(result[0].title).toBeDefined();
    expect(result[0].description).toBeDefined();
    expect(result[0].completed).toBe(false);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return todos ordered by creation date (newest first)', async () => {
    // Create todos with small delays to ensure different timestamps
    await db.insert(todosTable)
      .values({ title: 'First Todo', description: 'First' })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({ title: 'Second Todo', description: 'Second' })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({ title: 'Third Todo', description: 'Third' })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Third Todo');
    expect(result[1].title).toEqual('Second Todo');
    expect(result[2].title).toEqual('First Todo');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle todos with null descriptions', async () => {
    await db.insert(todosTable)
      .values({ title: 'Todo with null description', description: null })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Todo with null description');
    expect(result[0].description).toBeNull();
  });
});
