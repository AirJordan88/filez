import express from "express";
import db from "#db/client";
const app = express();

// Body parser for JSON
app.use(express.json());

/**
 * GET /files
 * Sends array of all files with `folder_name`
 */
app.get("/files", async (req, res, next) => {
  try {
    const sql = `
      SELECT
        files.*,
        folders.name AS folder_name
      FROM files
      JOIN folders ON files.folder_id = folders.id
    `;
    const { rows } = await db.query(sql);
    res.status(200).send(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /folders
 * Sends array of all folders
 */
app.get("/folders", async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM folders`);
    res.status(200).send(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /folders/:id
 * - 404 if folder doesn't exist
 * - Sends folder + files[]
 */
app.get("/folders/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const { rows: folders } = await db.query(
      `SELECT * FROM folders WHERE id = $1`,
      [id]
    );
    if (folders.length === 0) {
      return res.sendStatus(404);
    }
    const folder = folders[0];

    const { rows: files } = await db.query(
      `SELECT * FROM files WHERE folder_id = $1`,
      [id]
    );

    res.status(200).send({ ...folder, files });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /folders/:id/files
 * - 404 if folder doesn't exist
 * - 400 if no body
 * - 400 if missing required fields
 * - Creates a file and returns it with 201
 */
app.post("/folders/:id/files", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // Check folder exists
    const { rows: folders } = await db.query(
      `SELECT * FROM folders WHERE id = $1`,
      [id]
    );
    if (folders.length === 0) {
      return res.sendStatus(404);
    }

    // Validate body
    const body = req.body;
    if (!body) return res.sendStatus(400);

    const { name, size } = body ?? {};
    if (
      typeof name !== "string" ||
      name.trim() === "" ||
      typeof size !== "number"
    ) {
      return res.sendStatus(400);
    }

    // Insert file
    const { rows } = await db.query(
      `
      INSERT INTO files (name, size, folder_id)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [name, size, id]
    );

    res.status(201).send(rows[0]);
  } catch (err) {
    // Unique constraint violations, etc. will land here.
    next(err);
  }
});

// Basic error handler to avoid hanging responses
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({ error: "Internal Server Error" });
});

export default app;
