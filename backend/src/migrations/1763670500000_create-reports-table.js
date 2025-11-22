/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.createTable("reports", {
        id: {
            type: "uuid",
            primaryKey: true,
        },
        status: {
            type: "varchar(50)",
            default: "pending",
        },
        file_path: {
            type: "text",
        },
        created_by: {
            type: "uuid",
        },
        created_at: {
            type: "timestamp",
            default: pgm.func("NOW()"),
        },
        completed_at: {
            type: "timestamp",
        },
        error: {
            type: "text",
        },
    });
};

exports.down = (pgm) => {
    pgm.dropTable("reports");
};
