/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.addColumn("products", {
    created_by: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "SET NULL", // or "CASCADE" if you prefer
    },
  });

  // Optional index
  pgm.createIndex("products", ["created_by"]);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropIndex("products", ["created_by"]);
  pgm.dropColumn("products", "created_by");
};
