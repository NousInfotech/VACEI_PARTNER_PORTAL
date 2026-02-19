export const getUserIdFromLocalStorage = (): string | null => {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        const user = JSON.parse(userStr);
        return user.id || null;
    } catch (e) {
        console.error('Error parsing user from localStorage', e);
        return null;
    }
};

export const getDecodedUserId = (): string | null => {
    // In this project, IDs seem to be UUIDs directly, not base64 encoded as per some legacy docs.
    // However, if we need to support base64 decoding as per the integration doc:
    const id = getUserIdFromLocalStorage();
    if (!id) return null;

    // Check if it's a UUID (simple check)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return id;
    }

    try {
        return atob(id);
    } catch (e) {
        // If decoding fails, return original ID assuming it's already decoded or a different format
        return id;
    }
};

export const getToken = (): string | null => {
    return localStorage.getItem('token');
};

export const getActiveCompanyId = (): string | null => {
    return localStorage.getItem('vacei-active-company');
};
