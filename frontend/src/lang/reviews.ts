import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    // Review List
    REVIEW_SUMMARY: 'Résumé des avis',
    REVIEWS: 'avis',
    NO_REVIEWS: 'Aucun avis pour le moment. Soyez le premier à donner votre avis sur cette robe !',
    SORT_BY: 'Trier par',
    NEWEST: 'Plus récent',
    RATING: 'Note',
    MOST_HELPFUL: 'Plus utile',
    MIN_RATING: 'Note minimale',
    ALL: 'Tous',
    STARS: 'étoiles',
    VERIFIED_ONLY: 'Vérifiés uniquement',
    VERIFIED: 'Vérifié',
    HELPFUL: 'Utile',
    REPORT_REVIEW: 'Signaler l\'avis',
    REASON: 'Raison',
    SUBMIT_REPORT: 'Soumettre le rapport',

    // Review Form
    WRITE_REVIEW: 'Écrire un avis',
    REVIEW_FOR_DRESS: 'Avis pour la robe',
    COMMENT: 'Commentaire',
    COMMENT_PLACEHOLDER: 'Partagez votre expérience avec cette robe...',
    PHOTOS: 'Photos',
    OPTIONAL: 'optionnel',
    ADD_PHOTOS: 'Ajouter des photos',
    MAX_PHOTOS: 'Maximum',
    PHOTO_PREVIEW: 'Aperçu de la photo',
    SUBMIT_REVIEW: 'Soumettre l\'avis',
    SUBMITTING: 'Soumission...',

    // Rating Labels
    RATING_POOR: 'Mauvais',
    RATING_FAIR: 'Correct',
    RATING_GOOD: 'Bon',
    RATING_VERY_GOOD: 'Très bon',
    RATING_EXCELLENT: 'Excellent',

    // Guidelines
    REVIEW_GUIDELINES: 'Veuillez être honnête et constructif dans votre avis. Concentrez-vous sur la qualité de la robe, l\'ajustement et votre expérience globale.',

    // Success Messages
    REVIEW_CREATED_SUCCESS: 'Avis soumis avec succès !',
    REVIEW_UPDATED_SUCCESS: 'Avis mis à jour avec succès !',
    REVIEW_DELETED_SUCCESS: 'Avis supprimé avec succès !',

    // Error Messages
    REVIEW_CREATE_ERROR: 'Échec de la soumission de l\'avis. Veuillez réessayer.',
    REVIEW_UPDATE_ERROR: 'Échec de la mise à jour de l\'avis. Veuillez réessayer.',
    REVIEW_DELETE_ERROR: 'Échec de la suppression de l\'avis. Veuillez réessayer.',
    REVIEW_LOAD_ERROR: 'Échec du chargement des avis. Veuillez réessayer.',

    // Admin/Moderation
    MODERATE_REVIEWS: 'Modérer les avis',
    APPROVE_REVIEW: 'Approuver l\'avis',
    REJECT_REVIEW: 'Rejeter l\'avis',
    REPORTED_REVIEWS: 'Avis signalés',
    MODERATOR_NOTES: 'Notes du modérateur',
    REVIEW_STATUS: 'Statut de l\'avis',
    APPROVED: 'Approuvé',
    REJECTED: 'Rejeté',
    PENDING: 'En attente',
    REPORTED: 'Signalé',

    // Customer Reviews Page
    MY_REVIEWS: 'Mes avis',
    EDIT_REVIEW: 'Modifier l\'avis',
    DELETE_REVIEW: 'Supprimer l\'avis',
    REVIEW_HISTORY: 'Historique des avis',
    PENDING_REVIEWS: 'Avis en attente',
    LEAVE_REVIEW: 'Laisser un avis',
    REVIEW_BOOKING: 'Évaluer cette réservation',
  },
  en: {
    // Review List
    REVIEW_SUMMARY: 'Review Summary',
    REVIEWS: 'reviews',
    NO_REVIEWS: 'No reviews yet. Be the first to review this dress!',
    SORT_BY: 'Sort by',
    NEWEST: 'Newest',
    RATING: 'Rating',
    MOST_HELPFUL: 'Most Helpful',
    MIN_RATING: 'Min Rating',
    ALL: 'All',
    STARS: 'stars',
    VERIFIED_ONLY: 'Verified Only',
    VERIFIED: 'Verified',
    HELPFUL: 'Helpful',
    REPORT_REVIEW: 'Report Review',
    REASON: 'Reason',
    SUBMIT_REPORT: 'Submit Report',

    // Review Form
    WRITE_REVIEW: 'Write a Review',
    REVIEW_FOR_DRESS: 'Review for dress',
    COMMENT: 'Comment',
    COMMENT_PLACEHOLDER: 'Share your experience with this dress...',
    PHOTOS: 'Photos',
    OPTIONAL: 'optional',
    ADD_PHOTOS: 'Add Photos',
    MAX_PHOTOS: 'Maximum',
    PHOTO_PREVIEW: 'Photo Preview',
    SUBMIT_REVIEW: 'Submit Review',
    SUBMITTING: 'Submitting...',

    // Rating Labels
    RATING_POOR: 'Poor',
    RATING_FAIR: 'Fair',
    RATING_GOOD: 'Good',
    RATING_VERY_GOOD: 'Very Good',
    RATING_EXCELLENT: 'Excellent',

    // Guidelines
    REVIEW_GUIDELINES: 'Please be honest and constructive in your review. Focus on the dress quality, fit, and your overall experience.',

    // Success Messages
    REVIEW_CREATED_SUCCESS: 'Review submitted successfully!',
    REVIEW_UPDATED_SUCCESS: 'Review updated successfully!',
    REVIEW_DELETED_SUCCESS: 'Review deleted successfully!',

    // Error Messages
    REVIEW_CREATE_ERROR: 'Failed to submit review. Please try again.',
    REVIEW_UPDATE_ERROR: 'Failed to update review. Please try again.',
    REVIEW_DELETE_ERROR: 'Failed to delete review. Please try again.',
    REVIEW_LOAD_ERROR: 'Failed to load reviews. Please try again.',

    // Admin/Moderation
    MODERATE_REVIEWS: 'Moderate Reviews',
    APPROVE_REVIEW: 'Approve Review',
    REJECT_REVIEW: 'Reject Review',
    REPORTED_REVIEWS: 'Reported Reviews',
    MODERATOR_NOTES: 'Moderator Notes',
    REVIEW_STATUS: 'Review Status',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PENDING: 'Pending',
    REPORTED: 'Reported',

    // Customer Reviews Page
    MY_REVIEWS: 'My Reviews',
    EDIT_REVIEW: 'Edit Review',
    DELETE_REVIEW: 'Delete Review',
    REVIEW_HISTORY: 'Review History',
    PENDING_REVIEWS: 'Pending Reviews',
    LEAVE_REVIEW: 'Leave Review',
    REVIEW_BOOKING: 'Review this booking',
  },
  es: {
    // Review List
    REVIEW_SUMMARY: 'Resumen de reseñas',
    REVIEWS: 'reseñas',
    NO_REVIEWS: '¡Aún no hay reseñas. ¡Sé el primero en reseñar este vestido!',
    SORT_BY: 'Ordenar por',
    NEWEST: 'Más reciente',
    RATING: 'Calificación',
    MOST_HELPFUL: 'Más útil',
    MIN_RATING: 'Calificación mínima',
    ALL: 'Todos',
    STARS: 'estrellas',
    VERIFIED_ONLY: 'Solo verificados',
    VERIFIED: 'Verificado',
    HELPFUL: 'Útil',
    REPORT_REVIEW: 'Reportar reseña',
    REASON: 'Razón',
    SUBMIT_REPORT: 'Enviar reporte',

    // Review Form
    WRITE_REVIEW: 'Escribir una reseña',
    REVIEW_FOR_DRESS: 'Reseña para vestido',
    COMMENT: 'Comentario',
    COMMENT_PLACEHOLDER: 'Comparte tu experiencia con este vestido...',
    PHOTOS: 'Fotos',
    OPTIONAL: 'opcional',
    ADD_PHOTOS: 'Agregar fotos',
    MAX_PHOTOS: 'Máximo',
    PHOTO_PREVIEW: 'Vista previa de foto',
    SUBMIT_REVIEW: 'Enviar reseña',
    SUBMITTING: 'Enviando...',

    // Rating Labels
    RATING_POOR: 'Malo',
    RATING_FAIR: 'Regular',
    RATING_GOOD: 'Bueno',
    RATING_VERY_GOOD: 'Muy bueno',
    RATING_EXCELLENT: 'Excelente',

    // Guidelines
    REVIEW_GUIDELINES: 'Por favor, sé honesto y constructivo en tu reseña. Enfócate en la calidad del vestido, el ajuste y tu experiencia general.',

    // Success Messages
    REVIEW_CREATED_SUCCESS: '¡Reseña enviada exitosamente!',
    REVIEW_UPDATED_SUCCESS: '¡Reseña actualizada exitosamente!',
    REVIEW_DELETED_SUCCESS: '¡Reseña eliminada exitosamente!',

    // Error Messages
    REVIEW_CREATE_ERROR: 'Error al enviar la reseña. Por favor, inténtalo de nuevo.',
    REVIEW_UPDATE_ERROR: 'Error al actualizar la reseña. Por favor, inténtalo de nuevo.',
    REVIEW_DELETE_ERROR: 'Error al eliminar la reseña. Por favor, inténtalo de nuevo.',
    REVIEW_LOAD_ERROR: 'Error al cargar las reseñas. Por favor, inténtalo de nuevo.',

    // Admin/Moderation
    MODERATE_REVIEWS: 'Moderar reseñas',
    APPROVE_REVIEW: 'Aprobar reseña',
    REJECT_REVIEW: 'Rechazar reseña',
    REPORTED_REVIEWS: 'Reseñas reportadas',
    MODERATOR_NOTES: 'Notas del moderador',
    REVIEW_STATUS: 'Estado de la reseña',
    APPROVED: 'Aprobado',
    REJECTED: 'Rechazado',
    PENDING: 'Pendiente',
    REPORTED: 'Reportado',

    // Customer Reviews Page
    MY_REVIEWS: 'Mis reseñas',
    EDIT_REVIEW: 'Editar reseña',
    DELETE_REVIEW: 'Eliminar reseña',
    REVIEW_HISTORY: 'Historial de reseñas',
    PENDING_REVIEWS: 'Reseñas pendientes',
    LEAVE_REVIEW: 'Dejar reseña',
    REVIEW_BOOKING: 'Reseñar esta reserva',
  },
  ar: {
    // Review List
    REVIEW_SUMMARY: 'ملخص التقييمات',
    REVIEWS: 'تقييمات',
    NO_REVIEWS: 'لا توجد تقييمات بعد. كن أول من يقيم هذا الفستان!',
    SORT_BY: 'ترتيب حسب',
    NEWEST: 'الأحدث',
    RATING: 'التقييم',
    MOST_HELPFUL: 'الأكثر فائدة',
    MIN_RATING: 'أقل تقييم',
    ALL: 'الكل',
    STARS: 'نجوم',
    VERIFIED_ONLY: 'المتحقق منها فقط',
    VERIFIED: 'متحقق منه',
    HELPFUL: 'مفيد',
    REPORT_REVIEW: 'الإبلاغ عن التقييم',
    REASON: 'السبب',
    SUBMIT_REPORT: 'إرسال البلاغ',

    // Review Form
    WRITE_REVIEW: 'كتابة تقييم',
    REVIEW_FOR_DRESS: 'تقييم للفستان',
    COMMENT: 'تعليق',
    COMMENT_PLACEHOLDER: 'شارك تجربتك مع هذا الفستان...',
    PHOTOS: 'صور',
    OPTIONAL: 'اختياري',
    ADD_PHOTOS: 'إضافة صور',
    MAX_PHOTOS: 'الحد الأقصى',
    PHOTO_PREVIEW: 'معاينة الصورة',
    SUBMIT_REVIEW: 'إرسال التقييم',
    SUBMITTING: 'جاري الإرسال...',

    // Rating Labels
    RATING_POOR: 'ضعيف',
    RATING_FAIR: 'مقبول',
    RATING_GOOD: 'جيد',
    RATING_VERY_GOOD: 'جيد جداً',
    RATING_EXCELLENT: 'ممتاز',

    // Guidelines
    REVIEW_GUIDELINES: 'يرجى أن تكون صادقاً وبناءً في تقييمك. ركز على جودة الفستان والمقاس وتجربتك الإجمالية.',

    // Success Messages
    REVIEW_CREATED_SUCCESS: 'تم إرسال التقييم بنجاح!',
    REVIEW_UPDATED_SUCCESS: 'تم تحديث التقييم بنجاح!',
    REVIEW_DELETED_SUCCESS: 'تم حذف التقييم بنجاح!',

    // Error Messages
    REVIEW_CREATE_ERROR: 'فشل في إرسال التقييم. يرجى المحاولة مرة أخرى.',
    REVIEW_UPDATE_ERROR: 'فشل في تحديث التقييم. يرجى المحاولة مرة أخرى.',
    REVIEW_DELETE_ERROR: 'فشل في حذف التقييم. يرجى المحاولة مرة أخرى.',
    REVIEW_LOAD_ERROR: 'فشل في تحميل التقييمات. يرجى المحاولة مرة أخرى.',

    // Admin/Moderation
    MODERATE_REVIEWS: 'إدارة التقييمات',
    APPROVE_REVIEW: 'الموافقة على التقييم',
    REJECT_REVIEW: 'رفض التقييم',
    REPORTED_REVIEWS: 'التقييمات المبلغ عنها',
    MODERATOR_NOTES: 'ملاحظات المشرف',
    REVIEW_STATUS: 'حالة التقييم',
    APPROVED: 'موافق عليه',
    REJECTED: 'مرفوض',
    PENDING: 'قيد الانتظار',
    REPORTED: 'مبلغ عنه',

    // Customer Reviews Page
    MY_REVIEWS: 'تقييماتي',
    EDIT_REVIEW: 'تعديل التقييم',
    DELETE_REVIEW: 'حذف التقييم',
    REVIEW_HISTORY: 'تاريخ التقييمات',
    PENDING_REVIEWS: 'التقييمات المعلقة',
    LEAVE_REVIEW: 'ترك تقييم',
    REVIEW_BOOKING: 'تقييم هذا الحجز',
  },
})

langHelper.setLanguage(strings)
export { strings }
