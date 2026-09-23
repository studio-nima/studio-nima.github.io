/*
 * Studio Nima — catálogo de proyectos
 * ------------------------------------------------------------------
 * AGREGAR UN SITIO
 *   1. Publicarlo en GitHub Pages desde la cuenta studio-nima.
 *      → Aparece solo en el portafolio (descubrimiento automático vía
 *        la API de GitHub), con vista previa en vivo y colores neutros.
 *   2. Para una ficha completa: agregar un objeto a SITES (abajo) y
 *      generar las capturas con `node tools/capture.mjs <repo>`.
 *
 * Campos
 *   repo        nombre exacto del repo en GitHub (sensible a mayúsculas)
 *   slug        va en la URL (#/slug)
 *   name        nombre comercial
 *   tagline     frase corta del cliente (cita de su propio sitio)
 *   category    tipo de negocio
 *   place       ubicación
 *   year        año de entrega
 *   description dos o tres frases sobre el proyecto
 *   deliverables lista de lo entregado
 *   theme       { bg, fg, accent } — colores de la ficha del proyecto
 *   palette     colores de marca mostrados como muestras
 *   fonts       tipografías (la primera = display, se usa en el título)
 *   shots       prefijo de las capturas en img/sites/ (-desktop, -full, -mobile)
 *               omitir → vista previa en vivo (iframe)
 */
window.NIMA = {
  github: 'studio-nima',
  // repos que nunca se muestran (el propio portafolio, pruebas…)
  exclude: ['studio-nima.github.io', 'nima-studio', 'portfolio'],
  contact: 'contact@nima-mx.com',
};

window.SITES = [
  {
    repo: 'maquiavelo',
    slug: 'maquiavelo',
    name: 'Maquiavelo',
    tagline: 'Conspiramos con café.',
    category: 'Café de especialidad & trattoria',
    place: 'Centro, Querétaro',
    year: 2026,
    description:
      'Casa de café y pizza de masa madre en pleno Centro. Un sitio de una sola página que retoma el arco del logotipo, muestra lo imprescindible de la barra y del horno, y calcula en vivo si el local está abierto según la hora de Querétaro.',
    deliverables: ['Sitio one-page', 'Horario en vivo', 'Menú destacado', 'Reservas de eventos'],
    theme: { bg: '#0a4864', fg: '#f6efe3', accent: '#e0782f' },
    palette: ['#0a4864', '#062f43', '#e0782f', '#b9503a', '#f6efe3'],
    fonts: ['Fraunces', 'Josefin Sans', 'Courier Prime'],
    shots: 'maquiavelo',
  },
  {
    repo: 'casa-flora',
    slug: 'casa-flora',
    name: 'Casa Flora',
    tagline: 'Cocina mexicana de autor con alma parisina.',
    category: 'Bistró café',
    place: 'La Pastora, Querétaro',
    year: 2026,
    description:
      'Un bistró donde la elegancia parisina se encuentra con la calidez queretana. Sitio bilingüe español / inglés, tipografía clásica y ornamentos florales dibujados a la medida, pensado para turistas y comensales locales por igual.',
    deliverables: ['Sitio bilingüe ES / EN', 'Menú', 'Galería', 'Contacto WhatsApp'],
    theme: { bg: '#1f3d2b', fg: '#faf6ee', accent: '#d5b783' },
    palette: ['#1f3d2b', '#14281d', '#b0894a', '#b5533a', '#faf6ee'],
    fonts: ['Cormorant Garamond', 'Jost'],
    shots: 'casa-flora',
  },
  {
    repo: 'don-chamorro',
    slug: 'don-chamorro',
    name: 'Don Chamorro',
    tagline: 'Taco que no cierra no es taco.',
    category: 'Taquería',
    place: 'Mercado de la Cruz, Querétaro',
    year: 2026,
    description:
      'Los originales chamorros de Querétaro, con toda la fiesta del mercado: papel picado, colores de bandera y una tipografía que se escucha. Menú claro y pedido directo por WhatsApp o Rappi desde el primer vistazo.',
    deliverables: ['Sitio one-page', 'Menú', 'Pedido WhatsApp y Rappi', 'Ilustraciones'],
    theme: { bg: '#b3261e', fg: '#fbf3e4', accent: '#f4c542' },
    palette: ['#b3261e', '#7a1712', '#f4c542', '#2f6b3a', '#fbf3e4'],
    fonts: ['Alfa Slab One', 'DM Sans', 'Permanent Marker'],
    shots: 'don-chamorro',
  },
  {
    repo: 'Aregato',
    slug: 'aregato',
    name: 'Aregato',
    tagline: 'Arena 100 % mineral y natural para tu gato.',
    category: 'Tienda en línea',
    place: 'Querétaro',
    year: 2026,
    description:
      'Una marca de arena para gato que solo existía en redes sociales. Vitrina cálida y juguetona, catálogo con precios y un carrito que arma el pedido listo para enviar por WhatsApp, con entrega gratis en la ciudad.',
    deliverables: ['Sitio vitrina', 'Catálogo y carrito', 'Pedido por WhatsApp'],
    theme: { bg: '#fbf6ee', fg: '#1f1b18', accent: '#c97f36' },
    palette: ['#e8a560', '#f4a3aa', '#b8a2dc', '#1f1b18', '#fbf6ee'],
    fonts: ['Bricolage Grotesque', 'DM Sans', 'Caveat'],
    shots: 'aregato',
  },
];
