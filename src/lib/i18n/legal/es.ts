import type { LegalTexts } from ".";

const es: LegalTexts = {
  privacy: {
    title: "Política de Privacidad",
    intro:
      "Esta política explica qué datos personales recoge Orbi, para qué los usa, con quién los comparte y cómo los controlas, conforme a la Ley General de Protección de Datos de Brasil (LGPD, Ley 13.709/2018). Al usar Orbi también aceptas los {terms}. Esta es una traducción; en caso de duda, prevalece la versión en portugués.",
    sections: [
      {
        id: "who",
        title: "Quién cuida tus datos",
        body: [
          "Orbi es un proyecto independiente hecho en Brasil y es el responsable de tus datos personales. Para cualquier asunto de privacidad, también como encargado de protección de datos (DPO), escribe a {email}.",
        ],
      },
      {
        id: "collect",
        title: "Datos que recogemos",
        body: ["Solo recogemos lo necesario para que Orbi funcione:"],
        list: [
          "Cuenta: correo, nombre y contraseña (guardada cifrada por nuestro proveedor de inicio de sesión; nadie en Orbi puede verla). Si entras con Google, recibimos el nombre, el correo y la foto que Google comparte.",
          "Perfil: nombre de usuario, nombre visible, biografía, ubicación, sitio web y pronombres (todos opcionales salvo el usuario), foto, portada, sticker, favoritos, idioma y preferencias como perfil invisible y contenido adulto.",
          "Lo que registras: estado, puntuaciones, me gusta, reseñas, fechas, episodios vistos, listas, comentarios, adjuntos de reseñas, personas que sigues, denuncias que envías y obras que añades al catálogo.",
          "Importación de Letterboxd: el archivo .zip solo se lee para traer tus registros; el archivo no se guarda.",
          "Dispositivos: el tipo de navegador y sistema (por ejemplo, \"Chrome · Windows\") y la fecha del primer acceso, para avisarte cuando tu cuenta entre en un dispositivo nuevo. No guardamos tu dirección IP en esta lista.",
          "Datos técnicos: nuestros proveedores de alojamiento y base de datos registran datos como la dirección IP y la fecha y hora de las solicitudes, por seguridad y para que el servicio funcione.",
        ],
      },
      {
        id: "not-collect",
        title: "Lo que no recogemos",
        body: [
          "No pedimos documentos de identidad, dirección, teléfono ni datos de pago, no usamos tu ubicación precisa y no tratamos a propósito datos sensibles (como salud, religión u opinión política). No vendemos tus datos, no mostramos anuncios y no usamos herramientas de seguimiento ni de análisis de terceros.",
        ],
      },
      {
        id: "use",
        title: "Para qué los usamos y con qué base legal",
        list: [
          "Crear y mantener tu cuenta, guardar y mostrar lo que registras, enviar correos de la cuenta (confirmación y cambio de contraseña) y mostrar tu perfil a otras personas: ejecución del contrato, es decir, de estos términos (LGPD, art. 7, V).",
          "Seguridad, como el aviso de dispositivo nuevo, la prevención de abusos y el análisis de denuncias: interés legítimo (art. 7, IX) y cumplimiento de obligaciones legales (art. 7, II).",
          "Responder a solicitudes de autoridades: cumplimiento de una obligación legal u orden judicial.",
        ],
        body: [],
      },
      {
        id: "public",
        title: "Qué es público",
        body: [
          "Tu perfil, registros, puntuaciones, reseñas, listas, comentarios, me gusta y a quién sigues pueden verlos todos, incluso sin cuenta. Si haces tu perfil invisible en {settings}, solo tú ves tu perfil y tu actividad. Tu correo nunca se muestra a otras personas.",
        ],
      },
      {
        id: "share",
        title: "Con quién los compartimos",
        body: ["No vendemos ni alquilamos datos. Solo pasan por:"],
        list: [
          "Supabase (base de datos, inicio de sesión y almacenamiento de archivos) y Vercel (alojamiento del sitio), que tratan los datos en nuestro nombre.",
          "Google, solo si eliges entrar con tu cuenta de Google.",
          "TMDB, AniList, Open Library y Steam: las imágenes e información de las obras se cargan desde sus servidores, que reciben tu dirección IP, como en cualquier sitio que muestra imágenes alojadas en otro lugar.",
          "YouTube (youtube-nocookie.com): solo cuando haces clic para ver un tráiler.",
          "MyMemory: solo cuando haces clic en Traducir en una reseña; el texto se envía para traducirlo.",
          "Autoridades públicas, cuando lo exija la ley o una orden judicial.",
        ],
      },
      {
        id: "transfer",
        title: "Transferencias internacionales",
        body: [
          "Algunos de estos proveedores guardan datos en servidores fuera de Brasil, como en Estados Unidos. La transferencia es necesaria para prestar el servicio que pediste (LGPD, art. 33) y se hace con proveedores que adoptan medidas de seguridad y cláusulas de protección de datos.",
        ],
      },
      {
        id: "retention",
        title: "Cuánto tiempo los guardamos",
        body: [
          "Guardamos tus datos mientras exista tu cuenta. Cuando la eliminas, borramos al instante el perfil, registros, reseñas, listas, comentarios, me gusta, seguidores, dispositivos, fotos y adjuntos. Las copias de seguridad de los proveedores pueden conservarlos un tiempo limitado hasta ser sustituidas. Las obras que añadiste al catálogo siguen disponibles, sin vínculo contigo. Podemos conservar lo mínimo necesario para cumplir la ley o defendernos en procesos.",
        ],
      },
      {
        id: "rights",
        title: "Tus derechos",
        body: [
          "Según la LGPD (art. 18) puedes: confirmar si tratamos tus datos y acceder a ellos; corregir datos incompletos o erróneos; pedir la anonimización, el bloqueo o la eliminación de datos innecesarios; recibir una copia de tus datos (portabilidad); saber con quién los compartimos; retirar tu consentimiento; y oponerte a tratamientos contrarios a la ley.",
          "Casi todo lo puedes hacer tú en {settings}: editar el perfil, descargar una copia de tus datos y eliminar la cuenta. Para lo demás, escribe a {email}; respondemos en un máximo de 15 días. También puedes reclamar ante la Autoridad Nacional de Protección de Datos de Brasil (ANPD).",
        ],
      },
      {
        id: "minors",
        title: "Niños y adolescentes",
        body: [
          "Orbi es para personas de 13 años o más. Quien tenga entre 13 y 17 años necesita la autorización de su madre, padre o tutor. Si sabemos que una cuenta pertenece a alguien menor de 13 años, la eliminaremos. Los padres y tutores pueden pedir la eliminación en {email}.",
        ],
      },
      {
        id: "security",
        title: "Seguridad",
        body: [
          "Usamos conexión cifrada (HTTPS), contraseñas guardadas con cifrado y reglas de acceso en la base de datos para que cada persona solo cambie lo suyo. Ningún sistema es totalmente seguro; si ocurre un incidente que pueda causar un riesgo o daño relevante, te avisaremos a ti y a la ANPD.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies",
        body: ["Solo usamos cookies necesarias para que el sitio funcione y recuerde tus preferencias. Consulta los detalles en la {cookies}."],
      },
      {
        id: "changes",
        title: "Cambios en esta política",
        body: [
          "Podemos actualizar esta política. La fecha de la versión vigente está al principio de la página y, si el cambio es importante, avisaremos en el sitio antes de que entre en vigor.",
        ],
      },
    ],
  },
  terms: {
    title: "Términos de Uso",
    intro:
      "Estos términos son el acuerdo entre tú y Orbi. Al crear una cuenta o usar el sitio, los aceptas junto con la {privacy}. Si no estás de acuerdo, no uses Orbi. Esta es una traducción; en caso de duda, prevalece la versión en portugués.",
    sections: [
      {
        id: "service",
        title: "Qué es Orbi",
        body: [
          "Orbi es un servicio gratuito e independiente para registrar y compartir lo que ves, lees y juegas. Está en desarrollo: las funciones pueden cambiar, pausarse o terminar, y el sitio puede quedar fuera de línea a veces.",
        ],
      },
      {
        id: "account",
        title: "Tu cuenta",
        list: [
          "Debes tener 13 años o más. Entre 13 y 17 años, solo con autorización de tu madre, padre o tutor, que también responde por el uso.",
          "Usa datos verdaderos y mantén tu contraseña en secreto. Eres responsable de lo que se haga con tu cuenta.",
          "El nombre de usuario no puede hacerse pasar por otra persona, marca o empresa, ni ser ofensivo.",
        ],
        body: [],
      },
      {
        id: "content",
        title: "Tu contenido",
        body: [
          "Las reseñas, puntuaciones, listas, comentarios e imágenes que publicas siguen siendo tuyos. Al publicar, das a Orbi una licencia gratuita, mundial y no exclusiva para guardar, mostrar, adaptar el formato (por ejemplo, crear miniaturas o traducir cuando alguien lo pide) y exhibir ese contenido dentro de Orbi mientras esté publicado.",
          "Garantizas que tienes derecho a publicar lo que envías. Las obras que añades al catálogo quedan disponibles para todos, incluso después de que elimines tu cuenta.",
        ],
      },
      {
        id: "rules",
        title: "Lo que no está permitido",
        list: [
          "Publicar contenido ilegal, discursos de odio, acoso, amenazas o incitación a la violencia.",
          "Publicar desnudos o contenido sexual explícito; cualquier contenido sexual que involucre a menores se elimina y se comunica a las autoridades.",
          "Exponer datos personales de otras personas o hacerte pasar por alguien.",
          "Subir contenido pirata o enlaces a él, o usar imágenes y textos sin tener derecho.",
          "Escribir reseñas falsas o manipular puntuaciones, me gusta y seguidores con cuentas falsas o automatización.",
          "Hacer spam o publicidad masiva.",
          "Intentar entrar sin permiso, sobrecargar o copiar el sitio de forma masiva, o saltarse límites y reglas de acceso.",
        ],
        body: [],
      },
      {
        id: "moderation",
        title: "Denuncias y moderación",
        body: [
          "Usa el botón Denunciar en el menú de reseñas, comentarios y listas; para perfiles, escribe a {email}. Podemos eliminar contenidos y suspender o borrar cuentas que incumplan estos términos o la ley y, siempre que sea posible, te diremos el motivo.",
        ],
      },
      {
        id: "copyright",
        title: "Derechos de autor y solicitudes de retirada",
        body: [
          "Si algún contenido de Orbi infringe tus derechos (incluidas imágenes), escribe a {email} con el enlace al contenido, el motivo y un medio de contacto. Analizamos todas las solicitudes y retiramos lo que corresponda.",
        ],
      },
      {
        id: "third-party",
        title: "Contenido de terceros",
        body: [
          "Los títulos, sinopsis, pósteres, portadas y otros datos de las obras vienen de TMDB, AniList, Open Library y Steam y pertenecen a sus titulares; solo se usan para identificar las obras. Este producto usa la API de TMDB, pero no está avalado ni certificado por TMDB. Orbi no está afiliado a ninguno de estos servicios ni a Letterboxd.",
          "Las puntuaciones y reseñas son opiniones de sus autores, no de Orbi. No respondemos por el contenido de sitios externos enlazados.",
        ],
      },
      {
        id: "warranty",
        title: "Garantías y responsabilidad",
        body: [
          "Orbi se ofrece tal cual, sin garantía de que esté siempre disponible, sin errores o con información de las obras siempre correcta. En la medida permitida por la ley, no respondemos por pérdida de datos, interrupciones ni contenido publicado por usuarios. Te recomendamos descargar de vez en cuando una copia de tus datos en {settings}. Nada de esto limita los derechos que tengas como consumidor.",
        ],
      },
      {
        id: "end",
        title: "Cancelación",
        body: ["Puedes eliminar tu cuenta cuando quieras en {settings}. Podemos cerrar cuentas que incumplan estos términos o la ley."],
      },
      {
        id: "changes",
        title: "Cambios en estos términos",
        body: [
          "Podemos actualizar estos términos. La fecha de la versión vigente está al principio de la página y, si el cambio es importante, avisaremos en el sitio antes de que entre en vigor. Seguir usando Orbi después significa aceptar la nueva versión.",
        ],
      },
      {
        id: "law",
        title: "Ley aplicable y contacto",
        body: ["Estos términos se rigen por las leyes de Brasil, y son competentes los tribunales de tu domicilio. Dudas, sugerencias o reclamaciones: {email}."],
      },
    ],
  },
  cookies: {
    title: "Política de Cookies",
    intro:
      "Las cookies son pequeños archivos que un sitio guarda en tu navegador. Orbi solo usa cookies y almacenamiento local necesarios para funcionar y recordar tus preferencias. No usamos cookies de publicidad, seguimiento ni análisis, por eso no pedimos consentimiento.",
    sections: [
      {
        id: "cookies",
        title: "Cookies que usamos",
        body: [],
        items: [
          ["sb-…-auth-token", "Mantiene tu sesión iniciada (Supabase). Dura hasta que cierras sesión o la sesión caduca."],
          ["orbi_locale", "Idioma elegido. 1 año."],
          ["orbi-device", "Marca este navegador como conocido, para el aviso de \"dispositivo nuevo\" en tu cuenta. 1 año."],
          ["orbi-notifications-seen, orbi-notif-read, orbi-notif-unread, orbi-notif-deleted, orbi-notif-gone", "Recuerdan qué notificaciones ya viste, marcaste como leídas o no leídas y borraste. 1 año."],
          ["orbi-welcome-seen", "Recuerda que ya viste la bienvenida de Orbi. 1 año."],
        ],
      },
      {
        id: "storage",
        title: "Almacenamiento local",
        body: ["Algunos ajustes se quedan solo en tu navegador y nunca nos llegan:"],
        items: [
          ["orbi-theme, orbi-theme-custom", "Tema y colores que elegiste."],
          ["orbi-login", "Tu correo o usuario, solo si marcas \"Recordarme\" al entrar."],
          ["orbi-nav-history", "Páginas abiertas en esta pestaña, para que funcione el botón Volver. Se borra al cerrar la pestaña."],
        ],
      },
      {
        id: "third-party",
        title: "Cookies de terceros",
        body: [
          "Orbi no pone cookies de terceros. Si haces clic para ver un tráiler, el vídeo viene de YouTube en modo de privacidad mejorada (youtube-nocookie.com), que puede guardar datos en el navegador según la política de Google. Al entrar con Google, la página de inicio de sesión de Google usa sus propias cookies.",
        ],
      },
      {
        id: "control",
        title: "Cómo controlarlas",
        body: [
          "Puedes borrar o bloquear cookies en la configuración del navegador, pero sin la cookie de sesión no puedes iniciar sesión. Cerrar sesión borra la cookie de sesión. Dudas: {email}. Consulta también la {privacy}.",
        ],
      },
    ],
  },
};

export default es;
