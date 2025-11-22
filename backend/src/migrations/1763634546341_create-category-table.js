/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  // Create table
  pgm.createTable("categories", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    name: {
      type: "varchar(150)",
      notNull: true,
      unique: true,
    },

    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },

    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Normal indexes
  pgm.createIndex("categories", ["name"]);
  pgm.createIndex("categories", ["created_at"]);
  pgm.createIndex("categories", ["updated_at"]);

  // Full-text search index (GIN + to_tsvector)
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS categories_name_tsv_idx
    ON categories
    USING gin (to_tsvector('simple', name));
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS categories_name_tsv_idx;`);
  pgm.dropTable("categories");
};
