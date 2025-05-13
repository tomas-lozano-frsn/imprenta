const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/imprenta.db');

// Crear tablas si no existen
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY,
    color TEXT NOT NULL,
    precio REAL NOT NULL,
    stock INTEGER NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL
    
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS detalle_venta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER,
    producto_id INTEGER,
    cantidad INTEGER,
    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
  )`);

  // Insertar productos si no existen
  const colores = ['rojo', 'azul', 'verde'];
  const precio = 1000;
  colores.forEach(color => {
    db.run(`INSERT OR IGNORE INTO productos (id, color, precio, stock) VALUES (
      (SELECT id FROM productos WHERE color = ?), ?, ?, COALESCE((SELECT stock FROM productos WHERE color = ?), 0)
    )`, [color, color, precio, color]);
  });
});

module.exports = db;
