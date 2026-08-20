/**
 * Notification Types - Irys Store Platform
 */

export type NotificationType =
    | 'PRODUCT_APPROVED'
    | 'PRODUCT_REJECTED'
    | 'PRODUCT_PURCHASED'
    | 'REVIEW_RECEIVED'
    | 'RATING_RECEIVED'
    | 'ORDER_CONFIRMED'
    | 'ORDER_SHIPPED'
    | 'ORDER_DELIVERED'
    | 'NEW_ORDER'
    | 'NEW_SELLER_PRODUCT'
    | 'NEW_SELLER_REGISTRATION'
    | 'STOCK_ALERT'
    | 'SYSTEM'
    | 'PROMOTION';

export interface Notification {
    id:number;
    type:NotificationType | string;
    typeDescription:string;
    title:string;
    message:string;
    referenceId:string;
    referenceType:string;
    actionUrl:string;
    isRead:boolean;
    readAt:string | null;
    createdAt:string;
}

export interface NotificationState {
    notifications:Notification[];
    unreadCount:number;
    loading:boolean;
    error:string | null;
}

export interface NotificationIconConfig {
    icon:string;
    bg:string;
    textColor?:string;
}

export const NOTIFICATION_ICONS:Record<string, NotificationIconConfig> = {
    PRODUCT_APPROVED:{ icon:'✅', bg:'bg-green-100 dark:bg-green-900/30', textColor:'text-green-600' },
    PRODUCT_REJECTED:{ icon:'❌', bg:'bg-red-100 dark:bg-red-900/30', textColor:'text-red-600' },
    PRODUCT_PURCHASED:{ icon:'💰', bg:'bg-yellow-100 dark:bg-yellow-900/30', textColor:'text-yellow-600' },
    REVIEW_RECEIVED:{ icon:'⭐', bg:'bg-purple-100 dark:bg-purple-900/30', textColor:'text-purple-600' },
    RATING_RECEIVED:{ icon:'🌟', bg:'bg-amber-100 dark:bg-amber-900/30', textColor:'text-amber-600' },
    ORDER_CONFIRMED:{ icon:'📦', bg:'bg-blue-100 dark:bg-blue-900/30', textColor:'text-blue-600' },
    ORDER_SHIPPED:{ icon:'🚚', bg:'bg-cyan-100 dark:bg-cyan-900/30', textColor:'text-cyan-600' },
    ORDER_DELIVERED:{ icon:'✔️', bg:'bg-emerald-100 dark:bg-emerald-900/30', textColor:'text-emerald-600' },
    NEW_ORDER:{ icon:'🛒', bg:'bg-indigo-100 dark:bg-indigo-900/30', textColor:'text-indigo-600' },
    NEW_SELLER_PRODUCT:{ icon:'🆕', bg:'bg-indigo-100 dark:bg-indigo-900/30', textColor:'text-indigo-600' },
    NEW_SELLER_REGISTRATION:{ icon:'👤', bg:'bg-violet-100 dark:bg-violet-900/30', textColor:'text-violet-600' },
    STOCK_ALERT:{ icon:'📊', bg:'bg-orange-100 dark:bg-orange-900/30', textColor:'text-orange-600' },
    SYSTEM:{ icon:'🔔', bg:'bg-gray-100 dark:bg-gray-700', textColor:'text-gray-600' },
    PROMOTION:{ icon:'🎉', bg:'bg-pink-100 dark:bg-pink-900/30', textColor:'text-pink-600' },
};

export const getNotificationIcon = (type:string):NotificationIconConfig => {
    return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.SYSTEM;
};
