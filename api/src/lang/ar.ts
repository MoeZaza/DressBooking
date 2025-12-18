import * as env from '../config/env.config'

export const ar = {
  // System Messages
  ERROR: 'خطأ داخلي: ',
  DB_ERROR: 'فشل في قاعدة البيانات: ',
  SMTP_ERROR: 'خطأ في SMTP - فشل في إرسال البريد الإلكتروني: ',

  // Account Management
  ACCOUNT_ACTIVATION_SUBJECT: 'تفعيل الحساب',
  HELLO: 'مرحبًا ',
  ACCOUNT_ACTIVATION_LINK: 'يرجى تفعيل حسابك بالنقر على الرابط:',
  REGARDS: `مع أطيب التحيات،<br>فريق ${env.WEBSITE_NAME}`,
  ACCOUNT_ACTIVATION_TECHNICAL_ISSUE: 'مشكلة فنية! يرجى النقر على إعادة الإرسال للتحقق من بريدك الإلكتروني.',
  ACCOUNT_ACTIVATION_LINK_EXPIRED: 'قد تكون صلاحية رابط التحقق قد انتهت. يرجى النقر على إعادة الإرسال للتحقق من بريدك الإلكتروني.',
  ACCOUNT_ACTIVATION_LINK_ERROR: 'لم نتمكن من العثور على مستخدم لهذا التحقق. يرجى التسجيل.',
  ACCOUNT_ACTIVATION_SUCCESS: 'تم التحقق من حسابك بنجاح.',
  ACCOUNT_ACTIVATION_RESEND_ERROR: 'لم نتمكن من العثور على مستخدم بهذا البريد الإلكتروني. تأكد من صحة بريدك الإلكتروني.',
  ACCOUNT_ACTIVATION_ACCOUNT_VERIFIED: 'تم التحقق من هذا الحساب بالفعل. يرجى تسجيل الدخول.',
  ACCOUNT_ACTIVATION_EMAIL_SENT_PART_1: 'تم إرسال بريد إلكتروني للتحقق إلى ',
  ACCOUNT_ACTIVATION_EMAIL_SENT_PART_2: '. ستنتهي صلاحيته بعد يوم واحد. إذا لم تتلق بريد التحقق، انقر على إعادة الإرسال.',
  PASSWORD_RESET_SUBJECT: 'إعادة تعيين كلمة المرور',
  PASSWORD_RESET_LINK: 'يرجى إعادة تعيين كلمة المرور الخاصة بك بالنقر على الرابط:',

  // Dress Management
  DRESS_IMAGE_REQUIRED: 'حقل صورة الفستان لا يمكن أن يكون فارغًا: ',
  DRESS_IMAGE_NOT_FOUND: 'ملف الصورة غير موجود: ',
  DRESS_NOT_FOUND: 'الفستان غير موجود',
  DRESS_CREATED: 'تم إنشاء الفستان بنجاح',
  DRESS_UPDATED: 'تم تحديث الفستان بنجاح',
  DRESS_DELETED: 'تم حذف الفستان بنجاح',
  DRESS_CODE_UPDATED: 'تم تحديث رمز الفستان بنجاح',
  DRESS_CODE_EXISTS: 'رمز الفستان موجود بالفعل',
  INVALID_DRESS_ID: 'معرف الفستان غير صالح',

  // Booking Management
  BOOKING_CONFIRMED_SUBJECT_PART1: 'تم تأكيد حجز الفستان',
  BOOKING_CONFIRMED_SUBJECT_PART2: '.',
  BOOKING_CONFIRMED_PART1: 'تم تأكيد حجز الفستان',
  BOOKING_CONFIRMED_PART2: 'وتم الدفع بنجاح.',
  BOOKING_CONFIRMED_PART3: ' يرجى الحضور إلى بوتيك صوفيا ',
  BOOKING_CONFIRMED_PART4: ' (',
  BOOKING_CONFIRMED_PART5: ') في ',
  BOOKING_CONFIRMED_PART6: ` (${env.TIMEZONE}) لاستلام فستانك `,
  BOOKING_CONFIRMED_PART7: '.',
  BOOKING_CONFIRMED_PART8: 'يرجى إحضار بطاقة الهوية وإيصال الدفع معك.',
  BOOKING_CONFIRMED_PART9: 'يجب عليك إعادة الفستان إلى بوتيك صوفيا ',
  BOOKING_CONFIRMED_PART10: ' (',
  BOOKING_CONFIRMED_PART11: ') في ',
  BOOKING_CONFIRMED_PART12: ` (${env.TIMEZONE}).`,
  BOOKING_CONFIRMED_PART13: 'يرجى احترام تواريخ وأوقات الاستلام والتسليم.',
  BOOKING_CONFIRMED_PART14: 'يمكنك متابعة حجزك على: ',
  BOOKING_PAY_LATER_NOTIFICATION: 'تم تأكيد الحجز - الدفع لاحقاً',
  BOOKING_PAID_NOTIFICATION: 'تم دفع الحجز بالكامل',
  CANCEL_BOOKING_NOTIFICATION: 'تم تقديم طلب لإلغاء الحجز',
  BOOKING_UPDATED_NOTIFICATION_PART1: 'تم تحديث حالة الحجز',
  BOOKING_UPDATED_NOTIFICATION_PART2: '.',
  BOOKING_NOT_FOUND: 'الحجز غير موجود',
  INVALID_BOOKING_ID: 'معرف الحجز غير صالح',

  // Wedding Packages
  WEDDING_PACKAGE_NOT_FOUND: 'باقة الزفاف غير موجودة',
  WEDDING_PACKAGE_DELETED: 'تم حذف باقة الزفاف بنجاح',
  INVALID_WEDDING_PACKAGE_ID: 'معرف باقة الزفاف غير صالح',

  // Fitting Appointments
  FITTING_APPOINTMENT_CREATED: 'تم إنشاء موعد القياس بنجاح',
  FITTING_APPOINTMENT_UPDATED: 'تم تحديث موعد القياس بنجاح',
  FITTING_APPOINTMENT_NOT_FOUND: 'موعد القياس غير موجود',
  FITTING_APPOINTMENT_CANCELLED: 'تم إلغاء موعد القياس',

  // Payment Management
  PAYMENT_SUCCESSFUL: 'تم الدفع بنجاح',
  PAYMENT_FAILED: 'فشل في الدفع',
  PAYMENT_PENDING: 'الدفع قيد المعالجة',
  REFUND_SUCCESSFUL: 'تم استرداد المبلغ بنجاح',
  REFUND_FAILED: 'فشل في استرداد المبلغ',
  INVALID_PAYMENT_AMOUNT: 'مبلغ الدفع غير صالح',

  // Reviews
  REVIEW_CREATED: 'تم إنشاء التقييم بنجاح',
  REVIEW_UPDATED: 'تم تحديث التقييم بنجاح',
  REVIEW_DELETED: 'تم حذف التقييم بنجاح',
  REVIEW_NOT_FOUND: 'التقييم غير موجود',
  REVIEW_ALREADY_EXISTS: 'يوجد تقييم بالفعل لهذا الحجز',

  // Expenses
  EXPENSE_CREATED: 'تم إضافة المصروف بنجاح',
  EXPENSE_UPDATED: 'تم تحديث المصروف بنجاح',
  EXPENSE_DELETED: 'تم حذف المصروف بنجاح',
  EXPENSE_NOT_FOUND: 'المصروف غير موجود',

  // General Messages
  CONTACT_SUBJECT: 'رسالة جديدة من نموذج الاتصال',
  SUBJECT: 'الموضوع',
  FROM: 'من',
  MESSAGE: 'الرسالة',
  LOCATION_IMAGE_NOT_FOUND: 'صورة الموقع غير موجودة',
  NEW_DRESS_NOTIFICATION_PART1: 'قام المورد ',
  NEW_DRESS_NOTIFICATION_PART2: ' بإضافة فستان جديد.',

  // Permissions and Access
  UNAUTHORIZED: 'غير مخول للوصول',
  ACCESS_DENIED: 'تم رفض الوصول',
  ADMIN_ACCESS_REQUIRED: 'يتطلب صلاحيات المدير',
  SUPPLIER_ACCESS_REQUIRED: 'يتطلب صلاحيات المورد',
  OWNER_ACCESS_REQUIRED: 'يتطلب صلاحيات المالك',

  // Validation Messages
  REQUIRED_FIELD: 'هذا الحقل مطلوب',
  INVALID_EMAIL: 'البريد الإلكتروني غير صالح',
  INVALID_PHONE: 'رقم الهاتف غير صالح',
  INVALID_DATE: 'التاريخ غير صالح',
  INVALID_TIME: 'الوقت غير صالح',
  INVALID_AMOUNT: 'المبلغ غير صالح',

  // Success Messages
  OPERATION_SUCCESSFUL: 'تمت العملية بنجاح',
  DATA_SAVED: 'تم حفظ البيانات بنجاح',
  DATA_UPDATED: 'تم تحديث البيانات بنجاح',
  DATA_DELETED: 'تم حذف البيانات بنجاح',
}
