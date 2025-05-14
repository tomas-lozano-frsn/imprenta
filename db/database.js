const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

// Si querés ejecutar algo al inicio, usá directamente db.exec()
db.exec(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    color TEXT,
    stock INTEGER
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

module.exports = db;


 /* // Insertar productos si no existen
  const colores = ['rojo', 'azul', 'verde'];
  const precio = 1000;
  colores.forEach(color => {
    db.run(`INSERT OR IGNORE INTO productos (id, color, precio, stock) VALUES (
      (SELECT id FROM productos WHERE color = ?), ?, ?, COALESCE((SELECT stock FROM productos WHERE color = ?), 0)
    )`, [color, color, precio, color]);
  });
});

module.exports = db; */

