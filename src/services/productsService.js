import api from './api';
import { toast } from 'react-toastify';

const path = '/sadmin/getTableById';

const request = () =>
    api.post(path, {
        RequestId: `products-${Date.now()}`,
        AuthToken: '',          // interceptor will inject the Bearer token
        Payload: { tableName: 'mst_products', id: 0 }
    });

export const productsService = {
    list: async () => {
        try {
            const r = await request();
            const ok = r.data.Success || r.data.success;
            if (!ok) throw new Error(r.data.Message || 'Fetch failed');
            return (r.data.Data || []).map((d) => ({
                id: d.ProductId,
                name: d.Name,
                description: d.Description,
                price: d.PricePerUserMonthly,
                active: d.IsActive === 1
            }));
        } catch (e) {
            toast.error(
                e?.response?.data?.Message || e.message || 'Could not fetch products'
            );
            throw e;
        }
    }
    // (save / delete endpoints were not supplied; add them here when available)
};
