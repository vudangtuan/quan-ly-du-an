
export const QUERY_STALE_TIME = {
    SHORT: 60 * 1000,      // 1 phút - Dữ liệu thay đổi nhanh
    MEDIUM: 5 * 60 * 1000,     // 5 phút - Dữ liệu thay đổi trung bình
    LONG: 15 * 60 * 1000,      // 15 phút - Dữ liệu ít thay đổi
    VERY_LONG: 60 * 60 * 1000, // 1 giờ - Dữ liệu tĩnh
} as const;

export const QUERY_GC_TIME = {
    SHORT: 5 * 60 * 1000,      // 5 phút
    MEDIUM: 10 * 60 * 1000,    // 10 phút
    LONG: 30 * 60 * 1000,      // 30 phút
    VERY_LONG: 60 * 60 * 1000, // 1 giờ
} as const;

