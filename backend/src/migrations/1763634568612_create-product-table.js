/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */

exports.up = (pgm) => {
  pgm.createTable("products", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    name: {
      type: "varchar(200)",
      notNull: true,
    },

    image_url: {
      type: "text",
      notNull: false,
    },

    price: {
      type: "numeric(10,2)",
      notNull: true,
      check: "price > 0",
    },

    category_id: {
      type: "uuid",
      notNull: true,
      references: "categories",
      onDelete: "cascade",
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

    deleted_at: {
      type: "timestamp",
      notNull: false,
    },
  });

  // Normal indexes
  pgm.createIndex("products", ["category_id"]);
  pgm.createIndex("products", ["price"]);
  pgm.createIndex("products", ["created_at"]);

  // Full-text search GIN index for "name"
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS products_name_tsv_idx
    ON products
    USING gin (to_tsvector('simple', name));
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS products_name_tsv_idx;`);
  pgm.dropTable("products");
};
