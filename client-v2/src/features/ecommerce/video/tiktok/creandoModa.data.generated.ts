/** AUTO-GENERADO — npm run export:creando-moda-video */
/* eslint-disable */

export const GENERATED_AT = "2026-08-19T19:52:02.587Z";
export const SOURCE = "https://www.horycore.online/api/ecommerce/store/textiles_creando_moda";

export type CreandoModaTonalidad = { hex: string; nombre: string };

export type CreandoModaCropRegion = { objectPosition: string; scale: number };

export type CreandoModaProduct = {
  id_producto: number;
  sku: string | null;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  priceLabel: string;
  stock: number;
  featured: boolean;
  story: boolean;
  image: string;
  images: string[];
  tallas: string[];
  tonalidad: CreandoModaTonalidad[];
  objectPosition?: string;
  cropRegions?: { full: CreandoModaCropRegion; detail: CreandoModaCropRegion; texture: CreandoModaCropRegion };
};

export const BRAND = {
  "name": "TEXTILES CREANDO MODA S.A.C.",
  "slug": "textiles_creando_moda",
  "storeUrl": "https://www.horycore.online/tienda/textiles_creando_moda",
  "logoUrl": "https://ik.imagekit.io/xlt7xuc7y/logos/logo_2_t20phIoH3.png",
  "whatsappViaStore": true,
  "accent": "#BE185D",
  "bg": "#FAF7F5",
  "ink": "#1C1917",
  "priceFrom": "S/ 40.00",
  "priceTo": "S/ 80.00",
  "heroHeadline": "Nueva temporada femenina",
  "heroTagline": "Vestidos, blusas y denim listos para tu vitrina.",
  "tagline": "Moda que habla de ti.",
  "concept": "Tu estilo empieza aquí.",
  "trust": {
    "envio": "Envío Lima",
    "pago": "Mercado Pago",
    "soporte": "WhatsApp en la tienda"
  }
} as const;

export const PRODUCTS: CreandoModaProduct[] = [
  {
    "id_producto": 78,
    "sku": null,
    "name": "Bagge jeans",
    "description": null,
    "category": "Pantalon jeans",
    "price": 70,
    "priceLabel": "S/ 70.00",
    "stock": 62,
    "featured": false,
    "story": false,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_78_1786666968369_PDYFHOeny.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_78_1786666968369_PDYFHOeny.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#5e86c1",
        "nombre": "Intermedio"
      },
      {
        "hex": "#8b5a2b",
        "nombre": "Madera"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 74,
    "sku": null,
    "name": "Blusa Manga Larga Lino",
    "description": null,
    "category": "Casaca",
    "price": 45,
    "priceLabel": "S/ 45.00",
    "stock": 55,
    "featured": false,
    "story": false,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_74_1786667120614_Hzwasvmo7u.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_74_1786667120614_Hzwasvmo7u.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#ff0000",
        "nombre": "Rojo"
      },
      {
        "hex": "#191970",
        "nombre": "Azul noche"
      },
      {
        "hex": "#f4c2c2",
        "nombre": "Palo rosa"
      },
      {
        "hex": "#87ceeb",
        "nombre": "Celeste"
      },
      {
        "hex": "#000000",
        "nombre": "Negro"
      },
      {
        "hex": "#b0e0e6",
        "nombre": "Celeste clarito"
      },
      {
        "hex": "#4682b4",
        "nombre": "Celeste oscuro"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 73,
    "sku": null,
    "name": "Casaca Rigida Jeans",
    "description": null,
    "category": "Casaca",
    "price": 70,
    "priceLabel": "S/ 70.00",
    "stock": 55,
    "featured": false,
    "story": false,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_73_1786667234189_2G3OGIQ-s.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_73_1786667234189_2G3OGIQ-s.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#0047ab",
        "nombre": "Azul"
      },
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#5e86c1",
        "nombre": "Intermedio"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 66,
    "sku": null,
    "name": "Palazo Color Drill",
    "description": null,
    "category": "Pantalon jeans",
    "price": 70,
    "priceLabel": "S/ 70.00",
    "stock": 208,
    "featured": false,
    "story": false,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_66_1786664686532_H3XGaWAgB.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_66_1786664686532_H3XGaWAgB.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#0047ab",
        "nombre": "Azul"
      },
      {
        "hex": "#87ceeb",
        "nombre": "Celeste"
      },
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#8b5a2b",
        "nombre": "Madera"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 65,
    "sku": null,
    "name": "Palazo Dasha",
    "description": null,
    "category": "Pantalon jeans",
    "price": 70,
    "priceLabel": "S/ 70.00",
    "stock": 62,
    "featured": false,
    "story": false,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_65_1786664489526_Z_EtETekF.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_65_1786664489526_Z_EtETekF.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#0047ab",
        "nombre": "Azul"
      },
      {
        "hex": "#87ceeb",
        "nombre": "Celeste"
      },
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#8b5a2b",
        "nombre": "Madera"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 64,
    "sku": null,
    "name": "Palazo Petit Bellboy",
    "description": null,
    "category": "Pantalon jeans",
    "price": 80,
    "priceLabel": "S/ 80.00",
    "stock": 59,
    "featured": false,
    "story": false,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_64_1786662994247_fNscyTeO6.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_64_1786662994247_fNscyTeO6.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#0047ab",
        "nombre": "Azul"
      },
      {
        "hex": "#87ceeb",
        "nombre": "Celeste"
      },
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#8b5a2b",
        "nombre": "Madera"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 61,
    "sku": null,
    "name": "Palazo Petit Clasico",
    "description": null,
    "category": "Pantalon Jeans",
    "price": 70,
    "priceLabel": "S/ 70.00",
    "stock": 113,
    "featured": false,
    "story": true,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_61_1786662200209_b8MYHfhtv.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_61_1786662200209_b8MYHfhtv.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#0047ab",
        "nombre": "Azul"
      },
      {
        "hex": "#87ceeb",
        "nombre": "Celeste"
      },
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#8b5a2b",
        "nombre": "Madera"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 62,
    "sku": null,
    "name": "Palazo Petit Kataleya",
    "description": null,
    "category": "Pantalon Jeans",
    "price": 70,
    "priceLabel": "S/ 70.00",
    "stock": 79,
    "featured": false,
    "story": true,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_62_1786492016548_wOMckh7dE.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_62_1786492016548_wOMckh7dE.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#0047ab",
        "nombre": "Azul"
      },
      {
        "hex": "#87ceeb",
        "nombre": "Celeste"
      },
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#8b5a2b",
        "nombre": "Madera"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 63,
    "sku": null,
    "name": "Palazo Petit Zahori",
    "description": null,
    "category": "Pantalon Jeans",
    "price": 70,
    "priceLabel": "S/ 70.00",
    "stock": 76,
    "featured": false,
    "story": false,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_63_1786662802254_V3ReFWY5L.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_63_1786662802254_V3ReFWY5L.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#0047ab",
        "nombre": "Azul"
      },
      {
        "hex": "#87ceeb",
        "nombre": "Celeste"
      },
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#8b5a2b",
        "nombre": "Madera"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 77,
    "sku": null,
    "name": "Pan. Freshterry jeans",
    "description": null,
    "category": "Pantalon jeans",
    "price": 70,
    "priceLabel": "S/ 70.00",
    "stock": 308,
    "featured": false,
    "story": false,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_77_1786666530317_4WeImW2xV.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_77_1786666530317_4WeImW2xV.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#0047ab",
        "nombre": "Azul"
      },
      {
        "hex": "#87ceeb",
        "nombre": "Celeste"
      },
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#8b5a2b",
        "nombre": "Madera"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 68,
    "sku": null,
    "name": "Pan. Sirena tres botones",
    "description": "Marca: Tormenta",
    "category": "Pantalon jeans",
    "price": 70,
    "priceLabel": "S/ 70.00",
    "stock": 121,
    "featured": false,
    "story": false,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_68_1786665159088_I28rwQ0qX.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_68_1786665159088_I28rwQ0qX.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#0047ab",
        "nombre": "Azul"
      },
      {
        "hex": "#87ceeb",
        "nombre": "Celeste"
      },
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#8b5a2b",
        "nombre": "Madera"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 75,
    "sku": null,
    "name": "Pan. Tres botones jeans",
    "description": null,
    "category": "Pantalon jeans",
    "price": 65,
    "priceLabel": "S/ 65.00",
    "stock": 414,
    "featured": false,
    "story": false,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_75_1786666818036_fYTdN13le.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_75_1786666818036_fYTdN13le.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#0047ab",
        "nombre": "Azul"
      },
      {
        "hex": "#87ceeb",
        "nombre": "Celeste"
      },
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#8b5a2b",
        "nombre": "Madera"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 71,
    "sku": null,
    "name": "Short Cameron Jeans",
    "description": null,
    "category": "Short",
    "price": 40,
    "priceLabel": "S/ 40.00",
    "stock": 113,
    "featured": false,
    "story": false,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_71_1786667569227_N_0ADOl5e.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_71_1786667569227_N_0ADOl5e.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#0047ab",
        "nombre": "Azul"
      },
      {
        "hex": "#87ceeb",
        "nombre": "Celeste"
      },
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#8b5a2b",
        "nombre": "Madera"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 72,
    "sku": null,
    "name": "Short Jeans Rigido",
    "description": null,
    "category": "Short",
    "price": 40,
    "priceLabel": "S/ 40.00",
    "stock": 154,
    "featured": false,
    "story": false,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_72_1786667393152_ZAierzBLf.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_72_1786667393152_ZAierzBLf.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#0047ab",
        "nombre": "Azul"
      },
      {
        "hex": "#87ceeb",
        "nombre": "Celeste"
      },
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#8b5a2b",
        "nombre": "Madera"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 69,
    "sku": null,
    "name": "Sirena con tapa clasica",
    "description": null,
    "category": "Pantalon jeans",
    "price": 70,
    "priceLabel": "S/ 70.00",
    "stock": 189,
    "featured": false,
    "story": false,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_69_1786665562193_JyiWLfHLB.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_69_1786665562193_JyiWLfHLB.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#0047ab",
        "nombre": "Azul"
      },
      {
        "hex": "#87ceeb",
        "nombre": "Celeste"
      },
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#8b5a2b",
        "nombre": "Madera"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 67,
    "sku": null,
    "name": "Sirena de un boton clasico",
    "description": "Marca: Tormenta",
    "category": "Pantalon jeans",
    "price": 70,
    "priceLabel": "S/ 70.00",
    "stock": 78,
    "featured": false,
    "story": false,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_67_1786664979874_XnRbEQxgX.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_67_1786664979874_XnRbEQxgX.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#0047ab",
        "nombre": "Azul"
      },
      {
        "hex": "#87ceeb",
        "nombre": "Celeste"
      },
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#8b5a2b",
        "nombre": "Madera"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  },
  {
    "id_producto": 70,
    "sku": null,
    "name": "Torero Jeans",
    "description": "Marca: Tormenta",
    "category": "Torero",
    "price": 50,
    "priceLabel": "S/ 50.00",
    "stock": 183,
    "featured": true,
    "story": false,
    "image": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_70_1786667707840_8rGOyBMbP.jpg",
    "images": [
      "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_70_1786667707840_8rGOyBMbP.jpg"
    ],
    "tallas": [
      "28",
      "30",
      "32",
      "34"
    ],
    "tonalidad": [
      {
        "hex": "#0047ab",
        "nombre": "Azul"
      },
      {
        "hex": "#87ceeb",
        "nombre": "Celeste"
      },
      {
        "hex": "#e0ffff",
        "nombre": "Hielo"
      },
      {
        "hex": "#8b5a2b",
        "nombre": "Madera"
      }
    ],
    "objectPosition": "50% 35%",
    "cropRegions": {
      "full": {
        "objectPosition": "50% 35%",
        "scale": 1.08
      },
      "detail": {
        "objectPosition": "50% 62%",
        "scale": 1.45
      },
      "texture": {
        "objectPosition": "50% 48%",
        "scale": 1.7
      }
    }
  }
];

export const CATEGORIES: string[] = [
  "Casaca",
  "Pantalon jeans",
  "Pantalon Jeans",
  "Short",
  "Torero"
];

export const SCENE_PICKS = {
  "banner": "https://ik.imagekit.io/xlt7xuc7y/ecommerce/1/ecom_61_1786662200209_b8MYHfhtv.jpg",
  "impact": [
    78,
    74,
    71,
    70,
    73,
    66
  ],
  "editorial": {
    "hero": 70,
    "secondary": [
      78,
      74
    ]
  },
  "cinematic": 61,
  "storefront": 70
} as const;

export const SCENE_PICKS_V2 = {
  "hook": 61,
  "collection": [
    78,
    74,
    71
  ],
  "productHero": 70,
  "catalogScroll": [
    78,
    74,
    73
  ],
  "experience": 61,
  "overlay": {
    "background": 61,
    "card": 70
  }
} as const;
