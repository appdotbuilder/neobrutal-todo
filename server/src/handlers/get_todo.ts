
import { db } from '../db';
import { todosTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetTodoInput, type Todo } from '../schema';

export const getTodo = async (input: GetTodoInput): Promise<Todo | null> => {
  try {
    const result = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Get todo failed:', error);
    throw error;
  }
};
