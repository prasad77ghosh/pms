exports.up = (pgm) => {
  pgm.createTable("bulk_job_chunks", {
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

    chunk_index: {
      type: "integer",
      notNull: true,
      check: "chunk_index > 0",
    },

    chunk_file: {
      type: "text",
      notNull: true,
    },

    status: {
      type: "varchar(40)",
      notNull: true,
      default: "pending",
    },

    attempts: {
      type: "integer",
      notNull: true,
      default: 0,
    },

    rows: {
      type: "integer",
      notNull: true,
      default: 0,
    },

    errors: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("('[]'::jsonb)"),
    },

    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createIndex("bulk_job_chunks", ["job_id"]);
  pgm.createIndex("bulk_job_chunks", ["status"]);
  pgm.createIndex("bulk_job_chunks", ["chunk_index"]);
};

exports.down = (pgm) => {
  pgm.dropTable("bulk_job_chunks");
};
