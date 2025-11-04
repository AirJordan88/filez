import db from "#db/client";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
  // Clear any existing rows (order matters due to foreign key)
  await db.query("DELETE FROM files");
  await db.query("DELETE FROM folders");

  // Insert 3 folders
  const folderNames = ["Projects", "Pictures", "Documents"];
  const folderRows = [];
  for (const name of folderNames) {
    const { rows } = await db.query(
      `INSERT INTO folders (name) VALUES ($1) RETURNING *`,
      [name]
    );
    folderRows.push(rows[0]);
  }

  // For each folder, insert at least 5 files
  const makeFilesFor = (folder, base) => [
    { name: `${base}-alpha.txt`, size: 1234 },
    { name: `${base}-bravo.txt`, size: 2048 },
    { name: `${base}-charlie.txt`, size: 4096 },
    { name: `${base}-delta.txt`, size: 8192 },
    { name: `${base}-echo.txt`, size: 16384 },
  ];

  const bases = ["proj", "pic", "doc"];

  for (let i = 0; i < folderRows.length; i++) {
    const folder = folderRows[i];
    const files = makeFilesFor(folder, bases[i]);

    for (const f of files) {
      await db.query(
        `
        INSERT INTO files (name, size, folder_id)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [f.name, f.size, folder.id]
      );
    }
  }
}
