
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTodo = async (input: UpdateTodoInput): Promise<Todo | null> => {
  try {
    // First check if todo exists
    const existing = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, input.id))
      .limit(1)
      .execute();

    if (existing.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof todosTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.completed !== undefined) {
      updateData.completed = input.completed;
    }

    // Update the todo
    const result = await db.update(todosTable)
      .set(updateData)
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Todo update failed:', error);
    throw error;
  }
};
