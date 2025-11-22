/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */

exports.up = (pgm) => {
  pgm.createTable("import_errors", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    job_id: {
      type: "uuid",
      notNull: true,
      references: "bulk_jobs",
      onDelete: "cascade",
    },

    chunk_id: {
      type: "uuid",
      notNull: true,
      references: "bulk_job_chunks",
      onDelete: "cascade",
    },

    row_data: {
      type: "jsonb",
      notNull: true,
    },

    reason: {
      type: "text",
      notNull: true,
    },

    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createIndex("import_errors", ["job_id"]);
  pgm.createIndex("import_errors", ["chunk_id"]);
};

exports.down = (pgm) => {
  pgm.dropTable("import_errors");
};
