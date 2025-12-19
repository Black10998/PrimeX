module.exports = {
    USER_STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        SUSPENDED: 'suspended'
    },
    
    CODE_STATUS: {
        ACTIVE: 'active',
        USED: 'used',
        EXPIRED: 'expired',
        DISABLED: 'disabled'
    },
    
    CHANNEL_STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        MAINTENANCE: 'maintenance'
    },
    
    SERVER_TYPE: {
        PRIMARY: 'primary',
        BACKUP: 'backup'
    },
    
    ADMIN_ROLES: {
        SUPER_ADMIN: 'super_admin',
        ADMIN: 'admin',
        MODERATOR: 'moderator'
    },
    
    SUBSCRIPTION_DURATIONS: {
        WEEKLY: 7,
        MONTHLY: 30,
        YEARLY: 365
    },
    
    PAYMENT_METHODS: [
        'credit_card',
        'bank_transfer',
        'paypal'
    ],
    
    LANGUAGES: {
        EN: 'en',
        AR: 'ar'
    },
    
    DEFAULT_CATEGORIES: [
        { name_en: 'Arabic Channels', name_ar: 'القنوات العربية', slug: 'arabic-channels' },
        { name_en: 'Gulf Channels', name_ar: 'قنوات الخليج', slug: 'gulf-channels' },
        { name_en: 'UAE Channels', name_ar: 'قنوات الإمارات', slug: 'uae-channels' },
        { name_en: 'Syrian Channels', name_ar: 'القنوات السورية', slug: 'syrian-channels' },
        { name_en: 'Sports Channels', name_ar: 'القنوات الرياضية', slug: 'sports-channels' },
        { name_en: 'Live Matches', name_ar: 'المباريات المباشرة', slug: 'live-matches' },
        { name_en: 'Series', name_ar: 'المسلسلات', slug: 'series' },
        { name_en: 'Movies', name_ar: 'الأفلام', slug: 'movies' },
        { name_en: 'Latest Content', name_ar: 'أحدث المحتوى', slug: 'latest-content' },
        { name_en: 'Classic Content', name_ar: 'المحتوى الكلاسيكي', slug: 'classic-content' }
    ],
    
    ERROR_MESSAGES: {
        en: {
            NOT_SUBSCRIBED: 'You are not subscribed',
            SUBSCRIPTION_EXPIRED: 'Your subscription has expired',
            INVALID_CREDENTIALS: 'Invalid username or password',
            DEVICE_LIMIT_REACHED: 'Maximum device limit reached',
            CODE_INVALID: 'Invalid or expired code',
            UNAUTHORIZED: 'Unauthorized access',
            SERVER_ERROR: 'Internal server error'
        },
        ar: {
            NOT_SUBSCRIBED: 'أنت غير مشترك',
            SUBSCRIPTION_EXPIRED: 'انتهت صلاحية اشتراكك',
            INVALID_CREDENTIALS: 'اسم المستخدم أو كلمة المرور غير صحيحة',
            DEVICE_LIMIT_REACHED: 'تم الوصول إلى الحد الأقصى للأجهزة',
            CODE_INVALID: 'الكود غير صالح أو منتهي الصلاحية',
            UNAUTHORIZED: 'وصول غير مصرح به',
            SERVER_ERROR: 'خطأ في الخادم'
        }
    },
    
    SUBSCRIPTION_INFO: {
        en: {
            title: 'Subscription Required',
            message: 'You need an active subscription to access this service.',
            contact: 'For subscription inquiries, please contact:',
            email: 'info@paxdes.com',
            plans: {
                weekly: 'Weekly Plan - 7 days',
                monthly: 'Monthly Plan - 30 days',
                yearly: 'Yearly Plan - 365 days'
            },
            payment_methods: 'Payment Methods: Credit Card, Bank Transfer, PayPal'
        },
        ar: {
            title: 'يتطلب اشتراك',
            message: 'تحتاج إلى اشتراك نشط للوصول إلى هذه الخدمة.',
            contact: 'للاستفسار عن الاشتراك، يرجى الاتصال:',
            email: 'info@paxdes.com',
            plans: {
                weekly: 'خطة أسبوعية - 7 أيام',
                monthly: 'خطة شهرية - 30 يوم',
                yearly: 'خطة سنوية - 365 يوم'
            },
            payment_methods: 'طرق الدفع: بطاقة ائتمان، تحويل بنكي، باي بال'
        }
    }
};
