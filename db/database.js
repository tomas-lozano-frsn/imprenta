const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

// Crear tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    color TEXT UNIQUE,
    stock INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT,
    cliente TEXT
  );

  CREATE TABLE IF NOT EXISTS detalle_venta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER,
    producto_id INTEGER,
    cantidad INTEGER,
    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
  );
`);

// Insertar colores si no existen (con stock 0)
const colores = ['rojo', 'azul', 'verde'];
colores.forEach(color => {
  const existe = db.prepare('SELECT 1 FROM productos WHERE color = ?').get(color);
  if (!existe) {
    db.prepare('INSERT INTO productos (color, stock) VALUES (?, ?)').run(color, 0);
    console.log(`Producto insertado: ${color}`);
  }
});

module.exports = db;
