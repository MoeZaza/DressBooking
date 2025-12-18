import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'
import env from '@/config/env.config'

const strings = new LocalizedStrings({
  fr: {
    TITLE1: `${env.WEBSITE_NAME} - Votre service de location de robes`,
    SUBTITLE1: 'Votre partenaire de confiance pour la location de robes',
    CONTENT1: `Chez ${env.WEBSITE_NAME}, nous comprenons que chaque occasion est unique. Nous nous engageons à fournir à nos clients une sélection diversifiée de robes qui répondent à tous les besoins d'événements. Que vous assistiez à un mariage, une soirée de gala, un bal de fin d'année ou toute autre occasion spéciale, nos services de location de robes fiables garantissent que vous brillez en toute élégance. Notre mission est de fournir un service client exceptionnel, rendant votre expérience agréable et sans stress. Avec des tarifs compétitifs, une variété de robes bien entretenues et une équipe dédiée prête à vous aider, nous nous efforçons d'être votre partenaire de confiance pour vos événements spéciaux. Choisissez ${env.WEBSITE_NAME} pour tous vos besoins de location de robes et découvrez la liberté de porter des créations de designers à votre rythme.`,
    TITLE2: `Pourquoi choisir ${env.WEBSITE_NAME}`,
    SUBTITLE2: "Découvrez l'excellence à chaque occasion",
    CONTENT2: "Profitez d'une commodité, d'une fiabilité et d'une valeur inégalées avec notre service de location de robes. Des réservations sans effort aux robes de haute qualité, nous sommes votre partenaire de confiance pour vos événements.",
    FIND_DEAL: 'Trouver une Offre',
  },
  en: {
    TITLE1: `${env.WEBSITE_NAME} - Your Premier Dress Rental Service`,
    SUBTITLE1: 'Your Trusted Partner for Dress Rentals',
    CONTENT1: `At ${env.WEBSITE_NAME}, we understand that every occasion is unique. We are committed to providing our customers with a diverse selection of dresses that cater to every special event need. Whether you're attending a wedding, gala evening, prom, or any other special occasion, our reliable dress rental services ensure that you shine with elegance seamlessly. Our mission is to deliver exceptional customer service, making your experience enjoyable and stress-free. With competitive rates, a variety of well-maintained designer dresses, and a dedicated team ready to assist you, we strive to be your trusted partner for your special events. Choose ${env.WEBSITE_NAME} for all your dress rental needs and experience the freedom to wear designer creations at your own pace.`,
    TITLE2: `Why Choose ${env.WEBSITE_NAME}`,
    SUBTITLE2: 'Experience Excellence in Every Occasion',
    CONTENT2: "Enjoy unmatched convenience, reliability, and value with our premier dress rental service. From effortless bookings to high-quality designer dresses, we're your trusted event partner.",
    FIND_DEAL: 'Find Deal',
  },
  es: {
    TITLE1: `${env.WEBSITE_NAME} - Su servicio de alquiler de vestidos`,
    SUBTITLE1: 'Su socio de confianza para alquileres de vestidos',
    CONTENT1: `En ${env.WEBSITE_NAME}, entendemos que cada ocasión es única. Nos comprometemos a brindarles a nuestros clientes una selección diversa de vestidos que satisfagan todas las necesidades de eventos especiales. Ya sea que esté asistiendo a una boda, una gala, un baile de graduación o cualquier otra ocasión especial, nuestros confiables servicios de alquiler de vestidos garantizan que brille con elegancia sin problemas. Nuestra misión es brindar un servicio al cliente excepcional, haciendo que su experiencia sea agradable y sin estrés. Con tarifas competitivas, una variedad de vestidos de diseñador bien mantenidos y un equipo dedicado listo para ayudarlo, nos esforzamos por ser su socio de confianza para sus eventos especiales. Elija ${env.WEBSITE_NAME} para todas sus necesidades de alquiler de vestidos y experimente la libertad de usar creaciones de diseñadores a su propio ritmo.`,
    TITLE2: `Por qué elegir ${env.WEBSITE_NAME}`,
    SUBTITLE2: 'Experimenta la excelencia en cada ocasión',
    CONTENT2: 'Disfruta de una comodidad, fiabilidad y valor inigualables con nuestro servicio de alquiler de vestidos de primera calidad. Desde reservas sencillas hasta vestidos de diseñador de alta calidad, somos tu socio de eventos de confianza.',
    FIND_DEAL: 'Buscar oferta',
  },
  ar: {
    TITLE1: `${env.WEBSITE_NAME} - خدمة تأجير الفساتين الرائدة`,
    SUBTITLE1: 'شريكك الموثوق لتأجير الفساتين',
    CONTENT1: `في ${env.WEBSITE_NAME}، نحن نفهم أن كل مناسبة فريدة. نحن ملتزمون بتوفير مجموعة متنوعة من الفساتين لعملائنا التي تلبي جميع احتياجات المناسبات الخاصة. سواء كنت تحضر حفل زفاف، أو حفلة سهرة، أو حفل تخرج، أو أي مناسبة خاصة أخرى، فإن خدمات تأجير الفساتين الموثوقة لدينا تضمن أن تتألقي بأناقة بسلاسة. مهمتنا هي تقديم خدمة عملاء استثنائية، مما يجعل تجربتك ممتعة وخالية من التوتر. مع أسعار تنافسية، ومجموعة متنوعة من فساتين المصممين المحافظ عليها جيداً، وفريق مخصص جاهز لمساعدتك، نسعى لأن نكون شريكك الموثوق لمناسباتك الخاصة. اختر ${env.WEBSITE_NAME} لجميع احتياجاتك من تأجير الفساتين واختبر حرية ارتداء إبداعات المصممين بوتيرتك الخاصة.`,
    TITLE2: `لماذا تختار ${env.WEBSITE_NAME}`,
    SUBTITLE2: 'اختبر التميز في كل مناسبة',
    CONTENT2: 'استمتع بالراحة والموثوقية والقيمة التي لا مثيل لها مع خدمة تأجير الفساتين الرائدة لدينا. من الحجوزات السهلة إلى فساتين المصممين عالية الجودة، نحن شريك المناسبات الموثوق بك.',
    FIND_DEAL: 'البحث عن عرض',
  },
})

langHelper.setLanguage(strings)
export { strings }
