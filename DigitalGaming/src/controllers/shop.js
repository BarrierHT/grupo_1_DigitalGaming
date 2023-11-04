const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ruta al archivo JSON de productos
const productsFilePath = path.join(__dirname, '../data/productos.json');

//Modelo del producto
const Product = require('../app').models.product;
const Requeriment = require('../app').models.requeriment;
const Product_category = require('../app').models.product_category;
const Product_platform = require('../app').models.product_platform;

function readProductsFile() {
  const productsData = fs.readFileSync(productsFilePath, 'utf8');
  return JSON.parse(productsData);
}

// Guardar los productos en el archivo JSON
function saveProductsToFile(products) {
  fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2), 'utf8');
}

exports.getIndex = (req, res, next) => {
  const productos = readProductsFile();

  const productosLimitados = productos.slice(0, 8);

  // console.log(productosLimitados.length);

  res.render('index.ejs', { productos: productosLimitados });
};

exports.getCart = (req, res, next) => {
  res.render('products/productCart');
};

exports.getDetailCartstandart = (req, res, next) => {
  res.render('products/productDetail-standart');
};

//* --------------------CRUD METHODS--------------------------------------//

//Trae los productos en un listado
exports.getProducts = async (req, res, next) => {
  try {
    let products = await Product.findAll();
    res.render('products/product-list', { products });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//Trae el detalle de un producto
exports.getProductDetail = async (req, res, next) => {
  try {
    const detail = await Product.findByPk(req.params.productId, {
      include: [
        {
          model: Requeriment,
          required: true,
          as: 'requeriment',
        },
      ],
    });
    res.render('products/productDetail-standart', { detail: detail });
    // res.send(detail);
    //console.log(detail.dataValues.requeriment.dataValues.os_recommended);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//Formulario de para dar alta productos
exports.getAddProduct = (req, res, next) => {
  res.render('products/addProductForm');
};

exports.postAddProduct = async (req, res, next) => {
  // Lógica para procesar y agregar un nuevo producto
  try {
    const productData = req.body;
    console.log(productData);

    let newProduct = await Product.create({});

    return res.redirect('/products');
  } catch (error) {
    console.error('error al crear el producto', error);
    return res.status(500).json({ message: 'no se completo la accion' });
  }
};

//Trae el formulario para editar un producto YA CREADO
exports.getEditProduct = (req, res, next) => {
  const productId = req.params.productId;
  // Obtener los datos del producto para editar
  const products = readProductsFile();
  const product = products.find((p) => p.id == productId.toString());

  if (!product) {
    // Manejar el caso en que el producto no se encuentra
    res.status(404).render('404');
  } else {
    res.render('products/editProductForm', { product });
  }
};

//Manda los datos del formulario a la base de datos
exports.putEditProduct = async (req, res, next) => {
  const productId = req.params.productId;
  const updatedProductData = req.body;

  try {
    const updatedFormData = {
      name: updatedProductData.nombre,
      description: updatedProductData.descripcion,
      price: parseFloat(updatedProductData.precio),
      discount: updatedProductData.descuento,
      image: updatedProductData.image,
      video: updatedProductData.video,
    };
    const [updatedRowsCount] = await Product.update(updatedFormData, {
      where: {
        id: productId,
      },
    });

    if (updatedRowsCount === 1) {
      console.log('edicion exitosa!');
      return res.redirect('products/' + productId);
    } else {
      console.log('producto no encontrado');
      return res.status(404).render('404');
    }
  } catch (error) {
    console.error('Error al editar el producto:', error);
    return res.status(500).json({ message: 'no se pudo completar la accion' });
  }
};

//Elimina el producto seleccionado por su ID
exports.deleteProduct = async (req, res, next) => {
  const productId = req.params.productId;

  try {
    await Product_category.destroy({
      where: {
        product_id: productId,
      },
    });

    await Product_platform.destroy({
      where: {
        product_id: productId,
      },
    });

    const result = await Product.destroy({
      where: {
        id: productId,
      },
    });

    if (result === 1) {
      console.log('producto eliminado');
      return res.redirect('/products');
    } else {
      console.log('no encontrado');
      return res.status(404);
    }
  } catch (error) {
    console.error('error al eliminar el producto', error);
    return res.status(500).json({ message: 'no se completo la accion' });
  }
};
