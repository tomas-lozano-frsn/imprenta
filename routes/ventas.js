const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Página principal con formulario
router.get('/', (req, res) => {
  db.all('SELECT * FROM productos', (err, productos) => {
    res.render('index', { productos });
  });
});

// Registrar una venta
router.post('/vender', (req, res) => {
  const { cliente, cantidad } = req.body;
  const fecha = new Date().toISOString().split('T')[0];

  // Primero insertamos la venta (con cliente y fecha)
  db.run(`INSERT INTO ventas (fecha, cliente) VALUES (?, ?)`, [fecha, cliente], function(err) {
    if (err) {
      console.error("Error al insertar venta:", err);
      return res.send("Error al registrar venta");
    }

    const ventaId = this.lastID;

    // Ahora insertamos los detalles por cada color con cantidad > 0
    const colores = Object.keys(cantidad);

    colores.forEach(color => {
      const cant = parseInt(cantidad[color]);
      if (cant > 0) {
        // Buscar el id del producto según color
        db.get(`SELECT id FROM productos WHERE color = ?`, [color], (err, producto) => {
          if (producto) {
            const productoId = producto.id;

            // Insertar detalle de la venta
            db.run(`INSERT INTO detalle_venta (venta_id, producto_id, cantidad) VALUES (?, ?, ?)`,
              [ventaId, productoId, cant]);

            // Descontar del stock
            db.run(`UPDATE productos SET stock = stock - ? WHERE id = ?`, [cant, productoId]);
          }
        });
      }
    });

    res.redirect('/');
  });
});


//////////////////

// Ruta para mostrar la página principal con el formulario
router.get('/', (req, res) => {
  db.all('SELECT * FROM productos', (err, productos) => {
    if (err) {
      console.log("Error al obtener productos:", err);
      return res.send('Error al cargar productos');
    }

    res.render('index', { productos });
  });
});

// Ruta para mostrar los resúmenes de ventas
router.get('/resumen', (req, res) => {
  const { cliente } = req.query;
  const filtroCliente = cliente ? `AND ventas.cliente = ?` : '';

  const params = cliente ? [cliente] : [];

  db.all(`
    SELECT strftime('%Y-%m', fecha) AS mes, color, SUM(cantidad) AS total
    FROM ventas
    JOIN detalle_venta ON ventas.id = detalle_venta.venta_id
    JOIN productos ON detalle_venta.producto_id = productos.id
    WHERE fecha >= date('now', 'start of year') ${filtroCliente}
    GROUP BY mes, color
    ORDER BY mes DESC
  `, params, (err, ventasMensuales) => {
    if (err) return res.send('Error al cargar resumen mensual');

    db.all(`
      SELECT strftime('%Y', fecha) AS anio, color, SUM(cantidad) AS total
      FROM ventas
      JOIN detalle_venta ON ventas.id = detalle_venta.venta_id
      JOIN productos ON detalle_venta.producto_id = productos.id
      ${cliente ? 'WHERE ventas.cliente = ?' : ''}
      GROUP BY anio, color
      ORDER BY anio DESC
    `, params, (err, ventasAnuales) => {
      if (err) return res.send('Error al cargar resumen anual');

      res.render('resumen', { ventasMensuales, ventasAnuales, cliente });
    });
  });
});


///////

// Ruta para agregar stock
router.post('/agregar-stock', (req, res) => {
  const { color, cantidad } = req.body;
  db.run(`UPDATE productos SET stock = stock + ? WHERE color = ?`, [cantidad, color], (err) => {
    if (err) {
      console.log("Error al agregar stock:", err);
      return res.send('Error al actualizar stock');
    }
    res.redirect('/');
  });
});





module.exports = router;
