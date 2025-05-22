// src/services/menuService.js
import api from './api';

export const getMenus = () => {
    const payload = {
        RequestId: Date.now().toString(),
        AuthToken: JSON.parse(localStorage.getItem('user') || '{}').token || '',
        Payload: {
            tableName: 'mst_menus',
            id: 0
        }
    };
    return api
        .post('/sadmin/getTableById', payload)
        .then(res => res.data.Data || []);
};

export const getSubMenus = () => {
    const payload = {
        RequestId: Date.now().toString(),
        AuthToken: JSON.parse(localStorage.getItem('user') || '{}').token || '',
        Payload: {
            tableName: 'mst_submenus',
            id: 0
        }
    };
    return api
        .post('/sadmin/getTableById', payload)
        .then(res => res.data.Data || []);
};
