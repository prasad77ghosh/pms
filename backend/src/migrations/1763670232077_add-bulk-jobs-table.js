/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */

exports.up = (pgm) => {
  pgm.createTable("bulk_jobs", {
    job_id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    file_name: {
      type: "text",
      notNull: true,
    },

    total_chunks: {
      type: "integer",
      notNull: true,
      check: "total_chunks > 0",
    },

    status: {
      type: "varchar(40)",
      notNull: true,
      default: "pending", // pending | processing | completed | completed_with_errors | failed
    },

    created_by: {
      type: "uuid",
      notNull: false,
    },

    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createIndex("bulk_jobs", ["status"]);
  pgm.createIndex("bulk_jobs", ["created_at"]);
};

exports.down = (pgm) => {
  pgm.dropTable("bulk_jobs");
};
