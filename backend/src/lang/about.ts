import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'
import env from '@/config/env.config'

const strings = new LocalizedStrings({
  fr: {
    TITLE1: `${env.WEBSITE_NAME} - Votre service de location de voitures`,
    SUBTITLE1: 'Votre partenaire de confiance pour la location de voitures',
    CONTENT1: `Chez ${env.WEBSITE_NAME}, nous comprenons que chaque voyage est unique. Nous nous engageons à fournir à nos clients une sélection diversifiée de véhicules qui répondent à tous les besoins de voyage. Que vous exploriez une ville, que vous vous déplaciez pour affaires ou que vous recherchiez l'aventure, nos services de location de voitures fiables garantissent que votre aventure commence en toute transparence. Notre mission est de fournir un service client exceptionnel, rendant votre expérience agréable et sans stress. Avec des tarifs compétitifs, une variété de véhicules bien entretenus et une équipe dédiée prête à vous aider, nous nous efforçons d'être votre partenaire de confiance sur la route. Choisissez ${env.WEBSITE_NAME} pour tous vos besoins de location de voiture et découvrez la liberté d'explorer à votre rythme.`,
    TITLE2: `Pourquoi choisir ${env.WEBSITE_NAME}`,
    SUBTITLE2: "Découvrez l'excellence à chaque voyage",
    CONTENT2: "Profitez d'une commodité, d'une fiabilité et d'une valeur inégalées avec notre service de location de voitures. Des réservations sans effort aux véhicules de haute qualité, nous sommes votre partenaire de voyage de confiance.",
    FIND_DEAL: 'Trouver une Offre',
    PRICING: 'Tarification',

  },
  en: {
    TITLE1: `${env.WEBSITE_NAME} - Your Premier Dress Rental Service`,
    SUBTITLE1: 'Your Trusted Partner for Dress Rentals',
    CONTENT1: `At ${env.WEBSITE_NAME}, we understand that every special occasion deserves the perfect dress. We are committed to providing our customers with a diverse selection of elegant dresses that cater to every celebration. Whether you're attending a wedding, gala, prom, or any special event, our reliable dress rental services ensure that you look stunning and feel confident. Our mission is to deliver exceptional customer service, making your experience enjoyable and stress-free. With competitive rates, a variety of well-maintained designer dresses, and a dedicated team ready to assist you, we strive to be your trusted partner for all your formal wear needs. Choose ${env.WEBSITE_NAME} for all your dress rental needs and experience the elegance you deserve.`,
    TITLE2: `Why Choose ${env.WEBSITE_NAME}`,
    SUBTITLE2: 'Experience Excellence in Every Journey',
    CONTENT2: "Enjoy unmatched convenience, reliability, and value with our premier dress rental service. From effortless bookings to high-quality dresses, we're your trusted partner for event.",
    FIND_DEAL: 'Find Deal',
    PRICING: 'Pricing',
  },
  es: {
    TITLE1: `${env.WEBSITE_NAME} - Su servicio de alquiler de coches`,
    SUBTITLE1: 'Su socio de confianza para alquileres de coches',
    CONTENT1: `En ${env.WEBSITE_NAME}, entendemos que cada viaje es único. Nos comprometemos a brindarles a nuestros clientes una selección diversa de vehículos que satisfagan todas las necesidades de viaje. Ya sea que esté explorando una ciudad, viajando por negocios o buscando aventuras, nuestros confiables servicios de alquiler de automóviles garantizan que su aventura comience sin problemas. Nuestra misión es brindar un servicio al cliente excepcional, haciendo que su experiencia sea agradable y sin estrés. Con tarifas competitivas, una variedad de vehículos bien mantenidos y un equipo dedicado listo para ayudarlo, nos esforzamos por ser su socio de confianza en la carretera. Elija ${env.WEBSITE_NAME} para todas sus necesidades de alquiler de automóviles y experimente la libertad de explorar a su propio ritmo.`,
    TITLE2: `Por qué elegir ${env.WEBSITE_NAME}`,
    SUBTITLE2: 'Experimenta la excelencia en cada viaje',
    CONTENT2: 'Disfruta de una comodidad, fiabilidad y valor inigualables con nuestro servicio de alquiler de coches de primera calidad. Desde reservas sencillas hasta vehículos de alta calidad, somos tu socio de viajes de confianza.',
    FIND_DEAL: 'Buscar oferta',
    PRICING: 'Precios',
  },
  ar: {
    TITLE1: `${env.WEBSITE_NAME} - خدمة تأجير الفساتين الرائدة`,
    SUBTITLE1: 'شريكك الموثوق لتأجير الفساتين',
    CONTENT1: `في ${env.WEBSITE_NAME}، نحن نفهم أن كل مناسبة فريدة. نحن ملتزمون بتوفير مجموعة متنوعة من الفساتين التي تلبي جميع احتياجات المناسبات لعملائنا. سواء كنت تحضرين لحفل زفاف، أو مناسبة عمل، أو تبحثين عن إطلالة مميزة، فإن خدمات تأجير الفساتين الموثوقة لدينا تضمن أن تبدئي مناسبتك بسلاسة. مهمتنا هي تقديم خدمة عملاء استثنائية، مما يجعل تجربتك ممتعة وخالية من التوتر. مع أسعار تنافسية، ومجموعة متنوعة من الفساتين المحافظ عليها جيداً، وفريق مخصص جاهز لمساعدتك، نسعى لنكون شريكك الموثوق في المناسبات. اختاري ${env.WEBSITE_NAME} لجميع احتياجاتك من تأجير الفساتين واختبري حرية التألق بأسلوبك الخاص.`,
    TITLE2: `لماذا تختارين ${env.WEBSITE_NAME}`,
    SUBTITLE2: 'اختبري التميز في كل مناسبة',
    CONTENT2: 'استمتعي بالراحة والموثوقية والقيمة التي لا مثيل لها مع خدمة تأجير الفساتين الرائدة لدينا. من الحجوزات السهلة إلى الفساتين عالية الجودة، نحن شريكك الموثوق في المناسبات.',
    FIND_DEAL: 'البحث عن عرض',
    PRICING: 'الأسعار',
  },
})

langHelper.setLanguage(strings)
export { strings }
