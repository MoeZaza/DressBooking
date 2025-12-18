import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    FAQ_TITLE: 'FAQ',
    MORE_QUESTIONS: 'Plus de questions ?',
    FAQ_DOCUMENTS_TITLE: 'De quels documents ai-je besoin pour louer une robe ?',
    FAQ_DOCUMENTS_TEXT: "Pour louer une robe, vous aurez généralement besoin d'une pièce d'identité valide, d'une carte de crédit pour le paiement et le dépôt de garantie. Des mesures peuvent être nécessaires pour certaines robes. Des exigences supplémentaires peuvent varier en fonction de votre emplacement et du type de robe que vous louez.",
    FAQ_SERVICES_TITLE: 'Proposez-vous des services de livraison et de retrait ?',
    FAQ_SERVICES_TEXT: 'Oui, nous le faisons ! Nous proposons des services de livraison et de retrait pratiques à divers endroits, notamment les hôtels, salles de réception, etc. Dites-nous simplement votre destination préférée et nous nous occuperons du reste.',
    FAQ_AGE_TITLE: "Y a-t-il une limite d'âge pour louer une robe ?",
    FAQ_AGE_TEXT: "Oui, l'âge minimum requis pour louer une robe est généralement de 18 ans. Pour les robes de bal de fin d'études, nous acceptons les clientes de 16 ans avec l'autorisation parentale.",
    FAQ_CANCEL_TITLE: 'Que se passe-t-il si je dois annuler ma réservation ?',
    FAQ_CANCEL_TEXT: "Nous comprenons que les plans peuvent changer, c'est pourquoi nous proposons des politiques d'annulation flexibles. Selon le moment de votre annulation, des frais peuvent s'appliquer. Veuillez vous référer à nos conditions générales ou contacter notre équipe d'assistance client pour obtenir de l'aide concernant les annulations.",
  },
  en: {
    FAQ_TITLE: 'FAQ',
    MORE_QUESTIONS: 'More questions?',
    FAQ_DOCUMENTS_TITLE: 'What documents do I need to rent a dress?',
    FAQ_DOCUMENTS_TEXT: "To rent a dress, you'll typically need a valid ID, a credit card for payment and security deposit. Measurements may be required for certain dresses. Additional requirements may vary depending on your location and the type of dress you're renting.",
    FAQ_SERVICES_TITLE: 'Do you offer delivery and pickup services?',
    FAQ_SERVICES_TEXT: "Yes, we do! We offer convenient delivery and pickup services to various locations, including hotels, venues, and more. Just let us know your preferred location, and we'll take care of the rest.",
    FAQ_AGE_TITLE: 'Is there an age requirement for renting a dress?',
    FAQ_AGE_TEXT: 'Yes, the minimum age requirement for renting a dress is usually 18 years old. For prom dresses, we accept customers from 16 years old with parental consent.',
    FAQ_CANCEL_TITLE: 'What happens if I need to cancel my reservation?',
    FAQ_CANCEL_TEXT: 'We understand that plans can change, which is why we offer flexible cancellation policies. Depending on the timing of your cancellation, there may be applicable fees. Please refer to our terms and conditions or contact our customer support team for assistance with cancellations.',
  },
  es: {
    FAQ_TITLE: 'Preguntas frecuentes',
    MORE_QUESTIONS: '¿Más preguntas?',
    FAQ_DOCUMENTS_TITLE: '¿Qué documentos necesito para alquilar un vestido?',
    FAQ_DOCUMENTS_TEXT: 'Para alquilar un vestido, normalmente necesitarás una identificación válida, una tarjeta de crédito para el pago y el depósito de seguridad. Pueden requerirse medidas para ciertos vestidos. Los requisitos adicionales pueden variar según tu ubicación y el tipo de vestido que estés alquilando.',
    FAQ_SERVICES_TITLE: '¿Ofrecen servicios de entrega y recogida?',
    FAQ_SERVICES_TEXT: '¡Sí, lo hacemos! Ofrecemos cómodos servicios de entrega y recogida en varios lugares, incluidos hoteles, salones de eventos y más. Solo indícanos tu ubicación preferida y nosotros nos encargaremos del resto.',
    FAQ_AGE_TITLE: '¿Existe un requisito de edad para alquilar un vestido?',
    FAQ_AGE_TEXT: 'Sí, la edad mínima requerida para alquilar un vestido suele ser de 18 años. Para vestidos de graduación, aceptamos clientas de 16 años con consentimiento parental.',
    FAQ_CANCEL_TITLE: '¿Qué sucede si necesito cancelar mi reserva?',
    FAQ_CANCEL_TEXT: 'Entendemos que los planes pueden cambiar, por eso ofrecemos políticas de cancelación flexibles. Según el momento de tu cancelación, pueden aplicarse cargos. Consulta nuestros términos y condiciones o comunícate con nuestro equipo de atención al cliente para obtener ayuda con las cancelaciones.',
  },
  ar: {
    FAQ_TITLE: 'الأسئلة الشائعة',
    MORE_QUESTIONS: 'المزيد من الأسئلة؟',
    FAQ_DOCUMENTS_TITLE: 'ما هي الوثائق التي أحتاجها لاستئجار فستان؟',
    FAQ_DOCUMENTS_TEXT: 'لاستئجار فستان، ستحتاج عادة إلى هوية صالحة وبطاقة ائتمان للدفع وتأمين الضمان. قد تكون القياسات مطلوبة لبعض الفساتين. قد تختلف المتطلبات الإضافية حسب موقعك ونوع الفستان الذي تستأجره.',
    FAQ_SERVICES_TITLE: 'هل تقدمون خدمات التوصيل والاستلام؟',
    FAQ_SERVICES_TEXT: 'نعم، نفعل ذلك! نقدم خدمات توصيل واستلام مريحة إلى مواقع مختلفة، بما في ذلك الفنادق وقاعات الأفراح والمزيد. فقط أخبرنا بموقعك المفضل وسنتولى الباقي.',
    FAQ_AGE_TITLE: 'هل هناك متطلب عمري لاستئجار فستان؟',
    FAQ_AGE_TEXT: 'نحن نرحب بجميع العملاء لاستئجار الفساتين. لا توجد قيود عمرية محددة.',
    FAQ_CANCEL_TITLE: 'ماذا يحدث إذا احتجت لإلغاء حجزي؟',
    FAQ_CANCEL_TEXT: 'نحن نفهم أن الخطط قد تتغير، ولهذا نقدم سياسات إلغاء مرنة. اعتمادًا على توقيت إلغائك، قد تنطبق رسوم. يرجى الرجوع إلى الشروط والأحكام أو الاتصال بفريق دعم العملاء للحصول على المساعدة في الإلغاء.',
  },
})

langHelper.setLanguage(strings)
export { strings }
