

export const isOverdue = (dateString?: string | null, isCompleted: boolean = false): boolean => {
    if (!dateString) return false;
    if (isCompleted) return false;

    const due = new Date(dateString);
    const now = new Date();

    now.setHours(23, 59, 59, 0);

    return due < now;
};

export const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
};

export const formatDateLocalDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
};

export const getDaysOnly = (date1: Date | string, date2: Date | string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Reset về đầu ngày (00:00:00)
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return diffTime / (1000 * 60 * 60 * 24);
};