import { pgTable, serial, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const schema = {
  chunks: pgTable('chunks', {
    id: serial('id').primaryKey(),
    book_id: text('book_id').notNull(),
    chunk_index: integer('chunk_index').notNull(),
    text: text('text').notNull(),
    embedding: jsonb('embedding').notNull(),
    embedding_vector: jsonb('embedding_vector').notNull(),
    page_number: integer('page_number'),
    created_at: timestamp('created_at').defaultNow()
  })
}; 